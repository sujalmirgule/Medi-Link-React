import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

export function AdminUsers() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusToggleUser, setStatusToggleUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchUsers = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getUsers({
          page,
          limit: pagination.limit,
          role: roleFilter,
          isActive: statusFilter,
          verificationStatus: verificationFilter,
          search: search.trim() || undefined,
        });
        setUsers(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, roleFilter, statusFilter, verificationFilter, search]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter, verificationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleStatusToggle = async () => {
    if (!statusToggleUser) return;
    const targetStatus = !statusToggleUser.isActive;

    if (statusToggleUser.id === currentAdmin?.id && !targetStatus) {
      alert("Self-deactivation is prohibited. You cannot deactivate your own account.");
      setStatusToggleUser(null);
      return;
    }

    setActionLoading(true);
    try {
      await adminService.updateUserStatus(statusToggleUser.id, targetStatus);
      setActionMessage({
        type: "success",
        text: `User account successfully ${targetStatus ? "activated" : "deactivated"}.`,
      });
      setStatusToggleUser(null);
      if (selectedUser?.id === statusToggleUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: targetStatus } : null));
      }
      await fetchUsers(pagination.page);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to update user account status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "CUSTOMER":
        return <span className="admin-badge admin-badge-customer">Customer</span>;
      case "PHARMACY":
        return <span className="admin-badge admin-badge-pharmacy">Pharmacy</span>;
      case "DELIVERY_PARTNER":
        return <span className="admin-badge admin-badge-driver">Delivery</span>;
      case "ADMIN":
        return <span className="admin-badge admin-badge-admin">Admin</span>;
      default:
        return <span className="admin-badge">{role}</span>;
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">User Management</h1>
          <p className="admin-section-subtitle">
            Inspect all registered platform users, monitor verification levels, and manage account statuses.
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
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
            <AlertTriangle size={18} />
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
              placeholder="Search name, email, or phone..."
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
                fetchUsers(1);
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
              <option value="CUSTOMER">Customer</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="DELIVERY_PARTNER">Delivery Partner</option>
              <option value="ADMIN">Admin</option>
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
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading users...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No users found matching current filters.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Verification</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const displayName =
                    (u.profile?.firstName
                      ? `${u.profile.firstName} ${u.profile.lastName || ""}`
                      : null) ||
                    u.pharmaciesOwned?.[0]?.name ||
                    u.email;

                  const isSelf = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {displayName}
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#2563eb",
                                    fontWeight: 700,
                                    marginLeft: "6px",
                                    background: "#eff6ff",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {u.email} {u.phone ? `· ${u.phone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.isActive ? (
                          <span className="admin-badge admin-badge-active">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-inactive">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color:
                              u.verificationStatus === "VERIFIED"
                                ? "#059669"
                                : u.verificationStatus === "PENDING"
                                ? "#d97706"
                                : u.verificationStatus === "REJECTED"
                                ? "#dc2626"
                                : "#64748b",
                          }}
                        >
                          {u.verificationStatus}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
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
                            onClick={() => setSelectedUser(u)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Inspect User Details"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => setStatusToggleUser(u)}
                            disabled={isSelf && u.isActive}
                            className={`admin-btn admin-btn-sm ${
                              u.isActive ? "admin-btn-danger" : "admin-btn-success"
                            }`}
                            title={
                              isSelf && u.isActive
                                ? "Self-deactivation is prohibited"
                                : u.isActive
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            {u.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                            <span>{u.isActive ? "Deactivate" : "Activate"}</span>
                          </button>
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
                onClick={() => fetchUsers(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Inspector Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">User Account Inspection</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  ID: {selectedUser.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
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
                  gap: "14px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    EMAIL ADDRESS
                  </div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                    {selectedUser.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    PHONE NUMBER
                  </div>
                  <div style={{ fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                    {selectedUser.phone || "Not provided"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>ROLE</div>
                  <div style={{ marginTop: "4px" }}>{getRoleBadge(selectedUser.role)}</div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    ACCOUNT STATUS
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    {selectedUser.isActive ? (
                      <span className="admin-badge admin-badge-active">Active</span>
                    ) : (
                      <span className="admin-badge admin-badge-inactive">Inactive</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    VERIFICATION STATUS
                  </div>
                  <div style={{ fontWeight: 600, marginTop: "2px" }}>
                    {selectedUser.verificationStatus}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    REGISTERED ON
                  </div>
                  <div style={{ color: "#475569", marginTop: "2px" }}>
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Associated Profile Data */}
              {selectedUser.profile && (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Customer Profile
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569" }}>
                    Name: {selectedUser.profile.firstName} {selectedUser.profile.lastName}
                  </div>
                </div>
              )}

              {/* Associated Pharmacy Data */}
              {selectedUser.pharmaciesOwned && selectedUser.pharmaciesOwned.length > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
                    Owned Pharmacy: {selectedUser.pharmaciesOwned[0].name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#15803d" }}>
                    License: {selectedUser.pharmaciesOwned[0].licenseNumber} · City: {selectedUser.pharmaciesOwned[0].city}
                  </div>
                </div>
              )}

              {/* Associated Delivery Partner Data */}
              {selectedUser.deliveryPartner && (
                <div
                  style={{
                    background: "#faf5ff",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #e9d5ff",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#6b21a8", marginBottom: "6px" }}>
                    Delivery Partner Profile
                  </div>
                  <div style={{ fontSize: "12px", color: "#7e22ce" }}>
                    Phone: {selectedUser.deliveryPartner.phone} · Verified:{" "}
                    {selectedUser.deliveryPartner.isVerified ? "Yes" : "No"} · Available:{" "}
                    {selectedUser.deliveryPartner.isAvailable ? "Yes" : "No"}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Confirmation Modal */}
      {statusToggleUser && (
        <div className="admin-modal-overlay" onClick={() => setStatusToggleUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {statusToggleUser.isActive ? "Deactivate User Account" : "Activate User Account"}
              </h3>
              <button
                onClick={() => setStatusToggleUser(null)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ marginTop: 0, color: "#334155" }}>
                Are you sure you want to {statusToggleUser.isActive ? "deactivate" : "activate"} the
                account for <strong>{statusToggleUser.email}</strong>?
              </p>
              {statusToggleUser.isActive ? (
                <div
                  style={{
                    padding: "12px",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    fontSize: "12px",
                    color: "#991b1b",
                  }}
                >
                  <AlertTriangle size={14} style={{ display: "inline", marginRight: "6px" }} />
                  Deactivating this user will immediately invalidate their sessions and block them
                  from logging in to the platform until reactivated.
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#ecfdf5",
                    borderRadius: "8px",
                    border: "1px solid #a7f3d0",
                    fontSize: "12px",
                    color: "#065f46",
                  }}
                >
                  <CheckCircle2 size={14} style={{ display: "inline", marginRight: "6px" }} />
                  Activating this user will restore their ability to log in and access their dashboard.
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                onClick={() => setStatusToggleUser(null)}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={actionLoading}
                className={`admin-btn ${
                  statusToggleUser.isActive ? "admin-btn-danger" : "admin-btn-success"
                }`}
              >
                {actionLoading
                  ? "Updating..."
                  : statusToggleUser.isActive
                  ? "Yes, Deactivate Account"
                  : "Yes, Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
