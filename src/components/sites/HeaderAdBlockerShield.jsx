import React, { useState, useEffect } from "react";
import { Shield, ExternalLink, X, ChevronRight, Zap, CheckCircle2, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const TOP_RECOMMENDED = [
  {
    name: "Brave Browser",
    badge: "RECOMMENDED",
    badgeColor: "#FF5500",
    desc: "Built-in ad & tracker blocker. Blocks all popups by default.",
    url: "https://brave.com",
    icon: "🦁",
    action: "Get Brave",
  },
  {
    name: "uBlock Origin",
    badge: "TOP EXTENSION",
    badgeColor: "#800000",
    desc: "Lightweight, highly effective open-source ad/popup killer.",
    url: "https://ublockorigin.com",
    icon: "🛡️",
    action: "Add Extension",
  },
  {
    name: "Proton VPN",
    badge: "FREE & FAST",
    badgeColor: "#6D4AFF",
    desc: "Swiss-based private VPN with unlimited free bandwidth.",
    url: "https://protonvpn.com",
    icon: "🔒",
    action: "Get Free VPN",
  },
  {
    name: "AdGuard",
    badge: "MULTI-DEVICE",
    badgeColor: "#68BC71",
    desc: "Advanced ad, popup and tracker protection for all devices.",
    url: "https://adguard.com",
    icon: "⚡",
    action: "Download",
  },
  {
    name: "NordVPN",
    badge: "PREMIUM",
    badgeColor: "#0066FF",
    desc: "High-speed global servers with built-in Threat Protection.",
    url: "https://nordvpn.com",
    icon: "🌐",
    action: "Visit NordVPN",
  },
];

export default function HeaderAdBlockerShield() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleOpenAll = () => {
    setOpen(false);
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
    <>
      {/* ── Permanent Glowing Header Pill ── */}
      <button
        type="button"
        className="stea-header-shield-pill"
        onClick={() => setOpen(true)}
        aria-label="AdBlocker & VPN Protection"
        title="Stop popups, ads & unlock restricted websites with AdBlocker & VPN"
      >
        <span className="stea-shield-glow-aura" />
        <span className="stea-shield-icon-wrap">
          <Shield size={13} strokeWidth={2.4} className="stea-shield-svg" />
          <span className="stea-shield-pulse-dot" />
        </span>
        <span className="stea-shield-text">
          <span className="stea-shield-prefix">Shield:</span> AdBlock &amp; VPN
        </span>
      </button>

      {/* ── Protection Modal Popover ── */}
      {open && (
        <div className="stea-shield-modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="stea-shield-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shield-modal-title"
          >
            {/* Modal Header */}
            <div className="stea-shield-modal-head">
              <div className="stea-shield-badge-pill">
                <span className="stea-shield-pulse-dot" style={{ position: "relative", inset: "auto" }} />
                <span>ESSENTIAL BROWSING PROTECTION</span>
              </div>
              <button
                type="button"
                className="stea-shield-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Explainer */}
            <h2 id="shield-modal-title" className="stea-shield-modal-title">
              Before clicking external links!
            </h2>
            <p className="stea-shield-modal-subtitle">
              Many free streaming, tools, and media platforms contain aggressive ads, popups, or regional locks.
              Using a trusted <strong>AdBlocker</strong> and <strong>VPN</strong> gives you an uninterrupted, safe experience.
            </p>

            {/* Top Quick Actions Grid */}
            <div className="stea-shield-quick-grid">
              {TOP_RECOMMENDED.map((item) => (
                <div key={item.name} className="stea-shield-item-card">
                  <div className="stea-shield-item-top">
                    <div className="stea-shield-item-name-wrap">
                      <span className="stea-shield-item-emoji">{item.icon}</span>
                      <strong className="stea-shield-item-name">{item.name}</strong>
                    </div>
                    <span
                      className="stea-shield-item-badge"
                      style={{
                        backgroundColor: `${item.badgeColor}22`,
                        color: item.badgeColor,
                        borderColor: `${item.badgeColor}44`,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="stea-shield-item-desc">{item.desc}</p>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stea-shield-item-btn"
                  >
                    <span>{item.action}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>

            {/* Footer Navigation */}
            <div className="stea-shield-modal-foot">
              <div className="stea-shield-foot-note">
                <CheckCircle2 size={13} style={{ color: "#10B981" }} />
                <span>100% Free options available · Safe &amp; verified tools</span>
              </div>
              <button
                type="button"
                className="stea-shield-browse-all-btn"
                onClick={handleOpenAll}
              >
                <span>Browse All AdBlockers &amp; VPNs (16+)</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Component Styles ── */}
      <style>{`
        /* Header Trigger Pill */
        .stea-header-shield-pill {
          appearance: none;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(18, 22, 34, 0.85);
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.12) 0%, rgba(13, 16, 26, 0.95) 100%);
          border: 1px solid rgba(245, 166, 35, 0.38);
          color: #FFFFFF;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: -0.01em;
          cursor: pointer;
          user-select: none;
          transition: all 180ms ease;
          overflow: visible;
          box-shadow: 0 0 14px rgba(245, 166, 35, 0.18), inset 0 0 8px rgba(245, 166, 35, 0.08);
          flex-shrink: 0;
        }

        .stea-header-shield-pill:hover {
          border-color: #F5A623;
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.22) 0%, rgba(20, 24, 38, 0.98) 100%);
          box-shadow: 0 0 20px rgba(245, 166, 35, 0.35), inset 0 0 12px rgba(245, 166, 35, 0.15);
          transform: translateY(-1px);
        }

        .stea-shield-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #F5A623;
        }

        .stea-shield-svg {
          filter: drop-shadow(0 0 4px rgba(245, 166, 35, 0.5));
        }

        .stea-shield-pulse-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 6px #10B981;
          animation: steaPulse 1.8s ease-in-out infinite;
        }

        @keyframes steaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.35); }
        }

        .stea-shield-text {
          white-space: nowrap;
          color: #FFFFFF;
        }

        .stea-shield-prefix {
          color: #F5A623;
          font-weight: 800;
          margin-right: 2px;
        }

        /* Modal Backdrop */
        .stea-shield-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(2, 4, 10, 0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: steaFadeIn 160ms ease-out;
        }

        @keyframes steaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .stea-shield-modal-card {
          width: 100%;
          max-width: 540px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          background: #0B0E17;
          background: linear-gradient(180deg, #101524 0%, #080B12 100%);
          border: 1px solid rgba(245, 166, 35, 0.35);
          border-radius: 20px;
          padding: 24px;
          box-sizing: border-box;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85), 0 0 32px rgba(245, 166, 35, 0.15);
          color: #FFFFFF;
          animation: steaZoomIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes steaZoomIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .stea-shield-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .stea-shield-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.3);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.08em;
          color: #F5A623;
          text-transform: uppercase;
        }

        .stea-shield-modal-close {
          appearance: none;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.65);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 120ms ease;
        }

        .stea-shield-modal-close:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.12);
        }

        .stea-shield-modal-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 22px;
          font-weight: 850;
          letter-spacing: -0.025em;
          margin: 0 0 8px;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .stea-shield-modal-subtitle {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 20px;
        }

        .stea-shield-modal-subtitle strong {
          color: #F5A623;
        }

        .stea-shield-quick-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .stea-shield-item-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
          transition: all 140ms ease;
        }

        .stea-shield-item-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(245, 166, 35, 0.3);
        }

        .stea-shield-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .stea-shield-item-name-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .stea-shield-item-emoji {
          font-size: 15px;
        }

        .stea-shield-item-name {
          font-size: 14px;
          font-weight: 750;
          color: #FFFFFF;
        }

        .stea-shield-item-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
          text-transform: uppercase;
        }

        .stea-shield-item-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 8px;
          line-height: 1.4;
        }

        .stea-shield-item-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(245, 166, 35, 0.12);
          border: 1px solid rgba(245, 166, 35, 0.35);
          color: #FFD17C;
          text-decoration: none;
          font-size: 11.5px;
          font-weight: 750;
          padding: 5px 11px;
          border-radius: 7px;
          transition: all 120ms ease;
        }

        .stea-shield-item-btn:hover {
          background: #F5A623;
          color: #000000;
          border-color: #F5A623;
        }

        .stea-shield-modal-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .stea-shield-foot-note {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .stea-shield-browse-all-btn {
          appearance: none;
          border: none;
          background: #F5A623;
          color: #000000;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 140ms ease;
          flex-shrink: 0;
        }

        .stea-shield-browse-all-btn:hover {
          background: #FFB84D;
          transform: translateY(-1px);
        }

        @media (max-width: 600px) {
          .stea-shield-prefix { display: none; }
          .stea-shield-modal-foot {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .stea-shield-browse-all-btn {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
