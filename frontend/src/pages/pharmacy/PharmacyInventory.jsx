import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { pharmacyService } from "../../services/pharmacy";
import {
  Layers,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
} from "lucide-react";

export default function PharmacyInventory() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [batches, setBatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters from query params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  // Add Batch Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newMfgDate, setNewMfgDate] = useState("");
  const [newExpDate, setNewExpDate] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [modalError, setModalError] = useState(null);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Metric counts summary
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pharmacyService.getInventory({
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter,
      });

      setBatches(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });

      // Also compute or update summary counts from dashboard if available
      try {
        const dash = await pharmacyService.getDashboard();
        setSummaryCounts({
          total: dash.metrics?.totalBatches || 0,
          active: dash.metrics?.activeBatches || 0,
          expiringSoon: dash.metrics?.expiringSoonBatches || 0,
          expired: dash.metrics?.expiredBatches || 0,
        });
      } catch {
        // Fallback gracefully
      }
    } catch (err) {
      setError(err.message || "Failed to load inventory batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchParams({
      search,
      status: statusFilter,
      page: "1",
    });
    fetchInventory();
  };

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    setSearchParams({
      search,
      status: newStatus,
      page: "1",
    });
  };

  const openAddBatchModal = async () => {
    setModalError(null);
    setShowAddModal(true);
    setLoadingMedicines(true);
    try {
      const res = await pharmacyService.getMedicines({ limit: 100 });
      setPharmacyMedicines(res.items || []);
      if (res.items && res.items.length > 0) {
        setSelectedMedicineId(res.items[0].id);
      }
    } catch (err) {
      setModalError("Failed to load your pharmacy medicines. Please ensure you have listed at least one medicine.");
    } finally {
      setLoadingMedicines(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmittingBatch(true);

    try {
      if (!selectedMedicineId) throw new Error("Please select a medicine.");
      if (!newBatchNumber.trim()) throw new Error("Batch number is required.");
      if (!newMfgDate) throw new Error("Manufacturing date is required.");
      if (!newExpDate) throw new Error("Expiry date is required.");
      if (new Date(newExpDate) <= new Date(newMfgDate)) {
        throw new Error("Expiry date must be after manufacturing date.");
      }
      const qty = parseInt(newQuantity, 10);
      if (isNaN(qty) || qty < 1) {
        throw new Error("Quantity must be a positive integer.");
      }

      await pharmacyService.createInventoryBatch({
        pharmacyMedicineId: selectedMedicineId,
        batchNumber: newBatchNumber.trim().toUpperCase(),
        manufacturingDate: newMfgDate,
        expiryDate: newExpDate,
        quantity: qty,
      });

      setShowAddModal(false);
      setNewBatchNumber("");
      setNewMfgDate("");
      setNewExpDate("");
      setNewQuantity("");
      setSuccessMsg("Batch created successfully.");
      await fetchInventory();
    } catch (err) {
      setModalError(err.message || "Failed to create inventory batch.");
    } finally {
      setSubmittingBatch(false);
    }
  };

  const getStatusBadge = (batch) => {
    if (batch.isExpired) {
      return { label: "Expired", className: "pharmacy-badge-expired" };
    }
    if (batch.isExpiringSoon) {
      return { label: "Expiring Soon", className: "pharmacy-badge-expiring" };
    }
    return { label: "Valid", className: "pharmacy-badge-verified" };
  };

  return (
    <div className="pharmacy-main-content">
      {/* Notifications */}
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
          <h1 className="pharmacy-page-title">Inventory &amp; Batch Management</h1>
          <p className="pharmacy-page-subtitle">
            Manage pharmaceutical stock batches, expiration dates, and reservation counts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="pharmacy-btn pharmacy-btn-secondary"
            onClick={fetchInventory}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "pharmacy-spinner" : ""} /> Refresh
          </button>
          <button className="pharmacy-btn pharmacy-btn-primary" onClick={openAddBatchModal}>
            <Plus size={16} /> Add Inventory Batch
          </button>
        </div>
      </div>

      {/* Summary Filter Cards */}
      <div className="pharmacy-grid pharmacy-grid-4" style={{ marginBottom: "24px" }}>
        <div
          className="pharmacy-metric-card"
          onClick={() => handleFilterChange("all")}
          style={{
            cursor: "pointer",
            border: statusFilter === "all" ? "2px solid var(--ph-primary)" : undefined,
          }}
        >
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">All Batches</span>
            <div className="pharmacy-metric-icon icon-blue">
              <Layers size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value">{summaryCounts.total}</div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Total registered batches
          </div>
        </div>

        <div
          className="pharmacy-metric-card"
          onClick={() => handleFilterChange("active")}
          style={{
            cursor: "pointer",
            border: statusFilter === "active" ? "2px solid var(--ph-success)" : undefined,
          }}
        >
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Active &amp; Valid</span>
            <div className="pharmacy-metric-icon icon-green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-success)" }}>
            {summaryCounts.active}
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Available for dispensing
          </div>
        </div>

        <div
          className="pharmacy-metric-card"
          onClick={() => handleFilterChange("expiring_soon")}
          style={{
            cursor: "pointer",
            border: statusFilter === "expiring_soon" ? "2px solid var(--ph-warning)" : undefined,
          }}
        >
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Expiring Soon</span>
            <div className="pharmacy-metric-icon icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-warning)" }}>
            {summaryCounts.expiringSoon}
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Expires within 30 days
          </div>
        </div>

        <div
          className="pharmacy-metric-card"
          onClick={() => handleFilterChange("expired")}
          style={{
            cursor: "pointer",
            border: statusFilter === "expired" ? "2px solid var(--ph-danger)" : undefined,
          }}
        >
          <div className="pharmacy-metric-header">
            <span className="pharmacy-metric-title">Expired</span>
            <div className="pharmacy-metric-icon icon-rose">
              <XCircle size={18} />
            </div>
          </div>
          <div className="pharmacy-metric-value" style={{ color: "var(--ph-danger)" }}>
            {summaryCounts.expired}
          </div>
          <div style={{ fontSize: "12px", color: "var(--ph-text-muted)", marginTop: "4px" }}>
            Blocked from dispensing
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filter Dropdown */}
      <div className="pharmacy-toolbar">
        <form onSubmit={handleSearchSubmit} className="pharmacy-toolbar-group" style={{ flex: 1 }}>
          <div className="pharmacy-search-box" style={{ width: "100%", maxWidth: "420px" }}>
            <Search size={16} color="var(--ph-text-muted)" />
            <input
              type="text"
              placeholder="Search by batch number or medicine name..."
              className="pharmacy-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="pharmacy-btn pharmacy-btn-secondary">
            Search
          </button>
        </form>

        <div className="pharmacy-toolbar-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--ph-text-muted)" }}>
            <Filter size={15} /> Filter Status:
          </div>
          <select
            className="pharmacy-select"
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active / Valid</option>
            <option value="expiring_soon">Expiring Soon (30 Days)</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Inventory Batches Table */}
      <div className="pharmacy-card">
        <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
          {loading ? (
            <div className="pharmacy-loading-state" style={{ minHeight: "300px" }}>
              <RefreshCw className="pharmacy-spinner" size={28} />
              <p>Loading inventory batches...</p>
            </div>
          ) : (
            <table className="pharmacy-table">
              <thead>
                <tr>
                  <th>Medicine Details</th>
                  <th>Batch Number</th>
                  <th>Mfg Date</th>
                  <th>Expiry Date</th>
                  <th>Total Qty</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.length > 0 ? (
                  batches.map((batch) => {
                    const status = getStatusBadge(batch);
                    const med = batch.medicine || {};
                    return (
                      <tr key={batch.id}>
                        <td>
                          <div style={{ fontWeight: "600", color: "var(--ph-text-main)" }}>
                            {med.name || "Unknown Medicine"}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ph-text-muted)", marginTop: "2px" }}>
                            {med.strength} &bull; {med.dosageForm}
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: "600", color: "var(--ph-text-main)" }}>
                          {batch.batchNumber}
                        </td>
                        <td>{new Date(batch.manufacturingDate).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {new Date(batch.expiryDate).toLocaleDateString()}
                            {batch.isExpired && <XCircle size={14} color="var(--ph-danger)" />}
                            {batch.isExpiringSoon && <Clock size={14} color="var(--ph-warning)" />}
                          </div>
                        </td>
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
                            Manage <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "48px 20px" }}>
                      <Layers size={36} color="var(--ph-text-subtle)" style={{ marginBottom: "8px", opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: "600", color: "var(--ph-text-muted)" }}>
                        No inventory batches found matching criteria.
                      </p>
                      <p style={{ margin: "4px 0 16px", fontSize: "12px", color: "var(--ph-text-subtle)" }}>
                        {search || statusFilter !== "all"
                          ? "Try clearing filters or search keywords."
                          : "Start recording physical stock by adding a new batch."}
                      </p>
                      <button className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm" onClick={openAddBatchModal}>
                        <Plus size={14} /> Add First Batch
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: "1px solid var(--ph-border)",
            }}
          >
            <span style={{ fontSize: "13px", color: "var(--ph-text-muted)" }}>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total batches)
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const p = pagination.page - 1;
                  setCurrentPage(p);
                  setSearchParams({ search, status: statusFilter, page: String(p) });
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const p = pagination.page + 1;
                  setCurrentPage(p);
                  setSearchParams({ search, status: statusFilter, page: String(p) });
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="pharmacy-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title">Register New Inventory Batch</h3>
              <button className="pharmacy-modal-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div className="pharmacy-modal-body">
                {modalError && (
                  <div className="pharmacy-banner pharmacy-banner-danger" style={{ marginBottom: "16px" }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: "12px" }}>{modalError}</span>
                  </div>
                )}

                {loadingMedicines ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <RefreshCw className="pharmacy-spinner" size={24} />
                    <p style={{ fontSize: "12px", color: "var(--ph-text-muted)" }}>Loading your medicines...</p>
                  </div>
                ) : pharmacyMedicines.length === 0 ? (
                  <div className="pharmacy-banner pharmacy-banner-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>No Medicines Listed:</strong> You must first add a medicine from the master catalog
                      before you can register an inventory batch.
                      <div style={{ marginTop: "8px" }}>
                        <Link to="/pharmacy/medicines" className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm">
                          Go to Medicines Catalog
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pharmacy-form-group" style={{ marginBottom: "14px" }}>
                      <label className="pharmacy-label">Select Listed Medicine *</label>
                      <select
                        className="pharmacy-select"
                        style={{ width: "100%", padding: "10px 12px" }}
                        value={selectedMedicineId}
                        onChange={(e) => setSelectedMedicineId(e.target.value)}
                        required
                      >
                        {pharmacyMedicines.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.medicine?.name} ({item.medicine?.strength} - {item.medicine?.dosageForm}) - &#8377;
                            {Number(item.sellingPrice).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pharmacy-form-group" style={{ marginBottom: "14px" }}>
                      <label className="pharmacy-label">Batch Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BATCH-2026-A1"
                        className="pharmacy-input"
                        value={newBatchNumber}
                        onChange={(e) => setNewBatchNumber(e.target.value)}
                      />
                      <small style={{ color: "var(--ph-text-muted)", fontSize: "11px" }}>
                        Assigned manufacturer batch or lot identifier.
                      </small>
                    </div>

                    <div className="pharmacy-form-grid" style={{ marginBottom: "14px" }}>
                      <div className="pharmacy-form-group">
                        <label className="pharmacy-label">Manufacturing Date *</label>
                        <input
                          type="date"
                          required
                          className="pharmacy-input"
                          value={newMfgDate}
                          onChange={(e) => setNewMfgDate(e.target.value)}
                        />
                      </div>

                      <div className="pharmacy-form-group">
                        <label className="pharmacy-label">Expiry Date *</label>
                        <input
                          type="date"
                          required
                          className="pharmacy-input"
                          value={newExpDate}
                          onChange={(e) => setNewExpDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pharmacy-form-group">
                      <label className="pharmacy-label">Initial Physical Stock (Units) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 200"
                        className="pharmacy-input"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pharmacy-modal-footer">
                <button
                  type="button"
                  className="pharmacy-btn pharmacy-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingBatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pharmacy-btn pharmacy-btn-primary"
                  disabled={submittingBatch || pharmacyMedicines.length === 0}
                >
                  {submittingBatch ? "Registering Batch..." : "Register Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
