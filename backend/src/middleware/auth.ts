import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { AuthenticatedRequest, JwtPayload } from '../types';
import prisma from '../config/prisma';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired token'));
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (payload.type === 'access') {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, isActive: true },
      });

      if (user && user.isActive) {
        req.user = payload;
      }
    }
    next();
  } catch {
    next();
  }
};

export const requireWorkspace = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const workspaceId = req.headers['x-workspace-id'] as string ||
                         req.query.workspaceId as string ||
                         req.body.workspaceId;

    if (!workspaceId) {
      throw new AuthorizationError('Workspace context required');
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new AuthorizationError('Not a member of this workspace');
    }

    req.workspaceId = workspaceId;
    req.user.role = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles: JwtPayload['role'][]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user?.role) {
      return next(new AuthorizationError('Role not found'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
export const requireMarketer = requireRole('ADMIN', 'MARKETER');
export const requireViewer = requireRole('ADMIN', 'MARKETER', 'VIEWER');