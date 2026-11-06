import React from "react";
import { Link } from "react-router-dom";

/**
 * Global SteaCode footer. Used on the homepage, About, Contact, and any
 * standalone marketing page. Keeps every route's "Trust Signal" consistent.
 *
 * The Company column links here are the canonical entry points — every page
 * that renders this footer will surface them.
 */
export default function SteaCodeFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="sc-footer">
      <div className="sc-footer-grid">
        {/* BRAND COLUMN */}
        <div className="sc-footer-brand">
          <Link to="/" className="sc-footer-brand-logo" aria-label="SteaCode home">
            <img src="/stea-code-logo.png" alt="" width={28} height={28} />
            steacode
          </Link>
          <p className="sc-footer-tagline">
            Premium code components, UI kits, and interactive ebooks for developers who ship.
          </p>
          <div className="sc-footer-social" aria-label="Social links">
            <a href="https://x.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="SteaCode on X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://github.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="SteaCode on GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.07-.73.08-.71.08-.71 1.18.08 1.8 1.21 1.8 1.21 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.74-1.58-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.48.11-3.09 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.61.23 2.79.11 3.09.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" /></svg>
            </a>
            <a href="https://www.linkedin.com/company/steacode" target="_blank" rel="noopener noreferrer" aria-label="SteaCode on LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z" /></svg>
            </a>
            <a href="https://www.youtube.com/@steacode" target="_blank" rel="noopener noreferrer" aria-label="SteaCode on YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          </div>
        </div>

        {/* PRODUCT COLUMN */}
        <div className="sc-footer-column">
          <h4>Product</h4>
          <Link to="/">All Components</Link>
          <Link to="/store">E‑books &amp; Notes</Link>
          <a href="/">Premium UI Kits</a>
          <a href="/">Developer Tools</a>
        </div>

        {/* COMPANY COLUMN */}
        <div className="sc-footer-column">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <a href="mailto:support@steacode.com">support@steacode.com</a>
        </div>

        {/* LEGAL COLUMN */}
        <div className="sc-footer-column">
          <h4>Legal</h4>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/licensing">Licensing</Link>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="sc-footer-bottom">
        <span>© {year} SteaCode. Built by Isaya Masika.</span>
        <span className="sc-footer-bottom-right">Made for developers ♥</span>
      </div>

      {/* GIANT FADED WORDMARK */}
      <div className="sc-footer-wordmark" aria-hidden="true">
        <svg className="sc-footer-wordmark-svg" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid meet">
          <text x="600" y="150" textAnchor="middle" fontFamily="'Instrument Serif', Georgia, serif" fontWeight="700" fontSize="180" fill="currentColor" letterSpacing="8">STEA CODE</text>
        </svg>
      </div>
    </footer>
  );
}
