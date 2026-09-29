import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Search, X } from "lucide-react";
import STEASearchBar from "./STEASearchBar.jsx";
import STEALanguageSwitcher from "./STEALanguageSwitcher.jsx";
import STEANotificationBell from "./STEANotificationBell.jsx";
import STEAAppsLauncher from "./STEAAppsLauncher.jsx";
import STEAProfileMenu from "./STEAProfileMenu.jsx";

const BORDER = "#E5EAF0";
const GOLD = "#F5A623";
const LOGO = "/stea-brand/stea-s-logo-transparent-512.png";

export function STEAHeader({
  appName = "STEA",
  appIcon = LOGO,
  homeTo = "/",
  menuButton = null,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  searchPlaceholder = "Search...",
  primaryAction = null,
  quickActions = [],
  showLanguage = true,
  showFavorites = false,
  showNotifications = true,
  showApps = true,
  user = null,
  onProfileClick,
  onFavorites,
  onNotifications,
  onSignIn,
  onSignOut,
  centerSlot = null,
}) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [isMobileSize, setIsMobileSize] = useState(() => typeof window !== "undefined" ? window.innerWidth < 640 : false);
  const quickRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobileSize(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setQuickOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickRef.current && !quickRef.current.contains(event.target)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actionButton = {
    width: 48,
    height: 48,
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: "#374151",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    flexShrink: 0,
    fontFamily: "inherit",
  };

  const hasQuickActions = Array.isArray(quickActions) && quickActions.length > 0;
  const PrimaryIcon = primaryAction?.icon || "+";

  return (
    <header className="stea-shared-product-header">
      <div className="stea-shared-product-header__inner">
        <div className="stea-shared-product-header__top">
          <div className="stea-shared-product-header__brand">
            {menuButton && (
              typeof menuButton === "function" ? menuButton({ buttonStyle: actionButton }) : menuButton
            )}
            <Link to={homeTo} className="stea-shared-product-header__brand-link" aria-label={appName}>
              <span className="stea-shared-product-header__logo">
                <img src={appIcon || LOGO} alt="STEA" onError={(event) => { event.currentTarget.src = LOGO; }} />
              </span>
              <strong>{appName}</strong>
            </Link>
          </div>

          <div className="stea-shared-product-header__center">
            {showSearch ? (
              <STEASearchBar 
                value={searchValue} 
                onChange={onSearchChange} 
                onClear={onClearSearch} 
                onSubmit={onSearchSubmit} 
                placeholder={searchPlaceholder} 
                className="stea-shared-product-header__search--desktop"
              />
            ) : centerSlot}
          </div>

          <div className="stea-shared-product-header__actions">
            {primaryAction && (
              <div ref={quickRef} className="stea-shared-product-header__quick" style={{ position: "relative" }}>
                <button
                  type="button"
                  className={`stea-shared-product-header__primary stea-shared-product-header__primary--${primaryAction.color || "gold"}`}
                  onClick={() => hasQuickActions ? setQuickOpen((value) => !value) : (primaryAction.onClick || primaryAction.action)?.()}
                  aria-label={primaryAction.label || "Quick actions"}
                >
                  <span className="stea-shared-product-header__primary-icon">{PrimaryIcon}</span>
                  <span className="stea-shared-product-header__primary-label">{primaryAction.label || "Quick Actions"}</span>
                </button>
                {quickOpen && hasQuickActions && (
                  <div className="stea-shared-product-header__panel stea-shared-product-header__quick-menu">
                    {quickActions.map((item) => (
                      <button key={item.label} type="button" onClick={() => { setQuickOpen(false); item.action?.(); }}>
                        <span>{item.icon || "•"}</span>
                        <strong>{item.label}</strong>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showLanguage && (
              <div className="stea-shared-product-header__hide-mobile">
                <STEALanguageSwitcher actionButtonStyle={actionButton} />
              </div>
            )}

            {showFavorites && (
              <button type="button" style={actionButton} onClick={onFavorites} aria-label="Favorites" title="Favorites">
                <Heart size={19} color={GOLD} />
              </button>
            )}

            {showNotifications && (
              <div className="stea-shared-product-header__hide-mobile">
                <STEANotificationBell user={user} actionButtonStyle={actionButton} onSignIn={onSignIn} />
              </div>
            )}

            {showApps && (
              <STEAAppsLauncher actionButtonStyle={actionButton} />
            )}

            <STEAProfileMenu user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
          </div>
        </div>

        {showSearch && (
          <STEASearchBar 
            value={searchValue} 
            onChange={onSearchChange} 
            onClear={onClearSearch} 
            onSubmit={onSearchSubmit} 
            placeholder={searchPlaceholder} 
            className="stea-shared-product-header__search--mobile"
          />
        )}
      </div>

      <style>{`
        .stea-shared-product-header{background:#fff;border-bottom:1px solid ${BORDER};position:sticky;top:0;z-index:50}
        .stea-shared-product-header__inner{max-width:1200px;margin:0 auto;padding:10px 16px}
        .stea-shared-product-header__top{display:flex;align-items:center;gap:12px;min-width:0}
        .stea-shared-product-header__brand{display:flex;align-items:center;gap:8px;min-width:0;flex:0 0 auto}
        .stea-shared-product-header__brand-link{display:flex;align-items:center;gap:10px;color:#111827;text-decoration:none;min-width:0}
        .stea-shared-product-header__brand strong{font-size:18px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .stea-shared-product-header__logo{width:40px;height:40px;display:grid;place-items:center;border:1px solid #D4AF37;border-radius:14px;background:#fff;flex-shrink:0}
        .stea-shared-product-header__logo img{width:25px;height:25px;object-fit:contain}
        .stea-shared-product-header__center{flex:1;min-width:0;display:flex;justify-content:center}
        .stea-shared-product-header__actions{display:flex;align-items:center;gap:8px;margin-left:auto;min-width:0;flex-shrink:0}
        .stea-shared-product-header__search--desktop{width:min(520px,100%);}
        .stea-shared-product-header__search--mobile{display:none;margin-top:10px}
        .stea-shared-product-header__quick{display:inline-flex}
        .stea-shared-product-header__primary{height:48px;min-width:48px;border:0;border-radius:999px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;color:#fff;font-size:13px;font-weight:900;cursor:pointer;box-shadow:0 12px 28px rgba(37,99,235,.18)}
        .stea-shared-product-header__primary--gold{background:linear-gradient(135deg,#D4AF37,#F5A623);color:#111827}
        .stea-shared-product-header__primary--blue{background:linear-gradient(135deg,#2563EB,#3B82F6)}
        .stea-shared-product-header__primary-icon{font-size:22px;line-height:1;font-weight:900}
        .stea-shared-product-header__panel{position:absolute;right:0;top:56px;width:230px;padding:8px;border:1px solid ${BORDER};border-radius:16px;background:#fff;box-shadow:0 18px 42px rgba(17,24,39,.14);z-index:2000;display:grid;gap:4px}
        .stea-shared-product-header__panel button{min-height:42px;border:0;border-radius:10px;background:transparent;color:#111827;display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:8px;padding:7px 10px;text-align:left;font-size:12px;font-weight:800;cursor:pointer}
        .stea-shared-product-header__panel button span,
        .stea-shared-product-header__panel button strong{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
        .stea-shared-product-header__panel button:hover,.stea-shared-product-header__panel button.active{background:#F8FAFC;color:#8F6D00}
        .stea-shared-product-header__panel small{font-size:10px;color:#64748B;font-weight:800}
        .stea-shared-product-header__quick-menu{width:260px}
        .stea-shared-product-header__signin{height:48px;border:1px solid ${BORDER};border-radius:16px;background:#fff;color:#374151;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;font-size:13px;font-weight:900;cursor:pointer;white-space:nowrap}
        @media(max-width:760px){.stea-shared-product-header__inner{padding:9px 10px 10px}.stea-shared-product-header__top{gap:7px}.stea-shared-product-header__brand{flex:1 1 auto}.stea-shared-product-header__brand-link{gap:7px}.stea-shared-product-header__brand strong{font-size:15px}.stea-shared-product-header__logo{width:36px;height:36px;border-radius:12px}.stea-shared-product-header__logo img{width:22px;height:22px}.stea-shared-product-header__center{display:none}.stea-shared-product-header__search--mobile{display:flex;height:44px}.stea-shared-product-header__actions{gap:5px}.stea-shared-product-header__hide-mobile{display:none!important}.stea-shared-product-header__actions button{width:44px!important;height:44px!important;min-width:44px!important;border-radius:13px!important}.stea-shared-product-header__signin{display:grid!important;padding:0!important}.stea-shared-product-header__signin span{display:none}.stea-shared-product-header__primary{width:46px!important;height:46px!important;min-width:46px!important;padding:0!important;border-radius:999px!important}.stea-shared-product-header__primary-label{display:none}.stea-shared-product-header__panel{position:fixed;right:10px;top:58px;width:min(280px,calc(100vw - 20px));max-height:calc(100dvh - 76px);overflow:auto}.stea-shared-product-header__quick-menu{left:10px;right:10px;top:58px;width:auto;border-radius:18px}}
        @media(max-width:360px){.stea-shared-product-header__brand strong{font-size:14px}.stea-shared-product-header__actions{gap:4px}.stea-shared-product-header__actions button{width:44px!important;height:44px!important;min-width:44px!important}.stea-shared-product-header__primary{width:44px!important;height:44px!important;min-width:44px!important}}
      `}</style>
    </header>
  );
}

// Alias for seamless backwards compatibility
export const STEAProductHeader = STEAHeader;
export default STEAHeader;
