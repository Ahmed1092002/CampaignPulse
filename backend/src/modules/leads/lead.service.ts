import prisma from '../../config/prisma';
import QRCode from 'qrcode';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { CreateLeadInput, UpdateLeadInput, LeadStatus } from '../../types';
import { UserRole } from '@prisma/client';
import { calculateConversionRate } from '../../utils/helpers';
import { emailService } from '../email/email.service';
import env from '../../config/env';

export async function createLead(workspaceId: string, input: CreateLeadInput, metadata?: { ipAddress?: string; userAgent?: string; referrer?: string }) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: input.campaignId, workspaceId },
    include: { workspace: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (campaign.status !== 'PUBLISHED') {
    throw new AuthorizationError('Campaign is not published');
  }

  // Check for duplicate lead by email or phone
  const existingLead = await prisma.lead.findFirst({
    where: {
      workspaceId,
      OR: [
        { email: input.email },
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
  });

  if (existingLead) {
    // Update existing lead with new data
    const updated = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        customFields: input.customFields,
        utmSource: input.utmSource || existingLead.utmSource,
        utmMedium: input.utmMedium || existingLead.utmMedium,
        utmCampaign: input.utmCampaign || existingLead.utmCampaign,
        utmTerm: input.utmTerm || existingLead.utmTerm,
        utmContent: input.utmContent || existingLead.utmContent,
        referrer: input.referrer || existingLead.referrer,
        ipAddress: input.ipAddress || existingLead.ipAddress,
        userAgent: input.userAgent || existingLead.userAgent,
      },
    });

    return { lead: updated, isDuplicate: true };
  }

  // Find matching source
  let sourceId: string | undefined;
  if (input.utmSource && input.utmMedium && input.utmCampaign) {
    const source = await prisma.campaignSource.findFirst({
      where: {
        campaignId: input.campaignId,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
      },
    });
    if (source) sourceId = source.id;
  }

  const lead = await prisma.lead.create({
    data: {
      campaignId: input.campaignId,
      workspaceId,
      sourceId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      customFields: input.customFields,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm,
      utmContent: input.utmContent,
      referrer: input.referrer,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      status: LeadStatus.NEW,
    },
  });

  await createAuditLog({
    workspaceId,
    userId: 'system',
    entityType: 'Lead',
    entityId: lead.id,
    action: AuditActions.LEAD_CREATED,
    newData: { email: lead.email, firstName: lead.firstName, lastName: lead.lastName, status: lead.status },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  // Send new lead notification email to workspace admins/marketers
  const adminsAndMarketers = await prisma.workspaceMember.findMany({
    where: { workspaceId, role: { in: ['ADMIN', 'MARKETER'] } },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  const leadUrl = `${env.FRONTEND_URL}/leads/${lead.id}`;
  const source = input.utmSource && input.utmMedium ? `${input.utmSource}/${input.utmMedium}` : 'Direct';

  for (const member of adminsAndMarketers) {
    await emailService.send({
      to: member.user.email,
      template: 'new_lead',
      templateData: {
        leadName: `${lead.firstName} ${lead.lastName}`,
        leadEmail: lead.email,
        leadPhone: lead.phone || undefined,
        campaignName: campaign.name,
        source,
        timestamp: lead.createdAt.toISOString(),
        leadUrl,
      },
    }).catch(err => console.error('Failed to send new lead email:', err));
  }

  return { lead, isDuplicate: false };
}
}

export async function getLeads(workspaceId: string, userId: string, params: {
  page?: number;
  limit?: number;
  campaignId?: string;
  status?: LeadStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { page = 1, limit = 20, campaignId, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const where: Record<string, unknown> = { workspaceId };
  if (campaignId) where.campaignId = campaignId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        campaign: { select: { id: true, name: true, slug: true } },
        source: { select: { id: true, name: true, channel: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    data: leads,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLeadById(workspaceId: string, userId: string, leadId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
    include: {
      campaign: { select: { id: true, name: true, slug: true } },
      source: { select: { id: true, name: true, channel: true, utmSource: true, utmMedium: true, utmCampaign: true } },
      trackingEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  if (!lead) {
    throw new NotFoundError('Lead');
  }

  return lead;
}

export async function updateLead(workspaceId: string, userId: string, leadId: string, input: UpdateLeadInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !['ADMIN', 'MARKETER'].includes(membership.role)) {
    throw new AuthorizationError('Only admins and marketers can update leads');
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!lead) {
    throw new NotFoundError('Lead');
  }

  const oldStatus = lead.status;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...input,
      convertedAt: input.status === LeadStatus.WON && oldStatus !== LeadStatus.WON ? new Date() : lead.convertedAt,
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });

  if (input.status && input.status !== oldStatus) {
    await createAuditLog({
      workspaceId,
      userId,
      entityType: 'Lead',
      entityId: leadId,
      action: AuditActions.LEAD_STATUS_CHANGED,
      oldData: { status: oldStatus },
      newData: { status: input.status },
    });

    // Send lead status change notification
    const adminsAndMarketers = await prisma.workspaceMember.findMany({
      where: { workspaceId, role: { in: ['ADMIN', 'MARKETER'] } },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    const campaign = await prisma.campaign.findUnique({
      where: { id: lead.campaignId },
      select: { name: true },
    });

    const leadUrl = `${env.FRONTEND_URL}/leads/${leadId}`;

    for (const member of adminsAndMarketers) {
      await emailService.send({
        to: member.user.email,
        template: 'lead_status_changed',
        templateData: {
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadEmail: lead.email,
          campaignName: campaign?.name || 'Campaign',
          oldStatus,
          newStatus: input.status,
          leadUrl,
        },
      }).catch(err => console.error('Failed to send lead status change email:', err));
    }
  }

  return updated;
}

export async function deleteLead(workspaceId: string, userId: string, leadId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can delete leads');
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!lead) {
    throw new NotFoundError('Lead');
  }

  await prisma.lead.delete({ where: { id: leadId } });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Lead',
    entityId: leadId,
    action: AuditActions.LEAD_DELETED,
    oldData: { email: lead.email, status: lead.status },
  });

  return { success: true };
}

export async function getLeadStats(workspaceId: string, userId: string, campaignId?: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const where: Record<string, unknown> = { workspaceId };
  if (campaignId) where.campaignId = campaignId;

  const [totalLeads, statusCounts, recentLeads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ['status'], where, _count: true }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true, campaign: { select: { name: true } } },
    }),
  ]);

  return {
    totalLeads,
    byStatus: statusCounts.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {}),
    recentLeads,
  };
}

export async function createCampaignSources(campaignId: string, userId: string, workspaceId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  const channels = [
    { channel: 'facebook', name: 'Facebook', utmSource: 'facebook', utmMedium: 'social', utmCampaign: campaign.slug },
    { channel: 'instagram', name: 'Instagram', utmSource: 'instagram', utmMedium: 'social', utmCampaign: campaign.slug },
    { channel: 'google', name: 'Google', utmSource: 'google', utmMedium: 'cpc', utmCampaign: campaign.slug },
    { channel: 'direct', name: 'Direct', utmSource: 'direct', utmMedium: 'direct', utmCampaign: campaign.slug },
  ];

  const sources = await Promise.all(
    channels.map(async (ch) => {
      const existing = await prisma.campaignSource.findFirst({
        where: { campaignId, channel: ch.channel },
      });

      if (existing) return existing;

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const publicUrl = `${baseUrl}/p/${campaign.slug}?utm_source=${ch.utmSource}&utm_medium=${ch.utmMedium}&utm_campaign=${ch.utmCampaign}`;

      const qrCodeUrl = await QRCode.toDataURL(publicUrl);

      return prisma.campaignSource.create({
        data: {
          campaignId,
          name: ch.name,
          channel: ch.channel,
          utmSource: ch.utmSource,
          utmMedium: ch.utmMedium,
          utmCampaign: ch.utmCampaign,
          qrCodeUrl,
          shortUrl: publicUrl,
        },
      });
    })
  );

  return sources;
}

export async function getCampaignSources(workspaceId: string, userId: string, campaignId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  return prisma.campaignSource.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function incrementSourceClick(sourceId: string) {
  await prisma.campaignSource.update({
    where: { id: sourceId },
    data: { clicks: { increment: 1 } },
  });
}