import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import { notificationService } from "../services/notification";

const TYPE_COLOR = {
  ORDER_UPDATE: { dot: "#059669", bg: "#ecfdf5" },
  DELIVERY_UPDATE: { dot: "#0284c7", bg: "#eff6ff" },
  SYSTEM: { dot: "#7c3aed", bg: "#f5f3ff" },
  PROMOTION: { dot: "#d97706", bg: "#fffbeb" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Shared NotificationBell component for all authenticated layouts.
 * Props:
 *   notificationsPath - the full route to the notifications page (e.g. "/user/notifications")
 */
export function NotificationBell({ notificationsPath = "/user/notifications" }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnread(res?.data?.unreadCount ?? 0);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 8 });
      setNotifications(res?.data || []);
      setUnread((res?.data || []).filter((n) => !n.isRead).length);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch dropdown when opened
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkRead = async (n) => {
    if (n.isRead) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
    );
    setUnread((c) => Math.max(0, c - 1));
    try {
      await notificationService.markRead(n.id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: false } : item))
      );
      setUnread((c) => c + 1);
    }
  };

  const handleMarkAllRead = async () => {
    const prevNotifications = notifications;
    const prevUnread = unread;
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await notificationService.markAllRead();
    } catch {
      setNotifications(prevNotifications);
      setUnread(prevUnread);
    }
  };

  const handleNotificationClick = async (n) => {
    await handleMarkRead(n);
    setOpen(false);
    if (n.reference) {
      navigate(`/${n.reference}`);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        id="btn-notification-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "7px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          color: "#475569",
          transition: "background 0.15s",
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ef4444",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 800,
              borderRadius: "999px",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid #fff",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "360px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #f1f5f9",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} color="#475569" />
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Notifications
              </span>
              {unread > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "1px 7px",
                  }}
                >
                  {unread} unread
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {unread > 0 && (
                <button
                  id="btn-mark-all-read"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    borderRadius: "6px",
                  }}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                <Bell size={28} style={{ display: "block", margin: "0 auto 10px", opacity: 0.3 }} />
                <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>All caught up!</p>
                <p style={{ fontSize: "12px" }}>No new notifications.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_COLOR[n.type] || TYPE_COLOR.SYSTEM;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      width: "100%",
                      display: "flex",
                      gap: "10px",
                      padding: "12px 16px",
                      background: n.isRead ? "#fff" : "#f8faff",
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: n.isRead ? "#cbd5e1" : meta.dot,
                        marginTop: "6px",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: n.isRead ? 500 : 700,
                          fontSize: "13px",
                          color: "#0f172a",
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          lineHeight: "1.4",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.message}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 16px" }}>
            <button
              id="btn-view-all-notifications"
              onClick={() => { setOpen(false); navigate(notificationsPath); }}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#0284c7",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
