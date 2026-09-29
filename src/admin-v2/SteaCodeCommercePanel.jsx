import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  DollarSign,
  DownloadCloud,
  Edit3,
  Eye,
  FileCode2,
  FileText,
  Fullscreen,
  Home,
  Loader2,
  Maximize2,
  Minus,
  Monitor,
  MonitorPlay,
  Package,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
  UploadCloud,
  Users,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  createAdminSteaCodeProduct,
  deleteAdminSteaCodeProduct,
  getAdminSteaCodeEntitlements,
  getAdminSteaCodeOrders,
  getAdminSteaCodeProducts,
  getAdminSteaCodePreview,
  getAdminSteaCodeSource,
  saveAdminSteaCodePreview,
  saveAdminSteaCodeSource,
  uploadSteaCodePackage,
  uploadSteaCodePreviewAssets,
  updateAdminSteaCodeProduct,
} from "../services/steaCodeAdmin.js";
// Public preview cache invalidator. After the admin saves a preview, the
// 5-minute in-memory public cache (in steaCodeCommerce.js) MUST be cleared
// for that productId — otherwise the live site keeps serving the OLD
// preview for up to 5 minutes after the admin clicks Save, which reads
// as "my edit didn't take."
import { invalidateSteaCodeProductPreviewCache } from "../services/steaCodeCommerce.js";
import {
  CODE_PRODUCT_CATEGORIES,
  CODE_PRODUCT_TECH,
} from "../data/stea-code/codeProducts.js";
import {
  buildHtmlCssJsDoc,
  buildFullHtmlDoc,
  buildReactDoc,
} from "../utils/steaCodePreviewBuilders.js";
import { DEV_PREVIEW_PRODUCTS } from "./steaCodeDevPreviewData.js";
import SteaCodeProductLivePreview from "../components/stea-code/SteaCodeProductLivePreview.jsx";

// Shared single-source-of-truth category list. Drop the UI-only pseudo-category "All"
// because Admin saves real product categories.
const PRODUCT_CATEGORIES = CODE_PRODUCT_CATEGORIES.filter((c) => c !== "All");

const FRAMEWORK_OPTIONS = [...CODE_PRODUCT_TECH];

const LANGUAGE_OPTIONS = [
  "JavaScript",
  "CSS",
  "HTML",
  "JSX",
  "TSX",
  "TypeScript",
  "JSON",
  "Markdown",
];

const VIEWPORT_PRESETS = {
  auto:   { label: "Auto",   width: 1440, height: 900, icon: Monitor },
  desktop:{ label: "Desktop",width: 1440, height: 900, icon: Monitor },
  wide:   { label: "Sylva/Desktop Wide", width: 1600, height: 880, icon: Maximize2 },
  laptop: { label: "Laptop", width: 1280, height: 800, icon: MonitorPlay },
  tablet: { label: "Tablet", width: 768,  height: 1024,icon: Tablet },
  mobile: { label: "Mobile", width: 390,  height: 844, icon: Smartphone },
  custom: { label: "Custom", width: 1600, height: 880, icon: Maximize2 },
};

const QUICK_DIM_PRESETS = [
  { w: 1440, h: 900, label: "1440×900" },
  { w: 1600, h: 880, label: "1600×880" },
  { w: 1280, h: 800, label: "1280×800" },
  { w: 768, h: 1024, label: "768×1024" },
  { w: 390, h: 844,  label: "390×844" },
];

const BASE_PREVIEW = {
  enabled: false,
  runtime: "html-css-js",
  interactive: true,
  autoRun: true,
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

const emptyProduct = {
  id: "",
  slug: "",
  titleEn: "",
  shortDescriptionEn: "",
  craftNoteEn: "",
  cardZoom: "full",
  modalZoom: 1,
  cardOffsetX: 0,
  cardOffsetY: 0,
  modalOffsetX: 0,
  modalOffsetY: 0,
  productType: "Code Product",
  category: "Components",
  tags: [],
  frameworks: ["React"],
  languages: ["JavaScript"],
  pricingType: "free",
  price: 0,
  currency: "USD",
  posterImageUrl: "",
  previewVideoUrl: "",
  included: [],
  usageGuideEn: "",
  aiPrompt: "",
  preview: BASE_PREVIEW,
  status: "draft",
  featured: false,
  // Published products are NOT homepage-visible by default. An admin must
  // explicitly approve each one. This preserves the new homepage allowlist
  // gate described in the product visibility section.
  homepageVisible: false,
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return "—";
  if (value?.toDate) return value.toDate().toLocaleString();
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
  }
  return "—";
}

function money(order) {
  const currency = String(order?.currency || "USD").toUpperCase();
  if (typeof order?.amountMinor === "number") {
    return `${currency} ${(order.amountMinor / 100).toFixed(2)}`;
  }
  if (typeof order?.amount === "number") {
    return `${currency} ${Number(order.amount).toFixed(2)}`;
  }
  return "—";
}

/* Small narrow modal for delete confirmation, legacy SourceEditor, etc. */
function Modal({ title, onClose, children }) {
  return (
    <div className="sc-admin-modal-layer">
      <button
        className="sc-admin-modal-backdrop"
        onClick={onClose}
        aria-label="Close"
      />
      <section className="sc-admin-modal">
        <header className="sc-admin-modal-head">
          <div>
            <span className="sc-admin-eyebrow">STEA CODE ADMIN</span>
            <h3>{title}</h3>
          </div>
          <button
            className="sc-admin-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <div className="sc-admin-modal-body">{children}</div>
      </section>
    </div>
  );
}

function getLanguageFromFilename(filename) {
  const ext = String(filename || "").split(".").pop().toLowerCase();
  switch (ext) {
    case "html": case "htm": return "html";
    case "css": return "css";
    case "js": case "mjs": case "cjs": return "javascript";
    case "jsx": return "jsx";
    case "ts": return "typescript";
    case "tsx": return "tsx";
    case "json": return "json";
    case "md": return "markdown";
    default: return "text";
  }
}

/* =========================================================
   SOURCE FILES PANEL — used inside the studio tab
   ========================================================= */
function SourceFilesPanel({ productId, isSuperAdmin, previewSource, onSourceSaved }) {
  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const current = files[active] || null;

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const loadSource = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminSteaCodeSource(productId);

        if (cancelled) return;

        const loadedFiles = Array.isArray(result?.files)
          ? result.files
          : [];

        setFiles(loadedFiles);
        setActive((currentIndex) =>
          Math.min(currentIndex, Math.max(0, loadedFiles.length - 1))
        );

        if (typeof onSourceSaved === "function") {
          onSourceSaved(loadedFiles);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err?.message || "Could not load source files."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSource();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Import source files from the Live Preview tab's local state.
  // Tries local previewSource prop first (instant), falls back to server
  // API if local state is empty (e.g. page was refreshed).
  const importFromPreview = async () => {
    if (!productId) return;
    if (files.length > 0) {
      const ok = window.confirm(
        "Importing from Live Preview will replace the current source files. Continue?"
      );
      if (!ok) return;
    }
    setImporting(true);
    setError("");
    try {
      // Try local preview state first (no server round-trip)
      let p = previewSource || {};
      let hasLocalCode =
        String(p.html || "").trim() ||
        String(p.css || "").trim() ||
        String(p.javascript || "").trim() ||
        String(p.fullDocument || "").trim();

      // If local state is empty, try fetching from server as fallback
      if (!hasLocalCode) {
        try {
          const result = await getAdminSteaCodePreview(productId);
          p = result?.preview || {};
        } catch (serverErr) {
          // Server also failed — show helpful error
          setError(
            "No preview code found in the editor. Open the LIVE PREVIEW tab, paste your code, then come back and click Import again."
          );
          return;
        }
      }

      const rawFullDoc = String(p.fullDocument || "").trim();
      const looksLikeFullHtml =
        /^\s*(<!doctype\s|<html\b|<head\b)/i.test(rawFullDoc) &&
        rawFullDoc.length > 400;
      const runtime =
        looksLikeFullHtml && String(p.runtime || "") !== "external"
          ? "full-html"
          : String(p.runtime || "html-css-js");
      let imported = [];
      if (runtime === "full-html") {
        imported = [
          { path: "index.html", language: "html", content: rawFullDoc, order: 0 },
        ];
      } else {
        imported = [
          { path: "index.html", language: "html", content: String(p.html || ""), order: 0 },
          { path: "styles.css", language: "css", content: String(p.css || ""), order: 1 },
          { path: "script.js", language: "javascript", content: String(p.javascript || ""), order: 2 },
        ].filter((f) => f.content.trim().length > 0 || f.path === "index.html");
      }
      if (imported.length === 0 || (imported.length === 1 && imported[0].content.trim() === "")) {
        setError(
          "No preview code found. Open the LIVE PREVIEW tab, paste your HTML/CSS/JS, then come back and click Import again."
        );
        return;
      }
      setFiles(imported);
      setActive(0);
    } catch (err) {
      setError(err?.message || "Could not import preview source.");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (!uploadedFiles.length) return;
    setError("");
    try {
      const newFiles = [...files];
      for (const file of uploadedFiles) {
        const path = file.name;
        const language = getLanguageFromFilename(path);
        const content = await file.text();
        const existingIndex = newFiles.findIndex((f) => f.path === path);
        if (existingIndex >= 0) {
          newFiles[existingIndex] = { ...newFiles[existingIndex], content, language };
        } else {
          newFiles.push({ path, language, content, order: newFiles.length });
        }
      }
      setFiles(newFiles);
      setActive(newFiles.length - 1);
    } catch (err) {
      setError(`Failed to read file: ${err?.message || "Unknown error"}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const addFile = () => {
    const next = {
      path: `file-${files.length + 1}.txt`,
      language: "text",
      content: "",
      order: files.length,
    };
    setFiles((c) => [...c, next]);
    setActive(files.length);
  };

  const updateCurrent = (key, value) => {
    setFiles((c) =>
      c.map((f, i) => (i === active ? { ...f, [key]: value } : f))
    );
  };

  const removeCurrent = () => {
    if (!current) return;
    const next = files.filter((_, i) => i !== active);
    const updated = next.map((f, i) => ({ ...f, order: i }));
    setFiles(updated);
    setActive(Math.max(0, active - 1));
  };

  const save = async () => {
    if (!productId) {
      setError("Please save the product first before editing source files.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const mapped = files.map((f, i) => ({ ...f, order: i }));

      if (mapped.length === 0) {
        setError("Add at least one source file before saving.");
        return;
      }

      const invalidFile = mapped.find(
        (file) =>
          !String(file?.path || "").trim() ||
          !String(file?.content || "").trim()
      );

      if (invalidFile) {
        setError("Every source file needs a filename and source code.");
        return;
      }

      await saveAdminSteaCodeSource(productId, mapped);

      // Trust the save response — the Worker returns { ok: true, productId, fileCount }
      // on success. Skip the verification GET to avoid extra Firestore reads (which
      // can fail with 429 quota errors and cause false "not confirmed" errors).
      if (typeof onSourceSaved === "function") {
        onSourceSaved(mapped);
      }
    } catch (err) {
      setError(err?.message || "Could not save source files.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="sc-admin-loading" style={{ justifyContent: "center" }}>
        <Loader2 size={18} className="sc-spin" />
        Loading protected source…
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="sc-studio-source-empty">
        <ShieldCheck size={28} />
        <strong>Save the product first</strong>
        <span>
          Create or update the product to unlock protected source file storage.
        </span>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="sc-studio-source-empty">
        <ShieldCheck size={28} />
        <strong>Super Admin only</strong>
        <span>Protected source files are only available to super admins.</span>
      </div>
    );
  }

  return (
    <>
      {/* Source Status & Actions Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: files.length > 0 ? "rgba(34,197,94,.08)" : "rgba(245,166,35,.06)",
        border: `1px solid ${files.length > 0 ? "rgba(34,197,94,.2)" : "rgba(245,166,35,.2)"}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {files.length > 0 ? <CheckCircle2 size={16} color="#63dba9" /> : <AlertTriangle size={16} color="#f5a623" />}
          <strong style={{ fontSize: 12, color: files.length > 0 ? "#63dba9" : "#f5a623", letterSpacing: "0.04em" }}>
            {files.length > 0 ? `SOURCE READY (${files.length} ${files.length === 1 ? "file" : "files"})` : "ADD SOURCE FILES"}
          </strong>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="sc-studio-btn sc-studio-btn-primary"
            onClick={importFromPreview}
            disabled={importing}
            style={{ padding: "6px 14px", fontSize: 12 }}
            title="Copy HTML/CSS/JS from the Live Preview tab into source files"
          >
            {importing ? <Loader2 size={14} className="sc-spin" /> : <DownloadCloud size={14} />}
            Import from Live Preview
          </button>
          <button
            type="button"
            className="sc-studio-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            <Upload size={14} /> Upload
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            multiple
            accept=".html,.css,.js,.jsx,.tsx,.ts,.json,.md,.txt,.zip"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Quick guide when empty */}
      {files.length === 0 && (
        <div style={{
          padding: "14px 16px",
          marginBottom: 12,
          borderRadius: 10,
          background: "rgba(255,255,255,.03)",
          border: "1px solid var(--sc-border)",
          fontSize: 12,
          color: "var(--sc-muted)",
          lineHeight: 1.6,
        }}>
          <strong style={{ color: "var(--sc-ink)", display: "block", marginBottom: 4 }}>
            What goes here?
          </strong>
          The source files buyers download after purchase. Click{" "}
          <strong style={{ color: "var(--sc-gold)" }}>Import from Live Preview</strong>{" "}
          to auto-generate index.html, styles.css, and script.js from your preview code.
          You can also upload files manually.
        </div>
      )}

      {error && <div className="sc-admin-error" style={{ margin: "0 0 12px" }}>{error}</div>}

      <div className="sc-studio-source">
        <aside className="sc-studio-source-tree">
          <div className="sc-studio-source-tree-head">
            <strong>PROJECT FILES</strong>
            <button
              className="sc-studio-icon-btn"
              onClick={addFile}
              title="Add file"
              style={{ padding: "0 8px" }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="sc-studio-source-list">
            {files.length === 0 && (
              <div className="sc-admin-empty-mini">No files yet.</div>
            )}
            {files.map((f, i) => (
              <button
                key={`${f.path}-${i}`}
                className={`sc-studio-file-btn ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                <FileCode2 size={14} />
                <span>{f.path}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="sc-studio-source-editor">
          {current ? (
            <>
              <div className="sc-studio-source-meta">
                <label className="sc-studio-field">
                  <span className="sc-studio-field-label">Filename</span>
                  <input
                    className="sc-studio-input"
                    value={current.path}
                    onChange={(e) => {
                      const newPath = e.target.value;
                      const inferredLang = getLanguageFromFilename(newPath);
                      setFiles((c) =>
                        c.map((f, i) =>
                          i === active
                            ? { ...f, path: newPath, language: inferredLang }
                            : f
                        )
                      );
                    }}
                  />
                </label>
                <label className="sc-studio-field">
                  <span className="sc-studio-field-label">Language</span>
                  <select
                    className="sc-studio-select"
                    value={current.language}
                    onChange={(e) => updateCurrent("language", e.target.value)}
                  >
                    {["jsx","javascript","typescript","tsx","css","html","json","markdown","text"].map(
                      (l) => (<option key={l}>{l}</option>)
                    )}
                  </select>
                </label>
              </div>

              <label className="sc-admin-code-field" style={{ flex: 1 }}>
                <span>SOURCE CODE</span>
                <textarea
                  spellCheck={false}
                  className="sc-studio-editor-textarea"
                  value={current.content || ""}
                  onChange={(e) => updateCurrent("content", e.target.value)}
                />
              </label>

              <div className="sc-studio-source-bottom">
                <button
                  className="sc-studio-btn"
                  onClick={removeCurrent}
                  style={{ borderColor: "rgba(239,68,68,.25)", color: "#ff8787" }}
                >
                  <Trash2 size={14} /> Delete File
                </button>
                <button
                  className="sc-studio-btn sc-studio-btn-primary"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={14} className="sc-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  Save Source
                </button>
              </div>
            </>
          ) : (
            <div className="sc-studio-source-empty">
              <Code2 size={28} />
              <strong>No file selected</strong>
              <span>Click "Import from Live Preview" above to auto-generate source files from your preview code, or upload manually.</span>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="sc-studio-btn sc-studio-btn-primary" onClick={importFromPreview} disabled={importing}>
                  {importing ? <Loader2 size={14} className="sc-spin" /> : <DownloadCloud size={14} />} Import from Live Preview
                </button>
                <button className="sc-studio-btn" onClick={addFile}>
                  <Plus size={14} /> Add Blank File
                </button>
              </div>
            </div>
          )}
        </section>

        {/* R2 Assets: Package ZIP + Preview Video/Poster */}
        <section className="sc-studio-source-section" style={{ marginTop: 16 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "var(--sc-ink-strong)", marginBottom: 10 }}>
            <Archive size={15} color="#f5a623" /> R2 Assets
          </h3>
          <p style={{ fontSize: 11, color: "var(--sc-muted)", marginBottom: 12 }}>
            Upload the downloadable package (.zip) and preview video/poster to Cloudflare R2.
          </p>
          <AssetsUploader productId={productId} />
        </section>
      </div>
    </>
  );
}

/* =========================================================
   R2 ASSETS UPLOADER
   ========================================================= */
function AssetsUploader({ productId }) {
  const [pkgState, setPkgState] = useState({ uploading: false, key: "", error: "" });
  const [vidState, setVidState] = useState({ uploading: false, key: "", error: "" });
  const [posterState, setPosterState] = useState({ uploading: false, key: "", error: "" });
  const pkgInput = useRef(null);
  const vidInput = useRef(null);
  const posterInput = useRef(null);

  const onPickPkg = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 100 * 1024 * 1024) {
      setPkgState({ uploading: false, key: "", error: "File too large (max 100MB)." });
      return;
    }
    setPkgState({ uploading: true, key: "", error: "" });
    uploadSteaCodePackage(productId, f)
      .then((r) => setPkgState({ uploading: false, key: r.key, error: "" }))
      .catch((err) => setPkgState({ uploading: false, key: "", error: err?.message || "Upload failed." }));
  };

  const onPickVid = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setVidState({ uploading: false, key: "", error: "Video too large (max 50MB)." });
      return;
    }
    setVidState({ uploading: true, key: "", error: "" });
    uploadSteaCodePreviewAssets(productId, { video: f })
      .then((r) => setVidState({ uploading: false, key: r.video?.key || "", error: "" }))
      .catch((err) => setVidState({ uploading: false, key: "", error: err?.message || "Upload failed." }));
  };

  const onPickPoster = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setPosterState({ uploading: false, key: "", error: "Poster too large (max 2MB)." });
      return;
    }
    setPosterState({ uploading: true, key: "", error: "" });
    uploadSteaCodePreviewAssets(productId, { poster: f })
      .then((r) => setPosterState({ uploading: false, key: r.poster?.key || "", error: "" }))
      .catch((err) => setPosterState({ uploading: false, key: "", error: err?.message || "Upload failed." }));
  };

  const rowStyle = {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
    background: "var(--sc-surface-2)", border: "1px solid var(--sc-border)",
    borderRadius: 8, marginBottom: 8,
  };
  const btnStyle = {
    padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer",
    background: "var(--sc-gold)", color: "#0a0b12", border: "none", borderRadius: 6,
  };

  return (
    <div>
      <div style={rowStyle}>
        <input ref={pkgInput} type="file" accept=".zip" hidden onChange={onPickPkg} />
        <button style={btnStyle} onClick={() => pkgInput.current?.click()} disabled={pkgState.uploading}>
          {pkgState.uploading ? "Uploading…" : "Upload Package (.zip)"}
        </button>
        <span style={{ fontSize: 11, color: "var(--sc-muted)", flex: 1 }}>
          {pkgState.key ? `✓ ${pkgState.key}` : pkgState.error || "Not uploaded"}
        </span>
      </div>
      <div style={rowStyle}>
        <input ref={vidInput} type="file" accept="video/mp4,video/webm" hidden onChange={onPickVid} />
        <button style={btnStyle} onClick={() => vidInput.current?.click()} disabled={vidState.uploading}>
          {vidState.uploading ? "Uploading…" : "Upload Preview Video"}
        </button>
        <span style={{ fontSize: 11, color: "var(--sc-muted)", flex: 1 }}>
          {vidState.key ? `✓ ${vidState.key}` : vidState.error || "Not uploaded (mp4/webm, max 50MB)"}
        </span>
      </div>
      <div style={rowStyle}>
        <input ref={posterInput} type="file" accept="image/jpeg,image/png" hidden onChange={onPickPoster} />
        <button style={btnStyle} onClick={() => posterInput.current?.click()} disabled={posterState.uploading}>
          {posterState.uploading ? "Uploading…" : "Upload Poster Image"}
        </button>
        <span style={{ fontSize: 11, color: "var(--sc-muted)", flex: 1 }}>
          {posterState.key ? `✓ ${posterState.key}` : posterState.error || "Not uploaded (jpg/png, max 2MB)"}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   PREVIEW STAGE (shared rendering)
   ========================================================= */
function PreviewStage(props) {
  const {
    preview,
    previewDocument,
    previewKey,
    manualScale,
  } = props;

  const scrollRef = useRef(null);

  // Accurate preview state — never show RUNNING when preview is disabled.
  const [iframeLoaded, setIframeLoaded] = useState(false);
  useEffect(() => { setIframeLoaded(false); }, [previewKey, previewDocument]);
  const previewState = !preview.enabled
    ? { label: "DISABLED", cls: "is-disabled" }
    : iframeLoaded
    ? { label: "RUNNING", cls: "is-running" }
    : { label: "STARTING", cls: "is-starting" };

  return (
    <div className="sc-studio-preview-shell">
      <div className="sc-studio-preview-toolbar">
        <div className="sc-studio-preview-meta">
          <span className="sc-studio-preview-title">LIVE PREVIEW</span>
          <span className={`sc-studio-preview-running ${previewState.cls}`}>{previewState.label}</span>
          <span className="sc-studio-preview-dim">Auto-fit</span>
        </div>

        <div className="sc-studio-preview-actions">
          <button
            type="button"
            className="sc-studio-icon-btn"
            onClick={props.onReload}
            title="Reload preview"
          >
            <RefreshCw size={13} /> Reload
          </button>

          {props.onToggleFullscreen && (
            <button
              type="button"
              className="sc-studio-icon-btn"
              onClick={props.onToggleFullscreen}
              title="Fullscreen"
            >
              <Fullscreen size={13} /> Fullscreen
            </button>
          )}
        </div>
      </div>

      {preview.enabled ? (
        <div className="sc-studio-preview-scroll" ref={scrollRef}>
          <div className={`sc-studio-preview-stage ${preview.interactive ? "" : "is-passive"}`}>
            <iframe
              key={previewKey}
              title="STEA Code Product Preview"
              sandbox="allow-scripts"
              srcDoc={previewDocument}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>
      ) : (
        <div className="sc-studio-preview-disabled">
          Enable Live Preview to render this runtime.
        </div>
      )}
    </div>
  );
}

/* Wrapper — now a thin pass-through since zoom/viewport/scale controls
   were removed. The preview fills the workspace directly (no scaling). */
function PreviewStageWrapper(props) {
  const { onReload, onToggleFullscreen } = props;
  return (
    <PreviewStage
      {...props}
      onReload={onReload}
      onToggleFullscreen={onToggleFullscreen}
    />
  );
}

/* =========================================================
   FULLSCREEN PREVIEW
   ========================================================= */
function FullscreenPreview({ preview, previewDocument, previewKey, onClose, onReload }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sc-studio-fullscreen">
      <div className="sc-studio-fullscreen-toolbar">
        <div className="sc-studio-preview-meta">
          <span className="sc-studio-preview-title">LIVE PREVIEW</span>
          <span className="sc-studio-preview-dim">Fullscreen · Auto-fit</span>
        </div>
        <div className="sc-studio-preview-actions">
          <button type="button" className="sc-studio-icon-btn" onClick={onReload}>
            <RefreshCw size={13} /> Reload
          </button>
          <button type="button" className="sc-studio-btn sc-studio-btn-primary" onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
      </div>
      <div className="sc-studio-fullscreen-body">
        <div className={`sc-studio-preview-stage ${preview.interactive ? "" : "is-passive"}`}>
          <iframe
            key={previewKey}
            title="STEA Code Fullscreen Preview"
            sandbox="allow-scripts"
            srcDoc={previewDocument}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   UPLOAD ERROR HELPER — single source of truth for upload errors
   ========================================================= */
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

/* =========================================================
   PRODUCT STUDIO — the new wide IDE-style editor shell
   ========================================================= */
export function ProductStudio({ product, onClose, onSaved, onCreated, isSuperAdmin, devPreview = false, fullPage = false, initialTab = "general", baseRoute = "/code-admin" }) {
  const editing = Boolean(product?.id);
  const navigate = useNavigate();
  const ALLOWED_TABS = ["general", "preview", "source", "publish"];
  const [tab, setTab] = useState(ALLOWED_TABS.includes(initialTab) ? initialTab : "general");

  const selectTab = useCallback((nextTab) => {
    const valid = ALLOWED_TABS.includes(nextTab) ? nextTab : "general";
    setTab(valid);
    if (fullPage && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("tab") !== valid) {
        sp.set("tab", valid);
        navigate({ search: sp.toString() }, { replace: true });
      }
    }
  }, [fullPage, navigate]);

  useEffect(() => {
    if (initialTab && ALLOWED_TABS.includes(initialTab) && initialTab !== tab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [codeEditorTab, setCodeEditorTab] = useState("html");
  const [editorMode, setEditorMode] = useState("code"); // code | split | preview — locked to code, previews are at top
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState("");
  const videoFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);
  const autoRunTimer = useRef(null);

  const uploadVideoFile = async (file) => {
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
      setVideoUploadError("Only MP4 or WebM video files are supported.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setVideoUploadError("Video file must be under 100 MB.");
      return;
    }
    const pid = product?.id;
    if (!pid) {
      setVideoUploadError("Save the product first before uploading a video.");
      return;
    }
    setVideoUploading(true);
    setVideoUploadError("");
    try {
      const result = await uploadSteaCodePreviewAssets(pid, { video: file });
      if (result?.video?.key) {
        setForm((current) => ({
          ...current,
          preview: { ...current.preview, videoKey: result.video.key },
        }));
        setDirty(true);
      }
    } catch (err) {
      setVideoUploadError(getUploadErrorMessage(err, "video upload"));
    } finally {
      setVideoUploading(false);
    }
  };

  const uploadPosterFile = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      setPosterUploadError("Only JPG, PNG, WebP or GIF images are supported.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPosterUploadError("Image must be under 15 MB.");
      return;
    }
    const pid = product?.id;
    if (!pid) {
      setPosterUploadError("Save the product first before uploading a poster.");
      return;
    }
    setPosterUploading(true);
    setPosterUploadError("");
    try {
      const result = await uploadSteaCodePreviewAssets(pid, { poster: file });
      if (result?.poster?.key) {
        setForm((current) => ({
          ...current,
          preview: { ...current.preview, posterKey: result.poster.key },
        }));
        setDirty(true);
      }
    } catch (err) {
      setPosterUploadError(getUploadErrorMessage(err, "poster upload"));
    } finally {
      setPosterUploading(false);
    }
  };

  const [form, setForm] = useState(() => {
    const incomingPreview = product?.preview || {};
    const mergedPreview = {
      ...BASE_PREVIEW,
      ...incomingPreview,
      // Default autoRun = false for heavy full-html runtime on fresh creations
      autoRun: incomingPreview.runtime === "full-html"
        ? Boolean(incomingPreview.autoRun)
        : (incomingPreview.autoRun !== false ? true : false),
    };
    return {
      ...emptyProduct,
      ...(product || {}),
      preview: mergedPreview,
      tags: (product?.tags || []).join(", "),
      frameworks: (product?.frameworks || []).join(", "),
      languages: (product?.languages || []).join(", "),
      included: (product?.included || []).join("\n"),
    };
  });

  const preview = { ...BASE_PREVIEW, ...(form.preview || {}) };
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit mode: fetch dedicated preview source (from stea_code_product_previews
  // or legacy embedded fields) and merge into the form. This keeps very large
  // preview documents out of the product metadata payload.
  useEffect(() => {
    if (!editing || !product?.id || devPreview) return undefined;
    let cancelled = false;
    setPreviewLoading(true);
    getAdminSteaCodePreview(product.id)
      .then((result) => {
        if (cancelled) return;
        const p = result?.preview || {};
        setForm((current) => ({
          ...current,
          preview: {
            ...BASE_PREVIEW,
            ...(current.preview || {}),
            html: p.html || "",
            css: p.css || "",
            javascript: p.javascript || "",
            // Dedicated React/TSX source fields (introduced alongside the
            // real React preview runtime). Explicitly read from the preview
            // payload; the preview write endpoint saves them.
            jsx: typeof p.jsx === "string" ? p.jsx : (current.preview?.jsx || ""),
            tsx: typeof p.tsx === "string" ? p.tsx : (current.preview?.tsx || ""),
            fullDocument: p.fullDocument || "",
            runtime: p.runtime || current.preview?.runtime || "html-css-js",
            baseUrl: p.baseUrl || current.preview?.baseUrl || "",
            externalUrl: p.externalUrl || current.preview?.externalUrl || "",
          },
        }));
        setPreviewKey((k) => k + 1);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[ProductStudio] preview load failed:", err?.message || err);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [editing, product?.id, devPreview]);

  useEffect(() => {
    return () => {
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    };
  }, []);

  const setPreview = useCallback((key, value) => {
    setForm((current) => {
      const prevPreview = { ...BASE_PREVIEW, ...(current.preview || {}) };
      const nextPreview = { ...prevPreview, [key]: value };
      return { ...current, preview: nextPreview };
    });
    setDirty(true);

    const peekRuntime = String(preview.runtime || "html-css-js");
    const peekAutoRun = key === "autoRun" ? Boolean(value) : Boolean(preview.autoRun);
    if (!peekAutoRun) return;
    const contentKeys = [
      "html", "css", "javascript", "jsx", "tsx",
      "fullDocument", "baseUrl", "externalUrl",
    ];
    if (!contentKeys.includes(key)) return;
    const heavy = peekRuntime === "full-html";
    const debounceMs = heavy ? 900 : 280;
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    autoRunTimer.current = setTimeout(() => {
      setPreviewKey((k) => k + 1);
    }, debounceMs);
  }, [preview.autoRun, preview.runtime]);

  // Preview document builders are shared with the public STEA Code renderer
  // so Admin "Live Playground" behaviour is 1:1 with what customers see.
  const generatedPreviewDocument = useMemo(() => {
    return buildHtmlCssJsDoc({
      html: preview.html,
      css: preview.css,
      javascript: preview.javascript,
      baseUrl: preview.baseUrl,
    });
  }, [preview.css, preview.html, preview.javascript, preview.baseUrl]);

  const generatedReactDocument = useMemo(() => {
    const reactSource =
      preview.tsx || preview.jsx || preview.javascript || preview.html || "";
    return buildReactDoc({
      jsx: reactSource,
      css: preview.css,
      baseUrl: preview.baseUrl,
    });
  }, [
    preview.css,
    preview.javascript,
    preview.html,
    preview.jsx,
    preview.tsx,
    preview.baseUrl,
  ]);

  const fullDocumentSource = String(preview.fullDocument || "");
  const fullHtmlPresent = fullDocumentSource.trim().length > 0;

  const previewDocument = useMemo(() => {
    /*
     * Authoritative rule:
     * If fullDocument contains a real authored document, use it directly
     * regardless of the saved runtime metadata. This prevents stale
     * runtime="html-css-js" on existing products from blanking the preview,
     * and guarantees the authored full HTML is NEVER synthetically rebuilt
     * from the html/css/js split fields.
     */
    if (fullHtmlPresent) {
      const url = String(preview.baseUrl || "").trim();
      // If the document already has a <base> or there's no base URL to
      // apply, return the authored fullDocumentSource verbatim. This is
      // the common case and keeps the preview byte-for-byte identical to
      // what the author pasted into the Full HTML editor.
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

  const set = useCallback((key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "titleEn" && !current.slug && !editing) {
        next.slug = slugify(value);
        next.id = slugify(value);
      }
      if (key === "pricingType" && value === "free") {
        next.price = 0;
      }
      return next;
    });
    setDirty(true);
  }, [editing]);

  const applyViewportPreset = (mode) => {
    const preset = VIEWPORT_PRESETS[mode];
    if (!preset) return;
    setPreview("viewportMode", mode);
    if (mode !== "custom" && mode !== "auto") {
      setPreview("width", preset.width);
      setPreview("height", preset.height);
    }
  };

  const applyDimPreset = (w, h) => {
    setPreview("width", w);
    setPreview("height", h);
    setPreview("viewportMode", "custom");
  };

  const reload = () => setPreviewKey((k) => k + 1);

  // ESC only closes fullscreen (NOT the studio — accidental close is costly)
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const save = async (publishAction, extraOverrides = {}) => {
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
      setError("English short description is required.");
      return;
    }
    if (form.pricingType === "premium" && Number(form.price) <= 0) {
      setError("Premium products must have a price greater than 0.");
      return;
    }
    // Hard guard: a free product cannot be published without source files.
    // This prevents the contradictory "Free to use, open the code" +
    // "Source files not available" state from ever reaching visitors.
    const isPublishing =
      publishAction === "publish" || publishAction === "publish_homepage";
    if (
      isPublishing &&
      form.pricingType === "free" &&
      !hasSourceFiles
    ) {
      setError("Free products require at least one source file before publishing.");
      return;
    }
    if (devPreview) {
      setError("Unable to save product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
      return;
    }

    // Split preview source (large) from metadata (lightweight).
    // Metadata keeps preview SETTINGS only; source lives in a dedicated collection.
    //
    // Full-HTML auto-detect: if fullDocument is a complete HTML document that
    // starts with a doctype/html tag (strong signal it's an authored standalone
    // preview such as Character Wave), treat it as runtime="full-html" even if
    // the metadata toggle was accidentally left on HTML/CSS/JS split mode.
    //
    // Read directly from form.preview to avoid any stale closure on `preview`.
    const formPreview = form.preview || {};
    const rawFullDoc = String(formPreview.fullDocument || "").trim();
    const looksLikeFullHtml =
      /^\s*(<!doctype\s|<html\b|<head\b)/i.test(rawFullDoc) &&
      rawFullDoc.length > 400;

    const normalizedRuntime =
      looksLikeFullHtml && formPreview.runtime !== "external"
        ? "full-html"
        : String(formPreview.runtime || preview.runtime || "html-css-js");

    const previewSource = {
      runtime: normalizedRuntime,
      html: String(formPreview.html || ""),
      css: String(formPreview.css || ""),
      javascript: String(formPreview.javascript || ""),
      // React/TSX runtime payload: dedicated fields rather than cramming
      // everything into the html/javascript buckets.
      jsx: String(formPreview.jsx || ""),
      tsx: String(formPreview.tsx || ""),
      fullDocument: rawFullDoc,
      baseUrl: String(formPreview.baseUrl || ""),
      externalUrl: String(formPreview.externalUrl || ""),
    };

    // Diagnostic: verify previewSource has content before saving.
    console.log("[STEA Code Save] previewSource:", {
      htmlLen: previewSource.html.length,
      cssLen: previewSource.css.length,
      fullDocLen: previewSource.fullDocument.length,
      jsLen: previewSource.javascript.length,
      runtime: previewSource.runtime,
    });
    const previewSettings = {
      enabled: preview.enabled,
      runtime: normalizedRuntime,
      interactive: preview.interactive,
      autoRun: preview.autoRun,
      viewportMode: preview.viewportMode,
      width: preview.width,
      height: preview.height,
      scaleMode: preview.scaleMode,
      baseUrl: preview.baseUrl,
      externalUrl: preview.externalUrl,
    };

    // Publishing makes the product visible on the homepage by default.
    // Admins can still toggle it off via the "Show on homepage" switch.
    const nextHomepageVisible =
      extraOverrides.homepageVisible !== undefined
        ? Boolean(extraOverrides.homepageVisible)
        : isPublishing
          ? true
          : Boolean(form?.homepageVisible);

    const payload = {
      ...form,
      ...extraOverrides,
      id,
      slug: form.slug || id,
      tags: splitList(form.tags),
      frameworks: splitList(form.frameworks),
      languages: splitList(form.languages),
      included: String(form.included || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      // Settings only — never send large source in the metadata payload.
      preview: previewSettings,
      aiPrompt: String(form.aiPrompt || "").trim(),
      homepageVisible: nextHomepageVisible,
    };
    if (publishAction === "publish" || publishAction === "publish_homepage") {
      payload.status = "published";
    } else if (publishAction === "draft" || publishAction === "unpublish") {
      payload.status = "draft";
    }

    setSaving(true);
    try {
      // 1. Save metadata first.
      let result;
      if (editing) {
        result = await updateAdminSteaCodeProduct(product.id, payload);
      } else {
        result = await createAdminSteaCodeProduct(payload);
      }
      const realProductId = result?.productId || result?.product?.id || id;

      // 2. Save preview source to the dedicated collection.
      //    Both metadata + preview must succeed before "Saved".
      try {
        await saveAdminSteaCodePreview(realProductId, previewSource);
        // Preview saved — invalidate the public cache for this product so
        // the live site picks up the new render immediately instead of
        // serving the stale entry for up to 5 minutes.
        invalidateSteaCodeProductPreviewCache(realProductId);
      } catch (previewErr) {
        console.error("[STEA Code Save] Preview save error:", {
          message: previewErr?.message,
          code: previewErr?.code,
          status: previewErr?.status,
          backendMessage: previewErr?.backendMessage,
        });
        const previewDetail = previewErr?.backendMessage || previewErr?.message || "Unknown error";
        const previewStatus = previewErr?.status ? ` (HTTP ${previewErr.status})` : "";
        setError(
          `Metadata saved, but preview source could not be saved${previewStatus}: ${previewDetail}. Retry from the Live Preview tab.`
        );
        setDirty(true);
        return;
      }

      const savedProduct = result?.product || { ...payload, id: realProductId };
      setForm((current) => ({
        ...current,
        ...savedProduct,
        id: realProductId,
        tags: (savedProduct.tags || payload.tags || []).join(", "),
        frameworks: (savedProduct.frameworks || payload.frameworks || []).join(", "),
        languages: (savedProduct.languages || payload.languages || []).join(", "),
        included: (savedProduct.included || payload.included || []).join("\n"),
        preview: { ...previewSettings, ...previewSource },
      }));
      await onSaved(savedProduct);
      setNotice(publishAction === "publish_homepage" ? "Published to Homepage" : "Saved");
      setDirty(false);
      if (!editing && realProductId) {
        // New product successfully created: move to the persistent edit route.
        // This changes /products/new → /products/:id/edit so subsequent
        // actions (Source Files, Publish) operate on the real product.
        if (typeof onCreated === "function") {
          // Parent passed an onCreated handler (used by modal path).
          onCreated(realProductId, tab);
        } else if (fullPage) {
          // Full-page route: navigate to the edit URL, preserving current tab.
          const base = baseRoute.replace(/\/$/, "");
          navigate(
            `${base}/products/${encodeURIComponent(realProductId)}/edit?tab=${tab}`,
            { replace: true }
          );
        } else {
          setTab("publish");
        }
      }
    } catch (err) {
      console.error("[STEA Code Save] Full error:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        backendMessage: err?.backendMessage,
        stack: err?.stack,
      });
      const errorDetail = err?.backendMessage || err?.message || "Could not save product.";
      const statusInfo = err?.status ? ` (HTTP ${err.status})` : "";
      const codeInfo = err?.code ? ` [${err.code}]` : "";
      setError(`Unable to save product${statusInfo}${codeInfo}: ${errorDetail}`);
    } finally {
      setSaving(false);
    }
  };

  // Unsaved changes protection — warn before unload/navigate away while dirty.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleBack = () => {
    if (dirty) {
      const ok = window.confirm("You have unsaved changes. Discard changes and leave?");
      if (!ok) return;
    }
    setDirty(false);
    onClose();
  };

  const [hasSourceFiles, setHasSourceFiles] = useState(false);

  const refreshSourceStatus = useCallback(async (targetId) => {
    const idToUse = targetId || (editing ? product?.id : form?.id);
    if (!idToUse || devPreview) return;
    try {
      const result = await getAdminSteaCodeSource(idToUse);
      const hasFiles = Array.isArray(result?.files) && result.files.length > 0;
      setHasSourceFiles(hasFiles);
    } catch {
      // non-fatal
    }
  }, [editing, product?.id, form?.id, devPreview]);

  // Check if source files exist for this product (used by publish validation).
  useEffect(() => {
    if (!editing || !product?.id || devPreview) return undefined;
    refreshSourceStatus(product.id);
  }, [editing, product?.id, devPreview, refreshSourceStatus]);

  // Refresh source files when switching to source or publish tabs
  useEffect(() => {
    if ((tab === "source" || tab === "publish") && editing && product?.id) {
      refreshSourceStatus(product.id);
    }
  }, [tab, editing, product?.id, refreshSourceStatus]);

  // Comprehensive Publish Requirements Validation:
  // 1. Saved product draft (persisted product ID exists)
  // 2. Title exists
  // 3. Slug exists
  // 4. Description exists
  // 5. Category exists
  // 6. Pricing type exists + price > 0 for premium
  // 7. Preview enabled and valid (preview video or live HTML preview)
  // 8. Source files present
  const publishValidation = useMemo(() => {
    const hasTitle = Boolean(String(form.titleEn || "").trim());
    const hasSlug = Boolean(String(form.slug || form.id || "").trim());
    const hasDescription = Boolean(String(form.shortDescriptionEn || "").trim());
    const hasCategory = Boolean(String(form.category || "").trim());
    const hasPricing = Boolean(form.pricingType === "free" || (form.pricingType === "premium" && Number(form.price) > 0));
    const hasPreview = Boolean(preview.enabled || String(form.previewVideoUrl || "").trim() || String(form.posterImageUrl || "").trim());
    const hasSource = Boolean(hasSourceFiles);
    const isSavedDraft = Boolean(editing && product?.id);

    const ready = isSavedDraft && hasTitle && hasSlug && hasDescription && hasCategory && hasPricing && hasPreview && hasSource;

    const missing = [];
    if (!isSavedDraft) missing.push("Save draft first");
    if (!hasTitle) missing.push("English Title");
    if (!hasSlug) missing.push("Slug / Product ID");
    if (!hasDescription) missing.push("Short Description");
    if (!hasCategory) missing.push("Category");
    if (!hasPricing) missing.push(form.pricingType === "premium" ? "Valid Price (> $0)" : "Pricing Type");
    if (!hasPreview) missing.push("Preview (Video or Live HTML)");
    if (!hasSource) missing.push("Source files added");

    return {
      ready,
      missing,
      hasTitle,
      hasSlug,
      hasDescription,
      hasCategory,
      hasPricing,
      hasPreview,
      hasSource,
      isSavedDraft,
    };
  }, [form, preview.enabled, hasSourceFiles, editing, product?.id]);

  const canPublish = publishValidation.ready;
  const missingSourceForPublish = editing && !hasSourceFiles;
  const needsSaveFirst = !editing;

  // Tab completion indicators (based on real form state, never faked).
  const tabStatus = {
    general: (String(form.titleEn || "").trim() && String(form.shortDescriptionEn || "").trim()) ? "done" : "todo",
    preview: (preview.enabled || String(form.previewVideoUrl || "").trim() || String(form.posterImageUrl || "").trim()) ? "done" : "todo",
    source: hasSourceFiles ? "done" : "todo",
    publish: canPublish ? "done" : "todo",
  };

  // Sticky action bar (fullPage mode) — always visible.
  const renderActions = () => {
    const isArchived = editing && form.status === "archived";
    const isPublished = editing && form.status === "published";
    return (
      <div className="sc-studio-actions">
        {saving ? (
          <span className="sc-studio-save-state is-saving"><Loader2 size={13} className="sc-spin" /> Saving…</span>
        ) : error ? (
          <span className="sc-studio-save-state is-failed">Save failed</span>
        ) : dirty ? (
          <span className="sc-studio-save-state is-dirty">Unsaved changes</span>
        ) : notice ? (
          <span className="sc-studio-save-state is-saved">{notice}</span>
        ) : null}
        {isArchived ? (
          <button type="button" className="sc-studio-btn sc-studio-btn-primary" onClick={() => save("publish")} disabled={saving || !canPublish}>
            <CheckCircle2 size={14} /> Restore
          </button>
        ) : isPublished ? (
          <>
            <button type="button" className="sc-studio-btn" onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 size={14} className="sc-spin" /> : <Save size={14} />} Save Changes
            </button>
            <button
              type="button"
              className={`sc-studio-btn ${form.homepageVisible ? "sc-studio-btn-active" : "sc-studio-btn-primary"}`}
              onClick={() => save(null, { homepageVisible: !form.homepageVisible })}
              disabled={saving}
              title={form.homepageVisible ? "Hide from Storefront Homepage" : "Show on Storefront Homepage"}
            >
              <Home size={14} /> {form.homepageVisible ? "Hide from Homepage" : "Show on Homepage"}
            </button>
            <button type="button" className="sc-studio-btn sc-studio-btn-danger" onClick={() => save("unpublish")} disabled={saving}>
              <Archive size={14} /> Unpublish
            </button>
          </>
        ) : (
          <>
            <button type="button" className="sc-studio-btn" onClick={() => save("draft")} disabled={saving}>
              {saving ? <Loader2 size={14} className="sc-spin" /> : <Save size={14} />} {editing ? "Save Changes" : "Save Draft"}
            </button>
            <button
              type="button"
              className="sc-studio-btn"
              onClick={() => save("publish")}
              disabled={saving || !canPublish}
              title={!canPublish ? `Missing requirements: ${publishValidation.missing.join(", ")}` : "Publish to catalog"}
            >
              {saving ? <Loader2 size={14} className="sc-spin" /> : <CheckCircle2 size={14} />} Publish
            </button>
            <button
              type="button"
              className="sc-studio-btn sc-studio-btn-primary"
              onClick={() => save("publish_homepage")}
              disabled={saving || !canPublish}
              title={!canPublish ? `Missing requirements: ${publishValidation.missing.join(", ")}` : "Publish and place immediately in STEA Code storefront"}
            >
              {saving ? <Loader2 size={14} className="sc-spin" /> : <Home size={14} />} Publish & Show on Homepage
            </button>
          </>
        )}
      </div>
    );
  };

  const statusLabel =
    form.status === "published" ? "Published"
    : form.status === "archived" ? "Archived"
    : "Draft";

  const runtimeLabel =
    preview.runtime === "full-html" ? "Full HTML / Canvas / WebGL"
    : preview.runtime === "html-css-js" ? "HTML + CSS + JavaScript"
    : preview.runtime === "external" ? "External Demo"
    : "React / JSX";

  const splitStyle =
    editorMode === "code" ? { gridTemplateColumns: "1fr" }
    : editorMode === "preview" ? { gridTemplateColumns: "1fr" }
    : undefined;

  return (
    <>
      <div className={fullPage ? "sc-studio-page" : "sc-studio-layer"}>
        {!fullPage && (
          <button
            className="sc-studio-backdrop"
            onClick={onClose}
            aria-label="Close"
            type="button"
          />
        )}
        <div
          className={fullPage ? "sc-studio sc-studio-fullpage" : "sc-studio"}
          role={fullPage ? undefined : "dialog"}
          aria-modal={fullPage ? undefined : "true"}
        >
          {/* HEADER (sticky in fullPage) */}
          <header className={`sc-studio-head${fullPage ? " is-fullpage" : ""}`}>
            <div className="sc-studio-head-left">
              {fullPage && (
                <button
                  type="button"
                  className="sc-studio-back"
                  onClick={handleBack}
                  aria-label="Back to Products"
                >
                  ← Products
                </button>
              )}
              <div className="sc-studio-brand">
                <span className="sc-studio-eyebrow">STEA CODE ADMIN</span>
                <h2>{editing ? "Edit Product" : "Create Product"}</h2>
              </div>
              <span className={`sc-studio-status-pill is-${form.status || "draft"}`}>
                {statusLabel}
              </span>
            </div>
            <div className="sc-studio-head-actions">
              {fullPage ? renderActions() : (
                <button
                  type="button"
                  className="sc-studio-close"
                  onClick={onClose}
                  aria-label="Close studio"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </header>

          {/* TABS */}
          <nav className="sc-studio-tabs" aria-label="Product Studio Tabs">
            {[
              ["general", "GENERAL"],
              ["preview", "LIVE PREVIEW"],
              ["source", "SOURCE FILES"],
              ["publish", "PUBLISH"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`sc-studio-tab ${tab === id ? "is-active" : ""} is-${tabStatus[id]}`}
                onClick={() => selectTab(id)}
              >
                <span className="sc-studio-tab-dot" data-state={tabStatus[id]} />
                {label}
              </button>
            ))}
          </nav>

          {/* BODY */}
          <div className={`sc-studio-body ${tab === "preview" ? "is-preview-tab" : ""}`}>
            <div className="sc-studio-pad">
              {error && <div className="sc-studio-error">{error}</div>}
              {notice && <div className="sc-studio-notice">{notice}</div>}

              {/* ============== GENERAL TAB ============== */}
              {tab === "general" && (
                <div style={{ display: "grid", gap: 22 }}>
                  <section className="sc-studio-section">
                    <div className="sc-studio-section-head">
                      <div style={{ display: "grid", gap: 3 }}>
                        <strong>PRODUCT METADATA</strong>
                        <span>Core information displayed on the catalog and product pages.</span>
                      </div>
                    </div>
                    <div className="sc-studio-section-body">
                      <div className="sc-studio-grid">
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">
                            English Title <span className="req">*</span>
                          </span>
                          <input
                            className="sc-studio-input"
                            value={form.titleEn || ""}
                            onChange={(e) => set("titleEn", e.target.value)}
                            placeholder="e.g. Sylva Living World"
                          />
                        </label>
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">
                            Slug
                            <span className="hint">URL identifier</span>
                          </span>
                          <input
                            className="sc-studio-input"
                            value={form.slug || ""}
                            onChange={(e) => set("slug", slugify(e.target.value))}
                            placeholder="auto-generated from title"
                          />
                        </label>
                      </div>

                      <label className="sc-studio-field">
                        <span className="sc-studio-field-label">
                          Short Description <span className="req">*</span>
                          <span className="hint">1–2 lines shown on cards</span>
                        </span>
                        <textarea
                          className="sc-studio-textarea"
                          rows={3}
                          value={form.shortDescriptionEn || ""}
                          onChange={(e) => set("shortDescriptionEn", e.target.value)}
                          placeholder="A concise pitch for this code product…"
                        />
                      </label>

                      <label className="sc-studio-field">
                        <span className="sc-studio-field-label">
                          Craft Note
                          <span className="hint">Short design-story note shown in the detail modal</span>
                        </span>
                        <textarea
                          className="sc-studio-textarea"
                          rows={3}
                          value={form.craftNoteEn || ""}
                          onChange={(e) => set("craftNoteEn", e.target.value)}
                          placeholder="e.g. Hand-tuned spring curves, 12 gradient stops, zero dependencies…"
                        />
                      </label>

                      <div className="sc-studio-grid">
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">Category</span>
                          <select
                            className="sc-studio-select"
                            value={form.category || "Components"}
                            onChange={(e) => set("category", e.target.value)}
                          >
                            {PRODUCT_CATEGORIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </label>
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">Framework</span>
                          <input
                            className="sc-studio-input"
                            value={form.frameworks || ""}
                            onChange={(e) => set("frameworks", e.target.value)}
                            placeholder="React, GSAP (comma separated)"
                          />
                        </label>
                      </div>

                      <div className="sc-studio-grid cols-3">
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">Pricing Type</span>
                          <select
                            className="sc-studio-select"
                            value={form.pricingType || "free"}
                            onChange={(e) => set("pricingType", e.target.value)}
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                        </label>
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">
                            Price (USD)
                            <span className="hint">
                              {form.pricingType === "premium" ? "required" : "ignored for free"}
                            </span>
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="sc-studio-input"
                            value={form.price ?? 0}
                            disabled={form.pricingType === "free"}
                            onChange={(e) => set("price", Number(e.target.value))}
                          />
                        </label>
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">Tags</span>
                          <input
                            className="sc-studio-input"
                            value={form.tags || ""}
                            onChange={(e) => set("tags", e.target.value)}
                            placeholder="threejs, hero, landing (comma)"
                          />
                        </label>
                      </div>

                      {/* PREVIEW VIDEO SECTION (PRIMARY PUBLISHING METHOD) */}
                      <div style={{
                        marginTop: 18,
                        marginBottom: 18,
                        padding: 16,
                        borderRadius: 12,
                        background: "rgba(245, 166, 35, 0.04)",
                        border: "1px solid rgba(245, 166, 35, 0.22)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div>
                            <strong style={{ color: "#f5a623", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                              <Video size={15} /> PREVIEW VIDEO (PRIMARY PUBLISHING METHOD)
                            </strong>
                            <small style={{ color: "rgba(148, 163, 184, 0.9)", fontSize: 11, display: "block", marginTop: 2 }}>
                              Upload an MP4/WebM video or paste a URL. Adding a video satisfies preview requirements for publishing!
                            </small>
                          </div>
                        </div>

                        <div className="sc-studio-grid" style={{ marginBottom: 0 }}>
                          <label className="sc-studio-field" style={{ marginBottom: 0 }}>
                            <span className="sc-studio-field-label">Preview Video (MP4 / WebM)</span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                className="sc-studio-input"
                                value={form.previewVideoUrl || ""}
                                onChange={(e) => set("previewVideoUrl", e.target.value)}
                                placeholder="https://.../preview.mp4"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="sc-studio-btn sc-studio-btn-primary"
                                onClick={() => videoFileInputRef.current?.click()}
                                disabled={videoUploading}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {videoUploading ? <Loader2 size={13} className="sc-spin" /> : <UploadCloud size={13} />}
                                {videoUploading ? "Uploading..." : "Upload Video"}
                              </button>
                              <input
                                type="file"
                                ref={videoFileInputRef}
                                hidden
                                accept="video/mp4,video/webm,video/quicktime,video/ogg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadVideoFile(file);
                                }}
                              />
                            </div>
                          </label>

                          <label className="sc-studio-field" style={{ marginBottom: 0 }}>
                            <span className="sc-studio-field-label">Poster Image (Fallback / Thumbnail)</span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                className="sc-studio-input"
                                value={form.posterImageUrl || ""}
                                onChange={(e) => set("posterImageUrl", e.target.value)}
                                placeholder="https://.../poster.jpg"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="sc-studio-btn"
                                onClick={() => posterFileInputRef.current?.click()}
                                disabled={posterUploading}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {posterUploading ? <Loader2 size={13} className="sc-spin" /> : <UploadCloud size={13} />}
                                {posterUploading ? "Uploading..." : "Upload Image"}
                              </button>
                              <input
                                type="file"
                                ref={posterFileInputRef}
                                hidden
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadPosterFile(file);
                                }}
                              />
                            </div>
                          </label>
                        </div>

                        {videoUploadError && (
                          <div className="sc-admin-error" style={{ margin: "10px 0 0" }}>{videoUploadError}</div>
                        )}
                        {posterUploadError && (
                          <div className="sc-admin-error" style={{ margin: "10px 0 0" }}>{posterUploadError}</div>
                        )}

                        {form.previewVideoUrl && String(form.previewVideoUrl).trim() && (
                          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "#080c14", border: "1px solid rgba(245,166,35,0.18)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#63dba9", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <CheckCircle2 size={13} /> Video Ready · Player Preview
                            </span>
                            <div style={{ maxWidth: 440, maxHeight: 220, overflow: "hidden", borderRadius: 6, background: "#000" }}>
                              <video
                                src={form.previewVideoUrl.trim()}
                                controls
                                autoPlay
                                muted
                                loop
                                playsInline
                                style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sc-studio-config-row">
                        <label className="sc-studio-toggle" title="Featured products appear first/trending/top slots">
                          <input
                            type="checkbox"
                            checked={Boolean(form.featured)}
                            onChange={(e) => set("featured", e.target.checked)}
                          />
                          <span>
                            <strong>Featured Product</strong>
                            <small style={{ display: "block", color: "rgba(148, 163, 184, 0.8)", fontSize: "10px", fontWeight: "normal" }}>
                              Featured products appear first/trending/top slots
                            </small>
                          </span>
                        </label>

                        <label
                          className="sc-studio-toggle"
                          title="Show on Homepage places this product in the STEA Code storefront"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(form.homepageVisible)}
                            onChange={(e) => set("homepageVisible", e.target.checked)}
                          />
                          <span>
                            <strong>Show on Homepage</strong>
                            <small style={{ display: "block", color: "rgba(148, 163, 184, 0.8)", fontSize: "10px", fontWeight: "normal" }}>
                              Places product in the STEA Code storefront
                            </small>
                          </span>
                        </label>

                        <label className="sc-studio-field" style={{ maxWidth: 280, marginBottom: 0 }}>
                          <span className="sc-studio-field-label">Status</span>
                          <select
                            className="sc-studio-select"
                            value={form.status || "draft"}
                            onChange={(e) => set("status", e.target.value)}
                          >
                            <option value="draft">Draft (Hidden everywhere public)</option>
                            <option value="published">Published (Publicly accessible)</option>
                            <option value="archived">Archived</option>
                          </select>
                        </label>
                      </div>
                      <div className="sc-studio-info-box">
                        <strong>Publishing & Visibility Rules:</strong><br />
                        • <strong>Draft:</strong> Hides everywhere public.<br />
                        • <strong>Published:</strong> Makes the product publicly accessible via direct link or search/catalog.<br />
                        • <strong>Show on Homepage:</strong> Places this product directly in the STEA Code storefront. Hidden keeps it live only by direct link or catalog search if published.<br />
                        • <strong>Featured:</strong> Featured products appear first/trending/top slots in the storefront.
                      </div>
                    </div>
                  </section>

                  {/* ADVANCED SETTINGS */}
                  <section className="sc-studio-collapsible">
                    <button
                      type="button"
                      className="sc-studio-collapsible-trigger"
                      onClick={() => setShowAdvanced((s) => !s)}
                      style={{
                        background: "rgba(255,255,255,.03)",
                        color: "#aab3c1",
                        borderColor: "rgba(255,255,255,.08)",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        Advanced Settings
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>
                        ID / MEDIA / INCLUDED / USAGE / LANGUAGES
                      </span>
                    </button>
                    {showAdvanced && (
                      <div className="sc-studio-collapsible-body">
                        <div className="sc-studio-grid">
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">
                              Product ID
                              <span className="hint">{editing ? "read-only" : "immutable after create"}</span>
                            </span>
                            <input
                              className="sc-studio-input"
                              value={form.id || ""}
                              disabled={editing}
                              onChange={(e) => set("id", slugify(e.target.value))}
                              placeholder="e.g. sylva-living-world"
                            />
                          </label>
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">Product Type</span>
                            <input
                              className="sc-studio-input"
                              value={form.productType || "Code Product"}
                              onChange={(e) => set("productType", e.target.value)}
                            />
                          </label>
                        </div>

                        <div className="sc-studio-grid">
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">Languages</span>
                            <input
                              className="sc-studio-input"
                              value={form.languages || ""}
                              onChange={(e) => set("languages", e.target.value)}
                              placeholder="JavaScript, CSS (comma separated)"
                            />
                          </label>
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">Currency</span>
                            <select
                              className="sc-studio-select"
                              value={form.currency || "USD"}
                              onChange={(e) => set("currency", e.target.value)}
                            >
                              <option>USD</option>
                            </select>
                          </label>
                        </div>

                        <div className="sc-studio-grid">
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">Poster Image URL</span>
                            <input
                              className="sc-studio-input"
                              value={form.posterImageUrl || ""}
                              onChange={(e) => set("posterImageUrl", e.target.value)}
                              placeholder="https://…/poster.jpg"
                            />
                          </label>
                          <label className="sc-studio-field">
                            <span className="sc-studio-field-label">Preview Video URL</span>
                            <input
                              className="sc-studio-input"
                              value={form.previewVideoUrl || ""}
                              onChange={(e) => set("previewVideoUrl", e.target.value)}
                              placeholder="optional"
                            />
                          </label>
                        </div>

                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">
                            Included Items <span className="hint">one per line</span>
                          </span>
                          <textarea
                            className="sc-studio-textarea"
                            rows={4}
                            value={form.included || ""}
                            onChange={(e) => set("included", e.target.value)}
                            placeholder="1 × React component&#10;Source files (ZIP)&#10;Documentation"
                          />
                        </label>

                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">English Usage Guide</span>
                          <textarea
                            className="sc-studio-textarea"
                            rows={6}
                            value={form.usageGuideEn || ""}
                            onChange={(e) => set("usageGuideEn", e.target.value)}
                            placeholder="Detailed usage instructions shown after purchase…"
                          />
                        </label>

                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">AI Prompt (Optional instructions for AI code generation)</span>
                          <textarea
                            className="sc-studio-textarea"
                            rows={4}
                            value={form.aiPrompt || ""}
                            onChange={(e) => set("aiPrompt", e.target.value)}
                            placeholder="Prompt instructions for AI to recreate or build with this component…"
                          />
                        </label>
                      </div>
                    )}
                  </section>

                  {/* ACTIONS */}
                  <div className="sc-studio-publish-actions">
                    <button type="button" className="sc-studio-btn sc-studio-btn-ghost" onClick={onClose}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="sc-studio-btn"
                      onClick={() => save("draft")}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={14} className="sc-spin" /> : <FileText size={14} />}
                      Save Draft
                    </button>
                    <button
                      type="button"
                      className="sc-studio-btn sc-studio-btn-primary"
                      onClick={() => save(canPublish ? "publish" : null)}
                      disabled={saving || !canPublish}
                      title={!canPublish ? "Fill required fields first" : ""}
                    >
                      {saving ? <Loader2 size={14} className="sc-spin" /> : <CheckCircle2 size={14} />}
                      {editing
                        ? (form.status === "published" ? "Save & Keep Published" : "Publish Product")
                        : "Create & Publish"}
                    </button>
                  </div>
                </div>
              )}

              {/* ============== PREVIEW TAB ============== */}
              {tab === "preview" && (
                <div className="sc-studio-preview-config">
                  {previewLoading && (
                    <div className="sc-studio-preview-loading">
                      <Loader2 size={14} className="sc-spin" /> Loading preview source…
                    </div>
                  )}

                  <section className="sc-studio-section" style={{ border: "1px solid rgba(245, 166, 35, 0.22)", background: "rgba(245, 166, 35, 0.03)", marginBottom: 16 }}>
                    <div className="sc-studio-section-head">
                      <div style={{ display: "grid", gap: 3 }}>
                        <strong style={{ color: "#f5a623", display: "flex", alignItems: "center", gap: 6 }}>
                          <Video size={15} /> PREVIEW VIDEO (SIMPLE PUBLISHING)
                        </strong>
                        <span>Upload or enter a video URL. A preview video is sufficient to publish this product.</span>
                      </div>
                    </div>
                    <div className="sc-studio-section-body">
                      <div className="sc-studio-grid" style={{ marginBottom: 0 }}>
                        <label className="sc-studio-field" style={{ marginBottom: 0 }}>
                          <span className="sc-studio-field-label">Preview Video URL</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="sc-studio-input"
                              value={form.previewVideoUrl || ""}
                              onChange={(e) => set("previewVideoUrl", e.target.value)}
                              placeholder="https://.../preview.mp4 or webm"
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              className="sc-studio-btn sc-studio-btn-primary"
                              onClick={() => videoFileInputRef.current?.click()}
                              disabled={videoUploading}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {videoUploading ? <Loader2 size={13} className="sc-spin" /> : <UploadCloud size={13} />}
                              {videoUploading ? "Uploading..." : "Upload Video"}
                            </button>
                          </div>
                        </label>
                        <label className="sc-studio-field" style={{ marginBottom: 0 }}>
                          <span className="sc-studio-field-label">Fallback Poster Image URL</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="sc-studio-input"
                              value={form.posterImageUrl || ""}
                              onChange={(e) => set("posterImageUrl", e.target.value)}
                              placeholder="https://.../poster.jpg"
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              className="sc-studio-btn"
                              onClick={() => posterFileInputRef.current?.click()}
                              disabled={posterUploading}
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {posterUploading ? <Loader2 size={13} className="sc-spin" /> : <UploadCloud size={13} />}
                              {posterUploading ? "Uploading..." : "Upload Image"}
                            </button>
                          </div>
                        </label>
                      </div>

                      {videoUploadError && (
                        <div className="sc-admin-error" style={{ margin: "10px 0 0" }}>{videoUploadError}</div>
                      )}
                      {posterUploadError && (
                        <div className="sc-admin-error" style={{ margin: "10px 0 0" }}>{posterUploadError}</div>
                      )}

                      {form.previewVideoUrl && String(form.previewVideoUrl).trim() && (
                        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#080c14", border: "1px solid rgba(245,166,35,0.18)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#63dba9", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <CheckCircle2 size={13} /> Video Ready · Player Preview
                          </span>
                          <div style={{ maxWidth: 440, maxHeight: 240, overflow: "hidden", borderRadius: 8, background: "#000" }}>
                            <video
                              src={form.previewVideoUrl.trim()}
                              controls
                              autoPlay
                              muted
                              loop
                              playsInline
                              style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="sc-studio-section">
                    <div className="sc-studio-section-head">
                        <div style={{ display: "grid", gap: 3 }}>
                          <strong>LIVE HTML / REACT PREVIEW PLAYGROUND (OPTIONAL)</strong>
                          <span>Interactive preview settings and runtime. The preview auto-fits the card on the storefront — no manual viewport sizing required.</span>
                        </div>
                      </div>
                    <div className="sc-studio-section-body">
                      <div className="sc-studio-config-row">
                        <label className="sc-studio-field" style={{ minWidth: 260, marginBottom: 0 }}>
                          <span className="sc-studio-field-label">Runtime</span>
                          <select
                            className="sc-studio-select"
                            value={preview.runtime}
                            onChange={(e) => {
                              const rt = e.target.value;
                              setPreview("runtime", rt);
                              setPreview("autoRun", rt === "full-html" ? false : true);
                            }}
                          >
                            <option value="html-css-js">HTML + CSS + JS</option>
                            <option value="full-html">Full HTML / Canvas / WebGL</option>
                            <option value="react">React / JSX / TSX</option>
                            <option value="external">External Demo</option>
                          </select>
                        </label>

                        <label className="sc-studio-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(preview.enabled)}
                            onChange={(e) => setPreview("enabled", e.target.checked)}
                          />
                          Enable Preview
                        </label>
                        <label className="sc-studio-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(preview.interactive)}
                            onChange={(e) => setPreview("interactive", e.target.checked)}
                          />
                          Interactive
                        </label>
                        <label className="sc-studio-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(preview.autoRun)}
                            onChange={(e) => setPreview("autoRun", e.target.checked)}
                          />
                          Auto Run
                        </label>
                      </div>

                      {/* Viewport / dimension controls removed — the storefront
                          auto-fits every preview to the card. The preview is
                          authored at the demo's natural size (1440×900) and
                          the live-preview renderer scales it down to fill
                          the card on every device. No manual sizing needed. */}
                    </div>
                  </section>

                  {/* EXTERNAL URL RUNTIME */}
                  {preview.runtime === "external" && (
                    <section className="sc-studio-section">
                      <div className="sc-studio-section-head">
                        <strong>EXTERNAL DEMO</strong>
                      </div>
                      <div className="sc-studio-section-body">
                        <label className="sc-studio-field">
                          <span className="sc-studio-field-label">External Demo URL</span>
                          <input
                            className="sc-studio-input"
                            value={preview.externalUrl || ""}
                            onChange={(e) => setPreview("externalUrl", e.target.value)}
                            placeholder="https://…"
                          />
                        </label>
                        <div className="sc-studio-info-box">
                          Public catalog will render this URL in a sandboxed iframe
                          preview on product cards. Make sure the target site allows
                          being embedded.
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ============== CARD PREVIEW + ZOOM CONTROL ============== */}
                  {preview.enabled && preview.runtime !== "external" && (
                    <section className="sc-studio-section" style={{ borderColor: "rgba(245,166,35,0.22)", background: "rgba(245,166,35,0.03)" }}>
                      <div className="sc-studio-section-head">
                        <div style={{ display: "grid", gap: 3 }}>
                          <strong style={{ color: "#f5a623", display: "flex", alignItems: "center", gap: 6 }}>
                            <ZoomIn size={15} /> CARD PREVIEW (HOMEPAGE)
                          </strong>
                          <span>This is exactly what users see on the homepage card. Adjust the zoom to fit your content.</span>
                        </div>
                      </div>
                      <div className="sc-studio-section-body" style={{ display: "grid", gap: 16 }}>

                        {/* Card preview frame — matches homepage card 16:11, draggable */}
                        <div className="sc-admin-card-preview">
                          <div
                            className="sc-drag-content"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startOX = form.cardOffsetX || 0;
                              const startOY = form.cardOffsetY || 0;
                              const onMove = (ev) => {
                                set("cardOffsetX", Math.round(startOX + (ev.clientX - startX)));
                                set("cardOffsetY", Math.round(startOY + (ev.clientY - startY)));
                              };
                              const onUp = () => {
                                window.removeEventListener("pointermove", onMove);
                                window.removeEventListener("pointerup", onUp);
                              };
                              window.addEventListener("pointermove", onMove);
                              window.addEventListener("pointerup", onUp);
                            }}
                            style={{
                              cursor: "grab",
                              touchAction: "none",
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            <SteaCodeProductLivePreview
                              key={`admin-card-${form.id || form.slug || "draft"}-${previewKey}`}
                              productId={String(form.id || form.slug || "").trim()}
                              title={form.titleEn || "Untitled"}
                              category={form.category || ""}
                              interactive={false}
                              lazy={false}
                              fillMode="cover"
                              cardZoom={form.cardZoom || "full"}
                              offsetX={form.cardOffsetX || 0}
                              offsetY={form.cardOffsetY || 0}
                              showControls={false}
                              rootMargin="0px"
                              placeholder={null}
                              srcDoc={previewDocument}
                            />
                          </div>
                        </div>

                        {/* Zoom control */}
                        <div className="sc-admin-zoom-control">
                          <span className="sc-admin-zoom-label">Card Zoom</span>
                          <div className="sc-admin-zoom-presets">
                            {[
                              { value: "full", label: "Full page" },
                              { value: "center", label: "Centered" },
                              { value: "focus", label: "Focus" },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                type="button"
                                className={`sc-admin-zoom-preset ${form.cardZoom === preset.value ? "is-active" : ""}`}
                                onClick={() => set("cardZoom", preset.value)}
                              >
                                {preset.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              className={`sc-admin-zoom-preset ${typeof form.cardZoom === "number" ? "is-active" : ""}`}
                              onClick={() => set("cardZoom", 1.5)}
                            >
                              Custom
                            </button>
                          </div>
                          {typeof form.cardZoom === "number" && (
                            <div className="sc-admin-zoom-slider">
                              <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={form.cardZoom}
                                onChange={(e) => set("cardZoom", parseFloat(e.target.value))}
                              />
                              <span className="sc-admin-zoom-value">{form.cardZoom.toFixed(1)}x</span>
                            </div>
                          )}
                          <button
                            type="button"
                            className="sc-admin-reset-btn"
                            onClick={() => { set("cardOffsetX", 0); set("cardOffsetY", 0); }}
                          >
                            Reset position
                          </button>
                        </div>

                        {/* Modal preview — shows what users see after clicking */}
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,247,251,0.6)", display: "block", marginBottom: 8 }}>
                            MODAL PREVIEW (AFTER CLICK)
                          </span>
                          <div className="sc-admin-modal-preview">
                            <div
                              className="sc-drag-content"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startOX = form.modalOffsetX || 0;
                                const startOY = form.modalOffsetY || 0;
                                const onMove = (ev) => {
                                  set("modalOffsetX", Math.round(startOX + (ev.clientX - startX)));
                                  set("modalOffsetY", Math.round(startOY + (ev.clientY - startY)));
                                };
                                const onUp = () => {
                                  window.removeEventListener("pointermove", onMove);
                                  window.removeEventListener("pointerup", onUp);
                                };
                                window.addEventListener("pointermove", onMove);
                                window.addEventListener("pointerup", onUp);
                              }}
                              style={{
                                cursor: "grab",
                                touchAction: "none",
                                width: "100%",
                                height: "100%",
                              }}
                            >
                              <SteaCodeProductLivePreview
                                key={`admin-modal-${form.id || form.slug || "draft"}-${previewKey}`}
                                productId={String(form.id || form.slug || "").trim()}
                                title={form.titleEn || "Untitled"}
                                category={form.category || ""}
                                interactive
                                lazy={false}
                                fillMode="scale"
                                modalZoom={typeof form.modalZoom === "number" ? form.modalZoom : 1}
                                offsetX={form.modalOffsetX || 0}
                                offsetY={form.modalOffsetY || 0}
                                showControls
                                rootMargin="0px"
                                placeholder={null}
                                srcDoc={previewDocument}
                              />
                            </div>
                          </div>
                          {/* Modal zoom control */}
                          <div className="sc-admin-zoom-control" style={{ marginTop: 12 }}>
                            <span className="sc-admin-zoom-label">Modal Zoom</span>
                            <div className="sc-admin-zoom-presets">
                              <button
                                type="button"
                                className={`sc-admin-zoom-preset ${form.modalZoom === 1 ? "is-active" : ""}`}
                                onClick={() => set("modalZoom", 1)}
                              >
                                Fit
                              </button>
                              <button
                                type="button"
                                className={`sc-admin-zoom-preset ${form.modalZoom === 2 ? "is-active" : ""}`}
                                onClick={() => set("modalZoom", 2)}
                              >
                                Fill
                              </button>
                              <button
                                type="button"
                                className={`sc-admin-zoom-preset ${typeof form.modalZoom === "number" && form.modalZoom !== 1 && form.modalZoom !== 2 ? "is-active" : ""}`}
                                onClick={() => set("modalZoom", 1.5)}
                              >
                                Custom
                              </button>
                            </div>
                            {typeof form.modalZoom === "number" && (
                              <div className="sc-admin-zoom-slider">
                                <input
                                  type="range"
                                  min="0.5"
                                  max="3"
                                  step="0.1"
                                  value={form.modalZoom}
                                  onChange={(e) => set("modalZoom", parseFloat(e.target.value))}
                                />
                                <span className="sc-admin-zoom-value">{form.modalZoom.toFixed(1)}x</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className="sc-admin-reset-btn"
                              onClick={() => { set("modalOffsetX", 0); set("modalOffsetY", 0); }}
                            >
                              Reset position
                            </button>
                          </div>
                        </div>

                      </div>
                    </section>
                  )}

                  {/* ============== CODE EDITOR (no duplicate preview — top previews serve that) ============== */}
                  {preview.runtime !== "external" && (
                    <div className="sc-studio-mode-toolbar">
                      <div className="sc-studio-mode-toolbar-label">
                        CODE EDITOR
                      </div>
                      <div className="sc-studio-mode-toolbar-controls">
                        <button
                          type="button"
                          className="sc-studio-icon-btn"
                          onClick={reload}
                          title="Run preview"
                        >
                          <RefreshCw size={12} /> Run Preview
                        </button>
                      </div>
                    </div>
                  )}

                  {preview.runtime === "full-html" && (
                    <div className="sc-studio-edit-preview" style={splitStyle}>
                      {(editorMode === "code" || editorMode === "split") && (
                        <div className="sc-studio-editor">
                          <div className="sc-studio-editor-tabs">
                            <button type="button" className="sc-studio-editor-tab is-active">
                              FULL DOCUMENT
                            </button>
                            <div style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              gap: 4,
                              padding: "0 8px",
                            }}>
                              <button
                                type="button"
                                className={`sc-studio-icon-btn ${editorMode === "code" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("code")}
                              >
                                <Code2 size={12} /> Code
                              </button>
                              <button
                                type="button"
                                className={`sc-studio-icon-btn ${editorMode === "split" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("split")}
                              >
                                <Eye size={12} /> Split
                              </button>
                              <button
                                type="button"
                                className={`sc-studio-icon-btn ${editorMode === "preview" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("preview")}
                              >
                                <Monitor size={12} /> Preview
                              </button>
                            </div>
                          </div>

                          <div className="sc-studio-base-url">
                            <label className="sc-studio-field">
                              <span className="sc-studio-field-label">
                                Document Base URL
                                <span className="hint">for relative assets</span>
                              </span>
                              <input
                                className="sc-studio-input"
                                value={preview.baseUrl || ""}
                                onChange={(e) => setPreview("baseUrl", e.target.value)}
                                placeholder="https://threeui.com/landing-pages/"
                              />
                            </label>
                          </div>

                          <textarea
                            spellCheck={false}
                            className="sc-studio-editor-textarea"
                            value={preview.fullDocument || ""}
                            onChange={(e) => setPreview("fullDocument", e.target.value)}
                            placeholder={`<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/..."></script>
</head>
<body>
  <canvas id="scene"></canvas>
  <script>
    // Canvas / WebGL / Three.js / GSAP...
  <\/script>
</body>
</html>`}
                          />
                          <div
                            className="sc-studio-info-box"
                            style={{
                              margin: 0,
                              borderRadius: 0,
                              border: "1px solid rgba(255,255,255,.06)",
                              borderBottom: 0,
                              borderLeft: 0,
                              borderRight: 0,
                            }}
                          >
                            Paste the complete HTML document. External CSS, scripts, Canvas, WebGL, Three.js, GSAP and
                            animation loops run inside the sandboxed iframe. For heavy content, disable Auto Run and
                            press Run Preview.
                          </div>
                        </div>
                      )}

                      {(editorMode === "preview" || editorMode === "split") &&
                        (preview.autoRun ? (
                          <PreviewStageWrapper
                            preview={preview}
                            previewDocument={previewDocument}
                            previewKey={previewKey}
                            onReload={reload}
                            onToggleFullscreen={() => setFullscreen(true)}
                            __onViewport={(vp) => applyViewportPreset(vp)}
                            __onScaleMode={(sm) => setPreview("scaleMode", sm)}
                          />
                        ) : (
                          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                            <button
                              type="button"
                              className="sc-studio-btn sc-studio-btn-primary"
                              onClick={reload}
                              style={{ justifySelf: "start" }}
                            >
                              <RefreshCw size={14} />
                              Run Preview
                            </button>
                            <PreviewStageWrapper
                              preview={preview}
                              previewDocument={previewDocument}
                              previewKey={previewKey}
                              onReload={reload}
                              onToggleFullscreen={() => setFullscreen(true)}
                              __onViewport={(vp) => applyViewportPreset(vp)}
                              __onScaleMode={(sm) => setPreview("scaleMode", sm)}
                            />
                          </div>
                        ))}
                    </div>
                  )}

                  {preview.runtime === "html-css-js" && (
                    <div
                      className="sc-studio-edit-preview"
                      style={
                        editorMode === "code" ? { display: "grid", gridTemplateColumns: "1fr", gap: 14 }
                        : editorMode === "preview" ? { display: "grid", gridTemplateColumns: "1fr", gap: 14 }
                        : undefined
                      }
                    >
                      {(editorMode === "code" || editorMode === "split") && (
                        <div className="sc-studio-editor">
                          <div className="sc-studio-editor-tabs">
                            {[
                              ["html", "HTML"],
                              ["css", "CSS"],
                              ["javascript", "JAVASCRIPT"],
                            ].map(([id, label]) => (
                              <button
                                key={id}
                                type="button"
                                className={`sc-studio-editor-tab ${codeEditorTab === id ? "is-active" : ""}`}
                                onClick={() => setCodeEditorTab(id)}
                              >
                                {label}
                              </button>
                            ))}
                            <div style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              gap: 4,
                              padding: "0 8px",
                            }}>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "code" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("code")}
                              >
                                <Code2 size={12} /> Code
                              </button>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "split" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("split")}
                              >
                                <Eye size={12} /> Split
                              </button>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "preview" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("preview")}
                              >
                                <Monitor size={12} /> Preview
                              </button>
                            </div>
                          </div>
                          {codeEditorTab === "html" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.html || ""}
                              onChange={(e) => setPreview("html", e.target.value)}
                              placeholder={'<button id="demo">Touch Me</button>'}
                            />
                          )}
                          {codeEditorTab === "css" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.css || ""}
                              onChange={(e) => setPreview("css", e.target.value)}
                              placeholder={"#demo { padding: 16px 28px; }"}
                            />
                          )}
                          {codeEditorTab === "javascript" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.javascript || ""}
                              onChange={(e) => setPreview("javascript", e.target.value)}
                              placeholder={'document.querySelector("#demo").addEventListener(…'}
                            />
                          )}
                        </div>
                      )}

                      {(editorMode === "preview" || editorMode === "split") && (
                        <PreviewStageWrapper
                          preview={preview}
                          previewDocument={previewDocument}
                          previewKey={previewKey}
                          onReload={reload}
                          onToggleFullscreen={() => setFullscreen(true)}
                          __onViewport={(vp) => applyViewportPreset(vp)}
                          __onScaleMode={(sm) => setPreview("scaleMode", sm)}
                        />
                      )}
                    </div>
                  )}

                  {/* ============== REACT / JSX ============== */}
                  {preview.runtime === "react" && (
                    <div
                      className="sc-studio-edit-preview"
                      style={
                        editorMode === "code" ? { display: "grid", gridTemplateColumns: "1fr", gap: 14 }
                        : editorMode === "preview" ? { display: "grid", gridTemplateColumns: "1fr", gap: 14 }
                        : undefined
                      }
                    >
                      {(editorMode === "code" || editorMode === "split") && (
                        <div className="sc-studio-editor">
                          <div className="sc-studio-editor-tabs">
                            {[
                              ["jsx", "JSX"],
                              ["tsx", "TSX"],
                              ["css", "CSS"],
                            ].map(([id, label]) => (
                              <button
                                key={id}
                                type="button"
                                className={`sc-studio-editor-tab ${codeEditorTab === id ? "is-active" : ""}`}
                                onClick={() => setCodeEditorTab(id)}
                              >
                                {label}
                              </button>
                            ))}
                            <div style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              gap: 4,
                              padding: "0 8px",
                            }}>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "code" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("code")}
                              >
                                <Code2 size={12} /> Code
                              </button>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "split" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("split")}
                              >
                                <Eye size={12} /> Split
                              </button>
                              <button
                                className={`sc-studio-icon-btn ${editorMode === "preview" ? "is-active" : ""}`}
                                onClick={() => setEditorMode("preview")}
                              >
                                <Monitor size={12} /> Preview
                              </button>
                            </div>
                          </div>

                          <div className="sc-studio-base-url">
                            <label className="sc-studio-field">
                              <span className="sc-studio-field-label">
                                Document Base URL
                                <span className="hint">for relative assets (images, libs)</span>
                              </span>
                              <input
                                className="sc-studio-input"
                                value={preview.baseUrl || ""}
                                onChange={(e) => setPreview("baseUrl", e.target.value)}
                                placeholder="https://cdn.example.com/my-project/"
                              />
                            </label>
                          </div>

                          {codeEditorTab === "jsx" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.jsx || ""}
                              onChange={(e) => setPreview("jsx", e.target.value)}
                              placeholder={`// JSX source. Rendered via Babel Standalone inside a sandboxed iframe.
// Available globals (no extra imports needed): React, ReactDOM, THREE (Three.js), gsap.
// You can also use ESM-style imports:
//   import * as THREE from "three";
//   import gsap from "gsap";
//   import React, { useEffect, useRef, useState } from "react";
// The sandbox always supports useEffect, requestAnimationFrame, Canvas 2D, and WebGL.

export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ padding: 32 }}>
      <h1>Hello from React</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
    </div>
  );
}`}
                            />
                          )}
                          {codeEditorTab === "tsx" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.tsx || ""}
                              onChange={(e) => setPreview("tsx", e.target.value)}
                              placeholder={`// TSX source. Types are stripped by the in-iframe Babel Standalone preset.
// The runtime auto-prefers TSX content when present.

type Props = { name?: string };

export default function App({ name = "React" }: Props) {
  const [count, setCount] = React.useState<number>(0);
  return (
    <div style={{ padding: 32 }}>
      <h1>Hello from {name}</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
    </div>
  );
}`}
                            />
                          )}
                          {codeEditorTab === "css" && (
                            <textarea
                              spellCheck={false}
                              className="sc-studio-editor-textarea"
                              value={preview.css || ""}
                              onChange={(e) => setPreview("css", e.target.value)}
                              placeholder={
`h1 { color: #f5a623; }
button { background: linear-gradient(180deg,#f5a623,#d48917); border:0;
  padding: 12px 22px; border-radius: 12px; color: #1c1100;
  font-weight: 700; cursor: pointer; }`}
                            />
                          )}
                          <div
                            className="sc-studio-info-box"
                            style={{
                              margin: 0,
                              borderRadius: 0,
                              border: "1px solid rgba(255,255,255,.06)",
                              borderBottom: 0,
                              borderLeft: 0,
                              borderRight: 0,
                            }}
                          >
                            React/TSX components are rendered via <code>ReactDOM.createRoot</code> into a
                            sandboxed iframe. Babel Standalone compiles JSX + TSX inside the iframe.
                            Common runtime dependencies are preloaded so component code stays compact:
                            React 18, ReactDOM 18, Three.js (global <code>THREE</code>), GSAP
                            (global <code>gsap</code>), Canvas 2D, WebGL, requestAnimationFrame,
                            IntersectionObserver, CSS transitions/animations.
                          </div>
                        </div>
                      )}

                      {(editorMode === "preview" || editorMode === "split") &&
                        (preview.autoRun ? (
                          <PreviewStageWrapper
                            preview={preview}
                            previewDocument={previewDocument}
                            previewKey={previewKey}
                            onReload={reload}
                            onToggleFullscreen={() => setFullscreen(true)}
                            __onViewport={(vp) => applyViewportPreset(vp)}
                            __onScaleMode={(sm) => setPreview("scaleMode", sm)}
                          />
                        ) : (
                          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                            <button
                              type="button"
                              className="sc-studio-btn sc-studio-btn-primary"
                              onClick={reload}
                              style={{ justifySelf: "start" }}
                            >
                              <RefreshCw size={14} />
                              Run Preview
                            </button>
                            <PreviewStageWrapper
                              preview={preview}
                              previewDocument={previewDocument}
                              previewKey={previewKey}
                              onReload={reload}
                              onToggleFullscreen={() => setFullscreen(true)}
                              __onViewport={(vp) => applyViewportPreset(vp)}
                              __onScaleMode={(sm) => setPreview("scaleMode", sm)}
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============== SOURCE TAB ============== */}
              {tab === "source" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <section className="sc-studio-section">
                    <div className="sc-studio-section-head">
                      <div style={{ display: "grid", gap: 3 }}>
                        <strong>PRODUCT SOURCE FILES</strong>
                        <span>
                          {form.pricingType === "premium"
                            ? "These files are protected and unlocked after purchase."
                            : "These files are provided to users who access this free product."}
                        </span>
                      </div>
                    </div>
                    <div className="sc-studio-section-body">
                      {editing ? (
                        <SourceFilesPanel
                          productId={product.id}
                          isSuperAdmin={isSuperAdmin}
                          previewSource={{
                            runtime: preview.runtime || "html-css-js",
                            html: preview.html || "",
                            css: preview.css || "",
                            javascript: preview.javascript || "",
                            fullDocument: preview.fullDocument || "",
                          }}
                          onSourceSaved={(savedFiles) => {
                            setHasSourceFiles(Array.isArray(savedFiles) && savedFiles.length > 0);
                          }}
                        />
                      ) : (
                        <div className="sc-studio-source-locked">
                          <FileCode2 size={28} />
                          <strong>Save the product first to manage source files.</strong>
                          <span>A real product ID is required before protected source files can be attached.</span>
                          <button
                            type="button"
                            className="sc-studio-btn"
                            onClick={() => save("draft")}
                            disabled={saving || !String(form.titleEn || "").trim()}
                          >
                            {saving ? <Loader2 size={14} className="sc-spin" /> : <Save size={14} />}
                            {saving ? "Saving…" : "Save Draft"}
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* ============== PUBLISH TAB ============== */}
              {tab === "publish" && (
                <div style={{ display: "grid", gap: 20 }}>
                  {/* NEW UNSAVED PRODUCT: must save draft first */}
                  {needsSaveFirst ? (
                    <div className="sc-studio-source-locked">
                      <AlertTriangle size={28} />
                      <strong>Save this product as a draft first.</strong>
                      <span>
                        A product ID is required before source files and publishing can be configured.
                        Fill in the General tab (title + description), then save.
                      </span>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                          type="button"
                          className="sc-studio-btn"
                          onClick={() => selectTab("general")}
                        >
                          ← Go to General
                        </button>
                        <button
                          type="button"
                          className="sc-studio-btn sc-studio-btn-primary"
                          onClick={() => save("draft")}
                          disabled={saving || !String(form.titleEn || "").trim() || !String(form.shortDescriptionEn || "").trim()}
                        >
                          {saving ? <Loader2 size={14} className="sc-spin" /> : <Save size={14} />}
                          {saving ? "Saving…" : "Save Draft & Continue"}
                        </button>
                      </div>
                    </div>
                  ) : (
                  <>{/* Saved product publish flow below */}
                  <section className="sc-studio-section">
                    <div className="sc-studio-section-head">
                      <div style={{ display: "grid", gap: 3 }}>
                        <strong>PUBLISH REQUIREMENTS CHECKLIST</strong>
                        <span>All requirements must be satisfied before this product can be published.</span>
                      </div>
                    </div>
                    <div className="sc-studio-section-body">
                      <div className="sc-studio-checklist">
                        {/* 1. Saved Draft */}
                        <div className={`sc-checklist-item ${publishValidation.isSavedDraft ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.isSavedDraft ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">1. Product Draft Saved</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.isSavedDraft ? `Saved ID: ${product?.id}` : "Product must be saved as draft first"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.isSavedDraft && (
                            <button type="button" className="sc-checklist-btn" onClick={() => save("draft")}>
                              Save Draft
                            </button>
                          )}
                        </div>

                        {/* 2. Title */}
                        <div className={`sc-checklist-item ${publishValidation.hasTitle ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasTitle ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">2. Product Title</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.hasTitle ? form.titleEn : "English title is required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasTitle && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("general")}>
                              Fix in General
                            </button>
                          )}
                        </div>

                        {/* 3. Slug */}
                        <div className={`sc-checklist-item ${publishValidation.hasSlug ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasSlug ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">3. Slug / Product ID</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.hasSlug ? (form.slug || form.id) : "Unique URL slug is required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasSlug && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("general")}>
                              Fix in General
                            </button>
                          )}
                        </div>

                        {/* 4. Description */}
                        <div className={`sc-checklist-item ${publishValidation.hasDescription ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasDescription ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">4. Short Description</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.hasDescription ? "Provided" : "Short description for cards & SEO is required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasDescription && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("general")}>
                              Fix in General
                            </button>
                          )}
                        </div>

                        {/* 5. Category */}
                        <div className={`sc-checklist-item ${publishValidation.hasCategory ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasCategory ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">5. Category</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.hasCategory ? form.category : "Category selection is required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasCategory && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("general")}>
                              Fix in General
                            </button>
                          )}
                        </div>

                        {/* 6. Pricing */}
                        <div className={`sc-checklist-item ${publishValidation.hasPricing ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasPricing ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">6. Pricing Configuration</span>
                              <span className="sc-checklist-desc">
                                {form.pricingType === "premium"
                                  ? Number(form.price) > 0 ? `Premium (${form.currency || "USD"} ${Number(form.price).toFixed(2)})` : "Premium price must be > $0"
                                  : "Free to build with"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasPricing && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("general")}>
                              Fix in General
                            </button>
                          )}
                        </div>

                        {/* 7. Product Preview */}
                        <div className={`sc-checklist-item ${publishValidation.hasPreview ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasPreview ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">7. Product Preview</span>
                              <span className="sc-checklist-desc">
                                {form.previewVideoUrl && String(form.previewVideoUrl).trim()
                                  ? "Preview Video configured"
                                  : preview.enabled
                                  ? `Live preview enabled (${runtimeLabel})`
                                  : form.posterImageUrl && String(form.posterImageUrl).trim()
                                  ? "Poster image configured"
                                  : "Preview video or live HTML preview required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasPreview && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("preview")}>
                              Configure Preview
                            </button>
                          )}
                        </div>

                        {/* 8. Source Files */}
                        <div className={`sc-checklist-item ${publishValidation.hasSource ? "is-ready" : "is-missing"}`}>
                          <div className="sc-checklist-left">
                            <span className="sc-checklist-icon">
                              {publishValidation.hasSource ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            </span>
                            <div>
                              <span className="sc-checklist-label">8. Source Files</span>
                              <span className="sc-checklist-desc">
                                {publishValidation.hasSource ? "Source files attached and ready" : "At least 1 protected source file required"}
                              </span>
                            </div>
                          </div>
                          {!publishValidation.hasSource && (
                            <button type="button" className="sc-checklist-btn" onClick={() => selectTab("source")}>
                              Fix in Source Files
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="sc-studio-section">
                    <div className="sc-studio-section-head">
                      <div style={{ display: "grid", gap: 3 }}>
                        <strong>PUBLISH SUMMARY</strong>
                        <span>Review live status before publishing.</span>
                      </div>
                    </div>
                    <div className="sc-studio-section-body">
                      <div className="sc-studio-summary">
                        <dl className="sc-studio-summary-row">
                          <dt>Product</dt>
                          <dd>
                            {form.titleEn || (
                              <span style={{ color: "#7a8493" }}>Untitled</span>
                            )}
                          </dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Pricing</dt>
                          <dd>
                            {form.pricingType === "premium"
                              ? `Premium · ${form.currency || "USD"} ${Number(form.price || 0).toFixed(2)}`
                              : "Free"}
                          </dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Category</dt>
                          <dd>{form.category || "—"}</dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Runtime</dt>
                          <dd>{runtimeLabel}</dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Preview</dt>
                          <dd>
                            {form.previewVideoUrl && String(form.previewVideoUrl).trim() ? (
                              <span className="sc-studio-check">
                                <CheckCircle2 size={14} /> Video Ready
                              </span>
                            ) : preview.enabled ? (
                              <span className="sc-studio-check">
                                <CheckCircle2 size={14} /> Live Preview Ready
                              </span>
                            ) : (
                              <span style={{ color: "#8a93a2" }}>Disabled</span>
                            )}
                            {preview.enabled && (
                              <span style={{ color: "#8a93a2", fontWeight: 600, fontSize: 12, marginLeft: 8 }}>
                                · Auto-fit · {String(preview.scaleMode || "fit").toUpperCase()}
                              </span>
                            )}
                          </dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Source package</dt>
                          <dd>
                            {hasSourceFiles ? (
                              <span className="sc-studio-check">
                                <CheckCircle2 size={14} /> Source Ready
                              </span>
                            ) : (
                              <span style={{ color: "#ff8b8b" }}>Missing</span>
                            )}
                          </dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Status</dt>
                          <dd>
                            <span className={`sc-studio-status-pill is-${form.status || "draft"}`}>
                              {statusLabel}
                            </span>
                          </dd>
                        </dl>
                        <dl className="sc-studio-summary-row">
                          <dt>Homepage</dt>
                          <dd>
                            <span className={`sc-admin-status ${form.homepageVisible ? "is-yes" : "is-no"}`}>
                              {form.homepageVisible ? "Shown on Storefront" : "Hidden from Storefront"}
                            </span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </section>

                  {!canPublish && (
                    <div className="sc-studio-error">
                      Cannot publish yet. Please complete all missing checklist items above ({publishValidation.missing.join(", ")}).
                    </div>
                  )}

                  <div className="sc-studio-publish-actions">
                    <button type="button" className="sc-studio-btn sc-studio-btn-ghost" onClick={onClose}>
                      Cancel
                    </button>
                    {editing && form.status === "published" ? (
                      <>
                        <button
                          type="button"
                          className="sc-studio-btn"
                          onClick={() => save()}
                          disabled={saving}
                        >
                          {saving ? <Loader2 size={14} className="sc-spin" /> : <Save size={14} />}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className={`sc-studio-btn ${form.homepageVisible ? "sc-studio-btn-active" : "sc-studio-btn-primary"}`}
                          onClick={() => save(null, { homepageVisible: !form.homepageVisible })}
                          disabled={saving}
                        >
                          <Home size={14} />
                          {form.homepageVisible ? "Hide from Homepage" : "Show on Homepage"}
                        </button>
                        <button
                          type="button"
                          className="sc-studio-btn sc-studio-btn-danger"
                          onClick={() => save("unpublish")}
                          disabled={saving}
                        >
                          <Archive size={14} />
                          Unpublish
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="sc-studio-btn"
                          onClick={() => save("draft")}
                          disabled={saving}
                        >
                          {saving ? <Loader2 size={14} className="sc-spin" /> : <FileText size={14} />}
                          {editing ? "Save Changes" : "Save Draft"}
                        </button>
                        <button
                          type="button"
                          className="sc-studio-btn"
                          onClick={() => save("publish")}
                          disabled={saving || !canPublish}
                          title={!canPublish ? `Missing: ${publishValidation.missing.join(", ")}` : "Publish to catalog"}
                        >
                          {saving ? <Loader2 size={14} className="sc-spin" /> : <CheckCircle2 size={14} />}
                          Publish (Catalog Only)
                        </button>
                        <button
                          type="button"
                          className="sc-studio-btn sc-studio-btn-primary"
                          onClick={() => save("publish_homepage")}
                          disabled={saving || !canPublish}
                          title={!canPublish ? `Missing: ${publishValidation.missing.join(", ")}` : "Publish and place immediately in STEA Code storefront"}
                        >
                          {saving ? <Loader2 size={14} className="sc-spin" /> : <Home size={14} />}
                          Publish & Show on Homepage
                        </button>
                      </>
                    )}
                  </div>
                  </> /* end of saved-product publish flow */
                  )} {/* end of needsSaveFirst ternary */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {fullscreen && (
        <FullscreenPreview
          preview={preview}
          previewDocument={previewDocument}
          previewKey={previewKey}
          onClose={() => setFullscreen(false)}
          onReload={reload}
        />
      )}
    </>
  );
}

/* =========================================================
   STANDALONE SOURCE EDITOR MODAL (table action, kept for compat)
   ========================================================= */
function SourceEditor({ product, onClose }) {
  const [files, setFiles] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = files[active] || null;

  useEffect(() => {
    let alive = true;
    getAdminSteaCodeSource(product.id)
      .then((result) => {
        if (!alive) return;
        setFiles(Array.isArray(result?.files) ? result.files : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "Could not load source files.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [product.id]);

  const addFile = () => {
    const next = {
      path: `file-${files.length + 1}.txt`,
      language: "text",
      content: "",
      order: files.length,
    };
    setFiles((c) => [...c, next]);
    setActive(files.length);
  };

  const updateCurrent = (key, value) => {
    setFiles((c) =>
      c.map((f, i) => (i === active ? { ...f, [key]: value } : f))
    );
  };

  const removeCurrent = () => {
    if (!current) return;
    const next = files.filter((_, i) => i !== active);
    setFiles(next.map((f, i) => ({ ...f, order: i })));
    setActive(Math.max(0, active - 1));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await saveAdminSteaCodeSource(
        product.id,
        files.map((f, i) => ({ ...f, order: i }))
      );
    } catch (err) {
      setError(err?.message || "Could not save source files.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Source Files · ${product.titleEn}`} onClose={onClose}>
      {loading ? (
        <div className="sc-admin-loading">
          <Loader2 size={18} className="sc-spin" /> Loading protected source…
        </div>
      ) : (
        <div className="sc-admin-source-workspace">
          {error && <div className="sc-admin-error">{error}</div>}
          <aside className="sc-admin-source-tree">
            <div className="sc-admin-source-tree-head">
              <strong>PROJECT FILES</strong>
              <button className="sc-admin-icon-btn" onClick={addFile} title="Add file">
                <Plus size={15} />
              </button>
            </div>
            {files.length === 0 && <div className="sc-admin-empty-mini">No files yet.</div>}
            {files.map((f, i) => (
              <button
                key={`${f.path}-${i}`}
                className={`sc-admin-source-file ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                <FileCode2 size={14} />
                <span>{f.path}</span>
              </button>
            ))}
          </aside>
          <section className="sc-admin-source-editor">
            {current ? (
              <>
                <div className="sc-admin-source-meta">
                  <label className="sc-admin-field">
                    <span>Filename</span>
                    <input
                      value={current.path}
                      onChange={(e) => updateCurrent("path", e.target.value)}
                    />
                  </label>
                  <label className="sc-admin-field">
                    <span>Language</span>
                    <select
                      value={current.language}
                      onChange={(e) => updateCurrent("language", e.target.value)}
                    >
                      {["jsx","javascript","typescript","tsx","css","html","json","markdown","text"].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="sc-admin-code-field">
                  <span>Source code</span>
                  <textarea
                    spellCheck={false}
                    value={current.content || ""}
                    onChange={(e) => updateCurrent("content", e.target.value)}
                  />
                </label>
                <div className="sc-admin-source-bottom">
                  <button className="admin-v2-btn-secondary" onClick={removeCurrent}>
                    <Trash2 size={15} /> Delete File
                  </button>
                  <button className="admin-v2-btn-primary" onClick={save} disabled={saving}>
                    {saving ? <Loader2 size={15} className="sc-spin" /> : <ShieldCheck size={15} />}
                    Save Source
                  </button>
                </div>
              </>
            ) : (
              <div className="sc-admin-source-empty">
                <Code2 size={28} />
                <strong>Add your first source file</strong>
                <span>Premium source stays server protected.</span>
                <button className="admin-v2-btn-primary" onClick={addFile}>
                  <Plus size={15} /> Add File
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

/* =========================================================
   MAIN COMMERCE CONTROL CENTER
   ========================================================= */
export default function SteaCodeCommercePanel({ isSuperAdmin, initialTab = "products", embedded = false, devPreview = false, onCountsChange, dedicatedAdmin = false, baseRoute = "/code-admin" }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [sourceProduct, setSourceProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  // In-memory cache for the products/orders/entitlements triple. Soft
  // refreshes (e.g. returning from the product editor) reuse this cache
  // for up to 30s so the user doesn't sit through three full API round
  // trips every time they navigate back. The explicit "Refresh" button
  // bypasses the cache by passing force=true.
  const dataCacheRef = useRef({ timestamp: 0, products: [], orders: [], entitlements: [] });
  const DATA_CACHE_TTL_MS = 30 * 1000;

  // Dedicated admin: route to the full-page Product Studio instead of a modal.
  const openEditor = useCallback((product) => {
    if (dedicatedAdmin) {
      const base = baseRoute.replace(/\/$/, "");
      if (product && product.id) {
        navigate(`${base}/products/${encodeURIComponent(product.id)}/edit`);
      } else {
        navigate(`${base}/products/new`);
      }
      return;
    }
    setEditor(product && product.id ? product : {});
  }, [dedicatedAdmin, navigate, baseRoute]);

  // Preview action: routes to edit page with ?tab=preview deep-link.
  const openPreview = useCallback((product) => {
    if (dedicatedAdmin && product?.id) {
      const base = baseRoute.replace(/\/$/, "");
      navigate(`${base}/products/${encodeURIComponent(product.id)}/edit?tab=preview`);
    } else {
      openEditor(product);
    }
  }, [dedicatedAdmin, navigate, baseRoute, openEditor]);

  const refresh = useCallback(async (soft = false, force = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    setError("");
    if (devPreview) {
      setProducts(DEV_PREVIEW_PRODUCTS);
      setOrders([]);
      setEntitlements([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Soft refresh (e.g. returning from the editor) reuses cached data
    // if it's fresher than DATA_CACHE_TTL_MS. Only the explicit Refresh
    // button passes force=true to bypass this and hit the network.
    const cache = dataCacheRef.current;
    const now = Date.now();
    if (!force && cache.timestamp && (now - cache.timestamp) < DATA_CACHE_TTL_MS) {
      setProducts(cache.products);
      setOrders(cache.orders);
      setEntitlements(cache.entitlements);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [pr, ord, en] = await Promise.all([
        getAdminSteaCodeProducts(),
        getAdminSteaCodeOrders(),
        getAdminSteaCodeEntitlements(),
      ]);
      const nextProducts = pr?.products || [];
      const nextOrders = ord?.orders || [];
      const nextEntitlements = en?.entitlements || [];
      setProducts(nextProducts);
      setOrders(nextOrders);
      setEntitlements(nextEntitlements);
      dataCacheRef.current = {
        timestamp: Date.now(),
        products: nextProducts,
        orders: nextOrders,
        entitlements: nextEntitlements,
      };
    } catch (err) {
      setError(err?.message || "Could not load STEA Code commerce data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (typeof onCountsChange === "function") {
      onCountsChange({ products: products.length, orders: orders.length, entitlements: entitlements.length });
    }
  }, [products, orders, entitlements, onCountsChange]);

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === "paid"),
    [orders]
  );

  const revenueByCurrency = useMemo(() => {
    const totals = {};
    for (const order of paidOrders) {
      const currency = String(order.currency || "USD").toUpperCase();
      const minor = typeof order.amountMinor === "number"
        ? order.amountMinor
        : typeof order.amount === "number"
        ? Math.round(order.amount * 100)
        : 0;
      totals[currency] = (totals[currency] || 0) + minor;
    }
    return totals;
  }, [paidOrders]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "published" && p.status !== "published") return false;
      if (filter === "draft" && p.status !== "draft") return false;
      if (filter === "premium" && p.pricingType !== "premium") return false;
      if (filter === "free" && p.pricingType !== "free") return false;
      if (filter === "featured" && !p.featured) return false;
      if (filter === "archived" && p.status !== "archived") return false;
      if (!needle) return true;
      return [p.id, p.slug, p.titleEn, p.titleZh, p.category]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [products, query, filter]);

  const duplicate = useCallback(async (product) => {
    if (devPreview) {
      setError("Unable to duplicate product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
      return;
    }
    const newId = `${product.id}-copy-${Date.now()}`;
    await createAdminSteaCodeProduct({
      ...product,
      id: newId,
      slug: newId,
      titleEn: `${product.titleEn} Copy`,
      titleZh: product.titleZh ? `${product.titleZh} Copy` : "",
      status: "draft",
      featured: false,
    });
    await refresh(true);
  }, [refresh]);

  const toggleStatus = useCallback(async (product) => {
    if (devPreview) {
      setError("Unable to publish product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
      return;
    }
    const next = product.status === "published" ? "draft" : "published";
    await updateAdminSteaCodeProduct(product.id, { ...product, status: next });
    await refresh(true);
  }, [refresh]);

  const toggleHomepageVisible = useCallback(async (product) => {
    if (devPreview) {
      setError("Unable to update product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
      return;
    }
    const next = !product.homepageVisible;
    await updateAdminSteaCodeProduct(product.id, { homepageVisible: next });
    await refresh(true);
  }, [devPreview, refresh]);

  const archive = useCallback(async (product) => {
    if (devPreview) {
      setError("Unable to archive product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
      return;
    }
    await updateAdminSteaCodeProduct(product.id, { ...product, status: "archived" });
    await refresh(true);
  }, [refresh]);

  const destroy = useCallback(async () => {
    if (!deleting) return;
    try {
      if (devPreview) {
        setError("Unable to delete product: DEV_PREVIEW_ONLY. Sign in as a real admin to write STEA Code data.");
        setDeleting(null);
        return;
      }
      const deletedId = deleting.id;
      // Optimistic: remove from local state immediately
      setProducts(prev => prev.filter(p => p.id !== deletedId && p.slug !== deletedId));
      setDeleting(null);
      await deleteAdminSteaCodeProduct(deletedId);
      // Invalidate cache and force-refresh to confirm server state
      dataCacheRef.current = {};
      await refresh(false, true);
      setNotice("Product deleted");
      setTimeout(() => setNotice(""), 2500);
    } catch (err) {
      setError(err?.message || "Could not delete product.");
      setDeleting(null);
      // Revert optimistic removal on failure by forcing a fresh refresh
      dataCacheRef.current = {};
      refresh(false, true).catch(() => {});
    }
  }, [deleting, refresh]);

  if (loading) {
    return (
      <div className="sc-admin-loading-card">
        <Loader2 className="sc-spin" size={20} />
        Loading STEA Code Studio…
      </div>
    );
  }

  return (
    <div className="sc-admin-commerce">
      <div className="sc-admin-commerce-hero sc-admin-commerce-hero-compact">
        <div className="sc-admin-commerce-hero-text">
          <h2>Products</h2>
          <p>{products.length} product{products.length === 1 ? "" : "s"} · Manage your STEA Code catalog.</p>
        </div>
        <div className="sc-admin-commerce-actions">
          <a
            href="/code"
            target="_blank"
            rel="noreferrer"
            className="admin-v2-btn-secondary"
          >
            <Eye size={15} /> Open STEA Code
          </a>
          <button
            className="admin-v2-btn-secondary"
            onClick={() => refresh(true, true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "sc-spin" : ""}
            />
            Refresh
          </button>
          <button
            className="admin-v2-btn-primary"
            onClick={() => openEditor(null)}
          >
            <Plus size={15} /> New Product
          </button>
        </div>
      </div>

      {error && <div className="sc-admin-error">{error}</div>}

      {!embedded && <div className="sc-admin-commerce-tabs">
        {[
          ["products", "Products"],
          ["orders", "Orders"],
          ["entitlements", "Entitlements"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "is-active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>}

      {tab === "overview" && (
        <>
          <div className="sc-admin-metric-grid">
            <Metric icon={Package} label="Products" value={products.length} />
            <Metric
              icon={CheckCircle2}
              label="Published"
              value={products.filter((p) => p.status === "published").length}
            />
            <Metric
              icon={Code2}
              label="Premium"
              value={products.filter((p) => p.pricingType === "premium").length}
            />
            <Metric icon={ShoppingCart} label="Paid Orders" value={paidOrders.length} />
            <Metric icon={Users} label="Entitlements" value={entitlements.length} />
            <Metric
              icon={DollarSign}
              label="Revenue"
              value={
                Object.entries(revenueByCurrency)
                  .map(([c, m]) => `${c} ${(m / 100).toFixed(2)}`)
                  .join(" · ") || "USD 0.00"
              }
            />
          </div>

          <div className="sc-admin-panel">
            <div className="sc-admin-panel-head">
              <div>
                <strong>Recent products</strong>
                <span>Real canonical catalog records.</span>
              </div>
              <button
                className="admin-v2-btn-secondary"
                onClick={() => setTab("products")}
              >
                Manage Products
              </button>
            </div>

            <ProductTable
              products={products.slice(0, 8)}
              isSuperAdmin={isSuperAdmin}
              onEdit={(p) => openEditor(p)}
              onPreview={(p) => openPreview(p)}
              onSource={(p) => setSourceProduct(p)}
              onDuplicate={duplicate}
              onStatus={toggleStatus}
              onHomepageToggle={toggleHomepageVisible}
              onArchive={archive}
              onDelete={(p) => setDeleting(p)}
            />
          </div>
        </>
      )}

      {tab === "products" && (
        <div className="sc-admin-panel">
          <div className="sc-admin-product-toolbar">
            <div className="sc-admin-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
              />
            </div>
            <div className="sc-admin-filter-row">
              {["all","published","draft","premium","free","featured","archived"].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "is-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <ProductTable
            products={visibleProducts}
            isSuperAdmin={isSuperAdmin}
            onEdit={(p) => openEditor(p)}
            onPreview={(p) => openPreview(p)}
            onSource={(p) => setSourceProduct(p)}
            onDuplicate={duplicate}
            onStatus={toggleStatus}
            onHomepageToggle={toggleHomepageVisible}
            onArchive={archive}
            onDelete={(p) => setDeleting(p)}
          />
        </div>
      )}

      {tab === "orders" && (
        <div className="sc-admin-panel">
          <div className="sc-admin-panel-head">
            <div>
              <strong>Orders</strong>
              <span>Stripe/server-authoritative purchase history.</span>
            </div>
          </div>
          <div className="admin-v2-table-wrap">
            <table className="admin-v2-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>{o.userEmail || o.email || o.userId || "—"}</td>
                    <td>{o.productId || "—"}</td>
                    <td>{money(o)}</td>
                    <td><Status value={o.status} /></td>
                    <td>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sc-admin-empty-row">
                      No STEA Code orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "entitlements" && (
        <div className="sc-admin-panel">
          <div className="sc-admin-panel-head">
            <div>
              <strong>Entitlements</strong>
              <span>Customers currently allowed to access purchased code.</span>
            </div>
          </div>
          <div className="admin-v2-table-wrap">
            <table className="admin-v2-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>License</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {entitlements.map((e) => (
                  <tr key={e.id}>
                    <td>{e.userId || "—"}</td>
                    <td>{e.productId || "—"}</td>
                    <td>{e.orderId || "—"}</td>
                    <td>{e.licenseType || "personal"}</td>
                    <td><Status value={e.status || "active"} /></td>
                    <td>{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
                {entitlements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sc-admin-empty-row">
                      No STEA Code entitlements yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editor && (
        <ProductStudio
          product={editor?.id ? editor : null}
          onClose={() => setEditor(null)}
          onSaved={() => refresh(true)}
          isSuperAdmin={isSuperAdmin}
          devPreview={devPreview}
        />
      )}

      {sourceProduct && (
        <SourceEditor
          product={sourceProduct}
          onClose={() => setSourceProduct(null)}
        />
      )}

      {deleting && (
        <Modal title="Delete Product?" onClose={() => setDeleting(null)}>
          <div className="sc-admin-delete-confirm">
            <Trash2 size={32} />
            <strong>{deleting.titleEn}</strong>
            <p>
              Permanent deletion is allowed only when the product has no order
              history and no customer entitlements.
            </p>
            <div className="sc-admin-modal-actions">
              <button
                className="admin-v2-btn-secondary"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button className="sc-admin-danger-btn" onClick={destroy}>
                Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="sc-admin-metric">
      <div className="sc-admin-metric-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Status({ value }) {
  const normalized = String(value || "").toLowerCase();
  return (
    <span className={`sc-admin-status is-${normalized}`}>
      {value || "unknown"}
    </span>
  );
}

function ProductTable({
  products,
  isSuperAdmin,
  onEdit,
  onPreview,
  onSource,
  onDuplicate,
  onStatus,
  onHomepageToggle,
  onArchive,
  onDelete,
}) {
  return (
    <div className="admin-v2-table-wrap">
      <table className="admin-v2-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Pricing</th>
            <th>Runtime</th>
            <th>Status</th>
            <th>Homepage</th>
            <th>Featured</th>
            <th>Preview</th>
            <th>Source</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="sc-admin-product-name">
                  <strong>{p.titleEn || p.id}</strong>
                  <span>{p.id}</span>
                </div>
              </td>
              <td>{p.category || "—"}</td>
              <td>
                {p.pricingType === "premium" ? (
                  <span className="sc-admin-price">
                    {p.currency || "USD"} {Number(p.price || 0).toFixed(2)}
                  </span>
                ) : (
                  <span className="sc-admin-free">FREE</span>
                )}
              </td>
              <td>{p.preview?.runtime === "full-html" ? "Full HTML" : p.preview?.runtime === "external" ? "External" : p.preview?.runtime === "react" ? "React" : "HTML/CSS/JS"}</td>
              <td><Status value={p.status || "draft"} /></td>
              <td>
                <span className={`sc-admin-status ${p.homepageVisible ? "is-yes" : "is-no"}`}>
                  Homepage: {p.homepageVisible ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <span className={`sc-admin-status ${p.featured ? "is-yes" : "is-no"}`}>
                  {p.featured ? "Yes" : "No"}
                </span>
              </td>
              <td>
                <span className={`sc-admin-status ${p.previewVideoUrl || p.hasPreview || p.preview?.enabled ? "is-ready" : "is-missing"}`}>
                  {p.previewVideoUrl && String(p.previewVideoUrl).trim() ? "Video Ready" : (p.hasPreview || p.preview?.enabled ? "Live Preview" : "Missing")}
                </span>
              </td>
              <td>
                <span className={`sc-admin-status ${p.hasSource ? "is-ready" : "is-missing"}`}>
                  {p.hasSource ? "Source Ready" : "Missing"}
                </span>
              </td>
              <td>{formatDate(p.updatedAt)}</td>
              <td>
                <div className="sc-admin-row-actions">
                  <button title="Edit" onClick={() => onEdit(p)}>
                    <Edit3 size={14} />
                  </button>
                  {onPreview && (
                    <button title="Preview" onClick={() => onPreview(p)}>
                      <Eye size={14} />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button title="Source Files" onClick={() => onSource(p)}>
                      <FileCode2 size={14} />
                    </button>
                  )}
                  <button title="Duplicate" onClick={() => onDuplicate(p)}>
                    <Copy size={14} />
                  </button>
                  <button
                    title={p.status === "published" ? "Unpublish" : "Publish"}
                    onClick={() => onStatus(p)}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  {p.status === "published" && onHomepageToggle && (
                    <button
                      title={p.homepageVisible ? "Remove from Homepage" : "Add to Homepage"}
                      onClick={() => onHomepageToggle(p)}
                      className={p.homepageVisible ? "is-homepage-active" : ""}
                    >
                      <Home size={14} />
                    </button>
                  )}
                  <button title="Archive" onClick={() => onArchive(p)}>
                    <Archive size={14} />
                  </button>
                  {isSuperAdmin && (
                    <button
                      title="Delete"
                      className="is-danger"
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={11} className="sc-admin-empty-row">
                No canonical STEA Code products yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
