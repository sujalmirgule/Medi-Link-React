import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { deliveryService } from "../../services/delivery";
import {
  History,
  CheckCircle2,
  XCircle,
  Calendar,
  Store,
  MapPin,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function DeliveryHistory() {
  const [history, setHistory] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryService.getAssignments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: 10,
      });
      // In delivery history, show DELIVERED and FAILED, or filter specifically
      const items = (res.items || []).filter((item) =>
        statusFilter === "all" ? ["DELIVERED", "FAILED"].includes(item.status) : item.status === statusFilter
      );
      setHistory(items);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load delivery history");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            Delivery History
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
            Archive of all completed and concluded delivery assignments.
          </p>
        </div>

        <button
          onClick={() => fetchHistory(pagination.page)}
          disabled={loading}
          className="delivery-btn delivery-btn-secondary delivery-btn-sm"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "24px", paddingBottom: "8px" }}>
        {[
          { key: "all", label: "All Concluded" },
          { key: "DELIVERED", label: "Successfully Delivered" },
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
              background: statusFilter === tab.key ? "#0284c7" : "transparent",
              color: statusFilter === tab.key ? "#ffffff" : "#64748b",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <RefreshCw size={28} className="spin" style={{ color: "#0284c7", marginBottom: "12px" }} />
          <div>Loading historical records...</div>
        </div>
      ) : history.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <History size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "#1e293b" }}>
            No Delivery History Found
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Completed and concluded deliveries will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {history.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "20px 24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Order #{item.order?.orderNumber}
                    </span>
                    <span
                      style={{
                        background: item.status === "DELIVERED" ? "#d1fae5" : "#fee2e2",
                        color: item.status === "DELIVERED" ? "#065f46" : "#991b1b",
                        border: `1px solid ${item.status === "DELIVERED" ? "#a7f3d0" : "#fca5a5"}`,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={13} /> Concluded {new Date(item.deliveredAt || item.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Order Total</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                    &#8377;{Number(item.order?.totalAmount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748b" }}>From Pharmacy:</span> <strong>{item.order?.pharmacy?.name}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Delivered to:</span> <strong>{item.order?.customer?.fullName}</strong> ({item.deliveryAddress?.city})
                </div>
              </div>

              {item.status === "FAILED" && item.failureReason && (
                <div style={{ marginTop: "10px", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#991b1b" }}>
                  <strong>Failure Reason:</strong> {item.failureReason}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                <Link
                  to={`/delivery/assignments/${item.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#0284c7",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  View Details &amp; Audit Trail <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeliveryHistory;
