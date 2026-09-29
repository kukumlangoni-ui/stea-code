/**
 * AfterDarkPage — Premium Curated Directory of Mature Web Resources
 * Route: /after-dark  /websites/after-dark  /mature
 *
 * 100% Matched to STEA Master UI (Colors, Header, Hero, Left Nav Rail, Card System)
 */
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ExternalLink, Star, Search, Sun, Moon, LogOut, ChevronDown, Check, User
} from "lucide-react";
import { useWebsitesData } from "../context/WebsitesDataContext.jsx";
import { useFavorites } from "../hooks/useFavorites.js";
import { useAuth } from "../hooks/useAuth.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { useSitesLanguage } from "../i18n/index.js";
import AgeGateModal, { isAgeVerified } from "../components/sites/AgeGateModal.jsx";
import WebsiteIcon from "../components/sites/WebsiteIcon.jsx";
import WebsiteQuickInfoModal from "../components/sites/WebsiteQuickInfoModal.jsx";
import AdBlockerProtectionBanner from "../components/sites/AdBlockerProtectionBanner.jsx";
import { preloadWebsiteIcons } from "../components/sites/iconPipeline.js";
import { collection, getFirebaseDb, onSnapshot } from "../firebase.js";
import {
  AFTER_DARK_CATEGORIES,
  AFTER_DARK_SUBCATEGORIES_BY_PARENT,
  INITIAL_AFTER_DARK_SITES,
  resolveAfterDarkCategory,
} from "../data/afterDarkCatalog.js";

const LOGO = "/stea-www-globe.png";

// Robust adult record detection
const isAdultRecord = (w) => {
  if (!w) return false;
  if (w.isAdult === true || w.isAdult === "true" || w.is_adult === true || w.is_adult === "true") {
    return true;
  }
  const cat = String(w.category || w.categoryName || "").toLowerCase().trim();
  const catSlug = String(w.categorySlug || "").toLowerCase().trim();
  const subcat = String(w.subcategory || w.subCategory || "").toLowerCase().trim();

  if (cat.includes("after dark") || cat.includes("mature") || cat.includes("18+")) return true;
  if (catSlug.includes("after-dark") || catSlug.includes("mature") || catSlug.includes("18")) return true;

  if (AFTER_DARK_CATEGORIES.some((c) => c.name.toLowerCase() === cat || c.id === cat || c.id === catSlug)) {
    return true;
  }
  if (Object.keys(AFTER_DARK_SUBCATEGORIES_BY_PARENT).some((p) => p.toLowerCase() === cat)) {
    return true;
  }
  if (Object.values(AFTER_DARK_SUBCATEGORIES_BY_PARENT).flat().some((s) => s.toLowerCase() === subcat || s.toLowerCase() === cat)) {
    return true;
  }

  // Domain & text heuristics
  const text = `${w.name || ""} ${w.title || ""} ${w.url || ""} ${w.domain || ""} ${w.description || ""}`.toLowerCase();
  if (/\b(cam|cams|webcam|stripchat|chaturbate|bongacams|livejasmin|streamate|onlyfans|fansly|coomer|erothots|bunkr|hentai|anime|doujin|doujinshi|rule34|nhentai|hanime|kemono|redgifs|pornpics|imagefap|candy\.ai|ourdream|pornhub|xvideos|xnxx|spankbang|eporner|beeg|redtube|pornito)\b/i.test(text)) {
    return true;
  }
  return false;
};

const resolveSiteUrl = (w) => {
  if (!w) return "";
  let target = w.url || w.websiteUrl || w.link || "";
  if (!target && w.domain) {
    const cleanDomain = String(w.domain).trim().replace(/^https?:\/\//i, "");
    if (cleanDomain) {
      target = `https://${cleanDomain}`;
    }
  }
  return typeof target === "string" ? target.trim() : "";
};

const extractDomain = (url, site) => {
  if (site?.domain) return String(site.domain).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return String(url).replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

const getCachedWebsites = () => {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("stea_sites_websites_cache_v4");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.websites)) return parsed.websites;
    if (Array.isArray(parsed?.data)) return parsed.data;
  } catch {}
  return [];
};

// ── 100% STEA Master Website Card ───────────────────────────────────────────
const AfterDarkCard = React.memo(function AfterDarkCard({
  site,
  isFav,
  onToggleFav,
  onOpenQuickInfo,
}) {
  const targetUrl = resolveSiteUrl(site);
  const title = site.name || site.title || "Untitled";
  const domain = extractDomain(targetUrl, site);

  const handleCardClick = (e) => {
    if (e.target.closest(".stea-card-star-btn") || e.target.closest("button")) {
      return;
    }
    if (onOpenQuickInfo) {
      onOpenQuickInfo(site);
    } else if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isPaid = Boolean(
    site?.isPaid ||
    site?.pricing === "Paid" ||
    site?.pricing === "Subscription" ||
    site?.isTrusted ||
    site?.trusted ||
    site?.isOfficial ||
    (typeof site?.category === "string" && site.category.toLowerCase().includes("onlyfans"))
  );

  return (
    <article
      className="stea-website-compact-card stea-card--stacked"
      onClick={handleCardClick}
      title={title}
      role="button"
      tabIndex={0}
    >
      {/* Top Row: PAID (purple) or FREE (green) pill badge + Star favorite button */}
      <div className="stea-card-top-row">
        {isPaid ? (
          <span className="stea-card-trusted-badge stea-card-badge-paid">PAID</span>
        ) : (
          <span className="stea-card-trusted-badge stea-card-badge-free">FREE</span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(site.id || site.slug || site.name);
          }}
          aria-label={isFav ? "Remove from Favorites" : "Save to Favorites"}
          className={`stea-card-star-btn ${isFav ? "is-favorite" : ""}`}
        >
          <Star
            size={13}
            fill={isFav ? "#F5A623" : "none"}
            stroke={isFav ? "#F5A623" : "currentColor"}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Main Center Area: Brand Icon + Title */}
      <div className="stea-card-center">
        <div className="stea-card-brand-display">
          <div className="stea-card-icon-wrap">
            <WebsiteIcon website={site} size={34} />
          </div>
          <h3 className="stea-card-title">{title}</h3>
        </div>
      </div>

      {/* Bottom Row: ↗ domain */}
      <div className="stea-card-bottom-row">
        <span className="stea-card-arrow-icon" aria-hidden="true">↗</span>
        <span className="stea-card-domain-text">{domain || "Visit website"}</span>
      </div>
    </article>
  );
});

// ── Main After Dark Page Component ──────────────────────────────────────────
export default function AfterDarkPage() {
  const navigate = useNavigate();
  const { websites, loading, triggerFetch } = useWebsitesData();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { theme, setTheme } = useSettings();
  const { currentLang, changeLanguage } = useSitesLanguage();

  const [cachedSites] = useState(() => getCachedWebsites());
  const [directDocs, setDirectDocs] = useState([]);
  const [verified, setVerified] = useState(isAgeVerified);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNavCategory, setActiveNavCategory] = useState("all");
  const [langOpen, setLangOpen] = useState(false);
  const [quickInfoSite, setQuickInfoSite] = useState(null);

  const mobileNavRef = useRef(null);
  const activeMobileBtnRef = useRef(null);

  useEffect(() => {
    if (!isAgeVerified()) {
      setVerified(false);
    }
  }, []);

  // Protection: this route must never be indexed. The current page rewrite had
  // dropped this meta tag, so it is restored here (and reverted on unmount).
  useEffect(() => {
    if (typeof document === "undefined") return;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    const previousContent = meta.getAttribute("content");
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      meta.setAttribute("content", previousContent || "index,follow");
    };
  }, []);

  // Request fresh data from context
  useEffect(() => {
    if (typeof triggerFetch === "function") {
      triggerFetch();
    }
  }, [triggerFetch]);

  // Set up direct live Firestore listener for real-time website updates
  useEffect(() => {
    let unsubscribe = null;
    try {
      const db = getFirebaseDb();
      if (db) {
        const col = collection(db, "websites");
        unsubscribe = onSnapshot(col, (snap) => {
          const docs = [];
          snap.forEach((d) => {
            const data = d.data();
            if (isAdultRecord({ id: d.id, ...data })) {
              docs.push({ id: d.id, ...data });
            }
          });
          if (docs.length > 0) {
            setDirectDocs(docs);
          }
        }, (err) => {
          console.warn("[AfterDark] Firestore listener notice:", err);
        });
      }
    } catch (e) {
      console.warn("[AfterDark] Listener setup notice:", e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Consolidate all adult sources into a single de-duplicated dataset
  const allSites = useMemo(() => {
    const map = new Map();

    const getSiteKey = (s) => {
      if (!s) return "";
      let d = s.domain || "";
      if (!d && s.url) {
        try {
          d = new URL(s.url).hostname;
        } catch {
          d = String(s.url);
        }
      }
      d = d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
      if (d) return d;
      return String(s.slug || s.id || s.name || s.title || "").toLowerCase().trim();
    };

    // 1. Starter catalog (57 curated mature sites across all 8 categories)
    INITIAL_AFTER_DARK_SITES.forEach((site) => {
      const key = getSiteKey(site);
      if (key) {
        map.set(key, { ...site, category: resolveAfterDarkCategory(site) });
      }
    });

    // 2. Local Cache
    cachedSites.forEach((site) => {
      if (isAdultRecord(site)) {
        const key = getSiteKey(site);
        if (key) {
          const existing = map.get(key) || {};
          const merged = { ...existing, ...site };
          merged.category = resolveAfterDarkCategory(merged);
          map.set(key, merged);
        }
      }
    });

    // 3. Global Context Feed
    (websites || []).forEach((site) => {
      if (isAdultRecord(site)) {
        const key = getSiteKey(site);
        if (key) {
          const existing = map.get(key) || {};
          const merged = { ...existing, ...site };
          merged.category = resolveAfterDarkCategory(merged);
          map.set(key, merged);
        }
      }
    });

    // 4. Real-time Live Firestore Snapshot
    directDocs.forEach((site) => {
      const key = getSiteKey(site);
      if (key) {
        const existing = map.get(key) || {};
        const merged = { ...existing, ...site };
        merged.category = resolveAfterDarkCategory(merged);
        map.set(key, merged);
      }
    });

    return Array.from(map.values());
  }, [cachedSites, websites, directDocs]);

  // Catalog readiness: warm the first screen's icons and release the startup
  // splash. Icon loading never blocks the render — this only orders the work.
  useEffect(() => {
    if (!allSites || allSites.length === 0) return;
    preloadWebsiteIcons(allSites);
    try {
      if (typeof window.__steaSplashReady === "function") {
        window.__steaSplashReady("after-dark-catalog-ready");
      }
    } catch {}
  }, [allSites]);

  // Dynamic category tabs with real count badges
  const categoriesWithCounts = useMemo(() => {
    const counts = { all: allSites.length };
    AFTER_DARK_CATEGORIES.forEach((c) => {
      counts[c.id] = 0;
      counts[c.name] = 0;
    });

    allSites.forEach((site) => {
      const cat = resolveAfterDarkCategory(site);
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
        const matched = AFTER_DARK_CATEGORIES.find(
          (c) => c.name.toLowerCase() === cat.toLowerCase() || c.id === cat.toLowerCase()
        );
        if (matched) {
          counts[matched.id] = (counts[matched.id] || 0) + 1;
        }
      }
    });

    return [
      { id: "all", label: "All Mature", count: allSites.length, slug: "all", icon: "🌐" },
      ...AFTER_DARK_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.name,
        count: counts[c.id] || counts[c.name] || 0,
        slug: c.id,
        icon: c.icon,
      })).filter((c) => c.count > 0),
    ];
  }, [allSites]);

  // Group sites by category for section rendering
  const sitesByCategory = useMemo(() => {
    const map = {};
    AFTER_DARK_CATEGORIES.forEach((c) => {
      map[c.id] = [];
    });

    allSites.forEach((s) => {
      const cat = resolveAfterDarkCategory(s);
      const matched = AFTER_DARK_CATEGORIES.find(
        (c) => c.name.toLowerCase() === cat.toLowerCase() || c.id === cat.toLowerCase() || c.id === (s.categorySlug || "").toLowerCase()
      );
      if (matched && map[matched.id]) {
        map[matched.id].push(s);
      }
    });

    return map;
  }, [allSites]);

  // Filtered dataset for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allSites.filter((s) => {
      const title = (s.name || s.title || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      const domain = (s.domain || s.url || "").toLowerCase();
      const cat = (s.category || "").toLowerCase();
      const tags = Array.isArray(s.tags) ? s.tags.join(" ").toLowerCase() : "";
      return title.includes(q) || desc.includes(q) || domain.includes(q) || cat.includes(q) || tags.includes(q);
    });
  }, [allSites, searchQuery]);

  // Active category scroll spy
  useEffect(() => {
    if (searchQuery.trim()) return;

    const updateActive = () => {
      const sections = Array.from(document.querySelectorAll(".sites-category-section[id]"));
      if (sections.length === 0) return;

      const focalY = 160; // Focal line below 54px fixed header
      let activeSlug = "";

      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= focalY && rect.bottom > focalY) {
          activeSlug = sec.id.replace("cat-sec-", "");
          break;
        }
      }

      if (!activeSlug && window.scrollY < 260) {
        activeSlug = "all";
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        activeSlug = sections[sections.length - 1]?.id.replace("cat-sec-", "") || "all";
      }

      if (activeSlug) {
        setActiveNavCategory(activeSlug);
      }
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActive);
    };
  }, [allSites.length, searchQuery]);

  // Auto-scroll the active category item into view inside the left rail
  useEffect(() => {
    if (!activeNavCategory) return;
    const rail = document.querySelector(".sites-nav-rail-inner");
    if (!rail) return;
    const activeEl = rail.querySelector(
      `.sites-nav-rail-item[data-cat-slug="${CSS.escape(activeNavCategory)}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeNavCategory]);

  // Auto-scroll active item into view on mobile
  useEffect(() => {
    if (activeMobileBtnRef.current && mobileNavRef.current) {
      const container = mobileNavRef.current;
      const el = activeMobileBtnRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeNavCategory]);

  const handleSelectCategory = (id) => {
    setActiveNavCategory(id);
    if (searchQuery) setSearchQuery("");

    if (id === "all") {
      const el = document.getElementById("cat-sec-all");
      if (el) {
        const headerOffset = 68;
        const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    const el = document.getElementById(`cat-sec-${id}`);
    if (el) {
      const headerOffset = 68;
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const handleToggleFav = useCallback((id) => {
    if (toggleFavorite) toggleFavorite(id);
  }, [toggleFavorite]);

  const handleExitToPublic = () => {
    try {
      sessionStorage.removeItem("stea_age_verified");
      sessionStorage.removeItem("stea_age_verified_ts");
    } catch {}
    navigate("/websites");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Account";

  return (
    <div className="stea-master-afterdark-root">
      {/* Age Gate Modal Overlay */}
      <AgeGateModal
        open={!verified}
        onConfirm={() => setVerified(true)}
        onClose={() => {
          if (!isAgeVerified()) navigate("/websites");
        }}
      />

      {/* ── Fixed STEA Header (Never Moves) ── */}
      <header className="sites-header-v2" role="banner">
        <div className="sites-header-v2-inner">
          <Link to="/websites" className="sites-brand-v2" aria-label="STEA Home">
            <img
              src={LOGO}
              alt="STEA logo"
              className="sites-brand-v2-logo"
              width="28"
              height="28"
            />
            <span className="sites-brand-v2-text">STEA</span>
          </Link>

          <div className="sites-header-v2-right">
            {/* Language dropdown */}
            <div className="sites-lang-chip-wrap" onMouseLeave={() => setLangOpen(false)}>
              <button
                type="button"
                className="sites-lang-chip"
                onClick={() => setLangOpen(!langOpen)}
                aria-label="Change Language"
              >
                <span>{currentLang ? currentLang.toUpperCase() : "EN"}</span>
                <ChevronDown size={11} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              </button>
              {langOpen && (
                <ul className="sites-lang-menu">
                  {["en", "sw", "zh"].map((k) => (
                    <li key={k}>
                      <button
                        type="button"
                        className={`sites-lang-option ${currentLang === k ? "is-selected" : ""}`}
                        onClick={() => { changeLanguage(k); setLangOpen(false); }}
                      >
                        <span>{k === "en" ? "English" : k === "sw" ? "Swahili" : "中文"}</span>
                        {currentLang === k && <Check size={12} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              className="sites-theme-toggle-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* User chip */}
            <div className="sites-account-chip">
              <div className="sites-account-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="sites-account-name">{displayName}</span>
            </div>

            {/* Exit to Public button */}
            <button
              type="button"
              className="after-dark-header-exit-btn"
              onClick={handleExitToPublic}
              title="Return to public STEA websites"
            >
              <LogOut size={13} />
              <span className="after-dark-exit-label">Exit to Public</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div className="sites-v2-main">
        {/* Atmospheric STEA Hero */}
        <section className="sites-home-hero">
          <div className="sites-hero-top-row">
            <div className="sites-hero-tag">THE PRIVATE SIDE OF THE INTERNET</div>
            <div className="sites-hero-stats">
              <div className="sites-stat-pill">
                <strong>{allSites.length}</strong> <span>SITES</span>
              </div>
              <div className="sites-stat-pill">
                <strong>{categoriesWithCounts.length - 1}</strong> <span>CATEGORIES</span>
              </div>
            </div>
          </div>

          <h1 className="sites-hero-title">
            Discover adult &amp; mature <span className="sites-hero-gold">web platforms.</span>
          </h1>

          {/* Large Hero Search Input */}
          <div className="sites-hero-search-box">
            <Search size={18} className="sites-search-icon" />
            <input
              type="text"
              placeholder={`Search ${allSites.length}+ mature websites, tools, categories...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sites-search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#F5A623",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginRight: 8,
                }}
              >
                Clear
              </button>
            ) : (
              <span className="sites-search-shortcut">/</span>
            )}
            <button
              type="button"
              className="sites-search-btn"
              onClick={() => {}}
            >
              Search
            </button>
          </div>
        </section>

        {/* AdBlocker & VPN Protection Banner at hero border */}
        <AdBlockerProtectionBanner isAfterDark={true} />

        {/* ── Mobile Sticky Horizontal Nav ── */}
        <div className="sites-category-mobile-nav" aria-label="Mobile category navigation">
          <div className="sites-category-mobile-scroll" ref={mobileNavRef}>
            {categoriesWithCounts.map((c) => {
              const isActive = activeNavCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  ref={isActive ? activeMobileBtnRef : null}
                  onClick={() => handleSelectCategory(c.id)}
                  className={`sites-category-mobile-pill ${isActive ? "is-active" : ""}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="afterDarkMobilePill"
                      className="sites-mobile-pill-active-bg"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{c.label}</span>
                  {c.count > 0 && (
                    <span className="sites-mobile-pill-count" style={{ position: "relative", zIndex: 1 }}>
                      {c.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Discovery Workspace (Sticky Left Nav Rail + Right Discovery Stream) ── */}
        <div className="sites-discovery-workspace">
          {/* Left Category Navigation Rail (Sticky, Never Moves) */}
          <aside className="sites-category-nav-rail" aria-label="Category navigation">
            <div className="sites-nav-rail-inner">
              <div className="sites-nav-rail-eyebrow">
                <span>CATEGORIES</span>
                <span className="sites-nav-rail-total">{allSites.length} sites</span>
              </div>

              <nav className="sites-nav-rail-list" role="navigation">
                {categoriesWithCounts.map((c) => {
                  const isActive = activeNavCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-cat-slug={c.id}
                      onClick={() => handleSelectCategory(c.id)}
                      className={`sites-nav-rail-item ${isActive ? "is-active" : ""}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="afterDarkRailPill"
                          className="sites-nav-rail-active-bg"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="sites-nav-rail-name" style={{ position: "relative", zIndex: 1 }}>
                        {c.label}
                      </span>
                      <span className="sites-nav-rail-count" style={{ position: "relative", zIndex: 1 }}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Main Discovery Stream */}
          <main className="sites-discovery-main">
            {searchQuery.trim() ? (
              // Search Results Stream
              <div className="sites-category-section" style={{ marginBottom: 32 }}>
                <div className="sites-category-section-head">
                  <div className="sites-category-title-wrap">
                    <h2 className="sites-category-section-title">Search Results</h2>
                    <span className="sites-category-count-badge">
                      {searchResults.length} {searchResults.length === 1 ? "site" : "sites"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="after-dark-empty-reset"
                    onClick={() => setSearchQuery("")}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="after-dark-empty-card">
                    <p>No mature websites found matching &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      type="button"
                      className="after-dark-empty-reset"
                      onClick={() => setSearchQuery("")}
                    >
                      Reset Search
                    </button>
                  </div>
                ) : (
                  <div className="sites-category-section-grid">
                    {searchResults.map((site) => {
                      const fav = isFavorite ? isFavorite(site.id || site.slug || site.name) : false;
                      return (
                        <AfterDarkCard
                          key={site.id || site.slug || site.url || site.name}
                          site={site}
                          isFav={fav}
                          onToggleFav={handleToggleFav}
                          onOpenQuickInfo={(s) => setQuickInfoSite(s)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Continuous Stream: All Mature first (full grid, no gaps), followed by each category
              <>
                {/* 1. All Mature (Full Grid — No Top Gaps) */}
                <section
                  id="cat-sec-all"
                  className="sites-category-section"
                  data-cat-slug="all"
                  style={{ marginBottom: 44, scrollMarginTop: 72 }}
                >
                  <div className="sites-category-section-head">
                    <div className="sites-category-title-wrap">
                      <span style={{ fontSize: 17, marginRight: 2 }}>🌐</span>
                      <h2 className="sites-category-section-title">All Mature Resources</h2>
                      <span className="sites-category-count-badge">
                        {allSites.length} {allSites.length === 1 ? "site" : "sites"}
                      </span>
                    </div>
                  </div>

                  <div className="sites-category-section-grid">
                    {allSites.map((site) => {
                      const fav = isFavorite ? isFavorite(site.id || site.slug || site.name) : false;
                      return (
                        <AfterDarkCard
                          key={`all-${site.id || site.slug || site.url || site.name}`}
                          site={site}
                          isFav={fav}
                          onToggleFav={handleToggleFav}
                          onOpenQuickInfo={(s) => setQuickInfoSite(s)}
                        />
                      );
                    })}
                  </div>
                </section>

                {/* 2. Individual Category Sections */}
                {AFTER_DARK_CATEGORIES.map((cat) => {
                  const list = sitesByCategory[cat.id] || [];
                  if (list.length === 0) return null;

                  return (
                    <section
                      key={cat.id}
                      id={`cat-sec-${cat.id}`}
                      className="sites-category-section"
                      data-cat-slug={cat.id}
                      style={{ marginBottom: 38, scrollMarginTop: 72 }}
                    >
                      <div className="sites-category-section-head">
                        <div className="sites-category-title-wrap">
                          <span style={{ fontSize: 17, marginRight: 2 }}>{cat.icon}</span>
                          <h2 className="sites-category-section-title">{cat.name}</h2>
                          <span className="sites-category-count-badge">
                            {list.length} {list.length === 1 ? "site" : "sites"}
                          </span>
                        </div>
                      </div>

                      <div className="sites-category-section-grid">
                        {list.map((site) => {
                          const fav = isFavorite ? isFavorite(site.id || site.slug || site.name) : false;
                          return (
                            <AfterDarkCard
                              key={`${cat.id}-${site.id || site.slug || site.url || site.name}`}
                              site={site}
                              isFav={fav}
                              onToggleFav={handleToggleFav}
                              onOpenQuickInfo={(s) => setQuickInfoSite(s)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Quick Info Modal */}
      <WebsiteQuickInfoModal
        site={quickInfoSite}
        onClose={() => setQuickInfoSite(null)}
        onToggleFavorite={handleToggleFav}
        isFavorite={quickInfoSite ? isFavorite(quickInfoSite.id) : false}
      />

      {/* ── Complete STEA Master Styles ── */}
      <style>{`
        .stea-master-afterdark-root {
          min-height: 100vh;
          background: #06080F;
          color: #FFFFFF;
          padding-top: 54px;
          padding-bottom: 60px;
          font-family: 'Instrument Sans', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: visible;
        }

        /* ── Header ── */
        .sites-header-v2 {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
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
          height: 100%;
          box-sizing: border-box;
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
          color: #FFFFFF;
          flex-shrink: 0;
        }

        .sites-brand-v2-logo {
          width: 26px;
          height: 26px;
          display: block;
          object-fit: contain;
        }

        .sites-brand-v2-text {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 19px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: #FFFFFF;
        }

        .sites-header-v2-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Language chip */
        .sites-lang-chip-wrap { position: relative; }
        .sites-lang-chip {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .sites-lang-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #0E121C;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 4px;
          list-style: none;
          margin: 0;
          min-width: 120px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          z-index: 100;
        }
        .sites-lang-option {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          color: #fff;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sites-lang-option:hover { background: rgba(255, 255, 255, 0.08); }

        .sites-theme-toggle-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sites-account-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px 4px 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #fff;
          font-size: 12.5px;
          font-weight: 600;
        }
        .sites-account-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F5A623;
          color: #000;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .sites-account-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .after-dark-header-exit-btn {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.35);
          color: #FCA5A5;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .after-dark-header-exit-btn:hover {
          background: rgba(220, 38, 38, 0.25);
          color: #FFFFFF;
        }

        /* Mobile header must fit inside the viewport without clipping the
           Exit button (it used to spill ~57px past the right edge at 390px). */
        @media (max-width: 700px) {
          .sites-header-v2-inner { padding: 6px 12px; gap: 8px; }
          .sites-header-v2-right { gap: 6px; min-width: 0; }
          .sites-account-chip { padding: 3px; gap: 0; }
          .sites-account-name { display: none; }
          .after-dark-header-exit-btn { padding: 5px 9px; gap: 4px; }
          .after-dark-header-exit-btn .after-dark-exit-label { display: none; }
        }

        /* ── Main Outer ── */
        .sites-v2-main {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 0 clamp(12px, 2.4vw, 28px) 48px;
          overflow: visible;
        }

        /* ── STEA Hero ── */
        .sites-home-hero {
          background: linear-gradient(180deg, #101524 0%, #0c101c 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 30px clamp(16px, 3.5vw, 36px) 24px;
          margin-bottom: 28px;
          position: relative;
        }

        .sites-hero-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .sites-hero-tag {
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #F5A623;
        }

        .sites-hero-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sites-stat-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .sites-stat-pill strong { color: #fff; font-size: 13px; font-weight: 800; }

        .sites-hero-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: clamp(26px, 4.2vw, 44px);
          font-weight: 900;
          letter-spacing: -0.035em;
          margin: 0 0 20px;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .sites-hero-gold {
          color: #F5A623;
        }

        .sites-hero-search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(8, 11, 19, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 5px 6px 5px 16px;
          margin-bottom: 16px;
          transition: border-color 0.15s ease;
        }
        .sites-hero-search-box:focus-within {
          border-color: #F5A623;
          box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.2);
        }

        .sites-search-icon {
          color: rgba(255, 255, 255, 0.4);
          margin-right: 12px;
          flex-shrink: 0;
        }

        .sites-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
        }
        .sites-search-input::placeholder { color: rgba(255, 255, 255, 0.4); }

        .sites-search-shortcut {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 2px 7px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 700;
          margin-right: 8px;
        }

        .sites-search-btn {
          appearance: none;
          border: none;
          background: #F5A623;
          color: #000000;
          font-weight: 750;
          font-size: 13.5px;
          padding: 9px 18px;
          border-radius: 10px;
          cursor: pointer;
        }

        .sites-hero-trending {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }

        .sites-trending-label {
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }

        .sites-trending-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .sites-trending-scroll::-webkit-scrollbar { display: none; }

        .sites-trending-chip {
          appearance: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.75);
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.12s ease;
        }
        .sites-trending-chip:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.18);
        }
        .sites-trending-chip.is-active {
          background: rgba(245, 166, 35, 0.18);
          border-color: #F5A623;
          color: #FFD17C;
          font-weight: 750;
        }

        /* ── Discovery Workspace (Left Nav + Right Main) ── */
        .sites-discovery-workspace {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          width: 100%;
          position: relative;
          overflow: visible;
        }

        /* Left Rail */
        .sites-category-nav-rail {
          display: block;
          width: 220px;
          flex-shrink: 0;
          position: sticky;
          top: 76px;
          height: calc(100vh - 90px);
          max-height: calc(100vh - 90px);
          z-index: 30;
          align-self: flex-start;
        }

        .sites-nav-rail-inner {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
          padding-right: 8px;
          padding-bottom: 24px;
        }
        .sites-nav-rail-inner::-webkit-scrollbar { width: 4px; }
        .sites-nav-rail-inner::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }

        .sites-nav-rail-eyebrow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          padding: 0 10px 10px;
          user-select: none;
        }

        .sites-nav-rail-total {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        .sites-nav-rail-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: relative;
        }

        .sites-nav-rail-item {
          appearance: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 10px;
          text-decoration: none;
          color: #94A3B8;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          transition: color 140ms ease;
          border: 1px solid transparent;
          user-select: none;
          position: relative;
          z-index: 1;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .sites-nav-rail-item:hover { color: #FFFFFF; }
        .sites-nav-rail-item.is-active {
          color: #FFFFFF;
          font-weight: 750;
          border-color: rgba(245, 166, 35, 0.45);
        }

        .sites-nav-rail-active-bg {
          position: absolute;
          inset: 0;
          background: rgba(245, 166, 35, 0.12);
          border-radius: 9px;
          z-index: 0;
        }

        .sites-nav-rail-count {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          font-variant-numeric: tabular-nums;
        }
        .sites-nav-rail-item.is-active .sites-nav-rail-count {
          color: #F5A623;
        }

        /* ─── Mobile Sticky Horizontal Nav ─── */
        .sites-category-mobile-nav {
          display: none;
          position: sticky;
          top: 54px;
          z-index: 40;
          background: rgba(6, 8, 15, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          margin: 0 -12px 18px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sites-category-mobile-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }

        .sites-category-mobile-scroll::-webkit-scrollbar {
          display: none;
        }

        .sites-category-mobile-pill {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.7);
          font-size: 12.5px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 999px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 140ms ease;
          flex-shrink: 0;
          position: relative;
        }

        .sites-category-mobile-pill:active,
        .sites-category-mobile-pill:hover {
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.18);
        }

        .sites-category-mobile-pill.is-active {
          background: rgba(245, 166, 35, 0.16);
          border-color: rgba(245, 166, 35, 0.45);
          color: #FFFFFF;
          font-weight: 750;
        }

        .sites-mobile-pill-active-bg {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: rgba(245, 166, 35, 0.16);
          border: 1px solid rgba(245, 166, 35, 0.45);
          box-shadow: 0 0 12px rgba(245, 166, 35, 0.15);
          z-index: 0;
          pointer-events: none;
        }

        .sites-mobile-pill-count {
          font-size: 10.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          font-variant-numeric: tabular-nums;
        }

        .sites-category-mobile-pill.is-active .sites-mobile-pill-count {
          color: #F5A623;
        }

        /* Right Stream */
        .sites-discovery-main {
          flex: 1;
          min-width: 0;
          width: 100%;
          overflow: visible;
        }

        .sites-category-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sites-category-title-wrap {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .sites-category-section-title {
          font-family: 'Bricolage Grotesque', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .sites-category-count-badge {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.45);
        }

        /* ── Grid ──────────────────────────────────────────────────────────
           minmax(0, 1fr) is deliberate: a bare fr track has an automatic
           minimum of min-content, so one long nowrap domain used to stretch a
           whole column past the viewport and drag every sibling card with it.
           The canonical grid lives in src/styles/stea-sites-cards.css; these
           rules only mirror the local responsive switches. */
        .sites-category-section-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-rows: 1fr;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        @media (max-width: 1400px) {
          .sites-category-section-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        @media (max-width: 1100px) {
          .sites-category-section-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 1024px) {
          .sites-discovery-workspace { flex-direction: column; gap: 0; }
          .sites-category-nav-rail { display: none !important; }
          .sites-category-mobile-nav { display: block !important; }
          .sites-category-section-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 820px) {
          .sites-category-section-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        }
        @media (max-width: 560px) {
          .sites-category-section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        }

        /* Website card styling lives in src/styles/stea-sites-cards.css
           (shared with the Websites hub) — see .stea-card--stacked variant. */
        .after-dark-empty-card {
          padding: 36px 20px;
          background: #0D101A;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }
        .after-dark-empty-reset {
          margin-top: 12px;
          background: rgba(245, 166, 35, 0.15);
          border: 1px solid #F5A623;
          color: #FFD17C;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
