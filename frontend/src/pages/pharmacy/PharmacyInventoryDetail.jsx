import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { pharmacyService } from "../../services/pharmacy";
import {
  ArrowLeft,
  Layers,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Edit3,
} from "lucide-react";

export default function PharmacyInventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Stock Adjustment Form State
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustExpiryDate, setAdjustExpiryDate] = useState("");
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);
  const [adjustError, setAdjustError] = useState(null);

  const fetchBatchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyService.getInventoryBatch(id);
      setBatch(data);
      setAdjustQuantity(String(data.quantity));
      // Format ISO string to YYYY-MM-DD for date input
      if (data.expiryDate) {
        const expIso = new Date(data.expiryDate).toISOString().split("T")[0];
        setAdjustExpiryDate(expIso);
      }
    } catch (err) {
      setError(err.message || "Failed to load inventory batch details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetail();
  }, [id]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError(null);
    setSuccessMsg(null);
    setSubmittingAdjustment(true);

    try {
      const newQty = parseInt(adjustQuantity, 10);
      if (isNaN(newQty) || newQty < 0) {
        throw new Error("Quantity must be a non-negative number.");
      }
      if (newQty < batch.reservedQuantity) {
        throw new Error(
          `Total quantity cannot be reduced below reserved quantity (${batch.reservedQuantity} units).`
        );
      }

      if (adjustExpiryDate && new Date(adjustExpiryDate) <= new Date(batch.manufacturingDate)) {
        throw new Error("Expiry date must be after manufacturing date.");
      }

      await pharmacyService.updateInventoryBatch(id, {
        quantity: newQty,
        expiryDate: adjustExpiryDate || undefined,
      });

      setSuccessMsg("Batch updated successfully.");
      await fetchBatchDetail();
    } catch (err) {
      setAdjustError(err.message || "Failed to update inventory batch.");
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  const getStatusBadge = () => {
    if (!batch) return null;
    if (batch.isExpired) {
      return { label: "Expired", className: "pharmacy-badge-expired" };
    }
    if (batch.isExpiringSoon) {
      return { label: "Expiring Soon (Within 30 Days)", className: "pharmacy-badge-expiring" };
    }
    return { label: "Active / Valid", className: "pharmacy-badge-verified" };
  };

  if (loading) {
    return (
      <div className="pharmacy-loading-state" style={{ minHeight: "50vh" }}>
        <RefreshCw className="pharmacy-spinner" size={32} />
        <p>Loading batch details...</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="pharmacy-main-content">
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ margin: "24px 0" }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Error Loading Batch:</strong> {error}
          </div>
        </div>
        <Link to="/pharmacy/inventory" className="pharmacy-btn pharmacy-btn-secondary">
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
      </div>
    );
  }

  const status = getStatusBadge();
  const med = batch.medicine || {};

  return (
    <div className="pharmacy-main-content">
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          to="/pharmacy/inventory"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--ph-text-muted)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <ArrowLeft size={16} /> Back to Inventory Batches
        </Link>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="pharmacy-banner pharmacy-banner-success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} />
          <div>{successMsg}</div>
        </div>
      )}
      {error && (
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "20px" }}>
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Page Header */}
      <div className="pharmacy-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h1 className="pharmacy-page-title" style={{ margin: 0, fontFamily: "monospace" }}>
              Batch {batch.batchNumber}
            </h1>
            {status && <span className={`pharmacy-badge ${status.className}`}>{status.label}</span>}
          </div>
          <p className="pharmacy-page-subtitle">
            Associated with <strong>{med.name}</strong> ({med.strength} - {med.dosageForm})
          </p>
        </div>

        <div>
          <button className="pharmacy-btn pharmacy-btn-secondary" onClick={fetchBatchDetail} disabled={loading}>
            <RefreshCw size={15} className={loading ? "pharmacy-spinner" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="pharmacy-grid pharmacy-grid-4" style={{ marginBottom: "24px" }}>
        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Available Qty</span>
            <div className="pharmacy-metric-icon icon-green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-success)" }}>
            {batch.availableQuantity}
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Sellable units
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Reserved Qty</span>
            <div className="pharmacy-metric-icon icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-warning)" }}>
            {batch.reservedQuantity}
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Locked in active orders
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Total Batch Qty</span>
            <div className="pharmacy-metric-icon icon-blue">
              <Layers size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value">{batch.quantity}</div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Physical inventory count
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Selling Unit Price</span>
            <div className="pharmacy-metric-icon icon-cyan">
              <Package size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value">&#8377;{Number(batch.sellingPrice).toFixed(2)}</div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Configured store price
          </div>
        </div>
      </div>

      {/* Grid: Medicine & Batch Details */}
      <div className="pharmacy-grid pharmacy-grid-2" style={{ marginBottom: "24px" }}>
        {/* Medicine Information */}
        <div className="pharmacy-card">
          <div
            className="pharmacy-card-header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={16} color="var(--ph-primary)" /> Listed Medicine
            </h3>
            <Link
              to={`/pharmacy/medicines/${batch.pharmacyMedicineId}`}
              className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
            >
              View Medicine <ExternalLink size={12} />
            </Link>
          </div>
          <div className="pharmacy-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Product Name
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{med.name}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Generic Name
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{med.genericName || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Manufacturer
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>{med.manufacturer || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Category
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>{med.category?.name || "General"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Dosage Form &amp; Strength
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>
                  {med.dosageForm} ({med.strength})
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Prescription Requirement
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>
                  {med.requiresPrescription ? "Prescription Required" : "OTC"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Specifications */}
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="var(--ph-primary)" /> Batch Specifications
            </h3>
          </div>
          <div className="pharmacy-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Batch Identification
                </div>
                <div style={{ fontFamily: "monospace", fontWeight: "700", marginTop: "2px" }}>
                  {batch.batchNumber}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Batch Status
                </div>
                <div style={{ marginTop: "2px" }}>
                  {status && <span className={`pharmacy-badge ${status.className}`}>{status.label}</span>}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Manufacturing Date
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>
                  {new Date(batch.manufacturingDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Expiry Date
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>
                  {new Date(batch.expiryDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Registered On
                </div>
                <div style={{ color: "var(--ph-text-muted)", marginTop: "2px" }}>
                  {new Date(batch.createdAt).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Last Modified
                </div>
                <div style={{ color: "var(--ph-text-muted)", marginTop: "2px" }}>
                  {new Date(batch.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Adjustment & Expiry Update Card */}
      <div className="pharmacy-card" style={{ maxWidth: "700px" }}>
        <div className="pharmacy-card-header">
          <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Edit3 size={16} color="var(--ph-primary)" /> Adjust Physical Stock &amp; Expiry
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ph-text-muted)" }}>
            Update physical inventory levels following counts, restocks, or expiry reconciliations.
          </p>
        </div>

        <div className="pharmacy-card-body">
          {adjustError && (
            <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "16px" }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: "12px" }}>{adjustError}</span>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit}>
            <div className="pharmacy-form-grid" style={{ marginBottom: "16px" }}>
              <div className="pharmacy-form-group">
                <label className="pharmacy-label">Total Physical Quantity (Units) *</label>
                <input
                  type="number"
                  min={batch.reservedQuantity}
                  required
                  className="pharmacy-input"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                />
                <small style={{ color: "var(--ph-text-muted)", fontSize: "11px", marginTop: "4px" }}>
                  Must be at least {batch.reservedQuantity} (reserved for pending orders).
                </small>
              </div>

              <div className="pharmacy-form-group">
                <label className="pharmacy-label">Expiry Date</label>
                <input
                  type="date"
                  className="pharmacy-input"
                  value={adjustExpiryDate}
                  onChange={(e) => setAdjustExpiryDate(e.target.value)}
                />
                <small style={{ color: "var(--ph-text-muted)", fontSize: "11px", marginTop: "4px" }}>
                  Manufacturing date: {new Date(batch.manufacturingDate).toLocaleDateString()}
                </small>
              </div>
            </div>

            {batch.reservedQuantity > 0 && (
              <div className="pharmacy-banner pharmacy-banner-warning" style={{ marginBottom: "16px" }}>
                <Clock size={16} />
                <span style={{ fontSize: "12px" }}>
                  <strong>Reserved Stock Protection:</strong> {batch.reservedQuantity} units are currently reserved
                  by customers. The system prevents reducing inventory below this threshold.
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="submit"
                className="pharmacy-btn pharmacy-btn-primary"
                disabled={submittingAdjustment}
              >
                {submittingAdjustment ? "Saving Adjustments..." : "Save Stock Adjustments"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
