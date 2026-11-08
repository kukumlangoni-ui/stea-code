const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function handleBlogList(env: any) {
  const { results } = await env.DB.prepare(
    `SELECT slug, title, category, excerpt, created_at
       FROM blog_posts
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 100`
  ).all();
  return json({ posts: results || [] });
}

export async function handleBlogPost(env: any, slug: string) {
  if (!slug) return json({ error: "not found" }, 404);
  const post = await env.DB.prepare(
    `SELECT slug, title, category, excerpt, content, author_name, created_at
       FROM blog_posts
      WHERE slug = ?1 AND status = 'published'`
  ).bind(slug).first();
  return post ? json({ post }) : json({ error: "not found" }, 404);
}
