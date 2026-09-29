/** Defaults & normalization for Tanzania marketplace product hero image (detail Step 1). */

export const DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY = {
  imageFit: "contain",
  imagePositionX: 50,
  imagePositionY: 50,
  imageZoom: 1,
};

/**
 * @param {Record<string, unknown>} product
 * @returns {{ imageFit: 'cover'|'contain', imagePositionX: number, imagePositionY: number, imageZoom: number }}
 */
export function normalizeTzProductImageDisplay(product) {
  const fit = product?.imageFit === "cover" ? "cover" : "contain";
  const x = Number(product?.imagePositionX);
  const y = Number(product?.imagePositionY);
  const z = Number(product?.imageZoom);
  return {
    imageFit: fit,
    imagePositionX: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY.imagePositionX,
    imagePositionY: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY.imagePositionY,
    imageZoom: Number.isFinite(z)
      ? Math.min(2, Math.max(0.85, z))
      : DEFAULT_TZ_PRODUCT_IMAGE_DISPLAY.imageZoom,
  };
}

/**
 * Inline styles for the Tanzania detail hero <img>.
 * Phase 3: default is contain, 95-98% visible, no black background.
 */
export function tzProductDetailImageStyle(productOrDisplay) {
  const d = normalizeTzProductImageDisplay(productOrDisplay);
  return {
    objectFit: d.imageFit,
    objectPosition: `${d.imagePositionX}% ${d.imagePositionY}%`,
  };
}
