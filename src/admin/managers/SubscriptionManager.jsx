import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection, doc, getDocs, onSnapshot, query, setDoc, deleteDoc, serverTimestamp,
  storage, ref, uploadBytes, getDownloadURL, getFirebaseDb, limit, orderBy,
  getExactStorageErrorMessage, logFirebaseStorageError, logStorageUpload
} from "../../firebase.js";
import { Toast } from "../AdminUI";
import { cleanData, fmtDate } from "../../utils/cleanData.js";
import { 
  Users, CheckCircle, Clock, AlertTriangle, CreditCard, 
  Settings, Search, ArrowLeft, RefreshCw, Edit3, XCircle, FileImage, 
  Eye, Ban, Check, QrCode, Plus, Trash2 
} from "lucide-react";

// Colors and constants
const G = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";
const cardSt = { background: "rgba(255,255,255,.03)", borderRadius: 14, border: `1px solid ${BORDER}`, padding: 16 };
const iSt = { width: "100%", height: 38, borderRadius: 10, background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`, color: "#fff", padding: "0 12px", outline: "none", fontSize: 13, boxSizing: "border-box" };
const lSt = { display: "block", fontSize: 11, fontWeight: 850, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 };

// Utilities
function toNumber(val) { const p = Number(String(val).replace(/[^\d.-]/g, "")); return Number.isFinite(p) ? p : 0; }
function money(cur, val) { const n = toNumber(val); if(cur==="USD") return `USD $${n.toLocaleString()}`; if(cur==="CNY") return `CNY ¥${n.toLocaleString()}`; return `TZS ${n.toLocaleString()}`; }
function addDays(date, d) { const res = new Date(date); res.setDate(res.getDate() + d); return res; }
function diffDays(dt) { if(!dt) return null; const d1 = new Date(); const d2 = new Date(dt); return Math.ceil((d2.getTime() - d1.getTime()) / (1000*3600*24)); }

function actionBtn(color, soft = false) {
  return {
    height: 28, borderRadius: 8, border: soft ? `1px solid ${color}55` : "none",
    background: soft ? `${color}18` : color, color: soft ? color : "#111",
    fontWeight: 900, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0 10px", whiteSpace: "nowrap"
  };
}

function StatCard({ label, value, icon, color = G, subValue }) {
  return (
    <div style={cardSt}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: "rgba(255,255,255,.48)", fontSize: 12, fontWeight: 850 }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ color, fontSize: 25, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      {subValue && <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 6, fontWeight: 700 }}>{subValue}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "active") return <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:900, background:"rgba(34,197,94,.15)", color:"#22c55e" }}>ACTIVE</span>;
  if (status === "pending") return <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:900, background:"rgba(251,191,36,.15)", color:"#fbbf24" }}>PENDING</span>;
  if (status === "rejected" || status === "cancelled") return <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:900, background:"rgba(239,68,68,.15)", color:"#f87171" }}>{status.toUpperCase()}</span>;
  if (status === "expired") return <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:900, background:"rgba(249,115,22,.15)", color:"#f97316" }}>EXPIRED</span>;
  return <span style={{ padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:900, background:"rgba(148,163,184,.15)", color:"#cbd5e1" }}>{status?.toUpperCase()}</span>;
}

// ----------------------------------------------------
// COMPONENTS
// ----------------------------------------------------

export default function SubscriptionManager({ user, defaultTab = "overview" }) {
  const db = getFirebaseDb();
  const [activeTab, setActiveTab] = useState(defaultTab); // overview, all, methods, users, revenue, tools
  const [selectedToolId, setSelectedToolId] = useState(null); // When viewing a specific tool
  
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [methods, setMethods] = useState([]);
  const [toast, setToast] = useState(null);
  
  const showToast = useCallback((msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch everything initially (new unified collections + legacy digital tools for backward compatibility)
  useEffect(() => {
    if(!db) return;
    
    // Services
    const unsubServ = onSnapshot(collection(db, "subscriptionServices"), snap => {
      setServices(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    // Fallback reading old digitalTools
    const unsubDT = onSnapshot(collection(db, "digitalTools"), snap => {
      // Map legacy to new format if not exists in new
      const dt = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, _legacy: true,
          title: data.name || data.title || "Unknown",
          type: "digital_tool",
          isActive: data.isActive !== false,
          ...data
        }
      });
      setServices(prev => {
        const newIds = new Set(prev.filter(s => !s._legacy).map(s => s.id));
        return [...prev.filter(s => !s._legacy), ...dt.filter(d => !newIds.has(d.id))];
      });
    }, err => console.error("digitalTools read error:", err));

    // Plans
    const unsubPlans = onSnapshot(collection(db, "servicePlans"), snap => {
      setPlans(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    // Subs
    const qSubs = query(collection(db, "serviceSubscriptions"), orderBy("createdAt", "desc"), limit(500));
    const unsubSubs = onSnapshot(qSubs, snap => {
      setSubs(prev => {
        const existing = prev.filter(p => p._legacy);
        const nw = snap.docs.map(d => ({id: d.id, ...d.data()}));
        return [...nw, ...existing];
      });
    }, err => console.error("Subs error:", err));

    const qLegacySubs = query(collection(db, "toolSubscriptions"), orderBy("createdAt", "desc"), limit(500));
    const unsubLegacySubs = onSnapshot(qLegacySubs, snap => {
      setSubs(prev => {
        const existing = prev.filter(p => !p._legacy);
        const legacy = snap.docs.map(d => ({id: d.id, _legacy: true, ...d.data()}));
        // unify fields
        const unified = legacy.map(s => ({
          ...s,
          serviceId: s.toolId || s.serviceId,
          serviceTitle: s.toolTitle || s.serviceTitle,
          fullName: s.userName || s.fullName,
          email: s.userEmail || s.email,
        }));
        return [...existing, ...unified];
      });
    }, err => console.error("Legacy Subs error:", err));

    // Methods
    const unsubMeth = onSnapshot(collection(db, "servicePaymentMethods"), snap => {
      setMethods(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => { unsubServ(); unsubDT(); unsubPlans(); unsubSubs(); unsubLegacySubs(); unsubMeth(); };
  }, [db]);

  // Overall statistics
  const stats = useMemo(() => {
    let tzs = 0, usd = 0, cny = 0;
    subs.filter(s => s.status === 'active').forEach(s => {
      if(s.currency === "USD") usd += toNumber(s.amount);
      else if(s.currency === "CNY") cny += toNumber(s.amount);
      else tzs += toNumber(s.amount);
    });
    return {
      total: subs.length,
      active: subs.filter(s => s.status === "active").length,
      pending: subs.filter(s => s.status === "pending").length,
      expired: subs.filter(s => s.status === "expired" || (s.status === "active" && diffDays(s.expiresAt) < 0)).length,
      rejected: subs.filter(s => s.status === "rejected").length,
      revenueTzs: tzs,
      revenueUsd: usd,
      revenueCny: cny,
      expiringSoon: subs.filter(s => s.status === "active" && diffDays(s.expiresAt) >= 0 && diffDays(s.expiresAt) <= 7),
      recent: [...subs].sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).slice(0,10)
    };
  }, [subs]);

  // View per tool
  if(selectedToolId) {
    const service = services.find(s => s.id === selectedToolId);
    if(service) {
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <button onClick={() => setSelectedToolId(null)} style={{ ...cardSt, padding: "8px 12px", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)" }}><ArrowLeft size={16} /></button>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{service.title}</h2>
            <span style={{ background: "rgba(255,255,255,.08)", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>{service.type || "Service"}</span>
          </div>
          <ToolWorkspace 
            service={service} 
            servicePlans={plans.filter(p => p.serviceId === service.id)}
            serviceSubs={subs.filter(s => s.serviceId === service.id)}
            methods={methods}
            db={db} user={user} showToast={showToast}
          />
          {toast && <Toast msg={toast.msg} type={toast.type} />}
        </div>
      );
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 5 }}>
        {["overview", "all", "pending", "expiring", "tools", "methods", "revenue"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ height: 36, padding: "0 16px", borderRadius: 10, border: `1px solid ${activeTab===t ? G : BORDER}`, background: activeTab===t ? G : "transparent", color: activeTab===t ? "#111" : "rgba(255,255,255,.66)", fontWeight: 900, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap" }}>
            {t === "overview" ? "Overview" : t === "all" ? "All Subscriptions" : t === "pending" ? `Pending (${stats.pending})` : t === "expiring" ? `Expiring Soon (${stats.expiringSoon.length})` : t === "tools" ? "Services / Tools" : t === "methods" ? "Payment Methods" : "Revenue Analytics"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <StatCard label="Total Subscriptions" value={stats.total} icon={<Users size={18}/>} color="#a5b4fc" />
            <StatCard label="Active Subs" value={stats.active} icon={<CheckCircle size={18}/>} color="#22c55e" />
            <StatCard label="Pending Approval" value={stats.pending} icon={<Clock size={18}/>} color="#fbbf24" />
            <StatCard label="Expired / Rejected" value={stats.expired + stats.rejected} icon={<AlertTriangle size={18}/>} color="#f87171" subValue={`${stats.expired} Expired, ${stats.rejected} Rejected`} />
            <StatCard label="TZS Revenue" value={money("TZS", stats.revenueTzs)} icon={<CreditCard size={18} />} />
            <StatCard label="USD Revenue" value={money("USD", stats.revenueUsd)} icon={<CreditCard size={18} />} color="#60a5fa" />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={cardSt}>
              <div style={{ color: G, fontWeight: 950, marginBottom: 16 }}>Recent Payments & Subscribers</div>
              {stats.recent.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{s.fullName || "Unknown"} <StatusBadge status={s.status} /></div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{s.serviceTitle || "-"} | {money(s.currency, s.amount)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{fmtDate(s.createdAt)}</div>
                </div>
              ))}
            </div>
            <div style={cardSt}>
              <div style={{ color: G, fontWeight: 950, marginBottom: 16 }}>Expiring Soon (7 days)</div>
              {stats.expiringSoon.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{s.fullName || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{s.serviceTitle || "-"}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>{diffDays(s.expiresAt)} days left</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <ServicesTab services={services} onSelectTool={setSelectedToolId} db={db} showToast={showToast} />
      )}

      {(activeTab === "all" || activeTab === "pending" || activeTab === "expiring") && (
        <SubscriptionsList 
          subs={activeTab === "pending" ? subs.filter(s => s.status === "pending") : activeTab === "expiring" ? stats.expiringSoon : subs} 
          db={db} showToast={showToast} user={user} 
        />
      )}

      {activeTab === "methods" && (
        <GlobalPaymentMethods methods={methods} db={db} showToast={showToast} services={services} />
      )}

      {activeTab === "revenue" && (
        <RevenueAnalytics subs={subs} stats={stats} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ----------------------------------------------------
// GLOBAL TABS
// ----------------------------------------------------

function ServicesTab({ services, onSelectTool, db, showToast }) {
  const [form, setForm] = useState(null);
  const save = async () => {
    if(!form.title) return showToast("Title required", "error");
    try {
      const id = form.id || doc(collection(db, "subscriptionServices")).id;
      const payload = cleanData({
        ...form, slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        updatedAt: serverTimestamp(),
        createdAt: form.id ? undefined : serverTimestamp()
      });
      await setDoc(doc(db, "subscriptionServices", id), payload, { merge: true });
      showToast("Service saved");
      setForm(null);
    } catch(e) { showToast(e.message, "error"); }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>All Services & Tools</h3>
        <button onClick={() => setForm({ title: "", type: "digital_tool", isActive: true })} style={actionBtn(G)}><Plus size={14}/> Add Service</button>
      </div>

      {form && (
        <div style={cardSt}>
          <div style={{ color: G, fontWeight: 900, marginBottom: 12 }}>{form.id ? "Edit Service" : "New Service"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lSt}>Title</label><input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} style={iSt} /></div>
            <div><label style={lSt}>Type</label><select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} style={iSt}>
              <option value="digital_tool">Digital Tool</option>
              <option value="vpn">VPN Service</option>
              <option value="ai">AI / ChatGPT Plus</option>
              <option value="template">Website Template</option>
              <option value="marketplace">Marketplace Premium</option>
              <option value="other">Other</option>
            </select></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lSt}>Description</label><textarea value={form.description||""} onChange={e=>setForm({...form, description: e.target.value})} style={{...iSt, height:60}} /></div>
            <div style={{ display: "flex", gap: 10, gridColumn: "1/-1" }}>
               <button onClick={save} style={actionBtn(G)}>Save Service</button>
               <button onClick={()=>setForm(null)} style={actionBtn("#fff", true)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ ...cardSt, display: "flex", flexDirection: "column", gap: 12, border: `1px solid ${s.isActive ? "rgba(34,197,94,.3)" : BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 16 }}>{s.title}</strong>
              {s._legacy && <span style={{ fontSize: 9, background: "#333", padding: "2px 6px", borderRadius: 4 }}>Legacy</span>}
            </div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>{s.type}</div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onSelectTool(s.id)} style={{ ...actionBtn(G, true), flex: 1 }}><Settings size={13}/> Manage Workspace</button>
              <button onClick={() => setForm(s)} style={actionBtn("#60a5fa", true)}><Edit3 size={13}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsList({ subs, db, showToast, user, toolFilterId = null }) {
  const [search, setSearch] = useState("");
  
  const filtered = useMemo(() => {
    let res = subs;
    if(toolFilterId) res = res.filter(s => s.serviceId === toolFilterId);
    if(search) {
      const q = search.toLowerCase();
      res = res.filter(s => (s.fullName||s.userName||"").toLowerCase().includes(q) || (s.email||"").toLowerCase().includes(q) || (s.whatsapp||"").includes(q) || (s.paymentReference||"").toLowerCase().includes(q));
    }
    return res;
  }, [subs, search, toolFilterId]);

  const updateSub = useCallback(async (sub, updates) => {
    try {
      const col = sub._legacy ? "toolSubscriptions" : "serviceSubscriptions";
      await setDoc(doc(db, col, sub.id), cleanData({ ...updates, updatedAt: serverTimestamp() }), { merge: true });
      showToast("Updated successfully.");
    } catch(e) { showToast(e.message, "error"); }
  }, [db, showToast]);

  const approve = useCallback((sub) => {
    const s = new Date(sub.startsAt || new Date().toISOString());
    const e = addDays(s, Number(sub.durationDays||30));
    updateSub(sub, { status: "active", startsAt: s.toISOString(), expiresAt: e.toISOString(), approvedAt: serverTimestamp(), approvedBy: user?.email });
  }, [updateSub, user]);
  
  const renew = useCallback((sub) => {
    const days = Number(window.prompt("Renew for how many days?", "30"));
    if(!days) return;
    const base = sub.expiresAt && diffDays(sub.expiresAt) > 0 ? new Date(sub.expiresAt) : new Date();
    updateSub(sub, { status: "active", expiresAt: addDays(base, days).toISOString() });
  }, [updateSub]);

  // Extract common subscription render into its own block to remain lightweight
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subscribers..." style={{ ...iSt, maxWidth: 300 }} />
      </div>
      {filtered.length === 0 && <div style={{ color: "rgba(255,255,255,.4)", padding: 20 }}>No subscriptions found.</div>}
      {filtered.map(sub => {
        const d = diffDays(sub.expiresAt);
        return (
          <div key={sub.id} style={{ ...cardSt, borderColor: sub.status === "pending" ? G : BORDER }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr .8fr auto", gap: 14 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{sub.fullName||sub.userName||"Unknown"}</strong>
                  <StatusBadge status={sub.status} />
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{sub.email||"-"}<br/>{sub.whatsapp||"-"}</div>
                {sub.notes && <div style={{ fontSize: 11, color: G, marginTop: 4 }}>Notes: {sub.notes}</div>}
              </div>
              <div>
                <div style={{ color: G, fontWeight: 900, fontSize: 13 }}>{sub.serviceTitle || sub.toolTitle || "Unknown Tool"}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>Plan: {sub.planName || "-"}<br/>Duration: {sub.durationDays||30} days</div>
              </div>
              <div>
                <div style={{ fontWeight: 900 }}>{money(sub.currency, sub.amount)}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{sub.paymentMethod}<br/>Ref: {sub.paymentReference}</div>
                {sub.paymentProofUrl && <a href={sub.paymentProofUrl} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#60a5fa", display:"inline-block", marginTop:4 }}>View Proof</a>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 120 }}>
                {sub.expiresAt && (
                  <div 
                    title="Click to edit expiry"
                    onClick={() => {
                      const ex = window.prompt("Set expiry date (YYYY-MM-DD):", new Date(sub.expiresAt).toISOString().split('T')[0]);
                      if (ex && !isNaN(new Date(ex).getTime())) {
                        updateSub(sub, { expiresAt: new Date(ex).toISOString() });
                      }
                    }}
                    style={{ cursor: "pointer", fontSize: 11, color: d <= 7 ? "#fbbf24" : "rgba(255,255,255,.5)", marginBottom: 2, borderBottom: "1px dashed rgba(255,255,255,.3)" }}
                  >
                    Exp: {fmtDate(sub.expiresAt)} {d!=null && `(${d}d)`}
                  </div>
                )}
                {sub.status === "pending" && <button onClick={()=>approve(sub)} style={actionBtn("#22c55e")}><CheckCircle size={12}/> Approve</button>}
                {(sub.status === "pending" || sub.status === "active") && <button onClick={()=>updateSub(sub, { status: "rejected" })} style={actionBtn("#f87171", true)}><XCircle size={12}/> {sub.status==="active"?"Cancel":"Reject"}</button>}
                {sub.status === "active" && <button onClick={()=>renew(sub)} style={actionBtn(G, true)}><RefreshCw size={12}/> Renew</button>}
                
                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  <button onClick={()=>{const n=window.prompt("Notes:",sub.notes||""); if(n!==null) updateSub(sub,{notes:n})}} style={actionBtn("#60a5fa", true)}><Edit3 size={12}/> Notes</button>
                  {sub.whatsapp && (
                    <a href={`https://wa.me/${sub.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ ...actionBtn("#25d366"), textDecoration: "none" }}>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GlobalPaymentMethods({ methods, db, showToast }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={cardSt}>
        <div style={{ color: G, fontWeight: 900, marginBottom: 10 }}>Global Payment Methods</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
          These methods will be visible across <strong>all</strong> subscription services unless a service has its own specific methods.
        </div>
      </div>
      <PaymentMethodsManager 
        serviceId="global" 
        methods={methods.filter(m => m.serviceId === "global")} 
        db={db} 
        showToast={showToast} 
      />
    </div>
  );
}

function RevenueAnalytics({ subs, stats }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
       <div style={cardSt}>
           <h3 style={{ margin: "0 0 16px", color: G }}>Total Revenue across all tools</h3>
           <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
             <StatCard label="Total TZS" value={money("TZS", stats.revenueTzs)} icon={<CreditCard size={18}/>} color="#a5b4fc" />
             <StatCard label="Total USD" value={money("USD", stats.revenueUsd)} icon={<CreditCard size={18}/>} color="#22c55e" />
             <StatCard label="Total CNY" value={money("CNY", stats.revenueCny)} icon={<CreditCard size={18}/>} color="#fbbf24" />
           </div>
       </div>
    </div>
  )
}

// ----------------------------------------------------
// PER-TOOL WORKSPACE
// ----------------------------------------------------

function ToolWorkspace({ service, servicePlans, serviceSubs, methods, db, user, showToast }) {
  const [tab, setTab] = useState("subs"); // subs, plans, methods, settings
  
  return (
    <div>
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${BORDER}`, marginBottom: 20, paddingBottom: 10 }}>
        {["subs", "plans", "methods", "settings"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ background: "transparent", border: "none", color: tab===t ? G : "rgba(255,255,255,.5)", fontWeight: 900, cursor: "pointer", fontSize: 13, textTransform: "capitalize", borderBottom: tab===t ? `2px solid ${G}` : "none", paddingBottom: 4 }}>
            {t === "subs" ? `Subscribers (${serviceSubs.length})` : t === "plans" ? "Pricing Plans" : t === "methods" ? "Payment Methods" : "Tool Info"}
          </button>
        ))}
      </div>

      {tab === "subs" && <SubscriptionsList subs={serviceSubs} db={db} showToast={showToast} user={user} toolFilterId={service.id} />}
      
      {tab === "plans" && <ToolPlans service={service} plans={servicePlans} db={db} showToast={showToast} />}
      
      {tab === "methods" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={cardSt}>
            <div style={{ color: G, fontWeight: 900, marginBottom: 10 }}>Methods for {service.title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Specific methods added here override global ones, or complement them.</div>
          </div>
          <PaymentMethodsManager 
            serviceId={service.id} 
            methods={methods.filter(m => m.serviceId === service.id)} 
            db={db} 
            showToast={showToast} 
          />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 850, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>Active Global Methods (FYI)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10, opacity: 0.5 }}>
              {methods.filter(m => m.serviceId === "global").map(m => (
                <div key={m.id} style={{ ...cardSt, fontSize: 12 }}>{m.name} ({m.currency})</div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {tab === "settings" && <ToolSettings service={service} db={db} showToast={showToast} />}

    </div>
  );
}

function ToolPlans({ service, plans, db, showToast }) {
  const [form, setForm] = useState(null);
  const save = async () => {
    if(!form.name) return showToast("Name required", "error");
    try {
      const id = form.id || doc(collection(db, "servicePlans")).id;
      await setDoc(doc(db, "servicePlans", id), cleanData({
        ...form, serviceId: service.id, serviceTitle: service.title,
        prices: { TZS: toNumber(form.prices?.TZS), USD: toNumber(form.prices?.USD), CNY: toNumber(form.prices?.CNY) },
        updatedAt: serverTimestamp(), createdAt: form.id ? undefined : serverTimestamp()
      }), { merge: true });
      showToast("Plan saved"); setForm(null);
    } catch(e) { showToast(e.message, "error"); }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button onClick={() => setForm({ name: "", durationDays: 30, prices: { TZS: 0, USD: 0, CNY: 0 }, isActive: true })} style={{ ...actionBtn(G), width: 140 }}><Plus size={14}/> Add Plan</button>
      {form && (
        <div style={cardSt}>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
             <div><label style={lSt}>Plan Name</label><input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} style={iSt} placeholder="e.g. Basic 1 Month"/></div>
             <div><label style={lSt}>Duration (Days)</label><input type="number" value={form.durationDays} onChange={e=>setForm({...form, durationDays: e.target.value})} style={iSt}/></div>
             <div><label style={lSt}>Price TZS</label><input type="number" value={form.prices?.TZS} onChange={e=>setForm({...form, prices:{...form.prices, TZS: e.target.value}})} style={iSt}/></div>
             <div><label style={lSt}>Price USD</label><input type="number" value={form.prices?.USD} onChange={e=>setForm({...form, prices:{...form.prices, USD: e.target.value}})} style={iSt}/></div>
             <div><label style={lSt}>Price CNY</label><input type="number" value={form.prices?.CNY} onChange={e=>setForm({...form, prices:{...form.prices, CNY: e.target.value}})} style={iSt}/></div>
             <div style={{ display: "flex", gap: 10, alignSelf:"end" }}><button onClick={save} style={actionBtn(G)}>Save Plan</button><button onClick={()=>setForm(null)} style={actionBtn("#fff",true)}>Cancel</button></div>
           </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 14 }}>
        {plans.map(p => (
           <div key={p.id} style={cardSt}>
             <div style={{ display: "flex", justifyContent:"space-between", marginBottom: 10 }}><strong style={{ color: G }}>{p.name}</strong> <span>{p.durationDays} Days</span></div>
             <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>TZS {p.prices?.TZS} | USD {p.prices?.USD} | CNY {p.prices?.CNY}</div>
             <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
               <button onClick={()=>setForm(p)} style={actionBtn("#60a5fa",true)}><Edit3 size={12}/> Edit</button>
               <button onClick={async ()=>{if(window.confirm("Delete?")) await deleteDoc(doc(db,"servicePlans",p.id))}} style={actionBtn("#f87171",true)}><Trash2 size={12}/> Delete</button>
             </div>
           </div>
        ))}
      </div>
    </div>
  )
}

function PaymentMethodsManager({ serviceId, methods, db, showToast }) {
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    if (!form.name) return showToast("Name required", "error");
    try {
      const id = form.id || doc(collection(db, "servicePaymentMethods")).id;
      const payload = cleanData({
        ...form,
        serviceId: serviceId,
        updatedAt: serverTimestamp(),
        createdAt: form.id ? undefined : serverTimestamp()
      });
      await setDoc(doc(db, "servicePaymentMethods", id), payload, { merge: true });
      showToast("Method saved successfully");
      setForm(null);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const uploadQr = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadPath = `paymentMethods/qr/${Date.now()}_${file.name}`;
      logStorageUpload(uploadPath);
      const fileRef = ref(storage, uploadPath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setForm(prev => ({ ...prev, qrCodeUrl: url }));
      showToast("QR Uploaded");
    } catch (e) {
      logFirebaseStorageError(e);
      showToast("Upload failed: " + getExactStorageErrorMessage(e), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={() => setForm({ name: "", type: "mobile_money", currency: "TZS", isActive: true })} 
          style={{ ...actionBtn(G), width: 180 }}
        >
          <Plus size={14} style={{ marginRight: 6 }} /> Add {serviceId === 'global' ? 'Global' : 'Specific'} Method
        </button>
      </div>

      {form && (
        <div style={cardSt}>
          <div style={{ color: G, fontWeight: 900, marginBottom: 16 }}>
            {form.id ? "Edit Payment Method" : "New Payment Method"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div>
              <label style={lSt}>Method Name</label>
              <input 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                style={iSt} 
                placeholder="e.g. M-Pesa, WeChat Pay"
              />
            </div>
            <div>
              <label style={lSt}>Currency</label>
              <select 
                value={form.currency} 
                onChange={e => setForm({ ...form, currency: e.target.value })} 
                style={iSt}
              >
                <option value="TZS">TZS</option>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="ALL">ALL Currencies</option>
              </select>
            </div>
            <div>
              <label style={lSt}>Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value })} 
                style={iSt}
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="qr">QR Code Pay</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card / Online</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={lSt}>Account Number / Details</label>
              <input 
                value={form.accountNumber || ""} 
                onChange={e => setForm({ ...form, accountNumber: e.target.value })} 
                style={iSt}
                placeholder="Account or Phone number"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lSt}>Account Holder Name</label>
              <input 
                value={form.accountName || ""} 
                onChange={e => setForm({ ...form, accountName: e.target.value })} 
                style={iSt}
                placeholder="Full Name on account"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lSt}>Instructions</label>
              <textarea 
                value={form.instructions || ""} 
                onChange={e => setForm({ ...form, instructions: e.target.value })} 
                style={{ ...iSt, height: 80, padding: 12 }}
                placeholder="Step-by-step payment instructions for the user..."
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lSt}>QR Code Image</label>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {form.qrCodeUrl ? (
                  <img 
                    src={form.qrCodeUrl} 
                    alt="QR Preview" 
                    style={{ width: 100, height: 100, borderRadius: 10, objectFit: "cover", border: `1px solid ${BORDER}` }} 
                  />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: 10, background: "rgba(255,255,255,.05)", display: "grid", placeItems: "center", border: `1px dashed ${BORDER}` }}>
                    <QrCode size={30} opacity={0.2} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input 
                    value={form.qrCodeUrl || ""} 
                    onChange={e => setForm({ ...form, qrCodeUrl: e.target.value })} 
                    style={iSt} 
                    placeholder="URL to QR Code image"
                  />
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, ...actionBtn("#fff", true), width: "auto", cursor: "pointer" }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => uploadQr(e.target.files[0])} 
                        style={{ display: "none" }} 
                      />
                      <FileImage size={14} /> {uploading ? "Uploading..." : "Upload New QR Image"}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={save} style={{ ...actionBtn(G), padding: "0 24px", height: 36 }}>Save Method</button>
              <button onClick={() => setForm(null)} style={{ ...actionBtn("#fff", true), padding: "0 20px", height: 36 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {methods.map(m => (
          <div key={m.id} style={{ ...cardSt, display: "flex", gap: 16, border: `1px solid ${m.isActive ? BORDER : "rgba(239,68,68,.2)"}` }}>
            <div style={{ flexShrink: 0 }}>
              {m.qrCodeUrl ? (
                <img src={m.qrCodeUrl} alt={m.name} style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 70, height: 70, borderRadius: 8, background: "rgba(255,255,255,.05)", display: "grid", placeItems: "center" }}>
                  <CreditCard color={G} size={24} opacity={0.4} />
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2, textTransform: "uppercase" }}>
                    {m.type?.replace('_', ' ')} • {m.currency}
                  </div>
                </div>
                {!m.isActive && <span style={{ fontSize: 9, color: "#f87171", fontWeight: 800 }}>INACTIVE</span>}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 6, fontWeight: 700 }}>
                {m.accountNumber}
              </div>
              {m.accountName && <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{m.accountName}</div>}
              
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setForm(m)} style={actionBtn("#60a5fa", true)}>
                  <Edit3 size={12} /> Edit
                </button>
                <button 
                  onClick={async () => { if (window.confirm("Permanently delete this payment method?")) await deleteDoc(doc(db, "servicePaymentMethods", m.id)); }} 
                  style={actionBtn("#f87171", true)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {methods.length === 0 && !form && (
          <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,.3)" }}>
            No {serviceId === 'global' ? 'global' : 'specific'} payment methods found.
          </div>
        )}
      </div>
    </div>
  );
}

function ToolSettings({ service, db, showToast }) {
  const [form, setForm] = useState(service);
  const save = async () => {
    try {
      await setDoc(doc(db, "subscriptionServices", form.id), cleanData({ ...form, updatedAt: serverTimestamp() }), { merge: true });
      showToast("Tool updated");
    } catch(e) { showToast(e.message, "error"); }
  }
  return (
    <div style={{ maxWidth: 600, ...cardSt }}>
      <div style={{ display: "grid", gap: 12 }}>
         <div><label style={lSt}>Title</label><input value={form.title||""} onChange={e=>setForm({...form, title: e.target.value})} style={iSt}/></div>
         <div><label style={lSt}>Brand Name / Powered By</label><input value={form.brandName||""} onChange={e=>setForm({...form, brandName: e.target.value})} style={iSt}/></div>
         <div><label style={lSt}>Thumbnail URL</label><input value={form.thumbnailUrl||""} onChange={e=>setForm({...form, thumbnailUrl: e.target.value})} style={iSt}/></div>
         <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 800 }}>
            <input type="checkbox" checked={!!form.isActive} onChange={e=>setForm({...form, isActive: e.target.checked})} /> Is Active
         </label>
         <button onClick={save} style={{ ...actionBtn(G), marginTop: 10 }}>Save Details</button>
      </div>
    </div>
  )
}
