import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileEdit, Loader2, X, XCircle } from "lucide-react";
import { approveRevision, rejectRevision } from "../services/staffAuth.js";
import "./approvals.css";

/**
 * Modal to review an editor's proposed revision (preview + diff + approve/reject).
 */
export default function ApprovalDetailModal({ revision, onClose, onDone }) {
  const [busy, setBusy] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Build a preview HTML blob from the snapshot's code fields.
  const previewSrc = useMemo(() => {
    const snap = revision?.snapshot || {};
    const html = snap.html || snap.fullDocument || "";
    if (!html) return "";
    const doc = snap.fullDocument || `<!doctype html><html><head><style>${snap.css || ""}</style></head><body>${html}<script>${snap.javascript || snap.js || ""}</script></body></html>`;
    return URL.createObjectURL(new Blob([doc], { type: "text/html" }));
  }, [revision]);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  // Simple field-by-field diff (only for edits with an original snapshot).
  const diff = useMemo(() => {
    const snap = revision?.snapshot || {};
    const orig = revision?.originalSnapshot || {};
    if (!revision?.originalSnapshot) return [];
    const fields = ["titleEn", "titleZh", "shortDescriptionEn", "price", "pricingType", "category", "status", "featured"];
    const rows = [];
    for (const f of fields) {
      const o = orig[f];
      const n = snap[f];
      const oStr = o === undefined || o === null ? "" : String(o);
      const nStr = n === undefined || n === null ? "" : String(n);
      if (oStr !== nStr) rows.push({ field: f, old: oStr || "—", new: nStr || "—" });
    }
    // Code change indicator
    const codeFields = ["sourceCode", "sourceFiles", "protectedFiles", "publicFiles", "fileNames", "preview"];
    const codeChanged = codeFields.some((f) => JSON.stringify(orig[f]) !== JSON.stringify(snap[f]));
    return { rows, codeChanged };
  }, [revision]);

  async function handleApprove() {
    if (busy) return;
    setBusy("approve");
    setError("");
    try {
      await approveRevision(revision.id);
      onDone?.("approved");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to approve.");
      setBusy("");
    }
  }

  async function handleReject() {
    if (busy) return;
    if (reason.trim().length < 5) {
      setError("Reject reason is required (5+ characters).");
      return;
    }
    setBusy("reject");
    setError("");
    try {
      await rejectRevision(revision.id, reason.trim());
      onDone?.("rejected");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to reject.");
      setBusy("");
    }
  }

  const snap = revision?.snapshot || {};
  const kind = revision?.kind === "new" ? "New product" : "Edit";

  return (
    <div className="approvals-modal-overlay" role="dialog" aria-modal="true" aria-label="Review submission">
      <div className="approvals-modal">
        <div className="approvals-modal-head">
          <div>
            <h4>{snap.titleEn || "Untitled product"}</h4>
            <p>
              <span className={`approvals-kind ${revision?.kind === "new" ? "approvals-kind-new" : "approvals-kind-edit"}`}>
                {revision?.kind === "new" ? <FileEdit size={12} /> : <FileEdit size={12} />} {kind}
              </span>{" "}
              · submitted by {revision?.submitterName || revision?.submitterEmail || "a team member"}
            </p>
          </div>
          <button type="button" className="approvals-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="approvals-modal-body">
          <div className="approvals-preview">
            {previewSrc ? (
              <iframe title="Proposed preview" src={previewSrc} sandbox="allow-scripts" />
            ) : (
              <div className="approvals-preview-empty">
                No preview source available for this submission.
              </div>
            )}
          </div>

          <div className="approvals-detail">
            <div className="approvals-detail-section">
              <h5>Metadata</h5>
              <div className="approvals-field-row"><span className="approvals-field-label">Price</span><span className="approvals-field-same">${snap.price ?? "—"}</span></div>
              <div className="approvals-field-row"><span className="approvals-field-label">Category</span><span className="approvals-field-same">{snap.category || "—"}</span></div>
              <div className="approvals-field-row"><span className="approvals-field-label">Status</span><span className="approvals-field-same">{snap.status || "draft"}</span></div>
            </div>

            {revision?.originalSnapshot && (
              <div className="approvals-detail-section">
                <h5>Changes</h5>
                {diff.rows.length === 0 && !diff.codeChanged && (
                  <div className="approvals-field-row"><span className="approvals-field-label">No metadata changes</span></div>
                )}
                {diff.rows.map((r) => (
                  <div className="approvals-field-row" key={r.field}>
                    <span className="approvals-field-label">{r.field}</span>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span className="approvals-field-old">{r.old}</span>
                      <span className="approvals-field-new">{r.new}</span>
                    </span>
                  </div>
                ))}
                {diff.codeChanged && (
                  <div className="approvals-field-row">
                    <span className="approvals-field-label">Source code</span>
                    <span className="approvals-code-changed">changed</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="approvals-reject-box">
                <span style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</span>
              </div>
            )}

            {rejecting && (
              <div className="approvals-reject-box">
                <label htmlFor="approvals-reason">Reject reason</label>
                <textarea
                  id="approvals-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this being rejected? (5+ chars)"
                />
              </div>
            )}
          </div>
        </div>

        <div className="approvals-modal-actions">
          <button type="button" className="approvals-action-btn approvals-btn-ghost" onClick={onClose} disabled={!!busy}>
            Close
          </button>
          {!rejecting ? (
            <>
              <button type="button" className="approvals-action-btn approvals-btn-reject" onClick={() => setRejecting(true)} disabled={!!busy}>
                <XCircle size={15} /> Reject
              </button>
              <button type="button" className="approvals-action-btn approvals-btn-approve" onClick={handleApprove} disabled={!!busy}>
                {busy === "approve" ? <Loader2 className="approvals-spinner" size={15} /> : <CheckCircle2 size={15} />}
                Approve
              </button>
            </>
          ) : (
            <>
              <button type="button" className="approvals-action-btn approvals-btn-ghost" onClick={() => { setRejecting(false); setError(""); }} disabled={!!busy}>
                Cancel
              </button>
              <button type="button" className="approvals-action-btn approvals-btn-reject" onClick={handleReject} disabled={!!busy}>
                {busy === "reject" ? <Loader2 className="approvals-spinner" size={15} /> : <AlertTriangle size={15} />}
                Confirm reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
