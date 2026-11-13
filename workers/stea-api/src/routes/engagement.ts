/**
 * Engagement routes — views, copies, favorites, and product stats.
 *
 * All counter increments are fire-and-forget style — they never break
 * the main product flow. Failures are logged but not returned to the client.
 */

import type { WorkerEnv } from "../index";
import { corsHeaders } from "../cors";
import { resolveRequestUser } from "../auth";

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
  const user = await resolveRequestUser(req, env);
  return user?.uid || null;
}

/**
 * Rotate the homepage catalog edge-cache generation. The homepage catalog cache
 * key embeds this version, so bumping it invalidates every cached homepage
 * page and forces a fresh D1 read on the next request. Called after a like so
 * the public like count reaches other visitors promptly instead of sitting in
 * the up-to-5-minute edge snapshot. Best-effort: never break the write.
 */
async function bumpCatalogVersion(env: WorkerEnv): Promise<void> {
  try {
    const version = Date.now().toString();
    await env.DB.prepare(
      `INSERT INTO meta (key, value) VALUES ('catalog_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = ?`
    ).bind(version, version).run();
  } catch {
    // meta table may not exist yet — ignore.
  }
}

/**
 * Resolve a product by D1 id OR slug. Returns the row id + current counters.
 * The views/likes columns may not exist before migration 015, so the SELECT is
 * wrapped: a missing column yields null and the routes degrade to zero counts.
 */
async function resolveProduct(
  env: WorkerEnv,
  key: string
): Promise<{ id: string; views: number; likes: number } | null> {
  const clean = String(key || "").trim();
  if (!clean) return null;
  try {
    const row: any = await env.DB.prepare(
      "SELECT id, views, likes FROM products WHERE id = ? OR slug = ? LIMIT 1"
    )
      .bind(clean, clean)
      .first();
    if (!row) return null;
    return {
      id: String(row.id),
      views: Number(row.views || 0),
      likes: Number(row.likes || 0),
    };
  } catch (e) {
    console.warn("[engagement] resolveProduct skipped (counters column may not exist):", e);
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

    let views = 0;
    try {
      const row = await resolveProduct(env, cleanId);
      if (row) {
        await env.DB.prepare(
          "UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = ?"
        )
          .bind(row.id)
          .run();
        const fresh: any = await env.DB.prepare("SELECT views FROM products WHERE id = ?")
          .bind(row.id)
          .first();
        views = Number(fresh?.views || 0);
        // Rotate the homepage catalog cache so the new public view count is
        // reflected on cards for other visitors on the next request (same
        // mechanism the like route uses).
        await bumpCatalogVersion(env);
      }
    } catch (e) {
      // Column may not exist yet — ignore silently
      console.warn("[engagement] views increment skipped (column may not exist):", e);
    }

    return jsonResponse({ ok: true, views }, 200, req);
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
// Counter: likes (public, anonymous — state lives in client localStorage)
// ============================================================

export async function handleRecordLike(
  req: Request,
  env: WorkerEnv,
  productId: string
): Promise<Response> {
  try {
    const cleanId = String(productId || "").trim();
    if (!cleanId) {
      return jsonResponse({ error: "Product ID required", code: "BAD_REQUEST" }, 400, req);
    }

    // Body: { action: "like" | "unlike" }. Defaults to like.
    let action: "like" | "unlike" = "like";
    try {
      const body: any = await req.json().catch(() => null);
      if (body && body.action === "unlike") action = "unlike";
    } catch {
      /* ignore malformed body — treat as like */
    }

    let likes = 0;
    const liked = action === "like";
    try {
      const row = await resolveProduct(env, cleanId);
      if (row) {
        const delta = action === "unlike" ? -1 : 1;
        // Never let likes drop below zero.
        await env.DB.prepare(
          `UPDATE products SET likes = CASE
             WHEN COALESCE(likes, 0) + ? < 0 THEN 0
             ELSE COALESCE(likes, 0) + ?
           END WHERE id = ?`
        )
          .bind(delta, delta, row.id)
          .run();
        const fresh: any = await env.DB.prepare("SELECT likes FROM products WHERE id = ?")
          .bind(row.id)
          .first();
        likes = Number(fresh?.likes || 0);
        // Rotate the homepage catalog cache so the new public like count is
        // reflected on cards for other visitors on the next request.
        await bumpCatalogVersion(env);
      }
    } catch (e) {
      console.warn("[engagement] likes increment skipped (column may not exist):", e);
    }

    return jsonResponse({ ok: true, likes, liked }, 200, req);
  } catch (e: any) {
    console.error("[engagement] recordLike error:", e);
    return jsonResponse(
      { error: "Failed to record like", code: "INTERNAL_ERROR", detail: e?.message },
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
      SELECT id, views, likes, copies, downloads
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

    const stats: Record<string, { views: number; likes: number; copies: number; downloads: number }> = {};
    for (const row of rows) {
      stats[row.id] = {
        views: Number(row.views || 0),
        likes: Number(row.likes || 0),
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
