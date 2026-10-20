import React, { useEffect, useRef, useState } from "react";
import bookPreviewHtml from "./book-preview.html?raw";
import { getSteaCodeEbookSalesPage } from "../../services/steaCodeCommerce.js";

/**
 * BookProductPreview
 * ------------------
 * Renders an eBook's 3D cover / sales page inside a responsive iframe.
 *
 * The cover HTML comes from the product's `salesPageHtml` column, fetched from
 * the public GET /api/stea-code/products/:id/sales-page endpoint. It is NOT
 * inlined into the catalog because a sales page is ~130KB of HTML and the
 * platform hosts several books — the card grid would balloon.
 *
 * Resolution order:
 *   1. salesPageHtml from the endpoint  — the cover the author pasted.
 *   2. "Preview coming soon" placeholder — the endpoint answered, but this
 *      eBook has no cover authored yet.
 *   3. ./book-preview.html              — the official STEACODE 3D cover,
 *      used only when the endpoint is unreachable (e.g. an older worker
 *      deployment). Without this a network hiccup would blank every card,
 *      so the last known-good cover is preferred over an empty frame.
 *
 * Modes:
 *  - "detail" (default): full sales page (3D book + copy + CTA).
 *  - "card"            : compact crop — only the 3D book fills the frame.
 *    (The official sales page reacts to the `stea-preview-mode` message the
 *     host posts on load and hides its own copy/CTA in card mode.)
 *
 * An author-supplied sales page can post `{ type: "stea-ebook-buy" }` to the
 * host when its CTA is clicked — forwarded to `onBuy`.
 *
 * Props:
 *  - product : the eBook product object
 *  - onBuy   : () => void — fired when the in-page CTA is clicked
 *  - mode    : "detail" | "card"
 *  - className / style : forwarded to the iframe
 */
export default function BookProductPreview({ product, onBuy, mode = "detail", className = "", style, ...rest }) {
  const iframeRef = useRef(null);
  const identity = product?.slug || product?.id || "";
  // "loading" → "ready" (author HTML) | "empty" (no cover) | "offline" (fallback)
  const [state, setState] = useState("loading");
  const [salesPageHtml, setSalesPageHtml] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!identity) {
      setState("empty");
      return;
    }
    setState("loading");
    getSteaCodeEbookSalesPage(identity)
      .then((res) => {
        if (cancelled) return;
        const html = res?.salesPageHtml;
        if (typeof html === "string" && html.trim()) {
          setSalesPageHtml(html);
          setState("ready");
        } else {
          setState("empty");
        }
      })
      .catch(() => {
        if (!cancelled) setState("offline");
      });
    return () => { cancelled = true; };
  }, [identity]);

  const useBundledCover = state === "offline";
  const srcDoc = useBundledCover ? bookPreviewHtml : salesPageHtml;

  // Host → iframe: tell the embedded page which layout mode to use.
  const applyMode = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: "stea-preview-mode", mode }, "*");
    } catch (_) {}
  };

  // iframe → host: forward the "Get the book" CTA.
  useEffect(() => {
    if (typeof onBuy !== "function") return;
    const handler = (event) => {
      if (event?.data && event.data.type === "stea-ebook-buy") {
        onBuy(product);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onBuy, product]);

  // Re-apply mode whenever the srcDoc loads (iframe reload resets body class).
  useEffect(() => {
    applyMode();
    // Mode only matters while mounted; no external deps needed beyond mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, srcDoc]);

  if (state === "loading") {
    // Resolving — keep the frame transparent so the surface beneath shows.
    return (
      <div className={className} style={{ width: "100%", height: "100%", background: "transparent", ...style }} />
    );
  }

  if (state === "empty") {
    return <BookPreviewPlaceholder product={product} className={className} style={style} />;
  }

  return (
    <iframe
      ref={iframeRef}
      title={product?.titleEn || product?.title || "STEACODE eBook"}
      srcDoc={srcDoc}
      className={className}
      onLoad={applyMode}
      style={{
        width: "100%",
        height: "100%",
        minHeight: mode === "card" ? 0 : 300,
        border: "none",
        background: "transparent",
        display: "block",
        // Card previews are purely visual — clicks must pass through to the card.
        pointerEvents: mode === "card" ? "none" : undefined,
        ...style,
      }}
      sandbox="allow-scripts allow-same-origin"
      loading="lazy"
      {...rest}
    />
  );
}

/**
 * Static placeholder shown when an eBook has no cover authored yet.
 */
export function BookPreviewPlaceholder({ product, className = "", style }) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "#f7f7f8",
        color: "#4b5563",
        textAlign: "center",
        padding: 24,
        ...style,
      }}
    >
      <div style={{ fontSize: 30 }} aria-hidden="true">📕</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111111" }}>
        {product?.titleEn || product?.title || "Untitled eBook"}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>Preview coming soon</div>
    </div>
  );
}
