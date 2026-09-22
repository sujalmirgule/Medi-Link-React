import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderService } from "../services/order";
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
  FileText,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export default function UserOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getCustomerOrder(id);
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

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={36} className="pharmacy-spinner" style={{ color: "#087ac7", marginBottom: "16px" }} />
        <p style={{ color: "#64748b" }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "16px", borderRadius: "10px", color: "#991b1b", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={20} />
          <span>{error || "Order not found."}</span>
        </div>
        <div style={{ marginTop: "20px" }}>
          <Link to="/user/orders" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#087ac7", textDecoration: "none", fontWeight: "600" }}>
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "PENDING", label: "Order Placed" },
    { key: "ACCEPTED", label: "Accepted by Pharmacy" },
    { key: "PREPARING", label: "Preparing Medicines" },
    { key: "READY_FOR_PICKUP", label: order.fulfillmentType === "HOME_DELIVERY" ? "Ready for Delivery" : "Ready for Pickup" },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "PENDING":
        return 0;
      case "ACCEPTED":
        return 1;
      case "PREPARING":
        return 2;
      case "READY_FOR_PICKUP":
      case "ASSIGNED":
      case "PICKED_UP":
      case "OUT_FOR_DELIVERY":
      case "DELIVERED":
      case "COMPLETED":
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIndex = getStepIndex(order.orderStatus);

  return (
    <div className="user-dashboard">
      <header className="user-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/user/orders")}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <ArrowLeft size={18} /> My Orders
          </button>
          <img src={logo} alt="MediLink" style={{ height: "32px" }} />
        </div>

        <div>
          <button
            onClick={fetchOrderDetail}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh Status
          </button>
        </div>
      </header>

      <main className="user-content" style={{ maxWidth: "840px", margin: "30px auto", padding: "0 20px" }}>
        {/* Rejection Banner */}
        {order.orderStatus === "REJECTED" && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991b1b", fontWeight: "700", fontSize: "16px" }}>
              <XCircle size={20} /> Order Rejected by Pharmacy
            </div>
            <p style={{ margin: "8px 0 0", color: "#7f1d1d", fontSize: "13px", lineHeight: "1.5" }}>
              <strong>Reason:</strong> {order.cancellationReason || "The pharmacy was unable to fulfill this order."}
            </p>
            <p style={{ margin: "4px 0 0", color: "#991b1b", fontSize: "12px" }}>
              All previously reserved stock has been released. No charges have been made.
            </p>
          </div>
        )}

        {/* Top Header Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>Order Tracking</span>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "4px 0 2px", fontFamily: "monospace" }}>
                #{order.orderNumber}
              </h1>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Placed on {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <span
                style={{
                  background: order.orderStatus === "REJECTED" ? "#fee2e2" : order.orderStatus === "READY_FOR_PICKUP" ? "#ecfdf5" : "#fef3c7",
                  color: order.orderStatus === "REJECTED" ? "#b91c1c" : order.orderStatus === "READY_FOR_PICKUP" ? "#047857" : "#b45309",
                  border: `1px solid ${order.orderStatus === "REJECTED" ? "#fca5a5" : order.orderStatus === "READY_FOR_PICKUP" ? "#a7f3d0" : "#fde68a"}`,
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Clock size={14} /> {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Timeline (if not rejected) */}
          {order.orderStatus !== "REJECTED" && (
            <div style={{ marginTop: "32px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, position: "relative" }}>
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.key} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: isDone ? "#10b981" : "#e2e8f0",
                          color: isDone ? "#ffffff" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontWeight: "700",
                          fontSize: "13px",
                          boxShadow: isCurrent ? "0 0 0 4px #d1fae5" : undefined,
                        }}
                      >
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: isCurrent ? "700" : "500",
                          color: isCurrent ? "#0f172a" : "#64748b",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pharmacy & Location Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
              <Store size={15} color="#087ac7" /> Pharmacy Provider
            </div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#0f172a" }}>
              {order.pharmacy?.name}
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              {order.pharmacy?.address}, {order.pharmacy?.city}
            </div>
            <div style={{ fontSize: "12px", color: "#087ac7", marginTop: "4px" }}>
              Contact: {order.pharmacy?.phone}
            </div>
          </div>

          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>
              <MapPin size={15} color="#087ac7" /> Fulfillment &amp; Address
            </div>
            {order.fulfillmentType === "HOME_DELIVERY" && order.deliveryAddress ? (
              <>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                  Home Delivery ({order.deliveryAddress.label || "Home"})
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
                  Pharmacy Counter Pickup
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                  Collect directly at the pharmacy counter with your order ID #{order.orderNumber}.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ordered Items Table */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px" }}>
            Ordered Medicines
          </h3>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "8px 0" }}>Medicine</th>
                <th style={{ padding: "8px", textAlign: "center" }}>Quantity</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Unit Price</th>
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

          {/* Pricing Total */}
          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "16px", paddingTop: "16px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#64748b" }}>
              <span>Subtotal</span>
              <span>&#8377;{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#64748b" }}>
              <span>Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `₹${Number(order.deliveryFee).toFixed(2)}` : "FREE"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px dashed #cbd5e1", fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>
              <span>Total Paid</span>
              <span style={{ color: "#087ac7" }}>&#8377;{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
