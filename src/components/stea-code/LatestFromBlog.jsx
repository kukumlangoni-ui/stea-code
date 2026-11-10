import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBlogPosts } from "../../services/blogApi.js";
import "../../pages/stea-code/blog/stea-code-blog.css";

/**
 * LatestFromBlog — "Latest from the Blog" strip rendered at the bottom of the
 * marketplace home page, just above the footer. Uses the shared 5-minute blog
 * cache, so it costs nothing when the visitor already opened the Blog tab.
 * Hides itself while loading or on failure to avoid layout shift, but always
 * logs the reason instead of failing silently.
 */
export default function LatestFromBlog() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts()
      .then((list) => {
        if (cancelled) return;
        const valid = list.filter((post) => post?.slug && post?.title);
        if (valid.length !== list.length) {
          console.warn(`[blog] latest widget skipped ${list.length - valid.length} post(s) without a slug/title`);
        }
        const sorted = [...valid].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setTotal(sorted.length);
        setPosts(sorted.slice(0, 3));
        console.log(`[blog] latest widget rendering ${Math.min(3, sorted.length)} of ${sorted.length} article(s)`);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[blog] latest widget could not load articles:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="sc-latest-blog" aria-label="Latest from the Blog">
      <div className="sc-latest-blog__head">
        <h2 className="sc-latest-blog__title">
          Latest from the Blog
          <span className="sc-latest-blog__count">{total} Total</span>
        </h2>
        <Link to="/blog" className="sc-latest-blog__more">View all →</Link>
      </div>
      <div className="sc-blog__grid">
        {posts.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="sc-blog-card">
            <span className="sc-blog-card__tag">{post.category}</span>
            <h3 className="sc-blog-card__title">{post.title}</h3>
            <p className="sc-blog-card__excerpt">{post.excerpt}</p>
            <div className="sc-blog-card__meta">
              <span>{post.created_at ? String(post.created_at).slice(0, 10) : ""}</span>
              <span>{`${Math.max(3, Math.round(String(post.excerpt || "").length / 120))} min read`}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
