/* ======================================================================
 * SteaCodeShellHeaderV2 — focused, quiet shell header for 7-world views.
 *
 * No giant 8-way nav:
 *   LEFT  : steacode logo + world eyebrow (04 / LEARN)
 *   RIGHT : Back home (← Home), Search (⌘K), Home icon, mobile menu
 *
 * Height 60-64px, translucent, tiny bottom border. No overflow.
 * =================================================================== */

import React, { useMemo, useState } from "react";
import { Search, Home, ArrowLeft, Menu, X } from "lucide-react";
import { V2_WORLDS } from "../../data/stea-code/v2Worlds.js";
import { useSteaCodeI18n } from "./useSteaCodeI18n.js";

export default function SteaCodeShellHeaderV2({ world, onHome, onOpenSearch, reduceMotion }) {
  const { tLocal } = useSteaCodeI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const current = useMemo(() => V2_WORLDS.find((w) => w.id === world), [world]);

  const goHome = (e) => {
    e?.preventDefault?.();
    setMenuOpen(false);
    onHome();
  };

  const doSearch = () => {
    setMenuOpen(false);
    onOpenSearch();
  };

  return (
    <header className="sc-shell-header sc-v2-header" role="banner">
      <div className="sc-shell-header-inner">
        <a
          className="sc-shell-brand sc-v2-brand"
          href="/code"
          onClick={goHome}
          aria-label="steacode home"
        >
          <img src="/stea-apps/stea-code.png" alt="" width="28" height="28" />
          <div className="sc-v2-brand-texts">
            <strong>steacode</strong>
            {current && (
              <span
                className="sc-v2-eyebrow"
                style={{ color: current.accent, borderColor: `${current.accent}33` }}
              >
                {current.eyebrow} · {tLocal(current.title)}
              </span>
            )}
          </div>
        </a>

        <div className="sc-shell-actions">
          <a
            href="/code"
            onClick={goHome}
            className="sc-shell-back"
            aria-label="Back to steacode home"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Home</span>
          </a>

          <button
            type="button"
            className="sc-icon-btn"
            onClick={doSearch}
            aria-label="Search steacode (⌘K)"
            title="Search (⌘K / Ctrl+K)"
          >
            <Search size={16} aria-hidden="true" />
          </button>

          <a
            href="/code"
            onClick={goHome}
            className="sc-icon-btn"
            aria-label="steacode home"
            title="Home"
          >
            <Home size={16} aria-hidden="true" />
          </a>

          <button
            type="button"
            className="sc-icon-btn sc-mobile-only"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="sc-v2-mobile-nav"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="sc-v2-mobile-nav" className="sc-mobile-menu" aria-label="Quick menu">
          <div className="sc-mobile-menu-inner">
            <a className="sc-mobile-link" href="/code" onClick={goHome}>
              ← steacode Home
            </a>
            {V2_WORLDS.map((w) => (
              <a
                key={w.id}
                className="sc-mobile-link"
                href={w.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  window.location.href = w.href;
                }}
                style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: w.accent,
                      display: "inline-block",
                    }}
                  />
                  <strong>{tLocal(w.title)}</strong>
                </span>
                <small style={{ opacity: 0.6 }}>{w.eyebrow}</small>
              </a>
            ))}
            <button
              type="button"
              className="sc-mobile-link"
              onClick={doSearch}
              style={{ textAlign: "left" }}
            >
              ⌘K / Ctrl+K / Search
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
