/**
 * Entitlements endpoint.
 *
 * GET /api/stea-code/entitlements/me
 * Auth: Firebase ID token (Bearer)
 *
 * Returns the list of productIds the current user has access to,
 * plus a convenience hasProLifetime flag.
 */

import { corsHeaders } from "../cors";
import { verifyFirebaseToken, extractBearerToken } from "../auth";
import type { WorkerEnv } from "../index";

export async function handleEntitlementsMe(req: Request, env: WorkerEnv): Promise<Response> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    let decoded;
    try {
      decoded = await verifyFirebaseToken(env, token);
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    const { uid } = decoded;

    const result = await env.DB.prepare(
      "SELECT productId FROM entitlements WHERE userId = ?"
    )
      .bind(uid)
      .all();

    const rows = result.results || [];
    const productIds = rows.map((r: any) => r.productId).filter(Boolean);
    const hasProLifetime = productIds.includes("pro-lifetime");

    return new Response(
      JSON.stringify({ hasProLifetime, productIds }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    console.error("[entitlements] error:", e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || "Failed to fetch entitlements" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}
