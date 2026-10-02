import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Globe } from "lucide-react";
import { getSteaCodePublicUrl } from "../utils/subdomains.js";
import SEO from "../components/SEO.jsx";

export default function PrivacyPolicy() {
  const homeUrl = getSteaCodePublicUrl();

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#e2e8f0", padding: "48px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <SEO
        title="Privacy Policy | STEA Africa & steacode"
        description="Learn how STEA Africa and steacode collect, handle, and protect your personal data in accordance with GDPR, UK GDPR, and CCPA."
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
            <Shield size={20} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", color: "#f5a623", textTransform: "uppercase" }}>
            Legal &amp; Compliance
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: 36 }}>
          Last updated: September 28, 2026 · Effective immediately
        </p>

        <section style={{ display: "flex", flexDirection: "column", gap: 28, fontSize: "15px", lineHeight: "1.7", color: "#cbd5e1" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>1. Introduction</h2>
            <p>
              STEA Africa ("STEA", "we", "us", or "our") is dedicated to protecting your privacy and personal data.
              This Privacy Policy explains how we collect, process, and safeguard information when you use STEA Africa
              (stea.africa), steacode (code.stea.africa), and related digital services.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>2. Information We Collect</h2>
            <p>We only collect information necessary to provide and secure our services:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Account Credentials:</strong> Email, username, and authentication tokens via Firebase Authentication.</li>
              <li><strong>Purchases &amp; Transactions:</strong> Stripe transaction IDs and product purchase records (no payment card numbers are stored on our servers).</li>
              <li><strong>Device &amp; Usage Data:</strong> IP addresses, browser user agent, and anonymized access logs for performance monitoring and fraud prevention.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>3. Lawful Basis for Processing (GDPR)</h2>
            <p>Under the General Data Protection Regulation (GDPR), we process your data under the following legal bases:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Contractual Necessity:</strong> To deliver code components, process checkout, and provide account management.</li>
              <li><strong>Consent:</strong> For non-essential analytics and marketing cookies, which you can manage at any time.</li>
              <li><strong>Legitimate Interests:</strong> To secure our infrastructure, prevent fraud, and optimize platform uptime.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>4. Third-Party Service Providers</h2>
            <p>We work with trusted industry providers to operate our platform:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Google Firebase:</strong> Authentication and real-time database infrastructure.</li>
              <li><strong>Stripe:</strong> Secure payment processing.</li>
              <li><strong>Cloudflare:</strong> Edge hosting, CDN, and DDoS protection.</li>
              <li><strong>Google AdSense / Analytics:</strong> Non-essential services loaded strictly with your consent.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>5. Your Rights</h2>
            <p>
              Depending on your jurisdiction (including EU/UK GDPR and California CCPA), you have the right to access,
              rectify, erase, or export your personal data, as well as the right to object to processing.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginBottom: 12 }}>6. Contact Us</h2>
            <p>
              For privacy inquiries, data deletion requests, or compliance questions, please contact our Data Protection Officer at:
              {" "}<a href="mailto:privacy@stea.africa" style={{ color: "#f5a623", textDecoration: "underline" }}>privacy@stea.africa</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
