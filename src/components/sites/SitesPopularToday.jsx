/**
 * SitesPopularToday — P7 (STEA Sites Premium V2)
 *
 * Compact dark Popular Today section.
 * Rules:
 *  - FaviconTile, rank, website name, domain, favorite icon, open ↗ per item
 *  - No uploaded thumbnails / screenshots / poster art EVER
 *  - Count only if real aggregated openCount exists on document — NEVER fabricate numbers.
 *  - If data unavailable (empty/error) → return null silently (no blank skeleton).
 *  - Desktop: 6-8 card visible row/grid depending on width.
 *  - Mobile: horizontal swipe rail (flex nowrap, overflow-x auto).
 *
 * @param {object} props
 * @param {Array<{id:string,name:string,url:string,faviconUrl?:string,openCount?:number,domain?:string}>} props.websites
 * @param {(site:any)=>void} [props.onOpenWebsite]  — open website in detail (then pushRecent)
 * @param {(site:any)=>void} [props.onToggleFavorite]
 * @param {string[]} [props.favoriteIds]
 */
import { memo } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import FaviconTile from "./FaviconTile.jsx";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage } from "../../i18n/index.js";
import { useResourceActions } from "../../hooks/useResourceActions.js";
import { extractHostname } from "./favicon.js";

function SitesPopularToday({ websites, onOpenWebsite, onToggleFavorite, favoriteIds }) {
  const { t } = useSitesLanguage();
  const { openResourceDetail, openExternalWebsite } = useResourceActions();
  const list = Array.isArray(websites) ? websites.filter(Boolean).slice(0, 10) : [];

  // No data → hide section completely. No blank skeleton. No section-placeholder chrome.
  if (list.length === 0) return null;

  const favSet = new Set((favoriteIds || []).map((x) => String(x)));

  return (
    <section className="sites-popular-today-section" aria-label={t("popular.title", "Popular Today")}>
      <div className="sites-popular-head">
        <h2 className="sites-popular-title">{t("popular.title", "Popular Today")}</h2>
        <span className="sites-popular-hint" aria-hidden>{t("popular.hint", "Opened by the community")}</span>
      </div>

      <ol className="sites-popular-list" role="list">
        {list.map((site, idx) => {
          const rank = idx + 1;
          const domain = site.domain || extractHostname(site.url || "") || "";
          const id = String(site.id || site.slug || site.url);
          const isFav = favSet.has(id);
          const openCount = Number.isFinite(site.openCount) && site.openCount > 0 ? site.openCount : null;

          return (
            <li key={id} className="sites-popular-item-wrap" role="listitem">
              <article className={`sites-popular-card ${isFav ? "is-fav" : ""}`} onClick={() => openResourceDetail(site)}>
                <span className="sites-popular-rank" aria-hidden>{rank}</span>

                <FaviconTile url={site.url} faviconUrl={site.faviconUrl} name={site.name} size={32} />

                <div className="sites-popular-meta">
                  <span className="sites-popular-name" title={site.name || domain}>{site.name || domain}</span>
                  {domain && <span className="sites-popular-domain">{domain}</span>}
                </div>

                {openCount !== null && (
                  <span className="sites-popular-count" title={`${openCount} opens`}>
                    {openCount >= 1000 ? `${(openCount / 1000).toFixed(openCount >= 10000 ? 0 : 1)}k` : String(openCount)}
                  </span>
                )}

                <div className="sites-popular-actions">
                  <button
                    type="button"
                    aria-label={isFav ? t("buttons.unfavorite", "Remove from Favorites") : t("buttons.saveToFavorites", "Save to Favorites")}
                    className={`sites-popular-action sites-popular-fav ${isFav ? "is-active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(site, false); }}
                  >
                    <Heart size={14} fill={isFav ? TOKENS.gold : "none"} />
                  </button>
                  <button
                    type="button"
                    className="sites-popular-action sites-popular-open"
                    onClick={() => onOpenWebsite && onOpenWebsite(site)}
                    aria-label={t("buttons.openWebsite", "Open Website")}
                    title={t("buttons.openWebsite", "Open Website")}
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <style>{`
        .sites-popular-today-section { padding: 10px 0 4px; }
        .sites-popular-head {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 12px; gap: 10px;
        }
        .sites-popular-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: ${TOKENS.text};
        }
        .sites-popular-hint {
          font-size: 11.5px; color: ${TOKENS.text3}; font-weight: 600;
          letter-spacing: 0.02em; white-space: nowrap;
        }
        .sites-popular-list {
          list-style: none; margin: 0; padding: 0;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 1280px) { .sites-popular-list { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
        @media (max-width: 1080px) { .sites-popular-list { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 768px)  {
          .sites-popular-list {
            display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;
            gap: 10px; padding: 2px 2px 8px;
          }
          .sites-popular-list::-webkit-scrollbar { display: none; }
          .sites-popular-item-wrap { flex: 0 0 auto; min-width: 210px; }
        }
        @media (max-width: 520px)  { .sites-popular-item-wrap { min-width: 190px; } }

        .sites-popular-card {
          position: relative;
          display: grid;
          grid-template-columns: 22px 32px 1fr auto auto;
          align-items: center;
          column-gap: 10px;
          padding: 10px 12px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: ${TOKENS.radius}px;
          min-height: 52px;
          max-height: 72px;
          color: ${TOKENS.text};
          cursor: pointer;
          transition: border-color 160ms ease, transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
        }
        .sites-popular-card:hover {
          border-color: color-mix(in srgb, ${TOKENS.gold} 40%, ${TOKENS.border});
          background: ${TOKENS.panel2};
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }
        .sites-popular-rank {
          justify-self: start;
          font-size: 12.5px;
          font-weight: 900;
          color: ${TOKENS.text3};
          letter-spacing: 0.02em;
          width: 22px; text-align: left;
        }
        .sites-popular-card:hover .sites-popular-rank { color: ${TOKENS.gold}; }
        .sites-popular-meta {
          min-width: 0; display: flex; flex-direction: column; gap: 2px;
        }
        .sites-popular-name {
          font-size: 13.5px; font-weight: 700; color: ${TOKENS.text};
          line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sites-popular-domain {
          font-size: 11.5px; color: ${TOKENS.text3}; line-height: 1.1;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sites-popular-count {
          padding: 3px 8px; border-radius: 999px;
          background: ${TOKENS.panel2};
          border: 1px solid ${TOKENS.border};
          font-size: 10.5px; font-weight: 800; color: ${TOKENS.text2};
          letter-spacing: 0.02em;
        }
        .sites-popular-actions {
          display: inline-flex; align-items: center; gap: 4px;
        }
        .sites-popular-action {
          appearance: none;
          width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
          border-radius: 999px; background: transparent; border: 1px solid transparent;
          color: ${TOKENS.text3}; cursor: pointer;
          transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
        }
        .sites-popular-action:hover {
          color: ${TOKENS.goldHi}; background: ${TOKENS.goldSoft};
          border-color: color-mix(in srgb, ${TOKENS.gold} 28%, transparent);
        }
        .sites-popular-fav.is-active {
          color: ${TOKENS.gold}; background: ${TOKENS.goldSoft};
          border-color: color-mix(in srgb, ${TOKENS.gold} 38%, transparent);
        }

        @media (prefers-reduced-motion: reduce) {
          .sites-popular-card, .sites-popular-action { transition: none !important; }
        }
      `}</style>
    </section>
  );
}

export default memo(SitesPopularToday);
