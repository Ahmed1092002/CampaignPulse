import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { analyticsQuerySchema, campaignAnalyticsParamsSchema } from '../../utils/validators';
import * as analyticsService from './analytics.service';
import { successResponse } from '../../utils/helpers';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId, startDate, endDate, groupBy, channel } = req.query;
  const stats = await analyticsService.getDashboardStats(req.workspaceId, req.user.userId, {
    campaignId: campaignId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    groupBy: groupBy as any,
    channel: channel as string,
  });
  res.json(successResponse(stats));
}

export async function getCampaignAnalytics(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const { startDate, endDate, groupBy, channel } = req.query;
  const stats = await analyticsService.getCampaignAnalytics(req.workspaceId, req.user.userId, id, {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    groupBy: groupBy as any,
    channel: channel as string,
  });
  res.json(successResponse(stats));
}

export async function getRealtimeStats(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const stats = await analyticsService.getRealtimeStats(req.workspaceId, req.user.userId);
  res.json(successResponse(stats));
}

export const analyticsValidators = {
  query: analyticsQuerySchema,
  campaignParams: campaignAnalyticsParamsSchema,
};