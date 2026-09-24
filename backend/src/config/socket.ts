import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../../config/env';
import logger from '../../config/logger';
import { JwtPayload } from '../../types';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
  workspaceId?: string;
}

const userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>
const workspaceRooms = new Map<string, Set<string>>(); // workspaceId -> Set<socketId>

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      if (payload.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      socket.user = payload;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.userId });

    if (socket.user?.userId) {
      if (!userSockets.has(socket.user.userId)) {
        userSockets.set(socket.user.userId, new Set());
      }
      userSockets.get(socket.user.userId)!.add(socket.id);
    }

    socket.on('join-workspace', (workspaceId: string) => {
      if (!socket.user) return;

      socket.join(`workspace:${workspaceId}`);
      socket.workspaceId = workspaceId;

      if (!workspaceRooms.has(workspaceId)) {
        workspaceRooms.set(workspaceId, new Set());
      }
      workspaceRooms.get(workspaceId)!.add(socket.id);

      logger.debug('Socket joined workspace', { socketId: socket.id, workspaceId });
    });

    socket.on('leave-workspace', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
      workspaceRooms.get(workspaceId)?.delete(socket.id);
      logger.debug('Socket left workspace', { socketId: socket.id, workspaceId });
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id, userId: socket.user?.userId });

      if (socket.user?.userId) {
        userSockets.get(socket.user.userId)?.delete(socket.id);
        if (userSockets.get(socket.user.userId)?.size === 0) {
          userSockets.delete(socket.user.userId);
        }
      }

      if (socket.workspaceId) {
        workspaceRooms.get(socket.workspaceId)?.delete(socket.id);
        if (workspaceRooms.get(socket.workspaceId)?.size === 0) {
          workspaceRooms.delete(socket.workspaceId);
        }
      }
    });
  });

  return io;
}

export function emitToWorkspace(io: Server, workspaceId: string, event: string, data: unknown) {
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToUser(io: Server, userId: string, event: string, data: unknown) {
  const socketIds = userSockets.get(userId);
  if (socketIds) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}

export function emitNewLead(io: Server, workspaceId: string, lead: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  campaignId: string;
  campaignName: string;
  createdAt: Date;
}) {
  emitToWorkspace(io, workspaceId, 'new-lead', {
    type: 'NEW_LEAD',
    payload: { lead, workspaceId },
  });
}

export function emitLeadStatusChanged(io: Server, workspaceId: string, lead: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  campaignId: string;
  campaignName: string;
  updatedAt: Date;
}) {
  emitToWorkspace(io, workspaceId, 'lead-status-changed', {
    type: 'LEAD_STATUS_CHANGED',
    payload: { lead, workspaceId },
  });
}

export function emitAnalyticsUpdate(io: Server, workspaceId: string, campaignId: string, stats: Record<string, unknown>) {
  emitToWorkspace(io, workspaceId, 'analytics-update', { campaignId, stats });
}

export function getConnectedUsersCount(workspaceId: string): number {
  return workspaceRooms.get(workspaceId)?.size || 0;
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}