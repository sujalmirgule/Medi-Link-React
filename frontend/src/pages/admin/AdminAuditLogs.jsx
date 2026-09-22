import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/admin";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Activity,
} from "lucide-react";

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getAuditLogs({
          page,
          limit: pagination.limit,
          action: actionFilter !== "all" ? actionFilter : undefined,
          entity: entityFilter !== "all" ? entityFilter : undefined,
          search: search.trim() || undefined,
        });
        setLogs(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, actionFilter, entityFilter, search]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionColor = (action) => {
    if (action.includes("APPROVED") || action.includes("ACTIVATED")) return "#059669";
    if (action.includes("REJECTED") || action.includes("DEACTIVATED") || action.includes("DELETED"))
      return "#dc2626";
    if (action.includes("CREATED") || action.includes("REGISTERED")) return "#2563eb";
    return "#475569";
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Audit Log Trail</h1>
          <p className="admin-section-subtitle">
            Immutable, read-only record of administrative actions, status transitions, and security events.
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-toolbar">
        <form onSubmit={handleSearchSubmit} className="admin-toolbar-group">
          <div className="admin-search-box">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search action, actor, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchLogs(1);
              }}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              Clear
            </button>
          )}
        </form>

        <div className="admin-toolbar-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Actions</option>
              <option value="PHARMACY_VERIFICATION_APPROVED">PHARMACY_VERIFICATION_APPROVED</option>
              <option value="PHARMACY_VERIFICATION_REJECTED">PHARMACY_VERIFICATION_REJECTED</option>
              <option value="DELIVERY_PARTNER_VERIFICATION_APPROVED">
                DELIVERY_PARTNER_VERIFICATION_APPROVED
              </option>
              <option value="DELIVERY_PARTNER_VERIFICATION_REJECTED">
                DELIVERY_PARTNER_VERIFICATION_REJECTED
              </option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Entities</option>
              <option value="VerificationRequest">VerificationRequest</option>
              <option value="User">User</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="DeliveryPartner">DeliveryPartner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading audit records...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No audit log records found matching query.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action Event</th>
                  <th>Entity Reference</th>
                  <th>Performed By</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: "right" }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "12px",
                          color: getActionColor(log.action),
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#334155", fontWeight: 600 }}>{log.entity}</span>
                      {log.entityId && (
                        <div
                          style={{
                            fontSize: "11px",
                            fontFamily: "monospace",
                            color: "#94a3b8",
                          }}
                        >
                          ID: {log.entityId.slice(0, 12)}...
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 500 }}>
                        {log.user?.email || "System / Direct Action"}
                      </div>
                      {log.user?.role && (
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          Role: {log.user.role}
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        <Clock size={12} />
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {log.metadata ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Inspect Event Payload"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="admin-pagination-btns">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Payload Modal */}
      {selectedLog && (
        <div className="admin-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Audit Record Inspector</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Action: {selectedLog.action}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#475569",
                }}
              >
                <div>
                  <strong>Entity:</strong> {selectedLog.entity}
                </div>
                <div>
                  <strong>Entity ID:</strong> {selectedLog.entityId || "None"}
                </div>
                <div>
                  <strong>Performed By:</strong> {selectedLog.user?.email || "System"}
                </div>
                <div>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Metadata Payload JSON
              </div>
              <pre
                style={{
                  background: "#0f172a",
                  color: "#e2e8f0",
                  padding: "14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  overflowX: "auto",
                  fontFamily: "monospace",
                  margin: 0,
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

export default AdminAuditLogs;
