import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField } from "../AdminUI.jsx";

const G = "#F5A623";

export default function CourseResourceManager({ mode = "courses", user }) {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState(mode === "courses" ? {
    title: "", description: "", imageUrl: "", badge: "Skill",
    level: "Beginner", duration: "", lessonsCount: 0, price: 0,
    teacherName: user?.displayName || "", teacherImage: user?.photoURL || "",
    category: "Programming", status: "published"
  } : {
    title: "", description: "", imageUrl: "", type: "PDF",
    price: 0, authorName: user?.displayName || "",
    category: "Guide", downloads: 0, status: "published"
  });
  
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm] = useState(null);

  const db = getFirebaseDb();
  const collectionName = mode;
  
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, collectionName), limit(100));
    if (user?.role === "creator") {
      q = query(collection(db, collectionName), where("ownerId", "==", user.uid), limit(100));
    }
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, collectionName, user]);

  const save = async () => {
    if (!form.title.trim()) return toast_("Title is required", "error");
    setLoading(true);
    try {
      const data = { 
        ...form, 
        updatedAt: serverTimestamp(),
        price: Number(form.price) || 0
      };
      if (mode === "courses") data.lessonsCount = Number(form.lessonsCount) || 0;

      if (!editing) {
        data.ownerId = user?.uid || "admin";
        data.createdAt = serverTimestamp();
      }

      if (editing) {
        await updateDoc(doc(db, collectionName, editing), data);
        toast_("Updated successfully!");
      } else {
        await addDoc(collection(db, collectionName), data);
        toast_("Created successfully!");
      }
      
      setEditing(null);
      setForm(mode === "courses" ? {
        title: "", description: "", imageUrl: "", badge: "Skill",
        level: "Beginner", duration: "", lessonsCount: 0, price: 0,
        teacherName: user?.displayName || "", teacherImage: user?.photoURL || "",
        category: "Programming", status: "published"
      } : {
        title: "", description: "", imageUrl: "", type: "PDF",
        price: 0, authorName: user?.displayName || "",
        category: "Guide", downloads: 0, status: "published"
      });
    } catch (e) {
      console.error(e);
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      <div style={{ background: "#141823", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", marginBottom: 30 }}>
        <h3 style={{ fontSize: 20, margin: "0 0 20px", fontWeight: 800 }}>
          {editing ? `Edit ${mode.slice(0, -1)}` : `Add New ${mode.slice(0, -1)}`}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Thumbnail URL"><ImageUploadField value={form.imageUrl} onChange={val => setForm({ ...form, imageUrl: val })} /></Field>
        </div>

        <Field label="Description"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} /></Field>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <Field label="Category"><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Price (TZS)"><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
          {mode === "courses" ? (
             <>
               <Field label="Level"><Input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} /></Field>
               <Field label="Lessons"><Input type="number" value={form.lessonsCount} onChange={e => setForm({ ...form, lessonsCount: e.target.value })} /></Field>
             </>
          ) : (
             <>
               <Field label="Resource Type (e.g. PDF)"><Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} /></Field>
               <Field label="Author"><Input value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })} /></Field>
             </>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <Btn onClick={save} disabled={loading}>{loading ? "Saving..." : "Save Content"}</Btn>
          {editing && <Btn onClick={() => setEditing(null)} color="transparent">Cancel</Btn>}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.map(item => (
          <div key={item.id} style={{ background: "#1a1d2e", padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
               <img src={item.imageUrl} style={{ width: 60, height: 40, borderRadius: 8, objectFit: "cover" }} />
               <div>
                 <div style={{ fontWeight: 800 }}>{item.title}</div>
                 <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{item.category} • {item.price} TZS</div>
               </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
               <Btn onClick={() => { setEditing(item.id); setForm(item); }} color="rgba(245,166,35,.1)" textColor={G} style={{ padding: 10 }}>Edit</Btn>
               <Btn onClick={async () => {
                 if (window.confirm("Delete?")) {
                   await deleteDoc(doc(db, collectionName, item.id));
                 }
               }} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: 10 }}>Del</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
