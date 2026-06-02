import prisma from '../db/client.js';
import type { NotificationType } from '@bezon/types';

export class NotificationService {
  // Create a single notification record
  static async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, any> = {},
    targetUrl?: string,
  ) {
    return prisma.notification.create({
      data: { userId, type, title, body, data, targetUrl },
    });
  }

  // Get paginated notifications for a user (newest first)
  static async getUserNotifications(userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Count unread notifications
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Mark a single notification as read (only if it belongs to the user)
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      const err = new Error('Notification not found.');
      (err as any).status = 404;
      throw err;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
