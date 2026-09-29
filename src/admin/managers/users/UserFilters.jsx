/**
 * UserFilters.jsx – inline styled search + filter bar
 */
import React from "react";

const ROLES = ["user","creator","seller","manager","reviewer","admin","super_admin"];
const C = {
  bg:    "#0d0f18",
  card:  "#13151f",
  gold:  "#ff9f1c",
  border: "rgba(255,255,255,0.10)",
  text:  "rgba(232,234,240,0.80)",
  dim:   "rgba(232,234,240,0.35)",
};

const inputStyle = {
  background:   C.card,
  border:       `1px solid ${C.border}`,
  borderRadius: 10,
  color:        C.text,
  fontSize:     13,
  padding:      "8px 12px",
  outline:      "none",
  width:        "100%",
  boxSizing:    "border-box",
};

const selStyle = {
  ...inputStyle,
  cursor:  "pointer",
  padding: "8px 10px",
  width:   "auto",
  minWidth: 130,
};

export default function UserFilters({ search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%" }}>
      {/* search */}
      <div style={{ flex: "1 1 220px", position: "relative" }}>
        <svg
          width="14" height="14"
          fill="none" stroke={C.dim} viewBox="0 0 24 24"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email or UID…"
          style={{ ...inputStyle, paddingLeft: 30 }}
        />
      </div>

      {/* role select */}
      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selStyle}>
        <option value="all">All Roles</option>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      {/* status select */}
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
        <option value="orphaned">Orphaned</option>
      </select>
    </div>
  );
}
