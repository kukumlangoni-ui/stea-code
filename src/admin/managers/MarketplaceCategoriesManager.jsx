import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, doc, onSnapshot, setDoc, serverTimestamp 
} from "../../firebase.js";
import { Btn, Toast } from "../AdminUI.jsx";
import { MARKET_CATEGORIES } from "../../constants/marketplace.js";

const G = "#F5A623";

export default function MarketplaceCategoriesManager() {
  const [extraSubcategories, setExtraSubcategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "site_settings", "marketplace_extra"), (snap) => {
      if (snap.exists()) {
        setExtraSubcategories(snap.data().subcategories || {});
      }
    });
    return () => unsub();
  }, [db]);

  const addSubcategory = (catId) => {
    const newSub = prompt(`Add new subcategory for ${MARKET_CATEGORIES[catId]?.label}:`);
    if (newSub && newSub.trim()) {
      setExtraSubcategories(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), newSub.trim()]
      }));
    }
  };

  const removeSubcategory = (catId, index) => {
    setExtraSubcategories(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "site_settings", "marketplace_extra"), {
        subcategories: extraSubcategories,
        updatedAt: serverTimestamp()
      });
      showToast("Categories saved dynamically!");
    } catch (e) {
      console.error(e);
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: "#fff" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ background: "#141823", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", padding: 24 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, marginBottom: 20, color: G }}>
          Dynamic Categories & Types
        </h3>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, marginBottom: 24 }}>
          Add custom subcategories that will appear in the checkout forms and marketplace filters.
        </p>

        <div style={{ display: "grid", gap: 32 }}>
          {Object.values(MARKET_CATEGORIES).map(cat => (
            <section key={cat.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{cat.emoji} {cat.label}</h4>
                <button onClick={() => addSubcategory(cat.id)} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: G, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Add New</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(cat.subcategories || []).map(s => (
                  <span key={s} style={{ padding: "6px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,.4)" }}>{s} (System)</span>
                ))}
                {(extraSubcategories[cat.id] || []).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(245, 166, 35, 0.1)", border: "1px solid rgba(245, 166, 35, 0.2)", borderRadius: 8, fontSize: 13, color: G }}>
                    <span>{s}</span>
                    <button onClick={() => removeSubcategory(cat.id, i)} style={{ border: "none", background: "none", color: "#ff4444", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Btn onClick={handleSave} disabled={loading} style={{ marginTop: 32, width: "100%" }}>
          {loading ? "Saving..." : "💾 Save Custom Categories"}
        </Btn>
      </div>
    </div>
  );
}
