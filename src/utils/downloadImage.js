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
 * Rasterize any image blob (e.g. SVG, or a blob with a missing MIME type) to
 * PNG, which is the most widely accepted image type for the async Clipboard
 * API. Returns the original blob when it is already a bitmapped image.
 */
async function toClipboardSafeBlob(blob) {
  const type = blob.type || "";
  const isBitmap = /^image\/(png|jpeg|jpg|webp|gif|bmp)$/i.test(type);
  if (isBitmap) return blob;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 900;
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    return png || blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Copy an image to the system clipboard.
 *
 * Fetches the image as a Blob first so cross-origin R2 images can be copied
 * (the Clipboard API needs actual pixel data, not just a URL). Uses
 * `navigator.clipboard.write` with a `ClipboardItem`. If the async clipboard
 * API is unavailable or rejects, falls back to selecting a rendered <img> and
 * running `document.execCommand("copy")`.
 *
 * @param {string} imageUrl - full URL or same-origin media path to the image.
 * @returns {Promise<string>} the MIME type that was copied.
 * @throws {Error} when the image can't be fetched or the clipboard is blocked.
 */
export async function copyImageToClipboard(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("No image URL provided");
  }

  console.log("Attempting to copy image:", imageUrl);

  const response = await fetch(imageUrl, {
    credentials: "same-origin",
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`FETCH_FAILED ${response.status}`);

  const raw = await response.blob();
  const blob = await toClipboardSafeBlob(raw);
  const mime = blob.type || "image/png";

  // Primary: async Clipboard API with a ClipboardItem.
  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === "function"
  ) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
      return mime;
    } catch (err) {
      console.warn("[copy-image] clipboard.write rejected, trying execCommand:", err);
    }
  }

  // Fallback: select a rendered image and copy it with execCommand.
  const objectUrl = URL.createObjectURL(blob);
  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.cssText =
    "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;";
  const img = document.createElement("img");
  img.src = objectUrl;
  holder.appendChild(img);
  document.body.appendChild(holder);

  let copied = false;
  try {
    const range = document.createRange();
    range.selectNodeContents(holder);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copied = document.execCommand("copy");
    selection.removeAllRanges();
  } finally {
    holder.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  if (!copied) throw new Error("CLIPBOARD_BLOCKED");
  return mime;
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

  console.log("Attempting to download:", imageUrl);

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
    // The blob fetch failed (CORS, 403, network). Open the raw image in a new
    // tab so the visitor can right-click → Save Image. window.open is tried
    // first because it's the most reliable way to surface the image; if the
    // browser blocks it as a popup (the await above dropped the user-gesture
    // context), fall back to a target=_blank anchor click. Either way we
    // rethrow so the caller shows a Save-Image hint instead of a false success.
    console.error("[download-image] fetch failed, opening fallback tab:", err);
    const fallbackExt = extensionFromUrl(imageUrl) || "png";
    const win = window.open(imageUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      triggerAnchorDownload(imageUrl, `${base}.${fallbackExt}`, true);
    }
    throw err;
  } finally {
    if (objectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }
}
