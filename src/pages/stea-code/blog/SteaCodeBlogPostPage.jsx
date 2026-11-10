import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBlogJson } from "../../../services/blogApi.js";
import AdsterraBanner from "../../../components/stea-code/AdsterraBanner.jsx";
import SmartAdSlot from "../../../components/stea-code/SmartAdSlot.jsx";
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
      <div className="sc-post-layout">
        {/* Left Sidebar Ad — sticky, hidden below 1024px. Empty until an ad
            network is approved; SmartAdSlot collapses to zero height. */}
        <aside className="sc-ad-left">
          <SmartAdSlot id="ad-slot-left" minHeight={600} style={{ position: "sticky", top: "100px" }} />
        </aside>

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
          {/* PubFuture In-Article Ad — filled once final tags are approved */}
          <div className="sc-ad-mid-article">
            <div>
              <p className="sc-ad-label">Advertisement</p>
              <SmartAdSlot id="pubfuture-in-article" minHeight={250} style={{ margin: "40px 0" }}>
                <AdsterraBanner />
              </SmartAdSlot>
            </div>
          </div>

          <div className="sc-post__body" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Ezoic Ad Below */}
          <div className="sc-ad-bottom-article">
            <p className="sc-ad-label">Advertisement</p>
            <div id="ezoic-pub-ad-placeholder-102" style={{ minHeight: "90px", margin: "40px 0" }} />
          </div>
        </article>

        {/* Sidebar Ad — reserved for a future network (PubFuture/Ezoic). Empty
            for now; no Adsterra here so the in-article unit isn't duplicated. */}
        <aside className="sc-post-sidebar sc-ad-sidebar">
          <div id="pubfuture-sidebar" style={{ position: "sticky", top: "100px" }} />
        </aside>
      </div>
    </main>
  );
}
