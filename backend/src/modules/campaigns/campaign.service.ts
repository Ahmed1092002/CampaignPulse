import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { CreateCampaignInput, UpdateCampaignInput } from '../../types';
import { CampaignStatus, UserRole } from '@prisma/client';
import { slugify } from '../../utils/helpers';
import { emailService } from '../email/email.service';
import env from '../../config/env';

export async function createCampaign(workspaceId: string, userId: string, input: CreateCampaignInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !['ADMIN', 'MARKETER'].includes(membership.role)) {
    throw new AuthorizationError('Only admins and marketers can create campaigns');
  }

  const existingSlug = await prisma.campaign.findUnique({
    where: { workspaceId_slug: { workspaceId, slug: input.slug } },
  });

  if (existingSlug) {
    throw new ConflictError('Campaign slug already exists in this workspace');
  }

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      goal: input.goal,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      channels: input.channels,
      status: input.status || CampaignStatus.DRAFT,
    },
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Campaign',
    entityId: campaign.id,
    action: AuditActions.CAMPAIGN_CREATED,
    newData: { name: campaign.name, slug: campaign.slug, status: campaign.status },
  });

  return campaign;
}

export async function getCampaigns(workspaceId: string, userId: string, params: {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const where: Record<string, unknown> = { workspaceId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        landingPage: { select: { isPublished: true, publishedAt: true } },
        _count: { select: { leads: true, sources: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    data: campaigns,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCampaignById(workspaceId: string, userId: string, campaignId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: {
      landingPage: true,
      sources: true,
      _count: { select: { leads: true, trackingEvents: true } },
    },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  return campaign;
}

export async function updateCampaign(workspaceId: string, userId: string, campaignId: string, input: UpdateCampaignInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || !['ADMIN', 'MARKETER'].includes(membership.role)) {
    throw new AuthorizationError('Only admins and marketers can update campaigns');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  const oldData = { ...campaign };

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...input,
      publishedAt: input.status === CampaignStatus.PUBLISHED && campaign.status !== CampaignStatus.PUBLISHED ? new Date() : campaign.publishedAt,
    },
  });

  const actionMap: Record<CampaignStatus, string> = {
    [CampaignStatus.DRAFT]: AuditActions.CAMPAIGN_UPDATED,
    [CampaignStatus.PUBLISHED]: AuditActions.CAMPAIGN_PUBLISHED,
    [CampaignStatus.PAUSED]: AuditActions.CAMPAIGN_PAUSED,
    [CampaignStatus.ARCHIVED]: AuditActions.CAMPAIGN_ARCHIVED,
  };

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Campaign',
    entityId: campaignId,
    action: input.status ? actionMap[input.status] : AuditActions.CAMPAIGN_UPDATED,
    oldData: { name: oldData.name, status: oldData.status, description: oldData.description },
    newData: { name: updated.name, status: updated.status, description: updated.description },
  });

  // Send campaign published email notification
  if (input.status === CampaignStatus.PUBLISHED && oldData.status !== CampaignStatus.PUBLISHED) {
    const adminsAndMarketers = await prisma.workspaceMember.findMany({
      where: { workspaceId, role: { in: ['ADMIN', 'MARKETER'] } },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    const publicUrl = `${env.FRONTEND_URL}/p/${updated.slug}`;

    for (const member of adminsAndMarketers) {
      await emailService.send({
        to: member.user.email,
        template: 'campaign_published',
        templateData: {
          campaignName: updated.name,
          publicUrl,
        },
      }).catch(err => console.error('Failed to send campaign published email:', err));
    }
  }

  return updated;
}

export async function deleteCampaign(workspaceId: string, userId: string, campaignId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can delete campaigns');
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  await prisma.campaign.delete({ where: { id: campaignId } });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Campaign',
    entityId: campaignId,
    action: AuditActions.CAMPAIGN_DELETED,
    oldData: { name: campaign.name, slug: campaign.slug },
  });

  return { success: true };
}

export async function getCampaignBySlug(slug: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { slug, status: CampaignStatus.PUBLISHED },
    include: {
      landingPage: true,
      workspace: { select: { id: true, name: true, logoUrl: true } },
    },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  return campaign;
}

export async function generateUniqueSlug(workspaceId: string, base: string): Promise<string> {
  let slug = slugify(base);
  let counter = 1;
  const originalSlug = slug;

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
    });
    if (!existing) return slug;
    counter++;
    slug = `${originalSlug}-${counter}`;
  }
}