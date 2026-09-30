import React, { useState, useEffect, useMemo } from 'react';
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Plus, Edit, X, Loader2, Link as LinkIcon, Wrench } from "lucide-react";
import { getFirebaseDb } from "../firebase.js";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { createAuditLog } from "./auditLog.js";
import { useCustomCategories } from "../hooks/useCustomCategories.js";
import { createAutomaticNotification } from "../services/notificationService.js";

const DEFAULT_CATEGORIES = [
  { id: "ai", name: "AI Tools", icon: "Bot" },
  { id: "editing", name: "Editing", icon: "Edit3" },
  { id: "design", name: "Design", icon: "Layout" },
  { id: "productivity", name: "Productivity", icon: "Zap" },
  { id: "education", name: "Education", icon: "BookOpen" },
  { id: "security", name: "Security Tools", icon: "Shield" },
  { id: "automation", name: "Automation", icon: "Cpu" },
];

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 540, background: "#fff", borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
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

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{category ? "Edit Category" : "New Category"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category Name</span>
          <input type="text" value={formData.name} onChange={handleNameChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} autoFocus />
        </label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Slug</span>
            <input type="text" value={formData.slug} onChange={e => { setAutoSlug(false); setFormData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })) }} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Icon (emoji)</span>
            <input type="text" value={formData.icon} onChange={e => setFormData(p => ({...p, icon: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} />
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

function ToolEditorModal({ tool, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: tool?.title || tool?.name || "",
    description: tool?.description || "",
    category: tool?.category || "",
    price: tool?.price || "Free",
    status: tool?.status || "active",
    thumbnailUrl: tool?.thumbnailUrl || tool?.icon || "",
    actionLink: tool?.actionLink || tool?.url || tool?.link || "",
    actionText: tool?.actionText || "Request Tool",
  });
  const [loading, setLoading] = useState(false);

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{tool ? "Edit Digital Tool" : "Add Digital Tool"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        
        {tool && tool._source && (
          <div style={{ background: "#F3F4F6", padding: "8px 12px", borderRadius: 6, fontSize: 12, color: "#4B5563" }}>
            <strong>Source Collection:</strong> {tool._source} <br/>
            <strong>Document ID:</strong> {tool.id}
          </div>
        )}

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Tool Name</span>
          <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. Canva Pro" />
        </label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</span>
            <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
              {formData.category && !categories.find(c => c.name === formData.category) && (
                <option value={formData.category}>{formData.category} (Legacy)</option>
              )}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Price / Plan</span>
            <input type="text" value={formData.price} onChange={e => setFormData(p => ({...p, price: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. Free, TZS 5000/mo" />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} placeholder="Short description of the tool..." />
        </label>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Thumbnail/Icon URL</span>
          <input type="url" value={formData.thumbnailUrl} onChange={e => setFormData(p => ({...p, thumbnailUrl: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="https://..." />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Action URL (Order/Link)</span>
            <input type="url" value={formData.actionLink} onChange={e => setFormData(p => ({...p, actionLink: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="https://..." />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Action Button Text</span>
            <input type="text" value={formData.actionText} onChange={e => setFormData(p => ({...p, actionText: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. Request Tool" />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status</span>
          <select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
            <option value="active">Active (Visible)</option>
            <option value="inactive">Inactive (Hidden)</option>
          </select>
        </label>

      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={!formData.title.trim() || loading} onClick={async () => {
          setLoading(true);
          await onSave({ ...(tool || {}), ...formData });
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.title.trim() || loading) ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Tool
        </button>
      </div>
    </ModalOverlay>
  );
}


export default function ToolsPage({ isSuperAdmin }) {
  const [activeTab, setActiveTab] = useState("tools");
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTool, setEditingTool] = useState(null);

  const { categories: rawCategories, loading: catsLoading } = useCustomCategories("digital_tool_categories", DEFAULT_CATEGORIES);

  const activeCategories = useMemo(() => {
    if (!catsLoading && rawCategories.length === 0) {
      return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i }));
    }
    return rawCategories;
  }, [rawCategories, catsLoading]);

  useEffect(() => {
    const fetchTools = async () => {
      const db = getFirebaseDb();
      if (!db) return;
      try {
        const collectionsToFetch = ["digital_tools", "digitalTools"];
        const promises = collectionsToFetch.map(async colName => {
          try {
            const snap = await getDocs(query(collection(db, colName), orderBy("createdAt", "desc")));
            return snap.docs.map(d => ({ id: d.id, _source: colName, ...d.data() }));
          } catch(e) {
            return [];
          }
        });
        const results = await Promise.all(promises);
        const allTools = results.flat().sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || (typeof a.createdAt === 'number' ? a.createdAt : 0);
          const bTime = b.createdAt?.toMillis?.() || (typeof b.createdAt === 'number' ? b.createdAt : 0);
          return bTime - aTime;
        });
        setTools(allTools);
      } catch (e) {
        console.error("Error fetching digital tools", e);
      }
      setLoading(false);
    };
    fetchTools();
  }, []);

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

      if (catData.id) {
        await createAuditLog("update_tool_category", "digital_tool_categories", catData.id, null, payload, "Admin edit tool category");
        await updateDoc(doc(db, "digital_tool_categories", catData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await createAuditLog("create_tool_category", "digital_tool_categories", "new", null, payload, "Admin add tool category");
        await addDoc(collection(db, "digital_tool_categories"), payload);
      }
      setEditingCategory(null);
    } catch (e) {
      console.error(e);
      alert("Error saving category.");
    }
  };

  const handleSaveTool = async (toolData) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const payload = {
        title: toolData.title,
        description: toolData.description,
        category: toolData.category,
        price: toolData.price,
        status: toolData.status,
        actionText: toolData.actionText,
        updatedAt: serverTimestamp()
      };
      
      if (toolData.thumbnailUrl) payload.thumbnailUrl = toolData.thumbnailUrl;
      if (toolData.actionLink) payload.actionLink = toolData.actionLink;

      if (toolData.id) {
        // Edit existing
        await createAuditLog("edit_digital_tool", toolData._source, toolData.id, null, payload, "Admin edited digital tool");
        await updateDoc(doc(db, toolData._source, toolData.id), payload);
        
        setTools(prev => prev.map(i => i.id === toolData.id && i._source === toolData._source ? { ...i, ...payload, updatedAt: new Date() } : i));
      } else {
        // Create new
        payload.createdAt = serverTimestamp();
        payload.source = "digital_tools";
        await createAuditLog("create_digital_tool", "digital_tools", "new", null, payload, "Admin added digital tool");
        const docRef = await addDoc(collection(db, "digital_tools"), payload);
        if (isSuperAdmin) {
          await createAutomaticNotification({
            source: "digital_tools",
            sourceId: docRef.id,
            title: "New digital tool",
            message: payload.title,
            type: "Tools",
            actionLink: "/digital-tools",
          });
        }
        setTools(prev => [{ id: docRef.id, _source: "digital_tools", ...payload, createdAt: new Date() }, ...prev]);
      }
      setEditingTool(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save tool.");
    }
  };

  const toggleCategoryStatus = async (cat) => {
    if (!isSuperAdmin) return;
    const db = getFirebaseDb();
    const newStatus = cat.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "digital_tool_categories", cat.id), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <AdminPageHeader 
        title="Digital Tools" 
        description="Manage the STEA Digital Tools marketplace, subscriptions, and AI products." 
      />

      <div className="admin-v2-tabs" style={{ marginBottom: 24, marginTop: 16 }}>
        <button className={`admin-v2-tab ${activeTab === "tools" ? "is-active" : ""}`} onClick={() => setActiveTab("tools")}>Tools & Subscriptions</button>
        <button className={`admin-v2-tab ${activeTab === "categories" ? "is-active" : ""}`} onClick={() => setActiveTab("categories")}>Categories</button>
      </div>

      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}

      {editingTool && (
        <ToolEditorModal
          tool={editingTool === "new" ? null : editingTool}
          categories={activeCategories}
          onClose={() => setEditingTool(null)}
          onSave={handleSaveTool}
        />
      )}

      {activeTab === "categories" ? (
        <div className="admin-v2-card">
          <div className="admin-v2-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className="admin-v2-card-title">Tool Categories</h3>
              <p className="admin-v2-card-subtitle">Manage filters for the Digital Tools page</p>
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
        <div className="admin-v2-card">
          <div className="admin-v2-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 className="admin-v2-card-title">Digital Tools & Subscriptions</h3>
              <p className="admin-v2-card-subtitle">Manage tools visible in the STEA ecosystem</p>
            </div>
            {isSuperAdmin && (
              <button onClick={() => setEditingTool("new")} className="admin-v2-btn-primary" style={{ padding: "6px 12px", fontSize: 13 }}>
                <Plus size={16} /> Add Tool
              </button>
            )}
          </div>
          
          <div style={{ padding: 20 }}>
            {loading ? <p>Loading...</p> : (
              <div className="admin-v2-grid-premium">
                {tools.map(tool => {
                  const title = tool.title || tool.name || "Unnamed Tool";
                  const isLegacy = tool._source !== "digital_tools";
                  
                  return (
                    <div key={`${tool._source}-${tool.id}`} className="admin-v2-card" style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: "#F3F4F6", overflow: "hidden", flexShrink: 0, position: "relative", border: "1px solid #E5E7EB" }}>
                          {(tool.thumbnailUrl || tool.icon) ? (
                            <img src={tool.thumbnailUrl || tool.icon} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Wrench size={20} color="#9CA3AF" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {title}
                          </h4>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              {tool.category || "Uncategorized"}
                            </span>
                            <span style={{ fontSize: 11, color: "#D4AF37", background: "#FFF9E8", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                              {tool.price || "Free"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 10, fontWeight: 500, color: "#9CA3AF" }}>ID: {tool.id}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tool.status === "inactive" ? "#EF4444" : "#10B981", textTransform: "uppercase" }}>
                            {tool.status || "active"} {isLegacy ? "(Legacy)" : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(tool.actionLink || tool.url || tool.link) && (
                            <a href={tool.actionLink || tool.url || tool.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "#EFF6FF", color: "#1D4ED8", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                              <LinkIcon size={14} /> Link
                            </a>
                          )}
                          {isSuperAdmin && (
                            <button onClick={() => setEditingTool(tool)} className="admin-v2-btn-secondary" style={{ padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                              <Edit size={14} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tools.length === 0 && <p style={{ color: "#6B7280" }}>No digital tools found.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
