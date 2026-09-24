import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { trackingEventSchema } from '../../utils/validators';
import * as trackingService from './tracking.service';
import { successResponse } from '../../utils/helpers';

export async function trackEvent(req: AuthenticatedRequest, res: Response) {
  const result = await trackingService.createTrackingEvent(req.workspaceId!, req.body);
  res.status(201).json(successResponse(result));
}

export async function trackEventsBatch(req: AuthenticatedRequest, res: Response) {
  const { events } = req.body;
  const result = await trackingService.createTrackingEventsBatch(req.workspaceId!, events);
  res.json(successResponse(result));
}

export async function getEvents(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId, leadId, type, sessionId, startDate, endDate, page, limit } = req.query;
  const result = await trackingService.getTrackingEvents(req.workspaceId, req.user.userId, {
    campaignId: campaignId as string,
    leadId: leadId as string,
    type: type as any,
    sessionId: sessionId as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
  });
  res.json(successResponse(result.data, result.meta));
}

export async function getEventCounts(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId, startDate, endDate } = req.query;
  const counts = await trackingService.getEventCounts(
    req.workspaceId,
    campaignId as string,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  res.json(successResponse(counts));
}

export const trackingValidators = {
  event: trackingEventSchema,
  batch: {
    body: {
      events: { type: 'array', items: trackingEventSchema.shape.body },
    },
  },
};