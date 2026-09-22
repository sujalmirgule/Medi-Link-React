import { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  reference?: string; // e.g. "orders/ORD-123ABC", "deliveries/<id>"
}

export interface NotificationFilterParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

export interface FormattedNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  reference: string | null;
  createdAt: Date;
}
