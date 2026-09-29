/**
 * WebsitesManager — Admin panel for Website Solutions
 * Supports: title · URL · category · subcategory · Storage thumbnail · status · featured
 */
import React, { useState, useEffect, useRef } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot, where, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  handleFirestoreError, OperationType
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, AdminThumb } from "../AdminUI.jsx";
import StorageUploadField from "../components/StorageUploadField.jsx";
import CategoryManager from "../CategoryManager.jsx";
import { useCustomCategories, useCustomSubCategories } from "../../hooks/useCustomCategories.js";
import { useWebsiteCategories } from "../../hooks/useWebsiteCategories.js";
import { buildSearchFields } from "../../hooks/useSearch.js";
import { generateTags } from "../../utils/seo.js";
import { WEBSITE_CATEGORIES, getCategoryId, getWebsiteCategoryLabel, normalizeStatus } from "../../data/websiteCategories.js";
import { THUMBNAIL_DISPLAY_DEFAULTS, THUMBNAIL_PRESETS, getThumbnailImageStyle, normalizeThumbnailDisplay } from "../../utils/thumbnailDisplay.js";
import { useTranslation } from "../../i18n/index.js";
import { normalizeWebsiteCategorySlug } from "../../constants/categoryOrder.js";

const G = "#F5A623";
const G2 = "#FFD17C";

const generateSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EMPTY_FORM = {
  name: "", url: "", description: "", imageUrl: "",
  categoryId: "", category: "",
  subCategoryId: "", subcategory: "",
  sortOrder: "",
  tags: "",
  requiresVpn: false, vpnRecommended: false, adBlockRecommended: false,
  appDownloadUrl: "",
  featured: false, active: true, status: "published",
  lastCheckedAt: "",
  suggestionId: "",
  ...THUMBNAIL_DISPLAY_DEFAULTS,
};

const getQualityScore = (item) => {
  const fields = [
    item.name || item.title,
    item.url,
    item.category || item.categoryName,
    item.imageUrl || item.image,
    item.description,
    item.status,
    item.lastCheckedAt
  ];
  const valid = fields.filter(Boolean).length;
  return Math.round((valid / 7) * 100);
};

const numericSortOrder = (value, fallback = 999) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const websiteSortTime = (item) => {
  const value = item?.updatedAt || item?.createdAt || item?.lastCheckedAt;
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === "number") return value;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortWebsitesByOrder = (a, b) => {
  const orderDiff = numericSortOrder(a?.sortOrder, numericSortOrder(a?.sort_order, numericSortOrder(a?.displayOrder)))
    - numericSortOrder(b?.sortOrder, numericSortOrder(b?.sort_order, numericSortOrder(b?.displayOrder)));
  if (orderDiff !== 0) return orderDiff;
  return websiteSortTime(b) - websiteSortTime(a);
};

// ── Main component ─────────────────────────────────────
export default function WebsitesManager({ user }) {
  const { t } = useTranslation();
  const [docs,    setDocs]    = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [displayLimit, setDisplayLimit] = useState(50);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  const setF = (patch) => setForm(f => ({ ...f, ...patch }));

  useEffect(() => {
    setDisplayLimit(50);
  }, [search, filterCat]);

  // Phase 2: Custom categories from Firestore (no hardcoded lists)
  const { categories: customCats } = useWebsiteCategories(docs);
  const { subCategories: customSubs } = useCustomSubCategories("website_solution_categories", form.category, docs);

  // Legacy derived lists for backward compat (with deduplication)
  const dynamicCats = customCats.map(c => c.name);
  const dynamicSubCats = Array.from(new Set(customSubs.map(s => s.name || s).filter(Boolean)));

  useEffect(() => {
    if (!db) return;
    setFetchingDocs(true);
    let q = query(collection(db, "websites"), orderBy("sortOrder", "asc"), limit(200));
    if (user?.role === "creator") {
      q = query(collection(db, "websites"), where("ownerId", "==", user.uid), orderBy("sortOrder", "asc"), limit(200));
    }
    return onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(sortWebsitesByOrder);
      setDocs(fetched);
      if (import.meta.env.DEV) {
        console.table(fetched.map(w => ({
          title: w.title || w.name,
          category: w.category,
          categoryId: getCategoryId(w.category),
          status: w.status,
          sortOrder: w.sortOrder,
        })));
      }
      setFetchingDocs(false);
    }, err => {
      console.error("WebsitesManager Listener Error:", err);
      setFetchingDocs(false);
    });
  }, [db, user?.role, user?.uid]);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db, "websiteReports"), limit(200)), (snap) => {
      const list = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setReports(list);
    }, () => {});
  }, [db]);

  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db, "website_suggestions"), limit(200)), (snap) => {
      const list = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
      setSuggestions(list);
    }, () => {});
  }, [db]);

  const approveSuggestion = (suggestion) => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      name: suggestion.websiteName || "",
      url: suggestion.websiteUrl || "",
      category: suggestion.category || "",
      categoryId: suggestion.categoryId || getCategoryId(suggestion.category),
      description: suggestion.description || "",
      suggestionId: suggestion.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rejectSuggestion = async (id) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "website_suggestions", id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      toast_("Suggestion rejected.");
    } catch (e) {
      toast_("Failed to reject: " + e.message, "error");
    }
  };

  const markSuggestionReviewed = async (id) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "website_suggestions", id), {
        status: "reviewed",
        reviewedAt: serverTimestamp(),
      });
      toast_("Suggestion marked as reviewed.");
    } catch (e) {
      toast_("Failed to review: " + e.message, "error");
    }
  };

  const deleteSuggestion = (id) => {
    if (!db) return;
    setConfirm({
      msg: "Delete this website suggestion?",
      onConfirm: async () => {
        await deleteDoc(doc(db, "website_suggestions", id));
        setConfirm(null);
        toast_("Suggestion deleted.");
      },
      onCancel: () => setConfirm(null),
    });
  };

  const save = async () => {
    const name = (form.name || "").trim();
    const url  = (form.url  || "").trim();
    if (!name) { toast_(t("admin.nameRequired"), "error"); return; }
    if (!url)  { toast_(t("admin.urlRequired"), "error"); return; }

    if (!db) { toast_(t("admin.databaseUnavailable"), "error"); return; }
    setLoading(true);
    try {
      const categoryName = getWebsiteCategoryLabel(form.category) || "Uncategorized";
      const categoryId = normalizeWebsiteCategorySlug(categoryName);
      const categorySlug = categoryId;
      const subCategoryId = form.subCategoryId || "";
      const subCategoryName = (form.subcategory || "").trim();
      const subCategorySlug = subCategoryName ? generateSlug(subCategoryName) : "";

      const generatedSlug = generateSlug(name);
      let tagsArr = (form.tags || "").split(",").map(t => t.trim()).filter(Boolean);
      if (tagsArr.length === 0) tagsArr = generateTags(name);
      const thumbnailDisplay = normalizeThumbnailDisplay(form);
      const nextSortOrder = numericSortOrder(form.sortOrder, docs.length + 1);

      const data = {
        name,
        slug: generatedSlug,
        title: name,
        searchTitle: name.toLowerCase(),
        searchKeywords: tagsArr,
        categoryId,
        categoryName,
        category: categoryName,
        categorySlug,
        subCategoryId,
        subCategoryName,
        subcategory: subCategoryName,
        subCategory: subCategoryName, // backward compat
        subCategorySlug,
        sortOrder: nextSortOrder,
        sort_order: nextSortOrder,
        displayOrder: nextSortOrder,
        url,
        description: (form.description || "").trim(),
        imageUrl: form.imageUrl || "",
        image:    form.imageUrl || "",
        thumbnailUrl: form.imageUrl || "",
        thumbnailFit: thumbnailDisplay.thumbnailFit,
        thumbnailPosition: thumbnailDisplay.thumbnailPosition,
        thumbnailZoom: thumbnailDisplay.thumbnailZoom,
        thumbnailBg: thumbnailDisplay.thumbnailBg,
        tags: tagsArr,
        keywords: tagsArr,
        requiresVpn: !!form.requiresVpn,
        vpnRecommended: !!form.vpnRecommended,
        adBlockRecommended: !!form.adBlockRecommended,
        appDownloadUrl: (form.appDownloadUrl || "").trim(),
        featured: !!form.featured,
        active:   form.active ?? true,
        status:   normalizeStatus(form.status) || "published",
        published: normalizeStatus(form.status) === "published",
        updatedAt: serverTimestamp(),
        lastCheckedAt: form.lastCheckedAt || null,
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId   = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.sector    = "websites";
        const newWebsiteRef = await addDoc(collection(db, "websites"), data);
        setDocs(current => [{ id: newWebsiteRef.id, ...data }, ...current].sort(sortWebsitesByOrder));
        
        if (form.suggestionId) {
          await updateDoc(doc(db, "website_suggestions", form.suggestionId), {
            status: "approved",
            approvedAt: serverTimestamp(),
            convertedToWebsiteId: newWebsiteRef.id,
            updatedAt: serverTimestamp(),
          });
        }

        toast_(t("notifications.websitePublished"));
      } else {
        await updateDoc(doc(db, "websites", editing), data);
        setDocs(current => current.map(item => item.id === editing ? { ...item, ...data } : item).sort(sortWebsitesByOrder));
        toast_(t("notifications.websiteUpdated"));
      }
      setForm(EMPTY_FORM);
      setEditing(null);
    } catch (e) {
      console.error("WebsitesManager Save Error:", e);
      handleFirestoreError(e, OperationType.WRITE, "websites");
      toast_(t("admin.failedToSave", { message: e.message }), "error");
    } finally {
      setLoading(false);
    }
  };

  const del = (id) => {
    setConfirm({
      msg: "Delete this website?",
      onConfirm: async () => { await deleteDoc(doc(db, "websites", id)); setConfirm(null); toast_(t("notifications.websiteDeleted")); },
      onCancel: () => setConfirm(null),
    });
  };

  const edit = (item) => {
    setEditing(item.id);
      setForm({ 
      ...EMPTY_FORM, 
      ...item, 
      ...normalizeThumbnailDisplay(item),
      subcategory: item.subcategory || item.subCategory || "",
      imageUrl: item.imageUrl || item.thumbnailUrl || item.image || "",
      tags: (item.tags || []).join(", "),
      lastCheckedAt: item.lastCheckedAt || "",
      sortOrder: numericSortOrder(item.sortOrder, numericSortOrder(item.sort_order, numericSortOrder(item.displayOrder, ""))),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const repairLegacyStatuses = async () => {
    if (!db) return;
    const repairs = docs.filter(item => {
      const statusNeedsRepair = item.status && item.status !== normalizeStatus(item.status);
      const categoryNeedsRepair = getCategoryId(item.category) === "online-courses" && item.category === "Education";
      return statusNeedsRepair || categoryNeedsRepair;
    });
    if (!repairs.length) return toast_("All website statuses and legacy categories are already normalized.");
    setLoading(true);
    try {
      await Promise.all(repairs.map(item => {
        const nextStatus = normalizeStatus(item.status) || "published";
        const nextCategory = item.category === "Education" ? "Online Courses" : item.category;
        return updateDoc(doc(db, "websites", item.id), {
          status: nextStatus,
          published: nextStatus === "published",
          ...(item.category === "Education" ? {
            category: nextCategory,
            categoryName: nextCategory,
            categoryId: normalizeWebsiteCategorySlug(nextCategory),
            categorySlug: normalizeWebsiteCategorySlug(nextCategory),
          } : {}),
          updatedAt: serverTimestamp(),
        });
      }));
      toast_(`Repaired ${repairs.length} legacy website record${repairs.length === 1 ? "" : "s"}.`);
    } catch (error) { toast_("Could not normalize statuses: " + error.message, "error"); }
    setLoading(false);
  };

  const filtered = docs.filter(item => {
    const q = search.toLowerCase();
    const sub = item.subcategory || item.subCategory || "";
    const cat = item.category || item.categoryName || "";
    const matchSearch = !q || [(item.name||""),(item.url||""),cat,sub].some(v => v.toLowerCase().includes(q));
    const matchCat = filterCat === "All" || cat === filterCat || sub === filterCat;
    return matchSearch && matchCat;
  }).sort(sortWebsitesByOrder);

  const updateDraggedSortOrder = async (targetId) => {
    if (!db || !draggingId || draggingId === targetId) return;
    const fromIndex = filtered.findIndex(item => item.id === draggingId);
    const toIndex = filtered.findIndex(item => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...filtered];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const orderById = new Map(reordered.map((item, index) => [item.id, index + 1]));
    const changed = reordered.filter(item => numericSortOrder(item.sortOrder, numericSortOrder(item.sort_order, numericSortOrder(item.displayOrder))) !== orderById.get(item.id));

    setDocs(current => current.map(item => orderById.has(item.id)
      ? { ...item, sortOrder: orderById.get(item.id), sort_order: orderById.get(item.id), displayOrder: orderById.get(item.id) }
      : item
    ).sort(sortWebsitesByOrder));

    try {
      await Promise.all(changed.map(item => updateDoc(doc(db, "websites", item.id), {
        sortOrder: orderById.get(item.id),
        sort_order: orderById.get(item.id),
        displayOrder: orderById.get(item.id),
        updatedAt: serverTimestamp(),
      })));
      toast_(t("notifications.sortUpdated"));
    } catch (error) {
      console.error("Website drag sorting failed:", error);
      toast_("Could not update sort order: " + error.message, "error");
    }
  };

  const inputSt = {
    width: "100%", height: 44, borderRadius: 12,
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    color: "#fff", padding: "0 14px", outline: "none", fontSize: 14,
    fontFamily: "inherit",
  };
  const labelSt = { display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.4)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.08em" };
  const selSt   = { ...inputSt, appearance: "none", cursor: "pointer" };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* ── Form ── */}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.09)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 900, margin: 0 }}>
            {editing ? `✏️ ${t("admin.editWebsite")}` : `➕ ${t("admin.addWebsite")}`}
          </h3>
          {editing && (
            <button onClick={cancel} style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.55)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {t("buttons.cancelEdit")}
            </button>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={labelSt}>{t("admin.websiteName")}</label>
            <input style={inputSt} value={form.name} onChange={e => setF({ name: e.target.value })} placeholder={t("admin.exampleWebsitePlaceholder")} />
          </div>

          {/* URL */}
          <div>
            <label style={labelSt}>{t("admin.websiteUrl")}</label>
            <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
              {form.url && (
                <img 
                  src={`https://s2.googleusercontent.com/s2/favicons?domain=${(() => { try { return new URL(form.url).hostname } catch(e){return ''} })()}&sz=32`}
                  alt=""
                  style={{ position: "absolute", left: 12, width: 16, height: 16, borderRadius: 2 }}
                  onError={e => e.target.style.display='none'}
                />
              )}
              <input style={{ ...inputSt, paddingLeft: form.url ? 36 : 14 }} value={form.url} onChange={e => setF({ url: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>

          {/* Thumbnail — Storage */}
          <StorageUploadField
            label={t("admin.thumbnailImage")}
            value={form.imageUrl}
            onChange={val => setF({ imageUrl: val })}
          />

          <div style={{ display: "grid", gap: 12, padding: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.035)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{t("admin.thumbnailDisplay")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{t("admin.thumbnailDisplayHelp")}</div>
              </div>
              <button type="button" onClick={() => setF(THUMBNAIL_DISPLAY_DEFAULTS)} style={{ padding: "7px 10px", borderRadius: 10, border: `1px solid ${G}55`, background: `${G}18`, color: G, fontWeight: 800, cursor: "pointer" }}>
                {t("admin.resetThumbnailStyle")}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                ["logo", "Logo"],
                ["banner", "Banner"],
                ["screenshot", "Screenshot"],
                ["poster", "Poster"],
              ].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setF(THUMBNAIL_PRESETS[key])} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              <div>
                <label style={labelSt}>{t("admin.fitMode")}</label>
                <select style={selSt} value={normalizeThumbnailDisplay(form).thumbnailFit} onChange={e => setF({ thumbnailFit: e.target.value })}>
                  <option value="contain">{t("admin.fitContain")}</option>
                  <option value="cover">{t("admin.fitCover")}</option>
                  <option value="fill">{t("admin.fitFill")}</option>
                </select>
              </div>
              <div>
                <label style={labelSt}>{t("admin.position")}</label>
                <select style={selSt} value={normalizeThumbnailDisplay(form).thumbnailPosition} onChange={e => setF({ thumbnailPosition: e.target.value })}>
                  <option value="center">{t("admin.positionCenter")}</option>
                  <option value="top">{t("admin.positionTop")}</option>
                  <option value="bottom">{t("admin.positionBottom")}</option>
                  <option value="left">{t("admin.positionLeft")}</option>
                  <option value="right">{t("admin.positionRight")}</option>
                </select>
              </div>
              <div>
                <label style={labelSt}>{t("admin.zoom", { value: normalizeThumbnailDisplay(form).thumbnailZoom })}</label>
                <input type="range" min="70" max="140" step="5" value={normalizeThumbnailDisplay(form).thumbnailZoom} onChange={e => setF({ thumbnailZoom: Number(e.target.value) })} style={{ width: "100%", accentColor: G }} />
              </div>
              <div>
                <label style={labelSt}>{t("admin.background")}</label>
                <input style={inputSt} value={normalizeThumbnailDisplay(form).thumbnailBg} onChange={e => setF({ thumbnailBg: e.target.value })} placeholder="#f8fafc" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["White", "#ffffff"], ["Light", "#f8fafc"], ["Dark", "#0f172a"]].map(([label, color]) => (
                <button key={color} type="button" onClick={() => setF({ thumbnailBg: color })} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(normalizeThumbnailDisplay(form).thumbnailBg) ? normalizeThumbnailDisplay(form).thumbnailBg : "#f8fafc"} onChange={e => setF({ thumbnailBg: e.target.value })} style={{ width: 38, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "transparent", padding: 3 }} />
            </div>
          </div>

          {/* Category + Subcategory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelSt}>{t("admin.mainCategory")}</label>
              <select style={selSt} value={`${form.categoryId || getCategoryId(form.category)}|${getWebsiteCategoryLabel(form.category)}`} onChange={e => {
                const [id, name] = e.target.value.split('|');
                setF({ categoryId: id, category: name, subCategoryId: "", subcategory: "" });
              }}>
                <option value="|">{t("admin.selectCategory")}</option>
                {dynamicCats.map(name => {
                  const custom = customCats.find(category => getCategoryId(category.name || category) === getCategoryId(name));
                  return <option key={getCategoryId(name)} value={`${custom?.id || getCategoryId(name)}|${name}`}>{name}</option>;
                })}
              </select>
            </div>
            <div>
              <label style={labelSt}>{t("admin.subcategory")}</label>
              <input 
                style={inputSt} 
                value={form.subcategory || ""} 
                onChange={e => setF({ subcategory: e.target.value, subCategoryId: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} 
                placeholder={t("admin.typeSubcategory")} 
              />
            </div>
          </div>

          {/* Status + Featured */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelSt}>{t("admin.status")}</label>
              <select style={selSt} value={form.status} onChange={e => setF({ status: e.target.value })}>
                <option value="published">{t("admin.statusPublished")}</option>
                <option value="pending">{t("admin.statusPending")}</option>
                <option value="draft">{t("admin.statusDraft")}</option>
                <option value="rejected">{t("admin.statusRejected")}</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 22 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.featured} onChange={e => setF({ featured: e.target.checked })} style={{ width: 16, height: 16, accentColor: G }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>{t("admin.featuredPinned")}</span>
              </label>
            </div>
            <div>
              <label style={labelSt}>{t("admin.sortOrder")}</label>
              <input type="number" min="1" step="1" style={inputSt} value={form.sortOrder} onChange={e => setF({ sortOrder: e.target.value })} placeholder="1" />
            </div>
          </div>

          {/* Description (optional, admin-only) */}
          <div>
            <label style={labelSt}>{t("admin.description")}</label>
            <textarea style={{ ...inputSt, height: 70, resize: "vertical", padding: "10px 14px", lineHeight: 1.5 }} value={form.description} onChange={e => setF({ description: e.target.value })} placeholder={t("admin.internalDescriptionPlaceholder")} />
          </div>

          {/* Tags */}
          <div>
            <label style={labelSt}>{t("admin.tags")}</label>
            <input style={inputSt} value={form.tags} onChange={e => setF({ tags: e.target.value })} placeholder={t("admin.tagsPlaceholder")} />
          </div>

          {/* Last Checked At */}
          <div>
            <label style={labelSt}>{t("admin.lastCheckedAt")}</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input 
                type="date" 
                style={inputSt} 
                value={form.lastCheckedAt ? new Date(form.lastCheckedAt).toISOString().split('T')[0] : ""} 
                onChange={e => setF({ lastCheckedAt: e.target.value ? new Date(e.target.value).getTime() : "" })} 
              />
              <button 
                type="button" 
                onClick={() => setF({ lastCheckedAt: Date.now() })}
                style={{
                  padding: "0 16px", borderRadius: 12, border: "none",
                  background: G, color: "#111", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {t("admin.markCheckedToday")}
              </button>
            </div>
          </div>

          <div>
            <label style={labelSt}>{t("admin.appDownloadUrl")}</label>
            <input style={inputSt} value={form.appDownloadUrl || ""} onChange={e => setF({ appDownloadUrl:e.target.value })} placeholder={t("admin.optionalAppLink")} />
          </div>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            {[['requiresVpn','VPN required'],['vpnRecommended','VPN recommended'],['adBlockRecommended','AdBlock recommended']].map(([key,label]) => <label key={key} style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:"rgba(255,255,255,.75)", cursor:"pointer" }}><input type="checkbox" checked={!!form[key]} onChange={e => setF({ [key]:e.target.checked })} />{label}</label>)}
          </div>

          {/* Card preview */}
          {(form.imageUrl || form.name) && (
            <div>
              <label style={labelSt}>{t("admin.cardPreview")}</label>
              <div style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,.09)", background: "#fff", maxWidth: 320, overflow: "hidden", boxShadow: "0 4px 14px rgba(15,23,42,0.18)" }}>
                <div style={{ overflow: "hidden", aspectRatio: "16/10", minHeight: 180, position: "relative", background: getThumbnailImageStyle(form).wrapper.background, borderBottom: "1px solid #E5E7EB" }}>
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", display: "block", ...getThumbnailImageStyle(form).image }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 14, color: "#94A3B8" }}>{t("admin.noThumbnail")}</div>
                  )}
                </div>
                <div style={{ minHeight: 54, padding: "10px 12px", display: "flex", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.name || "Website Name"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <button onClick={save} disabled={loading} style={{
            height: 50, borderRadius: 14, border: "none",
            background: loading ? "rgba(245,166,35,.5)" : `linear-gradient(135deg,${G},${G2})`,
            color: "#111", fontWeight: 900, fontSize: 15, cursor: loading ? "default" : "pointer",
            boxShadow: loading ? "none" : `0 6px 22px ${G}35`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? "Saving..." : editing ? `💾 ${t("buttons.saveChanges")}` : `🚀 ${t("buttons.publishWebsite")}`}
          </button>
        </div>
      </div>

      {/* ── Manage Categories (Phase 2) ── */}
      <details style={{ marginBottom: 20 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 800, color: G, padding: "10px 0", userSelect: "none" }}>
          ⚙️ {t("admin.manageCategories")}
        </summary>
        <div style={{ marginTop: 10 }}>
          <CategoryManager categoryCollection="website_solution_categories" label="Website Solution Categories" />
        </div>
      </details>

      <button onClick={repairLegacyStatuses} disabled={loading} style={{ marginBottom:20, padding:"9px 13px", borderRadius:10, border:"1px solid rgba(245,166,35,.35)", background:"rgba(245,166,35,.1)", color:G, fontWeight:800, fontSize:12, cursor:"pointer" }}>
          Repair legacy website statuses/categories
      </button>

      <section style={{ marginBottom: 24, display: "flex", gap: 10 }}>
        <button onClick={() => { setShowSuggestions(false); setShowReports(value => !value); }} style={{ padding:"10px 14px", borderRadius:10, border:`1px solid ${G}45`, background: showReports ? `${G}20` : "rgba(255,255,255,.04)", color:showReports ? G : "#fff", fontWeight:800, cursor:"pointer" }}>
          {t("admin.reports")} {reports.filter(report => report.status === "pending").length ? `(${reports.filter(report => report.status === "pending").length})` : ""}
        </button>
        <button onClick={() => { setShowReports(false); setShowSuggestions(value => !value); }} style={{ padding:"10px 14px", borderRadius:10, border:`1px solid ${G}45`, background: showSuggestions ? `${G}20` : "rgba(255,255,255,.04)", color:showSuggestions ? G : "#fff", fontWeight:800, cursor:"pointer" }}>
          {t("admin.suggestions")} {suggestions.filter(s => s.status === "pending").length ? `(${suggestions.filter(s => s.status === "pending").length})` : ""}
        </button>
      </section>

      {showReports && (
        <div style={{ marginBottom: 24, display:"grid", gap:8 }}>
          {reports.length ? reports.map(report => (
            <div key={report.id} style={{ padding:14, borderRadius:12, background:"#141823", border:"1px solid rgba(255,255,255,.08)", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <strong>{report.websiteTitle}</strong>
                <div style={{ fontSize:11, opacity:.55, overflow:"hidden", textOverflow:"ellipsis" }}>{report.websiteUrl}</div>
                <div style={{ fontSize:11, color:G }}>
                  {report.reason} · {report.createdAt?.toDate?.().toLocaleDateString?.() || "Recently"} · {report.status || "pending"}
                </div>
              </div>
              <button onClick={() => updateDoc(doc(db, "websiteReports", report.id), { status:"reviewed", reviewedAt:serverTimestamp() })} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer" }}>{t("buttons.markReviewed")}</button>
              <button onClick={() => updateDoc(doc(db, "websiteReports", report.id), { status:"fixed", fixedAt:serverTimestamp() })} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer" }}>{t("buttons.markFixed")}</button>
              <button onClick={() => window.open(report.websiteUrl, "_blank", "noopener,noreferrer")} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer" }}>{t("buttons.open")}</button>
              <button onClick={() => { const website = docs.find(item => item.id === report.websiteId); if (website) edit(website); }} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer" }}>{t("buttons.edit")}</button>
            </div>
          )) : <div style={{ padding:20, color:"rgba(255,255,255,.45)" }}>{t("admin.noReports")}</div>}
        </div>
      )}

      {showSuggestions && (
        <div style={{ marginBottom: 24, display:"grid", gap:8 }}>
          {suggestions.length ? suggestions.map(item => (
            <div key={item.id} style={{ padding:14, borderRadius:12, background:"#141823", border:`1px solid ${item.status === "pending" ? "rgba(245,166,35,.2)" : "rgba(255,255,255,.08)"}`, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <strong>{item.websiteName}</strong>
                <div style={{ fontSize:11, opacity:.55, overflow:"hidden", textOverflow:"ellipsis" }}>{item.websiteUrl}</div>
                <div style={{ fontSize:11, color:G, marginTop: 4 }}>
                  Category: {item.category} · Status: {item.status || "pending"}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.62)", marginTop: 4 }}>
                  Description: {item.description || "None"}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.48)", marginTop: 4 }}>
                  Reason: {item.reason || "None"}
                </div>
                <div style={{ fontSize:10, opacity:.35, marginTop: 4 }}>
                  Suggested by: {item.suggestedByName || item.submittedByName || "Guest"} ({item.suggestedByEmail || item.submittedByEmail || "No email"}) · {item.createdAt?.toDate?.().toLocaleDateString?.() || "Recently"}
                  {item.convertedToWebsiteId ? ` · Converted: ${item.convertedToWebsiteId}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => window.open(item.websiteUrl, "_blank", "noopener,noreferrer")} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer", background: "#3b82f6", color: "#fff", fontWeight: 700 }}>{t("buttons.open")}</button>
                {item.status === "pending" && (
                  <>
                    <button onClick={() => approveSuggestion(item)} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer", background: "#22c55e", color: "#fff", fontWeight: 700 }}>{t("buttons.convertToWebsite")}</button>
                    <button onClick={() => rejectSuggestion(item.id)} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer", background: "#ef4444", color: "#fff", fontWeight: 700 }}>{t("buttons.reject")}</button>
                  </>
                )}
                {item.status !== "reviewed" && item.status !== "approved" && item.status !== "rejected" && (
                  <button onClick={() => markSuggestionReviewed(item.id)} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700 }}>{t("buttons.markReviewed")}</button>
                )}
                <button onClick={() => deleteSuggestion(item.id)} style={{ padding:"7px 10px", borderRadius:8, border:0, cursor:"pointer", background: "rgba(239,68,68,.14)", color: "#fecaca", fontWeight: 700 }}>{t("buttons.delete")}</button>
              </div>
            </div>
          )) : <div style={{ padding:20, color:"rgba(255,255,255,.45)" }}>{t("admin.noSuggestions")}</div>}
        </div>
      )}

      {/* ── List filters + search ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("admin.searchWebsites")} style={{ ...inputSt, paddingLeft: 38, width: "100%", boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }}>🔍</span>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selSt, width: "auto", flex: "0 0 auto" }}>
          <option value="All">{t("admin.allCategories")}</option>
          {dynamicCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Document list ── */}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        {t("admin.websiteCount", { count: filtered.length, plural: filtered.length !== 1 ? "s" : "" })}
      </div>
      {fetchingDocs && !docs.length ? (
        <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.4)", border: "1px dashed rgba(255,255,255,.08)", borderRadius: 16 }}>
          {t("admin.loadingWebsites")}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.slice(0, displayLimit).map(item => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggingId(item.id)}
              onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); updateDraggedSortOrder(item.id); }}
              onDragEnd={() => setDraggingId(null)}
              style={{ borderRadius: 14, border: `1px solid ${item.status === "published" ? "rgba(255,255,255,.07)" : "rgba(245,166,35,.15)"}`, background: draggingId === item.id ? "#22263a" : "#1a1d2e", padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "grab" }}
            >
              <div style={{ color: G, fontWeight: 900, fontSize: 12, minWidth: 32, textAlign: "center" }}>
                #{numericSortOrder(item.sortOrder, numericSortOrder(item.sort_order, numericSortOrder(item.displayOrder)))}
              </div>
              {/* Thumb */}
              <div style={{ width: 72, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0d0f1a", border: "1px solid rgba(255,255,255,.08)" }}>
                {(item.thumbnailUrl || item.imageUrl || item.image)
                   ? <img className="no-invert" src={item.thumbnailUrl || item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", display: "block", background: getThumbnailImageStyle(item).wrapper.background, ...getThumbnailImageStyle(item).image }} referrerPolicy="no-referrer" onError={e => e.target.style.display="none"} />
                   : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 18, opacity: .2 }}>🌐</div>
                }
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || item.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.38)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "1px 7px", borderRadius: 4, background: "rgba(255,255,255,.06)", fontWeight: 700 }}>{item.category || item.categoryName}</span>
                  {(item.subcategory || item.subCategory) && (
                    <span style={{ padding: "1px 7px", borderRadius: 4, background: "rgba(245,166,35,.1)", color: G, fontWeight: 700 }}>
                      {item.subcategory || item.subCategory}
                    </span>
                  )}
                  <span style={{ color: item.status === "published" ? "#4ade80" : G, fontWeight: 700, textTransform: "uppercase" }}>{item.status}</span>
                  {item.featured && <span style={{ color: G, fontWeight: 800 }}>★ Featured</span>}
                  <span style={{ color: getQualityScore(item) >= 80 ? "#4ade80" : "#f87171", fontWeight: 800 }}>
                    {t("admin.quality", { score: getQualityScore(item) })}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                <button onClick={() => edit(item)} style={{ padding: "7px 12px", borderRadius: 10, background: `${G}12`, border: `1px solid ${G}25`, color: G, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{t("buttons.edit")}</button>
                <button onClick={() => del(item.id)} style={{ padding: "7px 12px", borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#fca5a5", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{t("buttons.delete")}</button>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ textAlign: "center", padding: "48px 20px", borderRadius: 16, border: "1px dashed rgba(255,255,255,.08)", color: "rgba(255,255,255,.3)", fontSize: 14 }}>
              {search ? t("admin.noMatchingWebsites", { query: search }) : t("admin.noWebsitesYet")}
            </div>
          )}
          {filtered.length > displayLimit && (
            <button
               onClick={() => setDisplayLimit(d => d + 50)}
               style={{
                 marginTop: 10, padding: 14, borderRadius: 12, border: "1px dashed rgba(255,255,255,.15)", background: "transparent",
                 color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer", width: "100%"
               }}
            >
              Show More ({filtered.length - displayLimit} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
