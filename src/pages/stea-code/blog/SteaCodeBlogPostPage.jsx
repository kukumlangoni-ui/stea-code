import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBlogJson, normalizeBlogPost } from "../../../services/blogApi.js";
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
  const [state, setState] = useState({ status: "loading", post: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", post: null, error: null });

    fetchBlogJson(`/api/blog/${encodeURIComponent(slug || "")}`)
      .then((data) => {
        if (cancelled) return;
        const post = normalizeBlogPost(data?.post);
        if (!post) {
          console.warn(`[blog] no article returned for slug "${slug}"`, data);
          setState({ status: "not-found", post: null, error: null });
          return;
        }
        console.log(`[blog] article "${post.slug}" loaded (${post.content.length} chars)`);
        setState({ status: "ready", post, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[blog] failed to load article "${slug}":`, err);
        if (err?.status === 404) {
          setState({ status: "not-found", post: null, error: null });
          return;
        }
        setState({ status: "error", post: null, error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "loading") {
    return <main className="sc-blog"><p className="sc-blog__status">Loading…</p></main>;
  }

  if (state.status === "not-found") {
    return (
      <main className="sc-blog">
        <article className="sc-post sc-post--missing">
          <span className="sc-post__tag">404</span>
          <h1 className="sc-post__title">Article not found</h1>
          <p className="sc-blog__status">
            The article you are looking for doesn’t exist or has been removed.
          </p>
          <nav className="sc-post__nav">
            <Link to="/blog" className="sc-post__back">← All articles</Link>
            <Link to="/" className="sc-post__back">← Back to SteaCode</Link>
          </nav>
        </article>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="sc-blog">
        <div className="sc-blog__status" role="alert">
          <p>Unable to load this article right now. Please refresh.</p>
          <button type="button" className="sc-blog__pill" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </main>
    );
  }

  const { post } = state;

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

          {post.content ? (
            <div className="sc-post__body" dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <p className="sc-blog__status">This article has no content yet.</p>
          )}

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
