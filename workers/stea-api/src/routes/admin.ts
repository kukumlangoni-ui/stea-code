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

import { Env, getDoc, listDocs, setDoc, deleteDoc } from "../firestore";
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
  // Try the staff middleware first. Owners + approvers pass.
  // Editors are blocked — they can't hit raw admin write endpoints directly.
  try {
    const staff = await requireStaff(req, env, "approver");
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
    const decoded = await verifyFirebaseToken(token, env);
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

    // Fetch existing row first for a proper deep merge
    const existing = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
      });
    }

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
    // Delete all related rows (sources, previews, then product)
    await deleteDoc(env, SOURCES_COLLECTION, productId);
    await deleteDoc(env, PREVIEWS_COLLECTION, productId);
    await deleteDoc(env, PRODUCTS_COLLECTION, productId);

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
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
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
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
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

export async function handleAdminUsers(req: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
  try {
    const result = await env.DB.prepare(
      `SELECT * FROM users ORDER BY createdAt DESC LIMIT 500`
    ).all();
    return new Response(JSON.stringify({ ok: true, users: result.results || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed to list users" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
    });
  }
}

export async function handleAdminStats(req: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(req, env);
  if (!admin) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
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
