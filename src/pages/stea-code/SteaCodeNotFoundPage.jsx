import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Home } from "lucide-react";
import { getSteaCodePublicUrl } from "../../utils/subdomains.js";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./SteaCodeNotFoundPage.css";

export default function SteaCodeNotFoundPage() {
  const navigate = useNavigate();
  const homeUrl = getSteaCodePublicUrl();

  const FRAGMENTS = useMemo(() => {
    // Simple deterministic PRNG so fragments scatter randomly but stay stable across renders
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 36 }, (_, i) => {
      const x = rand() * 100;
      const y = rand() * 100;
      // Push fragments away from the center where the 404 lives
      const cx = Math.abs(x - 50);
      const cy = Math.abs(y - 50);
      const centerDist = Math.sqrt(cx * cx + cy * cy);
      // Skip fragments too close to the center stage (they'd overlap the 404)
      if (centerDist < 18 && rand() > 0.3) {
        // Move it further out along its current angle
        const angle = Math.atan2(y - 50, x - 50);
        return {
          id: i,
          x: 50 + Math.cos(angle) * (20 + rand() * 25),
          y: 50 + Math.sin(angle) * (20 + rand() * 25),
          size: 8 + rand() * 22,
          rotation: rand() * 360,
          opacity: 0.12 + rand() * 0.25,
          duration: 4 + rand() * 6,
          delay: rand() * 4,
          shape: i % 3,
        };
      }
      return {
        id: i,
        x,
        y,
        size: 8 + rand() * 22,
        rotation: rand() * 360,
        opacity: 0.12 + rand() * 0.25,
        duration: 4 + rand() * 6,
        delay: rand() * 4,
        shape: i % 3,
      };
    });
  }, []);

  return (
    <div className="sc-404-page stea-code-app sc-v2 sc-market-home sc-v2-home">
      <SEO
        title="404 — Page Not Found | STEA Code"
        description="We couldn't find the page or component you were looking for on STEA Code."
      />

      {/* Top Header */}
      <header className="sc-topbar" role="banner">
        <Link
          className="sc-topbar-logo"
          to={homeUrl}
          aria-label="STEA Code home"
        >
          <img
            src="/stea-apps/stea-code.png"
            alt="STEA Code"
            className="sc-topbar-logo-img"
            width={36}
            height={36}
          />
          <span>STEA Code</span>
        </Link>

        <nav className="sc-topbar-nav" aria-label="Marketplace navigation">
          <Link to={homeUrl}>Explore</Link>
          <Link to={`${homeUrl}?category=Components`}>Components</Link>
          <a href="/tools">Tools</a>
          <a href="/library">Library</a>
          <Link to={`${homeUrl}?pricing=Free`}>Free</Link>
          <Link to={`${homeUrl}?pricing=Premium`}>Premium</Link>
        </nav>

        <div className="sc-topbar-actions">
          <button
            type="button"
            className="sc-topbar-icon-btn"
            aria-label="Back to Home"
            onClick={() => navigate(homeUrl)}
            title="Go to Home"
          >
            <Home size={17} />
          </button>
        </div>
      </header>

      {/* 404 Hero Stage */}
      <main className="sc-404-hero">
        {/* Ambient radial purple glow */}
        <div className="sc-404-ambient-glow" aria-hidden="true" />

        {/* Shattered glass polygon fragments */}
        <div className="sc-404-fragments-field" aria-hidden="true">
          {FRAGMENTS.map((frag) => (
            <svg
              key={frag.id}
              className="sc-404-fragment"
              viewBox="0 0 100 100"
              style={{
                left: `${frag.x}%`,
                top: `${frag.y}%`,
                width: `${frag.size}px`,
                height: `${frag.size}px`,
                opacity: frag.opacity,
                "--frag-rot": `${frag.rotation}deg`,
                animationDuration: `${frag.duration}s`,
                animationDelay: `${frag.delay}s`,
              }}
            >
              <defs>
                <linearGradient id={`frag-grad-${frag.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#581c87" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <polygon
                points={
                  frag.shape === 0
                    ? "50,5 95,95 5,95"
                    : frag.shape === 1
                    ? "20,5 95,25 75,95 5,75"
                    : "50,5 95,28 95,72 50,95 5,72 5,28"
                }
                fill={`url(#frag-grad-${frag.id})`}
                stroke="rgba(192, 132, 252, 0.45)"
                strokeWidth="2.5"
              />
            </svg>
          ))}
        </div>

        {/* Foreground Content */}
        <div className="sc-404-content">
          <div className="sc-404-number-wrap">
            <span className="sc-404-number">404</span>
          </div>

          <h1 className="sc-404-subheading">This page doesn't exist</h1>
          <p className="sc-404-desc">
            The component or link you are looking for has been moved, renamed, or does not exist.
          </p>

          <div className="sc-404-cta-wrap">
            <button
              type="button"
              className="sc-404-cta-btn"
              onClick={() => navigate(homeUrl)}
            >
              <span>Browse Components</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sc-footer">
        <div className="sc-footer-grid">
          {/* BRAND COLUMN */}
          <div className="sc-footer-brand">
            <Link to={homeUrl} className="sc-footer-brand-logo">
              <img src="/stea-apps/stea-code.png" alt="STEA Code" width={28} height={28} />
              STEA Code
            </Link>
            <p className="sc-footer-tagline">
              The home of premium code components for modern developers.
            </p>
            <div className="sc-footer-social" aria-label="Social links">
              <a href="https://www.instagram.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://t.me/steacode" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://x.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@steacode" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* EXPLORE COLUMN */}
          <div className="sc-footer-column">
            <h4>Explore</h4>
            <Link to={homeUrl}>All Components</Link>
            <Link to={`${homeUrl}?category=Buttons`}>Buttons</Link>
            <Link to={`${homeUrl}?category=Cards`}>Cards</Link>
            <Link to={`${homeUrl}?category=Forms`}>Forms</Link>
            <Link to={`${homeUrl}?category=Loaders`}>Loaders</Link>
            <Link to={`${homeUrl}?category=Navigation`}>Navigation</Link>
          </div>

          {/* RESOURCES COLUMN */}
          <div className="sc-footer-column">
            <h4>Resources</h4>
            <a href="/tools">Developer Tools</a>
            <a href="/#hosting-deployment">Hosting &amp; Deployment</a>
            <a href="/#guides">Developer Guides</a>
            <a href="/#inspiration">Website Inspiration</a>
            <a href="/#monetize">Monetize &amp; Grow</a>
          </div>

          {/* COMPANY COLUMN */}
          <div className="sc-footer-column">
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/changelog">Changelog</a>
            <a href="/contact">Contact</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/refund">Refund Policy</a>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="sc-footer-bottom">
          <span>&copy; 2026 STEA Code. All rights reserved.</span>
          <span className="sc-footer-bottom-right">Made for developers &hearts;</span>
        </div>

        {/* GIANT FADED WORDMARK */}
        <div className="sc-footer-wordmark" aria-hidden="true">
          <svg
            className="sc-footer-wordmark-svg"
            viewBox="0 0 900 200"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="STEA CODE"
          >
            <text
              x="450"
              y="155"
              textAnchor="middle"
              fontFamily="'Instrument Serif', Georgia, serif"
              fontWeight="700"
              fontSize="200"
              fill="currentColor"
              letterSpacing="-6"
            >
              STEA CODE
            </text>
          </svg>
        </div>
      </footer>
    </div>
  );
}
