import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { usePWA } from "../../contexts/PWAContext.jsx";
import { trackAppEvent } from "../../utils/appTracker.js";

const DISMISS_KEY = "stea_pwa_install_dismissed_at";
const INSTALLED_KEY = "stea_pwa_installed";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function GlobalInstallAppButton() {
  const location = useLocation();
  const { deferredPrompt, isInstalled, installApp } = usePWA();
  
  const [visible, setVisible] = useState(false);
  const [scrollPastHero, setScrollPastHero] = useState(false);
  const hasTrackedPrompt = useRef(false);
  const hasTrackedAccept = useRef(false);

  // Standalone detection
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem(INSTALLED_KEY) === "true"
  );

  // Hidden paths (admin pages)
  const isHiddenPath = location.pathname.startsWith("/admin") || location.pathname.startsWith("/ceo");

  useEffect(() => {
    if (isInstalled) {
      localStorage.setItem(INSTALLED_KEY, "true");
      if (!hasTrackedAccept.current) {
        hasTrackedAccept.current = true;
        trackAppEvent("install_accepted");
      }
    }
  }, [isInstalled]);

  // Check scroll position for homepage hero delay
  useEffect(() => {
    if (location.pathname !== "/") {
      setScrollPastHero(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 400) {
        setScrollPastHero(true);
      } else {
        setScrollPastHero(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // General visibility checks
  useEffect(() => {
    const checkVisibility = () => {
      if (isInstalled || isStandalone || isHiddenPath) {
        setVisible(false);
        return;
      }

      // Check dismissed cooldown
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) {
        setVisible(false);
        return;
      }

      // Check if prompt is available (Safari iOS doesn't fire beforeinstallprompt, but we only show if prompt is available to avoid broken button, or if iOS is supported)
      const canPrompt = !!deferredPrompt || !!window.__steaDeferredPrompt;
      if (!canPrompt) {
        setVisible(false);
        return;
      }

      // If homepage, respect the hero scroll delay
      if (location.pathname === "/" && !scrollPastHero) {
        setVisible(false);
        return;
      }

      setVisible(true);
      
      // Track prompt shown once
      if (!hasTrackedPrompt.current) {
        hasTrackedPrompt.current = true;
        trackAppEvent("install_prompt_shown");
      }
    };

    checkVisibility();
  }, [deferredPrompt, isInstalled, isStandalone, isHiddenPath, location.pathname, scrollPastHero]);

  const handleInstallClick = async (e) => {
    e.preventDefault();
    try {
      const choice = await installApp();
      if (choice?.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
        if (!hasTrackedAccept.current) {
          hasTrackedAccept.current = true;
          trackAppEvent("install_accepted");
        }
        setVisible(false);
      } else if (choice?.outcome === "dismissed") {
        trackAppEvent("install_dismissed");
      }
    } catch (err) {
      console.warn("PWA Install failed", err);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    e.preventDefault();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    trackAppEvent("install_dismissed");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <button 
        type="button"
        className="global-install-button" 
        onClick={handleInstallClick}
        aria-label="Install STEA App"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Download size={15} strokeWidth={3} />
          Install App
        </span>
        <span 
          onClick={handleDismiss} 
          style={{ 
            marginLeft: 8, 
            paddingLeft: 8, 
            borderLeft: "1px solid rgba(17, 24, 39, 0.2)", 
            display: "inline-flex", 
            alignItems: "center", 
            fontSize: 16,
            opacity: 0.8,
            cursor: "pointer",
            fontWeight: "bold"
          }}
          aria-label="Dismiss"
        >
          ×
        </span>
      </button>

      <style>{`
        .global-install-button {
          position: fixed;
          right: 16px;
          bottom: calc(88px + env(safe-area-inset-bottom));
          z-index: 999;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 44px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(212, 160, 23, 0.35);
          background: linear-gradient(135deg, #f8b72b, #ffd36b);
          color: #111827;
          font-weight: 900;
          font-size: 14px;
          box-shadow: 0 16px 38px rgba(212, 160, 23, 0.28);
          cursor: pointer;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .global-install-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 42px rgba(212, 160, 23, 0.35);
        }

        @media (max-width: 480px) {
          .global-install-button {
            right: 14px;
            bottom: calc(86px + env(safe-area-inset-bottom));
            min-height: 42px;
            padding: 0 14px;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}
