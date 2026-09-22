import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verificationTestService } from "../services/auth";
import {
  Store,
  ShieldCheck,
  Clock,
  XCircle,
  Package,
  Layers,
  ShoppingBag,
  User,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export function PharmacyDashboard() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const res = await verificationTestService.testPharmacyAccess();
      setTestResult({
        success: true,
        message: "HTTP 200 OK: Backend verified pharmacy access granted!",
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: err.status || 403,
        message:
          err.message || "HTTP 403 Forbidden: Backend rejected unverified pharmacy access",
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
            <Store size={18} color="#087ac7" />
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#173f6c" }}>
              Pharmacy Portal
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
            {user?.pharmacy?.name || user?.email}
          </div>
        </div>

        <nav className="dashboard-nav" style={{ marginTop: "16px" }}>
          <button className="dashboard-nav-item" style={{ background: "#edf8ff", color: "#087ac7", fontWeight: 700 }}>
            <Store size={18} />
            <span>Dashboard Home</span>
          </button>
          <button className="dashboard-nav-item" style={{ opacity: isVerified ? 1 : 0.6 }}>
            <Package size={18} />
            <span>Manage Medicines</span>
            {!isVerified && <Lock size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />}
          </button>
          <button className="dashboard-nav-item" style={{ opacity: isVerified ? 1 : 0.6 }}>
            <Layers size={18} />
            <span>Inventory Batches</span>
            {!isVerified && <Lock size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />}
          </button>
          <button className="dashboard-nav-item" style={{ opacity: isVerified ? 1 : 0.6 }}>
            <ShoppingBag size={18} />
            <span>Orders & Requests</span>
            {!isVerified && <Lock size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />}
          </button>
          <button className="dashboard-nav-item">
            <User size={18} />
            <span>Pharmacy Profile</span>
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
              {user?.pharmacy?.name || "Pharmacy Workspace"}
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
              License: <strong>{user?.pharmacy?.licenseNumber || "Verification Pending"}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
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

        {/* VERIFICATION STATUS BANNERS */}

        {/* PENDING BANNER */}
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
                  Your pharmacy account has been created successfully. Your account is currently under
                  admin verification. You can access your dashboard while verification is pending, but
                  medicine selling, inventory management and order processing will remain unavailable
                  until your account is verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED BANNER */}
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
                    ✓ Verified Pharmacy
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
                    ACTIVE &amp; APPROVED
                  </span>
                </div>
                <p style={{ color: "#334155", fontSize: "13px", lineHeight: 1.6, margin: "8px 0 0" }}>
                  Your pharmacy account has been verified by the MediLink administration. You now have full
                  access to publish medicines, manage stock batches, and receive customer orders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REJECTED BANNER */}
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
                    {user?.rejectionReason || "Pharmacy license details could not be validated."}
                  </p>
                </div>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "10px 0 0" }}>
                  Restricted business features remain disabled. Please contact MediLink support at{" "}
                  <strong>support@medilink.com</strong> to update your documentation.
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
                Calls protected endpoint <code>GET /api/v1/pharmacy/verification-access-test</code> to
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

        {/* Feature Grid */}
        <h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "14px" }}>
          Pharmacy Modules &amp; Privileges
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {/* Card 1 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Package size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Medicine Catalog
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Publish approved prescription and OTC medicines to nearby customers.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Enabled" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Layers size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Batch &amp; Stock Inventory
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Track batch numbers, expiration dates, and reserve stock levels.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Enabled" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              opacity: isVerified ? 1 : 0.7,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ShoppingBag size={22} color={isVerified ? "#087ac7" : "#94a3b8"} />
              {!isVerified && <Lock size={16} color="#94a3b8" />}
            </div>
            <h4 style={{ margin: "14px 0 6px", fontSize: "14px", color: "#1e293b" }}>
              Order Fulfillment
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
              Accept customer orders, verify prescriptions, and dispatch deliveries.
            </p>
            <div style={{ marginTop: "14px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: isVerified ? "#16a34a" : "#94a3b8",
                }}
              >
                {isVerified ? "✓ Enabled" : "🔒 Requires Verification"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PharmacyDashboard;
