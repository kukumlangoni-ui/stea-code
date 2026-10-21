import React, { useEffect, useRef, useState } from "react";
import bookPreviewHtml from "./book-preview.html?raw";
import { getSteaCodeEbookSalesPage } from "../../services/steaCodeCommerce.js";

/**
 * BookProductPreview
 * ------------------
 * Renders an eBook's 3D cover / sales page inside a responsive iframe.
 *
 * The cover HTML comes from the product's `salesPageHtml` / `cardCoverHtml`
 * columns, fetched from the public GET /api/stea-code/products/:id/sales-page
 * endpoint. Neither is inlined into the catalog because a sales page is ~130KB
 * of HTML and the platform hosts several books — the card grid would balloon.
 *
 * Choosing a document:
 *   - mode="card"   → `cardCoverHtml` when the author has pasted one (a
 *     standalone 3D book, so nothing has to be cropped host-side), otherwise
 *     `salesPageHtml` as before.
 *   - mode="detail" → always `salesPageHtml` (the full landing page).
 *
 * Resolution order:
 *   1. The chosen document from the endpoint — what the author pasted.
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
  const [cardCoverHtml, setCardCoverHtml] = useState("");

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
        const page = typeof res?.salesPageHtml === "string" ? res.salesPageHtml : "";
        const card = typeof res?.cardCoverHtml === "string" ? res.cardCoverHtml : "";
        setSalesPageHtml(page);
        setCardCoverHtml(card);
        if (page.trim() || card.trim()) {
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

  // The card prefers the standalone cover; the modal always gets the full sales
  // page. Evaluated at render time so switching `mode` picks the other document
  // without refetching.
  const chosenHtml = mode === "card" && cardCoverHtml.trim() ? cardCoverHtml : salesPageHtml;
  const useBundledCover = state === "offline";
  const srcDoc = useBundledCover ? bookPreviewHtml : chosenHtml;

  // Host → iframe: tell the embedded page which layout mode to use, and force the
  // mode if the cover does not listen for the message.
  //
  // Not every authored cover handles `stea-preview-mode`. The STEACODE covers
  // detect the card themselves with a viewport heuristic (roughly
  // `innerWidth < 640 || innerHeight < 520`) and only re-run their sizing on a
  // window `resize`. Inside a card frame both can misfire in ways that crop the
  // book: the heuristic can pick the full sales-page layout, and a `fit()` that
  // measured before layout settled keeps a stale, too-large scale — which shows
  // up as the book running past the right/bottom edge of the card.
  //
  // So after the message: mirror the mode onto the document classes those covers
  // key off, then dispatch `resize` so any resize-bound `fit()` re-measures
  // against the settled layout. All of it is inside one try/catch because a cover
  // served from another origin would make `contentDocument` throw.
  const applyMode = () => {
    const frame = iframeRef.current;
    const win = frame?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: "stea-preview-mode", mode }, "*");
    } catch (_) {}
    try {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      const card = mode === "card";
      doc.documentElement.classList.toggle("card", card);
      doc.documentElement.classList.toggle("modal", !card);
      if (doc.body) {
        doc.body.classList.toggle("mode-card", card);
        doc.body.classList.toggle("mode-detail", !card);
      }
      win.dispatchEvent(new Event("resize"));
      // A cover usually exposes its own fit() — the STEACODE covers publish it as
      // `window.__fit`, authored ones as a top-level `function fit()`. Calling it
      // directly is stronger than relying on the `resize` listener above, because
      // several authored covers never register one. `win.fit` is guarded by the
      // typeof check so an unrelated global of that name is not invoked.
      const refit = win.__fit || win.fit;
      if (typeof refit === "function") refit.call(win);
    } catch (_) {
      /* cross-origin cover — the postMessage above is all we can do */
    }
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

  // The grid reflows the card after load (breakpoints, sidebar, font swap), which
  // changes the iframe's viewport. A cover that measured itself once keeps the
  // old scale, so re-apply whenever the frame actually changes size. The iframe is
  // sized 100% by CSS, so content cannot feed back into this observer.
  useEffect(() => {
    const el = iframeRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => applyMode());
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, srcDoc]);

  if (state === "loading") {
    // Resolving — keep the frame transparent so the surface beneath shows.
    return (
      <div className={className} style={{ width: "100%", height: "100%", background: "transparent", ...style }} />
    );
  }

  // No document for THIS mode → placeholder. Covers both "author pasted
  // nothing" and "author pasted only a card cover, this is the modal".
  if (state === "empty" || (state === "ready" && !chosenHtml.trim())) {
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
