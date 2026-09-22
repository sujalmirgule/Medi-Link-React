import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/auth";
import {
  ShieldCheck,
  Store,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  Filter,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getVerifications({
        role: roleFilter,
        status: statusFilter,
      });
      setApplications(data);
    } catch (err) {
      setError(err.message || "Failed to load verification applications");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this verification application?")) {
      return;
    }
    setActionLoading(true);
    try {
      await adminService.approveVerification(id);
      setActionMessage({ type: "success", text: "Application approved successfully!" });
      setSelectedApp(null);
      await fetchApplications();
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to approve application" });
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
      setActionMessage({ type: "success", text: "Application rejected with reason recorded." });
      setRejectingApp(null);
      setRejectionReason("");
      setSelectedApp(null);
      await fetchApplications();
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to reject application" });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;
  const verifiedCount = applications.filter((a) => a.status === "VERIFIED").length;
  const rejectedCount = applications.filter((a) => a.status === "REJECTED").length;

  return (
    <div className="dashboard-page" style={{ gridTemplateColumns: "240px 1fr" }}>
      {/* Sidebar */}
      <aside className="dashboard-sidebar" style={{ width: "240px" }}>
        <div className="dashboard-logo">
          <img src={logo} alt="MediLink" />
        </div>

        <div style={{ padding: "0 12px 14px", borderBottom: "1px solid #deedf5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={18} color="#087ac7" />
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#173f6c" }}>
              Admin Verification Portal
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#5f7e97", marginTop: "4px" }}>
            {user?.email}
          </div>
        </div>

        <nav className="dashboard-nav" style={{ marginTop: "16px" }}>
          <button
            className="dashboard-nav-item"
            style={{ background: "#edf8ff", color: "#087ac7", fontWeight: 700 }}
          >
            <ShieldCheck size={18} />
            <span>Verifications</span>
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "#087ac7",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "999px",
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="dashboard-nav-item"
            style={{ color: "#b91c1c", width: "100%", justifyContent: "flex-start" }}
          >
            <LogOut size={17} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ padding: "32px 40px", overflowY: "auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", color: "#123b78", margin: 0, fontWeight: 750 }}>
              Partner Verification Management
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
              Review, approve, or reject business registrations for Pharmacies and Delivery Partners.
            </p>
          </div>

          <button
            onClick={fetchApplications}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: actionMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${actionMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: actionMessage.type === "success" ? "#166534" : "#991b1b",
            }}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Status Count Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0284c7" }}>
              <Clock size={18} />
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Pending Applications</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
              {pendingCount}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}>
              <CheckCircle2 size={18} />
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Approved Partners</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
              {verifiedCount}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
              <XCircle size={18} />
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Rejected Applications</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "8px" }}>
              {rejectedCount}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Role Filter Tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "all", label: "All Types" },
              { id: "PHARMACY", label: "Pharmacies" },
              { id: "DELIVERY_PARTNER", label: "Delivery Partners" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: roleFilter === tab.id ? "#087ac7" : "#f1f5f9",
                  color: roleFilter === tab.id ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: "12px", color: "#64748b" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                color: "#334155",
                background: "#ffffff",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              Loading verification requests...
            </div>
          ) : applications.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No verification applications found matching criteria.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Applicant / Store</th>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Role</th>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Submitted Contact</th>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Submitted On</th>
                  <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const data = app.submittedData || {};
                  const displayName =
                    data.pharmacyName || data.fullName || app.user?.email || "Applicant";

                  return (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{displayName}</div>
                        {data.licenseNumber && (
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            Lic: {data.licenseNumber}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: app.role === "PHARMACY" ? "#eff6ff" : "#fdf4ff",
                            color: app.role === "PHARMACY" ? "#1d4ed8" : "#a21caf",
                          }}
                        >
                          {app.role === "PHARMACY" ? <Store size={12} /> : <Truck size={12} />}
                          {app.role === "PHARMACY" ? "Pharmacy" : "Delivery Partner"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", color: "#475569" }}>
                        <div>{app.user?.email}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {data.phone || app.user?.phone || "—"}
                        </div>
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background:
                              app.status === "VERIFIED"
                                ? "#dcfce7"
                                : app.status === "REJECTED"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              app.status === "VERIFIED"
                                ? "#15803d"
                                : app.status === "REJECTED"
                                ? "#b91c1c"
                                : "#b45309",
                          }}
                        >
                          {app.status === "VERIFIED" && <CheckCircle2 size={12} />}
                          {app.status === "REJECTED" && <XCircle size={12} />}
                          {app.status === "PENDING" && <Clock size={12} />}
                          {app.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px" }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedApp(app)}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#475569",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          {app.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(app.id)}
                                disabled={actionLoading}
                                style={{
                                  padding: "5px 9px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#16a34a",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
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
                                style={{
                                  padding: "5px 9px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "#dc2626",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
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
          )}
        </div>

        {/* MODAL: APPLICATION DETAIL VIEW */}
        {selectedApp && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "600px",
                padding: "28px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "14px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                    Application Details
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                    ID: {selectedApp.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Detail Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
                  <strong style={{ color: "#64748b" }}>Role:</strong>
                  <span>{selectedApp.role}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
                  <strong style={{ color: "#64748b" }}>Account Email:</strong>
                  <span>{selectedApp.user?.email}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
                  <strong style={{ color: "#64748b" }}>Status:</strong>
                  <span style={{ fontWeight: 700 }}>{selectedApp.status}</span>
                </div>
                {selectedApp.rejectionReason && (
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
                    <strong style={{ color: "#b91c1c" }}>Rejection Reason:</strong>
                    <span style={{ color: "#b91c1c" }}>{selectedApp.rejectionReason}</span>
                  </div>
                )}

                <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

                <h4 style={{ margin: "4px 0", color: "#1e293b", fontSize: "14px" }}>
                  Submitted Profile Information
                </h4>

                {selectedApp.submittedData ? (
                  Object.entries(selectedApp.submittedData).map(([key, value]) => (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "140px 1fr" }}>
                      <span style={{ color: "#64748b", textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <strong>{String(value)}</strong>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8" }}>No additional data submitted.</p>
                )}
              </div>

              {/* Action Buttons inside Modal */}
              {selectedApp.status === "PENDING" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "24px",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "16px",
                  }}
                >
                  <button
                    onClick={() => {
                      setRejectingApp(selectedApp);
                      setRejectionReason("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #ef4444",
                      background: "#ffffff",
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: REJECTION REASON FORM (Section 25 & 26) */}
        {rejectingApp && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "480px",
                padding: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626" }}>
                <AlertCircle size={20} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Reject Verification Application
                </h3>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 16px" }}>
                Please provide the official reason for rejecting this application. This reason will be
                displayed directly in the applicant&apos;s dashboard.
              </p>

              <form onSubmit={handleRejectSubmit}>
                <label
                  htmlFor="rejectReason"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}
                >
                  Rejection Reason *
                </label>
                <textarea
                  id="rejectReason"
                  rows={4}
                  required
                  placeholder="e.g. License document expired or could not be verified in state database..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    padding: "10px 12px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setRejectingApp(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
