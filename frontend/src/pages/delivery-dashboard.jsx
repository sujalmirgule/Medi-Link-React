import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verificationTestService } from "../services/auth";
import {
  Truck,
  ShieldCheck,
  Clock,
  XCircle,
  MapPin,
  CheckCircle2,
  Lock,
  LogOut,
  RefreshCw,
  Power,
  PackageCheck,
  TrendingUp,
  User,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.deliveryPartner?.isAvailable || false);

  const verificationStatus = user?.verificationStatus || "PENDING";
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";
  const isPending = verificationStatus === "PENDING";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestBackendAccess = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await verificationTestService.testDeliveryAccess();
      setTestResult({
        success: true,
        message: "HTTP 200 OK: Backend verified delivery partner access granted!",
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: err.status || 403,
        message:
          err.message || "HTTP 403 Forbidden: Backend rejected unverified delivery access",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ gridTemplateColumns: "240px 1fr" }}>
      {/* Sidebar */}
      <aside className="dashboard-sidebar" style={{ width: "240px" }}>
        <div className="dashboard-logo">
          <img src={logo} alt="MediLink" />
        </div>

        <div style={{ padding: "0 12px 14px", borderBottom: "1px solid #deedf5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={18} color="#087ac7" />
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#173f6c" }}>
              Delivery Partner Portal
            </span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#5f7e97",
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.email}
          </div>
        </div>

        <nav className="dashboard-nav" style={{ marginTop: "16px" }}>
          <button className="dashboard-nav-item" style={{ background: "#edf8ff", color: "#087ac7", fontWeight: 700 }}>
            <Truck size={18} />
            <span>Dashboard Home</span>
          </button>
          <button className="dashboard-nav-item" style={{ opacity: isVerified ? 1 : 0.6 }}>
            <PackageCheck size={18} />
            <span>Assigned Deliveries</span>
            {!isVerified && <Lock size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />}
          </button>
          <button className="dashboard-nav-item" style={{ opacity: isVerified ? 1 : 0.6 }}>
            <TrendingUp size={18} />
            <span>Earnings &amp; Payouts</span>
            {!isVerified && <Lock size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />}
          </button>
          <button className="dashboard-nav-item">
            <User size={18} />
            <span>Partner Profile</span>
          </button>
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button
            onClick={handleLogout}
            className="dashboard-nav-item"
            style={{ color: "#b91c1c", width: "100%", justifyContent: "flex-start" }}
          >
            <LogOut size={17} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ padding: "32px 40px", overflowY: "auto" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", color: "#123b78", margin: 0, fontWeight: 750 }}>
              Delivery Partner Workspace
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
              Account Status: <strong>{verificationStatus}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Availability Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                padding: "6px 12px",
                borderRadius: "10px",
                opacity: isVerified ? 1 : 0.5,
              }}
            >
              <Power size={14} color={isAvailable && isVerified ? "#16a34a" : "#94a3b8"} />
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                {isAvailable && isVerified ? "Available for Orders" : "Offline"}
              </span>
              <input
                type="checkbox"
                disabled={!isVerified}
                checked={isAvailable && isVerified}
                onChange={(e) => setIsAvailable(e.target.checked)}
                style={{ cursor: isVerified ? "pointer" : "not-allowed" }}
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* VERIFICATION BANNERS */}

        {/* PENDING */}
        {isPending && (
          <div
            style={{
              backgroundColor: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "28px",
              boxShadow: "0 4px 20px rgba(14, 165, 233, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#0284c7",
                  padding: "10px",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <Clock size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "17px", color: "#0369a1", margin: 0, fontWeight: 700 }}>
                    Verification Pending
                  </h2>
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    UNDER REVIEW
                  </span>
                </div>
                <p style={{ color: "#334155", fontSize: "13px", lineHeight: 1.6, margin: "8px 0 0" }}>
                  Your delivery partner account has been created. Your application is waiting for admin
                  verification. Delivery assignments will become available after approval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED */}
        {isVerified && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "28px",
              boxShadow: "0 4px 20px rgba(22, 163, 74, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#16a34a",
                  padding: "10px",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "17px", color: "#15803d", margin: 0, fontWeight: 700 }}>
                    ✓ Verified Delivery Partner
                  </h2>
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    VERIFIED &amp; ACTIVE
                  </span>
                </div>
                <p style={{ color: "#334155", fontSize: "13px", lineHeight: 1.6, margin: "8px 0 0" }}>
                  Your partner profile is approved. You can switch your availability toggle to &quot;Available for
                  Orders&quot; and accept delivery assignments in your designated city.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REJECTED */}
        {isRejected && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "16px",
              padding: "20px 24px",
              marginBottom: "28px",
              boxShadow: "0 4px 20px rgba(220, 38, 38, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <XCircle size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "17px", color: "#b91c1c", margin: 0, fontWeight: 700 }}>
                    Verification Rejected
                  </h2>
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#b91c1c",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    REJECTED
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginTop: "10px",
                  }}
                >
                  <strong style={{ color: "#7f1d1d", fontSize: "12px" }}>
                    Reason provided by Admin:
                  </strong>
                  <p style={{ color: "#991b1b", fontSize: "13px", margin: "4px 0 0" }}>
                    {user?.rejectionReason || "Identity or contact verification could not be completed."}
                  </p>
                </div>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "10px 0 0" }}>
                  Delivery features remain disabled. Please reach out to{" "}
                  <strong>support@medilink.com</strong> if you wish to appeal or update details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BACKEND RESTRICTION TEST CARD */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#1e293b", fontWeight: 700 }}>
                Backend Verification Check Demonstration
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                Calls protected endpoint <code>GET /api/v1/delivery/verification-access-test</code> to
                prove backend security rules.
              </p>
            </div>
            <button
              onClick={handleTestBackendAccess}
              disabled={isTesting}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: "#087ac7",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isTesting ? "Testing..." : "Test Protected API"}
            </button>
          </div>

          {testResult && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                backgroundColor: testResult.success ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${testResult.success ? "#bbf7d0" : "#fecaca"}`,
                color: testResult.success ? "#166534" : "#991b1b",
              }}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {/* Features Preview */}
        <h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "14px" }}>
          Delivery Partner Features
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <PackageCheck size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Pickup Assignments
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Receive automated route dispatch for verified pharmacy orders.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Active" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <MapPin size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Live Navigation
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Turn-by-turn route optimization from pharmacy to patient doorstep.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Active" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <TrendingUp size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Partner Earnings
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Weekly direct deposit settlements and per-drop incentive bonuses.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Active" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DeliveryDashboard;
