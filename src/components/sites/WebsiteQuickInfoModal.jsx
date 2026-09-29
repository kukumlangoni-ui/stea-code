/**
 * WebsiteQuickInfoModal — Premium Compact Website Command & Info Modal
 *
 * Designed to replace the old full-page detail navigation for website card clicks.
 * Fits within ~460px width, keeping the user in discovery context without refetching.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Star, ExternalLink, Share2, Copy, Check, X, ShieldCheck } from "lucide-react";
import WebsiteIcon from "./WebsiteIcon.jsx";
import { useTranslation } from "../../i18n/index.js";
import { getWebsiteCategoryLabel } from "../../data/websiteCategories.js";
import { normalizeWebsiteCategorySlug } from "../../constants/categoryOrder.js";

function toStoredWebsite(site) {
  if (!site?.id) return null;
  return {
    websiteId: site.id,
    title: site.name || site.title || "Untitled Website",
    image: site.thumbnailUrl || site.bannerUrl || site.imageUrl || site.image || site.coverUrl || site.logoUrl || "",
    url: site.url || site.link || site.websiteUrl || "",
    category: site.category || "",
    savedAt: Date.now(),
  };
}

function rememberWebsite(site) {
  try {
    const stored = toStoredWebsite(site);
    if (!stored) return;
    const raw = localStorage.getItem("stea_recent_websites");
    const existing = raw ? JSON.parse(raw) : [];
    const next = [stored, ...existing.filter((item) => item.websiteId !== stored.websiteId)].slice(0, 12);
    localStorage.setItem("stea_recent_websites", JSON.stringify(next));
  } catch {}
}

export default function WebsiteQuickInfoModal({
  site,
  onClose,
  onToggleFavorite,
  isFavorite = false,
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!site) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [site, onClose]);

  // Lock body scroll while the modal is open, and restore exactly what was
  // there before (setting "visible" used to fight the sites shell's own CSS).
  useEffect(() => {
    if (!site) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [site]);

  if (!site) return null;

  const title = site.name || site.title || "Untitled Website";
  const rawUrl = site.url || site.websiteUrl || site.link || "";
  const targetUrl = rawUrl.startsWith("http") ? rawUrl : (rawUrl ? `https://${rawUrl}` : "");

  let domain = "";
  try {
    if (targetUrl) domain = new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = site.domain || rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }

  const categorySlug = normalizeWebsiteCategorySlug(site.category || site.categorySlug || "");
  const categoryLabel = getWebsiteCategoryLabel(categorySlug) || site.category || "General";
  const desc = site.description || site.desc || "Explore this curated website on STEA.";
  const isPaid = Boolean(
    site.isPaid ||
    site.pricing === "Paid" ||
    site.pricing === "Subscription" ||
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
  const pricingTag = site.pricing || site.pricingType || "";

  const canonicalSteaUrl = typeof window !== "undefined"
    ? `${window.location.origin}/site/${site.slug || site.id}`
    : `https://stea.africa/site/${site.slug || site.id}`;

  const handleOpenExternal = () => {
    rememberWebsite(site);
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalSteaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = canonicalSteaUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} on STEA`,
          text: desc,
          url: canonicalSteaUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
      setShareFeedback("Link copied!");
      setTimeout(() => setShareFeedback(""), 2000);
    }
  };

  const handleFavClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite(site);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="stea-quick-info-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-info-title"
    >
      <div className="stea-quick-info-modal">
        {/* Close Button */}
        <button
          type="button"
          className="stea-quick-info-close-btn"
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>

        {/* Brand Display (Icon, Title, Domain) */}
        <div className="stea-quick-info-head">
          <div className="stea-quick-info-icon-wrap">
            <WebsiteIcon website={site} size={48} />
          </div>
          <h2 id="quick-info-title" className="stea-quick-info-title">{title}</h2>
          <span className="stea-quick-info-domain">{domain || "External website"}</span>
        </div>

        {/* Badges / Meta Strip */}
        <div className="stea-quick-info-badges">
          <span className={`stea-quick-badge ${isPaid ? "stea-quick-badge-paid" : "stea-quick-badge-free"}`}>
            <ShieldCheck size={11} strokeWidth={2.5} />
            <span>{isPaid ? "PAID" : "FREE"}</span>
          </span>
          <span className="stea-quick-badge stea-quick-badge-category">
            {categoryLabel}
          </span>
          {pricingTag && (
            <span className="stea-quick-badge stea-quick-badge-pricing">
              {pricingTag}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="stea-quick-info-desc">
          {desc}
        </p>

        {/* Primary Action: Open Website */}
        <div className="stea-quick-info-primary-action">
          <button
            type="button"
            className="stea-quick-info-open-btn"
            onClick={handleOpenExternal}
          >
            <span>Open Website</span>
            <ExternalLink size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Secondary Actions (Favorite, Share, Copy Link) */}
        <div className="stea-quick-info-secondary-actions">
          <button
            type="button"
            className={`stea-quick-action-btn ${isFavorite ? "is-active" : ""}`}
            onClick={handleFavClick}
            title={isFavorite ? "Saved to favorites" : "Add to favorites"}
          >
            <Star
              size={14}
              fill={isFavorite ? "#F5A623" : "none"}
              stroke={isFavorite ? "#F5A623" : "currentColor"}
              strokeWidth={2}
            />
            <span>{isFavorite ? "Saved" : "Favorite"}</span>
          </button>

          <button
            type="button"
            className="stea-quick-action-btn"
            onClick={handleShare}
            title="Share this site"
          >
            <Share2 size={14} strokeWidth={2} />
            <span>{shareFeedback || "Share"}</span>
          </button>

          <button
            type="button"
            className="stea-quick-action-btn"
            onClick={handleCopyLink}
            title="Copy STEA link"
          >
            {copied ? (
              <>
                <Check size={14} strokeWidth={2.5} style={{ color: "#10B981" }} />
                <span style={{ color: "#10B981" }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .stea-quick-info-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          background: rgba(4, 6, 12, 0.82);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          touch-action: pan-y;
          overscroll-behavior: contain;
          animation: steaQuickOverlayFade 180ms ease-out;
        }

        @keyframes steaQuickOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .stea-quick-info-modal {
          background: linear-gradient(180deg, #121626 0%, #0c0f1b 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(245, 166, 35, 0.1);
          width: 100%;
          max-width: 460px;
          padding: 24px 22px 20px;
          box-sizing: border-box;
          position: relative;
          color: #FFFFFF;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          animation: steaQuickModalScale 200ms cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 90vh;
          overflow-y: auto;
        }

        @keyframes steaQuickModalScale {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .stea-quick-info-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 140ms ease;
        }

        .stea-quick-info-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        /* Head */
        .stea-quick-info-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 12px;
        }

        .stea-quick-info-icon-wrap {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .stea-quick-info-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin: 0 0 3px;
        }

        .stea-quick-info-domain {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: -0.01em;
        }

        /* Badges */
        .stea-quick-info-badges {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .stea-quick-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 750;
          padding: 3px 9px;
          border-radius: 999px;
          line-height: 1.2;
        }

        .stea-quick-badge-trusted,
        .stea-quick-badge-paid {
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.38);
          color: #C4B5FD;
          letter-spacing: 0.05em;
        }

        .stea-quick-badge-free {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.38);
          color: #6EE7B7;
          letter-spacing: 0.05em;
        }

        .stea-quick-badge-category {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
        }

        .stea-quick-badge-pricing {
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.28);
          color: #FFD17C;
        }

        /* Description */
        .stea-quick-info-desc {
          font-size: 13.5px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.72);
          text-align: center;
          margin: 0 0 20px;
          max-height: 85px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        /* Primary Button */
        .stea-quick-info-primary-action {
          margin-bottom: 12px;
        }

        .stea-quick-info-open-btn {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #F5A623 0%, #E08E0B 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #000000;
          font-weight: 800;
          font-size: 14.5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
          box-shadow: 0 4px 18px rgba(245, 166, 35, 0.35);
        }

        .stea-quick-info-open-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          box-shadow: 0 6px 24px rgba(245, 166, 35, 0.45);
        }

        /* Secondary Actions */
        .stea-quick-info-secondary-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stea-quick-action-btn {
          flex: 1;
          min-height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .stea-quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.16);
        }

        .stea-quick-action-btn.is-active {
          color: #F5A623;
          border-color: rgba(245, 166, 35, 0.35);
          background: rgba(245, 166, 35, 0.08);
        }

        @media (max-width: 480px) {
          .stea-quick-info-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .stea-quick-info-modal {
            max-width: 100%;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            padding: 24px 18px 32px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
