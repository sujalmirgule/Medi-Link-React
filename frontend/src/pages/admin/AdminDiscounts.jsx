import { useState, useEffect, useCallback } from "react";
import { discountService } from "../../services/discount";
import {
  Tag,
  Percent,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Power,
} from "lucide-react";

export function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deletingDiscount, setDeletingDiscount] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxDiscount: "",
    minimumOrderAmount: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });
  const [formError, setFormError] = useState(null);

  const fetchDiscounts = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await discountService.adminListDiscounts({
          page,
          limit: pagination.limit,
          search: search.trim() || undefined,
          isActive: statusFilter === "all" ? undefined : statusFilter === "active",
          type: typeFilter === "all" ? undefined : typeFilter,
        });
        setDiscounts(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load discount coupons");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, search, statusFilter, typeFilter]
  );

  useEffect(() => {
    fetchDiscounts(1);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDiscounts(1);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      code: "",
      type: "PERCENTAGE",
      value: "",
      maxDiscount: "",
      minimumOrderAmount: "",
      startsAt: "",
      endsAt: "",
      isActive: true,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (d) => {
    setEditingDiscount(d);
    setFormData({
      code: d.code,
      type: d.type,
      value: d.value,
      maxDiscount: d.maxDiscount !== null ? String(d.maxDiscount) : "",
      minimumOrderAmount: d.minimumOrderAmount !== null ? String(d.minimumOrderAmount) : "",
      startsAt: d.startsAt ? new Date(d.startsAt).toISOString().split("T")[0] : "",
      endsAt: d.endsAt ? new Date(d.endsAt).toISOString().split("T")[0] : "",
      isActive: d.isActive,
    });
    setFormError(null);
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError("Coupon code is required");
      return;
    }
    const valNum = Number(formData.value);
    if (isNaN(valNum) || valNum <= 0) {
      setFormError("Discount value must be a positive number");
      return;
    }
    if (formData.type === "PERCENTAGE" && valNum > 100) {
      setFormError("Percentage discount cannot exceed 100%");
      return;
    }

    setActionLoading(true);
    setFormError(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: valNum,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minimumOrderAmount: formData.minimumOrderAmount ? Number(formData.minimumOrderAmount) : null,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        isActive: formData.isActive,
      };

      if (editingDiscount) {
        await discountService.adminUpdateDiscount(editingDiscount.id, payload);
        setActionMessage({ type: "success", text: `Coupon '${payload.code}' updated successfully.` });
        setEditingDiscount(null);
      } else {
        await discountService.adminCreateDiscount(payload);
        setActionMessage({ type: "success", text: `Coupon '${payload.code}' created successfully.` });
        setShowCreateModal(false);
      }

      await fetchDiscounts(pagination.page);
    } catch (err) {
      setFormError(err.message || "Failed to save discount coupon");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (d) => {
    setActionLoading(true);
    try {
      await discountService.adminToggleStatus(d.id, !d.isActive);
      setActionMessage({
        type: "success",
        text: `Coupon '${d.code}' ${!d.isActive ? "activated" : "deactivated"}.`,
      });
      await fetchDiscounts(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to toggle discount status" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;
    setActionLoading(true);
    try {
      await discountService.adminDeleteDiscount(deletingDiscount.id);
      setActionMessage({ type: "success", text: `Coupon '${deletingDiscount.code}' deleted permanently.` });
      setDeletingDiscount(null);
      await fetchDiscounts(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete discount coupon" });
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = discounts.filter((d) => d.isActive).length;

  return (
    <div className="admin-page-container">
      {/* Action Banner */}
      {actionMessage && (
        <div
          className={`admin-alert ${
            actionMessage.type === "success" ? "admin-alert-success" : "admin-alert-danger"
          }`}
          style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {actionMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">MediLink Platform Discounts</h1>
          <p className="admin-page-subtitle">
            Manage platform-wide promo codes, fixed/percentage discounts, minimum order thresholds, and expiry limits.
          </p>
        </div>

        <button onClick={handleOpenCreateModal} className="admin-btn admin-btn-primary">
          <Plus size={16} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Tag size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Coupons</span>
            <span className="admin-metric-val">{pagination.total}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#d1fae5", color: "#059669" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Active on Page</span>
            <span className="admin-metric-val">{activeCount}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Percent size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Percentage Discounts</span>
            <span className="admin-metric-val">
              {discounts.filter((d) => d.type === "PERCENTAGE").length}
            </span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#ede9fe", color: "#7c3aed" }}>
            <DollarSign size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Fixed Discounts</span>
            <span className="admin-metric-val">
              {discounts.filter((d) => d.type === "FIXED").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="#64748b" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>

          <button type="submit" className="admin-btn admin-btn-secondary">
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
              fetchDiscounts(1);
            }}
            className="admin-btn admin-btn-secondary"
            title="Reset filters"
          >
            <RefreshCw size={14} />
          </button>
        </form>
      </div>

      {/* Discounts Table */}
      <div className="admin-card" style={{ padding: "0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px" }} />
            <p>Loading discount coupons...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "30px", color: "#dc2626", textAlign: "center" }}>
            <AlertTriangle size={24} style={{ margin: "0 auto 8px" }} />
            <p>{error}</p>
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <Tag size={32} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              No discount coupons found
            </h3>
            <p style={{ fontSize: "13px" }}>Create a new platform coupon code to get started.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Max Cap</th>
                  <th>Min Subtotal</th>
                  <th>Validity Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "13px",
                          color: "#087ac7",
                          background: "#e0f2fe",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontFamily: "monospace",
                        }}
                      >
                        {d.code}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                        {d.type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                      </span>
                    </td>

                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        {d.type === "PERCENTAGE" ? `${d.value}%` : `₹${Number(d.value).toFixed(2)}`}
                      </strong>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: d.maxDiscount ? "#0f172a" : "#94a3b8" }}>
                        {d.maxDiscount ? `₹${Number(d.maxDiscount).toFixed(2)}` : "None"}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: d.minimumOrderAmount ? "#0f172a" : "#94a3b8" }}>
                        {d.minimumOrderAmount ? `₹${Number(d.minimumOrderAmount).toFixed(2)}` : "None"}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        {d.startsAt ? new Date(d.startsAt).toLocaleDateString() : "Always"}
                        {" → "}
                        {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : "No Expiry"}
                      </div>
                    </td>

                    <td>
                      <button
                        onClick={() => handleToggleStatus(d)}
                        disabled={actionLoading}
                        style={{
                          background: d.isActive ? "#d1fae5" : "#fee2e2",
                          color: d.isActive ? "#065f46" : "#991b1b",
                          border: "none",
                          borderRadius: "999px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title={`Click to ${d.isActive ? "deactivate" : "activate"}`}
                      >
                        <Power size={11} />
                        <span>{d.isActive ? "ACTIVE" : "INACTIVE"}</span>
                      </button>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          onClick={() => handleOpenEditModal(d)}
                          className="admin-btn-icon"
                          title="Edit discount coupon"
                        >
                          <Edit2 size={15} color="#087ac7" />
                        </button>
                        <button
                          onClick={() => setDeletingDiscount(d)}
                          className="admin-btn-icon"
                          title="Delete discount coupon"
                        >
                          <Trash2 size={15} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              borderTop: "1px solid #e2e8f0",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchDiscounts(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDiscounts(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Discount */}
      {(showCreateModal || editingDiscount) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => {
            setShowCreateModal(false);
            setEditingDiscount(null);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {editingDiscount ? `Edit Coupon: ${editingDiscount.code}` : "Create MediLink Platform Discount"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingDiscount(null);
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount}>
              {formError && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME20, SAVE50"
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="admin-input"
                    style={{ width: "100%", textTransform: "uppercase", fontWeight: "700" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Discount Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                    className="admin-select"
                    style={{ width: "100%" }}
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED AMOUNT (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Value {formData.type === "PERCENTAGE" ? "(%)" : "(₹)"} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formData.type === "PERCENTAGE" ? "100" : undefined}
                    required
                    placeholder={formData.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 50"}
                    value={formData.value}
                    onChange={(e) => setFormData((p) => ({ ...p, value: e.target.value }))}
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Optional max cap"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData((p) => ({ ...p, maxDiscount: e.target.value }))}
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Optional threshold"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData((p) => ({ ...p, minimumOrderAmount: e.target.value }))}
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Starts At
                  </label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData((p) => ({ ...p, startsAt: e.target.value }))}
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Ends At (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.endsAt}
                    onChange={(e) => setFormData((p) => ({ ...p, endsAt: e.target.value }))}
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  Active immediately for customer checkouts
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDiscount(null);
                  }}
                  disabled={actionLoading}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="admin-btn admin-btn-primary">
                  {actionLoading ? "Saving..." : editingDiscount ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingDiscount && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setDeletingDiscount(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#dc2626", marginBottom: "12px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Delete Discount Coupon?</h3>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to delete coupon <strong>{deletingDiscount.code}</strong>? This action is logged in audit trails and cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingDiscount(null)}
                disabled={actionLoading}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Deleting..." : "Delete Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDiscounts;
