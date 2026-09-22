import { useState, useEffect, useCallback } from "react";
import { reviewService } from "../../services/review";
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Store,
  Pill,
  Truck,
} from "lucide-react";

export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all"); // all, medicine, pharmacy, delivery
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all, visible, hidden

  // Modals / Actions
  const [selectedReview, setSelectedReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchReviews = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search.trim() || undefined,
          minRating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
          maxRating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
          isHidden:
            visibilityFilter === "all"
              ? undefined
              : visibilityFilter === "hidden"
              ? true
              : false,
        };

        const res = await reviewService.adminListReviews(params);
        let items = res.items || [];

        // Apply client entity type filter if chosen
        if (entityFilter === "medicine") {
          items = items.filter((r) => Boolean(r.medicineId));
        } else if (entityFilter === "pharmacy") {
          items = items.filter((r) => Boolean(r.pharmacyId));
        } else if (entityFilter === "delivery") {
          items = items.filter((r) => Boolean(r.deliveryPartnerId));
        }

        setReviews(items);
        setPagination(res.pagination || { page: 1, limit: 10, total: items.length, totalPages: 1 });
      } catch (err) {
        setError(err.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, search, entityFilter, ratingFilter, visibilityFilter]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [entityFilter, ratingFilter, visibilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviews(1);
  };

  const handleToggleHide = async (r) => {
    setActionLoading(true);
    try {
      await reviewService.adminHideReview(r.id, !r.isHidden);
      setActionMessage({
        type: "success",
        text: `Review successfully ${!r.isHidden ? "hidden from public store" : "unhidden"}.`,
      });
      await fetchReviews(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to moderate review" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    setActionLoading(true);
    try {
      await reviewService.adminDeleteReview(deletingReview.id);
      setActionMessage({ type: "success", text: "Review permanently deleted with audit logging." });
      setDeletingReview(null);
      await fetchReviews(pagination.page);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete review" });
    } finally {
      setActionLoading(false);
    }
  };

  const totalRatingSum = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
  const avgRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : "0.0";
  const hiddenCount = reviews.filter((r) => r.isHidden).length;

  return (
    <div className="admin-page-container">
      {/* Action Notification */}
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
          <h1 className="admin-page-title">Customer Reviews & Ratings Moderation</h1>
          <p className="admin-page-subtitle">
            Inspect verified customer feedback, manage soft-moderation (hide/unhide), and maintain marketplace trust.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <MessageSquare size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Total Reviews Listed</span>
            <span className="admin-metric-val">{pagination.total}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Star size={20} fill="#d97706" />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Avg Rating on Page</span>
            <span className="admin-metric-val">★ {avgRating}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#d1fae5", color: "#059669" }}>
            <Eye size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Public Visible</span>
            <span className="admin-metric-val">{reviews.length - hiddenCount}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-wrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <EyeOff size={20} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Hidden / Moderated</span>
            <span className="admin-metric-val">{hiddenCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              placeholder="Search comments, customer email, target name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="#64748b" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Targets</option>
              <option value="medicine">Medicines Only</option>
              <option value="pharmacy">Pharmacies Only</option>
              <option value="delivery">Delivery Partners Only</option>
            </select>
          </div>

          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">★★★★★ 5 Stars</option>
              <option value="4">★★★★☆ 4 Stars</option>
              <option value="3">★★★☆☆ 3 Stars</option>
              <option value="2">★★☆☆☆ 2 Stars</option>
              <option value="1">★☆☆☆☆ 1 Star</option>
            </select>
          </div>

          <div>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Visibilities</option>
              <option value="visible">Visible Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>

          <button type="submit" className="admin-btn admin-btn-secondary">
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setEntityFilter("all");
              setRatingFilter("all");
              setVisibilityFilter("all");
              fetchReviews(1);
            }}
            className="admin-btn admin-btn-secondary"
            title="Reset filters"
          >
            <RefreshCw size={14} />
          </button>
        </form>
      </div>

      {/* Reviews Table */}
      <div className="admin-card" style={{ padding: "0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px" }} />
            <p>Loading reviews...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "30px", color: "#dc2626", textAlign: "center" }}>
            <AlertTriangle size={24} style={{ margin: "0 auto 8px" }} />
            <p>{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <MessageSquare size={32} style={{ margin: "0 auto 12px", color: "#cbd5e1" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              No reviews found
            </h3>
            <p style={{ fontSize: "13px" }}>No verified customer reviews match the active criteria.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Target Type</th>
                  <th>Target Entity</th>
                  <th>Rating</th>
                  <th>Customer</th>
                  <th>Order Ref</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const targetType = r.medicineId
                    ? "Medicine"
                    : r.pharmacyId
                    ? "Pharmacy"
                    : "Delivery Partner";
                  const targetName =
                    r.medicine?.name ||
                    r.pharmacy?.name ||
                    (r.deliveryPartner ? `Partner #${r.deliveryPartner.id.substring(0, 6)}` : "Partner");

                  return (
                    <tr key={r.id}>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background:
                              targetType === "Medicine"
                                ? "#e0f2fe"
                                : targetType === "Pharmacy"
                                ? "#ede9fe"
                                : "#fef3c7",
                            color:
                              targetType === "Medicine"
                                ? "#0284c7"
                                : targetType === "Pharmacy"
                                ? "#7c3aed"
                                : "#d97706",
                          }}
                        >
                          {targetType === "Medicine" ? (
                            <Pill size={11} />
                          ) : targetType === "Pharmacy" ? (
                            <Store size={11} />
                          ) : (
                            <Truck size={11} />
                          )}
                          {targetType}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "13px" }}>{targetName}</strong>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b" }}>
                          <Star size={14} fill="#f59e0b" />
                          <strong style={{ fontSize: "13px" }}>{r.rating}</strong>
                        </div>
                      </td>

                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                            {r.customer?.firstName
                              ? `${r.customer.firstName} ${r.customer.lastName || ""}`.trim()
                              : "Verified Customer"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{r.customer?.email}</div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#087ac7" }}>
                          {r.orderNumber || "—"}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#334155",
                            maxWidth: "240px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={r.comment || "No comment provided"}
                        >
                          {r.comment || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No text</span>}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: r.isHidden ? "#fee2e2" : "#d1fae5",
                            color: r.isHidden ? "#991b1b" : "#065f46",
                          }}
                        >
                          {r.isHidden ? "HIDDEN" : "VISIBLE"}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedReview(r)}
                            className="admin-btn-icon"
                            title="Inspect full review"
                          >
                            <Eye size={15} color="#087ac7" />
                          </button>
                          <button
                            onClick={() => handleToggleHide(r)}
                            disabled={actionLoading}
                            className="admin-btn-icon"
                            title={r.isHidden ? "Unhide review" : "Soft-hide review from public view"}
                          >
                            {r.isHidden ? <Eye size={15} color="#059669" /> : <EyeOff size={15} color="#d97706" />}
                          </button>
                          <button
                            onClick={() => setDeletingReview(r)}
                            disabled={actionLoading}
                            className="admin-btn-icon"
                            title="Delete review permanently"
                          >
                            <Trash2 size={15} color="#dc2626" />
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
                onClick={() => fetchReviews(pagination.page - 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchReviews(pagination.page + 1)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Inspect Review Details */}
      {selectedReview && (
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
          onClick={() => setSelectedReview(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Review Details</h3>
              <button
                onClick={() => setSelectedReview(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Rating</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b", fontWeight: 700 }}>
                  <Star size={16} fill="#f59e0b" />
                  <span>{selectedReview.rating} / 5 Stars</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Target Entity</span>
                <strong style={{ color: "#0f172a" }}>
                  {selectedReview.medicine?.name || selectedReview.pharmacy?.name || "Delivery Partner"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Customer</span>
                <span style={{ color: "#0f172a" }}>{selectedReview.customer?.email}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Order Reference</span>
                <span style={{ fontFamily: "monospace", color: "#087ac7", fontWeight: 600 }}>
                  {selectedReview.orderNumber || selectedReview.orderId}
                </span>
              </div>

              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <span style={{ color: "#64748b", display: "block", marginBottom: "4px" }}>Comment</span>
                <p style={{ margin: 0, color: "#0f172a", lineHeight: 1.5, background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                  {selectedReview.comment || "No comment text."}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Visibility</span>
                <span style={{ fontWeight: 700, color: selectedReview.isHidden ? "#dc2626" : "#059669" }}>
                  {selectedReview.isHidden ? "Hidden from Public" : "Visible Publicly"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setSelectedReview(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Review Confirmation */}
      {deletingReview && (
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
          onClick={() => setDeletingReview(null)}
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
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0 }}>Delete Review Permanently?</h3>
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to delete this {deletingReview.rating}-star review? This action will remove it from aggregate ratings and log an audit record.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingReview(null)}
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
                {actionLoading ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
