
import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, onSnapshot, addDoc, 
  deleteDoc, doc, serverTimestamp, query, orderBy 
} from "../../firebase.js";
import { Btn, Field, Input, Toast, ConfirmDialog } from "../AdminUI.jsx";

export default function CategoryManagement({ typeLabel, categoryCol, subcategoryCol }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const q1 = query(collection(db, categoryCol), orderBy("order", "asc"));
    const unsub1 = onSnapshot(q1, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const q2 = query(collection(db, subcategoryCol), orderBy("order", "asc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setSubcategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, [db, categoryCol, subcategoryCol]);

  const addCategory = async () => {
    if (!catName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, categoryCol), {
        name: catName.trim(),
        slug: catName.trim().toLowerCase().replace(/\s+/g, '-'),
        order: categories.length,
        createdAt: serverTimestamp()
      });
      setCatName("");
      toast_("Category added");
    } catch (e) { toast_(e.message, "error"); }
    setLoading(false);
  };

  const addSubcategory = async () => {
    if (!subName.trim() || !selectedCat) return;
    setLoading(true);
    try {
      await addDoc(collection(db, subcategoryCol), {
        name: subName.trim(),
        slug: subName.trim().toLowerCase().replace(/\s+/g, '-'),
        categoryId: selectedCat,
        order: subcategories.filter(s => s.categoryId === selectedCat).length,
        createdAt: serverTimestamp()
      });
      setSubName("");
      toast_("Subcategory added");
    } catch (e) { toast_(e.message, "error"); }
    setLoading(false);
  };

  const deleteCat = (id) => {
    setConfirm({
      msg: "Delete this category and its subcategories?",
      onConfirm: async () => {
        await deleteDoc(doc(db, categoryCol, id));
        // Also delete subcats
        const toDelete = subcategories.filter(s => s.categoryId === id);
        for (const s of toDelete) {
          await deleteDoc(doc(db, subcategoryCol, s.id));
        }
        setConfirm(null);
        toast_("Category deleted");
      }
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 20, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      
      {/* Categories */}
      <div>
        <h4 style={{ margin: "0 0 16px", fontSize: 16 }}>Manage {typeLabel} Categories</h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="New Category Name..." />
          <Btn onClick={addCategory} disabled={loading}>Add</Btn>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {categories.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
              <span>{c.name}</span>
              <button onClick={() => deleteCat(c.id)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      <div>
        <h4 style={{ margin: "0 0 16px", fontSize: 16 }}>Manage {typeLabel} Subcategories</h4>
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          <select 
            value={selectedCat} 
            onChange={e => setSelectedCat(e.target.value)}
            style={{ width: "100%", height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
          >
            <option value="">Select Category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="New Subcategory..." />
            <Btn onClick={addSubcategory} disabled={loading || !selectedCat}>Add</Btn>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {subcategories.filter(s => !selectedCat || s.categoryId === selectedCat).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
              <span style={{ fontSize: 13 }}>{s.name} <span style={{ opacity: 0.3, fontSize: 11 }}>({categories.find(c => c.id === s.categoryId)?.name})</span></span>
              <button onClick={async () => await deleteDoc(doc(db, subcategoryCol, s.id))} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
