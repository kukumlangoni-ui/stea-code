/**
 * Stripe webhook handler.
 *
 * POST /api/stea-code/stripe-webhook
 *
 * Handles checkout.session.completed → grants entitlement + records order.
 * Handles charge.refunded → logs (entitlements table has no status/revoked_at column).
 *
 * Uses Web Crypto for HMAC-SHA256 signature verification (no stripe npm package).
 */

import type { WorkerEnv } from "../index";

/**
 * Verify a Stripe webhook signature using Web Crypto (HMAC-SHA256).
 * Equivalent to stripe.webhooks.constructEvent().
 */
async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  // Parse the Stripe-Signature header
  const parts = signatureHeader.split(",");
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Reconstruct the signed payload: timestamp.payload
  const signedPayload = `${timestamp}.${payload}`;

  // Import the secret as an HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Compute HMAC-SHA256
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );

  // Convert to hex
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison (well, as constant-time as JS gets)
  for (const expectedSig of signatures) {
    if (expectedSig.length !== sigHex.length) continue;
    let mismatch = 0;
    for (let i = 0; i < sigHex.length; i++) {
      mismatch |= sigHex.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch === 0) {
      // Check timestamp tolerance (5 minutes = 300 seconds)
      const ts = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - ts) <= 300) {
        return true;
      }
    }
  }

  return false;
}

export async function handleStripeWebhook(req: Request, env: WorkerEnv): Promise<Response> {
  const webhookSecret = (env as any).STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Webhook not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Read raw body as text
  const rawBody = await req.text();
  const signature = req.headers.get("Stripe-Signature") || "";

  // Verify signature
  const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.warn("[stripe-webhook] Invalid signature");
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        console.log("[stripe-webhook] checkout.session.completed but payment_status =", session.payment_status);
        break;
      }

      const uid = session.metadata?.firebaseUid || "";
      const email = session.metadata?.firebaseEmail || "";
      const sessionId = session.id;
      const amountTotal = session.amount_total ?? 0;
      const currency = session.currency || "";

      const now = new Date().toISOString();

      try {
        // Idempotent insert into entitlements
        // Schema: id, userId, productId, source, orderId, licenseType, grantedAt, extraData
        const entitlementExtra = JSON.stringify({ email });
        await env.DB.prepare(
          `INSERT OR REPLACE INTO entitlements
             (id, userId, productId, source, orderId, licenseType, grantedAt, extraData)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            sessionId,            // id
            uid,                  // userId
            "pro-lifetime",       // productId
            "purchase",           // source
            sessionId,            // orderId
            "lifetime",           // licenseType
            now,                  // grantedAt (ISO string)
            entitlementExtra      // extraData
          )
          .run();

        // Idempotent insert into orders
        // Schema: id, userId, productId, amount, currency, status, provider, providerOrderId, createdAt, extraData
        const orderExtra = JSON.stringify({ email });
        await env.DB.prepare(
          `INSERT OR REPLACE INTO orders
             (id, userId, productId, amount, currency, status, provider, providerOrderId, createdAt, extraData)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            sessionId,            // id
            uid,                  // userId
            "pro-lifetime",       // productId
            amountTotal / 100,    // amount (convert cents to dollars for REAL column)
            currency,             // currency
            "paid",               // status
            "stripe",             // provider
            sessionId,            // providerOrderId
            now,                  // createdAt (ISO string)
            orderExtra            // extraData
          )
          .run();

        console.log(`[stripe-webhook] Granted pro-lifetime to ${email} (${uid})`);
      } catch (dbErr: any) {
        console.error("[stripe-webhook] DB insert failed:", dbErr?.message || dbErr);
        return new Response(
          JSON.stringify({ error: "Database error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      break;
    }

    case "charge.refunded": {
      // entitlements table has no status/revoked_at column, so we log and continue.
      const charge = event.data.object;
      console.log("[stripe-webhook] charge.refunded (no-op — no revocation column):", charge.id);
      break;
    }

    default:
      console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
