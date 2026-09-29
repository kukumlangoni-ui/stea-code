import React, { useMemo, useState } from "react";
import { ArrowUpRight, Search, Laptop } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_ESSENTIALS, ESSENTIALS_GROUPS } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * EssentialsView — /code?view=essentials
 * High-value developer toolbox. Search + group chips.
 */
export default function EssentialsView({
  directoryResources = [],
  essentialsResources = [],
  loading = false,
}) {
  const gw = getGateway("essentials");

  // Build from CMS directory or fallback
  const fromDirectory = (directoryResources || [])
    .filter((d) => d && (d.name || d.title) && (d.url || d.link))
    .map((d) => ({
      id: d.id,
      name: d.name || d.title,
      group: d.category || "UI & Components",
      badge: "Link",
      desc: d.description || "",
      url: d.url || d.link || "",
    }));

  const combined =
    essentialsResources.length > 0
      ? essentialsResources
      : fromDirectory.length > 0
      ? fromDirectory
      : FALLBACK_ESSENTIALS;

  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return combined.filter((it) => {
      if (group !== "All" && String(it.group || "") !== group) return false;
      if (q) {
        const hay = `${it.name || ""} ${it.desc || it.description || ""} ${it.group || ""} ${it.badge || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [combined, group, query]);

  // Group results visually (flat sorted list when searching)
  const groupedResults = useMemo(() => {
    if (query.trim()) return [{ group: "Results", items: filtered }];
    if (group !== "All") return [{ group, items: filtered }];
    const out = [];
    const seen = new Set();
    filtered.forEach((it) => {
      const g = it.group || "Other";
      if (!seen.has(g)) {
        seen.add(g);
        out.push({ group: g, items: [] });
      }
      out.find((o) => o.group === g).items.push(it);
    });
    return out;
  }, [filtered, group, query]);

  const searchBar = (
    <SearchBar id="sc-ess-search" value={query} onChange={setQuery} placeholder="Search developer tools and references…" />
  );

  return (
    <div className="sc-view sc-ess-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "DEVELOPER ESSENTIALS"}
        headline={gw?.hero || ["Everything you need.", "Nothing you don't."]}
        subtitle={gw?.subtitle || "High-value references, tools, and utilities."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <FilterChips options={ESSENTIALS_GROUPS} value={group} onChange={setGroup} label="Tool group" />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={12} cols={4} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching tools" description="Try another search or category." />
          ) : (
            <div className="sc-ess-sections">
              {groupedResults.map((g) => (
                <div className="sc-ess-group" key={g.group}>
                  <h3 className="sc-ess-group-title">{g.group} <span className="sc-ess-group-count">{g.items.length}</span></h3>
                  <div className="sc-ess-grid" role="list">
                    {g.items.map((it) => (
                      <a
                        key={it.id}
                        className="sc-ess-card"
                        href={it.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="listitem"
                      >
                        <span className="sc-ess-icon" aria-hidden="true">
                          <Laptop size={14} />
                        </span>
                        <span className="sc-ess-copy">
                          <strong>{it.name}</strong>
                          <span className="sc-ess-badge">{it.badge}</span>
                          <p>{it.desc || it.description}</p>
                        </span>
                        <span className="sc-ess-arrow" aria-hidden="true">
                          <ArrowUpRight size={13} />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
