/**
 * SitesInstallBanner — Apple-Quality Premium PWA Install Prompt
 *
 * Requirements:
 *  - Real browser `beforeinstallprompt` invocation (no fake prompt)
 *  - Unobtrusive placement (desktop: top/bottom right floating card, mobile: bottom sheet)
 *  - Platform-specific iOS Safari step guidance
 *  - Local persistence & cooldown on dismissal
 *  - Standalone mode & already installed detection
 *  - Uses new STEA app icon
 */
import React, { useState, useEffect, useMemo } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { usePWA } from "../../contexts/PWAContext.jsx";

const SITES_DISMISS_KEY = "stea_pwa_dismissed_until";
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function getDismissedUntil() {
  try {
    const val = Number(localStorage.getItem(SITES_DISMISS_KEY) || 0);
    return Number.isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export default function SitesInstallBanner() {
  const { deferredPrompt, isInstalled, installApp } = usePWA();
  const [visible, setVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return getDismissedUntil() > Date.now();
  });

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);

  const isEligible = useMemo(() => {
    if (isInstalled || isStandalone || isDismissed) return false;
    return true;
  }, [isInstalled, isStandalone, isDismissed]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      try {
        localStorage.setItem(SITES_DISMISS_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {}
      setVisible(false);
      setShowIosGuide(false);
      setIsDismissed(true);
      setIsDismissing(false);
    }, 240);
  };

  useEffect(() => {
    if (!isEligible) {
      setVisible(false);
      return undefined;
    }
    // Subtle delay so user sees initial page load without jarring popups
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isEligible]);

  const handleInstallClick = async () => {
    if (isIOS && isSafari && !deferredPrompt && !window.__steaDeferredPrompt) {
      setShowIosGuide(true);
      return;
    }

    try {
      const choice = await installApp();
      if (choice?.outcome === "accepted") {
        setVisible(false);
      }
    } catch (e) {
      console.warn("[STEA PWA] Install prompt exception:", e);
      if (isIOS) setShowIosGuide(true);
    }
  };

  if (!visible || isInstalled || isStandalone) return null;

  return (
    <>
      <aside
        className={`stea-apple-install-banner ${isDismissing ? "dismissing" : ""}`}
        role="region"
        aria-label="Install STEA"
      >
        <button
          type="button"
          className="stea-apple-close-btn"
          onClick={handleDismiss}
          aria-label="Close install prompt"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        <div className="stea-apple-banner-inner">
          <img
            src="/apple-touch-icon.png"
            alt="STEA"
            className="stea-apple-app-icon"
            width="48"
            height="48"
          />

          <div className="stea-apple-text-block">
            <h4 className="stea-apple-title">Install STEA</h4>
            <p className="stea-apple-subtitle">Get the useful side of the internet right from your device.</p>
          </div>

          <button
            type="button"
            className="stea-apple-install-btn"
            onClick={handleInstallClick}
          >
            <span>Install</span>
          </button>
        </div>
      </aside>

      {/* iOS Safari Guidance Sheet */}
      {showIosGuide && (
        <div className="stea-ios-backdrop" onClick={() => setShowIosGuide(false)}>
          <div className="stea-ios-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="stea-ios-sheet-head">
              <img
                src="/apple-touch-icon.png"
                alt="STEA"
                width="48"
                height="48"
                style={{ borderRadius: 12 }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>Install STEA</h4>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>Add to Home Screen</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="stea-apple-close-btn"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <ol className="stea-ios-steps">
              <li>
                <span className="step-badge">1</span>
                <span>Tap the <strong>Share</strong> button <Share size={15} style={{ display: "inline", verticalAlign: "middle", margin: "0 2px" }} /> in Safari.</span>
              </li>
              <li>
                <span className="step-badge">2</span>
                <span>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare size={15} style={{ display: "inline", verticalAlign: "middle", margin: "0 2px" }} />.</span>
              </li>
              <li>
                <span className="step-badge">3</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </li>
            </ol>

            <button
              type="button"
              className="stea-ios-done-btn"
              onClick={handleDismiss}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        .stea-apple-install-banner {
          position: fixed;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
          left: 14px;
          right: 14px;
          margin: 0 auto;
          max-width: 440px;
          z-index: 9999;
          background: rgba(14, 16, 23, 0.94);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(245, 166, 35, 0.25);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 24px rgba(245, 166, 35, 0.12);
          padding: 14px 16px;
          box-sizing: border-box;
          animation: steaSlideUp 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition: opacity 240ms ease, transform 240ms ease;
        }

        :root.light .stea-apple-install-banner,
        .stea-home-light .stea-apple-install-banner {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.12);
          box-shadow: 0 16px 48px rgba(15, 23, 42, 0.14);
        }

        @media (min-width: 768px) {
          .stea-apple-install-banner {
            bottom: auto;
            top: 24px;
            right: 24px;
            left: auto;
            margin: 0;
            animation: steaSlideDown 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        }

        @keyframes steaSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes steaSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stea-apple-install-banner.dismissing {
          opacity: 0;
          transform: translateY(20px);
        }

        .stea-apple-close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease;
          padding: 0;
          z-index: 2;
        }

        :root.light .stea-apple-close-btn,
        .stea-home-light .stea-apple-close-btn {
          background: rgba(15, 23, 42, 0.08);
          color: #64748B;
        }

        .stea-apple-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        .stea-apple-banner-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .stea-apple-app-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        .stea-apple-text-block {
          flex: 1;
          min-width: 0;
          padding-right: 8px;
        }

        .stea-apple-title {
          margin: 0;
          font-size: 15px;
          font-weight: 850;
          line-height: 1.25;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
        }

        :root.light .stea-apple-title,
        .stea-home-light .stea-apple-title {
          color: #0F172A;
        }

        .stea-apple-subtitle {
          margin: 2px 0 0 0;
          font-size: 12px;
          line-height: 1.35;
          color: #94A3B8;
          font-family: "'Instrument Sans', system-ui, sans-serif";
        }

        :root.light .stea-apple-subtitle,
        .stea-home-light .stea-apple-subtitle {
          color: #64748B;
        }

        .stea-apple-install-btn {
          appearance: none;
          border: none;
          border-radius: 999px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #F5A623, #FFD17C);
          color: #0A0B10;
          font-size: 13px;
          font-weight: 850;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(245, 166, 35, 0.35);
          flex-shrink: 0;
          transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .stea-apple-install-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(245, 166, 35, 0.45);
        }

        .stea-apple-install-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(245, 166, 35, 0.25);
        }

        /* iOS Safari Guidance Sheet */
        .stea-ios-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          animation: steaFadeIn 200ms ease-out;
        }

        @media (min-width: 600px) {
          .stea-ios-backdrop {
            align-items: center;
          }
        }

        @keyframes steaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .stea-ios-sheet {
          background: rgba(22, 24, 34, 0.98);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(245, 166, 35, 0.25);
          border-radius: 24px;
          padding: 22px;
          max-width: 390px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85);
          animation: steaSlideUp 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .stea-ios-sheet-head {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .stea-ios-steps {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 13.5px;
          color: #E2E8F0;
          line-height: 1.45;
        }

        .stea-ios-steps li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-badge {
          background: rgba(245, 166, 35, 0.15);
          color: #FFD17C;
          border: 1px solid rgba(245, 166, 35, 0.35);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .stea-ios-done-btn {
          appearance: none;
          border: none;
          border-radius: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #F5A623, #FFD17C);
          color: #0A0B10;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          width: 100%;
          text-align: center;
          transition: filter 150ms ease;
          font-family: inherit;
        }

        .stea-ios-done-btn:hover {
          filter: brightness(1.08);
        }
      `}</style>
    </>
  );
}
