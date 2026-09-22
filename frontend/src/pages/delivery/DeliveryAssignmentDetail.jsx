import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { deliveryService } from "../../services/delivery";
import {
  ArrowLeft,
  Truck,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  AlertTriangle,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Phone,
  FileText,
} from "lucide-react";

export function DeliveryAssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [failError, setFailError] = useState("");

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [latInput, setLatInput] = useState("19.0760");
  const [lngInput, setLngInput] = useState("72.8777");
  const [locationSuccess, setLocationSuccess] = useState("");

  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveryService.getAssignment(id);
      setDelivery(data);
      if (data?.currentLatitude && data?.currentLongitude) {
        setLatInput(String(data.currentLatitude));
        setLngInput(String(data.currentLongitude));
      }
    } catch (err) {
      setError(err.message || "Failed to load delivery details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  const handleAction = async (actionFn, successMsg) => {
    setActionLoading(true);
    setError(null);
    try {
      await actionFn();
      await fetchDelivery();
      if (successMsg) alert(successMsg);
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteWithOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError("Please enter a valid 6-digit verification OTP provided by the customer.");
      return;
    }
    setActionLoading(true);
    setOtpError("");
    try {
      await deliveryService.completeDelivery(id, otpInput.trim());
      setShowOtpModal(false);
      setOtpInput("");
      await fetchDelivery();
      alert("✓ Delivery completed successfully! Customer OTP verified.");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP code. Please check with customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailDelivery = async (e) => {
    e.preventDefault();
    if (!failReason || failReason.trim().length < 5) {
      setFailError("Please provide a descriptive failure reason (at least 5 characters).");
      return;
    }
    setActionLoading(true);
    setFailError("");
    try {
      await deliveryService.failDelivery(id, failReason.trim());
      setShowFailModal(false);
      setFailReason("");
      await fetchDelivery();
      alert("Delivery marked as failed. Order is preserved for admin resolution.");
    } catch (err) {
      setFailError(err.message || "Failed to record delivery failure");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      alert("Please provide valid coordinates: Latitude (-90..90) and Longitude (-180..180).");
      return;
    }
    setActionLoading(true);
    try {
      await deliveryService.updateLocation(id, { latitude: lat, longitude: lng });
      setLocationSuccess("GPS Coordinates updated successfully!");
      setTimeout(() => {
        setLocationSuccess("");
        setShowLocationModal(false);
      }, 1500);
      await fetchDelivery();
    } catch (err) {
      alert(err.message || "Failed to update GPS location");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
        <RefreshCw size={32} className="spin" style={{ color: "#0284c7", marginBottom: "14px" }} />
        <div>Loading assignment details...</div>
      </div>
    );
  }

  if (error && !delivery) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto" }}>
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "16px", borderRadius: "10px", color: "#991b1b", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Link to="/delivery/assignments" className="delivery-btn delivery-btn-secondary">
            <ArrowLeft size={16} /> Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "ASSIGNED", label: "Assigned" },
    { key: "PICKED_UP", label: "Picked Up" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "ASSIGNED":
      case "ACCEPTED":
        return 0;
      case "PICKED_UP":
        return 1;
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
        return 3;
      default:
        return -1;
    }
  };

  const currentStep = getStepIndex(delivery.status);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/delivery/assignments")}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} /> Back to Assignments
        </button>

        <button
          onClick={fetchDelivery}
          disabled={loading || actionLoading}
          className="delivery-btn delivery-btn-secondary delivery-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error alert if any action failed */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={18} />
          <span style={{ fontSize: "13px" }}>{error}</span>
        </div>
      )}

      {/* Status Card & Stepper */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Delivery Assignment
            </span>
            <h1 style={{ margin: "4px 0 2px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
              Order #{delivery.order?.orderNumber}
            </h1>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Assigned on {new Date(delivery.createdAt).toLocaleString()}
            </div>
          </div>

          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                backgroundColor:
                  delivery.status === "DELIVERED"
                    ? "#d1fae5"
                    : delivery.status === "FAILED"
                    ? "#fee2e2"
                    : "#dbeafe",
                color:
                  delivery.status === "DELIVERED"
                    ? "#065f46"
                    : delivery.status === "FAILED"
                    ? "#991b1b"
                    : "#1e40af",
                border: `1px solid ${
                  delivery.status === "DELIVERED"
                    ? "#a7f3d0"
                    : delivery.status === "FAILED"
                    ? "#fca5a5"
                    : "#bfdbfe"
                }`,
              }}
            >
              <Clock size={14} /> {delivery.status}
            </span>
          </div>
        </div>

        {/* Stepper Timeline (if not failed) */}
        {delivery.status !== "FAILED" ? (
          <div style={{ marginTop: "28px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, position: "relative" }}>
              {steps.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isDone ? "#0284c7" : "#e2e8f0",
                        color: isDone ? "#ffffff" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        boxShadow: isCurrent ? "0 0 0 4px #bae6fd" : undefined,
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
        ) : (
          <div
            style={{
              marginTop: "20px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "16px",
              color: "#991b1b",
            }}
          >
            <strong>Delivery Failed:</strong> {delivery.failureReason || "Reason not specified"}
          </div>
        )}
      </div>

      {/* Operational Actions Panel */}
      {delivery.status !== "DELIVERED" && delivery.status !== "FAILED" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            Delivery Actions
          </h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            {delivery.status === "ASSIGNED" && (
              <>
                <button
                  onClick={() => handleAction(() => deliveryService.acceptAssignment(id), "Assignment accepted!")}
                  disabled={actionLoading}
                  className="delivery-btn delivery-btn-primary"
                >
                  <CheckCircle2 size={16} /> Accept Assignment
                </button>
                <button
                  onClick={() => handleAction(() => deliveryService.pickupAssignment(id), "Order marked as Picked Up!")}
                  disabled={actionLoading}
                  className="delivery-btn delivery-btn-secondary"
                >
                  <Package size={16} /> Direct Pick Up from Pharmacy
                </button>
              </>
            )}

            {delivery.status === "ACCEPTED" && (
              <button
                onClick={() => handleAction(() => deliveryService.pickupAssignment(id), "Order picked up from pharmacy!")}
                disabled={actionLoading}
                className="delivery-btn delivery-btn-primary"
              >
                <Package size={16} /> Mark Picked Up from Pharmacy
              </button>
            )}

            {delivery.status === "PICKED_UP" && (
              <button
                onClick={() =>
                  handleAction(
                    () => deliveryService.outForDelivery(id),
                    "Order is now Out for Delivery! 6-digit OTP has been sent to customer."
                  )
                }
                disabled={actionLoading}
                className="delivery-btn delivery-btn-primary"
              >
                <Truck size={16} /> Start Route (Out for Delivery)
              </button>
            )}

            {delivery.status === "OUT_FOR_DELIVERY" && (
              <>
                <button
                  onClick={() => setShowOtpModal(true)}
                  disabled={actionLoading}
                  className="delivery-btn delivery-btn-primary"
                  style={{ background: "#10b981" }}
                >
                  <ShieldCheck size={16} /> Complete Delivery (Enter OTP)
                </button>

                <button
                  onClick={() => setShowLocationModal(true)}
                  disabled={actionLoading}
                  className="delivery-btn delivery-btn-secondary"
                >
                  <Navigation size={16} /> Update Live GPS
                </button>

                <button
                  onClick={() => setShowFailModal(true)}
                  disabled={actionLoading}
                  className="delivery-btn delivery-btn-secondary"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                >
                  <XCircle size={16} /> Report Delivery Failure
                </button>
              </>
            )}
          </div>

          {delivery.status === "OUT_FOR_DELIVERY" && (
            <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b", background: "#f0f9ff", padding: "10px 14px", borderRadius: "8px" }}>
              <strong>Notice:</strong> Customer has received their 6-digit secure delivery OTP. Ask the patient for the code at their doorstep before clicking &quot;Complete Delivery&quot;.
            </div>
          )}
        </div>
      )}

      {/* Pickup vs Drop Off Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Pharmacy Pickup Card */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#0284c7", textTransform: "uppercase", marginBottom: "12px" }}>
            <Store size={16} /> Pickup From Pharmacy
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {delivery.order?.pharmacy?.name}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            {delivery.order?.pharmacy?.address}, {delivery.order?.pharmacy?.city}
          </div>
          <div style={{ fontSize: "13px", color: "#0284c7", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Phone size={14} /> {delivery.order?.pharmacy?.phone}
          </div>
        </div>

        {/* Customer Drop Card */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#10b981", textTransform: "uppercase", marginBottom: "12px" }}>
            <MapPin size={16} /> Deliver To Patient
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {delivery.order?.customer?.fullName}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            {delivery.deliveryAddress?.addressLine1}
            {delivery.deliveryAddress?.addressLine2 && `, ${delivery.deliveryAddress.addressLine2}`}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
            {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state} - {delivery.deliveryAddress?.pincode}
          </div>
          <div style={{ fontSize: "13px", color: "#10b981", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Phone size={14} /> {delivery.order?.customer?.phone || "Customer Phone Registered"}
          </div>
        </div>
      </div>

      {/* Current GPS coordinates info card */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Navigation size={18} color="#0284c7" />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Live GPS Telemetry
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {delivery.currentLatitude && delivery.currentLongitude
                  ? `Lat: ${delivery.currentLatitude.toFixed(4)}, Lng: ${delivery.currentLongitude.toFixed(4)} (Last update: ${delivery.lastLocationAt ? new Date(delivery.lastLocationAt).toLocaleTimeString() : "Just now"})`
                  : "No live coordinates submitted yet"}
              </div>
            </div>
          </div>

          {delivery.status === "OUT_FOR_DELIVERY" && (
            <button
              onClick={() => setShowLocationModal(true)}
              className="delivery-btn delivery-btn-secondary delivery-btn-sm"
            >
              Update Location
            </button>
          )}
        </div>
      </div>

      {/* Ordered Items Table */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
          Package Contents ({delivery.order?.items?.length || 0} items)
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
              <th style={{ padding: "8px 0" }}>Medicine</th>
              <th style={{ padding: "8px", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "8px 0", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {delivery.order?.items?.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 0" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.medicine?.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{item.medicine?.genericName}</div>
                </td>
                <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                  &#8377;{Number(item.totalPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Events Audit Trail */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} /> Delivery Event Audit Trail
        </h3>

        {delivery.events && delivery.events.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {delivery.events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284c7", marginTop: "6px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>{evt.status}</strong>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {new Date(evt.timestamp || evt.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {evt.notes && (
                    <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                      {evt.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "#64748b" }}>No delivery events recorded yet.</div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#d1fae5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                Enter Customer Delivery OTP
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Ask the customer for the 6-digit confirmation code sent to their MediLink account.
              </p>
            </div>

            <form onSubmit={handleCompleteWithOtp}>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit OTP"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "24px",
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "14px",
                  boxSizing: "border-box",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
                autoFocus
              />

              {otpError && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "14px", textAlign: "center" }}>
                  {otpError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpError("");
                  }}
                  className="delivery-btn delivery-btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="delivery-btn delivery-btn-primary"
                  style={{ flex: 1, justifyContent: "center", background: "#10b981" }}
                  disabled={actionLoading || otpInput.length !== 6}
                >
                  {actionLoading ? "Verifying..." : "Verify & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fail Delivery Modal */}
      {showFailModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "440px",
              width: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <XCircle size={28} />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                Report Delivery Failure
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Provide a reason why this delivery could not be completed. The order will be preserved for administrator review.
              </p>
            </div>

            <form onSubmit={handleFailDelivery}>
              <textarea
                rows={3}
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="e.g. Customer unavailable at doorstep, Incorrect address provided, Door locked..."
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "13px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "14px",
                  boxSizing: "border-box",
                }}
              />

              {failError && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: "14px" }}>
                  {failError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFailModal(false);
                    setFailError("");
                  }}
                  className="delivery-btn delivery-btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="delivery-btn"
                  style={{ flex: 1, justifyContent: "center", background: "#dc2626", color: "#ffffff" }}
                  disabled={actionLoading || failReason.trim().length < 5}
                >
                  {actionLoading ? "Submitting..." : "Confirm Failure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Location Update Modal */}
      {showLocationModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <Navigation size={28} color="#0284c7" style={{ margin: "0 auto 8px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
                Update Live GPS Coordinates
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Simulate or broadcast current device coordinates to MediLink tracking.
              </p>
            </div>

            <form onSubmit={handleUpdateLocation}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Latitude (-90 to 90)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  Longitude (-180 to 180)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  required
                />
              </div>

              {locationSuccess && (
                <div style={{ color: "#16a34a", fontSize: "12px", marginBottom: "14px", textAlign: "center" }}>
                  {locationSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="delivery-btn delivery-btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="delivery-btn delivery-btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Updating..." : "Broadcast GPS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryAssignmentDetail;
