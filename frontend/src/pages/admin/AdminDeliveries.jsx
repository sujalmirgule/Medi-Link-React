import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { deliveryService } from "../../services/delivery";
import {
  Truck,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Store,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [eligiblePartners, setEligiblePartners] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  const fetchDeliveries = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryService.getDeliveriesAdmin({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setDeliveries(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDeliveries(1);
  }, [fetchDeliveries]);

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignError("");
    setAssignSuccess("");
    setSelectedOrderId("");
    setSelectedPartnerId("");
    try {
      const [orders, partners] = await Promise.all([
        deliveryService.getEligibleOrdersAdmin(),
        deliveryService.getEligiblePartnersAdmin(),
      ]);
      setEligibleOrders(orders);
      setEligiblePartners(partners);
      if (orders.length > 0) setSelectedOrderId(orders[0].id);
      if (partners.length > 0) setSelectedPartnerId(partners[0].id);
    } catch (err) {
      setAssignError(err.message || "Failed to fetch eligible orders or partners");
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedPartnerId) {
      setAssignError("Please select both an eligible order and an available delivery partner.");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    try {
      await deliveryService.assignDeliveryAdmin(selectedOrderId, selectedPartnerId);
      setAssignSuccess("Delivery partner successfully assigned!");
      setTimeout(() => {
        setShowAssignModal(false);
        setAssignSuccess("");
        fetchDeliveries(1);
      }, 1200);
    } catch (err) {
      setAssignError(err.message || "Failed to assign delivery partner");
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ASSIGNED":
        return { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };
      case "ACCEPTED":
        return { bg: "#fef3c7", text: "#b45309", border: "#fde68a" };
      case "PICKED_UP":
        return { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" };
      case "OUT_FOR_DELIVERY":
        return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
      case "DELIVERED":
        return { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" };
      case "FAILED":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 750, color: "#0f172a", margin: 0 }}>
            Delivery Management
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
            Monitor live shipments, dispatch partners to ready orders, and review logistics telemetry.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => fetchDeliveries(pagination.page)}
            disabled={loading}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAssignModal}
            className="admin-btn admin-btn-primary admin-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} />
            <span>Assign Partner</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "20px",
          paddingBottom: "8px",
          overflowX: "auto",
        }}
      >
        {[
          { key: "all", label: "All Deliveries" },
          { key: "ASSIGNED", label: "Assigned" },
          { key: "PICKED_UP", label: "Picked Up" },
          { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
          { key: "DELIVERED", label: "Delivered" },
          { key: "FAILED", label: "Failed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: statusFilter === tab.key ? "#087ac7" : "transparent",
              color: statusFilter === tab.key ? "#ffffff" : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            padding: "12px 16px",
            borderRadius: "10px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Deliveries Table Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <RefreshCw size={28} className="spin" style={{ color: "#087ac7", marginBottom: "12px" }} />
            <div>Loading deliveries...</div>
          </div>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Truck size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>
              No Deliveries Found
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Click &quot;Assign Partner&quot; to dispatch ready customer orders.
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>Order / ID</th>
                <th style={{ padding: "12px 16px" }}>Delivery Partner</th>
                <th style={{ padding: "12px 16px" }}>Pharmacy</th>
                <th style={{ padding: "12px 16px" }}>Customer Destination</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Assigned At</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((item) => {
                const badge = getStatusBadge(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        #{item.order?.orderNumber}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                        ID: {item.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={13} color="#087ac7" /> {item.deliveryPartner?.fullName || "Unassigned"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {item.deliveryPartner?.vehicleNumber} ({item.deliveryPartner?.vehicleType})
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {item.order?.pharmacy?.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {item.order?.pharmacy?.city}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {item.order?.customer?.fullName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {item.deliveryAddress?.city}, {item.deliveryAddress?.pincode}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "12px" }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <Link
                        to={`/admin/deliveries/${item.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#087ac7",
                          textDecoration: "none",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        Details <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Total: {pagination.total} deliveries
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => fetchDeliveries(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => fetchDeliveries(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ padding: "8px", background: "#e0f2fe", borderRadius: "10px", color: "#087ac7" }}>
                <Truck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", fontWeight: 700 }}>
                  Assign Delivery Partner
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Select an order in READY_FOR_PICKUP and an active, available partner.
                </p>
              </div>
            </div>

            {assignSuccess && (
              <div style={{ background: "#d1fae5", color: "#065f46", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                ✓ {assignSuccess}
              </div>
            )}

            {assignError && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              {/* Order Select */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Select Eligible Order ({eligibleOrders.length} ready)
                </label>
                {eligibleOrders.length === 0 ? (
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", color: "#94a3b8" }}>
                    No orders currently in READY_FOR_PICKUP with HOME_DELIVERY.
                  </div>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    required
                  >
                    {eligibleOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        Order #{ord.orderNumber} — Pharmacy: {ord.pharmacy?.name} ({ord.deliveryAddress?.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Partner Select */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Select Available Partner ({eligiblePartners.length} available)
                </label>
                {eligiblePartners.length === 0 ? (
                  <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", color: "#94a3b8" }}>
                    No verified delivery partners are currently online and available without an active order.
                  </div>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    required
                  >
                    {eligiblePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.vehicleType}) — City: {p.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="admin-btn admin-btn-secondary"
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={assignLoading || eligibleOrders.length === 0 || eligiblePartners.length === 0}
                >
                  {assignLoading ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDeliveries;
