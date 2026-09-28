import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { inviteMemberSchema, updateMemberRoleSchema, leaveWorkspaceSchema } from '../../utils/validators';
import * as memberService from './member.service';
import { successResponse } from '../../utils/helpers';

export async function inviteMember(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const member = await memberService.inviteMember(req.workspaceId, req.user.userId, req.body);
  res.status(201).json(successResponse(member));
}

export async function getMembers(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const members = await memberService.getMembers(req.workspaceId, req.user.userId);
  res.json(successResponse(members));
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { memberId } = req.params;
  const member = await memberService.updateMemberRole(req.workspaceId, req.user.userId, memberId, req.body);
  res.json(successResponse(member));
}

export async function removeMember(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const { memberId } = req.params;
  const result = await memberService.removeMember(req.workspaceId, req.user.userId, memberId);
  res.json(successResponse(result));
}

export async function leaveWorkspace(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.workspaceId) throw new Error('User or workspace not set');
  const result = await memberService.leaveWorkspace(req.workspaceId, req.user.userId);
  res.json(successResponse(result));
}

export const memberValidators = {
  invite: inviteMemberSchema,
  updateRole: updateMemberRoleSchema,
  leave: leaveWorkspaceSchema,
};