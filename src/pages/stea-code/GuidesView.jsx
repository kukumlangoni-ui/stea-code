import React, { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, BookOpen, Copy, Check, Search } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_GUIDES, GUIDE_CATEGORIES } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

// Spec: Guides must only include developer / building content.
// Match on positive developer tokens first (word-bounded where practical).
const DEV_GUIDE_POSITIVE =
  /\b(?:html|css|javascript|typescript|react|next\.?js|git|github|firebase|apis?|databases?|authentication|auth|hosting|host|deployment|deploy|domains?|dns|seo|performance|perf|accessibility|a11y|pwa|ui|ux|frontend|backend|web development|web dev|component|hooks?|state|server|node|vite|npm|yarn|webpack|rollup|rest|graphql|jwt|oauth|sql|nosql|redis|cache|caching|ci|cd|pipeline|docker|container|kubernetes|lambda|function|ssl|https|responsive|layout|animation|motion|debug|debugging|lint|testing|test|unit|e2e|integration|typesafety|types|schema|prisma|orm|api route|middleware|router|routing|redux|zustand|svelte|vue|angular|tailwind|sass|less|bootstrap|shadcn|radix|storybook|vitepress|nextjs|astro|remix|gatsby|vercel|netlify|cloudflare|render|supabase|postgresql|mysql|mongodb|ai assisted|ai code|copilot|code assistant|prompt engineering|codebase|refactor|bundler|build tool|cli|command line|terminal|shell|bash|zsh|scripting|stack|full stack|fullstack|framework|library|package|dependency|markdown|mdx|svg|canvas|webgl|three\.?js|gsap|framer|lighthouse|core web vitals|pagespeed|lcp|cls|inp|fcp|tbt)\b/;

// Explicitly reject obvious consumer / OS / gadget / subscription news so that
// loose tokens like "app", "ai", "build", "product" don't accidentally include them.
const DEV_GUIDE_REJECT =
  /\b(?:iphone|ipad|ios|macos|mac os|watchos|tvos|ipados|android|samsung|pixel|oneplus|xiaomi|redmi|oppo|vivo|realme|tecno|infinix|itel|huawei|honor|nokia|feature phone|smartphone|tablet|laptop spec|laptop price|tvs?|tv[ ]os|airpods|airpod|imac|macbook|apple watch|galaxy watch|playstation|ps5|ps4|xbox|nintendo|netflix|spotify|whatsapp|telegram|tiktok|instagram|facebook|x update|twitter update|google ai pro|gemini advanced|chatgpt plus|subscription price|price cut|discount|deal|offer|buying guide|review|unboxing|leak|rumor|launch date|pre-?order|specs?|camera|battery life|charging|5g|ota update|firmware update|software update(?!.*(?:react|next|node|firebase|web|vite|npm|css|html|js|typescript)))\b/;

function isDeveloperGuide(it) {
  const text = `${it.title || ""} ${it.description || it.body || it.subtitle || ""} ${it.category || ""} ${it.type || ""} ${Array.isArray(it.tags) ? it.tags.join(" ") : it.tags || ""}`.toLowerCase();
  if (DEV_GUIDE_REJECT.test(text)) return false;
  return DEV_GUIDE_POSITIVE.test(text);
}

/**
 * GuidesView — /code?view=guides
 * Deep developer guides from legacy collections + fallback.
 *
 * Features:
 *   - category filter chips
 *   - search
 *   - detail view with sticky TOC (desktop)
 *   - copyable code blocks, callouts, related, prev/next
 */
export default function GuidesView({
  steaDaily = [],
  tips = [],
  resources = [],
  updates = [],
  study = [],
  loading = false,
}) {
  const gw = getGateway("guides");

  const combinedLegacy = useMemo(() => {
    const all = [
      ...(steaDaily || []),
      ...(tips || []),
      ...(resources || []),
      ...(updates || []),
      ...(study || []),
    ].map((it) => ({
      ...it,
      title: it.title || it.name || "Untitled",
      description: it.description || it.body || it.subtitle || it.shortDescription || "",
      category: it.categoryName || it.category || "Start Here",
      difficulty: it.difficulty || "Beginner",
      readTime: it.readTime || it.estimatedReadTime || "",
      sections: it.sections || (it.body ? [{ id: "body", title: "Content", body: it.body }] : []),
    }));
    return all.filter(isDeveloperGuide);
  }, [steaDaily, tips, resources, updates, study]);

  const data = combinedLegacy.length > 0 ? combinedLegacy : FALLBACK_GUIDES;

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((it) => {
      if (category !== "All" && String(it.category || "") !== category) return false;
      if (q) {
        const hay = `${it.title} ${it.description} ${it.category} ${Array.isArray(it.sections) ? it.sections.map((s) => s.title + " " + (s.body || "")).join(" ") : ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, category, query]);

  const openIndex = openId == null ? -1 : filtered.findIndex((g) => g.id === openId);
  const openGuide = openIndex >= 0 ? filtered[openIndex] : null;
  const prev = openIndex > 0 ? filtered[openIndex - 1] : null;
  const next = openIndex >= 0 && openIndex < filtered.length - 1 ? filtered[openIndex + 1] : null;

  const [copiedSection, setCopiedSection] = useState("");
  const copyBody = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(id);
      setTimeout(() => setCopiedSection(""), 1600);
    } catch (_) {}
  };

  // Sticky TOC click
  const goSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const searchBar = (
    <SearchBar id="sc-guides-search" value={query} onChange={setQuery} placeholder="Search full guides…" />
  );

  return (
    <div className="sc-view sc-guides-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "FULL GUIDES"}
        headline={gw?.hero || ["From idea", "to working product."]}
        subtitle={gw?.subtitle || "Deep dives and complete project walkthroughs."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        {!openGuide && (
          <div className="sc-view-section sc-sticky-filters">
            <FilterChips options={GUIDE_CATEGORIES} value={category} onChange={setCategory} />
          </div>
        )}

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={5} cols={2} />
          ) : !openGuide ? (
            filtered.length === 0 ? (
              <EmptyState icon={Search} title="No matching guides" description="Try a different search term or category." />
            ) : (
              <div className="sc-guides-grid" role="list">
                {filtered.map((it) => (
                  <article className="sc-guide-card" key={it.id} role="listitem">
                    <span className="sc-guide-cat">{it.category}</span>
                    <h3 className="sc-guide-title">{it.title}</h3>
                    <div className="sc-guide-meta">
                      <span className={`sc-diff sc-diff-${String(it.difficulty || "Beginner").toLowerCase()}`}>
                        {it.difficulty || "Beginner"}
                      </span>
                      {it.readTime && <span className="sc-guide-time">{it.readTime}</span>}
                    </div>
                    <p className="sc-guide-desc">{it.description}</p>
                    <button
                      type="button"
                      className="sc-btn sc-btn-primary sc-btn-sm sc-guide-open"
                      onClick={() => {
                        setOpenId(it.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Open Guide <BookOpen size={14} />
                    </button>
                  </article>
                ))}
              </div>
            )
          ) : (
            <article className="sc-guide-detail">
              <div className="sc-guide-detail-head">
                <button
                  type="button"
                  className="sc-btn sc-btn-ghost sc-btn-sm"
                  onClick={() => {
                    setOpenId(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <ArrowLeft size={14} /> Back to guides
                </button>
                <span className="sc-guide-cat">{openGuide.category}</span>
                <h1 className="sc-guide-detail-title">{openGuide.title}</h1>
                <div className="sc-guide-meta">
                  <span className={`sc-diff sc-diff-${String(openGuide.difficulty || "Beginner").toLowerCase()}`}>
                    {openGuide.difficulty || "Beginner"}
                  </span>
                  {openGuide.readTime && <span>{openGuide.readTime}</span>}
                </div>
                <p className="sc-guide-detail-desc">{openGuide.description}</p>
              </div>

              <div className="sc-guide-layout">
                <aside className="sc-guide-toc" aria-label="Table of contents">
                  <div className="sc-guide-toc-sticky">
                    <div className="sc-guide-toc-title">Table of contents</div>
                    <nav>
                      {(openGuide.sections || []).map((s, i) => (
                        <button
                          type="button"
                          key={s.id || i}
                          className="sc-guide-toc-item"
                          onClick={() => goSection(String(s.id || i))}
                        >
                          {s.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                </aside>

                <div className="sc-guide-content">
                  {(openGuide.sections || []).map((s, i) => {
                    const id = String(s.id || i);
                    const hasCode = /```|`|\nfunction |import |export |const |const |<[a-z]/i.test(s.body || "");
                    return (
                      <section key={id} id={id} className="sc-guide-section">
                        <h2>{s.title}</h2>
                        {hasCode ? (
                          <div className="sc-guide-code-wrap">
                            <pre className="sc-code-block"><code>{s.body}</code></pre>
                            <button
                              type="button"
                              className="sc-code-copy-btn"
                              onClick={() => copyBody(s.body, id)}
                              aria-label="Copy section code"
                            >
                              {copiedSection === id ? <Check size={14} /> : <Copy size={14} />}
                              {copiedSection === id ? "Copied" : "Copy"}
                            </button>
                          </div>
                        ) : (
                          <p>{s.body}</p>
                        )}
                      </section>
                    );
                  })}

                  {filtered.length > 1 && (
                    <>
                      <div className="sc-guide-callout sc-guide-related">
                        <strong>Related guides</strong>
                        <div className="sc-guide-related-list">
                          {filtered
                            .filter((g) => g.id !== openGuide.id && g.category === openGuide.category)
                            .slice(0, 3)
                            .map((g) => (
                              <button
                                type="button"
                                key={g.id}
                                className="sc-guide-related-item"
                                onClick={() => {
                                  setOpenId(g.id);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              >
                                <span className="sc-guide-cat">{g.category}</span>
                                <span>{g.title}</span>
                                <ArrowRight size={13} />
                              </button>
                            ))}
                        </div>
                      </div>

                      <nav className="sc-guide-nav" aria-label="Previous / next guide">
                        {prev ? (
                          <button
                            type="button"
                            className="sc-guide-nav-btn prev"
                            onClick={() => {
                              setOpenId(prev.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <ArrowLeft size={14} />
                            <span>
                              <small>Previous</small>
                              <strong>{prev.title}</strong>
                            </span>
                          </button>
                        ) : <span />}
                        {next ? (
                          <button
                            type="button"
                            className="sc-guide-nav-btn next"
                            onClick={() => {
                              setOpenId(next.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <span>
                              <small>Next</small>
                              <strong>{next.title}</strong>
                            </span>
                            <ArrowRight size={14} />
                          </button>
                        ) : <span />}
                      </nav>
                    </>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
