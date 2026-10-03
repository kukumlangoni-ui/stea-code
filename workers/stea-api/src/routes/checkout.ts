/**
 * Stripe Checkout Session handler.
 *
 * POST /api/stea-code/checkout
 * Auth: Firebase ID token (Bearer)
 * Creates a Stripe Checkout Session for the pro-lifetime price.
 *
 * Uses Stripe REST API directly via fetch (no stripe npm package needed).
 */

import { corsHeaders } from "../cors";
import { verifyFirebaseToken, extractBearerToken } from "../auth";
import type { WorkerEnv } from "../index";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export async function handleCheckout(req: Request, env: WorkerEnv): Promise<Response> {
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

    const { uid, email } = decoded;

    const stripeSecretKey = (env as any).STRIPE_SECRET_KEY;
    const priceId = (env as any).STRIPE_PRICE_PRO_LIFETIME;
    const siteUrl = (env as any).SITE_URL;

    if (!stripeSecretKey || !priceId || !siteUrl) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    // Build form-encoded body for Stripe API
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${siteUrl}/checkout/cancel`);
    if (email) {
      params.append("customer_email", email);
    }
    params.append("metadata[firebaseUid]", uid);
    params.append("metadata[firebaseEmail]", email || "");

    const stripeRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await stripeRes.json() as any;

    if (!stripeRes.ok) {
      console.error("[checkout] Stripe API error:", data?.error?.message || data);
      return new Response(
        JSON.stringify({ error: data?.error?.message || "Checkout creation failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    return new Response(
      JSON.stringify({ url: data.url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    console.error("[checkout] error:", e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || "Checkout creation failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}
