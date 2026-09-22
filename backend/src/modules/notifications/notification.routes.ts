import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notification.controller";

export const notificationRouter = Router();

// All notification endpoints require authentication
// No role restriction — every authenticated role sees their own notifications
notificationRouter.use(authenticate);

// GET /api/v1/notifications — paginated list for the authenticated user
notificationRouter.get("/", listNotifications);

// GET /api/v1/notifications/unread-count — fast unread count
notificationRouter.get("/unread-count", getUnreadCount);

// PATCH /api/v1/notifications/read-all — mark all as read
notificationRouter.patch("/read-all", markAllNotificationsRead);

// PATCH /api/v1/notifications/:id/read — mark single notification as read
notificationRouter.patch("/:id/read", markNotificationRead);
