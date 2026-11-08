/**
 * Public blog feed with a bounded wait and one retry.
 *
 * The Worker occasionally closes a cold request mid-body; without a timeout
 * the blog pages would sit on "Loading…" forever. Callers get a thrown error
 * they can render instead.
 */
export async function fetchBlogJson(path, { retries = 1, timeoutMs = 35000 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(path, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (attempt >= retries) throw error;
    }
  }
}

// The blog index is shared by the "Blog" tab and /blog, and both remount on
// navigation. Keep one in-memory copy (5 min) and dedupe concurrent loads so
// Back never blanks the list or re-pays the Worker's cold-start latency.
const POSTS_TTL_MS = 5 * 60 * 1000;

let postsCache = null;
let postsInFlight = null;

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
      const posts = Array.isArray(data?.posts) ? data.posts : [];
      postsCache = { at: Date.now(), posts };
      return posts;
    })
    .finally(() => {
      postsInFlight = null;
    });

  return postsInFlight;
}
