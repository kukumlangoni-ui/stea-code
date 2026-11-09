/**
 * downloadImage.js — download an image file to the user's device.
 *
 * Primary path: fetch as a Blob → object URL → temporary anchor with the
 * `download` attribute. This works for same-origin `/api/stea-code/media/...`
 * paths and for cross-origin R2 URLs as long as the media host sends CORS
 * headers (the anchor `download` attribute alone is ignored on cross-origin
 * URLs, which is why we fetch the blob first).
 *
 * Fallback: if the fetch is blocked by CORS, open the image in a new tab so
 * the visitor can right-click → Save Image, and rethrow so the caller can
 * show an explanatory toast instead of pretending the download succeeded.
 */

const MIME_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
};

function slugify(name) {
  return String(name || "steacode-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "steacode-image";
}

function extensionFromUrl(url) {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const match = path.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function triggerAnchorDownload(href, fileName, openInNewTab) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = "noopener";
  if (openInNewTab) anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * @param {string} imageUrl - full URL or same-origin media path to the image.
 * @param {string} [baseName] - preferred file name (extension is derived
 *   from the blob MIME type or the URL path).
 * @returns {Promise<{ fileName: string, blobType: string }>}
 * @throws {Error} when the image cannot be fetched or decoded.
 */
export async function downloadImageFile(imageUrl, baseName) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("No image URL provided");
  }

  const base = slugify(baseName);
  let objectUrl = null;

  try {
    const response = await fetch(imageUrl, {
      credentials: "same-origin",
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`FETCH_FAILED ${response.status}`);

    const blob = await response.blob();
    const extension =
      MIME_EXT[blob.type] || extensionFromUrl(imageUrl) || "png";
    const fileName = `${base}.${extension}`;

    objectUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(objectUrl, fileName, false);
    return { fileName, blobType: blob.type || "image/png" };
  } catch (err) {
    // CORS blocked the blob fetch: open the raw URL in a new tab instead of
    // navigating away from the SPA. The caller surfaces a Save-Image hint.
    const fallbackExt = extensionFromUrl(imageUrl) || "png";
    triggerAnchorDownload(imageUrl, `${base}.${fallbackExt}`, true);
    throw err;
  } finally {
    if (objectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }
}
