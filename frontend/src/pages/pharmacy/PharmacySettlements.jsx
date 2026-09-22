import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../../services/payment";
import {
  DollarSign,
  RefreshCw,
  AlertTriangle,
  BadgeCheck,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import logo from "../../assets/medilink-logo.png";
import "../user-dashboard.css";

const STATUS_META = {
  SETTLED: { bg: "#d1fae5", color: "#065f46", icon: <BadgeCheck size={14} /> },
  PENDING: { bg: "#e0f2fe", color: "#0284c7", icon: <Clock size={14} /> },
  FAILED: { bg: "#fee2e2", color: "#991b1b", icon: <XCircle size={14} /> },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { bg: "#f1f5f9", color: "#64748b", icon: null };
  return (
    <span style={{ background: m.bg, color: m.color, padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {m.icon} {status}
    </span>
  );
}

export default function PharmacySettlements() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getMySettlements({ status: statusFilter, page });
      setSettlements(res.data || []);
      setSummary(res.metrics || null);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || "Failed to load settlements.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  return (
    <div className="user-dashboard">
      <header className="user-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => navigate("/pharmacy")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Dashboard
          </button>
          <img src={logo} alt="MediLink" style={{ height: "32px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DollarSign size={18} color="#059669" />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>My Settlements</span>
        </div>
        <button id="btn-refresh-my-settlements" onClick={fetchSettlements} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh
        </button>
      </header>

      <main className="user-content" style={{ maxWidth: "960px", margin: "30px auto", padding: "0 20px" }}>
        {/* Summary Cards */}
        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {[
              { label: "Total Settled", value: `₹${Number(summary.totalSettledAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "#059669", bg: "linear-gradient(135deg, #ecfdf5, #d1fae5)", icon: <BadgeCheck size={22} color="#059669" /> },
              { label: "Pending Payout", value: `₹${Number(summary.pendingSettlementAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, color: "#0284c7", bg: "linear-gradient(135deg, #eff6ff, #e0f2fe)", icon: <Clock size={22} color="#0284c7" /> },
              { label: "Total Settlements", value: pagination.total, color: "#475569", bg: "#fff", icon: <TrendingUp size={22} color="#475569" /> },
            ].map((card) => (
              <div key={card.label} style={{ background: card.bg, border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  {card.icon}
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Filter:</span>
          {["all", "PENDING", "SETTLED", "FAILED"].map((s) => (
            <button
              key={s}
              id={`btn-filter-${s.toLowerCase()}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid",
                borderColor: statusFilter === s ? "#0284c7" : "#e2e8f0",
                background: statusFilter === s ? "#0284c7" : "#fff",
                color: statusFilter === s ? "#fff" : "#64748b",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "8px" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Settlements List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              <RefreshCw size={24} className="pharmacy-spinner" style={{ display: "inline-block" }} />
            </div>
          ) : settlements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <DollarSign size={40} style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: "15px", fontWeight: 600 }}>No settlements found.</p>
              <p style={{ fontSize: "13px" }}>Settlements are created automatically after a payment is confirmed.</p>
            </div>
          ) : settlements.map((s) => (
            <div
              key={s.id}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", fontSize: "14px", marginBottom: "4px" }}>
                  Order #{s.order?.orderNumber || "—"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Created: {new Date(s.createdAt).toLocaleDateString()}
                  {s.settledAt && <> &nbsp;·&nbsp; Settled: {new Date(s.settledAt).toLocaleDateString()}</>}
                </div>
                {s.reference && (
                  <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "4px" }}>
                    Ref: <code>{s.reference}</code>
                  </div>
                )}
                {s.failureReason && (
                  <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                    {s.failureReason}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                    ₹{Number(s.amount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>Settlement Amount</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
            <button id="btn-prev-page-ps" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid #e2e8f0", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
            <span style={{ padding: "7px 18px", borderRadius: "7px", background: "#059669", color: "#fff", fontWeight: 700, fontSize: "13px" }}>
              {page} / {pagination.totalPages}
            </span>
            <button id="btn-next-page-ps" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid #e2e8f0", background: "#fff", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
          </div>
        )}
      </main>
    </div>
  );
}
