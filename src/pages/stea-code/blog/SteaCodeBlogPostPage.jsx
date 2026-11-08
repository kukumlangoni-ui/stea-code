import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBlogJson } from "../../../services/blogApi.js";
import "./stea-code-blog.css";

function postReadTime(content) {
  const words = String(content || "")
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(3, Math.round(words / 200))} min read`;
}

export default function SteaCodeBlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPost(null);
    fetchBlogJson(`/api/blog/${encodeURIComponent(slug)}`)
      .then((d) => { setPost(d.post || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="sc-blog"><p className="sc-blog__status">Loading…</p></main>;
  if (!post) return <main className="sc-blog"><p className="sc-blog__status">Not found. <Link to="/blog">Back</Link></p></main>;

  return (
    <main className="sc-blog">
      <article className="sc-post">
        <nav className="sc-post__nav">
          <Link to="/" className="sc-post__back">← Back to SteaCode</Link>
          <Link to="/blog" className="sc-post__back">← All articles</Link>
        </nav>
        <span className="sc-post__tag">{post.category}</span>
        <h1 className="sc-post__title">{post.title}</h1>
        <p className="sc-post__meta">
          {[post.author_name, post.created_at ? String(post.created_at).slice(0, 10) : "", postReadTime(post.content)]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="sc-post__body" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </main>
  );
}
