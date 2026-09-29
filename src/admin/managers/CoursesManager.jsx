/**
 * CoursesManager — Full admin panel for managing courses
 * Reads/writes from Firestore "courses" collection
 * Supports: bilingual fields, YouTube auto-embed, categories, free/paid, publish toggle
 */
import React, { useState, useEffect, useRef } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot, where,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "../../firebase.js";
import { Btn, Field, Toast, ConfirmDialog, AdminThumb } from "../AdminUI.jsx";
import StorageUploadField from "../components/StorageUploadField.jsx";

import { generateSlug, generateTags } from "../../utils/seo.js";
import CategoryManager from "../CategoryManager.jsx";
import { useCustomCategories } from "../../hooks/useCustomCategories.js";
import { buildSearchFields } from "../../hooks/useSearch.js";

const G  = "#F5A623";
const G2 = "#FFD17C";

const EMPTY = {
  title:"", titleEn:"", titleSw:"",
  description:"", descriptionEn:"", descriptionSw:"",
  category:"", courseType:"free", language:"English",
  tags: "",
  level:"Beginner", duration:"", instructorName:"",
  youtubeUrl:"", embedUrl:"", imageUrl:"", thumbnailUrl:"",
  imageFit:"cover", imagePosition:"center",
  isFeatured:false, isPublished:false, active:false,
  free:true, published:false, status:"draft",
};

const iSt = { width:"100%", height:42, borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", padding:"0 12px", outline:"none", fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };
const lSt = { display:"block", fontSize:11, fontWeight:800, color:"rgba(255,255,255,.4)", marginBottom:6, textTransform:"uppercase", letterSpacing:".08em" };
const seSt = { ...iSt, appearance:"none", cursor:"pointer" };
const taSt = { ...iSt, height:70, resize:"vertical", padding:"10px 12px", lineHeight:1.5 };

const F = ({ label, children }) => <div style={{ marginBottom:14 }}><label style={lSt}>{label}</label>{children}</div>;

export default function CoursesManager({ user }) {
  const [docs,    setDocs]    = useState([]);
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search,  setSearch]  = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const setF = (p) => setForm(f => ({...f,...p}));

  // Phase 2: custom categories from Firestore (with deduplication)
  const { categories: customCats } = useCustomCategories("course_categories", docs);
  const dynamicCats = Array.from(new Set(customCats.map(c => c.name || c).filter(Boolean)));

  // YouTube URL processing
  const processYouTube = (url) => {
    if (!url) return { embedUrl:"", thumbnailUrl:"" };
    let vid = "";
    const m1 = url.match(/[?&]v=([^&]+)/);
    const m2 = url.match(/youtu\.be\/([^?]+)/);
    const m3 = url.match(/embed\/([^?]+)/);
    if (m1) vid = m1[1];
    else if (m2) vid = m2[1];
    else if (m3) vid = m3[1];
    if (!vid) return { embedUrl: url, thumbnailUrl: "" };
    return {
      embedUrl: `https://www.youtube.com/embed/${vid}?rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    };
  };

  const handleYouTube = (url) => {
    const { embedUrl, thumbnailUrl } = processYouTube(url);
    setF({ youtubeUrl: url, embedUrl, thumbnailUrl, imageUrl: form.imageUrl || thumbnailUrl });
  };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "courses"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "courses"), where("ownerId","==",user.uid), limit(1000));
    }
    return onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({id:d.id,...d.data()}));
      fetched.sort((a,b) => ((b.updatedAt?.seconds||0) - (a.updatedAt?.seconds||0)));
      setDocs(fetched);
    });
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    const title = (form.title || form.titleEn || "").trim();
    if (!title) { toast_("Title is required", "error"); return; }
    setLoading(true);
    try {
      const isFree = form.courseType !== "paid";
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
        // Core (backward compatible)
        title: title,
        description: (form.descriptionEn || form.description || "").trim(),
        // Bilingual
        titleEn: (form.titleEn || title).trim(),
        titleSw: (form.titleSw || "").trim(),
        descriptionEn: (form.descriptionEn || form.description || "").trim(),
        descriptionSw: (form.descriptionSw || "").trim(),
        // Meta
        category: categoryStr,
        courseType: form.courseType || "free",
        language: form.language || "English",
        slug: generatedSlug,
        tags: tagsArr,
        level: form.level || "Beginner",
        duration: (form.duration || "").trim(),
        instructorName: (form.instructorName || "").trim(),
        // Media
        youtubeUrl: (form.youtubeUrl || "").trim(),
        embedUrl: (form.embedUrl || "").trim(),
        imageUrl: (form.imageUrl || form.thumbnailUrl || "").trim(),
        thumbnailUrl: (form.thumbnailUrl || form.imageUrl || "").trim(),
        imageFit: form.imageFit || "cover",
        imagePosition: form.imagePosition || "center",
        // Flags
        free: isFree,
        isFeatured: !!form.isFeatured,
        isPublished: !!form.isPublished,
        active: !!form.isPublished,
        published: !!form.isPublished,
        status: form.isPublished ? "published" : "draft",
        // Compat
        image: (form.imageUrl || form.thumbnailUrl || "").trim(),
        updatedAt: serverTimestamp(),
        // Phase 1: normalized search fields
        ...buildSearchFields({ title, category: categoryStr, tags: tagsArr }),
      };
      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.sector = "courses";
        await addDoc(collection(db,"courses"), data);
        toast_("🚀 Course published!");
      } else {
        await updateDoc(doc(db,"courses",editing), data);
        toast_("✅ Updated!");
      }
      setForm(EMPTY);
      setEditing(null);
    } catch(e) {
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = (id) => {
    setConfirm({ msg:"Delete this course permanently?", onConfirm: async () => {
      await deleteDoc(doc(db,"courses",id)); setConfirm(null); toast_("Deleted");
    }, onCancel: ()=>setConfirm(null) });
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...EMPTY, ...item,
      title: item.title || item.titleEn || "",
      titleEn: item.titleEn || item.title || "",
      titleSw: item.titleSw || "",
      description: item.descriptionEn || item.description || "",
      descriptionEn: item.descriptionEn || item.description || "",
      descriptionSw: item.descriptionSw || "",
      imageUrl: item.imageUrl || item.image || item.thumbnailUrl || "",
      isPublished: item.isPublished || item.published || item.active || item.status === "published",
      isFeatured: item.isFeatured || item.featured || false,
      courseType: item.courseType || (item.free ? "free" : "paid"),
    });
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const filtered = docs.filter(item => {
    const q = search.toLowerCase();
    const matchQ = !q || (item.title||item.titleEn||"").toLowerCase().includes(q) || (item.category||"").toLowerCase().includes(q);
    const pub = item.isPublished || item.published || item.active || item.status === "published";
    const matchS = filterStatus === "all" || (filterStatus === "published" ? pub : !pub);
    return matchQ && matchS;
  });

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* ── Form ── */}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.09)", background:"#141823", padding:24, marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:10 }}>
          <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:900, margin:0 }}>
            {editing ? "✏️ Edit Course" : "➕ Add New Course"}
          </h3>
          {editing && <button onClick={cancel} style={{ padding:"6px 14px", borderRadius:9, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.55)", fontWeight:700, fontSize:12, cursor:"pointer" }}>Cancel</button>}
        </div>

        {/* Section: Media */}
        <div style={{ marginBottom:20, paddingBottom:20, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>📹 Media</div>

          {/* YouTube URL */}
          <F label="YouTube URL">
            <input value={form.youtubeUrl||""} onChange={e => handleYouTube(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={iSt} />
          </F>
          {form.embedUrl && <div style={{ fontSize:11, color:"#4ade80", marginTop:-10, marginBottom:12 }}>✓ Embed URL: {form.embedUrl}</div>}
          {form.thumbnailUrl && (
            <div style={{ marginBottom:14 }}>
              <label style={lSt}>Auto-Generated YouTube Thumbnail</label>
              <div style={{ width:120, height:70, borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,.1)" }}>
                <img src={form.thumbnailUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>
          )}

          <StorageUploadField label="Custom Thumbnail (overrides YouTube auto-thumb)" value={form.imageUrl} onChange={val => setF({ imageUrl:val })} />
        </div>

        {/* Section: Titles */}
        <div style={{ marginBottom:20, paddingBottom:20, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>📝 Titles & Descriptions</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <F label="Title (English) *">
              <input value={form.titleEn||form.title||""} onChange={e => setF({titleEn:e.target.value, title:e.target.value})} placeholder="Web Development for Beginners" style={iSt} />
            </F>
            <F label="Title (Swahili)">
              <input value={form.titleSw||""} onChange={e => setF({titleSw:e.target.value})} placeholder="Ujenzi wa Tovuti kwa Wanaoanza" style={iSt} />
            </F>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <F label="Description (English)">
              <textarea value={form.descriptionEn||form.description||""} onChange={e => setF({descriptionEn:e.target.value, description:e.target.value})} placeholder="Course description in English…" style={taSt} />
            </F>
            <F label="Description (Swahili)">
              <textarea value={form.descriptionSw||""} onChange={e => setF({descriptionSw:e.target.value})} placeholder="Maelezo ya kozi kwa Kiswahili…" style={taSt} />
            </F>
          </div>
        </div>

        {/* Section: Details */}
        <div style={{ marginBottom:20, paddingBottom:20, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>⚙️ Course Details</div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            <F label="Category *">
              <input list="course-cats" value={form.category||""} onChange={e => setF({category:e.target.value})} style={iSt} placeholder="e.g. Programming" />
              <datalist id="course-cats">
                {dynamicCats.map(c => <option key={c} value={c} />)}
              </datalist>
            </F>
            <F label="Tags (comma separated)">
              <input value={form.tags||""} onChange={e => setF({tags:e.target.value})} style={iSt} placeholder="react, web, programming" />
            </F>
            <F label="Course Type">
              <select value={form.courseType||"free"} onChange={e => setF({courseType:e.target.value, free:e.target.value!=="paid"})} style={seSt}>
                <option value="free">Free</option>
                <option value="paid">Paid (future)</option>
              </select>
            </F>
            <F label="Language">
              <select value={form.language||"English"} onChange={e => setF({language:e.target.value})} style={seSt}>
                <option value="English">English</option>
                <option value="Swahili">Swahili / Kiswahili</option>
                <option value="Both">Both</option>
              </select>
            </F>
            <F label="Level">
              <select value={form.level||"Beginner"} onChange={e => setF({level:e.target.value})} style={seSt}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </F>
            <F label="Duration">
              <input value={form.duration||""} onChange={e => setF({duration:e.target.value})} placeholder="e.g. 4 Weeks / 2 hrs" style={iSt} />
            </F>
            <F label="Instructor Name">
              <input value={form.instructorName||""} onChange={e => setF({instructorName:e.target.value})} placeholder="Instructor Name" style={iSt} />
            </F>
          </div>
        </div>

        {/* Section: Status */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".09em", marginBottom:14 }}>🚦 Status</div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={!!form.isPublished} onChange={e => setF({isPublished:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
              <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>Published (visible on site)</span>
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={!!form.isFeatured} onChange={e => setF({isFeatured:e.target.checked})} style={{ width:16, height:16, accentColor:G }} />
              <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.75)" }}>Featured / Pinned</span>
            </label>
          </div>
        </div>

        {/* Live preview with fit/position controls */}
        {(form.imageUrl || form.thumbnailUrl) && (
          <div style={{ marginBottom:20 }}>
            <label style={lSt}>Card Preview — Live Edit</label>
            {/* Full course card preview */}
            <div style={{ maxWidth:280, borderRadius:18, overflow:"hidden", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", marginBottom:12 }}>
              <div style={{ aspectRatio:"16/9", position:"relative", overflow:"hidden", background:"#0d0f1a" }}>
                <img src={form.imageUrl || form.thumbnailUrl} alt="" style={{ width:"100%", height:"100%", objectFit:form.imageFit||"cover", objectPosition:form.imagePosition||"center", display:"block", transition:"object-fit .2s, object-position .2s" }} onError={e => e.target.style.display="none"} />
                <div style={{ position:"absolute", top:8, left:10, padding:"3px 9px", borderRadius:6, background:"rgba(0,0,0,.6)", color:"#fff", fontSize:9, fontWeight:900, textTransform:"uppercase" }}>{form.level||"Beginner"}</div>
                {form.courseType !== "paid" && <div style={{ position:"absolute", top:8, right:10, padding:"3px 9px", borderRadius:6, background:"rgba(245,166,35,.9)", color:"#111", fontSize:9, fontWeight:900 }}>Free</div>}
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontSize:13, fontWeight:800, marginBottom:4 }}>{form.titleEn || form.title || "Course Title"}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>{form.category || "General"} · {form.language || "English"}</div>
              </div>
            </div>
            {/* Fit + Position controls */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{...lSt, fontSize:10}}>Image Fit</label>
                <div style={{ display:"flex", gap:6 }}>
                  {["cover","contain"].map(fit => (
                    <button type="button" key={fit} onClick={() => setF({imageFit:fit})} style={{ flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${form.imageFit===fit?G:"rgba(255,255,255,.1)"}`, background:form.imageFit===fit?`${G}14`:"transparent", color:form.imageFit===fit?G:"rgba(255,255,255,.5)", fontWeight:700, fontSize:11, cursor:"pointer", textTransform:"capitalize" }}>
                      {fit}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{...lSt, fontSize:10}}>Position</label>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {["center","top","bottom","left","right"].map(pos => (
                    <button type="button" key={pos} onClick={() => setF({imagePosition:pos})} style={{ padding:"5px 9px", borderRadius:7, border:`1px solid ${form.imagePosition===pos?G:"rgba(255,255,255,.1)"}`, background:form.imagePosition===pos?`${G}14`:"transparent", color:form.imagePosition===pos?G:"rgba(255,255,255,.5)", fontWeight:700, fontSize:10, cursor:"pointer" }}>
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <button onClick={save} disabled={loading} style={{ height:48, width:"100%", borderRadius:13, border:"none", background:loading ? "rgba(245,166,35,.4)" : `linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize:15, cursor:loading?"default":"pointer", boxShadow:loading?"none":`0 6px 20px ${G}35`, transition:"all .2s" }}>
          {loading ? "Saving…" : editing ? "💾 Save Changes" : "🚀 Publish Course"}
        </button>
      </div>

      {/* ── Manage Categories (Phase 2) ── */}
      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 800, color: G, padding: "10px 0", userSelect: "none" }}>
          ⚙️ Manage Course Categories
        </summary>
        <div style={{ marginTop: 10 }}>
          <CategoryManager categoryCollection="course_categories" label="Course Categories" />
        </div>
      </details>

      {/* ── Filter + search ── */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…" style={{ ...iSt, paddingLeft:36, width:"100%", boxSizing:"border-box" }} />
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", opacity:.4 }}>🔍</span>
        </div>
        {["all","published","draft"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding:"8px 14px", borderRadius:9, border:`1px solid ${filterStatus===s ? G : "rgba(255,255,255,.1)"}`, background:filterStatus===s ? `${G}12` : "transparent", color:filterStatus===s ? G : "rgba(255,255,255,.5)", fontWeight:700, fontSize:12, cursor:"pointer", textTransform:"capitalize" }}>
            {s}
          </button>
        ))}
        <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:700 }}>{filtered.length} courses</div>
      </div>

      {/* ── List ── */}
      <div style={{ display:"grid", gap:10 }}>
        {filtered.map(item => {
          const pub = item.isPublished || item.published || item.active || item.status === "published";
          const thumb = item.imageUrl || item.image || item.thumbnailUrl || "";
          const title = item.titleEn || item.title || "Untitled";
          return (
            <div key={item.id} style={{ borderRadius:14, border:`1px solid ${pub ? "rgba(255,255,255,.07)" : "rgba(245,166,35,.12)"}`, background:"#1a1d2e", padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:72, height:46, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#0d0f1a", border:"1px solid rgba(255,255,255,.08)" }}>
                {thumb ? <img src={thumb} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"} /> : <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", fontSize:18, opacity:.2 }}>🎓</div>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.38)", display:"flex", gap:7, flexWrap:"wrap" }}>
                  <span style={{ padding:"1px 7px", borderRadius:4, background:"rgba(255,255,255,.06)", fontWeight:700 }}>{item.category || "General"}</span>
                  <span style={{ padding:"1px 7px", borderRadius:4, background:`${G}12`, color:G, fontWeight:700 }}>{item.level || "Beginner"}</span>
                  {item.courseType !== "paid" && <span style={{ color:"#4ade80", fontWeight:800 }}>Free</span>}
                  <span style={{ color:pub ? "#4ade80" : "rgba(255,255,255,.3)", fontWeight:800, textTransform:"uppercase" }}>{pub ? "Published" : "Draft"}</span>
                  {(item.isFeatured || item.featured) && <span style={{ color:G, fontWeight:800 }}>★ Featured</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => edit(item)} style={{ padding:"7px 12px", borderRadius:9, background:`${G}12`, border:`1px solid ${G}22`, color:G, fontWeight:800, fontSize:12, cursor:"pointer" }}>Edit</button>
                <button onClick={() => del(item.id)} style={{ padding:"7px 12px", borderRadius:9, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.22)", color:"#fca5a5", fontWeight:800, fontSize:12, cursor:"pointer" }}>Delete</button>
              </div>
            </div>
          );
        })}
        {!filtered.length && (
          <div style={{ textAlign:"center", padding:"40px 20px", borderRadius:16, border:"1px dashed rgba(255,255,255,.08)", color:"rgba(255,255,255,.3)", fontSize:14 }}>
            {search ? `No courses matching "${search}"` : "No courses yet. Add your first course above."}
          </div>
        )}
      </div>
    </div>
  );
}
