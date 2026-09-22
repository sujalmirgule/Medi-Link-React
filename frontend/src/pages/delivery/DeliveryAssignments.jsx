import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { deliveryService } from "../../services/delivery";
import {
  PackageCheck,
  Store,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function DeliveryAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryService.getAssignments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setAssignments(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load delivery assignments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAssignments(1);
  }, [fetchAssignments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ASSIGNED":
        return { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd", label: "Assigned" };
      case "ACCEPTED":
        return { bg: "#fef3c7", text: "#b45309", border: "#fde68a", label: "Accepted" };
      case "PICKED_UP":
        return { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe", label: "Picked Up" };
      case "OUT_FOR_DELIVERY":
        return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe", label: "Out for Delivery" };
      case "DELIVERED":
        return { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0", label: "Delivered" };
      case "FAILED":
        return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", label: "Failed" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0", label: status };
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            Delivery Assignments
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
            Track and process your assigned customer prescription shipments.
          </p>
        </div>

        <button
          onClick={() => fetchAssignments(pagination.page)}
          disabled={loading}
          className="delivery-btn delivery-btn-secondary delivery-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          paddingBottom: "8px",
          overflowX: "auto",
        }}
      >
        {[
          { key: "all", label: "All Active" },
          { key: "ASSIGNED", label: "New Assigned" },
          { key: "ACCEPTED", label: "Accepted" },
          { key: "PICKED_UP", label: "Picked Up" },
          { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
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
              background: statusFilter === tab.key ? "#0284c7" : "transparent",
              color: statusFilter === tab.key ? "#ffffff" : "#64748b",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "14px 18px",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={18} />
          <span style={{ fontSize: "13px" }}>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <RefreshCw size={28} className="spin" style={{ color: "#0284c7", marginBottom: "12px" }} />
          <div style={{ fontSize: "14px" }}>Loading delivery assignments...</div>
        </div>
      ) : assignments.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <PackageCheck size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#1e293b" }}>
            No Delivery Assignments Found
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {statusFilter === "all"
              ? "You do not have any active delivery orders right now."
              : `No orders currently match status '${statusFilter}'.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {assignments.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "20px 24px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>
                        Delivery ID:
                      </span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                        {item.id.slice(0, 8)}...
                      </span>
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
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "4px" }}>
                      Order #{item.order?.orderNumber}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Order Total</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0284c7" }}>
                      &#8377;{Number(item.order?.totalAmount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Pickup and Destination Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      <Store size={14} color="#0284c7" /> Pickup Pharmacy
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a", marginTop: "4px" }}>
                      {item.order?.pharmacy?.name || "Partner Pharmacy"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {item.order?.pharmacy?.address}, {item.order?.pharmacy?.city}
                    </div>
                    <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "2px" }}>
                      Phone: {item.order?.pharmacy?.phone || "N/A"}
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      <MapPin size={14} color="#10b981" /> Drop Location
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a", marginTop: "4px" }}>
                      {item.deliveryAddress?.label ? `${item.deliveryAddress.label} - ` : ""}
                      {item.order?.customer?.fullName || "Customer"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {item.deliveryAddress?.addressLine1}
                      {item.deliveryAddress?.addressLine2 ? `, ${item.deliveryAddress.addressLine2}` : ""}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {item.deliveryAddress?.city}, {item.deliveryAddress?.pincode}
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                    <Clock size={14} /> Assigned on {new Date(item.createdAt).toLocaleString()}
                  </div>

                  <Link
                    to={`/delivery/assignments/${item.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#0284c7",
                      color: "#ffffff",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <span>Manage &amp; Deliver</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={() => fetchAssignments(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="delivery-btn delivery-btn-secondary delivery-btn-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchAssignments(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="delivery-btn delivery-btn-secondary delivery-btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DeliveryAssignments;
