import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/admin";
import {
  Users,
  Store,
  Truck,
  ShieldCheck,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText,
} from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    const handleRefresh = () => fetchStats();
    window.addEventListener("admin:refresh", handleRefresh);
    return () => window.removeEventListener("admin:refresh", handleRefresh);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 600 }}>
          Loading operational metrics...
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertCircle size={20} />
        <div>
          <strong>Error loading dashboard:</strong> {error}
          <button
            onClick={fetchStats}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            style={{ marginLeft: "12px" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalCustomers: 0,
    totalPharmacies: 0,
    pendingPharmacies: 0,
    verifiedPharmacies: 0,
    totalDeliveryPartners: 0,
    pendingDeliveryPartners: 0,
    verifiedDeliveryPartners: 0,
    pendingVerificationsTotal: 0,
  };

  const recentActivity = stats?.recentActivity || [];

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Platform Overview</h1>
          <p className="admin-section-subtitle">
            Real-time operational health, role breakdowns, and verification queues.
          </p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="admin-metrics-grid">
        {/* Total Users */}
        <div className="admin-metric-card">
          <div className="admin-metric-icon blue">
            <Users size={22} />
          </div>
          <div>
            <h3 className="admin-metric-value">{metrics.totalUsers}</h3>
            <div className="admin-metric-label">Total Users</div>
            <div className="admin-metric-subtext">
              {metrics.activeUsers} active · {metrics.inactiveUsers} inactive
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="admin-metric-card">
          <div
            className={`admin-metric-icon ${
              metrics.pendingVerificationsTotal > 0 ? "rose" : "emerald"
            }`}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="admin-metric-value">
              {metrics.pendingVerificationsTotal}
            </h3>
            <div className="admin-metric-label">Pending Verifications</div>
            <div className="admin-metric-subtext">
              {metrics.pendingPharmacies} pharmacies · {metrics.pendingDeliveryPartners} drivers
            </div>
          </div>
        </div>

        {/* Total Pharmacies */}
        <div className="admin-metric-card">
          <div className="admin-metric-icon emerald">
            <Store size={22} />
          </div>
          <div>
            <h3 className="admin-metric-value">{metrics.totalPharmacies}</h3>
            <div className="admin-metric-label">Registered Pharmacies</div>
            <div className="admin-metric-subtext">
              {metrics.verifiedPharmacies} verified · {metrics.pendingPharmacies} awaiting review
            </div>
          </div>
        </div>

        {/* Delivery Partners */}
        <div className="admin-metric-card">
          <div className="admin-metric-icon purple">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="admin-metric-value">
              {metrics.totalDeliveryPartners}
            </h3>
            <div className="admin-metric-label">Delivery Partners</div>
            <div className="admin-metric-subtext">
              {metrics.verifiedDeliveryPartners} verified · {metrics.pendingDeliveryPartners} pending
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <Link
          to="/admin/verifications"
          className="admin-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="admin-metric-icon rose" style={{ width: 40, height: 40 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Review Verifications
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {metrics.pendingVerificationsTotal} applications require decision
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </Link>

        <Link
          to="/admin/users"
          className="admin-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="admin-metric-icon blue" style={{ width: 40, height: 40 }}>
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                User Management
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Search, inspect roles & toggle statuses
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </Link>

        <Link
          to="/admin/pharmacies"
          className="admin-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="admin-metric-icon emerald" style={{ width: 40, height: 40 }}>
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Pharmacy Directory
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Licenses, cities, verification status
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="admin-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="admin-metric-icon amber" style={{ width: 40, height: 40 }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Audit Log Trail
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Inspect administrative actions & events
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Recent System & Security Events
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
              Latest 10 audit records recorded by MediLink
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            <span>View All Logs</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            No recent audit log records recorded yet.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor Email</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: "right" }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: log.action.includes("APPROVED")
                            ? "#059669"
                            : log.action.includes("REJECTED") || log.action.includes("DEACTIVATED")
                            ? "#dc2626"
                            : "#2563eb",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#475569", fontWeight: 500 }}>
                        {log.entity}
                        {log.entityId && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginLeft: "4px",
                            }}
                          >
                            ({log.entityId.slice(0, 8)}...)
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#334155" }}>
                        {log.actorEmail || "System / Anonymous"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Inspect Metadata"
                        >
                          <Eye size={12} />
                          <span>View Data</span>
                        </button>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="admin-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Event Metadata Inspector</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {selectedLog.action} · {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="admin-modal-body">
              <pre
                style={{
                  background: "#0f172a",
                  color: "#e2e8f0",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  overflowX: "auto",
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setSelectedLog(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
