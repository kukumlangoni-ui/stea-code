import React, { useEffect, useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "./AdminLayout.jsx";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { getFirebaseDb, uploadToStorage } from "../firebase.js";
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { createAuditLog } from "./auditLog.js";
import { AdminConfirmationModal } from "./AdminConfirmationModal.jsx";
import { useCustomCategories } from "../hooks/useCustomCategories.js";
import { createAutomaticNotification } from "../services/notificationService.js";
import SteaCodeCommercePanel from "./SteaCodeCommercePanel.jsx";

const LEGACY_COLLECTIONS = ["tips_resources", "resources", "updates", "study_resources"];
const CODE_COLLECTION = "stea_code_resources";
const INSPIRATION_COLLECTION = "stea_code_inspiration";
const HOSTING_COLLECTION = "stea_code_hosting";
const DIRECTORY_COLLECTION = "stea_code_resources_directory";

const DEFAULT_CATEGORIES = [
  { id: "web-development", name: "Web Development", slug: "web-development" },
  { id: "vibe-coding", name: "Vibe Coding", slug: "vibe-coding" },
  { id: "ai-coding", name: "AI Coding", slug: "ai-coding" },
  { id: "deployment", name: "Deployment", slug: "deployment" },
  { id: "firebase", name: "Firebase", slug: "firebase" },
  { id: "react", name: "React", slug: "react" },
  { id: "css", name: "CSS", slug: "css" },
  { id: "javascript", name: "JavaScript", slug: "javascript" },
  { id: "pdf-guides", name: "PDF Guides", slug: "pdf-guides" },
  { id: "videos", name: "Videos", slug: "videos" },
];

const TABS = [
  ["products", "Products"],
  ["categories", "Categories"],
  ["orders", "Orders"],
  ["payments", "Payments"],
  ["users", "Users"],
  ["entitlements", "Entitlements"],
  ["directory", "Developer Resources"],
  ["hosting", "Hosting"],
  ["inspiration", "Website Inspiration"],
  ["legacy", "More / Legacy"],
];

const codeInitial = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  category: "Components",
  tags: "",
  framework: "React",
  language: "JSX",
  difficulty: "Beginner",
  thumbnailUrl: "",
  previewImageUrl: "",
  demoUrl: "",
  sourceUrl: "",
  downloadUrl: "",
  videoUrl: "",
  codeHtml: "",
  codeCss: "",
  codeJs: "",
  codeReact: "",
  codeOther: "",
  copyableCode: "",
  installationInstructions: "",
  usageInstructions: "",
  dependencies: "",
  featured: true,
  published: true,
  sortOrder: 50,
};

const inspirationInitial = {
  name: "",
  url: "",
  description: "",
  category: "UI Inspiration",
  tags: "",
  logoUrl: "",
  thumbnailUrl: "",
  bestFor: "",
  featured: false,
  published: true,
  sortOrder: 50,
};

const hostingInitial = {
  name: "",
  url: "",
  description: "",
  bestFor: "",
  freeTier: "",
  difficulty: "Beginner",
  type: "Frontend Hosting",
  logoUrl: "",
  guideUrl: "",
  featured: false,
  published: true,
  sortOrder: 50,
};

const directoryInitial = {
  name: "",
  url: "",
  description: "",
  category: "Developer Tools",
  tags: "",
  icon: "",
  logoUrl: "",
  featured: false,
  published: true,
  sortOrder: 50,
};

const guideInitial = {
  title: "",
  description: "",
  type: "PDF",
  category: "Web Development",
  mediaUrl: "",
  thumbnailUrl: "",
  pdfUrl: "",
  body: "",
  duration: "",
  language: "",
  link: "",
};

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tagsToArray(value) {
  if (Array.isArray(value)) return value;
  return String(value || "").split(",").map((tag) => tag.trim()).filter(Boolean);
}

function toBool(value) {
  return value === true || value === "true";
}

function timeValue(value) {
  if (!value) return 0;
  if (value.toMillis) return value.toMillis();
  if (value.toDate) return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime() || 0;
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", padding: 16 }}>
      <button onClick={onClose} aria-label="Close" style={{ position: "absolute", inset: 0, border: 0, background: "rgba(17,24,39,.62)" }} />
      <section style={{ position: "relative", width: "min(100%, " + (wide ? "920px" : "620px") + ")", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 24px 70px rgba(0,0,0,.24)" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{title}</h3>
          <button onClick={onClose} style={iconButton}><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

const iconButton = { border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, width: 34, height: 34, display: "inline-grid", placeItems: "center", cursor: "pointer", color: "#374151" };
const fieldStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, outlineColor: "#D4AF37", background: "#fff" };
const labelStyle = { display: "grid", gap: 6, fontSize: 13, fontWeight: 800, color: "#374151" };

function TextField({ label, value, onChange, type = "text", placeholder = "", textarea = false, rows = 3, disabled = false }) {
  return (
    <label style={labelStyle}>
      {label}
      {textarea ? (
        <textarea rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ ...fieldStyle, resize: "vertical", fontFamily: "inherit" }} />
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} placeholder={placeholder} disabled={disabled} style={fieldStyle} />
      )}
    </label>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <label style={labelStyle}>
      {label}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={fieldStyle}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ToggleField({ label, checked, onChange, disabled = false }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#374151" }}>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      {label}
    </label>
  );
}

function FormSection({ title, children }) {
  return (
    <section style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, display: "grid", gap: 14 }}>
      <h4 style={{ margin: 0, fontSize: 14, color: "#111827" }}>{title}</h4>
      {children}
    </section>
  );
}

function CodeEditorModal({ item, onClose, onSave, isSuperAdmin }) {
  const [form, setForm] = useState({ ...codeInitial, ...(item || {}), tags: Array.isArray(item?.tags) ? item.tags.join(", ") : item?.tags || "" });
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value, ...(key === "title" && !prev.slug ? { slug: slugify(value) } : {}) }));

  return (
    <Modal title={item ? "Edit Code Resource" : "Add Code Resource"} onClose={onClose} wide>
      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        <FormSection title="Basic">
          <div className="admin-v2-form-grid">
            <TextField label="Title" value={form.title} onChange={(v) => update("title", v)} disabled={!isSuperAdmin} />
            <TextField label="Slug" value={form.slug} onChange={(v) => update("slug", slugify(v))} disabled={!isSuperAdmin} />
          </div>
          <TextField label="Short Description" value={form.shortDescription} onChange={(v) => update("shortDescription", v)} disabled={!isSuperAdmin} />
          <TextField label="Full Description" value={form.fullDescription} onChange={(v) => update("fullDescription", v)} textarea rows={4} disabled={!isSuperAdmin} />
          <div className="admin-v2-form-grid">
            <SelectField label="Category" value={form.category} onChange={(v) => update("category", v)} options={["Animated text", "Hero effects", "Buttons", "Navigation", "Cards", "Background effects", "Loaders", "Scroll animations", "React components", "CSS components", "JavaScript effects", "GSAP effects", "Three.js effects", "Framer Motion examples", "Tailwind components", "Components"]} disabled={!isSuperAdmin} />
            <SelectField label="Framework" value={form.framework} onChange={(v) => update("framework", v)} options={["HTML/CSS", "JavaScript", "React", "Next.js", "Tailwind", "GSAP", "Framer Motion", "Three.js", "Other"]} disabled={!isSuperAdmin} />
            <SelectField label="Language" value={form.language} onChange={(v) => update("language", v)} options={["HTML", "CSS", "JavaScript", "JSX", "TSX", "TypeScript", "Mixed"]} disabled={!isSuperAdmin} />
            <SelectField label="Difficulty" value={form.difficulty} onChange={(v) => update("difficulty", v)} options={["Beginner", "Intermediate", "Advanced"]} disabled={!isSuperAdmin} />
          </div>
          <TextField label="Tags, comma separated" value={form.tags} onChange={(v) => update("tags", v)} disabled={!isSuperAdmin} />
        </FormSection>

        <FormSection title="Code">
          <TextField label="HTML" value={form.codeHtml} onChange={(v) => update("codeHtml", v)} textarea rows={5} disabled={!isSuperAdmin} />
          <TextField label="CSS" value={form.codeCss} onChange={(v) => update("codeCss", v)} textarea rows={5} disabled={!isSuperAdmin} />
          <TextField label="JavaScript" value={form.codeJs} onChange={(v) => update("codeJs", v)} textarea rows={5} disabled={!isSuperAdmin} />
          <TextField label="React / JSX" value={form.codeReact} onChange={(v) => update("codeReact", v)} textarea rows={5} disabled={!isSuperAdmin} />
          <TextField label="Other Code" value={form.codeOther} onChange={(v) => update("codeOther", v)} textarea rows={4} disabled={!isSuperAdmin} />
          <TextField label="Copyable Code Override" value={form.copyableCode} onChange={(v) => update("copyableCode", v)} textarea rows={4} disabled={!isSuperAdmin} />
        </FormSection>

        <FormSection title="Preview & Download">
          <div className="admin-v2-form-grid">
            <TextField label="Thumbnail URL" value={form.thumbnailUrl} onChange={(v) => update("thumbnailUrl", v)} disabled={!isSuperAdmin} />
            <TextField label="Preview Image URL" value={form.previewImageUrl} onChange={(v) => update("previewImageUrl", v)} disabled={!isSuperAdmin} />
            <TextField label="Live Demo URL" value={form.demoUrl} onChange={(v) => update("demoUrl", v)} disabled={!isSuperAdmin} />
            <TextField label="Download ZIP URL" value={form.downloadUrl} onChange={(v) => update("downloadUrl", v)} disabled={!isSuperAdmin} />
            <TextField label="Source URL" value={form.sourceUrl} onChange={(v) => update("sourceUrl", v)} disabled={!isSuperAdmin} />
            <TextField label="Video URL" value={form.videoUrl} onChange={(v) => update("videoUrl", v)} disabled={!isSuperAdmin} />
          </div>
        </FormSection>

        <FormSection title="Instructions">
          <TextField label="Dependencies" value={form.dependencies} onChange={(v) => update("dependencies", v)} textarea rows={3} disabled={!isSuperAdmin} />
          <TextField label="Installation Instructions" value={form.installationInstructions} onChange={(v) => update("installationInstructions", v)} textarea rows={4} disabled={!isSuperAdmin} />
          <TextField label="Usage Instructions" value={form.usageInstructions} onChange={(v) => update("usageInstructions", v)} textarea rows={4} disabled={!isSuperAdmin} />
        </FormSection>

        <FormSection title="Publishing">
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <ToggleField label="Published" checked={form.published} onChange={(v) => update("published", v)} disabled={!isSuperAdmin} />
            <ToggleField label="Featured" checked={form.featured} onChange={(v) => update("featured", v)} disabled={!isSuperAdmin} />
          </div>
          <TextField label="Sort Order" type="number" value={form.sortOrder} onChange={(v) => update("sortOrder", v)} disabled={!isSuperAdmin} />
        </FormSection>

        <div className="admin-v2-card-actions">
          <button className="admin-v2-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-v2-btn-primary" disabled={!isSuperAdmin || !form.title.trim() || saving} onClick={async () => {
            setSaving(true);
            await onSave({ ...form, slug: form.slug || slugify(form.title), tags: tagsToArray(form.tags) });
            setSaving(false);
          }}>{saving && <Loader2 size={16} />} Save Code</button>
        </div>
      </div>
    </Modal>
  );
}

function SimpleResourceModal({ title, item, initial, fields, onClose, onSave, isSuperAdmin }) {
  const [form, setForm] = useState({ ...initial, ...(item || {}), tags: Array.isArray(item?.tags) ? item.tags.join(", ") : item?.tags || "" });
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal title={item ? `Edit ${title}` : `Add ${title}`} onClose={onClose}>
      <div style={{ padding: 20, display: "grid", gap: 14 }}>
        {fields.map((field) => {
          if (field.kind === "select") return <SelectField key={field.key} label={field.label} value={form[field.key]} onChange={(v) => update(field.key, v)} options={field.options} disabled={!isSuperAdmin} />;
          if (field.kind === "toggle") return <ToggleField key={field.key} label={field.label} checked={form[field.key]} onChange={(v) => update(field.key, v)} disabled={!isSuperAdmin} />;
          return <TextField key={field.key} label={field.label} type={field.type || "text"} textarea={field.textarea} rows={field.rows || 3} value={form[field.key]} onChange={(v) => update(field.key, v)} disabled={!isSuperAdmin} />;
        })}
        <div className="admin-v2-card-actions">
          <button className="admin-v2-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-v2-btn-primary" disabled={!isSuperAdmin || saving || !(form.name || form.title)} onClick={async () => {
            setSaving(true);
            await onSave({ ...form, tags: tagsToArray(form.tags) });
            setSaving(false);
          }}>{saving && <Loader2 size={16} />} Save</button>
        </div>
      </div>
    </Modal>
  );
}

function CategoryEditorModal({ category, onClose, onSave, isSuperAdmin }) {
  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    type: category?.type || "guide",
    icon: category?.icon || "",
    description: category?.description || "",
    sortOrder: typeof category?.sortOrder === "number" ? category.sortOrder : 50,
    active: category?.active ?? category?.status !== "inactive",
  });
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value, ...(key === "name" && !prev.slug ? { slug: slugify(value) } : {}) }));

  return (
    <Modal title={category ? "Edit Category" : "Add Category"} onClose={onClose}>
      <div style={{ padding: 20, display: "grid", gap: 14 }}>
        <TextField label="Name" value={form.name} onChange={(v) => update("name", v)} disabled={!isSuperAdmin} />
        <TextField label="Slug" value={form.slug} onChange={(v) => update("slug", slugify(v))} disabled={!isSuperAdmin} />
        <SelectField label="Type" value={form.type} onChange={(v) => update("type", v)} options={["code", "inspiration", "hosting", "resource", "guide"]} disabled={!isSuperAdmin} />
        <TextField label="Icon" value={form.icon} onChange={(v) => update("icon", v)} disabled={!isSuperAdmin} />
        <TextField label="Description" value={form.description} onChange={(v) => update("description", v)} textarea disabled={!isSuperAdmin} />
        <TextField label="Sort Order" type="number" value={form.sortOrder} onChange={(v) => update("sortOrder", v)} disabled={!isSuperAdmin} />
        <ToggleField label="Active" checked={form.active} onChange={(v) => update("active", v)} disabled={!isSuperAdmin} />
        <div className="admin-v2-card-actions">
          <button className="admin-v2-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="admin-v2-btn-primary" disabled={!isSuperAdmin || !form.name.trim()} onClick={() => onSave({ ...(category || {}), ...form, status: form.active ? "active" : "inactive" })}>Save Category</button>
        </div>
      </div>
    </Modal>
  );
}

function GuideForm({ form, setForm, categories, onUpload, uploading, fileInputRef, isSuperAdmin, onSubmit }) {
  return (
    <div className="admin-v2-card">
      <div className="admin-v2-card-header">
        <h3 className="admin-v2-card-title">Add Guide, PDF, Video or Tech Note</h3>
        <p className="admin-v2-card-subtitle">Publishes to STEA Code resources using the current STEA Code collections.</p>
      </div>
      <div style={{ padding: "0 20px 20px", display: "grid", gap: 14, maxWidth: 760 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {["Video", "PDF", "Article", "Tip / Update"].map((type) => (
            <button key={type} onClick={() => setForm((prev) => ({ ...prev, type }))} style={{ whiteSpace: "nowrap", border: form.type === type ? "1px solid #111827" : "1px solid #E5E7EB", background: form.type === type ? "#111827" : "#fff", color: form.type === type ? "#fff" : "#374151", borderRadius: 999, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>{type}</button>
          ))}
        </div>
        <TextField label="Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} disabled={!isSuperAdmin} />
        <TextField label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} textarea disabled={!isSuperAdmin} />
        <div className="admin-v2-form-grid">
          <SelectField label="Category" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={categories.map((cat) => cat.name)} disabled={!isSuperAdmin} />
          <TextField label="Thumbnail URL" value={form.thumbnailUrl} onChange={(v) => setForm((p) => ({ ...p, thumbnailUrl: v }))} disabled={!isSuperAdmin} />
        </div>
        {form.type === "Video" && (
          <div className="admin-v2-form-grid">
            <TextField label="Video URL" value={form.mediaUrl} onChange={(v) => setForm((p) => ({ ...p, mediaUrl: v }))} disabled={!isSuperAdmin} />
            <TextField label="Duration" value={form.duration} onChange={(v) => setForm((p) => ({ ...p, duration: v }))} disabled={!isSuperAdmin} />
            <TextField label="Language" value={form.language} onChange={(v) => setForm((p) => ({ ...p, language: v }))} disabled={!isSuperAdmin} />
          </div>
        )}
        {form.type === "PDF" && (
          <div>
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={onUpload} style={{ display: "none" }} disabled={!isSuperAdmin || uploading} />
            <button onClick={() => fileInputRef.current?.click()} disabled={!isSuperAdmin || uploading} style={{ border: "1px dashed #D1D5DB", background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>{uploading ? <Loader2 size={16} /> : <UploadCloud size={16} />} {uploading ? "Uploading..." : "Upload PDF"}</button>
            {form.pdfUrl && <span style={{ marginLeft: 10, color: "#059669", fontSize: 13, fontWeight: 800 }}><CheckCircle size={14} /> Uploaded</span>}
          </div>
        )}
        {form.type === "Article" && <TextField label="Article Body" value={form.body} onChange={(v) => setForm((p) => ({ ...p, body: v }))} textarea rows={6} disabled={!isSuperAdmin} />}
        {form.type === "Tip / Update" && <TextField label="Optional Link" value={form.link} onChange={(v) => setForm((p) => ({ ...p, link: v }))} disabled={!isSuperAdmin} />}
        <div className="admin-v2-card-actions">
          <button className="admin-v2-btn-primary" disabled={!isSuperAdmin || !form.title || (form.type === "PDF" && !form.pdfUrl) || (form.type === "Video" && !form.mediaUrl)} onClick={onSubmit}><Plus size={16} /> Publish Guide</button>
        </div>
      </div>
    </div>
  );
}

function AdminTable({ title, subtitle, items, empty, onAdd, addLabel, columns, isSuperAdmin }) {
  const [filters, setFilters] = useState({ q: "", category: "", status: "", published: "" });
  const categories = useMemo(() => [...new Set(items.map((item) => item.category || item.categoryName || item.type).filter(Boolean))].sort(), [items]);
  const visibleItems = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return items.filter((item) => {
      if (needle && ![item.title, item.name, item.slug, item.description, item.url, item.demoUrl, item._source].join(" ").toLowerCase().includes(needle)) return false;
      if (filters.category && (item.category || item.categoryName || item.type) !== filters.category) return false;
      if (filters.status && String(item.status || (toBool(item.published) ? "published" : "draft")).toLowerCase() !== filters.status) return false;
      if (filters.published === "published" && !toBool(item.published) && item.status !== "published") return false;
      if (filters.published === "unpublished" && (toBool(item.published) || item.status === "published")) return false;
      return true;
    });
  }, [filters, items]);

  return (
    <div className="admin-v2-card">
      <div className="admin-v2-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h3 className="admin-v2-card-title">{title}</h3>
          <p className="admin-v2-card-subtitle">{subtitle}</p>
        </div>
        {isSuperAdmin && <button className="admin-v2-btn-primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>}
      </div>
      <div className="admin-v2-filter-grid" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", paddingTop: 0 }}>
        <label>Search<input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search rows" /></label>
        <label>Category<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option value="">All categories</option>{categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
        <label>Publish state<select value={filters.published} onChange={(event) => setFilters((current) => ({ ...current, published: event.target.value }))}><option value="">Published + unpublished</option><option value="published">Published only</option><option value="unpublished">Unpublished only</option></select></label>
      </div>
      <div className="admin-v2-table-wrap">
        <table className="admin-v2-table">
          <thead>
            <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => <tr key={item.id}>{columns.map((col) => <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>)}</tr>)}
            {visibleItems.length === 0 && <tr><td colSpan={columns.length} style={{ textAlign: "center", color: "#6B7280", padding: 28 }}>{items.length === 0 ? empty : "No rows match the current filters."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const colors = {
    green: ["#ECFDF5", "#047857"],
    amber: ["#FFFBEB", "#B45309"],
    blue: ["#EFF6FF", "#1D4ED8"],
    neutral: ["#F3F4F6", "#374151"],
  };
  const [bg, color] = colors[tone] || colors.neutral;
  return <span style={{ display: "inline-flex", borderRadius: 999, background: bg, color, padding: "3px 8px", fontSize: 11, fontWeight: 800 }}>{children}</span>;
}

export default function SteaCodePage({ isSuperAdmin, devPreview = false, initialTab = "products", compactHeader = false, hideInternalTabs = false, dedicatedAdmin = false, baseRoute = "/admin" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [codeItems, setCodeItems] = useState([]);
  const [inspirationItems, setInspirationItems] = useState([]);
  const [hostingItems, setHostingItems] = useState([]);
  const [directoryItems, setDirectoryItems] = useState([]);
  const [legacyItems, setLegacyItems] = useState([]);
  const [loadErrors, setLoadErrors] = useState({});
  const [collectionLoading, setCollectionLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [guideForm, setGuideForm] = useState(guideInitial);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [commerceCounts, setCommerceCounts] = useState({ products: null, orders: null, entitlements: null });
  const fileInputRef = useRef(null);

  const DEV_LOG = (typeof import.meta !== "undefined" && import.meta.env?.DEV === true)
    ? (...args) => console.log("[SteaCodeAdmin]", ...args)
    : () => {};

  const { categories: rawCategories, loading: catsLoading } = useCustomCategories("stea_code_categories", DEFAULT_CATEGORIES);
  const activeCategories = useMemo(() => {
    const source = !catsLoading && rawCategories.length === 0 ? DEFAULT_CATEGORIES : rawCategories;
    return source.filter((cat) => cat.status !== "inactive" && cat.active !== false);
  }, [rawCategories, catsLoading]);

  const refreshData = async () => {
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const errors = {};
    const loadingMap = {};
    const read = async (collectionName, max = 200) => {
      loadingMap[collectionName] = true;
      setCollectionLoading((prev) => ({ ...prev, [collectionName]: true }));
      try {
        const snap = await withTimeout(getDocs(query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(max))), 4500);
        loadingMap[collectionName] = false;
        setCollectionLoading((prev) => ({ ...prev, [collectionName]: false }));
        const docs = snap.docs.map((d) => ({ id: d.id, _source: collectionName, ...d.data() }));
        DEV_LOG(`source=${collectionName} count=${docs.length}`);
        return docs;
      } catch (error) {
        try {
          const snap = await withTimeout(getDocs(query(collection(db, collectionName), limit(max))), 4500);
          loadingMap[collectionName] = false;
          setCollectionLoading((prev) => ({ ...prev, [collectionName]: false }));
          const docs = snap.docs.map((d) => ({ id: d.id, _source: collectionName, ...d.data() }));
          DEV_LOG(`source=${collectionName} count=${docs.length} (fallback no-orderBy)`);
          return docs;
        } catch (fallbackError) {
          loadingMap[collectionName] = false;
          setCollectionLoading((prev) => ({ ...prev, [collectionName]: false }));
          const errMsg = fallbackError?.message || "Firestore read failed";
          console.warn(`Could not load ${collectionName}`, errMsg);
          errors[collectionName] = errMsg;
          DEV_LOG(`source=${collectionName} ERROR=${errMsg}`);
          return [];
        }
      }
    };

    const [code, inspiration, hosting, directory, ...legacy] = await Promise.all([
      read(CODE_COLLECTION),
      read(INSPIRATION_COLLECTION),
      read(HOSTING_COLLECTION),
      read(DIRECTORY_COLLECTION),
      ...LEGACY_COLLECTIONS.map((name) => read(name, 80)),
    ]);
    setCodeItems(code.sort(sortContent));
    setInspirationItems(inspiration.sort(sortContent));
    setHostingItems(hosting.sort(sortContent));
    setDirectoryItems(directory.sort(sortContent));
    setLegacyItems(legacy.flat().sort((a, b) => timeValue(b.updatedAt || b.createdAt) - timeValue(a.updatedAt || a.createdAt)));
    setLoadErrors(errors);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const saveDoc = async (collectionName, data, existingId = null) => {
    const db = getFirebaseDb();
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (existingId) {
      await updateDoc(doc(db, collectionName, existingId), payload);
      await createAuditLog("update_stea_code_content", collectionName, existingId, null, payload, "Admin updated STEA Code content");
    } else {
      payload.createdAt = serverTimestamp();
      const created = await addDoc(collection(db, collectionName), payload);
      await createAuditLog("create_stea_code_content", collectionName, created.id, null, payload, "Admin created STEA Code content");
    }
    setModal(null);
    await refreshData();
  };

  const duplicateDoc = async (collectionName, item) => {
    const copy = { ...item };
    delete copy.id;
    delete copy._source;
    copy.title = item.title ? `${item.title} Copy` : item.name ? `${item.name} Copy` : "Copy";
    copy.name = item.name ? `${item.name} Copy` : item.name;
    copy.slug = item.slug ? `${item.slug}-copy-${Date.now()}` : "";
    copy.published = false;
    await saveDoc(collectionName, copy);
  };

  const updateBoolean = async (collectionName, item, key) => {
    await saveDoc(collectionName, { [key]: !toBool(item[key]) }, item.id);
  };

  const moveSort = async (collectionName, item, delta) => {
    await saveDoc(collectionName, { sortOrder: Number(item.sortOrder || 50) + delta }, item.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const db = getFirebaseDb();
    await deleteDoc(doc(db, deleteTarget.collectionName, deleteTarget.item.id));
    await createAuditLog("delete_stea_code_content", deleteTarget.collectionName, deleteTarget.item.id, deleteTarget.item, null, "Delete this STEA Code resource?");
    setDeleteTarget(null);
    await refreshData();
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const path = `stea_code/guides/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const url = await uploadToStorage(file, path);
      setGuideForm((prev) => ({ ...prev, mediaUrl: url, pdfUrl: url }));
    } catch (error) {
      console.error(error);
      alert("Failed to upload PDF. Please try again.");
    }
    setUploadingPdf(false);
  };

  const publishGuide = async () => {
    const db = getFirebaseDb();
    let resolvedType = guideForm.type;
    if (resolvedType === "PDF") resolvedType = "pdf";
    if (resolvedType === "Video") resolvedType = "Video Tutorial";
    if (resolvedType === "Tip / Update") resolvedType = "Tech Tip";

    const payload = {
      title: guideForm.title,
      description: guideForm.description,
      type: resolvedType,
      category: guideForm.category,
      categoryName: guideForm.category,
      thumbnailUrl: guideForm.thumbnailUrl || null,
      status: "published",
      published: true,
      source: "stea_code",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    if (guideForm.type === "Video") {
      payload.mediaUrl = guideForm.mediaUrl;
      payload.duration = guideForm.duration;
      payload.language = guideForm.language;
    } else if (guideForm.type === "PDF") {
      payload.pdfUrl = guideForm.pdfUrl || guideForm.mediaUrl;
      payload.fileUrl = guideForm.pdfUrl || guideForm.mediaUrl;
    } else if (guideForm.type === "Article") {
      payload.body = guideForm.body;
    } else {
      payload.link = guideForm.link;
    }

    const created = await addDoc(collection(db, "stea_code_resources"), payload);
    await createAuditLog("publish_stea_code_content", "stea_code_resources", created.id, null, payload, "Admin published STEA Code guide");
    if (isSuperAdmin) {
      await createAutomaticNotification({
        source: "stea_code",
        sourceId: created.id,
        title: "New STEA Code content",
        message: guideForm.title,
        type: "STEA Code",
        actionLink: "/daily",
      });
    }
    setGuideForm({ ...guideInitial, category: activeCategories[0]?.name || guideInitial.category });
    await refreshData();
  };

  const saveCategory = async (categoryData) => {
    await saveDoc("stea_code_categories", {
      name: categoryData.name,
      slug: categoryData.slug || slugify(categoryData.name),
      type: categoryData.type || "guide",
      icon: categoryData.icon || "",
      description: categoryData.description || "",
      sortOrder: Number(categoryData.sortOrder || 50),
      active: categoryData.active !== false,
      status: categoryData.active === false ? "inactive" : "active",
    }, categoryData.id);
  };

  const commonActions = (collectionName, type) => (item) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button style={iconButton} title="Edit" onClick={() => setModal({ type, item })}><Edit size={15} /></button>
      <button style={iconButton} title="Duplicate" onClick={() => duplicateDoc(collectionName, item)}><Copy size={15} /></button>
      <button style={iconButton} title="Move up" onClick={() => moveSort(collectionName, item, -1)}>↑</button>
      <button style={iconButton} title="Move down" onClick={() => moveSort(collectionName, item, 1)}>↓</button>
      <button style={iconButton} title="Delete" onClick={() => setDeleteTarget({ collectionName, item })}><Trash2 size={15} /></button>
    </div>
  );

  const publishFeatureActions = (collectionName, item) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button className="admin-v2-btn-secondary" style={{ padding: "6px 9px", fontSize: 12 }} onClick={() => updateBoolean(collectionName, item, "published")}>{toBool(item.published) ? "Unpublish" : "Publish"}</button>
      <button className="admin-v2-btn-secondary" style={{ padding: "6px 9px", fontSize: 12 }} onClick={() => updateBoolean(collectionName, item, "featured")}>{toBool(item.featured) ? "Unfeature" : "Feature"}</button>
    </div>
  );

  const metrics = [
    ["Published Code", codeItems.filter((item) => toBool(item.published)).length],
    ["Draft Code", codeItems.filter((item) => !toBool(item.published)).length],
    ["Website Inspiration", inspirationItems.length],
    ["Hosting Resources", hostingItems.length],
    ["Developer Resources", directoryItems.length],
    ["Guides / PDFs", legacyItems.filter((item) => item.pdfUrl || item.fileUrl || String(item.type || "").toLowerCase().includes("pdf")).length],
  ];

  const recent = [...codeItems, ...inspirationItems, ...hostingItems, ...directoryItems, ...legacyItems]
    .sort((a, b) => timeValue(b.updatedAt || b.createdAt) - timeValue(a.updatedAt || a.createdAt))
    .slice(0, 8);

  return (
    <>
      {!compactHeader && !hideInternalTabs && <AdminPageHeader title="STEA Code Product Studio" description="Manage canonical products, developer resources, hosting, website inspiration, categories, orders and entitlements." />}

      {!hideInternalTabs && (
        <div className="admin-v2-tabs" style={{ marginBottom: 24, marginTop: 16, overflowX: "auto" }}>
          {TABS.map(([id, label]) => <button key={id} className={`admin-v2-tab ${activeTab === id ? "is-active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>)}
        </div>
      )}

      {dedicatedAdmin && (
        <div className="sca-admin-health" aria-label="STEA Code Admin health summary">
          <span>Products: <strong>{commerceCounts.products ?? "—"}</strong></span>
          <span>Resources: <strong>{directoryItems.length}</strong></span>
          <span>Hosting: <strong>{hostingItems.length}</strong></span>
          <span>Inspiration: <strong>{inspirationItems.length}</strong></span>
          <span>Orders: <strong>{commerceCounts.orders ?? "—"}</strong></span>
          <span>Entitlements: <strong>{commerceCounts.entitlements ?? "—"}</strong></span>
        </div>
      )}

      {["products", "orders", "entitlements", "users", "payments"].includes(activeTab) && (
        <SteaCodeCommercePanel key={activeTab} isSuperAdmin={isSuperAdmin} initialTab={activeTab} embedded devPreview={devPreview} onCountsChange={setCommerceCounts} dedicatedAdmin={dedicatedAdmin} baseRoute={baseRoute} />
      )}

      {!["products", "orders", "entitlements", "users", "payments"].includes(activeTab) && loading && <div className="admin-v2-card" style={{ padding: 20, color: "#6B7280" }}>Loading STEA Code resources...</div>}
      {!["products", "orders", "entitlements", "users", "payments"].includes(activeTab) && Object.keys(loadErrors).length > 0 && (
        <div className="admin-v2-error">
          {Object.entries(loadErrors).map(([name, message]) => (
            <div key={name}>Unable to load {name}: {message}</div>
          ))}
        </div>
      )}

      {!loading && activeTab === "legacy" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="admin-v2-grid-premium">
            {metrics.map(([label, value]) => <div className="admin-v2-card" key={label} style={{ padding: 18 }}><div style={{ color: "#6B7280", fontSize: 12, fontWeight: 800 }}>{label}</div><strong style={{ display: "block", marginTop: 8, fontSize: 28, color: "#111827" }}>{value}</strong></div>)}
          </div>
          <div className="admin-v2-card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", color: "#111827" }}>Quick Add</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="admin-v2-btn-primary" onClick={() => setModal({ type: "code" })}><Plus size={16} /> Add Legacy Code</button>
              <button className="admin-v2-btn-primary" onClick={() => setModal({ type: "inspiration" })}><Plus size={16} /> Add Website</button>
              <button className="admin-v2-btn-primary" onClick={() => setModal({ type: "hosting" })}><Plus size={16} /> Add Hosting Resource</button>
              <button className="admin-v2-btn-primary" onClick={() => setModal({ type: "directory" })}><Plus size={16} /> Add Developer Resource</button>
              <button className="admin-v2-btn-secondary" onClick={() => setActiveTab("legacy-guides")}><Plus size={16} /> Add Guide</button>
            </div>
          </div>
          <div className="admin-v2-card">
            <div className="admin-v2-card-header"><h3 className="admin-v2-card-title">Recent Content</h3><p className="admin-v2-card-subtitle">Recently created or edited STEA Code items.</p></div>
            <div className="admin-v2-table-wrap">
              <table className="admin-v2-table"><tbody>{recent.map((item) => <tr key={`${item._source}-${item.id}`}><td><strong>{item.title || item.name}</strong><div style={{ color: "#6B7280", fontSize: 12 }}>{item._source}</div></td><td>{item.category || item.type || item.framework || ""}</td><td>{toBool(item.published) || item.status === "published" ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}</td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "legacy-code" && (
        <AdminTable
          title="Code Library"
          subtitle="Reusable snippets, components and effects for the public STEA Code page."
          items={codeItems}
          empty="No code resources yet. Create your first reusable component."
          addLabel="Add Code"
          onAdd={() => setModal({ type: "code" })}
          isSuperAdmin={isSuperAdmin}
          columns={[
            { key: "title", label: "Title", render: (item) => <><strong>{item.title}</strong><div style={{ color: "#6B7280", fontSize: 12 }}>{item.framework} · {item.difficulty}</div></> },
            { key: "category", label: "Category" },
            { key: "published", label: "Status", render: (item) => <div style={{ display: "grid", gap: 6 }}>{toBool(item.published) ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}{toBool(item.featured) && <Badge tone="blue">Featured</Badge>}</div> },
            { key: "toggles", label: "Publish", render: (item) => publishFeatureActions(CODE_COLLECTION, item) },
            { key: "actions", label: "Actions", render: commonActions(CODE_COLLECTION, "code") },
          ]}
        />
      )}

      {!loading && activeTab === "inspiration" && <SimpleSection title="Website Inspiration" subtitle="Admin-managed inspiration links for builders." items={inspirationItems} empty="No inspiration websites yet." collectionName={INSPIRATION_COLLECTION} type="inspiration" addLabel="Add Website" setModal={setModal} commonActions={commonActions} publishFeatureActions={publishFeatureActions} isSuperAdmin={isSuperAdmin} loadError={loadErrors[INSPIRATION_COLLECTION]} isLoading={collectionLoading[INSPIRATION_COLLECTION]} onRetry={refreshData} />}
      {!loading && activeTab === "hosting" && <SimpleSection title="Hosting" subtitle="Hosting and deployment resources for beginner builders." items={hostingItems} empty="No hosting resources yet." collectionName={HOSTING_COLLECTION} type="hosting" addLabel="Add Hosting" setModal={setModal} commonActions={commonActions} publishFeatureActions={publishFeatureActions} isSuperAdmin={isSuperAdmin} loadError={loadErrors[HOSTING_COLLECTION]} isLoading={collectionLoading[HOSTING_COLLECTION]} onRetry={refreshData} />}
      {!loading && activeTab === "directory" && <SimpleSection title="Developer Resources" subtitle="Small useful links for icons, fonts, APIs, testing, AI coding and more." items={directoryItems} empty="No developer resources yet." collectionName={DIRECTORY_COLLECTION} type="directory" addLabel="Add Resource" setModal={setModal} commonActions={commonActions} publishFeatureActions={publishFeatureActions} isSuperAdmin={isSuperAdmin} loadError={loadErrors[DIRECTORY_COLLECTION]} isLoading={collectionLoading[DIRECTORY_COLLECTION]} onRetry={refreshData} />}

      {!loading && activeTab === "legacy-guides" && (
        <GuideForm form={guideForm} setForm={setGuideForm} categories={activeCategories} onUpload={handlePdfUpload} uploading={uploadingPdf} fileInputRef={fileInputRef} isSuperAdmin={isSuperAdmin} onSubmit={publishGuide} />
      )}

      {!loading && activeTab === "legacy-existing" && (
        <AdminTable
          title="Existing Content"
          subtitle="Legacy guides, PDFs, videos and resources still powering STEA Code."
          items={legacyItems}
          empty="No existing content found across legacy collections."
          addLabel="Add Guide"
          onAdd={() => setActiveTab("legacy-guides")}
          isSuperAdmin={isSuperAdmin}
          columns={[
            { key: "title", label: "Title", render: (item) => <><strong>{item.title || item.name}</strong><div style={{ color: "#6B7280", fontSize: 12 }}>{item._source}</div></> },
            { key: "category", label: "Category", render: (item) => item.categoryName || item.category || "Uncategorized" },
            { key: "type", label: "Type", render: (item) => item.type || item.fileType || "Post" },
            { key: "url", label: "Link", render: (item) => (item.pdfUrl || item.fileUrl || item.downloadUrl || item.mediaUrl || item.link || item.url) ? <a href={item.pdfUrl || item.fileUrl || item.downloadUrl || item.mediaUrl || item.link || item.url} target="_blank" rel="noreferrer"><Eye size={15} /> Open</a> : "-" },
            { key: "actions", label: "Actions", render: (item) => <button style={iconButton} onClick={() => setDeleteTarget({ collectionName: item._source, item })}><Trash2 size={15} /></button> },
          ]}
        />
      )}

      {!loading && activeTab === "categories" && (
        <AdminTable
          title="Categories"
          subtitle="Organize STEA Code products and developer resources."
          items={activeCategories}
          empty="No categories found."
          addLabel="Add Category"
          onAdd={() => setModal({ type: "category" })}
          isSuperAdmin={isSuperAdmin}
          columns={[
            { key: "name", label: "Name", render: (item) => <><strong>{item.icon ? `${item.icon} ` : ""}{item.name}</strong><div style={{ color: "#6B7280", fontSize: 12 }}>{item.slug}</div></> },
            { key: "type", label: "Type", render: (item) => item.type || "guide" },
            { key: "sortOrder", label: "Order", render: (item) => item.sortOrder || 50 },
            { key: "status", label: "Status", render: (item) => item.active === false || item.status === "inactive" ? <Badge tone="amber">Inactive</Badge> : <Badge tone="green">Active</Badge> },
            { key: "actions", label: "Actions", render: (item) => <button style={iconButton} onClick={() => setModal({ type: "category", item })}><Edit size={15} /></button> },
          ]}
        />
      )}

      {modal?.type === "code" && <CodeEditorModal item={modal.item} onClose={() => setModal(null)} onSave={(data) => saveDoc(CODE_COLLECTION, data, modal.item?.id)} isSuperAdmin={isSuperAdmin} />}
      {modal?.type === "inspiration" && <SimpleResourceModal title="Website" item={modal.item} initial={inspirationInitial} fields={inspirationFields} onClose={() => setModal(null)} onSave={(data) => saveDoc(INSPIRATION_COLLECTION, data, modal.item?.id)} isSuperAdmin={isSuperAdmin} />}
      {modal?.type === "hosting" && <SimpleResourceModal title="Hosting Resource" item={modal.item} initial={hostingInitial} fields={hostingFields} onClose={() => setModal(null)} onSave={(data) => saveDoc(HOSTING_COLLECTION, data, modal.item?.id)} isSuperAdmin={isSuperAdmin} />}
      {modal?.type === "directory" && <SimpleResourceModal title="Developer Resource" item={modal.item} initial={directoryInitial} fields={directoryFields} onClose={() => setModal(null)} onSave={(data) => saveDoc(DIRECTORY_COLLECTION, data, modal.item?.id)} isSuperAdmin={isSuperAdmin} />}
      {modal?.type === "category" && <CategoryEditorModal category={modal.item} onClose={() => setModal(null)} onSave={saveCategory} isSuperAdmin={isSuperAdmin} />}

      {deleteTarget && (
        <AdminConfirmationModal
          title="Delete this STEA Code resource?"
          danger
          actionDescription={`This removes "${deleteTarget.item.title || deleteTarget.item.name}" from ${deleteTarget.collectionName}. Existing storage files will not be deleted.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

function sortContent(a, b) {
  const order = Number(a.sortOrder || 50) - Number(b.sortOrder || 50);
  if (order !== 0) return order;
  return timeValue(b.updatedAt || b.createdAt) - timeValue(a.updatedAt || a.createdAt);
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error("Firestore request timed out")), ms)),
  ]);
}

function SimpleSection({ title, subtitle, items, empty, collectionName, type, addLabel, setModal, commonActions, publishFeatureActions, isSuperAdmin, loadError, isLoading, onRetry }) {
  if (isLoading) {
    return (
      <div className="admin-v2-card" style={{ padding: 28, textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700 }}>Loading {title}…</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="admin-v2-card" style={{ padding: 28, textAlign: "center" }}>
        <p style={{ color: "#ff9999", fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Unable to load {title}.</p>
        <p style={{ color: "#71717a", fontSize: 12, marginBottom: 16, fontFamily: "ui-monospace, monospace" }}>{loadError}</p>
        {onRetry && <button className="admin-v2-btn-secondary" onClick={onRetry} style={{ fontSize: 12 }}>Retry</button>}
      </div>
    );
  }
  return (
    <AdminTable
      title={title}
      subtitle={subtitle}
      items={items}
      empty={empty}
      addLabel={addLabel}
      onAdd={() => setModal({ type })}
      isSuperAdmin={isSuperAdmin}
      columns={[
        { key: "name", label: "Name", render: (item) => <><strong>{item.name}</strong><div style={{ color: "#6B7280", fontSize: 12, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>{item.url}</div></> },
        { key: "category", label: "Category", render: (item) => item.category || item.type || item.difficulty || "-" },
        { key: "description", label: "Description", render: (item) => <span style={{ color: "#374151" }}>{item.description || item.bestFor || "-"}</span> },
        { key: "status", label: "Status", render: (item) => <div style={{ display: "grid", gap: 6 }}>{toBool(item.published) ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}{toBool(item.featured) && <Badge tone="blue">Featured</Badge>}</div> },
        { key: "toggles", label: "Publish", render: (item) => publishFeatureActions(collectionName, item) },
        { key: "actions", label: "Actions", render: commonActions(collectionName, type) },
      ]}
    />
  );
}

const inspirationFields = [
  { key: "name", label: "Website Name" },
  { key: "url", label: "URL" },
  { key: "description", label: "Short Reason", textarea: true },
  { key: "category", label: "Category", kind: "select", options: ["UI Inspiration", "Landing Pages", "Portfolios", "SaaS", "E-commerce", "Animations", "Typography", "Color", "Components", "Awards", "Mobile UI"] },
  { key: "bestFor", label: "Best For" },
  { key: "tags", label: "Tags, comma separated" },
  { key: "logoUrl", label: "Logo URL" },
  { key: "thumbnailUrl", label: "Thumbnail URL" },
  { key: "sortOrder", label: "Sort Order", type: "number" },
  { key: "published", label: "Published", kind: "toggle" },
  { key: "featured", label: "Featured", kind: "toggle" },
];

const hostingFields = [
  { key: "name", label: "Platform Name" },
  { key: "url", label: "URL" },
  { key: "description", label: "What it is", textarea: true },
  { key: "bestFor", label: "Best For" },
  { key: "freeTier", label: "Free Tier Note" },
  { key: "difficulty", label: "Difficulty", kind: "select", options: ["Beginner", "Intermediate", "Advanced"] },
  { key: "type", label: "Type", kind: "select", options: ["Static Hosting", "Frontend Hosting", "Full Stack", "Backend", "Database", "Domain", "Storage"] },
  { key: "logoUrl", label: "Logo URL" },
  { key: "guideUrl", label: "Internal Guide URL" },
  { key: "sortOrder", label: "Sort Order", type: "number" },
  { key: "published", label: "Published", kind: "toggle" },
  { key: "featured", label: "Featured", kind: "toggle" },
];

const directoryFields = [
  { key: "name", label: "Resource Name" },
  { key: "url", label: "URL" },
  { key: "description", label: "One-line Explanation", textarea: true },
  { key: "category", label: "Category", kind: "select", options: ["Icons", "Fonts", "Images", "Stock Photos", "Animations", "3D Assets", "UI Components", "Color", "Gradients", "CSS", "React", "Tailwind", "APIs", "Testing", "SEO", "Performance", "Accessibility", "Documentation", "AI Coding", "Design", "Deployment", "Developer Tools"] },
  { key: "tags", label: "Tags, comma separated" },
  { key: "icon", label: "Icon" },
  { key: "logoUrl", label: "Logo URL" },
  { key: "sortOrder", label: "Sort Order", type: "number" },
  { key: "published", label: "Published", kind: "toggle" },
  { key: "featured", label: "Featured", kind: "toggle" },
];
