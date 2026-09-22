import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderService } from "../services/order";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Home,
  Search,
} from "lucide-react";
import logo from "../assets/medilink-logo.png";
import "./user-dashboard.css";

export default function UserOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getCustomerOrders({
        page,
        limit: 10,
        status: statusFilter,
      });
      setOrders(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return { label: "Pending", bg: "#fef3c7", color: "#b45309", border: "#fde68a", icon: Clock };
      case "ACCEPTED":
        return { label: "Accepted", bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", icon: CheckCircle2 };
      case "PREPARING":
        return { label: "Preparing", bg: "#fef3c7", color: "#b45309", border: "#fde68a", icon: Package };
      case "READY_FOR_PICKUP":
        return { label: "Ready for Pickup", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", icon: CheckCircle2 };
      case "REJECTED":
        return { label: "Rejected", bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", icon: XCircle };
      case "CANCELLED":
        return { label: "Cancelled", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", icon: XCircle };
      default:
        return { label: status, bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", icon: Clock };
    }
  };

  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <header className="user-header">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/user/dashboard")}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <ArrowLeft size={18} /> Dashboard
          </button>
          <img src={logo} alt="MediLink" style={{ height: "32px" }} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh
          </button>
          <Link
            to="/medicines"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#087ac7",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            <Search size={14} /> Browse Medicines
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="user-content" style={{ maxWidth: "900px", margin: "30px auto", padding: "0 20px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
            My Orders
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Track the status of your reserved medicines and past purchases.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Orders" },
            { id: "PENDING", label: "Pending" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "PREPARING", label: "Preparing" },
            { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                border: statusFilter === tab.id ? "2px solid #087ac7" : "1px solid #e2e8f0",
                background: statusFilter === tab.id ? "#e0f2fe" : "#ffffff",
                color: statusFilter === tab.id ? "#0369a1" : "#64748b",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "12px 16px", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", color: "#991b1b" }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: "13px" }}>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <RefreshCw size={32} className="pharmacy-spinner" style={{ color: "#087ac7", marginBottom: "12px" }} />
            <p style={{ fontSize: "14px", color: "#64748b" }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <Package size={44} style={{ color: "#94a3b8", opacity: 0.6, marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
              No orders found
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
              {statusFilter !== "all"
                ? "No orders match this status filter."
                : "You haven't placed any medicine orders yet."}
            </p>
            <Link
              to="/medicines"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                background: "#087ac7",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Start Browsing Medicines
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {orders.map((order) => {
              const badge = getStatusBadge(order.orderStatus);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={order.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                        #{order.orderNumber}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>
                        {new Date(order.createdAt).toLocaleDateString()} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <BadgeIcon size={12} /> {badge.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                        <Store size={15} color="#087ac7" /> {order.pharmacy?.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        {order.items?.length || 0} medicine item(s) &bull;{" "}
                        {order.fulfillmentType === "HOME_DELIVERY" ? "Home Delivery" : "Pickup"}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Total</div>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: "#087ac7" }}>
                          &#8377;{Number(order.totalAmount).toFixed(2)}
                        </div>
                      </div>

                      <Link
                        to={`/user/orders/${order.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          color: "#0f172a",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
