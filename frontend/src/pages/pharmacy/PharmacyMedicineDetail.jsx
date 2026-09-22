import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { pharmacyService } from "../../services/pharmacy";
import {
  ArrowLeft,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  DollarSign,
  Calendar,
} from "lucide-react";

export default function PharmacyMedicineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit Listing State
  const [isEditingListing, setIsEditingListing] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Add Batch Modal State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchError, setBatchError] = useState(null);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Delete Listing State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingListing, setDeletingListing] = useState(false);

  const fetchMedicineDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyService.getMedicine(id);
      setMedicine(data);
      setEditPrice(String(data.sellingPrice || ""));
      setEditAvailable(Boolean(data.isAvailable));
    } catch (err) {
      setError(err.message || "Failed to load medicine listing details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicineDetail();
  }, [id]);

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const priceNum = parseFloat(editPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error("Please enter a valid positive selling price.");
      }

      await pharmacyService.updateMedicine(id, {
        sellingPrice: priceNum,
        isAvailable: editAvailable,
      });

      setSuccessMsg("Medicine listing updated successfully.");
      setIsEditingListing(false);
      await fetchMedicineDetail();
    } catch (err) {
      setError(err.message || "Failed to update listing.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setBatchError(null);
    setSubmittingBatch(true);

    try {
      if (!batchNumber.trim()) throw new Error("Batch number is required.");
      if (!manufacturingDate) throw new Error("Manufacturing date is required.");
      if (!expiryDate) throw new Error("Expiry date is required.");
      if (new Date(expiryDate) <= new Date(manufacturingDate)) {
        throw new Error("Expiry date must be after manufacturing date.");
      }
      const qtyNum = parseInt(quantity, 10);
      if (isNaN(qtyNum) || qtyNum < 1) {
        throw new Error("Quantity must be a positive integer.");
      }

      await pharmacyService.createInventoryBatch({
        pharmacyMedicineId: id,
        batchNumber: batchNumber.trim().toUpperCase(),
        manufacturingDate,
        expiryDate,
        quantity: qtyNum,
      });

      setShowAddBatchModal(false);
      setBatchNumber("");
      setManufacturingDate("");
      setExpiryDate("");
      setQuantity("");
      setSuccessMsg("Inventory batch added successfully.");
      await fetchMedicineDetail();
    } catch (err) {
      setBatchError(err.message || "Failed to add inventory batch.");
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleDeleteListing = async () => {
    setDeletingListing(true);
    setError(null);
    try {
      await pharmacyService.deleteMedicine(id);
      navigate("/pharmacy/medicines");
    } catch (err) {
      setError(err.message || "Failed to delete medicine listing.");
      setShowDeleteConfirm(false);
    } finally {
      setDeletingListing(false);
    }
  };

  const getExpiryStatus = (batch) => {
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const exp = new Date(batch.expiryDate);

    if (exp < now) {
      return { label: "Expired", className: "pharmacy-badge-expired" };
    }
    if (exp <= in30Days) {
      return { label: "Expiring Soon", className: "pharmacy-badge-expiring" };
    }
    return { label: "Valid", className: "pharmacy-badge-verified" };
  };

  if (loading) {
    return (
      <div className="pharmacy-loading-state" style={{ minHeight: "50vh" }}>
        <RefreshCw className="pharmacy-spinner" size={32} />
        <p>Loading medicine details...</p>
      </div>
    );
  }

  if (error && !medicine) {
    return (
      <div className="pharmacy-main-content">
        <div className="pharmacy-banner pharmacy-banner-danger" style={{ margin: "24px 0" }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Error Loading Medicine:</strong> {error}
          </div>
        </div>
        <Link to="/pharmacy/medicines" className="pharmacy-btn pharmacy-btn-secondary">
          <ArrowLeft size={16} /> Back to Medicines
        </Link>
      </div>
    );
  }

  const catalog = medicine?.medicine || {};

  return (
    <div className="pharmacy-main-content">
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          to="/pharmacy/medicines"
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
          <ArrowLeft size={16} /> Back to Medicine Catalog
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
            <h1 className="pharmacy-page-title" style={{ margin: 0 }}>
              {catalog.name || "Medicine Details"}
            </h1>
            <span
              className={`pharmacy-badge ${
                medicine.isAvailable ? "pharmacy-badge-available" : "pharmacy-badge-unavailable"
              }`}
            >
              {medicine.isAvailable ? "Available in Store" : "Unavailable"}
            </span>
            {catalog.requiresPrescription && (
              <span className="pharmacy-badge pharmacy-badge-pending">
                Prescription Required (Rx)
              </span>
            )}
          </div>
          <p className="pharmacy-page-subtitle">
            {catalog.strength} &bull; {catalog.dosageForm} &bull; {catalog.category?.name || "General"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="pharmacy-btn pharmacy-btn-secondary"
            onClick={() => setIsEditingListing(!isEditingListing)}
          >
            <Edit2 size={15} /> {isEditingListing ? "Cancel Editing" : "Edit Price / Status"}
          </button>
          <button
            className="pharmacy-btn pharmacy-btn-primary"
            onClick={() => {
              setBatchError(null);
              setShowAddBatchModal(true);
            }}
          >
            <Plus size={16} /> Add Inventory Batch
          </button>
          <button
            className="pharmacy-btn pharmacy-btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            title="Remove medicine listing from your pharmacy"
          >
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditingListing && (
        <div className="pharmacy-card" style={{ marginBottom: "24px", border: "2px solid var(--ph-primary)" }}>
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Edit2 size={16} color="var(--ph-primary)" /> Edit Selling Price &amp; Availability
            </h3>
          </div>
          <div className="pharmacy-card-body">
            <form onSubmit={handleUpdateListing}>
              <div className="pharmacy-form-grid" style={{ marginBottom: "16px" }}>
                <div className="pharmacy-form-group">
                  <label className="pharmacy-label">Your Selling Price (&#8377;)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="pharmacy-input"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 150.00"
                  />
                  <small style={{ color: "var(--ph-text-muted)", fontSize: "11px", marginTop: "4px" }}>
                    Standard MRP: &#8377;{catalog.mrp ? Number(catalog.mrp).toFixed(2) : "N/A"}
                  </small>
                </div>

                <div className="pharmacy-form-group">
                  <label className="pharmacy-label">Customer Visibility Status</label>
                  <select
                    className="pharmacy-select"
                    style={{ width: "100%", padding: "10px 12px" }}
                    value={editAvailable ? "true" : "false"}
                    onChange={(e) => setEditAvailable(e.target.value === "true")}
                  >
                    <option value="true">Available (Active in Customer Search)</option>
                    <option value="false">Unavailable (Temporarily Hidden)</option>
                  </select>
                  <small style={{ color: "var(--ph-text-muted)", fontSize: "11px", marginTop: "4px" }}>
                    Controls whether customers can view and reserve this medicine at your pharmacy.
                  </small>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="pharmacy-btn pharmacy-btn-secondary"
                  onClick={() => setIsEditingListing(false)}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pharmacy-btn pharmacy-btn-primary"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? "Saving..." : "Save Listing Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4 Metrics Cards */}
      <div className="pharmacy-grid pharmacy-grid-4" style={{ marginBottom: "24px" }}>
        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Selling Price</span>
            <div className="pharmacy-metric-icon icon-blue">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value">&#8377;{Number(medicine.sellingPrice).toFixed(2)}</div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Catalog MRP: &#8377;{catalog.mrp ? Number(catalog.mrp).toFixed(2) : "N/A"}
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Available Stock</span>
            <div className="pharmacy-metric-icon icon-green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-success)" }}>
            {medicine.availableStock} <span style={{ fontSize: "14px", fontWeight: "normal" }}>units</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Ready for customer order
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Reserved Stock</span>
            <div className="pharmacy-metric-icon icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-warning)" }}>
            {medicine.reservedStock} <span style={{ fontSize: "14px", fontWeight: "normal" }}>units</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Locked in active orders
          </div>
        </div>

        <div className="pharmacy-metric-card">
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Total Recorded Stock</span>
            <div className="pharmacy-metric-icon icon-cyan">
              <Package size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value">
            {medicine.totalStock} <span style={{ fontSize: "14px", fontWeight: "normal" }}>units</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Across {medicine.batches?.length || 0} batches
          </div>
        </div>
      </div>

      {/* Grid: Master Catalog Specifications & Batches */}
      <div className="pharmacy-grid pharmacy-grid-2" style={{ marginBottom: "24px" }}>
        {/* Specification Card */}
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} color="var(--ph-primary)" /> Medicine Specifications
            </h3>
          </div>
          <div className="pharmacy-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Generic Name
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{catalog.genericName || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Manufacturer
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{catalog.manufacturer || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Dosage Form
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{catalog.dosageForm || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Strength
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{catalog.strength || "—"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Category
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>{catalog.category?.name || "General"}</div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Requires Prescription
                </div>
                <div style={{ fontWeight: "600", marginTop: "2px" }}>
                  {catalog.requiresPrescription ? "Yes (Rx Required)" : "No (Over The Counter)"}
                </div>
              </div>

              {catalog.composition && (
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                    Composition
                  </div>
                  <div style={{ fontWeight: "500", marginTop: "2px", color: "var(--ph-text-main)" }}>
                    {catalog.composition}
                  </div>
                </div>
              )}

              {catalog.description && (
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                    Description
                  </div>
                  <div style={{ marginTop: "2px", color: "var(--ph-text-muted)", lineHeight: "1.5" }}>
                    {catalog.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Regulatory & Safety Card */}
        <div className="pharmacy-card">
          <div className="pharmacy-card-header">
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={16} color="var(--ph-success)" /> Storage &amp; Regulatory Information
            </h3>
          </div>
          <div className="pharmacy-card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Storage Instructions
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px" }}>
                  {catalog.storage || "Store below 25°C in a cool and dry place away from direct sunlight."}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Side Effects / Cautions
                </div>
                <div style={{ fontWeight: "500", marginTop: "2px", color: "var(--ph-text-muted)" }}>
                  {catalog.sideEffects || "Consult licensed pharmacist or physician before dispensing."}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--ph-border-subtle)", paddingTop: "12px" }}>
                <div style={{ color: "var(--ph-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Catalog Identification
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "2px" }}>
                  Master ID: {catalog.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Table Section */}
      <div className="pharmacy-card">
        <div
          className="pharmacy-card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}
        >
          <div>
            <h3 className="pharmacy-card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={16} color="var(--ph-primary)" /> Associated Inventory Batches
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ph-text-muted)" }}>
              Batches registered for {catalog.name} sorted by earliest expiry date.
            </p>
          </div>
          <button
            className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm"
            onClick={() => {
              setBatchError(null);
              setShowAddBatchModal(true);
            }}
          >
            <Plus size={14} /> Add New Batch
          </button>
        </div>

        <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Mfg Date</th>
                <th>Expiry Date</th>
                <th>Total Qty</th>
                <th>Reserved Qty</th>
                <th>Available Qty</th>
                <th>Expiry Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicine.batches && medicine.batches.length > 0 ? (
                medicine.batches.map((batch) => {
                  const status = getExpiryStatus(batch);
                  return (
                    <tr key={batch.id}>
                      <td style={{ fontWeight: "600", fontFamily: "monospace", color: "var(--ph-text-main)" }}>
                        {batch.batchNumber}
                      </td>
                      <td>{new Date(batch.manufacturingDate).toLocaleDateString()}</td>
                      <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td style={{ fontWeight: "600" }}>{batch.quantity}</td>
                      <td style={{ color: batch.reservedQuantity > 0 ? "var(--ph-warning)" : "var(--ph-text-muted)" }}>
                        {batch.reservedQuantity}
                      </td>
                      <td style={{ fontWeight: "700", color: "var(--ph-success)" }}>
                        {batch.availableQuantity}
                      </td>
                      <td>
                        <span className={`pharmacy-badge ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/pharmacy/inventory/${batch.id}`}
                          className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                        >
                          Manage Batch <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "36px 20px" }}>
                    <Layers size={32} color="var(--ph-text-subtle)" style={{ marginBottom: "8px", opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: "500", color: "var(--ph-text-muted)" }}>
                      No inventory batches registered for this medicine yet.
                    </p>
                    <p style={{ margin: "4px 0 16px", fontSize: "12px", color: "var(--ph-text-subtle)" }}>
                      Add a batch to record physical stock, manufacturing date, and expiry date.
                    </p>
                    <button
                      className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm"
                      onClick={() => {
                        setBatchError(null);
                        setShowAddBatchModal(true);
                      }}
                    >
                      <Plus size={14} /> Add First Batch
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="pharmacy-modal-overlay" onClick={() => setShowAddBatchModal(false)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title">
                Add Inventory Batch &bull; {catalog.name}
              </h3>
              <button
                className="pharmacy-modal-close"
                onClick={() => setShowAddBatchModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBatch}>
              <div className="pharmacy-modal-body">
                {batchError && (
                  <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "16px" }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: "12px" }}>{batchError}</span>
                  </div>
                )}

                <div className="pharmacy-form-group" style={{ marginBottom: "14px" }}>
                  <label className="pharmacy-label">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-X1"
                    className="pharmacy-input"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                  />
                  <small style={{ color: "var(--ph-text-muted)", fontSize: "11px" }}>
                    Must be unique for this medicine in your pharmacy.
                  </small>
                </div>

                <div className="pharmacy-form-grid" style={{ marginBottom: "14px" }}>
                  <div className="pharmacy-form-group">
                    <label className="pharmacy-label">Manufacturing Date *</label>
                    <input
                      type="date"
                      required
                      className="pharmacy-input"
                      value={manufacturingDate}
                      onChange={(e) => setManufacturingDate(e.target.value)}
                    />
                  </div>

                  <div className="pharmacy-form-group">
                    <label className="pharmacy-label">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      className="pharmacy-input"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pharmacy-form-group">
                  <label className="pharmacy-label">Stock Quantity (Units) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 100"
                    className="pharmacy-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="pharmacy-modal-footer">
                <button
                  type="button"
                  className="pharmacy-btn pharmacy-btn-secondary"
                  onClick={() => setShowAddBatchModal(false)}
                  disabled={submittingBatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pharmacy-btn pharmacy-btn-primary"
                  disabled={submittingBatch}
                >
                  {submittingBatch ? "Adding Batch..." : "Register Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="pharmacy-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title" style={{ color: "var(--ph-danger)" }}>
                Remove Medicine Listing
              </h3>
              <button
                className="pharmacy-modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                &times;
              </button>
            </div>
            <div className="pharmacy-modal-body">
              <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: "1.5" }}>
                Are you sure you want to remove <strong>{catalog.name}</strong> from your pharmacy?
              </p>
              <div className="pharmacy-banner pharmacy-banner-danger">
                <AlertTriangle size={18} />
                <span style={{ fontSize: "12px" }}>
                  This will also remove all associated inventory batches. If any units are actively reserved by
                  customers, deletion will be blocked to protect pending orders.
                </span>
              </div>
            </div>
            <div className="pharmacy-modal-footer">
              <button
                type="button"
                className="pharmacy-btn pharmacy-btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingListing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pharmacy-btn pharmacy-btn-danger"
                onClick={handleDeleteListing}
                disabled={deletingListing}
              >
                {deletingListing ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
