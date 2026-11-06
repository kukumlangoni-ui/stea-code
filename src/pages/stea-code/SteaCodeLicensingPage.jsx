import React from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO.jsx";
import SteaCodeFooter from "../../components/stea-code/SteaCodeFooter.jsx";
import "./stea-code-about.css";

export default function SteaCodeLicensingPage() {
  return (
    <>
      <SEO title="SteaCode — Licensing" description="How you can use SteaCode components, UI kits and ebooks." canonical="https://steacode.com/licensing" type="webpage" />
      <div className="sc-about">
        <header className="sc-about-nav">
          <Link to="/" className="sc-about-brand">
            <img src="/stea-code-logo.png" alt="" width={24} height={24} />steacode
          </Link>
          <nav className="sc-about-nav-links">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </header>
        <section className="sc-about-section sc-about-legal">
          <h1>Licensing</h1>
          <p>
            Every purchase on SteaCode includes a perpetual, non‑exclusive,
            single‑developer license to use the deliverable in personal and
            commercial projects. Redistribution or resale of the deliverable
            as‑is is prohibited. Extended team licenses are available — write
            <a href="mailto:hello@steacode.com">hello@steacode.com</a>.
          </p>
          <h2 className="sc-about-h2">Need custom terms?</h2>
          <p>We ship white‑label, team, and enterprise licenses. Just ask.</p>
        </section>
        <SteaCodeFooter />
      </div>
    </>
  );
}
