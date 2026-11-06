/**
 * POST /api/store/lead
 *
 * Public, no-auth endpoint used by the premium soft gate. Stores the email a
 * visitor gives us before being prompted to pay. Idempotent: re-submitting an
 * existing address updates the timestamp instead of failing.
 *
 * This grants NO access. Premium content is still locked until a purchase
 * exists — an email address alone must never unlock paid files.
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

export async function handleStoreLead(req: Request, env: WorkerEnv): Promise<Response> {
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

  const source = String(body?.source || "store").slice(0, 40);
  const productId = String(body?.productId || "").slice(0, 120) || null;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO store_leads (email, source, product_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         source = excluded.source,
         product_id = COALESCE(excluded.product_id, store_leads.product_id),
         updated_at = excluded.updated_at`
    )
      .bind(email, source, productId, now, now)
      .run();
  } catch (e: any) {
    console.error("[store/lead] insert failed:", e?.message || e);
    return json(req, { error: "Could not save your email", code: "LEAD_WRITE_FAILED" }, 500);
  }

  return json(req, { email, saved: true });
}
