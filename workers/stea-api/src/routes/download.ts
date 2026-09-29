/**
 * Download route — returns a 302 redirect to a signed R2 URL.
 * Free products: no auth. Premium: requires entitlement.
 */

import { getDoc } from "../firestore";
import type { Env } from "../firestore";
import { corsHeaders } from "../cors";
import { getSignedDownloadUrl } from "../r2";
import { verifyFirebaseToken, extractBearerToken } from "../auth";
import type { WorkerEnv } from "../index";

const PRODUCTS_COLLECTION = "stea_code_products";
const ENTITLEMENTS_COLLECTION = "stea_code_entitlements";

export async function handleDownload(req: Request, env: WorkerEnv, productId: string): Promise<Response> {
  try {
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!productDoc) {
      return new Response(JSON.stringify({ error: "Product not found", code: "PRODUCT_NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const isFree = productDoc.data.pricingType === "free";

    if (!isFree) {
      const token = extractBearerToken(req);
      if (!token) {
        return new Response(JSON.stringify({ error: "Authentication required", code: "AUTH_REQUIRED" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        });
      }
      const decoded = await verifyFirebaseToken(env, token);
      const entitlementId = `${decoded.uid}_${productDoc.id}`;
      const entitlementDoc = await getDoc(env, ENTITLEMENTS_COLLECTION, entitlementId);
      if (!entitlementDoc) {
        return new Response(JSON.stringify({ error: "Premium access required", code: "ACCESS_DENIED" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        });
      }
    }

    const storageKey = productDoc.data.package?.storageKey;
    if (!storageKey) {
      return new Response(
        JSON.stringify({ error: "No downloadable package found for this product", code: "NO_PACKAGE" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        }
      );
    }

    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    const bucketName = env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return new Response(JSON.stringify({ error: "R2 not configured", code: "R2_NOT_CONFIGURED" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const signedUrl = await getSignedDownloadUrl(
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      storageKey,
      300 // 5 minutes
    );

    // ============================================================
    // Track download — fire-and-forget
    // ============================================================
    try {
      // Increment download counter on the product
      env.DB.prepare(
        "UPDATE products SET downloads = COALESCE(downloads, 0) + 1 WHERE id = ?"
      )
        .bind(productDoc.id)
        .run()
        .catch((e) => console.warn("[download] counter increment skipped:", e));

      // If user is authed, record in user_downloads table
      const token = extractBearerToken(req);
      if (token) {
        verifyFirebaseToken(env, token)
          .then((decoded) => {
            const downloadId = crypto.randomUUID();
            const downloadedAt = new Date().toISOString();
            const isFree = productDoc.data.pricingType === "free";
            const licenseType = isFree ? null : "personal";
            return env.DB.prepare(
              "INSERT OR IGNORE INTO user_downloads (id, userId, productId, downloadedAt, licenseType) VALUES (?, ?, ?, ?, ?)"
            )
              .bind(downloadId, decoded.uid, productDoc.id, downloadedAt, licenseType)
              .run();
          })
          .catch((e) => console.warn("[download] user_downloads tracking skipped:", e));
      }
    } catch (e) {
      // Never let tracking break the download
      console.warn("[download] tracking error (non-fatal):", e);
    }

    return Response.redirect(signedUrl, 302);
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Could not download product source", code: "DOWNLOAD_FAILED", detail: e?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}
