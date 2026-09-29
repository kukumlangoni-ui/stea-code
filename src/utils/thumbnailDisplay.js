export const THUMBNAIL_DISPLAY_DEFAULTS = {
  thumbnailFit: "contain",
  thumbnailPosition: "center",
  thumbnailZoom: 100,
  thumbnailBg: "#f8fafc",
};

const FITS = new Set(["cover", "contain", "fill"]);
const POSITIONS = new Set(["center", "top", "bottom", "left", "right"]);

export const THUMBNAIL_POSITION_MAP = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
};

export const THUMBNAIL_PRESETS = {
  logo: { thumbnailFit: "contain", thumbnailPosition: "center", thumbnailZoom: 90, thumbnailBg: "#ffffff" },
  banner: { thumbnailFit: "cover", thumbnailPosition: "center", thumbnailZoom: 100, thumbnailBg: "#f8fafc" },
  screenshot: { thumbnailFit: "contain", thumbnailPosition: "top", thumbnailZoom: 100, thumbnailBg: "#ffffff" },
  poster: { thumbnailFit: "cover", thumbnailPosition: "center", thumbnailZoom: 100, thumbnailBg: "#f8fafc" },
};

export function normalizeThumbnailDisplay(source = {}) {
  const fit = FITS.has(source.thumbnailFit) ? source.thumbnailFit : THUMBNAIL_DISPLAY_DEFAULTS.thumbnailFit;
  const position = POSITIONS.has(source.thumbnailPosition) ? source.thumbnailPosition : THUMBNAIL_DISPLAY_DEFAULTS.thumbnailPosition;
  const zoomValue = Number(source.thumbnailZoom);
  const zoom = Number.isFinite(zoomValue)
    ? Math.min(140, Math.max(70, zoomValue))
    : THUMBNAIL_DISPLAY_DEFAULTS.thumbnailZoom;
  const bg = typeof source.thumbnailBg === "string" && source.thumbnailBg.trim()
    ? source.thumbnailBg.trim()
    : THUMBNAIL_DISPLAY_DEFAULTS.thumbnailBg;

  return {
    thumbnailFit: fit,
    thumbnailPosition: position,
    thumbnailZoom: zoom,
    thumbnailBg: bg,
  };
}

export function getThumbnailImageStyle(source = {}) {
  const style = normalizeThumbnailDisplay(source);
  return {
    wrapper: {
      background: style.thumbnailBg,
      overflow: "hidden",
    },
    image: {
      objectFit: style.thumbnailFit,
      objectPosition: THUMBNAIL_POSITION_MAP[style.thumbnailPosition] || THUMBNAIL_POSITION_MAP.center,
      transform: `scale(${style.thumbnailZoom / 100})`,
      transformOrigin: THUMBNAIL_POSITION_MAP[style.thumbnailPosition] || THUMBNAIL_POSITION_MAP.center,
    },
    values: style,
  };
}
