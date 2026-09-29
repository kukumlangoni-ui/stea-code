import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AlertTriangle,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  Hand
} from "lucide-react";
import { getSteaCodeProductPreview } from "../../services/steaCodeCommerce.js";
import {
  buildHtmlCssJsDoc,
  buildFullHtmlDoc,
  buildReactDoc,
} from "../../utils/steaCodePreviewBuilders.js";

// Global active iframe coordinator: maximum 6 simultaneous active iframes across the page.
const MAX_ACTIVE_IFRAMES = 6;
const activeIframeRegistry = new Set();
const iframeListeners = new Set();

function registerIframe(id) {
  activeIframeRegistry.add(id);
  if (activeIframeRegistry.size > MAX_ACTIVE_IFRAMES) {
    const oldest = activeIframeRegistry.values().next().value;
    activeIframeRegistry.delete(oldest);
  }
  notifyRegistry();
}

function unregisterIframe(id) {
  if (activeIframeRegistry.delete(id)) {
    notifyRegistry();
  }
}

function notifyRegistry() {
  iframeListeners.forEach((fn) => fn());
}

export function useIframeSlot(id, isNearViewport) {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (!isNearViewport) {
      unregisterIframe(id);
      setCanRender(false);
      return;
    }

    registerIframe(id);
    setCanRender(activeIframeRegistry.has(id));

    const listener = () => {
      setCanRender(activeIframeRegistry.has(id));
    };
    iframeListeners.add(listener);

    return () => {
      iframeListeners.delete(listener);
      unregisterIframe(id);
    };
  }, [id, isNearViewport]);

  return canRender;
}

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob: https:; connect-src 'none';">`;

function injectCspAndBridge(docHtml, instanceToken, theme = "dark") {
  if (!docHtml) return "";

  const bridgeScript = `
<script>
(function() {
  const token = ${JSON.stringify(instanceToken)};
  function post(type, payload) {
    try {
      window.parent.postMessage({ token, type, ...payload }, "*");
    } catch(e) {}
  }
  window.addEventListener("error", function(e) {
    post("error", { message: e.message || String(e) });
  });
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "setTheme") {
      document.documentElement.setAttribute("data-theme", e.data.theme);
      document.documentElement.classList.toggle("dark", e.data.theme === "dark");
      document.documentElement.classList.toggle("light", e.data.theme === "light");
    }
  });
  window.addEventListener("load", function() {
    post("ready", {
      height: document.documentElement.scrollHeight || document.body.scrollHeight || 400
    });
  });
  if (window.ResizeObserver) {
    new ResizeObserver(function() {
      post("resize", {
        height: document.documentElement.scrollHeight || document.body.scrollHeight || 400
      });
    }).observe(document.body || document.documentElement);
  }
  document.documentElement.setAttribute("data-theme", ${JSON.stringify(theme)});
})();
<\/script>
  `.trim();

  let modified = docHtml;
  if (!/<meta[^>]*Content-Security-Policy/i.test(modified)) {
    if (/<head[^>]*>/i.test(modified)) {
      modified = modified.replace(/<head[^>]*>/i, (m) => `${m}\n${CSP_META_TAG}\n${bridgeScript}`);
    } else {
      modified = `${CSP_META_TAG}\n${bridgeScript}\n${modified}`;
    }
  } else {
    if (/<head[^>]*>/i.test(modified)) {
      modified = modified.replace(/<head[^>]*>/i, (m) => `${m}\n${bridgeScript}`);
    } else {
      modified = `${bridgeScript}\n${modified}`;
    }
  }

  return modified;
}

export default function LivePreview({
  productId = "",
  previewSource = null,
  title = "",
  posterImageUrl = "",
  interactive = true,
  lazy = true,
  showControls = false,
  isAdmin = false,
  initialTheme = "dark",
  initialDevice = "desktop",
  className = "",
  style = {},
  onLoaded = null,
  onError = null,
}) {
  const instanceId = useMemo(() => `lp-${Math.random().toString(36).slice(2, 9)}`, []);
  const instanceToken = useMemo(() => `token-${Math.random().toString(36).slice(2, 10)}`, []);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  const [isNearViewport, setIsNearViewport] = useState(!lazy);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fetchedPreview, setFetchedPreview] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [isTouchEngaged, setIsTouchEngaged] = useState(!interactive ? false : false);
  const [device, setDevice] = useState(initialDevice); // "desktop" | "tablet" | "mobile"
  const [theme, setTheme] = useState(initialTheme);     // "dark" | "light"
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(null);

  const canRenderIframe = useIframeSlot(instanceId, isNearViewport);

  // Lazy Intersection Observer
  useEffect(() => {
    if (!lazy) {
      setIsNearViewport(true);
      return;
    }
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
          }
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  // Fetch preview if productId provided without direct previewSource
  useEffect(() => {
    if (previewSource) {
      setFetchedPreview(previewSource);
      setErrorMsg("");
      return;
    }

    const cleanId = String(productId || "").trim();
    if (!cleanId || !isNearViewport) return;

    const controller = new AbortController();
    setLoading(true);
    setErrorMsg("");

    getSteaCodeProductPreview(cleanId, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setFetchedPreview(res?.preview || null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn(`[LivePreview] Failed loading preview for ${cleanId}:`, err);
        setErrorMsg(err.message || "Failed to load preview");
        if (onError) onError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [productId, previewSource, isNearViewport, reloadKey]);

  // Handle postMessage bidirectional communication
  useEffect(() => {
    const handleMessage = (e) => {
      if (!e.data || e.data.token !== instanceToken) return;
      if (e.source !== iframeRef.current?.contentWindow) return;

      if (e.data.type === "ready") {
        setLoading(false);
        if (e.data.height && !showControls) {
          setIframeHeight(e.data.height);
        }
        if (onLoaded) onLoaded();
      } else if (e.data.type === "resize") {
        if (e.data.height && !showControls) {
          setIframeHeight(e.data.height);
        }
      } else if (e.data.type === "error") {
        if (isAdmin) {
          setErrorMsg(`Preview Error: ${e.data.message}`);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [instanceToken, isAdmin, showControls, onLoaded]);

  // Toggle Theme in Iframe
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "setTheme", theme: newTheme },
        "*"
      );
    } catch (e) {}
  };

  // Compile final srcdoc
  const finalSrcDoc = useMemo(() => {
    const p = previewSource || fetchedPreview;
    if (!p) return "";

    let rawDoc = "";
    if (p.fullDocument) {
      rawDoc = buildFullHtmlDoc({ fullDocument: p.fullDocument });
    } else if (p.jsx || p.javascript || p.js || p.html || p.css) {
      if (p.jsx || p.mode === "react") {
        rawDoc = buildReactDoc({ jsx: p.jsx || p.javascript || p.js || "", css: p.css || "" });
      } else {
        rawDoc = buildHtmlCssJsDoc({
          html: p.html || "",
          css: p.css || "",
          javascript: p.javascript || p.js || "",
        });
      }
    }

    return injectCspAndBridge(rawDoc, instanceToken, theme);
  }, [previewSource, fetchedPreview, instanceToken, theme, reloadKey]);

  const deviceWidthMap = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  const handleContainerTap = () => {
    if (!isTouchEngaged && interactive) {
      setIsTouchEngaged(true);
    }
  };

  const handleOutsideBlur = () => {
    if (isTouchEngaged) {
      setIsTouchEngaged(false);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={interactive ? 0 : -1}
      onBlur={handleOutsideBlur}
      onClick={handleContainerTap}
      className={`sc-live-preview-root relative flex flex-col items-center justify-center overflow-hidden select-none ${
        fullscreen ? "fixed inset-0 z-50 bg-black/95 p-6 backdrop-blur-md" : "w-full h-full"
      } ${className}`}
      style={{ touchAction: "pan-y", ...style }}
    >
      {/* Detail/Studio Toolbar */}
      {showControls && (
        <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900/90 border-b border-white/10 text-xs text-neutral-300 z-10">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Desktop View"
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded transition ${
                device === "desktop" ? "bg-white/20 text-white" : "hover:bg-white/10 text-neutral-400"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Tablet View (768px)"
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded transition ${
                device === "tablet" ? "bg-white/20 text-white" : "hover:bg-white/10 text-neutral-400"
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Mobile View (390px)"
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded transition ${
                device === "mobile" ? "bg-white/20 text-white" : "hover:bg-white/10 text-neutral-400"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              title="Reload Preview"
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition"
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Frame Container */}
      <div
        className="relative flex items-center justify-center w-full h-full transition-all duration-200"
        style={{
          maxWidth: showControls ? deviceWidthMap[device] : "100%",
          height: iframeHeight ? `${iframeHeight}px` : "100%",
        }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-10 pointer-events-none">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Error / Fallback Poster */}
        {(errorMsg || !finalSrcDoc || !canRenderIframe) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-4 text-center">
            {posterImageUrl ? (
              <img
                src={posterImageUrl}
                alt={title || "Preview poster"}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-500">
                <AlertTriangle className="w-6 h-6 text-amber-500/80" />
                <span className="text-xs font-mono">
                  {errorMsg && isAdmin ? errorMsg : "Preview unavailable"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sandboxed Iframe */}
        {finalSrcDoc && canRenderIframe && (
          <iframe
            ref={iframeRef}
            key={`${instanceId}-${reloadKey}`}
            title={title || "STEA Code Live Preview"}
            srcDoc={finalSrcDoc}
            sandbox="allow-scripts"
            loading="lazy"
            className="w-full h-full border-0 rounded bg-transparent"
            style={{
              pointerEvents: !interactive ? "none" : isTouchEngaged ? "auto" : "auto",
            }}
          />
        )}

        {/* Mobile "Tap to Interact" Overlay */}
        {interactive && !isTouchEngaged && (
          <button
            type="button"
            onClick={() => setIsTouchEngaged(true)}
            className="md:hidden absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-[11px] text-white/90 backdrop-blur-sm shadow z-20 transition"
          >
            <Hand className="w-3 h-3 text-amber-400" />
            <span>Tap to interact</span>
          </button>
        )}
      </div>
    </div>
  );
}
