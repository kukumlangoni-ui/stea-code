/**
 * TipsResourcesManager — Admin panel for Tips Resources
 * Reads/writes from Firestore "tips_resources" collection
 */
import React, { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  storage, logStorageUpload, logFirebaseStorageError,
} from "../../firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, Select } from "../AdminUI.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";
const COLLECTION = "resources";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EMPTY = {
  title: "",
  slug: "",
  shortDescription: "",
  thumbnailUrl: "",
  pdfUrl: "",
  pdfFileName: "",
  pdfSize: 0,
  pdfStoragePath: "",
  pdfType: "",
  pdfUploadedAt: null,
  category: "",
  steps: [],
  links: [],
  status: "draft",
  featured: false,
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function TipsResourcesManager({ user }) {
  const [docs,    setDocs]    = useState([]);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search,  setSearch]  = useState("");

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  const setF = (patch) => setForm(f => ({ ...f, ...patch }));

  const safeFileName = (name) => String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);

  const getUploadErrorMessage = (error, storagePath = "") => {
    const code = error?.code || "storage/unknown";
    const message = error?.message || "Upload failed.";
    return `${code}: ${message}${storagePath ? ` Path: ${storagePath}` : ""}`;
  };

  const validateUploadFile = (file, expected = "any") => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("File is too large. Maximum upload size is 25MB.");
    }
    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      throw new Error("Unsupported file type. Use PNG, JPEG, WebP, GIF, or PDF.");
    }
    if (expected === "pdf" && file.type !== "application/pdf") {
      throw new Error("Tafadhali pakia faili la PDF pekee.");
    }
    if (expected === "image" && !file.type.startsWith("image/")) {
      throw new Error("Tafadhali pakia picha pekee: PNG, JPEG, WebP, au GIF.");
    }
  };

  const uploadManagedFile = (file, folder, onProgress) => {
    const adminUid = user?.uid || "admin";
    const storagePath = `${folder}/${adminUid}/${Date.now()}-${safeFileName(file.name)}`;
    logStorageUpload(storagePath);
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        },
        (error) => {
          logFirebaseStorageError(error);
          console.error("[tips-resources] Firebase Storage upload error:", {
            path: storagePath,
            code: error?.code,
            message: error?.message,
            serverResponse: error?.serverResponse,
          });
          error.storagePath = storagePath;
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadURL, storagePath });
        }
      );
    });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      validateUploadFile(file, "image");
      setUploadingThumbnail(true);
      setThumbnailProgress(0);
      const result = await uploadManagedFile(file, "tips-resources", setThumbnailProgress);
      setF({
        thumbnailUrl: result.downloadURL,
        thumbnailStoragePath: result.storagePath,
      });
      toast_("Thumbnail uploaded.");
    } catch (error) {
      console.error("[tips-resources] thumbnail upload failed:", error);
      toast_(getUploadErrorMessage(error, error?.storagePath), "error");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // ── PDF Upload Handler ─────────────────────────────────
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPdf(true);
    setUploadProgress(0);

    try {
      validateUploadFile(file, "pdf");
      const result = await uploadManagedFile(file, "tips-resources", setUploadProgress);
      setF({
        pdfUrl: result.downloadURL,
        pdfFileName: file.name,
        pdfSize: file.size,
        pdfType: file.type,
        pdfStoragePath: result.storagePath,
        pdfUploadedAt: new Date().toISOString(),
      });
      toast_("PDF Imepakiwa Kikamilifu!");
    } catch (err) {
      console.error("[tips-resources] PDF upload failed:", err);
      toast_(getUploadErrorMessage(err, err?.storagePath), "error");
    } finally {
      setUploadingPdf(false);
    }
  };

  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db, COLLECTION), limit(1000)), (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => ((b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0)));
      setDocs(fetched);
    }, (err) => console.error("TipsResourcesManager:", err));
  }, [db]);

  // ── Steps helpers ──────────────────────────────────────
  const addStep = () => setF({ steps: [...(form.steps || []), { title: "", body: "" }] });
  const updateStep = (i, patch) => {
    const arr = [...(form.steps || [])];
    arr[i] = { ...arr[i], ...patch };
    setF({ steps: arr });
  };
  const removeStep = (i) => {
    const arr = [...(form.steps || [])];
    arr.splice(i, 1);
    setF({ steps: arr });
  };

  // ── Links helpers ──────────────────────────────────────
  const addLink = () => setF({ links: [...(form.links || []), { label: "", url: "" }] });
  const updateLink = (i, patch) => {
    const arr = [...(form.links || [])];
    arr[i] = { ...arr[i], ...patch };
    setF({ links: arr });
  };
  const removeLink = (i) => {
    const arr = [...(form.links || [])];
    arr.splice(i, 1);
    setF({ links: arr });
  };

  // ── Save ───────────────────────────────────────────────
  const save = async () => {
    const title = (form.title || "").trim();
    if (!title) { toast_("Weka title kwanza", "error"); return; }
    const slug = (form.slug || "").trim() || slugify(title);
    setLoading(true);
    try {
      const data = {
        title,
        slug,
        shortDescription: (form.shortDescription || "").trim(),
        thumbnailUrl: (form.thumbnailUrl || "").trim(),
        pdfUrl: (form.pdfUrl || "").trim(),
        pdfFileName: form.pdfFileName || "",
        pdfSize: form.pdfSize || 0,
        pdfStoragePath: form.pdfStoragePath || "",
        pdfType: form.pdfType || "",
        pdfUploadedAt: form.pdfUploadedAt || null,
        thumbnailStoragePath: form.thumbnailStoragePath || "",
        hasPdf: !!((form.pdfUrl || "").trim()),
        category: (form.category || "").trim(),
        steps: (form.steps || []).filter(s => s.title || s.body),
        links: (form.links || []).filter(l => l.label || l.url),
        status: String(form.status || "draft").toLowerCase(),
        published: String(form.status || "draft").toLowerCase() === "published",
        isPublished: String(form.status || "draft").toLowerCase() === "published",
        visibility: String(form.status || "draft").toLowerCase() === "published" ? "public" : "private",
        publishedAt: String(form.status || "draft").toLowerCase() === "published" ? serverTimestamp() : (editing ? (form.publishedAt || null) : null),
        featured: !!form.featured,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, COLLECTION, editing), data);
        toast_("Imesahihishwa!");
      } else {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        await addDoc(collection(db, COLLECTION), data);
        toast_("Imehifadhiwa!");
      }
      setForm({ ...EMPTY });
      setEditing(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta resource hii?",
      onConfirm: async () => {
        await deleteDoc(doc(db, COLLECTION, id));
        setConfirm(null);
        toast_("Imefutwa");
      },
      onCancel: () => setConfirm(null),
    });
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({
      ...EMPTY,
      ...item,
      steps: item.steps || [],
      links: item.links || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...EMPTY });
  };

  const filtered = docs.filter(d => (d.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* ── Form ── */}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>
          {editing ? "✏️ Hariri Resource" : "➕ Ongeza Resource Mpya"}
        </h3>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Title + Slug */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <Field label="Title *">
              <Input
                value={form.title}
                onChange={e => {
                  const t = e.target.value;
                  setF({ title: t, slug: editing ? form.slug : slugify(t) });
                }}
                placeholder="Jina la resource..."
              />
            </Field>
            <Field label="Slug (URL key)">
              <Input
                value={form.slug}
                onChange={e => setF({ slug: slugify(e.target.value) })}
                placeholder="jina-la-resource"
              />
            </Field>
          </div>

          {/* Short description */}
          <Field label="Short Description">
            <Textarea
              value={form.shortDescription}
              onChange={e => setF({ shortDescription: e.target.value })}
              placeholder="Maelezo mafupi ya resource hii..."
              style={{ minHeight: 70 }}
            />
          </Field>

          {/* Thumbnail + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <Field label="Thumbnail URL">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <Input
                  value={form.thumbnailUrl}
                  onChange={e => setF({ thumbnailUrl: e.target.value })}
                  placeholder="Paste image URL or upload"
                />
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" id="tips_thumbnail_upload" onChange={handleThumbnailUpload} style={{ display: "none" }} />
                <Btn onClick={() => document.getElementById("tips_thumbnail_upload")?.click()} disabled={uploadingThumbnail} color="rgba(255,255,255,.05)" textColor="#fff" style={{ height: 46, minWidth: 48 }}>
                  {uploadingThumbnail ? `${thumbnailProgress}%` : "☁️"}
                </Btn>
              </div>
              {uploadingThumbnail && (
                <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${thumbnailProgress}%`, height: "100%", background: G, transition: "width 0.2s" }} />
                </div>
              )}
            </Field>
            <Field label="Category / Tag">
              <Input
                value={form.category}
                onChange={e => setF({ category: e.target.value })}
                placeholder="Mfano: Android, AI, Tips..."
              />
            </Field>
          </div>

          {/* PDF Upload / URL */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <Field label="Upload PDF from device">
              <div style={{ border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: 16, background: "rgba(0,0,0,0.2)"}}>
                {form.pdfFileName ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>📄 {form.pdfFileName}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{((form.pdfSize || 0) / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {form.pdfUrl && <Btn onClick={() => window.open(form.pdfUrl, "_blank")} color="rgba(0, 196, 140, 0.15)" textColor="#00C48C" style={{ padding: "6px 12px", fontSize: 13 }}>👁️ Preview / Open PDF</Btn>}
                      <Btn onClick={() => setF({ pdfUrl: "", pdfFileName: "", pdfSize: 0, pdfStoragePath: "", pdfType: "", pdfUploadedAt: null })} color="rgba(239, 68, 68, 0.15)" textColor="#EF4444" style={{ padding: "6px 12px", fontSize: 13 }}>🗑️ Remove</Btn>
                    </div>
                  </div>
                ) : uploadingPdf ? (
                  <div style={{ textAlign: "center", color: G }}>
                    <div>Uploading {uploadProgress}%</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ width: `${uploadProgress}%`, height: "100%", background: G, transition: "width 0.2s" }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="file" accept="application/pdf" id="pdf_upload_input" onChange={handlePdfUpload} style={{ display: "none" }} />
                    <label htmlFor="pdf_upload_input" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                      📁 Select PDF to Upload
                    </label>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Only PDF files allowed</span>
                  </div>
                )}
              </div>
            </Field>

            <Field label="PDF URL (optional / alternative)">
              <Input
                value={form.pdfUrl}
                onChange={e => setF({ pdfUrl: e.target.value })}
                placeholder="https://...pdf"
                disabled={!!form.pdfFileName}
              />
            </Field>
          </div>

          {/* Status + Featured */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
            <Field label="Status">
              <Select value={form.status} onChange={e => setF({ status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Featured">
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46 }}>
                <input
                  type="checkbox"
                  id="tr_featured"
                  checked={!!form.featured}
                  onChange={e => setF({ featured: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <label htmlFor="tr_featured" style={{ cursor: "pointer", fontSize: 14 }}>Mark as Featured</label>
              </div>
            </Field>
          </div>

          {/* Steps */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Hatua / Steps ({(form.steps || []).length})
              </div>
              <Btn onClick={addStep} color="rgba(255,255,255,.05)" textColor="rgba(255,255,255,.7)" style={{ padding: "6px 14px", fontSize: 12 }}>
                + Ongeza Hatua
              </Btn>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {(form.steps || []).map((step, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: G }}>Hatua {i + 1}</span>
                    <Btn onClick={() => removeStep(i)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: "4px 10px", fontSize: 12 }}>✕</Btn>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Kichwa cha Hatua">
                      <Input value={step.title} onChange={e => updateStep(i, { title: e.target.value })} placeholder="Mfano: Hatua ya 1 — Pakua App" />
                    </Field>
                    <Field label="Maelezo">
                      <Textarea value={step.body} onChange={e => updateStep(i, { body: e.target.value })} placeholder="Maelezo ya hatua hii..." style={{ minHeight: 60 }} />
                    </Field>
                  </div>
                </div>
              ))}
              {(form.steps || []).length === 0 && (
                <div style={{ textAlign: "center", padding: "16px", color: "rgba(255,255,255,.25)", fontSize: 13, border: "1px dashed rgba(255,255,255,.08)", borderRadius: 12 }}>
                  Bado hakuna hatua. Bonyeza "+ Ongeza Hatua" kuongeza.
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Viungo vya Ziada / Links ({(form.links || []).length})
              </div>
              <Btn onClick={addLink} color="rgba(255,255,255,.05)" textColor="rgba(255,255,255,.7)" style={{ padding: "6px 14px", fontSize: 12 }}>
                + Ongeza Link
              </Btn>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(form.links || []).map((link, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 10, alignItems: "end" }}>
                  <Field label="Label">
                    <Input value={link.label} onChange={e => updateLink(i, { label: e.target.value })} placeholder="Mfano: Angalia Video" />
                  </Field>
                  <Field label="URL">
                    <Input value={link.url} onChange={e => updateLink(i, { url: e.target.value })} placeholder="https://..." />
                  </Field>
                  <Btn onClick={() => removeLink(i)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: "10px", marginBottom: 4 }}>✕</Btn>
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnail preview */}
          {form.thumbnailUrl && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.4)", textTransform: "uppercase", marginBottom: 8 }}>Preview</div>
              <img src={form.thumbnailUrl} alt="thumbnail" style={{ height: 120, borderRadius: 12, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save} disabled={loading}>
              {loading ? "Inahifadhi..." : editing ? "💾 Hifadhi Mabadiliko" : "🚀 Hifadhi Resource"}
            </Btn>
            {editing && (
              <Btn onClick={cancelEdit} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>
            )}
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 20 }}>
        <Input
          placeholder="🔍 Tafuta resource kwa jina..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400, background: "rgba(255,255,255,.05)" }}
        />
      </div>

      {/* ── List ── */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>
            Hakuna resources bado. Ongeza moja ukitumia fomu hapo juu.
          </div>
        )}
        {filtered.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            {/* Thumbnail */}
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,.05)", flexShrink: 0, display: "grid", placeItems: "center" }}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              ) : (
                <span style={{ fontSize: 22 }}>📋</span>
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
                /{item.slug} • {item.category || "—"} • {(item.steps || []).length} hatua • {(item.links || []).length} viungo
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: item.status === "published" ? "#00C48C" : G }}>
                  {item.status}
                </span>
                {item.featured && <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#3b82f6" }}>• FEATURED</span>}
                {item.pdfUrl && <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "rgba(255,255,255,.3)" }}>• PDF ✓</span>}
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Btn 
                onClick={async () => {
                  try {
                    const isPub = item.status === "published";
                    const newStatus = isPub ? "draft" : "published";
                    const isPublishedBool = !isPub;
                    await updateDoc(doc(getFirebaseDb(), COLLECTION, item.id), { 
                      status: newStatus,
                      published: isPublishedBool,
                      isPublished: isPublishedBool,
                      visibility: isPub ? "private" : "public",
                      publishedAt: isPub ? null : serverTimestamp()
                    });
                    toast_(`Imebadilishwa kuwa ${isPub ? "Draft" : "Published"}`);
                  } catch (e) {
                    toast_("Hitilafu: " + e.message, "error");
                  }
                }} 
                color={item.status === "published" ? "rgba(255,255,255,.05)" : "rgba(0,196,140,.12)"} 
                textColor={item.status === "published" ? "rgba(255,255,255,.5)" : "#00c48c"} 
                style={{ padding: "8px 14px", fontWeight: "bold" }}
              >
                {item.status === "published" ? "Ficha (Draft)" : "🚀 Chapisha"}
              </Btn>
              <Btn onClick={() => window.open(`/tech/tips-resources`, "_blank")} color="rgba(59,130,246,.12)" textColor="#93c5fd" style={{ padding: "8px 14px" }}>👁️</Btn>
              <Btn onClick={() => edit(item)} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
