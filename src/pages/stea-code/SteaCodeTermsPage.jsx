import React from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO.jsx";
import SteaCodeFooter from "../../components/stea-code/SteaCodeFooter.jsx";
import "./stea-code-about.css";

export default function SteaCodeTermsPage() {
  const year = new Date().getFullYear();
  return (
    <>
      <SEO title="SteaCode — Terms of Service" description="SteaCode Terms of Service." canonical="https://steacode.com/terms" type="webpage" />
      <div className="sc-about">
        <header className="sc-about-nav">
          <Link to="/" className="sc-about-brand">
            <img src="/stea-code-logo.png" alt="" width={24} height={24} />steacode
          </Link>
          <nav className="sc-about-nav-links">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </header>
        <section className="sc-about-section sc-about-legal">
          <h1>Terms of Service</h1>
          <p className="sc-about-legal-date">Last updated: Jan 1, {year}</p>
          <p>
            These terms govern access to <a href="https://steacode.com">steacode.com</a> and
            the products delivered through it. By purchasing or using SteaCode content
            you agree to these terms. SteaCode content is delivered under the license
            stated on each product — see <Link to="/licensing">Licensing</Link> for
            the default terms. All content is provided as‑is. Refunds are handled
            on a case‑by‑case basis at <a href="mailto:support@steacode.com">support@steacode.com</a>.
          </p>
        </section>
        <SteaCodeFooter />
      </div>
    </>
  );
}
