import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { AnalyticsQueryParams, DashboardStats } from '../../types';
import { calculateConversionRate, getDateRange } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export async function getDashboardStats(workspaceId: string, userId: string, params: AnalyticsQueryParams): Promise<DashboardStats> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const { campaignId, startDate, endDate, groupBy = 'day', channel } = params;
  const { start, end } = getDateRange(groupBy, startDate, endDate);

  const campaignWhere: Record<string, unknown> = { workspaceId };
  if (campaignId) campaignWhere.id = campaignId;

  const eventWhere: Record<string, unknown> = { workspaceId, createdAt: { gte: start, lte: end } };
  if (campaignId) eventWhere.campaignId = campaignId;

  const leadWhere: Record<string, unknown> = { workspaceId, createdAt: { gte: start, lte: end } };
  if (campaignId) leadWhere.campaignId = campaignId;

  const totalVisits = await prisma.trackingEvent.count({
    where: { ...eventWhere, type: 'PAGE_VIEW' },
  });

  const totalLeads = await prisma.lead.count({ where: leadWhere });

  const conversionRate = calculateConversionRate(totalVisits, totalLeads);

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

  const dailyEvents = await prisma.trackingEvent.findMany({
    where: { ...eventWhere, type: 'PAGE_VIEW' },
    select: { createdAt: true },
  });

  const dailyLeads = await prisma.lead.findMany({
    where: leadWhere,
    select: { createdAt: true },
  });

  const dailyTrends = aggregateByDate(dailyEvents, dailyLeads, groupBy, start, end);

  const weeklyTrends = aggregateByWeek(dailyEvents, dailyLeads, start, end);

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
  };
}

function aggregateByDate(events: { createdAt: Date }[], leads: { createdAt: Date }[], groupBy: 'day' | 'week' | 'month', start: Date, end: Date) {
  const map = new Map<string, { visits: number; leads: number }>();

  const current = new Date(start);
  while (current <= end) {
    const key = formatDateKey(current, groupBy);
    map.set(key, { visits: 0, leads: 0 });
    if (groupBy === 'day') current.setDate(current.getDate() + 1);
    else if (groupBy === 'week') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }

  events.forEach(e => {
    const key = formatDateKey(e.createdAt, groupBy);
    const existing = map.get(key);
    if (existing) existing.visits++;
  });

  leads.forEach(l => {
    const key = formatDateKey(l.createdAt, groupBy);
    const existing = map.get(key);
    if (existing) existing.leads++;
  });

  return Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
}

function aggregateByWeek(events: { createdAt: Date }[], leads: { createdAt: Date }[], start: Date, end: Date) {
  return aggregateByDate(events, leads, 'week', start, end);
}

function formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  if (groupBy === 'day') {
    return d.toISOString().split('T')[0];
  } else if (groupBy === 'week') {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

export async function getCampaignAnalytics(workspaceId: string, userId: string, campaignId: string, params: AnalyticsQueryParams) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  return getDashboardStats(workspaceId, userId, { ...params, campaignId });
}

export async function getRealtimeStats(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const [activeVisitors, recentLeads, recentEvents] = await Promise.all([
    prisma.trackingEvent.groupBy({
      by: ['sessionId'],
      where: { workspaceId, createdAt: { gte: fiveMinutesAgo }, type: 'PAGE_VIEW' },
      _count: true,
    }),
    prisma.lead.findMany({
      where: { workspaceId, createdAt: { gte: fiveMinutesAgo } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, campaign: { select: { name: true } }, createdAt: true },
    }),
    prisma.trackingEvent.findMany({
      where: { workspaceId, createdAt: { gte: fiveMinutesAgo } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { type: true, campaign: { select: { name: true } }, createdAt: true },
    }),
  ]);

  return {
    activeVisitors: activeVisitors.length,
    recentLeads,
    recentEvents,
  };
}