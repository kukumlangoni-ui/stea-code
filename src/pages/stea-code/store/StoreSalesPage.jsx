import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../../../components/SEO.jsx";
import {
  getSteaCodeProduct,
  getSteaCodeEbookSalesPage,
} from "../../../services/steaCodeCommerce.js";
import {
  StoreBook3D,
  getStoreTypeLabel,
  getStorePriceLabel,
  getStoreProductType,
} from "../../../components/stea-code/store/StoreBookGrid.jsx";
import "./store.css";

/**
 * StoreSalesPage — /store/:slug
 *
 * Product detail ("sales page") for one eBook / Notes / Cheat Sheet:
 *   left   — the large 3D book cover
 *   right  — title, price (USD), red "Buy Now" and "Read Sample"
 *   below  — the free sample, rendered in a viewer
 *
 * Sample source, in order:
 *   1. `samplePdfUrl` on the product (rendered directly in the iframe)
 *   2. the product's public `salesPageHtml` (GET /products/:id/sales-page) —
 *      the author-published preview document
 * If neither exists the sample section is hidden and the button disabled.
 *
 * "Buy Now" hands off to the existing /products/:slug detail page, which owns
 * the checkout modal — one checkout flow, no duplication.
 */
export default function StoreSalesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const sampleRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [sampleHtml, setSampleHtml] = useState("");
  const [sampleLoaded, setSampleLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setNotFound(false);
    setError("");
    setSampleHtml("");
    setSampleLoaded(false);

    (async () => {
      try {
        const doc = await getSteaCodeProduct(slug);
        if (cancelled) return;
        if (!doc || !getStoreProductType(doc)) {
          // Exists but isn't a bookstore product → send to the normal page.
          if (doc && (doc.slug || doc.id)) {
            navigate(`/products/${doc.slug || doc.id}`, { replace: true });
            return;
          }
          setNotFound(true);
          return;
        }
        setProduct(doc);
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404) setNotFound(true);
        else setError(err?.message || "This book could not be loaded.");
      }
    })();

    return () => { cancelled = true; };
  }, [slug, navigate]);

  // Load the sample lazily once the product is known.
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    getSteaCodeEbookSalesPage(product.slug || product.id)
      .then((res) => {
        if (cancelled) return;
        const html = typeof res?.salesPageHtml === "string" ? res.salesPageHtml : "";
        setSampleHtml(html.trim() ? html : "");
      })
      .catch(() => { /* sample is optional — never break the page */ })
      .finally(() => { if (!cancelled) setSampleLoaded(true); });
    return () => { cancelled = true; };
  }, [product?.id]);

  if (notFound) {
    return (
      <div className="store-root">
        <div className="store-gate" style={{ minHeight: "100vh" }}>
          <div className="store-gate__card">
            <div className="store-gate__icon">📕</div>
            <h1 className="store-gate__title">Book not found</h1>
            <p className="store-gate__sub">
              We couldn't find that title in the bookstore. It may have been unpublished.
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

  if (error) {
    return (
      <div className="store-root">
        <div className="store-gate" style={{ minHeight: "100vh" }}>
          <div className="store-gate__card">
            <div className="store-gate__icon">📡</div>
            <h1 className="store-gate__title">Something went wrong</h1>
            <p className="store-gate__sub">{error}</p>
            <div className="store-gate__actions">
              <button type="button" className="store-btn store-btn--primary" onClick={() => window.location.reload()}>
                Retry
              </button>
              <button type="button" className="store-btn store-btn--ghost" onClick={() => navigate("/store")}>
                Back to the Bookstore
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="store-root">
        <div className="store-splash">Opening the book…</div>
      </div>
    );
  }

  const title = product.titleEn || product.title || "Untitled";
  const samplePdfUrl = typeof product.samplePdfUrl === "string" && product.samplePdfUrl.trim()
    ? product.samplePdfUrl.trim()
    : "";
  const hasSample = Boolean(samplePdfUrl || sampleHtml);
  const description =
    (typeof product.description === "string" && product.description.trim()) ||
    (typeof product.subtitleEn === "string" && product.subtitleEn.trim()) ||
    "A STEACODE title. Read it in your browser, download the PDF, and keep lifetime access.";

  const scrollToSample = () => {
    sampleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="store-root">
      <SEO
        title={`${title} — STEACODE Bookstore`}
        description={description.slice(0, 155)}
      />

      <button
        type="button"
        className="store-backlink"
        onClick={() => {
          // Step back through history (grid → sales); fall back to the store
          // grid for direct/deep-link visits with nothing to go back to.
          if (window.history.length > 1) navigate(-1);
          else navigate("/store");
        }}
      >
        ← Back to the Bookstore
      </button>

      <main className="store-sales">
        <div className="store-sales__grid">
          {/* Left — the large 3D cover */}
          <div className="store-sales__book">
            <StoreBook3D product={product} size="sales" />
          </div>

          {/* Right — title, price, actions */}
          <div>
            <span className="store-sales__type">{getStoreTypeLabel(product)}</span>
            <h1 className="store-sales__title">{title}</h1>
            <p className="store-sales__desc">{description}</p>

            <div className="store-sales__price">
              <span className="store-sales__price-value">{getStorePriceLabel(product)}</span>
              <span className="store-sales__price-note">
                free forever · sign in with your email to read
              </span>
            </div>

            <div className="store-sales__actions">
              <button
                type="button"
                className="store-btn store-btn--primary"
                onClick={() => navigate(`/store/read/${product.slug || product.id}`)}
              >
                Read Now — Free
              </button>
              <button
                type="button"
                className="store-btn store-btn--ghost"
                onClick={scrollToSample}
                disabled={sampleLoaded && !hasSample}
                title={sampleLoaded && !hasSample ? "No sample published yet" : undefined}
              >
                Read Sample
              </button>
            </div>

            <ul className="store-sales__perks">
              <li>Read instantly in your browser</li>
              <li>Downloadable PDF</li>
              <li>Lifetime access, including updates</li>
            </ul>
          </div>
        </div>

        {/* Below — the sample viewer */}
        {hasSample && (
          <section className="store-sample" ref={sampleRef} aria-label="Free sample">
            <div className="store-sample__heading">
              <h2 className="store-sample__title">Read a free sample</h2>
              <span className="store-sample__hint">
                The whole book is free — this is the full preview.
              </span>
            </div>
            <div className="store-sample__frame-wrap">
              {samplePdfUrl ? (
                <iframe
                  className="store-sample__frame"
                  title={`Sample — ${title}`}
                  src={samplePdfUrl}
                />
              ) : (
                <iframe
                  className="store-sample__frame"
                  title={`Sample — ${title}`}
                  srcDoc={sampleHtml}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
