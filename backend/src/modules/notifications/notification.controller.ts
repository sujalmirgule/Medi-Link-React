import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service";
import { listNotificationsSchema } from "./notification.validation";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const query = listNotificationsSchema.parse(req.query);

    const result = await NotificationService.listForUser(userId, {
      page: query.page,
      limit: query.limit,
      type: query.type,
      isRead: query.isRead,
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const notification = await NotificationService.markRead(userId, id);

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const result = await NotificationService.markAllRead(userId);

    res.status(200).json({
      success: true,
      message: `${result.count} notification(s) marked as read.`,
      data: { count: result.count },
    });
  } catch (err) {
    next(err);
  }
}
