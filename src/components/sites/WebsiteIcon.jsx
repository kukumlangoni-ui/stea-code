/**
 * WebsiteIcon — Premium Real Website Icon & Favicon Renderer
 *
 * Loading architecture (fast path):
 *   1. Admin-supplied custom icon (authoritative — tried alone)
 *   2. Stored / verified icon URL on the website document
 *   3. Remembered source that already worked for this domain
 *   4. DuckDuckGo ip3  → Google s2 → direct /favicon.ico
 *   5. Curated brand SVG, then a deterministic letter tile
 *
 * Properties that matter:
 *   • Data readiness and icon readiness are independent — a card never waits.
 *   • The shell is a fixed size, so an arriving icon can never shift the grid.
 *   • Above-the-fold icons are requested eagerly (bounded budget), the rest are
 *     lazy so we never fire 100+ requests at once.
 *   • Successful sources are cached in memory + localStorage, so category
 *     changes, modal opens and return visits render instantly.
 */
import { memo, useState, useEffect, useMemo, useRef } from "react";
import { extractCleanDomain } from "../../hooks/useSearch.js";
import { BRAND_SVGS, getWebsiteIcon } from "./websiteIconHelper.js";
import {
  claimEagerSlot,
  getIconCandidates,
  rememberIconHit,
  rememberIconMiss,
} from "./iconPipeline.js";

export { BRAND_SVGS, getWebsiteIcon };

const PALETTES = [
  { bg: "#1A1105", color: "#F5A623" },
  { bg: "#110E22", color: "#8B7BFA" },
  { bg: "#06121F", color: "#4AA3FF" },
  { bg: "#1E0A0A", color: "#EF6A6A" },
  { bg: "#071A11", color: "#56C28A" },
  { bg: "#1D0F04", color: "#FF8F3D" },
  { bg: "#041616", color: "#34C9C0" },
  { bg: "#1F0815", color: "#F26FB2" },
];

function WebsiteIcon({
  website,
  name: explicitName,
  url: explicitUrl,
  domain: explicitDomain,
  size = 48,
  wordmark = false,
  className = "",
  style = {},
  eager,
}) {
  const resolvedObj = useMemo(() => {
    if (website && typeof website === "object") return website;
    return {
      name: explicitName || "",
      url: explicitUrl || "",
      domain: explicitDomain || "",
    };
  }, [website, explicitName, explicitUrl, explicitDomain]);

  const name = String(resolvedObj.name || resolvedObj.title || "").trim();
  const domain = extractCleanDomain(resolvedObj);
  const brandSvg = BRAND_SVGS[name.toLowerCase()];

  const candidates = useMemo(() => getIconCandidates(resolvedObj), [resolvedObj]);

  // First N icons on screen are requested right away; the rest stay lazy.
  const [shouldEagerLoad] = useState(() =>
    typeof eager === "boolean" ? eager : claimEagerSlot()
  );

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [status, setStatus] = useState(candidates.length > 0 ? "loading" : "failed");
  const [upgradedSrc, setUpgradedSrc] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset only when this tile starts representing a different website.
  useEffect(() => {
    setCandidateIdx(0);
    setStatus(candidates.length > 0 ? "loading" : "failed");
    setUpgradedSrc("");
  }, [domain, candidates.length, resolvedObj.customIconUrl, resolvedObj.faviconUrl, resolvedObj.logoUrl, resolvedObj.logo]);

  const currentSrc = candidates[candidateIdx]?.src || "";

  // Progressive quality upgrade: the fast endpoint wins the race and paints
  // immediately; the higher-resolution source then swaps in behind it. Bounded
  // to the eager (above-the-fold) batch so we never double every request.
  useEffect(() => {
    if (status !== "loaded" || !shouldEagerLoad || upgradedSrc) return;
    const hires = candidates.find((c) => c.source === "google");
    if (!hires || hires.src === currentSrc) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      if (cancelled || img.naturalWidth === 0) return;
      setUpgradedSrc(hires.src);
      rememberIconHit(resolvedObj, hires.src);
    };
    img.src = hires.src;
    return () => {
      cancelled = true;
    };
  }, [status, shouldEagerLoad, upgradedSrc, candidates, currentSrc, resolvedObj]);

  const displaySrc = upgradedSrc || currentSrc;

  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    setStatus("loaded");
    rememberIconHit(resolvedObj, currentSrc);
  };

  const handleImageError = () => {
    if (!mountedRef.current) return;
    rememberIconMiss(resolvedObj, currentSrc);
    if (candidateIdx + 1 < candidates.length) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setStatus("failed");
    }
  };

  const letter = name ? name.charAt(0).toUpperCase() : (domain ? domain.charAt(0).toUpperCase() : "?");
  let paletteIdx = 0;
  for (let i = 0; i < (name || domain || "").length; i++) {
    paletteIdx += (name || domain).charCodeAt(i);
  }
  const palette = PALETTES[paletteIdx % PALETTES.length];

  const shellRadius = Math.max(8, Math.round(size * 0.26));
  const shellStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: shellRadius,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
    // A real surface from the first frame — never a bare transparent square.
    background: brandSvg ? brandSvg.bg : palette.bg,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
    contain: "layout paint style",
    ...style,
  };

  // Wordmark container (no square shell — lets wide brand logos span the width)
  const wordmarkWrap = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "100%",
    ...style,
  };

  const showImage = candidates.length > 0 && status !== "failed" && Boolean(displaySrc);

  if (wordmark) {
    return (
      <span className={`sites-website-icon stea-icon-shell ${className}`} style={wordmarkWrap} aria-hidden="true">
        {showImage ? (
          <img
            className={`stea-icon-img ${status === "loaded" ? "is-loaded" : ""}`}
            src={displaySrc}
            alt=""
            key={displaySrc}
            loading={shouldEagerLoad ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              maxWidth: "85%",
              maxHeight: size,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              imageRendering: "-webkit-optimize-contrast",
            }}
          />
        ) : (
          <span className="stea-icon-letter" style={{ color: brandSvg ? brandSvg.color : palette.color, fontSize: Math.max(20, Math.round(size * 0.6)) }}>
            {brandSvg ? (
              <svg viewBox="0 0 24 24" style={{ height: size * 0.7, width: "auto", fill: brandSvg.color }}>
                <path d={brandSvg.path} />
              </svg>
            ) : (
              letter
            )}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`sites-website-icon stea-icon-shell ${className}`} style={shellStyle} aria-hidden="true">
      {/* Base layer: the brand glyph or the deterministic letter, visible from
          the first frame and while the real icon is still in flight. */}
      {status !== "loaded" && (
        <span className="stea-icon-base">
          {brandSvg ? (
            <svg viewBox="0 0 24 24" width={Math.round(size * 0.58)} height={Math.round(size * 0.58)} style={{ display: "block", fill: brandSvg.color }}>
              <path d={brandSvg.path} />
            </svg>
          ) : (
            <span
              className="stea-icon-letter"
              style={{ color: palette.color, fontSize: Math.max(12, Math.round(size * 0.44)) }}
            >
              {letter}
            </span>
          )}
        </span>
      )}

      {/* Fixed-size shimmer — sits above the base layer, never pushes layout. */}
      {status === "loading" && <span className="stea-icon-shimmer" />}

      {showImage ? (
        <img
          className={`stea-icon-img ${status === "loaded" ? "is-loaded" : ""}`}
          src={displaySrc}
          alt=""
          key={displaySrc}
          loading={shouldEagerLoad ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            maxWidth: "76%",
            maxHeight: "76%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: 3,
            display: "block",
            imageRendering: "-webkit-optimize-contrast",
          }}
        />
      ) : null}
    </span>
  );
}

export default memo(WebsiteIcon);
