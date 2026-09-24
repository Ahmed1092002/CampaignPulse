import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { createAuditLog, getAuditLogs, AuditActions } from './auditLog.service';

export async function getAuditLogsHandler(workspaceId: string, userId: string, params: {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can view audit logs');
  }

  return getAuditLogs(workspaceId, params);
}

export { AuditActions };