import React from "react";
import { ArrowRight, Sparkles, Search } from "lucide-react";
import SteaCodeLiquidHero from "../../components/SteaCodeLiquidHero.jsx";
import { GATEWAYS } from "../../data/stea-code/gateways.js";

/**
 * SteaCodeHome — the `/code` homepage.
 *
 * One-screen gateway on desktop (as practical).
 * Structure: header, liquid hero, label, headline, description,
 * search, hero buttons, 8 gateway cards, curated note.
 *
 * Liquid WebGL background is homepage-only.
 */
export default function SteaCodeHome({ onNavigate, onOpenSearch, query, onQueryChange }) {
  const go = (e, id) => {
    e.preventDefault();
    onNavigate(id);
  };

  return (
    <div className="sc-home dark" id="sc-home">
      <header className="sc-header" role="banner">
        <a className="sc-brand" href="/code" aria-label="STEA Code home">
          <img src="/stea-apps/stea-code.png" alt="" />
          <strong>STEA Code</strong>
        </a>
      </header>

      <main className="sc-home-main" role="main">
        <section className="sc-hero sc-premium-hero" aria-labelledby="sc-hero-title">
          <SteaCodeLiquidHero theme="dark" />
          <div className="sc-hero-overlay" aria-hidden="true" />

          <div className="sc-premium-hero-content">
            <div className="sc-premium-kicker">
              <Sparkles size={14} aria-hidden="true" />
              <span>// BUILT FOR DEVELOPERS</span>
            </div>

            <h1 id="sc-hero-title" className="sc-premium-title">
              <span>Build better.</span>
              <strong>Code faster.</strong>
            </h1>

            <p className="sc-premium-subtitle">
              Practical code, developer tools, resources and inspiration
              <br className="sc-premium-desktop-break" />
              to help you ship better products.
            </p>

            <label className="sc-premium-search" onClick={onOpenSearch} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenSearch(); }}>
              <Search size={19} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={(e) => { e.preventDefault(); onOpenSearch(); }}
                placeholder="Search code, tools, hosting, inspiration..."
                readOnly
              />
              <span className="sc-search-command" aria-hidden="true">⌘ K</span>
            </label>

            <div className="sc-premium-actions">
              <a className="sc-btn sc-btn-primary sc-btn-md sc-action-primary" href="/code?view=code" onClick={(e) => go(e, "code")}>
                Browse Code <ArrowRight size={14} aria-hidden="true" />
              </a>
              <a className="sc-btn sc-btn-secondary sc-btn-md" href="/code?view=essentials" onClick={(e) => go(e, "essentials")}>
                Explore Resources
              </a>
              <a className="sc-btn sc-btn-ghost sc-btn-md" href="/code?view=inspiration" onClick={(e) => go(e, "inspiration")}>
                Website Inspiration
              </a>
              <a className="sc-btn sc-btn-ghost sc-btn-md" href="/code?view=hosting" onClick={(e) => go(e, "hosting")}>
                Hosting Guide
              </a>
            </div>

            <div className="sc-home-resource-grid" role="navigation" aria-label="STEA Code destinations">
              {GATEWAYS.map((g) => {
                const Icon = g.icon;
                return (
                  <a
                    className="sc-home-resource-card"
                    key={g.id}
                    href={g.href}
                    onClick={(e) => go(e, g.id)}
                  >
                    <span className="sc-home-resource-icon" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                    <span className="sc-home-resource-copy">
                      <strong>{g.title}</strong>
                      <span>{g.description}</span>
                    </span>
                    <span className="sc-home-resource-arrow" aria-hidden="true">
                      <ArrowRight size={14} />
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="sc-home-note">
              <span className="sc-home-note-dot" aria-hidden="true" />
              Curated resources from the STEA team and community. Firestore data always wins over built-in examples.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
