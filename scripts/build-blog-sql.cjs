const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "blog");
const batches = fs.readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort();

const q = (s) => "'" + String(s == null ? "" : s).replace(/'/g, "''") + "'";

(async () => {
  const posts = [];
  for (const f of batches) {
    const mod = await import(path.join(dir, f));
    posts.push(...(mod.default || []));
  }

  const seen = new Set();
  const rows = posts
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .map(
      (p) => `INSERT OR REPLACE INTO blog_posts
  (id, title, slug, category, excerpt, content, author_name, status, created_at)
VALUES
  (${q(p.slug)}, ${q(p.title)}, ${q(p.slug)}, ${q(p.category)}, ${q(p.excerpt)}, ${q(p.content)}, ${q(p.author || "Isaya Masika")}, 'published', ${q(p.date || "2026-11-10")});`
    )
    .join("\n\n");

  const sql = `-- 013_blog.sql — generated, do not edit by hand
CREATE TABLE IF NOT EXISTS blog_posts (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  category    TEXT NOT NULL,
  excerpt     TEXT,
  content     TEXT NOT NULL,
  author_name TEXT DEFAULT 'Isaya Masika',
  status      TEXT DEFAULT 'published',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_created ON blog_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_status  ON blog_posts (status);

${rows}
`;

  // FIX: Output to the correct workers/stea-api/migrations folder
  const outDir = path.join(__dirname, "..", "workers", "stea-api", "migrations");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "013_blog.sql");
  fs.writeFileSync(outFile, sql);
  console.log(`✅ 013_blog.sql written to ${outFile} — ${seen.size} posts`);

  // IndexNow: after this migration is applied to production and the new posts
  // resolve at /blog/<slug>, run `npm run indexnow` to re-submit the sitemap
  // (or call pingBlogPost(slug) per post). Blog posts are seeded via SQL, so
  // there is no admin save hook to fire the ping automatically.
})();
