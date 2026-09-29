/**
 * ResourcesManager — Admin panel for digital resources
 * Reads/writes from Firestore "resources" collection
 */
import React, { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "../../firebase.js";
import { Toast, ConfirmDialog, StorageMediaField } from "../AdminUI.jsx";
import { generateSlug, generateTags } from "../../utils/seo.js";

const G = "#F5A623";
const G2 = "#FFD17C";

const RES_TYPES = ["PDF","Link","Video","Tool","Note","Template","Ebook","Other"];

const EMPTY = {
  title:"", titleEn:"", titleSw:"",
  description:"", descriptionEn:"", descriptionSw:"",
  category:"", resourceType:"PDF", language:"English",
  tags: "",
  fileUrl:"", imageUrl:"", thumbnailUrl:"",
  isFeatured:false, isPublished:false,
};

const iSt = { width:"100%", height:42, borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", padding:"0 12px", outline:"none", fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };
const lSt = { display:"block", fontSize:11, fontWeight:800, color:"rgba(255,255,255,.4)", marginBottom:6, textTransform:"uppercase", letterSpacing:".08em" };
const seSt = { ...iSt, appearance:"none", cursor:"pointer" };
const taSt = { ...iSt, height:70, resize:"vertical", padding:"10px 12px", lineHeight:1.5 };
const F = ({ label, children }) => <div style={{ marginBottom:14 }}><label style={lSt}>{label}</label>{children}</div>;

export default function ResourcesManager({ user }) {
  const [docs,    setDocs]    = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search,  setSearch]  = useState("");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const setF = (p) => setForm(f => ({...f,...p}));

  // Dynamic Categories
  const dynamicCats = Array.from(new Set(docs.map(d => d.category).filter(Boolean)));

  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db,"resources"), limit(1000)), (snap) => {
      const fetched = snap.docs.map(d => ({id:d.id,...d.data()}));
      fetched.sort((a,b) => ((b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0)));
      setDocs(fetched);
    });
  }, [db]);

  const save = async () => {
    const title = (form.titleEn || form.title || "").trim();
    if (!title) { toast_("Title is required","error"); return; }
    setLoading(true);
    try {
      const categoryStr = form.category || "General";
      const generatedSlug = generateSlug(title, categoryStr);
      let tagsArr = [];
      if (form.tags && typeof form.tags === 'string') {
        tagsArr = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      }
      if (tagsArr.length === 0) {
        tagsArr = generateTags(title);
      }

      const data = {
        title, titleEn:title,
        titleSw: (form.titleSw||"").trim(),
        description: (form.descriptionEn||form.description||"").trim(),
        descriptionEn: (form.descriptionEn||form.description||"").trim(),
        descriptionSw: (form.descriptionSw||"").trim(),
        category: categoryStr,
        resourceType: form.resourceType||"PDF",
        language: form.language||"English",
        fileUrl: (form.fileUrl||"").trim(),
        link: (form.fileUrl||"").trim(),
        slug: generatedSlug,
        tags: tagsArr,
        imageUrl: (form.imageUrl||"").trim(),
        thumbnailUrl: (form.thumbnailUrl||form.imageUrl||"").trim(),
        isFeatured: !!form.isFeatured,
        isPublished: !!form.isPublished,
        published: !!form.isPublished,
        status: form.isPublished ? "published" : "draft",
        updatedAt: serverTimestamp(),
      };
      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        await addDoc(collection(db,"resources"), data);
        toast_("✅ Resource added!");
      } else {
        await updateDoc(doc(db,"resources",editing), data);
        toast_("✅ Updated!");
      }
      setForm(EMPTY); setEditing(null);
    } catch(e) {
      toast_(e.message,"error");
    }
    setLoading(false);
  };

  const del = (id) => {
    setConfirm({ msg:"Delete this resource?", onConfirm: async () => {
      await deleteDoc(doc(db,"resources",id)); setConfirm(null); toast_("Deleted");
    }, onCancel:()=>setConfirm(null) });
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...EMPTY, ...item,
      title: item.titleEn||item.title||"",
      titleEn: item.titleEn||item.title||"",
      titleSw: item.titleSw||"",
      descriptionEn: item.descriptionEn||item.description||"",
      descriptionSw: item.descriptionSw||"",
      fileUrl: item.fileUrl||item.link||"",
      isPublished: item.isPublished||item.published||item.status==="published",
    });
    window.scrollTo({top:0, behavior:"smooth"});
  };

  const filtered = docs.filter(item => {
    const q = search.toLowerCase();
    return !q || (item.titleEn||item.title||"").toLowerCase().includes(q) || (item.category||"").toLowerCase().includes(q);
  });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* Form */}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.09)", background:"#141823", padding:24, marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
          <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:900, margin:0 }}>
            {editing ? "✏️ Edit Resource" : "➕ Add Resource"}
          </h3>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); }} style={{ padding:"6px 14px", borderRadius:9, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.55)", fontWeight:700, fontSize:12, cursor:"pointer" }}>Cancel</button>}
        </div>

        {/* Titles */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <F label="Title (English) *">
            <input value={form.titleEn||form.title||""} onChange={e => setF({titleEn:e.target.value,title:e.target.value})} placeholder="Resource title in English" style={iSt} />
          </F>
          <F label="Title (Swahili)">
            <input value={form.titleSw||""} onChange={e => setF({titleSw:e.target.value})} placeholder="Jina la rasilimali" style={iSt} />
          </F>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <F label="Description (English)">
            <textarea value={form.descriptionEn||""} onChange={e => setF({descriptionEn:e.target.value,description:e.target.value})} placeholder="Description…" style={taSt} />
          </F>
          <F label="Description (Swahili)">
            <textarea value={form.descriptionSw||""} onChange={e => setF({descriptionSw:e.target.value})} placeholder="Maelezo…" style={taSt} />
          </F>
        </div>

        {/* Details grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:14 }}>
          <F label="Category">
            <input list="resource-cats" value={form.category||""} onChange={e => setF({category:e.target.value})} style={iSt} placeholder="e.g. Study Guides" />
            <datalist id="resource-cats">
              {dynamicCats.map(c => <option key={c} value={c} />)}
            </datalist>
          </F>
          <F label="Tags (comma separated)">
            <input value={form.tags||""} onChange={e => setF({tags:e.target.value})} style={iSt} placeholder="notes, university, science" />
          </F>
          <F label="Type">
            <select value={form.resourceType||"PDF"} onChange={e => setF({resourceType:e.target.value})} style={seSt}>
              {RES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Language">
            <select value={form.language||"English"} onChange={e => setF({language:e.target.value})} style={seSt}>
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="Both">Both</option>
            </select>
          </F>
        </div>

        {/* URLs */}
        <StorageMediaField
          label="File URL or External Link"
          value={form.fileUrl || ""}
          onChange={url => setF({ fileUrl: url })}
          accept="*/*"
        />
        <StorageMediaField
          label="Thumbnail / Cover Image URL"
          value={form.imageUrl || ""}
          onChange={url => setF({ imageUrl: url })}
        />

        {/* Status */}
        <div style={{ display:"flex", gap:20, marginBottom:20, flexWrap:"wrap" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={!!form.isPublished} onChange={e => setF({isPublished:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>Published</span>
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={!!form.isFeatured} onChange={e => setF({isFeatured:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>Featured</span>
          </label>
        </div>

        <button onClick={save} disabled={loading} style={{ height:48, width:"100%", borderRadius:13, border:"none", background:loading ? "rgba(245,166,35,.4)" : `linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize:15, cursor:loading?"default":"pointer", boxShadow:loading?"none":`0 6px 20px ${G}35` }}>
          {loading ? "Saving…" : editing ? "💾 Save Changes" : "➕ Add Resource"}
        </button>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…" style={{ ...iSt, paddingLeft:36 }} />
        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", opacity:.4 }}>🔍</span>
      </div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:700, marginBottom:10 }}>{filtered.length} resources</div>

      {/* List */}
      <div style={{ display:"grid", gap:10 }}>
        {filtered.map(item => {
          const pub = item.isPublished||item.published||item.status==="published";
          return (
            <div key={item.id} style={{ borderRadius:14, border:"1px solid rgba(255,255,255,.07)", background:"#1a1d2e", padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", flexShrink:0, background:`${G}12`, border:`1px solid ${G}20`, display:"grid", placeItems:"center", fontSize:20 }}>
                {{"PDF":"📄","Video":"🎬","Tool":"🔧","Template":"📋","Ebook":"📚","Note":"📝"}[item.resourceType] || "📦"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.titleEn||item.title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.38)", display:"flex", gap:7, flexWrap:"wrap" }}>
                  <span style={{ padding:"1px 7px", borderRadius:4, background:"rgba(255,255,255,.06)", fontWeight:700 }}>{item.category}</span>
                  <span style={{ padding:"1px 7px", borderRadius:4, background:`${G}10`, color:G, fontWeight:700 }}>{item.resourceType}</span>
                  <span style={{ color:pub?"#4ade80":"rgba(255,255,255,.3)", fontWeight:800, textTransform:"uppercase" }}>{pub?"Published":"Draft"}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>edit(item)} style={{ padding:"7px 12px", borderRadius:9, background:`${G}12`, border:`1px solid ${G}22`, color:G, fontWeight:800, fontSize:12, cursor:"pointer" }}>Edit</button>
                <button onClick={()=>del(item.id)} style={{ padding:"7px 12px", borderRadius:9, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.22)", color:"#fca5a5", fontWeight:800, fontSize:12, cursor:"pointer" }}>Delete</button>
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <div style={{ textAlign:"center", padding:"40px 20px", borderRadius:16, border:"1px dashed rgba(255,255,255,.08)", color:"rgba(255,255,255,.3)", fontSize:14 }}>
            No resources yet. Add your first resource above.
          </div>
        )}
      </div>
    </div>
  );
}
