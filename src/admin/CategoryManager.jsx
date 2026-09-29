/**
 * CategoryManager — Phase 2+3
 * Reusable panel for admin to create/edit/delete custom categories + subcategories.
 * Used by WebsitesManager, CoursesManager, PromptsManager.
 */
import React, { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, onSnapshot, addDoc, updateDoc, setDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy, limit, where, getDocs,
} from "../firebase.js";
import { formatCategoryName, getCategoryId, getCategoryIconAndDescription } from "../data/websiteCategories.js";
import { invalidateWebsiteCategoriesCache } from "../hooks/useWebsiteCategories.js";
import { useTranslation } from "../i18n/index.js";
import { getDefaultCategorySortOrder, normalizeCategorySlugForOrder, sortWebsiteCategories } from "../constants/categoryOrder.js";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,.08)";
const iSt = {
  height: 40, borderRadius: 9, background: "rgba(255,255,255,.05)",
  border: `1px solid ${BORDER}`, color: "#fff", padding: "0 12px",
  fontFamily: "inherit", fontSize: 13, outline: "none",
  width: "100%", boxSizing: "border-box",
};
const lSt = {
  fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.4)",
  textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block",
};

function numericSortOrder(value, fallback = 999) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortCategories(a, b) {
  if (a?.__websiteCategory || b?.__websiteCategory) {
    return sortWebsiteCategories([a, b])[0] === a ? -1 : 1;
  }
  const orderDiff = numericSortOrder(a?.sortOrder, numericSortOrder(a?.sort_order, numericSortOrder(a?.displayOrder)))
    - numericSortOrder(b?.sortOrder, numericSortOrder(b?.sort_order, numericSortOrder(b?.displayOrder)));
  if (orderDiff !== 0) return orderDiff;
  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

function CategoryRow({ cat, onEdit, onDelete }) {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,.03)", borderRadius: 8, border: `1px solid ${BORDER}` }}>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff" }}>{cat.name}</span>
      <span style={{ fontSize: 11, color: G, fontWeight: 800 }}>#{numericSortOrder(cat.sortOrder, numericSortOrder(cat.sort_order, numericSortOrder(cat.displayOrder)))}</span>
      {cat.description && <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{cat.description}</span>}
      <button onClick={() => onEdit(cat)} style={{ background: "none", border: "none", color: "#60a5fa", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t("buttons.edit")}</button>
      <button onClick={() => onDelete(cat)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t("buttons.delete")}</button>
    </div>
  );
}

function CategoryForm({ initial, onSave, onCancel, parentOptions = [] }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [sortOrder, setSortOrder] = useState(numericSortOrder(initial?.sortOrder, numericSortOrder(initial?.sort_order, numericSortOrder(initial?.displayOrder, ""))));
  const [parentCategory, setParentCategory] = useState(initial?.parentCategory || "");
  const [error, setError] = useState("");

  const save = async () => {
    const displayName = formatCategoryName(name);
    if (!displayName) return;
    setError("");
    try {
      await onSave({
        name: displayName,
        slug: getCategoryId(displayName),
        icon: getCategoryIconAndDescription(displayName).icon,
        description: description.trim() || getCategoryIconAndDescription(displayName).description,
        sortOrder: numericSortOrder(sortOrder, 999),
        sort_order: numericSortOrder(sortOrder, 999),
        displayOrder: numericSortOrder(sortOrder, 999),
        parentCategory: parentCategory || null,
        status: "active",
      });
    } catch (err) {
      setError(err?.message || "Could not save category.");
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${G}30`, borderRadius: 12, padding: 14, display: "grid", gap: 10 }}>
      {error && (
        <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 12, fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div>
        <label style={lSt}>{t("admin.websiteName")}</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={t("admin.exampleCategoryPlaceholder")} style={iSt} autoFocus />
      </div>
      <div>
        <label style={lSt}>{t("admin.description")}</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={iSt} />
      </div>
      <div>
        <label style={lSt}>{t("admin.sortOrder")}</label>
        <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} min="1" step="1" style={iSt} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={!name.trim()} style={{ flex: 1, height: 36, borderRadius: 8, border: "none", background: G, color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: !name.trim() ? 0.5 : 1 }}>
          {initial ? t("buttons.update") : t("buttons.add")}
        </button>
        <button onClick={onCancel} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer" }}>{t("buttons.cancel")}</button>
      </div>
    </div>
  );
}

export default function CategoryManager({ categoryCollection, label = "Categories" }) {
  const { t } = useTranslation();
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const db = getFirebaseDb();
  const isWebsiteCategoryCollection = categoryCollection === "website_solution_categories";

  useEffect(() => {
    if (!db || !categoryCollection) return;
    const unsub = onSnapshot(
      query(collection(db, categoryCollection), orderBy("sortOrder", "asc"), limit(300)),
      snap => {
        const nextCats = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          __websiteCategory: isWebsiteCategoryCollection,
        }));
        setCats(isWebsiteCategoryCollection ? sortWebsiteCategories(nextCats) : nextCats.sort(sortCategories));
      },
      err => console.warn("CategoryManager:", err.message)
    );
    return () => unsub();
  }, [db, categoryCollection, isWebsiteCategoryCollection]);

  const topLevel = isWebsiteCategoryCollection
    ? sortWebsiteCategories(cats.filter(c => !c.parentCategory))
    : cats.filter(c => !c.parentCategory).sort(sortCategories);
  const subCats  = cats.filter(c => !!c.parentCategory).sort(sortCategories);

  const handleSave = async (data) => {
    if (!db) return;
    try {
      const slug = getCategoryId(data.slug || data.name);
      const normalizedName = formatCategoryName(data.name || slug);
      const existingSnap = await getDocs(query(collection(db, categoryCollection), where("slug", "==", slug), limit(20)));
      const existing = existingSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const useCanonicalSlugId = categoryCollection === "website_solution_categories";
      const target = editing?.id
        ? existing.find((item) => item.id === editing.id) || { id: editing.id }
        : existing[0];
      const payload = {
        ...data,
        name: normalizedName,
        slug,
        icon: data.icon || getCategoryIconAndDescription(normalizedName).icon,
        description: data.description || getCategoryIconAndDescription(normalizedName).description,
        updatedAt: serverTimestamp(),
      };
      if (useCanonicalSlugId) {
        await setDoc(doc(db, categoryCollection, slug), {
          ...payload,
          createdAt: existing.find((item) => item.id === slug)?.createdAt || target?.createdAt || serverTimestamp(),
        }, { merge: true });
      } else if (target?.id) {
        await updateDoc(doc(db, categoryCollection, target.id), payload);
      } else {
        await addDoc(collection(db, categoryCollection), { ...payload, createdAt: serverTimestamp() });
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? This won't delete existing posts using it.`)) return;
    try { await deleteDoc(doc(db, categoryCollection, cat.id)); } catch (e) { console.error(e); }
  };

  const resetDefaultWebsiteOrder = async () => {
    if (!db || !isWebsiteCategoryCollection) return;
    if (!window.confirm("Reset website categories to the default STEA order?")) return;
    try {
      await Promise.all(cats.map((cat) => {
        const slug = normalizeCategorySlugForOrder(cat.slug || cat.id || cat.name);
        const sortOrder = getDefaultCategorySortOrder(slug);
        return updateDoc(doc(db, "website_solution_categories", cat.id), {
          slug,
          sortOrder,
          updatedAt: serverTimestamp(),
        });
      }));
      invalidateWebsiteCategoriesCache();
    } catch (error) {
      console.error("Reset website category order failed:", error);
      alert(`Could not reset default order: ${error.message}`);
    }
  };

  return (
    <div style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{label}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginLeft: 8 }}>{cats.length} total</span>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} style={{ background: `${G}18`, border: `1px solid ${G}30`, color: G, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          + {t("buttons.add")}
        </button>
        {isWebsiteCategoryCollection && cats.length > 0 && (
          <button onClick={resetDefaultWebsiteOrder} style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.35)", color: "#fecaca", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
            Reset Default Order
          </button>
        )}
      </div>

      {(showForm || editing) && (
        <div style={{ marginBottom: 12 }}>
          <CategoryForm
            key={editing?.id || "new-category"}
            initial={editing}
            parentOptions={topLevel}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {cats.length === 0 && !showForm && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", margin: "12px 0" }}>{t("empty.noWebsitesYet")}</p>
      )}

      {cats.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {(isWebsiteCategoryCollection ? sortWebsiteCategories(cats) : cats).map(cat => (
            <CategoryRow key={cat.id} cat={cat} onEdit={c => { setEditing(c); setShowForm(false); }} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
