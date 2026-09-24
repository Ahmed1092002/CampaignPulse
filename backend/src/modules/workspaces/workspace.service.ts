import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { CreateWorkspaceInput, UpdateWorkspaceInput } from '../../types';
import { UserRole } from '@prisma/client';

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  const existingSlug = await prisma.workspace.findUnique({ where: { slug: input.slug } });
  if (existingSlug) {
    throw new ConflictError('Workspace slug already taken');
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      members: {
        create: {
          userId,
          role: UserRole.ADMIN,
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      },
    },
  });

  await createAuditLog({
    workspaceId: workspace.id,
    userId,
    entityType: 'Workspace',
    entityId: workspace.id,
    action: AuditActions.WORKSPACE_CREATED,
    newData: { name: workspace.name, slug: workspace.slug },
  });

  return workspace;
}

export async function getWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map(m => ({ ...m.workspace, role: m.role }));
}

export async function getWorkspaceById(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } } },
          },
          _count: { select: { campaigns: true, members: true } },
        },
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Workspace');
  }

  return { ...membership.workspace, role: membership.role };
}

export async function updateWorkspace(workspaceId: string, userId: string, input: UpdateWorkspaceInput) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can update workspace');
  }

  const oldData = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: input,
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Workspace',
    entityId: workspaceId,
    action: AuditActions.WORKSPACE_UPDATED,
    oldData: oldData ? { name: oldData.name, description: oldData.description, logoUrl: oldData.logoUrl } : undefined,
    newData: input,
  });

  return workspace;
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can delete workspace');
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Workspace',
    entityId: workspaceId,
    action: AuditActions.WORKSPACE_DELETED,
  });

  return { success: true };
}

export async function getWorkspaceSettings(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, slug: true, settings: true },
  });

  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  return workspace;
}

export async function updateWorkspaceSettings(workspaceId: string, userId: string, settings: Record<string, unknown>) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });

  if (!membership || membership.role !== 'ADMIN') {
    throw new AuthorizationError('Only admins can update settings');
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { settings },
  });

  await createAuditLog({
    workspaceId,
    userId,
    entityType: 'Workspace',
    entityId: workspaceId,
    action: AuditActions.SETTINGS_UPDATED,
    newData: settings,
  });

  return workspace;
}