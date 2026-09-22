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
  User,
  Phone,
  FileText,
} from "lucide-react";

export function AdminDeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDelivery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveryService.getDeliveryAdmin(id);
      setDelivery(data);
    } catch (err) {
      setError(err.message || "Failed to load delivery details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
        <RefreshCw size={32} className="spin" style={{ color: "#087ac7", marginBottom: "14px" }} />
        <div>Loading delivery telemetry...</div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto" }}>
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "16px", borderRadius: "10px", color: "#991b1b", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={20} />
          <span>{error || "Delivery record not found"}</span>
        </div>
        <div style={{ marginTop: "16px" }}>
          <Link to="/admin/deliveries" className="admin-btn admin-btn-secondary">
            <ArrowLeft size={16} /> Back to Deliveries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/admin/deliveries")}
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
          <ArrowLeft size={16} /> Back to Deliveries
        </button>

        <button
          onClick={fetchDelivery}
          disabled={loading}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Delivery Info Card */}
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
            <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>
              Delivery Dispatch Record
            </span>
            <h1 style={{ margin: "4px 0 2px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
              Order #{delivery.order?.orderNumber}
            </h1>
            <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>
              Delivery ID: {delivery.id}
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

        {delivery.status === "FAILED" && (
          <div style={{ marginTop: "16px", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px 16px", borderRadius: "10px", color: "#991b1b", fontSize: "13px" }}>
            <strong>Failure Reason:</strong> {delivery.failureReason || "Reason not provided"}
          </div>
        )}
      </div>

      {/* Grid of Parties */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Partner */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#087ac7", textTransform: "uppercase", marginBottom: "12px" }}>
            <Truck size={16} /> Delivery Partner
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {delivery.deliveryPartner?.fullName || "Unassigned"}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            Vehicle: {delivery.deliveryPartner?.vehicleNumber} ({delivery.deliveryPartner?.vehicleType})
          </div>
          <div style={{ fontSize: "13px", color: "#087ac7", marginTop: "6px" }}>
            Phone: {delivery.deliveryPartner?.phone || "N/A"}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Operating City: {delivery.deliveryPartner?.city}
          </div>
        </div>

        {/* Pharmacy */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#087ac7", textTransform: "uppercase", marginBottom: "12px" }}>
            <Store size={16} /> Origin Pharmacy
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {delivery.order?.pharmacy?.name}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            {delivery.order?.pharmacy?.address}, {delivery.order?.pharmacy?.city}
          </div>
          <div style={{ fontSize: "13px", color: "#087ac7", marginTop: "6px" }}>
            Phone: {delivery.order?.pharmacy?.phone}
          </div>
        </div>

        {/* Destination */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#10b981", textTransform: "uppercase", marginBottom: "12px" }}>
            <MapPin size={16} /> Destination (Customer)
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
            {delivery.order?.customer?.fullName}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            {delivery.deliveryAddress?.addressLine1}
            {delivery.deliveryAddress?.addressLine2 ? `, ${delivery.deliveryAddress.addressLine2}` : ""}
          </div>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
            {delivery.deliveryAddress?.city}, {delivery.deliveryAddress?.state} - {delivery.deliveryAddress?.pincode}
          </div>
        </div>
      </div>

      {/* GPS Location Telemetry Card */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Navigation size={20} color="#087ac7" />
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              GPS Location &amp; Telemetry
            </div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
              {delivery.currentLatitude && delivery.currentLongitude
                ? `Latitude: ${delivery.currentLatitude.toFixed(5)}, Longitude: ${delivery.currentLongitude.toFixed(5)} (Last recorded: ${delivery.lastLocationAt ? new Date(delivery.lastLocationAt).toLocaleString() : "Recently"})`
                : "No telemetry coordinates received from partner device."}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Event Timeline */}
      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} /> Delivery Events Log
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
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#087ac7", marginTop: "6px" }} />
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
          <div style={{ fontSize: "13px", color: "#64748b" }}>No delivery events logged yet.</div>
        )}
      </div>
    </div>
  );
}

export default AdminDeliveryDetail;
