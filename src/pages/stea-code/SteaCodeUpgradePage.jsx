import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Shield, Zap, RefreshCcw } from "lucide-react";
import { getSteaCodePublicUrl } from "../../utils/subdomains.js";
import { getFirebaseAuth } from "../../firebase.js";
import { getSteaCodeCatalog } from "../../services/steaCodeCommerce.js";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./SteaCodeUpgradePage.css";

export default function SteaCodeUpgradePage() {
  const navigate = useNavigate();
  const homeUrl = getSteaCodePublicUrl();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  // Live catalog data
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Hero CTA ref for autoplay morph animation
  const heroCtaRef = useRef(null);

  // Autoplay the CTA morph effect every 2.6s.
  // Stops on first user interaction (pointerenter, pointerdown, focus, keydown, touchstart).
  // Respects prefers-reduced-motion.
  useEffect(() => {
    const btn = heroCtaRef.current;
    if (!btn) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    let stopped = false;
    let playTimer = null;
    let gapTimer = null;

    const playMorph = () => {
      if (stopped) return;
      btn.classList.add("is-autoplay");
      playTimer = setTimeout(() => {
        btn.classList.remove("is-autoplay");
        if (!stopped) {
          // Gap between plays: 2600ms total cycle - 900ms play = 1700ms gap
          gapTimer = setTimeout(playMorph, 1700);
        }
      }, 900);
    };

    const stopAutoplay = () => {
      if (stopped) return;
      stopped = true;
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
      btn.classList.remove("is-autoplay");
    };

    // Start after a short delay so the page can settle
    gapTimer = setTimeout(playMorph, 1400);

    const stopEvents = ["pointerenter", "pointerdown", "focus", "keydown", "touchstart"];
    stopEvents.forEach((evt) => {
      btn.addEventListener(evt, stopAutoplay, { once: true, passive: true });
    });

    return () => {
      stopped = true;
      if (playTimer) clearTimeout(playTimer);
      if (gapTimer) clearTimeout(gapTimer);
      stopEvents.forEach((evt) => {
        btn.removeEventListener(evt, stopAutoplay);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getSteaCodeCatalog();
        if (!cancelled) {
          const list = Array.isArray(result?.products) ? result.products : [];
          setProducts(list);
        }
      } catch (err) {
        console.warn("[upgrade] catalog fetch failed:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalCount = Array.isArray(products) ? products.length : 0;

  // Value math — only shown when there are enough products to be meaningful
  const showValueMath = useMemo(() => {
    if (catalogLoading || totalCount < 20) return false;
    const avgPrice = 2; // $2 per component estimate
    const individualTotal = totalCount * avgPrice;
    return individualTotal >= 60;
  }, [catalogLoading, totalCount]);

  const individualTotal = totalCount * 2; // $2 each
  const lifetimePrice = 29; // €29
  const savings = individualTotal - lifetimePrice;

  const handleUpgradeClick = async () => {
    setError("");
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      // Not signed in — save intent, open auth modal.
      // User stays on this page; after sign-in they click again.
      try {
        sessionStorage.setItem("stea_pending_action", JSON.stringify({ type: "upgrade" }));
      } catch {
        /* sessionStorage may be unavailable in private browsing */
      }
      window.dispatchEvent(new Event("open-auth"));
      return;
    }

    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  };

  const features = [
    { label: "All components", detail: `— ${totalCount || "every"} component, instant access` },
    { label: "Future components", detail: "— every new one, free forever" },
    { label: "Full source code", detail: "— HTML, CSS, JavaScript" },
    { label: "AI prompts", detail: "— prompts to rebuild each component" },
    { label: "Commercial license", detail: "— use in client work & SaaS" },
    { label: "Lifetime updates", detail: "— no subscription, no renewal" },
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
        description={`Get every component on steacode — current and future — for one payment of €29. Full source code, AI prompts, commercial license.`}
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
        </nav>

        <div className="sc-topbar-actions">
          <Link to={homeUrl} className="sc-upgrade-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to components
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="sc-upgrade-hero">
        <div className="sc-upgrade-hero-glow" aria-hidden="true" />
        <div className="sc-upgrade-hero-inner">
          <span className="sc-upgrade-eyebrow">Lifetime Access</span>
          <h1 className="sc-upgrade-heading">
            Get everything.<br />
            <em>For one payment.</em>
          </h1>
          <p className="sc-upgrade-subheading">
            Every component on steacode — current and future. Yours forever.
          </p>
          <p className="sc-upgrade-price-line">
            <strong>€29</strong> · one time · never expires
          </p>
          <button
            type="button"
            className="sc-cta-morph"
            onClick={handleUpgradeClick}
            disabled={checkoutLoading}
            ref={heroCtaRef}
          >
            <span className="sc-cta-morph__text">
              {checkoutLoading ? "Preparing checkout…" : "Get lifetime access — €29"}
            </span>
            <span className="sc-cta-morph__icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" focusable="false">
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
              </svg>
            </span>
          </button>
          {error && (
            <p style={{ marginTop: 12, color: "#f87171", fontSize: 14 }}>
              {error}
            </p>
          )}
          <div className="sc-upgrade-trust">
            <span className="sc-upgrade-trust-item">
              <Zap size={13} />
              Instant access
            </span>
            <span className="sc-upgrade-trust-item">
              <Shield size={13} />
              Secure checkout
            </span>
            <span className="sc-upgrade-trust-item">
              <RefreshCcw size={13} />
              14-day refund
            </span>
          </div>
        </div>
      </section>

      {showValueMath && (
        <>
          <hr className="sc-upgrade-divider" />

          {/* Value math */}
          <section className="sc-upgrade-section">
            <span className="sc-upgrade-section-label">The math</span>
            <h2 className="sc-upgrade-section-title">Why lifetime is the deal</h2>
            <div className="sc-upgrade-math">
              <div className="sc-upgrade-math-row">
                <span>Buying individually</span>
                <span className="value">
                  {totalCount} × $2 = ${individualTotal}
                </span>
              </div>
              <div className="sc-upgrade-math-row total">
                <span>Lifetime access</span>
                <span className="value">€{lifetimePrice}</span>
              </div>
              <div className="sc-upgrade-math-row savings">
                <span>You save</span>
                <span className="value">${savings}+</span>
              </div>
              <div className="sc-upgrade-math-cta">
                <button
                  type="button"
                  className="sc-upgrade-cta-btn"
                  onClick={handleUpgradeClick}
                  disabled={checkoutLoading}
                >
                  <span>
                    {checkoutLoading ? "Preparing checkout…" : "Unlock everything"}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <hr className="sc-upgrade-divider" />

      {/* Feature list */}
      <section className="sc-upgrade-section">
        <span className="sc-upgrade-section-label">What you get, forever</span>
        <h2 className="sc-upgrade-section-title">Everything included</h2>
        <div className="sc-upgrade-features">
          {features.map((f) => (
            <div key={f.label} className="sc-upgrade-feature">
              <Check size={18} className="sc-upgrade-feature-icon" strokeWidth={3} />
              <span className="sc-upgrade-feature-text">
                <strong>{f.label}</strong> {f.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      <hr className="sc-upgrade-divider" />

      {/* FAQ */}
      <section className="sc-upgrade-section">
        <span className="sc-upgrade-section-label">FAQ</span>
        <h2 className="sc-upgrade-section-title">Questions, answered</h2>
        <div className="sc-upgrade-faq-list">
          {faqs.map((item) => (
            <div key={item.q} className="sc-upgrade-faq-item">
              <h3 className="sc-upgrade-faq-q">{item.q}</h3>
              <p className="sc-upgrade-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="sc-upgrade-final">
        <h2 className="sc-upgrade-final-title">Ready to build faster?</h2>
        <p className="sc-upgrade-final-sub">
          One payment. {totalCount ? `${totalCount}+ components` : "Every component"}. Lifetime access.
        </p>
        <button
          type="button"
          className="sc-cta-morph"
          onClick={handleUpgradeClick}
          disabled={checkoutLoading}
        >
          <span className="sc-cta-morph__text">
            {checkoutLoading ? "Preparing checkout…" : "Get lifetime access — €29"}
          </span>
          <span className="sc-cta-morph__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" focusable="false">
              <path d="M0 0h24v24H0z" fill="none"></path>
              <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
            </svg>
          </span>
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
            aria-label="steacode"
          >
            <text
              x="450"
              y="150"
              textAnchor="middle"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              fontWeight="800"
              fontSize="140"
              fill="currentColor"
              letterSpacing="-2"
            >
              steacode
            </text>
          </svg>
        </div>
      </footer>
    </div>
  );
}
