/**
 * NectaManager — Admin panel for NECTA results links
 * Collection: necta_results
 * Fields: level, year, title, description, resultUrl, source, status, featured
 */
import { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "../../firebase.js";
import { Toast, ConfirmDialog } from "../AdminUI.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";

const LEVELS = [
  { id:"psle",  label:"PSLE — Primary School",      color:"#10b981" },
  { id:"csee",  label:"CSEE — Form Four (O-Level)",  color:"#3b82f6" },
  { id:"acsee", label:"ACSEE — Form Six (A-Level)",  color:"#a855f7" },
];

const YEARS = Array.from({length:26}, (_,i) => 2025 - i);

const EMPTY = {
  level:"csee", year:2024,
  title:"", description:"", resultUrl:"", source:"NECTA — necta.go.tz",
  status:"available", featured:false, isPublished:true,
};

const iSt = { width:"100%", height:42, borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", padding:"0 12px", outline:"none", fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };
const lSt = { display:"block", fontSize:11, fontWeight:800, color:"rgba(255,255,255,.6)", marginBottom:6, textTransform:"uppercase", letterSpacing:".08em" };
const seSt = { ...iSt, appearance:"none", cursor:"pointer" };
const F = ({ label, children }) => <div style={{ marginBottom:14 }}><label style={lSt}>{label}</label>{children}</div>;

export default function NectaManager({ user }) {
  const [docs,    setDocs]    = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const setF = p => setForm(f => ({...f,...p}));

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "necta_results"), orderBy("year","desc"));
    return onSnapshot(q, snap => {
      setDocs(snap.docs.map(d => ({id:d.id,...d.data()})));
    }, err => console.error("NectaManager:", err.message));
  }, [db]);

  const save = async () => {
    if (!form.resultUrl?.trim()) { toast_("Result URL is required","error"); return; }
    setLoading(true);
    try {
      const data = {
        level:   form.level || "csee",
        year:    parseInt(form.year) || 2024,
        title:   (form.title || `${LEVELS.find(l=>l.id===form.level)?.label || form.level} ${form.year}`).trim(),
        description: (form.description || "").trim(),
        resultUrl:  form.resultUrl.trim(),
        source:  (form.source || "NECTA").trim(),
        status:  form.status || "available",
        featured: !!form.featured,
        isPublished: !!form.isPublished,
        updatedAt: serverTimestamp(),
      };
      if (!editing) {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "necta_results"), data);
        toast_("✅ Result link added!");
      } else {
        await updateDoc(doc(db, "necta_results", editing), data);
        toast_("✅ Updated!");
      }
      setForm(EMPTY); setEditing(null);
    } catch(e) { toast_(e.message,"error"); }
    setLoading(false);
  };

  const del = (id) => setConfirm({
    msg:"Delete this result link?",
    onConfirm: async () => { await deleteDoc(doc(db,"necta_results",id)); setConfirm(null); toast_("Deleted"); },
    onCancel: () => setConfirm(null),
  });

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...EMPTY, ...item });
    window.scrollTo({top:0,behavior:"smooth"});
  };

  // Auto-fill title when level/year changes
  const autoTitle = () => {
    const lvl = LEVELS.find(l => l.id === form.level);
    return lvl ? `${lvl.label} ${form.year}` : `NECTA ${form.year}`;
  };

  const filtered = docs.filter(item => {
    const matchFilter = filter === "all" || item.level === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || String(item.year).includes(q) || (item.title||"").toLowerCase().includes(q) || (item.level||"").includes(q);
    return matchFilter && matchSearch;
  });

  const levelColors = { psle:"#10b981", csee:"#3b82f6", acsee:"#a855f7" };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* Form */}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.09)", background:"#141823", padding:24, marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
          <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:900, margin:0 }}>
            {editing ? "✏️ Edit Result Link" : "➕ Add Result Link"}
          </h3>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); }} style={{ padding:"6px 14px", borderRadius:9, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.55)", fontWeight:700, fontSize:12, cursor:"pointer" }}>Cancel</button>}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:14 }}>
          <F label="Exam Level *">
            <select value={form.level} onChange={e=>setF({level:e.target.value})} style={seSt}>
              {LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </F>
          <F label="Year *">
            <select value={form.year} onChange={e=>setF({year:parseInt(e.target.value)})} style={seSt}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </F>
          <F label="Status">
            <select value={form.status||"available"} onChange={e=>setF({status:e.target.value})} style={seSt}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable / Coming Soon</option>
            </select>
          </F>
        </div>

        <F label="Title (auto-generated if blank)">
          <input value={form.title} onChange={e=>setF({title:e.target.value})} placeholder={autoTitle()} style={iSt} />
        </F>

        <F label="Result URL *">
          <input value={form.resultUrl} onChange={e=>setF({resultUrl:e.target.value})} placeholder="https://onlinesys.necta.go.tz/results/2024/csee/" style={iSt} />
        </F>
        {form.resultUrl && (
          <div style={{ marginTop:-10, marginBottom:12, fontSize:11, color:"rgba(255,255,255,.55)" }}>
            🔗 Will open: {form.resultUrl.slice(0,70)}{form.resultUrl.length>70?"...":""}
          </div>
        )}

        <F label="Description (optional)">
          <input value={form.description} onChange={e=>setF({description:e.target.value})} placeholder="Brief description of this result set..." style={iSt} />
        </F>

        <F label="Source">
          <input value={form.source||""} onChange={e=>setF({source:e.target.value})} placeholder="NECTA — necta.go.tz" style={iSt} />
        </F>

        <div style={{ display:"flex", gap:20, marginBottom:20, flexWrap:"wrap" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={!!form.isPublished} onChange={e=>setF({isPublished:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>Published (visible to students)</span>
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={!!form.featured} onChange={e=>setF({featured:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>★ Featured / Pinned</span>
          </label>
        </div>

        <button onClick={save} disabled={loading} style={{ height:48, width:"100%", borderRadius:13, border:"none", background:loading?"rgba(245,166,35,.4)":`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize:15, cursor:loading?"default":"pointer", boxShadow:loading?"none":`0 6px 20px ${G}35` }}>
          {loading ? "Saving…" : editing ? "💾 Save Changes" : "➕ Add Result Link"}
        </button>
      </div>

      {/* Filters + search */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:"1 1 180px" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search year, level…" style={{ ...iSt, paddingLeft:36 }} />
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", opacity:.4 }}>🔍</span>
        </div>
        {["all","psle","csee","acsee"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"8px 14px", borderRadius:9, border:`1px solid ${filter===f?G:"rgba(255,255,255,.1)"}`, background:filter===f?`${G}12`:"transparent", color:filter===f?G:"rgba(255,255,255,.5)", fontWeight:700, fontSize:12, cursor:"pointer", textTransform:"uppercase" }}>
            {f === "all" ? "All" : f.toUpperCase()}
          </button>
        ))}
        <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontWeight:700 }}>{filtered.length} entries</div>
      </div>

      {/* List */}
      <div style={{ display:"grid", gap:10 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ borderRadius:14, border:`1px solid ${item.isPublished?"rgba(255,255,255,.07)":"rgba(245,166,35,.1)"}`, background:"#1a1d2e", padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
            {/* Level badge */}
            <div style={{ width:52, height:52, borderRadius:12, background:`${levelColors[item.level]||G}15`, border:`1px solid ${levelColors[item.level]||G}25`, display:"grid", placeItems:"center", flexShrink:0 }}>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, fontWeight:900, color:levelColors[item.level]||G }}>{item.year%100}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {item.title || `${(item.level||"").toUpperCase()} ${item.year}`}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.38)", display:"flex", gap:7, flexWrap:"wrap" }}>
                <span style={{ padding:"1px 7px", borderRadius:4, background:`${levelColors[item.level]||G}14`, color:levelColors[item.level]||G, fontWeight:700 }}>{(item.level||"").toUpperCase()}</span>
                <span style={{ padding:"1px 7px", borderRadius:4, background:"rgba(255,255,255,.06)", fontWeight:700 }}>{item.year}</span>
                <span style={{ color:item.status==="available"?"#4ade80":"rgba(255,255,255,.3)", fontWeight:800 }}>{item.status==="available"?"✓ Available":"⏳ Unavailable"}</span>
                {item.featured && <span style={{ color:G, fontWeight:800 }}>★ Featured</span>}
                {!item.isPublished && <span style={{ color:"#fb923c", fontWeight:800 }}>Draft</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              {item.resultUrl && (
                <a href={item.resultUrl} target="_blank" rel="noopener noreferrer" style={{ padding:"7px 10px", borderRadius:9, background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.2)", color:"#60a5fa", fontSize:11, fontWeight:800, cursor:"pointer", textDecoration:"none" }}>Test ↗</a>
              )}
              <button onClick={()=>edit(item)} style={{ padding:"7px 12px", borderRadius:9, background:`${G}12`, border:`1px solid ${G}22`, color:G, fontWeight:800, fontSize:12, cursor:"pointer" }}>Edit</button>
              <button onClick={()=>del(item.id)} style={{ padding:"7px 12px", borderRadius:9, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.22)", color:"#fca5a5", fontWeight:800, fontSize:12, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ textAlign:"center", padding:"40px 20px", borderRadius:16, border:"1px dashed rgba(255,255,255,.08)", color:"rgba(255,255,255,.3)", fontSize:14 }}>
            No NECTA result links yet. Add your first link above.
          </div>
        )}
      </div>
    </div>
  );
}
