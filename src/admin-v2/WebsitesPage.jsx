import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AlertTriangle, ShieldAlert, Star, Edit, Trash2, Globe, Search, Plus, Image as ImageIcon, CheckCircle, X, Loader2 } from "lucide-react";
import { collection, getDocs, getFirebaseDb, query, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp, orderBy, limit, onSnapshot, where, writeBatch } from "../firebase.js";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { invalidateWebsiteCategoriesCache, useWebsiteCategories } from "../hooks/useWebsiteCategories.js";
import { uploadToStorage } from "../firebase.js";
import { getCategoryId, getWebsiteCategoryLabel, normalizeStatus, getCategoryIcon, getCategoryEmoji, formatCategoryName, getCategoryIconAndDescription } from "../data/websiteCategories.js";
import { THUMBNAIL_DISPLAY_DEFAULTS, THUMBNAIL_PRESETS, getThumbnailImageStyle, normalizeThumbnailDisplay } from "../utils/thumbnailDisplay.js";
import {
  getDefaultCategorySortOrder,
  normalizeCategorySlugForOrder,
  normalizeWebsiteCategorySlug,
  sortWebsiteCategories,
  websiteMatchesCategory,
} from "../constants/categoryOrder.js";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function websiteName(item) { return item.name || item.title || "Unknown"; }
function websiteCategory(item) { return item.category || item.categoryName || "Unknown"; }
function websiteUrl(item) { return item.url || item.websiteUrl || item.link || ""; }
function categoryNameForSlug(slug, categories = []) {
  const normalizedSlug = normalizeWebsiteCategorySlug(slug);
  const match = categories.find((category) => normalizeWebsiteCategorySlug(category.slug || category.id || category.name) === normalizedSlug);
  return match?.name || getWebsiteCategoryLabel(normalizedSlug) || slug;
}
function formatAdminDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "";
}
function safePinnedRank(item) {
  const rank = Number(item?.pinnedRank);
  return item?.isPinned === true && Number.isInteger(rank) && rank >= 1 && rank <= 10 ? rank : null;
}
function adminWebsiteTime(item) {
  const value = item?.updatedAt || item?.createdAt || item?.lastCheckedAt;
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
function sortWebsitesForAdmin(a, b) {
  const aRank = safePinnedRank(a);
  const bRank = safePinnedRank(b);
  if (aRank !== null || bRank !== null) {
    if (aRank === null) return 1;
    if (bRank === null) return -1;
    if (aRank !== bRank) return aRank - bRank;
  }
  return adminWebsiteTime(b) - adminWebsiteTime(a) || websiteName(a).localeCompare(websiteName(b));
}

function ThumbnailDisplayControls({ value, onChange, title, imageUrl }) {
  const style = normalizeThumbnailDisplay(value);
  const previewStyle = getThumbnailImageStyle(style);
  const update = (patch) => onChange({ ...style, ...patch });
  const buttonStyle = {
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    background: "#fff",
    color: "#374151",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 800, color: "#374151", marginBottom: 5 };

  return (
    <div style={{ display: "grid", gap: 14, padding: 14, borderRadius: 12, border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>Thumbnail Display</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Controls public cards, detail page, and admin previews.</div>
        </div>
        <button type="button" onClick={() => update(THUMBNAIL_DISPLAY_DEFAULTS)} style={{ ...buttonStyle, borderColor: "#D4AF37", background: "#FFF8E1", color: "#7F5F00" }}>
          Reset Thumbnail Style
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["logo", "Logo"],
          ["banner", "Banner"],
          ["screenshot", "Screenshot"],
          ["poster", "Poster"],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => update(THUMBNAIL_PRESETS[key])} style={buttonStyle}>{label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <label>
          <span style={labelStyle}>Fit Mode</span>
          <select value={style.thumbnailFit} onChange={e => update({ thumbnailFit: e.target.value })} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff" }}>
            <option value="contain">Contain — show full image</option>
            <option value="cover">Cover — fill card</option>
            <option value="fill">Fill — stretch image</option>
          </select>
        </label>
        <label>
          <span style={labelStyle}>Position</span>
          <select value={style.thumbnailPosition} onChange={e => update({ thumbnailPosition: e.target.value })} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff" }}>
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label>
          <span style={labelStyle}>Zoom: {style.thumbnailZoom}%</span>
          <input type="range" min="70" max="140" step="5" value={style.thumbnailZoom} onChange={e => update({ thumbnailZoom: Number(e.target.value) })} style={{ width: "100%", accentColor: "#D4AF37" }} />
        </label>
        <label>
          <span style={labelStyle}>Custom Background</span>
          <input type="text" value={style.thumbnailBg} onChange={e => update({ thumbnailBg: e.target.value })} placeholder="#f8fafc" style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }} />
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>Background:</span>
        {[
          ["White", "#ffffff"],
          ["Light", "#f8fafc"],
          ["Dark", "#0f172a"],
        ].map(([label, color]) => (
          <button key={color} type="button" onClick={() => update({ thumbnailBg: color })} style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: color, border: "1px solid #CBD5E1" }} /> {label}
          </button>
        ))}
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(style.thumbnailBg) ? style.thumbnailBg : "#f8fafc"} onChange={e => update({ thumbnailBg: e.target.value })} style={{ width: 36, height: 32, border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff", padding: 3 }} />
      </div>

      <div style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#374151", marginBottom: 6 }}>Live Card Preview</div>
        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E6EAF0", background: "#fff", boxShadow: "0 4px 14px rgba(15,23,42,0.06)" }}>
          <div style={{ width: "100%", aspectRatio: "16 / 10", minHeight: 180, background: previewStyle.wrapper.background, overflow: "hidden", borderBottom: "1px solid #E5E7EB" }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", display: "block", ...previewStyle.image }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#94A3B8" }}>No thumbnail</div>
            )}
          </div>
          <div style={{ minHeight: 54, padding: "10px 12px", display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || "Website Title"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function getQualityAudit(item) {
  const checks = [
    ["title", Boolean(websiteName(item) && websiteName(item) !== "Unknown")],
    ["url", Boolean(websiteUrl(item))],
    ["category", Boolean(websiteCategory(item) && websiteCategory(item) !== "Unknown")],
    ["status", Boolean(item.status)],
    ["image", Boolean(item.thumbnailUrl || item.imageUrl || item.image)],
    ["description", Boolean(item.description)],
    ["last checked", Boolean(item.lastCheckedAt)],
  ];
  const passed = checks.filter(([, ok]) => ok).length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    score,
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
    color: score >= 85 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626",
    bg: score >= 85 ? "#DCFCE7" : score >= 60 ? "#FEF3C7" : "#FEE2E2",
  };
}

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "100%", maxWidth: 540, background: "#fff", borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {children}
      </div>
    </div>
  );
}

function CategoryEditorModal({ category, onClose, onSave }) {
  const initialName = formatCategoryName(category?.name || category?.slug || "");
  const fallbackMeta = getCategoryIconAndDescription(initialName || category?.slug || "");
  const [formData, setFormData] = useState({
    name: initialName || category?.name || "",
    slug: category?.slug || getCategoryId(initialName || category?.name || ""),
    icon: category?.icon || fallbackMeta.icon,
    description: category?.description || fallbackMeta.description,
    status: category?.status || "active",
    sortOrder: typeof category?.sortOrder === "number" ? category.sortOrder : 999,
  });
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!category?.slug);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const updates = { name: newName };
    if (autoSlug) {
      updates.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSlugChange = (e) => {
    setAutoSlug(false);
    setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }));
  };

  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      await onSave({ ...(category || {}), ...formData, name: formData.name.trim(), slug: formData.slug.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || "Could not save category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{category ? "Edit Category" : "New Category"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 700 }}>
            {error}
          </div>
        )}
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category Name</span>
          <input type="text" value={formData.name} onChange={handleNameChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. Developer Tools" autoFocus />
        </label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Slug</span>
            <input type="text" value={formData.slug} onChange={handleSlugChange} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. developer-tools" />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Icon (emoji/text)</span>
            <input type="text" value={formData.icon} onChange={e => setFormData(p => ({...p, icon: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. 🛠️" />
          </label>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} placeholder="Optional description..." />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status</span>
            <select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Sort Order</span>
            <input type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({...p, sortOrder: parseInt(e.target.value)||0}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} /><span style={{ fontSize: 11, color: "#6B7280", marginTop: 4, display: "block" }}>Lower number = appears first on homepage</span>
          </label>
        </div>
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={!formData.name.trim() || loading} onClick={handleSave} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.name.trim() || loading) ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Category
        </button>
      </div>
    </ModalOverlay>
  );
}

function WebsiteEditorModal({ website, categories, onClose, onSave }) {
  const categoryOptions = Array.from(new Map([
    ...categories.map(category => {
      const name = getWebsiteCategoryLabel(category.name || category.slug || category.id);
      return [getCategoryId(name), name];
    }).filter(([, name]) => Boolean(name)),
  ]).values());
  const [formData, setFormData] = useState({
    title: website?.title || website?.name || "",
    category: website?.category || website?.categoryName || "",
    url: website?.url || website?.websiteUrl || website?.link || "",
    description: website?.description || "",
    status: normalizeStatus(website?.status) || "published",
    thumbnailUrl: website?.thumbnailUrl || website?.imageUrl || website?.image || "",
    featured: !!website?.featured,
    visits: website?.visits || 0,
    favoritesCount: website?.favoritesCount || 0,
    trendingScore: website?.trendingScore || 0,
    rating: website?.rating || 5.0,
    editorChoice: !!website?.editorChoice,
    homepageFeature: !!website?.homepageFeature,
    tags: Array.isArray(website?.tags) ? website.tags.join(", ") : (website?.tags || ""),
    faviconUrl: website?.faviconUrl || "",
    requiresVpn: !!website?.requiresVpn,
    vpnRecommended: !!website?.vpnRecommended,
    adBlockRecommended: !!website?.adBlockRecommended,
    worksOnMobile: !!website?.worksOnMobile,
    lastCheckedAt: website?.lastCheckedAt || null,
    appDownloadUrl: website?.appDownloadUrl || "",
    isPinned: website?.isPinned === true,
    pinnedRank: safePinnedRank(website) || "",
    ...normalizeThumbnailDisplay(website || {}),
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const generateFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (formData.url && formData.url.startsWith("http") && !formData.thumbnailUrl) {
      const favicon = generateFaviconUrl(formData.url);
      if (favicon) {
        setFormData(prev => ({ ...prev, faviconUrl: favicon }));
      }
    }
  }, [formData.url]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File extension validation
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowedExtensions.includes(ext)) {
      alert("Invalid file type. Allowed formats: jpg, jpeg, png, webp, gif");
      return;
    }

    // MIME type validation
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.type)) {
      alert("Invalid file type. Allowed formats: jpg, jpeg, png, webp, gif");
      return;
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 5MB limit. Please upload a smaller image.");
      return;
    }

    setUploading(true);
    try {
      const filename = `websites/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
      const url = await uploadToStorage(file, filename);
      setFormData(prev => ({ ...prev, thumbnailUrl: url }));
    } catch (err) {
      alert("Failed to upload image.");
    }
    setUploading(false);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{website ? "Edit Website" : "New Website"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
      </div>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Website Title</span>
          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. OpenAI" />
        </label>
        <label><span style={{ display:"block", fontSize:13, fontWeight:700, color:"#374151", marginBottom:6 }}>App Download URL</span><input value={formData.appDownloadUrl} onChange={e => setFormData({...formData, appDownloadUrl:e.target.value})} style={{ width:"100%", padding:"10px 12px", borderRadius:6, border:"1px solid #D1D5DB", boxSizing:"border-box" }} placeholder="Optional app or APK download link" /></label>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category</span>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="">Select a category</option>
              {categoryOptions.map(name => <option key={getCategoryId(name)} value={name}>{name}</option>)}
              {formData.category && !categoryOptions.some(name => getCategoryId(name) === getCategoryId(formData.category)) && (
                <option value={formData.category}>{formData.category} (Unmapped)</option>
              )}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Status</span>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff" }}>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>
        
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Website URL</span>
          <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="https://..." />
        </label>

        {/* Favicon Preview */}
        {formData.url && (() => {
          try {
            const domain = new URL(formData.url).hostname;
            const favUrl = formData.faviconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                <img
                  src={favUrl}
                  alt="Favicon"
                  style={{ width: 32, height: 32, borderRadius: 4, objectFit: "contain", background: "#fff" }}
                  onError={e => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = "1";
                      e.target.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                    } else {
                      e.target.style.display = "none";
                    }
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Auto-detected favicon</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", wordBreak: "break-all" }}>{domain}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const d = new URL(formData.url).hostname;
                      setFormData(prev => ({ ...prev, faviconUrl: `https://www.google.com/s2/favicons?domain=${d}&sz=128` }));
                    } catch {}
                  }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}
                >
                  🔄 Refresh
                </button>
              </div>
            );
          } catch { return null; }
        })()}
        
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</span>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, minHeight: 60, resize: "vertical" }} placeholder="Brief description of the website..." />
        </label>
        
        <div style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 2 }}>Hub Banner / Thumbnail Image</span>
          <span style={{ display: "block", fontSize: 11, color: "#9CA3AF", marginBottom: 8 }}>This image appears as the large preview banner in the Website Hub. Use a wide image (16:9 recommended).</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {formData.thumbnailUrl ? (
              <img src={formData.thumbnailUrl} alt="Thumbnail" style={{ width: 80, height: 50, display: "block", borderRadius: 8, border: "1px solid #D4AF37", background: getThumbnailImageStyle(formData).wrapper.background, ...getThumbnailImageStyle(formData).image }} />
            ) : (
              <div style={{ width: 80, height: 50, borderRadius: 8, background: "#F3F4F6", border: "1px dashed #D1D5DB", display: "grid", placeItems: "center", color: "#9CA3AF" }}>
                <ImageIcon size={20} />
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                {uploading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Globe size={14} />} {uploading ? "Uploading..." : "Upload Image"}
              </button>
              {formData.thumbnailUrl && <button onClick={() => setFormData({...formData, thumbnailUrl: ""})} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer", textAlign: "left" }}>Remove image</button>}
            </div>
          </div>
        </div>

        <ThumbnailDisplayControls
          value={formData}
          title={formData.title}
          imageUrl={formData.thumbnailUrl}
          onChange={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
        />

        <div style={{ display: "grid", gap: 12, padding: 14, borderRadius: 12, border: "1px solid #E5E7EB", background: "#FFFCF3" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>Featured / Pin Website</div>
            <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 12 }}>Pinned websites appear first inside their category.</p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 800, color: "#374151", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={formData.isPinned}
              onChange={e => setFormData(prev => ({ ...prev, isPinned: e.target.checked, pinnedRank: e.target.checked ? (prev.pinnedRank || 1) : "" }))}
              style={{ width: 17, height: 17, accentColor: "#D4AF37" }}
            />
            Pin this website
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Pin Position</span>
            <select
              value={formData.isPinned ? formData.pinnedRank || 1 : ""}
              disabled={!formData.isPinned}
              onChange={e => setFormData(prev => ({ ...prev, pinnedRank: e.target.value ? Number(e.target.value) : "" }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff", opacity: formData.isPinned ? 1 : 0.6 }}
            >
              <option value="">Not pinned</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map(rank => <option key={rank} value={rank}>{rank}</option>)}
            </select>
          </label>
        </div>

        {/* Custom Tags */}
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Tags (comma-separated)</span>
          <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 14 }} placeholder="e.g. AI, developer tools, coding" />
        </label>

        {/* Telemetry numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Visits</span>
            <input type="number" value={formData.visits} onChange={e => setFormData({...formData, visits: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 13 }} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Saves</span>
            <input type="number" value={formData.favoritesCount} onChange={e => setFormData({...formData, favoritesCount: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 13 }} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Trending</span>
            <input type="number" value={formData.trendingScore} onChange={e => setFormData({...formData, trendingScore: parseInt(e.target.value) || 0})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 13 }} />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Rating</span>
            <input type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value) || 0.0})} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D1D5DB", outlineColor: "#D4AF37", fontSize: 13 }} />
          </label>
        </div>

        {/* Badges and Featured Checkboxes */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} style={{ width: 16, height: 16, accentColor: "#D4AF37" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Feature this website</span>
          </label>
          {[['requiresVpn','VPN required'],['vpnRecommended','VPN recommended'],['adBlockRecommended','AdBlock recommended']].map(([key,label]) => <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="checkbox" checked={!!formData[key]} onChange={e => setFormData({...formData, [key]:e.target.checked})} style={{ width:16, height:16, accentColor:"#D4AF37" }}/><span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{label}</span></label>)}
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="checkbox" checked={!!formData.worksOnMobile} onChange={e => setFormData({...formData, worksOnMobile:e.target.checked})} style={{ width:16, height:16, accentColor:"#D4AF37" }}/><span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>Works on mobile</span></label>
          
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={formData.editorChoice} onChange={e => setFormData({...formData, editorChoice: e.target.checked})} style={{ width: 16, height: 16, accentColor: "#D4AF37" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Editor Choice</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={formData.homepageFeature} onChange={e => setFormData({...formData, homepageFeature: e.target.checked})} style={{ width: 16, height: 16, accentColor: "#D4AF37" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Show on Homepage</span>
          </label>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:12, borderRadius:10, background:"#F9FAFB", border:"1px solid #E5E7EB", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#374151" }}>Last checked</div>
            <div style={{ fontSize:12, color:"#6B7280" }}>{formData.lastCheckedAt ? formatAdminDate(formData.lastCheckedAt) : "Not checked"}</div>
          </div>
          <button type="button" onClick={() => setFormData(prev => ({ ...prev, lastCheckedAt: serverTimestamp() }))} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #D4AF37", background:"#FFF8E1", color:"#7F5F00", fontWeight:700, cursor:"pointer", fontSize:13 }}>
            Mark checked today
          </button>
        </div>
        
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button disabled={!formData.title.trim() || loading || uploading} onClick={async () => {
          setLoading(true);
          await onSave({ ...(website || {}), ...formData });
          setLoading(false);
        }} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#111827", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, opacity: (!formData.title.trim() || loading || uploading) ? 0.5 : 1 }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />} Save Website
        </button>
      </div>
    </ModalOverlay>
  );
}

export default function WebsitesPage({ devPreview, isSuperAdmin }) {
  const [activeTab, setActiveTab] = useState("websites"); // websites, categories, feedback
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null); // { action, item }
  const [editingWebsite, setEditingWebsite] = useState(null); // item or "new"
  const [editingCategory, setEditingCategory] = useState(null); // item or "new"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionFilter, setSuggestionFilter] = useState("pending");
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState([]);
  const [bulkMoveCategory, setBulkMoveCategory] = useState("");
  const [toast, setToast] = useState(null);

  const { categories, loading: catsLoading } = useWebsiteCategories(websites);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setItems(categories);
    }
  }, [categories]);

  const visibleCategories = useMemo(
    () => sortWebsiteCategories(items.filter((category) => category.isVisible !== false)),
    [items]
  );

  const flashToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__steaCategoryToastTimer);
    window.__steaCategoryToastTimer = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const clearCategoryCaches = useCallback(() => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("stea_cats_session_v") || key.startsWith("stea_cache_website_solution_categories")) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem("sites_categories_v1");
      sessionStorage.removeItem("stea_sites_category_page_cache_v2");
      invalidateWebsiteCategoriesCache();
    } catch (error) {
      console.warn("Failed to clear category caches:", error?.message || error);
    }
  }, []);

  const loadData = useCallback(async () => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, "websites")));
      setWebsites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => websiteName(a).localeCompare(websiteName(b))));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const loadFeedback = useCallback(async () => {
    const db = getFirebaseDb();
    if (!db) return;
    setFeedbackLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "websiteFeedback"), orderBy("createdAt", "desc"), limit(100)));
      setFeedbackList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn("Feedback load error:", e.message); }
    setFeedbackLoading(false);
  }, []);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return loadData();
    setLoading(true);
    return onSnapshot(query(collection(db, "websites")), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => websiteName(a).localeCompare(websiteName(b)));
      setWebsites(fetched);
      if (import.meta.env.DEV) {
        console.table(fetched.map(w => ({
          title: w.title || w.name,
          category: w.category,
          categoryId: getCategoryId(w.category),
          status: w.status,
        })));
      }
      setLoading(false);
    }, (error) => {
      console.error("Website listener failed:", error);
      setLoading(false);
    });
  }, [loadData]);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setSuggestionsLoading(false);
      return undefined;
    }
    setSuggestionsLoading(true);
    return onSnapshot(query(collection(db, "website_suggestions"), orderBy("createdAt", "desc"), limit(200)), (snapshot) => {
      setSuggestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setSuggestionsLoading(false);
    }, (error) => {
      console.error("Website suggestions listener failed:", error);
      setSuggestionsLoading(false);
    });
  }, []);

  const handleAction = async (reason) => {
    if (!confirming) return;
    const db = getFirebaseDb();
    const { action, item } = confirming;
    
    try {
      if (action === "feature") {
        const newVal = !item.featured;
        await createAuditLog("toggle_featured_website", "websites", item.id, { featured: item.featured }, { featured: newVal }, reason);
        await updateDoc(doc(db, "websites", item.id), { featured: newVal });
        setWebsites(websites.map(w => w.id === item.id ? { ...w, featured: newVal } : w));
        invalidateWebsiteCategoriesCache();
      }
      if (action === "delete_website") {
        await createAuditLog("delete_website", "websites", item.id, item, null, reason);
        await deleteDoc(doc(db, "websites", item.id));
        setWebsites(websites.filter(w => w.id !== item.id));
        invalidateWebsiteCategoriesCache();
      }
      if (action === "delete_category") {
        await createAuditLog("delete_website_category", "website_solution_categories", item.id, item, null, reason);
        await deleteDoc(doc(db, "website_solution_categories", item.id));
        invalidateWebsiteCategoriesCache();
      }
    } catch (e) {
      alert("Action failed: " + e.message);
    }
    setConfirming(null);
  };

  const handleSaveWebsite = async (data) => {
    const db = getFirebaseDb();
    const processedTags = typeof data.tags === "string"
      ? data.tags.split(",").map(t => t.trim()).filter(Boolean)
      : data.tags;
    const category = getWebsiteCategoryLabel(data.category);
    const categoryId = normalizeWebsiteCategorySlug(category);
    const status = normalizeStatus(data.status) || "draft";
    const thumbnailDisplay = normalizeThumbnailDisplay(data);
    const isPinned = data.isPinned === true;
    const pinnedRank = isPinned ? Number(data.pinnedRank) : null;

    if (isPinned && (!Number.isInteger(pinnedRank) || pinnedRank < 1 || pinnedRank > 10)) {
      alert("Pinned websites need a Pin Position from 1 to 10.");
      return;
    }

    if (isPinned) {
      const conflict = websites.find(item =>
        item.id !== data.id &&
        websiteMatchesCategory(item, categoryId) &&
        item.isPinned === true &&
        Number(item.pinnedRank) === pinnedRank
      );
      if (conflict) {
        alert(`Pin position ${pinnedRank} is already used in ${category}. Choose another number.`);
        return;
      }
    }

    const payload = {
      title: data.title,
      category,
      categoryName: category,
      categoryId,
      categorySlug: categoryId,
      url: data.url,
      description: data.description,
      status,
      published: status === "published",
      thumbnailUrl: data.thumbnailUrl || "",
      imageUrl: data.thumbnailUrl || "",
      image: data.thumbnailUrl || "",
      thumbnailFit: thumbnailDisplay.thumbnailFit,
      thumbnailPosition: thumbnailDisplay.thumbnailPosition,
      thumbnailZoom: thumbnailDisplay.thumbnailZoom,
      thumbnailBg: thumbnailDisplay.thumbnailBg,
      faviconUrl: data.faviconUrl || "",
      featured: !!data.featured,
      visits: Number(data.visits) || 0,
      favoritesCount: Number(data.favoritesCount) || 0,
      trendingScore: Number(data.trendingScore) || 0,
      rating: Number(data.rating) || 5.0,
      editorChoice: !!data.editorChoice,
      homepageFeature: !!data.homepageFeature,
      tags: processedTags || [],
      requiresVpn: !!data.requiresVpn,
      vpnRecommended: !!data.vpnRecommended,
      adBlockRecommended: !!data.adBlockRecommended,
      appDownloadUrl: data.appDownloadUrl || "",
      worksOnMobile: !!data.worksOnMobile,
      lastCheckedAt: data.lastCheckedAt || null,
      isPinned,
      pinnedRank,
      updatedAt: serverTimestamp()
    };

    try {
      if (data.id) {
        await createAuditLog("update_website", "websites", data.id, websites.find(w => w.id === data.id), payload, "Admin edit");
        await updateDoc(doc(db, "websites", data.id), payload);
        setWebsites(websites.map(w => w.id === data.id ? { ...w, ...payload } : w).sort(sortWebsitesForAdmin));
      } else {
        const existing = await getDocs(query(collection(db, "websites"), where("url", "==", data.url), limit(1)));
        if (!existing.empty) {
          alert("This website already exists.");
          return;
        }
        const finalPayload = { ...payload, createdAt: serverTimestamp() };
        const res = await addDoc(collection(db, "websites"), finalPayload);
        await createAuditLog("create_website", "websites", res.id, null, finalPayload, "Admin create");
        setWebsites([{ id: res.id, ...payload }, ...websites].sort(sortWebsitesForAdmin));
        if (data.__suggestionId) {
          await updateDoc(doc(db, "website_suggestions", data.__suggestionId), {
            status: "approved",
            approvedWebsiteId: res.id,
            updatedAt: serverTimestamp(),
          });
        }
      }
      invalidateWebsiteCategoriesCache();
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
    setEditingWebsite(null);
  };

  const updateSuggestionStatus = async (suggestion, status) => {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await updateDoc(doc(db, "website_suggestions", suggestion.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      alert("Could not update suggestion: " + error.message);
    }
  };

  const createWebsiteFromSuggestion = async (suggestion) => {
    const db = getFirebaseDb();
    if (!db) return;
    const existing = await getDocs(query(collection(db, "websites"), where("url", "==", suggestion.websiteUrl), limit(1)));
    if (!existing.empty) {
      alert("This website already exists.");
      await updateSuggestionStatus(suggestion, "reviewed");
      return;
    }
    setEditingWebsite({
      __suggestionId: suggestion.id,
      title: suggestion.websiteName || "",
      name: suggestion.websiteName || "",
      url: suggestion.websiteUrl || "",
      category: suggestion.category || "",
      description: suggestion.reason || "",
      status: "draft",
    });
  };


  const rebalanceCategories = async (db) => {
    try {
      const snap = await getDocs(query(collection(db, "website_solution_categories")));
      const allCats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activeCats = allCats.filter(c => String(c.status || "active").toLowerCase() !== "deleted");
      
      activeCats.sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 999;
        const bOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
      
      const updates = [];
      let nextOrder = 1;
      for (const cat of activeCats) {
        if (cat.sortOrder !== nextOrder) {
          updates.push(setDoc(doc(db, "website_solution_categories", cat.id), { sortOrder: nextOrder }, { merge: true }));
        }
        nextOrder++;
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (e) {
      console.error("Failed to rebalance categories:", e);
    }
  };

  const handleSaveCategory = async (data) => {
    const db = getFirebaseDb();
    if (!db) {
      const error = new Error("Database not available");
      flashToast(`Could not save category: ${error.message}`, "error");
      throw error;
    }

    const normalizedName = formatCategoryName(data.name || data.slug || "");
    const normalizedSlug = getCategoryId(data.slug || normalizedName);
    const resolvedStatus = String(data.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";
    const fallbackMeta = getCategoryIconAndDescription(normalizedName || normalizedSlug);
    const sortOrderValue = Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 999;

    if (!normalizedName || !normalizedSlug) {
      const error = new Error("Category name and slug are required.");
      flashToast(`Could not save category: ${error.message}`, "error");
      throw error;
    }

    try {
      const duplicatesSnap = await getDocs(query(
        collection(db, "website_solution_categories"),
        where("slug", "==", normalizedSlug),
        limit(20)
      ));
      const duplicates = duplicatesSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const duplicateCount = duplicates.filter((item) => item.id !== data.id).length;
      const targetExisting = data.id
        ? duplicates.find((item) => item.id === data.id) || categories.find((item) => item.id === data.id)
        : duplicates.find((item) => String(item.status || "").toLowerCase() === "active") || duplicates[0];
      const canonicalId = normalizedSlug;
      const canonicalExisting = duplicates.find((item) => item.id === canonicalId) || (targetExisting?.id === canonicalId ? targetExisting : null);

      const payload = {
        name: normalizedName,
        slug: normalizedSlug,
        icon: String(data.icon || "").trim() || fallbackMeta.icon,
        description: String(data.description || "").trim() || fallbackMeta.description,
        status: resolvedStatus,
        sortOrder: sortOrderValue,
        updatedAt: serverTimestamp(),
      };

      const upsertPayload = {
        ...payload,
        createdAt: canonicalExisting?.createdAt || targetExisting?.createdAt || serverTimestamp(),
      };
      await createAuditLog(
        canonicalExisting ? "update_website_category" : "upsert_website_category",
        "website_solution_categories",
        canonicalId,
        canonicalExisting || targetExisting || null,
        upsertPayload,
        "Admin save category"
      );
      await setDoc(doc(db, "website_solution_categories", canonicalId), upsertPayload, { merge: true });

      await rebalanceCategories(db);
      clearCategoryCaches();
      flashToast(duplicateCount > 0 ? "Category slug already existed. Existing category updated successfully." : "Category saved successfully.");
    } catch (err) {
      console.error("Category save failed:", err);
      flashToast(`Could not save category: ${err.message}`, "error");
      throw err;
    }
  };

  const repairLegacyWebsiteRecords = async () => {
    if (!isSuperAdmin) return;
    const db = getFirebaseDb();
    if (!db) return;
    const repairs = websites.filter(item => {
      const statusNeedsRepair = item.status && item.status !== normalizeStatus(item.status);
      const normalizedSlug = normalizeWebsiteCategorySlug(item.categorySlug || item.category || item.categoryName || item.categoryId);
      const categoryNeedsRepair = item.category === "Education";
      return statusNeedsRepair || categoryNeedsRepair || item.categorySlug !== normalizedSlug;
    });
    if (!repairs.length) {
      alert("All website statuses and legacy categories are already normalized.");
      return;
    }
    try {
      await Promise.all(repairs.map(item => {
        const status = normalizeStatus(item.status) || "published";
        const normalizedSlug = normalizeWebsiteCategorySlug(item.categorySlug || item.category || item.categoryName || item.categoryId);
        const category = normalizedSlug === "adblockers"
          ? "AdBlockers"
          : item.category === "Education"
            ? "Online Courses"
            : (item.categoryName || item.category || categoryNameForSlug(normalizedSlug, categories));
        const payload = {
          status,
          category,
          categoryName: category,
          categoryId: normalizedSlug,
          categorySlug: normalizedSlug,
          published: status === "published",
          updatedAt: serverTimestamp(),
        };
        if (item.category === "Education") {
          payload.category = category;
          payload.categoryName = category;
          payload.categoryId = normalizeWebsiteCategorySlug(category);
          payload.categorySlug = normalizeWebsiteCategorySlug(category);
        }
        return updateDoc(doc(db, "websites", item.id), payload);
      }));
      invalidateWebsiteCategoriesCache();
      alert(`Website categories repaired successfully. Updated ${repairs.length} record${repairs.length === 1 ? "" : "s"}.`);
    } catch (error) {
      alert("Repair failed: " + error.message);
    }
  };

  const moveSelectedWebsites = async () => {
    if (!isSuperAdmin || selectedWebsiteIds.length === 0 || !bulkMoveCategory) return;
    const category = getWebsiteCategoryLabel(bulkMoveCategory);
    const categoryId = normalizeWebsiteCategorySlug(category);
    const confirmed = window.confirm(`Move ${selectedWebsiteIds.length} selected website${selectedWebsiteIds.length === 1 ? "" : "s"} to ${category}?`);
    if (!confirmed) return;
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await Promise.all(selectedWebsiteIds.map((id) => updateDoc(doc(db, "websites", id), {
        category,
        categoryName: category,
        categoryId,
        categorySlug: categoryId,
        updatedAt: serverTimestamp(),
      })));
      setWebsites((current) => current.map((item) => selectedWebsiteIds.includes(item.id)
        ? { ...item, category, categoryName: category, categoryId, categorySlug: categoryId }
        : item));
      setSelectedWebsiteIds([]);
      setBulkMoveCategory("");
      invalidateWebsiteCategoriesCache();
      alert(`Moved ${selectedWebsiteIds.length} website${selectedWebsiteIds.length === 1 ? "" : "s"} to ${category}.`);
    } catch (error) {
      alert("Bulk category move failed: " + error.message);
    }
  };

  const filteredWebsites = useMemo(() => {
    return websites.filter(w => {
      if (filterCategory && !websiteMatchesCategory(w, filterCategory)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return websiteName(w).toLowerCase().includes(q) || websiteUrl(w).toLowerCase().includes(q) || websiteCategory(w).toLowerCase().includes(q);
      }
      return true;
    }).sort(sortWebsitesForAdmin);
  }, [websites, searchQuery, filterCategory]);

  useEffect(() => {
    setSelectedWebsiteIds((current) => current.filter((id) => filteredWebsites.some((item) => item.id === id)));
  }, [filteredWebsites]);

  const toggleCategoryStatus = async (cat) => {
    const db = getFirebaseDb();
    const newStatus = cat.status === "inactive" ? "active" : "inactive";
    const canonicalId = getCategoryId(cat.slug || cat.name || cat.id);
    try {
      await createAuditLog("toggle_website_category_status", "website_solution_categories", canonicalId, { status: cat.status }, { status: newStatus }, "Admin toggle");
      await setDoc(doc(db, "website_solution_categories", canonicalId), {
        name: formatCategoryName(cat.name || canonicalId),
        slug: canonicalId,
        icon: cat.icon || getCategoryIconAndDescription(cat.name || canonicalId).icon,
        description: cat.description || getCategoryIconAndDescription(cat.name || canonicalId).description,
        sortOrder: typeof cat.sortOrder === "number" ? cat.sortOrder : 999,
        status: newStatus,
        updatedAt: serverTimestamp(),
        createdAt: cat.createdAt || serverTimestamp(),
      }, { merge: true });
      clearCategoryCaches();
    } catch(e) {
      alert("Failed to update status");
    }
  };

  const moveCategory = async (cat, direction) => {
    if (!isSuperAdmin) return;
    const activeCategories = categories
      .filter((category) => category.status !== "deleted")
      .sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 999;
        const bOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 999;
        const orderDiff = aOrder - bOrder;
        if (orderDiff !== 0) return orderDiff;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    const currentIndex = activeCategories.findIndex((item) => getCategoryId(item.slug || item.name || item.id) === getCategoryId(cat.slug || cat.name || cat.id));
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= activeCategories.length) return;

    const current = activeCategories[currentIndex];
    const swap = activeCategories[swapIndex];
    const currentId = getCategoryId(current.slug || current.name || current.id);
    const swapId = getCategoryId(swap.slug || swap.name || swap.id);
    const currentOrder = Number.isFinite(Number(current.sortOrder)) ? Number(current.sortOrder) : currentIndex + 1;
    const swapOrder = Number.isFinite(Number(swap.sortOrder)) ? Number(swap.sortOrder) : swapIndex + 1;
    const db = getFirebaseDb();

    // OPTIMISTIC UI UPDATE
    try {
      const newCategories = categories.map(c => {
        const id = getCategoryId(c.slug || c.name || c.id);
        if (id === currentId) return { ...c, sortOrder: swapOrder };
        if (id === swapId) return { ...c, sortOrder: currentOrder };
        return c;
      });
      localStorage.setItem("sites_categories_v1", JSON.stringify({ categories: newCategories, savedAt: Date.now() }));
      invalidateWebsiteCategoriesCache();
      flashToast("Category order updated.");
    } catch (err) {
      console.warn("Optimistic update failed", err);
    }

    // SYNC IN BACKGROUND
    try {
      Promise.all([
        setDoc(doc(db, "website_solution_categories", currentId), {
          name: formatCategoryName(current.name || currentId),
          slug: currentId,
          icon: current.icon || getCategoryIconAndDescription(current.name || currentId).icon,
          description: current.description || getCategoryIconAndDescription(current.name || currentId).description,
          status: current.status || "active",
          sortOrder: swapOrder,
          updatedAt: serverTimestamp(),
          createdAt: current.createdAt || serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, "website_solution_categories", swapId), {
          name: formatCategoryName(swap.name || swapId),
          slug: swapId,
          icon: swap.icon || getCategoryIconAndDescription(swap.name || swapId).icon,
          description: swap.description || getCategoryIconAndDescription(swap.name || swapId).description,
          status: swap.status || "active",
          sortOrder: currentOrder,
          updatedAt: serverTimestamp(),
          createdAt: swap.createdAt || serverTimestamp(),
        }, { merge: true }),
      ]).then(() => {
        createAuditLog("reorder_website_category", "website_solution_categories", currentId, { sortOrder: currentOrder }, { sortOrder: swapOrder }, "Admin reorder category");
        rebalanceCategories(db).catch(console.error);
      }).catch(err => console.error("Background sync failed:", err));
    } catch (error) {
      console.error("Category reorder dispatch failed:", error);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    const previousItems = [...items];
    setItems(newItems);

    const db = getFirebaseDb();
    if (!db) return;

    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        batch.set(doc(db, "website_solution_categories", item.id), {
          sortOrder: index + 1
        }, { merge: true });
      });
      await batch.commit();
      invalidateWebsiteCategoriesCache();
    } catch (err) {
      console.error("Firestore drag order update failed:", err);
      setItems(previousItems);
      flashToast("Failed to save order. Resetting...", "error");
    }
  };

  const resetOrder = async () => {
    const db = getFirebaseDb();
    if (!db) return;

    const confirmed = window.confirm("Are you sure you want to reset all categories to their default hierarchy?");
    if (!confirmed) return;

    try {
      const updates = categories.map((cat) => {
        const slug = normalizeCategorySlugForOrder(cat.slug || cat.id || cat.name);
        const sortOrder = getDefaultCategorySortOrder(slug);
        return updateDoc(doc(db, "website_solution_categories", cat.id), {
          slug,
          sortOrder,
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(updates);
      invalidateWebsiteCategoriesCache();
      flashToast("Default category order restored");
    } catch (error) {
      console.error("Reset order failed:", error);
      flashToast("Failed to reset order.", "error");
    }
  };

  // Autogenerated telemetry charts for top statistics
  const mostVisited = useMemo(() => {
    return [...websites].sort((a, b) => (b.visits || 0) - (a.visits || 0))[0];
  }, [websites]);

  const mostSaved = useMemo(() => {
    return [...websites].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))[0];
  }, [websites]);

  const topTrending = useMemo(() => {
    return [...websites].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))[0];
  }, [websites]);

  return (
    <>
      <AdminPageHeader title="Websites Management" description="Manage ecosystem website solutions and categories." />
      
      {!isSuperAdmin && (
        <div className="admin-v2-safety-banner" style={{ marginBottom: 24 }}><ShieldAlert size={18} /><div><strong>Read-only inventory.</strong> Websites and categories cannot be modified without super admin privileges.</div></div>
      )}

      {toast && (
        <div style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 12000,
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${toast.type === "error" ? "#FCA5A5" : "#BBF7D0"}`,
          background: toast.type === "error" ? "#FEF2F2" : "#ECFDF5",
          color: toast.type === "error" ? "#B91C1C" : "#047857",
          fontSize: 13,
          fontWeight: 800,
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.14)",
          maxWidth: 340,
        }}>
          {toast.message}
        </div>
      )}

      {confirming && (
        <AdminConfirmationModal
          title={
            confirming.action === "feature" ? (confirming.item.featured ? "Unfeature Website" : "Feature Website") : 
            confirming.action === "delete_website" ? "Delete Website" : 
            "Delete Category"
          }
          actionDescription={
            confirming.action === "feature" ? `Change featured status of "${websiteName(confirming.item)}".` :
            confirming.action === "delete_website" ? `Permanently delete the website "${websiteName(confirming.item)}".` :
            `Permanently delete the category "${confirming.item.name}". Websites in this category will not be deleted, but will lose their category association.`
          }
          onClose={() => setConfirming(null)}
          onConfirm={handleAction}
        />
      )}

      {editingWebsite && <WebsiteEditorModal website={editingWebsite === "new" ? null : editingWebsite} categories={visibleCategories} onClose={() => setEditingWebsite(null)} onSave={handleSaveWebsite} />}
      {editingCategory && <CategoryEditorModal category={editingCategory === "new" ? null : editingCategory} onClose={() => setEditingCategory(null)} onSave={handleSaveCategory} />}

      <div className="admin-v2-tabs" style={{ marginBottom: 24 }}>
        <button className={activeTab === "websites" ? "is-active" : ""} onClick={() => setActiveTab("websites")}>Websites Directory</button>
        <button className={activeTab === "categories" ? "is-active" : ""} onClick={() => setActiveTab("categories")}>Categories</button>
        <button className={activeTab === "suggestions" ? "is-active" : ""} onClick={() => setActiveTab("suggestions")}>Suggestions {suggestions.filter(item => (item.status || "pending") === "pending").length ? `(${suggestions.filter(item => (item.status || "pending") === "pending").length})` : ""}</button>
        <button className={activeTab === "feedback" ? "is-active" : ""} onClick={() => { setActiveTab("feedback"); if (feedbackList.length === 0) loadFeedback(); }}>Feedback</button>
      </div>

      {activeTab === "websites" && (
        <>
          {/* Enhanced statistics dashboard panels */}
          <div className="admin-v2-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="admin-v2-stat-card">
              <div className="admin-v2-stat-icon"><Globe size={24} /></div>
              <div><h4 className="admin-v2-stat-value">{websites.length}</h4><p className="admin-v2-stat-label">Total Websites</p></div>
            </div>
            {mostVisited && (
              <div className="admin-v2-stat-card">
                <div className="admin-v2-stat-icon" style={{ color: "#10B981" }}><Star size={24} /></div>
                <div><h4 className="admin-v2-stat-value" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{websiteName(mostVisited)} ({mostVisited.visits || 0})</h4><p className="admin-v2-stat-label">Most Visited</p></div>
              </div>
            )}
            {mostSaved && (
              <div className="admin-v2-stat-card">
                <div className="admin-v2-stat-icon" style={{ color: "#EF4444" }}><Star size={24} /></div>
                <div><h4 className="admin-v2-stat-value" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{websiteName(mostSaved)} ({mostSaved.favoritesCount || 0})</h4><p className="admin-v2-stat-label">Most Saved</p></div>
              </div>
            )}
            {topTrending && (
              <div className="admin-v2-stat-card">
                <div className="admin-v2-stat-icon" style={{ color: "#F5A623" }}><Star size={24} /></div>
                <div><h4 className="admin-v2-stat-value" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{websiteName(topTrending)} ({topTrending.trendingScore || 0})</h4><p className="admin-v2-stat-label">Top Trending</p></div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#9CA3AF" }} />
              <input type="text" placeholder="Search websites..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #E5E7EB", outlineColor: "#D4AF37", fontSize: 14 }} />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outlineColor: "#D4AF37", fontSize: 14, background: "#fff", minWidth: 160 }}>
              <option value="">All Categories</option>
              {visibleCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {isSuperAdmin && (
              <>
                <button onClick={repairLegacyWebsiteRecords} style={{ padding: "10px 14px", borderRadius: 8, background: "#FFF8E1", color: "#7F5F00", border: "1px solid #EED89D", fontWeight: 700, cursor: "pointer" }}>
                  Repair Website Categories
                </button>
                <button onClick={() => setEditingWebsite("new")} style={{ padding: "10px 16px", borderRadius: 8, background: "#111827", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus size={16} /> Add Website
                </button>
              </>
            )}
          </div>

          {isSuperAdmin && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center", padding: 12, border: "1px solid #E5E7EB", borderRadius: 10, background: "#F9FAFB" }}>
              <strong style={{ fontSize: 13, color: "#111827" }}>{selectedWebsiteIds.length} selected</strong>
              <button
                type="button"
                onClick={() => setSelectedWebsiteIds(filteredWebsites.map((item) => item.id))}
                disabled={filteredWebsites.length === 0}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 700, cursor: filteredWebsites.length ? "pointer" : "not-allowed", fontSize: 12 }}
              >
                Select visible
              </button>
              <button
                type="button"
                onClick={() => setSelectedWebsiteIds([])}
                disabled={selectedWebsiteIds.length === 0}
                style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 700, cursor: selectedWebsiteIds.length ? "pointer" : "not-allowed", fontSize: 12 }}
              >
                Clear
              </button>
              <select value={bulkMoveCategory} onChange={e => setBulkMoveCategory(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", minWidth: 180, fontSize: 13 }}>
                <option value="">Move to category...</option>
                {visibleCategories.map(c => <option key={c.slug || c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button
                type="button"
                onClick={moveSelectedWebsites}
                disabled={selectedWebsiteIds.length === 0 || !bulkMoveCategory}
                style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#111827", color: "#fff", fontWeight: 800, cursor: selectedWebsiteIds.length && bulkMoveCategory ? "pointer" : "not-allowed", fontSize: 13, opacity: selectedWebsiteIds.length && bulkMoveCategory ? 1 : 0.5 }}
              >
                Move selected
              </button>
            </div>
          )}

          {loading ? <p style={{ padding: 24, textAlign: "center", color: "#6B7280" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} /> Loading websites...</p> : (
            filteredWebsites.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", background: "#F9FAFB", borderRadius: 12, border: "1px dashed #D1D5DB" }}>
                <Globe size={40} color="#9CA3AF" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#111827" }}>No websites found</h3>
                <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>{searchQuery || filterCategory ? "Try adjusting your search or filters." : "Start by adding a new website."}</p>
              </div>
            ) : (
              <div className="admin-v2-grid-premium">
                {filteredWebsites.map(item => {
                  const catName = websiteCategory(item);
                  const isUnmapped = catName && !categories.some(c => c.name === catName);
                  const quality = getQualityAudit(item);

                  return (
                    <div key={item.id} className="admin-v2-card" style={{ display: "flex", flexDirection: "column" }}>
                      {isSuperAdmin && (
                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, fontWeight: 800, color: "#374151", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedWebsiteIds.includes(item.id)}
                            onChange={e => setSelectedWebsiteIds((current) => e.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))}
                            style={{ width: 16, height: 16, accentColor: "#D4AF37" }}
                          />
                          Select
                        </label>
                      )}
                      <div className="admin-v2-card-header" style={{ alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                        {item.thumbnailUrl || item.imageUrl || item.image ? (
                          <img src={item.thumbnailUrl || item.imageUrl || item.image} alt="" style={{ width: 48, height: 48, display: "block", borderRadius: 8, border: "1px solid #E5E7EB", flexShrink: 0, background: getThumbnailImageStyle(item).wrapper.background, ...getThumbnailImageStyle(item).image }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 8, background: "#F3F4F6", border: "1px dashed #D1D5DB", display: "grid", placeItems: "center", color: "#9CA3AF", flexShrink: 0 }}>
                            <Globe size={20} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="admin-v2-card-title" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {websiteName(item)} 
                            {item.featured && <Star size={14} color="#D4AF37" fill="#D4AF37" style={{ flexShrink: 0 }} />}
                          </h4>
                          <p className="admin-v2-card-subtitle" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6 }}>
                            {catName}
                            {isUnmapped && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 700 }}>Unmapped</span>}
                          </p>
                        </div>
                      </div>
                      
                      {/* Telemetry metadata audit view */}
                      <div style={{ fontSize: 13, color: "#4B5563", marginBottom: 16, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>Status</strong>
                          <span style={{ background: normalizeStatus(item.status) === "published" ? "#DCFCE7" : "#F3F4F6", color: normalizeStatus(item.status) === "published" ? "#166534" : "#4B5563", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                            {item.status || "Unknown"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>URL</strong>
                          <a href={websiteUrl(item)} target="_blank" rel="noreferrer" style={{ color: "#2563EB", textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{websiteUrl(item)}</a>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>Rating / Views</strong>
                          <span style={{ fontWeight: 600 }}>⭐ {Number(item.rating || 5.0).toFixed(1)} / {item.visits || 0} visits</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>Saves / Trending</strong>
                          <span style={{ fontWeight: 600 }}>❤️ {item.favoritesCount || 0} / 🔥 {item.trendingScore || 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <strong>Last checked</strong>
                          <span style={{ fontWeight: 600 }}>{item.lastCheckedAt ? formatAdminDate(item.lastCheckedAt) : "Not checked"}</span>
                        </div>
                        <div style={{ padding: "10px 12px", borderRadius: 8, background: quality.bg, color: quality.color, marginTop: 10, fontSize: 12, fontWeight: 700 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span>Quality: {quality.score}%</span>
                            <span>{quality.missing.length ? `Missing: ${quality.missing.join(", ")}` : "Complete"}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                          {safePinnedRank(item) && <span style={{ background: "#FFF7ED", color: "#B45309", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>📌 Pinned #{safePinnedRank(item)}</span>}
                          {item.editorChoice && <span style={{ background: "#FFF8E1", color: "#B7791F", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>⭐ Editor Choice</span>}
                          {item.homepageFeature && <span style={{ background: "#F3E8FF", color: "#7E22CE", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>🏠 Homepage</span>}
                        </div>
                        
                        {/* Admin debug audit info panel */}
                        {(() => {
                          const hasImg = item.thumbnailUrl || item.imageUrl || item.image ? "YES" : "NO";
                          const statLower = normalizeStatus(item.status || "published");
                          const isPub = statLower === "published";
                          const isNotDel = item.deleted !== true && statLower !== "deleted";
                          const isAct = item.active !== false;
                          const isVis = isPub && isNotDel && isAct ? "YES" : "NO";
                          const cSlug = getCategoryId(item.category);
                          return (
                            <div style={{
                              marginTop: 12,
                              padding: "10px 12px",
                              background: "#FFFDF5",
                              border: "1px dashed #EED89D",
                              borderRadius: 8,
                              fontSize: 11,
                              color: "#7F5F00",
                              fontFamily: "monospace"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span>Doc ID:</span>
                                <span style={{ fontWeight: 700, userSelect: "all" }}>{item.id}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span>Norm Slug:</span>
                                <span style={{ fontWeight: 700 }} title={item.category}>{cSlug || "(none)"}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                <span>Has Image:</span>
                                <span style={{ fontWeight: 700, color: hasImg === "YES" ? "#166534" : "#C2410C" }}>{hasImg}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Public Visible:</span>
                                <span style={{ fontWeight: 700, color: isVis === "YES" ? "#166534" : "#DC2626" }}>{isVis}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                                <span>Pinned:</span>
                                <span style={{ fontWeight: 700 }}>{safePinnedRank(item) ? `#${safePinnedRank(item)}` : "NO"}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {isSuperAdmin && (
                        <div className="admin-v2-card-actions" style={{ marginTop: "auto", borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
                          <button className="admin-v2-btn-secondary" onClick={() => setConfirming({ action: "feature", item })}>
                            <Star size={14} /> {item.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button className="admin-v2-btn-secondary" onClick={() => setEditingWebsite(item)}>
                            <Edit size={14} /> Edit
                          </button>
                          <button className="admin-v2-btn-secondary" onClick={() => updateDoc(doc(getFirebaseDb(), "websites", item.id), { lastCheckedAt: serverTimestamp(), updatedAt: serverTimestamp() })}>
                            <CheckCircle size={14} /> Checked
                          </button>
                          <button className="admin-v2-btn-secondary" onClick={() => setConfirming({ action: "delete_website", item })} style={{ color: "#DC2626" }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {activeTab === "categories" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>Website Categories</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {isSuperAdmin && (
                <>
                  <button onClick={resetOrder} style={{ padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#EF4444", border: "1px solid #FCA5A5", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    Reset Default Order
                  </button>
                  <button onClick={() => setEditingCategory("new")} style={{ padding: "8px 14px", borderRadius: 8, background: "#111827", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <Plus size={16} /> New Category
                  </button>
                </>
              )}
            </div>
          </div>

          {catsLoading ? <p style={{ padding: 24, textAlign: "center", color: "#6B7280" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} /> Loading categories...</p> : (
            categories.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", background: "#F9FAFB", borderRadius: 12, border: "1px dashed #D1D5DB" }}>
                <Globe size={40} color="#9CA3AF" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#111827" }}>No categories found</h3>
                <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>Start by creating your first category.</p>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                    <thead style={{ background: "#F9FAFB", color: "#4B5563", fontSize: 12, textTransform: "uppercase" }}>
                      <tr>
                        <th style={{ padding: "12px 20px", fontWeight: 700 }}>Category</th>
                        <th style={{ padding: "12px 20px", fontWeight: 700 }}>Slug</th>
                        <th style={{ padding: "12px 20px", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "12px 20px", fontWeight: 700 }}>Websites</th>
                        <th style={{ padding: "12px 20px", fontWeight: 700 }}>Sort Order</th>
                        {isSuperAdmin && <th style={{ padding: "12px 20px", fontWeight: 700, textAlign: "right" }}>Actions</th>}
                      </tr>
                    </thead>
                    <SortableContext items={visibleCategories} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {visibleCategories.map((cat, index) => {
                          const count = getWebsiteCountForCategory(cat, websites);
                          return (
                            <SortableCategoryRow
                              key={cat.id}
                              cat={cat}
                              index={index}
                              count={count}
                              isSuperAdmin={isSuperAdmin}
                              toggleCategoryStatus={toggleCategoryStatus}
                              setEditingCategory={setEditingCategory}
                              setConfirming={setConfirming}
                            />
                          );
                        })}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            )
          )}
        </>
      )}

      {activeTab === "suggestions" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Website Suggestions ({suggestions.length})</h3>
            <select value={suggestionFilter} onChange={e => setSuggestionFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", fontSize: 13, fontWeight: 600 }}>
              {["all", "pending", "reviewed", "approved", "rejected"].map(status => <option key={status} value={status}>{status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
            </select>
          </div>
          {suggestionsLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading suggestions...</div>
          ) : suggestions.filter(item => suggestionFilter === "all" || (item.status || "pending") === suggestionFilter).length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>No suggestions in this filter.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {suggestions
                .filter(item => suggestionFilter === "all" || (item.status || "pending") === suggestionFilter)
                .sort((a, b) => {
                  const priority = { pending: 0, reviewed: 1, approved: 2, rejected: 3 };
                  return (priority[a.status || "pending"] ?? 9) - (priority[b.status || "pending"] ?? 9);
                })
                .map(item => (
                  <div key={item.id} style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: "0 0 4px", fontSize: 15, color: "#111827" }}>{item.websiteName || "Untitled suggestion"}</h4>
                        <a href={item.websiteUrl} target="_blank" rel="noreferrer" style={{ color: "#2563EB", fontSize: 13, wordBreak: "break-all" }}>{item.websiteUrl}</a>
                      </div>
                      <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: "uppercase", background: (item.status || "pending") === "pending" ? "#FEF3C7" : (item.status || "pending") === "approved" ? "#DCFCE7" : (item.status || "pending") === "rejected" ? "#FEE2E2" : "#E0F2FE", color: (item.status || "pending") === "pending" ? "#92400E" : (item.status || "pending") === "approved" ? "#166534" : (item.status || "pending") === "rejected" ? "#991B1B" : "#075985" }}>{item.status || "pending"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 12, color: "#4B5563" }}>
                      <div><strong>Category:</strong> {item.category || item.categoryId || "Uncategorized"}</div>
                      <div><strong>Submitted by:</strong> {item.submittedByName || item.submittedByEmail || item.userEmail || "Guest"}</div>
                      <div><strong>Date:</strong> {formatAdminDate(item.createdAt) || "Recently"}</div>
                    </div>
                    {item.reason && <p style={{ margin: 0, color: "#374151", fontSize: 13, lineHeight: 1.5 }}>{item.reason}</p>}
                    {isSuperAdmin && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => window.open(item.websiteUrl, "_blank", "noopener,noreferrer")} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Open URL</button>
                        <button onClick={() => createWebsiteFromSuggestion(item)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #111827", background: "#111827", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Create Website</button>
                        <button onClick={() => updateSuggestionStatus(item, "approved")} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #BBF7D0", background: "#DCFCE7", color: "#166534", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Approve</button>
                        <button onClick={() => updateSuggestionStatus(item, "reviewed")} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #BAE6FD", background: "#E0F2FE", color: "#075985", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Mark Reviewed</button>
                        <button onClick={() => updateSuggestionStatus(item, "rejected")} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "feedback" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Website Feedback ({feedbackList.length})</h3>
            <button onClick={loadFeedback} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>{feedbackLoading ? "Loading..." : "🔄 Refresh"}</button>
          </div>
          {feedbackLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading feedback...</div>
          ) : feedbackList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>No feedback submitted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {feedbackList.map(fb => (
                <div key={fb.id} style={{ padding: 16, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: fb.type === "broken_link" ? "#FEF2F2" : fb.type === "suggestion" ? "#EFF6FF" : "#FFFBEB", color: fb.type === "broken_link" ? "#DC2626" : fb.type === "suggestion" ? "#2563EB" : "#D97706", textTransform: "uppercase" }}>{fb.type?.replace("_", " ") || "review"}</span>
                      <span style={{ fontSize: 13, color: "#F5A623", fontWeight: 700 }}>{'★'.repeat(fb.rating || 0)}{'☆'.repeat(5 - (fb.rating || 0))}</span>
                      <span style={{ fontSize: 12, color: fb.status === "reviewed" ? "#16A34A" : "#9CA3AF", fontWeight: 600 }}>{fb.status || "pending"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {fb.status !== "reviewed" && <button onClick={async () => { const db = getFirebaseDb(); if (!db) return; try { await updateDoc(doc(db, "websiteFeedback", fb.id), { status: "reviewed" }); setFeedbackList(prev => prev.map(f => f.id === fb.id ? { ...f, status: "reviewed" } : f)); } catch {} }} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #D1D5DB", background: "#fff", fontSize: 11, cursor: "pointer", color: "#16A34A", fontWeight: 600 }}>✓ Mark Reviewed</button>}
                      <button onClick={async () => { if (!confirm("Delete this feedback?")) return; const db = getFirebaseDb(); if (!db) return; try { await deleteDoc(doc(db, "websiteFeedback", fb.id)); setFeedbackList(prev => prev.filter(f => f.id !== fb.id)); } catch {} }} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #FECACA", background: "#FEF2F2", fontSize: 11, cursor: "pointer", color: "#DC2626", fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>{fb.comment || "No comment."}</p>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Website: {fb.websiteId} • User: {fb.userName || fb.uid} • {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleDateString() : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SortableCategoryRow({ cat, index, count, isSuperAdmin, toggleCategoryStatus, setEditingCategory, setConfirming }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderBottom: "1px solid #F3F4F6",
    background: isDragging ? "#F9FAFB" : "#fff",
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ padding: "14px 20px", fontWeight: 600, color: "#111827", cursor: "grab" }} {...attributes} {...listeners}>
        ☰ <span style={{ marginLeft: 6 }}>{cat.icon && <span style={{ marginRight: 6 }}>{cat.icon}</span>}{cat.name}</span>
      </td>
      <td style={{ padding: "14px 20px", color: "#6B7280", fontFamily: "monospace", fontSize: 12 }}>{cat.slug}</td>
      <td style={{ padding: "14px 20px" }}>
        <span style={{ background: cat.status === "inactive" ? "#F3F4F6" : "#DCFCE7", color: cat.status === "inactive" ? "#4B5563" : "#166534", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
          {cat.status || "active"}
        </span>
      </td>
      <td style={{ padding: "14px 20px", color: "#4B5563" }}>{count}</td>
      <td style={{ padding: "14px 20px", color: "#4B5563", fontWeight: 700 }}>{Number.isFinite(Number(cat.sortOrder)) ? Number(cat.sortOrder) : 999}</td>
      {isSuperAdmin && (
        <td style={{ padding: "14px 20px", textAlign: "right" }}>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <button onClick={() => toggleCategoryStatus(cat)} style={{ padding: "6px 12px", background: "none", border: "1px solid #E5E7EB", borderRadius: 6, color: "#4B5563", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {cat.status === "inactive" ? "Activate" : "Deactivate"}
            </button>
            <button onClick={() => setEditingCategory(cat)} style={{ padding: "6px 12px", background: "#F3F4F6", border: "none", borderRadius: 6, color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
            <button onClick={() => setConfirming({ action: "delete_category", item: cat })} style={{ padding: "6px 12px", background: "#FEF2F2", border: "none", borderRadius: 6, color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }} disabled={count > 0} title={count > 0 ? "Cannot delete category with websites mapped to it." : ""}>Delete</button>
          </div>
        </td>
      )}
    </tr>
  );
}
