/**
 * First-party email sessions.
 *
 * The store no longer depends on Cloudflare Access for its own users: a visitor
 * types an email, we upsert them into `users`, mint a random session token and
 * return it as an HttpOnly cookie. Only the SHA-256 hash of the token is stored
 * in D1, so a database leak cannot be replayed as a live session.
 *
 * SECURITY NOTE: issuing a session on an unverified address means the session
 * proves "this browser typed this email", not "this person owns this mailbox".
 * Paid-download checks therefore also require a `purchases` row, but a visitor
 * who knows a buyer's address could still impersonate them. Verify the email
 * (magic link / OTP) before granting paid downloads if that matters.
 */

/** Minimal env surface — keeps this module usable from any handler. */
type SessionEnv = { DB: D1Database };

export const SESSION_COOKIE = "stea_session";
// Returning visitors keep their session without another emailed code. This is
// a low-friction storefront session (paid downloads additionally require a
// `purchases` row), and it slides forward on activity — see
// `renewSessionToken` — so an active buyer effectively never expires.
const SESSION_TTL_SECONDS = 180 * 24 * 60 * 60; // 180 days

export type SessionUser = {
  id: string;
  email: string;
  source: "session";
};

function base64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCookieValue(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

/** Token from the HttpOnly cookie, or a Bearer header for API clients. */
function sessionTokenFromRequest(req: Request): string | null {
  const cookieToken = readCookieValue(req, SESSION_COOKIE);
  if (cookieToken) return cookieToken;

  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  return null;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/**
 * Create (or reuse) the user row and start a session for that email.
 */
export async function createSessionForEmail(
  rawEmail: string,
  env: SessionEnv
): Promise<{ token: string; user: { id: string; email: string }; expiresAt: string }> {
  const email = rawEmail.trim().toLowerCase();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  let user = await env.DB.prepare("SELECT id, email FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email: string }>();

  if (!user) {
    const id = crypto.randomUUID();
    try {
      // NOTE: this is the long-standing `users` table schema (camelCase
      // columns, shared with the admin/Firebase sync), not a new table. It
      // already exists in production, so we insert its `createdAt` column.
      await env.DB.prepare(
        "INSERT INTO users (id, email, provider, createdAt, lastActiveAt) VALUES (?, ?, 'email', ?, ?)"
      )
        .bind(id, email, now, now)
        .run();
      user = { id, email };
    } catch {
      // Lost a race against a concurrent sign-in for the same address.
      user = await env.DB.prepare("SELECT id, email FROM users WHERE email = ?")
        .bind(email)
        .first<{ id: string; email: string }>();
    }
  }

  if (!user) throw new Error("Could not create user row");

  const token = randomToken();
  const sessionId = await sha256Hex(token);

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(sessionId, user.id, email, now, expiresAt)
    .run();

  return { token, user: { id: user.id, email: user.email }, expiresAt };
}

/**
 * Sliding expiry: while a session is still valid, push its end date back to a
 * full TTL once it has burned through half of it. Returns the same token so the
 * caller can re-set the cookie; null when there is nothing to renew.
 */
export async function renewSessionToken(req: Request, env: SessionEnv): Promise<string | null> {
  const token = sessionTokenFromRequest(req);
  if (!token) return null;

  const sessionId = await sha256Hex(token);
  const row = await env.DB.prepare("SELECT expires_at FROM sessions WHERE id = ?")
    .bind(sessionId)
    .first<{ expires_at: string }>();
  if (!row) return null;

  const remaining = Date.parse(row.expires_at) - Date.now();
  if (!(remaining > 0)) return null;
  if (remaining > (SESSION_TTL_SECONDS * 1000) / 2) return null;

  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?")
    .bind(expiresAt, sessionId)
    .run();
  return token;
}

/**
 * Resolve the caller from the session cookie / Bearer token.
 * Returns null for missing, unknown or expired sessions.
 */
export async function getSessionUser(req: Request, env: SessionEnv): Promise<SessionUser | null> {
  const token = sessionTokenFromRequest(req);
  if (!token) return null;

  const sessionId = await sha256Hex(token);
  const row = await env.DB.prepare(
    "SELECT user_id, email, expires_at FROM sessions WHERE id = ?"
  )
    .bind(sessionId)
    .first<{ user_id: string; email: string; expires_at: string }>();

  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;

  return { id: row.user_id, email: row.email, source: "session" };
}
