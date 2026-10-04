/**
 * STEA Code API — Cloudflare Worker entry point.
 *
 * Routes all /api/stea-code/* and /api/admin/stea-code/* requests.
 * Uses:
 *  - Firestore REST API (cached OAuth JWT via Web Crypto)
 *  - Native R2 binding (env.STEA_BUCKET)
 *  - AWS SigV4 signed URLs for downloads
 *  - Firebase Auth ID token verification (Web Crypto)
 */

import { corsHeaders, isPreflight, preflightResponse } from "./cors";
import { handleCatalog, handleProduct } from "./routes/catalog";
import { handlePreview, handleFreeContent, handleContent } from "./routes/content";
import { handleCheckout } from "./routes/checkout";
import { handleCheckoutProduct } from "./routes/checkout-product";
import { handleEntitlementsMe } from "./routes/entitlements";
import { handleDownload } from "./routes/download";
import { handleMedia, handleMediaUpload } from "./routes/media";
import { handleStripeWebhook } from "./routes/stripe-webhook";
import {
  handleRecordView,
  handleRecordCopy,
  handleProductStats,
  handleGetFavorites,
  handleAddFavorite,
  handleRemoveFavorite,
  handleToggleFavorite,
} from "./routes/engagement";
import {
  handleAdminProducts,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminDeleteProduct,
  handleAdminGetSource,
  handleAdminPutSource,
  handleAdminPutPreview,
  handleAdminGetPreview,
  handleAdminPackageUpload,
  handleAdminPreviewUpload,
} from "./routes/admin";

export interface WorkerEnv {
  // D1
  DB: D1Database;
  // Firebase Auth (project ID only — no service account needed)
  FIREBASE_PROJECT_ID: string;
  // R2
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  STEA_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (isPreflight(request)) {
      return preflightResponse(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Strip leading /api for matching
    const apiPath = path.replace(/^\/api/, "");
    const method = request.method;

    try {
      // ============ Public routes ============

      // POST /api/log-error — receive frontend error logs
      if (apiPath === "/log-error" && method === "POST") {
        try {
          const body: any = await request.json();
          const logEntry = {
            id: crypto.randomUUID(),
            level: body.level || "error",
            message: String(body.message || body.data?.[0] || body.reason || "").slice(0, 2000),
            stack: String(body.stack || body.error || body.reason || "").slice(0, 4000),
            url: String(body.url || body.filename || "").slice(0, 500),
            userAgent: String(request.headers.get("user-agent") || "").slice(0, 300),
            createdAt: new Date().toISOString(),
          };
          // Store in D1 for later inspection — best effort, never break
          try {
            await env.DB.prepare(
              `INSERT INTO error_logs (id, level, message, stack, url, user_agent, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              logEntry.id, logEntry.level, logEntry.message, logEntry.stack,
              logEntry.url, logEntry.userAgent, logEntry.createdAt
            ).run();
          } catch (dbErr) {
            // Table may not exist yet — just log to worker console
            console.warn("[log-error] DB insert failed (table may not exist):", dbErr);
          }
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders(request.headers.get("origin")) },
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(request.headers.get("origin")) },
          });
        }
      }

      if (apiPath === "/stea-code/catalog" && method === "GET") {
        return handleCatalog(request, env);
      }

      const productMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)$/);
      if (productMatch && method === "GET") {
        return handleProduct(request, env, productMatch[1]);
      }

      const previewMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/preview$/);
      if (previewMatch && method === "GET") {
        return handlePreview(request, env, previewMatch[1]);
      }

      const freeContentMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/free-content$/);
      if (freeContentMatch && method === "GET") {
        return handleFreeContent(request, env, freeContentMatch[1]);
      }

      const contentMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/content$/);
      if (contentMatch && method === "GET") {
        return handleContent(request, env, contentMatch[1]);
      }

      const downloadMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/download$/);
      if (downloadMatch && method === "GET") {
        return handleDownload(request, env, downloadMatch[1]);
      }

      // Public media (video, poster, images) from R2
      // /api/stea-code/media/upload (POST)
      if (apiPath === "/stea-code/media/upload" && method === "POST") {
        return handleMediaUpload(request, env);
      }
      if (apiPath === "/stea-code/media/upload" && method === "OPTIONS") {
        return handleMediaUpload(request, env);
      }

      // /api/stea-code/media/products/...
      const mediaMatch = apiPath.match(/^\/stea-code\/media\/(.+)$/);
      if (mediaMatch) {
        return handleMedia(request, env, mediaMatch[1]);
      }

      // Product stats (bulk)
      if (apiPath === "/stea-code/product-stats" && method === "GET") {
        return handleProductStats(request, env);
      }

      // View counter
      const viewMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/view$/);
      if (viewMatch && method === "POST") {
        return handleRecordView(request, env, viewMatch[1]);
      }

      // Copy counter
      const copyMatch = apiPath.match(/^\/stea-code\/products\/([^/]+)\/copy$/);
      if (copyMatch && method === "POST") {
        return handleRecordCopy(request, env, copyMatch[1]);
      }

      // Stripe checkout (auth required)
      if (apiPath === "/stea-code/checkout" && method === "POST") {
        return handleCheckout(request, env);
      }

      // Per-product Stripe checkout (auth required)
      if (apiPath === "/stea-code/checkout-product" && method === "POST") {
        return handleCheckoutProduct(request, env);
      }

      // Entitlements for current user (auth required)
      if (apiPath === "/stea-code/entitlements/me" && method === "GET") {
        return handleEntitlementsMe(request, env);
      }

      // Stripe webhook
      if (apiPath === "/stea-code/stripe-webhook" && method === "POST") {
        return handleStripeWebhook(request, env);
      }

      // Favorites — list (auth required)
      if (apiPath === "/stea-code/favorites" && method === "GET") {
        return handleGetFavorites(request, env);
      }

      // Favorites — toggle (auth required)
      const favMatch = apiPath.match(/^\/stea-code\/favorites\/([^/]+)$/);
      if (favMatch && method === "POST") {
        return handleToggleFavorite(request, env, favMatch[1]);
      }
      if (favMatch && method === "DELETE") {
        return handleRemoveFavorite(request, env, favMatch[1]);
      }

      // ============ Admin routes ============
      if (apiPath === "/admin/stea-code/products" && method === "GET") {
        return handleAdminProducts(request, env);
      }
      if (apiPath === "/admin/stea-code/products" && method === "POST") {
        return handleAdminCreateProduct(request, env);
      }

      const adminSourceMatch = apiPath.match(/^\/admin\/stea-code\/products\/([^/]+)\/source$/);
      if (adminSourceMatch && method === "GET") {
        return handleAdminGetSource(request, env, adminSourceMatch[1]);
      }
      if (adminSourceMatch && method === "PUT") {
        return handleAdminPutSource(request, env, adminSourceMatch[1]);
      }

      const adminPreviewPutMatch = apiPath.match(/^\/admin\/stea-code\/products\/([^/]+)\/preview$/);
      if (adminPreviewPutMatch && method === "GET") {
        return handleAdminGetPreview(request, env, adminPreviewPutMatch[1]);
      }
      if (adminPreviewPutMatch && method === "PUT") {
        return handleAdminPutPreview(request, env, adminPreviewPutMatch[1]);
      }

      const adminPackageMatch = apiPath.match(/^\/admin\/stea-code\/products\/([^/]+)\/package\/upload$/);
      if (adminPackageMatch && method === "POST") {
        return handleAdminPackageUpload(request, env, adminPackageMatch[1]);
      }

      const adminPreviewMatch = apiPath.match(/^\/admin\/stea-code\/products\/([^/]+)\/preview\/upload$/);
      if (adminPreviewMatch && method === "POST") {
        return handleAdminPreviewUpload(request, env, adminPreviewMatch[1]);
      }

      const adminProductMatch = apiPath.match(/^\/admin\/stea-code\/products\/([^/]+)$/);
      if (adminProductMatch && (method === "PATCH" || method === "PUT")) {
        return handleAdminUpdateProduct(request, env, adminProductMatch[1]);
      }
      if (adminProductMatch && method === "DELETE") {
        return handleAdminDeleteProduct(request, env, adminProductMatch[1]);
      }

      // ============ 404 ============
      return new Response(JSON.stringify({ error: "Not found", path: apiPath }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(request.headers.get("origin")) },
      });
    } catch (e: any) {
      console.error("[stea-api] Unhandled error:", e);
      return new Response(
        JSON.stringify({ error: "Internal server error", detail: e?.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders(request.headers.get("origin")) },
        }
      );
    }
  },
};
