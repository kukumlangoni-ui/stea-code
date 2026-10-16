/**
 * Notifications — STEA Code.
 *
 * A staff member receives notifications addressed to them specifically
 * (recipient_staff_id) or to their role (recipient_role) or to all
 * owners/approvers (recipient_role + recipient_staff_id both null).
 *
 * Routes:
 * - GET  /api/stea-code/staff/notifications        (any staff)
 * - POST /api/stea-code/staff/notifications/:id/read  (any staff)
 * - POST /api/stea-code/staff/notifications/read-all  (any staff)
 */

import { Env } from "../firestore";
import { corsHeaders } from "../cors";
import { requireStaff } from "../staff-auth/middleware";

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

/**
 * Predicate for "is this notification addressed to this staff member?"
 * Returns [sqlClause, params].
 */
function addressedTo(staff: { id: string; role: string }): { clause: string; params: any[] } {
  const params: any[] = [];
  const clauses: string[] = [];

  clauses.push("recipient_staff_id = ?");
  params.push(staff.id);

  clauses.push("(recipient_staff_id IS NULL AND recipient_role = ?)");
  params.push(staff.role);

  // Global broadcast to all owners+approvers.
  clauses.push("(recipient_staff_id IS NULL AND recipient_role IS NULL AND (? IN ('owner','approver')))");
  params.push(staff.role);

  return { clause: clauses.map((c) => `(${c})`).join(" OR "), params };
}

// ============================================================
// List notifications (any staff)
// ============================================================
export async function handleListNotifications(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);

  try {
    const addr = addressedTo(ctx.staff);

    const unreadRow = await env.DB.prepare(
      `SELECT COUNT(*) as n FROM staff_notifications WHERE ${addr.clause} AND read_at IS NULL`
    ).bind(...addr.params).first<any>();
    const unread = Number(unreadRow?.n || 0);

    const result = await env.DB.prepare(
      `SELECT * FROM staff_notifications WHERE ${addr.clause} ORDER BY created_at DESC, id DESC LIMIT ?`
    ).bind(...addr.params, limit).all<any>();

    const notifications = (result.results || []).map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body || null,
      link: r.link || null,
      targetId: r.target_id || null,
      readAt: r.read_at || null,
      createdAt: r.created_at,
    }));

    return json({ ok: true, notifications, unread });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to load notifications", 500);
  }
}

// ============================================================
// Mark one notification read
// ============================================================
export async function handleMarkNotificationRead(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  try {
    const addr = addressedTo(ctx.staff);
    await env.DB.prepare(
      `UPDATE staff_notifications SET read_at = ? WHERE id = ? AND (${addr.clause})`
    ).bind(new Date().toISOString(), Number(id) || 0, ...addr.params).run();
    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to mark notification read", 500);
  }
}

// ============================================================
// Mark all addressed notifications read
// ============================================================
export async function handleMarkAllNotificationsRead(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  try {
    const addr = addressedTo(ctx.staff);
    await env.DB.prepare(
      `UPDATE staff_notifications SET read_at = ? WHERE (${addr.clause}) AND read_at IS NULL`
    ).bind(new Date().toISOString(), ...addr.params).run();
    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to mark notifications read", 500);
  }
}

// ============================================================
// Activity feed (owner/approver)
// ============================================================
export async function handleStaffActivity(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "approver");
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const staffId = String(url.searchParams.get("staffId") || "").trim();
  const action = String(url.searchParams.get("action") || "").trim();
  const from = String(url.searchParams.get("from") || "").trim();
  const to = String(url.searchParams.get("to") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  try {
    const where: string[] = [];
    const params: any[] = [];

    if (staffId) { where.push("a.staff_id = ?"); params.push(staffId); }
    if (action) { where.push("a.action = ?"); params.push(action); }
    if (from) { where.push("a.created_at >= ?"); params.push(from); }
    if (to) { where.push("a.created_at <= ?"); params.push(to); }

    const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";

    const countRow = await env.DB.prepare(`SELECT COUNT(*) as n FROM staff_audit a${whereSql}`).bind(...params).first<any>();
    const total = Number(countRow?.n || 0);

    const result = await env.DB.prepare(
      `SELECT a.*, s.email as actor_email, s.display_name as actor_name
       FROM staff_audit a
       LEFT JOIN staff_users s ON s.id = a.staff_id
       ${whereSql}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<any>();

    const entries = (result.results || []).map((r) => ({
      id: r.id,
      staffId: r.staff_id,
      actorEmail: r.actor_email || null,
      actorName: r.actor_name || null,
      action: r.action,
      target: r.target || null,
      meta: r.meta ? (() => { try { return JSON.parse(r.meta); } catch { return null; } })() : null,
      createdAt: r.created_at,
    }));

    return json({ ok: true, entries, total, limit, offset });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to load activity", 500);
  }
}
