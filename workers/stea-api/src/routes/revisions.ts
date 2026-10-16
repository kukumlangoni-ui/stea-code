/**
 * Revision approval workflow — STEA Code.
 *
 * Editors submit pending changes as revisions; owner/approver review and
 * approve/reject them. Nothing an editor does goes live without approval.
 *
 * Routes:
 * - POST   /api/stea-code/staff/revisions/submit       (any staff)
 * - GET    /api/stea-code/staff/revisions              (owner|approver)
 * - GET    /api/stea-code/staff/revisions/:id          (owner|approver|submitter)
 * - POST   /api/stea-code/staff/revisions/:id/approve  (owner|approver)
 * - POST   /api/stea-code/staff/revisions/:id/reject   (owner|approver)
 */

import { Env, getDoc, setDoc } from "../firestore";
import { corsHeaders } from "../cors";
import { requireStaff, StaffContext } from "../staff-auth/middleware";

const PRODUCTS_COLLECTION = "stea_code_products";

/** Fields that define a product. Any snapshot key outside this set is dropped. */
const WRITABLE_PRODUCT_FIELDS = new Set([
  "id", "slug", "titleEn", "titleZh", "shortDescriptionEn",
  "shortDescriptionZh", "price", "pricingType", "category",
  "status", "featured", "homepageVisible", "tags", "frameworks",
  "languages", "craftNoteEn", "aiPrompt", "previewVideoUrl",
  "posterImageUrl", "previewMode", "preview", "designWidth", "designHeight",
  "publicFiles", "protectedFiles",
  "sourceFiles", "sourceCode", "fileNames", "package",
  "extraData",
]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonErr(req: Request, msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req.headers.get("origin")) },
  });
}

async function logAudit(
  env: Env,
  staffId: string | null,
  action: string,
  target?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO staff_audit (staff_id, action, target, meta, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(staffId, action, target || null, meta ? JSON.stringify(meta) : null, new Date().toISOString()).run();
}

async function insertNotification(
  env: Env,
  n: {
    recipientRole?: string | null;
    recipientStaffId?: string | null;
    kind: string;
    title: string;
    body?: string | null;
    link?: string | null;
    targetId?: string | null;
  }
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO staff_notifications (recipient_role, recipient_staff_id, kind, title, body, link, target_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    n.recipientRole || null,
    n.recipientStaffId || null,
    n.kind,
    n.title,
    n.body || null,
    n.link || null,
    n.targetId || null,
    new Date().toISOString()
  ).run();
}

/**
 * Build a snapshot of the current product (all writable fields) for diff/undo.
 */
async function captureSnapshot(env: Env, productId: string): Promise<Record<string, any> | null> {
  const doc = await getDoc(env, PRODUCTS_COLLECTION, productId);
  if (!doc) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.data || {})) {
    if (WRITABLE_PRODUCT_FIELDS.has(k)) out[k] = v;
  }
  return out;
}

/**
 * Apply a snapshot to a product row. Missing fields are left untouched.
 */
async function applySnapshot(env: Env, productId: string, snapshot: Record<string, any>): Promise<void> {
  const doc = await getDoc(env, PRODUCTS_COLLECTION, productId);
  if (!doc) return;
  const existing = doc.data || {};
  const merged: Record<string, any> = {};
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) continue;
    if (!WRITABLE_PRODUCT_FIELDS.has(k)) continue;
    merged[k] = v;
  }
  merged.id = productId;
  merged.updatedAt = new Date().toISOString();
  // Preserve ownership on the live row.
  merged.createdByStaff = existing.createdByStaff || snapshot.createdByStaff || null;
  merged.createdBy = existing.createdBy || snapshot.createdBy || null;
  await setDoc(env, PRODUCTS_COLLECTION, productId, merged, true);
}

// ============================================================
// Submit a revision
// ============================================================
export async function handleSubmitRevision(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }

  const productId = String(body.productId || "").trim();
  const kind = String(body.kind || "").trim();
  const snapshot = (body.snapshot && typeof body.snapshot === "object") ? body.snapshot : null;

  if (!productId) return jsonErr(req, "productId is required", 400);
  if (!["new", "edit"].includes(kind)) return jsonErr(req, "kind must be 'new' or 'edit'", 400);
  if (!snapshot) return jsonErr(req, "snapshot is required", 400);

  try {
    const existing = await getDoc(env, PRODUCTS_COLLECTION, productId);
    if (!existing) return jsonErr(req, "Product not found", 404);

    // Editor restriction: only the uploader may submit a revision for a draft/own product.
    if (ctx.staff.role === "editor" && existing.data.createdByStaff !== ctx.staff.id) {
      return jsonErr(req, "Editors can only submit revisions for their own products", 403);
    }

    const now = new Date().toISOString();
    const revisionId = crypto.randomUUID();

    const originalSnapshot = kind === "edit" ? await captureSnapshot(env, productId) : null;

    await env.DB.prepare(
      "INSERT INTO product_revisions (id, product_id, submitted_by, status, kind, snapshot, original_snapshot, created_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)"
    ).bind(revisionId, productId, ctx.staff.id, kind, JSON.stringify(snapshot), originalSnapshot ? JSON.stringify(originalSnapshot) : null, now).run();

    // Pointer + status nudges.
    await setDoc(env, PRODUCTS_COLLECTION, productId, { pending_revision_id: revisionId }, true);
    if (existing.data.status === "draft") {
      await setDoc(env, PRODUCTS_COLLECTION, productId, { status: "pending" }, true);
    }

    await logAudit(env, ctx.staff.id, "revision_submitted", productId, { revisionId, kind });

    await insertNotification(env, {
      recipientRole: "owner",
      kind: "revision_submitted",
      title: `New ${kind === "new" ? "product" : "edit"} by ${ctx.staff.displayName || ctx.staff.email}`,
      body: existing.data.titleEn || productId,
      link: `/admin/approvals?revision=${revisionId}`,
      targetId: revisionId,
    });

    return json({ ok: true, revisionId });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to submit revision", 500);
  }
}

// ============================================================
// List revisions (owner/approver)
// ============================================================
export async function handleListRevisions(req: Request, env: Env): Promise<Response> {
  const ctx = await requireStaff(req, env, "approver");
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const status = String(url.searchParams.get("status") || "pending");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  if (!["pending", "approved", "rejected"].includes(status)) return jsonErr(req, "Invalid status", 400);

  try {
    const countRow = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM product_revisions WHERE status = ?"
    ).bind(status).first<any>();
    const total = Number(countRow?.n || 0);

    const result = await env.DB.prepare(
      `SELECT r.*,
              s.email as submitter_email,
              s.display_name as submitter_name,
              p.titleEn as product_title,
              p.slug as product_slug
       FROM product_revisions r
       LEFT JOIN staff_users s ON s.id = r.submitted_by
       LEFT JOIN products p ON p.id = r.product_id
       WHERE r.status = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(status, limit, offset).all<any>();

    const revisions = (result.results || []).map((r) => ({
      id: r.id,
      productId: r.product_id,
      submittedBy: r.submitted_by,
      submitterName: r.submitter_name || r.submitter_email || null,
      submitterEmail: r.submitter_email || null,
      status: r.status,
      kind: r.kind,
      rejectionReason: r.rejection_reason || null,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at || null,
      productTitle: r.product_title || null,
      productSlug: r.product_slug || null,
    }));

    return json({ ok: true, revisions, total, limit, offset });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to list revisions", 500);
  }
}

// ============================================================
// Get one revision (owner/approver or submitter)
// ============================================================
export async function handleGetRevision(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env);
  if (ctx instanceof Response) return ctx;

  try {
    const row = await env.DB.prepare(
      "SELECT * FROM product_revisions WHERE id = ?"
    ).bind(id).first<any>();
    if (!row) return jsonErr(req, "Revision not found", 404);

    const isSubmitter = row.submitted_by === ctx.staff.id;
    const isReviewer = ctx.staff.role === "owner" || ctx.staff.role === "approver";
    if (!isSubmitter && !isReviewer) return jsonErr(req, "Insufficient permissions", 403);

    let snapshot: any = {};
    let originalSnapshot: any = null;
    try { snapshot = JSON.parse(row.snapshot || "{}"); } catch {}
    if (row.original_snapshot) { try { originalSnapshot = JSON.parse(row.original_snapshot); } catch {} }

    return json({
      ok: true,
      revision: {
        id: row.id,
        productId: row.product_id,
        submittedBy: row.submitted_by,
        status: row.status,
        kind: row.kind,
        snapshot,
        originalSnapshot,
        reviewerId: row.reviewer_id || null,
        reviewedAt: row.reviewed_at || null,
        rejectionReason: row.rejection_reason || null,
        createdAt: row.created_at,
      },
    });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to load revision", 500);
  }
}

// ============================================================
// Approve a revision (owner/approver)
// ============================================================
export async function handleApproveRevision(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "approver");
  if (ctx instanceof Response) return ctx;

  try {
    const row = await env.DB.prepare(
      "SELECT * FROM product_revisions WHERE id = ?"
    ).bind(id).first<any>();
    if (!row) return jsonErr(req, "Revision not found", 404);
    if (row.status !== "pending") return jsonErr(req, "Revision is not pending", 409);

    let snapshot: Record<string, any> = {};
    try { snapshot = JSON.parse(row.snapshot || "{}"); } catch {}

    const now = new Date().toISOString();

    await applySnapshot(env, row.product_id, snapshot);

    // Force publish on approval.
    await setDoc(env, PRODUCTS_COLLECTION, row.product_id, {
      status: "published",
      approvedByStaff: ctx.staff.id,
      approvedAt: now,
      pending_revision_id: null,
    }, true);

    await env.DB.prepare(
      "UPDATE product_revisions SET status = 'approved', reviewer_id = ?, reviewed_at = ? WHERE id = ?"
    ).bind(ctx.staff.id, now, id).run();

    await logAudit(env, ctx.staff.id, "revision_approved", row.product_id, { revisionId: id, kind: row.kind });

    await insertNotification(env, {
      recipientStaffId: row.submitted_by,
      kind: "revision_approved",
      title: `Your ${row.kind === "new" ? "product" : "edit"} was approved`,
      body: "It is now live on steacode.",
      link: "/admin/products",
      targetId: row.product_id,
    });

    const updated = await getDoc(env, PRODUCTS_COLLECTION, row.product_id);
    return json({ ok: true, product: updated ? { id: row.product_id, ...updated.data } : null });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to approve revision", 500);
  }
}

// ============================================================
// Reject a revision (owner/approver)
// ============================================================
export async function handleRejectRevision(req: Request, env: Env, id: string): Promise<Response> {
  const ctx = await requireStaff(req, env, "approver");
  if (ctx instanceof Response) return ctx;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonErr(req, "Invalid JSON body", 400);
  }
  const reason = String(body.reason || "").trim();
  if (reason.length < 5) return jsonErr(req, "Reject reason is required (5+ characters)", 400);

  try {
    const row = await env.DB.prepare(
      "SELECT * FROM product_revisions WHERE id = ?"
    ).bind(id).first<any>();
    if (!row) return jsonErr(req, "Revision not found", 404);
    if (row.status !== "pending") return jsonErr(req, "Revision is not pending", 409);

    const now = new Date().toISOString();

    await env.DB.prepare(
      "UPDATE product_revisions SET status = 'rejected', reviewer_id = ?, reviewed_at = ?, rejection_reason = ? WHERE id = ?"
    ).bind(ctx.staff.id, now, reason, id).run();

    // Return product to draft if it was pending (an editor's draft awaiting approval).
    const product = await getDoc(env, PRODUCTS_COLLECTION, row.product_id);
    if (product && product.data.status === "pending") {
      await setDoc(env, PRODUCTS_COLLECTION, row.product_id, { status: "draft", pending_revision_id: null }, true);
    } else {
      await setDoc(env, PRODUCTS_COLLECTION, row.product_id, { pending_revision_id: null }, true);
    }

    await logAudit(env, ctx.staff.id, "revision_rejected", row.product_id, { revisionId: id, reason });

    await insertNotification(env, {
      recipientStaffId: row.submitted_by,
      kind: "revision_rejected",
      title: `Your ${row.kind === "new" ? "product" : "edit"} was rejected`,
      body: reason,
      link: "/admin/products",
      targetId: row.product_id,
    });

    return json({ ok: true });
  } catch (e: any) {
    return jsonErr(req, e?.message || "Failed to reject revision", 500);
  }
}
