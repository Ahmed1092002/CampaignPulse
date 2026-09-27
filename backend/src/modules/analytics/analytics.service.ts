import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { AnalyticsQueryParams, DashboardStats } from '../../types';
import { calculateConversionRate, getDateRange } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

interface DeviceBreakdown {
  device: string;
  count: number;
}

interface GeoBreakdown {
  country: string;
  flag?: string;
  visits: number;
  leads: number;
  cities?: Array<{ city: string; visits: number; leads: number }>;
}

export async function getDashboardStats(workspaceId: string, userId: string, params: AnalyticsQueryParams): Promise<DashboardStats & { compareData?: DashboardStats }> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const { campaignId, startDate, endDate, groupBy = 'day', channel, compareStartDate, compareEndDate } = params;
  const { start, end } = getDateRange(groupBy, startDate, endDate);

  const campaignWhere: Record<string, unknown> = { workspaceId };
  if (campaignId) campaignWhere.id = campaignId;

  const eventWhere: Record<string, unknown> = { workspaceId, createdAt: { gte: start, lte: end } };
  if (campaignId) eventWhere.campaignId = campaignId;

  const leadWhere: Record<string, unknown> = { workspaceId, createdAt: { gte: start, lte: end } };
  if (campaignId) leadWhere.campaignId = campaignId;

  // Build compare where clauses if compare dates provided
  const compareEventWhere = compareStartDate && compareEndDate ? {
    workspaceId,
    createdAt: { gte: new Date(compareStartDate), lte: new Date(compareEndDate) },
    ...(campaignId ? { campaignId } : {}),
  } : null;

  const compareLeadWhere = compareStartDate && compareEndDate ? {
    workspaceId,
    createdAt: { gte: new Date(compareStartDate), lte: new Date(compareEndDate) },
    ...(campaignId ? { campaignId } : {}),
  } : null;

  // Total visits (page views)
  const totalVisits = await prisma.trackingEvent.count({
    where: { ...eventWhere, type: 'PAGE_VIEW' },
  });

  // Total leads
  const totalLeads = await prisma.lead.count({ where: leadWhere });

  // Conversion rate
  const conversionRate = calculateConversionRate(totalVisits, totalLeads);

  // Leads by campaign
  const leadsByCampaignRaw = await prisma.lead.groupBy({
    by: ['campaignId'],
    where: leadWhere,
    _count: true,
    orderBy: { _count: { campaignId: 'desc' } },
    take: 10,
  });

  const campaignIds = leadsByCampaignRaw.map(l => l.campaignId);
  const campaigns = await prisma.campaign.findMany({
    where: { id: { in: campaignIds } },
    select: { id: true, name: true },
  });

  const leadsByCampaign = leadsByCampaignRaw.map(l => {
    const campaign = campaigns.find(c => c.id === l.campaignId);
    return { campaignId: l.campaignId, campaignName: campaign?.name || 'Unknown', count: l._count };
  });

  // Leads by source (UTM channel)
  const leadsBySourceRaw = await prisma.lead.groupBy({
    by: ['utmSource', 'utmMedium'],
    where: { ...leadWhere, utmSource: { not: null } },
    _count: true,
    orderBy: { _count: { utmSource: 'desc' } },
  });

  const leadsBySource = leadsBySourceRaw.map(l => ({
    source: `${l.utmSource}/${l.utmMedium}`,
    count: l._count,
  }));

  // Daily trends
  const dailyEvents = await prisma.trackingEvent.findMany({
    where: { ...eventWhere, type: 'PAGE_VIEW' },
    select: { createdAt: true },
  });

  const dailyLeads = await prisma.lead.findMany({
    where: leadWhere,
    select: { createdAt: true },
  });

  const dailyTrends = aggregateByDate(dailyEvents, dailyLeads, groupBy, start, end);

  // Weekly trends (reuse daily but grouped by week)
  const weeklyTrends = aggregateByWeek(dailyEvents, dailyLeads, start, end);

  // Funnel
  const funnelCounts = await prisma.trackingEvent.groupBy({
    by: ['type'],
    where: eventWhere,
    _count: true,
  });

  const funnelMap = funnelCounts.reduce((acc, curr) => ({ ...acc, [curr.type]: curr._count }), {});
  const funnel = {
    pageViews: funnelMap.PAGE_VIEW || 0,
    ctaClicks: funnelMap.CTA_CLICK || 0,
    formStarts: funnelMap.FORM_START || 0,
    formSubmits: funnelMap.FORM_SUBMIT || 0,
  };

  // Best performing campaign
  const bestCampaignRaw = await prisma.lead.groupBy({
    by: ['campaignId'],
    where: leadWhere,
    _count: true,
    orderBy: { _count: { campaignId: 'desc' } },
    take: 1,
  });

  let bestCampaign = null;
  if (bestCampaignRaw.length > 0) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: bestCampaignRaw[0].campaignId },
      select: { id: true, name: true },
    });
    if (campaign) {
      const campaignVisits = await prisma.trackingEvent.count({
        where: { ...eventWhere, campaignId: campaign.id, type: 'PAGE_VIEW' },
      });
      bestCampaign = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        leads: bestCampaignRaw[0]._count,
        conversionRate: calculateConversionRate(campaignVisits, bestCampaignRaw[0]._count),
      };
    }
  }

  // Recent activity
  const recentLeads = await prisma.lead.findMany({
    where: leadWhere,
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true, campaign: { select: { name: true } } },
  });

  const recentEvents = await prisma.trackingEvent.findMany({
    where: eventWhere,
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, type: true, campaignId: true, createdAt: true, campaign: { select: { name: true } } },
  });

  const recentActivity = [
    ...recentLeads.map(l => ({
      id: l.id,
      type: 'lead_created',
      message: `New lead: ${l.firstName} ${l.lastName} (${l.campaign.name})`,
      createdAt: l.createdAt,
    })),
    ...recentEvents.map(e => ({
      id: e.id,
      type: e.type.toLowerCase(),
      message: `${e.type.replace('_', ' ')} on ${e.campaign?.name || 'campaign'}`,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);

  // Compare data
  let compareData = null;
  if (compareEventWhere && compareLeadWhere) {
    compareData = await getCompareData(workspaceId, compareEventWhere, compareLeadWhere, groupBy, compareStartDate!, compareEndDate!);
  }

  return {
    totalVisits,
    totalLeads,
    conversionRate,
    leadsByCampaign,
    leadsBySource,
    dailyTrends,
    weeklyTrends,
    funnel,
    bestCampaign,
    recentActivity,
    compareData: compareData || undefined,
  };
}

async function getCompareData(workspaceId: string, compareEventWhere: any, compareLeadWhere: any, groupBy: string, compareStartDate: Date, compareEndDate: Date) {
  const compareEventWherePageView = { ...compareEventWhere, type: 'PAGE_VIEW' };
  const compareLeadWhereWithCampaign = compareLeadWhere;

  const [totalVisits, totalLeads, leadsByCampaignRaw, leadsBySourceRaw, dailyEvents, dailyLeads, funnelCounts, bestCampaignRaw, recentLeads, recentEvents] = await Promise.all([
    prisma.trackingEvent.count({ where: compareEventWherePageView }),
    prisma.lead.count({ where: compareLeadWhereWithCampaign }),
    prisma.lead.groupBy({
      by: ['campaignId'],
      where: compareLeadWhereWithCampaign,
      _count: true,
      orderBy: { _count: { campaignId: 'desc' } },
      take: 10,
    }),
    prisma.lead.groupBy({
      by: ['utmSource', 'utmMedium'],
      where: { ...compareLeadWhereWithCampaign, utmSource: { not: null } },
      _count: true,
      orderBy: { _count: { utmSource: 'desc' } },
    }),
    prisma.trackingEvent.findMany({ where: { ...compareEventWhere, type: 'PAGE_VIEW' }, select: { createdAt: true } }),
    prisma.lead.findMany({ where: compareLeadWhereWithCampaign, select: { createdAt: true } }),
    prisma.trackingEvent.groupBy({ by: ['type'], where: compareEventWhere, _count: true }),
    prisma.lead.groupBy({ by: ['campaignId'], where: compareLeadWhereWithCampaign, _count: true, orderBy: { _count: { campaignId: 'desc' } }, take: 1 }),
    prisma.lead.findMany({ where: compareLeadWhereWithCampaign, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true, campaign: { select: { name: true } } } }),
    prisma.trackingEvent.findMany({ where: compareEventWhere, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, type: true, campaignId: true, createdAt: true, campaign: { select: { name: true } } } }),
  ]);

  const campaignIds = leadsByCampaignRaw.map(l => l.campaignId);
  const campaigns = await prisma.campaign.findMany({ where: { id: { in: campaignIds } }, select: { id: true, name: true } });

  const leadsByCampaign = leadsByCampaignRaw.map(l => {
    const campaign = campaigns.find(c => c.id === l.campaignId);
    return { campaignId: l.campaignId, campaignName: campaign?.name || 'Unknown', count: l._count };
  });

  const leadsBySource = leadsBySourceRaw.map(l => ({ source: `${l.utmSource}/${l.utmMedium}`, count: l._count }));

  const dailyTrends = aggregateByDate(dailyEvents, dailyLeads, groupBy, compareStartDate, compareEndDate);

  const funnelMap = funnelCounts.reduce((acc, curr) => ({ ...acc, [curr.type]: curr._count }), {});
  const funnel = { pageViews: funnelMap.PAGE_VIEW || 0, ctaClicks: funnelMap.CTA_CLICK || 0, formStarts: funnelMap.FORM_START || 0, formSubmits: funnelMap.FORM_SUBMIT || 0 };

  let bestCampaign = null;
  if (bestCampaignRaw.length > 0) {
    const campaign = await prisma.campaign.findUnique({ where: { id: bestCampaignRaw[0].campaignId }, select: { id: true, name: true } });
    if (campaign) {
      const campaignVisits = await prisma.trackingEvent.count({ where: { ...compareEventWherePageView, campaignId: campaign.id } });
      bestCampaign = { campaignId: campaign.id, campaignName: campaign.name, leads: bestCampaignRaw[0]._count, conversionRate: calculateConversionRate(campaignVisits, bestCampaignRaw[0]._count) };
    }
  }

  const recentActivity = [
    ...recentLeads.map(l => ({ id: l.id, type: 'lead_created', message: `New lead: ${l.firstName} ${l.lastName} (${l.campaign.name})`, createdAt: l.createdAt })),
    ...recentEvents.map(e => ({ id: e.id, type: e.type.toLowerCase(), message: `${e.type.replace('_', ' ')} on ${e.campaign?.name || 'campaign'}`, createdAt: e.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);

  return {
    totalVisits,
    totalLeads,
    conversionRate: calculateConversionRate(totalVisits, totalLeads),
    leadsByCampaign,
    leadsBySource,
    dailyTrends,
    funnel,
    bestCampaign,
    recentActivity,
  };
}

export async function getDeviceBreakdown(workspaceId: string, userId: string, params: { startDate: string; endDate: string }): Promise<{ data: Array<{ device: string; count: number }> }> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) throw new AuthorizationError('Not a member of this workspace');

  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  // Parse user agent to determine device type
  const events = await prisma.trackingEvent.findMany({
    where: { workspaceId, createdAt: { gte: start, lte: end }, type: 'PAGE_VIEW' },
    select: { userAgent: true },
  });

  const deviceCounts = events.reduce((acc: Record<string, number>, event) => {
    const ua = event.userAgent?.toLowerCase() || '';
    let device = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'mobile';
    else if (ua.includes('tablet') || ua.includes('ipad')) device = 'tablet';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(deviceCounts).map(([device, count]) => ({ device, count }));
  return { data };
}

export async function getGeoBreakdown(workspaceId: string, userId: string, params: { startDate: string; endDate: string }): Promise<{ data: Array<{ country: string; flag?: string; visits: number; leads: number; cities?: Array<{ city: string; visits: number; leads: number }> }> }> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) throw new AuthorizationError('Not a member of this workspace');

  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  // Get events with IP for geo lookup (simplified - using IP prefix for demo)
  const events = await prisma.trackingEvent.findMany({
    where: { workspaceId, createdAt: { gte: start, lte: end }, type: 'PAGE_VIEW' },
    select: { ipAddress: true, createdAt: true },
  });

  const leads = await prisma.lead.findMany({
    where: { workspaceId, createdAt: { gte: start, lte: end } },
    select: { ipAddress: true, createdAt: true },
  });

  // Simplified geo based on IP prefix (in production use MaxMind or similar)
  const geoMap = new Map<string, { country: string; flag: string; visits: number; leads: number; cities: Map<string, { visits: number; leads: number }> }>();

  const countryFlags: Record<string, string> = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'CA': '🇨🇦', 'AU': '🇦🇺',
    'IN': '🇮🇳', 'BR': '🇧🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'ES': '🇪🇸', 'IT': '🇮🇹',
    'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭',
    'AT': '🇦🇹', 'BE': '🇧🇪', 'IE': '🇮🇪', 'PL': '🇵🇱', 'PT': '🇵🇹', 'CZ': '🇨🇿',
  };

  // Simulate geo based on IP prefix (first octet)
  const getGeoFromIP = (ip?: string) => {
    if (!ip) return { country: 'Unknown', flag: '🌍' };
    const firstOctet = parseInt(ip.split('.')[0]);
    const countries = Object.keys(countryFlags);
    const countryCode = countries[firstOctet % countries.length];
    return { country: countryCode, flag: countryFlags[countryCode] };
  };

  events.forEach(e => {
    const geo = getGeoFromIP(e.ipAddress);
    const key = geo.country;
    if (!geoMap.has(key)) geoMap.set(key, { country: key, flag: geo.flag, visits: 0, leads: 0, cities: new Map() });
    const entry = geoMap.get(key)!;
    entry.visits++;
  });

  leads.forEach(l => {
    const geo = getGeoFromIP(l.ipAddress);
    const key = geo.country;
    if (!geoMap.has(key)) geoMap.set(key, { country: key, flag: geo.flag, visits: 0, leads: 0, cities: new Map() });
    const entry = geoMap.get(key)!;
    entry.leads++;
  });

  const data = Array.from(geoMap.entries())
    .map(([country, data]) => ({
      country,
      flag: data.flag,
      visits: data.visits,
      leads: data.leads,
      cities: Array.from(data.cities.entries()).map(([city, cdata]) => ({ city, visits: cdata.visits, leads: cdata.leads })),
    }))
    .sort((a, b) => b.visits - a.visits);

  return { data };
}