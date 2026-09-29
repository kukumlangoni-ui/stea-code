import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";
import { generateSlug, generateTags } from "../../utils/seo.js";
import CategoryManager from "../CategoryManager.jsx";
import { useCustomCategories } from "../../hooks/useCustomCategories.js";
import { buildSearchFields } from "../../hooks/useSearch.js";

const G = "#F5A623";

function isValidHttpUrl(s) {
  try {
    const u = new URL(String(s).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function deriveToolName(url) {
  try {
    const h = new URL(String(url).trim()).hostname.replace(/^www\./, "");
    return h.split(".")[0] || "Tool";
  } catch {
    return "Tool";
  }
}

export default function PromptsManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ category: "", title: "", prompt: "", imageUrl: "", howToUse: "", tools: [], tags: "", isPremium: false });
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Phase 2: custom categories (with deduplication)
  const { categories: customCats } = useCustomCategories("prompt_categories", docs);
  const dynamicCats = Array.from(new Set(customCats.map(c => c.name || c).filter(Boolean)));

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "prompts"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "prompts"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Error loading prompts:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    if (!form.title || !form.prompt) return toast_("Jaza kila kitu!", "error");
    const rawTools = (form.tools || []).slice(0, 5);
    for (const t of rawTools) {
      const u = (t?.toolUrl || "").trim();
      if (!u) continue;
      if (!isValidHttpUrl(u)) {
        return toast_("Kila Tool URL lazima iwe anza na http:// au https://", "error");
      }
    }
    const toolsClean = rawTools
      .filter((t) => (t?.toolUrl || "").trim())
      .map((t) => {
        const toolUrl = t.toolUrl.trim();
        let toolName = (t.toolName || "").trim();
        if (!toolName) toolName = deriveToolName(toolUrl);
        const iconUrl = (t.iconUrl || "").trim();
        const row = { toolName, toolUrl };
        if (iconUrl) row.iconUrl = iconUrl;
        return row;
      });

    setLoading(true);
    try {
      const generatedSlug = generateSlug(form.title, form.category || "");
      const canDirect = !!user?.canPublishDirect;
      
      // Process tags
      let tagArray = typeof form.tags === "string" 
        ? form.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        : Array.isArray(form.tags) ? form.tags : [];
      
      if (tagArray.length === 0) {
        tagArray = generateTags(form.title);
      }

      const data = {
        ...form,
        slug: generatedSlug,
        title: form.title || "",
        description: form.prompt || form.description || "",
        image: form.imageUrl || form.image || "",
        category: form.category || "General",
        tags: tagArray,
        isPremium: !!form.isPremium,
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        tools: toolsClean,
        // Phase 1: normalized search fields
        ...buildSearchFields({ title: form.title || "", category: form.category || "General", tags: tagArray }),
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "prompts";
        data.likes = 0;
      } else {
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;
        delete data.id;
        delete data.likes; // Don't reset likes on edit
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) data[key] = "";
      });

      if (editing) {
        await updateDoc(doc(db, "prompts", editing), data);
        toast_("Prompt imebadilishwa");
      } else {
        await addDoc(collection(db, "prompts"), data);
        toast_("Prompt mpya imeongezwa");
      }
      setForm({ category: "", title: "", prompt: "", imageUrl: "", howToUse: "", tools: [], tags: "", isPremium: false });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "prompts");
      }
      toast_(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addTool = () => {
    if ((form.tools || []).length >= 5) return toast_("Mwisho ni tools 5 tu!", "error");
    setForm(f => ({ ...f, tools: [...(f.tools || []), { toolName: "", iconUrl: "", toolUrl: "" }] }));
  };

  const updateTool = (index, field, value) => {
    const newTools = [...(form.tools || [])];
    newTools[index] = { ...newTools[index], [field]: value };
    setForm(f => ({ ...f, tools: newTools }));
  };

  const removeTool = (index) => {
    setForm(f => ({ ...f, tools: (form.tools || []).filter((_, i) => i !== index) }));
  };

  const del = (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta prompt hii?", onConfirm: async () => { await deleteDoc(doc(db, "prompts", id)); setConfirm(null); toast_("Prompt imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  const filtered = docs.filter(item =>
    (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>{editing ? "✏️ Hariri Prompt" : "➕ Ongeza Prompt Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Title *"><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Logo Designer" /></Field>
            <Field label="Category">
              <Input list="prompt-cats" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Design" />
              <datalist id="prompt-cats">
                {dynamicCats.map(c => <option key={c} value={c} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Tags (comma separated)"><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="portrait, cinematic, AI art" /></Field>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <input type="checkbox" id="isPremium" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
            <label htmlFor="isPremium" style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }}>⭐ Premium Prompt</label>
          </div>
          <ImageUploadField label="Prompt Image URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          <Field label="The Prompt *"><Textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} placeholder="Paste the AI prompt here..." style={{ minHeight: 120 }} /></Field>
          <Field label="How to Use"><Textarea value={form.howToUse} onChange={e => setForm(f => ({ ...f, howToUse: e.target.value }))} placeholder="Instructions..." style={{ minHeight: 80 }} /></Field>
          
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)" }}>TOOLS TO USE (MAX 5)</label>
              <Btn onClick={addTool} style={{ padding: "4px 10px", fontSize: 11 }}>+ Add Tool</Btn>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(form.tools || []).map((tool, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) 40px", gap: 10, background: "rgba(255,255,255,.02)", padding: 10, borderRadius: 10, alignItems: "center" }}>
                  <Input value={tool.toolName || ""} onChange={e => updateTool(i, "toolName", e.target.value)} placeholder="Tool name (e.g. ChatGPT)" />
                  <Input value={tool.iconUrl || ""} onChange={e => updateTool(i, "iconUrl", e.target.value)} placeholder="Icon URL (optional)" />
                  <Input value={tool.toolUrl || ""} onChange={e => updateTool(i, "toolUrl", e.target.value)} placeholder="https://..." />
                  <Btn onClick={() => removeTool(i)} color="rgba(239,68,68,.1)" textColor="#fca5a5">✕</Btn>
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      {/* ── Manage Categories (Phase 2) ── */}
      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 800, color: G, padding: "10px 0", userSelect: "none" }}>
          ⚙️ Manage Prompt Categories
        </summary>
        <div style={{ marginTop: 10 }}>
          <CategoryManager categoryCollection="prompt_categories" label="Prompt Categories" />
        </div>
      </details>

      <div style={{ marginBottom: 20 }}>
        <Input placeholder="🔍 Search prompts..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <AdminThumb src={item.imageUrl} fallback="🤖" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{item.category}</span>
                {(item.tags || []).map((t, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(245,166,35,.1)", color: G }}>{t}</span>
                ))}
                {item.isPremium && <span style={{ fontSize: 10, fontWeight: 800, color: G }}>⭐ PREMIUM</span>}
              </div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { setEditing(item.id); setForm({ ...item }); window.scrollTo({ top: 0, behavior: "smooth" }); }} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
