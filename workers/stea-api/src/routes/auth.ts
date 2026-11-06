/**
 * Store authentication routes.
 *
 * The storefront no longer depends on Cloudflare Access: visitors identify
 * themselves with an email, we mint a random session token and set it as an
 * HttpOnly cookie (`stea_session`). `GET /api/auth/me` reads that cookie (or
 * an `Authorization: Bearer` token) and returns the current email.
 *
 * POST /api/auth/login-email  { email } -> { email, user, token, expiresAt }
 * GET  /api/auth/me                       -> { email, user, source }
 * GET  /api/auth/logout                   -> clears the cookie, redirects "/"
 */

import { corsHeaders } from "../cors";
import { resolveRequestUser } from "../auth";
import {
  createSessionForEmail,
  clearedSessionCookie,
  sessionCookie,
} from "../session";
import { sendVerificationCode, verifyCode } from "../otp";
import type { WorkerEnv } from "../index";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(req.headers.get("origin")),
      ...extraHeaders,
    },
  });
}

/**
 * POST /api/auth/login-email
 *
 * Soft-gate login: validates the address, upserts the `users` row and starts
 * a session. The raw token is returned once in the body (for API clients that
 * prefer a Bearer header) and stored in an HttpOnly cookie for the browser.
 */
export async function handleLoginEmail(req: Request, env: WorkerEnv): Promise<Response> {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body", code: "INVALID_BODY" }, 400);
  }

  const rawEmail = typeof payload?.email === "string" ? payload.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json(req, { error: "Enter a valid email address.", code: "INVALID_EMAIL" }, 400);
  }

  try {
    const { token, user, expiresAt } = await createSessionForEmail(email, env);
    return json(
      req,
      { email: user.email, user, token, expiresAt },
      200,
      { "Set-Cookie": sessionCookie(token) }
    );
  } catch (e: any) {
    return json(
      req,
      { error: "Could not start your session. Please try again.", code: "SESSION_FAILED", detail: e?.message },
      500
    );
  }
}

/**
 * GET /api/auth/me
 *
 * Resolves Access header/cookie first (legacy), then the first-party session.
 * Returns `email: null` for anonymous visitors instead of an error so the
 * frontend can treat it as "signed out".
 */
export async function handleAuthMe(req: Request, env: WorkerEnv): Promise<Response> {
  const user = await resolveRequestUser(req, env);
  if (!user?.email) {
    return json(req, { email: null, user: null, source: null });
  }
  return json(req, {
    email: user.email,
    user: { id: user.uid, email: user.email },
    source: user.source,
  });
}

/**
 * POST /api/auth/send-code
 *
 * 2‑step OTP flow (replaces login‑email): mints a fresh 6‑digit code, stores
 * its SHA‑256 hash in D1 (`verification_codes`), and emails the plaintext
 * to the address. When RESEND_API_KEY is missing the plaintext is also
 * returned (debug fallback) so devs can test without email delivery.
 */
export async function handleAuthSendCode(req: Request, env: WorkerEnv): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return json(req, { ok: false, error: "Enter a valid email address.", code: "INVALID_EMAIL" }, 400);
  }
  const result = await sendVerificationCode(email, env);
  if (!result.ok) {
    // Surface the provider's actual reason (and its HTTP status) instead of a
    // generic 500 — otherwise the gate can only say "Email send failed".
    const status = result.code === "EMAIL_NOT_CONFIGURED" ? 503 : 502;
    return json(
      req,
      {
        ok: false,
        error: result.error || "Could not send the code.",
        code: result.code || "EMAIL_SEND_FAILED",
        detail: result.detail,
        providerStatus: result.status,
      },
      status
    );
  }
  const payload: any = { ok: true, emailSent: result.emailSent };
  if (result.emailSent) payload.email = email;
  if (result.warning) payload.warning = result.warning;
  if (result.debugCode) payload.debugCode = result.debugCode;
  return json(req, payload);
}

/**
 * POST /api/auth/verify-code
 *
 * Consumes the OTP: validates the hash hasn't been used and hasn't expired,
 * then creates the session cookie — same as login‑email.
 */
export async function handleAuthVerifyCode(req: Request, env: WorkerEnv): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const email = String(body?.email || "").trim().toLowerCase();
  const code = String(body?.code || "");
  if (!email || !EMAIL_RE.test(email) || !/^\d{6}$/.test(code.replace(/\D/g, ""))) {
    return json(req, { ok: false, error: "Email and a 6‑digit code are required.", code: "INVALID_CODE" }, 400);
  }
  const check = await verifyCode(email, code, env);
  if (!check.ok) {
    const reasonMap: Record<string, { msg: string; status: number }> = {
      INVALID:  { msg: "That code didn't match. Try again.",         status: 401 },
      CONSUMED: { msg: "That code was already used. Send a new one.", status: 401 },
      EXPIRED:  { msg: "That code has expired. Send a new one.",      status: 410 },
    };
    const r = reasonMap[check.reason || "INVALID"];
    return json(req, { ok: false, error: r.msg, code: check.reason }, r.status);
  }

  try {
    const session = await createSessionForEmail(email, env);
    return json(
      req,
      { ok: true, email, expiresAt: session.expiresAt },
      200,
      { "Set-Cookie": sessionCookie(session.token) }
    );
  } catch (e: any) {
    return json(req, { ok: false, error: "Could not start your session. Please try again.", code: "SESSION_FAILED" }, 500);
  }
}

/**
 * GET /api/auth/login
 *
 * Legacy entry point kept for older links. Cloudflare Access is no longer the
 * store's login, so send the browser back to the SPA with `?login=1`, which
 * opens the email gate on the homepage.
 */
export function handleAccessLogin(req: Request): Response {
  const url = new URL(req.url);
  const rawRedirect = url.searchParams.get("redirect_url") || "/";
  const target = new URL("/", url.origin);
  target.searchParams.set("login", "1");
  if (rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")) {
    target.searchParams.set("redirect_url", rawRedirect);
  }
  return Response.redirect(target.toString(), 302);
}

/**
 * GET /api/auth/logout
 *
 * Clears the first-party session cookie and returns to the homepage.
 */
export function handleAccessLogout(req: Request): Response {
  const url = new URL(req.url);
  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": clearedSessionCookie(),
      Location: new URL("/", url.origin).toString(),
      "Cache-Control": "no-store",
    },
  });
}

