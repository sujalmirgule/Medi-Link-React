import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import { orderService } from "../services/order";
import {
  CheckCircle2,
  Package,
  Store,
  Truck,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  FileText,
  MapPin,
  Home,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./reservation.css";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  const orderId = searchParams.get("orderId") || location.state?.order?.id;

  useEffect(() => {
    if (!order && orderId) {
      setLoading(true);
      orderService
        .getCustomerOrder(orderId)
        .then((data) => setOrder(data))
        .catch((err) => setError(err.message || "Failed to load order confirmation details."))
        .finally(() => setLoading(false));
    } else if (!orderId && !order) {
      setError("No order details provided.");
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={36} className="pharmacy-spinner" style={{ color: "#087ac7", marginBottom: "16px" }} />
        <p style={{ color: "#64748b", fontSize: "15px" }}>Loading your order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="reservation-page">
        <header className="reservation-header">
          <div className="reservation-header-inner">
            <Link to="/user/dashboard" className="reservation-back-btn">
              <Home size={18} /> Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="reservation-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
          <h2>Order Not Found</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            {error || "Could not retrieve order details."}
          </p>
          <Link to="/medicines" className="confirm-reservation-btn" style={{ display: "inline-flex", textDecoration: "none", width: "auto", padding: "12px 24px" }}>
            Browse Medicines
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="reservation-page">
      {/* Header */}
      <header className="reservation-header">
        <div className="reservation-header-inner">
          <button className="reservation-back-btn" onClick={() => navigate("/user/orders")}>
            View All Orders
          </button>
          <img src={logo} alt="MediLink" style={{ height: "32px" }} />
          <div className="secure-check">
            <ShieldCheck size={17} />
            Verified
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="reservation-container" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Success Banner */}
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "14px",
            padding: "24px",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <CheckCircle2 size={48} color="#10b981" style={{ margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#065f46", margin: "0 0 6px" }}>
            Order Placed Successfully!
          </h1>
          <p style={{ fontSize: "14px", color: "#047857", margin: "0 0 14px" }}>
            Your medicine order has been placed with the pharmacy. Stock has been reserved.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              padding: "6px 14px",
              fontFamily: "monospace",
              fontSize: "14px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            Order #{order.orderNumber}
          </div>
        </div>

        {/* Order Details Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          {/* Top Status Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Order Status</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#b45309",
                    border: "1px solid #fde68a",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={12} /> {order.orderStatus}
                </span>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  &bull; Awaiting pharmacy acceptance
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Fulfillment Mode</span>
              <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                {order.fulfillmentType === "HOME_DELIVERY" ? <Truck size={16} color="#087ac7" /> : <Store size={16} color="#087ac7" />}
                {order.fulfillmentType === "HOME_DELIVERY" ? "Home Delivery" : "Pharmacy Pickup"}
              </div>
            </div>
          </div>

          {/* Pharmacy & Delivery Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                <Store size={14} color="#087ac7" /> Assigned Pharmacy
              </div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>
                {order.pharmacy?.name}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                {order.pharmacy?.address}, {order.pharmacy?.city}
              </div>
              <div style={{ fontSize: "12px", color: "#087ac7", marginTop: "4px" }}>
                Phone: {order.pharmacy?.phone}
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
                <MapPin size={14} color="#087ac7" /> {order.fulfillmentType === "HOME_DELIVERY" ? "Delivery Destination" : "Pickup Location"}
              </div>
              {order.fulfillmentType === "HOME_DELIVERY" && order.deliveryAddress ? (
                <>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                    {order.deliveryAddress.label || "Home"} Address
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    {order.deliveryAddress.addressLine1}
                    {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                    Counter Pickup
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                    Collect at pharmacy counter once marked READY_FOR_PICKUP.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Items Summary Table */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", textTransform: "uppercase", color: "#64748b", marginBottom: "12px" }}>
              Reserved Medicines
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "8px 0" }}>Medicine</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>Quantity</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Price / Unit</th>
                  <th style={{ padding: "8px 0", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 0" }}>
                      <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.medicine?.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.medicine?.genericName}</div>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: "600" }}>
                      {item.quantity} units
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right", color: "#64748b" }}>
                      &#8377;{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                      &#8377;{Number(item.totalPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#64748b" }}>
              <span>Items Subtotal</span>
              <span>&#8377;{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#64748b" }}>
              <span>Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `₹${Number(order.deliveryFee).toFixed(2)}` : "FREE"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "10px",
                borderTop: "1px dashed #cbd5e1",
                fontWeight: "700",
                fontSize: "17px",
                color: "#0f172a",
              }}
            >
              <span>Total Amount</span>
              <span style={{ color: "#087ac7" }}>&#8377;{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/user/orders")}
            className="confirm-reservation-btn"
            style={{ display: "inline-flex", width: "auto", padding: "12px 24px", gap: "8px" }}
          >
            Track in My Orders <ArrowRight size={16} />
          </button>
          <Link
            to="/medicines"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "12px 20px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              color: "#0f172a",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Continue Browsing
          </Link>
        </div>
      </main>
    </div>
  );
}
