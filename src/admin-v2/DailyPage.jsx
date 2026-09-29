import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Plus, Save, AlertTriangle, FileVideo, FileText, CheckCircle, UploadCloud, Edit, Trash2, X, Loader2, Eye } from "lucide-react";
import { getFirebaseDb, uploadToStorage, storage } from "../firebase.js";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { useCustomCategories } from "../hooks/useCustomCategories.js";
import { createAutomaticNotification } from "../services/notificationService.js";

const DEFAULT_CATEGORIES = [
  { id: "stea-tutorials", name: "STEA Tutorials" },
  { id: "tech-tips", name: "Tech Tips" },
  { id: "ai", name: "AI" },
  { id: "education", name: "Education" },
  { id: "pdf-guides", name: "PDF Guides" },
  { id: "videos", name: "Videos" },
  { id: "opportunities", name: "Opportunities" }
];

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 540, background: "#fff", borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {children}
      </div>
    </div>
  );
}

function CategoryEditorModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    icon: category?.icon || "",
    description: category?.description || "",
    status: category?.status || "active",
    sortOrder: typeof category?.sortOrder === "number" ? category.sortOrder : 99,
  });
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!category?.slug);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const updates = { name: newName };
    if (autoSlug) {
      updates.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{category ? "Edit Category" : "New Category"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category Name</span>
          <input type="text" value={formData.name} onChange={handleNameChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. STEA Tutorials" autoFocus />
        </label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Slug</span>
            <input type="text" value={formData.slug} onChange={handleSlugChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. stea-tutorials" />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Icon (emoji/text)</span>
            <input type="text" value={formData.icon} onChange={e => setFormData(p => ({...p, icon: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. 🛠️" />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} placeholder="Optional description..." />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status</span>
            <select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Sort Order</span>
            <input type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({...p, sortOrder: parseInt(e.target.value)||0}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
          </label>
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={!formData.name.trim() || loading} onClick={async () => {
          setLoading(true);
          await onSave({ ...(category || {}), ...formData, name: formData.name.trim() });
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.name.trim() || loading) ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Category
        </button>
      </div>
    </ModalOverlay>
  );
}

function ItemEditorModal({ item, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    category: item.categoryName || item.category || "",
    type: item.type || item.fileType || "",
    status: item.status || "published",
    thumbnailUrl: item.thumbnailUrl || item.image || item.coverUrl || "",
    mediaUrl: item.pdfUrl || item.fileUrl || item.mediaUrl || item.downloadUrl || item.link || item.url || "",
  });
  const [loading, setLoading] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Edit Legacy Content</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        
        <div style={{ background: "#F3F4F6", padding: "8px 12px", borderRadius: 6, fontSize: 12, color: "#4B5563" }}>
          <strong>Source Collection:</strong> {item._source} <br/>
          <strong>Document ID:</strong> {item.id}
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Title</span>
          <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
        </label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Type</span>
            <input type="text" value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</span>
            <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="">-- No Category --</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
              {formData.category && !categories.find(c => c.name === formData.category) && (
                <option value={formData.category}>{formData.category} (Legacy)</option>
              )}
            </select>
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} />
        </label>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Media / PDF URL</span>
          <input type="url" value={formData.mediaUrl} onChange={e => setFormData(p => ({...p, mediaUrl: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
        </label>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Thumbnail URL</span>
          <input type="url" value={formData.thumbnailUrl} onChange={e => setFormData(p => ({...p, thumbnailUrl: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
        </label>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status</span>
          <select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
            <option value="published">Published</option>
            <option value="draft">Draft / Hidden</option>
          </select>
        </label>

      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={loading} onClick={async () => {
          setLoading(true);
          await onSave({ ...item, ...formData });
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Changes
        </button>
      </div>
    </ModalOverlay>
  );
}

function ItemDeleteModal({ item, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={24} color="#EF4444" />
          <h3 style={{ margin: 0, fontSize: 18, color: "#EF4444" }}>Delete Content Permanently</h3>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
          You are about to permanently delete <strong>{item.title}</strong> from the <strong>{item._source}</strong> collection.
          This action cannot be undone and will immediately remove the content from the user hub.
        </p>

        <div style={{ background: "#FEF2F2", padding: "12px 16px", borderRadius: 8, fontSize: 13, color: "#991B1B", border: "1px solid #FCA5A5" }}>
          <strong>Warning:</strong> Any associated files stored in Firebase Storage will also be marked for deletion.
        </div>
        
        <label style={{ display: "block", marginTop: 8 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
            Type <strong>DELETE</strong> to confirm
          </span>
          <input 
            type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} 
            placeholder="DELETE"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#EF4444", fontSize: 14 }} 
          />
        </label>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={confirmText !== "DELETE" || loading} onClick={async () => {
          setLoading(true);
          await onConfirm(item);
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#EF4444", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (confirmText !== "DELETE" || loading) ? 0.5 : 1 }}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />} 
          Permanently Delete
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function DailyPage({ isSuperAdmin }) {
  const [activeTab, setActiveTab] = useState("content");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", description: "", type: "Video Tutorial", category: "", mediaUrl: "", thumbnailUrl: "", pdfUrl: "", body: "", duration: "", language: "", link: ""
  });

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef(null);

  const { categories: rawCategories, loading: catsLoading } = useCustomCategories("stea_daily_categories", DEFAULT_CATEGORIES);

  const activeCategories = useMemo(() => {
    if (!catsLoading && rawCategories.length === 0) {
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i }));
    }
    return rawCategories;
  }, [rawCategories, catsLoading]);

  useEffect(() => {
    if (activeCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: activeCategories[0].name }));
    }
  }, [activeCategories]);

  useEffect(() => {
    const fetchDaily = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      try {
        const collectionsToFetch = ["stea_daily", "tips_resources", "resources", "updates", "study_resources"];
        const promises = collectionsToFetch.map(async colName => {
          try {
            const snap = await getDocs(query(collection(db, colName), orderBy("createdAt", "desc")));
            return snap.docs.map(d => ({ id: d.id, _source: colName, ...d.data() }));
          } catch(e) {
            return [];
          }
        });
        const results = await Promise.all(promises);
        const allItems = results.flat().sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || (typeof a.createdAt === 'number' ? a.createdAt : 0);
          const bTime = b.createdAt?.toMillis?.() || (typeof b.createdAt === 'number' ? b.createdAt : 0);
          return bTime - aTime;
        });
        setItems(allItems);
      } catch (e) {
        console.error("Error fetching daily content", e);
      }
      setLoading(false);
    };
    fetchDaily();
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const path = `stea_daily/pdfs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await uploadToStorage(file, path);
      setFormData(prev => ({ ...prev, mediaUrl: url, pdfUrl: url }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload PDF. Please try again.");
    }
    setUploadingPdf(false);
  };

  const handlePublish = async (reason) => {
    const db = getFirebaseDb();
    
    let resolvedType = formData.type;
    if (resolvedType === "PDF") resolvedType = "pdf";
    else if (resolvedType === "Video") resolvedType = "Video Tutorial";
    else if (resolvedType === "Tip / Update") resolvedType = "Tech Tip";
    
    let payload = {
      title: formData.title,
      description: formData.description,
      type: resolvedType,
      category: formData.category,
      categoryName: formData.category,
      thumbnailUrl: formData.thumbnailUrl || null,
      status: "published",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: "stea_daily"
    };

    if (formData.type === "Video") {
      payload.mediaUrl = formData.mediaUrl;
      payload.duration = formData.duration;
      payload.language = formData.language;
    } else if (formData.type === "PDF") {
      payload.pdfUrl = formData.pdfUrl || formData.mediaUrl;
      payload.fileUrl = formData.pdfUrl || formData.mediaUrl;
    } else if (formData.type === "Article") {
      payload.body = formData.body;
    } else if (formData.type === "Tip / Update") {
      payload.link = formData.link;
    }

    await createAuditLog("publish_daily_content", "stea_daily", "new", null, payload, reason);
    
    const docRef = await addDoc(collection(db, "stea_daily"), payload);
    if (isSuperAdmin) {
      await createAutomaticNotification({
        source: "stea_daily",
        sourceId: docRef.id,
        title: "New STEA Daily content",
        message: formData.title,
        type: "STEA Daily",
        actionLink: "/daily",
      });
    }
    
    setItems(prev => [{ id: docRef.id, _source: "stea_daily", ...payload, createdAt: new Date() }, ...prev]);
    setFormData({ title: "", description: "", type: "Video Tutorial", category: activeCategories[0]?.name || "", mediaUrl: "", thumbnailUrl: "", pdfUrl: "", body: "", duration: "", language: "", link: "" });
  };

  const handleSaveCategory = async (catData) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const payload = {
        name: catData.name,
        slug: catData.slug,
        icon: catData.icon,
        description: catData.description,
        status: catData.status,
        sortOrder: catData.sortOrder,
        updatedAt: serverTimestamp()
      };
      
      let finalCat = { ...catData };

      if (catData.id) {
        await createAuditLog("update_daily_category", "stea_daily_categories", catData.id, null, payload, "Admin edit category");
        await updateDoc(doc(db, "stea_daily_categories", catData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await createAuditLog("create_daily_category", "stea_daily_categories", "new", null, payload, "Admin add category");
        const docRef = await addDoc(collection(db, "stea_daily_categories"), payload);
        finalCat = { id: docRef.id, ...payload };
      }
      setEditingCategory(null);
    } catch (e) {
      console.error(e);
      alert("Error saving category.");
    }
  };

  const toggleCategoryStatus = async (cat) => {
    if (!isSuperAdmin) return;
    const db = getFirebaseDb();
    const newStatus = cat.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "stea_daily_categories", cat.id), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditItem = async (updatedItem) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const payload = {
        title: updatedItem.title,
        description: updatedItem.description,
        category: updatedItem.category,
        categoryName: updatedItem.category,
        type: updatedItem.type,
        status: updatedItem.status,
        updatedAt: serverTimestamp()
      };
      
      if (updatedItem.thumbnailUrl) payload.thumbnailUrl = updatedItem.thumbnailUrl;
      if (updatedItem.mediaUrl) {
        if (updatedItem.type?.toLowerCase().includes("pdf")) {
          payload.pdfUrl = updatedItem.mediaUrl;
          payload.fileUrl = updatedItem.mediaUrl;
          payload.downloadUrl = updatedItem.mediaUrl;
        } else {
          payload.mediaUrl = updatedItem.mediaUrl;
          payload.url = updatedItem.mediaUrl;
          payload.link = updatedItem.mediaUrl;
        }
      }

      await createAuditLog("edit_daily_content", updatedItem._source, updatedItem.id, null, payload, "Admin edited legacy/daily content");
      await updateDoc(doc(db, updatedItem._source, updatedItem.id), payload);
      
      setItems(prev => prev.map(i => i.id === updatedItem.id && i._source === updatedItem._source ? { ...i, ...payload, updatedAt: new Date() } : i));
      setEditingItem(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update item.");
    }
  };

  const handleDeleteItem = async (item) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await createAuditLog("delete_daily_content", item._source, item.id, item, null, "Admin permanently deleted content");
      
      await deleteDoc(doc(db, item._source, item.id));

      const fileUrl = item.pdfUrl || item.fileUrl || item.downloadUrl || item.mediaUrl || "";
      if (fileUrl && fileUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const decodedUrl = decodeURIComponent(fileUrl.split('?')[0]);
          const pathStart = decodedUrl.indexOf('/o/') + 3;
          if (pathStart > 2) {
            const path = decodedUrl.substring(pathStart);
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
          }
        } catch (e) {
          console.warn("Could not delete associated file from storage", e);
        }
      }

      setItems(prev => prev.filter(i => !(i.id === item.id && i._source === item._source)));
      setDeletingItem(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete item.");
    }
  };

  return (
    <>
      <AdminPageHeader 
        title="STEA Daily" 
        description="Manage daily content, tips, videos and PDFs for the STEA ecosystem." 
      />

      <div className="admin-v2-tabs" style={{ marginBottom: 24, marginTop: 16 }}>
        <button className={`admin-v2-tab ${activeTab === "content" ? "is-active" : ""}`} onClick={() => setActiveTab("content")}>Content</button>
        <button className={`admin-v2-tab ${activeTab === "categories" ? "is-active" : ""}`} onClick={() => setActiveTab("categories")}>Categories</button>
      </div>
      
      {confirming && (
        <AdminConfirmationModal
          title="Publish Content to STEA Daily"
          actionDescription={`You are about to publish "${formData.title}" as a ${formData.type}. This will be immediately visible to all users.`}
          onClose={() => setConfirming(false)}
          onConfirm={handlePublish}
        />
      )}

      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}

      {editingItem && (
        <ItemEditorModal
          item={editingItem}
          categories={activeCategories}
          onClose={() => setEditingItem(null)}
          onSave={handleEditItem}
        />
      )}

      {deletingItem && (
        <ItemDeleteModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteItem}
        />
      )}

      {activeTab === "categories" ? (
        <div className="admin-v2-card">
          <div className="admin-v2-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className="admin-v2-card-title">Daily Categories</h3>
              <p className="admin-v2-card-subtitle">Manage categories for STEA Daily</p>
            </div>
            {isSuperAdmin && (
              <button onClick={() => setEditingCategory("new")} className="admin-v2-btn-primary" style={{ padding: "6px 12px", fontSize: 13 }}>
                <Plus size={16} /> Add Category
              </button>
            )}
          </div>
          <div className="admin-v2-table-wrap">
            <table className="admin-v2-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Status</th>
                  {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {activeCategories.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {c.icon && <span>{c.icon}</span>}
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "#6B7280" }}>{c.slug}</td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <span className={`admin-v2-badge ${c.status === "active" ? "active" : "inactive"}`}>
                        {c.status || "active"}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td style={{ textAlign: "right" }}>
                        {c.id && c.id.length > 15 ? (
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={() => setEditingCategory(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}><Edit size={16} /></button>
                            <button onClick={() => toggleCategoryStatus(c)} style={{ background: "none", border: "none", cursor: "pointer", color: c.status === "active" ? "#EF4444" : "#10B981", padding: 4, fontSize: 13, fontWeight: 600 }}>
                              {c.status === "active" ? "Disable" : "Enable"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9CA3AF" }}>Default (Read-only)</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {activeCategories.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 5 : 4} style={{ textAlign: "center", padding: 24, color: "#6B7280" }}>
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-v2-card">
            <div className="admin-v2-card-header">
              <h3 className="admin-v2-card-title">Add New Content</h3>
              <p className="admin-v2-card-subtitle">Create a new post for STEA Daily</p>
            </div>
            
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #E5E7EB", paddingBottom: 16, overflowX: "auto" }}>
                {["Video", "PDF", "Article", "Tip / Update"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFormData({...formData, type: t})}
                    style={{ 
                      padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      border: formData.type === t ? "1px solid #111827" : "1px solid #E5E7EB",
                      background: formData.type === t ? "#111827" : "#fff",
                      color: formData.type === t ? "#fff" : "#4B5563"
                    }}
                  >
                    {t === "Video" && <FileVideo size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />}
                    {t === "PDF" && <FileText size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />}
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: 16, maxWidth: 600 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Title</label>
                  <input 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    type="text" placeholder="Content title..." 
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
                    disabled={!isSuperAdmin}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</label>
                    <select 
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff" }}
                      disabled={!isSuperAdmin}
                    >
                      {activeCategories.filter(c => c.status !== "inactive").map(c => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.type === "Video" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>YouTube URL</label>
                      <input 
                        value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
                        type="url" placeholder="https://youtube.com/..." 
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
                        disabled={!isSuperAdmin}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Duration (e.g. 5:30)</label>
                        <input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} type="text" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} disabled={!isSuperAdmin} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Language</label>
                        <input value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} type="text" placeholder="e.g. Swahili" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} disabled={!isSuperAdmin} />
                      </div>
                    </div>
                  </>
                )}

                {formData.type === "PDF" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Upload PDF File</label>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <input 
                        type="file" accept=".pdf" ref={fileInputRef} onChange={handlePdfUpload}
                        style={{ display: "none" }} disabled={!isSuperAdmin || uploadingPdf}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isSuperAdmin || uploadingPdf}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "1px dashed #D1D5DB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      >
                        {uploadingPdf ? <Loader2 size={16} className="admin-v2-spin" /> : <UploadCloud size={16} />} 
                        {uploadingPdf ? "Uploading..." : "Select PDF"}
                      </button>
                      {formData.pdfUrl && <span style={{ fontSize: 12, color: "#10B981", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} /> Uploaded</span>}
                    </div>
                  </div>
                )}

                {formData.type === "Article" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Article Body</label>
                    <textarea 
                      value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}
                      placeholder="Write your article here..." rows={6} 
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, resize: "vertical" }} 
                      disabled={!isSuperAdmin}
                    />
                  </div>
                )}

                {formData.type === "Tip / Update" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Optional Link</label>
                    <input 
                      value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})}
                      type="url" placeholder="https://..." 
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
                      disabled={!isSuperAdmin}
                    />
                  </div>
                )}

                {formData.type !== "Article" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</label>
                    <textarea 
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Short description..." rows={3} 
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, resize: "vertical" }} 
                      disabled={!isSuperAdmin}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Thumbnail URL (Optional)</label>
                  <input 
                    value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                    type="url" placeholder="https://..." 
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
                    disabled={!isSuperAdmin}
                  />
                </div>

                {!isSuperAdmin && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 12, display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                    <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>Publishing requires Super Admin permissions.</span>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="admin-v2-card-actions" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                    <button 
                      onClick={() => setConfirming(true)}
                      disabled={!formData.title || (formData.type === "PDF" && !formData.pdfUrl) || (formData.type === "Video" && !formData.mediaUrl)}
                      className="admin-v2-btn-primary"
                    >
                      <Plus size={16} /> Publish Content
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Recent Daily Content</h3>
            {loading ? <p>Loading...</p> : (
              <div className="admin-v2-grid-premium">
                {items.map(item => {
                  const isLegacy = item._source !== "stea_daily";
                  return (
                    <div key={`${item._source}-${item.id}`} className="admin-v2-card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: "#F3F4F6", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                          {(item.thumbnailUrl || item.image || item.coverUrl) ? (
                            <img src={item.thumbnailUrl || item.image || item.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FileText size={24} color="#9CA3AF" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h4>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              {item.categoryName || item.category || "Uncategorized"}
                            </span>
                            <span style={{ fontSize: 11, color: "#D4AF37", background: "#FFF9E8", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              {item.type || item.fileType || "Post"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF" }}>ID: {item.id}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: isLegacy ? "#D97706" : "#10B981", textTransform: "uppercase" }}>
                            Source: {item._source}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(item.pdfUrl || item.fileUrl || item.downloadUrl || (item.mediaUrl && item.mediaUrl.includes(".pdf"))) && (
                            <a href={item.pdfUrl || item.fileUrl || item.downloadUrl || item.mediaUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                              <Eye size={14} /> View
                            </a>
                          )}
                          {isSuperAdmin && (
                            <>
                              <button onClick={() => setEditingItem(item)} className="admin-v2-btn-secondary" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => setDeletingItem(item)} style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, background: "#FEF2F2", color: "#EF4444", border: "1px solid #FCA5A5", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                                <Trash2 size={14} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p style={{ color: "#6B7280" }}>No content found across all sources.</p>}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
