import React, { useMemo, useState } from "react";
import { Clock, Search, ChevronRight } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_TECH_TIPS, TIPS_CATEGORIES } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

const DEV_KEYWORDS = /code|react|css|html|javascript|typescript|git|debug|perf|access|seo|secur|api|firebase|deploy|pwa|ai|devtool|terminal|host|domain|database|component|function|state|hook|promise|async|render|browser|network|ui|ux|console|npm|node|webpack|vite|test|lint|error|cache|cookie|auth|login/;

function isDeveloperRelevant(item) {
  const text = `${item.title || ""} ${item.description || item.body || ""} ${item.category || ""} ${item.type || ""}`.toLowerCase();
  return DEV_KEYWORDS.test(text);
}

/**
 * TipsView — /code?view=tips
 * Developer-focused tips only. Legacy consumer-tech content is excluded.
 */
export default function TipsView({ legacyTips = [], loading = false }) {
  const gw = getGateway("tips");
  const relevantLegacy = (legacyTips || []).filter(isDeveloperRelevant);
  const data = relevantLegacy.length > 0 ? relevantLegacy : FALLBACK_TECH_TIPS;

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((it) => {
      if (category !== "All" && String(it.category || "") !== category) return false;
      if (q) {
        const hay = `${it.title || ""} ${it.description || it.benefit || ""} ${it.category || ""} ${it.problem || ""} ${it.fix || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, category, query]);

  const searchBar = (
    <SearchBar id="sc-tips-search" value={query} onChange={setQuery} placeholder="Search lessons and patterns…" />
  );

  return (
    <div className="sc-view sc-tips-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "TECH TIPS"}
        headline={gw?.hero || ["Small lessons.", "Better builds."]}
        subtitle={gw?.subtitle || "Developer-focused lessons to level up daily."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <FilterChips options={["All", ...TIPS_CATEGORIES]} value={category} onChange={setCategory} />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={6} cols={1} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching tips" description="Try removing filters or searching a broader keyword." />
          ) : (
            <div className="sc-tips-list" role="list">
              {filtered.map((it) => {
                const open = openId === it.id;
                return (
                  <article key={it.id} className={"sc-tip-card" + (open ? " expanded" : "")} role="listitem">
                    <button
                      type="button"
                      className="sc-tip-head"
                      onClick={() => setOpenId(open ? null : it.id)}
                      aria-expanded={open}
                    >
                      <span className="sc-tip-meta">
                        <span className="sc-tip-cat">{it.category}</span>
                        <span className={`sc-diff sc-diff-${String(it.difficulty || "Beginner").toLowerCase()}`}>
                          {it.difficulty || "Beginner"}
                        </span>
                        {it.readTime && (
                          <span className="sc-tip-time">
                            <Clock size={12} /> {it.readTime}
                          </span>
                        )}
                      </span>
                      <h3 className="sc-tip-title">{it.title}</h3>
                      <p className="sc-tip-benefit">{it.benefit || it.description || it.subtitle}</p>
                      <span className="sc-tip-chevron" aria-hidden="true">
                        <ChevronRight size={15} />
                      </span>
                    </button>

                    {open && (
                      <div className="sc-tip-body">
                        {it.problem && (
                          <section className="sc-tip-section">
                            <h4>Problem</h4>
                            <p>{it.problem}</p>
                          </section>
                        )}
                        {it.why && (
                          <section className="sc-tip-section">
                            <h4>Why it happens</h4>
                            <p>{it.why}</p>
                          </section>
                        )}
                        {it.fix && (
                          <section className="sc-tip-section">
                            <h4>Fix</h4>
                            <p>{it.fix}</p>
                          </section>
                        )}
                        {it.example && (
                          <section className="sc-tip-section sc-tip-code">
                            <h4>Example</h4>
                            <pre className="sc-code-block"><code>{it.example}</code></pre>
                          </section>
                        )}
                        {it.commonMistake && (
                          <section className="sc-tip-section sc-tip-mistake">
                            <h4>Common mistake</h4>
                            <p>{it.commonMistake}</p>
                          </section>
                        )}
                        {Array.isArray(it.relatedTools) && it.relatedTools.length > 0 && (
                          <section className="sc-tip-section">
                            <h4>Related tools</h4>
                            <div className="sc-tool-chips">
                              {it.relatedTools.map((t) => (
                                <span key={t} className="sc-tool-chip">{t}</span>
                              ))}
                            </div>
                          </section>
                        )}
                        {!it.problem && !it.why && !it.fix && !it.example && (it.body || it.description) && (
                          <section className="sc-tip-section">
                            <p>{it.body || it.description}</p>
                          </section>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
