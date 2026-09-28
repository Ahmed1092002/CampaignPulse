import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { createLeadSchema, updateLeadSchema, paginationSchema, createSourceParamsSchema } from '../../utils/validators';
import * as leadService from './lead.service';
import { successResponse } from '../../utils/helpers';

export async function createLead(req: AuthenticatedRequest, res: Response) {
  const result = await leadService.createLead(req.workspaceId!, req.body, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    referrer: req.get('referer') || undefined,
  });
  res.status(201).json(successResponse(result));
}

export async function getLeads(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { page, limit, campaignId, status, search, sortBy, sortOrder } = req.query;
  const result = await leadService.getLeads(req.workspaceId, req.user.userId, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    campaignId: campaignId as string,
    status: status as any,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });
  res.json(successResponse(result.data, result.meta));
}

export async function getLead(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const lead = await leadService.getLeadById(req.workspaceId, req.user.userId, id);
  res.json(successResponse(lead));
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const lead = await leadService.updateLead(req.workspaceId, req.user.userId, id, req.body);
  res.json(successResponse(lead));
}

export async function deleteLead(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const result = await leadService.deleteLead(req.workspaceId, req.user.userId, id);
  res.json(successResponse(result));
}

export async function getLeadStats(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.query;
  const stats = await leadService.getLeadStats(req.workspaceId, req.user.userId, campaignId as string);
  res.json(successResponse(stats));
}

export async function createSources(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.params;
  const sources = await leadService.createCampaignSources(campaignId, req.user.userId, req.workspaceId);
  res.status(201).json(successResponse(sources));
}

export async function getSources(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.params;
  const sources = await leadService.getCampaignSources(req.workspaceId, req.user.userId, campaignId);
  res.json(successResponse(sources));
}

export const leadValidators = {
  create: createLeadSchema,
  update: updateLeadSchema,
  list: paginationSchema,
  createSources: createSourceParamsSchema,
  getSources: createSourceParamsSchema,
};