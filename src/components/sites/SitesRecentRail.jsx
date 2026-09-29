/**
 * SitesRecentRail — P6 (STEA Premium V2)
 *
 * Recently visited websites rail.
 * Rules:
 *  - Entirely local (localStorage or hook). No Firestore read required to populate.
 *  - Favicon-first. No screenshots, no og:image, no thumbnails.
 *  - Single row; horizontal scroll (overflow-x: auto) for overflow.
 *  - If empty → return null; hide the whole section (no giant empty rectangle, no skeleton).
 *  - Tiny Open ↗ glyph, favicon, short name.
 */
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import FaviconTile from "./FaviconTile.jsx";
import { getWebsitePrimaryIcon } from "./websiteIconHelper.js";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage } from "../../i18n/index.js";
import { extractHostname } from "./favicon.js";
import { useResourceActions } from "../../hooks/useResourceActions.js";

export const RECENT_KEY = "stea_sites_recent";
export const RECENT_MAX = 12;

/** Local storage layer — isolated for testability. */
export function readRecentWebsites() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** Append / bump a website to top of recent list. */
export function pushRecentWebsite(website) {
  if (!website || !(website.id || website.url)) return;
  try {
    const current = readRecentWebsites();
    const idKey = String(website.id || website.url || website.slug);
    const filtered = current.filter((w) => String(w.id || w.url || w.slug) !== idKey);
    const next = [
      {
        id: website.id || idKey,
        slug: website.slug || "",
        name: website.name || extractHostname(website.url || "") || "",
        url: website.url || "",
        faviconUrl: website.faviconUrl || website.favicon || "",
        openedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

/**
 * @param {object} props
 * @param {(idOrSlug: string) => void} [props.onOpen]  — detail click
 * @param {(website: object, ev: MouseEvent) => void} [props.onOpenExternal] — open website click
 * @param {(string) => void} [props.onOpenWebsite]    — navigate to website detail
 */
export default function SitesRecentRail({ onOpen, onOpenExternal, onOpenWebsite }) {
  const { t } = useSitesLanguage();
  const { openResourceDetail } = useResourceActions();
  const items = useMemo(() => readRecentWebsites(), []);

  if (!items || items.length === 0) return null;

  const sectionLabel = t("recent.title", "Recently visited");

  return (
    <section className="sites-recent-rail-section" aria-label={sectionLabel}>
      <div className="sites-recent-rail-header">
        <h2 className="sites-recent-rail-title">{sectionLabel}</h2>
        <span className="sites-recent-rail-count" aria-hidden>{items.length}</span>
      </div>

      <div className="sites-recent-rail-track" role="list">
        {items.map((site) => {
          const host = extractHostname(site.url || "");
          const label = site.name || host || t("recent.website", "Website");
          return (
            <button
              key={String(site.id || site.slug || site.url)}
              type="button"
              role="listitem"
              className="sites-recent-card"
              onClick={() => {
                if (onOpenWebsite) onOpenWebsite(site);
                else if (onOpen) onOpen(site.id || site.slug || site);
                else openResourceDetail(site);
              }}
              title={host ? `${label} · ${host}` : label}
            >
              <FaviconTile url={site.url} faviconUrl={getWebsitePrimaryIcon(site) || site.faviconUrl || ""} name={label} size={28} />
              <div className="sites-recent-card-meta">
                <span className="sites-recent-card-name">{label}</span>
                {host && <span className="sites-recent-card-host">{host}</span>}
              </div>
              <ArrowUpRight className="sites-recent-card-chevron" size={14} aria-hidden />
            </button>
          );
        })}
      </div>

      <style>{`
        .sites-recent-rail-section {
          padding: 22px 0 6px;
        }
        .sites-recent-rail-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sites-recent-rail-title {
          margin: 0;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: ${TOKENS.text};
        }
        .sites-recent-rail-count {
          font-size: 12px;
          font-weight: 700;
          color: ${TOKENS.text3};
          min-width: 20px;
          text-align: right;
        }

        .sites-recent-rail-track {
          display: flex;
          flex-wrap: nowrap;
          align-items: stretch;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 2px 8px;
        }
        .sites-recent-rail-track::-webkit-scrollbar { display: none; }

        .sites-recent-card {
          appearance: none;
          flex: 0 0 auto;
          min-width: 180px;
          max-width: 220px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: ${TOKENS.radius}px;
          color: ${TOKENS.text};
          cursor: pointer;
          text-align: left;
          font: inherit;
          transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
        }
        .sites-recent-card:hover {
          border-color: color-mix(in srgb, ${TOKENS.gold} 38%, ${TOKENS.border});
          background: ${TOKENS.panel2};
          transform: translateY(-2px);
        }
        .sites-recent-card-meta {
          display: flex;
          flex: 1;
          min-width: 0;
          flex-direction: column;
          gap: 2px;
        }
        .sites-recent-card-name {
          font-size: 13.5px;
          font-weight: 700;
          color: ${TOKENS.text};
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-recent-card-host {
          font-size: 11.5px;
          color: ${TOKENS.text3};
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-recent-card-chevron {
          color: ${TOKENS.text3};
          flex-shrink: 0;
          transition: color 140ms ease, transform 140ms ease;
        }
        .sites-recent-card:hover .sites-recent-card-chevron {
          color: ${TOKENS.gold};
          transform: translate(1px, -1px);
        }

        @media (max-width: 520px) {
          .sites-recent-card { min-width: 160px; max-width: 190px; }
          .sites-recent-rail-title { font-size: 15px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sites-recent-card,
          .sites-recent-card-chevron { transition: none !important; }
        }
      `}</style>
    </section>
  );
}
