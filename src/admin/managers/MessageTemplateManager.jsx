import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast } from "../AdminUI.jsx";

const G = "#F5A623";

export default function MessageTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: "", content: "" });
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "message_templates"), (snap) => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading templates:", err));
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.name.trim() || !form.content.trim()) { toast_("Jaza sehemu zote", "error"); return; }
    try {
      if (editing) {
        const updateData = { ...form, updatedAt: serverTimestamp() };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db, "message_templates", editing), updateData);
        toast_("Imesahihishwa!");
      } else {
        await addDoc(collection(db, "message_templates"), { ...form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        toast_("Imewekwa!");
      }
      setForm({ name: "", content: "" });
      setEditing(null);
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kuhifadhi!", "error");
    }
  };

  const del = async (id) => {
    try {
      await deleteDoc(doc(db, "message_templates", id));
      toast_("Imefutwa!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kufuta!", "error");
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>{editing ? "✏️ Hariri Template" : "➕ Template Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Jina la Template"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Content"><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></Field>
          <Btn onClick={save} color={G} textColor="#111">{editing ? "Hifadhi Mabadiliko" : "Ongeza Template"}</Btn>
        </div>
      </div>
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Templates Zilizopo</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {templates.map(t => (
          <div key={t.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{t.content.substring(0, 50)}...</div>
            </div>
            <Btn onClick={() => { setEditing(t.id); setForm({ name: t.name, content: t.content }); }} color="rgba(255,255,255,.1)" textColor="#fff" style={{ padding: "8px 14px" }}>✏️</Btn>
            <Btn onClick={() => del(t.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
