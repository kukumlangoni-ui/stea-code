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

/* ============================================================
   Team management — staff_users CRUD via the staff backend
   ============================================================ */

export async function listStaff() {
  const r = await staffFetch("/staff/users");
  if (!r.ok) throw new Error("Failed to load staff");
  return (await r.json()).users || [];
}

export async function createStaff({ email, password, displayName, role }) {
  const r = await staffFetch("/staff/users", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, role }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to create staff");
  return d.user;
}

export async function updateStaff(id, patch) {
  const r = await staffFetch(`/staff/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to update staff");
  return d.user;
}

export async function deleteStaff(id) {
  const r = await staffFetch(`/staff/users/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Failed to delete staff");
  return true;
}

export async function resetStaffPassword(id, newPassword) {
  const r = await staffFetch(`/staff/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to reset password");
  return true;
}

export async function forceLogoutStaff(id) {
  const r = await staffFetch(`/staff/users/${id}/force-logout`, { method: "POST" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to force logout");
  return true;
}
/* ============================================================
   Revisions — editor submissions & approvals
   ============================================================ */

export async function submitRevision({ productId, kind, snapshot }) {
  const r = await staffFetch("/staff/revisions/submit", {
    method: "POST",
    body: JSON.stringify({ productId, kind, snapshot }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to submit revision");
  return d.revisionId;
}

export async function listRevisions({ status = "pending", limit, offset } = {}) {
  const q = new URLSearchParams();
  q.set("status", status);
  if (limit) q.set("limit", String(limit));
  if (offset) q.set("offset", String(offset));
  const r = await staffFetch(`/staff/revisions?${q.toString()}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to load revisions");
  return d;
}

export async function getRevision(id) {
  const r = await staffFetch(`/staff/revisions/${id}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to load revision");
  return d.revision;
}

export async function approveRevision(id) {
  const r = await staffFetch(`/staff/revisions/${id}/approve`, { method: "POST" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to approve revision");
  return d;
}

export async function rejectRevision(id, reason) {
  const r = await staffFetch(`/staff/revisions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to reject revision");
  return d;
}

/* ============================================================
   Notifications
   ============================================================ */

export async function listNotifications(limit = 50) {
  const r = await staffFetch(`/staff/notifications?limit=${limit}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to load notifications");
  return d;
}

export async function markNotificationRead(id) {
  const r = await staffFetch(`/staff/notifications/${id}/read`, { method: "POST" });
  if (!r.ok) throw new Error("Failed to mark notification read");
  return true;
}

export async function markAllNotificationsRead() {
  const r = await staffFetch("/staff/notifications/read-all", { method: "POST" });
  if (!r.ok) throw new Error("Failed to mark notifications read");
  return true;
}

/* ============================================================
   Activity feed
   ============================================================ */

export async function listActivity({ staffId, action, from, to, limit, offset } = {}) {
  const q = new URLSearchParams();
  if (staffId) q.set("staffId", staffId);
  if (action) q.set("action", action);
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (limit) q.set("limit", String(limit));
  if (offset) q.set("offset", String(offset));
  const r = await staffFetch(`/staff/activity?${q.toString()}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Failed to load activity");
  return d;
}
