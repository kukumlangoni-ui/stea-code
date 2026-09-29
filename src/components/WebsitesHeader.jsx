import React from "react";
import { Link } from "react-router-dom";
import { useSitesLanguage } from "../i18n/index.js";
import STEASearchBar from "./shared/STEASearchBar.jsx";
import STEALanguageSwitcher from "./shared/STEALanguageSwitcher.jsx";
import STEANotificationBell from "./shared/STEANotificationBell.jsx";
import STEAProfileMenu from "./shared/STEAProfileMenu.jsx";
import { Heart } from "lucide-react";

// Correct imports for launchers and subcomponents
import Launcher from "./shared/STEAAppsLauncher.jsx";

const LOGO = "/stea-brand/stea-s-logo-transparent-512.png";

export default function WebsitesHeader({
  user,
  searchValue = "",
  onSearchChange,
  onClearSearch,
  onSearchSubmit,
  onFavorites,
  onNotify,
  searchPlaceholder = "Search websites...",
  showSearch = true,
  onSignIn,
  onSignOut,
}) {
  const { t } = useSitesLanguage();

  const actionButtonClass = "sites-header-action";

  return (
    <header className="sites-header">
      <div className="sites-header-inner">
        {/* Brand/Logo */}
        <Link to="/websites" className="sites-brand" aria-label={t("nav.websitesHome")}>
          <img src={LOGO} alt="STEA Logo" className="sites-brand-logo" />
          <span className="sites-brand-text">{t("hero.badge")}</span>
        </Link>

        {/* Center search bar (Desktop) */}
        {showSearch && (
          <div className="sites-header-search-wrap">
            <STEASearchBar
              value={searchValue}
              onChange={onSearchChange}
              onClear={onClearSearch}
              onSubmit={onSearchSubmit}
              placeholder={searchPlaceholder}
              className="sites-header-search"
            />
          </div>
        )}

        {/* Actions (Right) */}
        <div className="sites-header-actions">
          {/* Language Switcher */}
          <div className="sites-header-hide-mobile">
            <STEALanguageSwitcher actionButtonStyle={{}} actionButtonClassName={actionButtonClass} />
          </div>

          {/* Favorites */}
          <button 
            type="button" 
            className={actionButtonClass} 
            onClick={onFavorites} 
            aria-label={t("nav.favorites")}
            title={t("nav.favorites")}
          >
            <Heart size={19} color="#F5A623" />
          </button>

          {/* Notifications */}
          <div className="sites-header-hide-mobile">
            <STEANotificationBell 
              user={user} 
              actionButtonStyle={{}} 
              actionButtonClassName={actionButtonClass}
              onSignIn={onSignIn} 
            />
          </div>

          {/* Apps Launcher */}
          <Launcher actionButtonStyle={{}} actionButtonClassName={actionButtonClass} />

          {/* Profile Menu */}
          <STEAProfileMenu 
            user={user} 
            onSignIn={onSignIn} 
            onSignOut={onSignOut} 
            actionButtonStyle={{}}
            actionButtonClassName={actionButtonClass}
          />
        </div>
      </div>

      {/* Mobile search bar (shows below brand if search is enabled) */}
      {showSearch && (
        <div className="sites-header-mobile-search-row">
          <STEASearchBar
            value={searchValue}
            onChange={onSearchChange}
            onClear={onClearSearch}
            onSubmit={onSearchSubmit}
            placeholder={searchPlaceholder}
            className="sites-header-search-mobile-input"
          />
        </div>
      )}

      <style>{`
        .sites-header {
          position: sticky;
          top: 0;
          z-index: 990;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid #e5eaf0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }

        .sites-header-inner {
          width: min(100%, 1280px);
          margin: 0 auto;
          min-height: 82px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-sizing: border-box;
        }

        .sites-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #0f172a;
          font-weight: 900;
          text-decoration: none;
          flex-shrink: 0;
        }

        .sites-brand-logo {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(212, 160, 23, 0.55);
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(212, 160, 23, 0.16);
          object-fit: contain;
          padding: 4px;
          box-sizing: border-box;
        }

        .sites-brand-text {
          font-family: 'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .sites-header-search-wrap {
          max-width: 460px;
          flex: 1;
          min-width: 220px;
        }

        .sites-header-search {
          width: 100%;
          height: 48px;
          border-radius: 16px;
          border: 1px solid #e5eaf0;
          background: #f8fafc;
          color: #0f172a;
        }

        .sites-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .sites-header-action {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 1px solid #e5eaf0;
          background: #ffffff;
          color: #0f172a;
          display: grid;
          place-items: center;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          box-sizing: border-box;
        }

        .sites-header-action:hover {
          border-color: rgba(212, 160, 23, 0.55);
          color: #b77900;
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(212, 160, 23, 0.12);
        }

        .sites-header-hide-mobile {
          display: block;
        }

        .sites-header-mobile-search-row {
          display: none;
          padding: 0 16px 12px;
        }

        @media (max-width: 768px) {
          .sites-header-inner {
            min-height: 72px;
            padding: 0 14px;
            gap: 10px;
          }

          .sites-brand-logo {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }

          .sites-brand-text {
            font-size: 20px;
          }

          .sites-header-search-wrap {
            display: none;
          }

          .sites-header-action {
            width: 44px;
            height: 44px;
            border-radius: 14px;
          }

          .sites-header-hide-mobile {
            display: none !important;
          }

          .sites-header-mobile-search-row {
            display: block;
          }
        }

        @media (max-width: 380px) {
          .sites-brand-text {
            font-size: 17px;
          }

          .sites-header-inner {
            gap: 6px;
          }

          .sites-header-action {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
        }
      `}</style>
    </header>
  );
}
