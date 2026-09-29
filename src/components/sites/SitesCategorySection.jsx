/**
 * SitesCategorySection — Clean Homepage Category Showcase Section
 *
 * Rules:
 *  - Header format: CATEGORY NAME           COUNT   View all
 *  - No icons/emojis in section headings
 *  - Renders canonical WebsiteSolutionCard for real Firestore website records
 *  - Responsive grid: 6 items on desktop, 4 on laptop, 3 on tablet, 2 on mobile
 *  - Click navigates internally to /site/:slug
 *  - Generous spacing between sections
 */
import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import WebsiteSolutionCard from "../WebsiteSolutionCard.jsx";
import { TOKENS } from "./tokens.js";

function SitesCategorySection({
  title,
  categorySlug,
  websites = [],
  totalCount,
  onOpenWebsite,
  onToggleFavorite,
  favoriteIds = [],
  maxItems = 6
}) {
  const list = (Array.isArray(websites) ? websites : []).slice(0, maxItems);
  if (list.length === 0) return null;

  const count = typeof totalCount === "number" ? totalCount : websites.length;
  const favSet = new Set((favoriteIds || []).map(String));
  const categoryPath = `/websites/${categorySlug}`;

  return (
    <section id={`cat-sec-${categorySlug}`} className="sites-category-section" aria-label={title} style={{ scrollMarginTop: "90px" }}>
      {/* Clean Category Header — No icon/emoji */}
      <div className="sites-category-section-head">
        <div className="sites-category-title-wrap">
          <h2 className="sites-category-section-title">
            <Link to={categoryPath} className="sites-category-title-link">
              {title}
            </Link>
          </h2>
          {count > 0 && (
            <span className="sites-category-count-badge">
              {count} {count === 1 ? "site" : "sites"}
            </span>
          )}
        </div>

        <Link to={categoryPath} className="sites-category-view-all" aria-label={`View all ${title} websites`}>
          <span>View all</span>
          <ChevronRight size={14} strokeWidth={2.4} />
        </Link>
      </div>

      {/* Responsive Grid */}
      <div className="sites-category-section-grid">
        {list.map((site, idx) => {
          const id = String(site.id || site.slug || site.url);
          const isFav = favSet.has(id);
          return (
            <WebsiteSolutionCard
              key={id}
              site={site}
              isFavorite={isFav}
              rank={idx + 1}
              onToggleFavorite={() => onToggleFavorite && onToggleFavorite(site, false)}
              onDetails={() => onOpenWebsite && onOpenWebsite(site)}
            />
          );
        })}
      </div>

      <style>{`
        .sites-category-section {
          margin: 28px 0 16px;
        }
        @media (max-width: 600px) {
          .sites-category-section {
            margin: 20px 0 12px;
          }
        }
        .sites-category-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }
        .sites-category-title-wrap {
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }
        .sites-category-section-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 19px;
          font-weight: 850;
          letter-spacing: -0.015em;
          color: ${TOKENS.text};
          line-height: 1.2;
        }
        @media (max-width: 600px) {
          .sites-category-section-title {
            font-size: 16px;
          }
        }
        .sites-category-title-link {
          color: inherit;
          text-decoration: none;
          transition: color 150ms ease;
        }
        .sites-category-title-link:hover {
          color: ${TOKENS.gold};
        }
        .sites-category-count-badge {
          font-size: 12px;
          font-weight: 700;
          color: ${TOKENS.text3};
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .sites-category-view-all {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 700;
          color: ${TOKENS.goldHi};
          text-decoration: none;
          padding: 3px 6px;
          border-radius: 8px;
          transition: transform 150ms ease, color 150ms ease;
          flex-shrink: 0;
        }
        .sites-category-view-all:hover {
          color: #FFD17C;
          transform: translateX(2px);
        }

        .sites-category-section-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1400px) {
          .sites-category-section-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
          }
        }
        @media (max-width: 1100px) {
          .sites-category-section-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 820px) {
          .sites-category-section-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 560px) {
          .sites-category-section-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
        }
      `}</style>
    </section>
  );
}

export default memo(SitesCategorySection);
