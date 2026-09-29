import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, StorageMediaField, AdminThumb } from "../AdminUI.jsx";

const G = "#F5A623";

export default function SponsoredAdsManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ 
    title: "", description: "", imageUrl: "", ctaText: "", ctaUrl: "", 
    badge: "Sponsored", active: true, featured: false, category: "ads", adType: "banner"
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "sponsored_ads"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "sponsored_ads"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading ads:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    if (!form.title) return toast_("Weka title kwanza", "error");
    setLoading(true);
    try {
      const isSuperOrAdmin = ["super_admin", "admin"].includes(user?.role);
      const canDirect = isSuperOrAdmin || !!user?.canPublishDirect;

      let finalStatus = form.status;
      if (!finalStatus) {
        if (editing && form.status) {
          finalStatus = form.status;
        } else {
          // If no status is set via the dropdown, default to active for admins, pending for others
          finalStatus = canDirect ? "active" : "pending_review";
        }
      }

      const data = { 
        ...form,
        title: form.title || "",
        description: form.description || "",
        image: form.imageUrl || form.image || "",
        active: finalStatus === "active",
        published: finalStatus === "active",
        status: finalStatus,
        adType: form.adType || "banner",
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "sponsored_ads";
      } else {
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;
        delete data.id;
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) data[key] = "";
      });

      if (editing) {
        await updateDoc(doc(db, "sponsored_ads", editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db, "sponsored_ads"), data); 
        toast_("Ad imewekwa live!"); 
      }
      setForm({ title: "", description: "", imageUrl: "", ctaText: "", ctaUrl: "", badge: "Sponsored", active: true, featured: false, category: "ads", adType: "banner" });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "sponsored_ads");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta ad hii?", onConfirm: async () => { await deleteDoc(doc(db, "sponsored_ads", id)); setConfirm(null); toast_("Ad imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>{editing ? "✏️ Hariri Ad" : "➕ Ongeza Ad Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Ad Title *"><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Special Offer" /></Field>
          <StorageMediaField label="Ad Media URL (Image or Video)" value={form.imageUrl} onChange={(val, type) => setForm(f => ({ ...f, imageUrl: val, mediaType: type || "image" }))} />
          <Field label="Description"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ad details..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="CTA Text"><Input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="Learn More" /></Field>
            <Field label="CTA URL"><Input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} placeholder="https://..." /></Field>
            <Field label="Ad Type">
              <Select value={form.adType} onChange={e => setForm(f => ({ ...f, adType: e.target.value }))}>
                <option value="banner">Banner</option>
                <option value="inline">Inline</option>
                <option value="popup">Popup</option>
              </Select>
            </Field>
            
            {(["super_admin", "admin", "manager", "reviewer"].includes(user?.role)) && (
              <Field label="Status">
                <Select value={form.status || (editing && form.status ? form.status : (["super_admin", "admin"].includes(user?.role) ? "active" : "pending_review"))} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active (Live)</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            )}
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <AdminThumb src={item.imageUrl} fallback="📢" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.ctaText} • {item.ctaUrl}</div>
              <div style={{ fontSize: 11, color: item.status === 'active' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status}</div>
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
