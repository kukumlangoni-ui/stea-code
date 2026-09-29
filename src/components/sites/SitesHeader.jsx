import { useState, memo, useEffect } from "react";
import { Link } from "react-router-dom";
import { CircleUser, Check, ChevronDown, Download, Sun, Moon } from "lucide-react";
import { TOKENS } from "./tokens.js";
import { useSitesLanguage, SUPPORTED_LANGUAGES } from "../../i18n/index.js";
import { usePWA } from "../../contexts/PWAContext.jsx";
import { useSettings } from "../../contexts/SettingsContext.jsx";
import SitesMemberMenu from "./SitesMemberMenu.jsx";

const LOGO = "/stea-www-globe.png"; // Official STEA logo

const LANG_SHORT = {
  en: "EN",
  sw: "SW",
  zh: "中文",
};

const LANG_LABEL = {
  en: "English",
  sw: "Swahili",
  zh: "Simplified Chinese",
};

function LanguageChip() {
  const { currentLang, changeLanguage } = useSitesLanguage();
  const [open, setOpen] = useState(false);

  const displayKey = currentLang === 'en' ? 'en' : currentLang === 'zh' ? 'zh' : currentLang === 'sw' ? 'sw' : 'en';

  return (
    <div className="sites-lang-chip-wrap" onMouseLeave={() => setOpen(false)}>
      <button 
        type="button"
        className="sites-lang-chip"
        onClick={() => setOpen(!open)}
        aria-label="Change Language"
        title="Change Language"
      >
        <span>{LANG_SHORT[displayKey] || "EN"}</span>
        <ChevronDown size={11} strokeWidth={2.5} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <ul className="sites-lang-menu">
          {["en", "sw", "zh"].map((k) => (
            <li key={k}>
              <button
                type="button"
                className={`sites-lang-option ${displayKey === k ? "is-selected" : ""}`}
                onClick={() => { changeLanguage(k); setOpen(false); }}
              >
                <span>{LANG_LABEL[k]}</span>
                {displayKey === k && <Check size={12} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HeaderInstallButton() {
  const { deferredPrompt, isInstalled } = usePWA();
  const { t } = useSitesLanguage();
  if (isInstalled || !deferredPrompt) return null;

  return (
    <button 
      type="button"
      className="sites-header-install-btn"
      onClick={() => deferredPrompt.prompt()}
      aria-label={t("nav.installApp", "Install App")}
      title={t("nav.installApp", "Install App")}
    >
      <Download size={13} strokeWidth={2.5} />
      <span className="sites-header-install-text">{t("nav.installApp", "Install App")}</span>
    </button>
  );
}

function AccountButton({ user, onSignIn }) {
  const { t } = useSitesLanguage();
  const [clicked, setClicked] = useState(false);

  if (user) {
    return <SitesMemberMenu user={user} />;
  }

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 500);
    if (onSignIn) onSignIn();
    else window.dispatchEvent(new CustomEvent('open-auth'));
  };

  return (
    <button
      type="button"
      className="sites-account-btn"
      onClick={handleClick}
      aria-label={t("nav.signIn", "Sign In")}
      title={t("nav.signIn", "Sign In")}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.06)", border: `1px solid var(--stea-border)`,
        borderRadius: 999, padding: "5px 12px",
        cursor: "pointer", color: "var(--stea-text)",
        fontFamily: "inherit", fontSize: 13, fontWeight: 700,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.borderColor = "var(--stea-border-hi)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "var(--stea-border)";
      }}
    >
      <span>{t("nav.becomeMember", "Become a Member")}</span>
    </button>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useSettings();
  // We need to know actual rendered mode if it's 'system'
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (theme === 'light') setIsDark(false);
    else if (theme === 'dark') setIsDark(true);
    else {
      setIsDark(!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches));
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="sites-theme-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun size={15} strokeWidth={2.5} /> : <Moon size={15} strokeWidth={2.5} />}
    </button>
  );
}

function SitesHeader({ user, onSignIn, onSignOut }) {
  const { t } = useSitesLanguage();

  return (
    <header className="sites-header-v2" role="banner">
      <div className="sites-header-v2-inner">
        <Link
          to="/"
          className="sites-brand-v2"
          aria-label="STEA Home"
        >
          <img
            src={LOGO}
            alt="STEA logo"
            className="sites-brand-v2-logo"
            width="32"
            height="32"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <span className="sites-brand-v2-text">STEA</span>
        </Link>

        <div className="sites-header-v2-right" aria-label={t("nav.headerActions", "Header actions")}>
          <HeaderInstallButton />
          <LanguageChip />
          <ThemeToggle />
          <AccountButton user={user} onSignIn={onSignIn} />
        </div>
      </div>

      <style>{`
        .sites-header-v2 {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 54px;
          flex-shrink: 0;
          z-index: 1000;
          background: rgba(6, 8, 15, 0.94);
          backdrop-filter: saturate(170%) blur(16px);
          -webkit-backdrop-filter: saturate(170%) blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          transition: border-color 200ms ease, background 200ms ease;
          overflow: visible;
        }

        .sites-header-v2-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 6px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .sites-brand-v2 {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--stea-text);
          flex-shrink: 0;
        }

        .sites-brand-v2-logo {
          width: 26px;
          height: 26px;
          border-radius: 0; background: transparent;
          display: block;
          object-fit: contain;
        }

        .sites-brand-v2-text {
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, -apple-system, sans-serif";
          font-size: 19px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: var(--stea-text);
        }

        .sites-header-v2-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .sites-header-install-btn {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--stea-gold) 28%, var(--stea-border));
          background: color-mix(in srgb, var(--stea-gold) 10%, transparent);
          color: var(--stea-gold-hi);
          border-radius: 999px;
          padding: 5px 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease;
        }
        .sites-header-install-btn:hover {
          background: color-mix(in srgb, var(--stea-gold) 20%, transparent);
          border-color: var(--stea-gold);
        }

        .sites-theme-btn {
          appearance: none;
          background: transparent;
          border: 1px solid var(--stea-border);
          color: var(--stea-text2);
          border-radius: 999px;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
        }
        .sites-theme-btn:hover {
          color: var(--stea-text);
          background: var(--stea-panel);
          border-color: var(--stea-border-hi);
        }

        .sites-lang-chip-wrap {
          position: relative;
        }

        .sites-lang-chip {
          appearance: none;
          background: var(--stea-panel);
          border: 1px solid var(--stea-border);
          color: var(--stea-text2);
          border-radius: 999px;
          padding: 5px 9px;
          font: inherit;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: border-color 140ms ease, color 140ms ease, background 140ms ease;
        }
        .sites-lang-chip:hover {
          border-color: var(--stea-border-hi);
          color: var(--stea-text);
          background: var(--stea-panel2);
        }

        .sites-lang-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 130px;
          background: var(--stea-panel2);
          border: 1px solid var(--stea-border-hi);
          border-radius: 10px;
          padding: 4px;
          list-style: none;
          margin: 0;
          z-index: var(--stea-z-toast, 80);
          box-shadow: 0 12px 28px rgba(0,0,0,0.5);
        }

        .sites-lang-option {
          appearance: none;
          background: transparent;
          border: 0;
          width: 100%;
          text-align: left;
          padding: 6px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font: inherit;
          font-size: 12px;
          color: var(--stea-text2);
          cursor: pointer;
        }
        .sites-lang-option:hover {
          background: rgba(255,255,255,0.06);
          color: var(--stea-text);
        }
        .sites-lang-option.is-selected {
          color: var(--stea-gold-hi);
          font-weight: 750;
        }

        .sites-account-btn span {
          color: var(--stea-text);
        }

        @media (max-width: 500px) {
          .sites-header-install-text {
            display: none;
          }
          .sites-header-install-btn {
            padding: 5px;
            width: 28px;
            height: 28px;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
}

export default memo(SitesHeader);
