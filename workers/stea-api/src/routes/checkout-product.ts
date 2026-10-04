/**
 * Per-product Stripe Checkout Session handler.
 *
 * POST /api/stea-code/checkout-product
 * Auth: Firebase ID token (Bearer)
 * Body: { productId: string }
 *
 * Creates a Stripe Checkout Session for a single premium product
 * using inline price_data (no pre-created Stripe Product needed).
 *
 * Uses Stripe REST API directly via fetch.
 */

import { corsHeaders } from "../cors";
import { verifyFirebaseToken, extractBearerToken } from "../auth";
import { getDoc } from "../firestore";
import type { WorkerEnv } from "../index";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const PRODUCTS_COLLECTION = "stea_code_products";

export async function handleCheckoutProduct(req: Request, env: WorkerEnv): Promise<Response> {
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
    const siteUrl = (env as any).SITE_URL;

    if (!stripeSecretKey || !siteUrl) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    const productId = String(body.productId || "").trim();
    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Missing productId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    // Look up the product
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!productDoc) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    const data = productDoc.data;

    // Verify it's a premium product
    const pricingType = String(data.pricingType || "").toLowerCase();
    if (pricingType !== "premium") {
      return new Response(
        JSON.stringify({ error: "Product is not premium" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    // Verify price
    const price = Number(data.price);
    if (!price || price <= 0) {
      return new Response(
        JSON.stringify({ error: "Product has no price" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    // Product title for Stripe line item
    const productTitle =
      (data.titleEn && String(data.titleEn).trim()) ||
      (data.titleZh && String(data.titleZh).trim()) ||
      productId;

    // Build form-encoded body for Stripe API with inline price_data
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", productTitle);
    params.append("line_items[0][price_data][unit_amount]", String(Math.round(price * 100)));
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${siteUrl}/checkout/cancel`);
    if (email) {
      params.append("customer_email", email);
    }
    params.append("metadata[firebaseUid]", uid);
    params.append("metadata[firebaseEmail]", email || "");
    params.append("metadata[productId]", productId);
    params.append("metadata[purchaseType]", "product");

    const stripeRes = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data2 = await stripeRes.json() as any;

    if (!stripeRes.ok) {
      console.error("[checkout-product] Stripe API error:", data2?.error?.message || data2);
      return new Response(
        JSON.stringify({ error: data2?.error?.message || "Checkout creation failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    return new Response(
      JSON.stringify({ url: data2.url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    console.error("[checkout-product] error:", e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || "Checkout creation failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}
