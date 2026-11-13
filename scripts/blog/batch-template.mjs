/**
 * Blog post batch template.
 *
 * Copy this file to `batch-06.mjs`, `batch-07.mjs`, … and fill in the posts.
 * Every file in this folder is read by `scripts/build-blog-sql.cjs`, which
 * dedupes by slug and writes the `blog_posts` migration (status = published).
 *
 * ── IndexNow reminder (do this after the new posts are live) ────────────────
 * Blog posts are seeded via SQL, so there is no admin save button to hook.
 * Once the migration has been applied to production and the post URLs resolve:
 *
 *   Option A — bulk (recommended after a batch):
 *     npm run indexnow
 *   This re-submits every URL in sitemap.xml (including the new posts).
 *
 *   Option B — per post, from a Node seed/script:
 *     import { pingBlogPost } from "../../src/utils/indexNow.js";
 *     for (const post of posts) {
 *       await pingBlogPost(post.slug).catch(() => {});
 *     }
 *
 * The public post URL is `https://steacode.com/blog/<slug>`.
 */

export default [
  {
    slug: "your-post-slug",
    title: "Your Post Title Here",
    category: "CSS", // React, Tailwind, SVG, CSS, JavaScript, …
    date: "2026-11-12",
    author: "Isaya Masika", // optional; defaults to this name
    excerpt: "One-sentence summary shown on the blog card and in the meta description.",
    content: `<p>Write the full post HTML here. Use <code>&lt;p&gt;</code>, <code>&lt;h2&gt;</code>,
<code>&lt;pre&gt;&lt;code&gt;</code>, and <code>&lt;ul&gt;</code> like the existing batches.</p>`,
  },
];
