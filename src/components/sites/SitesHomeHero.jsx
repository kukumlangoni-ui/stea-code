/**
 * SitesHomeHero — STEA Clean Hero & Real Search Engine Pass
 *
 * Spec:
 *   - Hero headline: "The useful side of the internet." (No decorative marketing badges above it)
 *   - Subtitle: "Fast discovery of useful websites. Curated, searchable, one click away."
 *   - Responsive search input with single clear control and search action
 *   - Instant live suggestions dropdown with REAL website icons and category/subcategory intent banner
 *   - Max-height 420-440px with sleek internal scroll and spotlight feel
 *   - Touch-swipeable trending chips with zero overflow
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ArrowUpRight, ChevronRight, X } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage } from "../../i18n/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getSearchSuggestions, SECRET_AFTER_DARK_KEYWORDS } from "../../hooks/useSearch.js";
import { triggerAgeGateOrNavigate } from "./AgeGateModal.jsx";
import WebsiteIcon from "./WebsiteIcon.jsx";
import { CategoryOutlineIcon, DeveloperSubcategoryOutlineIcon } from "./CategoryOutlineIcons.jsx";

export const DEFAULT_TRENDING_CHIPS = [
  { slug: "movies-tv-shows",   iconKey: "film",    label: "Movies & TV" },
  { slug: "live-sports",        iconKey: "trophy",  label: "Sports" },
  { slug: "developers",         iconKey: "code",    label: "Developers" },
  { slug: "ai",                 iconKey: "bot",     label: "AI" },
  { slug: "music",              iconKey: "music2",  label: "Music" },
  { slug: "money-finance",      iconKey: "wallet",  label: "Finance" },
  { slug: "graphics-design",    iconKey: "palette", label: "Design" },
  { slug: "online-courses",     iconKey: "graduationcap", label: "Learning" },
  { slug: "ebooks",             iconKey: "bookopen", label: "Books" },
  { slug: "games",              iconKey: "gamepad", label: "Games" },
];

export const HERO_ROTATING_SUBTITLES = [
  "Websites, tools, resources and digital destinations — curated in one place.",
  "Fast discovery of useful websites. Curated, searchable, one click away.",
  "One gateway for entertainment, study, and developer tools.",
  "Hand-picked websites for creators, learners & developers.",
  "Find movies, sports, dev resources & handy tools all in one spot.",
  "Your all-in-one curated directory for the internet’s best tools.",
];

export default function SitesHomeHero({
  initialQuery = "",
  allWebsites = [],
  categories = [],
  developerSubcategories = [],
  onSearch,
  onOpenCategory,
  onSelectWebsite,
  trendingChips,
  websiteCount = 0,
  categoryCount = 0,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const heroCardRef = useRef(null);
  const { t } = useSitesLanguage();
  const { user } = useAuth();

  // Task 1: Auto-rotating dynamic subtitle (4.2s interval hold, 600ms transition, pause on tab hide)
  useEffect(() => {
    let intervalId = null;

    const startTimer = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        setSubtitleIndex((prev) => (prev + 1) % HERO_ROTATING_SUBTITLES.length);
      }, 4200);
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    if (!document.hidden) {
      startTimer();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Measure hero card height so the left category rail can stick below it
  useEffect(() => {
    const el = heroCardRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty("--sites-hero-h", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Task 3: "/" keyboard shortcut to instantly focus search bar
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
        if (tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable) {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const chips = Array.isArray(trendingChips) && trendingChips.length > 0 ? trendingChips : DEFAULT_TRENDING_CHIPS;

  // Sync external initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Generate instant suggestions from the connected runtime catalog
  const { categoryIntent, results: suggestions } = useMemo(() => {
    if (!query || !query.trim() || query.trim().length < 1) {
      return { categoryIntent: null, results: [] };
    }
    return getSearchSuggestions(allWebsites, query, {
      max: 8,
      categories,
      developerSubcategories,
    });
  }, [allWebsites, query, categories, developerSubcategories]);

  const hasSuggestions = Boolean(categoryIntent || suggestions.length > 0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    const clean = val.toLowerCase().trim();
    if (SECRET_AFTER_DARK_KEYWORDS.includes(clean)) {
      setQuery("");
      setIsOpen(false);
      triggerAgeGateOrNavigate(null, "/after-dark");
      return;
    }
    setQuery(val);
    setIsOpen(Boolean(val.trim()));
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    if (onSearch) onSearch("");
    if (inputRef.current) inputRef.current.focus();
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    const val = query.trim();
    const clean = val.toLowerCase().trim();
    if (SECRET_AFTER_DARK_KEYWORDS.includes(clean)) {
      setQuery("");
      setIsOpen(false);
      triggerAgeGateOrNavigate(null, "/after-dark");
      return;
    }
    setIsOpen(false);
    if (onSearch) onSearch(val);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || !hasSuggestions) {
      if (e.key === "Enter") {
        submit(e);
      }
      return;
    }

    const totalItems = (categoryIntent ? 1 : 0) + suggestions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex === 0 && categoryIntent) {
        setIsOpen(false);
        if (onOpenCategory) onOpenCategory(categoryIntent.slug, categoryIntent.path);
      } else if (selectedIndex >= 0) {
        const itemIdx = categoryIntent ? selectedIndex - 1 : selectedIndex;
        const site = suggestions[itemIdx];
        if (site) {
          setIsOpen(false);
          if (onSelectWebsite) onSelectWebsite(site);
          else if (onSearch) onSearch(site.name);
        }
      } else {
        submit(e);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <section className={`sites-home-hero-v2 ${isOpen && hasSuggestions ? "is-search-active" : ""}`} aria-labelledby="sites-home-title">
      <div className="sites-hero-atm-card" ref={heroCardRef}>
        {/* Border glow wrap & subtle light sweep (System A, Layer 5) */}
        <div className="sites-hero-border-glow-wrap" aria-hidden="true" />

        {/* Multi-layer atmospheric light and vignette (System A, Layers 1-4) */}
        <div className="sites-hero-atm-clip" aria-hidden="true">
          <div className="sites-hero-layer-base" />
          <div className="sites-hero-layer-secondary" />
          <div className="sites-hero-layer-brand" />
          <div className="sites-hero-orb sites-hero-orb-1" />
          <div className="sites-hero-orb sites-hero-orb-2" />
          <div className="sites-hero-orb sites-hero-orb-3" />
          <div className="sites-hero-card-vignette" />
        </div>
        <div className="sites-hero-inner">
          <div className="sites-hero-top">
            <div className="sites-hero-text-col">
              {/* Editorial Eyebrow */}
              <span className="sites-hero-eyebrow" aria-hidden="true">
                THE USEFUL SIDE OF THE INTERNET
              </span>

              {/* Main H1 hero title */}
              <h1 id="sites-home-title" className="sites-hero-title">
                Discover what the internet
                <span className="sites-hero-title-accent"> has to offer.</span>
              </h1>

              {/* Directly underneath main heading: Rotating Dynamic Subtitle */}
              <div className="sites-hero-subtitle-container" aria-live="polite">
                {HERO_ROTATING_SUBTITLES.map((text, idx) => (
                  <p
                    key={idx}
                    className={`sites-hero-subtitle ${idx === subtitleIndex ? "is-active" : ""}`}
                    aria-hidden={idx !== subtitleIndex}
                  >
                    {text}
                  </p>
                ))}
              </div>
            </div>

            {/* Stat boxes */}
            <div className="sites-hero-stats" aria-hidden="false">
              <div className="sites-hero-stat">
                <span className="sites-hero-stat-num">{websiteCount}</span>
                <span className="sites-hero-stat-label">Sites</span>
              </div>
              <div className="sites-hero-stat">
                <span className="sites-hero-stat-num">{categoryCount}</span>
                <span className="sites-hero-stat-label">Categories</span>
              </div>
            </div>
          </div>

        {/* Search Input with Instant Dropdown */}
        <div className="sites-hero-search-wrap" ref={wrapRef}>
          <form className="sites-hero-search-form" onSubmit={submit} role="search" aria-label={t("search.websites", "Search websites")}>
            <div className="sites-hero-search-field">
              <Search size={17} className="sites-hero-search-icon" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={handleInputChange}
                onFocus={() => { if (query.trim()) setIsOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder={t("search.heroPlaceholder", "Search 260+ websites, tools, categories…")}
                aria-label={t("search.websites", "Search websites")}
                aria-expanded={isOpen && hasSuggestions}
                aria-autocomplete="list"
                className="sites-hero-search-input"
              />
              {!query && (
                <kbd className="sites-search-kbd" title="Press / to focus search" aria-hidden="true">/</kbd>
              )}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="sites-hero-search-clear"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button type="submit" className="sites-hero-search-button">
                <span className="sites-search-btn-text">{t("buttons.search", "Search")}</span>
                <Search size={15} className="sites-search-btn-icon" aria-hidden />
              </button>
            </div>
          </form>

          {/* Instant Suggestions Dropdown (Spotlight style) */}
          {isOpen && hasSuggestions && (
            <div className="sites-search-dropdown" role="listbox">
              {/* Category / Subcategory Intent Shortcut */}
              {categoryIntent && (
                <div
                  className={`sites-search-suggestion-intent ${selectedIndex === 0 ? "is-selected" : ""}`}
                  role="option"
                  aria-selected={selectedIndex === 0}
                  onClick={() => {
                    setIsOpen(false);
                    if (onOpenCategory) onOpenCategory(categoryIntent.slug, categoryIntent.path);
                  }}
                >
                  <div className="sites-intent-left">
                    <span className="sites-intent-icon" aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", color: "var(--stea-gold-hi)" }}>
                      {categoryIntent.type === "subcategory" ? (
                        <DeveloperSubcategoryOutlineIcon slug={categoryIntent.id || categoryIntent.slug} size={20} />
                      ) : (
                        <CategoryOutlineIcon slug={categoryIntent.slug || categoryIntent.id} size={20} />
                      )}
                    </span>
                    <div className="sites-intent-text">
                      <span className="sites-intent-label">
                        {categoryIntent.type === "subcategory" ? "Developer Subcategory" : "Category"}
                      </span>
                      <strong className="sites-intent-title">{categoryIntent.label}</strong>
                    </div>
                  </div>
                  <div className="sites-intent-right">
                    {categoryIntent.count ? (
                      <span className="sites-intent-count">{categoryIntent.count} sites</span>
                    ) : null}
                    <ChevronRight size={14} className="sites-intent-arrow" />
                  </div>
                </div>
              )}

              {/* Matching Websites with Real Website Icons */}
              {suggestions.map((site, index) => {
                const itemIndex = categoryIntent ? index + 1 : index;
                const isSelected = selectedIndex === itemIndex;
                const categoryBadge = site.subcategory || site.category || "";

                return (
                  <div
                    key={site.id || site.url || index}
                    className={`sites-search-suggestion-item ${isSelected ? "is-selected" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setIsOpen(false);
                      if (onSelectWebsite) onSelectWebsite(site);
                      else if (onSearch) onSearch(site.name);
                    }}
                  >
                    <div className="sites-sugg-left">
                      <WebsiteIcon website={site} size={30} />
                      <div className="sites-sugg-info">
                        <span className="sites-sugg-name">{site.name}</span>
                        <span className="sites-sugg-domain">{site.domain || site.url}</span>
                      </div>
                    </div>
                    <div className="sites-sugg-right">
                      {categoryBadge && (
                        <span className="sites-sugg-badge">{categoryBadge}</span>
                      )}
                      <ArrowUpRight size={13} className="sites-sugg-arrow" />
                    </div>
                  </div>
                );
              })}

              <div className="sites-search-dropdown-footer" onClick={submit}>
                <span>Press <strong>Enter</strong> to see all results for &ldquo;{query}&rdquo;</span>
                <ChevronRight size={13} />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <style>{`
        .sites-home-hero-v2 {
          padding: 8px 0 6px;
          position: relative;
          flex-shrink: 0;
          z-index: var(--stea-z-hero, 30);
          transition: z-index 120ms ease;
        }
        .sites-home-hero-v2.is-search-active,
        .sites-home-hero-v2:focus-within {
          z-index: var(--stea-z-hero-active, 45);
        }
        /* Atmospheric bordered hero card */
        .sites-hero-atm-card {
          --hero-radius: 24px;
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 24px clamp(16px, 2.5vw, 32px) 18px;
          border-radius: var(--hero-radius);
          background: radial-gradient(ellipse at 50% -20%, rgba(124, 58, 237, 0.28) 0%, rgba(99, 102, 241, 0.14) 40%, rgba(14, 17, 30, 0.98) 100%), #0D0F1B;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 40px rgba(124, 58, 237, 0.18);
          overflow: visible;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
        }
        .sites-hero-inner {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .sites-hero-top {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .sites-hero-text-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .sites-hero-stats {
          display: flex;
          flex-direction: row;
          gap: 8px;
          flex-shrink: 0;
        }
        .sites-hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 64px;
          padding: 6px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .sites-hero-stat-num {
          font-family: "'Bricolage Grotesque', system-ui, sans-serif";
          font-size: 16px;
          font-weight: 850;
          line-height: 1;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .sites-hero-stat-label {
          margin-top: 4px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${TOKENS.text3};
        }
        .sites-hero-eyebrow {
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${TOKENS.goldHi};
          display: inline-block;
          margin-bottom: -4px;
        }
        .sites-hero-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, -apple-system, sans-serif";
          font-size: clamp(24px, 2.4vw, 30px);
          line-height: 1.15;
          letter-spacing: -0.02em;
          font-weight: 850;
          color: ${TOKENS.text};
        }
        .sites-hero-title-accent {
          color: ${TOKENS.gold};
        }
        /* Task 1: Rotating Dynamic Subtitle Container - Zero Layout Shift CSS Grid */
        .sites-hero-subtitle-container {
          display: none;
        }
        .sites-hero-subtitle-container .sites-hero-subtitle {
          grid-area: 1 / 1;
          margin: 0;
          max-width: 60ch;
          color: var(--stea-text, #F3F4F6);
          font-size: clamp(13px, 1.4vw, 15px);
          font-weight: 600;
          letter-spacing: 0.015em;
          line-height: 1.48;
          opacity: 0;
          transform: translateY(6px);
          visibility: hidden;
          transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1), visibility 600ms cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          will-change: opacity, transform;
        }
        .sites-hero-subtitle-container .sites-hero-subtitle.is-active {
          opacity: 1;
          transform: translateY(0);
          visibility: visible;
          pointer-events: auto;
        }

        .sites-search-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--stea-text3);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 5px;
          margin-right: 6px;
          user-select: none;
          pointer-events: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }
        @media (max-width: 640px) {
          .sites-search-kbd {
            display: none;
          }
        }

        /* Search wrap */
        .sites-hero-search-wrap {
          position: relative;
          width: 100%;
          max-width: 640px;
          margin-top: 4px;
          z-index: 30;
        }
        .sites-hero-search-form {
          width: 100%;
        }
        .sites-hero-search-field {
          position: relative;
          display: flex;
          align-items: center;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.borderHi};
          border-radius: 12px;
          padding: 3px 3px 3px 12px;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .sites-hero-search-field:focus-within {
          border-color: ${TOKENS.gold};
          box-shadow: 0 0 0 3px ${TOKENS.goldSoft}, 0 12px 28px rgba(0,0,0,0.3);
          background: ${TOKENS.panel2};
        }
        .sites-hero-search-icon {
          color: ${TOKENS.text3};
          flex-shrink: 0;
          transition: color 160ms ease;
        }
        .sites-hero-search-field:focus-within .sites-hero-search-icon {
          color: ${TOKENS.gold};
        }
        .sites-hero-search-input {
          flex: 1;
          border: 0;
          background: transparent;
          outline: none;
          padding: 8px 8px;
          color: ${TOKENS.text};
          font: inherit;
          font-size: 13.5px;
          min-width: 0;
          -webkit-appearance: none;
          appearance: none;
        }
        .sites-hero-search-input::placeholder {
          color: ${TOKENS.text3};
        }
        .sites-hero-search-clear {
          appearance: none;
          background: transparent;
          border: 0;
          color: ${TOKENS.text3};
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          transition: color 140ms ease;
        }
        .sites-hero-search-clear:hover {
          color: ${TOKENS.text};
        }
        .sites-hero-search-button {
          appearance: none;
          border: 0;
          border-radius: 9px;
          padding: 0 16px;
          height: 34px;
          background: #F5A623;
          color: #000000;
          font: inherit;
          font-weight: 850;
          font-size: 13px;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: transform 140ms ease, filter 140ms ease, box-shadow 140ms ease;
          box-shadow: 0 4px 14px rgba(245,166,35,0.3);
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .sites-hero-search-button:hover {
          filter: brightness(1.08);
          transform: translateY(-0.5px);
        }
        .sites-search-btn-icon {
          display: none;
        }

        /* Dropdown suggestions (Spotlight style, max-height 430px) */
        .sites-search-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: ${TOKENS.surface};
          border: 1px solid color-mix(in srgb, ${TOKENS.gold} 28%, ${TOKENS.border});
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.15), 0 0 0 1px var(--stea-border);
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-height: 430px;
          overflow-y: auto;
          text-align: left;
          z-index: var(--stea-z-search-dropdown, 50);
          animation: dropdownFade 140ms ease-out;
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sites-search-suggestion-intent {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 8px;
          background: color-mix(in srgb, ${TOKENS.gold} 10%, rgba(255,255,255,0.02));
          border: 1px solid color-mix(in srgb, ${TOKENS.gold} 22%, transparent);
          cursor: pointer;
          transition: background 120ms ease, border-color 120ms ease;
        }
        .sites-search-suggestion-intent:hover,
        .sites-search-suggestion-intent.is-selected {
          background: color-mix(in srgb, ${TOKENS.gold} 18%, rgba(255,255,255,0.04));
          border-color: ${TOKENS.gold};
        }
        .sites-intent-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .sites-intent-icon {
          font-size: 18px;
          line-height: 1;
        }
        .sites-intent-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .sites-intent-label {
          font-size: 9px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${TOKENS.goldHi};
        }
        .sites-intent-title {
          font-size: 13px;
          color: var(--stea-text, #F3F4F6);
          font-weight: 800;
        }
        .sites-intent-right {
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${TOKENS.goldHi};
        }
        .sites-intent-count {
          font-size: 10.5px;
          font-weight: 600;
        }
        .sites-intent-arrow {
          color: ${TOKENS.goldHi};
        }

        .sites-search-suggestion-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 7px;
          cursor: pointer;
          transition: background 120ms ease;
          gap: 8px;
        }
        .sites-search-suggestion-item:hover,
        .sites-search-suggestion-item.is-selected {
          background: rgba(255,255,255,0.07);
        }
        .sites-sugg-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .sites-sugg-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 1px;
        }
        .sites-sugg-name {
          font-size: 12.5px;
          font-weight: 750;
          color: ${TOKENS.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-sugg-domain {
          font-size: 10.5px;
          color: ${TOKENS.text3};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-sugg-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .sites-sugg-badge {
          font-size: 9.5px;
          font-weight: 650;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          color: ${TOKENS.text2};
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-sugg-arrow {
          color: ${TOKENS.text3};
          transition: color 120ms ease, transform 120ms ease;
        }
        .sites-search-suggestion-item:hover .sites-sugg-arrow {
          color: ${TOKENS.gold};
          transform: translate(1px, -1px);
        }
        .sites-search-dropdown-footer {
          border-top: 1px solid ${TOKENS.border};
          margin-top: 4px;
          padding: 6px 8px 2px;
          font-size: 11px;
          color: ${TOKENS.text3};
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .sites-search-dropdown-footer strong {
          color: ${TOKENS.goldHi};
        }
        .sites-search-dropdown-footer:hover {
          color: ${TOKENS.text};
        }

        /* Trending chips swipeable row */
        .sites-hero-trending-row {
          position: relative;
          z-index: 5;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 2px;
          min-width: 0;
        }
        .sites-hero-trending-label {
          flex-shrink: 0;
          color: ${TOKENS.text3};
          font-size: 10.5px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-weight: 800;
        }
        .sites-hero-trending-scroll {
          flex: 1;
          min-width: 0;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          display: flex;
        }
        .sites-hero-trending-scroll::-webkit-scrollbar {
          display: none;
        }
        .sites-hero-trending-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .sites-trending-chip {
          appearance: none;
          border: 1px solid ${TOKENS.border};
          background: ${TOKENS.panel};
          color: ${TOKENS.text};
          border-radius: 999px;
          padding: 4px 10px;
          font: inherit;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
        }
        .sites-trending-chip:hover {
          border-color: color-mix(in srgb, ${TOKENS.gold} 40%, ${TOKENS.border});
          background: ${TOKENS.panel2};
          color: ${TOKENS.goldHi};
        }

        .sites-hero-suggest-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .sites-hero-suggest-tooltip {
          position: absolute;
          bottom: calc(100% + 7px);
          right: 0;
          background: var(--stea-panel, rgba(14, 18, 28, 0.96));
          color: var(--stea-text, #F3F4F6);
          border: 1px solid rgba(245, 166, 35, 0.35);
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 150ms ease, transform 150ms ease;
          z-index: 50;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        }
        .sites-hero-suggest-wrap:hover .sites-hero-suggest-tooltip {
          opacity: 1;
          transform: translateY(0);
        }
        /* Light theme override for tooltip — fixes the black shadow issue */
        [data-theme="light"] .sites-hero-suggest-tooltip,
        .stea-home-light .sites-hero-suggest-tooltip,
        html.light .sites-hero-suggest-tooltip {
          background: #FFFFFF !important;
          color: #0F172A !important;
          border: 1px solid rgba(15, 23, 42, 0.1) !important;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12) !important;
        }


        .sites-hero-suggest-btn {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px dashed rgba(245, 166, 35, 0.45);
          background: rgba(245, 166, 35, 0.08);
          color: var(--stea-gold-hi);
          border-radius: 999px;
          padding: 4px 11px;
          font: inherit;
          font-size: 11.5px;
          font-weight: 750;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
        }
        .sites-hero-suggest-btn:hover {
          background: rgba(245, 166, 35, 0.18);
          border-color: var(--stea-gold-hi);
          transform: translateY(-0.5px);
        }
        .sites-hero-suggest-plus {
          font-size: 13px;
          font-weight: 850;
          line-height: 1;
        }

        /* Stack stats below text on smaller screens */
        @media (max-width: 760px) {
          .sites-hero-top {
            flex-direction: column;
            gap: 18px;
          }
          .sites-hero-stats {
            flex-direction: row;
            gap: 10px;
          }
          .sites-hero-stat {
            min-width: 96px;
            padding: 10px 14px;
          }
          .sites-hero-stat-num { font-size: 22px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sites-hero-orb { animation: none !important; }
        }
        /* Mobile Adjustments (320px - 540px) */
        @media (max-width: 540px) {
          .sites-home-hero-v2 { padding: 4px 0 2px; }
          .sites-hero-inner { gap: 8px; }
          .sites-hero-title { font-size: 32px; }
          .sites-hero-subtitle { font-size: 11.5px; }
          .sites-hero-atm-card { --hero-radius: 18px; padding: 18px 14px 16px; }
          .sites-hero-search-field {
            padding: 2px 2px 2px 10px;
            border-radius: 10px;
          }
          .sites-hero-search-input {
            font-size: 12.5px;
            padding: 7px 6px;
          }
          .sites-hero-search-button {
            height: 30px;
            padding: 0 10px;
            font-size: 11.5px;
          }
          .sites-search-btn-text {
            display: inline-block;
          }
        }
        @media (max-width: 360px) {
          .sites-search-btn-text {
            display: none;
          }
          .sites-search-btn-icon {
            display: inline-block;
          }
          .sites-hero-search-button {
            padding: 0 8px;
            width: 30px;
          }
        }
      `}</style>
    </section>
  );
}
