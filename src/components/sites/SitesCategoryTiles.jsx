/**
 * SitesCategoryTiles — STEA Premium V2 (Final Category System)
 *
 * Premium dark Browse-by-category grid:
 *  - Canonical 18 main categories
 *  - Lucide & emoji vector icons
 *  - Real site counts (derived from data/snapshot) — never fabricated
 *  - Developers Resources expandable panel (20 developer subcategories)
 *  - Responsive grid: desktop 6, laptop 4, tablet 3, mobile 2, 320px 1.
 *  - Smooth 180-250ms CSS transitions, aria-expanded, keyboard navigation
 */
import { memo, useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, ArrowUpRight, Code2 } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage } from "../../i18n/index.js";
import { getWebsiteCountForCategory, getWebsiteCountForSubcategory, normalizeWebsiteCategorySlug } from "../../constants/categoryOrder.js";
import { CategoryOutlineIcon, DeveloperSubcategoryOutlineIcon } from "./CategoryOutlineIcons.jsx";
import { getCategoryIcon } from "../../data/websiteCategories.js";

const CATEGORY_EMOJI = {
  "live-sports": "⚽",
  "movies-tv-shows": "🎬",
  "ebooks": "📚",
  "life-hack": "💡",
  "money-finance": "💰",
  "music": "🎵",
  "games": "🎮",
  "online-courses": "🎓",
  "comics": "🦸",
  "graphics-design": "🎨",
  "jobs-career": "💼",
  "asian-drama": "🎭",
  "manga": "📖",
  "adblockers": "🛡️",
  "ai": "🤖",
  "automation": "⚙️",
  "creativity": "✨",
  "developers": "💻",
  "developer-resources": "💻",
  "programming": "💻",
};

function getCategoryEmoji(slug, name = "") {
  const key = normalizeWebsiteCategorySlug(slug);

  if (CATEGORY_EMOJI[key]) {
    return CATEGORY_EMOJI[key];
  }

  return getCategoryIcon(name || slug);
}

function labelForCategory(slug, fallback) {
  const map = {
    "live-sports": "Live Sports",
    "movies-tv-shows": "Movies & TV Shows",
    "ebooks": "eBooks",
    "life-hack": "Life Hack",
    "money-finance": "Money & Finance",
    "music": "Music",
    "games": "Games",
    "online-courses": "Online Courses",
    "comics": "Comics",
    "graphics-design": "Graphics Design",
    "jobs-career": "Jobs & Career",
    "asian-drama": "Asian Drama",
    "manga": "Manga",
    "adblockers": "AdBlockers",
    "ai": "AI",
    "automation": "Automation",
    "creativity": "Creativity",
    "developers": "Developers Resources",
  };
  return map[slug] || fallback || slug;
}

function SitesCategoryTiles({
  categories = [],
  developerSubcategories = [],
  websitesByCategory = {},
  allWebsites = [],
  onNavigate
}) {
  const { t } = useSitesLanguage();
  const navigate = useNavigate();
  const [devExpanded, setDevExpanded] = useState(false);
  const devPanelRef = useRef(null);
  const sectionRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Task 2.1 & 2.5: Scroll reveal & staggered entrance
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "80px 0px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const items = useMemo(() => {
    const arr = Array.isArray(categories) && categories.length ? categories.slice() : [];

    if (arr.length === 0) return [];

    const seen = new Set();
    const out = [];

    for (const c of arr) {
      const rawSlug = String(c.slug || c.id || c.categoryId || "").trim().toLowerCase();
      const slug = normalizeWebsiteCategorySlug(rawSlug);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      let count = 0;
      if (typeof c.count === "number" && c.count > 0) {
        count = c.count;
      } else if (typeof c.websiteCount === "number" && c.websiteCount > 0) {
        count = c.websiteCount;
      } else if (Array.isArray(websitesByCategory[slug]) && websitesByCategory[slug].length > 0) {
        count = websitesByCategory[slug].length;
      } else if (Array.isArray(allWebsites) && allWebsites.length > 0) {
        count = getWebsiteCountForCategory(slug, allWebsites);
      }

      out.push({
        slug,
        label: c.name || c.label || labelForCategory(slug, c.name),
        count,
        desc: c.description || c.subtitle || null,
        isDev: slug === "developers",
      });
    }

    // Hide legacy duplicate/fragmented categories from public homepage
    const hiddenHomepageCategories = new Set([
      "tools",
      "ai-tools",
      "programming",
      "coding",
      "sports",
      "books",
      "finance",
      "movies",
      "tv",
    ]);

    const result = out.filter(
      (item) => !hiddenHomepageCategories.has(item.slug)
    );
    return result;
  }, [categories, websitesByCategory, allWebsites]);

  // Task: Do not overwrite existing rendered category list with empty data
  const [stableItems, setStableItems] = useState([]);
  useEffect(() => {
    if (items.length > 0) {
      setStableItems(items);
    }
  }, [items]);
  const displayItems = stableItems.length > 0 ? stableItems : items;

  const devSubcategoriesWithCounts = useMemo(() => {
    const published = Array.isArray(allWebsites) ? allWebsites : [];
    const baseList = Array.isArray(developerSubcategories) && developerSubcategories.length > 0
      ? developerSubcategories
      : DEVELOPER_SUBCATEGORIES;

    return baseList.map((sub) => {
      const subId = sub.id || sub.slug;
      const subLabel = sub.label || sub.name;
      const count = typeof sub.count === "number" ? sub.count : getWebsiteCountForSubcategory(subId, published);
      return {
        ...sub,
        id: subId,
        slug: subId,
        label: subLabel,
        name: subLabel,
        icon: sub.icon || "💻",
        count,
      };
    });
  }, [allWebsites, developerSubcategories]);

  // Scroll into view if expanded
  useEffect(() => {
    if (devExpanded && devPanelRef.current) {
      const el = devPanelRef.current;
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [devExpanded]);

  if (!displayItems.length) return null;

  const go = (slug) => {
    if (slug === "developers") {
      // Toggle expansion when clicked
      setDevExpanded((prev) => !prev);
      return;
    }
    const path = `/websites/${slug}`;
    if (typeof onNavigate === "function") { onNavigate(path, slug); return; }
    navigate(path);
  };

  const openSubcategory = (subSlug, e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    const path = `/websites/developers/${subSlug}`;
    if (typeof onNavigate === "function") { onNavigate(path, subSlug); return; }
    navigate(path);
  };

  const openDeveloperLanding = (e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    const path = `/websites/developers`;
    if (typeof onNavigate === "function") { onNavigate(path, "developers"); return; }
    navigate(path);
  };

  return (
    <section
      ref={sectionRef}
      className={`sites-catgrid-section ${isRevealed ? "is-revealed" : ""}`}
      aria-label={t("categories.title", "Browse by Category")}
    >
      <div className="sites-catgrid-head">
        <h2 className="sites-catgrid-title">{t("categories.title", "Browse by Category")}</h2>
      </div>

      <div className="sites-catgrid">
        {displayItems.map((c) => {
          const emoji = getCategoryEmoji(c.slug, c.label);
          const isDev = c.slug === "developers";

          return (
            <button
              key={c.slug}
              type="button"
              onClick={(e) => go(c.slug, e)}
              className={`sites-catgrid-tile ${isDev ? "is-developers-tile" : ""} ${isDev && devExpanded ? "is-expanded" : ""}`}
              aria-label={`${c.label} — ${c.count} sites`}
              aria-expanded={isDev ? devExpanded : undefined}
              aria-controls={isDev ? "developers-subcategories-panel" : undefined}
            >
              <span className="sites-catgrid-icon-wrap" aria-hidden="true">
                <CategoryOutlineIcon slug={c.slug} size={24} />
              </span>
              <span className="sites-catgrid-meta">
                <span className="sites-catgrid-name">{c.label}</span>
                <span className="sites-catgrid-count">
                  {c.count} {c.count === 1 ? "site" : "sites"}
                </span>
              </span>
              {isDev && (
                <span className="sites-catgrid-dev-indicator" aria-hidden title="Expand Developer Resources">
                  {devExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expandable Developer Resources Ecosystem Panel */}
      {devExpanded && (
        <div
          id="developers-subcategories-panel"
          ref={devPanelRef}
          className="sites-dev-panel"
          role="region"
          aria-label="Developers Resources Subcategories"
        >
          <div className="sites-dev-panel-head">
            <div className="sites-dev-panel-title-group">
              <div className="sites-dev-badge">
                <Code2 size={13} />
                <span>DEVELOPER ECOSYSTEM</span>
              </div>
              <h3 className="sites-dev-panel-title">Developers Resources</h3>
              <p className="sites-dev-panel-desc">
                All essential resources for developers — AI coding, IDEs, databases, APIs, cloud, frameworks, and tools.
              </p>
            </div>
            <button
              type="button"
              className="sites-dev-hub-link"
              onClick={openDeveloperLanding}
            >
              <span>Explore Developers Hub</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="sites-dev-subgrid">
            {devSubcategoriesWithCounts.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className="sites-dev-subcard"
                onClick={(e) => openSubcategory(sub.id, e)}
                aria-label={`${sub.label} — ${sub.count} sites`}
              >
                <div className="sites-dev-subcard-left">
                  <span className="sites-dev-sub-icon-wrap" aria-hidden="true">
                    <DeveloperSubcategoryOutlineIcon slug={sub.id || sub.slug} size={20} />
                  </span>
                  <div className="sites-dev-sub-meta">
                    <span className="sites-dev-sub-name">{sub.label}</span>
                    <span className="sites-dev-sub-count">
                      {sub.count} {sub.count === 1 ? "site" : "sites"}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="sites-dev-sub-chevron" />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .sites-catgrid-section { padding: 10px 0 4px; }
        .sites-catgrid-head { margin-bottom: 8px; display: flex; align-items: baseline; justify-content: space-between; }
        .sites-catgrid-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 14.5px; font-weight: 800; letter-spacing: -0.01em; color: ${TOKENS.text};
        }
        .sites-catgrid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }
        @media (max-width: 1380px) { .sites-catgrid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
        @media (max-width: 1100px) { .sites-catgrid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 768px)  { .sites-catgrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 520px)  { .sites-catgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 340px)  { .sites-catgrid { grid-template-columns: repeat(1, minmax(0, 1fr)); } }

        @keyframes borderPulse {
          0%, 100% { border-color: rgba(245, 166, 35, 0.45); }
          50% { border-color: rgba(255, 209, 124, 0.85); }
        }

        .sites-catgrid-tile {
          appearance: none;
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px;
          text-align: left;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: ${TOKENS.radiusSm}px;
          cursor: pointer;
          min-height: 50px;
          color: ${TOKENS.text};
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 220ms ease,
                      border-color 220ms ease,
                      background 220ms ease,
                      box-shadow 220ms ease;
          font-family: inherit;
          position: relative;
          opacity: 0;
          transform: translateY(12px);
        }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile {
          opacity: 1;
          transform: translateY(0);
        }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(1)  { transition-delay: 30ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(2)  { transition-delay: 55ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(3)  { transition-delay: 80ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(4)  { transition-delay: 105ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(5)  { transition-delay: 130ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(6)  { transition-delay: 155ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(7)  { transition-delay: 180ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(8)  { transition-delay: 205ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(9)  { transition-delay: 230ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(10) { transition-delay: 255ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(11) { transition-delay: 280ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(12) { transition-delay: 305ms; }
        .sites-catgrid-section.is-revealed .sites-catgrid-tile:nth-child(n+13) { transition-delay: 330ms; }

        .sites-catgrid-tile:hover {
          transform: scale(1.02) translateY(-2px);
          background: ${TOKENS.panel2};
          border-color: var(--stea-gold-hi);
          animation: borderPulse 3s ease-in-out infinite;
          box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.65), 0 0 18px rgba(245, 166, 35, 0.28), 0 0 0 1px rgba(245, 166, 35, 0.35);
        }
        .sites-catgrid-tile.is-developers-tile {
          border-color: color-mix(in srgb, ${TOKENS.gold} 25%, ${TOKENS.border});
        }
        .sites-catgrid-tile.is-developers-tile.is-expanded {
          background: ${TOKENS.panel2};
          border-color: ${TOKENS.gold};
          box-shadow: 0 0 0 1px ${TOKENS.goldSoft}, 0 10px 20px rgba(0,0,0,0.3);
        }
        .sites-catgrid-dev-indicator {
          margin-left: auto;
          color: ${TOKENS.gold};
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          background: ${TOKENS.goldSoft};
        }
        .sites-catgrid-icon-wrap {
          position: relative;
          flex: 0 0 24px;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--stea-text2);
          transition: color 220ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .sites-catgrid-tile:hover .sites-catgrid-icon-wrap {
          color: var(--stea-gold-hi);
          transform: scale(1.08);
        }

        .sites-catgrid-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
        .sites-catgrid-name {
          font-size: 12.5px; font-weight: 750; color: ${TOKENS.text};
          letter-spacing: -0.01em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sites-catgrid-count {
          font-size: 10.5px; font-weight: 600; color: ${TOKENS.text3}; letter-spacing: 0.01em;
        }

        /* -------- Developer Ecosystem Panel -------- */
        .sites-dev-panel {
          margin-top: 10px;
          padding: 14px;
          background: linear-gradient(180deg, #101424, #0b0e1b);
          border: 1px solid color-mix(in srgb, ${TOKENS.gold} 28%, ${TOKENS.border});
          border-radius: 14px;
          animation: devPanelFade 200ms ease-out forwards;
        }
        @keyframes devPanelFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sites-dev-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .sites-dev-panel-title-group {
          max-width: 600px;
        }
        .sites-dev-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 7px;
          border-radius: 999px;
          background: ${TOKENS.goldSoft};
          color: ${TOKENS.goldHi};
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .sites-dev-panel-title {
          margin: 0 0 2px;
          font-family: "'Bricolage Grotesque', sans-serif";
          font-size: 18px;
          font-weight: 850;
          color: var(--stea-text);
          letter-spacing: -0.01em;
        }
        .sites-dev-panel-desc {
          margin: 0;
          font-size: 12px;
          color: ${TOKENS.text2};
          line-height: 1.4;
        }
        .sites-dev-hub-link {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          background: linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold});
          border: none;
          color: #111;
          font-family: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 6px 14px rgba(245,166,35,0.22);
          transition: transform 140ms ease, opacity 140ms ease;
        }
        .sites-dev-hub-link:hover {
          transform: translateY(-0.5px);
          opacity: 0.95;
        }

        .sites-dev-subgrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }
        @media (max-width: 1100px) { .sites-dev-subgrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 768px)  { .sites-dev-subgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 480px)  { .sites-dev-subgrid { grid-template-columns: repeat(1, minmax(0, 1fr)); } }

        @keyframes devSubcardReveal {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .sites-dev-subcard {
          appearance: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          cursor: pointer;
          color: var(--stea-text);
          font-family: inherit;
          text-align: left;
          min-height: 44px;
          animation: devSubcardReveal 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: background 180ms ease, border-color 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease;
        }
        .sites-dev-subcard:nth-child(1)  { animation-delay: 25ms; }
        .sites-dev-subcard:nth-child(2)  { animation-delay: 45ms; }
        .sites-dev-subcard:nth-child(3)  { animation-delay: 65ms; }
        .sites-dev-subcard:nth-child(4)  { animation-delay: 85ms; }
        .sites-dev-subcard:nth-child(5)  { animation-delay: 105ms; }
        .sites-dev-subcard:nth-child(6)  { animation-delay: 125ms; }
        .sites-dev-subcard:nth-child(7)  { animation-delay: 145ms; }
        .sites-dev-subcard:nth-child(8)  { animation-delay: 165ms; }
        .sites-dev-subcard:nth-child(n+9) { animation-delay: 185ms; }

        .sites-dev-subcard:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--stea-gold-hi);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 0 12px rgba(245, 166, 35, 0.25);
          transform: scale(1.02) translateY(-1px);
        }
        .sites-dev-subcard-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .sites-dev-sub-icon-wrap {
          flex: 0 0 20px;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--stea-text2);
          flex-shrink: 0;
          transition: color 180ms ease, transform 180ms ease;
        }
        .sites-dev-subcard:hover .sites-dev-sub-icon-wrap {
          color: var(--stea-gold-hi);
          transform: scale(1.08);
        }
        .sites-dev-sub-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .sites-dev-sub-name {
          font-size: 12px;
          font-weight: 750;
          color: var(--stea-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-dev-sub-count {
          font-size: 10.5px;
          color: ${TOKENS.text3};
          font-weight: 600;
        }
        .sites-dev-sub-chevron {
          color: ${TOKENS.text3};
          flex-shrink: 0;
          margin-left: 6px;
          transition: color 180ms ease, transform 180ms ease;
        }
        .sites-dev-subcard:hover .sites-dev-sub-chevron {
          color: ${TOKENS.gold};
          transform: translateX(1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .sites-catgrid-tile,
          .sites-dev-panel,
          .sites-dev-subcard,
          .sites-catgrid-icon-wrap,
          .sites-dev-sub-icon-wrap,
          .sites-dev-sub-chevron {
            transition: none !important;
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}

export default memo(SitesCategoryTiles);

