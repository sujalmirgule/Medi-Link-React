import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/admin";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  AlertCircle,
  Building,
  Truck,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function AdminVerifications() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals & Action States
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchApplications = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getVerifications({
          page,
          limit: pagination.limit,
          role: roleFilter,
          status: statusFilter,
          search: search.trim() || undefined,
        });
        setApplications(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load verification requests");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, roleFilter, statusFilter, search]
  );

  useEffect(() => {
    fetchApplications(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications(1);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this verification application?")) {
      return;
    }
    setActionLoading(true);
    try {
      await adminService.approveVerification(id);
      setActionMessage({ type: "success", text: "Verification approved successfully!" });
      setSelectedApp(null);
      await fetchApplications(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Approval failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      alert("Please provide a rejection reason of at least 5 characters.");
      return;
    }
    if (!rejectingApp) return;

    setActionLoading(true);
    try {
      await adminService.rejectVerification(rejectingApp.id, rejectionReason.trim());
      setActionMessage({ type: "success", text: "Verification application rejected." });
      setRejectingApp(null);
      setRejectionReason("");
      setSelectedApp(null);
      await fetchApplications(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Rejection failed" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Verification Applications</h1>
          <p className="admin-section-subtitle">
            Review submitted credentials for Pharmacies and Delivery Partners before enabling operations.
          </p>
        </div>
        <button
          onClick={() => fetchApplications(pagination.page)}
          disabled={loading}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`admin-alert ${
            actionMessage.type === "success" ? "admin-alert-success" : "admin-alert-danger"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="admin-toolbar">
        <form onSubmit={handleSearchSubmit} className="admin-toolbar-group">
          <div className="admin-search-box">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by name, email, or license..."
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
                fetchApplications(1);
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
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Roles</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="DELIVERY_PARTNER">Delivery Partner</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading applications...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No verification applications found matching criteria.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const applicantName =
                    app.submittedData?.pharmacyName ||
                    app.submittedData?.fullName ||
                    app.user?.profile?.firstName ||
                    app.user?.email ||
                    "Unknown Applicant";

                  return (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{applicantName}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {app.user?.email || app.submittedData?.email || "No email"}
                        </div>
                      </td>
                      <td>
                        {app.role === "PHARMACY" ? (
                          <span className="admin-badge admin-badge-pharmacy">
                            <Building size={11} /> Pharmacy
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-driver">
                            <Truck size={11} /> Delivery
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        {app.status === "PENDING" && (
                          <span className="admin-badge admin-badge-pending">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        {app.status === "VERIFIED" && (
                          <span className="admin-badge admin-badge-verified">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        )}
                        {app.status === "REJECTED" && (
                          <span className="admin-badge admin-badge-rejected">
                            <XCircle size={11} /> Rejected
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {app.reviewedBy?.email || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "6px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Inspect Details"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>

                          {app.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(app.id)}
                                disabled={actionLoading}
                                className="admin-btn admin-btn-success admin-btn-sm"
                                title="Approve Verification"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingApp(app);
                                  setRejectionReason("");
                                }}
                                disabled={actionLoading}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                title="Reject Verification"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                onClick={() => fetchApplications(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchApplications(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="admin-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Verification Application Details</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Application ID: {selectedApp.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                  CURRENT STATUS
                </div>
                <div style={{ marginTop: "4px" }}>
                  {selectedApp.status === "PENDING" && (
                    <span className="admin-badge admin-badge-pending">
                      <Clock size={12} /> Pending Decision
                    </span>
                  )}
                  {selectedApp.status === "VERIFIED" && (
                    <span className="admin-badge admin-badge-verified">
                      <CheckCircle2 size={12} /> Approved & Verified
                    </span>
                  )}
                  {selectedApp.status === "REJECTED" && (
                    <span className="admin-badge admin-badge-rejected">
                      <XCircle size={12} /> Rejected
                    </span>
                  )}
                </div>
              </div>

              {selectedApp.rejectionReason && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#b91c1c" }}>
                    REJECTION REASON
                  </div>
                  <div style={{ fontSize: "13px", color: "#7f1d1d", marginTop: "4px" }}>
                    {selectedApp.rejectionReason}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>
                  SUBMITTED APPLICATION DATA
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
                  {JSON.stringify(selectedApp.submittedData || {}, null, 2)}
                </pre>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                <div>
                  <strong>User ID:</strong> {selectedApp.userId}
                </div>
                <div>
                  <strong>Role:</strong> {selectedApp.role}
                </div>
                <div>
                  <strong>Submitted:</strong>{" "}
                  {new Date(selectedApp.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Reviewed:</strong>{" "}
                  {selectedApp.reviewedAt
                    ? new Date(selectedApp.reviewedAt).toLocaleString()
                    : "Not yet reviewed"}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              {selectedApp.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    disabled={actionLoading}
                    className="admin-btn admin-btn-success"
                  >
                    <Check size={14} />
                    <span>Approve Application</span>
                  </button>
                  <button
                    onClick={() => {
                      setRejectingApp(selectedApp);
                      setRejectionReason("");
                    }}
                    disabled={actionLoading}
                    className="admin-btn admin-btn-danger"
                  >
                    <X size={14} />
                    <span>Reject Application</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedApp(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingApp && (
        <div className="admin-modal-overlay" onClick={() => setRejectingApp(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleRejectSubmit}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Reject Verification Application</h3>
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ color: "#475569", fontSize: "13px", marginTop: 0 }}>
                  Please state a clear reason for rejecting this application. The partner will see this
                  reason upon login and can correct their submission.
                </p>

                <div style={{ marginTop: "12px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Rejection Reason (minimum 5 characters) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Invalid pharmacy drug license number or expired proof of registration..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setRejectingApp(null)}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || rejectionReason.trim().length < 5}
                  className="admin-btn admin-btn-danger"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVerifications;
