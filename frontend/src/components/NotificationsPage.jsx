import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { notificationService } from "../services/notification";

const TYPE_META = {
  ORDER_UPDATE:    { label: "Order",    color: "#059669", bg: "#ecfdf5" },
  DELIVERY_UPDATE: { label: "Delivery", color: "#0284c7", bg: "#eff6ff" },
  SYSTEM:          { label: "System",   color: "#7c3aed", bg: "#f5f3ff" },
  PROMOTION:       { label: "Promo",    color: "#d97706", bg: "#fffbeb" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Reusable full notification page shared across all 4 portals.
 * Props:
 *   backPath  - where the "Back" button navigates to
 *   backLabel - label for the back button
 *   logo      - logo image src
 *   accentColor - theme accent color (default teal/green)
 */
export function NotificationsPage({
  backPath = "/",
  backLabel = "Dashboard",
  logo,
  accentColor = "#059669",
}) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20, type: typeFilter };
      if (readFilter === "unread") params.isRead = false;
      if (readFilter === "read") params.isRead = true;
      const res = await notificationService.getNotifications(params);
      setNotifications(res?.data || []);
      setPagination(res?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, readFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (n) => {
    if (n.isRead) {
      if (n.reference) navigate(`/${n.reference}`);
      return;
    }
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
    );
    try {
      await notificationService.markRead(n.id);
    } catch {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: false } : item))
      );
    }
    if (n.reference) navigate(`/${n.reference}`);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const prev = notifications;
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      setNotifications(prev);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate(backPath)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← {backLabel}
          </button>
          {logo && <img src={logo} alt="MediLink" style={{ height: "30px" }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bell size={18} color={accentColor} />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#ef4444",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "999px",
                padding: "2px 8px",
              }}
            >
              {unreadCount} unread
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <button
              id="btn-mark-all-read-page"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#0284c7",
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            id="btn-refresh-notifications"
            onClick={fetchNotifications}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "28px auto", padding: "0 20px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Type filter */}
          {["all", "ORDER_UPDATE", "DELIVERY_UPDATE", "SYSTEM", "PROMOTION"].map((t) => (
            <button
              key={t}
              id={`btn-filter-type-${t.toLowerCase()}`}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid",
                borderColor: typeFilter === t ? accentColor : "#e2e8f0",
                background: typeFilter === t ? accentColor : "#fff",
                color: typeFilter === t ? "#fff" : "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t === "all" ? "All Types" : TYPE_META[t]?.label || t}
            </button>
          ))}
          <div style={{ width: "1px", background: "#e2e8f0", margin: "0 4px" }} />
          {["all", "unread", "read"].map((r) => (
            <button
              key={r}
              id={`btn-filter-read-${r}`}
              onClick={() => { setReadFilter(r); setPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid",
                borderColor: readFilter === r ? "#475569" : "#e2e8f0",
                background: readFilter === r ? "#475569" : "#fff",
                color: readFilter === r ? "#fff" : "#64748b",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "8px" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", padding: "18px", border: "1px solid #e2e8f0", display: "flex", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e2e8f0", marginTop: "6px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "14px", background: "#f1f5f9", borderRadius: "4px", width: "60%", marginBottom: "8px" }} />
                  <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "4px", width: "90%" }} />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <Bell size={40} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>No notifications</p>
              <p style={{ fontSize: "13px" }}>You're all caught up! New notifications will appear here.</p>
            </div>
          ) : notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
            return (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n)}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "16px 20px",
                  background: n.isRead ? "#fff" : "#f8faff",
                  border: `1px solid ${n.isRead ? "#e2e8f0" : "#bfdbfe"}`,
                  borderRadius: "12px",
                  cursor: n.reference ? "pointer" : "default",
                  textAlign: "left",
                  width: "100%",
                  transition: "box-shadow 0.15s",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: n.isRead ? "#cbd5e1" : meta.color,
                    marginTop: "5px",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: n.isRead ? 500 : 700, fontSize: "14px", color: "#0f172a" }}>
                      {n.title}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        background: meta.bg,
                        color: meta.color,
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "999px",
                        padding: "2px 8px",
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>{n.message}</p>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span>{timeAgo(n.createdAt)}</span>
                    {!n.isRead && (
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "999px", fontSize: "10px", fontWeight: 700 }}>
                        NEW
                      </span>
                    )}
                    {n.reference && !n.isRead && (
                      <span style={{ color: "#0284c7", fontSize: "11px" }}>→ View</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
            <button
              id="btn-prev-page-notif"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: "8px 18px", borderRadius: "8px", background: accentColor, color: "#fff", fontWeight: 700, fontSize: "13px" }}>
              {page} / {pagination.totalPages}
            </span>
            <button
              id="btn-next-page-notif"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
          {pagination.total} total notifications
        </div>
      </main>
    </div>
  );
}

export default NotificationsPage;
