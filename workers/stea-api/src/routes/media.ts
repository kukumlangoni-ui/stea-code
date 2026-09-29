/**
 * Public media route — serves video and poster files from R2.
 *
 * GET /api/stea-code/media/{key}
 *
 * Used by:
 *  - Homepage product cards (video preview)
 *  - Product modal (video preview)
 *  - Admin product editor (video/poster preview)
 *
 * Cache strategy: 1-hour public cache. Product media rarely changes.
 * Range requests are supported (native R2 behavior) for video seeking.
 */

import { corsHeaders } from "../cors.js";

export async function handleMedia(req: Request, env: any, key: string): Promise<Response> {
  const method = req.method;
  const origin = req.headers.get("origin");

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (method !== "GET" && method !== "HEAD") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  if (!key || !key.trim()) {
    return new Response(JSON.stringify({ error: "Missing media key" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  // Sanitize: no path traversal, no leading slashes
  const cleanKey = key.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!cleanKey) {
    return new Response(JSON.stringify({ error: "Invalid media key" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  try {
    const object = await env.STEA_BUCKET.get(cleanKey, {
      range: req.headers.get("Range")
        ? parseRangeHeader(req.headers.get("Range"))
        : undefined,
    });

    if (object === null) {
      return new Response(JSON.stringify({ error: "Media not found", key: cleanKey }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);

    // Override with our cache + CORS policy
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Accept-Ranges", "bytes");

    // Ensure content-type is set for common types if R2 didn't provide it
    if (!headers.get("Content-Type")) {
      const ext = (cleanKey.match(/\.([a-zA-Z0-9]+)$/) || [])[1]?.toLowerCase();
      const types: Record<string, string> = {
        mp4: "video/mp4",
        webm: "video/webm",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      if (ext && types[ext]) {
        headers.set("Content-Type", types[ext]);
      }
    }

    // Handle range responses
    const range = req.headers.get("Range");
    if (range && object.size !== undefined) {
      const parsed = parseRangeHeader(range);
      if (parsed && parsed.offset < object.size) {
        const end = parsed.length !== undefined
          ? Math.min(parsed.offset + parsed.length - 1, object.size - 1)
          : object.size - 1;
        headers.set("Content-Range", `bytes ${parsed.offset}-${end}/${object.size}`);
        headers.set("Content-Length", String(end - parsed.offset + 1));
        return new Response(object.body, {
          status: 206,
          headers,
        });
      }
      // Invalid range -> return 416
      headers.set("Content-Range", `bytes */${object.size}`);
      return new Response(null, {
        status: 416,
        headers,
      });
    }

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "Media fetch failed", code: "MEDIA_FETCH_FAILED", detail: e?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      }
    );
  }
}

/**
 * Parse a Range header into { offset, length? } for R2's get() options.
 * Supports "bytes=X-Y" and "bytes=X-" formats.
 */
function parseRangeHeader(range: string | null): { offset: number; length?: number } | null {
  if (!range) return null;
  const match = range.match(/^bytes=(\d+)-(\d*)?$/);
  if (!match) return null;
  const offset = parseInt(match[1], 10);
  if (isNaN(offset)) return null;
  if (match[2] === "" || match[2] === undefined) {
    return { offset };
  }
  const end = parseInt(match[2], 10);
  if (isNaN(end) || end < offset) return null;
  return { offset, length: end - offset + 1 };
}
