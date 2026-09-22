import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { pharmacyService } from "../../services/pharmacy";
import { useAuth } from "../../context/AuthContext";
import {
  Package,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
} from "lucide-react";

export function PharmacyDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || "Failed to load pharmacy dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handleRefresh = () => fetchDashboard();
    window.addEventListener("pharmacy:refresh", handleRefresh);
    return () => window.removeEventListener("pharmacy:refresh", handleRefresh);
  }, [fetchDashboard]);

  if (loading && !dashboardData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "16px", color: "#64748b", fontWeight: 600 }}>
          Loading pharmacy metrics...
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="pharmacy-banner pharmacy-banner-rejected">
        <AlertCircle size={22} />
        <div>
          <strong>Error loading dashboard:</strong> {error}
          <button
            onClick={fetchDashboard}
            className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
            style={{ marginLeft: "14px" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pharmacy = dashboardData?.pharmacy || user?.pharmacy || {};
  const metrics = dashboardData?.metrics || {
    totalMedicines: 0,
    activeMedicines: 0,
    totalInventoryUnits: 0,
    outOfStockMedicines: 0,
    expiringSoonBatches: 0,
    expiredBatches: 0,
  };
  const recentBatches = dashboardData?.recentBatches || [];

  const verificationStatus = pharmacy.verificationStatus || user?.verificationStatus || "PENDING";
  const isVerified = verificationStatus === "VERIFIED";
  const isRejected = verificationStatus === "REJECTED";
  const isPending = verificationStatus === "PENDING";

  return (
    <div>
      {/* Section Header */}
      <div className="pharmacy-section-header">
        <div>
          <h1 className="pharmacy-section-title">{pharmacy.name || "Pharmacy Operations"}</h1>
          <p className="pharmacy-section-subtitle">
            Drug License: <strong>{pharmacy.licenseNumber || "Verification Pending"}</strong> · Location:{" "}
            {pharmacy.city ? `${pharmacy.city}, ${pharmacy.state}` : "Registration details pending"}
          </p>
        </div>
      </div>

      {/* VERIFICATION STATUS BANNERS */}

      {/* 1. PENDING BANNER */}
      {isPending && (
        <div className="pharmacy-banner pharmacy-banner-pending">
          <Clock size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 750, fontSize: "16px", marginBottom: "4px" }}>
              Your Pharmacy Verification is Currently Pending
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "13.5px", lineHeight: 1.5, opacity: 0.9 }}>
              You can access your dashboard and profile. Pharmacy business operations (medicine
              listings and inventory batch creation) will automatically unlock once the MediLink
              administrator approves your drug license credentials.
            </p>
            <div style={{ display: "flex", gap: "10px", fontSize: "12px", fontWeight: 600 }}>
              <span>✓ Account Created</span>
              <span>·</span>
              <span style={{ color: "#b45309" }}>⏳ In Review by Admin</span>
              <span>·</span>
              <span style={{ color: "#94a3b8" }}>🔒 Operations Gated</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECTED BANNER */}
      {isRejected && (
        <div className="pharmacy-banner pharmacy-banner-rejected">
          <XCircle size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 750, fontSize: "16px", marginBottom: "4px" }}>
              Pharmacy Verification Application Rejected
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.5 }}>
              Your business registration could not be approved at this time.
            </p>
            {pharmacy.rejectionReason && (
              <div
                style={{
                  background: "rgba(255,255,255,0.7)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#7f1d1d",
                  marginBottom: "8px",
                }}
              >
                <strong>Reason:</strong> {pharmacy.rejectionReason}
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#991b1b" }}>
              Please review your registered information under Pharmacy Profile or contact support.
            </div>
          </div>
        </div>
      )}

      {/* 3. VERIFIED BANNER */}
      {isVerified && (
        <div className="pharmacy-banner pharmacy-banner-verified">
          <CheckCircle2 size={24} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 750, fontSize: "15px", marginBottom: "2px" }}>
              Your Pharmacy is Verified and Ready for Business
            </div>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
              Full operational access unlocked. You can list medicines, set custom prices, and manage
              batch-level inventory.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Metrics Cards */}
      <div className="pharmacy-metrics-grid">
        {/* Total Medicines */}
        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-icon blue">
            <Package size={22} />
          </div>
          <div>
            <h3 className="pharmacy-metric-value">{metrics.totalMedicines}</h3>
            <div className="pharmacy-metric-label">Medicine Listings</div>
            <div className="pharmacy-metric-subtext">
              {metrics.activeMedicines} active for sale
            </div>
          </div>
        </div>

        {/* Total Available Units */}
        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-icon emerald">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="pharmacy-metric-value">{metrics.totalInventoryUnits}</h3>
            <div className="pharmacy-metric-label">Available Inventory</div>
            <div className="pharmacy-metric-subtext">Total sellable units across batches</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="pharmacy-metric-card">
          <div
            className={`pharmacy-metric-icon ${
              metrics.outOfStockMedicines > 0 ? "rose" : "blue"
            }`}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="pharmacy-metric-value">{metrics.outOfStockMedicines}</h3>
            <div className="pharmacy-metric-label">Out of Stock</div>
            <div className="pharmacy-metric-subtext">Listings with 0 available units</div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="pharmacy-metric-card">
          <div
            className={`pharmacy-metric-icon ${
              metrics.expiringSoonBatches > 0 || metrics.expiredBatches > 0 ? "amber" : "blue"
            }`}
          >
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="pharmacy-metric-value">{metrics.expiringSoonBatches}</h3>
            <div className="pharmacy-metric-label">Expiring Soon</div>
            <div className="pharmacy-metric-subtext">
              {metrics.expiredBatches} expired · 30-day window
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <Link
          to="/pharmacy/medicines"
          className="pharmacy-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
            opacity: isVerified ? 1 : 0.65,
          }}
          onClick={(e) => {
            if (!isVerified) {
              e.preventDefault();
              alert("Medicine management unlocks once your pharmacy verification is approved.");
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="pharmacy-metric-icon blue" style={{ width: 40, height: 40 }}>
              <Package size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Manage Medicines
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Browse catalog, set prices & toggle availability
              </div>
            </div>
          </div>
          {isVerified ? <ArrowRight size={18} color="#94a3b8" /> : <Lock size={16} color="#94a3b8" />}
        </Link>

        <Link
          to="/pharmacy/inventory"
          className="pharmacy-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
            opacity: isVerified ? 1 : 0.65,
          }}
          onClick={(e) => {
            if (!isVerified) {
              e.preventDefault();
              alert("Inventory management unlocks once your pharmacy verification is approved.");
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="pharmacy-metric-icon emerald" style={{ width: 40, height: 40 }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Inventory Batches
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Track stock, manufacturing dates & expiries
              </div>
            </div>
          </div>
          {isVerified ? <ArrowRight size={18} color="#94a3b8" /> : <Lock size={16} color="#94a3b8" />}
        </Link>

        <Link
          to="/pharmacy/profile"
          className="pharmacy-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textDecoration: "none",
            color: "inherit",
            padding: "18px 20px",
            margin: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="pharmacy-metric-icon purple" style={{ width: 40, height: 40 }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                Pharmacy Profile
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Inspect license, location & update contact info
              </div>
            </div>
          </div>
          <ArrowRight size={18} color="#94a3b8" />
        </Link>
      </div>

      {/* Recent Inventory Batches */}
      <div className="pharmacy-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Recent Inventory Batches
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
              Latest batches received in store
            </p>
          </div>
          {isVerified && (
            <Link
              to="/pharmacy/inventory"
              className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
            >
              <span>View All Batches</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {recentBatches.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            {isVerified
              ? "No inventory batches created yet. Add a medicine and register batches to begin stock tracking."
              : "Inventory batch records will display here once your pharmacy is verified."}
          </div>
        ) : (
          <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="pharmacy-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch Number</th>
                  <th>Total Qty</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{b.medicineName}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {b.batchNumber}
                      </span>
                    </td>
                    <td>{b.quantity}</td>
                    <td>{b.reservedQuantity}</td>
                    <td>
                      <strong style={{ color: b.availableQuantity > 0 ? "#059669" : "#dc2626" }}>
                        {b.availableQuantity}
                      </strong>
                    </td>
                    <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                    <td>
                      {b.isExpired ? (
                        <span className="pharmacy-badge pharmacy-badge-expired">Expired</span>
                      ) : (
                        <span className="pharmacy-badge pharmacy-badge-available">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PharmacyDashboard;
