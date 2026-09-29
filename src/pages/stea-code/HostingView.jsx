import React, { useMemo, useState } from "react";
import { ExternalLink, BookOpen, Award, Search } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_HOSTING, HOSTING_FILTERS, HOSTING_COMPARISONS } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * HostingView — /code?view=hosting
 */
export default function HostingView({ hostingResources = [], loading = false }) {
  const gw = getGateway("hosting");
  const data = hostingResources.length > 0 ? hostingResources : FALLBACK_HOSTING;

  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const normalized = useMemo(
    () =>
      data.map((it) => ({
        ...it,
        kind: it.type || it.kind || "Static",
        _text: `${it.name || ""} ${it.description || ""} ${it.bestFor || ""} ${it.type || ""}`.toLowerCase(),
      })),
    [data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((it) => {
      if (filter !== "All") {
        const hay = `${it.kind} ${it.name} ${it.bestFor || ""} ${it.description || ""}`.toLowerCase();
        if (filter === "React SPA" && !/react|spa/.test(hay)) return false;
        if (filter === "Next.js" && !/next/.test(hay)) return false;
        if (filter === "Full-stack" && !/full|stack|backend|api/.test(hay)) return false;
        if (filter === "Backend" && !/backend|server|api|node|function/.test(hay)) return false;
        if (filter === "Firebase" && !/firebase/.test(hay)) return false;
        if (filter === "Portfolio" && !/portfolio|personal/.test(hay)) return false;
        if (filter === "Documentation" && !/doc|guide|book/.test(hay)) return false;
        if (filter === "Static" && !/static/.test(hay) && it.kind !== "Static") return false;
      }
      if (q && !it._text.includes(q)) return false;
      return true;
    });
  }, [normalized, filter, query]);

  const searchBar = (
    <SearchBar id="sc-hosting-search" value={query} onChange={setQuery} placeholder="Search hosting platforms…" />
  );

  return (
    <div className="sc-view sc-hosting-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "HOSTING"}
        headline={gw?.hero || ["Ship your project", "with confidence."]}
        subtitle={gw?.subtitle || "Platforms, free tiers, and deployment paths."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <FilterChips options={HOSTING_FILTERS} value={filter} onChange={setFilter} />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching platforms" description="Try another filter or search term." />
          ) : (
            <div className="sc-hosting-grid" role="list">
              {filtered.map((it) => (
                <article className="sc-hosting-card" key={it.id} role="listitem">
                  <header className="sc-hosting-card-head">
                    <span className="sc-hosting-logo" aria-hidden="true">
                      {it.logo || (it.name || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <h3>{it.name}</h3>
                      <span className={`sc-diff sc-diff-${String(it.difficulty || "Beginner").toLowerCase()}`}>
                        {it.difficulty || "Beginner"} · {it.kind}
                      </span>
                    </div>
                  </header>
                  <p className="sc-hosting-desc">{it.description}</p>
                  {it.bestFor && <p className="sc-hosting-best">Best for: {it.bestFor}</p>}
                  {it.freeTier && <p className="sc-hosting-free">🟢 {it.freeTier}</p>}
                  <footer className="sc-hosting-actions">
                    {it.url && (
                      <a className="sc-btn sc-btn-secondary sc-btn-sm" href={it.url} target="_blank" rel="noopener noreferrer">
                        Visit <ExternalLink size={13} />
                      </a>
                    )}
                    {it.guideUrl && (
                      <a className="sc-btn sc-btn-primary sc-btn-sm" href={it.guideUrl}>
                        Guide <BookOpen size={13} />
                      </a>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>

        {HOSTING_COMPARISONS.length > 0 && (
          <div className="sc-view-section">
            <h2 className="sc-compare-title"><Award size={16} /> Quick comparisons</h2>
            <div className="sc-compare-grid">
              {HOSTING_COMPARISONS.map((c) => (
                <div className="sc-compare-card" key={c.label}>
                  <div className="sc-compare-label">{c.label}</div>
                  <div className="sc-compare-winner">{c.winner}</div>
                  <div className="sc-compare-reason">{c.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
