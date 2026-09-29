import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Sparkles, Heart, Star, ArrowUpRight } from "lucide-react";
import LazyImage from "./LazyImage.jsx";
import { getThumbnailImageStyle } from "../utils/thumbnailDisplay.js";
import { useTranslation } from "../i18n/index.js";
import WebsiteIcon from "./sites/WebsiteIcon.jsx";
import { extractHostname } from "./sites/favicon.js";

export function WebsiteImage({ site, style, className, isModal = false }) {
  const title = site.name || site.title || "Untitled Website";
  const firstLetter = (title || "?").charAt(0).toUpperCase();
  const thumbnailStyle = getThumbnailImageStyle(site);

  // ── Priority-ordered image sources ──
  const sources = useMemo(() => {
    const srcList = [];
    // 1. Best quality banner/thumbnail first
    if (site.thumbnailUrl) srcList.push({ src: site.thumbnailUrl, isFavicon: false });
    if (site.bannerUrl)    srcList.push({ src: site.bannerUrl,    isFavicon: false });
    if (site.imageUrl)     srcList.push({ src: site.imageUrl,     isFavicon: false });
    if (site.image)        srcList.push({ src: site.image,        isFavicon: false });
    if (site.coverUrl)     srcList.push({ src: site.coverUrl,     isFavicon: false });
    if (site.logoUrl)      srcList.push({ src: site.logoUrl,      isFavicon: false });
    // 2. Favicon / small icon sources
    if (site.faviconUrl)   srcList.push({ src: site.faviconUrl,   isFavicon: true  });

    let domain = "";
    try {
      const url = site.url || site.websiteUrl || site.link || "";
      if (url) domain = new URL(url).hostname;
    } catch {}

    if (domain) {
      srcList.push({ src: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, isFavicon: true });
      srcList.push({ src: `https://icons.duckduckgo.com/ip3/${domain}.ico`,             isFavicon: true });
    }
    return srcList;
  }, [site]);

  const [imgIndex, setImgIndex] = useState(0);
  useEffect(() => { setImgIndex(0); }, [site]);
  const handleImageError = () => setImgIndex(prev => prev + 1);

  if (imgIndex < sources.length && sources[imgIndex]?.src) {
    const { src, isFavicon } = sources[imgIndex];
    if (isFavicon && isModal) {
      // For hub modal: show favicon centred in a clean card, not stretched
      return (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)"
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden"
          }}>
            <img
              src={src} alt={title}
              loading="lazy"
              decoding="async"
              style={{ width: 56, height: 56, objectFit: "contain" }}
              onError={handleImageError}
            />
          </div>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={title}
        loading={isModal ? "eager" : "lazy"}
        decoding="async"
        className={className}
        style={{
          width: "100%",
          height: "100%",
          objectFit: thumbnailStyle.image.objectFit,
          objectPosition: thumbnailStyle.image.objectPosition,
          transform: thumbnailStyle.image.transform,
          transformOrigin: thumbnailStyle.image.transformOrigin,
          padding: isFavicon ? (isModal ? "15%" : "22%") : "0",
          background: isFavicon ? "#F1F5F9" : "transparent",
          display: "block",
          transition: "transform 220ms ease",
          ...style
        }}
        onError={handleImageError}
      />
    );
  }

  // ── Full fallback ──
  const finalFallbackSize = isModal ? 72 : 52;
  const finalFontSize     = isModal ? 32 : 24;
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isModal
        ? "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)"
        : "#F1F5F9"
    }}>
      <div style={{
        width: finalFallbackSize, height: finalFallbackSize,
        borderRadius: isModal ? 18 : 14,
        background: "linear-gradient(135deg, #F5A623, #FFD17C)",
        display: "grid", placeItems: "center",
        fontSize: finalFontSize, fontWeight: 900, color: "#fff",
        boxShadow: isModal ? "0 4px 24px rgba(245,166,35,0.25)" : "none"
      }}>
        {firstLetter}
      </div>
    </div>
  );
}

function fmtViews(v) {
  if (!v) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return String(v);
}

/**
 * WebsiteSolutionCard — STEA Premium Compact Card
 *
 * Cinematic dark surface card with:
 *  - Subtle border, subtle hover glow
 *  - Top row: Domain + Star Favorite button
 *  - Middle row: WebsiteIcon + Title
 *  - Bottom row: Open arrow ↗
 *  - Consistent across category views, compact listings, and discovery stream
 */
export function WebsiteSolutionCard({
  site,
  isMobile,
  onSelect,
  onOpen,
  onDetails,
  isFavorite,
  onToggleFavorite,
  rank,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!site) return null;

  const title = site.name || site.title || "Untitled Website";
  let domain = site.domain || extractHostname(site.url || site.websiteUrl || site.link || "") || "";
  if (domain.startsWith("www.")) {
    domain = domain.slice(4);
  }

  const isTrusted = Boolean(
    site.isTrusted ||
    site.trusted ||
    site.isPinned ||
    site.pinned ||
    site.featured ||
    site.isFeatured ||
    site.sourceStatus === "official" ||
    site.sourceStatus === "verified" ||
    site.verified ||
    site.isOfficial
  );

  const openDetails = () => {
    if (onDetails || onSelect) {
      (onDetails || onSelect)(site);
      return;
    }
    const slug = site.slug || site.id;
    if (slug) navigate(`/site/${slug}`, { state: { website: site } });
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(site);
    }
  };

  return (
    <div
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetails();
        }
      }}
      role="button"
      tabIndex={0}
      className="stea-website-compact-card stea-btn"
      title={title}
    >
      {/* Top Row: PAID (purple) or FREE (green) pill badge + Star Favorite Button */}
      <div className="stea-card-top-row">
        {isTrusted ? (
          <span className="stea-card-trusted-badge stea-card-badge-paid">PAID</span>
        ) : (
          <span className="stea-card-trusted-badge stea-card-badge-free">FREE</span>
        )}

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? t("buttons.unfavorite", "Remove from Favorites") : t("buttons.saveWebsite", "Save to Favorites")}
          className={`stea-card-star-btn ${isFavorite ? "is-favorite" : ""}`}
        >
          <Star
            size={13}
            fill={isFavorite ? "#F5A623" : "none"}
            stroke={isFavorite ? "#F5A623" : "currentColor"}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Main Center Area: Brand Icon + Title */}
      <div className="stea-card-center">
        <div className="stea-card-brand-display">
          <div className="stea-card-icon-wrap">
            <WebsiteIcon website={site} size={34} />
          </div>
          <h3 className="stea-card-title">{title}</h3>
        </div>
      </div>

      {/* Bottom Row: ↗ domain */}
      <div className="stea-card-bottom-row">
        <span className="stea-card-arrow-icon" aria-hidden="true">↗</span>
        <span className="stea-card-domain-text">{domain || "Visit"}</span>
      </div>

    </div>
  );
}

export default WebsiteSolutionCard;
