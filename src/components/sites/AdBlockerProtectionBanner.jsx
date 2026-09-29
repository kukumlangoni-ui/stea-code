import React, { useState } from "react";
import { X, ExternalLink, ChevronRight, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdBlockerProtectionBanner({ isAfterDark = false }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (dismissed) return null;

  const handleOpenMore = () => {
    if (location.pathname === "/websites" || location.pathname === "/") {
      const el = document.getElementById("cat-sec-adblockers");
      if (el) {
        const headerOffset = 68;
        const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        return;
      }
    }
    navigate("/websites/adblockers");
  };

  return (
    <div className="stea-adblock-banner-wrap" role="region" aria-label="AdBlocker recommendation">
      <div className="stea-adblock-banner-card">
        {/* Top row: Title + Close Button */}
        <div className="stea-adblock-banner-top">
          <div className="stea-adblock-banner-title-wrap">
            <span className="stea-adblock-banner-shield-icon">🛡️</span>
            <strong className="stea-adblock-banner-title">Before clicking any link!!!</strong>
          </div>
          <button
            type="button"
            className="stea-adblock-banner-close"
            onClick={() => setDismissed(true)}
            aria-label="Close notification"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Middle row: Use [Brave] or [uBlock Origin] or [Proton VPN] */}
        <div className="stea-adblock-banner-body">
          <span className="stea-adblock-body-label">Use</span>

          {/* Brave Button */}
          <a
            href="https://brave.com"
            target="_blank"
            rel="noopener noreferrer"
            className="stea-adblock-pill-btn is-brave"
            title="Download Brave Browser with built-in ad blocker"
          >
            <span className="stea-pill-icon">🦁</span>
            <span>Brave</span>
          </a>

          <span className="stea-adblock-body-label">or</span>

          {/* uBlock Origin Button */}
          <a
            href="https://ublockorigin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="stea-adblock-pill-btn is-ublock"
            title="Get uBlock Origin extension"
          >
            <span className="stea-pill-icon">🛡️</span>
            <span>uBlock Origin</span>
          </a>

          <span className="stea-adblock-body-label">or</span>

          {/* Proton VPN Button */}
          <a
            href="https://protonvpn.com"
            target="_blank"
            rel="noopener noreferrer"
            className="stea-adblock-pill-btn is-vpn"
            title="Get Proton VPN Free"
          >
            <span className="stea-pill-icon">🔒</span>
            <span>Proton VPN</span>
          </a>
        </div>

        {/* Bottom row: Description + More Link */}
        <div className="stea-adblock-banner-bottom">
          <span className="stea-adblock-banner-desc">
            to stop unwanted popups, ads, and bypass network blocks.
          </span>

          <button
            type="button"
            className="stea-adblock-more-link"
            onClick={handleOpenMore}
            title="View full list of verified AdBlockers & VPNs"
          >
            <span>More AdBlockers &amp; VPN (16+)</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <style>{`
        .stea-adblock-banner-wrap {
          margin: 0 0 24px 0;
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 25;
        }

        .stea-adblock-banner-card {
          width: 100%;
          background: rgba(18, 16, 32, 0.92);
          background: linear-gradient(135deg, rgba(28, 22, 52, 0.95) 0%, rgba(13, 11, 24, 0.96) 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 18px;
          padding: 16px 20px;
          box-sizing: border-box;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), 0 0 24px rgba(139, 92, 246, 0.12);
          color: #FFFFFF;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: border-color 180ms ease, box-shadow 180ms ease;
          animation: steaSlideDown 240ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes steaSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stea-adblock-banner-card:hover {
          border-color: rgba(139, 92, 246, 0.55);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), 0 0 28px rgba(139, 92, 246, 0.2);
        }

        .stea-adblock-banner-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .stea-adblock-banner-title-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .stea-adblock-banner-shield-icon {
          font-size: 15px;
        }

        .stea-adblock-banner-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 15.5px;
          font-weight: 850;
          color: #FFFFFF;
          letter-spacing: -0.015em;
        }

        .stea-adblock-banner-close {
          appearance: none;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .stea-adblock-banner-close:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #FFFFFF;
        }

        /* Middle Row */
        .stea-adblock-banner-body {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .stea-adblock-body-label {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }

        .stea-adblock-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          color: #FFFFFF;
          text-decoration: none;
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
          letter-spacing: -0.01em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .stea-adblock-pill-btn:hover {
          transform: translateY(-1px) scale(1.03);
          filter: brightness(1.1);
        }

        .stea-adblock-pill-btn.is-brave {
          background: #FB542B;
          background: linear-gradient(135deg, #FF6633 0%, #E63900 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(251, 84, 43, 0.35);
        }

        .stea-adblock-pill-btn.is-ublock {
          background: #8B0000;
          background: linear-gradient(135deg, #A00000 0%, #750000 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(139, 0, 0, 0.35);
        }

        .stea-adblock-pill-btn.is-vpn {
          background: #6D4AFF;
          background: linear-gradient(135deg, #7C5CFF 0%, #5833E6 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(109, 74, 255, 0.35);
        }

        .stea-pill-icon {
          font-size: 14px;
          line-height: 1;
        }

        /* Bottom Row */
        .stea-adblock-banner-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stea-adblock-banner-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
        }

        .stea-adblock-more-link {
          appearance: none;
          background: rgba(245, 166, 35, 0.1);
          border: 1px solid rgba(245, 166, 35, 0.3);
          color: #FFD17C;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 750;
          padding: 4px 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 140ms ease;
        }

        .stea-adblock-more-link:hover {
          background: #F5A623;
          color: #000000;
          border-color: #F5A623;
        }

        @media (max-width: 600px) {
          .stea-adblock-banner-card { padding: 12px 14px; }
          .stea-adblock-banner-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
