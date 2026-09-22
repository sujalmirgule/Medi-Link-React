import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/order";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Store,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";

export default function PharmacyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Rejection Modal State
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const [rejectError, setRejectError] = useState(null);

  // Status transition loader
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getPharmacyOrders({
        page,
        limit: 10,
        status: statusFilter,
      });
      setOrders(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleAcceptOrder = async (orderId) => {
    setActionLoadingId(orderId);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.acceptOrder(orderId);
      setSuccessMsg("Order accepted successfully.");
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to accept order.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPreparing = async (orderId) => {
    setActionLoadingId(orderId);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.markPreparing(orderId);
      setSuccessMsg("Order moved to Preparing state.");
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    setActionLoadingId(orderId);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.markReady(orderId);
      setSuccessMsg("Order marked as Ready for pickup.");
      await fetchOrders();
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (orderId) => {
    setRejectingOrderId(orderId);
    setRejectionReason("");
    setRejectError(null);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      setRejectError("Rejection reason must be at least 3 characters long.");
      return;
    }

    setSubmittingReject(true);
    setRejectError(null);
    try {
      await orderService.rejectOrder(rejectingOrderId, rejectionReason.trim());
      setSuccessMsg("Order rejected successfully. Reserved inventory stock has been released.");
      setRejectingOrderId(null);
      await fetchOrders();
    } catch (err) {
      setRejectError(err.message || "Failed to reject order.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return { label: "Pending", className: "pharmacy-badge-pending" };
      case "ACCEPTED":
        return { label: "Accepted", className: "pharmacy-badge-available" };
      case "PREPARING":
        return { label: "Preparing", className: "pharmacy-badge-expiring" };
      case "READY_FOR_PICKUP":
        return { label: "Ready for Pickup", className: "pharmacy-badge-verified" };
      case "REJECTED":
        return { label: "Rejected", className: "pharmacy-badge-rejected" };
      default:
        return { label: status, className: "pharmacy-badge-pending" };
    }
  };

  return (
    <div className="pharmacy-main-content">
      {/* Status Notifications */}
      {successMsg && (
        <div className="pharmacy-banner pharmacy-banner-success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}
      {error && (
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "20px" }}>
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Header */}
      <div className="pharmacy-page-header">
        <div>
          <h1 className="pharmacy-page-title">Customer Order Management</h1>
          <p className="pharmacy-page-subtitle">
            Review incoming medicine orders, allocate physical stock, accept or reject requests, and track fulfillment status.
          </p>
        </div>

        <div>
          <button className="pharmacy-btn pharmacy-btn-secondary" onClick={fetchOrders} disabled={loading}>
            <RefreshCw size={15} className={loading ? "pharmacy-spinner" : ""} /> Refresh Orders
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Orders" },
          { id: "PENDING", label: "Pending Review" },
          { id: "ACCEPTED", label: "Accepted" },
          { id: "PREPARING", label: "Preparing" },
          { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
          { id: "REJECTED", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={`pharmacy-btn pharmacy-btn-sm ${
              statusFilter === tab.id ? "pharmacy-btn-primary" : "pharmacy-btn-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table Card */}
      <div className="pharmacy-card">
        <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
          {loading ? (
            <div className="pharmacy-loading-state" style={{ minHeight: "300px" }}>
              <RefreshCw className="pharmacy-spinner" size={28} />
              <p>Loading pharmacy orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <ShoppingBag size={40} color="var(--ph-text-subtle)" style={{ marginBottom: "12px", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "var(--ph-text-main)" }}>
                No orders found
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--ph-text-muted)" }}>
                {statusFilter !== "all"
                  ? "No orders currently match the selected status filter."
                  : "No customer orders have been received yet."}
              </p>
            </div>
          ) : (
            <table className="pharmacy-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Medicines Ordered</th>
                  <th>Fulfillment</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Placed At</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = getStatusBadge(order.orderStatus);
                  const isActionLoading = actionLoadingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--ph-text-main)" }}>
                        #{order.orderNumber}
                      </td>

                      <td>
                        <div style={{ fontWeight: "600", color: "var(--ph-text-main)" }}>
                          {order.customer?.firstName
                            ? `${order.customer.firstName} ${order.customer.lastName || ""}`
                            : "Customer"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--ph-text-muted)" }}>
                          {order.customer?.phone || order.customer?.email}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: "600" }}>
                          {order.items?.length || 0} item(s)
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--ph-text-muted)" }}>
                          {order.items?.map((i) => `${i.medicine?.name} (${i.quantity})`).join(", ")}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {order.fulfillmentType === "HOME_DELIVERY" ? (
                            <Truck size={13} color="var(--ph-primary)" />
                          ) : (
                            <Store size={13} color="var(--ph-success)" />
                          )}
                          {order.fulfillmentType === "HOME_DELIVERY" ? "Delivery" : "Pickup"}
                        </span>
                      </td>

                      <td style={{ fontWeight: "700", color: "var(--ph-primary)" }}>
                        &#8377;{Number(order.totalAmount).toFixed(2)}
                      </td>

                      <td>
                        <span className={`pharmacy-badge ${status.className}`}>
                          {status.label}
                        </span>
                      </td>

                      <td style={{ fontSize: "12px", color: "var(--ph-text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {/* Pending Actions */}
                          {order.orderStatus === "PENDING" && (
                            <>
                              <button
                                className="pharmacy-btn pharmacy-btn-success pharmacy-btn-sm"
                                onClick={() => handleAcceptOrder(order.id)}
                                disabled={isActionLoading}
                                title="Accept order"
                              >
                                Accept
                              </button>
                              <button
                                className="pharmacy-btn pharmacy-btn-danger pharmacy-btn-sm"
                                onClick={() => openRejectModal(order.id)}
                                disabled={isActionLoading}
                                title="Reject order and release reserved stock"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Accepted Action */}
                          {order.orderStatus === "ACCEPTED" && (
                            <button
                              className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm"
                              onClick={() => handleMarkPreparing(order.id)}
                              disabled={isActionLoading}
                            >
                              Mark Preparing
                            </button>
                          )}

                          {/* Preparing Action */}
                          {order.orderStatus === "PREPARING" && (
                            <button
                              className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm"
                              onClick={() => handleMarkReady(order.id)}
                              disabled={isActionLoading}
                            >
                              Mark Ready
                            </button>
                          )}

                          <Link
                            to={`/pharmacy/orders/${order.id}`}
                            className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                            title="Inspect order details"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: "1px solid var(--ph-border)",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--ph-text-muted)" }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Order Modal */}
      {rejectingOrderId && (
        <div className="pharmacy-modal-overlay" onClick={() => setRejectingOrderId(null)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title" style={{ color: "var(--ph-danger)" }}>
                Reject Customer Order
              </h3>
              <button className="pharmacy-modal-close" onClick={() => setRejectingOrderId(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <div className="pharmacy-modal-body">
                {rejectError && (
                  <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "14px" }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: "12px" }}>{rejectError}</span>
                  </div>
                )}

                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--ph-text-muted)" }}>
                  Please provide a reason for rejecting this order. The customer will be notified of this reason.
                </p>

                <div className="pharmacy-form-group" style={{ marginBottom: "14px" }}>
                  <label className="pharmacy-label">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Physical inventory discrepancy: Requested batch was damaged or unavailable."
                    className="pharmacy-input"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                <div className="pharmacy-banner pharmacy-banner-warning">
                  <Clock size={16} />
                  <span style={{ fontSize: "12px" }}>
                    <strong>Stock Release Notice:</strong> Confirming rejection will immediately and transactionally
                    release all reserved inventory units back into available stock.
                  </span>
                </div>
              </div>

              <div className="pharmacy-modal-footer">
                <button
                  type="button"
                  className="pharmacy-btn pharmacy-btn-secondary"
                  onClick={() => setRejectingOrderId(null)}
                  disabled={submittingReject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pharmacy-btn pharmacy-btn-danger"
                  disabled={submittingReject}
                >
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
