import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../../../components/SEO.jsx";
import {
  getSteaCodeProduct,
  getSteaCodeEbookContent,
} from "../../../services/steaCodeCommerce.js";
import { getCloudflareLoginUrl } from "../../../hooks/useCloudflareAuth.js";
import "./store.css";

/**
 * StoreReaderPage — /store/read/:slug
 *
 * Clean, distraction-free in-app reader for eBooks / Notes / Cheat Sheets.
 * The chapter HTML comes from the entitlement-gated
 * GET /api/stea-code/products/:id/book-content endpoint — free books load
 * without a session, paid books answer 401/403 and get the unlock gate.
 *
 * "Download PDF for Premium" hits GET /api/download/:id on the Worker, which
 * verifies the Cloudflare Access cookie and the purchases table before
 * returning the R2 file. When the product has no R2 package (NO_PACKAGE) but
 * an author-uploaded `bookDownloadUrl`, that URL is used instead.
 */
export default function StoreReaderPage({ user, authLoading }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // idle | loading | ready | denied | empty
  const [contentState, setContentState] = useState("idle");
  const [bookHtml, setBookHtml] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState("");

  // Resolve the product (endpoint accepts slug OR id).
  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setNotFound(false);
    (async () => {
      try {
        const doc = await getSteaCodeProduct(slug);
        if (!cancelled) setProduct(doc || null);
        if (!cancelled && !doc) setNotFound(true);
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404) setNotFound(true);
        else setNotFound(true); // a reader without a product is a dead end either way
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Fetch the book once the product is known; re-run when auth settles so a
  // buyer's Access cookie is applied on the retry.
  useEffect(() => {
    let cancelled = false;
    if (!product) return;

    setContentState((prev) => (prev === "ready" ? prev : "loading"));

    getSteaCodeEbookContent(slug)
      .then((res) => {
        if (cancelled) return;
        const html = res?.product?.bookContentHtml;
        setBookHtml(typeof html === "string" && html.trim() ? html : "");
        setDownloadUrl(res?.product?.bookDownloadUrl || "");
        setContentState(typeof html === "string" && html.trim() ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err?.code;
        const status = err?.status;
        const authBlocked =
          code === "ACCESS_DENIED" ||
          code === "AUTH_REQUIRED" ||
          status === 401 ||
          status === 403;
        if (authBlocked) {
          // Auth still resolving — wait rather than flashing the gate.
          if (authLoading) {
            setContentState("idle");
            return;
          }
          setContentState("denied");
          return;
        }
        console.warn("[store-reader] book content unavailable", err);
        setContentState("empty");
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, slug, authLoading, user?.email]);

  // Auto-dismiss transient notices (download errors etc.).
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const title = product?.titleEn || product?.title || "STEACODE eBook";

  /**
   * Download PDF — hits the Worker route /api/download/:id, which keeps the
   * email sign-in gate server-side but no longer checks purchases.
   * A same-origin fetch carries the cookie automatically; on 401 we send the
   * user through the Access login and straight back here.
   */
  const handleDownload = async () => {
    if (!product || downloading) return;
    setDownloading(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/download/${encodeURIComponent(product.id)}`,
        { headers: { Accept: "*/*" } }
      );

      if (response.status === 401) {
        window.location.assign(getCloudflareLoginUrl(window.location.href));
        return;
      }
      if (response.status === 403) {
        setNotice("Please sign in with your email to download the PDF.");
        return;
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || contentType.includes("application/json")) {
        const data = await response.json().catch(() => ({}));
        // No R2 package — fall back to the author-uploaded PDF/ZIP URL.
        if (data?.code === "NO_PACKAGE" && downloadUrl) {
          window.location.assign(downloadUrl);
          return;
        }
        throw new Error(data?.error || "Download failed. Please try again.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `${product.slug || product.id}.pdf`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      setNotice(err?.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (notFound) {
    return (
      <div className="store-root">
        <div className="store-gate" style={{ minHeight: "100vh" }}>
          <div className="store-gate__card">
            <div className="store-gate__icon">📕</div>
            <h1 className="store-gate__title">Book not found</h1>
            <p className="store-gate__sub">
              We couldn't find that title. It may not be published yet.
            </p>
            <div className="store-gate__actions">
              <button type="button" className="store-btn store-btn--primary" onClick={() => navigate("/store")}>
                Back to the Bookstore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still resolving product / content / auth.
  if (!product || contentState === "idle" || contentState === "loading" || (authLoading && contentState !== "ready")) {
    return (
      <div className="store-root">
        <div className="store-splash">Opening your book…</div>
      </div>
    );
  }

  // Premium gate — the server denied a settled session.
  if (contentState === "denied") {
    return (
      <div className="store-root">
        <SEO title={`${title} — Locked — STEACODE Bookstore`} />
        <div className="store-gate" style={{ minHeight: "100vh" }}>
          <div className="store-gate__card">
            <div className="store-gate__icon">🔒</div>
            <h1 className="store-gate__title">{title}</h1>
            <p className="store-gate__sub">
              Sign in with your email to read every chapter and download the PDF.
            </p>
            <div className="store-gate__actions">
              {!user && (
                <a className="store-btn store-btn--ghost" href={getCloudflareLoginUrl(window.location.href)}>
                  Sign in to continue
                </a>
              )}
              <button
                type="button"
                className="store-btn store-btn--primary"
                onClick={() => navigate(`/store/${product.slug || product.id}`)}
              >
                View the Book
              </button>
              <button type="button" className="store-btn store-btn--ghost" onClick={() => navigate("/store")}>
                Browse the Bookstore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Endpoint answered but no chapter HTML is stored for this product yet.
  if (contentState === "empty") {
    return (
      <div className="store-root">
        <div className="store-gate" style={{ minHeight: "100vh" }}>
          <div className="store-gate__card">
            <div className="store-gate__icon">🚧</div>
            <h1 className="store-gate__title">{title}</h1>
            <p className="store-gate__sub">
              The in-browser edition of this title isn't ready yet. Please check back soon.
            </p>
            <div className="store-gate__actions">
              <button
                type="button"
                className="store-btn store-btn--primary"
                onClick={() => navigate(`/store/${product.slug || product.id}`)}
              >
                Back to the Sales Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-root">
      <SEO title={`Reading — ${title} — STEACODE Bookstore`} />
      <div className="store-reader">
        <div className="store-reader__topbar">
          <button
            type="button"
            className="store-reader__back"
            onClick={() => {
              // Step back through history (sales → reader); fall back to the
              // book's sales page for direct/deep-link visits.
              if (window.history.length > 1) navigate(-1);
              else navigate(`/store/${product.slug || product.id}`);
            }}
          >
            ← Store
          </button>
          <div className="store-reader__title" title={title}>{title}</div>
          <button
            type="button"
            className="store-reader__download"
            onClick={handleDownload}
            disabled={downloading}
            title="Download the PDF"
          >
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>

        <div className="store-reader__stage">
          <iframe
            className="store-reader__frame"
            title={`Read — ${title}`}
            srcDoc={bookHtml}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
          {notice && (
            <div className="store-reader__notice" role="status">{notice}</div>
          )}
        </div>
      </div>
    </div>
  );
}
