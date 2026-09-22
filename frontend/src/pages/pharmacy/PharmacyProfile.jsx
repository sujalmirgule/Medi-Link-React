import { useState, useEffect } from "react";
import { pharmacyService } from "../../services/pharmacy";
import { useAuth } from "../../context/AuthContext";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  XCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

export function PharmacyProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Editable Form State
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const isVerified = (profile?.isVerified ?? user?.pharmacy?.isVerified) || false;

  const fetchProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await pharmacyService.getProfile();
      setProfile(data);
      setFormData({
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      alert("Profile modifications are restricted until your pharmacy is verified by admin.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await pharmacyService.updateProfile(formData);
      setProfile(updated);
      await refreshUser();
      setMessage({ type: "success", text: "Pharmacy profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
        Loading pharmacy profile...
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="pharmacy-section-header">
        <div>
          <h1 className="pharmacy-section-title">Pharmacy Profile & Settings</h1>
          <p className="pharmacy-section-subtitle">
            Manage your store contact details, physical address, and view drug license credentials.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`pharmacy-banner ${
            message.type === "success" ? "pharmacy-banner-verified" : "pharmacy-banner-rejected"
          }`}
          style={{ padding: "14px 18px", marginBottom: "20px" }}
        >
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 380px) 1fr", gap: "24px" }}>
        {/* Credentials & Verification Card */}
        <div>
          <div className="pharmacy-card">
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#087ac7",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 800,
                margin: "0 auto 16px",
              }}
            >
              {(profile?.name?.[0] || "P").toUpperCase()}
            </div>

            <h2 style={{ fontSize: "18px", fontWeight: 750, color: "#0f172a", margin: "0 0 4px", textAlign: "center" }}>
              {profile?.name}
            </h2>
            <div style={{ fontSize: "13px", color: "#64748b", textAlign: "center", marginBottom: "16px" }}>
              Owner: {profile?.owner?.email}
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              {isVerified ? (
                <span className="pharmacy-badge pharmacy-badge-verified" style={{ padding: "4px 12px", fontSize: "12px" }}>
                  <ShieldCheck size={13} />
                  <span>VERIFIED PHARMACY</span>
                </span>
              ) : (
                <span className="pharmacy-badge pharmacy-badge-pending" style={{ padding: "4px 12px", fontSize: "12px" }}>
                  <Clock size={13} />
                  <span>VERIFICATION PENDING</span>
                </span>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                  DRUG LICENSE NUMBER (IMMUTABLE)
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginTop: "2px",
                    background: "#f1f5f9",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{profile?.licenseNumber}</span>
                  <Lock size={12} color="#64748b" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                  PHARMACY ID
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {profile?.id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                  REGISTERED ON
                </div>
                <div style={{ color: "#334155", marginTop: "2px" }}>
                  {new Date(profile?.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Store Information Form */}
        <div className="pharmacy-card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>
            Store Contact & Address Information
          </h3>

          {!isVerified && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#92400e",
                marginBottom: "16px",
              }}
            >
              <Lock size={12} style={{ display: "inline", marginRight: "6px" }} />
              Profile editing is locked during verification review.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Store Phone *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  disabled={!isVerified || saving}
                  value={formData.phone}
                  onChange={handleChange}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Store Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={!isVerified || saving}
                  value={formData.email}
                  onChange={handleChange}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Physical Shop Address *
              </label>
              <textarea
                name="address"
                rows={2}
                required
                disabled={!isVerified || saving}
                value={formData.address}
                onChange={handleChange}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  width: "100%",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  disabled={!isVerified || saving}
                  value={formData.city}
                  onChange={handleChange}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  disabled={!isVerified || saving}
                  value={formData.state}
                  onChange={handleChange}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  disabled={!isVerified || saving}
                  value={formData.pincode}
                  onChange={handleChange}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={!isVerified || saving}
                className="pharmacy-btn pharmacy-btn-primary"
              >
                <Save size={15} />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PharmacyProfile;
