/**
 * Staff Auth middleware.
 *
 * Every staff API request passes through requireStaff() which:
 *  - Reads the Bearer token
 *  - Validates the opaque session row (not expired, not revoked)
 *  - Loads the staff user
 *  - CRITICAL: checks status === 'active' on EVERY request, so revoking a
 *    user kills their access instantly (and revokes the current session).
 *  - Optionally enforces a minimum role.
 */

import { Env } from "../firestore";

export interface StaffContext {
  staff: {
    id: string;
    email: string;
    displayName: string | null;
    role: "owner" | "approver" | "editor";
    status: "active" | "revoked";
  };
  session: { token: string; expiresAt: string };
}

const ROLE_ORDER = { editor: 1, approver: 2, owner: 3 } as const;
export type StaffRole = keyof typeof ROLE_ORDER;

function json(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function requireStaff(
  req: Request,
  env: Env,
  minRole?: StaffRole
): Promise<StaffContext | Response> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return json("Missing token", 401);

  const now = new Date().toISOString();
  const session = await env.DB.prepare(
    "SELECT * FROM staff_sessions WHERE token = ? AND revoked_at IS NULL AND expires_at > ?"
  ).bind(token, now).first<any>();

  if (!session) return json("Invalid or expired session", 401);

  const staff = await env.DB.prepare(
    "SELECT id, email, display_name, role, status FROM staff_users WHERE id = ?"
  ).bind(session.staff_id).first<any>();

  if (!staff) return json("Staff not found", 401);

  // ── CRITICAL REVOCATION CHECK ─────────────────────────────
  // Runs on EVERY request. Revoking a user kills their access instantly.
  if (staff.status !== "active") {
    // Also revoke the session so it can't be retried
    await env.DB.prepare("UPDATE staff_sessions SET revoked_at = ? WHERE token = ?")
      .bind(now, token).run();
    return json("Access revoked", 403);
  }

  // Role hierarchy check
  if (minRole) {
    if (ROLE_ORDER[staff.role as StaffRole] < ROLE_ORDER[minRole]) {
      return json("Insufficient permissions", 403);
    }
  }

  return {
    staff: {
      id: staff.id,
      email: staff.email,
      displayName: staff.display_name || null,
      role: staff.role as "owner" | "approver" | "editor",
      status: staff.status as "active" | "revoked",
    },
    session: { token, expiresAt: session.expires_at },
  };
}
