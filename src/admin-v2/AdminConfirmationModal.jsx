import React, { useState } from "react";
import * as Icons from "lucide-react";
import "./admin-v2.css";

export function AdminConfirmationModal({ title, actionDescription, danger = false, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("You must provide a reason for this action.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (e) {
      console.error(e);
      setError(e.message || "An error occurred executing this action.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-v2-scrim" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div className="admin-v2-card" style={{ width: 420, maxWidth: "90vw", padding: 24, animation: "steaSlideUp 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          {danger ? <Icons.AlertTriangle color="#EF4444" size={24} /> : <Icons.Shield color="#D4AF37" size={24} />}
          <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{title}</h2>
        </div>
        
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 20, lineHeight: 1.5 }}>
          {actionDescription}
        </p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            Reason for change (Required for Audit Log)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Fixing typo, User requested, Suspending account..."
            rows={3}
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              fontSize: 14,
              resize: "vertical"
            }}
          />
          {error && <div style={{ color: "#EF4444", fontSize: 12, marginTop: 8, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button 
            onClick={onClose} 
            disabled={loading}
            style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            style={{ 
              padding: "10px 16px", 
              borderRadius: 8, 
              border: "none", 
              background: danger ? "#EF4444" : "#111827", 
              color: "#fff", 
              cursor: "pointer", 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {loading ? <Icons.Loader size={16} className="stea-spin" /> : <Icons.Check size={16} />}
            {loading ? "Processing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
