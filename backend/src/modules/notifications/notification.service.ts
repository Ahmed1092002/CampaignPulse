import prisma from '../../config/prisma';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { NotificationType } from '@prisma/client';
import { emailService } from '../email/email.service';
import env from '../../config/env';

export async function createNotification(data: {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
  emailTemplate?: string;
  emailTemplateData?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      workspaceId: data.workspaceId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    },
  });

  if (data.sendEmail && data.emailTemplate) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (user?.email) {
      await emailService.send({
        to: user.email,
        template: data.emailTemplate,
        templateData: {
          ...data.emailTemplateData,
          userName: `${user.firstName} ${user.lastName}`,
          dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
        },
      }).catch(err => console.error('Failed to send notification email:', err));
    }
  }

  return notification;
}

export async function createBulkNotifications(notifications: Array<{
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
  emailTemplate?: string;
  emailTemplateData?: Record<string, unknown>;
}>) {
  if (notifications.length === 0) return [];

  const created = await prisma.notification.createMany({
    data: notifications.map(n => ({
      userId: n.userId,
      workspaceId: n.workspaceId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || {},
    })),
  });

  for (const notification of notifications) {
    if (notification.sendEmail && notification.emailTemplate) {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user?.email) {
        await emailService.send({
          to: user.email,
          template: notification.emailTemplate,
          templateData: {
            ...notification.emailTemplateData,
            userName: `${user.firstName} ${user.lastName}`,
            dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
          },
        }).catch(err => console.error('Failed to send bulk notification email:', err));
      }
    }
  }

  return created;
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