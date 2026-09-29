import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Eye,
  FileText,
  Home,
  Loader2,
  Monitor,
  Package,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  createAdminSteaCodeProduct,
  getAdminSteaCodePreview,
  getAdminSteaCodeSource,
  saveAdminSteaCodePreview,
  saveAdminSteaCodeSource,
  uploadSteaCodePackage,
  uploadSteaCodePreviewAssets,
  updateAdminSteaCodeProduct,
} from "../services/steaCodeAdmin.js";
import { invalidateSteaCodeProductPreviewCache } from "../services/steaCodeCommerce.js";
import { CODE_PRODUCT_CATEGORIES, CODE_PRODUCT_TECH } from "../data/stea-code/codeProducts.js";
import SteaCodeProductLivePreview from "../components/stea-code/SteaCodeProductLivePreview.jsx";

const PRODUCT_CATEGORIES = CODE_PRODUCT_CATEGORIES.filter((c) => c !== "All");
const FRAMEWORK_OPTIONS = [...CODE_PRODUCT_TECH];

const BASE_PREVIEW = {
  enabled: true,
  runtime: "html-css-js",
  viewportMode: "desktop",
  width: 1440,
  height: 900,
  scaleMode: "fit",
  html: "",
  css: "",
  javascript: "",
  jsx: "",
  tsx: "",
  fullDocument: "",
  baseUrl: "",
  externalUrl: "",
};

const EMPTY_PRODUCT = {
  id: "",
  slug: "",
  titleEn: "",
  shortDescriptionEn: "",
  craftNoteEn: "",
  category: "Components",
  pricingType: "free",
  price: 0,
  currency: "USD",
  posterImageUrl: "",
  previewVideoUrl: "",
  productType: "Code Product",
  tags: "",
  frameworks: "",
  included: "",
  usageGuideEn: "",
  aiPrompt: "",
  cardZoom: "full",
  modalZoom: 1,
  cardOffsetX: 0,
  cardOffsetY: 0,
  modalOffsetX: 0,
  modalOffsetY: 0,
  status: "draft",
  featured: false,
  homepageVisible: false,
  preview: BASE_PREVIEW,
};

const TABS = [
  { id: "basic", label: "Basic", icon: FileText },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "deliverables", label: "Deliverables", icon: Package },
  { id: "publish", label: "Publish", icon: Sparkles },
];

const PREVIEW_MODES = [
  { id: "live", label: "Live Code", desc: "Interactive HTML/CSS/JS/React preview" },
  { id: "video", label: "Video", desc: "MP4/WebM video showcase" },
  { id: "poster", label: "Poster Only", desc: "Static image + description" },
];

function splitList(val) {
  return String(val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function SectionCard({ title, children, className = "" }) {
  return (
    <div className={`psv2-section ${className}`}>
      <h3 className="psv2-section-title">{title}</h3>
      <div className="psv2-section-body">{children}</div>
    </div>
  );
}

function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`psv2-field ${className}`}>
      {label && <label className="psv2-field-label">{label}</label>}
      {children}
      {hint && <p className="psv2-field-hint">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      className="psv2-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3, ...rest }) {
  return (
    <textarea
      className="psv2-textarea"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select..." }) {
  return (
    <select className="psv2-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>{placeholder}</option>
      {options.map((opt) => (
        <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
          {typeof opt === "string" ? opt : opt.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      className={`psv2-toggle ${value ? "is-on" : ""}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="psv2-toggle-track">
        <span className="psv2-toggle-thumb" />
      </span>
      {label && <span className="psv2-toggle-label">{label}</span>}
    </button>
  );
}

export function ProductStudioV2({
  product,
  onClose,
  onSaved,
  onCreated,
  isSuperAdmin,
  devPreview = false,
  fullPage = false,
  initialTab = "basic",
  baseRoute = "/code-admin",
}) {
  const editing = Boolean(product?.id);
  const navigate = useNavigate();

  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : "basic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [codeTab, setCodeTab] = useState("html");

  const [form, setForm] = useState(() => {
    const incomingPreview = product?.preview || {};
    const mergedPreview = { ...BASE_PREVIEW, ...incomingPreview };
    return {
      ...EMPTY_PRODUCT,
      ...(product || {}),
      preview: mergedPreview,
      tags: (product?.tags || []).join(", "),
      frameworks: (product?.frameworks || []).join(", "),
      included: (product?.included || []).join("\n"),
    };
  });

  const preview = useMemo(() => ({ ...BASE_PREVIEW, ...(form.preview || {}) }), [form.preview]);

  // Determine preview mode from the form data
  const previewMode = useMemo(() => {
    if (form.previewVideoUrl && !preview.enabled) return "video";
    if (form.posterImageUrl && !preview.enabled && !form.previewVideoUrl) return "poster";
    if (preview.enabled) return "live";
    return "live";
  }, [form.previewVideoUrl, form.posterImageUrl, preview.enabled]);

  const [previewSourceLoaded, setPreviewSourceLoaded] = useState(false);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [hasSourceFiles, setHasSourceFiles] = useState(false);

  // Load preview source code when entering preview tab for existing products
  const loadPreviewSource = useCallback(async () => {
    if (!editing || previewSourceLoaded) return;
    try {
      const result = await getAdminSteaCodePreview(product.id);
      if (result?.preview) {
        setForm((prev) => ({
          ...prev,
          preview: { ...prev.preview, ...result.preview },
        }));
      }
      setPreviewSourceLoaded(true);
    } catch (err) {
      console.warn("[PSV2] Preview source load failed:", err);
      setPreviewSourceLoaded(true);
    }
  }, [editing, product?.id, previewSourceLoaded]);

  const loadSourceFiles = useCallback(async () => {
    if (!editing) return;
    try {
      const result = await getAdminSteaCodeSource(product.id);
      const files = result?.files || result?.sourceFiles || [];
      setSourceFiles(files);
      setHasSourceFiles(files.length > 0);
    } catch (err) {
      console.warn("[PSV2] Source files load failed:", err);
    }
  }, [editing, product?.id]);

  useEffect(() => {
    if (tab === "preview") loadPreviewSource();
    if (tab === "deliverables") loadSourceFiles();
  }, [tab, loadPreviewSource, loadSourceFiles]);

  // Tab URL sync
  const selectTab = useCallback((nextTab) => {
    setTab(nextTab);
    if (fullPage && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("tab") !== nextTab) {
        sp.set("tab", nextTab);
        navigate({ search: sp.toString() }, { replace: true });
      }
    }
  }, [fullPage, navigate]);

  const updateForm = useCallback((path, value) => {
    setDirty(true);
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  // --- Save logic ---
  const save = async (publishAction = null) => {
    setError("");
    setNotice("");
    const id = String(form.id || form.slug || "").trim();
    if (!editing && !id) {
      setError("Product ID is required.");
      return;
    }
    if (!String(form.titleEn || "").trim()) {
      setError("English title is required.");
      return;
    }
    if (!String(form.shortDescriptionEn || "").trim()) {
      setError("Short description is required.");
      return;
    }
    if (form.pricingType === "premium" && Number(form.price) <= 0) {
      setError("Premium products must have a price greater than 0.");
      return;
    }
    if (devPreview) {
      setError("DEV PREVIEW ONLY — Sign in as admin to save.");
      return;
    }

    setSaving(true);
    try {
      const isPublishing = publishAction === "publish";

      const previewSettings = {
        enabled: preview.enabled,
        runtime: preview.runtime,
        viewportMode: preview.viewportMode,
        width: preview.width,
        height: preview.height,
        scaleMode: preview.scaleMode,
        baseUrl: preview.baseUrl,
        externalUrl: preview.externalUrl,
      };

      const payload = {
        ...form,
        id,
        slug: form.slug || id,
        tags: splitList(form.tags),
        frameworks: splitList(form.frameworks),
        languages: [],
        included: String(form.included || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        preview: previewSettings,
        aiPrompt: String(form.aiPrompt || "").trim(),
        status: isPublishing ? "published" : form.status || "draft",
        homepageVisible: isPublishing ? true : Boolean(form.homepageVisible),
      };

      let result;
      if (editing) {
        result = await updateAdminSteaCodeProduct(product.id, payload);
      } else {
        result = await createAdminSteaCodeProduct(payload);
      }

      const realProductId = result?.product?.id || result?.id || id;

      // Save preview source if live preview is enabled
      if (preview.enabled) {
        try {
          const previewSource = {
            runtime: preview.runtime,
            html: String(preview.html || ""),
            css: String(preview.css || ""),
            javascript: String(preview.javascript || ""),
            jsx: String(preview.jsx || ""),
            tsx: String(preview.tsx || ""),
            fullDocument: String(preview.fullDocument || ""),
            baseUrl: preview.baseUrl,
            externalUrl: preview.externalUrl,
          };
          await saveAdminSteaCodePreview(realProductId, previewSource);
          invalidateSteaCodeProductPreviewCache(realProductId);
        } catch (previewErr) {
          console.warn("[PSV2] Preview save warning:", previewErr);
        }
      }

      setDirty(false);
      setNotice("Saved ✓");
      setTimeout(() => setNotice(""), 2000);

      if (!editing && onCreated) {
        onCreated(realProductId, "publish");
      }
      if (onSaved) onSaved(result?.product || result);

      // Update local form with server data
      if (result?.product) {
        setForm((prev) => ({
          ...prev,
          ...result.product,
          preview: { ...prev.preview, ...(result.product.preview || {}) },
          tags: (result.product.tags || []).join(", "),
          frameworks: (result.product.frameworks || []).join(", "),
          included: (result.product.included || []).join("\n"),
        }));
      }
    } catch (err) {
      setError(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // --- File uploads (R2 via Worker API) ---
  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);

  const productId = form.id || product?.id || null;

  const uploadVideo = async (file) => {
    if (!file) return;
    if (!productId) {
      setError("Save the product first before uploading a video.");
      return;
    }
    setVideoUploading(true);
    try {
      const result = await uploadSteaCodePreviewAssets(productId, { video: file });
      if (result?.video?.key) {
        updateForm("preview.videoKey", result.video.key);
        // Switch to video mode if not already
        if (!form.previewVideoUrl && !form.posterImageUrl) {
          // leave preview mode as-is; user can toggle
        }
      }
      setNotice("Video uploaded ✓");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setError(err?.message || "Video upload failed.");
    } finally {
      setVideoUploading(false);
    }
  };

  const uploadPoster = async (file) => {
    if (!file) return;
    if (!productId) {
      setError("Save the product first before uploading a poster.");
      return;
    }
    setPosterUploading(true);
    try {
      const result = await uploadSteaCodePreviewAssets(productId, { poster: file });
      if (result?.poster?.key) {
        updateForm("preview.posterKey", result.poster.key);
      }
      setNotice("Poster uploaded ✓");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setError(err?.message || "Poster upload failed.");
    } finally {
      setPosterUploading(false);
    }
  };

  // --- Derived: publish readiness ---
  const canPublish = useMemo(() => {
    return (
      String(form.titleEn || "").trim() &&
      String(form.shortDescriptionEn || "").trim() &&
      form.category &&
      (form.pricingType === "free" || Number(form.price) > 0)
    );
  }, [form]);

  // --- Tab status indicators ---
  const tabStatus = useMemo(() => {
    const basic = Boolean(form.titleEn && form.shortDescriptionEn && form.category);
    const previewOk =
      (preview.enabled && (preview.html || preview.css || preview.fullDocument || preview.externalUrl)) ||
      form.previewVideoUrl ||
      form.posterImageUrl;
    const deliver = form.pricingType === "free" ? hasSourceFiles : true;
    return { basic, preview: previewOk, deliverables: deliver, publish: canPublish };
  }, [form, preview, hasSourceFiles, canPublish]);

  // --- Render ---
  const currentTab = tab;

  return (
    <div className="psv2-root">
      {/* Header */}
      <div className="psv2-header">
        <div className="psv2-header-left">
          <button className="psv2-back-btn" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="psv2-header-text">
            <h1>{editing ? form.titleEn || "Edit Product" : "New Product"}</h1>
            <p>
              {editing ? `ID: ${product?.id || form.id}` : "Fill in the details to create a new code product"}
            </p>
          </div>
        </div>
        <div className="psv2-header-right">
          {dirty && <span className="psv2-dirty-badge">Unsaved changes</span>}
          {notice && <span className="psv2-saved-badge">{notice}</span>}
          <button
            className="psv2-btn psv2-btn--ghost"
            onClick={() => save(null)}
            disabled={saving || devPreview}
          >
            {saving ? <Loader2 size={16} className="psv2-spin" /> : <Save size={16} />}
            Save Draft
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="psv2-error-banner">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="psv2-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const complete = tabStatus[t.id];
          return (
            <button
              key={t.id}
              className={`psv2-tab ${currentTab === t.id ? "is-active" : ""}`}
              onClick={() => selectTab(t.id)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
              {complete && <CheckCircle2 size={14} className="psv2-tab-check" />}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="psv2-content">
        {currentTab === "basic" && (
          <div className="psv2-grid-2">
            <SectionCard title="Product Info">
              <Field label="Product ID" hint="Unique URL-friendly identifier. Cannot be changed after creation.">
                <TextInput
                  value={form.id}
                  onChange={(v) => updateForm("id", v)}
                  placeholder="e.g. glass-motion-card"
                  disabled={editing}
                />
              </Field>
              <Field label="Title (English)">
                <TextInput
                  value={form.titleEn}
                  onChange={(v) => updateForm("titleEn", v)}
                  placeholder="e.g. Glass Motion Card"
                />
              </Field>
              <Field label="Short Description">
                <TextArea
                  value={form.shortDescriptionEn}
                  onChange={(v) => updateForm("shortDescriptionEn", v)}
                  placeholder="One-liner that appears on the card"
                  rows={2}
                />
              </Field>
              <div className="psv2-grid-2">
                <Field label="Category">
                  <Select
                    value={form.category}
                    onChange={(v) => updateForm("category", v)}
                    options={PRODUCT_CATEGORIES}
                  />
                </Field>
                <Field label="Product Type">
                  <TextInput
                    value={form.productType}
                    onChange={(v) => updateForm("productType", v)}
                    placeholder="Code Product"
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Pricing">
              <div className="psv2-grid-2">
                <Field label="Pricing Type">
                  <Select
                    value={form.pricingType}
                    onChange={(v) => updateForm("pricingType", v)}
                    options={[
                      { value: "free", label: "Free" },
                      { value: "premium", label: "Premium" },
                    ]}
                  />
                </Field>
                <Field label="Price (USD)">
                  <TextInput
                    type="number"
                    value={form.price}
                    onChange={(v) => updateForm("price", Number(v) || 0)}
                    placeholder="0"
                    disabled={form.pricingType === "free"}
                  />
                </Field>
              </div>
              <Field label="Tags (comma-separated)" hint="Used for search and discovery.">
                <TextInput
                  value={form.tags}
                  onChange={(v) => updateForm("tags", v)}
                  placeholder="animation, ui, hover"
                />
              </Field>
              <Field label="Frameworks (comma-separated)" hint="e.g. React, Vue, Vanilla">
                <TextInput
                  value={form.frameworks}
                  onChange={(v) => updateForm("frameworks", v)}
                  placeholder="React, JavaScript"
                />
              </Field>
            </SectionCard>

            <SectionCard title="Visual Assets" className="psv2-col-span-2">
              <div className="psv2-grid-2">
                <Field label="Poster Image" hint="Card thumbnail. JPG, PNG, WebP (max 15MB).">
                  <div className="psv2-upload-row">
                    <TextInput
                      value={form.posterImageUrl}
                      onChange={(v) => updateForm("posterImageUrl", v)}
                      placeholder="https://..."
                    />
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: "none" }}
                      onChange={(e) => uploadPoster(e.target.files?.[0])}
                    />
                    <button
                      className="psv2-btn psv2-btn--outline"
                      onClick={() => posterInputRef.current?.click()}
                      disabled={posterUploading}
                    >
                      {posterUploading ? <Loader2 size={14} className="psv2-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                </Field>
                <Field label="Preview Video" hint="MP4 or WebM (max 100MB).">
                  <div className="psv2-upload-row">
                    <TextInput
                      value={form.previewVideoUrl}
                      onChange={(v) => updateForm("previewVideoUrl", v)}
                      placeholder="https://..."
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      style={{ display: "none" }}
                      onChange={(e) => uploadVideo(e.target.files?.[0])}
                    />
                    <button
                      className="psv2-btn psv2-btn--outline"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={videoUploading}
                    >
                      {videoUploading ? <Loader2 size={14} className="psv2-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                </Field>
              </div>
              {form.posterImageUrl && (
                <div className="psv2-poster-preview">
                  <img src={form.posterImageUrl} alt="Poster preview" />
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {currentTab === "preview" && (
          <div className="psv2-grid-2">
            <SectionCard title="Preview Mode">
              <div className="psv2-mode-picker">
                {PREVIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    className={`psv2-mode-card ${previewMode === mode.id ? "is-active" : ""}`}
                    onClick={() => {
                      if (mode.id === "live") {
                        updateForm("preview.enabled", true);
                      } else {
                        updateForm("preview.enabled", false);
                      }
                    }}
                  >
                    <div className="psv2-mode-icon">
                      {mode.id === "live" && <Code2 size={20} />}
                      {mode.id === "video" && <Video size={20} />}
                      {mode.id === "poster" && <Eye size={20} />}
                    </div>
                    <div className="psv2-mode-text">
                      <strong>{mode.label}</strong>
                      <span>{mode.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {previewMode === "live" && (
              <>
                <SectionCard title="Preview Settings">
                  <div className="psv2-grid-2">
                    <Field label="Runtime">
                      <Select
                        value={preview.runtime}
                        onChange={(v) => updateForm("preview.runtime", v)}
                        options={[
                          { value: "html-css-js", label: "HTML / CSS / JS" },
                          { value: "full-html", label: "Full HTML Document" },
                          { value: "react", label: "React (JSX)" },
                          { value: "external", label: "External URL" },
                        ]}
                      />
                    </Field>
                    <Field label="Viewport">
                      <Select
                        value={preview.viewportMode}
                        onChange={(v) => updateForm("preview.viewportMode", v)}
                        options={[
                          { value: "desktop", label: "Desktop (1440×900)" },
                          { value: "tablet", label: "Tablet (768×1024)" },
                          { value: "mobile", label: "Mobile (390×844)" },
                        ]}
                      />
                    </Field>
                    <Field label="Width (px)">
                      <TextInput
                        type="number"
                        value={preview.width}
                        onChange={(v) => updateForm("preview.width", Number(v) || 1440)}
                      />
                    </Field>
                    <Field label="Height (px)">
                      <TextInput
                        type="number"
                        value={preview.height}
                        onChange={(v) => updateForm("preview.height", Number(v) || 900)}
                      />
                    </Field>
                  </div>
                  {preview.runtime === "external" && (
                    <Field label="External URL">
                      <TextInput
                        value={preview.externalUrl}
                        onChange={(v) => updateForm("preview.externalUrl", v)}
                        placeholder="https://..."
                      />
                    </Field>
                  )}
                  {preview.runtime !== "external" && (
                    <Field label="Base URL (optional)" hint="For resolving relative assets in the preview.">
                      <TextInput
                        value={preview.baseUrl}
                        onChange={(v) => updateForm("preview.baseUrl", v)}
                        placeholder="https://cdn.example.com/assets/"
                      />
                    </Field>
                  )}
                </SectionCard>

                {preview.runtime !== "external" && (
                  <SectionCard title="Code Editor" className="psv2-col-span-2">
                    <div className="psv2-code-tabs">
                      {preview.runtime === "html-css-js" && (
                        <>
                          <button className={`psv2-code-tab ${codeTab === "html" ? "is-active" : ""}`} onClick={() => setCodeTab("html")}>HTML</button>
                          <button className={`psv2-code-tab ${codeTab === "css" ? "is-active" : ""}`} onClick={() => setCodeTab("css")}>CSS</button>
                          <button className={`psv2-code-tab ${codeTab === "javascript" ? "is-active" : ""}`} onClick={() => setCodeTab("javascript")}>JS</button>
                        </>
                      )}
                      {preview.runtime === "full-html" && (
                        <button className={`psv2-code-tab ${codeTab === "fullDocument" ? "is-active" : ""}`} onClick={() => setCodeTab("fullDocument")}>HTML</button>
                      )}
                      {preview.runtime === "react" && (
                        <>
                          <button className={`psv2-code-tab ${codeTab === "jsx" ? "is-active" : ""}`} onClick={() => setCodeTab("jsx")}>JSX</button>
                          <button className={`psv2-code-tab ${codeTab === "css" ? "is-active" : ""}`} onClick={() => setCodeTab("css")}>CSS</button>
                        </>
                      )}
                    </div>
                    <textarea
                      className="psv2-code-editor"
                      value={preview[codeTab] || ""}
                      onChange={(e) => updateForm(`preview.${codeTab}`, e.target.value)}
                      placeholder={`Paste your ${codeTab.toUpperCase()} code here...`}
                      spellCheck={false}
                    />
                  </SectionCard>
                )}

                <SectionCard title="Live Preview" className="psv2-col-span-2">
                  <div className="psv2-preview-frame">
                    <SteaCodeProductLivePreview
                      product={{ ...form, preview }}
                      mode="modal"
                      interactive={true}
                    />
                  </div>
                </SectionCard>
              </>
            )}

            {previewMode === "video" && (
              <SectionCard title="Video Preview" className="psv2-col-span-2">
                <div className="psv2-grid-2">
                  <Field label="Video URL">
                    <div className="psv2-upload-row">
                      <TextInput
                        value={form.previewVideoUrl}
                        onChange={(v) => updateForm("previewVideoUrl", v)}
                        placeholder="https://..."
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm"
                        style={{ display: "none" }}
                        onChange={(e) => uploadVideo(e.target.files?.[0])}
                      />
                      <button
                        className="psv2-btn psv2-btn--outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={videoUploading}
                      >
                        {videoUploading ? <Loader2 size={14} className="psv2-spin" /> : <Upload size={14} />}
                        Upload
                      </button>
                    </div>
                  </Field>
                  <Field label="Poster Image">
                    <div className="psv2-upload-row">
                      <TextInput
                        value={form.posterImageUrl}
                        onChange={(v) => updateForm("posterImageUrl", v)}
                        placeholder="https://..."
                      />
                      <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => uploadPoster(e.target.files?.[0])}
                      />
                      <button
                        className="psv2-btn psv2-btn--outline"
                        onClick={() => posterInputRef.current?.click()}
                        disabled={posterUploading}
                      >
                        {posterUploading ? <Loader2 size={14} className="psv2-spin" /> : <Upload size={14} />}
                        Upload
                      </button>
                    </div>
                  </Field>
                </div>
                {form.previewVideoUrl && (
                  <div className="psv2-video-preview">
                    <video src={form.previewVideoUrl} poster={form.posterImageUrl} controls loop muted />
                  </div>
                )}
              </SectionCard>
            )}

            {previewMode === "poster" && (
              <SectionCard title="Poster Preview" className="psv2-col-span-2">
                <Field label="Poster Image URL">
                  <div className="psv2-upload-row">
                    <TextInput
                      value={form.posterImageUrl}
                      onChange={(v) => updateForm("posterImageUrl", v)}
                      placeholder="https://..."
                    />
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => uploadPoster(e.target.files?.[0])}
                    />
                    <button
                      className="psv2-btn psv2-btn--outline"
                      onClick={() => posterInputRef.current?.click()}
                      disabled={posterUploading}
                    >
                      {posterUploading ? <Loader2 size={14} className="psv2-spin" /> : <Upload size={14} />}
                      Upload
                    </button>
                  </div>
                </Field>
                {form.posterImageUrl && (
                  <div className="psv2-poster-preview">
                    <img src={form.posterImageUrl} alt="Poster preview" />
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {currentTab === "deliverables" && (
          <div className="psv2-grid-2">
            <SectionCard title="Source Files" className="psv2-col-span-2">
              <p className="psv2-section-desc">
                Files that buyers get after purchase. Free products require at least one source file.
              </p>
              {sourceFiles.length > 0 ? (
                <div className="psv2-file-list">
                  {sourceFiles.map((f, i) => (
                    <div key={i} className="psv2-file-item">
                      <FileText size={16} />
                      <span>{f.name || f.path || f.fileName || `File ${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="psv2-empty-state">
                  <Package size={32} />
                  <p>No source files yet</p>
                  <span>Manage source files from the current admin editor. Full deliverable editor coming soon.</span>
                </div>
              )}
              <div className="psv2-info-note">
                <InfoIcon />
                <span>
                  Full deliverable management (ZIP uploads, external links, prompts, documentation) is coming in the
                  next update. For now, use the existing source file flow.
                </span>
              </div>
            </SectionCard>

            <SectionCard title="Product Details" className="psv2-col-span-2">
              <div className="psv2-grid-2">
                <Field label="Craft Note" hint="Short 'Crafted with care' style note shown in the modal.">
                  <TextInput
                    value={form.craftNoteEn}
                    onChange={(v) => updateForm("craftNoteEn", v)}
                    placeholder="e.g. Built with vanilla JS + CSS variables"
                  />
                </Field>
                <Field label="Included Items" hint="One per line. Shown as a checklist in the product modal.">
                  <TextArea
                    value={form.included}
                    onChange={(v) => updateForm("included", v)}
                    placeholder={"HTML file\nCSS file\nJavaScript source\nDocumentation"}
                    rows={4}
                  />
                </Field>
              </div>
              <Field label="Usage Guide" hint="Post-purchase instructions for buyers.">
                <TextArea
                  value={form.usageGuideEn}
                  onChange={(v) => updateForm("usageGuideEn", v)}
                  placeholder="How to use this product..."
                  rows={4}
                />
              </Field>
              <Field label="AI Prompt" hint="Prompt instructions for AI code generation products.">
                <TextArea
                  value={form.aiPrompt}
                  onChange={(v) => updateForm("aiPrompt", v)}
                  placeholder="Paste your prompt here..."
                  rows={4}
                />
              </Field>
            </SectionCard>
          </div>
        )}

        {currentTab === "publish" && (
          <div className="psv2-grid-2">
            <SectionCard title="Publishing Controls">
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(v) => updateForm("status", v)}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </Field>
              <Field label="Visibility">
                <div className="psv2-toggle-row">
                  <Toggle
                    value={Boolean(form.homepageVisible)}
                    onChange={(v) => updateForm("homepageVisible", v)}
                    label="Show on homepage"
                  />
                </div>
              </Field>
              <Field label="Featured">
                <div className="psv2-toggle-row">
                  <Toggle
                    value={Boolean(form.featured)}
                    onChange={(v) => updateForm("featured", v)}
                    label="Featured product (sorts first)"
                  />
                </div>
              </Field>
            </SectionCard>

            <SectionCard title="Readiness Checklist">
              <ul className="psv2-checklist">
                <li className={form.titleEn ? "is-ok" : ""}>
                  {form.titleEn ? <CheckCircle2 size={16} /> : <CircleIcon />}
                  Title is set
                </li>
                <li className={form.shortDescriptionEn ? "is-ok" : ""}>
                  {form.shortDescriptionEn ? <CheckCircle2 size={16} /> : <CircleIcon />}
                  Description is set
                </li>
                <li className={form.category ? "is-ok" : ""}>
                  {form.category ? <CheckCircle2 size={16} /> : <CircleIcon />}
                  Category is selected
                </li>
                <li className={form.pricingType === "free" || Number(form.price) > 0 ? "is-ok" : ""}>
                  {form.pricingType === "free" || Number(form.price) > 0 ? <CheckCircle2 size={16} /> : <CircleIcon />}
                  Pricing is configured
                </li>
                <li className={tabStatus.preview ? "is-ok" : ""}>
                  {tabStatus.preview ? <CheckCircle2 size={16} /> : <CircleIcon />}
                  Preview is set up
                </li>
              </ul>
            </SectionCard>

            <div className="psv2-publish-actions psv2-col-span-2">
              <button
                className="psv2-btn psv2-btn--primary psv2-btn--large"
                onClick={() => save("publish")}
                disabled={saving || devPreview || !canPublish}
              >
                {saving ? (
                  <><Loader2 size={18} className="psv2-spin" /> Publishing…</>
                ) : (
                  <><Sparkles size={18} /> {editing && form.status === "published" ? "Update & Publish" : "Publish Product"}</>
                )}
              </button>
              <button
                className="psv2-btn psv2-btn--ghost psv2-btn--large"
                onClick={() => save(null)}
                disabled={saving || devPreview}
              >
                <Save size={18} /> Save Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default ProductStudioV2;
