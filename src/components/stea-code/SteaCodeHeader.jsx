import React, { useState } from "react";
import { Search, Home, ArrowLeft, Menu, X } from "lucide-react";

/**
 * SteaCodeHeader — focused sticky top bar for internal views.
 *
 * Focus-first UX:
 *   LEFT : STEA Code logo + STEA Code (brand)
 *   CENTER: nothing (user is inside a focused category, not discovering)
 *   RIGHT: Search, Home, (mobile Menu — only visible on narrow screens)
 *
 * Optional compact "Back" chip can be shown to make returning to home
 * explicitly one-tap; currently shown on desktop as a small affordance.
 *
 * Height 60-66px, near-black transparent, subtle bottom border, quiet.
 */
export default function SteaCodeHeader({ onNavigate, onOpenSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const goHome = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    onNavigate(null);
  };

  const doSearch = () => {
    setMenuOpen(false);
    onOpenSearch();
  };

  return (
    <header className="sc-shell-header" role="banner">
      <div className="sc-shell-header-inner">
        <a
          className="sc-shell-brand"
          href="/code"
          onClick={goHome}
          aria-label="STEA Code home"
        >
          <img src="/stea-apps/stea-code.png" alt="" width="30" height="30" />
          <strong>STEA Code</strong>
        </a>

        <div className="sc-shell-actions">
          <a
            href="/code"
            onClick={goHome}
            className="sc-shell-back"
            aria-label="Back to STEA Code home"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Home</span>
          </a>

          <button
            type="button"
            className="sc-icon-btn"
            onClick={doSearch}
            aria-label="Search STEA Code (⌘K)"
            title="Search (⌘K)"
          >
            <Search size={16} aria-hidden="true" />
          </button>

          <a
            href="/code"
            onClick={goHome}
            className="sc-icon-btn"
            aria-label="STEA Code home"
            title="Home"
          >
            <Home size={16} aria-hidden="true" />
          </a>

          <button
            type="button"
            className="sc-icon-btn sc-mobile-only"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="sc-mobile-nav"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="sc-mobile-nav"
          className="sc-mobile-menu"
          aria-label="Quick menu"
        >
          <div className="sc-mobile-menu-inner">
            <a
              className="sc-mobile-link"
              href="/code"
              onClick={goHome}
            >
              ← STEA Code Home
            </a>
            <button
              type="button"
              className="sc-mobile-link"
              onClick={doSearch}
              style={{ textAlign: "left" }}
            >
              ⌘K / Search
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
