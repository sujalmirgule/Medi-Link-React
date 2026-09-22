import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderService } from "../../services/order";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  RefreshCw,
  AlertTriangle,
  User,
  Phone,
  Calendar,
} from "lucide-react";

export default function PharmacyOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getPharmacyOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleAccept = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.acceptOrder(id);
      setSuccessMsg("Order accepted successfully.");
      await fetchOrderDetail();
    } catch (err) {
      setError(err.message || "Failed to accept order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPreparing = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.markPreparing(id);
      setSuccessMsg("Order moved to Preparing state.");
      await fetchOrderDetail();
    } catch (err) {
      setError(err.message || "Failed to update order state.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await orderService.markReady(id);
      setSuccessMsg("Order marked as Ready for pickup.");
      await fetchOrderDetail();
    } catch (err) {
      setError(err.message || "Failed to update order state.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      setRejectError("Rejection reason must be at least 3 characters.");
      return;
    }

    setActionLoading(true);
    setRejectError(null);
    try {
      await orderService.rejectOrder(id, rejectionReason.trim());
      setShowRejectModal(false);
      setSuccessMsg("Order rejected successfully. Reserved inventory has been released.");
      await fetchOrderDetail();
    } catch (err) {
      setRejectError(err.message || "Failed to reject order.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pharmacy-loading-state" style={{ minHeight: "50vh" }}>
        <RefreshCw className="pharmacy-spinner" size={32} />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="pharmacy-main-content">
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ margin: "24px 0" }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Error Loading Order:</strong> {error}
          </div>
        </div>
        <Link to="/pharmacy/orders" className="pharmacy-btn pharmacy-btn-secondary">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="pharmacy-main-content">
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          to="/pharmacy/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--ph-text-muted)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>

      {/* Notifications */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h1 className="pharmacy-page-title" style={{ margin: 0, fontFamily: "monospace" }}>
              Order #{order.orderNumber}
            </h1>
            <span
              className={`pharmacy-badge ${
                order.orderStatus === "READY_FOR_PICKUP"
                  ? "pharmacy-badge-verified"
                  : order.orderStatus === "REJECTED"
                  ? "pharmacy-badge-rejected"
                  : order.orderStatus === "ACCEPTED"
                  ? "pharmacy-badge-available"
                  : "pharmacy-badge-pending"
              }`}
            >
              {order.orderStatus}
            </span>
          </div>
          <p className="pharmacy-page-subtitle">
            Placed on {new Date(order.createdAt).toLocaleString()} &bull; Fulfillment:{" "}
            <strong>{order.fulfillmentType === "HOME_DELIVERY" ? "Home Delivery" : "Counter Pickup"}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {order.orderStatus === "PENDING" && (
            <>
              <button
                className="pharmacy-btn pharmacy-btn-success"
                onClick={handleAccept}
                disabled={actionLoading}
              >
                Accept Order
              </button>
              <button
                className="pharmacy-btn pharmacy-btn-danger"
                onClick={() => {
                  setRejectionReason("");
                  setRejectError(null);
                  setShowRejectModal(true);
                }}
                disabled={actionLoading}
              >
                Reject Order
              </button>
            </>
          )}

          {order.orderStatus === "ACCEPTED" && (
            <button
              className="pharmacy-btn pharmacy-btn-primary"
              onClick={handleMarkPreparing}
              disabled={actionLoading}
            >
              Mark Preparing
            </button>
          )}

          {order.orderStatus === "PREPARING" && (
            <button
              className="pharmacy-btn pharmacy-btn-primary"
              onClick={handleMarkReady}
              disabled={actionLoading}
            >
              Mark Ready for Pickup
            </button>
          )}

          <button className="pharmacy-btn pharmacy-btn-secondary" onClick={fetchOrderDetail} disabled={loading}>
            <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Rejection Notice */}
      {order.orderStatus === "REJECTED" && (
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "24px" }}>
          <XCircle size={20} />
          <div>
            <strong>Order Rejected:</strong> {order.cancellationReason || "No reason specified."}
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              All previously reserved inventory stock has been released back into available stock.
            </div>
          </div>
        </div>
      )}

      {/* Grid: Customer & Delivery Info */}
      <div className="pharmacy-grid pharmacy-grid-2" style={{ marginBottom: "24px" }}>
        {/* Customer Information Card */}
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} color="var(--ph-primary)" /> Customer Information
            </h3>
          </div>
          <div className="pharmacy-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Name</div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>
                  {order.customer?.firstName
                    ? `${order.customer.firstName} ${order.customer.lastName || ""}`
                    : "Customer"}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Phone Number</div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{order.customer?.phone || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Email</div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>{order.customer?.email}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Customer ID</div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--ph-text-muted)", marginTop: "2px" }}>
                  {order.customerId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Card */}
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={16} color="var(--ph-primary)" /> Fulfillment &amp; Delivery Details
            </h3>
          </div>
          <div className="pharmacy-card-body">
            {order.fulfillmentType === "HOME_DELIVERY" && order.deliveryAddress ? (
              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "var(--ph-text-main)", marginBottom: "4px" }}>
                  {order.deliveryAddress.label || "Home"} Address
                </div>
                <div style={{ color: "var(--ph-text-muted)", lineHeight: "1.4" }}>
                  {order.deliveryAddress.addressLine1}
                  {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                  <br />
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: "600", color: "var(--ph-text-main)", marginBottom: "4px" }}>
                  Counter Pickup
                </div>
                <div style={{ color: "var(--ph-text-muted)", lineHeight: "1.4" }}>
                  Customer will collect items in person at your pharmacy counter.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Items Table Card */}
      <div className="pharmacy-card">
        <div className="pharmacy-card-header">
          <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={16} color="var(--ph-primary)" /> Ordered Medicines &amp; Reserved Inventory
          </h3>
        </div>

        <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>Medicine Details</th>
                <th>Batch Reference</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: "600", color: "var(--ph-text-main)" }}>
                      {item.medicine?.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ph-text-muted)" }}>
                      {item.medicine?.genericName}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--ph-text-muted)" }}>
                      {item.inventoryBatchId ? `Batch ID: ${item.inventoryBatchId.substring(0, 8)}...` : "—"}
                    </span>
                  </td>

                  <td style={{ fontWeight: "600" }}>{item.quantity} units</td>

                  <td style={{ color: "var(--ph-text-muted)" }}>
                    &#8377;{Number(item.unitPrice).toFixed(2)}
                  </td>

                  <td style={{ textAlign: "right", fontWeight: "700", color: "var(--ph-text-main)" }}>
                    &#8377;{Number(item.totalPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--ph-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "32px", color: "var(--ph-text-muted)" }}>
            <span>Items Subtotal:</span>
            <span>&#8377;{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", gap: "32px", color: "var(--ph-text-muted)" }}>
            <span>Delivery Fee:</span>
            <span>{order.deliveryFee > 0 ? `₹${Number(order.deliveryFee).toFixed(2)}` : "FREE"}</span>
          </div>
          {Number(order.discountAmount || 0) > 0 && (
            <div style={{ display: "flex", gap: "32px", color: "#16a34a", fontWeight: "600" }}>
              <span>MediLink Platform Discount:</span>
              <span>-&#8377;{Number(order.discountAmount).toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: "32px",
              fontWeight: "700",
              fontSize: "16px",
              color: "var(--ph-primary)",
              borderTop: "1px dashed var(--ph-border)",
              paddingTop: "8px",
              marginTop: "4px",
            }}
          >
            <span>Total Order Amount:</span>
            <span>&#8377;{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="pharmacy-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title" style={{ color: "var(--ph-danger)" }}>
                Reject Customer Order #{order.orderNumber}
              </h3>
              <button className="pharmacy-modal-close" onClick={() => setShowRejectModal(false)}>
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

                <div className="pharmacy-form-group" style={{ marginBottom: "14px" }}>
                  <label className="pharmacy-label">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter reason for rejection..."
                    className="pharmacy-input"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>

                <div className="pharmacy-banner pharmacy-banner-warning">
                  <Clock size={16} />
                  <span style={{ fontSize: "12px" }}>
                    <strong>Stock Release Notice:</strong> Rejection will immediately return the reserved {order.items?.reduce((sum, i) => sum + i.quantity, 0)} medicine unit(s) back into available inventory.
                  </span>
                </div>
              </div>

              <div className="pharmacy-modal-footer">
                <button
                  type="button"
                  className="pharmacy-btn pharmacy-btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pharmacy-btn pharmacy-btn-danger"
                  disabled={actionLoading}
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
