import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { paginationSchema, auditLogQuerySchema } from '../../utils/validators';
import { createAuditLog, getAuditLogs, AuditActions } from './auditLog.service';
import { successResponse } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

export async function getAuditLogsHandler(req: AuthenticatedRequest, res: Response) {
  const { page, limit, entityType, entityId, userId, action, startDate, endDate } = req.query;
  const result = await getAuditLogs(req.workspaceId!, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    entityType: entityType as string,
    entityId: entityId as string,
    userId: userId as string,
    action: action as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });
  res.json(successResponse(result.data, result.meta));
}

export { AuditActions };

export const auditLogValidators = {
  list: auditLogQuerySchema,
};