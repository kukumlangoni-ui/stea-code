/**
 * SitesCompactList — STEA Premium V2 Canonical Website Grid
 *
 * Renders the new cinematic WebsiteSolutionCard across:
 *  - Category pages (/websites/:category)
 *  - Developer subcategories (/websites/developers/:subcategory)
 *  - Search results
 *  - Favorites
 *
 * Rules:
 *  - Click navigates internally to /site/:slug
 *  - Never direct external redirects
 *  - Responsive grid: 6 cols (ultra), 5 cols (desktop), 4 cols (laptop), 3 cols (tablet), 2 cols (mobile)
 */
import { memo, useMemo, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { extractHostname } from "./favicon.js";
import { useSitesLanguage } from "../../i18n/index.js";
import { useResourceActions } from "../../hooks/useResourceActions.js";
import { SECRET_AFTER_DARK_KEYWORDS } from "../../hooks/useSearch.js";
import { triggerAgeGateOrNavigate } from "./AgeGateModal.jsx";
import WebsiteSolutionCard from "../WebsiteSolutionCard.jsx";

function SitesCompactList({
  sites = [],
  websites = [],
  categoryName = null,
  categorySlug = null,
  description = null,
  siteCount,
  onOpenWebsite,
  onToggleFavorite,
  favoriteIds,
  onBack,
  searchPlaceholder = null,
  loading = false,
}) {
  const { t } = useSitesLanguage();
  const { openResourceDetail } = useResourceActions();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");
  // Pricing filter: "all" | "free" | "paid". Anything not explicitly "paid" is treated as Free.
  const [pricingFilter, setPricingFilter] = useState("all");

  const rawSites = (Array.isArray(sites) && sites.length > 0) ? sites : (Array.isArray(websites) ? websites : []);
  const count = typeof siteCount === "number" ? siteCount : rawSites.length;

  const isPaid = (s) => (s.pricingType || s.pricing || "").toString().toLowerCase() === "paid";

  const filteredSorted = useMemo(() => {
    let arr = rawSites.slice();
    // Pricing filter: Paid = only paid; Free = everything that isn't paid.
    if (pricingFilter === "paid") {
      arr = arr.filter(isPaid);
    } else if (pricingFilter === "free") {
      arr = arr.filter((s) => !isPaid(s));
    }
    const needle = q.trim().toLowerCase();
    if (needle) {
      arr = arr.filter((s) => {
        const host = extractHostname(s.url || "").toLowerCase();
        const name = (s.name || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        const tags = Array.isArray(s.tags) ? s.tags.join(" ").toLowerCase() : "";
        return name.includes(needle) || host.includes(needle) || desc.includes(needle) || tags.includes(needle);
      });
    }
    if (sort === "az") {
      arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else if (sort === "recent") {
      arr.sort((a, b) => (b.createdAt ? +b.createdAt : 0) - (a.createdAt ? +a.createdAt : 0));
    } else if (sort === "favorited") {
      arr.sort((a, b) => (Number(b.favCount || 0) || 0) - (Number(a.favCount || 0) || 0));
    } else {
      // popular
      arr.sort((a, b) => (Number(b.openCount || b.views || b.visits || 0) || 0) - (Number(a.openCount || a.views || a.visits || 0) || 0));
    }
    return arr;
  }, [rawSites, q, sort, pricingFilter]);

  const favSet = new Set((favoriteIds || []).map(String));
  const backHref = "/websites";

  return (
    <div className="sites-compact">
      {/* Compact Category Header */}
      <header className="sites-compact-header">
        {onBack ? (
          <button type="button" className="sites-compact-back" onClick={onBack} aria-label={t("buttons.back", "Back to all")}>
            <ArrowLeft size={14} strokeWidth={2.3} aria-hidden />
            <span>{t("buttons.back", "Back")}</span>
          </button>
        ) : (
          <a href={backHref} className="sites-compact-back" onClick={(e) => { if (typeof window !== "undefined" && window._sitesOnNavigate) { e.preventDefault(); window._sitesOnNavigate(backHref); } }}>
            <ArrowLeft size={14} strokeWidth={2.3} aria-hidden />
            <span>{t("buttons.back", "Back")}</span>
          </a>
        )}

        <div className="sites-compact-title-row">
          <h1 className="sites-compact-title">{categoryName || t("websites.title", "Websites")}</h1>
          <div className="sites-compact-pricing" role="radiogroup" aria-label="Filter by pricing">
            {[
              ["all", "All"],
              ["free", "Free"],
              ["paid", "Paid"],
            ].map(([k, label]) => (
              <button
                key={k}
                role="radio"
                aria-checked={pricingFilter === k}
                onClick={() => setPricingFilter(k)}
                className={`sites-sort-chip ${pricingFilter === k ? "is-active" : ""}`}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="sites-compact-count">
            {loading ? "Curating useful websites…" : t("categories.siteCount", "{n} useful websites").replace("{n}", String(count))}
          </div>
          {description && <p className="sites-compact-desc">{description}</p>}
        </div>
      </header>

      {/* Search + Sort Toolbar */}
      <div className="sites-compact-toolbar">
        <label className="sites-compact-search" aria-label={t("actions.search", "Search")}>
          <Search size={14} aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              const clean = val.toLowerCase().trim();
              if (SECRET_AFTER_DARK_KEYWORDS.includes(clean)) {
                setQ("");
                triggerAgeGateOrNavigate(null, "/after-dark");
                return;
              }
              setQ(val);
            }}
            placeholder={searchPlaceholder || t("search.inCategory", "Search in {category}").replace("{category}", categoryName || t("categories.title", "Categories"))}
            autoComplete="off"
          />
        </label>

        <div className="sites-compact-sort" role="radiogroup" aria-label={t("sort.label", "Sort")}>
          {[
            ["popular", t("sort.popular", "Popular")],
            ["recent", t("sort.recent", "Recently Added")],
            ["az", t("sort.az", "A–Z")],
            ["favorited", t("sort.favorited", "Most Favorited")],
          ].map(([k, label]) => (
            <button
              key={k}
              role="radio"
              aria-checked={sort === k}
              onClick={() => setSort(k)}
              className={`sites-sort-chip ${sort === k ? "is-active" : ""}`}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SKELETON LOADING OR EMPTY OR CARDS */}
      {loading ? (
        <div className="sites-compact-grid" aria-label="Loading websites...">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="stea-card-skeleton">
              <div className="stea-card-skeleton-stage" />
              <div className="stea-card-skeleton-footer" />
            </div>
          ))}
        </div>
      ) : !filteredSorted.length ? (
        <div className="sites-compact-empty" role="status" aria-live="polite">
          {q.trim()
            ? t("search.empty", "No websites found for '{q}'.").replace("{q}", q)
            : t("websites.empty", "No websites yet.")}
        </div>
      ) : (
        <div className="sites-compact-grid">
          {filteredSorted.map((s) => {
            const id = String(s.id || s.slug || s.url);
            const isFav = favSet.has(id);

            return (
              <WebsiteSolutionCard
                key={id}
                site={s}
                isFavorite={isFav}
                onToggleFavorite={() => onToggleFavorite && onToggleFavorite(s, false)}
                onDetails={() => {
                  if (onOpenWebsite) onOpenWebsite(s);
                  else openResourceDetail(s);
                }}
              />
            );
          })}
        </div>
      )}

      <style>{`
        .sites-compact { padding: 6px 0 24px; }

        /* -------- Header -------- */
        .sites-compact-header {
          display: flex; flex-direction: column; gap: 10px;
          padding: 14px 0 10px;
        }
        .sites-compact-back {
          align-self: flex-start;
          appearance: none; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          color: ${TOKENS.text2};
          font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: color 140ms ease, border-color 140ms ease, background 140ms ease;
        }
        .sites-compact-back:hover {
          color: ${TOKENS.gold};
          border-color: rgba(245, 166, 35, 0.35);
          background: ${TOKENS.panel2};
        }
        .sites-compact-title-row { display: flex; flex-direction: column; gap: 4px; }
        .sites-compact-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: ${TOKENS.text};
          line-height: 1.1;
        }
        @media (max-width: 520px) { .sites-compact-title { font-size: 22px; } }
        .sites-compact-count {
          color: ${TOKENS.text3}; font-size: 13px; font-weight: 700; letter-spacing: 0.01em;
        }
        .sites-compact-desc {
          margin: 2px 0 0;
          color: ${TOKENS.text2}; font-size: 13.5px; font-weight: 500;
          max-width: 640px; line-height: 1.45;
        }

        /* -------- Toolbar -------- */
        .sites-compact-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px; align-items: center;
          margin: 10px 0 20px;
        }
        @media (max-width: 720px) {
          .sites-compact-toolbar { grid-template-columns: 1fr; }
          .sites-compact-sort { overflow-x: auto; width: 100%; flex-wrap: nowrap !important; }
        }
        .sites-compact-search {
          display: flex; align-items: center; gap: 8px;
          padding: 0 14px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: 12px;
          height: 44px;
          color: ${TOKENS.text3};
          transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }
        .sites-compact-search:focus-within {
          border-color: rgba(245, 166, 35, 0.5);
          background: ${TOKENS.panel2};
          box-shadow: 0 0 0 3px ${TOKENS.goldSoft};
          color: ${TOKENS.goldHi};
        }
        .sites-compact-search input {
          appearance: none; border: 0; outline: 0;
          flex: 1 1 auto; height: 100%;
          background: transparent;
          color: ${TOKENS.text};
          font: inherit; font-size: 14px; font-weight: 600;
          letter-spacing: -0.005em;
        }
        .sites-compact-search input::placeholder { color: ${TOKENS.text3}; }

        .sites-compact-sort {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px; background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: 999px;
        }
        .sites-sort-chip {
          appearance: none; border: 0; background: transparent; color: ${TOKENS.text2};
          font-family: inherit; font-size: 12px; font-weight: 700;
          padding: 6px 12px; border-radius: 999px; cursor: pointer;
          white-space: nowrap;
          transition: color 140ms ease, background 140ms ease;
        }
        .sites-sort-chip:hover { color: ${TOKENS.text}; }
        .sites-sort-chip.is-active {
          background: linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold});
          color: #0A0B10; font-weight: 800;
          box-shadow: 0 4px 14px rgba(245,166,35,0.24);
        }

        /* -------- Empty -------- */
        .sites-compact-empty {
          padding: 32px 20px;
          text-align: center;
          background: ${TOKENS.panel};
          border: 1px dashed ${TOKENS.border};
          border-radius: ${TOKENS.radius}px;
          color: ${TOKENS.text2};
          font-size: 14px; font-weight: 600;
        }

        /* -------- Grid -------- */
        .sites-compact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px 12px;
        }
        @media (max-width: 1099px) { .sites-compact-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 768px) { .sites-compact-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; } }
        /* Phones: a real 2-column grid. Forcing 3 columns here squeezed every
           card to ~107px and truncated names and domains. */
        @media (max-width: 560px) { .sites-compact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }

        /* Skeleton — match compact 100px card */
        .stea-card-skeleton {
          height: 100px;
          border-radius: 14px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          overflow: hidden;
          animation: wspulse 1.6s ease-in-out infinite;
        }
        .stea-card-skeleton-stage { display: none; }
        .stea-card-skeleton-footer { display: none; }
        @keyframes wspulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}

export default memo(SitesCompactList);
