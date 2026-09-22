import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { orderService } from "../services/order";
import { paymentService } from "../services/payment";
import { reviewService } from "../services/review";
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
  ShieldCheck,
  Navigation,
  User,
  Phone,
  CreditCard,
  Wallet,
  BadgeCheck,
  Banknote,
  Star,
  MessageSquare,
  X,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export default function UserOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment state
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("COD");
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Review & Rating state
  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    type: "medicine", // "medicine" | "pharmacy" | "delivery"
    targetId: "",
    targetName: "",
    rating: 5,
    comment: "",
    isSubmitting: false,
    error: null,
  });

  const fetchOrderDetail = useCallback(async () => {
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
  }, [id]);

  const fetchPayment = useCallback(async () => {
    try {
      const p = await paymentService.getPaymentForOrder(id);
      setPayment(p);
      if (p?.status === "PAID") setPaymentSuccess(true);
    } catch (_) {
      // No payment yet — that's fine
      setPayment(null);
    }
  }, [id]);

  const fetchReviewStatus = useCallback(async () => {
    try {
      const status = await reviewService.getOrderReviewStatus(id);
      setReviewStatus(status);
    } catch (_) {
      setReviewStatus(null);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
    fetchPayment();
    fetchReviewStatus();
  }, [id, fetchOrderDetail, fetchPayment, fetchReviewStatus]);

  const handleInitiatePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const p = await paymentService.createPaymentIntent(id, selectedMethod);
      setPayment(p);
    } catch (err) {
      setPaymentError(err.message || "Failed to initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!payment) return;
    setVerifying(true);
    setPaymentError(null);
    try {
      const updated = await paymentService.verifyPayment(payment.id, {
        simulateStatus: "PAID",
      });
      setPayment(updated);
      setPaymentSuccess(true);
      fetchOrderDetail(); // Refresh order status
    } catch (err) {
      setPaymentError(err.message || "Payment verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenReviewModal = (type, targetId, targetName) => {
    setReviewModal({
      isOpen: true,
      type,
      targetId,
      targetName,
      rating: 5,
      comment: "",
      isSubmitting: false,
      error: null,
    });
  };

  const handleCloseReviewModal = () => {
    setReviewModal((prev) => ({ ...prev, isOpen: false, error: null }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal.rating || reviewModal.rating < 1 || reviewModal.rating > 5) {
      setReviewModal((prev) => ({ ...prev, error: "Please select a rating between 1 and 5 stars." }));
      return;
    }

    setReviewModal((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const payload = {
        orderId: id,
        rating: reviewModal.rating,
        comment: reviewModal.comment?.trim() || null,
        ...(reviewModal.type === "medicine" && { medicineId: reviewModal.targetId }),
        ...(reviewModal.type === "pharmacy" && { pharmacyId: reviewModal.targetId }),
        ...(reviewModal.type === "delivery" && { deliveryPartnerId: reviewModal.targetId }),
      };

      await reviewService.createReview(payload);
      handleCloseReviewModal();
      await fetchReviewStatus();
    } catch (err) {
      setReviewModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.message || "Failed to submit review. Please try again.",
      }));
    }
  };

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

  const isHomeDelivery = order.fulfillmentType === "HOME_DELIVERY";

  const steps = isHomeDelivery
    ? [
        { key: "PENDING", label: "Placed" },
        { key: "ACCEPTED", label: "Accepted" },
        { key: "PREPARING", label: "Preparing" },
        { key: "READY_FOR_PICKUP", label: "Ready" },
        { key: "ASSIGNED", label: "Assigned" },
        { key: "PICKED_UP", label: "Picked Up" },
        { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
        { key: "DELIVERED", label: "Delivered" },
      ]
    : [
        { key: "PENDING", label: "Order Placed" },
        { key: "ACCEPTED", label: "Accepted by Pharmacy" },
        { key: "PREPARING", label: "Preparing Medicines" },
        { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
        { key: "COMPLETED", label: "Completed" },
      ];

  const getStepIndex = (status) => {
    if (isHomeDelivery) {
      switch (status) {
        case "PENDING":
          return 0;
        case "ACCEPTED":
          return 1;
        case "PREPARING":
          return 2;
        case "READY_FOR_PICKUP":
          return 3;
        case "ASSIGNED":
          return 4;
        case "PICKED_UP":
          return 5;
        case "OUT_FOR_DELIVERY":
          return 6;
        case "DELIVERED":
        case "COMPLETED":
          return 7;
        default:
          return -1;
      }
    } else {
      switch (status) {
        case "PENDING":
          return 0;
        case "ACCEPTED":
          return 1;
        case "PREPARING":
          return 2;
        case "READY_FOR_PICKUP":
          return 3;
        case "COMPLETED":
          return 4;
        default:
          return -1;
      }
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

          {/* Delivery Verification OTP Card (Shown when OUT_FOR_DELIVERY) */}
          {order.deliveryOtp && (
            <div
              style={{
                marginTop: "24px",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                borderRadius: "12px",
                padding: "20px 24px",
                color: "#ffffff",
                boxShadow: "0 8px 20px rgba(2, 132, 199, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={20} />
                  <span style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Delivery Verification OTP
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#e0f2fe" }}>
                  Please provide this 6-digit confirmation code to your delivery partner upon arrival.
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px dashed rgba(255, 255, 255, 0.6)",
                  borderRadius: "10px",
                  padding: "8px 20px",
                  fontSize: "26px",
                  fontWeight: 850,
                  letterSpacing: "0.25em",
                  fontFamily: "monospace",
                }}
              >
                {order.deliveryOtp}
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

        {/* Delivery Partner Tracking Card (If assigned) */}
        {order.delivery && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "20px 24px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#0284c7", textTransform: "uppercase", marginBottom: "12px" }}>
              <Truck size={16} /> Delivery Partner Telemetry
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Partner Name</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                  {order.delivery.deliveryPartner?.fullName || "Assigned Partner"}
                </div>
                {order.delivery.deliveryPartner?.phone && (
                  <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Phone size={12} /> {order.delivery.deliveryPartner.phone}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Vehicle Info</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                  {order.delivery.deliveryPartner?.vehicleNumber || "Registration On File"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {order.delivery.deliveryPartner?.vehicleType}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Live Status</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#0284c7", marginTop: "2px" }}>
                  {order.delivery.status}
                </div>
                {order.delivery.currentLatitude && order.delivery.currentLongitude && (
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Navigation size={12} color="#10b981" /> Telemetry active
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Event Timeline */}
            {order.delivery.events && order.delivery.events.length > 0 && (
              <div style={{ marginTop: "18px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
                  Tracking Milestones
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {order.delivery.events.map((evt) => (
                    <div key={evt.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }} />
                      <strong style={{ color: "#0f172a" }}>{evt.status}</strong>
                      <span style={{ color: "#64748b" }}>
                        — {new Date(evt.timestamp || evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {evt.notes && <span style={{ color: "#64748b" }}>({evt.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
            {Number(order.discountAmount || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#059669", fontWeight: 600 }}>
                <span>Platform Discount</span>
                <span>-&#8377;{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#64748b" }}>
              <span>Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `₹${Number(order.deliveryFee).toFixed(2)}` : "FREE"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px dashed #cbd5e1", fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>
              <span>Total Amount</span>
              <span style={{ color: "#087ac7" }}>&#8377;{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ───── Customer Reviews & Ratings Panel (On Completed / Delivered Orders) ───── */}
        {(order.orderStatus === "COMPLETED" || order.orderStatus === "DELIVERED") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              marginTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Star size={18} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Order Reviews & Ratings
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Medicines in Order */}
              {order.items?.map((item) => {
                const medId = item.pharmacyMedicine?.medicine?.id || item.medicine?.id;
                const isReviewed = reviewStatus?.reviewedMedicineIds?.includes(medId);
                const existingReview = reviewStatus?.reviews?.find((r) => r.medicineId === medId);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        {item.medicine?.name || item.pharmacyMedicine?.medicine?.name || "Purchased Medicine"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {item.medicine?.genericName || "Medicine Review"}
                      </div>
                    </div>

                    {isReviewed ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#d1fae5", color: "#065f46", padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                        <CheckCircle2 size={14} />
                        <span>Reviewed (★ {existingReview?.rating || 5})</span>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleOpenReviewModal(
                            "medicine",
                            medId,
                            item.medicine?.name || item.pharmacyMedicine?.medicine?.name || "Medicine"
                          )
                        }
                        style={{
                          background: "#087ac7",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "7px 16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Star size={14} fill="#fff" /> Rate Medicine
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Pharmacy Rating */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                    {order.pharmacy?.name || "Fulfilling Pharmacy"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Pharmacy service & packaging rating
                  </div>
                </div>

                {reviewStatus?.pharmacyReviewed ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#d1fae5", color: "#065f46", padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    <CheckCircle2 size={14} />
                    <span>Reviewed (★ {reviewStatus.reviews?.find((r) => r.pharmacyId === order.pharmacyId)?.rating || 5})</span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleOpenReviewModal("pharmacy", order.pharmacyId, order.pharmacy?.name || "Pharmacy")
                    }
                    style={{
                      background: "#087ac7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "7px 16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Star size={14} fill="#fff" /> Rate Pharmacy
                  </button>
                )}
              </div>

              {/* Delivery Partner Rating (If home delivery & partner assigned) */}
              {order.fulfillmentType === "HOME_DELIVERY" && order.delivery?.deliveryPartnerId && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                      {order.delivery.deliveryPartner?.fullName || "Delivery Partner"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Delivery speed & partner conduct rating
                    </div>
                  </div>

                  {reviewStatus?.deliveryReviewed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#d1fae5", color: "#065f46", padding: "6px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                      <CheckCircle2 size={14} />
                      <span>Reviewed (★ {reviewStatus.reviews?.find((r) => r.deliveryPartnerId === order.delivery.deliveryPartnerId)?.rating || 5})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleOpenReviewModal(
                          "delivery",
                          order.delivery.deliveryPartnerId,
                          order.delivery.deliveryPartner?.fullName || "Delivery Partner"
                        )
                      }
                      style={{
                        background: "#087ac7",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "7px 16px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Star size={14} fill="#fff" /> Rate Delivery
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───── Payment Panel ───── */}
        {order.orderStatus !== "REJECTED" && order.orderStatus !== "CANCELLED" && (
          <div
            style={{
              background: paymentSuccess
                ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                : "#ffffff",
              border: paymentSuccess ? "1px solid #6ee7b7" : "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "24px",
              marginTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <CreditCard size={18} color={paymentSuccess ? "#059669" : "#087ac7"} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: paymentSuccess ? "#065f46" : "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Payment
              </span>
              {payment && (
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background:
                      payment.status === "PAID" ? "#d1fae5" :
                      payment.status === "FAILED" ? "#fee2e2" :
                      payment.status === "REFUNDED" ? "#fef3c7" : "#e0f2fe",
                    color:
                      payment.status === "PAID" ? "#065f46" :
                      payment.status === "FAILED" ? "#991b1b" :
                      payment.status === "REFUNDED" ? "#92400e" : "#0284c7",
                  }}
                >
                  {payment.status}
                </span>
              )}
            </div>

            {/* Paid state */}
            {paymentSuccess && payment && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#065f46", fontWeight: 700, fontSize: "15px" }}>
                  <BadgeCheck size={20} /> Payment Confirmed — &#8377;{Number(payment.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: "13px", color: "#047857" }}>
                  Method: <strong>{payment.method}</strong>
                  {payment.transactionReference && (
                    <> &nbsp;·&nbsp; Ref: <code style={{ fontSize: "12px" }}>{payment.transactionReference}</code></>
                  )}
                </div>
                {payment.paidAt && (
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Paid at: {new Date(payment.paidAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Pending — already initiated */}
            {!paymentSuccess && payment && payment.status === "PENDING" && (
              <div>
                <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
                  Payment of <strong>&#8377;{Number(payment.amount).toFixed(2)}</strong> via{" "}
                  <strong>{payment.method}</strong> is pending.
                  {payment.transactionReference && (
                    <> Reference: <code style={{ fontSize: "12px" }}>{payment.transactionReference}</code></>
                  )}
                </div>
                {paymentError && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>
                    {paymentError}
                  </div>
                )}
                <button
                  id="btn-confirm-payment"
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 22px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: verifying ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: verifying ? 0.7 : 1,
                  }}
                >
                  {verifying ? <RefreshCw size={14} className="pharmacy-spinner" /> : <BadgeCheck size={14} />}
                  {verifying ? "Confirming..." : "Confirm Payment Received"}
                </button>
              </div>
            )}

            {/* Failed state — allow retry */}
            {!paymentSuccess && payment && payment.status === "FAILED" && (
              <div>
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>
                  Payment failed: {payment.failureReason || "Unknown reason"}. Please try again.
                </div>
                <button
                  id="btn-retry-payment"
                  onClick={handleInitiatePayment}
                  disabled={paymentLoading}
                  style={{
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 22px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: paymentLoading ? "not-allowed" : "pointer",
                    opacity: paymentLoading ? 0.7 : 1,
                  }}
                >
                  Retry Payment
                </button>
              </div>
            )}

            {/* No payment yet — initiate */}
            {!payment && (
              <div>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
                  Select your preferred payment method and proceed.
                </p>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  {["COD", "UPI"].map((m) => (
                    <button
                      key={m}
                      id={`btn-method-${m.toLowerCase()}`}
                      onClick={() => setSelectedMethod(m)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: selectedMethod === m ? "2px solid #0284c7" : "2px solid #e2e8f0",
                        background: selectedMethod === m ? "#eff6ff" : "#f8fafc",
                        color: selectedMethod === m ? "#0284c7" : "#64748b",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        transition: "all 0.15s",
                      }}
                    >
                      {m === "COD" ? <Banknote size={16} /> : <Wallet size={16} />}
                      {m === "COD" ? "Cash on Delivery" : "UPI / QR"}
                    </button>
                  ))}
                </div>
                {paymentError && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>
                    {paymentError}
                  </div>
                )}
                <button
                  id="btn-initiate-payment"
                  onClick={handleInitiatePayment}
                  disabled={paymentLoading}
                  style={{
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "11px 26px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: paymentLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: paymentLoading ? 0.7 : 1,
                  }}
                >
                  {paymentLoading ? <RefreshCw size={14} className="pharmacy-spinner" /> : <CreditCard size={14} />}
                  {paymentLoading ? "Processing..." : `Pay ₹${Number(order.totalAmount).toFixed(2)} via ${selectedMethod}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ───── Review & Rating Modal Dialog ───── */}
        {reviewModal.isOpen && (
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
            onClick={handleCloseReviewModal}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "480px",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Rate {reviewModal.targetName}
                </h3>
                <button
                  onClick={handleCloseReviewModal}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview}>
                {reviewModal.error && (
                  <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
                    {reviewModal.error}
                  </div>
                )}

                {/* Interactive Star Selector */}
                <div style={{ marginBottom: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>
                    Select Your Rating
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewModal((prev) => ({ ...prev, rating: star }))}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 0.1s",
                        }}
                      >
                        <Star
                          size={32}
                          fill={star <= reviewModal.rating ? "#f59e0b" : "none"}
                          color={star <= reviewModal.rating ? "#f59e0b" : "#cbd5e1"}
                        />
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#f59e0b", marginTop: "6px" }}>
                    {reviewModal.rating} out of 5 Stars
                  </div>
                </div>

                {/* Optional Comment Textarea */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Review Comments (Optional)
                  </label>
                  <textarea
                    value={reviewModal.comment}
                    onChange={(e) => setReviewModal((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience to help other verified customers..."
                    rows={4}
                    maxLength={1000}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "4px" }}>
                    {reviewModal.comment.length}/1000 characters
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleCloseReviewModal}
                    disabled={reviewModal.isSubmitting}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewModal.isSubmitting}
                    style={{
                      padding: "9px 22px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#087ac7",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: reviewModal.isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {reviewModal.isSubmitting ? <RefreshCw size={14} className="pharmacy-spinner" /> : <CheckCircle2 size={14} />}
                    {reviewModal.isSubmitting ? "Submitting..." : "Submit Review"}
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
