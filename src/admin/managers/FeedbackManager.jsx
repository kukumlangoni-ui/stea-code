/**
 * FeedbackManager.jsx — upgraded
 * Additions: star filter, name/email search, reply UI, CSV export, avg rating
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  collection, deleteDoc, doc, getFirebaseDb,
  limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "../../firebase.js";
import { ConfirmDialog, Toast } from "../AdminUI.jsx";

const G = "#ff9f1c";
const C = {
  bg:"#0d0f18", card:"#13151f", border:"rgba(255,255,255,0.08)",
  text:"#e8eaf0", textMid:"rgba(232,234,240,0.55)", textDim:"rgba(232,234,240,0.30)",
  gold:G, goldBg:"rgba(255,159,28,0.10)", goldBdr:"rgba(255,159,28,0.25)",
  red:"#f87171", redBg:"rgba(248,113,113,0.10)", redBdr:"rgba(248,113,113,0.25)",
  green:"#34d399", greenBg:"rgba(52,211,153,0.10)", white5:"rgba(255,255,255,0.05)", white10:"rgba(255,255,255,0.10)",
};

const STATUS_OPTIONS = ["new","read","replied","archived"];

const statusColor = s => ({ new:C.green, read:C.textMid, replied:C.gold, archived:C.textDim }[s]||C.textDim);

function formatTime(ts) {
  if (!ts) return "Unknown";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return isNaN(d) ? "Unknown" : d.toLocaleString();
}

function Stars({ rating, interactive=false, onRate=null }) {
  const n = Number(rating)||0;
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => interactive && onRate && onRate(i)}
          style={{ color: i<=n ? G : "rgba(255,255,255,0.15)", fontSize:16, cursor: interactive?"pointer":"default", userSelect:"none" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function Badge({ status }) {
  const colors = { new:{ bg:C.greenBg, color:C.green, border:"rgba(52,211,153,0.25)" }, read:{ bg:C.white5, color:C.textMid, border:C.border }, replied:{ bg:C.goldBg, color:C.gold, border:C.goldBdr }, archived:{ bg:C.white5, color:C.textDim, border:C.border } };
  const s = colors[status]||colors.read;
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:"uppercase", letterSpacing:"0.06em" }}>{status}</span>;
}

function Btn({ children, onClick, variant="ghost", disabled=false, style={} }) {
  const v = {
    ghost:  { background:C.white5,  border:`1px solid ${C.white10}`, color:C.textMid },
    gold:   { background:C.goldBg,  border:`1px solid ${C.goldBdr}`, color:C.gold   },
    danger: { background:C.redBg,   border:`1px solid ${C.redBdr}`,  color:C.red    },
    green:  { background:C.greenBg, border:"1px solid rgba(52,211,153,0.25)", color:C.green },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, whiteSpace:"nowrap", ...v[variant], ...style }}>
      {children}
    </button>
  );
}

function ReplyBox({ item, onSave, onClose }) {
  const [text, setText] = useState(item.adminReply||"");
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ marginTop:12, background:"rgba(255,159,28,0.04)", border:`1px solid ${C.goldBdr}`, borderRadius:12, padding:12 }}>
      <div style={{ color:C.gold, fontWeight:700, fontSize:12, marginBottom:8 }}>Admin Reply</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
        placeholder="Type your reply…"
        style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, padding:"8px 10px", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn variant="gold" onClick={async()=>{ setSaving(true); await onSave(text); setSaving(false); onClose(); }} disabled={saving||!text.trim()}>
          {saving?"Saving…":"Save Reply"}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

function exportCSV(items) {
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const headers = ["Name","Email","Rating","Message","Page","Status","Timestamp","Admin Reply"];
  const rows = items.map(i => [
    esc(i.userName||""), esc(i.userEmail||""), esc(i.rating||""), esc(i.message||""),
    esc(i.page||""), esc(i.status||"new"), esc(formatTime(i.createdAt)), esc(i.adminReply||""),
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `stea_feedback_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function FeedbackManager() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [starFilter, setStarFilter]     = useState(0); // 0 = all
  const [pageFilter, setPageFilter]     = useState("all");
  const [dateFilter, setDateFilter]     = useState("all");
  const [search, setSearch]             = useState("");
  const [replyingId, setReplyingId]     = useState(null);
  const [expandedId, setExpandedId]     = useState(null);

  const db = getFirebaseDb();

  const notify = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db,"feedback"), orderBy("createdAt","desc"), limit(300));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d=>({ id:d.id, ...d.data() })));
      setLoading(false);
    }, err => { notify(err.message||"Failed to load feedback","error"); setLoading(false); });
    return ()=>unsub();
  }, [db]);

  const pageOptions = useMemo(() => Array.from(new Set(items.map(i=>i.page).filter(Boolean))), [items]);

  const filtered = useMemo(()=>{
    let f = items;
    if (statusFilter !== "all") f = f.filter(i=>(i.status||"new")===statusFilter);
    if (starFilter > 0)         f = f.filter(i=>Number(i.rating)===starFilter);
    if (pageFilter !== "all")   f = f.filter(i=>i.page === pageFilter);
    if (dateFilter !== "all") {
      const now = new Date();
      f = f.filter(i => {
        if (!i.createdAt) return false;
        const d = i.createdAt.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
        const days = (now - d) / (1000 * 60 * 60 * 24);
        if (dateFilter === "7days") return days <= 7;
        if (dateFilter === "30days") return days <= 30;
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(i=>(i.userName||"").toLowerCase().includes(q)||(i.userEmail||"").toLowerCase().includes(q)||(i.message||"").toLowerCase().includes(q));
    }
    return f;
  }, [items, statusFilter, starFilter, pageFilter, dateFilter, search]);

  const avgRating = items.length ? (items.reduce((s,i)=>s+(Number(i.rating)||0),0)/items.length).toFixed(1) : "—";

  const ratingDist = [1,2,3,4,5].map(n=>({ n, count: items.filter(i=>Number(i.rating)===n).length }));

  const updateStatus = async (id, status) => {
    try { await updateDoc(doc(db,"feedback",id),{ status, updatedAt:serverTimestamp() }); notify("Updated."); }
    catch(e){ notify(e.message,"error"); }
  };

  const saveReply = async (id, text) => {
    try { await updateDoc(doc(db,"feedback",id),{ adminReply:text, status:"replied", repliedAt:serverTimestamp() }); notify("Reply saved."); }
    catch(e){ notify(e.message,"error"); }
  };

  const deleteFeedback = id => setConfirm({
    msg:"Delete this feedback permanently?",
    onConfirm: async()=>{ try{ await deleteDoc(doc(db,"feedback",id)); notify("Deleted."); }catch(e){ notify(e.message,"error"); } setConfirm(null); },
    onCancel:()=>setConfirm(null),
  });

  const inputStyle = { background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, padding:"8px 12px", outline:"none" };
  const selStyle = { ...inputStyle, cursor:"pointer", appearance:"none" };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", color:C.text }}>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900 }}>Feedback Inbox</h2>
          <p style={{ margin:"4px 0 0", color:C.textMid, fontSize:13 }}>
            {items.length} total · avg rating <strong style={{ color:C.gold }}>{avgRating} ★</strong>
          </p>
        </div>
        <Btn variant="gold" onClick={()=>exportCSV(filtered)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export CSV
        </Btn>
      </div>

      {/* Rating distribution bar */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {ratingDist.map(({ n, count }) => (
          <button key={n} onClick={()=>setStarFilter(starFilter===n?0:n)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20, border:`1px solid ${starFilter===n?C.goldBdr:C.border}`, background:starFilter===n?C.goldBg:C.white5, cursor:"pointer", fontSize:12, color:starFilter===n?C.gold:C.textMid, fontWeight:600 }}>
            <span style={{ color:G }}>{"★".repeat(n)}</span>
            <span>{count}</span>
          </button>
        ))}
        {starFilter>0 && <button onClick={()=>setStarFilter(0)} style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", fontSize:11, color:C.textDim }}>Clear ×</button>}
      </div>

      {/* Filters row */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:20 }}>
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <svg width="14" height="14" fill="none" stroke={C.textDim} viewBox="0 0 24 24" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, message…"
            style={{ ...inputStyle, width:"100%", paddingLeft:30, boxSizing:"border-box" }} />
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...selStyle, minWidth:120 }}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={pageFilter} onChange={e=>setPageFilter(e.target.value)} style={{ ...selStyle, minWidth:120 }}>
          <option value="all">All Classes / Pages</option>
          {pageOptions.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{ ...selStyle, minWidth:120 }}>
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
        <span style={{ color:C.textDim, fontSize:12, alignSelf:"center" }}>{filtered.length} results</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding:"60px 0", textAlign:"center", color:C.textDim }}>Loading feedback…</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:"60px 0", textAlign:"center", color:C.textDim, border:`1px dashed ${C.border}`, borderRadius:16 }}>No feedback found.</div>
      ) : (
        <div style={{ width:"100%", borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", background:C.bg }}>
          {/* Table Header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 1fr 1fr 50px", gap:10, padding:"12px 18px", borderBottom:`1px solid ${C.border}`, background:C.white5, color:C.textDim, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            <div>User</div>
            <div>Rating</div>
            <div>Class / Page</div>
            <div>Status</div>
            <div>Date</div>
            <div></div>
          </div>

          {filtered.map(item => {
            const status = item.status||"new";
            const isReplying = replyingId===item.id;
            const isExpanded = expandedId===item.id || isReplying;

            return (
              <div key={item.id} style={{ borderBottom:`1px solid ${C.border}`, background:status==="new"?"rgba(255,159,28,0.02)":"transparent", transition:"background 0.2s" }}>
                {/* Table Row (Compact) */}
                <div 
                  onClick={() => !isReplying && setExpandedId(isExpanded ? null : item.id)}
                  style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 1fr 1fr 50px", gap:10, padding:"12px 18px", cursor:"pointer", alignItems:"center" }}
                >
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.userName||"Unknown"}</div>
                    <div style={{ color:C.textMid, fontSize:11, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.userEmail||"—"}</div>
                  </div>
                  <div>
                    <Stars rating={item.rating} />
                  </div>
                  <div style={{ color:C.textMid, fontSize:12, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {item.page || "—"}
                  </div>
                  <div>
                    <Badge status={status} />
                  </div>
                  <div style={{ color:C.textDim, fontSize:11, whiteSpace:"nowrap" }}>
                    {formatTime(item.createdAt)}
                  </div>
                  <div style={{ color:C.textDim, textAlign:"right" }}>
                    {isExpanded ? "▲" : "▼"}
                  </div>
                </div>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <div style={{ padding:"0 18px 18px 18px", background:"rgba(255,255,255,0.01)" }}>
                    <div style={{ padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginTop:8 }}>
                      {/* reasons */}
                      {(item.selectedReasons||[]).length>0 && (
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
                          {item.selectedReasons.map(r=>(
                            <span key={r} style={{ fontSize:11, color:C.textMid, background:"rgba(255,255,255,0.06)", borderRadius:20, padding:"3px 8px" }}>{r}</span>
                          ))}
                        </div>
                      )}

                      {/* message */}
                      {item.message ? (
                        <p style={{ color:C.textMid, fontSize:13, lineHeight:1.55, margin:"0 0 10px", whiteSpace:"pre-wrap" }}>{item.message}</p>
                      ) : (
                        <p style={{ color:C.textDim, fontSize:13, margin:"0 0 10px", fontStyle:"italic" }}>No written message.</p>
                      )}

                      {/* existing reply */}
                      {item.adminReply && !isReplying && (
                        <div style={{ background:"rgba(255,159,28,0.05)", border:`1px solid ${C.goldBdr}`, borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                          <div style={{ color:C.gold, fontSize:11, fontWeight:700, marginBottom:4 }}>Admin Reply</div>
                          <p style={{ margin:0, color:C.textMid, fontSize:12, lineHeight:1.5 }}>{item.adminReply}</p>
                        </div>
                      )}

                      {/* reply box */}
                      {isReplying && <ReplyBox item={item} onSave={text=>saveReply(item.id,text)} onClose={()=>setReplyingId(null)} />}

                      {/* actions */}
                      {!isReplying && (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                          <Btn variant="gold" onClick={(e)=>{ e.stopPropagation(); setReplyingId(item.id); }}>
                            {item.adminReply?"Edit Reply":"Reply"}
                          </Btn>
                          {STATUS_OPTIONS.filter(s=>s!==status).map(s=>(
                            <Btn key={s} variant="ghost" onClick={(e)=>{ e.stopPropagation(); updateStatus(item.id,s); }}>Mark {s}</Btn>
                          ))}
                          <Btn variant="danger" onClick={(e)=>{ e.stopPropagation(); deleteFeedback(item.id); }}>Delete</Btn>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
