import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { pharmacyService } from "../../services/pharmacy";
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Tag,
  Layers,
} from "lucide-react";

export function PharmacyMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Modals & Action States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCatalogMed, setSelectedCatalogMed] = useState(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Edit Price Modal
  const [editingMed, setEditingMed] = useState(null);
  const [editPriceVal, setEditPriceVal] = useState("");

  const fetchMedicines = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await pharmacyService.getMedicines({
          page,
          limit: pagination.limit,
          search: search.trim() || undefined,
          categoryId: categoryFilter,
          isAvailable: availabilityFilter,
        });
        setMedicines(res.items);
        setPagination(res.pagination);
      } catch (err) {
        setError(err.message || "Failed to load medicines");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, search, categoryFilter, availabilityFilter]
  );

  const fetchCategories = async () => {
    try {
      const cats = await pharmacyService.getCategories();
      setCategories(cats);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMedicines(1);
  }, [categoryFilter, availabilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines(1);
  };

  const handleCatalogSearch = async (e) => {
    e?.preventDefault();
    setCatalogLoading(true);
    try {
      const res = await pharmacyService.getCatalog({
        search: catalogQuery.trim() || undefined,
        limit: 8,
      });
      setCatalogResults(res.items);
    } catch (err) {
      alert(err.message || "Catalog search failed");
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleAddMedicineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCatalogMed) {
      alert("Please select a medicine from the catalog search results.");
      return;
    }
    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid selling price greater than zero.");
      return;
    }

    setActionLoading(true);
    try {
      await pharmacyService.createMedicine({
        medicineId: selectedCatalogMed.id,
        sellingPrice: priceNum,
        isAvailable: true,
      });
      setActionMessage({ type: "success", text: `${selectedCatalogMed.name} added to pharmacy!` });
      setAddModalOpen(false);
      setSelectedCatalogMed(null);
      setSellingPrice("");
      setCatalogQuery("");
      setCatalogResults([]);
      await fetchMedicines(1);
    } catch (err) {
      alert(err.message || "Failed to add medicine");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async (med) => {
    const newStatus = !med.isAvailable;
    try {
      await pharmacyService.updateMedicine(med.id, { isAvailable: newStatus });
      setMedicines((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, isAvailable: newStatus } : m))
      );
      setActionMessage({
        type: "success",
        text: `${med.medicine.name} marked as ${newStatus ? "Available" : "Unavailable"}`,
      });
    } catch (err) {
      alert(err.message || "Failed to update availability");
    }
  };

  const handleSavePriceEdit = async (e) => {
    e.preventDefault();
    if (!editingMed) return;
    const priceNum = parseFloat(editPriceVal);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Price must be greater than zero");
      return;
    }

    setActionLoading(true);
    try {
      await pharmacyService.updateMedicine(editingMed.id, { sellingPrice: priceNum });
      setMedicines((prev) =>
        prev.map((m) => (m.id === editingMed.id ? { ...m, sellingPrice: priceNum } : m))
      );
      setEditingMed(null);
      setActionMessage({ type: "success", text: "Selling price updated successfully!" });
    } catch (err) {
      alert(err.message || "Failed to update price");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedicine = async (med) => {
    if (!window.confirm(`Are you sure you want to remove ${med.medicine.name} from your pharmacy listings?`)) {
      return;
    }

    try {
      await pharmacyService.deleteMedicine(med.id);
      setActionMessage({ type: "success", text: "Medicine listing removed." });
      await fetchMedicines(pagination.page);
    } catch (err) {
      alert(err.message || "Failed to delete medicine listing");
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="pharmacy-section-header">
        <div>
          <h1 className="pharmacy-section-title">Manage Medicine Listings</h1>
          <p className="pharmacy-section-subtitle">
            Configure medicines offered by your store, set custom selling prices, and control public availability.
          </p>
        </div>

        <button
          onClick={() => {
            setAddModalOpen(true);
            handleCatalogSearch();
          }}
          className="pharmacy-btn pharmacy-btn-primary"
        >
          <Plus size={16} />
          <span>Add Medicine from Catalog</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`pharmacy-banner ${
            actionMessage.type === "success" ? "pharmacy-banner-verified" : "pharmacy-banner-rejected"
          }`}
          style={{ padding: "12px 18px", marginBottom: "20px" }}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="pharmacy-toolbar">
        <form onSubmit={handleSearchSubmit} className="pharmacy-toolbar-group">
          <div className="pharmacy-search-box">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search medicine, generic, or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pharmacy-search-input"
            />
          </div>
          <button type="submit" className="pharmacy-btn pharmacy-btn-primary pharmacy-btn-sm">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchMedicines(1);
              }}
              className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
            >
              Clear
            </button>
          )}
        </form>

        <div className="pharmacy-toolbar-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pharmacy-select"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Availability:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="pharmacy-select"
            >
              <option value="all">All Statuses</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="pharmacy-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            Loading pharmacy medicines...
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
            {error}
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            No medicines found matching criteria. Click &quot;Add Medicine from Catalog&quot; to list your first medicine.
          </div>
        ) : (
          <div className="pharmacy-table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="pharmacy-table">
              <thead>
                <tr>
                  <th>Medicine Details</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Available Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{m.medicine.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {m.medicine.genericName} · {m.medicine.manufacturer}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "#334155",
                        }}
                      >
                        {m.medicine.category?.name || "General"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                          ₹{m.sellingPrice.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingMed(m);
                            setEditPriceVal(m.sellingPrice);
                          }}
                          className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                          style={{ padding: "2px 6px" }}
                          title="Edit Price"
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: m.availableStock > 0 ? "#059669" : "#dc2626" }}>
                        {m.availableStock} units
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {m.batchCount} {m.batchCount === 1 ? "batch" : "batches"}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(m)}
                        className={`pharmacy-badge ${
                          m.isAvailable ? "pharmacy-badge-available" : "pharmacy-badge-unavailable"
                        }`}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Click to toggle availability"
                      >
                        {m.isAvailable ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{m.isAvailable ? "Available" : "Unavailable"}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                        <Link
                          to={`/pharmacy/medicines/${m.id}`}
                          className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                          title="Inspect Details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Link>

                        <button
                          onClick={() => handleDeleteMedicine(m)}
                          className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
                          style={{ color: "#ef4444" }}
                          title="Delete Listing"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="pharmacy-pagination">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="pharmacy-pagination-btns">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchMedicines(pagination.page - 1)}
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchMedicines(pagination.page + 1)}
                className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {addModalOpen && (
        <div className="pharmacy-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="pharmacy-modal-header">
              <h3 className="pharmacy-modal-title">Add Medicine from Master Catalog</h3>
              <button onClick={() => setAddModalOpen(false)} className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="pharmacy-modal-body">
              {/* Catalog Search Bar */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Search catalog by brand name or composition..."
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="pharmacy-search-input"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                  }}
                />
                <button
                  onClick={handleCatalogSearch}
                  disabled={catalogLoading}
                  className="pharmacy-btn pharmacy-btn-primary"
                >
                  <Search size={14} />
                  <span>Search</span>
                </button>
              </div>

              {/* Search Results List */}
              <div
                style={{
                  maxHeight: "220px",
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                {catalogLoading ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    Searching medicine catalog...
                  </div>
                ) : catalogResults.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                    No medicines found in catalog. Try searching with a different keyword.
                  </div>
                ) : (
                  catalogResults.map((med) => {
                    const isSelected = selectedCatalogMed?.id === med.id;
                    return (
                      <div
                        key={med.id}
                        onClick={() => setSelectedCatalogMed(med)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background 0.15s",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{med.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {med.genericName} · {med.manufacturer} · {med.composition}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} color="#2563eb" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Price Setup Form */}
              {selectedCatalogMed && (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "8px" }}>
                    Selected: {selectedCatalogMed.name}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Pharmacy Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 45.00"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        width: "100%",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pharmacy-modal-footer">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="pharmacy-btn pharmacy-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMedicineSubmit}
                disabled={!selectedCatalogMed || !sellingPrice || actionLoading}
                className="pharmacy-btn pharmacy-btn-primary"
              >
                {actionLoading ? "Adding..." : "Add to My Store"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingMed && (
        <div className="pharmacy-modal-overlay" onClick={() => setEditingMed(null)}>
          <div className="pharmacy-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <form onSubmit={handleSavePriceEdit}>
              <div className="pharmacy-modal-header">
                <h3 className="pharmacy-modal-title">Update Selling Price</h3>
                <button type="button" onClick={() => setEditingMed(null)} className="pharmacy-btn pharmacy-btn-secondary pharmacy-btn-sm">
                  <X size={16} />
                </button>
              </div>

              <div className="pharmacy-modal-body">
                <p style={{ margin: "0 0 12px", color: "#475569", fontSize: "13px" }}>
                  Set a new retail price for <strong>{editingMed.medicine.name}</strong>.
                </p>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editPriceVal}
                    onChange={(e) => setEditPriceVal(e.target.value)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      width: "100%",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div className="pharmacy-modal-footer">
                <button type="button" onClick={() => setEditingMed(null)} className="pharmacy-btn pharmacy-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="pharmacy-btn pharmacy-btn-primary">
                  {actionLoading ? "Saving..." : "Save Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacyMedicines;
