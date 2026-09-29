import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType,
  logStorageUpload
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField } from "../AdminUI.jsx";
import SocialPoster from "../SocialPoster.jsx";

const G = "#F5A623", G2 = "#FFD17C";

export default function TechContentManager({ collectionName, user }) {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ 
    type: "article", badge: "Tech", title: "", summary: "", content: "", 
    imageUrl: "", carouselImages: [], ctaText: "", ctaUrl: "", source: "",
    platform: "youtube", embedUrl: "", channel: "", channelImg: "🎙️", duration: "",
    category: "tech-tips",
    sectionType: "techTips",
    status: "published",
    published: true,
    featured: false
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab,     setTab]     = useState("article");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, collectionName), limit(1000));
    
    if (user?.role === "creator") {
      q = query(collection(db, collectionName), where("ownerId", "==", user.uid), limit(1000));
    }
    
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => {
        const fieldA = a.updatedAt || a.createdAt;
        const fieldB = b.updatedAt || b.createdAt;
        const valA = fieldA?.toDate ? fieldA.toDate() : fieldA;
        const valB = fieldB?.toDate ? fieldB.toDate() : fieldB;
        const timeA = valA === null || valA === undefined ? Date.now() + 10000 : (typeof valA === 'number' ? valA : new Date(valA).getTime() || 0);
        const timeB = valB === null || valB === undefined ? Date.now() + 10000 : (typeof valB === 'number' ? valB : new Date(valB).getTime() || 0);
        return timeB - timeA;
      });
      setDocs(fetched);
    }, (err) => {
      console.error(`Error loading ${collectionName}:`, err);
    });
    return () => unsub();
  }, [db, collectionName, user?.role, user?.uid]);

  const save = async () => {
    const title = (form.title || "").toString();
    if (!title.trim()) { toast_("Weka title kwanza", "error"); return; }
    setLoading(true);
    try {
      let contentUrl = form.contentFileUrl || "";
      let contentToStore = form.content || "";

      if (contentToStore.length > 800000) {
        const contentBlob = new Blob([contentToStore], { type: 'application/json' });
        const uploadPath = `posts/${Date.now()}_${form.title.replace(/\s+/g, '_')}.json`;
        logStorageUpload(uploadPath);
        const contentRef = ref(storage, uploadPath);
        try {
          await uploadBytes(contentRef, contentBlob);
          contentUrl = await getDownloadURL(contentRef);
        } catch (storageErr) {
          handleStorageError(storageErr);
        }
        contentToStore = ""; 
      }

      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form, 
        title: form.title || "",
        description: form.summary || form.description || "", 
        image: form.imageUrl || form.image || "", 
        content: contentToStore,
        contentFileUrl: contentUrl,
        category: form.category || "tech-tips",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = collectionName === "posts" ? "tech" : (user?.sector || collectionName);
        data.sectionType = "techTips";
        data.createdAt = serverTimestamp();
        data.views = 0;
        if (canDirect) {
          data.approvedBy = user?.uid || "admin";
          data.approvedAt = serverTimestamp();
        }
      } else {
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;
        delete data.sectionType;
        delete data.id;
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) data[key] = "";
      });

      if (editing) {
        await updateDoc(doc(db, collectionName, editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db, collectionName), data); 
        toast_("Imewekwa live!"); 
      }
      setForm({ 
        type: "article", badge: "Tech", title: "", summary: "", content: "", 
        imageUrl: "", carouselImages: [], ctaText: "", ctaUrl: "", source: "",
        platform: "youtube", embedUrl: "", channel: "", channelImg: "🎙️", duration: "",
        category: "tech-tips",
        sectionType: "techTips",
        views: 0,
        featured: false
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, collectionName);
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg:"Una uhakika unataka kufuta post hii?", onConfirm: async()=>{ await deleteDoc(doc(db,collectionName,id)); setConfirm(null); toast_("Imefutwa"); }, onCancel:()=>setConfirm(null) });
  };

  const edit = (item) => { 
    setEditing(item.id); 
    setForm({ ...item, carouselImages: item.carouselImages || [] }); 
    setTab(item.type || "article"); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  const addCarouselImage = () => setForm(f => ({ ...f, carouselImages: [...(f.carouselImages||[]), ""] }));
  const updateCarouselImage = (i, val) => {
    const arr = [...(form.carouselImages||[])];
    arr[i] = val;
    setForm(f => ({ ...f, carouselImages: arr }));
  };
  const removeCarouselImage = (i) => {
    const arr = [...(form.carouselImages||[])];
    arr.splice(i, 1);
    setForm(f => ({ ...f, carouselImages: arr }));
  };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}
      
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          {editing ? "✏️ Hariri Post" : "➕ Ongeza Post Mpya"}
        </h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["article","video"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setForm(f=>({...f,type:t}));}}
              style={{ border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", fontWeight:800, fontSize:13,
                background:tab===t?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.06)", color:tab===t?"#111":"rgba(255,255,255,.6)" }}>
              {t==="article"?"📝 Article":"🎬 Video"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Badge (e.g. Android, AI, News)"><Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Tech" /></Field>
            <Field label="Category (e.g. ai, android, pc)"><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="tech-tips" /></Field>
          </div>
          <Field label="Title *"><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title..." /></Field>
          
          {tab === "article" && (
            <>
              <ImageUploadField label="Thumbnail Image URL (16:9)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
              <Field label="Short Intro / Summary"><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Short description..." style={{ minHeight: 60 }} /></Field>
              <Field label="Step-by-step Content"><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full content..." style={{ minHeight: 150 }} /></Field>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field label="CTA Button Text"><Input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="e.g. Read More" /></Field>
                <Field label="CTA Button URL"><Input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="https://..." /></Field>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: 1 }}>Image Carousel (Optional)</div>
                  <Btn onClick={addCarouselImage} style={{ padding: "4px 12px", fontSize: 12 }} color="rgba(255,255,255,.05)">+ Add Image</Btn>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(form.carouselImages||[]).map((img, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 40px", gap: 10, alignItems: "end" }}>
                      <ImageUploadField label={`Image ${i+1} URL`} value={img} onChange={val => updateCarouselImage(i, val)} />
                      <Btn onClick={() => removeCarouselImage(i)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: 10, marginBottom: 4 }}>✕</Btn>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "video" && (
            <>
              <ImageUploadField label="Thumbnail Image URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
              <Field label="Short Caption"><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Caption..." style={{ minHeight: 60 }} /></Field>
              <Field label="Watch URL (External Link or Embed)"><Input value={form.embedUrl} onChange={e => setForm(f => ({ ...f, embedUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." /></Field>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field label="Creator Name"><Input value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} placeholder="e.g. MKBHD" /></Field>
                <Field label="Creator Profile Image (Emoji or URL)"><Input value={form.channelImg} onChange={e => setForm(f => ({ ...f, channelImg: e.target.value }))} placeholder="🎙️ or https://..." /></Field>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <Field label="Platform Icon (youtube, tiktok, instagram)"><Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="youtube" /></Field>
                <Field label="Duration (Optional)"><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="10:00" /></Field>
              </div>
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} id="featured" />
            <label htmlFor="featured" style={{ fontSize: 14, cursor: "pointer" }}>Mark as Featured (Homepage)</label>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
            {editing && <Btn onClick={()=>{setEditing(null);setForm({type:"article",badge:"Tech",title:"",summary:"",content:"",imageUrl:"",carouselImages:[],ctaText:"",ctaUrl:"",source:"",platform:"youtube",embedUrl:"",channel:"",channelImg:"🎙️",duration:""});}} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Input 
          placeholder="🔍 Search by title..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ maxWidth: 400, background: "rgba(255,255,255,.05)" }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>Hakuna content bado.</div>}
        {docs.filter(d => (d.title||"").toLowerCase().includes(search.toLowerCase())).map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", maxWidth: 800 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", display: "grid", placeItems: "center", background: "rgba(255,255,255,.05)", fontSize: 20, flexShrink: 0 }}>
              {item.type === "video" ? "▶️" : "📝"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.type} • {item.summary?.substring(0, 40)}...</div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status} {item.featured ? '• FEATURED' : ''}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Btn onClick={() => edit(item)} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
            <div style={{ width: '100%' }}>
              <SocialPoster content={item} type="Tech Tip" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
