import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { TrackingEventInput, TrackingEventType } from '../../types';

export async function createTrackingEvent(workspaceId: string, input: TrackingEventInput) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: input.campaignId, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (input.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, workspaceId },
    });
    if (!lead) {
      throw new NotFoundError('Lead');
    }
  }

  const event = await prisma.trackingEvent.create({
    data: {
      campaignId: input.campaignId,
      workspaceId,
      leadId: input.leadId,
      type: input.type,
      sessionId: input.sessionId,
      pageUrl: input.pageUrl,
      elementId: input.elementId,
      elementType: input.elementType,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });

  return event;
}

export async function createTrackingEventsBatch(workspaceId: string, events: TrackingEventInput[]) {
  if (events.length === 0) return { count: 0 };

  const campaignIds = [...new Set(events.map(e => e.campaignId))];
  const campaigns = await prisma.campaign.findMany({
    where: { id: { in: campaignIds }, workspaceId },
    select: { id: true },
  });

  const validCampaignIds = new Set(campaigns.map(c => c.id));
  const validEvents = events.filter(e => validCampaignIds.has(e.campaignId));

  if (validEvents.length === 0) return { count: 0 };

  await prisma.trackingEvent.createMany({
    data: validEvents.map(e => ({
      campaignId: e.campaignId,
      workspaceId,
      leadId: e.leadId,
      type: e.type,
      sessionId: e.sessionId,
      pageUrl: e.pageUrl,
      elementId: e.elementId,
      elementType: e.elementType,
      metadata: e.metadata,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
    })),
  });

  return { count: validEvents.length };
}

export async function getTrackingEvents(workspaceId: string, userId: string, params: {
  campaignId?: string;
  leadId?: string;
  type?: TrackingEventType;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { campaignId, leadId, type, sessionId, startDate, endDate, page = 1, limit = 50 } = params;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const where: Record<string, unknown> = { workspaceId };
  if (campaignId) where.campaignId = campaignId;
  if (leadId) where.leadId = leadId;
  if (type) where.type = type;
  if (sessionId) where.sessionId = sessionId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [events, total] = await Promise.all([
    prisma.trackingEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trackingEvent.count({ where }),
  ]);

  return {
    data: events,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEventCounts(workspaceId: string, campaignId?: string, startDate?: Date, endDate?: Date) {
  const where: Record<string, unknown> = { workspaceId };
  if (campaignId) where.campaignId = campaignId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const counts = await prisma.trackingEvent.groupBy({
    by: ['type'],
    where,
    _count: true,
  });

  return counts.reduce((acc, curr) => ({ ...acc, [curr.type]: curr._count }), {});
}