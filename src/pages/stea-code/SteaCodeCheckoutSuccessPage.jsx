import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Home } from "lucide-react";
import { getSteaCodePublicUrl } from "../../utils/subdomains.js";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./SteaCodeCheckoutSuccessPage.css";

export default function SteaCodeCheckoutSuccessPage() {
  const navigate = useNavigate();
  const homeUrl = getSteaCodePublicUrl();

  return (
    <div className="sc-checkout-success-page stea-code-app sc-v2 sc-market-home sc-v2-home">
      <SEO
        title="Payment received — steacode"
        description="Your steacode Pro lifetime access is now active."
      />

      {/* Top Header */}
      <header className="sc-topbar" role="banner">
        <Link
          className="sc-topbar-logo"
          to={homeUrl}
          aria-label="steacode home"
        >
          <img
            src="/stea-apps/stea-code.png"
            alt="steacode"
            className="sc-topbar-logo-img"
            width={36}
            height={36}
          />
          <span>steacode</span>
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

      {/* Success Hero Stage */}
      <main className="sc-success-hero">
        {/* Ambient green glow */}
        <div className="sc-success-ambient-glow" aria-hidden="true" />

        {/* Foreground Content */}
        <div className="sc-success-content">
          <div className="sc-success-icon-wrap">
            <div className="sc-success-icon-ring" aria-hidden="true" />
            <Check size={36} strokeWidth={3} className="sc-success-icon-check" aria-hidden="true" />
          </div>

          <h1 className="sc-success-heading">Payment received</h1>
          <p className="sc-success-subheading">
            Your steacode Pro lifetime access is now active.
          </p>
          <p className="sc-success-desc">
            You can now access every component on steacode. Head back to the catalogue to start browsing.
          </p>

          <div className="sc-success-cta-wrap">
            <button
              type="button"
              className="sc-success-cta-btn"
              onClick={() => navigate(homeUrl)}
            >
              <span>Browse Components</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="sc-success-receipt">
            A receipt has been sent to your email.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="sc-footer">
        <div className="sc-footer-grid">
          {/* BRAND COLUMN */}
          <div className="sc-footer-brand">
            <Link to={homeUrl} className="sc-footer-brand-logo">
              <img src="/stea-apps/stea-code.png" alt="steacode" width={28} height={28} />
              steacode
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
          <span>&copy; 2026 steacode. All rights reserved.</span>
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
