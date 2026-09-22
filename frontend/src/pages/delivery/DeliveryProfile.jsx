import { useState, useEffect, useCallback } from "react";
import { deliveryService } from "../../services/delivery";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Truck,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
} from "lucide-react";

export function DeliveryProfile() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    vehicleType: "TWO_WHEELER",
    vehicleNumber: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deliveryService.getProfile();
      setProfile(data);
      if (data) {
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          vehicleType: data.vehicleType || "TWO_WHEELER",
          vehicleNumber: data.vehicleNumber || "",
          city: data.city || "",
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load partner profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage("");
    try {
      await deliveryService.updateProfile({
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        city: formData.city,
      });
      await refreshUser();
      await fetchProfile();
      setSuccessMessage("Partner profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
        <RefreshCw size={28} className="spin" style={{ color: "#0284c7", marginBottom: "12px" }} />
        <div>Loading partner credentials...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
          Partner Profile &amp; Vehicle
        </h1>
        <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
          Registered vehicle details, contact information, and operating credentials.
        </p>
      </div>

      {successMessage && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

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
            gap: "8px",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Profile Overview Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#0284c7",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            {(profile?.fullName?.[0] || user?.email?.[0] || "D").toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>
              {profile?.fullName || "Delivery Partner"}
            </h2>
            <div style={{ fontSize: "13px", color: "#64748b" }}>{user?.email}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                background: user?.verificationStatus === "VERIFIED" ? "#d1fae5" : "#fef3c7",
                color: user?.verificationStatus === "VERIFIED" ? "#065f46" : "#b45309",
                border: `1px solid ${user?.verificationStatus === "VERIFIED" ? "#a7f3d0" : "#fde68a"}`,
              }}
            >
              <ShieldCheck size={14} /> {user?.verificationStatus || "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Details Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            Operational Information
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Full Name (Identity)
              </label>
              <input
                type="text"
                disabled
                value={formData.fullName}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#64748b", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              >
                <option value="TWO_WHEELER">Two Wheeler (Bike / Scooter)</option>
                <option value="THREE_WHEELER">Three Wheeler (Auto / EV)</option>
                <option value="FOUR_WHEELER">Four Wheeler (Car / Van)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Vehicle License Plate Number
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Operating City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Driving License Number
              </label>
              <input
                type="text"
                disabled
                value={profile?.licenseNumber || "Verified License"}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#64748b", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              className="delivery-btn delivery-btn-primary"
            >
              <Save size={16} /> {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default DeliveryProfile;
