/**
 * Public blog feed client.
 *
 * The Worker can be slow to flush the response body (cold start, or a stalled
 * edge connection). Without a bounded wait the blog pages would sit on
 * "Loading…" forever, so every request is aborted after `timeoutMs` and the
 * caller receives a typed `BlogApiError` it can render.
 */
const DEFAULT_TIMEOUT_MS = 12000;

export class BlogApiError extends Error {
  constructor(message, { status = 0, code = "network", url = "" } = {}) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
    this.code = code;
    this.url = url;
  }
}

function snippet(value, max = 160) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function timeoutSignal(ms) {
  // Older Safari lacks AbortSignal.timeout — fall back to a manual controller.
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function fetchBlogJson(path, { retries = 1, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const startedAt = Date.now();
    try {
      const res = await fetch(path, {
        headers: { Accept: "application/json" },
        signal: timeoutSignal(timeoutMs),
      });
      const contentType = res.headers.get("content-type") || "";
      console.log(
        `[blog] GET ${path} → ${res.status} (${contentType || "no content-type"}) in ${Date.now() - startedAt}ms`
      );

      if (!res.ok) {
        // 4xx means "this resource really isn't there" — retrying just doubles
        // the wait. 5xx/429 are transient, so they get one more attempt.
        const retryable = res.status >= 500 || res.status === 429;
        if (retryable && attempt < retries) {
          console.warn(`[blog] ${path} → HTTP ${res.status}, retrying (${attempt + 1}/${retries})`);
          continue;
        }
        throw new BlogApiError(`Blog API responded with HTTP ${res.status}`, {
          status: res.status,
          code: "http",
          url: path,
        });
      }

      // A Pages/SPA fallback returns index.html with a 200. Detect it here so
      // the failure reads as "wrong response" instead of a JSON parse error.
      if (!contentType.includes("json")) {
        const body = await res.text().catch(() => "");
        console.error(
          `[blog] ${path} returned ${contentType || "unknown content-type"} instead of JSON:`,
          snippet(body)
        );
        if (attempt < retries) {
          console.warn(`[blog] ${path} → non-JSON response, retrying (${attempt + 1}/${retries})`);
          continue;
        }
        throw new BlogApiError("Blog API did not return JSON (check the /api route)", {
          status: res.status,
          code: "bad-content-type",
          url: path,
        });
      }

      const data = await res.json();
      console.log(`[blog] ${path} payload:`, data);
      return data;
    } catch (error) {
      if (error instanceof BlogApiError) throw error;

      const aborted = error?.name === "AbortError" || error?.name === "TimeoutError";
      const code = aborted ? "timeout" : "network";
      console.error(
        `[blog] GET ${path} failed after ${Date.now() - startedAt}ms (${code}):`,
        error?.message || error
      );
      if (attempt < retries) {
        console.warn(`[blog] ${path} → ${code}, retrying (${attempt + 1}/${retries})`);
        continue;
      }
      throw new BlogApiError(
        aborted ? "Blog API timed out" : "Blog API request failed",
        { status: 0, code, url: path }
      );
    }
  }
}

// The blog index is shared by the "Blog" tab and /blog, and both remount on
// navigation. Keep one in-memory copy (5 min) and dedupe concurrent loads so
// Back never blanks the list or re-pays the Worker's cold-start latency.
const POSTS_TTL_MS = 5 * 60 * 1000;

let postsCache = null;
let postsInFlight = null;

/**
 * Coerce one API row into the shape the UI relies on. Rows missing a slug or a
 * title can't link anywhere, so they are dropped instead of rendering an empty
 * card (the old "82 Total" with blank cards bug).
 */
export function normalizeBlogPost(raw) {
  if (!raw || typeof raw !== "object") return null;
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!slug || !title) return null;
  return {
    slug,
    title,
    category: typeof raw.category === "string" && raw.category ? raw.category : "Article",
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
    author_name: typeof raw.author_name === "string" ? raw.author_name : "",
    created_at: raw.created_at || raw.date || "",
    content: typeof raw.content === "string" ? raw.content : "",
  };
}

export function getCachedBlogPosts() {
  if (!postsCache) return null;
  return Date.now() - postsCache.at < POSTS_TTL_MS ? postsCache.posts : null;
}

export function fetchBlogPosts() {
  const cached = getCachedBlogPosts();
  if (cached) return Promise.resolve(cached);
  if (postsInFlight) return postsInFlight;

  postsInFlight = fetchBlogJson("/api/blog")
    .then((data) => {
      const rows = Array.isArray(data?.posts) ? data.posts : [];
      const posts = rows.map(normalizeBlogPost).filter(Boolean);
      if (posts.length !== rows.length) {
        console.warn(`[blog] dropped ${rows.length - posts.length} malformed post(s) from the feed`);
      }
      console.log(`[blog] ${posts.length} article(s) ready${data?.total ? ` (total ${data.total})` : ""}`);
      postsCache = { at: Date.now(), posts };
      return posts;
    })
    .finally(() => {
      postsInFlight = null;
    });

  return postsInFlight;
}
