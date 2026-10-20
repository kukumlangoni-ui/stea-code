/**
 * Public catalog + product routes.
 */

import { Env, getDoc, listDocs } from "../firestore";
import { corsHeaders } from "../cors";

const PRODUCTS_COLLECTION = "stea_code_products";
const PREVIEWS_COLLECTION = "stea_code_product_previews";
const SOURCES_COLLECTION = "stea_code_product_sources";

/** Fields stripped from catalog responses to keep payloads small.
 *  The full product detail endpoint (/products/:id) returns everything.
 *  sourceCode and publicFiles are stripped — they're fetched per-product
 *  on modal open via /api/stea-code/products/:id.
 *
 *  bookContentHtml and bookDownloadUrl are the PAID eBook payload. They are
 *  stripped here (and never re-added anywhere public) — buyers fetch them
 *  from GET /api/stea-code/products/:id/book-content, which enforces auth +
 *  entitlement.
 *
 *  salesPageHtml (the eBook 3D cover) is public marketing, but it is also
 *  ~130KB of HTML, so it is stripped from every list/detail response too and
 *  served from its own GET /api/stea-code/products/:id/sales-page endpoint —
 *  one source of truth, and the catalog stays small as books are added. */
const CATALOG_STRIP_FIELDS = [
  "protectedFiles",
  "sourceFiles",
  "sourceCode",           // huge — fetched per-product on modal open
  "publicFiles",          // huge — fetched per-product on modal open
  "deliverablesSource",   // huge authoring payload — never rendered publicly
  "bookContentHtml",      // PAID eBook chapters — entitlement-gated endpoint only
  "bookDownloadUrl",      // PAID PDF/ZIP — entitlement-gated endpoint only
  "salesPageHtml",        // public, but heavy — dedicated /sales-page endpoint
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

/**
 * True when a product actually has source code, i.e. when "Copy Source Code"
 * would produce text.
 *
 * Why this lives on the server: safeProduct() strips sourceCode, publicFiles,
 * protectedFiles, sourceFiles and the preview markup, so a client watching the
 * public payload cannot tell a code-less poster from a component. Without this
 * flag the button is driven by product type alone and shows on products with
 * nothing to copy (measured on production: 9 poster-only layouts plus one kit
 * have no code in any column, and no product uses the file-array columns at
 * all — their code lives in `sourceCode` or the previews table).
 *
 * The rule mirrors the copy endpoints exactly:
 *   - code embedded on the product document (sourceCode / *Files)
 *   - a dedicated `sources` bundle row
 *   - free products: their live preview, which handleFreeContent synthesises
 *     into an index.html. Paid products get no preview fallback
 *     (handleContent reads files only), so they don't count one either.
 */
function hasText(value: any): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasText);
  if (value && typeof value === "object") return Object.values(value).some(hasText);
  return false;
}

async function resolveHasSource(env: Env, productId: string, raw: any): Promise<boolean> {
  if (hasText(raw.sourceCode)) return true;
  if (hasText(raw.publicFiles) || hasText(raw.protectedFiles) || hasText(raw.sourceFiles)) return true;

  const sourceDoc = await getDoc(env, SOURCES_COLLECTION, productId, {});
  if (hasText(sourceDoc?.data?.files)) return true;

  if (raw.pricingType === "free") {
    const previewDoc = await getDoc(env, PREVIEWS_COLLECTION, productId, {});
    const preview = previewDoc?.data || raw.preview || {};
    return hasText(preview.fullDocument) || hasText(preview.html);
  }

  return false;
}

/**
 * SQL twin of resolveHasSource() above, for the list endpoints.
 *
 * handleProduct() resolves `hasSource` one product at a time, but the homepage
 * asks for ~200 cards in one request — running resolveHasSource per row would
 * cost up to two extra D1 round trips each. This expression is evaluated inside
 * the card query instead: one statement, and the (multi-megabyte) source blobs
 * never leave the database.
 *
 * The empty-value checks mirror what parseRow()/hasText() see at runtime: D1
 * stores these JSON columns as TEXT, so a cleared column is usually `''`,
 * `'null'`, `'[]'` or `'{}'`.
 *
 * Keep in sync with resolveHasSource — both drive the same "Copy Source Code"
 * button, and a product is only copyable if the copy endpoints return files.
 */
const HAS_SOURCE_SQL = `CASE
  WHEN sourceCode     IS NOT NULL AND TRIM(sourceCode)     NOT IN ('', 'null', '[]', '{}', '""') THEN 1
  WHEN publicFiles    IS NOT NULL AND TRIM(publicFiles)    NOT IN ('', 'null', '[]', '{}', '""') THEN 1
  WHEN protectedFiles IS NOT NULL AND TRIM(protectedFiles) NOT IN ('', 'null', '[]', '{}', '""') THEN 1
  WHEN sourceFiles    IS NOT NULL AND TRIM(sourceFiles)    NOT IN ('', 'null', '[]', '{}', '""') THEN 1
  WHEN EXISTS (
    SELECT 1 FROM sources s
     WHERE s.productId = products.id
       AND s.files IS NOT NULL
       AND TRIM(s.files) NOT IN ('', 'null', '[]', '{}', '""')
  ) THEN 1
  WHEN pricingType = 'free' AND EXISTS (
    SELECT 1 FROM previews pv
     WHERE pv.productId = products.id
       AND (
         (pv.fullDocument IS NOT NULL AND TRIM(pv.fullDocument) <> '')
         OR (pv.html IS NOT NULL AND TRIM(pv.html) <> '')
       )
  ) THEN 1
  ELSE 0
END`;

/**
 * eBook "What you get" lines, for the homepage card payload.
 *
 * These lines are authored in Admin → eBook Settings and land in the products
 * `extraData` JSON column (they are not schema columns), under `ebookFeatures`
 * — with `included` as the older key books were authored with. HOMEPAGE_CARD_COLUMNS
 * is a whitelist, so without this the modal only learns them from the
 * /products/:id hydration and the section pops in a second late. extraData as a
 * whole must NOT be exposed: it also holds internal fields (aiPrompt, repoUrl,
 * pending_revision_id, …) that CATALOG_STRIP_FIELDS deliberately withholds.
 *
 * json_valid() guards malformed rows — json_extract() throws on bad JSON.
 * Returns JSON text; parseStringList() decodes it.
 */
const EBOOK_FEATURES_SQL = `CASE
  WHEN extraData IS NOT NULL AND json_valid(extraData)
  THEN COALESCE(
    NULLIF(json_extract(extraData, '$.ebookFeatures'), 'null'),
    NULLIF(json_extract(extraData, '$.included'), 'null')
  )
END`;

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
  "productType",
  "websiteUrl",
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
 * Normalizes a list that may arrive as an array, a JSON-encoded string
 * (`["a","b"]` or `"a"`) or newline-separated text, into a clean string array.
 * Mirrors what the frontend accepts, so a row authored either way renders.
 */
function parseStringList(value: any): string[] {
  if (value === null || value === undefined) return [];

  let v: any = value;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed || trimmed === "null") return [];
    if (trimmed.startsWith("[") || trimmed.startsWith('"')) {
      try {
        v = JSON.parse(trimmed);
      } catch {
        v = trimmed;
      }
    } else {
      v = trimmed.split("\n");
    }
  }

  const list = Array.isArray(v) ? v : [v];
  return list
    .flatMap((s) => String(s).split("\n"))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Homepage cards only need a small subset of columns. Querying just those
 * columns avoids loading multi-megabyte source/authoring blobs from D1 and
 * keeps the first catalog response small enough to cache effectively.
 */
async function listHomepageCards(env: Env): Promise<any[]> {
  const columns = [...new Set(HOMEPAGE_CARD_COLUMNS)].join(", ");
  const result = await env.DB.prepare(
    `SELECT ${columns}, ${HAS_SOURCE_SQL} AS hasSource, ${EBOOK_FEATURES_SQL} AS ebookFeatures
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
    productType: row.productType,
    websiteUrl: row.websiteUrl,
    designWidth: row.designWidth === null ? null : Number(row.designWidth),
    designHeight: row.designHeight === null ? null : Number(row.designHeight),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // Same meaning as the flag handleProduct() sends: false when "Copy Source
    // Code" would come back empty (poster-only layouts, ebooks without code).
    hasSource: row.hasSource === 1 || row.hasSource === true,
    // eBook-only: the book's authored "What you get" lines, so the modal can
    // render them on first paint instead of after the detail hydration.
    ebookFeatures: parseStringList(row.ebookFeatures),
  }));
}

/**
 * hasSource for every published product, keyed by id — used by the unscoped
 * catalog, which loads full documents through listDocs() and therefore cannot
 * fold HAS_SOURCE_SQL into its own query.
 */
async function loadHasSourceMap(env: Env): Promise<Map<string, boolean>> {
  const result = await env.DB.prepare(
    `SELECT id, ${HAS_SOURCE_SQL} AS hasSource FROM products WHERE status = 'published'`
  ).all();

  const map = new Map<string, boolean>();
  for (const row of result.results || []) {
    const r = row as Record<string, any>;
    map.set(String(r.id), r.hasSource === 1 || r.hasSource === true);
  }
  return map;
}

export async function handleCatalog(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "";
    const category = url.searchParams.get("category") || "";
    const subcategory = url.searchParams.get("subcategory") || "";
    const canUseHomepageCache = scope === "homepage" && !category && !subcategory;
    // Version suffix = cache generation. There is no purge route, so a deployed
    // change to the card payload would otherwise sit behind the 5-minute
    // s-maxage below; bump this when the shape of a card changes.
    // v3: added hasSource + ebookFeatures.
    const homepageCacheKey = new Request(
      "https://stea-code.internal/catalog/homepage-v3",
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
      const [docs, hasSourceById] = await Promise.all([
        listDocs(env, PRODUCTS_COLLECTION, {}),
        loadHasSourceMap(env),
      ]);
      products = docs
        .map((d) => ({
          id: d.id,
          ...safeProduct(d.data),
          hasSource: hasSourceById.get(d.id) === true,
        }))
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

    // ── hasSource ────────────────────────────────────────────────
    // safeProduct() strips every heavy source blob (sourceCode, publicFiles,
    // sourceFiles, preview HTML/CSS/JS), so the client cannot tell a
    // poster-only layout apart from a component that actually has code. Resolve
    // it here, from the same three places the copy/download endpoints read, and
    // send it as one small boolean so "Copy Source Code" can be hidden when
    // there is nothing to copy.
    const hasSource = await resolveHasSource(env, doc.id, doc.data || {});

    return new Response(
      JSON.stringify({ product: { id: doc.id, ...safeProduct(doc.data), hasSource } }),
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
