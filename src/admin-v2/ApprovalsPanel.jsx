import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileEdit, Inbox, Loader2, RefreshCw, XCircle } from "lucide-react";
import { listRevisions, getRevision } from "../services/staffAuth.js";
import ApprovalDetailModal from "./ApprovalDetailModal.jsx";
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

/**
 * Approvals panel — review editor submissions. Owner/approver only.
 */
export default function ApprovalsPanel() {
  const [tab, setTab] = useState("pending");
  const [revisions, setRevisions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openRevision, setOpenRevision] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }, []);

  const pendingOpenRef = useRef("");
  useEffect(() => {
    // Support deep links from notifications: /admin/approvals?revision=<id>.
    try {
      const m = new URLSearchParams(window.location.search).get("revision");
      if (m) pendingOpenRef.current = m;
    } catch {}
  }, []);

  const load = useCallback(async (status) => {
    setLoading(true);
    setError("");
    try {
      const d = await listRevisions({ status, limit: 50 });
      setRevisions(d.revisions || []);
      setTotal(d.total || 0);
      // Auto-open the requested revision if present in this batch.
      const target = pendingOpenRef.current;
      if (target) {
        const hit = (d.revisions || []).find((r) => String(r.id) === target);
        if (hit) {
          pendingOpenRef.current = "";
          openRow(hit);
        }
      }
    } catch (e) {
      setError(e?.message || "Failed to load revisions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function openRow(rev) {
    // Load full revision detail (snapshot, diff) before opening the modal.
    setOpenRevision(rev);
    try {
      const full = await getRevision(rev.id);
      setDetail({ ...rev, ...full });
    } catch (e) {
      setError(e?.message || "Failed to load revision detail.");
      setOpenRevision(null);
    }
  }

  function handleDone(action) {
    showToast(action === "approved" ? "Approved ✓" : "Rejected");
    load(tab);
  }

  const subCount = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

  return (
    <div className="approvals-panel">
      <div className="approvals-header">
        <div className="approvals-header-copy">
          <h3>Approvals</h3>
          <p>Review submissions from your team.</p>
        </div>
        <button type="button" className="team-btn-ghost" onClick={() => load(tab)} title="Refresh">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="approvals-subtabs">
        {Object.entries(subCount).map(([id, label]) => (
          <button
            key={id}
            className={`approvals-subtab ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
            {tab === id && revisions.length > 0 && <span className="approvals-count">{revisions.length}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="team-error" role="alert">
          <AlertTriangleInline /> {error}
        </div>
      )}

      <div className="approvals-card">
        {loading ? (
          <div className="approvals-loading">
            <Loader2 className="approvals-spinner" size={18} /> Loading submissions…
          </div>
        ) : revisions.length === 0 ? (
          <div className="approvals-empty">
            <Inbox size={40} />
            <div className="approvals-empty-title">No {tab} submissions.</div>
            <div className="approvals-empty-caption">Submissions from editors will appear here for your review.</div>
          </div>
        ) : (
          revisions.map((rev) => (
            <button key={rev.id} type="button" className="approvals-row" onClick={() => openRow(rev)}>
              <div className="approvals-avatar">
                {(rev.submitterName || rev.submitterEmail || "?").charAt(0).toUpperCase()}
              </div>
              <div className="approvals-row-main">
                <span className="approvals-row-title">{rev.productTitle || "Untitled product"}</span>
                <span className="approvals-row-sub">
                  {rev.submitterName || rev.submitterEmail || "team member"}
                  {rev.rejectionReason && tab === "rejected" && (
                    <span className="approvals-reason"> — {rev.rejectionReason}</span>
                  )}
                </span>
              </div>
              <span className={`approvals-kind ${rev.kind === "new" ? "approvals-kind-new" : "approvals-kind-edit"}`}>
                {rev.kind === "new" ? <FileEdit size={12} /> : <FileEdit size={12} />} {rev.kind === "new" ? "New product" : "Edit"}
              </span>
              <span className="approvals-row-time">{timeAgo(rev.createdAt)}</span>
            </button>
          ))
        )}
      </div>

      {openRevision && detail && (
        <ApprovalDetailModal
          revision={detail}
          onClose={() => { setOpenRevision(null); setDetail(null); }}
          onDone={handleDone}
        />
      )}

      {toast && (
        <div className="approvals-toast" role="status">
          {toast.startsWith("Approved") ? <CheckCircle2 size={16} style={{ color: "#4ade80" }} /> : <XCircle size={16} style={{ color: "#f87171" }} />} {toast}
        </div>
      )}
    </div>
  );
}

function AlertTriangleInline() {
  return <span aria-hidden style={{ display: "inline-flex", marginRight: 6 }}>⚠</span>;
}
