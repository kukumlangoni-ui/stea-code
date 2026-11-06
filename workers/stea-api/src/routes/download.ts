/**
 * Download route — returns a 302 redirect to a signed R2 URL.
 * Requires a signed-in email (first-party `stea_session` cookie or Cloudflare
 * Access) and, for paid products, a matching row in `purchases`.
 */

import { getDoc } from "../firestore";
import { corsHeaders } from "../cors";
import { getSignedDownloadUrl } from "../r2";
import { resolveAccessEmail } from "../auth";
import { getSessionUser } from "../session";
import type { WorkerEnv } from "../index";

const PRODUCTS_COLLECTION = "stea_code_products";

function json(req: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
  });
}

/**
 * Check whether `email` owns `productId` (or the Pro lifetime product).
 */
async function hasPurchase(env: WorkerEnv, email: string, productId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT 1 FROM purchases
      WHERE lower(email) = ?
        AND (productId = ? OR productId = 'pro-lifetime')
        AND lower(status) = 'paid'
      LIMIT 1`
  )
    .bind(email, productId)
    .first();
  return Boolean(row);
}

export async function handleDownload(req: Request, env: WorkerEnv, productId: string): Promise<Response> {
  try {
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!productDoc) {
      return json(req, { error: "Product not found", code: "PRODUCT_NOT_FOUND" }, 404);
    }

    // Free products are downloadable by anyone — no email, no login. Paid
    // products still require a signed-in identity plus a purchase row.
    const isFree = productDoc.data.pricingType === "free" || productDoc.data.isFree === true;

    const accessEmail = await resolveAccessEmail(req);
    const sessionEmail = accessEmail ? null : (await getSessionUser(req, env))?.email || null;
    const email = accessEmail || sessionEmail;

    if (!email && !isFree) {
      return json(req, { error: "Please sign in with your email to download", code: "AUTH_REQUIRED" }, 401);
    }

    if (!isFree && !(await hasPurchase(env, email!, productDoc.id))) {
      return json(req, { error: "Purchase required", code: "ACCESS_DENIED" }, 403);
    }

    const storageKey = productDoc.data.package?.storageKey;
    if (!storageKey) {
      return json(req, { error: "No downloadable package found for this product", code: "NO_PACKAGE" }, 404);
    }

    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    const bucketName = env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return json(req, { error: "R2 not configured", code: "R2_NOT_CONFIGURED" }, 503);
    }

    const signedUrl = await getSignedDownloadUrl(
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      storageKey,
      300 // 5 minutes
    );

    // Track download — fire-and-forget, never blocks the redirect.
    try {
      env.DB.prepare(
        "UPDATE products SET downloads = COALESCE(downloads, 0) + 1 WHERE id = ?"
      )
        .bind(productDoc.id)
        .run()
        .catch((e) => console.warn("[download] counter increment skipped:", e));

      const downloadId = crypto.randomUUID();
      const downloadedAt = new Date().toISOString();
      const licenseType = isFree ? null : "personal";
      if (email) {
        env.DB.prepare(
          "INSERT OR IGNORE INTO user_downloads (id, userId, productId, downloadedAt, licenseType) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(downloadId, email, productDoc.id, downloadedAt, licenseType)
          .run()
          .catch((e) => console.warn("[download] user_downloads tracking skipped:", e));
      }
    } catch (e) {
      console.warn("[download] tracking error (non-fatal):", e);
    }

    return Response.redirect(signedUrl, 302);
  } catch (e: any) {
    return json(
      req,
      { error: "Could not download product source", code: "DOWNLOAD_FAILED", detail: e?.message },
      500
    );
  }
}
