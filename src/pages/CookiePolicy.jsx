import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, CheckCircle2, Sliders, ExternalLink } from "lucide-react";
import { getSteaCodePublicUrl } from "../utils/subdomains.js";
import SEO from "../components/SEO.jsx";

export default function CookiePolicy() {
  const homeUrl = getSteaCodePublicUrl();

  const handleResetConsent = () => {
    try {
      localStorage.removeItem("stea_cookie_consent_v1");
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#e2e8f0", padding: "48px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <SEO
        title="Cookie Policy | STEA Africa & STEA Code"
        description="Learn about the types of cookies and local storage items used on STEA Africa and STEA Code and how to manage your preferences."
      />

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <Link
          to={homeUrl}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#f5a623", textDecoration: "none", fontSize: "14px", fontWeight: 600, marginBottom: 32 }}
        >
          <ArrowLeft size={16} /> Back to STEA
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245, 166, 35, 0.15)", border: "1px solid rgba(245, 166, 35, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f5a623" }}>
            <Cookie size={20} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", color: "#f5a623", textTransform: "uppercase" }}>
            Transparency &amp; Controls
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
          Cookie Policy
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: 36 }}>
          Last updated: September 28, 2026 · Compliant with EU ePrivacy &amp; GDPR
        </p>

        <section style={{ display: "flex", flexDirection: "column", gap: 28, fontSize: "15px", lineHeight: "1.7", color: "#cbd5e1" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>1. What Are Cookies?</h2>
            <p>
              Cookies and local storage items are small data files stored on your device when you browse websites.
              They allow us to remember your session, keep you signed in, and tailor your developer experience.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>2. Categories of Cookies We Use</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
              {/* Category 1 */}
              <div style={{ padding: "18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ color: "#ffffff", fontSize: "16px" }}>Essential &amp; Strictly Necessary</strong>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80", background: "rgba(34, 197, 94, 0.12)", padding: "2px 8px", borderRadius: "4px" }}>
                    Always Active
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: 0 }}>
                  Essential for logging into your account, maintaining security tokens, managing cart items, and storing your cookie preferences. These cannot be disabled.
                </p>
              </div>

              {/* Category 2 */}
              <div style={{ padding: "18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ color: "#ffffff", fontSize: "16px" }}>Analytics &amp; Performance</strong>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#f5a623", background: "rgba(245, 166, 35, 0.12)", padding: "2px 8px", borderRadius: "4px" }}>
                    Consent Gated
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: 0 }}>
                  Gathers aggregated, anonymized metrics on page load speeds, popular code components, and general navigation flow to improve platform performance.
                </p>
              </div>

              {/* Category 3 */}
              <div style={{ padding: "18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ color: "#ffffff", fontSize: "16px" }}>Advertising &amp; Marketing</strong>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#f5a623", background: "rgba(245, 166, 35, 0.12)", padding: "2px 8px", borderRadius: "4px" }}>
                    Consent Gated
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", color: "#94a3b8", margin: 0 }}>
                  Used by third-party advertising networks (e.g. Google AdSense) to deliver relevant developer tools and promotions.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>3. Managing Your Preferences</h2>
            <p style={{ marginBottom: 16 }}>
              You can change your consent choices at any time. Clicking the button below will clear your stored preference
              and prompt the cookie consent banner on your next page view.
            </p>
            <button
              type="button"
              onClick={handleResetConsent}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                color: "#ffffff",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Sliders size={15} /> Reset Cookie Preferences
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>4. Questions</h2>
            <p>
              If you have any questions regarding our use of cookies, email us at:
              {" "}<a href="mailto:privacy@stea.africa" style={{ color: "#f5a623", textDecoration: "underline" }}>privacy@stea.africa</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
