import React, { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { usePWA } from "../contexts/PWAContext";

const DISMISS_KEY = "stea_pwa_install_dismissed_until";
const DISMISS_MS = 24 * 60 * 60 * 1000;

function dismissedUntil() {
  try {
    const value = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

const PWAInstallBanner = () => {
  const { deferredPrompt, isInstalled, installApp } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [message, setMessage] = useState("");
  const [installing, setInstalling] = useState(false);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );

  const canUsePrompt = !!deferredPrompt || !!window.__steaDeferredPrompt;
  const shouldOfferManualIOS = isIOS && isSafari;
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setIsDismissed(dismissedUntil() > Date.now());
  }, []);

  const canShow = useMemo(() => {
    if (isInstalled || isStandalone) return false;
    if (isDismissed) return false;
    return true;
  }, [isInstalled, isStandalone, isDismissed]);

  useEffect(() => {
    if (!canShow) {
      setShowBanner(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShowBanner(true), 3000);
    return () => window.clearTimeout(timer);
  }, [canShow, canUsePrompt, shouldOfferManualIOS]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('stea-install-visibility', { detail: { visible: showBanner } }));
  }, [showBanner]);

  const dismissForNow = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {}
    setShowBanner(false);
    setMessage("");
  };

  const handleInstall = async () => {
    if (shouldOfferManualIOS && !canUsePrompt) {
      setMessage("Tap Share then Add to Home Screen");
      return;
    }

    if (!canUsePrompt) {
      setMessage(isAndroid
        ? "Install will appear when Chrome confirms this app is installable. Try again in a moment."
        : "Install is available when your browser shows the app install prompt.");
      return;
    }

    setInstalling(true);
    setMessage("");
    try {
      const choice = await installApp();
      if (choice?.outcome === "accepted") {
        setShowBanner(false);
      } else {
        setMessage("Install was not completed. You can try again later.");
      }
    } catch (error) {
      console.warn("[PWA] install prompt failed:", error);
      setMessage("Install could not start. Try again from your browser menu.");
    } finally {
      setInstalling(false);
    }
  };

  if (!showBanner || isInstalled || isStandalone) return null;

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install STEA app">
      <button className="pwa-close" type="button" aria-label="Close install banner" onClick={dismissForNow}>
        <X size={14} />
      </button>

      <div className="pwa-icon" aria-hidden="true">
        <img src="/stea-brand/stea-s-logo-transparent-512.png?v=20260621-splashfix" alt="" />
        <span><Download size={13} strokeWidth={3} /></span>
      </div>

      <div className="pwa-copy">
        <div className="pwa-title">Install STEA App</div>
        <div className="pwa-subtitle">
          {shouldOfferManualIOS && !canUsePrompt ? "Tap Share then Add to Home Screen" : "Get faster access to STEA Education, Marketplace, Websites, Services and updates."}
        </div>
        {message && <div className="pwa-message">{message}</div>}
      </div>

      <div className="pwa-actions">
        <button className="pwa-later" type="button" onClick={dismissForNow}>Not Now</button>
        <button className="pwa-install" type="button" onClick={handleInstall} disabled={installing}>
          {installing ? "Opening..." : "Install App"}
        </button>
      </div>

      <style>{`
        .pwa-install-banner {
          position: fixed;
          top: calc(env(safe-area-inset-top, 0px) + 14px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: calc(100vw - 32px);
          max-width: 420px;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #E4E8ED;
          background: #fff;
          color: #111827;
          box-shadow: 0 16px 48px rgba(17,24,39,.15);
          overflow: hidden;
          animation: pwaIn .22s ease-out;
        }
        @keyframes pwaIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .pwa-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border: 1px solid #E5E7EB;
          border-radius: 9px;
          background: #F9FAFB;
          color: #6B7280;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .pwa-icon {
          width: 42px;
          height: 42px;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          align-self: start;
          border: 1px solid #F1F5F9;
        }
        .pwa-icon img {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          object-fit: cover;
          display: block;
        }
        .pwa-icon span {
          display: none;
        }
        .pwa-copy {
          min-width: 0;
          padding-right: 30px;
        }
        .pwa-title {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 900;
          margin-bottom: 3px;
          color: #111827;
        }
        .pwa-subtitle {
          font-size: 12px;
          line-height: 1.35;
          color: #6B7280;
        }
        .pwa-message {
          margin-top: 7px;
          padding: 7px 8px;
          border-radius: 9px;
          background: rgba(245,166,35,.1);
          color: #765700;
          font-size: 12px;
          line-height: 1.3;
        }
        .pwa-actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }
        .pwa-actions button {
          flex: 1;
          height: 36px;
          border-radius: 10px;
          border: none;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }
        .pwa-later {
          background: #F9FAFB;
          color: #4B5563;
          border: 1px solid #E5E7EB !important;
        }
        .pwa-install {
          background: linear-gradient(135deg, #F5A623, #FFD17C);
          color: #111;
        }
        .pwa-install:disabled {
          cursor: wait;
          opacity: .65;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallBanner;
