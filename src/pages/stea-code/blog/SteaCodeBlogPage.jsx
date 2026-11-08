import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./stea-code-blog.css";

export default function SteaCodeBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((d) => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="sc-blog">
      <header className="sc-blog__hero">
        <p className="sc-blog__kicker">SteaCode Journal</p>
        <h1>The SteaCode Blog</h1>
        <p className="sc-blog__sub">Practical front-end writing — the CSS you can copy, the React patterns that hold up in production.</p>
      </header>
      {loading ? <p className="sc-blog__status">Loading…</p> : (
        <div className="sc-blog__grid">
          {posts.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="sc-blog-card">
              <span className="sc-blog-card__tag">{post.category}</span>
              <h2 className="sc-blog-card__title">{post.title}</h2>
              <p className="sc-blog-card__excerpt">{post.excerpt}</p>
              <footer className="sc-blog-card__meta">
                <span>{(post.created_at || "").slice(0, 10)}</span>
              </footer>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
