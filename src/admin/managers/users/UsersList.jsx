/**
 * UsersList.jsx – STEA Admin Users Table
 * Inline styles only. Supports bulk selection.
 */
import React, { useState } from "react";
import STEAAvatar from "../../../components/STEAAvatar.jsx";

const ROLES   = ["user","creator","seller","manager","reviewer","admin","super_admin"];
const SECTORS = ["courses","marketplace","tech_tips","exams","websites","sponsored_ads","site_updates","necta","ai_lab","gigs"];
const ADMIN_EMAILS = ["stea.africa@gmail.com"];
const PAGE_SIZE = 20;

/* ── colour tokens ── */
const C = {
  bg:       "#0d0f18",
  card:     "#13151f",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,159,28,0.35)",
  gold:     "#ff9f1c",
  goldDim:  "rgba(255,159,28,0.15)",
  text:     "#e8eaf0",
  textMid:  "rgba(232,234,240,0.55)",
  textDim:  "rgba(232,234,240,0.30)",
  green:    "#34d399",
  greenBg:  "rgba(52,211,153,0.10)",
  red:      "#f87171",
  redBg:    "rgba(248,113,113,0.10)",
  amber:    "#fbbf24",
  amberBg:  "rgba(251,191,36,0.10)",
  blue:     "#60a5fa",
  blueBg:   "rgba(96,165,250,0.10)",
  white5:   "rgba(255,255,255,0.05)",
  white10:  "rgba(255,255,255,0.10)",
};

const initial = u => (u.displayName || u.email || "?")[0].toUpperCase();

function Badge({ u }) {
  const s = { display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600, whiteSpace:"nowrap", border:"1px solid" };
  if (u.authStatus === "disabled")
    return <span style={{...s, background:C.redBg,   color:C.red,   borderColor:"rgba(248,113,113,0.25)"}}>● Disabled</span>;
  if (u.profileStatus === "orphaned")
    return <span style={{...s, background:C.amberBg, color:C.amber, borderColor:"rgba(251,191,36,0.25)"}}>● Orphaned</span>;
  if (u.authStatus === "unknown")
    return <span style={{...s, background:C.blueBg,  color:C.blue,  borderColor:"rgba(96,165,250,0.25)"}}>● Firestore</span>;
  return   <span style={{...s, background:C.greenBg, color:C.green, borderColor:"rgba(52,211,153,0.25)"}}>● Active</span>;
}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={onChange} style={{
      background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
      color:C.textMid, fontSize:12, padding:"5px 8px", cursor:"pointer",
      outline:"none", width:"100%", maxWidth:130,
    }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Btn({ children, onClick, title, variant="ghost", small=false }) {
  const base = { display:"inline-flex", alignItems:"center", gap:4, border:"1px solid", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", padding: small?"4px 8px":"5px 12px", whiteSpace:"nowrap", transition:"opacity 0.15s", lineHeight:1.4 };
  const v = {
    ghost:  { background:C.white5,  borderColor:C.white10,              color:C.textMid },
    green:  { background:C.greenBg, borderColor:"rgba(52,211,153,0.25)", color:C.green  },
    danger: { background:C.redBg,   borderColor:"rgba(248,113,113,0.25)",color:C.red    },
  };
  return <button onClick={onClick} title={title} style={{...base,...v[variant]}}>{children}</button>;
}

function Avatar({ u }) {
  return <STEAAvatar user={u} size="sm" />;
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:16 }}>
      <div style={{ width:32, height:32, border:`3px solid rgba(255,159,28,0.15)`, borderTopColor:C.gold, borderRadius:"50%", animation:"stea-spin 0.8s linear infinite" }} />
      <style>{`@keyframes stea-spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:C.textDim, fontSize:13 }}>Loading users from Firebase…</span>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:12, color:C.textDim }}>
      <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity:0.4 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p style={{ margin:0, fontWeight:600, fontSize:14 }}>No users match your filters</p>
    </div>
  );
}

function Pagination({ total, current, onPage }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const start = (current-1)*PAGE_SIZE+1, end = Math.min(current*PAGE_SIZE, total);
  const pgBtn = { background:C.white5, border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:12, padding:"5px 12px", cursor:"pointer" };
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderTop:`1px solid ${C.border}` }}>
      <span style={{ color:C.textDim, fontSize:12 }}>{start}–{end} of {total} users</span>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={()=>onPage(current-1)} disabled={current===1}   style={{...pgBtn, opacity:current===1      ?0.3:1}}>← Prev</button>
        <span style={{ color:C.gold, fontSize:12, fontWeight:600, padding:"0 4px" }}>{current} / {pages}</span>
        <button onClick={()=>onPage(current+1)} disabled={current===pages} style={{...pgBtn, opacity:current===pages?0.3:1}}>Next →</button>
      </div>
    </div>
  );
}

/* ── main export ── */
export default function UsersList({
  users, loading,
  onUpdateRole, onToggleStatus, onResetPassword, onDelete,
  selectedIds, onToggleSelect, onSelectAll,
}) {
  const [page, setPage] = useState(1);
  React.useEffect(() => { setPage(1); }, [users.length]);

  if (loading && users.length === 0) return <Spinner />;
  if (!loading && users.length === 0) return <Empty />;

  const paged = users.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const allPageSelected = paged.length > 0 && paged.every(u => selectedIds.has(u.uid));

  const cols = ["", "User", "Role", "Status", "Sector", "Joined", "Last Login", "Actions"];

  return (
    <div style={{ width:"100%", borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", background:C.bg }}>
      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:"40px 2fr 1fr 100px 1fr 90px 110px 180px", gap:0, padding:"10px 18px", borderBottom:`1px solid ${C.border}`, background:C.white5 }}>
        {/* select all */}
        <div style={{ display:"flex", alignItems:"center" }}>
          <input type="checkbox" checked={allPageSelected} onChange={() => onSelectAll(paged, allPageSelected)}
            style={{ width:16, height:16, accentColor:C.gold, cursor:"pointer" }} />
        </div>
        {cols.slice(1).map(h => (
          <div key={h} style={{ color:C.textDim, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {paged.map(u => {
        const isSuperAdmin = ADMIN_EMAILS.includes((u.email||"").toLowerCase());
        const isDisabled   = u.authStatus   === "disabled";
        const isOrphaned   = u.profileStatus === "orphaned";
        const isSelected   = selectedIds.has(u.uid);

        return (
          <div key={u.uid}
            style={{
              display:"grid", gridTemplateColumns:"40px 2fr 1fr 100px 1fr 90px 110px 180px",
              gap:0, alignItems:"center", padding:"10px 18px",
              borderBottom:`1px solid ${C.border}`,
              opacity: isDisabled || isOrphaned ? 0.65 : 1,
              background: isSelected ? "rgba(255,159,28,0.06)" : "transparent",
              transition:"background 0.15s",
            }}
            onMouseEnter={e => !isSelected && (e.currentTarget.style.background = C.white5)}
            onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
          >
            {/* checkbox */}
            <div style={{ display:"flex", alignItems:"center" }}>
              <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(u.uid)}
                style={{ width:16, height:16, accentColor:C.gold, cursor:"pointer" }} />
            </div>

            {/* user info */}
            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
              <Avatar u={u} />
              <div style={{ minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={u.displayName||"(no name)"}>
                  {u.displayName || <em style={{ color:C.textDim }}>No name</em>}
                </div>
                <div style={{ color:C.textMid, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={u.email}>{u.email}</div>
                <div style={{ color:C.textDim, fontFamily:"monospace", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={u.uid}>{u.uid}</div>
              </div>
            </div>

            {/* role */}
            <Sel value={u.role||"user"} onChange={e=>onUpdateRole(u.uid, e.target.value, u.sector)} options={ROLES} />

            {/* status */}
            <div><Badge u={u} /></div>

            {/* sector */}
            <Sel value={u.sector||""} onChange={e=>onUpdateRole(u.uid, u.role, e.target.value)} options={SECTORS} placeholder="No sector" />

            {/* joined */}
            <div style={{ color:C.textDim, fontSize:11, whiteSpace:"nowrap" }}>
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
            </div>

            {/* last login */}
            <div style={{ color:C.textDim, fontSize:11, whiteSpace:"nowrap" }}>
              {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : "—"}
            </div>

            {/* actions */}
            <div style={{ display:"flex", gap:5, justifyContent:"flex-end", flexWrap:"wrap" }}>
              {!isOrphaned && (
                <>
                  <Btn onClick={()=>onToggleStatus(u.uid, isDisabled)} variant={isDisabled?"green":"ghost"} small>
                    {isDisabled?"Enable":"Disable"}
                  </Btn>
                  <Btn onClick={()=>onResetPassword(u.email)} variant="ghost" small>PW Reset</Btn>
                </>
              )}
              {!isSuperAdmin && <Btn onClick={()=>onDelete(u.uid)} variant="danger" small>Delete</Btn>}
            </div>
          </div>
        );
      })}

      <Pagination total={users.length} current={page} onPage={setPage} />
    </div>
  );
}
