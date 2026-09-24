import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { NotificationType } from '@prisma/client';

export async function createNotification(data: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      workspaceId: data.workspaceId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    },
  });
}

export async function createBulkNotifications(notifications: Array<{
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}>) {
  if (notifications.length === 0) return [];

  return prisma.notification.createMany({
    data: notifications.map(n => ({
      userId: n.userId,
      workspaceId: n.workspaceId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || {},
    })),
  });
}

export async function getNotifications(userId: string, workspaceId: string, params: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}) {
  const { page = 1, limit = 20, isRead, type } = params;

  const where: Record<string, unknown> = { userId, workspaceId };
  if (isRead !== undefined) where.isRead = isRead;
  if (type) where.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, workspaceId, isRead: false } }),
  ]);

  return {
    data: notifications,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    unreadCount,
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string, workspaceId: string) {
  return prisma.notification.updateMany({
    where: { userId, workspaceId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  return { success: true };
}

export async function getUnreadCount(userId: string, workspaceId: string) {
  const count = await prisma.notification.count({
    where: { userId, workspaceId, isRead: false },
  });
  return { count };
}