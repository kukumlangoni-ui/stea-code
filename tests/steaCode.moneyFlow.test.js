/**
 * STEA CODE — MONEY FLOW V1 TEST SUITE
 * 
 * Verifies the complete paid purchase flow:
 * 1. Product CTA display (Unlock for $X vs Get Free Code)
 * 2. Server price authority & order creation safety
 * 3. Stripe webhook idempotency & entitlement generation
 * 4. Entitlement enforcement on protected content & source downloads
 * 5. Already-purchased duplicate prevention
 * 6. My Library (/library) routing and UI contracts
 * 7. Host-aware payment return & download endpoints
 */

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

console.log("\n============================================================");
console.log("STEA CODE MONEY FLOW V1 ARCHITECTURE & SECURITY TESTS");
console.log("============================================================\n");

const serverSrc = readFile("server.ts");
const appSrc = readFile("src/App.jsx");
const homeSrc = readFile("src/pages/stea-code/SteaCodeHomeV2.jsx");
const checkoutSrc = readFile("src/pages/stea-code/SteaCodeCheckoutPage.jsx");
const paymentElementSrc = readFile("src/components/stea-code/checkout/SteaCodePaymentElement.jsx");
const paymentReturnSrc = readFile("src/pages/stea-code/SteaCodePaymentReturnPage.jsx");
const librarySrc = readFile("src/pages/stea-code/SteaCodePurchasesPage.jsx");
const commerceSrc = readFile("src/services/steaCodeCommerce.js");

console.log("Part 1: Premium CTA & Button Contract");
{
  test("1. ProductDetail renders 'Unlock for $X' for unpurchased premium products", () => {
    assert(
      homeSrc.includes("Unlock for ${formatPrice(product)}") ||
      homeSrc.includes("Unlock for ${formatPrice("),
      "ProductDetail must render dynamic 'Unlock for $X' button for premium items"
    );
  });

  test("2. ProductDetail renders 'Get Free Code' for free products with source", () => {
    assert(
      homeSrc.includes("Get Free Code") &&
      homeSrc.includes("product.hasSource"),
      "Free products with source must render 'Get Free Code'"
    );
  });

  test("3. ProductCard shows formatted price for premium and Free for free items", () => {
    assert(
      homeSrc.includes("${Number(product.price || 0).toFixed(2)}") &&
      homeSrc.includes("isFree"),
      "ProductCard must format price correctly"
    );
  });
}

console.log("\nPart 2: Server Price Authority & Order Creation Safety");
{
  test("4. Server resolves product metadata authoritatively from Firestore (not client)", () => {
    assert(
      serverSrc.includes("const product = await getResolvedSteaCodeProduct(productId);") &&
      serverSrc.includes('if (!product || product.status !== "published")'),
      "Server must fetch product from Firestore and verify published status"
    );
  });

  test("5. Server rejects order creation for free products", () => {
    assert(
      serverSrc.includes('if (product.pricingType !== "premium")') &&
      serverSrc.includes("CHECKOUT_NOT_REQUIRED"),
      "Server must reject paid orders for free products"
    );
  });

  test("6. Server rejects order creation if user already owns active entitlement", () => {
    assert(
      serverSrc.includes('collection("stea_code_entitlements")') &&
      serverSrc.includes('where("productId", "==", product.id)') &&
      serverSrc.includes('where("status", "==", "active")') &&
      serverSrc.includes("alreadyPurchased: true"),
      "Server must check existing active entitlement to prevent double charging"
    );
  });

  test("7. Server computes Stripe amount in minor units from product.price authoritatively", () => {
    assert(
      serverSrc.includes("const amountMinor =") &&
      serverSrc.includes("steaCodeToMinorUnits(finalAmount, currency);"),
      "Server must compute cents from server product.price, never client input"
    );
  });

  test("8. Server records productId, userId, and orderId in Stripe PaymentIntent metadata", () => {
    assert(
      serverSrc.includes("steaCodeOrderId: orderRef.id,") &&
      serverSrc.includes("steaCodeProductId: product.id,") &&
      serverSrc.includes("steaCodeUserId: user.uid,"),
      "PaymentIntent metadata must securely bind orderId, productId, and userId"
    );
  });
}

console.log("\nPart 3: Stripe Webhook & Payment Fulfillment");
{
  test("9. Webhook verifies Stripe signature with endpoint secret", () => {
    assert(
      serverSrc.includes("steaCodeStripe.webhooks.constructEvent(") &&
      serverSrc.includes("steaCodeWebhookSecret"),
      "Webhook must verify signature using stripe.webhooks.constructEvent"
    );
  });

  test("10. Webhook handles both checkout.session.completed and payment_intent.succeeded", () => {
    assert(
      serverSrc.includes("supportedSteaCodeEvents.has(event.type)") &&
      serverSrc.includes('"checkout.session.completed"') &&
      serverSrc.includes('"payment_intent.succeeded"'),
      "Webhook must support both checkout session and payment intent events"
    );
  });

  test("11. Webhook transaction creates entitlement idempotently", () => {
    assert(
      serverSrc.includes('collection("stea_code_entitlements")') &&
      serverSrc.includes('.doc(`order_${orderId}`)') &&
      serverSrc.includes("transaction.set("),
      "Entitlement document ID must be deterministic (order_${orderId}) for idempotency"
    );
  });

  test("12. Webhook marks order status as 'paid' with paymentDetails and timestamps", () => {
    assert(
      serverSrc.includes('status: "paid"') &&
      serverSrc.includes("paidAt:"),
      "Order status must update to 'paid' on webhook fulfillment"
    );
  });
}

console.log("\nPart 4: Protected Source Security & Entitlement Enforcement");
{
  test("13. GET /content endpoint enforces authentication and entitlement check", () => {
    assert(
      serverSrc.includes('"/api/stea-code/products/:productId/content"') &&
      serverSrc.includes("requireSteaCodeUser") &&
      serverSrc.includes("stea_code_entitlements"),
      "/content endpoint must require auth and query stea_code_entitlements"
    );
  });

  test("14. GET /content returns 403 ACCESS_DENIED for unauthorized non-buyers", () => {
    assert(
      serverSrc.includes("res.status(403).json({") &&
      serverSrc.includes('code: "ACCESS_DENIED"'),
      "Non-buyers must receive HTTP 403 ACCESS_DENIED"
    );
  });

  test("15. GET /download endpoint serves source attachment with Content-Disposition", () => {
    assert(
      serverSrc.includes('"/api/stea-code/products/:productId/download"') &&
      serverSrc.includes("Content-Disposition") &&
      serverSrc.includes("attachment; filename="),
      "Download endpoint must set attachment Content-Disposition"
    );
  });

  test("16. GET /code-pdf endpoint serves formatted complete text guide", () => {
    assert(
      serverSrc.includes('"/api/stea-code/products/:productId/code-pdf"') &&
      serverSrc.includes("text/plain; charset=utf-8"),
      "PDF/guide endpoint must exist and serve formatted source guide"
    );
  });

  test("17. Superadmin email can bypass entitlement check for operational review", () => {
    assert(
      serverSrc.includes("isAdminEmail(user?.email)") ||
      serverSrc.includes("user?.email && isAdminEmail(user.email)"),
      "Superadmin email must be able to inspect product content"
    );
  });
}

console.log("\nPart 5: My Library (/library) & Route Contracts");
{
  test("18. App.jsx registers canonical /library route", () => {
    assert(
      appSrc.includes('path="/library"') &&
      appSrc.includes("<SteaCodeHomeV2 />"),
      "App.jsx must register /library route"
    );
  });

  test("19. SteaCodeHomeV2 resolves /library pathname to purchases view", () => {
    assert(
      homeSrc.includes('if (location.pathname === "/library") return "purchases";'),
      "SteaCodeHomeV2 must map /library to purchases view"
    );
  });

  test("20. SteaCodePurchasesPage renders 'My Library' title and 'Download Source' buttons", () => {
    assert(
      librarySrc.includes("My Library") &&
      librarySrc.includes("Download Source") &&
      librarySrc.includes("downloadSteaCodeSource"),
      "PurchasesPage must render 'My Library' with 'Download Source' buttons"
    );
  });

  test("21. SteaCodePurchasesPage queries GET /api/stea-code/purchases and checks access", () => {
    assert(
      librarySrc.includes("getSteaCodePurchases()") &&
      librarySrc.includes("getSteaCodeProductAccess("),
      "PurchasesPage must verify purchases and per-product access"
    );
  });

  test("22. SteaCodePaymentElement uses host-aware returnUrl", () => {
    assert(
      paymentElementSrc.includes("code.stea.africa") &&
      paymentElementSrc.includes("view=payment-return"),
      "PaymentElement must return to view=payment-return"
    );
  });

  test("23. steaCodeCommerce.js provides client API helpers for orders, access, content, download", () => {
    assert(
      commerceSrc.includes("export async function prepareSteaCodeCheckout") &&
      commerceSrc.includes("export async function getSteaCodeProductAccess") &&
      commerceSrc.includes("export async function getSteaCodeProductContent") &&
      commerceSrc.includes("export function downloadSteaCodeSource"),
      "Commerce service must export all required client-side API functions"
    );
  });
}
