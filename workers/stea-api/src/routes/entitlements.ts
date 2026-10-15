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

/**
 * GET /api/stea-code/purchases
 * Auth: Firebase ID token (Bearer)
 *
 * Returns the current user's purchases (entitlements joined with order +
 * product snapshot) for the "My Library / My Purchases" page.
 */
export async function handlePurchases(req: Request, env: WorkerEnv): Promise<Response> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }
    let decoded;
    try {
      decoded = await verifyFirebaseToken(env, token);
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }
    const uid = decoded.uid;

    // 1. All entitlements for this user
    const entitlements = await env.DB.prepare(
      "SELECT * FROM entitlements WHERE userId = ? ORDER BY grantedAt DESC"
    ).bind(uid).all();

    const purchases: any[] = [];
    for (const ent of (entitlements.results || []) as any[]) {
      const productId = ent.productId;

      // 2. Order info (amount, currency, status, date)
      let order: any = null;
      if (ent.orderId) {
        order = await env.DB.prepare(
          "SELECT id, amount, currency, status, createdAt FROM orders WHERE id = ?"
        ).bind(ent.orderId).first();
      }

      // 3. Product snapshot for the card
      let snapshot: any = null;
      if (productId && productId !== "pro-lifetime") {
        const product = await env.DB.prepare(
          "SELECT id, titleEn, titleZh, posterImageUrl, pricingType FROM products WHERE id = ? OR slug = ?"
        ).bind(productId, productId).first();
        if (product) {
          snapshot = {
            id: product.id,
            title: product.titleEn || product.titleZh || productId,
            thumbnail: product.posterImageUrl || null,
            productType: product.pricingType === "premium" ? "Premium" : (product.pricingType || "Product"),
          };
        }
      } else if (productId === "pro-lifetime") {
        snapshot = {
          id: "pro-lifetime",
          title: "STEA Code Pro — Lifetime Access",
          thumbnail: null,
          productType: "Membership",
        };
      }

      const currency = (order?.currency || "usd").toUpperCase();
      const amount = Number(order?.amount || 0);

      purchases.push({
        id: ent.id,
        orderId: ent.orderId || null,
        productId: productId || null,
        status: order?.status || "paid",
        licenseType: ent.licenseType || "personal",
        currency,
        subtotal: amount,
        discountAmount: 0,
        finalAmount: amount,
        createdAt: order?.createdAt || ent.grantedAt,
        paidAt: order?.createdAt || ent.grantedAt,
        grantedAt: ent.grantedAt,
        productSnapshot: snapshot,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, purchases }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    console.error("[purchases] error:", e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || "Failed to fetch purchases", code: "PURCHASES_FAILED" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  }
}

/**
 * GET /api/stea-code/products/:id/access
 * Auth: Firebase ID token (Bearer)
 *
 * Returns { access: true } if the user owns this product (per-product OR
 * pro-lifetime). Otherwise 403.
 */
export async function handleProductAccess(req: Request, env: WorkerEnv, productId: string): Promise<Response> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authentication required", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }
    let decoded;
    try {
      decoded = await verifyFirebaseToken(env, token);
    } catch {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }
    const uid = decoded.uid;

    // The product might be fetched by id or slug — normalize to the real id first.
    let realId = productId;
    if (productId && productId !== "pro-lifetime") {
      const product = await env.DB.prepare(
        "SELECT id FROM products WHERE id = ? OR slug = ?"
      ).bind(productId, productId).first();
      realId = String((product as any)?.id || productId);
    }

    const row = await env.DB.prepare(
      "SELECT 1 FROM entitlements WHERE userId = ? AND (productId = ? OR productId = 'pro-lifetime') LIMIT 1"
    ).bind(uid, realId).first();

    if (!row) {
      return new Response(
        JSON.stringify({ error: "Premium access required", code: "ACCESS_DENIED", access: false }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }

    return new Response(
      JSON.stringify({ access: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    console.error("[product-access] error:", e?.message || e);
    return new Response(
      JSON.stringify({ error: e?.message || "Failed to check access", code: "ACCESS_CHECK_FAILED" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  }
}
