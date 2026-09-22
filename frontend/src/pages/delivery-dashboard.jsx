import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deliveryService } from "../services/delivery";
import { verificationTestService } from "../services/auth";
import {
  Truck,
  ShieldCheck,
  Clock,
  XCircle,
  MapPin,
  CheckCircle2,
  PackageCheck,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  Store,
  Navigation,
} from "lucide-react";
import "./user-dashboard.css";

export function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const verificationStatus = user?.verificationStatus || "PENDING";
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";
  const isPending = verificationStatus === "PENDING";

  const fetchDashboard = useCallback(async () => {
    if (!isVerified) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await deliveryService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Failed to load delivery statistics");
    } finally {
      setLoading(false);
    }
  }, [isVerified]);

  useEffect(() => {
    fetchDashboard();
    const handleCustomRefresh = () => fetchDashboard();
    window.addEventListener("delivery:refresh", handleCustomRefresh);
    return () => window.removeEventListener("delivery:refresh", handleCustomRefresh);
  }, [fetchDashboard]);

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

  const partner = dashboardData?.partner;
  const stats = dashboardData?.stats;
  const activeDelivery = dashboardData?.activeDelivery;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Verification Banners */}
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
                Your delivery partner profile has been registered. Our admin team will review your
                vehicle registration and driver license. Delivery assignments will unlock once approved.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  {user?.rejectionReason || "Identity or vehicle documents could not be validated."}
                </p>
              </div>
              <p style={{ color: "#64748b", fontSize: "12px", margin: "10px 0 0" }}>
                Delivery assignments remain disabled. Contact support@medilink.com for appeal assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Delivery Alert Banner (If partner has one in progress) */}
      {isVerified && activeDelivery && (
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #93c5fd",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "28px",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <Truck size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "#1d4ed8" }}>
                    Active Assignment In Progress
                  </span>
                  <span
                    style={{
                      background: "#dbeafe",
                      color: "#1e40af",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {activeDelivery.status}
                  </span>
                </div>
                <h3 style={{ margin: "4px 0 2px", fontSize: "16px", color: "#0f172a" }}>
                  Order #{activeDelivery.order?.orderNumber}
                </h3>
                <div style={{ fontSize: "13px", color: "#475569" }}>
                  Pickup: {activeDelivery.order?.pharmacy?.name} &rarr; Destination: {activeDelivery.deliveryAddress?.city}
                </div>
              </div>
            </div>

            <Link
              to={`/delivery/assignments/${activeDelivery.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#0284c7",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              <span>Manage Delivery</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Total Assigned</span>
            <PackageCheck size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "10px" }}>
            {stats?.totalDeliveries ?? 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Lifetime assignments received
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Completed</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", marginTop: "10px" }}>
            {stats?.completedDeliveries ?? 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Successfully delivered to patients
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Active Now</span>
            <Truck size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b", marginTop: "10px" }}>
            {stats?.activeDeliveries ?? 0}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {stats?.activeDeliveries ? "1 active route" : "Ready for next pickup"}
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Partner Rating</span>
            <TrendingUp size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#8b5cf6", marginTop: "10px" }}>
            {stats?.rating ? Number(stats.rating).toFixed(1) : "5.0"} ★
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Status: {partner?.isAvailable ? "Available" : "Offline"}
          </div>
        </div>
      </div>

      {/* Backend Security Check Demonstration Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#1e293b", fontWeight: 700 }}>
              Backend Verification Guard Demonstration
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
              Calls protected endpoint <code>GET /api/v1/delivery/verification-access-test</code> to test RBAC enforcement.
            </p>
          </div>
          <button
            onClick={handleTestBackendAccess}
            disabled={isTesting}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: "#0284c7",
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

      {/* Quick Navigation Cards */}
      <h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "16px" }}>
        Quick Partner Actions
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <Link
          to="/delivery/assignments"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#e0f2fe", borderRadius: "10px", color: "#0284c7" }}>
              <PackageCheck size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#0f172a" }}>
                Active &amp; Assigned Deliveries
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                View pickup details, advance delivery steps &amp; submit completion OTP.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/delivery/history"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#d1fae5", borderRadius: "10px", color: "#059669" }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#0f172a" }}>
                Completed Deliveries History
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Review past delivery records, timestamps and fulfillment audit trail.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/delivery/profile"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            textDecoration: "none",
            color: "inherit",
            display: "block",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "10px", background: "#fef3c7", borderRadius: "10px", color: "#d97706" }}>
              <Navigation size={22} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", color: "#0f172a" }}>
                Vehicle &amp; City Profile
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Manage operating city, vehicle number, and license credentials.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default DeliveryDashboard;
