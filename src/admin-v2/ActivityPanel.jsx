import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, History, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { listActivity } from "../services/staffAuth.js";
import "./approvals.css";

function timeAgo(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const ACTION_LABELS = {
  revision_submitted: "Submitted",
  revision_approved: "Approved",
  revision_rejected: "Rejected",
  login: "Login",
  logout: "Logout",
  create_staff: "Created staff",
  update_staff: "Updated staff",
  reset_password: "Reset password",
  force_logout: "Force logout",
  delete_staff: "Deleted staff",
  approve_product: "Approved product",
  reject_product: "Rejected product",
};

function actionClass(action) {
  if (action === "revision_approved") return "activity-action-approve";
  if (action === "revision_rejected") return "activity-action-reject";
  if (action === "revision_submitted") return "activity-action-submit";
  return "activity-action-neutral";
}

const DATE_RANGES = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

function rangeFrom(id) {
  const now = new Date();
  if (id === "today") {
    const s = new Date(now); s.setHours(0, 0, 0, 0);
    return { from: s.toISOString(), to: "" };
  }
  if (id === "week") {
    const s = new Date(now); s.setDate(now.getDate() - 7);
    return { from: s.toISOString(), to: "" };
  }
  if (id === "month") {
    const s = new Date(now); s.setDate(now.getDate() - 30);
    return { from: s.toISOString(), to: "" };
  }
  return { from: "", to: "" };
}

/**
 * Activity feed — full staff audit log. Owner/approver only.
 */
export default function ActivityPanel() {
  const PAGE = 50;
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (opts) => {
    setLoading(true);
    setError("");
    try {
      const { from, to } = rangeFrom(opts.range || "all");
      const d = await listActivity({
        action: opts.action && opts.action !== "all" ? opts.action : "",
        from,
        to,
        limit: PAGE,
        offset: opts.offset || 0,
      });
      setEntries(d.entries || []);
      setTotal(d.total || 0);
      setOffset(opts.offset || 0);
    } catch (e) {
      setError(e?.message || "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ range, action: actionFilter, offset: 0 });
  }, [range, actionFilter, load]);

  // Client-side search on actor/target after server filtering.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const actor = `${e.actorName || ""} ${e.actorEmail || ""}`.toLowerCase();
      const target = String(e.target || "").toLowerCase();
      return actor.includes(q) || target.includes(q);
    });
  }, [entries, search]);

  const actionOptions = Object.keys(ACTION_LABELS);

  return (
    <div className="activity-panel">
      <div className="activity-header">
        <div className="activity-header-copy">
          <h3>Activity</h3>
          <p>Full audit trail of staff actions.</p>
        </div>
        <button type="button" className="team-btn-ghost" onClick={() => load({ range, action: actionFilter, offset: 0 })} title="Refresh">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="activity-filters">
        <div className="activity-search">
          <Search size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor or target…" aria-label="Search activity" />
        </div>
        <select className="activity-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} aria-label="Filter by action">
          <option value="all">All actions</option>
          {actionOptions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
        </select>
        <select className="activity-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Filter by date">
          {DATE_RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="team-error" role="alert">
          <span style={{ marginRight: 6 }}>⚠</span> {error}
        </div>
      )}

      <div className="activity-card">
        {loading ? (
          <div className="activity-loading">
            <Loader2 className="approvals-spinner" size={18} /> Loading activity…
          </div>
        ) : visible.length === 0 ? (
          <div className="activity-empty">
            <History size={40} />
            <div className="activity-empty-title">No activity yet.</div>
            <div className="activity-empty-caption">Staff logins, submissions, and approvals will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td><span className="activity-time">{timeAgo(e.createdAt)}</span></td>
                    <td>
                      <div className="activity-actor">
                        <strong>{e.actorName || e.actorEmail || "system"}</strong>
                        {e.actorEmail && <span>{e.actorEmail}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`activity-action-badge ${actionClass(e.action)}`}>
                        {e.action === "revision_approved" ? <CheckCircle2 size={12} /> : e.action === "revision_rejected" ? <XCircle size={12} /> : <Clock size={12} />}
                        {ACTION_LABELS[e.action] || e.action}
                      </span>
                    </td>
                    <td><span className="activity-target">{e.target || "—"}</span></td>
                    <td>
                      <span className="activity-detail" title={e.meta ? JSON.stringify(e.meta) : ""}>
                        {e.meta && typeof e.meta === "object" ? Object.entries(e.meta).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(", ") : e.meta || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && total > PAGE && (
        <div className="activity-pagination">
          <button type="button" disabled={offset === 0} onClick={() => load({ range, action: actionFilter, offset: Math.max(0, offset - PAGE) })}>
            <ChevronLeft size={15} /> Prev
          </button>
          <span>{offset + 1}–{Math.min(offset + PAGE, total)} of {total}</span>
          <button type="button" disabled={offset + PAGE >= total} onClick={() => load({ range, action: actionFilter, offset: offset + PAGE })}>
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
