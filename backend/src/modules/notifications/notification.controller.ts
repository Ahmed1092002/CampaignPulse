import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { paginationSchema } from '../../utils/validators';
import * as notificationService from './notification.service';
import { successResponse } from '../../utils/helpers';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { page, limit, isRead, type } = req.query;
  const result = await notificationService.getNotifications(req.user.userId, req.workspaceId, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    isRead: isRead !== undefined ? isRead === 'true' : undefined,
    type: type as any,
  });
  res.json(successResponse(result.data, result.meta));
}

export async function getUnreadCount(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const result = await notificationService.getUnreadCount(req.user.userId, req.workspaceId);
  res.json(successResponse(result));
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const notification = await notificationService.markAsRead(req.user.userId, id);
  res.json(successResponse(notification));
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const result = await notificationService.markAllAsRead(req.user.userId, req.workspaceId);
  res.json(successResponse(result));
}

export async function deleteNotification(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const result = await notificationService.deleteNotification(req.user.userId, id);
  res.json(successResponse(result));
}

export const notificationValidators = {
  list: paginationSchema,
};