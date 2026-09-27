import prisma from '../../config/prisma';
import { AuditLog } from '@prisma/client';

export interface AuditLogInput {
  workspaceId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldData: input.oldData,
      newData: input.newData,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export async function getAuditLogs(
  workspaceId: string,
  params: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const { page = 1, limit = 20, entityType, entityId, userId, action, startDate, endDate } = params;

  const where: Record<string, unknown> = { workspaceId };

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export const AuditActions = {
  WORKSPACE_CREATED: 'WORKSPACE_CREATED',
  WORKSPACE_UPDATED: 'WORKSPACE_UPDATED',
  WORKSPACE_DELETED: 'WORKSPACE_DELETED',
  MEMBER_INVITED: 'MEMBER_INVITED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  CAMPAIGN_CREATED: 'CAMPAIGN_CREATED',
  CAMPAIGN_UPDATED: 'CAMPAIGN_UPDATED',
  CAMPAIGN_PUBLISHED: 'CAMPAIGN_PUBLISHED',
  CAMPAIGN_PAUSED: 'CAMPAIGN_PAUSED',
  CAMPAIGN_ARCHIVED: 'CAMPAIGN_ARCHIVED',
  CAMPAIGN_DELETED: 'CAMPAIGN_DELETED',
  LANDING_PAGE_CREATED: 'LANDING_PAGE_CREATED',
  LANDING_PAGE_UPDATED: 'LANDING_PAGE_UPDATED',
  LANDING_PAGE_PUBLISHED: 'LANDING_PAGE_PUBLISHED',
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_UPDATED: 'LEAD_UPDATED',
  LEAD_STATUS_CHANGED: 'LEAD_STATUS_CHANGED',
  LEAD_DELETED: 'LEAD_DELETED',
  SOURCE_CREATED: 'SOURCE_CREATED',
  SOURCE_UPDATED: 'SOURCE_UPDATED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;