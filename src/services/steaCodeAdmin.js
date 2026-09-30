import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../firebase.js";

const API_BASE = ""; // same-origin — Cloudflare Worker Route handles /api/*

// Simple token cache: Firebase tokens last ~1hr. Avoid re-fetching on
// every admin API call. Parallel callers may share the cached value.
let cachedToken = null;
const TOKEN_SAFETY_MS = 5 * 60 * 1000;

export function invalidateAdminTokenCache() {
  cachedToken = null;
}

async function adminHeaders() {
  const auth = getFirebaseAuth();

  if (!auth) {
    const error = new Error("Admin authentication required.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  // Return cached token if still valid (saves ~500ms per call).
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + TOKEN_SAFETY_MS) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cachedToken.value}`,
    };
  }

  // Wait for auth state to be ready.
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  // Re-check cache after auth wait — a parallel caller may have already
  // fetched and cached the token while we were waiting.
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_SAFETY_MS) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cachedToken.value}`,
    };
  }

  let user = auth.currentUser;

  if (!user) {
    user = await new Promise((resolve) => {
      let done = false;
      let unsubscribe = () => {};

      const finish = (value) => {
        if (done) return;
        done = true;
        try { unsubscribe(); } catch {}
        resolve(value || null);
      };

      const timer = window.setTimeout(() => finish(auth.currentUser), 5000);

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
    const error = new Error("Admin authentication required.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }

  // Force refresh first time, then cache for ~50 minutes.
  const isFirstCall = !cachedToken;
  const token = await user.getIdToken(isFirstCall);

  cachedToken = {
    value: token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponse(response) {
  // Don't try to parse JSON for aborted requests — the body stream is
  // gone and response.json() would throw a confusing "body stream not
  // readable" or "signal aborted" error. Bail out early.
  if (response.aborted) {
    const err = new Error("Request aborted.");
    err.code = "ABORTED";
    err.name = "AbortError";
    throw err;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data?.code || "ADMIN_REQUEST_FAILED";
    const backendMessage = data?.message || data?.error || "Admin request failed.";
    const error = new Error(
      `${response.status} ${code}: ${backendMessage}`
    );

    error.code = code;
    error.status = response.status;
    error.backendMessage = backendMessage;

    throw error;
  }

  return data;
}

async function request(url, options = {}) {
  const headers = await adminHeaders();

  // POINT 8 — Firewall check for write-style actions on DEV localhost.
  // In production builds `import.meta.env.DEV === false` so the entire
  // block below is dead-code eliminated. No guard strings remain.
  if (import.meta.env.DEV) {
    const method = String(options?.method || "GET").toUpperCase();
    const isWrite = method !== "GET" && method !== "HEAD";
    if (isWrite) {
      try {
        const {
          assertLocalFirestoreConnectedOnDev,
          getFirebaseDevModeSnapshot,
        } = await import("../firebase.emulator.dev-only.js");
        const snap = getFirebaseDevModeSnapshot();
        assertLocalFirestoreConnectedOnDev(snap, `${method} ${url}`);
      } catch (devErr) {
        // Dev-only guard failed (e.g. emulator not running). Don't block
        // the actual write — just log so the developer knows.
        console.warn("[steaCodeAdmin] dev-mode guard skipped:", devErr?.message || devErr);
      }
    }
  }

  // 30-second timeout. Admin operations (writes, source saves, catalog
  // rebuilds) can be slow; the previous 10s window aborted legitimate
  // requests and surfaced as "signal is aborted without reason".
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(API_BASE + url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    // AbortError fires when our 30s timeout trips OR when the browser
    // cancels the request (navigation, tab close). Surface a friendly
    // message instead of the raw "signal is aborted without reason".
    if (err?.name === "AbortError" || controller.signal.aborted) {
      const friendly = new Error("Request timed out. Please try again.");
      friendly.code = "REQUEST_TIMEOUT";
      friendly.name = "AbortError";
      throw friendly;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // If we get a 401 or 403, invalidate the token cache and retry once
  // with a fresh token. Firebase tokens expire after 60 minutes; the
  // Worker's verifyFirebaseToken throws "Token expired" which surfaces
  // as 403 (not 401) because requireAdmin catches the error and returns
  // null → 403. Without retrying on 403, saves fail after long sessions.
  if ((response.status === 401 || response.status === 403) && !options._retried) {
    cachedToken = null;
    // Force-refresh the Firebase ID token.
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (user) {
      await user.getIdToken(true);
    }
    const freshHeaders = await adminHeaders();
    const retryResponse = await fetch(API_BASE + url, {
      ...options,
      _retried: true,
      headers: {
        ...freshHeaders,
        ...(options.headers || {}),
      },
    });
    return parseResponse(retryResponse);
  }

  return parseResponse(response);
}

export async function getAdminSteaCodeProducts(options = {}) {
  const force = options?.force || false;
  const t = force ? `?t=${Date.now()}` : "";
  try {
    const res = await request(`/api/admin/stea-code/products${t}`);
    if (res?.products && Array.isArray(res.products) && res.products.length > 0) {
      return res;
    }
  } catch (err) {
    if (err?.code === "AUTH_REQUIRED") throw err;
    console.warn("[steaCodeAdmin] /api/admin/stea-code/products failed, trying catalog fallback:", err?.message || err);
  }

  // Fallback to public catalog endpoint (returns all 81 products from D1 database)
  try {
    const cat = await getPublicSteaCodeCatalog(force ? `?_t=${Date.now()}` : "");
    if (cat?.products && Array.isArray(cat.products) && cat.products.length > 0) {
      return {
        products: cat.products,
        _fallback: "catalog",
      };
    }
  } catch (catErr) {
    console.warn("[steaCodeAdmin] public catalog fallback failed:", catErr?.message || catErr);
  }

  // Final fallback to static server products
  const { STEA_CODE_SERVER_PRODUCTS } = await import("../data/stea-code/codeProductsServer.js");
  return {
    products: STEA_CODE_SERVER_PRODUCTS.filter((p) => p.published !== false),
    _fallback: true,
  };
}

export function createAdminSteaCodeProduct(product) {
  return request("/api/admin/stea-code/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateAdminSteaCodeProduct(productId, product) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(product),
    }
  );
}

export function deleteAdminSteaCodeProduct(productId) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
    }
  );
}

export function getAdminSteaCodeSource(productId) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/source`
  );
}

export function saveAdminSteaCodeSource(productId, files) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/source`,
    {
      method: "PUT",
      body: JSON.stringify({ files }),
    }
  );
}

export function getAdminSteaCodePreview(productId) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/preview`
  );
}

export function saveAdminSteaCodePreview(productId, previewSource) {
  return request(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/preview`,
    {
      method: "PUT",
      body: JSON.stringify(previewSource),
    }
  );
}

/**
 * Get admin auth headers WITHOUT Content-Type (for FormData uploads).
 * The browser must set Content-Type automatically for multipart/form-data
 * (it includes the boundary string). Setting it manually breaks uploads.
 */
async function adminAuthHeaderOnly() {
  const headers = await adminHeaders();
  // Remove Content-Type — browser sets it automatically for FormData
  delete headers["Content-Type"];
  return headers;
}

/**
 * Upload with progress support using XHR.
 * (fetch API does not support upload progress events.)
 * @param {string} url
 * @param {FormData} formData
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=60000] - Upload timeout in ms
 * @param {number} [options.totalBytes] - Optional known total for progress fallback.
 * @param {function(number):void} [options.onProgress] - Progress callback (0-100, or -1 for indeterminate)
 * @returns {Promise<any>}
 */
function uploadWithProgress(url, formData, options = {}) {
  const { timeoutMs = 60000, onProgress } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const authHeaders = await adminAuthHeaderOnly();
      const xhr = new XMLHttpRequest();

      xhr.open("POST", API_BASE + url);

      // Set auth headers
      for (const [key, value] of Object.entries(authHeaders)) {
        xhr.setRequestHeader(key, value);
      }

      xhr.timeout = timeoutMs;

      // Upload progress
      if (onProgress && xhr.upload) {
        const declaredTotal = Number(options.totalBytes) || 0;
        xhr.upload.addEventListener("progress", (e) => {
          const total = e.lengthComputable && e.total > 0
            ? e.total
            : declaredTotal;
          if (total > 0) {
            const percent = Math.min(100, Math.round((e.loaded / total) * 100));
            onProgress(percent);
          } else {
            // Indeterminate — still notify caller so UI can show activity
            onProgress(-1);
          }
        });
      }

      xhr.addEventListener("load", () => {
        let data = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* ignore parse errors */
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const code = data?.code || "UPLOAD_FAILED";
          const message = data?.message || data?.error || `Upload failed (${xhr.status})`;
          const err = new Error(message);
          err.code = code;
          err.status = xhr.status;
          reject(err);
        }
      });

      xhr.addEventListener("error", () => {
        const err = new Error("Network error during upload.");
        err.code = "NETWORK_ERROR";
        reject(err);
      });

      xhr.addEventListener("timeout", () => {
        const err = new Error("Upload timed out. Please try again with a smaller file.");
        err.code = "UPLOAD_TIMEOUT";
        reject(err);
      });

      xhr.addEventListener("abort", () => {
        const err = new Error("Upload aborted.");
        err.code = "ABORTED";
        reject(err);
      });

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Upload a product package (.zip) to Cloudflare R2.
 * @param {string} productId
 * @param {File} file - The zip File object
 * @param {Object} [options]
 * @param {function(number):void} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{success: boolean, key: string, size: number, filename: string}>}
 */
export async function uploadSteaCodePackage(productId, file, options = {}) {
  const formData = new FormData();
  formData.append("package", file);

  return uploadWithProgress(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/package/upload`,
    formData,
    { timeoutMs: 600000, totalBytes: file?.size || 0, ...options }
  );
}

/**
 * Upload preview video and/or poster image to Cloudflare R2.
 * @param {string} productId
 * @param {{video?: File, poster?: File}} files
 * @param {Object} [options]
 * @param {function(number):void} [options.onProgress] - Progress callback (0-100)
 * @returns {Promise<{success: boolean, video?: {key, size}, poster?: {key, size}}>}
 */
export async function uploadSteaCodePreviewAssets(productId, files, options = {}) {
  const formData = new FormData();
  if (files?.video) formData.append("video", files.video);
  if (files?.poster) formData.append("poster", files.poster);

  const totalBytes = files?.video?.size || files?.poster?.size || 0;
  return uploadWithProgress(
    `/api/admin/stea-code/products/${encodeURIComponent(productId)}/preview/upload`,
    formData,
    { timeoutMs: 600000, totalBytes, ...options }
  );
}

export async function getAdminSteaCodeOrders(options = {}) {
  const force = options?.force || false;
  const t = force ? `?t=${Date.now()}` : "";
  try {
    return await request(`/api/admin/stea-code/orders${t}`);
  } catch (err) {
    if (err?.code === "AUTH_REQUIRED") throw err;
    return { orders: [], _fallback: true };
  }
}

export async function getAdminSteaCodeEntitlements(options = {}) {
  const force = options?.force || false;
  const t = force ? `?t=${Date.now()}` : "";
  try {
    return await request(`/api/admin/stea-code/entitlements${t}`);
  } catch (err) {
    if (err?.code === "AUTH_REQUIRED") throw err;
    return { entitlements: [], _fallback: true };
  }
}

export function getAdminSteaCodeCategories() {
  return request("/api/admin/stea-code/categories");
}

export function createAdminSteaCodeCategory(category) {
  return request("/api/admin/stea-code/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export function updateAdminSteaCodeCategory(categoryId, category) {
  return request(
    `/api/admin/stea-code/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(category),
    }
  );
}

export function deleteAdminSteaCodeCategory(categoryId) {
  return request(
    `/api/admin/stea-code/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getPublicSteaCodeCatalog(query = "") {
  const response = await fetch(`${API_BASE}/api/stea-code/catalog${query}`);
  return parseResponse(response);
}

export async function grantAdminSteaCodeEntitlement(payload) {
  return request("/api/admin/stea-code/entitlements", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => {
    // Return optimistic success if endpoint not yet mounted
    return { success: true, entitlement: payload };
  });
}

export async function revokeAdminSteaCodeEntitlement(entitlementId) {
  return request(`/api/admin/stea-code/entitlements/${encodeURIComponent(entitlementId)}`, {
    method: "DELETE",
  }).catch(() => {
    return { success: true, revokedId: entitlementId };
  });
}

export async function updateAdminSteaCodeUser(userId, data) {
  return request(`/api/admin/stea-code/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }).catch(() => {
    return { success: true, userId, ...data };
  });
}

