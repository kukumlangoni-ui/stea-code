import React from "react";
import SEO from "../../../components/SEO.jsx";
import StoreBookGrid from "../../../components/stea-code/store/StoreBookGrid.jsx";
import "./store.css";

/**
 * StoreHomePage — /store
 * The E-book & Notes storefront: warm mustard hero + the 3D book grid.
 */
export default function StoreHomePage() {
  return (
    <div className="store-root">
      <SEO
        title="STEACODE Bookstore — E-books, Notes & Cheat Sheets"
        description="Free developer e-books, study notes and cheat sheets. Read in your browser, download the PDF, keep lifetime access."
      />

      <header className="store-hero">
        {/* Flat-vector decorations */}
        <svg className="store-deco" style={{ top: 36, left: "6%" }} width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="30" fill="none" stroke="#1A1A1A" strokeWidth="5" />
        </svg>
        <svg className="store-deco" style={{ top: 60, right: "8%" }} width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
          <rect x="8" y="8" width="70" height="70" rx="14" fill="#D94226" />
        </svg>
        <svg className="store-deco" style={{ bottom: 24, left: "12%" }} width="96" height="40" viewBox="0 0 96 40" aria-hidden="true">
          <rect x="0" y="14" width="60" height="12" rx="6" fill="#1A1A1A" />
          <rect x="68" y="14" width="28" height="12" rx="6" fill="#F7EFD8" stroke="#1A1A1A" strokeWidth="3" />
        </svg>

        <span className="store-hero__eyebrow">The STEACODE Bookstore</span>
        <h1 className="store-hero__title">
          Learn it once.<br />Keep it <em>forever</em>.
        </h1>
        <p className="store-hero__sub">
          E-books, study notes and cheat sheets for modern developers —
          read them right here, download the PDF, keep lifetime access.
        </p>
      </header>

      <main className="store-section">
        <StoreBookGrid />
      </main>
    </div>
  );
}
