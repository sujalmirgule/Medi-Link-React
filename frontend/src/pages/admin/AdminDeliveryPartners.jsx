import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/admin";
import {
  Truck,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Radio,
  Clock,
} from "lucide-react";

export function AdminDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [availableFilter, setAvailableFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal
  const [selectedPartner, setSelectedPartner] = useState(null);

  const fetchPartners = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getDeliveryPartners({
          page,
          limit: pagination.limit,
          isVerified: verifiedFilter,
          isActive: activeFilter,
          isAvailable: availableFilter,
          search: search.trim() || undefined,
        });
        setPartners(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load delivery partners");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, verifiedFilter, activeFilter, availableFilter, search]
  );

  useEffect(() => {
    fetchPartners(1);
  }, [verifiedFilter, activeFilter, availableFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPartners(1);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Delivery Partner Directory</h1>
          <p className="admin-section-subtitle">
            Manage field courier partners, monitor dispatch availability, and verify onboarding credentials.
          </p>
        </div>
        <button
          onClick={() => fetchPartners(pagination.page)}
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
              placeholder="Search driver phone or email..."
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
                fetchPartners(1);
              }}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              Clear
            </button>
          )}
        </form>

        <div className="admin-toolbar-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Verification:</span>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified / Pending</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Status:</span>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Availability:</span>
            <select
              value={availableFilter}
              onChange={(e) => setAvailableFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All</option>
              <option value="true">Available / Online</option>
              <option value="false">Offline / Busy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading delivery partners...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : partners.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No delivery partners found matching current criteria.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Phone</th>
                  <th>Availability</th>
                  <th>Verification</th>
                  <th>Account Status</th>
                  <th>Deliveries</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((dp) => (
                  <tr key={dp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {dp.user?.email || "Courier Partner"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        ID: {dp.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={13} color="#64748b" />
                        <span style={{ fontSize: "13px", color: "#334155" }}>{dp.phone}</span>
                      </div>
                    </td>
                    <td>
                      {dp.isAvailable ? (
                        <span className="admin-badge admin-badge-verified">
                          <Radio size={11} /> Online / Ready
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-inactive">
                          Offline / Busy
                        </span>
                      )}
                    </td>
                    <td>
                      {dp.isVerified ? (
                        <span className="admin-badge admin-badge-verified">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-pending">
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      {dp.isActive ? (
                        <span className="admin-badge admin-badge-active">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge-inactive">Inactive</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                        {dp.deliveries?.length ?? dp._count?.deliveries ?? 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedPartner(dp)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        title="Inspect Partner Details"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
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
                onClick={() => fetchPartners(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchPartners(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPartner(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Delivery Partner Details</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Partner ID: {selectedPartner.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
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
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    PARTNER EMAIL
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
                    {selectedPartner.user?.email || "Not linked"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    PHONE NUMBER
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
                    {selectedPartner.phone}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    VERIFICATION STATUS
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    {selectedPartner.isVerified ? (
                      <span className="admin-badge admin-badge-verified">Verified</span>
                    ) : (
                      <span className="admin-badge admin-badge-pending">Unverified</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    DISPATCH STATUS
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    {selectedPartner.isAvailable ? (
                      <span className="admin-badge admin-badge-verified">Available for Orders</span>
                    ) : (
                      <span className="admin-badge admin-badge-inactive">Offline / Busy</span>
                    )}
                  </div>
                </div>
              </div>

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
                  Registered Address
                </div>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  {selectedPartner.user?.addresses?.[0] ? (
                    <>
                      {selectedPartner.user.addresses[0].addressLine1},{" "}
                      {selectedPartner.user.addresses[0].city},{" "}
                      {selectedPartner.user.addresses[0].state} -{" "}
                      {selectedPartner.user.addresses[0].pincode}
                    </>
                  ) : (
                    "No address recorded"
                  )}
                </div>
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
                  <strong>Total Deliveries:</strong>{" "}
                  {selectedPartner.deliveries?.length ?? selectedPartner._count?.deliveries ?? 0}
                </div>
                <div>
                  <strong>Customer Reviews:</strong>{" "}
                  {selectedPartner.reviews?.length ?? selectedPartner._count?.reviews ?? 0}
                </div>
                <div>
                  <strong>Joined Date:</strong>{" "}
                  {new Date(selectedPartner.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>User ID:</strong> {selectedPartner.userId}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                onClick={() => setSelectedPartner(null)}
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

export default AdminDeliveryPartners;
