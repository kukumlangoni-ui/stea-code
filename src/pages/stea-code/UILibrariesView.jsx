import React, { useMemo, useState } from "react";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_UI_LIBRARIES, UI_CATEGORIES } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * UILibrariesView — /code?view=ui
 */
export default function UILibrariesView({ uiResources = [], directoryResources = [], loading = false }) {
  const gw = getGateway("ui");
  const fromDirectory = (directoryResources || [])
    .filter((d) => /ui|icon|font|anim|motion|component|library|primitiv|tailwind|css/i.test(`${d.category || ""} ${d.name || ""} ${d.description || ""}`))
    .map((d) => ({
      id: d.id,
      name: d.name || d.title,
      category: d.category || "UI Libraries",
      what: d.description || "",
      bestFor: "",
      stack: "",
      difficulty: "Beginner",
      url: d.url || d.link || "",
    }));
  const combined = uiResources.length > 0 ? uiResources : fromDirectory.length > 0 ? fromDirectory : FALLBACK_UI_LIBRARIES;

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return combined.filter((it) => {
      const cat = String(it.category || "");
      if (category !== "All") {
        if (category === "Component Systems" && !/system|suite|full|kit/i.test(cat + " " + (it.what || "") + " " + (it.bestFor || ""))) return false;
        if (category === "Copy-paste Components" && !/copy|paste|shadcn/i.test(cat + " " + (it.name || "") + " " + (it.what || ""))) return false;
        if (category === "Accessible Primitives" && !/access|primitiv|radix/i.test(cat + " " + (it.what || ""))) return false;
        if (category === "Icons" && !/icon/i.test(cat)) return false;
        if (category === "Typography" && !/font|type|typograph/i.test(cat)) return false;
        if (category === "Animation" && !/anim|motion|gsap/i.test(cat + " " + (it.name || ""))) return false;
        if (category === "React" && !/react/i.test(it.stack || cat + " " + (it.bestFor || ""))) return false;
        if (category === "Tailwind" && !/tailwind/i.test(it.stack || cat + " " + (it.what || ""))) return false;
        if (category === "CSS" && !/css/i.test(it.stack || cat + " " + (it.what || ""))) return false;
      }
      if (q) {
        const hay = `${it.name || ""} ${it.category || ""} ${it.what || it.description || ""} ${it.bestFor || ""} ${it.stack || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [combined, category, query]);

  const searchBar = (
    <SearchBar id="sc-ui-search" value={query} onChange={setQuery} placeholder="Search libraries, icons, primitives…" />
  );

  return (
    <div className="sc-view sc-ui-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "UI LIBRARIES"}
        headline={gw?.hero || ["Better building blocks.", "Faster interfaces."]}
        subtitle={gw?.subtitle || "Components, icons, primitives, and motion."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <FilterChips options={UI_CATEGORIES} value={category} onChange={setCategory} />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching libraries" description="Try another category or search term." />
          ) : (
            <div className="sc-ui-grid" role="list">
              {filtered.map((it) => (
                <article className="sc-ui-card" key={it.id} role="listitem">
                  <div className="sc-ui-icon-tile" aria-hidden="true">
                    <Sparkles size={16} />
                  </div>
                  <span className="sc-ui-cat">{it.category}</span>
                  <h3 className="sc-ui-title">{it.name}</h3>
                  <p className="sc-ui-what">{it.what || it.description}</p>
                  {it.bestFor && <p className="sc-ui-best">Best for: {it.bestFor}</p>}
                  {(it.stack || it.difficulty) && (
                    <div className="sc-ui-meta">
                      {it.stack && <span className="sc-ui-stack">{it.stack}</span>}
                      {it.difficulty && (
                        <span className={`sc-diff sc-diff-${String(it.difficulty).toLowerCase()}`}>
                          {it.difficulty}
                        </span>
                      )}
                    </div>
                  )}
                  {it.url && (
                    <a
                      className="sc-ui-visit"
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit <ArrowUpRight size={13} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
