import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { createWorkspaceSchema, updateWorkspaceSchema, updateWorkspaceSettingsSchema } from '../../utils/validators';
import * as workspaceService from './workspace.service';
import { successResponse } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

export async function createWorkspace(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const workspace = await workspaceService.createWorkspace(req.user.userId, req.body);
  res.status(201).json(successResponse(workspace));
}

export async function getWorkspaces(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const workspaces = await workspaceService.getWorkspaces(req.user.userId);
  res.json(successResponse(workspaces));
}

export async function getWorkspace(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const workspace = await workspaceService.getWorkspaceById(id, req.user.userId);
  res.json(successResponse(workspace));
}

export async function updateWorkspace(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const workspace = await workspaceService.updateWorkspace(id, req.user.userId, req.body);
  res.json(successResponse(workspace));
}

export async function deleteWorkspace(req: AuthenticatedRequest, res: Response) {
  if (!req.user) throw new Error('User not authenticated');
  const { id } = req.params;
  const result = await workspaceService.deleteWorkspace(id, req.user.userId);
  res.json(successResponse(result));
}

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  if (!req.workspaceId) throw new Error('Workspace not set');
  const settings = await workspaceService.getWorkspaceSettings(req.workspaceId);
  res.json(successResponse(settings));
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const settings = await workspaceService.updateWorkspaceSettings(req.workspaceId, req.user.userId, req.body);
  res.json(successResponse(settings));
}

export const workspaceValidators = {
  create: createWorkspaceSchema,
  update: updateWorkspaceSchema,
  updateSettings: updateWorkspaceSettingsSchema,
};