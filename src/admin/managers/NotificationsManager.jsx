/**
 * NotificationsManager.jsx — upgraded
 * Additions: full campaign history, search/filter, CSV export, readBy count, no debug logs
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc,
  getFirebaseAuth, getFirebaseDb,
  limit, onSnapshot, orderBy, query,
  serverTimestamp, updateDoc,
} from "../../firebase.js";
import { Bell, Check, Clock, Send, Trash2 } from "lucide-react";

const G = "#ff9f1c";
const C = {
  bg:"#0d0f18", card:"#13151f", border:"rgba(255,255,255,0.08)",
  text:"#e8eaf0", textMid:"rgba(232,234,240,0.55)", textDim:"rgba(232,234,240,0.30)",
  gold:G, goldBg:"rgba(255,159,28,0.10)", goldBdr:"rgba(255,159,28,0.25)",
  red:"#f87171",  redBg:"rgba(248,113,113,0.10)", redBdr:"rgba(248,113,113,0.25)",
  green:"#34d399",greenBg:"rgba(52,211,153,0.10)",
  white5:"rgba(255,255,255,0.05)", white10:"rgba(255,255,255,0.10)",
};

const inputStyle = { width:"100%", border:`1px solid ${C.border}`, borderRadius:10, background:"rgba(255,255,255,0.04)", color:C.text, padding:"10px 12px", outline:"none", fontSize:14, boxSizing:"border-box" };

const CATEGORIES = ["general","necta","post","marketplace","announcement"];

function formatTime(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? "—" : d.toLocaleString();
}

function StatusPill({ status }) {
  const colors = { sent:{ bg:C.greenBg, color:C.green }, failed:{ bg:C.redBg, color:C.red }, pending:{ bg:C.goldBg, color:C.gold } };
  const s = colors[status]||colors.sent;
  return <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color, textTransform:"uppercase" }}>{status||"sent"}</span>;
}

function exportCampaignCSV(items) {
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const headers = ["Title","Body","Category","Status","Sent","Failed","Total Tokens","Timestamp"];
  const rows = items.map(i=>[
    esc(i.title||""), esc(i.body||""), esc(i.category||""), esc(i.status||"sent"),
    esc(i.sentCount||0), esc(i.failedCount||0), esc(i.totalTokens||0), esc(formatTime(i.createdAt)),
  ].join(","));
  const csv = [headers.join(","),...rows].join("\r\n");
  const blob = new Blob(["\uFEFF"+csv],{ type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=`stea_notifications_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function NotificationsManager() {
  const [notifications, setNotifications]         = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [campaign, setCampaign]                   = useState({ title:"", body:"", linkUrl:"", category:"general" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState({ text:"", error:false });

  // Campaign history filters
  const [histSearch, setHistSearch]   = useState("");
  const [histCat, setHistCat]         = useState("all");
  const [histStatus, setHistStatus]   = useState("all");
  const [showFullHistory, setShowFullHistory] = useState(false);

  const db = getFirebaseDb();

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db,"admin_notifications"), orderBy("createdAt","desc"), limit(100));
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d=>({ id:d.id, ...d.data() })));
      setLoading(false);
    }, ()=>setLoading(false));
    return ()=>unsub();
  }, [db]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db,"notificationCampaigns"), orderBy("createdAt","desc"), limit(200));
    const unsub = onSnapshot(q, snap => {
      setSentNotifications(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    }, ()=>{});
    return ()=>unsub();
  }, [db]);

  const markAsRead = async id => {
    try { await updateDoc(doc(db,"admin_notifications",id),{ status:"read" }); } catch {}
  };
  const deleteNotification = async id => {
    try { await deleteDoc(doc(db,"admin_notifications",id)); } catch {}
  };
  const deleteCampaign = async id => {
    try { await deleteDoc(doc(db,"notificationCampaigns",id)); } catch {}
  };

  const editCampaign = (item) => {
    setCampaign({
      title: item.title || "",
      body: item.body || "",
      linkUrl: item.linkUrl || "",
      category: item.category || "general"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCampaign = async e => {
    e.preventDefault();
    setMessage({ text:"", error:false });
    if (!campaign.title.trim()||!campaign.body.trim()||!campaign.category.trim()) {
      setMessage({ text:"Title, body, and category are required.", error:true }); return;
    }
    setSaving(true);
    try {
      const currentUser = getFirebaseAuth()?.currentUser;
      if (!currentUser) { setMessage({ text:"Admin login required.", error:true }); return; }
      const idToken = await currentUser.getIdToken();
      const payload = { title:campaign.title.trim(), body:campaign.body.trim(), linkUrl:campaign.linkUrl.trim()||"/", category:campaign.category.trim() };

      let pushData = {};
      try {
        const res = await fetch("/api/admin/notifications/send",{
          method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${idToken}` },
          body:JSON.stringify(payload),
        });
        pushData = await res.json().catch(()=>({}));
      } catch {}

      await addDoc(collection(db,"notificationCampaigns"),{
        title:payload.title, body:payload.body, linkUrl:payload.linkUrl, category:payload.category,
        status:pushData.error?"failed":"sent",
        totalTokens:pushData.totalTokens||0, sentCount:pushData.sentCount||0, failedCount:pushData.failedCount||0,
        createdBy:currentUser.uid, createdAt:serverTimestamp(),
      });

      await addDoc(collection(db,"notifications"),{
        title:payload.title, body:payload.body, linkUrl:payload.linkUrl, category:payload.category,
        createdAt:serverTimestamp(), createdBy:currentUser.uid||currentUser.email||"admin",
        target:"all", readBy:[], isActive:true,
      });

      setCampaign({ title:"", body:"", linkUrl:"", category:"general" });
      const info = pushData.totalTokens!==undefined
        ? `Sent to ${pushData.sentCount||0} devices, ${pushData.failedCount||0} failed.`
        : "Notification saved.";
      setMessage({ text:info, error:false });
    } catch(err) {
      setMessage({ text:`Failed: ${err.message}`, error:true });
    } finally { setSaving(false); }
  };

  // Filtered campaign history
  const filteredHistory = useMemo(()=>{
    let f = sentNotifications;
    if (histCat!=="all") f = f.filter(n=>n.category===histCat);
    if (histStatus!=="all") f = f.filter(n=>(n.status||"sent")===histStatus);
    if (histSearch.trim()) {
      const q = histSearch.toLowerCase();
      f = f.filter(n=>(n.title||"").toLowerCase().includes(q)||(n.body||"").toLowerCase().includes(q));
    }
    return f;
  }, [sentNotifications, histCat, histStatus, histSearch]);

  const displayedHistory = showFullHistory ? filteredHistory : filteredHistory.slice(0,10);
  const unreadCount = notifications.filter(n=>n.status==="unread").length;

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", color:C.text }}>

      {/* === Send campaign form === */}
      <form onSubmit={saveCampaign} style={{ border:`1px solid rgba(255,159,28,0.20)`, borderRadius:18, padding:20, marginBottom:28, background:"radial-gradient(circle at 0 0,rgba(255,159,28,0.08),transparent 40%),rgba(255,255,255,0.02)" }}>
        <div style={{ marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:900 }}>Send Push Notification</h3>
          <p style={{ margin:"4px 0 0", color:C.textMid, fontSize:13 }}>Broadcasts to all active STEA devices that allowed notifications.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
          <input value={campaign.title} onChange={e=>setCampaign(p=>({...p,title:e.target.value}))} placeholder="Title *" style={inputStyle}/>
          <input value={campaign.linkUrl} onChange={e=>setCampaign(p=>({...p,linkUrl:e.target.value}))} placeholder="Link URL (optional)" style={inputStyle}/>
          <select value={campaign.category} onChange={e=>setCampaign(p=>({...p,category:e.target.value}))} style={{ ...inputStyle, cursor:"pointer", appearance:"none" }}>
            <option value="general">General</option>
            <option value="necta">NECTA updates</option>
            <option value="post">New post / learning content</option>
            <option value="marketplace">Marketplace</option>
            <option value="announcement">Important announcement</option>
          </select>
        </div>
        <textarea value={campaign.body} onChange={e=>setCampaign(p=>({...p,body:e.target.value}))} placeholder="Notification body *" rows={3}
          style={{ ...inputStyle, marginTop:10, resize:"vertical" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginTop:14, flexWrap:"wrap" }}>
          <div style={{ color:message.error?"#fca5a5":C.textMid, fontSize:12 }}>{message.text}</div>
          <button type="submit" disabled={saving} style={{ display:"inline-flex", alignItems:"center", gap:8, border:"none", borderRadius:12, padding:"10px 18px", background:`linear-gradient(135deg,${G},#ffd17c)`, color:"#111", fontWeight:900, cursor:saving?"wait":"pointer", fontSize:14 }}>
            <Send size={16}/>{saving?"Sending…":"Send to all"}
          </button>
        </div>
      </form>

      {/* === Campaign history === */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:900 }}>Campaign History</h3>
            <p style={{ margin:"3px 0 0", color:C.textMid, fontSize:12 }}>{sentNotifications.length} campaigns total</p>
          </div>
          <button onClick={()=>exportCampaignCSV(filteredHistory)}
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", background:C.goldBg, border:`1px solid ${C.goldBdr}`, borderRadius:10, color:C.gold, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>

        {/* History filters */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <div style={{ position:"relative", flex:"1 1 180px" }}>
            <svg width="13" height="13" fill="none" stroke={C.textDim} viewBox="0 0 24 24" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={histSearch} onChange={e=>setHistSearch(e.target.value)} placeholder="Search campaigns…"
              style={{ ...inputStyle, paddingLeft:28, fontSize:12, padding:"7px 10px 7px 28px" }}/>
          </div>
          <select value={histCat} onChange={e=>setHistCat(e.target.value)} style={{ ...inputStyle, width:"auto", minWidth:140, fontSize:12, padding:"7px 10px", cursor:"pointer", appearance:"none" }}>
            <option value="all">All categories</option>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={histStatus} onChange={e=>setHistStatus(e.target.value)} style={{ ...inputStyle, width:"auto", minWidth:120, fontSize:12, padding:"7px 10px", cursor:"pointer", appearance:"none" }}>
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {filteredHistory.length===0 ? (
          <div style={{ padding:"30px 0", textAlign:"center", color:C.textDim, border:`1px dashed ${C.border}`, borderRadius:12 }}>No campaigns match filters.</div>
        ) : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {displayedHistory.map(item=>(
                <div key={item.id} style={{ border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 16px", background:C.card }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:6 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <strong style={{ fontSize:14 }}>{item.title}</strong>
                        <span style={{ color:C.gold, fontSize:11, fontWeight:800, background:C.goldBg, padding:"1px 7px", borderRadius:10 }}>{item.category||"general"}</span>
                        <StatusPill status={item.status}/>
                      </div>
                      <div style={{ color:C.textMid, fontSize:12 }}>{item.body}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>editCampaign(item)} title="Edit/Resend campaign" style={{ width:30, height:30, borderRadius:8, background:C.white5, border:`1px solid ${C.border}`, color:C.textMid, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Send size={14}/>
                      </button>
                      <button onClick={()=>deleteCampaign(item.id)} title="Delete campaign" style={{ width:30, height:30, borderRadius:8, background:C.redBg, border:`1px solid ${C.redBdr}`, color:C.red, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:11, color:C.textDim }}>
                    <span>📤 Sent: <strong style={{ color:C.green }}>{item.sentCount||0}</strong></span>
                    {item.failedCount>0 && <span>❌ Failed: <strong style={{ color:C.red }}>{item.failedCount}</strong></span>}
                    <span>📱 Tokens: {item.totalTokens||0}</span>
                    {item.readBy && <span>👁 Read: {Array.isArray(item.readBy)?item.readBy.length:0}</span>}
                    <span><Clock size={11} style={{ display:"inline" }}/> {formatTime(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            {filteredHistory.length > 10 && (
              <button onClick={()=>setShowFullHistory(!showFullHistory)}
                style={{ marginTop:12, width:"100%", padding:"10px", background:C.white5, border:`1px solid ${C.border}`, borderRadius:10, color:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {showFullHistory ? "Show less" : `Show all ${filteredHistory.length} campaigns`}
              </button>
            )}
          </>
        )}
      </div>

      {/* === Admin notifications === */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:900 }}>Admin Alerts</h3>
            <p style={{ margin:"3px 0 0", color:C.textMid, fontSize:12 }}>Real-time system notifications for admins.</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={()=>notifications.filter(n=>n.status==="unread").forEach(n=>markAsRead(n.id))}
              style={{ padding:"7px 14px", borderRadius:10, background:C.white5, border:`1px solid ${C.border}`, color:C.text, fontWeight:700, cursor:"pointer", fontSize:12 }}>
              Mark all {unreadCount} read
            </button>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {notifications.map(n=>(
            <div key={n.id} style={{ background:n.status==="unread"?"rgba(255,159,28,0.04)":C.card, border:`1px solid ${n.status==="unread"?"rgba(255,159,28,0.2)":C.border}`, borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14 }}>
              <div style={{ display:"flex", gap:14, alignItems:"center", minWidth:0 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:n.status==="unread"?G:"rgba(255,255,255,0.05)", display:"grid", placeItems:"center", color:n.status==="unread"?"#000":C.textMid, flexShrink:0 }}>
                  <Bell size={18}/>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{n.title}</div>
                  <div style={{ fontSize:13, color:C.textMid }}>{n.message}</div>
                  <div style={{ fontSize:11, color:C.textDim, marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                    <Clock size={11}/>{formatTime(n.createdAt)}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                {n.status==="unread" && (
                  <button onClick={()=>markAsRead(n.id)} style={{ width:34, height:34, borderRadius:8, background:C.greenBg, color:C.green, border:"none", cursor:"pointer", display:"grid", placeItems:"center" }} title="Mark as read">
                    <Check size={16}/>
                  </button>
                )}
                <button onClick={()=>deleteNotification(n.id)} style={{ width:34, height:34, borderRadius:8, background:C.redBg, color:C.red, border:"none", cursor:"pointer", display:"grid", placeItems:"center" }} title="Delete">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
          {!loading && notifications.length===0 && (
            <div style={{ textAlign:"center", padding:"50px 20px", color:C.textDim, border:`1px dashed ${C.border}`, borderRadius:12 }}>
              All caught up — no admin alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
