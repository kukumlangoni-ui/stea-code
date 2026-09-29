import React, { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_INSPIRATION, INSPIRATION_FILTERS } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * InspirationView — /code?view=inspiration
 * VISUAL cards: screenshot, site name, category, why useful, Visit link.
 */
export default function InspirationView({ inspirationResources = [], loading = false }) {
  const gw = getGateway("inspiration");
  const data = inspirationResources.length > 0 ? inspirationResources : FALLBACK_INSPIRATION;

  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const normalized = useMemo(
    () =>
      data.map((it) => ({
        ...it,
        title: it.title || it.name || it.siteName || "Untitled",
        category: it.category || "Inspiration",
        screenshot: it.screenshot || it.image || it.screenshotUrl || it.imageUrl || it.thumbnailUrl || "",
        whyUseful: it.whyUseful || it.description || it.bestFor || "Visual reference.",
        url: it.url || it.link || "",
      })),
    [data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return normalized.filter((it) => {
      if (filter !== "All" && String(it.category || "") !== filter) return false;
      if (q) {
        const hay = `${it.title} ${it.whyUseful} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [normalized, filter, query]);

  const searchBar = (
    <SearchBar id="sc-insp-search" value={query} onChange={setQuery} placeholder="Search design references…" />
  );

  return (
    <div className="sc-view sc-insp-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "INSPIRATION"}
        headline={gw?.hero || ["Study great work.", "Build your own."]}
        subtitle={gw?.subtitle || "Curated visual references and design direction."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <FilterChips options={["All", ...INSPIRATION_FILTERS]} value={filter} onChange={setFilter} />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching references" description="Try another category or search." />
          ) : (
            <div className="sc-insp-grid" role="list">
              {filtered.map((it) => (
                <a
                  className="sc-insp-card"
                  key={it.id}
                  href={it.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  aria-label={it.title + " — " + it.whyUseful}
                >
                  <div className="sc-insp-shot" aria-hidden="true">
                    {it.screenshot ? (
                      <img src={it.screenshot} alt="" loading="lazy" />
                    ) : (
                      <div className="sc-insp-placeholder">
                        <span>{(it.title || "").slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="sc-insp-overlay">
                      <span className="sc-insp-visit">
                        Visit <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                  <div className="sc-insp-copy">
                    <span className="sc-insp-cat">{it.category}</span>
                    <h3 className="sc-insp-title">{it.title}</h3>
                    <p className="sc-insp-why">{it.whyUseful}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
