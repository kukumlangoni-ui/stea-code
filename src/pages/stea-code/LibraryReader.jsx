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

  const isPremium = product?.pricingType === "premium";
  const hasAccess = !serverDenied && (!isPremium || entitlements.hasProLifetime || entitlements.productIds.has(product?.id));

  // Fetch the book chapters once access is established.
  useEffect(() => {
    let cancelled = false;
    if (!product || !hasAccess) {
      setContentState("idle");
      return;
    }
    setContentState("loading");
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
        if (code === "ACCESS_DENIED" || code === "AUTH_REQUIRED") {
          setServerDenied(true);
          setContentState("denied");
          return;
        }
        // Endpoint unreachable — keep the shipped reader shell working.
        console.warn("[library] book content unavailable, using bundled reader", err);
        setContentSource("bundled");
        setContentState("ready");
      });
    return () => { cancelled = true; };
  }, [product?.id, hasAccess, slug]);

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

  if (loading || authLoading || (hasAccess && (contentState === "idle" || contentState === "loading"))) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0e14", display: "grid", placeItems: "center", color: "#8b93a3", font: "600 14px system-ui" }}>
        Loading library…
      </div>
    );
  }

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

  // Gate: premium book not owned.
  if (!hasAccess) {
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

  return (
    <div className="sc-reader-root" style={{ position: "fixed", inset: 0, background: "#0b0e14", zIndex: 9999 }}>
      <div className="sc-reader-topbar">
        <button
          type="button"
          className="sc-reader-topbar__back"
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
      <div className="sc-reader-stage">
        <iframe
          ref={iframeRef}
          title={`Read — ${product.titleEn || "STEACODE eBook"}`}
          srcDoc={srcDoc}
          onLoad={sendInit}
          className="sc-reader-frame"
          style={{ width: "100%", height: "100%", border: "none", background: "#0b0e14", display: "block" }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
