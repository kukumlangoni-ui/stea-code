/**
 * Public catalog + product routes.
 */

import { Env, getDoc, listDocs } from "../firestore";
import { corsHeaders } from "../cors";

const PRODUCTS_COLLECTION = "stea_code_products";

/** Fields stripped from catalog responses to keep payloads small.
 *  The full product detail endpoint (/products/:id) returns everything.
 *  NOTE: sourceCode and publicFiles are kept because the modal (ProductDetail)
 *  uses them directly from the catalog product object. */
const CATALOG_STRIP_FIELDS = [
  "protectedFiles",
  "sourceFiles",
  "tags",
  "languages",
  "fileNames",
  "extraData",
  "createdBy",
  "updatedBy",
];

function safeProduct(raw: any): any {
  const p = { ...raw };
  for (const f of CATALOG_STRIP_FIELDS) {
    delete p[f];
  }
  if (p.preview && typeof p.preview === "object") {
    // Keep metadata (width, height, enabled, runtime, videoKey, posterKey)
    // Strip full HTML body — huge, not needed for card grid
    const { fullDocument, html, css, javascript, jsx, tsx, ...rest } = p.preview;
    p.preview = rest;
  }
  // Also strip demoPreview HTML body if present
  if (p.demoPreview && typeof p.demoPreview === "object") {
    const { fullDocument, html, css, javascript, jsx, tsx, ...rest } = p.demoPreview;
    p.demoPreview = rest;
  }
  return p;
}

export async function handleCatalog(req: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "";
    const category = url.searchParams.get("category") || "";

    const docs = await listDocs(env, PRODUCTS_COLLECTION, {});
    let products = docs
      .map((d) => ({ id: d.id, ...safeProduct(d.data) }))
      .filter((p) => p.status === "published");

    // scope=homepage → only products explicitly approved for the homepage.
    // This is the server-side safety gate that matches the frontend's expectation.
    if (scope === "homepage") {
      products = products.filter((p) => p.homepageVisible === true);
    }

    // Category filter (e.g. ?category=Components)
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    // Cache strategy:
    //   - Short edge cache (s-maxage=10) with max-age=0 so browsers always revalidate
    //   - stale-while-revalidate=30 ensures instantaneous edge response while refreshing
    return new Response(
      JSON.stringify({ products, total: products.length }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30, must-revalidate",
          ...corsHeaders(req.headers.get("origin")),
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Catalog fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleProduct(req: Request, env: Env, productId: string): Promise<Response> {
  try {
    let doc = await getDoc(env, PRODUCTS_COLLECTION, productId, {});
    // Fallback: try slug lookup
    if (!doc) {
      const all = await listDocs(env, PRODUCTS_COLLECTION, {});
      doc = all.find((d) => d.data.slug === productId) || null;
    }
    if (!doc) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }
    return new Response(
      JSON.stringify({ product: { id: doc.id, ...safeProduct(doc.data) } }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30, must-revalidate",
          ...corsHeaders(req.headers.get("origin")),
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Product fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}
