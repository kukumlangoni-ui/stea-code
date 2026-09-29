import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCollection } from "../hooks/useFirestore.js";
import { useMobile } from "../hooks/useMobile.js";
import { routeSearchQuery } from "../utils/searchRouting.js";
import SideRays from "../components/SideRays.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";
const SITES_URL = "https://sites.stea.africa";
const STEA_DAILY_URL = "https://daily.stea.africa";
const STEA_VPN_URL = "https://steavpn.stea.africa";
const HERO_ROTATING_WORDS = [
  { icon: "💰", label: "Earn." },
  { icon: "🛠️", label: "Build." },
  { icon: "💼", label: "Find Jobs" },
];
const HERO_WORD_INTERVAL_MS = 3000;
const STEA360_CONFIG = {
  name: "STEA360",
  status: "preview",
  url: null,
  futureUrl: "https://stea360.stea.africa",
  icon: "/stea360.png",
};

const THEME_VARS = {
  dark: {
    "--home-bg": "#05070d",
    "--home-panel": "rgba(255,255,255,.065)",
    "--home-panel-strong": "rgba(255,255,255,.095)",
    "--home-text": "#ffffff",
    "--home-muted": "rgba(255,255,255,.68)",
    "--home-soft": "rgba(255,255,255,.46)",
    "--home-border": "rgba(245,166,35,.20)",
    "--home-line": "rgba(255,255,255,.10)",
    "--home-shadow": "rgba(0,0,0,.34)",
  },
  light: {
    "--home-bg": "#f8fafc",
    "--home-panel": "#ffffff",
    "--home-panel-strong": "#fffaf0",
    "--home-text": "#101827",
    "--home-muted": "#5f6b7a",
    "--home-soft": "#7b8492",
    "--home-border": "rgba(212,160,23,.22)",
    "--home-line": "rgba(15,23,42,.10)",
    "--home-shadow": "rgba(15,23,42,.08)",
  },
};

const EXPLORE_CATEGORIES = [
  {
    title: "Education",
    status: "COMING SOON",
    tag: "Education",
    desc: "Learning platforms, schools, universities, scholarships and education resources.",
    icon: "🎓",
    color: "#34d399",
  },
  {
    title: "Technology",
    status: "LIVE",
    tag: "Sites",
    desc: "AI, digital tools, tech knowledge, software and useful digital resources.",
    icon: "💻",
    color: "#a855f7",
    path: "/techhub",
    cta: "Explore",
  },
  {
    title: "Marketplace",
    status: "COMING SOON",
    tag: "Duka",
    desc: "STEA commerce and trusted product discovery.",
    icon: "🛍️",
    color: G,
  },
  {
    title: "Creators",
    status: "COMING SOON",
    tag: "Creators",
    desc: "Discover creators from Tanzania and Africa across different categories.",
    icon: "🎬",
    color: "#ef4444",
  },
  {
    title: "Gigs & Kazi",
    status: "COMING SOON",
    tag: "Jobs",
    desc: "Jobs, internships, freelance work and useful opportunities.",
    icon: "💼",
    color: "#3b82f6",
  },
  {
    title: "Sports",
    status: "COMING SOON",
    tag: "Services",
    desc: "Sports news, scores, teams, competitions and useful sports content.",
    icon: "⚽",
    color: "#ec4899",

    cta: "Coming Soon",
  },
];

const UTILITIES = [
  {
    title: "STEA Daily",
    status: "COMING SOON",
    desc: "Daily digital discoveries, information and useful updates.",
    icon: "📰",
    color: "#fb923c",
    cta: "Soon",
  },
  {
    title: "STEA VPN",
    status: "LIVE",
    desc: "Secure internet access powered by STEA.",
    icon: "🛡️",
    color: "#a78bfa",
    url: STEA_VPN_URL,
    cta: "Open",
  },
  {
    title: "STEA Digital Tools",
    status: "COMING SOON",
    desc: "Useful tools and digital utilities from STEA.",
    icon: "🧰",
    color: "#22d3ee",
    cta: "Soon",
  },
];


/* STEA_HERO_ECOSYSTEM_APPS */

const STEA_ECOSYSTEM_APPS = [
  {
    name: "STEA VPN",
    icon: "/stea-apps/stea-vpn.png",
    url: "https://steavpn.stea.africa",
  },
  {
    name: "STEA Daily",
    icon: "/stea-apps/stea-daily.png",
    url: "https://daily.stea.africa",
  },
  {
    name: "STEA360",
    icon: "/stea-apps/stea360.png",
    url: "https://kodi360.stea.africa",
  },
  {
    name: "STEA Sites",
    icon: "/stea-apps/stea-sites.png",
    url: "https://sites.stea.africa",
  },
];

function SteaHeroEcosystem() {
  return (
    <div className="stea-hero-ecosystem">
      <div className="stea-hero-ecosystem-label">
        <span className="stea-hero-ecosystem-dot" />
        Built by STEA
      </div>

      <div className="stea-hero-ecosystem-apps">
        {STEA_ECOSYSTEM_APPS.map((app) => (
          <a
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="stea-hero-ecosystem-app"
          >
            <span className="stea-hero-ecosystem-icon">
              <img
                src={app.icon}
                alt=""
                loading="eager"
                draggable="false"
              />
            </span>

            <span>{app.name}</span>

            <span
              className="stea-hero-ecosystem-arrow"
              aria-hidden="true"
            >
              ↗
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

const W = ({ children, className, style }) => (
  <div className={className} style={{ width: "min(1160px, calc(100% - 32px))", margin: "0 auto", ...style }}>{children}</div>
);

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function goLocal(goPage, path) {
  goPage(path);
}

function Badge({ children, color = G }) {
  return (
    <span className="stea-home-badge" style={{ "--badge-color": color }}>
      {children}
    </span>
  );
}

function Header({ theme, setTheme, goPage }) {
  return (
    <header className="stea-home-header">
      <W
        className="stea-home-header-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <button
          className="stea-home-brand"
          onClick={() => goLocal(goPage, "/")}
          aria-label="STEA Africa home"
        >
          <span className="stea-home-brand-mark">
            <img
              src="/stea-brand/stea-s-logo-transparent-512.png"
              alt=""
              draggable="false"
            />
          </span>

          <span className="stea-home-brand-copy">
            <strong>STEA</strong>
            <span>Africa</span>
          </span>
        </button>

        <nav className="stea-home-nav" aria-label="Homepage navigation">
          <a href="#explore">Explore</a>
          <a href="#home">Ecosystem</a>
          <a href="#about">About</a>
        </nav>

        <div className="stea-home-actions">
          <button
            className="stea-home-icon-btn"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          <button
            className="stea-home-account"
            onClick={() => goLocal(goPage, "profile")}
          >
            <span>Account</span>
            <span className="stea-home-account-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        </div>
      </W>
    </header>
  );
}

function Hero({ goPage, exploreRef }) {
  const [query, setQuery] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeWord = HERO_ROTATING_WORDS[wordIndex];

  useEffect(() => {
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!motionQuery) return undefined;

    const updateMotionPreference = () => {
      setReducedMotion(motionQuery.matches);
    };

    updateMotionPreference();
    motionQuery.addEventListener?.("change", updateMotionPreference);

    return () => {
      motionQuery.removeEventListener?.("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setWordIndex(
        (current) =>
          (current + 1) % HERO_ROTATING_WORDS.length
      );
    }, HERO_WORD_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const submitSearch = (value = query) => {
    const next = value.trim();
    if (!next) return;

    goPage(routeSearchQuery(next), { q: next });
  };

  return (
    <section className="stea-home-hero stea-home-hero-final">
      <div className="stea-final-rays" aria-hidden="true">
        <SideRays
          speed={0.72}
          rayColor1="#F5A623"
          rayColor2="#72A7FF"
          intensity={1.5}
          spread={1.82}
          origin="top-right"
          tilt={-5}
          saturation={1.18}
          blend={0.61}
          falloff={1.42}
          opacity={0.82}
        />
      </div>
      <style>{`
        /* ==================================================
           FINAL STEA HERO — DESKTOP
           ================================================== */

        .stea-home-hero-final {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          min-height: calc(100vh - 66px);

          display: flex;
          align-items: center;
          justify-content: center;

          padding-top: 32px;
          padding-bottom: 48px;

          box-sizing: border-box;
        }

        .stea-home-hero-final .stea-final-rays {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: 1;

          mix-blend-mode: screen;

        }

        .stea-home-hero-final > .stea-wrap,
        .stea-home-hero-final > div:not(.stea-final-rays) {
          position: relative;
          z-index: 10;
        }

        .stea-home-hero-final::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(
              circle at 50% 48%,
              rgba(5, 7, 13, 0.02) 0%,
              rgba(5, 7, 13, 0.025) 38%,
              rgba(5, 7, 13, 0.14) 100%
            );
        }


        .stea-home-hero-final > div {
          width: 100%;
        }

        .stea-home-hero-final > div > div {
          width: 100%;
          text-align: center;
        }

        .stea-home-hero-final .stea-final-title {
          width: 100%;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stea-home-hero-final .stea-final-country {
          display: block;
          width: 100%;

          font-size: clamp(88px, 8.3vw, 142px);
          font-weight: 950;
          line-height: .86;
          letter-spacing: -.065em;

          color: var(--home-text);

          white-space: nowrap;
        }

        .stea-home-hero-final .stea-final-gateway {
          display: flex;
          align-items: center;
          justify-content: center;

          margin-top: 24px;

          font-size: clamp(44px, 4vw, 66px);
          font-weight: 900;
          line-height: .95;
          letter-spacing: -.045em;

          color: var(--home-text);

          white-space: nowrap;
        }

        .stea-home-hero-final .stea-final-gateway::before,
        .stea-home-hero-final .stea-final-gateway::after {
          content: "";

          width: clamp(28px, 3vw, 50px);
          height: 3px;

          margin: 0 20px;

          border-radius: 999px;

          background: #F5A623;

          opacity: .72;

          box-shadow:
            0 0 16px rgba(245,166,35,.20);
        }

        /*
         * Existing rotating words remain untouched.
         * We only control their position in the composition.
         */

        .stea-home-hero-final .stea-hero-word-stage {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 100%;

          min-height: 1.18em;

          margin-top: 20px;

          overflow: hidden;

          color: inherit;

          font-size: clamp(58px, 5.6vw, 86px);
          font-weight: 950;
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .stea-home-hero-final .stea-hero-word {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 0.15em;

          width: 100%;

          white-space: nowrap;
        }

        .stea-home-hero-final .stea-hero-word-icon {
          display: inline-grid;
          place-items: center;

          flex: 0 0 auto;

          line-height: 1;
        }

        .stea-home-hero-final .stea-hero-word-label {
          display: inline-block;
        }

        .stea-home-hero-final .stea-final-description {
          width: min(760px, calc(100% - 40px));

          margin:
            clamp(24px, 2.5vw, 34px)
            auto
            0;

          color: var(--home-muted);

          font-size: clamp(16px, 1.35vw, 19px);
          line-height: 1.65;

          text-align: center;
        }

        /* ==================================================
           PREMIUM SEARCH
           ================================================== */

        .stea-home-hero-final .stea-final-search {
          position: relative;
          z-index: 5;
          width: min(720px, calc(100% - 40px));

          min-height: 58px;

          margin:
            clamp(26px, 2.4vw, 36px)
            auto
            0;

          padding:
            6px
            7px
            6px
            18px;

          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center !important;

          gap: 13px;

          border:
            1px solid
            rgba(245,166,35,.42);

          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.07),
              rgba(255,255,255,.025)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.05),
            0 20px 55px rgba(0,0,0,.24),
            0 0 32px rgba(245,166,35,.035);

          backdrop-filter: none;
          -webkit-backdrop-filter: blur(18px);
        }

        .stea-home-hero-final
        .stea-final-search
        > svg {
          width: 18px;
          height: 18px;

          flex: 0 0 18px;

          color: rgba(255,255,255,.90);
        }

        .stea-home-hero-final
        .stea-final-search
        input {
          flex: 1 1 0 !important;

          width: 0 !important;
          min-width: 0 !important;

          height: 44px;

          padding: 0 !important;
          margin: 0 !important;

          border: 0 !important;
          outline: 0 !important;

          background: transparent !important;

          color: var(--home-text);

          font-size: 15px;
        }

        .stea-home-hero-final
        .stea-final-search
        input::placeholder {
          color: var(--home-soft);
        }

        .stea-home-hero-final
        .stea-final-search
        button {
          flex: 0 0 auto !important;

          width: auto !important;

          min-width: 94px;

          height: 44px;

          margin: 0 !important;
          padding: 0 22px !important;

          border: 0;

          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #F5A623 0%,
              #FFD17C 100%
            );

          color: #111;

          font-size: 13px;
          font-weight: 900;

          cursor: pointer;

          box-shadow:
            0 8px 24px rgba(245,166,35,.24),
            inset 0 1px 0 rgba(255,255,255,.34);

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .stea-home-hero-final
        .stea-final-search
        button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 12px 30px rgba(245,166,35,.31),
            inset 0 1px 0 rgba(255,255,255,.38);
        }

        /* ==================================================
           TABLET
           ================================================== */

        @media (max-width: 900px) {
          .stea-home-hero-final
          .stea-final-country {
            font-size: clamp(68px, 11vw, 98px);
          }

          .stea-home-hero-final
          .stea-final-gateway {
            margin-top: 24px;

            font-size: clamp(34px, 6vw, 52px);
          }
        }

        /* ==================================================
           MOBILE
           ================================================== */

        @media (max-width: 600px) {
          .stea-home-hero-final {
            overflow-x: hidden;

            min-height: calc(100svh - 58px);

            padding-top: 22px;
            padding-bottom: 34px;

            display: flex;
            align-items: center;
            justify-content: center;
          }

          .stea-home-hero-final
          .stea-final-title {
            width: 100%;
          }

          .stea-home-hero-final
          .stea-final-country {
            width: 100%;

            font-size:
              clamp(
                42px,
                13.6vw,
                58px
              );

            line-height: .92;

            letter-spacing: -.055em;

            white-space: nowrap;
          }

          .stea-home-hero-final
          .stea-final-gateway {
            margin-top: 14px;

            font-size:
              clamp(
                25px,
                7.6vw,
                34px
              );

            line-height: 1;

            letter-spacing: -.04em;
          }

          .stea-home-hero-final
          .stea-final-gateway::before,
          .stea-home-hero-final
          .stea-final-gateway::after {
            width: 16px;
            height: 2px;

            margin: 0 8px;
          }

          .stea-home-hero-final
          .stea-hero-word-stage {
            min-height: 1.2em;
            margin-top: 14px;

            display: flex;
            align-items: center;
            justify-content: center;

            overflow: hidden;

            font-size: clamp(34px, 10vw, 46px);
            line-height: 1;
          }

          .stea-home-hero-final
          .stea-hero-word {
            justify-content: center;
            width: 100%;
          }

          .stea-home-hero-final
          .stea-final-description {
            width:
              min(
                92%,
                390px
              );

            margin-top: 20px;

            font-size: 13px;

            line-height: 1.58;
          }

          /*
           * IMPORTANT:
           * MOBILE SEARCH MATCHES DESKTOP.
           *
           * icon | input | Search
           *
           * ONE ROW.
           */

          .stea-home-hero-final
          .stea-final-search {
            width:
              calc(
                100% - 22px
              ) !important;

            max-width: 460px;

            min-height: 52px !important;

            margin:
              24px
              auto
              0 !important;

            padding:
              5px
              6px
              5px
              13px !important;

            display: flex !important;

            flex-direction: row !important;

            flex-wrap: nowrap !important;

            align-items: center !important;

            gap: 8px !important;

            border-radius: 999px !important;
          }

          .stea-home-hero-final
          .stea-final-search
          > svg {
            width: 16px;
            height: 16px;

            flex: 0 0 16px;
          }

          .stea-home-hero-final
          .stea-final-search
          input {
            flex: 1 1 0 !important;

            width: 0 !important;

            min-width: 0 !important;

            height: 40px !important;

            padding: 0 !important;

            font-size: 11.5px !important;

            white-space: nowrap;

            text-overflow: ellipsis;

            overflow: hidden;
          }

          .stea-home-hero-final
          .stea-final-search
          button {
            flex: 0 0 auto !important;

            width: auto !important;

            min-width: 72px !important;

            max-width: none !important;

            height: 40px !important;

            margin: 0 !important;

            padding:
              0
              14px !important;

            border-radius: 999px !important;

            font-size: 11px !important;
          }
        }

        @media (max-width: 370px) {
          .stea-home-hero-final
          .stea-final-country {
            font-size: 39px;
          }

          .stea-home-hero-final
          .stea-final-gateway {
            font-size: 23px;
          }

          .stea-home-hero-final
          .stea-final-gateway::before,
          .stea-home-hero-final
          .stea-final-gateway::after {
            width: 11px;
            margin: 0 6px;
          }

          .stea-home-hero-final
          .stea-final-search {
            width:
              calc(
                100% - 16px
              ) !important;

            gap: 6px !important;

            padding-left: 11px !important;
          }

          .stea-home-hero-final
          .stea-final-search
          button {
            min-width: 65px !important;

            padding:
              0
              11px !important;

            font-size: 10.5px !important;
          }
        }

        /* CLEAN ROTATING HERO WORD — NO GLOW / NO SHADOW */
        .stea-home-hero-final .stea-hero-word,
        .stea-home-hero-final .stea-hero-word-icon,
        .stea-home-hero-final .stea-hero-word-label {
          text-shadow: none !important;
          box-shadow: none !important;
          filter: none !important;
          -webkit-filter: none !important;
        }

        .stea-home-hero-final .stea-hero-word-label {
          background: linear-gradient(135deg, #F5A623 0%, #D98B0B 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }

        .stea-home-hero-final .stea-hero-word-icon {
          opacity: 1;
        }


        /* PREMIUM MOTION RAYS POLISH */
        .stea-home-hero-final .stea-final-rays {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          opacity: 1;
        }

        .stea-home-hero-final .stea-final-rays canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
          opacity: 1;
          transform: scale(1.035);
          transform-origin: top right;
        }

        .stea-home-hero-final::after {
          background:
            radial-gradient(
              circle at 50% 46%,
              rgba(5, 7, 13, 0.00) 0%,
              rgba(5, 7, 13, 0.035) 36%,
              rgba(5, 7, 13, 0.18) 100%
            ) !important;
        }

        @media (max-width: 600px) {
          .stea-home-hero-final .stea-final-rays {
            opacity: .78;
          }

          .stea-home-hero-final .stea-final-rays canvas {
            transform: scale(1.08);
          }

          .stea-home-hero-final::after {
            background:
              radial-gradient(
                circle at 50% 42%,
                rgba(5, 7, 13, 0.00) 0%,
                rgba(5, 7, 13, 0.07) 45%,
                rgba(5, 7, 13, 0.24) 100%
              ) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .stea-home-hero-final .stea-final-rays {
            opacity: .48;
          }
        }

`}</style>

      <W>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="stea-final-title">
            <span className="stea-final-country">
              TANZANIA'S
            </span>

            <span className="stea-final-gateway">
              GATEWAY TO
            </span>

            <span
              className="stea-hero-word-stage"
              aria-live="polite"
            >
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.span
                  key={activeWord.label}
                  className="stea-hero-word"
                  initial={
                    reducedMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 20,
                          filter: "blur(10px)",
                          scale: 0.985,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    scale: 1,
                  }}
                  exit={
                    reducedMotion
                      ? undefined
                      : {
                          opacity: 0,
                          y: -20,
                          filter: "blur(10px)",
                          scale: 0.985,
                        }
                  }
                  transition={{
                    duration: 0.55,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                >
                  <span
                    className="stea-hero-word-icon"
                    aria-hidden="true"
                  >
                    {activeWord.icon}
                  </span>

                  <span className="stea-hero-word-label">
                    {activeWord.label}
                  </span>
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="stea-final-description">
            Discover useful websites, education,
            opportunities, creators and STEA apps
            from one place.
          </p>

          <form
            className="stea-home-search stea-final-search"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <Search size={18} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search websites, resources, opportunities..."
              aria-label="Search STEA"
            />

            <button type="submit">
              Search
            </button>
          </form>
        </motion.div>

          <SteaHeroEcosystem />
</W>
    </section>
  );
}

function SectionHead({ label, title, desc, actionText, onAction }) {
  return (
    <div className="stea-section-head">
      <div>
        <Badge>{label}</Badge>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {actionText && (
        <button onClick={onAction}>
          {actionText} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function ExploreCard({ item, goPage }) {
  const live = item.status === "LIVE";
  const handleClick = () => {
    if (!live) return;
    if (item.url) openExternal(item.url);
    else if (item.path) goLocal(goPage, item.path);
  };
  return (
    <button
      className={`stea-card ${live ? "is-live" : "is-disabled"}`}
      onClick={handleClick}
      disabled={!live}
      style={{ "--accent": item.color }}
    >
      <div className="stea-card-top">
        <span className="stea-card-icon" aria-hidden="true">{item.icon}</span>
        <span className="stea-status">{item.tag}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.desc}</p>
      <span className="stea-card-cta">
        <span>{live ? item.cta : "Coming Soon"} {live && <ChevronRight size={15} />}</span>
        <span className="stea-card-arrow">→</span>
      </span>
    </button>
  );
}

function UtilityCard({ item, goPage }) {
  const live = item.status === "LIVE";
  const handleClick = () => {
    if (!live) return;
    if (item.url) openExternal(item.url);
    else if (item.path) goLocal(goPage, item.path);
  };

  return (
    <button
      className={`stea-utility-card ${live ? "is-live" : "is-disabled"}`}
      onClick={handleClick}
      disabled={!live}
      style={{ "--accent": item.color }}
    >
      <span className="stea-utility-icon" aria-hidden="true">
        <span className="stea-icon-glow" />
        <span className="stea-icon-plate">{item.icon}</span>
      </span>
      <div>
        <div className="stea-utility-meta">
          <span>{item.status}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
      </div>
      <span className="stea-utility-cta">{item.cta} {live && <ChevronRight size={15} />}</span>
    </button>
  );
}

function WebsiteCard({ item }) {
  const title = item.title || item.name || "Useful website";
  const desc = item.description || item.summary || item.content || "A useful online destination curated by STEA.";
  const image = item.imageUrl || item.image || item.images?.[0];

  return (
    <article className="stea-website-card">
      {image ? <img src={image} alt="" loading="lazy" /> : <div className="stea-website-fallback"><Globe size={28} /></div>}
      <div>
        <span>{item.category || item.categoryName || "Website"}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </article>
  );
}


function SteaUtilitiesStrip() {
  const apps = [
    {
      name: "STEA Daily",
      description: "Daily tech tips & discoveries",
      icon: "📰",
      status: "COMING SOON",
      tone: "gold",
      url: "https://daily.stea.africa",
    },
    {
      name: "STEA VPN",
      description: "Private & secure internet",
      icon: "🛡️",
      status: "LIVE",
      tone: "purple",
      url: STEA_VPN_URL,
    },
    {
      name: "STEA360",
      description: "AI powered by STEA",
      iconImage: "/stea360.png",
      status: "PREVIEW",
      tone: "blue",
      url: STEA360_CONFIG.url || STEA360_CONFIG.futureUrl,
    },
    {
      name: "Digital Tools",
      description: "Useful STEA utilities",
      icon: "🧰",
      status: "COMING SOON",
      tone: "cyan",
      url: null,
    },
  ];

  const handleUtilityClick = (app) => {
    if (!app.url) return;
    openExternal(app.url);
  };

  return (
    <section
      id="apps"
      className="stea-mini-apps-section"
      aria-labelledby="stea-mini-apps-title"
    >
      <W>
        <div className="stea-mini-apps-head">
          <div>
            <span className="stea-mini-apps-kicker">
              STEA UTILITIES
            </span>

            <h2 id="stea-mini-apps-title">
              STEA Apps
            </h2>

            <p>
              Quick access to useful products built by STEA.
            </p>
          </div>
        </div>

        <div className="stea-mini-apps-scroll">
          <div className="stea-mini-apps-track">
            {apps.map((app) => {
              const clickable = Boolean(app.url);

              return (
                <button
                  key={app.name}
                  type="button"
                  className={`stea-mini-app stea-mini-app-${app.tone} ${
                    clickable ? "is-clickable" : "is-disabled"
                  }`}
                  onClick={() => handleUtilityClick(app)}
                  disabled={!clickable}
                  aria-label={
                    clickable
                      ? `Open ${app.name}`
                      : `${app.name} coming soon`
                  }
                >
                  <div className="stea-mini-app-icon-shell">
                    <div className="stea-mini-app-icon">
                      {app.iconImage ? (
                        <img
                          src={app.iconImage}
                          alt=""
                          draggable="false"
                        />
                      ) : (
                        <span aria-hidden="true">
                          {app.icon}
                        </span>
                      )}
                    </div>

                    <span className="stea-mini-app-light" />
                  </div>

                  <div className="stea-mini-app-copy">
                    <div className="stea-mini-app-title-row">
                      <strong>{app.name}</strong>

                      <span className="stea-mini-app-status">
                        {app.status}
                      </span>
                    </div>

                    <span className="stea-mini-app-description">
                      {app.description}
                    </span>
                  </div>

                  <span
                    className="stea-mini-app-arrow"
                    aria-hidden="true"
                  >
                    {clickable ? "›" : "•"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </W>

      <style>{`
        /* ================================================
           STEA UTILITIES — PREMIUM MINI APP STRIP
           ================================================ */

        .stea-mini-apps-section {
          position: relative;
          padding: 34px 0 46px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 14% 0%,
              rgba(245,166,35,.055),
              transparent 30%
            ),
            radial-gradient(
              circle at 78% 10%,
              rgba(91,124,255,.045),
              transparent 28%
            );
        }

        .stea-mini-apps-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .stea-mini-apps-kicker {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 9px;

          border: 1px solid rgba(245,166,35,.26);
          border-radius: 999px;

          background: rgba(245,166,35,.075);
          color: #F5A623;

          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .stea-mini-apps-head h2 {
          margin: 9px 0 0;

          color: var(--home-text);
          font-size: clamp(25px, 3vw, 34px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.035em;
        }

        .stea-mini-apps-head p {
          margin: 8px 0 0;
          color: var(--home-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .stea-mini-apps-scroll {
          width: 100%;
        }

        .stea-mini-apps-track {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 11px;
        }

        .stea-mini-app {
          --app-rgb: 245,166,35;

          position: relative;
          min-width: 0;
          min-height: 94px;

          display: grid;
          grid-template-columns:
            48px minmax(0,1fr) 24px;
          align-items: center;
          gap: 12px;

          padding: 13px 12px 13px 13px;

          overflow: hidden;

          text-align: left;
          font: inherit;

          border:
            1px solid rgba(var(--app-rgb),.20);

          border-radius: 20px;

          background:
            radial-gradient(
              circle at 10% 25%,
              rgba(var(--app-rgb),.115),
              transparent 42%
            ),
            linear-gradient(
              145deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.025)
            );

          color: var(--home-text);

          box-shadow:
            0 16px 40px rgba(0,0,0,.16),
            inset 0 1px 0 rgba(255,255,255,.055);

          backdrop-filter:
            blur(18px) saturate(135%);

          -webkit-backdrop-filter:
            blur(18px) saturate(135%);

          transition:
            transform .22s cubic-bezier(.2,.8,.2,1),
            border-color .22s ease,
            box-shadow .22s ease,
            background .22s ease;
        }

        .stea-mini-app-gold {
          --app-rgb: 245,166,35;
        }

        .stea-mini-app-purple {
          --app-rgb: 157,118,255;
        }

        .stea-mini-app-blue {
          --app-rgb: 75,139,255;
        }

        .stea-mini-app-cyan {
          --app-rgb: 34,211,238;
        }

        .stea-mini-app.is-clickable {
          cursor: pointer;
        }

        .stea-mini-app.is-disabled {
          cursor: default;
          opacity: .82;
        }

        .stea-mini-app:not(:disabled):hover {
          transform: translateY(-4px);

          border-color:
            rgba(var(--app-rgb),.48);

          box-shadow:
            0 20px 48px rgba(0,0,0,.24),
            0 0 32px rgba(var(--app-rgb),.08),
            inset 0 1px 0 rgba(255,255,255,.08);
        }

        .stea-mini-app::after {
          content: "";
          position: absolute;
          width: 110px;
          height: 110px;

          left: -45px;
          top: -55px;

          border-radius: 999px;

          background:
            radial-gradient(
              circle,
              rgba(var(--app-rgb),.16),
              transparent 68%
            );

          pointer-events: none;
        }

        .stea-mini-app-icon-shell {
          position: relative;

          width: 48px;
          height: 48px;

          display: grid;
          place-items: center;

          isolation: isolate;
        }

        .stea-mini-app-icon {
          position: relative;
          z-index: 2;

          width: 44px;
          height: 44px;

          display: grid;
          place-items: center;

          border:
            1px solid rgba(var(--app-rgb),.34);

          border-radius: 14px;

          background:
            linear-gradient(
              145deg,
              rgba(var(--app-rgb),.16),
              rgba(8,10,16,.84)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            0 8px 22px rgba(0,0,0,.22);
        }

        .stea-mini-app-icon span {
          display: block;

          font-size: 25px;
          line-height: 1;

          transform: translateY(-1px);

          filter:
            saturate(1.06)
            contrast(1.02);
        }

        .stea-mini-app-icon img {
          width: 34px;
          height: 34px;

          display: block;
          object-fit: contain;

          user-select: none;
          -webkit-user-drag: none;
        }

        .stea-mini-app-light {
          position: absolute;
          z-index: 1;

          width: 52px;
          height: 52px;

          border-radius: 999px;

          background:
            rgba(var(--app-rgb),.18);

          filter: blur(15px);
          opacity: .70;
        }

        .stea-mini-app-copy {
          position: relative;
          z-index: 2;

          min-width: 0;
        }

        .stea-mini-app-title-row {
          display: flex;
          align-items: center;
          gap: 7px;

          min-width: 0;
        }

        .stea-mini-app-title-row strong {
          min-width: 0;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: var(--home-text);

          font-size: 14px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -.015em;
        }

        .stea-mini-app-status {
          flex: 0 0 auto;

          padding: 3px 6px;

          border:
            1px solid rgba(var(--app-rgb),.22);

          border-radius: 999px;

          background:
            rgba(var(--app-rgb),.10);

          color:
            rgb(var(--app-rgb));

          font-size: 7px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .stea-mini-app-description {
          display: block;

          margin-top: 5px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color: var(--home-muted);

          font-size: 10.5px;
          line-height: 1.3;
          font-weight: 600;
        }

        .stea-mini-app-arrow {
          position: relative;
          z-index: 2;

          width: 24px;
          height: 24px;

          display: grid;
          place-items: center;

          border:
            1px solid rgba(var(--app-rgb),.17);

          border-radius: 8px;

          background:
            rgba(var(--app-rgb),.07);

          color:
            rgb(var(--app-rgb));

          font-size: 19px;
          line-height: 1;
          font-weight: 600;

          transition:
            transform .18s ease,
            background .18s ease;
        }

        .stea-mini-app:not(:disabled):hover
        .stea-mini-app-arrow {
          transform: translateX(2px);

          background:
            rgba(var(--app-rgb),.13);
        }

        @media (max-width: 920px) {
          .stea-mini-apps-track {
            grid-template-columns:
              repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 620px) {
          .stea-mini-apps-section {
            padding:
              25px 0
              calc(
                96px +
                env(safe-area-inset-bottom)
              );
          }

          .stea-mini-apps-head {
            margin-bottom: 13px;
          }

          .stea-mini-apps-head h2 {
            font-size: 24px;
          }

          .stea-mini-apps-head p {
            font-size: 11px;
          }

          .stea-mini-apps-scroll {
            width:
              calc(100% + 16px);

            overflow-x: auto;
            overflow-y: hidden;

            padding: 1px 16px 11px 0;

            scrollbar-width: none;

            overscroll-behavior-inline:
              contain;

            scroll-snap-type:
              x proximity;

            -webkit-overflow-scrolling:
              touch;
          }

          .stea-mini-apps-scroll::-webkit-scrollbar {
            display: none;
          }

          .stea-mini-apps-track {
            display: flex;

            width: max-content;

            gap: 9px;
          }

          .stea-mini-app {
            flex:
              0 0
              min(
                78vw,
                278px
              );

            min-height: 82px;

            grid-template-columns:
              43px minmax(0,1fr) 22px;

            gap: 9px;

            padding:
              11px 10px;

            border-radius:
              17px;

            scroll-snap-align:
              start;
          }

          .stea-mini-app-icon-shell {
            width: 43px;
            height: 43px;
          }

          .stea-mini-app-icon {
            width: 40px;
            height: 40px;

            border-radius:
              12px;
          }

          .stea-mini-app-icon span {
            font-size: 22px;
          }

          .stea-mini-app-icon img {
            width: 31px;
            height: 31px;
          }

          .stea-mini-app-title-row strong {
            font-size: 13px;
          }

          .stea-mini-app-description {
            font-size: 9.5px;
          }

          .stea-mini-app-status {
            padding: 3px 5px;
            font-size: 6.5px;
          }

          .stea-mini-app-arrow {
            width: 22px;
            height: 22px;

            border-radius: 7px;

            font-size: 17px;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .stea-mini-app,
          .stea-mini-app-arrow {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function FeaturedWebsites({ websites, loading }) {
  if (!loading && websites.length === 0) return null;

  return (
    <section className="stea-home-section">
      <W>
        <SectionHead
          label="Powered by STEA Sites"
          title="Featured Websites"
          desc="A small curated preview of what users can discover through STEA Sites."
          actionText="Explore All Websites"
          onAction={() => openExternal(SITES_URL)}
        />
        <div className="stea-websites-grid">
          {loading
            ? [1, 2, 3].map((key) => <div key={key} className="stea-website-card is-loading" />)
            : websites.map((item) => <WebsiteCard key={item.id} item={item} />)}
        </div>
      </W>
    </section>
  );
}

function Footer({ goPage }) {
  return (
    <footer className="stea-home-footer">
      <W className="stea-home-footer-inner">
        <div className="stea-footer-brand">
          <img src="/stea-brand/stea-s-logo-transparent-512.png" alt="" />
          <strong>STEA</strong>
          <p>STEA connects people with useful digital destinations, products and opportunities across the ecosystem.</p>
        </div>
        <div className="stea-footer-groups">
          <div>
            <h3>Explore</h3>
            <a href={SITES_URL}>Websites</a>
            <span>Education <em>Coming Soon</em></span>
            <span>Gigs & Kazi <em>Coming Soon</em></span>
            <span>Creators <em>Coming Soon</em></span>
          </div>
          <div>
            <h3>STEA Apps</h3>
            <a href={SITES_URL}>STEA Sites</a>
            <a href={STEA_VPN_URL}>STEA VPN</a>
            <span>STEA360 <em>Preview</em></span>
            <span>STEA Daily <em>Coming Soon</em></span>
          </div>
          <div>
            <h3>Company</h3>
            <button type="button" onClick={() => goLocal(goPage, "about")}>About</button>
            <button type="button" onClick={() => goLocal(goPage, "contact")}>Contact</button>
            <button type="button" onClick={() => goLocal(goPage, "privacy")}>Privacy</button>
            <button type="button" onClick={() => goLocal(goPage, "terms")}>Terms</button>
          </div>
        </div>
      </W>
    </footer>
  );
}

export default function HomePage({ goPage }) {
  const isMobile = useMobile();
  const exploreRef = useRef(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("stea_home_theme") || "dark");
  const { docs: websiteDocs, loading: websitesLoading } = useCollection("websites", "createdAt", 3);
  const websites = useMemo(
    () => (websiteDocs || []).filter((item) => !["draft", "rejected", "pending_review"].includes(item.status)).slice(0, 3),
    [websiteDocs],
  );

  useEffect(() => {
    localStorage.setItem("stea_home_theme", theme);
    window.dispatchEvent(new CustomEvent("stea-theme-change", { detail: theme }));
  }, [theme]);

  return (
    <div className={`stea-home stea-home-${theme}`} style={{ ...THEME_VARS[theme], paddingBottom: isMobile ? 72 : 0 }}>
      <Header theme={theme} setTheme={setTheme} goPage={goPage} />
      <Hero goPage={goPage} exploreRef={exploreRef} />

      <section id="explore" ref={exploreRef} className="stea-home-section">
        <W>
          <SectionHead
            label="Explore STEA"
            title="Explore STEA"
            desc="Discover the main areas STEA is organizing for Tanzania, Africa and useful global resources."
          />
          <div className="stea-grid">
            {EXPLORE_CATEGORIES.map((item) => <ExploreCard key={item.title} item={item} goPage={goPage} />)}
          </div>
        </W>
      </section>




      <FeaturedWebsites websites={websites} loading={websitesLoading} />

      <section id="about" className="stea-home-about">
        <W>
          <div>
            <Badge>What STEA Does</Badge>
            <h2>A practical gateway, not a crowded portal.</h2>
            <p>
              STEA organizes, verifies and points people toward useful digital destinations:
              websites, learning resources, jobs, creators, tools and STEA apps. The focus starts
              in Tanzania, expands across East Africa and Africa, and includes worldwide resources
              when they are useful.
            </p>
          </div>
        </W>
      </section>

      <Footer goPage={goPage} />
      <style>{`
        .stea-home{min-height:100vh;background:var(--home-bg);color:var(--home-text);font-family:'Instrument Sans',system-ui,sans-serif;overflow-x:hidden}
        .stea-home *{box-sizing:border-box}
        .stea-home-header{
          position:sticky;
          top:0;
          z-index:900;
          padding:10px 0;
          isolation:isolate;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb,var(--home-bg) 95%,transparent),
              color-mix(in srgb,var(--home-bg) 88%,transparent)
            );
          backdrop-filter:blur(22px) saturate(1.15);
          -webkit-backdrop-filter:blur(22px) saturate(1.15);
          border-bottom:1px solid rgba(255,255,255,.075);
          box-shadow:
            0 10px 34px rgba(0,0,0,.20),
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .stea-home-header::before{
          content:"";
          position:absolute;
          inset:0 0 auto;
          height:1px;
          pointer-events:none;
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(245,166,35,.10) 22%,
              rgba(245,166,35,.38) 50%,
              rgba(245,166,35,.10) 78%,
              transparent 100%
            );
        }

        .stea-home-header-inner{
          min-height:48px;
        }

        .stea-home-brand,
        .stea-home-icon-btn,
        .stea-home-account,
        .stea-section-head button,
        .stea-home-primary,
        .stea-home-secondary,
        .stea-home-chips button,
        .stea-card,
        .stea-app-card{
          font:inherit;
        }

        .stea-home-brand{
          display:inline-flex;
          align-items:center;
          gap:10px;
          min-width:0;
          padding:3px 5px 3px 3px;
          border:0;
          background:transparent;
          color:var(--home-text);
          cursor:pointer;
          text-align:left;
        }

        .stea-home-brand-mark{
          position:relative;
          display:grid;
          place-items:center;
          width:40px;
          height:40px;
          flex:0 0 40px;
          border-radius:13px;
        }

        .stea-home-brand-mark::before{
          content:"";
          position:absolute;
          inset:5px;
          border-radius:999px;
          background:rgba(245,166,35,.14);
          filter:blur(12px);
          opacity:.66;
        }

        .stea-home-brand img{
          position:relative;
          z-index:1;
          width:36px;
          height:36px;
          object-fit:contain;
          filter:drop-shadow(0 6px 12px rgba(0,0,0,.30));
        }

        .stea-home-brand-copy{
          display:flex;
          align-items:baseline;
          gap:5px;
          white-space:nowrap;
          line-height:1;
        }

        .stea-home-brand-copy strong{
          color:var(--home-text);
          font-size:15px;
          font-weight:950;
          letter-spacing:-.01em;
        }

        .stea-home-brand-copy > span{
          color:var(--home-text);
          font-size:15px;
          font-weight:760;
        }

        .stea-home-nav{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:3px;
          padding:4px;
          border:1px solid rgba(255,255,255,.065);
          border-radius:999px;
          background:rgba(255,255,255,.025);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            0 8px 24px rgba(0,0,0,.10);
        }

        .stea-home-nav a{
          position:relative;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-height:34px;
          padding:0 14px;
          border-radius:999px;
          color:var(--home-muted);
          font-size:12.5px;
          font-weight:850;
          text-decoration:none;
          white-space:nowrap;
          transition:
            color .2s ease,
            background .2s ease,
            transform .2s ease;
        }

        .stea-home-nav a::after{
          content:"";
          position:absolute;
          left:50%;
          bottom:5px;
          width:4px;
          height:4px;
          border-radius:999px;
          background:${G};
          opacity:0;
          transform:translate(-50%,4px) scale(.6);
          transition:
            opacity .2s ease,
            transform .2s ease;
        }

        .stea-home-nav a:hover{
          color:var(--home-text);
          background:rgba(255,255,255,.055);
          transform:translateY(-1px);
        }

        .stea-home-nav a:hover::after{
          opacity:.92;
          transform:translate(-50%,0) scale(1);
        }

        .stea-home-actions{
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:8px;
        }

        .stea-home-icon-btn,
        .stea-home-account{
          height:40px;
          border:1px solid rgba(255,255,255,.09);
          color:var(--home-text);
          cursor:pointer;
          transition:
            transform .2s ease,
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .stea-home-icon-btn{
          width:40px;
          flex:0 0 40px;
          display:grid;
          place-items:center;
          border-radius:999px;
          background:rgba(255,255,255,.045);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
        }

        .stea-home-icon-btn:hover{
          transform:translateY(-1px);
          border-color:rgba(245,166,35,.24);
          background:rgba(245,166,35,.075);
        }

        .stea-home-account{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          min-width:94px;
          padding:0 15px;
          border-radius:999px;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.075),
              rgba(255,255,255,.032)
            );
          font-size:12.5px;
          font-weight:900;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.05),
            0 8px 22px rgba(0,0,0,.15);
        }

        .stea-home-account-arrow{
          color:${G};
          font-size:11px;
          opacity:.8;
          transform:translateY(-1px);
          transition:transform .2s ease;
        }

        .stea-home-account:hover{
          transform:translateY(-1px);
          border-color:rgba(245,166,35,.28);
          background:
            linear-gradient(
              135deg,
              rgba(245,166,35,.10),
              rgba(255,255,255,.045)
            );
          box-shadow:
            0 12px 28px rgba(0,0,0,.22),
            inset 0 1px 0 rgba(255,255,255,.06);
        }

        .stea-home-account:hover .stea-home-account-arrow{
          transform:translate(2px,-2px);
        }
        .stea-home-hero:not(.stea-home-hero-final){position:relative;padding:clamp(74px,9vw,118px) 0 clamp(44px,5vw,64px);text-align:center;background:radial-gradient(circle at 50% 0%,rgba(245,166,35,.17),transparent 38%),radial-gradient(circle at 15% 20%,rgba(168,85,247,.08),transparent 32%),linear-gradient(180deg,rgba(255,255,255,.045),transparent)}
        .stea-home-badge{display:inline-flex;align-items:center;width:max-content;max-width:100%;padding:6px 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--badge-color,${G}) 36%,transparent);background:color-mix(in srgb,var(--badge-color,${G}) 13%,transparent);color:var(--badge-color,${G});font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}
        .stea-home-hero:not(.stea-home-hero-final) h1{max-width:920px;margin:18px auto 16px;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:clamp(46px,8vw,90px);line-height:.98;letter-spacing:0;font-weight:950;text-transform:uppercase}
        .stea-home-hero:not(.stea-home-hero-final) h1 .stea-hero-word-stage{position:relative;display:flex;align-items:center;justify-content:center;width:100%;min-height:1.08em;overflow:hidden;background:none;color:inherit}
        .stea-hero-word{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.15em;white-space:nowrap}
        .stea-hero-word-icon{display:inline-grid;place-items:center;font-size:.78em;line-height:1;color:${G};filter:none;-webkit-text-fill-color:initial}
        .stea-hero-word-label{display:inline-block;background:linear-gradient(135deg,${G},#b7790f);-webkit-background-clip:text;background-clip:text;color:transparent}
        .stea-home-hero:not(.stea-home-hero-final) p{max-width:760px;margin:0 auto 24px;color:var(--home-muted);font-size:clamp(15px,1.7vw,18px);line-height:1.62}
        .stea-home-search{width:min(610px,100%);margin:22px auto 0;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:8px 8px 8px 16px;border:1px solid var(--home-border);border-radius:999px;background:rgba(255,255,255,.06);box-shadow:0 18px 54px var(--home-shadow)}
        .stea-home-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--home-text);font-size:15px}
        .stea-home-search button,.stea-home-primary{border:0;border-radius:999px;background:linear-gradient(135deg,${G},${G2});color:#111827;font-weight:950;cursor:pointer}
        .stea-home-search button{height:38px;padding:0 18px;font-size:13px}
        .stea-home-hero-ctas{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}
        .stea-home-secondary{border:1px solid var(--home-line);background:var(--home-panel);color:var(--home-muted);border-radius:999px;cursor:pointer;font-weight:850}
        .stea-home-primary,.stea-home-secondary{min-height:46px;padding:0 18px;display:inline-flex;align-items:center;gap:8px}
        .stea-home-secondary{color:var(--home-text)}
        .stea-home-section{padding:clamp(34px,4.6vw,56px) 0;border-top:1px solid var(--home-line)}
        .stea-home-section-tint{background:rgba(245,166,35,.025)}
        .stea-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:22px}
        .stea-section-head h2,.stea-home-about h2{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:clamp(24px,3vw,34px);line-height:1.1;letter-spacing:0;margin:10px 0 7px;font-weight:950}
        .stea-section-head p,.stea-home-about p{max-width:700px;margin:0;color:var(--home-muted);font-size:15px;line-height:1.7}
        .stea-section-head button{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--home-border);background:var(--home-panel);color:var(--home-text);border-radius:999px;padding:11px 15px;font-weight:900;cursor:pointer;white-space:nowrap}
        .stea-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .stea-card{position:relative;text-align:left;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--home-line));background:radial-gradient(circle at 88% 8%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 38%),radial-gradient(circle at 0 100%,color-mix(in srgb,var(--accent) 8%,transparent),transparent 42%),linear-gradient(145deg,var(--home-panel-strong),var(--home-panel));color:var(--home-text);border-radius:26px;padding:28px;min-height:224px;display:flex;flex-direction:column;gap:0;box-shadow:0 4px 24px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.07),inset 0 -1px 0 rgba(0,0,0,.10);overflow:hidden;transition:transform .24s ease,border-color .24s ease,box-shadow .24s ease}
        .stea-card::before{content:"";position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);pointer-events:none}
        .stea-card::after{content:"";position:absolute;right:-38px;top:-38px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 18%,transparent),transparent 68%);filter:blur(28px);opacity:.48;pointer-events:none;transition:opacity .24s ease}
        .stea-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .stea-card.is-live{cursor:pointer}
        .stea-card.is-disabled{cursor:default;opacity:.96}
        .stea-card-icon{position:relative;z-index:1;width:60px;height:60px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 15%,transparent),color-mix(in srgb,var(--accent) 4%,transparent));border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);box-shadow:0 8px 24px color-mix(in srgb,var(--accent) 12%,transparent);font-size:30px;line-height:1;filter:saturate(1.08) drop-shadow(0 7px 12px rgba(0,0,0,.30));transition:transform .24s ease,box-shadow .24s ease}
        .stea-icon-glow{position:absolute;inset:5px;border-radius:9px;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.34),transparent 30%),radial-gradient(circle at 70% 85%,color-mix(in srgb,var(--accent) 24%,transparent),transparent 54%);filter:blur(.2px);opacity:.86;z-index:-1}
        .stea-icon-plate{position:relative;z-index:1;display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.02));box-shadow:inset 0 1px 0 rgba(255,255,255,.20)}
        .stea-icon-plate svg{width:20px;height:20px;stroke-width:2.25;filter:drop-shadow(0 5px 10px color-mix(in srgb,var(--accent) 34%,transparent))}
        .stea-status{width:max-content;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);color:var(--accent);font-size:9px;font-weight:950;letter-spacing:.08em;padding:4px 8px;text-transform:uppercase}
        .stea-card h3{position:relative;z-index:1;margin:22px 0 8px;font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:22px;line-height:1.15;font-weight:950;letter-spacing:0}
        .stea-website-card h3,.stea-utility-card h3{margin:0;font-size:18px;line-height:1.18;font-weight:950;letter-spacing:0}
        .stea-card p{position:relative;z-index:1;margin:0 0 22px;color:var(--home-muted);line-height:1.7;font-size:13.5px}
        .stea-website-card p,.stea-utility-card p{margin:0;color:var(--home-muted);line-height:1.5;font-size:13px}
        .stea-card-cta{position:relative;z-index:1;margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--accent);font-size:13px;font-weight:850}
        .stea-card-cta span:first-child{display:inline-flex;align-items:center;gap:5px}
        .stea-card-arrow{width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 16%,transparent);display:grid!important;place-items:center;color:var(--accent);opacity:.58;transition:opacity .2s ease,transform .2s ease}
        .stea-utility-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .stea-utility-card{min-height:118px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--home-line));background:linear-gradient(180deg,var(--home-panel-strong),var(--home-panel));color:var(--home-text);border-radius:8px;padding:15px;display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;text-align:left;box-shadow:0 12px 28px var(--home-shadow)}
        .stea-utility-card.is-live{cursor:pointer}.stea-utility-card.is-disabled{cursor:default;opacity:.9}
        .stea-utility-icon{position:relative;width:42px;height:42px;border-radius:10px;display:grid;place-items:center;isolation:isolate;color:var(--accent);background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 19%,rgba(255,255,255,.12)),rgba(255,255,255,.035) 52%,rgba(0,0,0,.18));border:1px solid color-mix(in srgb,var(--accent) 34%,rgba(255,255,255,.14));box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -12px 20px rgba(0,0,0,.18),0 12px 28px color-mix(in srgb,var(--accent) 16%,transparent)}
        .stea-utility-meta span{display:inline-flex;margin-bottom:6px;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);color:var(--accent);font-size:9px;font-weight:950;letter-spacing:.08em;padding:4px 8px;text-transform:uppercase}
        .stea-utility-cta{display:flex;align-items:center;gap:4px;color:var(--accent);font-size:12px;font-weight:950}
        .stea-websites-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .stea-website-card{min-height:100%;overflow:hidden;border:1px solid var(--home-line);border-radius:8px;background:var(--home-panel);box-shadow:0 12px 30px var(--home-shadow)}
        .stea-website-card img,.stea-website-fallback{width:100%;aspect-ratio:16/9;display:grid;place-items:center;object-fit:cover;background:linear-gradient(135deg,rgba(96,165,250,.18),rgba(245,166,35,.14))}
        .stea-website-card div:last-child{padding:16px}
        .stea-website-card span{display:block;margin-bottom:8px;color:${G};font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}
        .stea-website-card.is-loading{min-height:220px;background:linear-gradient(90deg,var(--home-panel),var(--home-panel-strong),var(--home-panel));animation:pulse 1.2s ease-in-out infinite}
        .stea-home-about{padding:clamp(32px,4.6vw,54px) 0;border-top:1px solid var(--home-line);background:linear-gradient(135deg,rgba(245,166,35,.06),rgba(96,165,250,.035))}
        .stea-home-about .stea-home-badge{margin-bottom:4px}
        .stea-home-footer{padding:34px 0;border-top:1px solid var(--home-line);background:rgba(0,0,0,.12)}
        .stea-home-footer-inner{display:grid;grid-template-columns:minmax(240px,1fr) minmax(0,1.6fr);gap:28px;align-items:start}
        .stea-footer-brand strong{font-size:18px}
        .stea-home-footer img{width:34px;height:34px;object-fit:contain;vertical-align:middle;margin-right:8px}
        .stea-home-footer p{max-width:520px;margin:8px 0 0;color:var(--home-muted);font-size:13px;line-height:1.6}
        .stea-footer-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .stea-footer-groups h3{margin:0 0 10px;color:var(--home-text);font-size:12px;text-transform:uppercase;letter-spacing:.08em}
        .stea-footer-groups a,.stea-footer-groups span,.stea-footer-groups button{display:block;width:max-content;max-width:100%;margin:0 0 8px;padding:0;border:0;background:transparent;color:var(--home-muted);font:inherit;font-size:13px;font-weight:800;text-align:left;text-decoration:none}
        .stea-footer-groups button,.stea-footer-groups a{cursor:pointer}
        .stea-footer-groups em{font-style:normal;color:${G};font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        .stea-card.is-live:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 42%,var(--home-line));box-shadow:0 22px 54px rgba(0,0,0,.42),0 0 0 1px color-mix(in srgb,var(--accent) 14%,transparent),inset 0 1px 0 rgba(255,255,255,.12)}
        .stea-card.is-live:hover::after{opacity:.82}.stea-card.is-live:hover .stea-card-icon{transform:scale(1.06);box-shadow:0 10px 28px color-mix(in srgb,var(--accent) 22%,transparent)}.stea-card.is-live:hover .stea-card-arrow{opacity:1;transform:translateX(2px)}
        @keyframes pulse{0%,100%{opacity:.72}50%{opacity:1}}
        @media (max-width:920px){.stea-grid,.stea-websites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stea-utility-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stea-home-nav{display:none}.stea-section-head{align-items:flex-start;flex-direction:column}.stea-section-head button{width:max-content}}
        @media (max-width:620px){.stea-home-header{padding:7px 0}.stea-home-header-inner{min-height:46px}.stea-home-brand{gap:6px}.stea-home-brand-mark{width:36px;height:36px;flex-basis:36px}.stea-home-brand img{width:32px;height:32px}.stea-home-brand-copy strong,.stea-home-brand-copy>span{font-size:13px}.stea-home-icon-btn{width:38px;height:38px;flex-basis:38px}.stea-home-account{display:none}.stea-home-hero:not(.stea-home-hero-final){text-align:left;padding-top:54px}.stea-home-hero:not(.stea-home-hero-final) .stea-home-badge{width:auto}.stea-home-hero:not(.stea-home-hero-final) h1 .stea-hero-word-stage{justify-content:flex-start}.stea-home-hero:not(.stea-home-hero-final) .stea-hero-word{justify-content:flex-start}.stea-home-hero:not(.stea-home-hero-final) .stea-hero-word-icon{font-size:.68em}.stea-home-hero:not(.stea-home-hero-final) .stea-home-search{grid-template-columns:auto 1fr;border-radius:8px;padding:12px}.stea-home-hero:not(.stea-home-hero-final) .stea-home-search button{grid-column:1 / -1;width:100%;height:40px}.stea-home-hero-ctas{justify-content:flex-start}.stea-home-primary,.stea-home-secondary{width:100%;justify-content:center}.stea-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.stea-websites-grid{grid-template-columns:1fr}.stea-grid .stea-card{min-width:0;min-height:168px;padding:14px;border-radius:18px}.stea-grid .stea-card-icon{width:40px;height:40px;border-radius:13px;font-size:21px}.stea-grid .stea-card h3{margin-top:12px;font-size:15px;line-height:1.08}.stea-grid .stea-card p{font-size:10.5px;line-height:1.4;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.stea-grid .stea-card .stea-home-badge{padding:4px 7px;font-size:7px;letter-spacing:.055em;white-space:nowrap}.stea-grid .stea-card [class*="cta"],.stea-grid .stea-card>a,.stea-grid .stea-card>button{font-size:10px}.stea-grid .stea-card>*{min-width:0}.stea-utility-card{grid-template-columns:auto 1fr;align-items:start}.stea-utility-cta{grid-column:2}.stea-home-footer-inner,.stea-footer-groups{display:block}.stea-footer-groups{margin-top:22px}.stea-footer-groups div{margin-top:18px}}
        @media (prefers-reduced-motion:reduce){.stea-home *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}

        /* ==================================================
           PREMIUM STEA APP CARDS
           Daily / VPN / Digital Tools
           ================================================== */

        .stea-apps-premium-grid,
        .stea-utility-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }

        /* Base premium card */
        .stea-utility-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          min-height: 168px;
          padding: 22px;

          border-radius: 22px;
          border: 1px solid rgba(255,255,255,.10);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.075) 0%,
              rgba(255,255,255,.032) 42%,
              rgba(255,255,255,.018) 100%
            ),
            rgba(11,13,18,.88);

          box-shadow:
            0 20px 46px rgba(0,0,0,.34),
            inset 0 1px 0 rgba(255,255,255,.055);

          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);

          transition:
            transform .28s cubic-bezier(.2,.8,.2,1),
            border-color .28s ease,
            box-shadow .28s ease,
            background .28s ease;
        }

        .stea-utility-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;

          background:
            radial-gradient(
              circle at 12% 12%,
              rgba(255,255,255,.06),
              transparent 31%
            );
        }

        .stea-utility-card::after {
          content: "";
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 48px;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.08),
              transparent
            );

          pointer-events: none;
        }

        .stea-utility-card:hover {
          transform: translateY(-5px);

          border-color: rgba(255,255,255,.17);

          box-shadow:
            0 28px 60px rgba(0,0,0,.44),
            inset 0 1px 0 rgba(255,255,255,.075);
        }

        /* --------------------------------------------------
           APP-SPECIFIC ACCENT SYSTEM
           -------------------------------------------------- */

        .stea-utility-card:nth-child(1) {
          --app-accent: #F59E0B;
          --app-accent-rgb: 245,158,11;
        }

        .stea-utility-card:nth-child(2) {
          --app-accent: #9B7BFF;
          --app-accent-rgb: 155,123,255;
        }

        .stea-utility-card:nth-child(3) {
          --app-accent: #22D3EE;
          --app-accent-rgb: 34,211,238;
        }

        .stea-utility-card:nth-child(1)::before {
          background:
            radial-gradient(
              circle at 8% 0%,
              rgba(245,158,11,.18),
              transparent 40%
            );
        }

        .stea-utility-card:nth-child(2)::before {
          background:
            radial-gradient(
              circle at 12% 5%,
              rgba(155,123,255,.17),
              transparent 42%
            );
        }

        .stea-utility-card:nth-child(3)::before {
          background:
            radial-gradient(
              circle at 9% 0%,
              rgba(34,211,238,.17),
              transparent 42%
            );
        }

        .stea-utility-card:nth-child(1) {
          border-color: rgba(245,158,11,.26);
        }

        .stea-utility-card:nth-child(2) {
          border-color: rgba(155,123,255,.24);
        }

        .stea-utility-card:nth-child(3) {
          border-color: rgba(34,211,238,.24);
        }

        .stea-utility-card:nth-child(1):hover {
          border-color: rgba(245,158,11,.48);
          box-shadow:
            0 28px 60px rgba(0,0,0,.44),
            0 0 38px rgba(245,158,11,.08);
        }

        .stea-utility-card:nth-child(2):hover {
          border-color: rgba(155,123,255,.48);
          box-shadow:
            0 28px 60px rgba(0,0,0,.44),
            0 0 38px rgba(155,123,255,.08);
        }

        .stea-utility-card:nth-child(3):hover {
          border-color: rgba(34,211,238,.48);
          box-shadow:
            0 28px 60px rgba(0,0,0,.44),
            0 0 38px rgba(34,211,238,.08);
        }

        /* --------------------------------------------------
           REALISTIC / 3D-LIKE ICON BOX
           -------------------------------------------------- */

        .stea-utility-card .stea-card-icon,
        .stea-utility-card > div:first-child {
          flex-shrink: 0;
        }

        .stea-utility-card .stea-card-icon {
          width: 58px;
          height: 58px;

          display: grid;
          place-items: center;

          border-radius: 17px;

          font-size: 30px;
          line-height: 1;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.13),
              rgba(255,255,255,.04)
            ),
            rgba(9,11,17,.82);

          border:
            1px solid rgba(var(--app-accent-rgb), .38);

          box-shadow:
            0 12px 28px rgba(0,0,0,.28),
            0 0 22px rgba(var(--app-accent-rgb), .10),
            inset 0 1px 0 rgba(255,255,255,.10);

          filter: none !important;
          text-shadow: none !important;
        }

        /* Better emoji rendering */
        .stea-utility-card .stea-card-icon,
        .stea-utility-card .stea-card-icon * {
          font-family:
            "Apple Color Emoji",
            "Segoe UI Emoji",
            "Noto Color Emoji",
            system-ui,
            sans-serif;
        }

        /* --------------------------------------------------
           BADGES
           -------------------------------------------------- */

        .stea-utility-card em,
        .stea-utility-card .badge,
        .stea-utility-card [class*="badge"],
        .stea-utility-card [class*="status"] {
          display: inline-flex;
          align-items: center;

          width: max-content;

          padding: 5px 9px;
          border-radius: 999px;

          border:
            1px solid rgba(var(--app-accent-rgb), .28);

          background:
            rgba(var(--app-accent-rgb), .10);

          color: var(--app-accent);

          font-size: 9px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;

          font-style: normal;
        }

        /* --------------------------------------------------
           TYPOGRAPHY
           -------------------------------------------------- */

        .stea-utility-card h3 {
          margin: 0 0 5px;

          color: #F8FAFC;

          font-size: clamp(18px, 1.5vw, 21px);
          line-height: 1.08;
          letter-spacing: -.025em;
          font-weight: 850;
        }

        .stea-utility-card p {
          margin: 0;

          max-width: 300px;

          color: rgba(255,255,255,.60);

          font-size: 13px;
          line-height: 1.5;
        }

        /* --------------------------------------------------
           ACTION / CTA
           -------------------------------------------------- */

        .stea-utility-cta,
        .stea-utility-card a,
        .stea-utility-card button {
          position: relative;
          z-index: 2;
        }

        .stea-utility-cta {
          margin-left: auto;

          display: inline-flex;
          align-items: center;
          gap: 7px;

          color: var(--app-accent);

          font-size: 12px;
          font-weight: 850;

          transition:
            transform .2s ease,
            opacity .2s ease;
        }

        .stea-utility-card:hover .stea-utility-cta {
          transform: translateX(3px);
        }

        /* --------------------------------------------------
           PREMIUM TOP EDGE SHINE
           -------------------------------------------------- */

        .stea-utility-card > * {
          position: relative;
          z-index: 2;
        }

        .stea-utility-card .stea-card-icon::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.12),
              transparent 42%
            );

          pointer-events: none;
        }

        /* --------------------------------------------------
           DESKTOP GRID CONTENT ALIGNMENT
           -------------------------------------------------- */

        @media (min-width: 921px) {
          .stea-utility-card {
            display: grid;
            grid-template-columns: auto minmax(0,1fr) auto;
            grid-template-rows: auto 1fr;
            column-gap: 16px;
            row-gap: 7px;
            align-items: center;
          }

          .stea-utility-card .stea-card-icon {
            grid-row: 1 / 3;
          }

          .stea-utility-card h3,
          .stea-utility-card p {
            min-width: 0;
          }

          .stea-utility-cta {
            grid-column: 3;
            grid-row: 1 / 3;
          }
        }

        /* --------------------------------------------------
           TABLET
           -------------------------------------------------- */

        @media (max-width: 920px) {
          .stea-utility-grid {
            grid-template-columns:
              repeat(2, minmax(0,1fr));
          }
        }

        /* --------------------------------------------------
           MOBILE
           -------------------------------------------------- */

        @media (max-width: 620px) {
          .stea-utility-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stea-utility-card {
            min-height: 150px;

            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto auto;

            column-gap: 14px;
            row-gap: 5px;

            padding: 18px;
            border-radius: 19px;
          }

          .stea-utility-card .stea-card-icon {
            width: 52px;
            height: 52px;

            border-radius: 15px;
            font-size: 27px;

            grid-column: 1;
            grid-row: 1 / 3;
          }

          .stea-utility-card h3 {
            grid-column: 2;
            font-size: 18px;
          }

          .stea-utility-card p {
            grid-column: 2;
            font-size: 12px;
          }

          .stea-utility-cta {
            grid-column: 2;
            grid-row: 3;

            margin-top: 8px;
            margin-left: 0;
          }
        }



        /* === STEA APPS PREMIUM FINAL === */

        .stea-utility-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 18px !important;
        }

        .stea-utility-card {
          --app-rgb: 245,166,35;

          position: relative !important;
          isolation: isolate !important;
          overflow: hidden !important;

          min-height: 154px !important;

          display: grid !important;
          grid-template-columns: 58px minmax(0, 1fr) auto !important;
          grid-template-rows: auto auto auto !important;

          column-gap: 16px !important;
          row-gap: 2px !important;

          align-items: center !important;

          padding: 20px 20px !important;

          border-radius: 22px !important;

          border:
            1px solid rgba(var(--app-rgb), .24) !important;

          background:
            linear-gradient(
              130deg,
              rgba(var(--app-rgb), .10) 0%,
              rgba(255,255,255,.045) 26%,
              rgba(255,255,255,.018) 58%,
              rgba(255,255,255,.012) 100%
            ),
            #0b0d12 !important;

          box-shadow:
            0 20px 48px rgba(0,0,0,.32),
            inset 0 1px 0 rgba(255,255,255,.075) !important;

          transition:
            transform .28s cubic-bezier(.2,.8,.2,1),
            border-color .28s ease,
            box-shadow .28s ease !important;
        }

        .stea-utility-card:nth-child(1) {
          --app-rgb: 245,166,35;
        }

        .stea-utility-card:nth-child(2) {
          --app-rgb: 155,111,255;
        }

        .stea-utility-card:nth-child(3) {
          --app-rgb: 34,211,238;
        }

        .stea-utility-card::before {
          content: "" !important;

          position: absolute !important;
          z-index: -1 !important;

          width: 180px !important;
          height: 180px !important;

          top: -90px !important;
          left: -60px !important;

          border-radius: 50% !important;

          background:
            radial-gradient(
              circle,
              rgba(var(--app-rgb), .28) 0%,
              rgba(var(--app-rgb), .12) 38%,
              transparent 70%
            ) !important;

          filter: blur(8px) !important;

          pointer-events: none !important;
        }

        .stea-utility-card::after {
          content: "" !important;

          position: absolute !important;
          inset: 0 !important;

          z-index: -1 !important;

          background:
            linear-gradient(
              115deg,
              transparent 10%,
              rgba(255,255,255,.045) 38%,
              transparent 60%
            ) !important;

          transform: translateX(-120%) !important;

          transition:
            transform .7s cubic-bezier(.2,.8,.2,1) !important;

          pointer-events: none !important;
        }

        .stea-utility-card:hover {
          transform:
            translateY(-5px) !important;

          border-color:
            rgba(var(--app-rgb), .43) !important;

          box-shadow:
            0 28px 62px rgba(0,0,0,.42),
            0 0 28px rgba(var(--app-rgb), .09),
            inset 0 1px 0 rgba(255,255,255,.10) !important;
        }

        .stea-utility-card:hover::after {
          transform:
            translateX(120%) !important;
        }


        /* =========================
           ICON
           ========================= */

        .stea-utility-card .stea-card-icon {
          grid-column: 1 !important;
          grid-row: 1 / 4 !important;

          width: 56px !important;
          height: 56px !important;

          margin: 0 !important;

          display: grid !important;
          place-items: center !important;

          border-radius: 17px !important;

          border:
            1px solid rgba(var(--app-rgb), .36) !important;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.12),
              rgba(var(--app-rgb), .11)
            ),
            rgba(8,10,15,.82) !important;

          box-shadow:
            0 12px 28px rgba(0,0,0,.32),
            0 0 20px rgba(var(--app-rgb), .12),
            inset 0 1px 0 rgba(255,255,255,.13) !important;

          font-size: 27px !important;
          line-height: 1 !important;

          color: initial !important;

          text-shadow: none !important;
          filter: none !important;

          transition:
            transform .28s cubic-bezier(.2,.8,.2,1) !important;
        }

        .stea-utility-card:hover .stea-card-icon {
          transform:
            scale(1.06)
            rotate(-2deg) !important;
        }


        /* =========================
           TITLE
           ========================= */

        .stea-utility-card h3 {
          grid-column: 2 !important;
          grid-row: 1 !important;

          margin: 0 !important;

          align-self: end !important;

          color: #f6f7f9 !important;

          font-size: 19px !important;
          font-weight: 850 !important;

          line-height: 1.08 !important;

          letter-spacing: -.025em !important;

          white-space: normal !important;
        }


        /* =========================
           DESCRIPTION
           ========================= */

        .stea-utility-card p {
          grid-column: 2 !important;
          grid-row: 2 / 4 !important;

          margin: 5px 0 0 !important;

          max-width: 265px !important;

          color:
            rgba(255,255,255,.56) !important;

          font-size: 12.5px !important;
          line-height: 1.48 !important;

          align-self: start !important;
        }


        /* =========================
           STATUS PILL
           ========================= */

        .stea-utility-card em,
        .stea-utility-card .badge,
        .stea-utility-card [class*="badge"],
        .stea-utility-card [class*="status"] {
          position: absolute !important;

          left: 77px !important;
          top: 16px !important;

          width: max-content !important;

          margin: 0 !important;

          padding:
            4px 8px !important;

          border-radius:
            999px !important;

          border:
            1px solid rgba(var(--app-rgb), .28) !important;

          background:
            rgba(var(--app-rgb), .10) !important;

          color:
            rgb(var(--app-rgb)) !important;

          font-size: 8px !important;
          font-weight: 900 !important;

          line-height: 1 !important;

          letter-spacing: .11em !important;
          text-transform: uppercase !important;

          box-shadow: none !important;

          z-index: 3 !important;
        }

        .stea-utility-card h3 {
          padding-top: 18px !important;
        }


        /* =========================
           CTA
           ========================= */

        .stea-utility-card .stea-utility-cta {
          grid-column: 3 !important;
          grid-row: 1 / 4 !important;

          align-self: center !important;
          justify-self: end !important;

          min-width: 64px !important;
          height: 38px !important;

          padding:
            0 12px !important;

          margin: 0 !important;

          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;

          border-radius: 12px !important;

          border:
            1px solid rgba(var(--app-rgb), .18) !important;

          background:
            rgba(var(--app-rgb), .075) !important;

          color:
            rgb(var(--app-rgb)) !important;

          font-size: 10.5px !important;
          font-weight: 850 !important;

          white-space: nowrap !important;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.055) !important;

          transition:
            background .2s ease,
            transform .2s ease !important;
        }

        .stea-utility-card:hover
        .stea-utility-cta {
          background:
            rgba(var(--app-rgb), .14) !important;

          transform:
            translateX(2px) !important;
        }


        /* =========================
           TABLET
           ========================= */

        @media (max-width: 960px) {
          .stea-utility-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }


        /* =========================
           MOBILE
           ========================= */

        @media (max-width: 620px) {

          .stea-utility-grid {
            grid-template-columns:
              1fr !important;

            gap: 12px !important;
          }

          .stea-utility-card {
            min-height: 142px !important;

            grid-template-columns:
              52px minmax(0,1fr) auto !important;

            column-gap: 13px !important;

            padding:
              17px !important;

            border-radius:
              19px !important;
          }

          .stea-utility-card .stea-card-icon {
            width: 50px !important;
            height: 50px !important;

            border-radius:
              15px !important;

            font-size:
              24px !important;
          }

          .stea-utility-card h3 {
            padding-top:
              17px !important;

            font-size:
              18px !important;
          }

          .stea-utility-card p {
            font-size:
              12px !important;

            max-width:
              230px !important;
          }

          .stea-utility-card em,
          .stea-utility-card .badge,
          .stea-utility-card [class*="badge"],
          .stea-utility-card [class*="status"] {
            left: 70px !important;
            top: 14px !important;
          }

          .stea-utility-card .stea-utility-cta {
            min-width:
              56px !important;

            height:
              34px !important;

            padding:
              0 9px !important;

            font-size:
              10px !important;
          }
        }

        /* === END STEA APPS PREMIUM FINAL === */



        /* ==================================================
           STEA MOBILE NAV — FIXED VISIBLE DOCK
           ================================================== */

        @media (max-width: 620px) {

          .stea-mobile-nav {
            position: fixed !important;

            left: 10px !important;
            right: 10px !important;

            bottom:
              max(
                10px,
                env(safe-area-inset-bottom)
              ) !important;

            width: auto !important;

            margin: 0 !important;

            z-index: 9998 !important;

            display: grid !important;

            transform: none !important;
            translate: none !important;

            opacity: 1 !important;
            visibility: visible !important;

            pointer-events: auto !important;

            background:
              rgba(7, 9, 14, .90) !important;

            border:
              1px solid rgba(255,255,255,.10) !important;

            border-radius:
              18px !important;

            box-shadow:
              0 18px 50px rgba(0,0,0,.46),
              inset 0 1px 0 rgba(255,255,255,.06) !important;

            backdrop-filter:
              blur(18px)
              saturate(140%) !important;

            -webkit-backdrop-filter:
              blur(18px)
              saturate(140%) !important;
          }

          /*
           * Keep content from being covered
           * by fixed bottom navigation.
           */
          .stea-home {
            padding-bottom:
              calc(
                92px +
                env(safe-area-inset-bottom)
              ) !important;
          }
        }

`}</style>

      <style>{`
        /* REAL MOBILE HERO COMPACT FIX */
        @media (max-width: 620px) {

          /*
           * Kill the desktop hero viewport/min-height.
           * Mobile hero must only be as tall as its content.
           */
          .stea-home .stea-home-hero-final {
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;

            padding-top: 20px !important;
            padding-bottom: 22px !important;

            margin-top: 0 !important;
            margin-bottom: 0 !important;

            align-content: start !important;
            justify-content: start !important;
          }

          /*
           * The content wrapper immediately after SideRays
           * was still inheriting desktop vertical sizing.
           */
          .stea-home-hero-final > .stea-final-rays + * {
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;

            padding-top: 0 !important;
            padding-bottom: 0 !important;

            margin-bottom: 0 !important;
          }

          /*
           * Remove any remaining desktop hero spacer.
           */
          .stea-home-hero-final .stea-final-hero-inner,
          .stea-home-hero-final .stea-hero-inner,
          .stea-home-hero-final .stea-home-hero-inner,
          .stea-home-hero-final .stea-hero-content {
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
          }

          /*
           * Search should finish the hero.
           */
          .stea-home-hero-final .stea-home-search {
            margin-top: 18px !important;
            margin-bottom: 0 !important;
          }

          /*
           * Explore begins shortly after search.
           */
          #explore.stea-home-section {
            margin-top: 0 !important;
            padding-top: 22px !important;
          }

          #explore .stea-section-head {
            margin-top: 0 !important;
          }
        }
        /* END REAL MOBILE HERO COMPACT FIX */
      `}</style>

      <style>{`
        /* MOBILE FEATURED WEBSITES HORIZONTAL CAROUSEL */

        @media (max-width: 620px) {

          /*
           * Featured websites become SIDE-TO-SIDE cards.
           * No more vertical stacking.
           */
          .stea-websites-grid {
            display: flex !important;
            grid-template-columns: none !important;

            width: 100% !important;

            gap: 12px !important;

            overflow-x: auto !important;
            overflow-y: hidden !important;

            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;

            scroll-snap-type: x mandatory;
            scroll-padding-left: 0;

            padding:
              2px
              18px
              10px
              0 !important;

            margin: 0 !important;

            scrollbar-width: none;
          }

          .stea-websites-grid::-webkit-scrollbar {
            display: none;
          }

          /*
           * One premium card + a small preview of next card.
           */
          .stea-websites-grid > .stea-website-card {
            flex:
              0
              0
              min(
                82vw,
                300px
              ) !important;

            width:
              min(
                82vw,
                300px
              ) !important;

            min-width:
              min(
                82vw,
                300px
              ) !important;

            max-width:
              min(
                82vw,
                300px
              ) !important;

            scroll-snap-align: start;
            scroll-snap-stop: normal;

            margin: 0 !important;
          }

          /*
           * Keep website images cinematic but compact.
           */
          .stea-website-card > img,
          .stea-website-card .stea-website-fallback {
            width: 100% !important;
          }

          .stea-website-card > img {
            aspect-ratio: 16 / 10 !important;
            height: auto !important;
            object-fit: cover !important;
          }

          /*
           * Prevent cards becoming giant vertically.
           */
          .stea-website-card {
            align-self: stretch;
            overflow: hidden;
          }
        }

        /*
         * Very narrow phones.
         */
        @media (max-width: 390px) {
          .stea-websites-grid > .stea-website-card {
            flex-basis: 84vw !important;
            width: 84vw !important;
            min-width: 84vw !important;
            max-width: 84vw !important;
          }
        }

        /* END MOBILE FEATURED WEBSITES HORIZONTAL CAROUSEL */

        /* === STEA APPS MOBILE 2x2 FINAL === */

        @media (max-width: 620px) {

          #apps .stea-utility-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;

            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;

            scroll-snap-type: none !important;
          }

          #apps .stea-utility-card {
            min-width: 0 !important;
            width: 100% !important;
            min-height: 94px !important;

            display: grid !important;
            grid-template-columns: 42px minmax(0, 1fr) !important;
            grid-template-rows: auto auto 1fr !important;

            column-gap: 9px !important;
            row-gap: 2px !important;

            padding: 11px !important;
            margin: 0 !important;

            border-radius: 14px !important;
            overflow: hidden !important;

            align-items: center !important;

            transform: none !important;
            scroll-snap-align: none !important;
          }

          #apps .stea-utility-card .stea-card-icon {
            grid-column: 1 !important;
            grid-row: 1 / span 3 !important;

            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;

            margin: 0 !important;

            border-radius: 12px !important;

            display: grid !important;
            place-items: center !important;

            font-size: 23px !important;
            line-height: 1 !important;
          }

          #apps .stea-utility-card h3 {
            grid-column: 2 !important;
            grid-row: 1 !important;

            margin: 0 !important;

            font-size: 12px !important;
            line-height: 1.08 !important;
            font-weight: 900 !important;

            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          #apps .stea-utility-card p {
            grid-column: 2 !important;
            grid-row: 3 !important;

            margin: 1px 22px 0 0 !important;

            font-size: 8.5px !important;
            line-height: 1.28 !important;

            display: -webkit-box !important;
            -webkit-box-orient: vertical !important;
            -webkit-line-clamp: 2 !important;

            overflow: hidden !important;

            opacity: .62 !important;
          }

          #apps .stea-utility-card .stea-home-badge,
          #apps .stea-utility-card em,
          #apps .stea-utility-card [class*="badge"],
          #apps .stea-utility-card [class*="status"] {
            grid-column: 2 !important;
            grid-row: 2 !important;

            justify-self: start !important;

            width: max-content !important;
            max-width: 100% !important;

            margin: 2px 0 !important;
            padding: 3px 6px !important;

            border-radius: 999px !important;

            font-size: 6.5px !important;
            line-height: 1 !important;
            letter-spacing: .05em !important;

            white-space: nowrap !important;
          }

          #apps .stea-utility-cta {
            position: absolute !important;
            right: 8px !important;
            bottom: 8px !important;

            width: 22px !important;
            min-width: 22px !important;
            height: 22px !important;

            padding: 0 !important;

            display: grid !important;
            place-items: center !important;

            border-radius: 7px !important;

            font-size: 0 !important;
            line-height: 1 !important;
          }

          #apps .stea-utility-cta::after {
            content: "›";
            font-size: 16px;
            font-weight: 900;
            line-height: 1;
          }

          #apps .stea-utility-card:hover {
            transform: none !important;
          }
        }

        @media (max-width: 380px) {

          #apps .stea-utility-grid {
            gap: 6px !important;
          }

          #apps .stea-utility-card {
            min-height: 88px !important;
            grid-template-columns: 37px minmax(0, 1fr) !important;
            column-gap: 7px !important;
            padding: 9px !important;
          }

          #apps .stea-utility-card .stea-card-icon {
            width: 37px !important;
            height: 37px !important;
            min-width: 37px !important;
            border-radius: 10px !important;
            font-size: 20px !important;
          }

          #apps .stea-utility-card h3 {
            font-size: 10.5px !important;
          }

          #apps .stea-utility-card p {
            font-size: 7.5px !important;
            margin-right: 18px !important;
          }

          #apps .stea-utility-card .stea-home-badge,
          #apps .stea-utility-card em,
          #apps .stea-utility-card [class*="badge"],
          #apps .stea-utility-card [class*="status"] {
            font-size: 5.8px !important;
            padding: 2px 5px !important;
          }

          #apps .stea-utility-cta {
            width: 19px !important;
            min-width: 19px !important;
            height: 19px !important;
            right: 7px !important;
            bottom: 7px !important;
          }

          #apps .stea-utility-cta::after {
            font-size: 14px !important;
          }
        }

        /* === END STEA APPS MOBILE 2x2 FINAL === */


        /* === REAL STEA UTILITIES MOBILE 2X2 === */
        @media (max-width: 620px) {

          #apps .stea-utility-grid {
            display: grid !important;
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;

            gap: 8px !important;

            width: 100% !important;
            max-width: 100% !important;

            overflow: visible !important;
            overflow-x: visible !important;

            margin: 0 !important;
            padding: 0 !important;
          }

          #apps .stea-utility-card {
            position: relative !important;

            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;

            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;

            min-height: 118px !important;
            height: auto !important;

            padding: 11px !important;
            margin: 0 !important;

            gap: 5px !important;

            border-radius: 14px !important;

            overflow: hidden !important;

            scroll-snap-align: none !important;
            flex: none !important;
          }

          #apps .stea-utility-card .stea-card-icon {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;

            margin: 0 0 2px !important;

            border-radius: 10px !important;

            font-size: 20px !important;
            line-height: 1 !important;
          }

          #apps .stea-utility-card h3 {
            width: 100% !important;

            margin: 0 !important;

            font-size: 12px !important;
            line-height: 1.08 !important;
            font-weight: 900 !important;

            white-space: normal !important;
            overflow-wrap: normal !important;
            word-break: normal !important;
          }

          #apps .stea-utility-card p {
            width: 100% !important;

            margin: 0 !important;

            font-size: 8px !important;
            line-height: 1.3 !important;

            display: -webkit-box !important;
            -webkit-box-orient: vertical !important;
            -webkit-line-clamp: 2 !important;

            overflow: hidden !important;
          }

          #apps .stea-utility-card .stea-utility-cta {
            position: absolute !important;

            right: 8px !important;
            bottom: 8px !important;

            min-width: 22px !important;
            width: auto !important;
            height: 22px !important;

            padding: 0 7px !important;

            font-size: 7px !important;

            border-radius: 7px !important;
          }

          #apps .stea-utility-card em,
          #apps .stea-utility-card [class*="badge"],
          #apps .stea-utility-card [class*="status"] {
            font-size: 6px !important;
            line-height: 1 !important;

            padding: 3px 5px !important;

            white-space: nowrap !important;
          }
        }

        @media (max-width: 370px) {

          #apps .stea-utility-grid {
            gap: 6px !important;
          }

          #apps .stea-utility-card {
            min-height: 108px !important;
            padding: 9px !important;
          }

          #apps .stea-utility-card .stea-card-icon {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;

            font-size: 18px !important;
          }

          #apps .stea-utility-card h3 {
            font-size: 10.5px !important;
          }

          #apps .stea-utility-card p {
            font-size: 7px !important;
          }
        }
        /* === END REAL STEA UTILITIES MOBILE 2X2 === */



        /* STEA HERO ECOSYSTEM PREMIUM */
        .stea-hero-ecosystem{
          width:min(760px,100%);
          margin:28px auto 0;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:11px;
        }

        .stea-hero-ecosystem-label{
          display:inline-flex;
          align-items:center;
          gap:7px;
          color:var(--home-soft);
          font-size:10px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
        }

        .stea-hero-ecosystem-dot{
          width:5px;
          height:5px;
          border-radius:999px;
          background:${G};
          box-shadow:0 0 14px rgba(245,166,35,.52);
        }

        .stea-hero-ecosystem-apps{
          display:flex;
          align-items:center;
          justify-content:center;
          flex-wrap:wrap;
          gap:7px;
        }

        .stea-hero-ecosystem-app{
          min-height:42px;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:5px 10px 5px 6px;
          border-radius:13px;
          border:1px solid rgba(255,255,255,.08);
          background:rgba(255,255,255,.035);
          color:var(--home-muted);
          text-decoration:none;
          font-size:11px;
          font-weight:850;
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            color .18s ease;
        }

        .stea-hero-ecosystem-app:hover{
          transform:translateY(-2px);
          color:var(--home-text);
          background:rgba(255,255,255,.06);
          border-color:rgba(245,166,35,.22);
        }

        .stea-hero-ecosystem-icon{
          width:30px;
          height:30px;
          display:grid;
          place-items:center;
          flex:0 0 auto;
        }

        .stea-hero-ecosystem-icon img{
          display:block;
          width:100%;
          height:100%;
          object-fit:contain;
        }

        .stea-hero-ecosystem-arrow{
          opacity:.38;
          font-size:10px;
          transform:translateY(-1px);
        }

        .stea-hero-ecosystem-app:hover .stea-hero-ecosystem-arrow{
          opacity:.9;
        }

        @media (max-width:620px){
          .stea-hero-ecosystem{
            margin-top:20px;
            align-items:flex-start;
          }

          .stea-hero-ecosystem-apps{
            width:100%;
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:7px;
          }

          .stea-hero-ecosystem-app{
            width:100%;
            min-width:0;
            padding:5px 8px 5px 5px;
            font-size:10px;
          }

          .stea-hero-ecosystem-icon{
            width:28px;
            height:28px;
          }

          .stea-hero-ecosystem-arrow{
            margin-left:auto;
          }
        }

        @media (max-width:350px){
          .stea-hero-ecosystem-app{
            font-size:9px;
          }
        }
        /* END STEA HERO ECOSYSTEM PREMIUM */

`}</style>


    </div>
  );
}
