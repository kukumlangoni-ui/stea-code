import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import SteaCodeLogo from "./SteaCodeLogo.jsx";
import {
  hasConsented,
  getConsent,
  setConsent,
  onConsentChange,
} from "../../utils/cookieConsent.js";
import "./CookieConsentBanner.css";

export default function CookieConsentBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  const manageButtonRef = useRef(null);
  const prefsPanelRef = useRef(null);
  const saveButtonRef = useRef(null);

  useEffect(() => {
    // Hide banner on admin views
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/code-admin")
    ) {
      setVisible(false);
      return;
    }

    // Check if consent has already been stored
    const consented = hasConsented();
    if (!consented) {
      setVisible(true);
    } else {
      setVisible(false);
    }

    // Sync state if external change occurs
    const unsub = onConsentChange((currentConsent) => {
      if (hasConsented()) {
        setVisible(false);
      }
      setAnalytics(currentConsent.analytics);
      setAdvertising(currentConsent.advertising);
    });

    return unsub;
  }, [location.pathname]);

  // Focus management & Escape key listener for preferences sub-view
  useEffect(() => {
    if (!showPreferences) return;

    // Focus the first interactive element or save button in preferences
    if (saveButtonRef.current) {
      saveButtonRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPreferences(false);
        if (manageButtonRef.current) {
          manageButtonRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreferences]);

  if (!visible) return null;

  const handleAcceptAll = () => {
    setConsent({ analytics: true, advertising: true });
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    setConsent({ analytics: false, advertising: false });
    setVisible(false);
  };

  const handleSavePreferences = () => {
    setConsent({ analytics, advertising });
    setVisible(false);
  };

  const handleOpenPreferences = () => {
    const current = getConsent();
    setAnalytics(current.analytics);
    setAdvertising(current.advertising);
    setShowPreferences(true);
  };

  const handleClosePreferences = () => {
    setShowPreferences(false);
    if (manageButtonRef.current) {
      manageButtonRef.current.focus();
    }
  };

  return (
    <aside
      className="sc-cookie-banner-wrap"
      role="region"
      aria-label="Cookie preferences"
    >
      <div className="sc-cookie-banner">
        {/* Signature accent line */}
        <div className="sc-cookie-accent-line" aria-hidden="true" />

        <div className="sc-cookie-header">
          <div className="sc-cookie-icon" aria-hidden="true">
            <SteaCodeLogo size={20} alt="" />
          </div>
          <h2 className="sc-cookie-title">Cookie Preferences</h2>
        </div>

        <p className="sc-cookie-text">
          We use cookies to ensure core functionality, analyze ecosystem performance,
          and provide relevant content. Read our{" "}
          <Link to="/privacy" className="sc-cookie-link">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/cookies" className="sc-cookie-link">
            Cookie Policy
          </Link>
          .
        </p>

        {showPreferences ? (
          <div
            className="sc-cookie-prefs"
            ref={prefsPanelRef}
            tabIndex={-1}
          >
            {/* Essential Category */}
            <div className="sc-cookie-pref-item">
              <div className="sc-cookie-pref-info">
                <div className="sc-cookie-pref-title">
                  <span>Essential Cookies</span>
                  <span className="sc-cookie-pref-tag">Always Active</span>
                </div>
                <p className="sc-cookie-pref-desc">
                  Required for authentication, security, cart sessions, and platform stability.
                </p>
              </div>
              <label className="sc-cookie-toggle" aria-label="Essential cookies (always active)">
                <input type="checkbox" checked disabled aria-disabled="true" />
                <span className="sc-cookie-toggle-slider" />
              </label>
            </div>

            {/* Analytics Category */}
            <div className="sc-cookie-pref-item">
              <div className="sc-cookie-pref-info">
                <div className="sc-cookie-pref-title">
                  <span>Analytics &amp; Performance</span>
                </div>
                <p className="sc-cookie-pref-desc">
                  Helps us understand how developers discover components and optimize speed.
                </p>
              </div>
              <label className="sc-cookie-toggle" aria-label="Toggle analytics cookies">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span className="sc-cookie-toggle-slider" />
              </label>
            </div>

            {/* Advertising Category */}
            <div className="sc-cookie-pref-item">
              <div className="sc-cookie-pref-info">
                <div className="sc-cookie-pref-title">
                  <span>Advertising &amp; Marketing</span>
                </div>
                <p className="sc-cookie-pref-desc">
                  Allows third-party partners and display ads to serve relevant developer tools.
                </p>
              </div>
              <label className="sc-cookie-toggle" aria-label="Toggle advertising cookies">
                <input
                  type="checkbox"
                  checked={advertising}
                  onChange={(e) => setAdvertising(e.target.checked)}
                />
                <span className="sc-cookie-toggle-slider" />
              </label>
            </div>

            <div className="sc-cookie-prefs-actions">
              <button
                ref={saveButtonRef}
                type="button"
                className="sc-cookie-btn sc-cookie-btn-accept"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </button>
              <button
                type="button"
                className="sc-cookie-btn-back"
                onClick={handleClosePreferences}
              >
                <ChevronLeft size={14} aria-hidden="true" />
                <span>Back</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="sc-cookie-actions">
            <div className="sc-cookie-primary-row">
              <button
                type="button"
                className="sc-cookie-btn sc-cookie-btn-accept"
                onClick={handleAcceptAll}
              >
                Accept All
              </button>
              <button
                type="button"
                className="sc-cookie-btn sc-cookie-btn-reject"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </button>
            </div>
            <button
              ref={manageButtonRef}
              type="button"
              className="sc-cookie-btn-manage"
              onClick={handleOpenPreferences}
            >
              <span>Manage Preferences</span>
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
