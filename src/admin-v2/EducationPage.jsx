import React, { useState, useEffect } from 'react';
import { AdminPageHeader } from "./AdminLayout.jsx";
import { BookOpen, FileText, UploadCloud, ShieldAlert, CheckCircle, Edit, Trash2 } from "lucide-react";
import { getFirebaseDb, collection, getDocs, query, limit, doc, updateDoc, addDoc, serverTimestamp } from "../firebase";
import { createAuditLog } from "./auditLog";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { createAutomaticNotification } from "../services/notificationService.js";

const PAGE_SIZE = 50;

export default function EducationPage({ isSuperAdmin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", description: "", type: "notes", category: "O-Level", downloadUrl: ""
  });

  const loadData = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, "study_resources"), limit(PAGE_SIZE)));
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (reason) => {
    if (!confirming) return;
    const db = getFirebaseDb();
    const { action, item, payload } = confirming;
    
    if (action === "publish") {
      const newStatus = item.status === "published" ? "draft" : "published";
      await createAuditLog("toggle_resource_status", "study_resources", item.id, { status: item.status }, { status: newStatus }, reason);
      await updateDoc(doc(db, "study_resources", item.id), { status: newStatus });
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } else if (action === "add") {
      const docPayload = {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "published"
      };
      await createAuditLog("add_education_resource", "study_resources", "new", null, docPayload, reason);
      const docRef = await addDoc(collection(db, "study_resources"), docPayload);
      if (isSuperAdmin) {
        await createAutomaticNotification({
          source: "study_resources",
          sourceId: docRef.id,
          title: "New education resource",
          message: docPayload.title,
          type: "Education",
          actionLink: "/education",
        });
      }
      setItems([{ id: docRef.id, ...docPayload, createdAt: new Date() }, ...items]);
      setFormData({ title: "", description: "", type: "notes", category: "O-Level", downloadUrl: "" });
    }
  };

  return (
    <>
      <AdminPageHeader title="Education Resources" description="Manage study notes, past papers, and academic content." />

      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Protected actions disabled.</strong> You need Super Admin privileges to upload or edit education resources.</div></div>
      )}

      {confirming && (
        <AdminConfirmationModal
          title={confirming.action === "add" ? "Upload Resource" : "Toggle Publish Status"}
          actionDescription={
            confirming.action === "add" 
              ? `You are about to upload "${confirming.payload.title}" directly to study_resources.`
              : `You are about to change the status of this resource.`
          }
          onClose={() => setConfirming(null)}
          onConfirm={handleAction}
        />
      )}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card">
          <div className="admin-v2-stat-icon"><BookOpen size={24} /></div>
          <div>
            <h4 className="admin-v2-stat-value">{items.length}</h4>
            <p className="admin-v2-stat-label">Total Resources</p>
          </div>
        </div>
      </div>

      <div className="admin-v2-card" style={{ marginBottom: 24 }}>
        <div className="admin-v2-card-header">
          <h3 className="admin-v2-card-title">Upload New Resource</h3>
        </div>
        
        <div style={{ display: "grid", gap: 16, maxWidth: 600 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Title</label>
            <input 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              type="text" placeholder="Resource title..." 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</label>
            <textarea 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Short description..." rows={2} 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, resize: "vertical" }} 
              disabled={!isSuperAdmin}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Type</label>
              <select 
                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff" }}
                disabled={!isSuperAdmin}
              >
                <option value="notes">Notes</option>
                <option value="past_papers">Past Papers</option>
                <option value="syllabus">Syllabus</option>
                <option value="book">Book</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</label>
              <select 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff" }}
                disabled={!isSuperAdmin}
              >
                <option>O-Level</option>
                <option>A-Level</option>
                <option>University</option>
                <option>Primary</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Download/File URL</label>
            <input 
              value={formData.downloadUrl} onChange={e => setFormData({...formData, downloadUrl: e.target.value})}
              type="url" placeholder="https://..." 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
              disabled={!isSuperAdmin}
            />
          </div>

          {isSuperAdmin && (
            <div className="admin-v2-card-actions" style={{ justifyContent: "flex-end", marginTop: 8 }}>
              <button 
                onClick={() => setConfirming({ action: "add", payload: formData })}
                disabled={!formData.title || !formData.downloadUrl}
                className="admin-v2-btn-primary"
              >
                <UploadCloud size={16} /> Publish Resource
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? <p>Loading resources...</p> : (
        <div className="admin-v2-grid-premium">
          {items.map(item => (
            <div key={item.id} className="admin-v2-card">
              <div className="admin-v2-card-header">
                <div>
                  <h4 className="admin-v2-card-title">{item.title || item.name || "Untitled"}</h4>
                  <p className="admin-v2-card-subtitle">{item.category} • {item.type}</p>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#4B5563", marginBottom: 16 }}>
                <div><strong>Status:</strong> {item.status || "Unknown"}</div>
                {item.downloadUrl && <div><a href={item.downloadUrl} target="_blank" rel="noreferrer" style={{ color: "#3B82F6" }}>View File</a></div>}
              </div>
              
              {isSuperAdmin && (
                <div className="admin-v2-card-actions">
                  <button className="admin-v2-btn-secondary" onClick={() => setConfirming({ action: "publish", item })}>
                    <CheckCircle size={14} /> {item.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button className="admin-v2-btn-secondary" onClick={() => alert("Edit modal would open here.")}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="admin-v2-btn-secondary" onClick={() => alert("Deletion is disabled by system policy.")}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
