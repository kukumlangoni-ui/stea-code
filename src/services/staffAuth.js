/**
 * Staff Auth — frontend data layer.
 *
 * Minimal client for the Cloudflare-based staff authentication API.
 * Stores the opaque session token in localStorage.
 *
 * Backend endpoints (all require the staff Bearer token except login):
 *   POST /api/stea-code/staff/login
 *   POST /api/stea-code/staff/logout
 *   GET  /api/stea-code/staff/me
 *   GET  /api/stea-code/staff/users
 *   POST /api/stea-code/staff/users
 *   PATCH/DELETE /api/stea-code/staff/users/:id
 *   POST /api/stea-code/staff/users/:id/reset-password
 *   POST /api/stea-code/staff/users/:id/force-logout
 *   GET  /api/stea-code/staff/products
 *   GET  /api/stea-code/staff/audit
 *   GET  /api/stea-code/staff/approvals
 *   POST /api/stea-code/staff/products/:id/approve
 */

const TOKEN_KEY = "stea_staff_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isStaffLoggedIn() {
  return !!getToken();
}

export async function staffLogin(email, password) {
  const r = await fetch("/api/stea-code/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Login failed");
  const data = await r.json();
  setToken(data.token);
  return data.staff;
}

export async function staffLogout() {
  try {
    await fetch("/api/stea-code/staff/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } finally {
    clearToken();
  }
}

/**
 * Fetch with the staff token attached.
 * On 401/403, clears the token and throws (session expired / access revoked).
 */
export async function staffFetch(path, options = {}) {
  const r = await fetch(`/api/stea-code${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (r.status === 401 || r.status === 403) {
    clearToken();
    throw new Error("Session expired or access revoked");
  }
  return r;
}
