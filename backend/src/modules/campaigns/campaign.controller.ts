import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { createCampaignSchema, updateCampaignSchema, paginationSchema } from '../../utils/validators';
import * as campaignService from './campaign.service';
import { successResponse } from '../../utils/helpers';

export async function createCampaign(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const campaign = await campaignService.createCampaign(req.workspaceId, req.user.userId, req.body);
  res.status(201).json(successResponse(campaign));
}

export async function getCampaigns(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { page, limit, status, search, sortBy, sortOrder } = req.query;
  const result = await campaignService.getCampaigns(req.workspaceId, req.user.userId, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
    status: status as any,
    search: search as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });
  res.json(successResponse(result.data, result.meta));
}

export async function getCampaign(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const campaign = await campaignService.getCampaignById(req.workspaceId, req.user.userId, id);
  res.json(successResponse(campaign));
}

export async function updateCampaign(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const campaign = await campaignService.updateCampaign(req.workspaceId, req.user.userId, id, req.body);
  res.json(successResponse(campaign));
}

export async function deleteCampaign(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { id } = req.params;
  const result = await campaignService.deleteCampaign(req.workspaceId, req.user.userId, id);
  res.json(successResponse(result));
}

export async function getPublicCampaign(req: AuthenticatedRequest, res: Response) {
  const { slug } = req.params;
  const campaign = await campaignService.getCampaignBySlug(slug);
  res.json(successResponse(campaign));
}

export async function generateSlug(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { name } = req.body;
  const slug = await campaignService.generateUniqueSlug(req.workspaceId, name);
  res.json(successResponse({ slug }));
}

export const campaignValidators = {
  create: createCampaignSchema,
  update: updateCampaignSchema,
  list: paginationSchema,
  slug: {
    body: { name: { type: 'string', minLength: 1 } },
  },
};