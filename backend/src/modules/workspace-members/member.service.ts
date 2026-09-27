import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { InviteMemberInput, UpdateMemberRoleInput } from '../../types';
import { UserRole } from '@prisma/client';
import { emailService } from '../email/email.service';
import env from '../../config/env';

export async function inviteMember(workspaceId: string, userId: string, input: InviteMemberInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can invite members');
  }

  const invitedUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (!invitedUser) {
    throw new NotFoundError('User');
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
  });

  if (existingMembership) {
    throw new ConflictError('User is already a member of this workspace');
  }

  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  const member = await prisma.workspaceMember.create({
    data: {
      userId: invitedUser.id,
      workspaceId,
      role: input.role,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'WorkspaceMember',
    entityId: member.id,
    action: AuditActions.MEMBER_INVITED,
    newData: { email: invitedUser.email, role: input.role },
  });

  // Send invitation email
  const inviteUrl = `${env.FRONTEND_URL}/invite/${member.id}`; // You may want to create a proper invite token system
  await emailService.send({
    to: invitedUser.email,
    template: 'member_invited',
    templateData: {
      workspaceName: workspace?.name || 'Workspace',
      inviterName: `${inviter?.firstName} ${inviter?.lastName}`,
      role: input.role,
      inviteUrl,
    },
  }).catch(err => console.error('Failed to send invitation email:', err));

  return member;
}

export async function getMembers(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new AuthorizationError('Not a member of this workspace');
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, lastLoginAt: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return members;
}

export async function updateMemberRole(workspaceId: string, userId: string, memberId: string, input: UpdateMemberRoleInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can update member roles');
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    throw new NotFoundError('Member');
  }

  if (targetMember.userId === userId) {
    throw new AuthorizationError('Cannot change your own role');
  }

  const oldRole = targetMember.role;

  const member = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: input.role },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'WorkspaceMember',
    entityId: memberId,
    action: AuditActions.MEMBER_ROLE_CHANGED,
    oldData: { role: oldRole },
    newData: { role: input.role },
  });

  return member;
}

export async function removeMember(workspaceId: string, userId: string, memberId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can remove members');
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    throw new NotFoundError('Member');
  }

  if (targetMember.userId === userId) {
    throw new AuthorizationError('Cannot remove yourself');
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'WorkspaceMember',
    entityId: memberId,
    action: AuditActions.MEMBER_REMOVED,
    oldData: { userId: targetMember.userId, role: targetMember.role },
  });

  return { success: true };
}

export async function leaveWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership) {
    throw new NotFoundError('Membership');
  }

  const adminCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: 'ADMIN' },
  });

  if (membership.role === 'ADMIN' && adminCount === 1) {
    throw new AuthorizationError('Cannot leave as the only admin. Transfer admin role first.');
  }

  await prisma.workspaceMember.delete({ where: { id: membership.id } });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'WorkspaceMember',
    entityId: membership.id,
    action: AuditActions.MEMBER_REMOVED,
    oldData: { userId, role: membership.role },
  });

  return { success: true };
}