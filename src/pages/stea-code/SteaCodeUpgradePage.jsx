import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Home, Shield } from "lucide-react";
import { getSteaCodePublicUrl } from "../../utils/subdomains.js";
import { getFirebaseAuth } from "../../firebase.js";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./SteaCodeUpgradePage.css";

export default function SteaCodeUpgradePage() {
  const navigate = useNavigate();
  const homeUrl = getSteaCodePublicUrl();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinueToPayment = async () => {
    setError("");
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      // Not signed in — save intent, open auth modal.
      // User stays on this page; after sign-in they click the button again.
      try {
        sessionStorage.setItem("stea_pending_action", JSON.stringify({ type: "upgrade" }));
      } catch {
        /* sessionStorage may be unavailable in private browsing */
      }
      window.dispatchEvent(new Event("open-auth"));
      return;
    }

    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/stea-code/checkout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const features = [
    "All 122 components — instant access",
    "Every future component, free forever",
    "Full source code (HTML, CSS, JS)",
    "AI prompts to rebuild each component",
    "Commercial use license",
    "Lifetime updates — no subscription, no renewal",
  ];

  const faqs = [
    {
      q: "Is this really one payment?",
      a: "Yes. €29 once. No subscription, no renewals, no hidden fees.",
    },
    {
      q: "What if I already bought individual components?",
      a: "This unlocks everything — every component on the site, including ones you've already bought.",
    },
    {
      q: "What can I use these for?",
      a: "Personal and commercial projects — client work, SaaS products, internal tools, anything you build.",
    },
    {
      q: "How do I get the code after purchase?",
      a: "Instantly. Log in, open any component, and the source code is unlocked.",
    },
  ];

  return (
    <div className="sc-upgrade-page stea-code-app sc-v2 sc-market-home sc-v2-home">
      <SEO
        title="Lifetime Access — steacode"
        description="Get every component on steacode, current and future, for one price of €29."
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
            aria-label="Back to components"
            onClick={() => navigate(homeUrl)}
            title="Back to components"
          >
            <Home size={17} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="sc-upgrade-hero">
        <div className="sc-upgrade-hero-glow" aria-hidden="true" />
        <div className="sc-upgrade-hero-inner">
          <span className="sc-upgrade-eyebrow">Lifetime Access</span>
          <h1 className="sc-upgrade-heading">Get everything. For life.</h1>
          <p className="sc-upgrade-subheading">
            One payment of €29. Every component on steacode — current and future. Yours forever.
          </p>
          <button
            type="button"
            className="sc-upgrade-cta-btn"
            onClick={handleContinueToPayment}
            disabled={loading}
          >
            <span>{loading ? "Preparing checkout…" : "Continue to payment"}</span>
            <ArrowRight size={18} />
          </button>
          {error && (
            <p style={{ marginTop: 12, color: "#f87171", fontSize: 14 }}>
              {error}
            </p>
          )}
          <p className="sc-upgrade-cta-sub">
            <Shield size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Secure checkout by Stripe. Cancel anytime before paying.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="sc-upgrade-features">
        <h2 className="sc-upgrade-section-title">What you get</h2>
        <div className="sc-upgrade-features-grid">
          {features.map((f) => (
            <div key={f} className="sc-upgrade-feature">
              <Check size={22} className="sc-upgrade-feature-icon" strokeWidth={3} />
              <span className="sc-upgrade-feature-text">{f}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="sc-upgrade-divider" />

      {/* FAQ */}
      <section className="sc-upgrade-faq">
        <h2 className="sc-upgrade-section-title">Frequently asked</h2>
        <div className="sc-upgrade-faq-list">
          {faqs.map((item) => (
            <div key={item.q} className="sc-upgrade-faq-item">
              <h3 className="sc-upgrade-faq-q">{item.q}</h3>
              <p className="sc-upgrade-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="sc-upgrade-divider" />

      {/* Bottom CTA */}
      <section className="sc-upgrade-bottom-cta">
        <p>One payment. Lifetime access. Every component.</p>
        <button
          type="button"
          className="sc-upgrade-cta-btn"
          onClick={handleContinueToPayment}
          disabled={loading}
        >
          <span>{loading ? "Preparing checkout…" : "Continue to payment"}</span>
          <ArrowRight size={18} />
        </button>
      </section>

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
                  <path d="M23.498 6.186a3.016 3.01 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.01 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
