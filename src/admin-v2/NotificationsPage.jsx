import React, { useState, useEffect } from 'react';
import { AdminPageHeader } from "./AdminLayout.jsx";
import { Bell, Send, ShieldAlert } from "lucide-react";
import { getFirebaseAuth, getFirebaseDb, collection, getDocs, query, limit, orderBy } from "../firebase";
import { createAuditLog } from "./auditLog";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { NOTIFICATION_TARGETS, NOTIFICATION_TYPES, sendNotificationCampaign } from "../services/notificationService.js";

const PAGE_SIZE = 50;

export default function NotificationsPage({ isSuperAdmin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", message: "", type: "System", target: "all", actionLink: ""
  });

  const loadData = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, "notificationCampaigns"), orderBy("createdAt", "desc"), limit(PAGE_SIZE)));
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
    const { payload } = confirming;
    const actor = getFirebaseAuth()?.currentUser;
    await createAuditLog("send_notification_broadcast", "notificationCampaigns", "new", null, payload, reason);
    const result = await sendNotificationCampaign({ ...payload, createdBy: actor?.uid || null });
    setItems([{ id: result.campaignId, ...payload, status: "sent", createdAt: new Date(), recipientCount: result.recipientCount }, ...items]);
    setFormData({ title: "", message: "", type: "System", target: "all", actionLink: "" });
    setConfirming(null);
  };

  return (
    <>
      <AdminPageHeader title="Notifications Center" description="Manage and broadcast notifications." />

      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Protected actions disabled.</strong> You need Super Admin privileges to broadcast notifications.</div></div>
      )}

      {confirming && (
        <AdminConfirmationModal
          title="Send Broadcast Notification"
          actionDescription={`You are about to send "${confirming.payload.title}" to ${NOTIFICATION_TARGETS.find((item) => item.value === confirming.payload.target)?.label || "selected users"}. This action cannot be undone.`}
          onClose={() => setConfirming(null)}
          onConfirm={handleAction}
          danger
        />
      )}

      <div className="admin-v2-stats-row">
        <div className="admin-v2-stat-card">
          <div className="admin-v2-stat-icon"><Bell size={24} /></div>
          <div>
            <h4 className="admin-v2-stat-value">{items.length}</h4>
            <p className="admin-v2-stat-label">Past Broadcasts</p>
          </div>
        </div>
      </div>

      <div className="admin-v2-card" style={{ marginBottom: 24 }}>
        <div className="admin-v2-card-header">
          <h3 className="admin-v2-card-title">New Broadcast Notification</h3>
        </div>
        
        <div style={{ display: "grid", gap: 16, maxWidth: 600 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Title</label>
            <input 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              type="text" placeholder="Notification title..." 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} 
              disabled={!isSuperAdmin}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Message</label>
            <textarea 
              value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
              placeholder="Full notification body..." rows={3} 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, resize: "vertical" }} 
              disabled={!isSuperAdmin}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff" }} disabled={!isSuperAdmin}>
                {NOTIFICATION_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Target Audience</label>
              <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff" }} disabled={!isSuperAdmin}>
                {NOTIFICATION_TARGETS.map((target) => <option key={target.value} value={target.value}>{target.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Action Link</label>
            <input value={formData.actionLink} onChange={e => setFormData({...formData, actionLink: e.target.value})} type="text" placeholder="/daily or https://..." style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }} disabled={!isSuperAdmin} />
          </div>

          {isSuperAdmin && (
            <div className="admin-v2-card-actions" style={{ justifyContent: "flex-end", marginTop: 8 }}>
              <button 
                onClick={() => setConfirming({ action: "broadcast", payload: formData })}
                disabled={!formData.title || !formData.message}
                className="admin-v2-btn-primary"
                style={{ background: "#EF4444", color: "#fff" }}
              >
                <Send size={16} /> Broadcast Now
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? <p>Loading history...</p> : (
        <div className="admin-v2-grid-premium">
          {items.map(item => (
            <div key={item.id} className="admin-v2-card">
              <div className="admin-v2-card-header">
                <div>
                  <h4 className="admin-v2-card-title">{item.title || item.campaignName || "Untitled"}</h4>
                  <p className="admin-v2-card-subtitle">{item.status || "sent"}</p>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#4B5563", marginBottom: 16 }}>
                <div><strong>Message:</strong> {item.message || item.body || "Unknown"}</div>
                <div><strong>Type:</strong> {item.type || "System"}</div>
                <div><strong>Target:</strong> {NOTIFICATION_TARGETS.find((target) => target.value === item.target)?.label || item.target || "Unknown"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
