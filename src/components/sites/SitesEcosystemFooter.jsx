/**
 * SitesEcosystemFooter — STEA Africa Ecosystem & Branded Footer
 *
 * Refined to match the STEA VPN footer identity:
 *  - Compact, premium, elegant dark styling
 *  - Removed STEA Classroom & STEA self-reference
 *  - Uses official transparent STEA Africa logo (/stea-www-globe.png)
 *  - Desktop: clean 4-column compact ecosystem pill cards
 *  - Mobile (320px - 430px): strict 2x2 grid, tight padding, no vertical giant cards
 */
import { memo } from "react";
import { ArrowUpRight, ShieldCheck, Download } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { usePWA } from "../../contexts/PWAContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";

function FooterInstallLink() {
  const { isInstalled, installApp, deferredPrompt } = usePWA();

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

  if (isInstalled || isStandalone) {
    return <span>Installed as App ✓</span>;
  }

  const handleClick = (e) => {
    e.preventDefault();
    if (!deferredPrompt && !window.__steaDeferredPrompt) {
      alert("To install STEA:\n1. On Safari: Tap Share -> Add to Home Screen\n2. On Chrome: Tap Menu (3 dots) -> Install app");
      return;
    }
    installApp().catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        color: TOKENS.goldHi,
        font: "inherit",
        fontSize: "inherit",
        fontWeight: 650,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Download size={12} strokeWidth={2.2} />
      <span>Install STEA</span>
    </button>
  );
}

const ECOSYSTEM_APPS = [
  {
    id: "stea-code",
    name: "STEA Code",
    tagline: "Dev Studio",
    icon: "/stea-apps/stea-code.png",
    url: "https://stea.africa/code",
    badge: "Studio",
  },
  {
    id: "stea-360",
    name: "STEA 360",
    tagline: "Business & Tax",
    icon: "/stea-apps/stea360.png",
    url: "https://stea360.com",
    badge: "Enterprise",
  },
  {
    id: "stea-vpn",
    name: "STEA VPN",
    tagline: "Secure Private Internet",
    icon: "/stea-apps/stea-vpn.png",
    url: "https://vpn.stea.africa",
    badge: "Secure",
  },
  {
    id: "isaya-masika",
    name: "Isaya Masika",
    tagline: "Portfolio",
    icon: "/isaya-masika-portrait.webp",
    fallbackIcon: "IM",
    url: "https://isayamasika.stea.africa",
    badge: "Creator",
  },
];

function SitesEcosystemFooter() {
  const { user } = useAuth();
  return (
    <div className="sites-ecosystem-footer-wrap">
      {/* ================= STEA ECOSYSTEM ================= */}
      <section className="sites-eco-section" aria-label="STEA Ecosystem">
        <div className="sites-eco-head">
          <h3 className="sites-eco-title">
            STEA Ecosystem
          </h3>
          <p className="sites-eco-desc">
            Digital products designed, built and operated by STEA.
          </p>
        </div>

        <div className="sites-eco-grid" role="list">
          {ECOSYSTEM_APPS.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sites-eco-card"
              role="listitem"
            >
              <div className="sites-eco-card-left">
                {app.fallbackIcon ? (
                  <div style={{ position: "relative", width: 30, height: 30 }}>
                    <div className="sites-eco-app-icon sites-eco-fallback-icon" style={{ position: "absolute", inset: 0, background: "rgba(245,166,35,0.15)", color: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold", borderRadius: "7px" }}>
                      {app.fallbackIcon}
                    </div>
                    <img
                      src={app.icon}
                      alt={app.name}
                      className="sites-eco-app-icon"
                      width="32"
                      height="32"
                      loading="lazy"
                      style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.2s" }}
                      onLoad={(e) => { e.target.style.opacity = 1; }}
                    />
                  </div>
                ) : (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="sites-eco-app-icon"
                    width="32"
                    height="32"
                    loading="lazy"
                  />
                )}
                <div className="sites-eco-app-text">
                  <div className="sites-eco-app-name-row">
                    <strong className="sites-eco-app-name">{app.name}</strong>
                  </div>
                  <span className="sites-eco-app-tagline">{app.tagline}</span>
                </div>
              </div>
              <ArrowUpRight size={13} className="sites-eco-app-arrow" aria-hidden />
            </a>
          ))}
        </div>
      </section>

      {/* ================= BRAND FOOTER ================= */}
      <footer className="sites-footer-block" role="contentinfo">
        <div className="sites-footer-inner">
          <div className="sites-footer-brand-col">
            <a href="https://stea.africa" className="sites-footer-brand-link">
              <img
                src="/stea-www-globe.png"
                alt="STEA logo"
                className="sites-footer-logo"
                width="26"
                height="26"
              />
              <span className="sites-footer-brand-text">
                STEA<span className="sites-footer-brand-accent">Sites</span>
              </span>
            </a>
            <p className="sites-footer-brand-tagline">
              Curated digital directory for builders, learners, and creators across Africa.
            </p>
            <div className="sites-footer-trust-badge">
              <ShieldCheck size={12} />
              <span>Verified Directory · Fast & Safe</span>
            </div>
          </div>

          <div className="sites-footer-links-grid">
            <div className="sites-footer-nav-col">
              <h4 className="sites-footer-col-title">Ecosystem</h4>
              <ul className="sites-footer-link-list">
                <li><a href="https://stea.africa/code" target="_blank" rel="noopener noreferrer">STEA Code</a></li>
                <li><a href="https://vpn.stea.africa" target="_blank" rel="noopener noreferrer">STEA VPN</a></li>
                <li><a href="https://stea360.com" target="_blank" rel="noopener noreferrer">STEA 360</a></li>
                <li><a href="https://isayamasika.stea.africa" target="_blank" rel="noopener noreferrer">Isaya Masika</a></li>
                <li><a href="https://stea.africa/daily" target="_blank" rel="noopener noreferrer">STEA Daily</a></li>
              </ul>
            </div>

            <div className="sites-footer-nav-col">
              <h4 className="sites-footer-col-title">STEA</h4>
              <ul className="sites-footer-link-list">
                <li><a href="/websites/developers">Developers Hub</a></li>
                <li><a href="/websites/ai">AI Tools</a></li>
                <li><a href="/websites/live-sports">Live Sports</a></li>
                <li><a href="/websites/movies-tv-shows">Movies & TV</a></li>
                <li><a href="/websites/ebooks">eBooks</a></li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      const activeUser = user || (typeof window !== "undefined" && window._steaAuthUser);
                      if (!activeUser) {
                        window.dispatchEvent(new CustomEvent("open-auth"));
                      } else {
                        window.dispatchEvent(new CustomEvent("open-suggest-site"));
                      }
                    }}
                    title={!user ? "Sign in as member to suggest websites" : "Suggest a Website or App"}
                    aria-label={!user ? "Sign in as member to suggest websites" : "Suggest a Website or App"}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      color: TOKENS.goldHi,
                      font: "inherit",
                      fontSize: "inherit",
                      fontWeight: 650,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    ✨ Suggest a Site
                  </button>
                </li>
                <li><FooterInstallLink /></li>
              </ul>
            </div>

            <div className="sites-footer-nav-col">
              <h4 className="sites-footer-col-title">Company</h4>
              <ul className="sites-footer-link-list">
                <li><a href="https://stea.africa/about" target="_blank" rel="noopener noreferrer">About STEA</a></li>
                <li><a href="https://stea.africa/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><a href="https://stea.africa/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a></li>
                <li><a href="https://stea.africa/contact" target="_blank" rel="noopener noreferrer">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Built With Tech Stack & Hand-Crafted Credibility Bar */}
        <div className="sites-footer-builtwith-bar">
          <div className="sites-builtwith-left">
            <span className="sites-builtwith-label">BUILT WITH</span>
            <div className="sites-builtwith-tags">
              <span className="sites-builtwith-tag">
                <span className="sites-builtwith-dot" /> Firebase Auth &amp; Firestore
              </span>
              <span className="sites-builtwith-tag">
                <span className="sites-builtwith-dot" /> Vanilla JS (ES Modules)
              </span>
              <span className="sites-builtwith-tag">
                <span className="sites-builtwith-tag-icon" /> Lucide Vector Icons
              </span>
            </div>
          </div>
          <div className="sites-builtwith-badge">
            <span className="sites-craft-badge-icon">⚡</span>
            <span>Hand coded, no AI builders, no website generators</span>
          </div>
        </div>

        <div className="sites-footer-bottom-bar">
          <span className="sites-footer-copyright">
            © {new Date().getFullYear()} STEA Africa. All rights reserved.
          </span>
          <div className="sites-footer-bottom-pills">
            <span className="sites-footer-status-pill">
              <span className="sites-footer-status-dot" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        .sites-ecosystem-footer-wrap {
          margin-top: 32px;
          border-top: 1px solid ${TOKENS.border};
          padding-top: 24px;
        }

        /* Ecosystem section */
        .sites-eco-section {
          width: 100%;
          margin-bottom: 28px;
        }
        .sites-eco-head {
          text-align: center;
          max-width: 480px;
          margin: 0 auto 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .sites-eco-title {
          margin: 0;
          font-family: "Bricolage Grotesque, Instrument Sans, system-ui, sans-serif";
          font-size: clamp(16px, 2.2vw, 20px);
          font-weight: 850;
          letter-spacing: -0.01em;
          color: ${TOKENS.text};
        }
        .sites-eco-desc {
          margin: 0;
          font-size: 11.5px;
          color: ${TOKENS.text2};
          line-height: 1.4;
        }

        /* Desktop: 4 compact horizontal items */
        .sites-eco-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .sites-eco-card {
          position: relative;
          padding: 10px 12px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
        }
        .sites-eco-card:hover {
          transform: translateY(-1px);
          background: ${TOKENS.panel2};
          border-color: color-mix(in srgb, ${TOKENS.gold} 32%, ${TOKENS.border});
          box-shadow: 0 6px 18px rgba(0,0,0,0.22);
        }
        .sites-eco-card-left {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .sites-eco-app-icon {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: transparent;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sites-eco-app-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 1px;
        }
        .sites-eco-app-name-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sites-eco-app-name {
          font-size: 13px;
          font-weight: 800;
          color: ${TOKENS.text};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-eco-app-tagline {
          font-size: 10.5px;
          font-weight: 600;
          color: ${TOKENS.text2};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-eco-app-arrow {
          color: ${TOKENS.text3};
          flex-shrink: 0;
          transition: color 140ms ease, transform 140ms ease;
        }
        .sites-eco-card:hover .sites-eco-app-arrow {
          color: ${TOKENS.gold};
          transform: translate(1px, -1px);
        }

        /* Mobile: strict 2x2 compact grid */
        @media (max-width: 768px) {
          .sites-eco-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .sites-eco-card {
            padding: 8px 10px;
            border-radius: 9px;
          }
          .sites-eco-app-icon {
            width: 26px;
            height: 26px;
            border-radius: 6px;
          }
          .sites-eco-app-name {
            font-size: 12px;
          }
          .sites-eco-app-tagline {
            font-size: 9.5px;
          }
          .sites-eco-app-arrow {
            display: none;
          }
        }

        /* Footer block */
        .sites-footer-block {
          border-top: 1px solid ${TOKENS.border};
          padding-top: 22px;
        }
        .sites-footer-inner {
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .sites-footer-inner {
            grid-template-columns: 1fr;
            gap: 18px;
          }
        }
        .sites-footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sites-footer-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          color: ${TOKENS.text};
        }
        .sites-footer-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
          background: transparent;
        }
        .sites-footer-brand-text {
          font-size: 14px;
          font-weight: 850;
          letter-spacing: -0.01em;
        }
        .sites-footer-brand-accent {
          color: ${TOKENS.gold};
        }
        .sites-footer-brand-tagline {
          margin: 0;
          font-size: 11px;
          color: ${TOKENS.text2};
          line-height: 1.45;
          max-width: 280px;
        }
        .sites-footer-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 650;
          color: ${TOKENS.text3};
          margin-top: 2px;
        }
        .sites-footer-trust-badge svg {
          color: ${TOKENS.gold};
        }

        .sites-footer-links-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 480px) {
          .sites-footer-links-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        }
        .sites-footer-col-title {
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: ${TOKENS.text};
        }
        .sites-footer-link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .sites-footer-link-list a {
          font-size: 11.5px;
          color: ${TOKENS.text2};
          text-decoration: none;
          transition: color 140ms ease;
        }
        .sites-footer-link-list a:hover {
          color: ${TOKENS.gold};
        }

        .sites-footer-builtwith-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px 0;
          margin-top: 20px;
          margin-bottom: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .sites-builtwith-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sites-builtwith-label {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.45);
        }
        .sites-builtwith-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sites-builtwith-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          font-weight: 600;
          color: rgba(240, 243, 248, 0.85);
        }
        .sites-builtwith-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--stea-gold-hi);
        }
        .sites-builtwith-tag-icon {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #38bdf8;
        }
        .sites-builtwith-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.08);
          border: 1px dashed rgba(245, 166, 35, 0.35);
          color: var(--stea-gold-hi);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.01em;
        }
        .sites-craft-badge-icon {
          font-size: 12px;
        }

        .sites-footer-bottom-bar {
          border-top: 1px solid ${TOKENS.border};
          padding-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sites-footer-copyright {
          font-size: 11px;
          color: ${TOKENS.text3};
        }
        .sites-footer-bottom-pills {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .sites-footer-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 650;
          color: ${TOKENS.text3};
        }
        .sites-footer-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: ${TOKENS.success};
          box-shadow: 0 0 6px ${TOKENS.success};
        }
      `}</style>
    </div>
  );
}

export default memo(SitesEcosystemFooter);
