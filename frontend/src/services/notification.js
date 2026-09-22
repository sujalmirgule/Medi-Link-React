import { api } from "../lib/api";

export const notificationService = {
  /**
   * Get paginated list of notifications for the authenticated user.
   */
  async getNotifications({ page = 1, limit = 20, type, isRead } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (type && type !== "all") params.set("type", type);
    if (isRead !== undefined) params.set("isRead", String(isRead));

    const res = await api.get(`/notifications?${params.toString()}`);
    // API returns { success, data, pagination }
    return res;
  },

  /**
   * Get unread count for the badge.
   */
  async getUnreadCount() {
    const res = await api.get("/notifications/unread-count");
    return res;
  },

  /**
   * Mark a single notification as read.
   */
  async markRead(notificationId) {
    const res = await api.patch(`/notifications/${notificationId}/read`, {});
    return res;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllRead() {
    const res = await api.patch("/notifications/read-all", {});
    return res;
  },
};
