import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../firebase.js";

const API_BASE = ""; // same-origin — Cloudflare Worker Route handles /api/*

async function authHeaders() {
  const auth = getFirebaseAuth();

  if (!auth) {
    const error = new Error("AUTH_REQUIRED");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  let user = auth.currentUser;

  if (!user) {
    user = await new Promise((resolve) => {
      let finished = false;
      let unsubscribe = () => {};

      const finish = (value) => {
        if (finished) return;
        finished = true;

        try {
          unsubscribe();
        } catch {}

        resolve(value || null);
      };

      const timer = window.setTimeout(() => {
        finish(auth.currentUser);
      }, 8000);

      unsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
          if (!nextUser) return;
          window.clearTimeout(timer);
          finish(nextUser);
        },
        () => {
          window.clearTimeout(timer);
          finish(null);
        }
      );
    });
  }

  if (!user) {
    const error = new Error("AUTH_REQUIRED");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  const token = await user.getIdToken(true);

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  if (!contentType.includes("application/json")) {
    const textSample = (await response.text().catch(() => "")).slice(0, 120);
    const error = new Error(
      `Invalid response content-type: "${contentType || "none"}" (HTTP ${response.status}). Expected application/json. Response snippet: ${textSample}`
    );
    error.code = "INVALID_RESPONSE_TYPE";
    error.status = response.status;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error(
      `Malformed JSON in response (HTTP ${response.status}): ${err?.message || "parse error"}`
    );
    error.code = "MALFORMED_JSON";
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.code = data?.code || "REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function prepareSteaCodeCheckout({
  productId,
  licenseType = "personal",
  preferredCurrency = "USD",
}) {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE}/api/stea-code/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      productId,
      licenseType,
      preferredCurrency,
    }),
  });

  return parseResponse(response);
}

export async function getSteaCodeOrder(orderId) {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE}/api/stea-code/orders/${encodeURIComponent(orderId)}`,
    { headers }
  );

  return parseResponse(response);
}

export async function getSteaCodePurchases() {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE}/api/stea-code/purchases`, {
    headers,
  });

  return parseResponse(response);
}

export async function getSteaCodeProductAccess(productId) {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/access`,
    { headers }
  );

  return parseResponse(response);
}


export async function getSteaCodeProductContent(productId) {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/content`,
    { headers }
  );

  return parseResponse(response);
}

export async function getSteaCodeProductStats(productIds = []) {
  const ids = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))];
  if (!ids.length) return { stats: {} };

  const response = await fetch(
    `${API_BASE}/api/stea-code/product-stats?ids=${encodeURIComponent(ids.join(","))}`
  );

  return parseResponse(response);
}

export async function registerSteaCodeProductView(productId) {
  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/view`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  return parseResponse(response);
}

export async function toggleSteaCodeProductLike(productId) {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/like`,
    {
      method: "POST",
      headers,
    }
  );

  return parseResponse(response);
}

// ============================================================
// Copy counter (fire-and-forget)
// ============================================================

export function recordSteaCodeCopy(productId) {
  const cleanId = String(productId || "").trim();
  if (!cleanId) return;
  fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(cleanId)}/copy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  ).catch(() => {
    /* fire-and-forget — never break UI */
  });
}

// ============================================================
// Favorites
// ============================================================

export async function toggleSteaCodeFavorite(productId) {
  const headers = await authHeaders();
  const cleanId = String(productId || "").trim();

  const response = await fetch(
    `${API_BASE}/api/stea-code/favorites/${encodeURIComponent(cleanId)}`,
    {
      method: "POST",
      headers,
    }
  );

  return parseResponse(response);
}

export async function getSteaCodeFavorites() {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE}/api/stea-code/favorites`, {
    headers,
  });

  return parseResponse(response);
}

async function downloadSteaCodeFile(productId, kind = "download") {
  const headers = await authHeaders();
  const endpoint = kind === "pdf" ? "code-pdf" : "download";
  const url = `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/${endpoint}`;

  const response = await fetch(url, { headers, redirect: "follow" });

  // The download endpoint returns a 302 redirect to a signed R2 URL.
  // fetch with redirect:"follow" follows it and returns the file blob.
  // If the server returns a JSON error instead, parse and throw.
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data?.error || data?.message || "Download failed. Please try again.");
    error.code = data?.code || "DOWNLOAD_FAILED";
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] ||
    `stea-code-${String(productId || "product")}.${kind === "pdf" ? "pdf" : "zip"}`;

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return { filename };
}

export function downloadSteaCodeSource(productId) {
  return downloadSteaCodeFile(productId, "download");
}

export function downloadSteaCodePdf(productId) {
  return downloadSteaCodeFile(productId, "pdf");
}

// LocalStorage cache for catalog responses. Served instantly on repeat visits,
// LocalStorage cache for catalog responses. Served instantly on repeat visits,
// then refreshed in the background. TTL = 30 seconds to ensure quick propagation.
const CATALOG_CACHE_KEY_PREFIX = "stea_code_catalog_v1_";
const CATALOG_CACHE_TTL = 30 * 1000;

function getCatalogCacheKey(scope) {
  return CATALOG_CACHE_KEY_PREFIX + (scope || "all");
}

function readCatalogCache(scope) {
  try {
    const raw = localStorage.getItem(getCatalogCacheKey(scope));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CATALOG_CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCatalogCache(scope, data) {
  try {
    localStorage.setItem(
      getCatalogCacheKey(scope),
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // localStorage full or disabled — ignore
  }
}

export function invalidateSteaCodeCatalogCache() {
  try {
    localStorage.removeItem(getCatalogCacheKey("homepage"));
    localStorage.removeItem(getCatalogCacheKey("all"));
    localStorage.removeItem(getCatalogCacheKey(""));
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CATALOG_CACHE_KEY_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  } catch {
    // Ignore storage errors
  }
}

export async function getSteaCodeCatalog(options = {}) {
  /**
   * scope:
   *   "homepage" → only published products that are explicitly approved for
   *                the Explore Code homepage (homepageVisible=true). This is
   *                the final safety gate.
   *   undefined / any other value → all published products (used for search,
   *                category filtering, direct-link product detail loading,
   *                etc. — so a published-but-not-yet-approved product can
   *                still be reached if you know the link).
   * onFresh: optional callback fired when background refresh completes
   *          (stale-while-revalidate pattern).
   */
  const scope = options?.scope === "homepage" ? "homepage" : "";
  const onFresh = typeof options?.onFresh === "function" ? options.onFresh : null;
  const baseUrl = scope
    ? `${API_BASE}/api/stea-code/catalog?scope=${encodeURIComponent(scope)}`
    : `${API_BASE}/api/stea-code/catalog`;

  // Try cache first for instant response unless forceFresh is set
  const cached = options?.forceFresh ? null : readCatalogCache(scope);

  const fetchFresh = async () => {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const freshUrl = `${baseUrl}${sep}_t=${Date.now()}`;
    const response = await fetch(freshUrl, {
      cache: "no-cache",
      headers: {
        Accept: "application/json",
      },
    });
    const data = await parseResponse(response);
    writeCatalogCache(scope, data);
    if (onFresh) onFresh(data);
    return data;
  };

  // If we have cached data, return it immediately and refresh in background.
  if (cached) {
    // Kick off background refresh (fire-and-forget)
    fetchFresh().catch(() => {});
    return cached;
  }

  // No cache — wait for the network
  return fetchFresh();
}

export async function getSteaCodeProduct(productId) {
  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}?_t=${Date.now()}`,
    {
      cache: "no-cache",
      headers: { Accept: "application/json" },
    }
  );
  const data = await parseResponse(response);
  return data?.product || data;
}

// In-memory cache for public STEA Code preview fetches. Short TTL (30s)
// prevents refetch storms during fast scroll while allowing admin edits to reflect quickly.
const PREVIEW_CACHE_TTL = 30 * 1000;
const previewCache = new Map(); // productId -> { data, expiresAt, inFlight }

export async function getSteaCodeProductPreview(productId, options = {}) {
  const cleanId = String(productId || "").trim();

  // 1. Return fresh cached entry if available.
  if (cleanId && !options?.forceFresh) {
    const hit = previewCache.get(cleanId);
    if (hit && hit.data && hit.expiresAt > Date.now()) {
      return hit.data;
    }
    // 2. Reuse an in-flight request so parallel callers don't double-fetch.
    if (hit && hit.inFlight) {
      return hit.inFlight;
    }
  }

  const fetchPromise = fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(cleanId)}/preview?_t=${Date.now()}`,
    {
      cache: "no-cache",
      headers: { Accept: "application/json" },
      signal: options?.signal,
    }
  )
    .then(parseResponse)
    .then((data) => {
      if (cleanId) {
        previewCache.set(cleanId, {
          data,
          expiresAt: Date.now() + PREVIEW_CACHE_TTL,
          inFlight: null,
        });
      }
      return data;
    })
    .catch((err) => {
      // Don't cache failures. Clear the in-flight slot so the next caller can retry.
      if (cleanId) {
        const slot = previewCache.get(cleanId);
        if (slot && slot.inFlight === fetchPromise) {
          slot.inFlight = null;
        }
      }
      throw err;
    });

  if (cleanId) {
    const slot = previewCache.get(cleanId) || { data: null, expiresAt: 0, inFlight: null };
    slot.inFlight = fetchPromise;
    previewCache.set(cleanId, slot);
  }

  return fetchPromise;
}

// Allow admin save flows to invalidate the cache for a product after edits.
export function invalidateSteaCodeProductPreviewCache(productId) {
  const cleanId = String(productId || "").trim();
  if (cleanId) previewCache.delete(cleanId);
}

// ─── Card Preview (sanitized, lazy-loaded per card in Explore grid) ───
//
// Returns a lightweight preview suitable for card rendering:
//   - Free products: full preview (HTML + CSS + JS)
//   - Premium, buyer: full preview
//   - Premium, non-buyer: sanitized (HTML + CSS only, no JS — shows the design)
//
// Has its own cache (separate from the full preview cache) since the data
// shape and access model differ.

const CARD_PREVIEW_CACHE_TTL = 5 * 60 * 1000; // 5 min
const cardPreviewCache = new Map(); // id -> { data, expiresAt, inFlight }

export async function getSteaCodeProductCardPreview(productId, options = {}) {
  const cleanId = String(productId || "").trim();

  // 1. Return fresh cached entry if available.
  if (cleanId && !options?.forceFresh) {
    const hit = cardPreviewCache.get(cleanId);
    if (hit && hit.data && hit.expiresAt > Date.now()) {
      return hit.data;
    }
    if (hit && hit.inFlight) {
      return hit.inFlight;
    }
  }

  // 2. Build headers — include auth token if user is signed in
  const headers = { Accept: "application/json" };
  const auth = getFirebaseAuth();
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken(/* forceRefresh */ false);
      headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token retrieval failed — proceed without auth (gets sanitized preview)
    }
  }

  const fetchPromise = fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(cleanId)}/preview-card?_t=${Date.now()}`,
    {
      cache: "no-cache",
      headers,
      signal: options?.signal,
    }
  )
    .then(parseResponse)
    .then((data) => {
      if (cleanId) {
        cardPreviewCache.set(cleanId, {
          data,
          expiresAt: Date.now() + CARD_PREVIEW_CACHE_TTL,
          inFlight: null,
        });
      }
      return data;
    })
    .catch((err) => {
      if (cleanId) {
        const slot = cardPreviewCache.get(cleanId);
        if (slot && slot.inFlight === fetchPromise) {
          slot.inFlight = null;
        }
      }
      throw err;
    });

  if (cleanId) {
    const slot = cardPreviewCache.get(cleanId) || { data: null, expiresAt: 0, inFlight: null };
    slot.inFlight = fetchPromise;
    cardPreviewCache.set(cleanId, slot);
  }

  return fetchPromise;
}

export function invalidateSteaCodeProductCardPreviewCache(productId) {
  const cleanId = String(productId || "").trim();
  if (cleanId) cardPreviewCache.delete(cleanId);
}

export async function getSteaCodeFreeProductContent(productId) {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE}/api/stea-code/products/${encodeURIComponent(productId)}/free-content`,
    { headers }
  );

  return parseResponse(response);
}
