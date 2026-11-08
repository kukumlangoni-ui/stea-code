import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./stea-code-blog.css";

export default function SteaCodeBlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { setPost(d.post || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.title} — SteaCode`;
  }, [post]);

  if (loading) return <main className="sc-blog"><p className="sc-blog__status">Loading…</p></main>;
  if (!post) return <main className="sc-blog"><p className="sc-blog__status">Article not found. <Link to="/blog">Back</Link></p></main>;

  return (
    <main className="sc-blog">
      <article className="sc-post">
        <Link to="/blog" className="sc-post__back">← Back to Blog</Link>
        <span className="sc-post__tag">{post.category}</span>
        <h1 className="sc-post__title">{post.title}</h1>
        <p className="sc-post__meta">{(post.created_at || "").slice(0, 10)} · {post.author_name || "Isaya Masika"}</p>
        <div className="sc-post__body" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </main>
  );
}
