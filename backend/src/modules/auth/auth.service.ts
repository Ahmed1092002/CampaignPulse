import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/prisma';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { AuthenticationError, ConflictError, NotFoundError } from '../../utils/errors';
import { AuditActions, createAuditLog } from '../audit-logs/auditLog.service';
import { JwtPayload } from '../../types';
import { emailService } from '../email/email.service';
import env from '../../config/env';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput, workspaceId?: string): Promise<{ user: JwtPayload; tokens: AuthTokens }> {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });

  if (workspaceId) {
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: 'ADMIN',
      },
    });
  }

  const payload: Omit<JwtPayload, 'type'> = {
    userId: user.id,
    email: user.email,
  };

  const tokens = generateTokenPair(payload);

  await createAuditLog({
    workspaceId: workspaceId || '',
    userId: user.id,
    entityType: 'User',
    entityId: user.id,
    action: AuditActions.WORKSPACE_CREATED,
    newData: { email: user.email, firstName: user.firstName, lastName: user.lastName },
  });

  return {
    user: { ...payload, type: 'access' },
    tokens,
  };
}

export async function login(input: LoginInput): Promise<{ user: JwtPayload; tokens: AuthTokens; workspaces: Array<{ id: string; name: string; role: string }> }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      workspaces: {
        include: { workspace: true },
      },
    },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('Invalid credentials');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const workspaces = user.workspaces.map(w => ({
    id: w.workspace.id,
    name: w.workspace.name,
    role: w.role,
  }));

  const payload: Omit<JwtPayload, 'type'> = {
    userId: user.id,
    email: user.email,
  };

  const tokens = generateTokenPair(payload);

  return { user: { ...payload, type: 'access' }, tokens, workspaces };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthenticationError('Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError('User not found or inactive');
  }

  const newPayload: Omit<JwtPayload, 'type'> = {
    userId: user.id,
    email: user.email,
  };

  return generateTokenPair(newPayload);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      locale: true,
      createdAt: true,
      lastLoginAt: true,
      workspaces: {
        include: {
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateProfile(userId: string, data: { firstName?: string; lastName?: string; locale?: string; avatarUrl?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      locale: true,
    },
  });

  return user;
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Always return success to prevent email enumeration
  if (!user) return;

  // Generate reset token (valid for 1 hour)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  );

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await emailService.send({
    to: user.email,
    template: 'password_reset',
    templateData: {
      resetUrl,
    },
  }).catch(err => console.error('Failed to send password reset email:', err));
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
}

export async function verifyResetToken(token: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  return true;
}