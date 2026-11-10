import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBlogPosts, getCachedBlogPosts } from "../../../services/blogApi.js";
import "./stea-code-blog.css";

function readTime(post) {
  return `${Math.max(3, Math.round(String(post?.excerpt || "").length / 120))} min read`;
}

function postDate(post) {
  return post?.created_at ? String(post.created_at).slice(0, 10) : "";
}

export default function SteaCodeBlogPage({ embedded = false }) {
  const [posts, setPosts] = useState(() => getCachedBlogPosts() || []);
  const [loading, setLoading] = useState(() => !getCachedBlogPosts());
  const [error, setError] = useState(null);
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts()
      .then((list) => {
        if (cancelled) return;
        console.log(`[blog] list page received ${list.length} article(s)`);
        setPosts(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[blog] list page failed to load articles:", err);
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const post of posts) {
      if (post?.category) set.add(post.category);
    }
    return Array.from(set);
  }, [posts]);

  const filtered = useMemo(() => {
    const list = activeCat === "All" ? posts : posts.filter((post) => post.category === activeCat);
    return [...list].sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
  }, [posts, activeCat]);

  const filters = categories.length > 0 && (
    <div className="sc-blog__filters" role="tablist" aria-label="Blog categories">
      {["All", ...categories].map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={activeCat === cat}
          className={`sc-blog__pill${activeCat === cat ? " is-active" : ""}`}
          onClick={() => setActiveCat(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  const body = loading ? (
    <p className="sc-blog__status">Loading…</p>
  ) : error && posts.length === 0 ? (
    <div className="sc-blog__status" role="alert">
      <p>Unable to load articles right now. Please refresh.</p>
      <button type="button" className="sc-blog__pill" onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  ) : posts.length === 0 ? (
    <p className="sc-blog__status">No articles published yet.</p>
  ) : filtered.length === 0 ? (
    <p className="sc-blog__status">No articles in this category yet.</p>
  ) : (
    <>
      <div className="sc-blog__list-head">
        <h2 className="sc-blog__list-title">All Articles</h2>
        <p className="sc-blog__list-count">Showing {filtered.length} articles</p>
      </div>
      <div className="sc-blog__grid">
        {filtered.map((post) => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="sc-blog-card">
            <span className="sc-blog-card__tag">{post.category}</span>
            <h2 className="sc-blog-card__title">{post.title}</h2>
            <p className="sc-blog-card__excerpt">{post.excerpt}</p>
            <div className="sc-blog-card__meta">
              <span>{postDate(post)}</span>
              <span>{readTime(post)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="sc-blog sc-blog--embedded">
        {filters}
        {body}
      </div>
    );
  }

  return (
    <main className="sc-blog">
      <Link to="/" className="sc-blog__back">← Back to SteaCode</Link>
      <header className="sc-blog__hero">
        <p className="sc-blog__kicker">SteaCode Journal</p>
        <h1>The SteaCode Blog</h1>
        <p className="sc-blog__sub">
          Practical front-end writing — the CSS you can copy, the React patterns that hold up in production.
        </p>
      </header>
      {filters}
      {body}
    </main>
  );
}
