import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { landingPageSchema } from '../../utils/validators';
import * as landingPageService from './landingPage.service';
import { successResponse } from '../../utils/helpers';

export async function getLandingPage(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.params;
  const landingPage = await landingPageService.getLandingPage(req.workspaceId, req.user.userId, campaignId);
  res.json(successResponse(landingPage));
}

export async function updateLandingPage(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.params;
  const landingPage = await landingPageService.updateLandingPage(req.workspaceId, req.user.userId, campaignId, req.body);
  res.json(successResponse(landingPage));
}

export async function getPublicLandingPage(req: AuthenticatedRequest, res: Response) {
  const { slug } = req.params;
  const result = await landingPageService.getPublicLandingPage(slug);
  res.json(successResponse(result));
}

export async function getPublishedCampaigns(req: AuthenticatedRequest, res: Response) {
  const campaigns = await landingPageService.getPublishedCampaigns();
  res.json(successResponse(campaigns));
}

export async function duplicateLandingPage(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { campaignId } = req.params;
  const { targetCampaignId } = req.body;
  const landingPage = await landingPageService.duplicateLandingPage(req.workspaceId, req.user.userId, campaignId, targetCampaignId);
  res.status(201).json(successResponse(landingPage));
}

export const landingPageValidators = {
  update: landingPageSchema,
};