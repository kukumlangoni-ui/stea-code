/**
 * UsersManager.jsx
 * Admin panel for managing Firebase Auth + Firestore users.
 * Features: bulk actions, search/filter, CSV export, role management.
 * Uses 100% inline styles – no Tailwind dependency.
 */
import React, { useCallback, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Toast, ConfirmDialog } from "../AdminUI.jsx";
import { getFirebaseAuth, sendPasswordResetEmail, getFirebaseDb } from "../../firebase.js";
import CsvExportButton from "./users/CsvExportButton.jsx";
import UserFilters     from "./users/UserFilters.jsx";
import UsersList       from "./users/UsersList.jsx";

const USERS_ENDPOINT = "/api/admin/users";

const C = {
  gold:"#ff9f1c", goldBg:"rgba(255,159,28,0.10)", goldBdr:"rgba(255,159,28,0.25)",
  red:"#f87171",  redBg:"rgba(248,113,113,0.08)",  redBdr:"rgba(248,113,113,0.25)",
  green:"#34d399",greenBg:"rgba(52,211,153,0.10)",  greenBdr:"rgba(52,211,153,0.25)",
  card:"#13151f", border:"rgba(255,255,255,0.08)",
  text:"rgba(232,234,240,0.80)", dim:"rgba(232,234,240,0.35)",
  white5:"rgba(255,255,255,0.05)", white10:"rgba(255,255,255,0.10)",
};

async function fetchJson(url, options={}) {
  const res = await fetch(url, options);
  const ct  = res.headers.get("content-type")||"";
  if (!ct.includes("application/json")) {
    const err = new Error(`Expected JSON from ${url} (${res.status})`);
    err.isHtmlResponse = true;
    throw err;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail||data.error||`HTTP ${res.status}`);
  return data;
}

async function getToken() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not authenticated. Please log in as admin.");
  return user.getIdToken();
}

export default function UsersManager() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [warning,  setWarning]  = useState(null);
  const [stats,    setStats]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);

  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const notify = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null); setWarning(null);
    try {
      const token = await getToken();
      try {
        const data = await fetchJson(USERS_ENDPOINT, { headers:{ Authorization:`Bearer ${token}` } });
        setUsers(data.authUsers||data.users||data);
        if (data.totalAuthUsers !== undefined) setStats(data);
        setSelectedIds(new Set());
        return;
      } catch(err) {
        if (!err.isHtmlResponse && !err.message.includes("Failed to fetch")) throw err;
      }
      setWarning("Auth user sync requires backend endpoint.");
      const snap = await getDocs(collection(getFirebaseDb(), "users"));
      setUsers(snap.docs.map(doc => {
        const p = doc.data();
        return { uid:doc.id, email:p.email||"", displayName:p.displayName||"", photoURL:p.photoURL||"",
          authStatus:"unknown", profileStatus:"exists", provider:p.provider||"email",
          createdAt:p.createdAt?new Date(p.createdAt.seconds*1000).toISOString():null,
          lastSignIn:null, role:p.role||"user", sector:p.sector||"" };
      }));
      setSelectedIds(new Set());
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchUsers();
    const iv = setInterval(fetchUsers, 60_000);
    return () => clearInterval(iv);
  }, [fetchUsers]);

  /* ── single-user actions ── */
  const patchJson = async (url, body) => {
    const token = await getToken();
    return fetchJson(url, { method:"PATCH", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:JSON.stringify(body) });
  };

  const updateUserRole = (uid, role, sector=null) =>
    setConfirm({ msg:`Change role to "${role}"?`, onConfirm:async()=>{
      try { await patchJson(`${USERS_ENDPOINT}/${uid}/role`, { role, sector }); notify("Role updated."); fetchUsers(); }
      catch(e){ notify(e.message,"error"); } setConfirm(null);
    }, onCancel:()=>setConfirm(null) });

  const toggleStatus = (uid, currentlyDisabled) =>
    setConfirm({ msg:`${currentlyDisabled?"Enable":"Disable"} this user?`, onConfirm:async()=>{
      try { await patchJson(`${USERS_ENDPOINT}/${uid}/status`, { disabled:!currentlyDisabled }); notify(`User ${currentlyDisabled?"enabled":"disabled"}.`); fetchUsers(); }
      catch(e){ notify(e.message,"error"); } setConfirm(null);
    }, onCancel:()=>setConfirm(null) });

  const delUser = uid =>
    setConfirm({ msg:"Permanently delete this user? Removes Auth record, Firestore profile and admin roles.", onConfirm:async()=>{
      try { const token=await getToken(); await fetchJson(`${USERS_ENDPOINT}/${uid}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } }); notify("User deleted."); fetchUsers(); }
      catch(e){ notify(e.message,"error"); } setConfirm(null);
    }, onCancel:()=>setConfirm(null) });

  const resetPassword = async email => {
    if (!email) return;
    try { await sendPasswordResetEmail(getFirebaseAuth(), email); notify(`Password reset sent to ${email}.`); }
    catch(e){ notify(e.message,"error"); }
  };

  /* ── bulk selection helpers ── */
  const onToggleSelect = uid => setSelectedIds(prev => {
    const s = new Set(prev);
    s.has(uid) ? s.delete(uid) : s.add(uid);
    return s;
  });

  const onSelectAll = (pageUsers, allSelected) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      pageUsers.forEach(u => allSelected ? s.delete(u.uid) : s.add(u.uid));
      return s;
    });
  };

  /* ── bulk actions ── */
  const bulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const label = action === "disable" ? "Disable" : action === "delete" ? "Delete" : "Reset password for";
    setConfirm({
      msg: `${label} ${ids.length} selected user(s)?`,
      onConfirm: async () => {
        setConfirm(null); setBulkLoading(true);
        let success = 0, errors = 0;
        const token = await getToken();
        for (const uid of ids) {
          try {
            if (action === "disable") {
              await fetchJson(`${USERS_ENDPOINT}/${uid}/status`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body:JSON.stringify({ disabled:true }) });
            } else if (action === "delete") {
              await fetchJson(`${USERS_ENDPOINT}/${uid}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
            } else if (action === "reset") {
              const u = users.find(u => u.uid === uid);
              if (u?.email) await sendPasswordResetEmail(getFirebaseAuth(), u.email);
            }
            success++;
          } catch { errors++; }
        }
        setBulkLoading(false);
        notify(`Done: ${success} succeeded${errors?`, ${errors} failed`:""}`, errors ? "error" : "success");
        fetchUsers();
      },
      onCancel: () => setConfirm(null),
    });
  };

  /* ── filter ── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const mQ = !q||(u.displayName||"").toLowerCase().includes(q)||(u.email||"").toLowerCase().includes(q)||u.uid.toLowerCase().includes(q);
    const mR = roleFilter==="all"||u.role===roleFilter;
    const mS = statusFilter==="all"
      ||(statusFilter==="active"   && u.authStatus!=="disabled" && u.profileStatus!=="orphaned")
      ||(statusFilter==="disabled" && u.authStatus==="disabled")
      ||(statusFilter==="orphaned" && u.profileStatus==="orphaned");
    return mQ&&mR&&mS;
  });

  const selCount = selectedIds.size;

  /* ── render ── */
  return (
    <div style={{ width:"100%", fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* Error */}
      {error && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:C.redBg, border:`1px solid ${C.redBdr}`, color:C.red, borderRadius:12, padding:"12px 16px", fontSize:13, marginBottom:16 }}>
          <span>⚠️</span><span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.goldBg, border:`1px solid ${C.goldBdr}`, color:C.gold, borderRadius:10, padding:"9px 14px", fontSize:12, fontWeight:500, marginBottom:16 }}>
          <span>⚠️</span><span>{warning}</span>
        </div>
      )}

      {/* Stats row */}
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12, marginBottom:20 }}>
          {[
            { label:"Auth Users",      value:stats.totalAuthUsers   },
            { label:"Profiles",        value:stats.totalProfiles    },
            { label:"Missing Profiles",value:stats.missingProfiles  },
            { label:"Orphaned",        value:stats.orphanProfiles   },
          ].map(s => (
            <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px" }}>
              <div style={{ color:C.gold, fontWeight:700, fontSize:22 }}>{s.value??"-"}</div>
              <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls row */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", marginBottom:16 }}>
        <div style={{ flex:"1 1 300px" }}>
          <UserFilters search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ color:C.dim, fontSize:12 }}>{filtered.length} users</span>
          <CsvExportButton users={filtered} />
          <button onClick={fetchUsers} disabled={loading} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", background:C.white5, border:`1px solid ${C.white10}`, borderRadius:10, color:C.text, fontSize:13, fontWeight:600, cursor:"pointer", opacity:loading?0.5:1, whiteSpace:"nowrap" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation:loading?"stea-spin 0.8s linear infinite":"none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <style>{`@keyframes stea-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selCount > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", background:"rgba(255,159,28,0.08)", border:`1px solid ${C.goldBdr}`, borderRadius:12, padding:"10px 16px", marginBottom:16 }}>
          <span style={{ color:C.gold, fontWeight:700, fontSize:13 }}>{selCount} selected</span>
          <div style={{ flex:1 }} />
          <button onClick={()=>bulkAction("reset")} disabled={bulkLoading} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:C.white5, border:`1px solid ${C.white10}`, borderRadius:8, color:C.text, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            PW Reset All
          </button>
          <button onClick={()=>bulkAction("disable")} disabled={bulkLoading} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"rgba(251,191,36,0.10)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:8, color:"#fbbf24", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Disable All
          </button>
          <button onClick={()=>bulkAction("delete")} disabled={bulkLoading} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:C.redBg, border:`1px solid ${C.redBdr}`, borderRadius:8, color:C.red, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Delete All
          </button>
          <button onClick={()=>setSelectedIds(new Set())} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"6px 12px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.dim, fontSize:12, cursor:"pointer" }}>
            Clear
          </button>
        </div>
      )}

      {/* Users table */}
      <UsersList
        users={filtered} loading={loading}
        onUpdateRole={updateUserRole} onToggleStatus={toggleStatus}
        onResetPassword={resetPassword} onDelete={delUser}
        selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAll={onSelectAll}
      />
    </div>
  );
}
