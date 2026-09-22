import { prisma } from "../../lib/prisma";
import { Prisma, NotificationType } from "@prisma/client";
import {
  CreateNotificationInput,
  FormattedNotification,
  NotificationFilterParams,
} from "./notification.types";

function formatNotification(n: any): FormattedNotification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    reference: n.reference ?? null,
    createdAt: n.createdAt,
  };
}

function notFoundError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 404;
  throw err;
}

function forbiddenError(msg: string): never {
  const err: any = new Error(msg);
  err.status = 403;
  throw err;
}

export class NotificationService {
  /**
   * Create a single notification.
   * Safe to call fire-and-forget — errors are swallowed to avoid
   * failing the primary business transaction over a notification error.
   */
  static async create(input: CreateNotificationInput): Promise<FormattedNotification | null> {
    try {
      const n = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          reference: input.reference ?? null,
        },
      });
      return formatNotification(n);
    } catch (err) {
      console.error("[NotificationService.create] Failed:", err);
      return null;
    }
  }

  /**
   * Create multiple notifications atomically (e.g. customer + pharmacy on order placed).
   */
  static async bulkCreate(inputs: CreateNotificationInput[]): Promise<void> {
    if (!inputs.length) return;
    try {
      await prisma.notification.createMany({
        data: inputs.map((i) => ({
          userId: i.userId,
          type: i.type,
          title: i.title,
          message: i.message,
          reference: i.reference ?? null,
        })),
        skipDuplicates: false,
      });
    } catch (err) {
      console.error("[NotificationService.bulkCreate] Failed:", err);
    }
  }

  /**
   * List notifications for an authenticated user with pagination.
   * Always scoped by userId — never exposes another user's notifications.
   */
  static async listForUser(userId: string, params: NotificationFilterParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    if (params.type && params.type !== "all") {
      where.type = params.type as NotificationType;
    }

    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: items.map(formatNotification),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get unread notification count for the authenticated user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read.
   * Enforces ownership: notification.userId must equal the authenticated user.
   */
  static async markRead(userId: string, notificationId: string): Promise<FormattedNotification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      notFoundError("Notification not found.");
    }

    if (notification.userId !== userId) {
      forbiddenError("You are not authorised to modify this notification.");
    }

    if (notification.isRead) {
      return formatNotification(notification);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return formatNotification(updated);
  }

  /**
   * Mark ALL notifications belonging to this user as read.
   */
  static async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }
}
