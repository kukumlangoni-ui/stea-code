import React, { useEffect, useRef } from "react";
import bookPreviewHtml from "./book-preview.html?raw";

/**
 * BookProductPreview
 * ------------------
 * Renders the STEACODE eBook 3D sales page (white background) inside a
 * responsive iframe via srcDoc. The iframe background is transparent so it
 * blends seamlessly with the white marketplace surfaces.
 *
 * Modes:
 *  - "detail" (default): full sales page (3D book + copy + CTA).
 *  - "card"            : compact crop — only the 3D book fills the frame.
 *
 * The embedded page posts a `{ type: "stea-ebook-buy" }` message to the host
 * when the "Get the book" CTA is clicked — forwarded to `onBuy`.
 *
 * Props:
 *  - product : the eBook product object (tab === "library")
 *  - onBuy   : () => void — fired when the in-page CTA is clicked
 *  - mode    : "detail" | "card"
 *  - className / style : forwarded to the iframe
 */
export default function BookProductPreview({ product, onBuy, mode = "detail", className = "", style, ...rest }) {
  const iframeRef = useRef(null);

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
  }, [mode]);

  return (
    <iframe
      ref={iframeRef}
      title={product?.titleEn || product?.title || "STEACODE eBook"}
      srcDoc={bookPreviewHtml}
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
