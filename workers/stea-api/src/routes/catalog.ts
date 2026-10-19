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
  "deliverablesSource",   // huge authoring payload — never rendered publicly
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

const HOMEPAGE_CARD_COLUMNS = [
  "id",
  "slug",
  "titleEn",
  "titleZh",
  "shortDescriptionEn",
  "shortDescriptionZh",
  "price",
  "pricingType",
  "category",
  "subcategory",
  "tab",
  "status",
  "featured",
  "homepageVisible",
  "frameworks",
  "posterImageUrl",
  "previewVideoUrl",
  "previewMode",
  "preview",
  "gallery",
  "designWidth",
  "designHeight",
  "createdAt",
  "updatedAt",
];

function parseJsonColumn(value: any, fallback: any): any {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Homepage cards only need a small subset of columns. Querying just those
 * columns avoids loading multi-megabyte source/authoring blobs from D1 and
 * keeps the first catalog response small enough to cache effectively.
 */
async function listHomepageCards(env: Env): Promise<any[]> {
  const columns = [...new Set(HOMEPAGE_CARD_COLUMNS)].join(", ");
  const result = await env.DB.prepare(
    `SELECT ${columns}
       FROM products
      WHERE status = 'published' AND homepageVisible = 1
      ORDER BY featured DESC, createdAt DESC`
  ).all();

  return (result.results || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    titleEn: row.titleEn,
    titleZh: row.titleZh,
    shortDescriptionEn: row.shortDescriptionEn,
    shortDescriptionZh: row.shortDescriptionZh,
    price: Number(row.price) || 0,
    pricingType: row.pricingType,
    category: row.category,
    subcategory: row.subcategory,
    tab: row.tab,
    status: row.status,
    featured: row.featured === 1 || row.featured === true,
    homepageVisible: row.homepageVisible === 1 || row.homepageVisible === true,
    frameworks: parseJsonColumn(row.frameworks, []),
    posterImageUrl: row.posterImageUrl,
    previewVideoUrl: row.previewVideoUrl,
    previewMode: row.previewMode,
    preview: parseJsonColumn(row.preview, null),
    gallery: parseJsonColumn(row.gallery, []),
    designWidth: row.designWidth === null ? null : Number(row.designWidth),
    designHeight: row.designHeight === null ? null : Number(row.designHeight),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function handleCatalog(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "";
    const category = url.searchParams.get("category") || "";
    const subcategory = url.searchParams.get("subcategory") || "";
    const canUseHomepageCache = scope === "homepage" && !category && !subcategory;
    const homepageCacheKey = new Request(
      "https://stea-code.internal/catalog/homepage-v1",
      { method: "GET" }
    );

    if (canUseHomepageCache) {
      const cached = await caches.default.match(homepageCacheKey);
      if (cached) {
        return new Response(await cached.text(), {
          status: cached.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=30, s-maxage=300, stale-while-revalidate=600",
            "X-STEA-Catalog-Cache": "HIT",
            ...corsHeaders(req.headers.get("origin")),
          },
        });
      }
    }

    let products: any[];
    if (scope === "homepage") {
      products = await listHomepageCards(env);
    } else {
      const docs = await listDocs(env, PRODUCTS_COLLECTION, {});
      products = docs
        .map((d) => ({ id: d.id, ...safeProduct(d.data) }))
        .filter((p) => p.status === "published");
    }

    // Category filter (e.g. ?category=Components)
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    // Subcategory filter (e.g. ?subcategory=Pricing Tables). Only meaningful
    // for Layout; combines with category when both are present.
    if (subcategory) {
      products = products.filter((p) => (p.subcategory || "") === subcategory);
    }

    // Cache strategy:
    //   - 60s browser cache (max-age) for instant back/forward nav
    //   - 2min CDN edge cache (s-maxage) for fast global response
    //   - 10min stale-while-revalidate — serves old data while refreshing
    const body = JSON.stringify({ products, total: products.length });
    const response = new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": scope === "homepage"
          ? "public, max-age=30, s-maxage=300, stale-while-revalidate=600"
          : "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
        ...corsHeaders(req.headers.get("origin")),
      },
    });

    if (canUseHomepageCache && ctx) {
      ctx.waitUntil(
        caches.default.put(
          homepageCacheKey,
          new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30, s-maxage=300",
            },
          })
        )
      );
    }

    return response;
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
