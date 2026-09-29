import React from "react";
import {
  ArrowRight,
  BookOpen,
  Braces,
  BriefcaseBusiness,
  Code2,
  Compass,
  ExternalLink,
  Globe2,
  Layers3,
  Lightbulb,
  Menu,
  Moon,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import SteaCodeLiquidHero from "./SteaCodeLiquidHero.jsx";

const HOME_ITEMS = [
  {
    title: "Code Snippets",
    description: "Copy ready UI patterns and components.",
    icon: Braces,
    href: "#featured-code",
    tone: "gold",
  },
  {
    title: "Tech Tips",
    description: "Quick tips to level up your projects.",
    icon: Lightbulb,
    href: "#existing",
    tone: "blue",
  },
  {
    title: "Hosting",
    description: "Find the best place to host your projects.",
    icon: Server,
    href: "#hosting",
    tone: "green",
  },
  {
    title: "Domains",
    description: "Find and buy the perfect domain.",
    icon: Globe2,
    href: "#domains",
    tone: "violet",
  },
  {
    title: "Website Inspiration",
    description: "Beautiful designs and creative ideas.",
    icon: Compass,
    href: "#inspiration",
    tone: "pink",
  },
  {
    title: "UI Libraries",
    description: "Ready-made UI kits and components.",
    icon: Layers3,
    href: "#directory",
    tone: "cyan",
  },
  {
    title: "Developer Essentials",
    description: "Essential tools every developer needs.",
    icon: BriefcaseBusiness,
    href: "#directory",
    tone: "orange",
  },
  {
    title: "Full Guides",
    description: "Step-by-step guides and tutorials.",
    icon: BookOpen,
    href: "#existing",
    tone: "yellow",
  },
];

function goTo(hash) {
  if (!hash) return;

  if (hash.startsWith("http")) {
    window.location.href = hash;
    return;
  }

  window.location.hash = hash;
}

export default function SteaCodeGatewayHome({
  theme = "dark",
  query = "",
  setQuery,
  onToggleTheme,
}) {
  const submitSearch = (event) => {
    event.preventDefault();
    if (!String(query || "").trim()) return;
    window.location.hash = "#search";
  };

  return (
    <div className={`scg-page ${theme === "light" ? "light" : "dark"}`}>
      <div className="scg-shell">
        <SteaCodeLiquidHero theme={theme} />

        <div className="scg-background-shade" />
        <div className="scg-vignette" />

        <header className="scg-header">
          <a className="scg-brand" href="/daily">
            <img src="/stea-apps/stea-code.png" alt="STEA Code" />
            <strong>STEA Code</strong>
          </a>

          <nav className="scg-nav">
            <button onClick={() => goTo("#explore")}>Explore</button>
            <button onClick={() => goTo("#featured-code")}>Code</button>
            <button onClick={() => goTo("#existing")}>Resources</button>
            <button onClick={() => goTo("#directory")}>Tools</button>
            <a href="https://community.stea.africa">Community</a>
          </nav>

          <div className="scg-header-actions">
            <button
              className="scg-icon-action scg-search-top"
              onClick={() => document.querySelector(".scg-search input")?.focus()}
              aria-label="Search"
            >
              <Search size={15} />
            </button>

            <button
              className="scg-icon-action"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <a className="scg-stea-button" href="https://stea.africa">
              STEA Africa
              <ExternalLink size={11} />
            </a>

            <button
              className="scg-icon-action scg-mobile-menu"
              onClick={() => goTo("#explore")}
              aria-label="Open resources"
            >
              <Menu size={16} />
            </button>
          </div>
        </header>

        <main className="scg-main">
          <section className="scg-hero-copy">
            <div className="scg-kicker">
              <Sparkles size={11} />
              <span>// BUILT FOR DEVELOPERS</span>
            </div>

            <h1>
              <span>Build better.</span>
              <strong>Code faster.</strong>
            </h1>

            <p>
              Practical code, developer tools, resources and inspiration
              <br />
              to help you ship better products.
            </p>

            <form className="scg-search" onSubmit={submitSearch}>
              <Search size={16} />

              <input
                value={query}
                onChange={(event) => setQuery?.(event.target.value)}
                placeholder="Search code, tools, hosting, inspiration..."
              />

              <kbd>⌘ K</kbd>
            </form>

            <div className="scg-actions">
              <button
                className="primary"
                onClick={() => goTo("#featured-code")}
              >
                <Code2 size={13} />
                Browse Code
                <ArrowRight size={12} />
              </button>

              <button onClick={() => goTo("#existing")}>
                <Layers3 size={13} />
                Explore Resources
              </button>

              <button onClick={() => goTo("#inspiration")}>
                <Compass size={13} />
                Website Inspiration
              </button>

              <button onClick={() => goTo("#hosting")}>
                <Server size={13} />
                Hosting Guide
              </button>
            </div>
          </section>

          <section className="scg-resource-grid" aria-label="Developer resources">
            {HOME_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  className={`scg-resource-card tone-${item.tone}`}
                  onClick={() => goTo(item.href)}
                >
                  <span className="scg-resource-icon">
                    <Icon size={16} />
                  </span>

                  <span className="scg-resource-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <ArrowRight className="scg-resource-arrow" size={13} />
                </button>
              );
            })}
          </section>

          <div className="scg-trust">
            <ShieldCheck size={13} />
            <span>Curated. Tested. Developer approved.</span>
          </div>
        </main>
      </div>

      <style>{`
        .scg-page{
          --scg-page:#1b1b1c;
          --scg-panel:#050608;
          --scg-text:#f8fafc;
          --scg-muted:#9aa5b6;
          --scg-border:rgba(255,255,255,.09);
          --scg-card:rgba(10,14,19,.79);
          --scg-card-hover:rgba(14,19,26,.92);
          --scg-gold:#f5a623;
          --scg-gold2:#ffd166;
          width:100%;
          min-height:100svh;
          box-sizing:border-box;
          padding:12px 22px;
          background:var(--scg-page);
          color:var(--scg-text);
          font-family:'Instrument Sans',Inter,system-ui,sans-serif;
          overflow:hidden;
        }

        .scg-page.light{
          --scg-page:#e9e9e8;
          --scg-panel:#f8f8f6;
          --scg-text:#101216;
          --scg-muted:#626b78;
          --scg-border:rgba(15,23,42,.10);
          --scg-card:rgba(255,255,255,.70);
          --scg-card-hover:rgba(255,255,255,.92);
        }

        .scg-shell{
          position:relative;
          isolation:isolate;
          width:100%;
          height:calc(100svh - 24px);
          min-height:670px;
          max-height:980px;
          overflow:hidden;
          border:1px solid var(--scg-border);
          border-radius:34px;
          background:var(--scg-panel);
          box-shadow:
            0 26px 90px rgba(0,0,0,.32),
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .scg-shell .sc-liquid-canvas,
        .scg-shell canvas{
          position:absolute !important;
          inset:0 !important;
          z-index:0 !important;
          width:100% !important;
          height:100% !important;
          pointer-events:none !important;
        }

        .scg-background-shade{
          position:absolute;
          inset:0;
          z-index:1;
          pointer-events:none;
          background:
            linear-gradient(
              180deg,
              rgba(3,4,6,.24) 0%,
              rgba(3,4,6,.06) 28%,
              rgba(3,4,6,.11) 56%,
              rgba(3,4,6,.50) 100%
            );
        }

        .scg-vignette{
          position:absolute;
          inset:0;
          z-index:2;
          pointer-events:none;
          background:
            radial-gradient(
              ellipse at 50% 43%,
              transparent 0%,
              rgba(3,4,6,.03) 38%,
              rgba(3,4,6,.46) 100%
            );
        }

        .scg-page.light .scg-background-shade{
          background:rgba(248,248,246,.60);
        }

        .scg-page.light .scg-vignette{
          background:
            radial-gradient(
              ellipse at 50% 43%,
              rgba(255,255,255,.05),
              rgba(248,248,246,.26) 58%,
              rgba(248,248,246,.70)
            );
        }

        .scg-header{
          position:relative;
          z-index:10;
          width:calc(100% - 58px);
          height:62px;
          margin:0 auto;
          display:grid;
          grid-template-columns:1fr auto 1fr;
          align-items:center;
          gap:24px;
          border-bottom:1px solid rgba(255,255,255,.055);
        }

        .scg-page.light .scg-header{
          border-color:rgba(15,23,42,.08);
        }

        .scg-brand{
          width:max-content;
          display:inline-flex;
          align-items:center;
          gap:9px;
          color:var(--scg-text);
          text-decoration:none;
        }

        .scg-brand img{
          width:26px;
          height:26px;
          object-fit:contain;
        }

        .scg-brand strong{
          font-size:13px;
          letter-spacing:-.02em;
        }

        .scg-nav{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:24px;
        }

        .scg-nav button,
        .scg-nav a{
          appearance:none;
          border:0;
          padding:5px 0;
          background:transparent;
          color:rgba(226,232,240,.73);
          text-decoration:none;
          font:inherit;
          font-size:10px;
          font-weight:700;
          cursor:pointer;
          transition:color .18s ease;
        }

        .scg-page.light .scg-nav button,
        .scg-page.light .scg-nav a{
          color:#667080;
        }

        .scg-nav button:hover,
        .scg-nav a:hover{
          color:var(--scg-text);
        }

        .scg-header-actions{
          justify-self:end;
          display:flex;
          align-items:center;
          gap:7px;
        }

        .scg-icon-action{
          width:31px;
          height:31px;
          padding:0;
          display:grid;
          place-items:center;
          border:1px solid var(--scg-border);
          border-radius:9px;
          background:rgba(9,12,17,.62);
          color:var(--scg-text);
          cursor:pointer;
          backdrop-filter:blur(12px);
          -webkit-backdrop-filter:blur(12px);
        }

        .scg-page.light .scg-icon-action{
          background:rgba(255,255,255,.62);
        }

        .scg-stea-button{
          min-height:31px;
          padding:0 10px;
          display:inline-flex;
          align-items:center;
          gap:5px;
          border:1px solid rgba(245,166,35,.38);
          border-radius:9px;
          background:rgba(245,166,35,.045);
          color:#ffbc3e;
          text-decoration:none;
          font-size:9px;
          font-weight:850;
        }

        .scg-mobile-menu{
          display:none;
        }

        .scg-main{
          position:relative;
          z-index:5;
          width:min(1030px,calc(100% - 56px));
          height:calc(100% - 62px);
          margin:0 auto;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          padding:56px 0 18px;
          box-sizing:border-box;
        }

        .scg-hero-copy{
          width:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
        }

        .scg-kicker{
          display:inline-flex;
          align-items:center;
          gap:6px;
          margin-bottom:10px;
          padding:5px 9px;
          border:1px solid rgba(245,166,35,.25);
          border-radius:999px;
          background:rgba(245,166,35,.055);
          color:#f5a623;
          font-size:8px;
          line-height:1;
          font-weight:900;
          letter-spacing:.10em;
          box-shadow:0 8px 24px rgba(245,166,35,.07);
        }

        .scg-hero-copy h1{
          margin:0;
          font-size:clamp(44px,5vw,70px);
          line-height:.91;
          letter-spacing:-.055em;
          font-weight:950;
        }

        .scg-hero-copy h1 span,
        .scg-hero-copy h1 strong{
          display:block;
        }

        .scg-hero-copy h1 span{
          color:var(--scg-text);
        }

        .scg-hero-copy h1 strong{
          margin-top:4px;
          background:linear-gradient(
            105deg,
            #f5a623 0%,
            #ffd166 48%,
            #f5a623 100%
          );
          background-size:180% 100%;
          -webkit-background-clip:text;
          background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:scg-gold 7s ease-in-out infinite;
        }

        @keyframes scg-gold{
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }

        .scg-hero-copy > p{
          margin:12px 0 0;
          color:var(--scg-muted);
          font-size:11px;
          line-height:1.55;
        }

        .scg-search{
          width:min(610px,100%);
          min-height:43px;
          margin-top:16px;
          padding:0 12px;
          display:flex;
          align-items:center;
          gap:10px;
          box-sizing:border-box;
          border:1px solid rgba(255,255,255,.11);
          border-radius:13px;
          background:rgba(5,8,12,.69);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          box-shadow:
            0 17px 42px rgba(0,0,0,.18),
            inset 0 1px 0 rgba(255,255,255,.035);
          transition:
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .scg-page.light .scg-search{
          background:rgba(255,255,255,.71);
          border-color:rgba(15,23,42,.12);
        }

        .scg-search:focus-within{
          border-color:rgba(245,166,35,.45);
          box-shadow:
            0 0 0 3px rgba(245,166,35,.07),
            0 19px 48px rgba(0,0,0,.20);
        }

        .scg-search input{
          flex:1;
          min-width:0;
          border:0;
          outline:0;
          background:transparent;
          color:var(--scg-text);
          font:inherit;
          font-size:11px;
        }

        .scg-search input::placeholder{
          color:var(--scg-muted);
        }

        .scg-search kbd{
          min-width:29px;
          height:21px;
          padding:0 6px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          border:1px solid var(--scg-border);
          border-radius:6px;
          background:rgba(255,255,255,.035);
          color:var(--scg-muted);
          font:inherit;
          font-size:8px;
          font-weight:800;
        }

        .scg-actions{
          display:flex;
          justify-content:center;
          gap:7px;
          flex-wrap:wrap;
          margin-top:12px;
        }

        .scg-actions button{
          min-height:34px;
          padding:0 12px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          border:1px solid var(--scg-border);
          border-radius:9px;
          background:rgba(10,14,19,.66);
          color:var(--scg-text);
          font:inherit;
          font-size:9px;
          font-weight:800;
          cursor:pointer;
          backdrop-filter:blur(14px);
          -webkit-backdrop-filter:blur(14px);
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .scg-page.light .scg-actions button{
          background:rgba(255,255,255,.66);
        }

        .scg-actions button:hover{
          transform:translateY(-1px);
          border-color:rgba(255,255,255,.18);
        }

        .scg-actions button.primary{
          color:#090b0e;
          border-color:rgba(245,166,35,.62);
          background:linear-gradient(135deg,#f5a623,#ffd166);
          box-shadow:0 10px 26px rgba(245,166,35,.12);
        }

        .scg-resource-grid{
          width:100%;
          max-width:940px;
          margin-top:18px;
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:8px;
        }

        .scg-resource-card{
          position:relative;
          min-height:74px;
          padding:10px 29px 10px 10px;
          display:grid;
          grid-template-columns:34px minmax(0,1fr);
          align-items:center;
          gap:9px;
          overflow:hidden;
          border:1px solid var(--scg-border);
          border-radius:11px;
          background:var(--scg-card);
          color:var(--scg-text);
          font:inherit;
          text-align:left;
          cursor:pointer;
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            0 10px 26px rgba(0,0,0,.08);
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .scg-resource-card:hover{
          transform:translateY(-2px);
          background:var(--scg-card-hover);
          border-color:rgba(255,255,255,.16);
        }

        .scg-resource-icon{
          width:34px;
          height:34px;
          display:grid;
          place-items:center;
          border-radius:9px;
          border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);
          background:color-mix(in srgb,var(--tone) 12%,transparent);
          color:var(--tone);
        }

        .scg-resource-copy{
          min-width:0;
        }

        .scg-resource-copy strong{
          display:block;
          margin-bottom:3px;
          overflow:hidden;
          color:var(--scg-text);
          font-size:10px;
          line-height:1.15;
          font-weight:850;
          white-space:nowrap;
          text-overflow:ellipsis;
        }

        .scg-resource-copy small{
          display:block;
          color:var(--scg-muted);
          font-size:8px;
          line-height:1.35;
          font-weight:500;
        }

        .scg-resource-arrow{
          position:absolute;
          right:10px;
          top:50%;
          transform:translateY(-50%);
          color:rgba(148,163,184,.73);
          transition:
            transform .18s ease,
            color .18s ease;
        }

        .scg-resource-card:hover .scg-resource-arrow{
          color:var(--tone);
          transform:translate(2px,-50%);
        }

        .tone-gold{--tone:#f5a623}
        .tone-blue{--tone:#3b82f6}
        .tone-green{--tone:#22c55e}
        .tone-violet{--tone:#a855f7}
        .tone-pink{--tone:#ec4899}
        .tone-cyan{--tone:#06b6d4}
        .tone-orange{--tone:#f97316}
        .tone-yellow{--tone:#eab308}

        .scg-trust{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          margin-top:13px;
          color:#8f9aa8;
          font-size:8px;
          font-weight:600;
        }

        .scg-trust svg{
          color:#22c55e;
        }


        .scg-hero-copy{
          flex-shrink:0;
        }

        .scg-resource-grid{
          flex-shrink:0;
        }

        @media(min-width:901px) and (max-height:820px){
          .scg-main{
            padding-top:30px;
          }

          .scg-hero-copy h1{
            font-size:clamp(40px,4.4vw,60px);
          }

          .scg-hero-copy > p{
            margin-top:8px;
          }

          .scg-search{
            margin-top:12px;
          }

          .scg-actions{
            margin-top:9px;
          }

          .scg-resource-grid{
            margin-top:14px;
          }

          .scg-resource-card{
            min-height:64px;
          }

          .scg-trust{
            margin-top:8px;
          }
        }

        @media(max-width:900px){
          .scg-page{
            padding:0;
            background:var(--scg-panel);
            overflow:auto;
          }

          .scg-shell{
            height:auto;
            min-height:100svh;
            max-height:none;
            border:0;
            border-radius:0;
          }

          .scg-header{
            width:calc(100% - 30px);
            height:58px;
            grid-template-columns:1fr auto;
          }

          .scg-nav,
          .scg-search-top,
          .scg-stea-button{
            display:none;
          }

          .scg-mobile-menu{
            display:grid;
          }

          .scg-main{
            width:min(720px,calc(100% - 28px));
            height:auto;
            min-height:calc(100svh - 58px);
            padding:38px 0 30px;
          }

          .scg-resource-grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
            max-width:650px;
          }
        }

        @media(max-width:560px){
          .scg-main{
            justify-content:flex-start;
            padding-top:46px;
          }

          .scg-hero-copy h1{
            font-size:clamp(44px,14vw,62px);
          }

          .scg-hero-copy > p{
            max-width:330px;
            font-size:10px;
          }

          .scg-hero-copy > p br{
            display:none;
          }

          .scg-search{
            min-height:47px;
            margin-top:20px;
          }

          .scg-search kbd{
            display:none;
          }

          .scg-actions{
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            width:100%;
            max-width:390px;
          }

          .scg-actions button{
            min-height:38px;
            padding:0 7px;
            font-size:8px;
          }

          .scg-resource-grid{
            margin-top:22px;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:7px;
          }

          .scg-resource-card{
            min-height:82px;
            padding:9px 22px 9px 9px;
            grid-template-columns:30px minmax(0,1fr);
            gap:7px;
          }

          .scg-resource-icon{
            width:30px;
            height:30px;
          }

          .scg-resource-copy strong{
            font-size:9px;
          }

          .scg-resource-copy small{
            font-size:7px;
          }
        }

        @media(max-width:350px){
          .scg-main{
            width:calc(100% - 20px);
          }

          .scg-resource-grid{
            grid-template-columns:1fr;
          }

          .scg-resource-card{
            min-height:62px;
          }
        }

        @media(prefers-reduced-motion:reduce){
          .scg-hero-copy h1 strong{
            animation:none;
          }

          .scg-resource-card,
          .scg-resource-arrow,
          .scg-actions button{
            transition:none;
          }
        }
      `}</style>
    </div>
  );
}
