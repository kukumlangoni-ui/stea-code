import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog } from "../AdminUI.jsx";

const G = "#F5A623";

export default function FAQManager() {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ question: "", answer: "", category: "General", order: 0, isActive: true });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "faqs"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.question || !form.answer) return toast_("Jaza swali na jibu!", "error");
    setLoading(true);
    try {
      const data = { ...form, order: Number(form.order) };
      if (editing) {
        await updateDoc(doc(db, "faqs", editing), { ...data, updatedAt: serverTimestamp() });
        toast_("FAQ imebadilishwa");
      } else {
        await addDoc(collection(db, "faqs"), { ...data, createdAt: serverTimestamp() });
        toast_("FAQ mpya imeongezwa");
      }
      setForm({ question: "", answer: "", category: "General", order: faqs.length + 1, isActive: true });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "faqs");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta FAQ hii?", onConfirm: async () => { await deleteDoc(doc(db, "faqs", id)); setConfirm(null); toast_("FAQ imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      
      <div style={{ background: "rgba(255,255,255,.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,.05)", marginBottom: 24 }}>
        <h4 style={{ margin: "0 0 16px", fontSize: 16 }}>{editing ? "✏️ Edit FAQ" : "➕ Add New FAQ"}</h4>
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Question"><Input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Nitaanzaje?" /></Field>
          <Field label="Answer"><Textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Maelezo..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            <Field label="Category"><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="General" /></Field>
            <Field label="Order"><Input type="number" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })} /></Field>
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Saving..." : editing ? "Update FAQ" : "Add FAQ"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {faqs.map(f => (
          <div key={f.id} style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.05)", background: "rgba(255,255,255,.02)", padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: f.isActive ? `${G}20` : "rgba(239,68,68,.1)", color: f.isActive ? G : "#fca5a5", display: "grid", placeItems: "center", fontWeight: 800 }}>{f.order}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{f.question}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{f.category}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditing(f.id); setForm(f); }} style={{ background: "transparent", border: "none", color: G, cursor: "pointer" }}>✏️</button>
              <button onClick={() => del(f.id)} style={{ background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer" }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
