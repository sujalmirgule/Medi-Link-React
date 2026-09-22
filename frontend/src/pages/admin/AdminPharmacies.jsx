import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/admin";
import {
  Store,
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck,
  Building,
} from "lucide-react";

export function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const fetchPharmacies = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getPharmacies({
          page,
          limit: pagination.limit,
          isVerified: verifiedFilter,
          isActive: activeFilter,
          search: search.trim() || undefined,
        });
        setPharmacies(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load pharmacies");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, verifiedFilter, activeFilter, search]
  );

  useEffect(() => {
    fetchPharmacies(1);
  }, [verifiedFilter, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPharmacies(1);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Pharmacy Directory</h1>
          <p className="admin-section-subtitle">
            View registered pharmacies across all cities, monitor drug licenses, and operational status.
          </p>
        </div>
        <button
          onClick={() => fetchPharmacies(pagination.page)}
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
              placeholder="Search pharmacy name, city, license..."
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
                fetchPharmacies(1);
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
        </div>
      </div>

      {/* Pharmacies Table */}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading pharmacy directory...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No pharmacies found matching filters.
          </div>
        ) : (
          <div className="admin-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pharmacy Name</th>
                  <th>License Number</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Owner: {p.owner?.email || "Unknown"}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {p.licenseNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} color="#64748b" />
                        <span style={{ fontSize: "13px", color: "#334155" }}>
                          {p.city}, {p.state}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        Pincode: {p.pincode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "12px", color: "#334155" }}>{p.email}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{p.phone}</div>
                    </td>
                    <td>
                      {p.isVerified ? (
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
                      {p.isActive ? (
                        <span className="admin-badge admin-badge-active">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge-inactive">Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedPharmacy(p)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        title="Inspect Pharmacy Details"
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
                onClick={() => fetchPharmacies(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchPharmacies(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pharmacy Details Modal */}
      {selectedPharmacy && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPharmacy(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">{selectedPharmacy.name}</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  License: {selectedPharmacy.licenseNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedPharmacy(null)}
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
                    STORE EMAIL
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
                    {selectedPharmacy.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    STORE PHONE
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>
                    {selectedPharmacy.phone}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    VERIFICATION STATUS
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    {selectedPharmacy.isVerified ? (
                      <span className="admin-badge admin-badge-verified">Verified</span>
                    ) : (
                      <span className="admin-badge admin-badge-pending">Unverified / Pending</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    ACTIVE STATUS
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    {selectedPharmacy.isActive ? (
                      <span className="admin-badge admin-badge-active">Active</span>
                    ) : (
                      <span className="admin-badge admin-badge-inactive">Inactive</span>
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
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Physical Address
                </div>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  {selectedPharmacy.address}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {selectedPharmacy.city}, {selectedPharmacy.state} - {selectedPharmacy.pincode}
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
                  <strong>Staff Members:</strong>{" "}
                  {selectedPharmacy.staff?.length ?? selectedPharmacy._count?.staff ?? 0}
                </div>
                <div>
                  <strong>Inventory Medicines:</strong>{" "}
                  {selectedPharmacy.medicines?.length ?? selectedPharmacy._count?.medicines ?? 0}
                </div>
                <div>
                  <strong>Registered On:</strong>{" "}
                  {new Date(selectedPharmacy.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Owner User ID:</strong> {selectedPharmacy.ownerUserId}
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                onClick={() => setSelectedPharmacy(null)}
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

export default AdminPharmacies;
