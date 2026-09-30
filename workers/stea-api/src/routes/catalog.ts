/**
 * Public catalog + product routes.
 */

import { Env, getDoc, listDocs } from "../firestore";
import { corsHeaders } from "../cors";

const PRODUCTS_COLLECTION = "stea_code_products";

/** Fields stripped from catalog responses to keep payloads small.
 *  The full product detail endpoint (/products/:id) returns everything.
 *  sourceCode and publicFiles are stripped — they're fetched per-product
 *  on modal open via /api/stea-code/products/:id. */
const CATALOG_STRIP_FIELDS = [
  "protectedFiles",
  "sourceFiles",
  "sourceCode",           // huge — fetched per-product on modal open
  "publicFiles",          // huge — fetched per-product on modal open
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
    //   - 60s browser cache (max-age) for instant back/forward nav
    //   - 2min CDN edge cache (s-maxage) for fast global response
    //   - 10min stale-while-revalidate — serves old data while refreshing
    return new Response(
      JSON.stringify({ products, total: products.length }),
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
          "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
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
