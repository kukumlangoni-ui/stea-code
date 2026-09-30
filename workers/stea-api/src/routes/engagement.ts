/**
 * Engagement routes — views, copies, favorites, and product stats.
 *
 * All counter increments are fire-and-forget style — they never break
 * the main product flow. Failures are logged but not returned to the client.
 */

import type { WorkerEnv } from "../index";
import { corsHeaders } from "../cors";
import { verifyFirebaseToken, extractBearerToken } from "../auth";

// ============================================================
// Helpers
// ============================================================

function jsonResponse(body: any, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(req ? corsHeaders(req.headers.get("origin")) : {}),
    },
  });
}

async function getAuthedUserId(req: Request, env: WorkerEnv): Promise<string | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    const decoded = await verifyFirebaseToken(env, token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ============================================================
// Counter: views
// ============================================================

export async function handleRecordView(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    // Use INSERT OR IGNORE pattern — if the column doesn't exist yet
    // (pre-migration), the UPDATE will just silently do nothing on D1.
    // We wrap in a try/catch so missing columns don't break anything.
    try {
      await env.DB.prepare(
        "UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = ?"
      )
        .bind(cleanId)
        .run();
    } catch (e) {
      // Column may not exist yet — ignore silently
      console.warn("[engagement] views increment skipped (column may not exist):", e);
    }

    return jsonResponse({ ok: true }, 200, req);
  } catch (e: any) {
    console.error("[engagement] recordView error:", e);
    return jsonResponse(
      { error: "Failed to record view", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Counter: copies
// ============================================================

export async function handleRecordCopy(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    try {
      await env.DB.prepare(
        "UPDATE products SET copies = COALESCE(copies, 0) + 1 WHERE id = ?"
      )
        .bind(cleanId)
        .run();
    } catch (e) {
      console.warn("[engagement] copies increment skipped (column may not exist):", e);
    }

    return jsonResponse({ ok: true }, 200, req);
  } catch (e: any) {
    console.error("[engagement] recordCopy error:", e);
    return jsonResponse(
      { error: "Failed to record copy", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Product stats (bulk)
// ============================================================

export async function handleProductStats(req: Request, env: WorkerEnv): Promise<Response> {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") || "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return jsonResponse({ stats: {} }, 200, req);
    }

    // Build placeholders safely
    const placeholders = ids.map(() => "?").join(", ");
    const query = `
      SELECT id, views, copies, downloads
      FROM products
      WHERE id IN (${placeholders})
    `;

    let rows: Array<Record<string, any>> = [];
    try {
      const result = await env.DB.prepare(query).bind(...ids).all();
      rows = result.results as Array<Record<string, any>>;
    } catch (e) {
      // Columns may not exist yet — return empty stats
      console.warn("[engagement] productStats skipped (columns may not exist):", e);
      return jsonResponse({ stats: {} }, 200, req);
    }

    const stats: Record<string, { views: number; copies: number; downloads: number }> = {};
    for (const row of rows) {
      stats[row.id] = {
        views: Number(row.views || 0),
        copies: Number(row.copies || 0),
        downloads: Number(row.downloads || 0),
      };
    }

    return jsonResponse({ stats }, 200, req);
  } catch (e: any) {
    console.error("[engagement] productStats error:", e);
    return jsonResponse(
      { error: "Failed to fetch stats", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Favorites — list
// ============================================================

export async function handleGetFavorites(req: Request, env: WorkerEnv): Promise<Response> {
  try {
    const userId = await getAuthedUserId(req, env);
    if (!userId) {
      return jsonResponse({ error: "Authentication required", code: "AUTH_REQUIRED" }, 401, req);
    }

    let result;
    try {
      result = await env.DB.prepare(
        "SELECT productId, createdAt FROM favorites WHERE userId = ? ORDER BY createdAt DESC"
      )
        .bind(userId)
        .all();
    } catch (dbErr) {
      // Table may not exist yet — return empty list gracefully
      console.warn("[engagement] getFavorites skipped (table may not exist):", dbErr);
      return jsonResponse({ favorites: [] }, 200, req);
    }

    const favorites = (result.results as Array<Record<string, any>>).map((row) => ({
      productId: row.productId,
      createdAt: row.createdAt,
    }));

    return jsonResponse({ favorites }, 200, req);
  } catch (e: any) {
    console.error("[engagement] getFavorites error:", e);
    return jsonResponse(
      { error: "Failed to fetch favorites", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Favorites — add (toggle: if not exists → insert)
// ============================================================

export async function handleAddFavorite(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const userId = await getAuthedUserId(req, env);
    if (!userId) {
      return jsonResponse({ error: "Authentication required", code: "AUTH_REQUIRED" }, 401, req);
    }

    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    const createdAt = new Date().toISOString();

    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO favorites (userId, productId, createdAt) VALUES (?, ?, ?)"
      )
        .bind(userId, cleanId, createdAt)
        .run();
    } catch (e) {
      // Table may not exist yet
      console.warn("[engagement] addFavorite skipped (table may not exist):", e);
      return jsonResponse({ ok: true, favorited: false }, 200, req);
    }

    return jsonResponse({ ok: true, favorited: true }, 200, req);
  } catch (e: any) {
    console.error("[engagement] addFavorite error:", e);
    return jsonResponse(
      { error: "Failed to add favorite", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Favorites — remove
// ============================================================

export async function handleRemoveFavorite(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const userId = await getAuthedUserId(req, env);
    if (!userId) {
      return jsonResponse({ error: "Authentication required", code: "AUTH_REQUIRED" }, 401, req);
    }

    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    try {
      await env.DB.prepare("DELETE FROM favorites WHERE userId = ? AND productId = ?")
        .bind(userId, cleanId)
        .run();
    } catch (e) {
      console.warn("[engagement] removeFavorite skipped (table may not exist):", e);
      return jsonResponse({ ok: true, favorited: true }, 200, req);
    }

    return jsonResponse({ ok: true, favorited: false }, 200, req);
  } catch (e: any) {
    console.error("[engagement] removeFavorite error:", e);
    return jsonResponse(
      { error: "Failed to remove favorite", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}

// ============================================================
// Favorites — toggle (POST with { favorited: boolean } body)
// ============================================================

export async function handleToggleFavorite(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const userId = await getAuthedUserId(req, env);
    if (!userId) {
      return jsonResponse({ error: "Authentication required", code: "AUTH_REQUIRED" }, 401, req);
    }

    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    // Check current state
    let isFavorited = false;
    try {
      const result = await env.DB.prepare(
        "SELECT 1 FROM favorites WHERE userId = ? AND productId = ? LIMIT 1"
      )
        .bind(userId, cleanId)
        .first();
      isFavorited = !!result;
    } catch (e) {
      console.warn("[engagement] toggleFavorite check skipped:", e);
    }

    const createdAt = new Date().toISOString();

    if (isFavorited) {
      try {
        await env.DB.prepare("DELETE FROM favorites WHERE userId = ? AND productId = ?")
          .bind(userId, cleanId)
          .run();
      } catch (e) {
        console.warn("[engagement] removeFavorite in toggle skipped:", e);
      }
      return jsonResponse({ ok: true, favorited: false }, 200, req);
    } else {
      try {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO favorites (userId, productId, createdAt) VALUES (?, ?, ?)"
        )
          .bind(userId, cleanId, createdAt)
          .run();
      } catch (e) {
        console.warn("[engagement] addFavorite in toggle skipped:", e);
      }
      return jsonResponse({ ok: true, favorited: true }, 200, req);
    }
  } catch (e: any) {
    console.error("[engagement] toggleFavorite error:", e);
    return jsonResponse(
      { error: "Failed to toggle favorite", code: "INTERNAL_ERROR", detail: e?.message },
      500,
      req
    );
  }
}
