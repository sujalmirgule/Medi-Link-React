import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../../services/payment";
import {
  CreditCard,
  RefreshCw,
  Search,
  AlertTriangle,
  BadgeCheck,
  XCircle,
  Banknote,
  Wallet,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import logo from "../../assets/medilink-logo.png";
import "../user-dashboard.css";

const STATUS_COLORS = {
  PAID: { bg: "#d1fae5", color: "#065f46" },
  PENDING: { bg: "#e0f2fe", color: "#0284c7" },
  FAILED: { bg: "#fee2e2", color: "#991b1b" },
  REFUNDED: { bg: "#fef3c7", color: "#92400e" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
      {status}
    </span>
  );
}

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ status: "all", method: "all", search: "" });
  const [page, setPage] = useState(1);

  // Detail / Refund modal
  const [selected, setSelected] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.adminListPayments({ ...filters, page, limit: 15 });
      setPayments(res.data || []);
      setMetrics(res.metrics);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleRefund = async () => {
    if (!selected) return;
    if (!refundReason.trim() || refundReason.trim().length < 5) {
      setRefundError("Reason must be at least 5 characters.");
      return;
    }
    setRefundLoading(true);
    setRefundError(null);
    try {
      await paymentService.adminRefundPayment(selected.id, refundReason.trim());
      setSelected(null);
      setRefundReason("");
      fetchPayments();
    } catch (err) {
      setRefundError(err.message || "Refund failed.");
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="user-dashboard">
      <header className="user-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/admin")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Admin
          </button>
          <img src={logo} alt="MediLink" style={{ height: "32px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CreditCard size={18} color="#0284c7" />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Payment Ledger</span>
        </div>
        <button id="btn-refresh-payments" onClick={fetchPayments} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh
        </button>
      </header>

      <main className="user-content" style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px" }}>

        {/* Metrics */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Total Payments", value: metrics.totalPayments, icon: <CreditCard size={20} color="#0284c7" />, accent: "#0284c7" },
              { label: "Total Collected", value: `₹${Number(metrics.totalPaidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: <BadgeCheck size={20} color="#059669" />, accent: "#059669" },
              { label: "Pending Amount", value: `₹${Number(metrics.pendingPaymentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: <Banknote size={20} color="#d97706" />, accent: "#d97706" },
            ].map((m) => (
              <div key={m.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{m.icon}<span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{m.label}</span></div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: m.accent }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              id="input-payment-search"
              placeholder="Search order#, email, pharmacy..."
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              style={{ width: "100%", paddingLeft: "34px", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select id="sel-payment-status" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }} style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none" }}>
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select id="sel-payment-method" value={filters.method} onChange={(e) => { setFilters((f) => ({ ...f, method: e.target.value })); setPage(1); }} style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none" }}>
            <option value="all">All Methods</option>
            <option value="COD">COD</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "8px" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Order #", "Customer", "Pharmacy", "Method", "Amount", "Status", "Paid At", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><RefreshCw size={20} className="pharmacy-spinner" style={{ display: "inline-block" }} /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No payments found.</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>#{p.orderNumber}</td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>{p.customer?.email || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>{p.pharmacy?.name || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#0f172a" }}>
                      {p.method === "COD" ? <Banknote size={14} /> : <Wallet size={14} />} {p.method}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>₹{Number(p.amount).toFixed(2)}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: "12px 14px", color: "#64748b" }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button
                      id={`btn-payment-detail-${p.id}`}
                      onClick={() => { setSelected(p); setRefundReason(""); setRefundError(null); }}
                      style={{ background: "#eff6ff", color: "#0284c7", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
          <span>Showing {payments.length} of {pagination.total} payments</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button id="btn-prev-page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
            <span style={{ padding: "6px 14px", borderRadius: "6px", background: "#0284c7", color: "#fff", fontWeight: 700 }}>{page}</span>
            <button id="btn-next-page" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
          </div>
        </div>
      </main>

      {/* Detail / Refund Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>Payment Detail</span>
              <button id="btn-close-modal" onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "20px" }}>
              {[
                ["Payment ID", <code key="id" style={{ fontSize: "11px" }}>{selected.id}</code>],
                ["Order #", `#${selected.orderNumber}`],
                ["Customer", selected.customer?.email || "—"],
                ["Pharmacy", selected.pharmacy?.name || "—"],
                ["Method", selected.method],
                ["Amount", `₹${Number(selected.amount).toFixed(2)}`],
                ["Status", <StatusBadge key="s" status={selected.status} />],
                ["Transaction Ref", selected.transactionReference || "—"],
                ["Paid At", selected.paidAt ? new Date(selected.paidAt).toLocaleString() : "—"],
                ["Failure Reason", selected.failureReason || "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "#0f172a", fontWeight: 500, textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>

            {selected.status === "PAID" && (
              <div>
                <p style={{ fontSize: "13px", color: "#475569", marginBottom: "10px" }}>Issue a refund for this payment:</p>
                <textarea
                  id="input-refund-reason"
                  placeholder="Refund reason (min 5 characters)"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", resize: "vertical", minHeight: "70px", boxSizing: "border-box", marginBottom: "10px" }}
                />
                {refundError && <div style={{ color: "#991b1b", fontSize: "12px", marginBottom: "8px" }}>{refundError}</div>}
                <button
                  id="btn-submit-refund"
                  onClick={handleRefund}
                  disabled={refundLoading}
                  style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "13px", fontWeight: 700, cursor: refundLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: refundLoading ? 0.7 : 1 }}
                >
                  {refundLoading ? <RefreshCw size={13} className="pharmacy-spinner" /> : <RotateCcw size={13} />}
                  {refundLoading ? "Processing..." : "Issue Refund"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
