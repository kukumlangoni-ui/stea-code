import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile.js";
import LazyImage from "./LazyImage.jsx";

const ACCENT = "#F5A623";

export function pickMarketplaceImage(product) {
  if (!product || typeof product !== "object") return null;
  if (product.thumbnail) return String(product.thumbnail);
  const imgs = product.images;
  if (Array.isArray(imgs) && imgs.length > 0) return String(imgs[0]);
  if (product.imageUrl) return String(product.imageUrl);
  if (product.image) return String(product.image);
  return null;
}

function fmtPriceTz(n) {
  if (n === undefined || n === null || n === "") return "Piga Simu";
  const num = Number(String(n).replace(/\D/g, ""));
  if (Number.isNaN(num) || num === 0) return String(n);
  return `${num.toLocaleString()} TZS`;
}

/** 
 * Reusable Premium Ecommerce Product Card 
 * Tanzania (STEA Duka) + China (Agiza China)
 */
export function MarketplaceProductCard({ product, onClick, onBuyNow, type }) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [imgErr, setImgErr] = useState(false);

  const isChina = type === "china" || !!(product?.isChabaData || product?.market === "china");
  const name = product?.name || product?.title || "Product";
  let imageUrl = pickMarketplaceImage(product);
  if (imgErr) imageUrl = null;

  const categoryRaw = (product?.category || "").replace(/-/g, " ").trim();
  const categoryBadge = categoryRaw.length > 16 ? `${categoryRaw.slice(0, 15)}…` : categoryRaw;

  let priceLabel = "";
  let oldLabel = null;
  let discountPct = null;

  if (isChina) {
    const ship = Number(product?.base_price ?? product?.price ?? 0);
    const gp = Number(product?.groupPrice || 0);
    if (gp > 0) {
      priceLabel = fmtPriceTz(gp);
      oldLabel = fmtPriceTz(ship);
    } else {
      priceLabel = fmtPriceTz(ship);
      const op = product?.oldPrice ?? product?.originalPrice ?? product?.compareAtPrice ?? null;
      if (op != null && Number(op) > ship) oldLabel = fmtPriceTz(op);
    }
    const d = product?.discount_percent ?? product?.discount;
    if (d && Number(d) > 0) discountPct = Math.round(Number(d));
  } else {
    const base = product?.base_price ?? product?.price ?? product?.priceTzs ?? product?.salePrice ?? 0;
    const hasDiscountField = product?.discountPrice != null && product?.discountPrice !== "";
    const display = hasDiscountField ? product.discountPrice : base;
    priceLabel = fmtPriceTz(display);
    if (hasDiscountField && product?.price != null) {
      oldLabel = fmtPriceTz(product.price);
    } else {
      const op = product?.oldPrice ?? product?.originalPrice ?? product?.compareAtPrice ?? null;
      if (op != null) oldLabel = fmtPriceTz(op);
    }
    const dn = Number(String(display).replace(/\D/g, ""));
    const rawOldForPct = hasDiscountField ? product?.price : product?.oldPrice ?? product?.originalPrice ?? product?.compareAtPrice;
    const on = Number(String(rawOldForPct ?? "").replace(/\D/g, ""));
    if (!Number.isNaN(dn) && !Number.isNaN(on) && on > dn && dn > 0) {
      discountPct = Math.round((1 - dn / on) * 100);
    }
  }

  const outOfStock = product?.inStock === false;
  const sellerName = product?.sellerBusinessName || product?.sellerName || product?.location || null;

  const goCheckout = () => {
    if (isChina) {
      navigate(`/chaba/checkout/${product.id}`);
      return;
    }
    if (typeof onClick === "function") {
      onClick(product);
      return;
    }
    if (typeof onBuyNow === "function") {
      onBuyNow(product);
      return;
    }
    navigate(`/marketplace/checkout/${product.id}`, { state: { product } });
  };

  const onActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    goCheckout();
  };

  const actionLabel = isChina ? "Agiza" : "Buy Now";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goCheckout}
      
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goCheckout();
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        cursor: "pointer",
        position: "relative",
        background: "var(--home-surface, #ffffff)",
        boxShadow: "0 14px 34px rgba(15,23,42,.06)",
        transition: "transform 0.2s, box-shadow 0.2s",
        fontFamily: "'Instrument Sans', system-ui, sans-serif"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${ACCENT}30`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image Area - Square aspect ratio */}
      <div style={{
        width: "100%",
        aspectRatio: "1 / 1",
        background: "var(--home-alpha-04, #f8f9fa)",
        position: "relative",
        overflow: "hidden"
      }}>
        {imageUrl ? (
          <LazyImage
            src={imageUrl}
            alt={name}
            className="card-image-lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.1, fontSize: isMobile ? 40 : 60 }}>
            🛍️
          </div>
        )}

        {/* Floating Badges */}
        {discountPct != null && discountPct > 0 && (
          <div style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#EF4444",
            color: "var(--home-text, #0f172a)",
            fontSize: 10,
            fontWeight: 900,
            padding: "4px 8px",
            borderRadius: 6,
            letterSpacing: ".02em",
            boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
            zIndex: 2
          }}>
            -{discountPct}%
          </div>
        )}

        {product?.sellerVerified && (
          <div style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(16,185,129,0.9)",
            color: "var(--home-text, #0f172a)",
            fontSize: 9,
            fontWeight: 800,
            padding: "3px 6px",
            borderRadius: 6,
            zIndex: 2,
            backdropFilter: "blur(4px)"
          }}>
            VERIFIED
          </div>
        )}

        {outOfStock && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)", zIndex: 10
          }}>
            <span style={{
              background: "#333", color: "var(--home-text, #0f172a)",
              padding: "6px 12px", borderRadius: 8,
              fontSize: 12, fontWeight: 800, textTransform: "uppercase"
            }}>
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div style={{ padding: isMobile ? "8px 10px 12px" : "12px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        {categoryBadge && (
          <span style={{
            display: "inline-block",
            fontSize: isMobile ? 8 : 10,
            fontWeight: 800,
            color: "rgba(255,255,255,.3)",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 2
          }}>
            {categoryBadge}
          </span>
        )}

        <h3 style={{
          fontSize: isMobile ? 12 : 14,
          fontWeight: 800,
          color: "var(--home-text, #0f172a)",
          margin: "0 0 4px",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {name}
        </h3>

        {sellerName && (
          <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ display: "inline-block", maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {sellerName}
            </span>
          </p>
        )}

        {/* Price Row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto", paddingTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: ACCENT }}>
            {priceLabel}
          </span>
          {oldLabel && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.3)", textDecoration: "line-through" }}>
              {oldLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
