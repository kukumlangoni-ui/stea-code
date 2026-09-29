import React, { useState, useEffect } from 'react';
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Plus, Edit, X, Loader2, MessageCircle } from "lucide-react";
import { getFirebaseDb } from "../firebase.js";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 500, background: "#fff", borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {children}
      </div>
    </div>
  );
}

function CategoryEditorModal({ category, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    sortOrder: typeof category?.sortOrder === "number" ? category.sortOrder : 99,
  });
  const [loading, setLoading] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{category ? "Edit Category" : "Add Category"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category Name</span>
          <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. Programming" />
        </label>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} placeholder="Short description..." />
        </label>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Sort Order</span>
          <input type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({...p, sortOrder: parseInt(e.target.value)||0}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
        </label>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={!formData.name.trim() || loading} onClick={async () => {
          setLoading(true);
          await onSave({ ...(category || {}), ...formData });
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.name.trim() || loading) ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Category
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function CommunityPage({ isSuperAdmin }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }
    const unsub = onSnapshot(query(collection(db, "community_categories"), orderBy("sortOrder", "asc")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching community categories", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveCategory = async (catData) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const payload = {
        name: catData.name,
        description: catData.description,
        sortOrder: catData.sortOrder,
        updatedAt: serverTimestamp()
      };

      if (catData.id) {
        await createAuditLog("edit_community_category", "community_categories", catData.id, null, payload, "Admin edited community category");
        await updateDoc(doc(db, "community_categories", catData.id), payload);
        setCategories(prev => prev.map(i => i.id === catData.id ? { ...i, ...payload, updatedAt: new Date() } : i).sort((a,b)=>a.sortOrder - b.sortOrder));
      } else {
        payload.createdAt = serverTimestamp();
        await createAuditLog("create_community_category", "community_categories", "new", null, payload, "Admin created community category");
        const docRef = await addDoc(collection(db, "community_categories"), payload);
        setCategories(prev => [...prev, { id: docRef.id, ...payload, createdAt: new Date() }].sort((a,b)=>a.sortOrder - b.sortOrder));
      }
      setEditingCategory(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save category.");
    }
  };

  const handleDeleteCategory = async (cat) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await createAuditLog("delete_community_category", "community_categories", cat.id, cat, null, "Admin permanently deleted community category");
      await deleteDoc(doc(db, "community_categories", cat.id));
      setCategories(prev => prev.filter(i => i.id !== cat.id));
      setDeletingCategory(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete category.");
    }
  };

  return (
    <>
      <AdminPageHeader 
        title="Community Moderation" 
        description="Manage STEA Community categories and reported content." 
      />

      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}

      {deletingCategory && (
        <AdminConfirmationModal
          title="Delete Category"
          actionDescription={`You are about to permanently delete the "${deletingCategory.name}" category.`}
          onClose={() => setDeletingCategory(null)}
          onConfirm={() => handleDeleteCategory(deletingCategory)}
        />
      )}

      <div className="admin-v2-card">
        <div className="admin-v2-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 className="admin-v2-card-title">Community Categories</h3>
            <p className="admin-v2-card-subtitle">Organize discussions into specific topics.</p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setEditingCategory("new")} className="admin-v2-btn-primary" style={{ padding: "6px 12px", fontSize: 13 }}>
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
        
        <div style={{ padding: 20 }}>
          {loading ? <p>Loading...</p> : (
            <div className="admin-v2-grid-premium">
              {categories.map(cat => (
                <div key={cat.id} className="admin-v2-card" style={{ padding: 16, border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(212,175,55,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MessageCircle size={20} color="#9A7700" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#111827" }}>
                        {cat.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#6B7280", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {cat.description || "No description"}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>Order: {cat.sortOrder || 99}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isSuperAdmin && (
                        <>
                          <button onClick={() => setEditingCategory(cat)} className="admin-v2-btn-secondary" style={{ padding: "4px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => setDeletingCategory(cat)} style={{ background: "none", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p style={{ color: "#6B7280", gridColumn: "1/-1" }}>No categories found.</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
