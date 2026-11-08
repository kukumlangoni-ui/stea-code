/**
 * Admin routes for STEA Code.
 * All routes require a valid Firebase ID token with an admin email.
 *
 * - GET    /admin/stea-code/products
 * - POST   /admin/stea-code/products
 * - PATCH  /admin/stea-code/products/:productId
 * - DELETE /admin/stea-code/products/:productId
 * - GET    /admin/stea-code/products/:productId/source
 * - PUT    /admin/stea-code/products/:productId/source
 * - GET    /admin/stea-code/products/:productId/preview
 * - PUT    /admin/stea-code/products/:productId/preview
 * - POST   /admin/stea-code/products/:productId/package/upload
 * - POST   /admin/stea-code/products/:productId/preview/upload
 */

import { Env, getDoc, listDocs, setDoc } from "../firestore";
import { corsHeaders } from "../cors";
import { extractBearerToken, verifyFirebaseToken } from "../auth";
import { putObject } from "../r2";
import { requireStaff, StaffContext } from "../staff-auth/middleware";

const ADMIN_EMAILS = new Set(["stea.africa@gmail.com", "kukumlangoni@gmail.com"]);

const PRODUCTS_COLLECTION = "stea_code_products";
const SOURCES_COLLECTION = "stea_code_product_sources";
const PREVIEWS_COLLECTION = "stea_code_product_previews";

/**
 * Fields that must NEVER be overwritten by a metadata patch.
 *
 * Only preview-mode flags and the preview-source keys are owned by the
 * dedicated endpoints. The code-bearing fields (sourceCode, sourceFiles,
 * protectedFiles, publicFiles, fileNames) are now ALLOWED through so that a
 * product save from the editor (ProductStudioV3) persists the source code
 * the author typed — this fixes the "source code disappears on save" bug.
 * Missing keys are simply not written (see merge-safe handling in the
 * update handler), so nothing is ever wiped.
 *
 *   - previewMode / designWidth / designHeight
 *       → PUT /admin/stea-code/products/:id/preview (UI-mode flags)
 *   - preview object's SOURCE keys (html/css/js/jsx/tsx/fullDocument)
 *       → PUT /admin/stea-code/products/:id/preview (previews collection)
 */
const PROTECTED_METADATA_FIELDS = new Set([
  "previewMode",
  "designWidth",
  "designHeight",
]);

/**
 * Source keys inside the `preview` object that must NEVER be written by a
 * metadata PATCH. Preview SOURCE is owned by PUT /preview (the dedicated
 * previews collection). Preview SETTINGS (enabled, runtime, viewportMode,
 * width, height, scaleMode, videoKey, posterKey, baseUrl, externalUrl)
 * ARE allowed through a metadata PATCH.
 */
const PROTECTED_PREVIEW_SOURCE_KEYS = new Set([
  "html",
  "css",
  "javascript",
  "jsx",
  "tsx",
  "fullDocument",
]);

function stripProtectedMetadataFields(
  data: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (PROTECTED_METADATA_FIELDS.has(key)) continue;

    // `preview` is special: keep SETTINGS, drop SOURCE.
    if (key === "preview" && value && typeof value === "object" && !Array.isArray(value)) {
      const settings: Record<string, any> = {};
      for (const [pk, pv] of Object.entries(value)) {
        if (PROTECTED_PREVIEW_SOURCE_KEYS.has(pk)) continue;
        settings[pk] = pv;
      }
      // Only include preview if there are settings left to write.
      if (Object.keys(settings).length > 0) {
        out.preview = settings;
      }
      continue;
    }

    out[key] = value;
  }
  return out;
}

/**
 * Generate a URL-safe slug from a string (typically a product title).
 * Lowercase, hyphenated, strips special chars.
 */
function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure a unique slug for a product. If the desired slug is already taken
 * by a different product, append -2, -3, etc. until unique.
 */
async function ensureUniqueSlug(
  env: Env,
  desiredSlug: string,
  excludeProductId?: string
): Promise<string> {
  const base = slugify(desiredSlug) || `product-${Date.now()}`;
  let candidate = base;
  let counter = 2;
  // Cap iterations to avoid infinite loops on pathological input
  while (counter < 100) {
    const existing = await env.DB.prepare(
      "SELECT id FROM products WHERE slug = ? LIMIT 1"
    )
      .bind(candidate)
      .first<string | null>("id");
    if (!existing || existing === excludeProductId) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter++;
  }
  return `${base}-${Date.now()}`;
}

interface RouteEnv extends Env {
  STEA_BUCKET: R2Bucket;
}

async function requireAdmin(req: Request, env: Env): Promise<{ uid: string; email?: string } | null> {
  // ── Staff-token path (new admin panel) ──
  // Reads (GET) accept any staff role — editors must load products to work on them.
  // Writes (POST/PATCH/PUT/DELETE) require approver or owner — editors submit
  // revisions through the /revisions endpoints instead.
  const method = req.method.toUpperCase();
  const minRole = method === "GET" || method === "HEAD" ? "editor" : "approver";
  try {
    const staff = await requireStaff(req, env, minRole);
    if (!(staff instanceof Response)) {
      return {
        uid: staff.staff.id,
        email: staff.staff.email,
      };
    }
  } catch {
    // fall through to Firebase
  }

  // ── Firebase path (legacy, kept for backward compatibility) ──
  const token = extractBearerToken(req);
  if (!token) {
    console.warn("[stea-api] requireAdmin: no Bearer token");
    return null;
  }
  try {
    const decoded = await verifyFirebaseToken(env, token);
    if (!decoded) {
      console.warn("[stea-api] requireAdmin: token verification returned null");
      return null;
    }
    const email = String(decoded.email || "").toLowerCase();
    if (!email || !ADMIN_EMAILS.has(email)) {
      console.warn(`[stea-api] requireAdmin: email not in admin whitelist: ${email}`);
      return null;
    }
    return { uid: String(decoded.uid || decoded.sub || ""), email };
  } catch (e: any) {
    console.error("[stea-api] requireAdmin: token verification failed:", e?.message || e);
    return null;
  }
}

/**
 * Require the OWNER role for money-related endpoints (orders, payments,
 * entitlements, users, stats). Approvers and editors must never read revenue,
 * buyer, or purchase data. FireFbase whitelist path unchanged.
 */
async function requireOwner(req: Request, env: Env): Promise<{ uid: string; email?: string } | null> {
  const method = req.method.toUpperCase();
  const minRole = "owner";
  try {
    const staff = await requireStaff(req, env, minRole);
    if (!(staff instanceof Response)) {
      return {
        uid: staff.staff.id,
        email: staff.staff.email,
      };
    }
  } catch {
    // fall through to Firebase
  }

  // ── Firebase path (legacy, kept for backward compatibility) ──
  const token = extractBearerToken(req);
  if (!token) {
    console.warn("[stea-api] requireOwner: no Bearer token");
    return null;
  }
  try {
    const decoded = await verifyFirebaseToken(env, token);
    if (!decoded) {
      console.warn("[stea-api] requireOwner: token verification returned null");
      return null;
    }
    const email = String(decoded.email || "").toLowerCase();
    if (!email || !ADMIN_EMAILS.has(email)) {
      console.warn(`[stea-api] requireOwner: email not in admin whitelist: ${email}`);
      return null;
    }
    return { uid: String(decoded.uid || decoded.sub || ""), email };
  } catch (e: any) {
    console.error("[stea-api] requireOwner: token verification failed:", e?.message || e);
    return null;
  }
}

/**
 * Resolve the writer of a product write. Supports BOTH:
 *  - Staff auth (Bearer staff token) → returns staff context
 *  - Legacy Firebase admin (admin whitelist) → returns firebase admin uid
 *
 * Returns null if neither is valid. This lets the same product write
 * endpoints serve staff members (with createdByStaff tracking + editor
 * publish restrictions) while keeping the legacy owner admin flow intact.
 */
type Writer =
  | { kind: "staff"; ctx: StaffContext }
  | { kind: "admin"; uid: string };

async function resolveWriter(req: Request, env: Env): Promise<Writer | null> {
  // Try staff auth first (returns Response on failure — treat as not staff)
  const staffRes = await requireStaff(req, env);
  if (staffRes && !(staffRes instanceof Response)) {
    return { kind: "staff", ctx: staffRes };
  }
  // Fall back to Firebase admin
  const admin = await requireAdmin(req, env);
  if (admin) return { kind: "admin", uid: admin.uid };
  return null;
}

/**
 * Log a product audit event to staff_audit. Best-effort: never lets audit
 * logging break the underlying write.
 */
async function logProductAudit(
  env: Env,
  actor: { uid: string; email?: string; role?: string },
  action: "product_create" | "product_update" | "product_delete",
  target: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await env.DB.prepare(
      "INSERT INTO staff_audit (staff_id, action, target, meta, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      actor.uid,
      action,
      target || null,
      meta ? JSON.stringify({ ...meta, actorEmail: actor.email }) : JSON.stringify({ actorEmail: actor.email }),
      new Date().toISOString()
    ).run();
  } catch {
    // never let audit logging break a write
  }
}

/** Normalize the actor (staff vs firebase owner) for audit logging. */
function auditActor(writer: Writer): { uid: string; email?: string; role?: string } {
  if (writer.kind === "staff") {
    return { uid: writer.ctx.staff.id, email: writer.ctx.staff.email, role: writer.ctx.staff.role };
  }
  return { uid: writer.uid, role: "owner" };
}

/**
 * Bump the catalog cache version. The public catalog edge-cache key embeds
 * this version, so every admin product write instantly invalidates the stale
 * cached homepage (no more ghost cards for deleted/edited products).
 * Best-effort: never let it break the underlying write.
 */
async function bumpCatalogVersion(env: Env): Promise<void> {
  try {
    const version = Date.now().toString();
    await env.DB.prepare(
      `INSERT INTO meta (key, value) VALUES ('catalog_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = ?`
    ).bind(version, version).run();
  } catch {
    // meta table may not exist yet (pre-migration) — ignore
  }
}

export async function handleAdminProducts(req: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }

  try {
    const docs = await listDocs(env, PRODUCTS_COLLECTION, { cacheTtl: 0 });
    const products = docs.map((d) => ({ id: d.id, ...d.data }));
    return new Response(JSON.stringify({ ok: true, products }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list products" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminGetSource(req: Request, env: Env, productId: string): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }

  try {
    const sourceDoc = await getDoc(env, SOURCES_COLLECTION, productId, { cacheTtl: 0 });
    return new Response(
      JSON.stringify({
        ok: true,
        files: sourceDoc?.data?.files || [],
        source: sourceDoc?.data || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: true, files: [], source: null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminPutSource(req: Request, env: Env, productId: string): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }

  try {
    const body = (await req.json()) as { files?: any[] };
    const files = body.files || [];

    await setDoc(env, SOURCES_COLLECTION, productId, {
      productId,
      files,
      updatedBy: admin.uid,
      updatedAt: new Date().toISOString(),
    });

    // Also update fileNames on the product doc
    const fileNames = files.map((f: any) => f.path).filter(Boolean);
    await setDoc(env, PRODUCTS_COLLECTION, productId, { fileNames }, true);

    return new Response(
      JSON.stringify({ success: true, productId, fileCount: files.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Save failed", code: "SOURCE_SAVE_FAILED" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminPackageUpload(
  req: Request,
  env: RouteEnv,
  productId: string
): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("package") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No package file uploaded", code: "NO_FILE" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    const key = `products/${productId}/packages/${safeName}`;
    const buffer = await file.arrayBuffer();
    await putObject(env.STEA_BUCKET, key, buffer, file.type || "application/zip");

    // Store package metadata in Firestore
    await setDoc(
      env,
      PRODUCTS_COLLECTION,
      productId,
      {
        package: {
          storageKey: key,
          size: buffer.byteLength,
          filename: safeName,
          uploadedAt: new Date().toISOString(),
        },
      },
      true
    );

    return new Response(
      JSON.stringify({ success: true, key, size: buffer.byteLength, filename: safeName }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Package upload failed", code: "PACKAGE_UPLOAD_FAILED", detail: e?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}

export async function handleAdminPreviewUpload(
  req: Request,
  env: RouteEnv,
  productId: string
): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }

  try {
    const form = await req.formData();
    const result: any = {};
    const previewMeta: any = {};

    const video = form.get("video") as File | null;
    if (video) {
      const ext = (video.name.match(/\.(mp4|webm)$/i) || [".mp4"])[0].toLowerCase();
      const key = `products/${productId}/preview/preview${ext}`;
      const buffer = await video.arrayBuffer();
      await putObject(env.STEA_BUCKET, key, buffer, video.type || "video/mp4");
      result.video = { key, size: buffer.byteLength };
      previewMeta.videoKey = key;
    }

    const poster = form.get("poster") as File | null;
    if (poster) {
      const ext = (poster.name.match(/\.(jpg|jpeg|png)$/i) || [".jpg"])[0].toLowerCase();
      const key = `products/${productId}/preview/poster${ext}`;
      const buffer = await poster.arrayBuffer();
      await putObject(env.STEA_BUCKET, key, buffer, poster.type || "image/jpeg");
      result.poster = { key, size: buffer.byteLength };
      previewMeta.posterKey = key;
    }

    if (!result.video && !result.poster) {
      return new Response(JSON.stringify({ error: "No video or poster file uploaded", code: "NO_FILE" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    await setDoc(env, PRODUCTS_COLLECTION, productId, { preview: previewMeta }, true);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Preview upload failed", code: "PREVIEW_UPLOAD_FAILED", detail: e?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      }
    );
  }
}

/**
 * POST /admin/stea-code/products/:productId/book/upload
 *
 * Uploads one eBook asset to R2 and stores its public media URL on the
 * product. Which column is written is chosen by the form-data `field`
 * parameter (default "book", backwards compatible):
 *
 *   field    form file key  accepts     writes           URL mode
 *   book     book           PDF / ZIP   bookDownloadUrl  ?download=1 (buyers)
 *   pdf      book           PDF         pdfUrl           ?download=1 (premium)
 *   sample   book           PDF         samplePdfUrl     inline (public sample)
 *   cover    book           image/*     coverImageUrl    inline (store grid)
 *
 * The paid columns (bookDownloadUrl, pdfUrl) are read back only by
 * entitlement-gated endpoints, so those URLs never reach a non-buyer.
 */
export async function handleAdminBookUpload(
  req: Request,
  env: RouteEnv,
  productId: string
): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) return admin403(req);

  try {
    const form = await req.formData();
    const file = form.get("book") as File | null;
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No book file uploaded", code: "NO_FILE" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const field = String(form.get("field") || "book").trim().toLowerCase();
    const FIELD_MAP: Record<string, { column: string; kinds: Array<"pdf" | "zip" | "image">; download: boolean }> = {
      book:   { column: "bookDownloadUrl", kinds: ["pdf", "zip"], download: true },
      pdf:    { column: "pdfUrl",          kinds: ["pdf"],        download: true },
      sample: { column: "samplePdfUrl",    kinds: ["pdf"],        download: false },
      cover:  { column: "coverImageUrl",   kinds: ["image"],      download: false },
    };
    const cfg = FIELD_MAP[field] || FIELD_MAP.book;

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip";
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(file.name);
    const kindOk =
      (cfg.kinds.includes("pdf") && isPdf) ||
      (cfg.kinds.includes("zip") && isZip) ||
      (cfg.kinds.includes("image") && isImage);
    if (!kindOk) {
      const label =
        cfg.kinds.includes("image") ? "an image (PNG, JPG, WebP)"
        : cfg.kinds.includes("zip") ? "a .pdf or .zip file"
        : "a .pdf file";
      return new Response(
        JSON.stringify({ error: `Only ${label} is accepted for the "${field}" upload`, code: "BAD_TYPE" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
      );
    }
    if (file.size > 100 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File too large (max 100MB)", code: "TOO_LARGE" }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const safeName = file.name.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    const key = `products/${productId}/${field}/${safeName}`;
    // Stream directly to R2 — never buffer the full file in memory.
    // Buffering (file.arrayBuffer()) breaks on larger PDFs (Worker memory
    // limits); file.stream() pipes the body straight into the bucket.
    const contentType =
      file.type ||
      (isPdf ? "application/pdf" : isZip ? "application/zip" : "application/octet-stream");
    await putObject(env.STEA_BUCKET, key, file.stream(), contentType);

    // ?download=1 forces Content-Disposition: attachment on the media route.
    const url = `/api/stea-code/media/${key}${cfg.download ? "?download=1" : ""}`;
    await setDoc(env, PRODUCTS_COLLECTION, productId, { [cfg.column]: url }, true);

    return new Response(
      JSON.stringify({ success: true, key, url, field, column: cfg.column, filename: safeName, size: file.size }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return admin500(req, e, "BOOK_UPLOAD_FAILED", "Book upload failed");
  }
}

function admin403(req: Request): Response {
  return new Response(JSON.stringify({ error: "Admin access required" }), {
    status: 403,
    headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
  });
}

function admin500(req: Request, e: any, code: string, fallback: string): Response {
  return new Response(
    JSON.stringify({ error: e?.message || fallback, code, detail: e?.message }),
    { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
  );
}

/**
 * Normalize a gallery value into a clean array of image URLs.
 * Accepts an array or a JSON-encoded string. Validates each entry is a
 * usable URL (https:) or a /api/stea-code/media/* path, dedupes, and caps
 * the array at 10 items. Returns [] on empty/invalid input.
 */
function normalizeGallery(value: any): string[] {
  let arr: any = value;
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item !== "string") continue;
    const v = item.trim();
    if (!v) continue;
    const isUrl = /^https?:\/\/.+/i.test(v);
    const isMediaPath = /^\/api\/stea-code\/media\//.test(v);
    if (!isUrl && !isMediaPath) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= 10) break;
  }
  return out;
}

export async function handleAdminCreateProduct(req: Request, env: Env): Promise<Response> {
  const writer = await resolveWriter(req, env);
  if (!writer) return admin403(req);

  try {
    const body = (await req.json()) as Record<string, any>;
    const rawId = String(body.id || body.slug || "").trim();
    const { id, ...data } = body;

    // Generate a URL-safe, unique slug. Priority:
    //   1. Explicit slug from body (slugified + uniquified)
    //   2. Explicit id from body (slugified + uniquified)
    //   3. titleEn (slugified + uniquified)
    //   4. titleZh (slugified + uniquified)
    //   5. prod_TIMESTAMP fallback
    const rawSlugSource =
      String(body.slug || "").trim() ||
      rawId ||
      String(body.titleEn || "").trim() ||
      String(body.titleZh || "").trim();
    const productId = rawId || slugify(rawSlugSource) || `prod_${Date.now()}`;
    data.slug = await ensureUniqueSlug(env, rawSlugSource || productId);

    data.status = data.status || "draft";
    // Subcategory (Layout only). Empty string = "no subcategory". Accept any
    // string; the frontend controls the allowed values.
    data.subcategory = typeof data.subcategory === "string" ? data.subcategory : "";
    // Gallery — JSON array of up to 10 image URLs (first = cover).
    data.gallery = normalizeGallery(body.gallery);
    data.tab = typeof body.tab === "string" && body.tab ? body.tab : "components";
    data.createdAt = new Date().toISOString();
    data.updatedAt = data.createdAt;

    if (writer.kind === "staff") {
      // Staff-created products always track the uploader.
      data.createdByStaff = writer.ctx.staff.id;
      data.createdBy = writer.ctx.staff.id;
      // Editors cannot publish directly — force draft; they submit later.
      if (writer.ctx.staff.role === "editor") {
        data.status = "draft";
      }
    } else {
      data.createdBy = writer.uid;
    }

    await setDoc(env, PRODUCTS_COLLECTION, productId, data, false);

    await logProductAudit(
      env,
      auditActor(writer),
      "product_create",
      productId,
      { title: data.titleEn || data.titleZh || "" }
    );

    return new Response(
      JSON.stringify({ success: true, productId, product: { id: productId, ...data } }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return admin500(req, e, "PRODUCT_CREATE_FAILED", "Failed to create product");
  }
}

export async function handleAdminUpdateProduct(req: Request, env: Env, productId: string): Promise<Response> {
  const writer = await resolveWriter(req, env);
  if (!writer) return admin403(req);

  try {
    const body = (await req.json()) as Record<string, any>;
    const { id, ...rawData } = body;

    // Strip preview-owned fields before merging. The code-bearing fields
    // (sourceCode, sourceFiles, protectedFiles, publicFiles, fileNames) are
    // allowed through so an editor save persists what they typed. Missing
    // keys are simply not written (merge-safe below) — nothing is wiped.
    const data = stripProtectedMetadataFields(rawData);

    // Gallery + tab — merge-safe: only touched when explicitly provided.
    if (body.gallery !== undefined) {
      data.gallery = normalizeGallery(body.gallery);
    }
    if (body.tab !== undefined) {
      data.tab = typeof body.tab === "string" && body.tab ? body.tab : "components";
    }

    // Fetch existing row first for a proper deep merge
    const existing = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    // ── Source-wipe safety net ───────────────────────────────
    // A metadata save must never silently clear the product's working
    // source. If the incoming write sets sourceCode to empty / null / an
    // empty object AND the existing row has source content, reject unless
    // the caller explicitly confirms with { "__clearSource": true }.
    const existingSrc = existing.data?.sourceCode;
    const hasExistingSource =
      existingSrc != null &&
      !(typeof existingSrc === "string" && existingSrc.trim() === "") &&
      !(typeof existingSrc === "object" && !Array.isArray(existingSrc) && Object.keys(existingSrc).length === 0);
    if (hasExistingSource) {
      const incomingSource = data.sourceCode;
      const isClear =
        incomingSource === null ||
        incomingSource === "" ||
        (typeof incomingSource === "object" &&
          !Array.isArray(incomingSource) &&
          Object.keys(incomingSource).length === 0);
      if (isClear && data.__clearSource !== true) {
        return new Response(
          JSON.stringify({
            error: "Refusing to clear product source without explicit confirmation. Send { __clearSource: true } to intentionally wipe source.",
            code: "CLEAR_SOURCE_GUARD",
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
        );
      }
    }
    // Never persist the confirmation flag onto the row.
    delete data.__clearSource;

    // ── Staff scoping + publish restriction ──────────────────
    if (writer.kind === "staff") {
      const role = writer.ctx.staff.role;

      // Editors can only edit their own products.
      if (role === "editor" && existing.data.createdByStaff !== writer.ctx.staff.id) {
        return new Response(
          JSON.stringify({ error: "Editors can only edit their own products" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
        );
      }

      if (role === "editor") {
        // Editors cannot publish directly — only move to draft/pending.
        if (data.status === "published") {
          return new Response(
            JSON.stringify({ error: "Editors cannot publish directly; submit for approval instead" }),
            { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
          );
        }
        // Editors cannot change these privileged fields.
        for (const p of ["featured", "homepageVisible", "approvedByStaff", "approvedAt", "createdByStaff"]) {
          delete data[p];
        }
        // If the product is already live, refuse direct writes — the editor
        // must submit a revision (409). Only their own drafts can be edited.
        if (existing.data.status === "published") {
          return new Response(
            JSON.stringify({ error: "This product is published. Submit a revision for review instead of editing directly.", code: "PUBLISHED_PRODUCT" }),
            { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
          );
        }
      }

      data.createdByStaff = existing.data.createdByStaff || writer.ctx.staff.id;
    }

    // ── Merge-safe partial update ────────────────────────────
    // Build the write set from ONLY the keys present in the body. Missing
    // keys (sourceCode, sourceFiles, etc.) are never touched, so nothing is
    // wiped on a metadata save. preview and extraData are deep-merged with
    // their existing values instead of being replaced wholesale.
    const merged: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === "preview" && value && typeof value === "object" && !Array.isArray(value)) {
        const basePreview = (existing.data?.preview && typeof existing.data.preview === "object" && !Array.isArray(existing.data.preview))
          ? existing.data.preview
          : {};
        merged.preview = { ...basePreview, ...value };
        continue;
      }
      if (key === "extraData" && value && typeof value === "object" && !Array.isArray(value)) {
        const baseExtra = (existing.data?.extraData && typeof existing.data.extraData === "object" && !Array.isArray(existing.data.extraData))
          ? existing.data.extraData
          : {};
        merged.extraData = { ...baseExtra, ...value };
        continue;
      }
      merged[key] = value;
    }

    merged.updatedAt = new Date().toISOString();
    merged.updatedBy = writer.kind === "staff" ? writer.ctx.staff.id : writer.uid;

    // Slug safety: if slug was included in the update, validate it.
    // If it's empty/whitespace, fall back to existing slug or productId.
    // Always ensure uniqueness across all products (excluding this one).
    if (data.hasOwnProperty("slug")) {
      const desiredSlug = String(data.slug || "").trim() || existing.data?.slug || productId;
      merged.slug = await ensureUniqueSlug(env, desiredSlug, productId);
    } else if (!merged.slug || !String(merged.slug).trim()) {
      // Safety net: if somehow the product has no slug, generate one now
      merged.slug = await ensureUniqueSlug(
        env,
        String(existing.data?.titleEn || existing.data?.titleZh || productId),
        productId
      );
    }

    await setDoc(env, PRODUCTS_COLLECTION, productId, merged, false);

    // Invalidate the cached homepage catalog at the edge.
    await bumpCatalogVersion(env);

    await logProductAudit(
      env,
      auditActor(writer),
      "product_update",
      productId,
      { title: merged.titleEn || merged.titleZh || existing.data?.titleEn || "" }
    );

    // Return the full updated product
    const updated = await getDoc(env, PRODUCTS_COLLECTION, productId);
    return new Response(
      JSON.stringify({ success: true, productId, product: { id: productId, ...updated?.data } }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return admin500(req, e, "PRODUCT_UPDATE_FAILED", "Failed to update product");
  }
}

export async function handleAdminDeleteProduct(req: Request, env: Env, productId: string): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) return admin403(req);

  try {
    // Soft delete: mark the row deleted instead of removing it. The row (and
    // its sources/previews) stays in the database so order history,
    // entitlements, and purchases keep resolving; every public catalog query
    // filters on `deleted_at IS NULL` so the card disappears from the site.
    await env.DB.prepare("UPDATE products SET deleted_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), productId)
      .run();

    // Invalidate the cached homepage catalog at the edge.
    await bumpCatalogVersion(env);

    await logProductAudit(
      env,
      { uid: admin.uid, email: admin.email, role: "owner" },
      "product_delete",
      productId,
      {}
    );

    return new Response(
      JSON.stringify({ success: true, productId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return admin500(req, e, "PRODUCT_DELETE_FAILED", "Failed to delete product");
  }
}

export async function handleAdminGetPreview(req: Request, env: Env, productId: string): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) return admin403(req);

  try {
    const previewDoc = await getDoc(env, PREVIEWS_COLLECTION, productId, {});
    if (previewDoc) {
      return new Response(JSON.stringify({ ok: true, preview: previewDoc.data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }
    // Fallback: check product doc for embedded preview metadata
    const productDoc = await getDoc(env, PRODUCTS_COLLECTION, productId, {});
    const embedded = productDoc?.data?.preview;
    return new Response(JSON.stringify({ ok: true, preview: embedded || null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return admin500(req, e, "PREVIEW_FETCH_FAILED", "Failed to fetch preview");
  }
}

export async function handleAdminPutPreview(req: Request, env: Env, productId: string): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) return admin403(req);

  try {
    const body = (await req.json()) as Record<string, any>;

    await setDoc(env, PREVIEWS_COLLECTION, productId, {
      productId,
      ...body,
      updatedBy: admin.uid,
      updatedAt: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, productId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return admin500(req, e, "PREVIEW_SAVE_FAILED", "Failed to save preview");
  }
}

// ============================================================
// Admin list endpoints — added for admin panel Orders/Users/Entitlements/Stats
// ============================================================

export async function handleAdminOrders(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const result = await env.DB.prepare(
      `SELECT * FROM orders ORDER BY createdAt DESC LIMIT 500`
    ).all();
    return new Response(JSON.stringify({ ok: true, orders: result.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list orders" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminEntitlements(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const result = await env.DB.prepare(
      `SELECT * FROM entitlements ORDER BY grantedAt DESC LIMIT 500`
    ).all();
    return new Response(JSON.stringify({ ok: true, entitlements: result.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list entitlements" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

/**
 * GET /api/admin/users
 *
 * Owner-only directory of EVERY person in the database — merges `users`
 * (email-gate signups, Firebase customers) with `staff_users` (team
 * members). No filters are applied to the total, so the header count in the
 * Admin panel stays consistent with the visible list.
 *
 * Query params: ?q=<search> (email filter) · ?page=1&pageSize=50 (max 200)
 */
export async function handleAdminUsersList(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50", 10) || 50));

    // 1. Order aggregates (by users.id AND staff_users.id — staff never buy,
    //    but join with COALESCE keeps the shape uniform).
    const aggRows = await env.DB.prepare(
      `SELECT userId, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS spent
         FROM orders
        WHERE status IN ('paid','complete','succeeded')
        GROUP BY userId`
    ).all();
    const orderAgg: Record<string, { count: number; total: number }> = {};
    for (const r of (aggRows.results || []) as any[]) {
      const uid = String(r.userId || "");
      if (!uid) continue;
      orderAgg[uid] = { count: Number(r.cnt || 0), total: Number(r.spent || 0) };
    }

    // 2. Staff first — we remember their emails so we skip duplicate rows
    //    from the `users` table (a staff member may also have an email-gate
    //    row). Staff get `provider: "staff"` so the UI can label them.
    const staffRows = await env.DB.prepare(
      `SELECT id, email, display_name, role, status, created_at, last_login_at
         FROM staff_users ORDER BY created_at DESC`
    ).all();
    const staffEmails = new Set<string>();
    const staff: any[] = ((staffRows.results || []) as any[]).map((r) => {
      const email = String(r.email || "");
      staffEmails.add(email.toLowerCase());
      return {
        id: String(r.id),
        email,
        displayName: r.display_name || email.split("@")[0] || null,
        role: r.role || "member",
        status: r.status || "active",
        disabled: r.status === "revoked" ? 1 : 0,
        provider: "staff",
        createdAt: r.created_at || null,
        lastLoginAt: r.last_login_at || null,
        lastActiveAt: r.last_login_at || null,
        orderCount: 0,
        totalSpent: 0,
      };
    });

    // 3. Everybody from `users` — every provider, no role filter.
    const userRows = await env.DB.prepare(
      `SELECT id, email, displayName, role, status, disabled, provider,
              createdAt, lastLoginAt, lastActiveAt
         FROM users ORDER BY createdAt DESC`
    ).all();
    const customers: any[] = ((userRows.results || []) as any[])
      .filter((u) => !staffEmails.has(String(u.email || "").toLowerCase()))
      .map((u) => {
        const id = String(u.id || "");
        const agg = orderAgg[id] || { count: 0, total: 0 };
        return {
          id,
          email: String(u.email || ""),
          displayName: u.displayName || null,
          role: u.role || "user",
          status: u.status || "active",
          disabled: u.disabled ? 1 : 0,
          provider: u.provider || "unknown",
          createdAt: u.createdAt || null,
          lastLoginAt: u.lastLoginAt || u.lastActiveAt || null,
          lastActiveAt: u.lastActiveAt || null,
          orderCount: agg.count,
          totalSpent: agg.total,
        };
      });

    // 4. Merge, sort newest first. This is the COMPLETE directory.
    const merged = [...staff, ...customers].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    // 5. Search filter + pagination (client-side over the merged set).
    const filtered = q
      ? merged.filter((u) => String(u.email || "").toLowerCase().includes(q))
      : merged;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return new Response(
      JSON.stringify({ ok: true, users: rows, total, page, pageSize }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list users" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

/**
 * GET /admin/stea-code/users
 *
 * Returns a combined list of:
 *  - Firebase customers (rows from the `users` table, populated by
 *    /admin/stea-code/users/sync; source = "firebase")
 *  - Staff members (rows from `staff_users`; source = "staff")
 *
 * Each row carries purchase aggregates joined from `orders` (which reference
 * users by Firebase UID == users.id).
 */
export async function handleAdminUsers(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    // ── Purchase aggregates by userId (Firebase UID == users.id) ──
    const orderAgg: Record<string, { count: number; total: number }> = {};
    const aggRows = await env.DB.prepare(
      `SELECT userId, COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS spent
       FROM orders WHERE status IN ('paid','complete','succeeded')
       GROUP BY userId`
    ).all();
    for (const r of (aggRows.results || []) as any[]) {
      const uid = String(r.userId || "");
      if (!uid) continue;
      orderAgg[uid] = { count: Number(r.cnt || 0), total: Number(r.spent || 0) };
    }

    // ── Staff users (authoritative for source = "staff") ──
    const staffEmails = new Set<string>();
    const staffRows = await env.DB.prepare(
      `SELECT id, email, display_name, role, status, created_at, last_login_at
       FROM staff_users`
    ).all();
    const staff = ((staffRows.results || []) as any[]).map((r) => {
      const email = String(r.email || "");
      staffEmails.add(email.toLowerCase());
      return {
        id: String(r.id),
        email,
        displayName: r.display_name || email.split("@")[0] || "",
        provider: "staff",
        firebaseUid: null,
        status: r.status || "active",
        disabled: r.status === "disabled" ? 1 : 0,
        role: r.role || "member",
        source: "staff",
        lastLoginAt: r.last_login_at || null,
        createdAt: r.created_at || null,
        orderCount: 0,
        totalSpent: 0,
      };
    });

    // ── Firebase customers from the users table (skip anything that is staff) ──
    const userRows = await env.DB.prepare(
      `SELECT * FROM users ORDER BY createdAt DESC LIMIT 1000`
    ).all();
    const customers = ((userRows.results || []) as any[]).map((u) => {
      const email = String(u.email || "");
      if (staffEmails.has(email.toLowerCase())) return null; // staff come from staff_users
      const agg = orderAgg[String(u.id || "")] || { count: 0, total: 0 };
      return {
        id: u.id,
        email,
        displayName: u.displayName || email.split("@")[0] || "",
        provider: u.provider || "unknown",
        firebaseUid: u.firebaseUid || null,
        status: u.status || "active",
        disabled: u.disabled ?? 0,
        role: u.role || "member",
        source: String(u.provider || "") === "firebase" ? "firebase" : "unknown",
        lastLoginAt: u.lastLoginAt || u.lastActiveAt || null,
        lastActiveAt: u.lastActiveAt || null,
        createdAt: u.createdAt || null,
        orderCount: agg.count,
        totalSpent: agg.total,
      };
    }).filter((u) => u !== null) as any[];

    const users = [...customers, ...staff].sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

    return new Response(
      JSON.stringify({ ok: true, users, total: users.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list users" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

/**
 * Exchange the Firebase service account private key for a short-lived OAuth
 * access token (JWT Bearer flow). Uses WebCrypto (crypto.subtle) — the
 * firebase-admin SDK depends on Node's crypto module and will NOT run on
 * Cloudflare Workers, so we call the Identity Toolkit REST API directly.
 */
async function getFirebaseAccessToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: any) =>
    btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const toSign = `${enc(header)}.${enc(payload)}`;

  const pem = String(sa.private_key || "").replace(/\\n/g, "\n");
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    raw.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(toSign)
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${toSign}.${sigB64}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!data?.access_token) {
    throw new Error("Failed to get Firebase access token");
  }
  return data.access_token;
}

/**
 * POST /admin/stea-code/users/sync
 *
 * Owner-only. Lists every Firebase Authentication user via the Identity
 * Toolkit batchGet REST endpoint and upserts them into the `users` table
 * (id = Firebase localId, matching orders.userId). Idempotent — running it
 * again updates existing rows without creating duplicates.
 */
export async function handleAdminSyncFirebaseUsers(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const sa = (env as any).FIREBASE_SERVICE_ACCOUNT;
    const projectId = (env as any).FIREBASE_PROJECT_ID;
    if (!sa || !projectId) {
      return new Response(JSON.stringify({ error: "Firebase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

    const accessToken = await getFirebaseAccessToken(sa);
    const url =
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
      `/accounts:batchGet?maxResults=1000`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      return new Response(JSON.stringify({ error: "Firebase list failed", detail }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }
    const data: any = await res.json();
    const fbUsers = Array.isArray(data?.users) ? data.users : [];

    const now = new Date().toISOString();
    const upsert = env.DB.prepare(
      `INSERT INTO users
        (id, email, displayName, firebaseUid, lastLoginAt, disabled, syncedAt, createdAt, lastActiveAt,
         role, status, provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'member', 'active', 'firebase')
       ON CONFLICT(id) DO UPDATE SET
         email        = excluded.email,
         displayName  = excluded.displayName,
         provider     = 'firebase',
         firebaseUid  = excluded.firebaseUid,
         lastLoginAt  = excluded.lastLoginAt,
         disabled     = excluded.disabled,
         syncedAt     = excluded.syncedAt,
         lastActiveAt = excluded.lastActiveAt`
    );

    let created = 0;
    let updated = 0;
    for (const fu of fbUsers) {
      const uid = String(fu.localId || "");
      if (!uid) continue;
      const email = String(fu.email || "").toLowerCase();
      const name = fu.displayName || email.split("@")[0] || "";
      const lastLoginAt = fu.lastLoginAt
        ? new Date(Number(fu.lastLoginAt)).toISOString()
        : null;
      const createdAt = fu.createdAt
        ? new Date(Number(fu.createdAt)).toISOString()
        : now;
      const disabled = fu.disabled ? 1 : 0;

      const existing = await env.DB.prepare(`SELECT id FROM users WHERE id = ?`)
        .bind(uid)
        .first();
      if (existing) updated += 1;
      else created += 1;

      await upsert
        .bind(uid, email, name, uid, lastLoginAt, disabled, now, createdAt, now)
        .run();
    }

    return new Response(
      JSON.stringify({ ok: true, synced: fbUsers.length, created, updated }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Sync failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminStats(req: Request, env: Env): Promise<Response> {
  const admin = await requireOwner(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Owner only", code: "OWNER_ONLY" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const ordersCount = await env.DB.prepare(`SELECT COUNT(*) as n FROM orders`).first();
    const entitlementsCount = await env.DB.prepare(`SELECT COUNT(*) as n FROM entitlements`).first();
    const usersCount = await env.DB.prepare(`SELECT COUNT(*) as n FROM users`).first();
    const productsCount = await env.DB.prepare(`SELECT COUNT(*) as n FROM products`).first();
    const revenueRow = await env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status IN ('paid','complete','succeeded')`
    ).first();
    return new Response(JSON.stringify({
      ok: true,
      stats: {
        orders: ordersCount?.n || 0,
        entitlements: entitlementsCount?.n || 0,
        users: usersCount?.n || 0,
        products: productsCount?.n || 0,
        revenue: revenueRow?.total || 0,
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to load stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}
