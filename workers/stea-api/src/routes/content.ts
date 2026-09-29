/**
 * Product preview + content routes.
 * - GET /products/:id/preview → live preview source (HTML/CSS/JS or full doc)
 * - GET /products/:id/free-content → free source files
 * - GET /products/:id/content → premium source files (auth + entitlement)
 */

import { Env, getDoc } from "../firestore";
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
