import { useState, useEffect } from "react";
import { adminService } from "../../services/admin";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function AdminProfile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || "Failed to load admin profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
        Loading admin profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-alert admin-alert-danger">
        <AlertCircle size={20} />
        <div>
          <strong>Error loading profile:</strong> {error}
          <button
            onClick={fetchProfile}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            style={{ marginLeft: "12px" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const adminData = profile || authUser;

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div>
          <h1 className="admin-section-title">Administrator Profile</h1>
          <p className="admin-section-subtitle">
            Authenticated administrator credentials, privileged security scope, and system authority.
          </p>
        </div>
        <button
          onClick={fetchProfile}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 400px) 1fr", gap: "24px" }}>
        {/* Profile Card */}
        <div className="admin-card" style={{ textAlign: "center" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            {(adminData?.email?.[0] || "A").toUpperCase()}
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: 750, color: "#0f172a", margin: "0 0 4px" }}>
            Platform Administrator
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
            {adminData?.email}
          </div>

          <span className="admin-badge admin-badge-admin" style={{ padding: "4px 12px", fontSize: "12px" }}>
            <ShieldCheck size={13} />
            <span>FULL PRIVILEGE (ADMIN)</span>
          </span>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #e2e8f0",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
              <Mail size={16} color="#64748b" />
              <span>{adminData?.email}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
              <Phone size={16} color="#64748b" />
              <span>{adminData?.phone || "Primary contact phone"}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#475569" }}>
              <Calendar size={16} color="#64748b" />
              <span>
                Registered {adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : "2026"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access Scope */}
        <div>
          <div className="admin-card">
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Key size={18} color="#2563eb" />
              <span>Operational Authority & Security Scope</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ color: "#0f172a" }}>Business Partner Verification:</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>
                    Authorized to approve or reject Pharmacy and Delivery Partner credentials and licenses.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ color: "#0f172a" }}>Account Status Governance:</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>
                    Authorized to activate or deactivate platform accounts across all roles (with self-deactivation protection).
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ color: "#0f172a" }}>Security Audit Inspection:</strong>
                  <div style={{ color: "#64748b", marginTop: "2px" }}>
                    Full read-only access to immutable system audit trails and administrative event history.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Lock size={18} color="#059669" />
              <span>Data Protection Guarantee</span>
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.6 }}>
              All administrative API endpoints strictly enforce <code>authenticate</code> and{" "}
              <code>authorize(ADMIN)</code> middleware. User credentials, password hashes, and sensitive
              tokens are completely excluded from database projections and server responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
