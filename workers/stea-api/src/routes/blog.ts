import { corsHeaders } from "../cors";

const LIST_CACHE_SECONDS = 60;
const POST_CACHE_SECONDS = 300;

const json = (request: Request, data: unknown, status = 200, cacheSeconds = 0) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Cache successful reads at the edge so repeat visits don't pay the
      // Worker → D1 round trip. Errors are never cached.
      "cache-control":
        cacheSeconds > 0
          ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
          : "no-store",
      ...corsHeaders(request.headers.get("origin")),
    },
  });

export async function handleBlogList(request: Request, env: any) {
  const startedAt = Date.now();
  try {
    // Summary columns only — `content` is deliberately excluded so the list
    // payload stays small. Full HTML is fetched only by handleBlogPost.
    const { results } = await env.DB.prepare(
      `SELECT slug, title, category, excerpt, created_at
         FROM blog_posts
        WHERE status = 'published'
        ORDER BY created_at DESC
        LIMIT 100`
    ).all();
    const posts = results || [];
    console.log(`[blog] list: ${posts.length} posts in ${Date.now() - startedAt}ms`);
    return json(request, { posts, total: posts.length }, 200, LIST_CACHE_SECONDS);
  } catch (error: any) {
    console.error("[blog] list query failed:", error?.message || error);
    return json(request, { posts: [], error: "Unable to load blog posts" }, 500);
  }
}

export async function handleBlogPost(request: Request, env: any, slug: string) {
  if (!slug) return json(request, { error: "not found" }, 404);
  const startedAt = Date.now();
  try {
    const post = await env.DB.prepare(
      `SELECT slug, title, category, excerpt, content, author_name, created_at
         FROM blog_posts
        WHERE slug = ?1 AND status = 'published'`
    ).bind(slug).first();
    if (!post) {
      console.log(`[blog] post "${slug}" not found (${Date.now() - startedAt}ms)`);
      return json(request, { error: "not found" }, 404);
    }
    console.log(`[blog] post "${slug}" loaded in ${Date.now() - startedAt}ms`);
    return json(request, { post }, 200, POST_CACHE_SECONDS);
  } catch (error: any) {
    console.error(`[blog] post "${slug}" query failed:`, error?.message || error);
    return json(request, { error: "Unable to load this article" }, 500);
  }
}
