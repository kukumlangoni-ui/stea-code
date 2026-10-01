import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  Package,
  Plus,
  Save,
  Sparkles,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import {
  createAdminSteaCodeProduct,
  deleteAdminSteaCodeProduct,
  getAdminSteaCodePreview,
  getAdminSteaCodeSource,
  saveAdminSteaCodePreview,
  saveAdminSteaCodeSource,
  updateAdminSteaCodeProduct,
  uploadSteaCodePackage,
} from "../services/steaCodeAdmin.js";
import {
  invalidateSteaCodeCatalogCache,
  invalidateSteaCodeProductPreviewCache,
} from "../services/steaCodeCommerce.js";
import { auth } from "../firebase.js";
import { CODE_PRODUCT_CATEGORIES } from "../data/stea-code/codeProducts.js";
import {
  buildHtmlCssJsDoc,
  buildFullHtmlDoc,
  buildReactDoc,
} from "../utils/steaCodePreviewBuilders.js";
import SteaCodeLogo from "../components/stea-code/SteaCodeLogo.jsx";
import "./ProductStudioV3.css";

const CATEGORIES = CODE_PRODUCT_CATEGORIES.filter((c) => c !== "All");

const BASE_PREVIEW = {
  enabled: true,
  runtime: "html-css-js",
  width: 1600,
  height: 1100,
  scaleMode: "cover",
  html: "",
  css: "",
  javascript: "",
  jsx: "",
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
  liveUrl: "",
  repoUrl: "",
  previewVideoUrl: "",
  productType: "Code Product",
  tags: "",
  frameworks: "",
  included: "",
  usageGuideEn: "",
  aiPrompt: "",
  status: "draft",
  featured: false,
  homepageVisible: true,
  sortOrder: 0,
  previewMode: "live",
  designWidth: 640,
  designHeight: 480,
  preview: BASE_PREVIEW,
};

const TABS = [
  { id: "basic", label: "Basic", icon: FileText },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "deliverables", label: "Deliverables", icon: Package },
  { id: "publish", label: "Publish", icon: Sparkles },
];

const PREVIEW_MODES = [
  { id: "live", label: "Live Code" },
  { id: "video", label: "Video" },
  { id: "poster", label: "Poster" },
];

const RUNTIMES = [
  { value: "html-css-js", label: "HTML / CSS / JS" },
  { value: "full-html", label: "Full HTML Document" },
  { value: "react", label: "React (JSX)" },
];

const DESIGN_CANVAS_PRESETS = [
  { id: "button", label: "Button / Small", width: 480, height: 320 },
  { id: "card", label: "Card / Medium", width: 640, height: 480 },
  { id: "section", label: "Section / Large", width: 960, height: 720 },
  { id: "landing", label: "Landing Page", width: 1440, height: 900 },
  { id: "custom", label: "Custom", width: 0, height: 0 },
];

const DELIVERABLE_TYPES = [
  { value: "source", label: "Source Files" },
  { value: "zip", label: "ZIP Package" },
  { value: "link", label: "External Link" },
  { value: "prompt", label: "Prompt Text" },
  { value: "guide", label: "Usage Guide" },
];

function splitList(val) {
  return String(val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------- Small UI components ----------

function Section({ title, subtitle, children, action }) {
  return (
    <div className="psv3-section">
      <div className="psv3-section-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="psv3-section-body">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, full, children }) {
  return (
    <div className={`psv3-field ${full ? "psv3-field--full" : ""}`}>
      {label && (
        <label className="psv3-field-label">
          {label}
          {required && <span className="psv3-required">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="psv3-field-hint">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      className="psv3-input"
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
      className="psv3-textarea"
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
    <select
      className="psv3-select"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option
          key={typeof opt === "string" ? opt : opt.value}
          value={typeof opt === "string" ? opt : opt.value}
        >
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
      className={`psv3-toggle ${value ? "is-on" : ""}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="psv3-toggle-track">
        <span className="psv3-toggle-thumb" />
      </span>
      {label && <span className="psv3-toggle-label">{label}</span>}
    </button>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="psv3-radio-group">
      {options.map((opt) => (
        <button
          key={opt.id || opt.value}
          type="button"
          className={`psv3-radio ${(value === opt.id || value === opt.value) ? "is-active" : ""}`}
          onClick={(e) => {
            onChange(opt.id || opt.value);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ImageUpload({ value, onUpload, onClear, uploading, label = "Upload Image" }) {
  const inputRef = useRef(null);
  if (value) {
    return (
      <div className="psv3-upload-preview">
        <img src={value} alt="" />
        <button
          type="button"
          className="psv3-upload-clear"
          onClick={onClear}
          title="Remove image"
        >
          <X size={14} />
        </button>
      </div>
    );
  }
  return (
    <>
      <div
        className="psv3-upload"
        onClick={() => inputRef.current?.click()}
        style={{ cursor: uploading ? "wait" : "pointer" }}
      >
        <Upload size={24} className="psv3-upload-icon" />
        <p className="psv3-upload-text">{uploading ? "Uploading…" : label}</p>
        <p className="psv3-upload-hint">Click or drag — JPG, PNG, WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onUpload(e.target.files?.[0])}
      />
    </>
  );
}

/**
 * Map upload errors to consistent, human-readable messages.
 * Single source of truth for all upload error strings.
 */
function getUploadErrorMessage(err, context = "upload") {
  const msg = String(err?.message || err || "").trim().toLowerCase();
  if (!msg) return `${context.charAt(0).toUpperCase() + context.slice(1)} failed.`;
  if (msg.includes("file type") || msg.includes("unsupported") || msg.includes("invalid file"))
    return `Unsupported file type for ${context}.`;
  if (msg.includes("too large") || msg.includes("size limit") || msg.includes("100 mb"))
    return `File too large for ${context}.`;
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("offline"))
    return `Network error — check your connection and retry ${context}.`;
  if (msg.includes("auth") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("403"))
    return `Permission denied for ${context} — sign in again.`;
  if (msg.includes("404") || msg.includes("not found"))
    return `${context.charAt(0).toUpperCase() + context.slice(1)} endpoint not found.`;
  return `${context.charAt(0).toUpperCase() + context.slice(1)} failed: ${err?.message || "unknown error"}`;
}

/**
 * Validate that HTML/CSS is self-contained — no external URLs or relative paths.
 * Returns an array of warning strings (empty = all good). Warnings only — never blocks save.
 */
function validateSelfContained(html, css = "") {
  const issues = [];
  const combined = String(html || "") + String(css || "");
  if (/url\(\s*["']?(?!data:)(https?:|\/|\.\/)/i.test(combined))
    issues.push("External URL in CSS (url(...))");
  if (/<img[^>]+src=["'](?!data:)/i.test(html))
    issues.push("External <img src>");
  if (/<source[^>]+src=["'](?!data:)/i.test(html))
    issues.push("External <source src>");
  const sizeKB = Math.round(new Blob([combined]).size / 1024);
  if (sizeKB > 400)
    issues.push(`File size ${sizeKB} KB exceeds 400 KB`);
  return issues;
}

// ---------- Main Component ----------

export function ProductStudioV3({
  product,
  onClose,
  onSaved,
  onCreated,
  onPublished,
  isSuperAdmin,
  devPreview = false,
  fullPage = false,
  initialTab = "basic",
  baseRoute = "/code-admin",
}) {
  const editing = Boolean(product?.id);
  const navigate = useNavigate();

  const [tab, setTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : "basic"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [htmlWarnings, setHtmlWarnings] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [codeTab, setCodeTab] = useState("html");
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(() => {
    const incomingPreview = product?.preview || {};
    const mergedPreview = { ...BASE_PREVIEW, ...incomingPreview, scaleMode: "cover" };
    // Derive initial previewMode from existing product data:
    // - If product already has previewMode set, use it
    // - Otherwise, infer from what's present (video URL > live preview > poster)
    let initialPreviewMode = product?.previewMode;
    if (!initialPreviewMode) {
      if (product?.previewVideoUrl && !mergedPreview.enabled) {
        initialPreviewMode = "video";
      } else if (mergedPreview.enabled) {
        initialPreviewMode = "live";
      } else if (product?.posterImageUrl) {
        initialPreviewMode = "poster";
      } else {
        initialPreviewMode = "live";
      }
    }
    return {
      ...EMPTY_PRODUCT,
      ...(product || {}),
      previewMode: initialPreviewMode,
      preview: mergedPreview,
      tags: (product?.tags || []).join(", "),
      frameworks: (product?.frameworks || []).join(", "),
      included: (product?.included || []).join("\n"),
    };
  });

  const preview = useMemo(
    () => ({ ...BASE_PREVIEW, ...(form.preview || {}), scaleMode: "cover" }),
    [form.preview]
  );

  // Preview mode is a real independent field (form.previewMode).
  // Values: "live" | "video" | "poster"
  const previewMode = form.previewMode || "live";
  // Single source of truth for product ID: form.id (set after save) wins over product prop
  const productId = form.id || product?.id || null;

  // Temporary draft ID for a NEW product before it's saved.
  // Used as the R2 folder path for uploads (poster/video/package)
  // so users can upload immediately without saving first.
  // Stable for the lifetime of this editor session.
  const [tempDraftId] = useState(() =>
    `tmp-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
  );

  // The ID used for uploads: real product ID when saved,
  // temp draft ID otherwise.
  const uploadId = productId || tempDraftId;

  const [previewSourceLoaded, setPreviewSourceLoaded] = useState(false);
  const [sourceFiles, setSourceFiles] = useState([]);
  const [hasSourceFiles, setHasSourceFiles] = useState(false);

  // Load preview source when entering preview tab
  const loadPreviewSource = useCallback(async () => {
    if (!editing || previewSourceLoaded) return;
    try {
      const result = await getAdminSteaCodePreview(product.id);
      if (result?.preview) {
        setForm((prev) => ({
          ...prev,
          preview: { ...prev.preview, ...result.preview, scaleMode: "cover" },
        }));
      }
      setPreviewSourceLoaded(true);
    } catch (err) {
      console.warn("[PSV3] Preview source load failed:", err);
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
      console.warn("[PSV3] Source files load failed:", err);
    }
  }, [editing, product?.id]);

  const [importStatus, setImportStatus] = useState(() => {
    const src = product?.deliverablesSource || product?.sourceCode;
    if (src) {
      if (typeof src === "string" && src.trim()) return "✓ Imported — full HTML";
      if (typeof src === "object") {
        if (src.fullDocument) return "✓ Imported — full HTML";
        if (src.jsx) return "✓ Imported — React (JSX)";
        if (src.html || src.css || src.javascript) return "✓ Imported — HTML + CSS + JS";
      }
    }
    return "";
  });

  const handleImportFromPreview = useCallback(() => {
    const p = form.preview || {};
    const fullDoc = String(p.fullDocument || "").trim();
    const runtime = String(p.runtime || "html-css-js");
    const html = String(p.html || "");
    const css = String(p.css || "");
    const js = String(p.javascript || "");
    const jsx = String(p.jsx || "");

    let source = null;
    let status = "";

    if (fullDoc) {
      source = { fullDocument: fullDoc };
      status = "✓ Imported — full HTML";
    } else if (runtime === "react" && (jsx || css)) {
      source = { jsx, css };
      status = "✓ Imported — React (JSX)";
    } else if (html || css || js) {
      source = { html, css, javascript: js };
      status = "✓ Imported — HTML + CSS + JS";
    } else {
      setError("Preview tab has no code to import yet. Add HTML/CSS/JS in the Preview tab first.");
      return;
    }

    setDirty(true);
    setForm((prev) => ({
      ...prev,
      deliverablesSource: source,
      sourceCode: source,
    }));
    setImportStatus(status);
    setNotice("Imported from Preview tab ✓");
    setTimeout(() => setNotice(""), 2000);
  }, [form.preview]);

  useEffect(() => {
    if (tab === "preview") loadPreviewSource();
    if (tab === "deliverables") loadSourceFiles();
  }, [tab, loadPreviewSource, loadSourceFiles]);

  // Tab URL sync
  const selectTab = useCallback(
    (nextTab) => {
      setTab(nextTab);
      if (fullPage && typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("tab") !== nextTab) {
          sp.set("tab", nextTab);
          navigate({ search: sp.toString() }, { replace: true });
        }
      }
    },
    [fullPage, navigate]
  );

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

  // Handle preview mode change — sets the independent form.previewMode field.
  // Also toggles preview.enabled so the live preview frame shows/hides appropriately.
  const setPreviewMode = useCallback((mode) => {
    setDirty(true);
    setForm((prev) => {
      const next = { ...prev, previewMode: mode };
      if (mode === "live") {
        next.preview = { ...prev.preview, enabled: true };
      } else {
        next.preview = { ...prev.preview, enabled: false };
      }
      return next;
    });
  }, []);

  // Upload handlers
  const posterInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterUploadProgress, setPosterUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [packageUploading, setPackageUploading] = useState(false);
  const [packageUploadProgress, setPackageUploadProgress] = useState(0);
  const [packageError, setPackageError] = useState("");
  const [packageDragging, setPackageDragging] = useState(false);

  // XHR upload with real progress — fetch() cannot report upload progress,
  // which is why uploads sat at 0%. Same contract as uploadSteaCodePreviewAssets:
  // POST /api/stea-code/media/upload with productId + file → { ok, key, url }
  const uploadFileWithProgress = (file, productId, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("file", file);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
        }
      });

      xhr.addEventListener("error", () =>
        reject(new Error("Network error — check your connection and retry."))
      );
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

      xhr.open("POST", "/api/stea-code/media/upload", true);
      xhr.send(fd);
    });

  const uploadPoster = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      setError("Only JPG, PNG, WebP or GIF images are supported.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be under 15 MB.");
      return;
    }
    const pid = uploadId || product?.id;
    if (!pid) {
      setError("Save the product first before uploading an image.");
      return;
    }
    setPosterUploading(true);
    setPosterUploadProgress(0);
    setError("");
    try {
      const result = await uploadFileWithProgress(file, pid, (percent) =>
        setPosterUploadProgress(percent)
      );
      if (!result?.ok || !result?.key) {
        throw new Error(result?.error || "Upload failed");
      }
      setForm((prev) => ({
        ...prev,
        preview: { ...prev.preview, posterKey: result.key },
        posterImageUrl: result.url || `/api/stea-code/media/${result.key}`,
      }));
      setNotice("Poster uploaded");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setError(getUploadErrorMessage(err, "poster upload"));
    } finally {
      setPosterUploading(false);
      setPosterUploadProgress(0);
    }
  };

  const uploadVideo = async (file) => {
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
      setError("Only MP4 or WebM video files are supported.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Video file must be under 100 MB.");
      return;
    }
    const pid = uploadId || product?.id;
    if (!pid) {
      setError("Save the product first before uploading a video.");
      return;
    }
    setVideoUploading(true);
    setVideoUploadProgress(0);
    setError("");
    try {
      const result = await uploadFileWithProgress(file, pid, (percent) =>
        setVideoUploadProgress(percent)
      );
      if (!result?.ok || !result?.key) {
        throw new Error(result?.error || "Upload failed");
      }
      setForm((prev) => ({
        ...prev,
        preview: { ...prev.preview, enabled: true, videoKey: result.key },
        previewVideoUrl: result.url || `/api/stea-code/media/${result.key}`,
      }));
      if (form.previewMode !== "video") {
        setPreviewMode("video");
      }
      setNotice("Video uploaded");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setError(getUploadErrorMessage(err, "video upload"));
    } finally {
      setVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  const uploadPackage = async (file) => {
    if (!file) return;
    setPackageError("");
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setPackageError("Only .zip files are accepted for source code packages.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setPackageError("ZIP file must be under 50MB.");
      return;
    }
    setPackageUploading(true);
    setPackageUploadProgress(0);
    try {
      const result = await uploadSteaCodePackage(
        uploadId,
        file,
        { onProgress: (p) => setPackageUploadProgress(p) }
      );
      if (result?.key) {
        setForm((prev) => ({
          ...prev,
          package: {
            ...(prev.package || {}),
            storageKey: result.key,
            filename: result.filename || file.name,
            size: result.size || file.size,
          },
        }));
      }
      setNotice("ZIP package uploaded");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setPackageError(err?.message || "ZIP upload failed.");
    } finally {
      setPackageUploading(false);
      setPackageUploadProgress(0);
    }
  };

  // Save logic
  const save = async (publishAction = null) => {
    setError("");
    setNotice("");

    // Auto-generate id/slug from title for new products
    const baseId = String(form.id || form.slug || "").trim();
    const id = editing
      ? product.id
      : baseId || slugify(form.titleEn) || `product-${Date.now()}`;

    if (!String(form.titleEn || "").trim()) {
      setError("Title is required.");
      return;
    }
    if (!String(form.shortDescriptionEn || "").trim()) {
      setError("Short description is required.");
      return;
    }
    if (!form.category) {
      setError("Category is required.");
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

    // HTML sanity check — warn about external URLs/relative paths (non-blocking)
    const htmlIssues = validateSelfContained(
      preview.fullDocument || preview.html,
      preview.css
    );
    if (htmlIssues.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("[PSV3] HTML sanity check warnings:", htmlIssues);
      setHtmlWarnings(htmlIssues);
    } else {
      setHtmlWarnings([]);
    }

    setSaving(true);
    try {
      const isPublishing = publishAction === "publish";
      const isUnpublishing = publishAction === "unpublish";

      // Preview settings — always force scaleMode: cover
      const previewSettings = {
        enabled: preview.enabled,
        runtime: preview.runtime,
        width: Number(preview.width) || 1600,
        height: Number(preview.height) || 1100,
        scaleMode: "cover",
        baseUrl: preview.baseUrl,
        externalUrl: preview.externalUrl,
        videoKey: preview.videoKey || "",
        posterKey: preview.posterKey || "",
      };

      // Source code snapshot (saved alongside product for /free-content fallback)
      const sourceCode = form.deliverablesSource || {
        html: String(preview.html || ""),
        css: String(preview.css || ""),
        javascript: String(preview.javascript || ""),
        jsx: String(preview.jsx || ""),
        fullDocument: String(preview.fullDocument || ""),
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
        sourceCode,
        aiPrompt: String(form.aiPrompt || "").trim(),
        liveUrl: String(form.liveUrl || "").trim(),
        repoUrl: String(form.repoUrl || "").trim(),
        previewMode: form.previewMode || "live",
        designWidth: Number(form.designWidth) || 640,
        designHeight: Number(form.designHeight) || 480,
        craftNoteEn: String(form.craftNoteEn || "").trim(),
        usageGuideEn: String(form.usageGuideEn || "").trim(),
        status: isUnpublishing
          ? "draft"
          : isPublishing
          ? "published"
          : form.status || "draft",
        homepageVisible: isPublishing ? true : Boolean(form.homepageVisible),
        sortOrder: Number(form.sortOrder) || 0,
      };

      let result;
      if (editing) {
        result = await updateAdminSteaCodeProduct(product.id, payload);
      } else {
        result = await createAdminSteaCodeProduct(payload);
      }

      const realProductId = result?.product?.id || result?.productId || result?.id || id;

      // Save preview source if live preview (separate previews collection)
      if (preview.enabled) {
        try {
          const previewSource = {
            runtime: preview.runtime,
            html: String(preview.html || ""),
            css: String(preview.css || ""),
            javascript: String(preview.javascript || ""),
            jsx: String(preview.jsx || ""),
            tsx: "",
            fullDocument: String(preview.fullDocument || ""),
            baseUrl: preview.baseUrl,
            externalUrl: preview.externalUrl,
          };
          await saveAdminSteaCodePreview(realProductId, previewSource);
          invalidateSteaCodeProductPreviewCache(realProductId);
        } catch (previewErr) {
          console.warn("[PSV3] Preview save warning:", previewErr);
        }
      }

      // Invalidate both catalog (localStorage) and preview (in-memory) caches
      invalidateSteaCodeCatalogCache();
      invalidateSteaCodeProductPreviewCache(realProductId);

      setDirty(false);
      setNotice(isPublishing ? "Published ✓" : "Saved ✓");
      setTimeout(() => setNotice(""), 2000);

      if (isPublishing && typeof onPublished === "function") {
        onPublished(result?.product || result);
        return;
      }

      // Auto-navigate to Preview tab on successful save/publish
      setTab("preview");
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (!editing && onCreated) {
        onCreated(realProductId, isPublishing ? "publish" : "draft");
      }
      if (onSaved) onSaved(result?.product || result);

      // Sync with server data
      if (result?.product) {
        setForm((prev) => ({
          ...prev,
          ...result.product,
          // Preserve local previewMode — server may not return this field
          // (it's a UI-mode flag, not always stored on the server object).
          previewMode: result.product.previewMode || prev.previewMode || "live",
          preview: { ...prev.preview, ...(result.product.preview || {}), scaleMode: "cover" },
          tags: (result.product.tags || []).join(", "),
          frameworks: (result.product.frameworks || []).join(", "),
          included: (result.product.included || []).join("\n"),
        }));
      }
    } catch (err) {
      console.error("[PSV3] Save error:", err?.message || err);
      setError(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // Cancel and exit
  const handleCancel = useCallback(() => {
    if (dirty) {
      const confirmDiscard = window.confirm("Discard unsaved changes?");
      if (!confirmDiscard) return;
    }
    onClose?.();
  }, [dirty, onClose]);

  // Delete product
  const handleDelete = useCallback(async () => {
    if (!editing || !product?.id) return;
    if (!deleting) {
      setDeleting(true);
      return;
    }
    try {
      setSaving(true);
      setError("");
      await deleteAdminSteaCodeProduct(product.id);
      navigate("/code-admin/products");
    } catch (err) {
      setError(err?.message || "Could not delete product.");
      setDeleting(false);
      setSaving(false);
    }
  }, [editing, product?.id, deleting, navigate]);

  // Publish readiness
  const canPublish = useMemo(() => {
    return (
      String(form.titleEn || "").trim() &&
      String(form.shortDescriptionEn || "").trim() &&
      form.category &&
      (form.pricingType === "free" || Number(form.price) > 0)
    );
  }, [form]);

  // Tab status dots
  const tabStatus = useMemo(() => {
    const basic = Boolean(form.titleEn && form.shortDescriptionEn && form.category);
    const previewOk =
      (preview.enabled && (preview.html || preview.css || preview.javascript || preview.jsx || preview.fullDocument)) ||
      form.previewVideoUrl ||
      form.posterImageUrl;
    const deliver = true; // deliverables are optional
    return { basic, preview: previewOk, deliverables: deliver, publish: canPublish };
  }, [form, preview, canPublish]);

  // Code tabs based on runtime
  const codeTabs = useMemo(() => {
    const rt = preview.runtime;
    if (rt === "full-html") return [{ id: "fullDocument", label: "Full Document" }];
    if (rt === "react") return [
      { id: "jsx", label: "JSX" },
      { id: "css", label: "CSS" },
    ];
    return [
      { id: "html", label: "HTML" },
      { id: "css", label: "CSS" },
      { id: "javascript", label: "JS" },
    ];
  }, [preview.runtime]);

  // Ensure codeTab is valid for current runtime
  useEffect(() => {
    if (!codeTabs.find((t) => t.id === codeTab)) {
      setCodeTab(codeTabs[0]?.id || "html");
    }
  }, [codeTabs, codeTab]);

  // Build preview document for the live preview iframe (same logic as V1)
  const generatedPreviewDocument = useMemo(() => {
    return buildHtmlCssJsDoc({
      html: preview.html,
      css: preview.css,
      javascript: preview.javascript,
      baseUrl: preview.baseUrl,
    });
  }, [preview.css, preview.html, preview.javascript, preview.baseUrl]);

  const generatedReactDocument = useMemo(() => {
    const reactSource = preview.jsx || preview.javascript || preview.html || "";
    return buildReactDoc({
      jsx: reactSource,
      css: preview.css,
      baseUrl: preview.baseUrl,
    });
  }, [preview.css, preview.javascript, preview.html, preview.jsx, preview.baseUrl]);

  const fullDocumentSource = String(preview.fullDocument || "");
  const fullHtmlPresent = fullDocumentSource.trim().length > 0;

  const previewDocument = useMemo(() => {
    // If fullDocument has content, use it verbatim (authoritative)
    if (fullHtmlPresent) {
      const url = String(preview.baseUrl || "").trim();
      if (!url || /<base\s/i.test(fullDocumentSource)) {
        return fullDocumentSource;
      }
      return buildFullHtmlDoc({
        fullDocument: fullDocumentSource,
        baseUrl: preview.baseUrl,
      });
    }
    if (preview.runtime === "react") return generatedReactDocument;
    if (preview.runtime === "external") return "";
    return generatedPreviewDocument;
  }, [
    preview.runtime,
    preview.baseUrl,
    fullHtmlPresent,
    fullDocumentSource,
    generatedPreviewDocument,
    generatedReactDocument,
  ]);

  // ---------- Render ----------

  const statusLabel = form.status || "draft";

  return (
    <div className="psv3-root">
      {/* Header */}
      <div className="psv3-header">
        <div className="psv3-header-left">
          <button className="psv3-back-btn" onClick={handleCancel} title="Cancel & Close" aria-label="Cancel & Close">
            <X size={18} />
          </button>
          <SteaCodeLogo size={28} />
          <div className="psv3-header-text">
            <h1>{editing ? form.titleEn || "Edit Product" : "New Product"}</h1>
            <p>{editing ? `ID: ${product?.id || form.id}` : "Fill in the details below"}</p>
          </div>
        </div>
        <div className="psv3-header-right">
          {dirty && <span className="psv3-dirty-badge">Unsaved changes</span>}
          {notice && <span className="psv3-saved-badge">{notice}</span>}
          <button
            type="button"
            className="psv3-btn psv3-btn--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="psv3-btn psv3-btn--ghost"
            onClick={() => save(null)}
            disabled={saving || devPreview}
          >
            {saving ? (
              <Loader2 size={16} className="psv3-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Draft
          </button>
          <button
            className="psv3-btn psv3-btn--primary"
            onClick={() => save("publish")}
            disabled={saving || devPreview || !canPublish}
          >
            {form.status === "published" ? "Update & Save" : "Publish"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="psv3-error">{error}</div>}

      {/* HTML warnings (non-blocking) */}
      {htmlWarnings.length > 0 && (
        <div className="psv3-warning" style={{
          padding: "10px 14px",
          background: "rgba(245, 166, 35, 0.1)",
          border: "1px solid rgba(245, 166, 35, 0.3)",
          borderRadius: "8px",
          color: "#f5a623",
          fontSize: "13px",
          marginBottom: "12px",
        }}>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>Preview content warnings</div>
          <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
            {htmlWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab Bar */}
      <div className="psv3-tabbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`psv3-tab ${tab === t.id ? "is-active" : ""} ${
                tabStatus[t.id] ? "is-complete" : ""
              }`}
              onClick={() => selectTab(t.id)}
            >
              <span className="psv3-tab-dot" />
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="psv3-content">
        {/* TAB 1 — BASIC */}
        {tab === "basic" && (
          <>
            <Section title="Product Info" subtitle="What buyers see on the card">
              <div className="psv3-grid">
                <Field label="Title" required full>
                  <TextInput
                    value={form.titleEn}
                    onChange={(v) => updateForm("titleEn", v)}
                    placeholder="My Awesome Component"
                  />
                </Field>
                <Field label="Short Description" required full hint="1-2 lines shown on the card and in search results">
                  <TextArea
                    value={form.shortDescriptionEn}
                    onChange={(v) => updateForm("shortDescriptionEn", v)}
                    placeholder="A beautiful, interactive component built with..."
                    rows={2}
                  />
                </Field>
                <Field label="Category" required>
                  <Select
                    value={form.category}
                    onChange={(v) => updateForm("category", v)}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </Field>
                <Field label="Pricing">
                  <RadioGroup
                    value={form.pricingType}
                    onChange={(v) => updateForm("pricingType", v)}
                    options={[
                      { id: "free", label: "Free" },
                      { id: "premium", label: "Premium" },
                    ]}
                  />
                </Field>
                {form.pricingType === "premium" && (
                  <Field label="Price (USD)" required>
                    <TextInput
                      type="number"
                      value={form.price}
                      onChange={(v) => updateForm("price", Number(v) || 0)}
                      placeholder="19"
                      min="0"
                      step="0.01"
                    />
                  </Field>
                )}
                <Field label="Tags" hint="Comma-separated">
                  <TextInput
                    value={form.tags}
                    onChange={(v) => updateForm("tags", v)}
                    placeholder="react, animation, ui"
                  />
                </Field>
                <Field label="Frameworks" hint="Comma-separated">
                  <TextInput
                    value={form.frameworks}
                    onChange={(v) => updateForm("frameworks", v)}
                    placeholder="React, Vue, Vanilla JS"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Cover & Preview">
              <div className="psv3-grid">
                <Field
                  label="Live URL"
                  hint="Optional. If this product is a portfolio or external site, paste the live URL. A 'View Live Site' button will appear in the product modal."
                  full
                >
                  <TextInput
                    value={form.liveUrl || ""}
                    onChange={(v) => updateForm("liveUrl", v)}
                    placeholder="https://example.com"
                  />
                </Field>
                <Field label="Preview Mode">
                  <RadioGroup
                    value={previewMode}
                    onChange={setPreviewMode}
                    options={PREVIEW_MODES.map((m) => ({ id: m.id, label: m.label }))}
                  />
                  <p className="psv3-field-hint" style={{ marginTop: 8 }}>
                    {previewMode === "live" && "Interactive code preview — buyers can see it run"}
                    {previewMode === "video" && "MP4/WebM video showcase"}
                    {previewMode === "poster" && "Static image only"}
                  </p>
                </Field>
                <Field label="Design Canvas" hint="Logical viewport size for your component">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {DESIGN_CANVAS_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`psv3-chip ${
                          form.designWidth === preset.width && form.designHeight === preset.height
                            ? "psv3-chip--active"
                            : ""
                        }`}
                        onClick={() => {
                          if (preset.id === "custom") return;
                          updateForm("designWidth", preset.width);
                          updateForm("designHeight", preset.height);
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      className="psv3-input"
                      value={form.designWidth || 0}
                      onChange={(e) => updateForm("designWidth", Number(e.target.value) || 0)}
                      min={100}
                      max={4000}
                      style={{ width: 100 }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>×</span>
                    <input
                      type="number"
                      className="psv3-input"
                      value={form.designHeight || 0}
                      onChange={(e) => updateForm("designHeight", Number(e.target.value) || 0)}
                      min={100}
                      max={4000}
                      style={{ width: 100 }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>px</span>
                  </div>
                </Field>
                {previewMode === "video" && (
                  <Field label="Preview Video" full>
                    <p className="psv3-field-hint" style={{ margin: 0 }}>
                      Video uploads live in the Preview tab — open it to upload or manage the preview video.
                    </p>
                  </Field>
                )}
              </div>
            </Section>
          </>
        )}

        {/* TAB 2 — PREVIEW */}
        {tab === "preview" && (
          <>
            {previewMode === "live" && (
              <Section
                title="Live Preview"
                subtitle="Buyers see this when they open the product modal"
              >
                <div className="psv3-grid">
                  <Field label="Runtime">
                    <Select
                      value={preview.runtime}
                      onChange={(v) => updateForm("preview.runtime", v)}
                      options={RUNTIMES}
                    />
                  </Field>
                  <Field label="Viewport Size" hint="Width × Height in pixels">
                    <div style={{ display: "flex", gap: 8 }}>
                      <TextInput
                        type="number"
                        value={preview.width}
                        onChange={(v) => updateForm("preview.width", Number(v) || 1600)}
                        placeholder="1600"
                      />
                      <span style={{ alignSelf: "center", color: "var(--psv3-text-muted)" }}>×</span>
                      <TextInput
                        type="number"
                        value={preview.height}
                        onChange={(v) => updateForm("preview.height", Number(v) || 1100)}
                        placeholder="1100"
                      />
                    </div>
                  </Field>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="psv3-code-tabs">
                    {codeTabs.map((t) => (
                      <button
                        key={t.id}
                        className={`psv3-code-tab ${codeTab === t.id ? "is-active" : ""}`}
                        onClick={() => setCodeTab(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="psv3-code-editor"
                    value={preview[codeTab] || ""}
                    onChange={(e) => updateForm(`preview.${codeTab}`, e.target.value)}
                    placeholder={`Paste your ${codeTabs.find((t) => t.id === codeTab)?.label || "code"} here...`}
                    spellCheck={false}
                  />
                </div>

                {/* Live Preview */}
                <div className="psv3-preview-panel">
                  <div className="psv3-preview-header">
                    <span className="psv3-preview-dot r" />
                    <span className="psv3-preview-dot y" />
                    <span className="psv3-preview-dot g" />
                    <span className="psv3-preview-label">Live Preview</span>
                  </div>
                  <div
                    className="psv3-preview-frame"
                    style={{
                      aspectRatio: `${form.designWidth || 640} / ${form.designHeight || 480}`,
                      maxHeight: "600px",
                    }}
                  >
                    <iframe
                      title="STEA Code Product Preview"
                      sandbox="allow-scripts"
                      srcDoc={previewDocument}
                      className="psv3-preview-iframe"
                    />
                  </div>
                </div>
              </Section>
            )}

            {previewMode === "video" && (
              <Section title="Video Preview" subtitle="MP4 or WebM · up to 100 MB">
                <div className="psv3-grid">
                  {/* VIDEO — 3-state machine: dropzone / uploading / ready */}
                  <Field label="Video File" full>
                    {!form.previewVideoUrl && !videoUploading && (
                      <div
                        className="psv3-upload"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <Upload size={24} className="psv3-upload-icon" />
                        <p className="psv3-upload-text">Upload Video</p>
                        <p className="psv3-upload-hint">MP4 or WebM · up to 100 MB</p>
                      </div>
                    )}

                    {videoUploading && (
                      <div className="psv3-upload is-uploading">
                        <Upload size={24} className="psv3-upload-icon" />
                        <p className="psv3-upload-text">Uploading… {videoUploadProgress}%</p>
                        <div className="psv3-progress-track">
                          <div
                            className="psv3-progress-fill"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {form.previewVideoUrl && !videoUploading && (
                      <div className="psv3-video-ready">
                        <div className="psv3-video-badge">
                          <CheckCircle2 size={13} /> Video Ready
                        </div>
                        <div
                          className="psv3-video-shell"
                          style={{
                            aspectRatio: `${form.designWidth || 640} / ${form.designHeight || 480}`,
                          }}
                        >
                          <video
                            src={form.previewVideoUrl}
                            poster={form.posterImageUrl || undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="psv3-video-player"
                          />
                        </div>
                        <div className="psv3-video-meta">
                          <code>{form.preview?.videoKey || "—"}</code>
                          <button
                            type="button"
                            className="psv3-btn psv3-btn--sm psv3-btn--danger"
                            onClick={() => {
                              updateForm("previewVideoUrl", "");
                              updateForm("preview.videoKey", "");
                              updateForm("preview.enabled", false);
                            }}
                          >
                            <X size={12} /> Remove video
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadVideo(f);
                        e.target.value = "";
                      }}
                    />
                  </Field>

                  {/* POSTER */}
                  <Field label="Poster Image" hint="Shown before video plays">
                    <ImageUpload
                      value={form.posterImageUrl}
                      onUpload={uploadPoster}
                      onClear={() => {
                        updateForm("posterImageUrl", "");
                        updateForm("preview.posterKey", "");
                      }}
                      uploading={posterUploading}
                    />
                    {posterUploading && (
                      <div className="psv3-progress-track" style={{ marginTop: 8 }}>
                        <div
                          className="psv3-progress-fill"
                          style={{ width: `${posterUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </Field>
                </div>
              </Section>
            )}

            {previewMode === "poster" && (
              <Section title="Poster Preview" subtitle="Static image shown on the product card">
                <div className="psv3-grid">
                  <Field label="Cover Image" hint="Poster / thumbnail shown on the card" full>
                    <ImageUpload
                      value={form.posterImageUrl}
                      onUpload={uploadPoster}
                      onClear={() => {
                        updateForm("posterImageUrl", "");
                        updateForm("preview.posterKey", "");
                      }}
                      uploading={posterUploading}
                      label="Upload Cover Image"
                    />
                    {posterUploading && (
                      <div className="psv3-progress-track" style={{ marginTop: 8 }}>
                        <div
                          className="psv3-progress-fill"
                          style={{ width: `${posterUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </Field>
                </div>
              </Section>
            )}
          </>
        )}

        {/* TAB 3 — DELIVERABLES */}
        {tab === "deliverables" && (
          <>
            <Section title="Source Code" subtitle="What users will be able to copy or download">
              <div className="psv3-import-row">
                <button
                  type="button"
                  className="psv3-btn psv3-btn-gold"
                  onClick={handleImportFromPreview}
                >
                  <Download size={16} />
                  Import from Preview tab
                </button>
                {importStatus && (
                  <span className="psv3-import-status">{importStatus}</span>
                )}
              </div>

              <div className="psv3-divider-text">
                <span>OR upload a ZIP instead</span>
              </div>

              <div className="psv3-package-upload">
                <input
                  type="file"
                  id="psv3-package-input"
                  accept=".zip,application/zip"
                  onChange={(e) => uploadPackage(e.target.files?.[0])}
                  disabled={packageUploading}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="psv3-package-input"
                  className={`psv3-upload psv3-upload--package ${packageUploading ? "is-uploading" : ""} ${packageDragging ? "is-dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!packageUploading) setPackageDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setPackageDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPackageDragging(false);
                    if (packageUploading) return;
                    const file = e.dataTransfer?.files?.[0];
                    if (file) uploadPackage(file);
                  }}
                >
                  <Upload size={32} className="psv3-upload-icon" />
                  <p className="psv3-upload-text">
                    {packageUploading
                      ? "Uploading…"
                      : form.package?.storageKey
                      ? "Replace ZIP"
                      : packageDragging
                      ? "Drop ZIP file here"
                      : "Upload ZIP Package"}
                  </p>
                  <p className="psv3-upload-hint">
                    {form.package?.storageKey
                      ? `Current: ${form.package.filename || form.package.storageKey.split('/').pop()}${form.package.size ? ` (${(form.package.size / 1024).toFixed(1)} KB)` : ''}`
                      : "Full source code as .zip — max 50MB"}
                  </p>
                </label>
                {packageUploading && (
                  <div className="psv3-upload-progress">
                    <div
                      className="psv3-upload-progress-bar"
                      style={{ width: `${packageUploadProgress}%` }}
                    />
                    <span className="psv3-upload-progress-text">{packageUploadProgress}%</span>
                  </div>
                )}
                {packageError && (
                  <div className="psv3-package-error">{packageError}</div>
                )}
              </div>
            </Section>

            <Section title="What users will see" subtitle="Buttons rendered on the product modal">
              <div className="psv3-modal-actions-preview">
                {Boolean(String(form.aiPrompt || "").trim()) && (
                  <div className="psv3-preview-action-btn">
                    <Sparkles size={16} className="psv3-action-icon-gold" />
                    <span>Copy AI Prompt</span>
                  </div>
                )}
                {Boolean(
                  (form.deliverablesSource && Object.keys(form.deliverablesSource).length > 0) ||
                  (form.sourceCode && (typeof form.sourceCode === "string" ? form.sourceCode.trim() : Object.keys(form.sourceCode).length > 0)) ||
                  (form.preview && (form.preview.fullDocument || form.preview.html || form.preview.jsx))
                ) && (
                  <div className="psv3-preview-action-btn">
                    <Copy size={16} />
                    <span>
                      {Boolean(
                        (form.deliverablesSource && (form.deliverablesSource.html || form.deliverablesSource.css || form.deliverablesSource.javascript || form.deliverablesSource.jsx)) ||
                        (form.sourceCode && typeof form.sourceCode === "object" && (form.sourceCode.html || form.sourceCode.css || form.sourceCode.javascript || form.sourceCode.jsx)) ||
                        (form.preview && form.preview.runtime === "html-css-js" && (form.preview.html || form.preview.css || form.preview.javascript))
                      )
                        ? "Copy Source Code ▾"
                        : "Copy Source Code"}
                    </span>
                  </div>
                )}
                {Boolean(form.package?.storageKey) && (
                  <div className="psv3-preview-action-btn">
                    <Download size={16} />
                    <span>Download Source Code (.zip)</span>
                  </div>
                )}
                {!String(form.aiPrompt || "").trim() &&
                 !form.package?.storageKey &&
                 !(form.deliverablesSource && Object.keys(form.deliverablesSource).length > 0) &&
                 !(form.sourceCode && (typeof form.sourceCode === "string" ? form.sourceCode.trim() : Object.keys(form.sourceCode).length > 0)) &&
                 !(form.preview && (form.preview.fullDocument || form.preview.html || form.preview.jsx)) && (
                  <p className="psv3-no-actions-hint">
                    No actions available. Import source code or upload a ZIP above to give users something to copy or download.
                  </p>
                )}
              </div>
            </Section>

            <Section title="What's Included" subtitle="Bulleted list shown in the product modal">
              <Field label="Included items" full hint="One per line">
                <TextArea
                  value={form.included}
                  onChange={(v) => updateForm("included", v)}
                  placeholder={"Source code\nDocumentation\nCommercial license"}
                  rows={4}
                />
              </Field>
            </Section>

            <Section title="Additional Content">
              <div className="psv3-grid">
                <Field label="Craft Note" full hint="Short note about how this was built (optional)">
                  <TextArea
                    value={form.craftNoteEn}
                    onChange={(v) => updateForm("craftNoteEn", v)}
                    placeholder="Built with vanilla JavaScript and CSS animations..."
                    rows={3}
                  />
                </Field>
                <Field label="Usage Guide" full hint="Markdown supported (optional)">
                  <TextArea
                    value={form.usageGuideEn}
                    onChange={(v) => updateForm("usageGuideEn", v)}
                    placeholder={"## How to use\n1. Copy the HTML..."}
                    rows={4}
                  />
                </Field>
                <Field label="AI Prompt" full hint="Code block buyers can copy (optional)">
                  <TextArea
                    value={form.aiPrompt}
                    onChange={(v) => updateForm("aiPrompt", v)}
                    placeholder="Create a button with a glowing effect..."
                    rows={4}
                  />
                </Field>
                <Field
                  label="Repo URL"
                  hint="Optional. If this product is a portfolio with a public GitHub repo, paste the URL. A 'Copy Repo URL' button will appear in the product modal."
                  full
                >
                  <TextInput
                    value={form.repoUrl || ""}
                    onChange={(v) => updateForm("repoUrl", v)}
                    placeholder="https://github.com/username/repo"
                  />
                </Field>
              </div>
            </Section>
          </>
        )}

        {/* TAB 4 — PUBLISH */}
        {tab === "publish" && (
          <>
            <Section title="Live Preview" subtitle="This is what buyers will see">
              <div
                className="psv3-preview-frame"
                style={{
                  aspectRatio: `${form.designWidth || 640} / ${form.designHeight || 480}`,
                  maxHeight: "600px",
                }}
              >
                <iframe
                  title="STEA Code Product Preview"
                  sandbox="allow-scripts"
                  srcDoc={previewDocument}
                  className="psv3-preview-iframe"
                />
              </div>
            </Section>

            <Section
              title="Status"
              subtitle={`Currently: ${statusLabel}`}
              action={
                <span className={`psv3-publish-status ${statusLabel}`}>{statusLabel}</span>
              }
            >
              <div className="psv3-publish-row">
                <div>
                  <div className="psv3-publish-row-label">Status</div>
                  <div className="psv3-publish-row-hint">
                    Draft = not visible to buyers. Published = live. Archived = hidden.
                  </div>
                </div>
                <Select
                  value={form.status}
                  onChange={(v) => updateForm("status", v)}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
              </div>
              <div className="psv3-publish-row">
                <div>
                  <div className="psv3-publish-row-label">Show on Homepage</div>
                  <div className="psv3-publish-row-hint">
                    Appears in the main product grid on the homepage
                  </div>
                </div>
                <Toggle
                  value={Boolean(form.homepageVisible)}
                  onChange={(v) => updateForm("homepageVisible", v)}
                />
              </div>
              <div className="psv3-publish-row">
                <div>
                  <div className="psv3-publish-row-label">Featured</div>
                  <div className="psv3-publish-row-hint">
                    Pin to the top of its category
                  </div>
                </div>
                <Toggle
                  value={Boolean(form.featured)}
                  onChange={(v) => updateForm("featured", v)}
                />
              </div>
              <div className="psv3-publish-row">
                <div>
                  <div className="psv3-publish-row-label">Sort Order</div>
                  <div className="psv3-publish-row-hint">
                    Lower numbers appear first (optional)
                  </div>
                </div>
                <TextInput
                  type="number"
                  value={form.sortOrder || 0}
                  onChange={(v) => updateForm("sortOrder", Number(v) || 0)}
                  style={{ width: 100 }}
                />
              </div>
            </Section>

            <Section title="Actions">
              {error && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 14,
                }}>
                  {error}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="psv3-btn psv3-btn--ghost"
                  onClick={() => save(null)}
                  disabled={saving || devPreview}
                >
                  <Save size={16} />
                  Save Draft
                </button>
                <button
                  className="psv3-btn psv3-btn--primary"
                  onClick={() => save("publish")}
                  disabled={saving || devPreview || !canPublish}
                >
                  {form.status === "published" ? "Save & Keep Published" : "Publish"}
                </button>
                {form.status === "published" && (
                  <button
                    className="psv3-btn psv3-btn--danger"
                    onClick={() => save("unpublish")}
                    disabled={saving || devPreview}
                  >
                    Unpublish
                  </button>
                )}
              </div>
              {editing && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--psv3-border)" }}>
                  <div style={{ fontSize: 12, color: "var(--psv3-text-muted)", marginBottom: 8 }}>
                    Danger zone
                  </div>
                  {deleting ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#ef4444" }}>
                        Permanently delete this product? This cannot be undone.
                      </span>
                      <button
                        className="psv3-btn psv3-btn--ghost"
                        onClick={() => setDeleting(false)}
                        disabled={saving}
                        style={{ marginLeft: "auto" }}
                      >
                        Cancel
                      </button>
                      <button
                        className="psv3-btn psv3-btn--danger"
                        onClick={handleDelete}
                        disabled={saving || devPreview}
                      >
                        <Trash2 size={16} />
                        Yes, Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      className="psv3-btn psv3-btn--danger"
                      onClick={() => setDeleting(true)}
                      disabled={saving || devPreview}
                    >
                      <Trash2 size={16} />
                      Delete Product
                    </button>
                  )}
                </div>
              )}
              {!canPublish && (
                <p style={{ fontSize: 12, color: "var(--psv3-text-muted)", marginTop: 12 }}>
                  To publish: fill in title, description, and category. Premium products need a price.
                </p>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductStudioV3;
