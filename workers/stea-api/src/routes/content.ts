/**
 * Product preview + content routes.
 * - GET /products/:id/preview → live preview source (HTML/CSS/JS or full doc)
 * - GET /products/:id/preview-card → sanitized card preview (HTML+CSS, no JS for non-buyers)
 * - GET /products/:id/free-content → free source files
 * - GET /products/:id/content → premium source files (auth + entitlement)
 */

import { Env, getDoc, listDocs } from "../firestore";
import { corsHeaders } from "../cors";
import { extractBearerToken, verifyFirebaseToken } from "../auth";

const PRODUCTS_COLLECTION = "stea_code_products";
const PREVIEWS_COLLECTION = "stea_code_product_previews";
const SOURCES_COLLECTION = "stea_code_product_sources";
const ENTITLEMENTS_COLLECTION = "stea_code_entitlements";

export async function handlePreview(req: Request, env: Env, productId: string): Promise<Response> {
  try {
    // Always load the product doc first — we need its preview SETTINGS
    // (width, height, enabled, runtime, viewportMode, scaleMode, etc.)
    // which are the source of truth for how the preview should render.
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId, {});
    const productPreview = productDoc?.data?.preview || {};

    const previewDoc = await getDoc(env, PREVIEWS_COLLECTION, productId, {});

    if (previewDoc) {
      // Merge: preview SOURCE (from previews collection) + preview SETTINGS
      // (from product doc). Settings win for display config, source wins
      // for code content. productPreview is spread LAST so its settings
      // (width, height, enabled, runtime, viewportMode, scaleMode)
      // override any null/undefined values in previewDoc.data.
      // previewDoc.data provides the heavy content fields (html, css,
      // javascript, jsx, tsx, fullDocument) which productPreview lacks.
      const merged = {
        ...previewDoc.data,
        ...productPreview,
      };
      return new Response(JSON.stringify({ preview: merged }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30, must-revalidate",
          ...corsHeaders(req.headers.get("origin")),
        },
      });
    }
    // Fallback: use embedded preview from product doc
    if (productPreview && Object.keys(productPreview).length > 0) {
      return new Response(JSON.stringify({ preview: productPreview }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30, must-revalidate",
          ...corsHeaders(req.headers.get("origin")),
        },
      });
    }
    // Final fallback: use products.sourceCode as fullDocument preview.
    // Some products have their code in sourceCode but no separate previews doc.
    const sourceCode = productDoc?.data?.sourceCode;
    if (sourceCode && typeof sourceCode === "string" && sourceCode.length > 100) {
      const fallbackPreview = {
        fullDocument: sourceCode,
        runtime: productPreview.runtime || "full-html",
        width: productPreview.width || productDoc?.data?.designWidth || 1600,
        height: productPreview.height || productDoc?.data?.designHeight || 1100,
        enabled: productPreview.enabled !== false,
        viewportMode: productPreview.viewportMode,
        scaleMode: productPreview.scaleMode,
      };
      return new Response(JSON.stringify({ preview: fallbackPreview }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30, must-revalidate",
          ...corsHeaders(req.headers.get("origin")),
        },
      });
    }
    return new Response(JSON.stringify({ preview: null }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-maxage=10, must-revalidate",
        ...corsHeaders(req.headers.get("origin")),
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Preview fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleFreeContent(req: Request, env: Env, productId: string): Promise<Response> {
  try {
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!productDoc) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const isFree = productDoc.data.pricingType === "free";
    let files: any[] = [];

    if (isFree) {
      // Free products: return publicFiles from the product doc
      files = productDoc.data.publicFiles || [];
      if (!files.length) {
        // Fallback to source collection
        const sourceDoc = await getDoc(env, SOURCES_COLLECTION, productId);
        files = sourceDoc?.data?.files || [];
      }
      if (!files.length) {
        // Final fallback: build files from the live preview document
        // (same data the preview iframe uses — stored in previews collection
        // or embedded in product.preview). This ensures "Copy Source Code"
        // works for any free product that has a working live preview, even
        // if publicFiles/sources haven't been explicitly set.
        const previewDoc = await getDoc(env, PREVIEWS_COLLECTION, productId);
        const previewData = previewDoc?.data || productDoc.data.preview || {};
        let htmlContent = "";
        if (previewData.fullDocument && typeof previewData.fullDocument === "string") {
          htmlContent = previewData.fullDocument;
        } else if (previewData.html && typeof previewData.html === "string") {
          // Wrap fragment into a full document
          const css = previewData.css || "";
          const js = previewData.javascript || "";
          const hasDoctype = previewData.html.trim().toLowerCase().startsWith("<!doctype");
          if (hasDoctype) {
            htmlContent = previewData.html
              .replace("</head>", `<style>${css}</style></head>`)
              .replace("</body>", `<script>${js}</script></body>`);
          } else {
            htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Component</title>
<style>${css}</style>
</head>
<body>
${previewData.html}
<script>${js}</script>
</body>
</html>`;
          }
        }
        if (htmlContent) {
          files = [{ name: "index.html", content: htmlContent, language: "html" }];
        }
      }
    }

    return new Response(
      JSON.stringify({
        product: {
          id: productDoc.id,
          titleEn: productDoc.data.titleEn,
          pricingType: productDoc.data.pricingType,
          fileNames: productDoc.data.fileNames || [],
          files,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Free content fetch failed", code: "FREE_CONTENT_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleContent(req: Request, env: Env, productId: string): Promise<Response> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "AUTH_REQUIRED" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const decoded = await verifyFirebaseToken(env, token);
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!productDoc) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const isFree = productDoc.data.pricingType === "free";

    if (!isFree) {
      // Check entitlement
      const entitlementId = `${decoded.uid}_${productDoc.id}`;
      const entitlementDoc = await getDoc(env, ENTITLEMENTS_COLLECTION, entitlementId);
      if (!entitlementDoc) {
        return new Response(JSON.stringify({ error: "Premium access required", code: "ACCESS_DENIED" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
        });
      }
    }

    // Get source files
    const sourceDoc = await getDoc(env, SOURCES_COLLECTION, productId);
    const files = sourceDoc?.data?.files || productDoc.data.protectedFiles || [];

    return new Response(
      JSON.stringify({
        access: true,
        product: {
          id: productDoc.id,
          slug: productDoc.data.slug,
          titleEn: productDoc.data.titleEn,
          files,
        },
        entitlement: isFree
          ? { orderId: "free", licenseType: "free", status: "active" }
          : {
              orderId: (await getDoc(env, ENTITLEMENTS_COLLECTION, `${decoded.uid}_${productDoc.id}`))?.data?.orderId,
              licenseType: (await getDoc(env, ENTITLEMENTS_COLLECTION, `${decoded.uid}_${productDoc.id}`))?.data?.licenseType,
              status: "active",
            },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Content fetch failed", code: "CONTENT_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

/**
 * Card preview endpoint — returns a sanitized preview for grid cards.
 *
 * Security model:
 *   - Free products: full preview (HTML + CSS + JS)
 *   - Premium products, authenticated user with entitlement: full preview
 *   - Premium products, no auth or no entitlement: sanitized (HTML + CSS only, no JS/JSX/TSX)
 *
 * This lets non-buyers see the component design in cards without exposing
 * the paid JavaScript logic.
 */
export async function handleProductPreviewCard(req: Request, env: Env, productId: string): Promise<Response> {
  try {
    // 1. Load product doc + preview source (same merge logic as handlePreview)
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId, {});

    // Fallback: slug lookup
    let product = productDoc;
    if (!product) {
      const all = await listDocs(env, PRODUCTS_COLLECTION, {});
      product = all.find((d) => d.data.slug === productId) || null;
    }

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const productPreview = product.data?.preview || {};
    const previewDoc = await getDoc(env, PREVIEWS_COLLECTION, product.id, {});

    // Merge preview source (from previews collection) with preview settings
    // (from product doc). Same logic as handlePreview.
    let previewData: any = {};
    if (previewDoc) {
      previewData = { ...previewDoc.data, ...productPreview };
    } else if (productPreview && Object.keys(productPreview).length > 0) {
      previewData = { ...productPreview };
    }

    // Fallback: if previews collection has no real content, use products.sourceCode
    // as fullDocument. Some products have code only in sourceCode, not in a
    // separate previews doc.
    const hasPreviewContent = Boolean(
      (previewData.fullDocument && typeof previewData.fullDocument === "string" && previewData.fullDocument.length > 100) ||
      (previewData.html && typeof previewData.html === "string" && previewData.html.length > 50) ||
      (previewData.css && typeof previewData.css === "string" && previewData.css.length > 50) ||
      (previewData.javascript && typeof previewData.javascript === "string" && previewData.javascript.length > 50)
    );
    if (!hasPreviewContent) {
      const sourceCode = product.data?.sourceCode;
      if (sourceCode && typeof sourceCode === "string" && sourceCode.length > 100) {
        previewData = {
          ...previewData,
          fullDocument: sourceCode,
          runtime: previewData.runtime || "full-html",
        };
      }
    }

    // 2. Determine access level
    const isFree = product.data.pricingType === "free";
    let hasFullAccess = isFree;

    if (!isFree) {
      // Check auth — Authorization header is optional for this endpoint
      const token = extractBearerToken(req);
      if (token) {
        try {
          const decoded = await verifyFirebaseToken(env, token);
          const uid = decoded.uid;

          // Check D1 entitlements: pro-lifetime OR per-product entitlement
          const result = await env.DB.prepare(
            "SELECT productId FROM entitlements WHERE userId = ? AND (productId = ? OR productId = 'pro-lifetime') LIMIT 1"
          )
            .bind(uid, product.id)
            .all();

          const rows = result.results || [];
          hasFullAccess = rows.length > 0;
        } catch {
          // Token invalid or verification failed — treat as unauthenticated
          hasFullAccess = false;
        }
      }
    }

    // 3. Build the response
    const runtime = String(previewData.runtime || "full-html");
    const width = Number(previewData.width || product.data.designWidth || 1600);
    const height = Number(previewData.height || product.data.designHeight || 1100);

    let responsePreview: any = {
      runtime,
      width,
      height,
      enabled: previewData.enabled !== false,
    };

    // Always include HTML and CSS (these are the visual parts)
    if (previewData.fullDocument && typeof previewData.fullDocument === "string") {
      responsePreview.fullDocument = previewData.fullDocument;
    }
    if (previewData.html && typeof previewData.html === "string") {
      responsePreview.html = previewData.html;
    }
    if (previewData.css && typeof previewData.css === "string") {
      responsePreview.css = previewData.css;
    }

    // Include metadata fields that the card renderer uses
    if (previewData.viewportMode) responsePreview.viewportMode = previewData.viewportMode;
    if (previewData.scaleMode) responsePreview.scaleMode = previewData.scaleMode;

    if (hasFullAccess) {
      // Full access: include JS/JSX/TSX
      if (previewData.javascript && typeof previewData.javascript === "string") {
        responsePreview.javascript = previewData.javascript;
      }
      if (previewData.jsx && typeof previewData.jsx === "string") {
        responsePreview.jsx = previewData.jsx;
      }
      if (previewData.tsx && typeof previewData.tsx === "string") {
        responsePreview.tsx = previewData.tsx;
      }
      responsePreview.sanitized = false;
      responsePreview.static = false;
    } else {
      // Sanitized: strip JS/JSX/TSX — show the design but not the logic
      responsePreview.sanitized = true;
      // If there's no HTML/CSS but there IS JS, it's a JS-only component
      // (e.g. Three.js). Mark as static so the card can show a fallback.
      const hasVisualContent = Boolean(
        responsePreview.html || responsePreview.css || responsePreview.fullDocument
      );
      const hasOnlyJs = !hasVisualContent && Boolean(
        previewData.javascript || previewData.jsx || previewData.tsx
      );
      responsePreview.static = hasOnlyJs;
    }

    // Cache: 60s browser, 2min edge, 10min stale-while-revalidate
    // (same as catalog — card previews are public content)
    return new Response(
      JSON.stringify({
        id: product.id,
        preview: responsePreview,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
          ...corsHeaders(req.headers.get("origin")),
        },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Card preview fetch failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}
