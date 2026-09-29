import React, { useMemo, useState } from "react";
import { Eye, Copy, Check, Search, Braces } from "lucide-react";
import { SectionHero, FilterChips, EmptyState, SkeletonCards, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import CodePreviewModal from "../../components/stea-code/CodePreviewModal.jsx";
import { FALLBACK_CODE_SNIPPETS, CODE_FILTERS, CODE_CATEGORIES } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * CodeView — /code?view=code
 * Component-gallery-style code snippets page.
 */
export default function CodeView({ codeResources = [], loading = false }) {
  const gw = getGateway("code");
  const data = codeResources.length > 0 ? codeResources : FALLBACK_CODE_SNIPPETS;

  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      if (filter !== "All") {
        const hay = `${item.framework || ""} ${item.language || ""} ${item.category || ""} ${Array.isArray(item.tags) ? item.tags.join(" ") : item.tags || ""}`.toLowerCase();
        if (filter === "HTML/CSS" && !/html|css/.test(hay)) return false;
        if (filter === "JavaScript" && !/javascript|js\b/.test(hay)) return false;
        if (filter === "React" && !/react|jsx|tsx/.test(hay)) return false;
        if (filter === "Next.js" && !/next/.test(hay)) return false;
        if (filter === "Tailwind" && !hay.includes("tailwind")) return false;
        if (filter === "GSAP" && !hay.includes("gsap")) return false;
        if (filter === "Motion" && !hay.includes("motion") && !hay.includes("framer")) return false;
        if (filter === "Three.js" && !hay.includes("three") && !hay.includes("threejs")) return false;
      }
      if (category !== "All" && String(item.category || "") !== category) return false;
      if (q) {
        const hay = `${item.title || ""} ${item.description || ""} ${item.category || ""} ${item.framework || ""} ${item.language || ""} ${Array.isArray(item.tags) ? item.tags.join(" ") : item.tags || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filter, category, query]);

  const copy = async (code, id) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1600);
    } catch (e) {
      console.warn("copy failed", e);
    }
  };

  const codeText = (it) =>
    it.copyableCode || it.codeReact || it.codeJs || it.codeCss || it.codeHtml || it.codeOther || it.code || "";

  const searchBar = (
    <SearchBar
      id="sc-code-search"
      value={query}
      onChange={setQuery}
      placeholder="Search snippets, frameworks, tags…"
    />
  );

  return (
    <div className="sc-view sc-code-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "CODE LIBRARY"}
        headline={gw?.hero || ["Build it.", "Copy it.", "Make it yours."]}
        subtitle={gw?.subtitle || "Copy-ready UI patterns, components, and effects."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section sc-sticky-filters">
          <div className="sc-filter-label">Framework / language</div>
          <FilterChips options={CODE_FILTERS} value={filter} onChange={setFilter} label="Framework" />
        </div>

        <div className="sc-view-section">
          <div className="sc-filter-label">Category</div>
          <FilterChips
            options={["All", ...CODE_CATEGORIES]}
            value={category}
            onChange={setCategory}
            label="Category"
          />
        </div>

        <div className="sc-view-section">
          {loading && filtered.length === 0 ? (
            <SkeletonCards count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching snippets"
              description="Try clearing filters or another search."
            />
          ) : (
            <div className="sc-code-grid" role="list">
              {filtered.map((item) => (
                <article className="sc-code-card" key={item.id} role="listitem">
                  <div className="sc-code-thumb" aria-hidden="true">
                    {item.previewImageUrl || item.thumbnailUrl ? (
                      <img src={item.previewImageUrl || item.thumbnailUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="sc-code-thumb-text">{item.preview || item.title}</span>
                    )}
                  </div>
                  <div className="sc-code-meta">
                    <span className="sc-code-cat">{item.category}</span>
                    <span className={`sc-diff sc-diff-${String(item.difficulty || "Beginner").toLowerCase()}`}>
                      {item.difficulty || "Beginner"}
                    </span>
                  </div>
                  <h3 className="sc-code-title">{item.title}</h3>
                  <p className="sc-code-desc">{item.description}</p>
                  <div className="sc-code-framework">
                    <Braces size={13} aria-hidden="true" /> {item.framework}
                  </div>
                  <div className="sc-code-actions">
                    <button
                      type="button"
                      className="sc-btn sc-btn-secondary sc-btn-sm"
                      onClick={() => setPreview(item)}
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      type="button"
                      className="sc-btn sc-btn-primary sc-btn-sm"
                      onClick={() => copy(codeText(item), item.id)}
                    >
                      {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {preview && <CodePreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
