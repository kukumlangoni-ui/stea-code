import React, { memo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { TOKENS } from "./tokens.js";
import { getWebsiteCategoryLabel } from "../../data/websiteCategories.js";
import { normalizeWebsiteCategorySlug } from "../../constants/categoryOrder.js";

/**
 * SitesCategoryNavRail — Fixed/Sticky Category Navigation Rail (Desktop) & Sticky Scrollable Nav (Mobile)
 *
 * Spec:
 *  - Fixed/sticky left navigation rail (never moves when page scrolls)
 *  - Premium sliding animated pill indicator on active category change
 *  - Category names as primary typographic navigation
 *  - Small real counts aligned to the right
 *  - Selected category gets subtle illuminated/pill treatment
 *  - Clean, minimal, zero visual clutter (no giant emoji icons)
 *  - Seamless responsive adaptation for mobile & tablet
 */
function SitesCategoryNavRail({
  categories = [],
  websitesByCategory = {},
  activeCategory = "all",
  onSelectCategory,
  totalWebsitesCount = 0,
}) {
  const mobileNavRef = useRef(null);
  const activeMobileBtnRef = useRef(null);

  // Auto-scroll active item into view on mobile
  useEffect(() => {
    if (activeMobileBtnRef.current && mobileNavRef.current) {
      const container = mobileNavRef.current;
      const el = activeMobileBtnRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeCategory]);

  const items = categories.map((cat) => {
    const slug = normalizeWebsiteCategorySlug(
      cat.slug || cat.categoryId || cat.id || cat.name
    );
    const label = cat.label || cat.name || cat.title || getWebsiteCategoryLabel(slug);
    const count =
      (typeof cat.count === "number" ? cat.count : 0) ||
      (websitesByCategory[slug] || []).length;
    return {
      slug,
      label,
      count,
      path: `/websites/${slug}`,
    };
  }).filter((item) => item.slug);

  const handleCategoryClick = (e, item) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(item.slug, item.path);
    }
  };

  // "All" control scrolls to top; active state is resolved by IntersectionObserver.
  const handleAllClick = (e) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory("all", "/websites");
    }
  };

  return (
    <>
      {/* ─── DESKTOP LEFT NAVIGATION RAIL ─── */}
      <aside className="sites-category-nav-rail" aria-label="Category navigation">
        <div className="sites-nav-rail-inner">
          <div className="sites-nav-rail-eyebrow">
            <span>CATEGORIES</span>
            {totalWebsitesCount > 0 && (
              <span className="sites-nav-rail-total">{totalWebsitesCount} sites</span>
            )}
          </div>

          <nav className="sites-nav-rail-list" role="navigation">
            {/* Individual Categories — every item maps to a real homepage section */}
            {items.map((item) => {
              const isActive = activeCategory === item.slug;
              return (
                <a
                  key={item.slug}
                  href={item.path}
                  onClick={(e) => handleCategoryClick(e, item)}
                  data-cat-slug={item.slug}
                  className={`sites-nav-rail-item ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryRailPill"
                      className="sites-nav-rail-active-bg"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="sites-nav-rail-name" title={item.label}>
                    {item.label}
                  </span>
                  {item.count > 0 && (
                    <span className="sites-nav-rail-count">{item.count}</span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ─── MOBILE STICKY HORIZONTAL CATEGORY BAR ─── */}
      <div className="sites-category-mobile-nav" aria-label="Mobile category navigation">
        <div className="sites-category-mobile-scroll" ref={mobileNavRef}>
          <button
            type="button"
            ref={activeCategory === "all" || !activeCategory ? activeMobileBtnRef : null}
            onClick={handleAllClick}
            className={`sites-category-mobile-pill ${activeCategory === "all" || !activeCategory ? "is-active" : ""}`}
          >
            {(activeCategory === "all" || !activeCategory) && (
              <motion.div
                layoutId="activeCategoryMobilePill"
                className="sites-mobile-pill-active-bg"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>All</span>
            {totalWebsitesCount > 0 && (
              <span className="sites-mobile-pill-count" style={{ position: "relative", zIndex: 1 }}>{totalWebsitesCount}</span>
            )}
          </button>

          {items.map((item) => {
            const isActive = activeCategory === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                ref={isActive ? activeMobileBtnRef : null}
                onClick={(e) => handleCategoryClick(e, item)}
                className={`sites-category-mobile-pill ${isActive ? "is-active" : ""}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryMobilePill"
                    className="sites-mobile-pill-active-bg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span className="sites-mobile-pill-count" style={{ position: "relative", zIndex: 1 }}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        /* ─── Desktop Rail Styles ─── */
        .sites-category-nav-rail {
          display: block;
          width: 220px;
          flex-shrink: 0;
          position: sticky;
          top: 76px;
          height: calc(100vh - 90px);
          max-height: calc(100vh - 90px);
          z-index: var(--stea-z-rail, 30);
          align-self: flex-start;
        }

        .sites-nav-rail-inner {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
          padding-right: 8px;
          padding-bottom: 24px;
        }

        .sites-nav-rail-inner::-webkit-scrollbar {
          width: 4px;
        }
        .sites-nav-rail-inner::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }

        .sites-nav-rail-eyebrow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${TOKENS.text3};
          padding: 0 10px 10px;
          user-select: none;
        }
        .sites-nav-rail-total {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0;
          text-transform: none;
          color: ${TOKENS.text2};
          opacity: 0.7;
        }

        .sites-nav-rail-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: relative;
        }

        .sites-nav-rail-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          text-decoration: none;
          color: #94A3B8;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: color 140ms ease;
          border: 1px solid transparent;
          user-select: none;
          position: relative;
          z-index: 1;
        }

        .sites-nav-rail-item:hover {
          color: #FFFFFF;
        }

        .sites-nav-rail-active-bg {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: rgba(245, 166, 35, 0.09);
          border: 1px solid #F5A623;
          box-shadow: 0 0 16px rgba(245, 166, 35, 0.15), inset 0 0 12px rgba(245, 166, 35, 0.04);
          z-index: -1;
          pointer-events: none;
        }

        .sites-nav-rail-item.is-active {
          color: #FFFFFF;
          font-weight: 800;
        }

        .sites-mobile-pill-active-bg {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.16);
          border: 1px solid rgba(245, 166, 35, 0.45);
          box-shadow: 0 0 12px rgba(245, 166, 35, 0.15);
          z-index: 0;
          pointer-events: none;
        }

        .sites-nav-rail-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
          padding-right: 8px;
        }

        .sites-nav-rail-count {
          font-size: 11.5px;
          font-weight: 700;
          color: ${TOKENS.text3};
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
          transition: color 140ms ease;
        }

        .sites-nav-rail-item:hover .sites-nav-rail-count,
        .sites-nav-rail-item.is-active .sites-nav-rail-count {
          color: ${TOKENS.goldHi};
        }

        /* ─── Mobile Horizontal Nav ─── */
        .sites-category-mobile-nav {
          display: none;
          position: sticky;
          top: 54px;
          z-index: var(--stea-z-rail, 40);
          background: rgba(6, 8, 15, 0.94);
          backdrop-filter: saturate(180%) blur(20px);
          -webkit-backdrop-filter: saturate(180%) blur(20px);
          margin: 0 calc(-1 * clamp(12px, 2.4vw, 28px)) 16px;
          padding: 10px clamp(12px, 2.4vw, 28px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-sizing: border-box;
          max-width: 100vw;
          overflow: hidden;
        }

        .sites-category-mobile-scroll {
          display: flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
          width: 100%;
        }

        .sites-category-mobile-scroll::-webkit-scrollbar {
          display: none;
        }

        .sites-category-mobile-pill {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.04);
          color: ${TOKENS.text2};
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 999px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 140ms ease;
          flex-shrink: 0;
          position: relative;
        }

        .sites-category-mobile-pill:active,
        .sites-category-mobile-pill:hover {
          color: ${TOKENS.text};
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .sites-category-mobile-pill.is-active {
          background: rgba(245, 166, 35, 0.16);
          border-color: rgba(245, 166, 35, 0.45);
          color: #FFFFFF;
          font-weight: 750;
        }

        .sites-mobile-pill-count {
          font-size: 10.5px;
          font-weight: 700;
          color: ${TOKENS.text3};
          font-variant-numeric: tabular-nums;
        }

        .sites-category-mobile-pill.is-active .sites-mobile-pill-count {
          color: ${TOKENS.goldHi};
        }

        /* Responsive Breakpoint: Desktop rail on >1024px, Sleek horizontal bar on <=1024px */
        @media (max-width: 1024px) {
          .sites-category-nav-rail {
            display: none !important;
          }
          .sites-category-mobile-nav {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}

export default memo(SitesCategoryNavRail);
