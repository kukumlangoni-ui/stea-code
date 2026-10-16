/**
 * Staff Auth routes for STEA Code.
 *
 * Entirely on Cloudflare (Worker + D1). No Firebase, no Clerk.
 *
 * All routes return JSON with CORS headers (reusing corsHeaders()).
 *
 * - POST   /api/stea-code/staff/login
 * - POST   /api/stea-code/staff/logout
 * - GET    /api/stea-code/staff/me
 * - GET    /api/stea-code/staff/users
 * - POST   /api/stea-code/staff/users
 * - PATCH  /api/stea-code/staff/users/:id
 * - DELETE /api/stea-code/staff/users/:id
 * - POST   /api/stea-code/staff/users/:id/reset-password
 * - POST   /api/stea-code/staff/users/:id/force-logout
 * - GET    /api/stea-code/staff/products
 * - GET    /api/stea-code/staff/audit
 * - GET    /api/stea-code/staff/approvals
 * - POST   /api/stea-code/staff/products/:id/approve
 */

import { Env, getDoc, setDoc } from "../firestore";
import { corsHeaders } from "../cors";
import { hashPassword, verifyPassword, generateToken } from "../staff-auth/crypto";
import { requireStaff, StaffContext, StaffRole } from "../staff-auth/middleware";

const PRODUCTS_COLLECTION = "stea_code_products";

const ROLE_ORDER: Record<StaffRole, number> = { editor: 1, approver: 2, owner: 3 };

const SESSION_HOURS = 12;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonErr(req: Request, msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
  });
}

async function logAudit(
  env: Env,
  staffId: string | null,
  action: string,
  target?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO staff_audit (staff_id, action, target, meta, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(staffId, action, target || null, meta ? JSON.stringify(meta) : null, new Date().toISOString()).run();
}

function sanitizeStaff(row: any): Record<string, unknown> {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || null,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

// ============================================================
// Login (with one-time owner bootstrap)
// ============================================================
export async function handleStaffLogin(req: Request, env: Env): Promise<Response> {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body");
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) return jsonErr(req, "Email and password required", 400);

  try {
    // ── Bootstrap: if no staff_users exist, the first login with the
    //    bootstrap credentials creates the owner account.
    const countRow = await env.DB.prepare("SELECT COUNT(*) as n FROM staff_users").first<any>();
    const staffCount = Number(countRow?.n || 0);
    if (staffCount === 0) {
      const bootstrapEmail = String(env.STAFF_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
      const bootstrapPassword = String(env.STAFF_BOOTSTRAP_PASSWORD || "");
      console.log("[staff-bootstrap] attempt", {
        staffCount,
        hasEmailSecret: Boolean(env.STAFF_BOOTSTRAP_EMAIL),
        hasPasswordSecret: Boolean(env.STAFF_BOOTSTRAP_PASSWORD),
        emailMatch: email === bootstrapEmail,
        passwordLengthIncoming: password.length,
        passwordLengthSecret: bootstrapPassword.length,
      });
      if (bootstrapEmail && bootstrapPassword && email === bootstrapEmail && password === bootstrapPassword) {
        const { hash, salt } = await hashPassword(password);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT INTO staff_users (id, email, password_hash, password_salt, display_name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'owner', 'active', ?, ?)"
        ).bind(id, email, hash, salt, "Owner", now, now).run();
      }
    }

    // Normal login lookup
    const staff = await env.DB.prepare(
      "SELECT * FROM staff_users WHERE email = ?"
    ).bind(email).first<any>();

    if (!staff) return jsonErr(req, "Invalid credentials", 401);

    if (staff.status !== "active") return jsonErr(req, "Access revoked", 403);

    const ok = await verifyPassword(password, staff.password_hash, staff.password_salt);
    if (!ok) return jsonErr(req, "Invalid credentials", 401);

    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_HOURS * 3600 * 1000);

    await env.DB.prepare(
      "INSERT INTO staff_sessions (token, staff_id, issued_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      token,
      staff.id,
      now.toISOString(),
      expiresAt.toISOString(),
      String(req.headers.get("user-agent") || "").slice(0, 300),
      req.headers.get("cf-connecting-ip") || null
    ).run();

    await env.DB.prepare("UPDATE staff_users SET last_login_at = ? WHERE id = ?")
      .bind(now.toISOString(), staff.id).run();

    await logAudit(env, staff.id, "login");

    return json({
      token,
      staff: { id: staff.id, email: staff.email, displayName: staff.display_name || null, role: staff.role },
    });
  } catch (e: any) {
    console.error("[staff] login error:", e?.message || e);
    return jsonErr(req, "Login failed", 500);
  }
}

// ============================================================
// Logout
// ============================================================
export async function handleStaffLogout(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;
  try {
    await env.DB.prepare("UPDATE staff_sessions SET revoked_at = ? WHERE token = ?")
      .bind(new Date().toISOString(), ctx.session.token).run();
    await logAudit(env, ctx.staff.id, "logout");
    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, "Logout failed", 500);
  }
}

// ============================================================
// Me
// ============================================================
export async function handleStaffMe(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;
  return json({
    staff: { ...ctx.staff },
    session: { expiresAt: ctx.session.expiresAt },
  });
}

// ============================================================
// List staff (owner only)
// ============================================================
export async function handleListStaff(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;
  try {
    const result = await env.DB.prepare(
      "SELECT id, email, display_name, role, status, created_at, last_login_at FROM staff_users ORDER BY created_at ASC"
    ).all<any>();
    const users = (result.results || []).map((r) => sanitizeStaff(r));
    return json({ ok: true, users });
  } catch (e: any) {
    return jsonErr(req, "Failed to list staff", 500);
  }
}

// ============================================================
// Create staff (admin or owner)
// ============================================================
export async function handleCreateStaff(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim() || null;
  const role = String(body.role || "editor");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonErr(req, "Invalid email address", 400);
  if (password.length < 8) return jsonErr(req, "Password must be at least 8 characters", 400);
  if (!["owner", "approver", "editor"].includes(role)) return jsonErr(req, "Invalid role", 400);
  if (role === "owner" && ctx.staff.role !== "owner") return jsonErr(req, "Only an owner can create another owner", 403);

  try {
    const existing = await env.DB.prepare("SELECT id FROM staff_users WHERE email = ?").bind(email).first();
    if (existing) return jsonErr(req, "Email already in use", 409);

    const { hash, salt } = await hashPassword(password);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO staff_users (id, email, password_hash, password_salt, display_name, role, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)"
    ).bind(id, email, hash, salt, displayName, role, ctx.staff.id, now, now).run();

    await logAudit(env, ctx.staff.id, "create_staff", id, { email, role });

    const row = { id, email, display_name: displayName, role, status: "active", created_at: now, last_login_at: null };
    return json({ ok: true, user: sanitizeStaff(row) }, 201);
  } catch (e: any) {
    console.error("[staff] create error:", e?.message || e);
    return jsonErr(req, "Failed to create staff", 500);
  }
}

// ============================================================
// Update staff (owner only)
// ============================================================
export async function handleUpdateStaff(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  if (id === ctx.staff.id) return jsonErr(req, "You cannot modify your own account here", 403);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }

  try {
    const existing = await env.DB.prepare("SELECT * FROM staff_users WHERE id = ?").bind(id).first<any>();
    if (!existing) return jsonErr(req, "Staff not found", 404);

    const role = body.role !== undefined ? String(body.role) : existing.role;
    const status = body.status !== undefined ? String(body.status) : existing.status;
    const displayName = body.displayName !== undefined ? String(body.displayName) : existing.display_name;

    if (!["owner", "approver", "editor"].includes(role)) return jsonErr(req, "Invalid role", 400);
    if (!["active", "revoked"].includes(status)) return jsonErr(req, "Invalid status", 400);

    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE staff_users SET role = ?, status = ?, display_name = ?, updated_at = ? WHERE id = ?"
    ).bind(role, status, displayName, now, id).run();

    // If revoked → kill all active sessions immediately
    if (status === "revoked") {
      await env.DB.prepare("UPDATE staff_sessions SET revoked_at = ? WHERE staff_id = ? AND revoked_at IS NULL")
        .bind(now, id).run();
    }

    await logAudit(env, ctx.staff.id, "update_staff", id, { role, status });

    const updated = await env.DB.prepare(
      "SELECT id, email, display_name, role, status, created_at, last_login_at FROM staff_users WHERE id = ?"
    ).bind(id).first<any>();
    return json({ ok: true, user: sanitizeStaff(updated) });
  } catch (e: any) {
    return jsonErr(req, "Failed to update staff", 500);
  }
}

// ============================================================
// Reset password (owner only)
// ============================================================
export async function handleResetStaffPassword(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }

  const newPassword = String(body.newPassword || "");
  if (newPassword.length < 8) return jsonErr(req, "Password must be at least 8 characters", 400);

  try {
    const existing = await env.DB.prepare("SELECT id FROM staff_users WHERE id = ?").bind(id).first();
    if (!existing) return jsonErr(req, "Staff not found", 404);

    const { hash, salt } = await hashPassword(newPassword);
    const now = new Date().toISOString();
    await env.DB.prepare(
      "UPDATE staff_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?"
    ).bind(hash, salt, now, id).run();

    // Revoke all existing sessions → force re-login
    await env.DB.prepare("UPDATE staff_sessions SET revoked_at = ? WHERE staff_id = ? AND revoked_at IS NULL")
      .bind(now, id).run();

    await logAudit(env, ctx.staff.id, "reset_password", id);

    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, "Failed to reset password", 500);
  }
}

// ============================================================
// Force logout (owner only)
// ============================================================
export async function handleForceLogout(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  try {
    const existing = await env.DB.prepare("SELECT id FROM staff_users WHERE id = ?").bind(id).first();
    if (!existing) return jsonErr(req, "Staff not found", 404);

    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE staff_sessions SET revoked_at = ? WHERE staff_id = ? AND revoked_at IS NULL")
      .bind(now, id).run();

    await logAudit(env, ctx.staff.id, "force_logout", id);

    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, "Failed to force logout", 500);
  }
}

// ============================================================
// Delete staff (owner only)
// ============================================================
export async function handleDeleteStaff(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  if (id === ctx.staff.id) return jsonErr(req, "You cannot delete yourself", 403);

  try {
    const existing = await env.DB.prepare("SELECT * FROM staff_users WHERE id = ?").bind(id).first<any>();
    if (!existing) return jsonErr(req, "Staff not found", 404);

    // Reassign their products to the caller (owner)
    await env.DB.prepare("UPDATE products SET createdByStaff = ? WHERE createdByStaff = ?")
      .bind(ctx.staff.id, id).run();

    // Log BEFORE deleting (target email captured in meta)
    await logAudit(env, ctx.staff.id, "delete_staff", id, { email: existing.email });

    await env.DB.prepare("DELETE FROM staff_sessions WHERE staff_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM staff_audit WHERE staff_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM staff_users WHERE id = ?").bind(id).run();

    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, "Failed to delete staff", 500);
  }
}

// ============================================================
// Staff products (any authenticated staff)
// ============================================================
export async function handleStaffProducts(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const status = url.searchParams.get("status") || "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  const createdByStaffParam = url.searchParams.get("createdByStaff") || "";

  try {
    let where: string[] = [];
    const params: any[] = [];

    // Editors only see their own products
    if (ctx.staff.role === "editor") {
      where.push("createdByStaff = ?");
      params.push(ctx.staff.id);
    } else if (createdByStaffParam) {
      // admin/owner may filter by a specific creator
      where.push("createdByStaff = ?");
      params.push(createdByStaffParam);
    }

    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (dateFrom) {
      where.push("createdAt >= ?");
      params.push(dateFrom);
    }
    if (dateTo) {
      where.push("createdAt <= ?");
      params.push(dateTo);
    }

    const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";

    const countRow = await env.DB.prepare(`SELECT COUNT(*) as n FROM products${whereSql}`).bind(...params).first<any>();
    const total = Number(countRow?.n || 0);

    const result = await env.DB.prepare(
      `SELECT * FROM products${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<any>();

    const products = (result.results || []).map((r) => ({ id: r.id, ...r }));

    return json({ ok: true, products, total, limit, offset });
  } catch (e: any) {
    return jsonErr(req, "Failed to list products", 500);
  }
}

// ============================================================
// Approve / reject a pending product (owner only)
// ============================================================
export async function handleStaffApprove(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }

  const approved = body.approved === true;
  const reason = String(body.reason || "").trim() || null;

  try {
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, id);
    if (!productDoc) return jsonErr(req, "Product not found", 404);

    const now = new Date().toISOString();
    if (approved) {
      await setDoc(env, PRODUCTS_COLLECTION, id, {
        status: "published",
        approvedByStaff: ctx.staff.id,
        approvedAt: now,
        updatedAt: now,
      }, true);
      await logAudit(env, ctx.staff.id, "approve_product", id);
    } else {
      await setDoc(env, PRODUCTS_COLLECTION, id, {
        status: "rejected",
        rejectionReason: reason,
        updatedAt: now,
      }, true);
      await logAudit(env, ctx.staff.id, "reject_product", id, { reason });
    }

    return json({ ok: true, status: approved ? "published" : "rejected" });
  } catch (e: any) {
    return jsonErr(req, "Failed to update approval", 500);
  }
}

// ============================================================
// Audit log (owner only)
// ============================================================
export async function handleStaffAudit(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const staffId = url.searchParams.get("staffId") || "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  try {
    let where = "";
    const params: any[] = [];
    if (staffId) {
      where = " WHERE staff_id = ?";
      params.push(staffId);
    }
    const result = await env.DB.prepare(
      `SELECT * FROM staff_audit${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<any>();
    return json({ ok: true, entries: result.results || [] });
  } catch (e: any) {
    return jsonErr(req, "Failed to load audit log", 500);
  }
}

// ============================================================
// Pending approvals (owner only)
// ============================================================
export async function handleStaffApprovals(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "owner");
  if (ctx instanceof Response) return ctx;

  try {
    const result = await env.DB.prepare(
      `SELECT p.*, s.email as uploaderEmail, s.display_name as uploaderName
       FROM products p
       LEFT JOIN staff_users s ON s.id = p.createdByStaff
       WHERE p.status = 'pending'
       ORDER BY p.createdAt DESC`
    ).all<any>();
    const approvals = (result.results || []).map((r) => ({
      id: r.id,
      titleEn: r.titleEn,
      slug: r.slug,
      price: r.price,
      category: r.category,
      createdAt: r.createdAt,
      createdByStaff: r.createdByStaff,
      uploaderEmail: r.uploaderEmail || null,
      uploaderName: r.uploaderName || null,
    }));
    return json({ ok: true, approvals });
  } catch (e: any) {
    return jsonErr(req, "Failed to load approvals", 500);
  }
}

// Re-export for use by the product write flow (admin.ts)
export { ROLE_ORDER };
