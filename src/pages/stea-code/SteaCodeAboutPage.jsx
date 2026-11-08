import React from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/SEO.jsx";
import "./stea-code-about.css";

/**
 * /about — SteaCode's "Trust Page". Every AI crawler and curious human lands
 * here trying to answer "who made this and is it real". This page carries the
 * canonical narrative, the founder name, and a link back to the full JSON-LD
 * graph injected by <SEO />.
 */
export default function SteaCodeAboutPage() {
  return (
    <>
      <SEO
        title="About SteaCode — Built by Isaya Masika"
        description="SteaCode is a premium developer marketplace for UI components, UI kits, and interactive ebooks. Founded by Isaya Masika."
        canonical="https://steacode.com/about"
        type="aboutpage"
      />
      <div className="sc-about">
        {/* HERO */}
        <section className="sc-about-hero">
          <span className="sc-about-kicker">Built for developers</span>
          <h1 className="sc-about-headline">
            Code faster.<br />
            <span className="sc-about-accent">Build better.</span>
          </h1>
          <p className="sc-about-sub">
            SteaCode is the marketplace for premium code. Ship your masterpieces
            faster with production‑ready UI kits, design systems, and interactive
            ebooks written by developers who ship.
          </p>
        </section>

        {/* STORY */}
        <section className="sc-about-section">
          <div className="sc-about-section-inner">
            <h2>Why SteaCode exists</h2>
            <p>
              Every developer has felt the headache — wiring the same auth flow,
              rewriting the same component library, and paying premium tooling
              fees just to move one pixel. SteaCode cures that. We package the
              highest‑quality components, UI kits, and ebooks so you can spend
              your days on the ideas that matter.
            </p>
            <p>
              Whether you're launching a weekend side project or scaling a
              production SaaS, SteaCode gives you the building blocks to ship
              faster — without cutting corners on design or security.
            </p>
          </div>
        </section>

        {/* FOUNDER */}
        <section className="sc-about-founder">
          <div className="sc-about-founder-card">
            <div className="sc-about-founder-avatar" aria-hidden="true">
              IM
            </div>
            <div>
              <h3>Founded by <span className="sc-about-accent">Isaya Masika</span></h3>
              <p className="sc-about-founder-bio">
                A developer passionate about building world‑class UI tools. Isaya
                ships production software, mentors engineers, and believes the
                best products come from frictionless developer experience.
              </p>
              <div className="sc-about-founder-links">
                <a href="https://x.com/isayamasika" target="_blank" rel="noopener noreferrer">X / Twitter</a>
                <a href="https://github.com/isayamasika" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/isayamasika" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>
        </section>

        {/* NUMBERS — optional, reinforces legitimacy */}
        <section className="sc-about-stats">
          <div className="sc-about-stat"><strong>Premium</strong><span>Code &amp; UI kits</span></div>
          <div className="sc-about-stat"><strong>Interactive</strong><span>Ebooks &amp; notes</span></div>
          <div className="sc-about-stat"><strong>Developer‑first</strong><span>By devs, for devs</span></div>
        </section>

        {/* CTA */}
        <section className="sc-about-cta">
          <h2>Start building something great.</h2>
          <div className="sc-about-cta-links">
            <Link to="/" className="sc-about-btn sc-about-btn-primary">Browse components →</Link>
            <Link to="/contact" className="sc-about-btn sc-about-btn-ghost">Get in touch</Link>
          </div>
        </section>
      </div>
    </>
  );
}
