import React from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO.jsx";
import SteaCodeFooter from "../../components/stea-code/SteaCodeFooter.jsx";
import "./stea-code-about.css";

export default function SteaCodeContactPage() {
  return (
    <>
      <SEO
        title="Contact SteaCode — support@steacode.com"
        description="Get in touch with the SteaCode team for sales, licensing, partnerships or support."
        canonical="https://steacode.com/contact"
        type="contactpage"
      />
      <div className="sc-about sc-contact">
        <header className="sc-about-nav">
          <Link to="/" className="sc-about-brand">
            <img src="/stea-code-logo.png" alt="" width={24} height={24} />
            steacode
          </Link>
          <nav className="sc-about-nav-links">
            <Link to="/">Browse</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </header>

        <section className="sc-about-hero sc-contact-hero">
          <span className="sc-about-kicker">Contact</span>
          <h1 className="sc-about-headline">
            Say hello.<br />
            <span className="sc-about-accent">We reply fast.</span>
          </h1>
          <p className="sc-about-sub">
            For support, sales, licensing, partnerships, or anything else — drop
            us a line.
          </p>
        </section>

        <section className="sc-about-section sc-contact-grid">
          <a className="sc-contact-card" href="mailto:support@steacode.com">
            <h3>Support</h3>
            <p>Bug reports, pre‑sales questions, purchase help.</p>
            <span className="sc-contact-email">support@steacode.com</span>
          </a>
          <a className="sc-contact-card" href="mailto:hello@steacode.com">
            <h3>General</h3>
            <p>Partnerships, media, content, everything else.</p>
            <span className="sc-contact-email">hello@steacode.com</span>
          </a>
        </section>

        <SteaCodeFooter />
      </div>
    </>
  );
}
