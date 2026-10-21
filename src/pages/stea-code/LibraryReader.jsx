import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEntitlements } from "../../services/steaCodeEntitlements.js";
import { getSteaCodeCatalog, getSteaCodeEbookContent } from "../../services/steaCodeCommerce.js";
import { getFirebaseAuth } from "../../firebase.js";
import libraryReaderHtml from "../../components/stea-code/library-reader.html?raw";

/**
 * LibraryReader
 * -------------
 * Route: /library/read/:slug
 *
 * Renders a purchased eBook full-screen, with a fixed top bar (back / title /
 * Download PDF). Users without access see an unlock gate that links to the
 * product detail page.
 *
 * The book HTML comes from the entitlement-gated
 * GET /api/stea-code/products/:id/book-content endpoint. When that endpoint is
 * unreachable — e.g. a worker deployment older than this page — it falls back
 * to the bundled reader shell so existing buyers never lose access.
 *
 * "Download PDF" calls window.print(). The `@media print` block in
 * stea-code-v2.css hides the top bar and chrome so only the book prints; the
 * chapters inside the iframe are part of this document, so they print too.
 */
export default function LibraryReader({ user, authLoading }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState({ hasProLifetime: false, productIds: new Set() });

  // Book payload from the gated endpoint.
  const [bookContentHtml, setBookContentHtml] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  // "bundled" = endpoint unreachable, fall back to the shipped reader shell.
  const [contentSource, setContentSource] = useState("api");
  const [contentState, setContentState] = useState("idle"); // idle|loading|ready|denied
  // Set when the server rejects access, so the gate is authoritative.
  const [serverDenied, setServerDenied] = useState(false);

  const iframeRef = useRef(null);

  // Resolve the product from the catalog by slug.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getSteaCodeCatalog({});
        const list = Array.isArray(data?.products) ? data.products : [];
        const match = list.find(
          (p) => String(p.slug || p.id || "") === String(slug)
        ) || null;
        if (!cancelled) setProduct(match);
      } catch (e) {
        console.warn("[library] catalog lookup failed", e);
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Access check for the signed-in user.
  const effectiveUser = user || getFirebaseAuth()?.currentUser || null;
  useEffect(() => {
    let cancelled = false;
    if (!effectiveUser) {
      setEntitlements({ hasProLifetime: false, productIds: new Set() });
      return;
    }
    fetchEntitlements().then((data) => {
      if (!cancelled) setEntitlements(data);
    });
    return () => { cancelled = true; };
  }, [effectiveUser?.uid]);

  // A book is only premium when it is explicitly flagged premium AND carries
  // a real price. `pricingType: "free"` (or a stale premium flag on a 0-price
  // row) grants instant access — no sign-in, no purchase.
  const isPremium =
    product?.pricingType === "premium" && Number(product?.price || 0) > 0;
  const hasAccess = !serverDenied && (!isPremium || entitlements.hasProLifetime || entitlements.productIds.has(product?.id));

  // Fetch the book immediately — free books need no session, and a paid book
  // answers 401/403, which only locks the reader once Firebase has settled.
  // The effect re-runs when auth resolves so a buyer's token is applied.
  useEffect(() => {
    let cancelled = false;
    if (!product) {
      setContentState("idle");
      return;
    }
    setServerDenied(false);
    // Keep an already-loaded book on screen during the auth-settled refetch.
    setContentState((prev) => (prev === "ready" ? prev : "loading"));
    getSteaCodeEbookContent(slug)
      .then((res) => {
        if (cancelled) return;
        const html = res?.product?.bookContentHtml;
        if (typeof html === "string" && html.trim()) {
          setBookContentHtml(html);
          setContentSource("api");
        } else {
          // Endpoint answered but this book has no chapter HTML stored yet.
          setContentSource("bundled");
        }
        setDownloadUrl(res?.product?.bookDownloadUrl || "");
        setContentState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err?.code || err?.body?.code;
        const status = err?.status;
        // Explicit auth denial from the API — 401/403, or the Worker's named
        // codes. Nothing else is allowed to lock the reader.
        const authBlocked =
          code === "ACCESS_DENIED" ||
          code === "AUTH_REQUIRED" ||
          status === 401 ||
          status === 403;
        if (authBlocked) {
          // Auth is still resolving — wait for it rather than locking the
          // reader; the retry below runs as soon as auth settles.
          if (authLoading) {
            setContentState("idle");
            return;
          }
          setServerDenied(true);
          setContentState("denied");
          return;
        }
        // Endpoint unreachable. A signed-out visitor never gets the shell for a
        // paid book; a signed-in reader keeps the shipped shell usable.
        if (isPremium && !effectiveUser) {
          setContentState("idle");
          return;
        }
        // Keep the shipped reader shell working.
        console.warn("[library] book content unavailable, using bundled reader", err);
        setContentSource("bundled");
        setContentState("ready");
      });
    return () => { cancelled = true; };
  }, [product?.id, slug, authLoading, effectiveUser?.uid, isPremium]);

  const srcDoc = contentSource === "api" && bookContentHtml ? bookContentHtml : libraryReaderHtml;

  // Host → iframe init + iframe → host navigation bridge.
  const sendInit = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        { type: "stea-reader-init", slug, title: product?.titleEn || "STEACODE eBook" },
        "*"
      );
    } catch (_) {}

    // Authored book HTML fits itself on DOMContentLoaded, which can run before
    // the iframe has its final size (it starts at the 150px default). Re-run
    // its fit hook once layout settles so the canvas scales to the real frame
    // instead of staying tiny.
    const refit = () => {
      try {
        win.dispatchEvent(new Event("resize"));
      } catch (_) {}
    };
    requestAnimationFrame(refit);
    setTimeout(refit, 250);
    setTimeout(refit, 800);
  };

  useEffect(() => {
    if (!hasAccess || !product) return;
    sendInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, product?.id, srcDoc]);

  useEffect(() => {
    const handler = (e) => {
      if (!e?.data) return;
      if (e.data.type === "stea-reader-back") {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
      } else if (e.data.type === "stea-reader-finish") {
        navigate("/");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigate]);

  // Direct download when a pre-built PDF/ZIP exists, otherwise print the book.
  const handleDownload = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
      return;
    }
    window.print();
  };

  // White splash — the reader is a light surface, so a dark splash would flash
  // black before the book paints.
  const loadingScreen = (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "grid", placeItems: "center", color: "#111111", font: "600 14px system-ui" }}>
      Loading library…
    </div>
  );

  // Only the catalog lookup blocks the UI. Book content loads independently of
  // Firebase, so a free book paints as soon as its HTML arrives.
  if (loading) return loadingScreen;

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%", background: "#12161f", border: "1px solid #1e2430", borderRadius: 18, padding: 36, textAlign: "center", color: "#e7e9ee" }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>📕</div>
          <h1 style={{ fontSize: 20, marginBottom: 10 }}>Book not found</h1>
          <p style={{ color: "#8b93a3", fontSize: 14, marginBottom: 22 }}>We couldn't find that title in the Library. It may not be published yet.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ width: "100%", padding: "12px 18px", borderRadius: 11, background: "linear-gradient(135deg,#d89a2b,#e0a63c)", color: "#0b0e14", fontWeight: 700, border: 0, cursor: "pointer", fontSize: 14 }}
          >
            Back to the marketplace
          </button>
        </div>
      </div>
    );
  }

  // Book content is not loaded yet: wait while auth resolves, and only show the
  // paywall once the server has actually denied a settled session.
  if (contentState !== "ready") {
    if (authLoading) return loadingScreen;

    if (!hasAccess && (!effectiveUser || contentState === "denied")) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 440, width: "100%", background: "#12161f", border: "1px solid #1e2430", borderRadius: 18, padding: 36, textAlign: "center", color: "#e7e9ee" }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>🔒</div>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>{product.titleEn}</h1>
          <p style={{ color: "#8b93a3", fontSize: 14, marginBottom: 22 }}>
            This eBook is premium content. Unlock it once to read every stage, run the exercises and keep lifetime access.
          </p>
          <div style={{ fontWeight: 800, fontSize: 26, color: "#d89a2b", marginBottom: 22 }}>
            ${Number(product.price) || 50} <span style={{ fontSize: 13, color: "#8b93a3", fontWeight: 600 }}>one-time · lifetime access</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/products/${product.slug || product.id}`)}
            style={{ width: "100%", padding: "12px 18px", borderRadius: 11, background: "linear-gradient(135deg,#d89a2b,#e0a63c)", color: "#0b0e14", fontWeight: 700, border: 0, cursor: "pointer", fontSize: 14, marginBottom: 10 }}
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ width: "100%", padding: "11px 18px", borderRadius: 11, background: "transparent", color: "#8b93a3", fontWeight: 600, border: "1px solid #262d3b", cursor: "pointer", fontSize: 13 }}
          >
            Browse the marketplace
          </button>
        </div>
      </div>
    );
    }

    return loadingScreen;
  }

  return (
    <div
      className="sc-reader-root"
      style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#ffffff", zIndex: 9999 }}
    >
      <div
        className="sc-reader-topbar"
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", color: "#111111" }}
      >
        <button
          type="button"
          className="sc-reader-topbar__back"
          style={{ color: "#111827", background: "#ffffff", borderColor: "#e5e7eb" }}
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        >
          ← Back to Library
        </button>
        <div className="sc-reader-topbar__title" title={product.titleEn}>
          {product.titleEn || "STEACODE eBook"}
        </div>
        <button type="button" className="sc-reader-topbar__download" onClick={handleDownload}>
          Download PDF
        </button>
      </div>
      <div
        className="sc-reader-stage"
        style={{ flex: "1 1 auto", minHeight: 0, position: "relative", background: "#ffffff" }}
      >
        <iframe
          ref={iframeRef}
          title={`Read — ${product.titleEn || "STEACODE eBook"}`}
          srcDoc={srcDoc}
          onLoad={sendInit}
          className="sc-reader-frame"
          style={{ width: "100%", height: "100%", border: "none", background: "#ffffff", display: "block" }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
