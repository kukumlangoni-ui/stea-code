import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSteaCodeCatalog } from "../../../services/steaCodeCommerce.js";

/**
 * StoreBookGrid
 * -------------
 * Fetches every eBook / Notes / Cheat Sheet product
 * (`productType` ∈ 'ebook' | 'note' | 'cheatsheet', or the legacy `tab:
 * 'library'` flag) and renders it as a physical 3D book.
 *
 * The 3D effect lives in store.css: the cover rests at
 * `perspective(1000px) rotateY(-15deg)` with a box-shadow spine, and rotates
 * to `rotateY(0deg) scale(1.05)` on hover.
 *
 * Covers: when the product carries a real image (`coverImageUrl` /
 * `coverImage` / `imageUrl`) it is used as-is. Otherwise a flat-vector cover
 * is generated from the product type so the grid never shows a broken image.
 */

const STORE_PRODUCT_TYPES = ["ebook", "note", "cheatsheet"];

const TYPE_LABELS = {
  ebook: "E-Book",
  note: "Notes",
  cheatsheet: "Cheat Sheet",
};

/* Flat-vector cover palettes, one per product type. */
const COVER_THEMES = {
  ebook: { bg: "#D94226", fg: "#F7EFD8", shape: "#1A1A1A" },
  note: { bg: "#1A1A1A", fg: "#E5C85A", shape: "#D94226" },
  cheatsheet: { bg: "#F7EFD8", fg: "#1A1A1A", shape: "#D94226" },
};
const DEFAULT_THEME = { bg: "#D94226", fg: "#F7EFD8", shape: "#1A1A1A" };

export function getStoreProductType(product) {
  const type = String(product?.productType || "").trim().toLowerCase();
  if (STORE_PRODUCT_TYPES.includes(type)) return type;
  // Legacy rows predate productType but are flagged as library items.
  if (product?.tab === "library") return "ebook";
  return null;
}

export function getStoreCoverUrl(product) {
  const candidates = [
    product?.coverImageUrl,
    product?.coverImage,
    product?.imageUrl,
    product?.thumbnailUrl,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function getStoreTypeLabel(product) {
  const type = getStoreProductType(product);
  return TYPE_LABELS[type] || "Book";
}

export function getStorePriceLabel() {
  return "Free";
}

/**
 * The 3D book itself. Purely presentational — the parent supplies the click
 * target (the grid card wraps it in a <button>).
 *
 * `size` controls the rendered width via --book-w (grid: 220px, sales: 320px).
 */
export function StoreBook3D({ product, size = "grid" }) {
  const type = getStoreProductType(product) || "ebook";
  const theme = COVER_THEMES[type] || DEFAULT_THEME;
  const coverUrl = getStoreCoverUrl(product);
  const title = product?.titleEn || product?.title || "Untitled";
  const width = size === "sales" ? 320 : 220;

  const themeVars = {
    "--book-w": `${width}px`,
    "--cover-bg": theme.bg,
    "--cover-fg": theme.fg,
    "--cover-shape": theme.shape,
  };

  return (
    <div className="store-book" style={themeVars} aria-hidden="true">
      <div className="store-book__inner">
        {/* Back cover */}
        <div className="store-book__face store-book__back" />

        {/* Spine (left plane) — the box-shadow in store.css is what sells the
            physical depth here */}
        <div className="store-book__spine">
          <span className="store-book__spine-title">{title}</span>
        </div>

        {/* Page block (right + top planes) */}
        <div className="store-book__pages" />
        <div className="store-book__pages-top" />

        {/* Front cover */}
        <div className="store-book__face store-book__cover">
          {coverUrl ? (
            <img className="store-book__cover-img" src={coverUrl} alt="" loading="lazy" />
          ) : (
            <div className="store-book__art">
              <span className="store-book__art-circle" />
              <span className="store-book__art-half" />
              <span className="store-book__art-bars"><i /><i /><i /></span>
              <span className="store-book__type">{TYPE_LABELS[type] || "Book"}</span>
              <strong className="store-book__title">{title}</strong>
              <span className="store-book__brand">STEACODE</span>
            </div>
          )}
          <span className="store-book__glare" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <li className="store-card">
      <div className="store-skeleton-book" />
      <div className="store-skeleton-line store-skeleton-line--short" />
      <div className="store-skeleton-line store-skeleton-line--long" />
      <div className="store-skeleton-line store-skeleton-line--short" />
    </li>
  );
}

export default function StoreBookGrid() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSteaCodeCatalog({});
        if (cancelled) return;
        const list = Array.isArray(data?.products) ? data.products : [];
        setProducts(list.filter((p) => getStoreProductType(p)));
      } catch (err) {
        if (cancelled) return;
        console.warn("[store] catalog fetch failed", err);
        setError(err?.message || "The bookstore could not be loaded.");
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="store-state">
        <div className="store-state__icon">📡</div>
        <h2 className="store-state__title">The shelves didn't load</h2>
        <p className="store-state__sub">{error}</p>
        <button type="button" className="store-btn store-btn--primary" onClick={() => { setError(""); setProducts(null); setReloadKey((k) => k + 1); }}>
          Try again
        </button>
      </div>
    );
  }

  if (!products) {
    return (
      <ul className="store-grid store-grid--skeleton" aria-busy="true" aria-label="Loading books">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
      </ul>
    );
  }

  if (!products.length) {
    return (
      <div className="store-state">
        <div className="store-state__icon">📚</div>
        <h2 className="store-state__title">The shelves are being stocked</h2>
        <p className="store-state__sub">
          New e-books, notes and cheat sheets are on the way. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <ul className="store-grid">
      {products.map((product) => {
        const slug = product.slug || product.id;
        const title = product.titleEn || product.title || "Untitled";
        const isFree = true;
        return (
          <li key={product.id || slug} className="store-card">
            <button
              type="button"
              className="store-card__hit"
              onClick={() => navigate(`/store/${slug}`)}
              aria-label={`${title} — ${getStoreTypeLabel(product)}, ${getStorePriceLabel(product)}`}
            >
              <StoreBook3D product={product} />
            </button>
            <div className="store-card__meta">
              <span className="store-card__type">{getStoreTypeLabel(product)}</span>
              <h3 className="store-card__title">{title}</h3>
              <div className="store-card__row">
                <span className={`store-card__price${isFree ? " store-card__price--free" : ""}`}>
                  {getStorePriceLabel(product)}
                </span>
                <span className="store-card__cta">View →</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
