import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBlogPosts } from "../../services/blogApi.js";
import "../../pages/stea-code/blog/stea-code-blog.css";

/**
 * LatestFromBlog — "Latest from the Blog" strip rendered at the bottom of the
 * marketplace home page, just above the footer. Uses the shared 5-minute blog
 * cache, so it costs nothing when the visitor already opened the Blog tab.
 * Renders nothing while loading or on failure to avoid layout shift.
 */
export default function LatestFromBlog() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts()
      .then((list) => {
        if (!cancelled) setPosts(list.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="sc-latest-blog" aria-label="Latest from the Blog">
      <div className="sc-latest-blog__head">
        <h2 className="sc-latest-blog__title">Latest from the Blog</h2>
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
