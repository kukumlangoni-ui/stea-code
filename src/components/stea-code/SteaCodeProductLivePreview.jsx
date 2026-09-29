import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Maximize2, Minimize2, RotateCw, Play } from "lucide-react";
import { getSteaCodeProductPreview } from "../../services/steaCodeCommerce.js";
import { getSteaCodeServerProduct } from "../../data/stea-code/codeProductsServer.js";
import {
  buildHtmlCssJsDoc,
  buildFullHtmlDoc,
  buildReactDoc,
} from "../../utils/steaCodePreviewBuilders.js";

/**
 * STEA Code — Product Live Preview component
 *
 * ⚠️ CRITICAL INVARIANTS — DO NOT BREAK
 *
 * Renders previews in three contexts:
 *   1. Homepage grid cards (fillMode="cover")
 *   2. Public modal "big screen" (fillMode="scale", hideToolbar=true)
 *   3. Admin preview (raw iframe in ProductStudioV3 — NOT this component)
 *
 * INVARIANT 1 — Scale lock (no content measurement)
 *   Viewport is fixed to designWidth × designHeight (fallback 640×480).
 *   There is NO iframe content measurement — handleIframeLoad was removed
 *   entirely. Scale = containerSize / viewport, capped at 0.05×–2.0×.
 *   This eliminates the entire class of over-zoom bugs caused by measuring
 *   small inner elements (buttons, form fields) as the "preview root".
 *
 * INVARIANT 2 — Centering (scale mode)
 *   scaleStyle uses transformOrigin: "center center" and translate() includes ONLY
 *   offsetX/offsetY — NOT tx/ty. Flexbox does the centering (align-items: center;
 *   justify-content: center on .sc-live-preview.is-scale). Adding tx/ty double-centers.
 *
 * INVARIANT 3 — Centering (cover mode)
 *   scaleStyle uses transformOrigin: "top left" with tx/ty = (containerSize - visualSize)/2.
 *   Cover mode uses flex-start alignment. Do not change without removing tx/ty.
 *
 * INVARIANT 4 — Padding
 *   scale mode subtracts 16px padding per side from container dimensions before
 *   computing scale. Changing this changes visual breathing room of every preview.
 *
 * INVARIANT 5 — Fill mode semantics
 *   "scale" = contain math (Math.min), preserves aspect, letterboxes
 *   "cover" = cover math (Math.max), crops overflow, fills container
 *   "stretch" = no scaling
 *   "contain" is NOT a recognized value — falls through to default. Always use "scale".
 *
 * INVARIANT 6 — hideToolbar
 *   When true, the internal .sc-live-preview-toolbar is suppressed. The public modal
 *   uses this to prevent duplicate buttons. Admin paths do not pass hideToolbar.
 *
 * INVARIANT 7 — Modal layout
 *   Modal action buttons live in .sc-modal-media-header ABOVE the preview shell, not
 *   overlapping. Preview shell uses max-height: calc(100% - 50px). Do not re-apply
 *   absolute positioning to modal buttons.
 *
 * INVARIANT 8 — Grid responsive breakpoints
 *   Homepage grid uses "#explore .sc-product-grid, .sc-product-grid" with !important:
 *     > 1024px: 3 columns
 *     641-1024px: 3 columns
 *     <= 640px: 2 columns
 *   The #explore prefix is required — legacy ID-specificity rules override otherwise.
 *
 * INVARIANT 9 — Modal/card isolation
 *   The homepage card iframe and the modal iframe must NOT share state,
 *   keys, or refs. Closing the modal must NOT leave the card's iframe in
 *   a dead state (blank/collapsed).
 *
 * REGRESSION HISTORY — DO NOT REPEAT
 *   - "fillMode='contain'" (unrecognized) → no scaling → clipping
 *   - preview.width priority over designWidth → under-scale
 *   - Removing flex centering + keeping tx/ty → double-centering → top-left
 *   - Content measurement (handleIframeLoad) → over-zoom on small elements → REMOVED
 *   - Absolute positioning of modal buttons → overlapping preview
 *   - Removing "Forms" from hardcoded pill array → category missing
 *   - Modal close → card blank until refresh (iframe state leaked across contexts)
 */

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

// Global active iframe coordinator: maximum 12 simultaneous live iframes
// across the page. Homepage shows 6-9 curated products — all can now render
// live. Cards further from the viewport center still get paused first when
// the count exceeds 12 (e.g. large filtered catalog views).
const MAX_ACTIVE_IFRAMES = 12;
const activeIframeRegistry = new Map(); // id -> { elementRef, isNear, priority }
const iframeListeners = new Set();

function updateActiveIframes() {
  // Sort all registered iframes by priority (lower = more important).
  // Priority = distance from viewport center (smaller first).
  const entries = Array.from(activeIframeRegistry.entries());
  entries.sort((a, b) => (a[1].priority || 0) - (b[1].priority || 0));
  const topIds = new Set(entries.slice(0, MAX_ACTIVE_IFRAMES).map(([id]) => id));
  iframeListeners.forEach((fn) => fn(topIds));
}

function registerIframe(id, elementRef, isNear) {
  const current = activeIframeRegistry.get(id);
  const priority = computePriority(elementRef);
  activeIframeRegistry.set(id, { elementRef, isNear, priority });
  updateActiveIframes();
}

function refreshIframePriority(id) {
  const entry = activeIframeRegistry.get(id);
  if (!entry) return;
  entry.priority = computePriority(entry.elementRef);
  updateActiveIframes();
}

function computePriority(elementRef) {
  if (typeof window === "undefined" || !elementRef?.current) return 0;
  const el = elementRef.current;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 800;
  const vw = window.innerWidth || 1200;
  const centerX = vw / 2;
  const centerY = vh / 2;
  const elCenterX = rect.left + rect.width / 2;
  const elCenterY = rect.top + rect.height / 2;
  const dx = elCenterX - centerX;
  const dy = elCenterY - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

function unregisterIframe(id) {
  if (activeIframeRegistry.delete(id)) {
    updateActiveIframes();
  }
}

/**
 * Check whether a preview object has any renderable content.
 * Used to decide whether to fall back to the seed demo.
 */
function hasRenderableContent(p) {
  if (!p) return false;
  return (
    (typeof p.html === "string" && p.html.trim().length > 0) ||
    (typeof p.css === "string" && p.css.trim().length > 0) ||
    (typeof p.javascript === "string" && p.javascript.trim().length > 0) ||
    (typeof p.fullDocument === "string" && p.fullDocument.trim().length > 0) ||
    (typeof p.jsx === "string" && p.jsx.trim().length > 0)
  );
}

/**
 * Build a renderable preview object from a product's publicFiles array.
 * Used for free products (Glow Button Effect, Minimal Loader) that ship
 * index.html + styles.css instead of a curated demoPreview.
 */
function buildPreviewFromPublicFiles(publicFiles) {
  if (!Array.isArray(publicFiles)) return null;
  const htmlFile = publicFiles.find(
    (f) => f && (f.language === "html" || /\.html?$/i.test(f.path || ""))
  );
  const cssFile = publicFiles.find(
    (f) => f && (f.language === "css" || /\.css$/i.test(f.path || ""))
  );
  const jsFile = publicFiles.find(
    (f) =>
      f &&
      (f.language === "javascript" ||
        f.language === "js" ||
        /\.js$/i.test(f.path || ""))
  );
  const html = htmlFile?.content || "";
  const css = cssFile?.content || "";
  const javascript = jsFile?.content || "";
  if (!html && !css && !javascript) return null;
  return {
    html,
    css,
    javascript,
    mode: "html-css-js",
    runtime: "html-css-js",
  };
}

/**
 * Fall back to the polished seed demo when the API returns empty/broken
 * preview data (e.g. a Firestore doc overwritten with fullDocument: "").
 * This keeps cards alive in production even before a backend redeploy,
 * and for any product whose saved preview is malformed.
 *
 * Fallback chain:
 *   1. API preview (if it has renderable content)
 *   2. Seed product's demoPreview (polished fullDocument for most products)
 *   3. Seed product's publicFiles assembled into an html-css-js preview
 *      (free products like Glow Button Effect, Minimal Loader)
 *
 * Also guarantees width/height/scaleMode are present so the scaling
 * wrapper (translate + scale) can center the demo correctly.
 */
function resolvePreviewWithFallback(apiPreview, productId) {
  // Priority:
  //   1. API preview with non-empty fullDocument (admin-authored, best)
  //   2. Seed demo with non-empty fullDocument (self-contained HTML,
  //      renders CSS/layout even in static sandbox="" iframes)
  //   3. API preview with jsx/css/html/javascript (needs Babel/scripts)
  //   4. Seed demo with any renderable content
  //   5. Seed product's publicFiles assembled into html-css-js
  //
  // Why #2 before #3: cards beyond the 6-iframe cap render in a static
  // iframe with sandbox="" (no scripts). React previews (jsx+css with
  // empty fullDocument) produce a blank #root in static mode because
  // Babel never runs. Seed demos with fullDocument include inline CSS
  // that shows visible content even without JS. Preferring them keeps
  // ALL cards visually populated, not just the top 6.
  const apiHasFullDoc =
    typeof apiPreview?.fullDocument === "string" &&
    apiPreview.fullDocument.trim().length > 0;

  let preview = null;

  if (apiHasFullDoc) {
    preview = apiPreview;
  } else {
    const seed = getSteaCodeServerProduct(String(productId || "").trim());
    const seedDemo = seed?.demoPreview;
    const seedHasFullDoc =
      typeof seedDemo?.fullDocument === "string" &&
      seedDemo.fullDocument.trim().length > 0;

    if (seedHasFullDoc) {
      preview = { ...seedDemo };
    } else if (hasRenderableContent(apiPreview)) {
      preview = apiPreview;
    } else if (hasRenderableContent(seedDemo)) {
      preview = { ...seedDemo };
    } else {
      const fromFiles = buildPreviewFromPublicFiles(seed?.publicFiles);
      if (fromFiles) preview = fromFiles;
    }
  }

  if (!preview) return null;
  // Guarantee dimensions so the scaling wrapper works. Seed demos use
  // height:100vh internally, so 1440x900 fills the canvas and scales
  // cleanly to any container.
  return {
    ...preview,
    width: preview.width || DEFAULT_VIEWPORT.width,
    height: preview.height || DEFAULT_VIEWPORT.height,
    scaleMode: preview.scaleMode || "fit",
    viewportMode: preview.viewportMode || "desktop",
  };
}

export default forwardRef(function SteaCodeProductLivePreview({
  productId,
  title = "",
  category = "",
  interactive = true,
  lazy = true,
  fillMode = "scale",
  cardZoom = "full",
  modalZoom = 1,
  designWidth = 0,
  designHeight = 0,
  offsetX = 0,
  offsetY = 0,
  showControls = false,
  hideToolbar = false,
  rootMargin = "250px",
  placeholder = null,
  className = "",
  srcDoc: srcDocProp = "",
  videoUrl = "",
  posterUrl = "",
  debug = false,
}, ref) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const currentProductIdRef = useRef(String(productId || "").trim());
  const [nearViewport, setNearViewport] = useState(!lazy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewProductId, setPreviewProductId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // previewReady: true once the live iframe's onLoad fires (or the 2s failsafe).
  // Keeps the shimmer visible during the black-card window before first paint.
  const [previewReady, setPreviewReady] = useState(false);
  const previewReadyTimerRef = useRef(null);

  const cleanTitle = (
    title ||
    getSteaCodeServerProduct(String(productId || "").trim())?.titleEn ||
    "Component Preview"
  ).trim();

  useEffect(() => {
    currentProductIdRef.current = String(productId || "").trim();
    setPreview(null);
    setPreviewProductId("");
    setLoading(false);
    setError("");
    setFullscreen(false);
    setContainerSize({ width: 0, height: 0 });
    // Reset shimmer on product change so the new card always starts with shimmer
    setPreviewReady(false);
    if (previewReadyTimerRef.current) {
      clearTimeout(previewReadyTimerRef.current);
      previewReadyTimerRef.current = null;
    }
  }, [productId]);

  const [isIntersecting, setIsIntersecting] = useState(!lazy);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lazy activation & offscreen pausing via IntersectionObserver.
  useEffect(() => {
    if (!lazy) {
      setNearViewport(true);
      setIsIntersecting(true);
      return undefined;
    }
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      setIsIntersecting(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearViewport(true);
          }
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  // Instance ID for the global iframe-slot registry.
  // Uses a per-instance random ref so modal & homepage cards never collide or overwrite each other.
  const uniqueInstanceIdRef = useRef(null);
  if (!uniqueInstanceIdRef.current) {
    uniqueInstanceIdRef.current = Math.random().toString(36).slice(2, 10);
  }
  const instanceId = useMemo(
    () => `sc-lp-${productId || "anon"}-${uniqueInstanceIdRef.current}`,
    [productId]
  );

  // Register with the global iframe slot controller. When near viewport
  // AND not reduced-motion, compete for one of the MAX_ACTIVE_IFRAMES slots.
  const [hasIframeSlot, setHasIframeSlot] = useState(false);

  useEffect(() => {
    const shouldCompete = nearViewport && !prefersReducedMotion;
    if (!shouldCompete) {
      unregisterIframe(instanceId);
      setHasIframeSlot(false);
      return;
    }

    registerIframe(instanceId, containerRef, nearViewport);

    const listener = (activeSet) => {
      setHasIframeSlot(activeSet.has(instanceId));
    };
    iframeListeners.add(listener);
    // Set initial state from current registry snapshot.
    const activeIds = new Set(
      Array.from(activeIframeRegistry.entries())
        .sort((a, b) => (a[1].priority || 0) - (b[1].priority || 0))
        .slice(0, MAX_ACTIVE_IFRAMES)
        .map(([id]) => id)
    );
    setHasIframeSlot(activeIds.has(instanceId));

    return () => {
      iframeListeners.delete(listener);
      unregisterIframe(instanceId);
    };
  }, [instanceId, nearViewport, prefersReducedMotion, containerRef]);

  // Re-prioritize on scroll / resize so cards near viewport center stay active.
  useEffect(() => {
    if (!nearViewport || prefersReducedMotion) return;
    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        refreshIframePriority(instanceId);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [instanceId, nearViewport, prefersReducedMotion]);

  // Fetch preview source once when near viewport.
  // Skip when srcDocProp is provided (admin WYSIWYG uses local state).
  // Skip when video is provided and no HTML source exists — video is the preview.
  useEffect(() => {
    if (srcDocProp) {
      setPreview({
        fullDocument: srcDocProp,
        runtime: "full-html",
        width: 1440,
        height: 900,
      });
      setPreviewProductId(String(productId || "local").trim());
      setLoading(false);
      return undefined;
    }
    if (videoUrl && !srcDocProp) {
      setLoading(false);
      setError("");
      return undefined;
    }
    const requestProductId = String(productId || "").trim();
    if (!nearViewport || !requestProductId) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPreview(null);
    setPreviewProductId("");
    getSteaCodeProductPreview(requestProductId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (requestProductId !== currentProductIdRef.current) return;
        // Resolve: use API preview if it has renderable content, otherwise
        // fall back to the polished seed demo so the card never goes blank.
        const resolved = resolvePreviewWithFallback(result?.preview || null, requestProductId);
        setPreview(resolved);
        setPreviewProductId(requestProductId);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (requestProductId !== currentProductIdRef.current) return;
        // API failed (e.g. backend not deployed, network error). Fall back
        // to the seed demo instead of showing an error — a live seed demo
        // is strictly better than a blank/error card for conversion.
        const resolved = resolvePreviewWithFallback(null, requestProductId);
        if (resolved) {
          setPreview(resolved);
          setPreviewProductId(requestProductId);
        } else {
          console.warn(`[STEA Code] Live preview unavailable for ${requestProductId}:`, err?.message || err);
          setError(err?.message || "Could not load preview.");
        }
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        if (requestProductId !== currentProductIdRef.current) return;
        setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [nearViewport, productId, reloadKey, srcDocProp]);

  const activeProductId = String(productId || "").trim();
  const previewBelongsToCurrentProduct =
    Boolean(preview) &&
    Boolean(activeProductId) &&
    previewProductId === activeProductId;

  const srcDoc = useMemo(() => {
    // Admin WYSIWYG: when srcDocProp is provided, use it directly.
    // Skip all API-state indirection — render exactly what the editor has.
    if (srcDocProp) return srcDocProp;
    if (!previewBelongsToCurrentProduct || !preview) return "";
    const runtime = String(preview.runtime || "html-css-js");
    const rawFullDoc = String(preview.fullDocument || "").trim();
    const rawHtml = String(preview.html || "");
    const rawCss = String(preview.css || "");
    const rawJs = String(preview.javascript || "");

    // Content-based detection (belt + suspenders):
    // If the authoritative fullDocument field is empty but the plain html
    // field actually contains a standalone HTML document (starts with
    // doctype/html/head and is substantial), treat it as a full document.
    // This renders mis-saved previews like the original Character Wave
    // Carousel without requiring a manual re-save.
    const htmlLooksLikeFullDoc =
      !rawFullDoc &&
      !rawCss &&
      !rawJs &&
      /^\s*(<!doctype\s|<html\b|<head\b)/i.test(rawHtml) &&
      rawHtml.length > 1000;
    const effectiveFullDoc = rawFullDoc || (htmlLooksLikeFullDoc ? rawHtml : "");

    /*
     * IMPORTANT:
     * A complete authored HTML document is authoritative.
     * Some Admin products also contain a tiny HTML fallback.
     * If fullDocument exists (or content-based detection found one in the
     * plain html field), always render the complete document regardless of
     * the saved runtime value.
     */
    if (effectiveFullDoc) {
      return buildFullHtmlDoc({
        fullDocument: effectiveFullDoc,
        baseUrl: preview.baseUrl,
      });
    }
    if (runtime === "full-html") {
      return buildFullHtmlDoc({
        fullDocument: effectiveFullDoc || preview.fullDocument,
        baseUrl: preview.baseUrl,
      });
    }
    if (runtime === "react") {
      // Prefer explicit JSX/TSX fields. Fall back to html/javascript for
      // older saves where the preview content was stored in those fields.
      const reactSource =
        preview.tsx || preview.jsx || preview.javascript || preview.html || "";
      return buildReactDoc({
        jsx: reactSource,
        css: preview.css || "",
        baseUrl: preview.baseUrl,
      });
    }
    if (runtime === "external") return "";
    return buildHtmlCssJsDoc({
      html: preview.html,
      css: preview.css,
      javascript: preview.javascript,
      baseUrl: preview.baseUrl,
    });
  }, [preview, previewBelongsToCurrentProduct]);

  // SCALE LOCK — fixed baseline viewport from design canvas. No measurement.
  // designWidth/designHeight are the admin-configured design canvas dimensions.
  // Falls back to 640×480 (STEA Code standard card canvas) if not set.
  const designW = Number(designWidth) || 640;
  const designH = Number(designHeight) || 480;

  const baseViewport = { width: designW, height: designH };

  const viewport = useMemo(() => {
    if (fillMode === "cover") {
      if (typeof cardZoom === "number" && cardZoom > 0) {
        return {
          width: Math.round(baseViewport.width / cardZoom),
          height: Math.round(baseViewport.height / cardZoom),
        };
      }
      switch (cardZoom) {
        case "focus":  return { width: Math.round(baseViewport.width * 0.5) || 400, height: Math.round(baseViewport.height * 0.5) || 250 };
        case "center": return { width: Math.round(baseViewport.width * 0.7) || 560, height: Math.round(baseViewport.height * 0.7) || 350 };
        case "full":
        default:       return baseViewport;
      }
    }
    if (fillMode === "scale") {
      if (typeof modalZoom === "number" && modalZoom > 0 && modalZoom !== 1) {
        return {
          width: Math.round(baseViewport.width / modalZoom),
          height: Math.round(baseViewport.height / modalZoom),
        };
      }
      return baseViewport;
    }
    return baseViewport;
  }, [fillMode, cardZoom, modalZoom, designW, designH]);

  // Called when the live iframe finishes loading its first frame.
  // Clears the shimmer overlay so the content becomes visible.
  const handleIframeReady = useCallback(() => {
    if (previewReadyTimerRef.current) {
      clearTimeout(previewReadyTimerRef.current);
      previewReadyTimerRef.current = null;
    }
    setPreviewReady(true);
  }, []);

  // 2-second failsafe: some srcdoc iframes never fire onLoad (e.g. large
  // inline documents, cross-origin quirks). Flip previewReady regardless
  // so the card never stays in shimmer state indefinitely.
  useEffect(() => {
    if (previewReady) return undefined;
    // Only start the timer once we actually have a srcDoc to show
    if (!srcDoc && !srcDocProp) return undefined;
    if (previewReadyTimerRef.current) clearTimeout(previewReadyTimerRef.current);
    previewReadyTimerRef.current = setTimeout(() => {
      setPreviewReady(true);
    }, 2000);
    return () => {
      if (previewReadyTimerRef.current) {
        clearTimeout(previewReadyTimerRef.current);
        previewReadyTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcDoc, srcDocProp]);

  const handleReload = useCallback(() => {
    setPreviewReady(false);
    setReloadKey((k) => k + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((v) => !v);
  }, []);

  // Expose imperative methods to parent refs (e.g. modal toolbar buttons)
  useImperativeHandle(ref, () => ({
    reload: handleReload,
    toggleFullscreen,
  }), [handleReload, toggleFullscreen]);

  // Track container size for dynamic scaling.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  // Esc to exit fullscreen.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const runtime = String(preview?.runtime || "html-css-js");
  const externalPreviewUrl =
    runtime === "external"
      ? String(preview?.externalUrl || preview?.baseUrl || "").trim()
      : "";

  const hasHtmlSource = Boolean(
    srcDocProp ||
      (previewBelongsToCurrentProduct &&
        preview &&
        (srcDoc || (runtime === "external" && externalPreviewUrl)))
  );
  const hasVideo = Boolean(videoUrl && videoUrl.trim());
  const hasSource = hasHtmlSource || hasVideo;

  // fillMode semantics: "scale"=contain, "cover"=cover, "stretch"=fill.
  // isScaleMode gates the scale/translate math (used by both scale + cover).
  const isScaleMode = fillMode === "scale" || fillMode === "cover";

  const containerClass = `sc-live-preview ${interactive ? "is-interactive" : "is-static"} ${fillMode === "stretch" ? "is-stretch" : fillMode === "cover" ? "is-cover" : "is-scale"} ${prefersReducedMotion ? "is-reduced-motion" : ""} ${className}`;

  // Scale transform to fit container while preserving authored aspect.
  // When fillMode === "scale", subtract 16px padding on all sides to prevent edge clipping.
  const scale = useMemo(() => {
    if (!isScaleMode || !hasSource) return 1;
    if (!containerSize.width || !containerSize.height) return 0;
    const pad = fillMode === "scale" ? 16 : 0;
    const usableW = Math.max(0, containerSize.width - pad * 2);
    const usableH = Math.max(0, containerSize.height - pad * 2);
    const scaleX = usableW / viewport.width;
    const scaleY = usableH / viewport.height;

    // HARD LOCK: scale is never more than 2x or less than 0.05x.
    // This prevents any possibility of over-zoom regardless of input values.
    const raw = fillMode === "cover"
      ? Math.max(scaleX, scaleY)
      : Math.min(scaleX, scaleY);

    return Math.max(0.05, Math.min(raw, 2.0));
  }, [fillMode, isScaleMode, hasSource, containerSize, viewport]);

  const scaleStyle = useMemo(() => {
    if (!isScaleMode || !hasSource) return {};
    if (scale <= 0) return {};
    if (fillMode === "scale") {
      // Option A: Flexbox centers the wrapper (.sc-live-preview.is-scale).
      // Scale from center, no extra translate offset needed.
      return {
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        transformOrigin: "center center",
      };
    }
    // Cover mode:
    const visualW = viewport.width * scale;
    const visualH = viewport.height * scale;
    const tx = (containerSize.width - visualW) / 2;
    const ty = (containerSize.height - visualH) / 2;
    return {
      width: `${viewport.width}px`,
      height: `${viewport.height}px`,
      transform: `translate(${tx + offsetX}px, ${ty + offsetY}px) scale(${scale})`,
      transformOrigin: "top left",
    };
  }, [isScaleMode, fillMode, hasSource, viewport, scale, containerSize, offsetX, offsetY]);

  // Dev-only invariants & sanity guards
  if (import.meta.env.DEV && fillMode !== "scale" && fillMode !== "cover" && fillMode !== "stretch") {
    console.warn(`[SteaCodeProductLivePreview] Unrecognized fillMode="${fillMode}". Expected "scale" | "cover" | "stretch".`);
  }

  if (import.meta.env.DEV && fillMode === "scale" && scaleStyle && scaleStyle.transform) {
    const txMatch = scaleStyle.transform.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    if (txMatch) {
      const tx = parseFloat(txMatch[1]);
      const ty = parseFloat(txMatch[2]);
      const expectedX = Number(offsetX) || 0;
      const expectedY = Number(offsetY) || 0;
      if (Math.abs(tx - expectedX) > 0.5 || Math.abs(ty - expectedY) > 0.5) {
        console.warn(`[SteaCodeProductLivePreview] scale-mode translate contains tx/ty beyond offsetX/offsetY. Double-centering detected — see INVARIANT 2.`);
      }
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className={containerClass}
        data-preview-product={String(productId || "").trim()}
        data-state={loading ? "loading" : error ? "error" : hasSource ? "ready" : "empty"}
      >
        {debug && (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              background: "rgba(0,0,0,0.75)",
              color: "#0f0",
              font: "10px/1.4 monospace",
              padding: "4px 6px",
              borderRadius: "4px",
              zIndex: 9999,
              pointerEvents: "none",
              whiteSpace: "pre-wrap",
            }}
          >
            {`fillMode: ${fillMode}
viewport: ${viewport.width}x${viewport.height}
containerSize: ${Math.round(containerSize.width)}x${Math.round(containerSize.height)}
scale: ${typeof scale === "number" ? scale.toFixed(4) : scale}
padding: ${fillMode === "scale" ? "16px" : "0px"}
centering: ${fillMode === "scale" ? "flex (center center)" : "tx/ty (top left)"}`}
          </div>
        )}

        {showControls && !hideToolbar && hasSource && (
          <div className="sc-live-preview-toolbar">
            <button
              type="button"
              className="sc-live-preview-ctrl"
              onClick={handleReload}
              aria-label="Reload preview"
              title="Reload"
            >
              <RotateCw size={14} />
            </button>
            <button
              type="button"
              className="sc-live-preview-ctrl"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        )}

        {!nearViewport || (!isIntersecting && lazy) ? (
          <div className="sc-live-preview-placeholder">{placeholder || <div className="sc-live-preview-empty" />}</div>
        ) : loading ? (
          <div className="sc-live-preview-loading">
            <Loader2 size={16} className="sc-spin" />
            <span>Loading preview…</span>
          </div>
        ) : error ? (
          <div className="sc-live-preview-error">
            <AlertTriangle size={18} />
            <span>Preview unavailable</span>
            {title && <small style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>{title}</small>}
            {category && <span className="sc-product-card-pill" style={{ marginTop: "4px", fontSize: "10px" }}>{category}</span>}
          </div>
        ) : !hasSource ? (
          <div className="sc-live-preview-empty">
            {title && <small style={{ color: "#94a3b8", fontSize: "11px" }}>{title}</small>}
          </div>
        ) : hasVideo && !hasHtmlSource ? (
          <div className="sc-live-preview-scale-wrap" style={scaleStyle}>
            <video
              src={videoUrl}
              poster={posterUrl || undefined}
              muted
              loop
              playsInline
              autoPlay={interactive}
              preload="metadata"
              style={{
                width: "100%",
                height: "100%",
                objectFit: fillMode === "cover" ? "cover" : fillMode === "stretch" ? "fill" : "contain",
                display: "block",
                pointerEvents: "none",
              }}
            />
          </div>
        ) : prefersReducedMotion || (!showControls && !hasIframeSlot && lazy) ? (
          // Static frame: first-frame look for reduced-motion users
          // and for cards beyond the 12-iframe cap. The demo still has
          // its layout + background gradient — just not running JS.
          <div className="sc-live-preview-static sc-live-preview-scale-wrap" style={scaleStyle}>
            <iframe
              title={`${cleanTitle} (static)`}
              srcDoc={runtime === "external" ? "" : srcDoc}
              sandbox=""
              className="sc-live-preview-iframe"
              style={{ pointerEvents: "none" }}
              loading="lazy"
            />
            {prefersReducedMotion && (
              <div className="sc-live-preview-reduced-badge" aria-hidden="true">
                <Play size={12} />
                <span>Static preview</span>
              </div>
            )}
          </div>
        ) : runtime === "external" ? (
          <iframe
            ref={iframeRef}
            key={reloadKey}
            title={cleanTitle}
            src={externalPreviewUrl}
            sandbox="allow-scripts allow-same-origin"
            allow="webgl; xr-spatial-tracking"
            className="sc-live-preview-iframe"
            style={{ pointerEvents: interactive ? "auto" : "none" }}
          />
        ) : (
          <div className="sc-live-preview-scale-wrap" style={scaleStyle}>
            <iframe
              ref={iframeRef}
              key={`${productId}-${reloadKey}`}
              title={cleanTitle}
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-same-origin"
              allow="webgl; xr-spatial-tracking"
              className="sc-live-preview-iframe"
              style={{ pointerEvents: interactive ? "auto" : "none" }}
              onLoad={handleIframeReady}
            />
            {/* Shimmer overlay: shown until onLoad fires or 2s failsafe elapses.
                Prevents the "black card" impression while the iframe paints its
                first frame. Uses the existing sc-live-preview-skeleton animation. */}
            {!previewReady && (
              <div
                className="sc-live-preview-skeleton"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  borderRadius: "inherit",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )}
      </div>

      {fullscreen && hasSource && (
        <div className="sc-live-preview-fullscreen" role="dialog" aria-modal="true">
          <button
            type="button"
            className="sc-live-preview-fullscreen-close"
            onClick={() => setFullscreen(false)}
            aria-label="Exit fullscreen"
          >
            <Minimize2 size={16} />
          </button>
          <div className="sc-live-preview-fullscreen-body">
            {hasVideo && !hasHtmlSource ? (
              <video
                src={videoUrl}
                poster={posterUrl || undefined}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : runtime === "external" ? (
              <iframe
                title={`${cleanTitle} (fullscreen)`}
                src={externalPreviewUrl}
                sandbox="allow-scripts allow-same-origin"
                allow="webgl; xr-spatial-tracking"
                className="sc-live-preview-iframe"
              />
            ) : (
              <iframe
                title={`${cleanTitle} (fullscreen)`}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-same-origin"
                allow="webgl; xr-spatial-tracking"
                className="sc-live-preview-iframe"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
});
