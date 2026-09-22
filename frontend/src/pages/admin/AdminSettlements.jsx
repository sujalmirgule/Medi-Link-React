import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../../services/payment";
import {
  CreditCard,
  RefreshCw,
  Search,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
} from "lucide-react";
import logo from "../../assets/medilink-logo.png";
import "../user-dashboard.css";

const STATUS_COLORS = {
  SETTLED: { bg: "#d1fae5", color: "#065f46" },
  PENDING: { bg: "#e0f2fe", color: "#0284c7" },
  FAILED: { bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
      {status}
    </span>
  );
}

export default function AdminSettlements() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [actionType, setActionType] = useState(null); // 'settle' | 'fail'
  const [actionInput, setActionInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.adminListSettlements({ ...filters, page, limit: 15 });
      setSettlements(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || "Failed to load settlements.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const openAction = (settlement, type) => {
    setSelected(settlement);
    setActionType(type);
    setActionInput("");
    setActionError(null);
  };

  const handleAction = async () => {
    if (!selected || !actionType) return;
    if (actionType === "fail" && (!actionInput.trim() || actionInput.trim().length < 5)) {
      setActionError("Reason must be at least 5 characters.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      if (actionType === "settle") {
        await paymentService.adminSettleSettlement(selected.id, actionInput.trim() || undefined);
      } else {
        await paymentService.adminFailSettlement(selected.id, actionInput.trim());
      }
      setSelected(null);
      setActionType(null);
      fetchSettlements();
    } catch (err) {
      setActionError(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
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
          <DollarSign size={18} color="#059669" />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Settlement Management</span>
        </div>
        <button id="btn-refresh-settlements" onClick={fetchSettlements} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={14} className={loading ? "pharmacy-spinner" : ""} /> Refresh
        </button>
      </header>

      <main className="user-content" style={{ maxWidth: "1100px", margin: "30px auto", padding: "0 20px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              id="input-settlement-search"
              placeholder="Search pharmacy, order..."
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              style={{ width: "100%", paddingLeft: "34px", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select id="sel-settlement-status" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }} style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none" }}>
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SETTLED">Settled</option>
            <option value="FAILED">Failed</option>
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
                {["Order #", "Pharmacy", "Amount", "Status", "Reference", "Settled At", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><RefreshCw size={20} className="pharmacy-spinner" style={{ display: "inline-block" }} /></td></tr>
              ) : settlements.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No settlements found.</td></tr>
              ) : settlements.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>#{s.order?.orderNumber || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#475569" }}>{s.pharmacy?.name || "—"}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>₹{Number(s.amount).toFixed(2)}</td>
                  <td style={{ padding: "12px 14px" }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: "12px 14px", color: "#64748b", fontFamily: "monospace", fontSize: "12px" }}>{s.reference || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#64748b" }}>{s.settledAt ? new Date(s.settledAt).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {s.status === "PENDING" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button id={`btn-settle-${s.id}`} onClick={() => openAction(s, "settle")} style={{ background: "#d1fae5", color: "#065f46", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                          Mark Settled
                        </button>
                        <button id={`btn-fail-${s.id}`} onClick={() => openAction(s, "fail")} style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                          Fail
                        </button>
                      </div>
                    )}
                    {s.status !== "PENDING" && <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
          <span>Showing {settlements.length} of {pagination.total} settlements</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button id="btn-prev-page-s" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
            <span style={{ padding: "6px 14px", borderRadius: "6px", background: "#059669", color: "#fff", fontWeight: 700 }}>{page}</span>
            <button id="btn-next-page-s" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: page >= pagination.totalPages ? "not-allowed" : "pointer", opacity: page >= pagination.totalPages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {selected && actionType && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>
                {actionType === "settle" ? "Mark as Settled" : "Mark as Failed"}
              </span>
              <button id="btn-close-action-modal" onClick={() => { setSelected(null); setActionType(null); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>

            <div style={{ fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
              Settlement for <strong>{selected.pharmacy?.name}</strong> — <strong>₹{Number(selected.amount).toFixed(2)}</strong>
            </div>

            <input
              id="input-action-reference"
              placeholder={actionType === "settle" ? "Bank reference / UTR (optional)" : "Failure reason (required, min 5 chars)"}
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box", marginBottom: "12px" }}
            />
            {actionError && <div style={{ color: "#991b1b", fontSize: "12px", marginBottom: "10px" }}>{actionError}</div>}

            <button
              id="btn-confirm-action"
              onClick={handleAction}
              disabled={actionLoading}
              style={{
                background: actionType === "settle" ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #dc2626, #b91c1c)",
                color: "#fff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "13px", fontWeight: 700,
                cursor: actionLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {actionLoading ? <RefreshCw size={13} className="pharmacy-spinner" /> : actionType === "settle" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {actionLoading ? "Processing..." : actionType === "settle" ? "Confirm Settlement" : "Mark Failed"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
