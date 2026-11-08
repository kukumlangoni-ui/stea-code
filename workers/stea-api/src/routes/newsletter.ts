/**
 * POST /api/newsletter/subscribe
 *
 * Public, no-auth newsletter capture for casual browsers (replaces the hard
 * OTP sign-in as the top-nav CTA). Idempotent by design: re-subscribing an
 * existing address returns ok with a friendly message instead of an error.
 *
 * Rows are stored in the existing `store_leads` table with source =
 * "newsletter" — that table already exists in production (migration 009), so
 * this route needs no new migration to work. It grants NO access and starts
 * NO session; it is purely a marketing list.
 */

import { corsHeaders } from "../cors";
import type { WorkerEnv } from "../index";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(req.headers.get("origin")),
    },
  });
}

export async function handleNewsletterSubscribe(req: Request, env: WorkerEnv): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body", code: "BAD_REQUEST" }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json(req, { error: "Enter a valid email address", code: "INVALID_EMAIL" }, 400);
  }

  const now = new Date().toISOString();

  try {
    const existing = await env.DB.prepare(
      `SELECT email FROM store_leads WHERE email = ? AND source = 'newsletter'`
    )
      .bind(email)
      .first();

    if (existing) {
      return json(req, { ok: true, message: "You're already on the list" });
    }

    await env.DB.prepare(
      `INSERT INTO store_leads (email, source, product_id, created_at, updated_at)
       VALUES (?, 'newsletter', NULL, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         source = 'newsletter',
         updated_at = excluded.updated_at`
    )
      .bind(email, now, now)
      .run();
  } catch (e: any) {
    console.error("[newsletter/subscribe] write failed:", e?.message || e);
    return json(req, { error: "Could not save your email", code: "SUBSCRIBE_FAILED" }, 500);
  }

  return json(req, { ok: true });
}
