/**
 * CsvExportButton.jsx – inline styled export button
 */
import React from "react";

const C = { gold: "#ff9f1c", goldBg: "rgba(255,159,28,0.12)", goldBorder: "rgba(255,159,28,0.35)" };

export default function CsvExportButton({ users }) {
  const handleExport = () => {
    if (!users || users.length === 0) return;
    const headers = ["Name","Email","Role","Status","Sector","Join Date","UID"];
    const esc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const rows = users.map(u => [
      esc(u.displayName || ""),
      esc(u.email || ""),
      esc(u.role || "user"),
      esc(u.authStatus === "disabled" ? "Disabled" : u.profileStatus === "orphaned" ? "Orphaned" : "Active"),
      esc(u.sector || ""),
      esc(u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""),
      esc(u.uid || ""),
    ].join(","));
    const csv  = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `stea_users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!users || users.length === 0}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
        padding:      "8px 14px",
        background:   C.goldBg,
        border:       `1px solid ${C.goldBorder}`,
        borderRadius: 10,
        color:        C.gold,
        fontSize:     13,
        fontWeight:   600,
        cursor:       "pointer",
        whiteSpace:   "nowrap",
        opacity:      (!users || users.length === 0) ? 0.45 : 1,
        transition:   "background 0.15s",
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  );
}
