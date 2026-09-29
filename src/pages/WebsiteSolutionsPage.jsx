/**
 * WebsiteSolutionsPage — Phase 1+2+5
 * Route: /websites  /website-solutions
 * Fast debounced search · admin-created categories · lazy images
 * NOTE: Website Solutions = curated premium websites directory (movies, tools, etc.)
 *       NOT website design service (that lives in /services)
 */
import { getResourceDetailPath } from "../utils/routeHelpers.js";

import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, X, Globe } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { useSearch, searchWebsites, detectCategoryIntent, SECRET_AFTER_DARK_KEYWORDS } from "../hooks/useSearch.js";
import AgeGateModal, { triggerAgeGateOrNavigate } from "../components/sites/AgeGateModal.jsx";
import { useWebsiteCategories } from "../hooks/useWebsiteCategories.js";
import { useWebsitesData } from "../context/WebsitesDataContext.jsx";
import STEADataFallback from "../components/shared/STEADataFallback.jsx";
import {
  sortWebsiteCategories,
  normalizeWebsiteCategorySlug,
  websiteMatchesCategory,
  websiteMatchesSubcategory,
  getWebsiteCountForSubcategory,
  DEVELOPER_SUBCATEGORY_ORDER,
  DEFAULT_WEBSITE_CATEGORY_ORDER
} from "../constants/categoryOrder.js";
import { isPublicWebsiteRecord } from "../utils/websiteRecordCompat.js";
import { preloadWebsiteIcons } from "../components/sites/iconPipeline.js";

import SEOHead from "../components/SEOHead.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFavorites } from "../hooks/useFavorites.js";

/* ---------------- STEA V2 P3-P9 foundation + components ---------------- */
import { TOKENS } from "../components/sites/tokens.js";
import SitesHeader from "../components/sites/SitesHeader.jsx";
import SitesFavicon from "../components/sites/SitesFavicon.jsx";
import SitesHomeHero, { DEFAULT_TRENDING_CHIPS } from "../components/sites/SitesHomeHero.jsx";
import AdBlockerProtectionBanner from "../components/sites/AdBlockerProtectionBanner.jsx";
import SitesRecentRail from "../components/sites/SitesRecentRail.jsx";
import SitesCategoryNavRail from "../components/sites/SitesCategoryNavRail.jsx";
import SitesCategoryTiles from "../components/sites/SitesCategoryTiles.jsx";
import SitesCategorySection from "../components/sites/SitesCategorySection.jsx";
import SitesCompactList from "../components/sites/SitesCompactList.jsx";
import FaviconTile from "../components/sites/FaviconTile.jsx";
import SitesMemberGate, { useSitesMemberGate } from "../components/sites/SitesMemberGate.jsx";
import WebsiteQuickInfoModal from "../components/sites/WebsiteQuickInfoModal.jsx";
import { CategoryOutlineIcon, DeveloperSubcategoryOutlineIcon } from "../components/sites/CategoryOutlineIcons.jsx";
const SitesEcosystemFooter = lazy(() => import("../components/sites/SitesEcosystemFooter.jsx"));
import { normalizeUrl, extractHostname } from "../components/sites/favicon.js";

import {
  getCategoryIconAndDescription,
  getCategoryId,
  getWebsiteCategoryLabel,
  CATEGORY_ORDER,
  DEVELOPER_SUBCATEGORIES,
  getDeveloperSubcategory,
  formatDeveloperSubcategoryName
} from "../data/websiteCategories.js";
import { useTranslation } from "../i18n/index.js";
import { Code2, ArrowLeft, ChevronRight, Sparkles } from "lucide-react";

const G      = "#F5A623";
const ACCENT = "#0ea5e9";
const BG     = "#06080f";
const BORDER = "rgba(255,255,255,.08)";
const WEBSITES_OG_IMAGE = "https://stea.africa/seo/stea-websites-og-v2.png";
const WEBSITES_SEO_TITLE = "STEA Websites — Discover Useful Websites by Category";
const WEBSITES_SEO_DESCRIPTION = "Explore curated websites for learning, programming, AI tools, jobs, design, books, comics, sports, movies, and more.";

function safePinnedRank(site) {
  const rank = Number(site?.pinnedRank);
  return site?.isPinned === true && Number.isInteger(rank) && rank >= 1 && rank <= 10 ? rank : null;
}

function websiteSignalScore(site) {
  return Number(site?.trendingScore || 0) * 1000
    + Number(site?.views || site?.visits || 0)
    + Number(site?.favoritesCount || site?.saves || 0) * 10
    + Number(site?.rating || 0) * 100;
}

function websiteSortTime(site) {
  const value = site?.updatedAt || site?.createdAt || site?.lastCheckedAt;
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function numericSortOrder(value, fallback = 999) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortCategoryWebsites(a, b) {
  const aRank = safePinnedRank(a);
  const bRank = safePinnedRank(b);
  if (aRank !== null || bRank !== null) {
    if (aRank === null) return 1;
    if (bRank === null) return -1;
    if (aRank !== bRank) return aRank - bRank;
  }
  const aOrder = numericSortOrder(a.sortOrder, numericSortOrder(a.sort_order, numericSortOrder(a.displayOrder)));
  const bOrder = numericSortOrder(b.sortOrder, numericSortOrder(b.sort_order, numericSortOrder(b.displayOrder)));
  if (aOrder !== bOrder) return aOrder - bOrder;
  return websiteSortTime(b) - websiteSortTime(a);
}

function categoryLabelFor(t, value) {
  const id = getCategoryId(value);
  return t(`categories.${id}`, getWebsiteCategoryLabel(value) || String(value || ""));
}

function WebsitesCategoryLoadFallback({ onRetry }) {
  return (
    <div className="empty-state-card" role="alert">
      <div className="empty-state-icon">⚠️</div>
      <h3 className="empty-state-title">Unable to load websites right now</h3>
      <p className="empty-state-text">Please try again.</p>
      <button className="empty-state-button" type="button" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

/* Legacy category page hero = REMOVED in P9 (giant 400px intro / breadcrumb / hero / suggest-card).
   Compact replacement: <SitesCompactList> header (Back + Title + Count + Search + Sort). */

/* Legacy category-only homepage = REMOVED in P8 (giant emoji cards, white background, light hero).
   Dark replacement: <SitesCategoryTiles> premium compact dark tiles with real site counts. */

function Skel() {
  // P17: Compact favicon-only skeleton — no 4:3 screenshot rectangles, no blank poster shapes.
  // Cache-first data context means this is rarely visible. Keep tiny, honest, card-like.
  return (
    <div style={{
      minHeight: 110,
      borderRadius: 14,
      background: TOKENS.panel,
      border: `1px solid ${TOKENS.border}`,
      padding: "12px 12px 12px 12px",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      animation: "wspulse 1.6s ease-in-out infinite",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,.05)",
      }} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <div style={{ height: 12, width: "65%", borderRadius: 4, background: "rgba(255,255,255,.06)", marginBottom: 8 }} />
        <div style={{ height: 10, width: "40%", borderRadius: 4, background: "rgba(255,255,255,.04)" }} />
      </div>
      <style>{`@keyframes wspulse{0%,100%{opacity:.45}50%{opacity:.8}}`}</style>
    </div>
  );
}

function WebsiteEmptyState({ stateType, categoryLabel, categoryIcon, query, onClear, onSuggest, onRetry }) {
  const { t } = useTranslation();
  if (stateType === "error") {
    const isOffline = !navigator.onLine;
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">⚠️</div>
        <h3 className="empty-state-title">{isOffline ? t("error.offlineTitle") : t("error.connectionProblem")}</h3>
        <p className="empty-state-text">
          {isOffline 
            ? t("error.offlineMessage")
            : t("error.connectionProblemMessage")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 22 }}>
          <button className="empty-state-button" onClick={onRetry}>{t("buttons.retry")}</button>
          {!isOffline && <button className="empty-state-button" style={{ background: "#f1f5f9", color: "#0f172a" }} onClick={onSuggest}>{t("buttons.suggestWebsite")}</button>}
        </div>
      </div>
    );
  }

  if (stateType === "search") {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon">🔍</div>
        <h3 className="empty-state-title">{t("search.noResultsTitle")}</h3>
        <p className="empty-state-text">{t("search.noResultsText", { query, category: categoryLabel })}</p>
        <button className="empty-state-button" onClick={onClear}>{t("buttons.clearSearch")}</button>
      </div>
    );
  }

  // True empty category
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{categoryIcon || "🌐"}</div>
      <h3 className="empty-state-title">{t("category.emptyTitle")}</h3>
      <p className="empty-state-text">
        {t("category.emptyText", { category: categoryLabel })}<br/>
        <span style={{ fontSize: 13, marginTop: 8, display: "block" }}>{t("category.emptyHint")}</span>
      </p>
      <button className="empty-state-button" onClick={onSuggest}>{t("buttons.suggestWebsite")}</button>
    </div>
  );
}

const emptySuggestionForm = {
  websiteName: "",
  websiteUrl: "",
  category: "",
  description: "",
  reason: "",
  suggestedByName: "",
  suggestedByEmail: "",
};

function looksLikeUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function SuggestWebsiteModal({ categoryLabel, categorySlug, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({ ...emptySuggestionForm, category: categoryLabel }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const websiteName = form.websiteName.trim();
    let websiteUrl = form.websiteUrl.trim();
    const category = form.category.trim();
    const description = form.description.trim();

    if (!websiteName || !websiteUrl || !category || !description) {
      setError(t("suggest.validationRequired"));
      return;
    }

    if (!/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    if (!looksLikeUrl(websiteUrl)) {
      setError(t("suggest.validationUrl"));
      return;
    }

    setSubmitting(true);
    try {
      const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import("../firebase.js");
      const db = getFirebaseDb();
      if (!db) {
        setError(t("suggest.submitError"));
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, "website_suggestions"), {
        websiteName,
        websiteUrl,
        category,
        categorySlug,
        description,
        reason: form.reason.trim(),
        suggestedByName: form.suggestedByName.trim(),
        suggestedByEmail: form.suggestedByEmail.trim(),
        status: "pending",
        source: "public_category_page",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Website suggestion failed:", err);
      setError(t("suggest.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="suggest-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="suggest-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
        <div className="suggest-modal-head">
          <div>
            <h2 id="suggest-modal-title">{t("suggest.title")}</h2>
            <p>{t("suggest.subtitle", { category: categoryLabel })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("buttons.close")}>×</button>
        </div>

        {error && <div className="suggest-form-error">{error}</div>}

        <label>
          {t("suggest.websiteName")}
          <input value={form.websiteName} onChange={(event) => setField("websiteName", event.target.value)} placeholder={t("suggest.websiteName").replace(" *", "")} />
        </label>
        <label>
          {t("suggest.websiteUrl")}
          <input value={form.websiteUrl} onChange={(event) => setField("websiteUrl", event.target.value)} placeholder="https://example.com" />
        </label>
        <label>
          {t("suggest.category")}
          <input value={form.category} onChange={(event) => setField("category", event.target.value)} />
        </label>
        <label>
          {t("suggest.shortDescription")}
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder={t("suggest.shortDescriptionPlaceholder")} />
        </label>
        <label>
          {t("suggest.reason")}
          <textarea value={form.reason} onChange={(event) => setField("reason", event.target.value)} placeholder={t("suggest.optional")} />
        </label>
        <div className="suggest-form-two">
          <label>
            {t("suggest.yourName")}
            <input value={form.suggestedByName} onChange={(event) => setField("suggestedByName", event.target.value)} placeholder={t("suggest.optional")} />
          </label>
          <label>
            {t("suggest.yourEmail")}
            <input value={form.suggestedByEmail} onChange={(event) => setField("suggestedByEmail", event.target.value)} placeholder={t("suggest.optional")} type="email" />
          </label>
        </div>

        <div className="suggest-modal-actions">
          <button type="button" onClick={onClose} disabled={submitting}>{t("buttons.cancel")}</button>
          <button type="submit" disabled={submitting}>{submitting ? t("suggest.submitting") : t("buttons.suggestWebsite")}</button>
        </div>
      </form>
    </div>
  );
}

/**
 * SitesV2Shell — P3/P4 dark host for /websites routes.
 * Applies page background, hosts splash + sticky SitesHeader once, renders children.
 * Dark-only, uses TOKENS page/surface palette.
 */
function SitesV2Shell({ seo, user, isReady, progress = 0, onSignIn, children, fixedShell = false }) {
  return (
    <div
      className={`sites-v2-page${fixedShell ? " is-fixed-shell" : ""}`}
      style={{
        background: "#06080F",
        color: TOKENS.text,
        fontFamily: "'Instrument Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        position: "relative",
        minHeight: "100vh",
      }}
    >
      {!isReady && (
        <div className="sites-catalog-splash" role="status" aria-live="polite">
          <div className="sites-catalog-splash-card">
            <div className="sites-catalog-splash-logo-wrap">
              <img
                src="/stea-www-globe-512.png"
                alt="STEA Websites"
                className="sites-catalog-splash-logo"
                onError={(e) => { e.currentTarget.src = "/stea-www-globe.png"; }}
              />
            </div>
            <div className="sites-catalog-splash-title">STEA Websites</div>
            <div className="sites-catalog-splash-bar-track">
              <div
                className="sites-catalog-splash-bar-fill"
                style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
              />
            </div>
            <div className="sites-catalog-splash-progress-label">
              {Math.min(100, Math.max(0, Math.round(progress)))}%
            </div>
          </div>
        </div>
      )}
      <SitesFavicon />
      {seo}
      <SitesHeader user={user} onSignIn={onSignIn} />
      <AgeGateModal />
      <div className={`sites-v2-main${fixedShell ? " is-fixed-shell" : ""}`}>
        {children}
      </div>
      <style>{`
        .sites-catalog-splash {
          position: fixed;
          inset: 0;
          z-index: var(--stea-z-splash, 200);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 8, 15, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .sites-catalog-splash-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 28px 32px;
          border-radius: 20px;
          background: rgba(18, 22, 34, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 166, 35, 0.08);
          max-width: 300px;
          width: 88%;
        }
        .sites-catalog-splash-logo-wrap {
          width: 56px;
          height: 56px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 14px rgba(245, 166, 35, 0.35));
        }
        .sites-catalog-splash-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .sites-catalog-splash-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #F8FAFC;
          margin-bottom: 16px;
        }
        .sites-catalog-splash-bar-track {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          position: relative;
        }
        .sites-catalog-splash-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #F5A623 0%, #FFD17C 100%);
          border-radius: 999px;
          box-shadow: 0 0 12px rgba(245, 166, 35, 0.6);
          transition: width 380ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sites-catalog-splash-progress-label {
          font-size: 12px;
          font-weight: 600;
          color: #94A3B8;
          margin-top: 10px;
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
        }
        .sites-v2-page {
          padding-top: 54px;
          overflow: visible;
        }
        .sites-v2-main {
          width: 100%;
          max-width: ${TOKENS.contentMax}px;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 0 clamp(12px, 2.4vw, 28px) 48px;
          overflow: visible;
        }
        .sites-discovery-workspace {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          width: 100%;
          position: relative;
          z-index: var(--stea-z-content, 10);
          overflow: visible;
        }
        .sites-discovery-main {
          flex: 1;
          min-width: 0;
          width: 100%;
          overflow: visible;
        }
        /* Must match the rail's own switch point (SitesCategoryNavRail hides the
           desktop rail and shows the horizontal nav at <=1024px). While this
           block stacked at 920px the mobile nav stayed a flex *row* sibling
           between 921–1024px, swallowed the row and collapsed main to 0px —
           which is what threw every card off the right edge of the viewport. */
        @media (max-width: 1024px) {
          .sites-discovery-workspace {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}

function openSignInFlow() {
  try {
    window.dispatchEvent(new CustomEvent("open-auth"));
  } catch {}
}

export default function WebsiteSolutionsPage() {
  const { t } = useTranslation();
  const { category: routeCategory, subcategory: routeSubcategory, slug: legacyCategory } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const {
    websites: contextWebsites,
    loading,
    error,
    hasReceivedServerSnapshot,
    catalogProgress,
    triggerFetch,
    cacheWebsite,
    getCategoryPageCache,
    updateCategoryPageCache,
    saveCategoryScroll,
  } = useWebsitesData();
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestSuccess, setSuggestSuccess] = useState("");
  const [quickInfoSite, setQuickInfoSite] = useState(null);
  const { user } = useAuth();
  // P12 — member gate engine. Tracks opens/category visits; shows passive gate.
  const gate = useSitesMemberGate({ user });
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();
  const routeValue = routeCategory || legacyCategory || "";
  const isCategoryPage = Boolean(routeValue);
  const isFavoritesPage = location.pathname.startsWith("/favorites");

  // Safe redirect from legacy /websites/programming to /websites/developers
  useEffect(() => {
    if (routeValue === "programming") {
      navigate("/websites/developers", { replace: true });
    }
  }, [routeValue, navigate]);

  const routeCategoryResult = useMemo(() => {
    try {
      return {
        routeCategoryId: normalizeWebsiteCategorySlug(routeValue),
        helperError: null,
      };
    } catch (helperError) {
      console.error("Website category normalization failed:", helperError);
      return {
        routeCategoryId: String(routeValue || ""),
        helperError,
      };
    }
  }, [routeValue]);
  const routeCategoryId = routeCategoryResult.routeCategoryId;

  // Determine developer landing vs developer subcategory vs other category
  const isDevelopersLanding = routeCategoryId === "developers" && !routeSubcategory;
  const isDeveloperSubcategory = (routeCategoryId === "developers" && Boolean(routeSubcategory)) ||
    DEVELOPER_SUBCATEGORY_ORDER.includes(routeCategoryId);
  const activeSubcategorySlug = isDeveloperSubcategory
    ? (routeSubcategory || (DEVELOPER_SUBCATEGORY_ORDER.includes(routeCategoryId) ? routeCategoryId : null))
    : null;

  const activeDeveloperSub = useMemo(() => {
    return activeSubcategorySlug ? getDeveloperSubcategory(activeSubcategorySlug) : null;
  }, [activeSubcategorySlug]);

  const cacheKey = isDeveloperSubcategory ? `dev-${activeSubcategorySlug}` : routeCategoryId;
  const cachedCategoryPage = isCategoryPage ? getCategoryPageCache(cacheKey) : null;
  const [displayLimit, setDisplayLimit] = useState(() => cachedCategoryPage?.visibleCount || 12);
  const restoredCategoryRef = useRef("");

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  // Public websites — legacy records without status remain public.
  // Explicit draft/pending/rejected/deleted/inactive records and adult 18+ records stay hidden.
  const allDocs = useMemo(
    () => (contextWebsites || []).filter((w) => isPublicWebsiteRecord(w) && !w.isAdult && !w.is_adult && w.category !== "After Dark" && w.category !== "Mature (18+)"),
    [contextWebsites]
  );

  // Phase 2: custom categories from admin
  const { categories, developerSubcategories, loading: catsLoading, error: catsError } = useWebsiteCategories(allDocs);

  const categoryLabel = useMemo(() => {
    if (isDeveloperSubcategory) {
      return activeDeveloperSub?.label || formatDeveloperSubcategoryName(activeSubcategorySlug);
    }
    if (isDevelopersLanding) {
      return "Developers Resources";
    }
    return isCategoryPage ? getWebsiteCategoryLabel(routeValue) : "All";
  }, [isDeveloperSubcategory, activeDeveloperSub, activeSubcategorySlug, isDevelopersLanding, isCategoryPage, routeValue]);

  const translatedCategoryLabel = isCategoryPage ? categoryLabel : t("admin.allCategories");

  const categoryMeta = useMemo(() => {
    if (isDeveloperSubcategory) {
      return {
        icon: activeDeveloperSub?.icon || "💻",
        description: activeDeveloperSub?.description || `Explore ${categoryLabel} resources for developers.`
      };
    }
    if (isDevelopersLanding) {
      return {
        icon: "💻",
        description: "All essential resources for developers. Discover tools, platforms, documentation and resources for every stage of building software."
      };
    }
    return getCategoryIconAndDescription(categoryLabel);
  }, [isDeveloperSubcategory, activeDeveloperSub, categoryLabel, isDevelopersLanding]);

  const categoryDocsResult = useMemo(() => {
    try {
      if (!isCategoryPage) {
        return { docs: [...allDocs].sort(sortCategoryWebsites), helperError: null };
      }

      if (cachedCategoryPage?.websites?.length && allDocs.length === 0) {
        return { docs: [...cachedCategoryPage.websites].sort(sortCategoryWebsites), helperError: null };
      }

      if (isDeveloperSubcategory && activeSubcategorySlug) {
        const docs = allDocs
          .filter((website) => websiteMatchesSubcategory(website, activeSubcategorySlug))
          .sort(sortCategoryWebsites);
        return { docs, helperError: null };
      }

      if (isDevelopersLanding) {
        const docs = allDocs
          .filter((website) => websiteMatchesCategory(website, "developers"))
          .sort(sortCategoryWebsites);
        return { docs, helperError: null };
      }

      const docs = allDocs
        .filter((website) => websiteMatchesCategory(website, routeCategoryId))
        .sort(sortCategoryWebsites);

      return { docs, helperError: null };
    } catch (helperError) {
      console.error("Website category filtering failed:", helperError);
      return { docs: [], helperError };
    }
  }, [allDocs, cachedCategoryPage, isCategoryPage, isDeveloperSubcategory, activeSubcategorySlug, isDevelopersLanding, routeCategoryId]);

  const categoryDocs = categoryDocsResult.docs;
  const categoryHelperError = routeCategoryResult.helperError || categoryDocsResult.helperError;

  // Phase 1: debounced search. On category routes, search is scoped to that category.
  const { query: searchQ, setQuery: setSearchQ, filtered: searched, isSearching } = useSearch(categoryDocs);

  // Reset page on search/filter change
  useEffect(() => {
    if (searchQ) {
      setDisplayLimit(12);
      return;
    }
    setDisplayLimit(cachedCategoryPage?.visibleCount || 12);
  }, [searchQ, routeCategoryId, activeSubcategorySlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = searched;

  // Pinned first, then featured and stronger public signals.
  const sorted = useMemo(() => {
    let list = [...filtered];
    if (isFavoritesPage) {
      list = list.filter(site => favoriteIds.includes(site.id));
    }
    return list.sort(sortCategoryWebsites);
  }, [filtered, isFavoritesPage, favoriteIds]);

  const shown  = sorted.slice(0, displayLimit);
  const hasMore= sorted.length > displayLimit;
  const hasCachedCategory = Boolean(
    isCategoryPage &&
    cachedCategoryPage?.websites?.length
  );

  // STEA ships with a local public catalog snapshot.
  // Never block category first paint while usable catalog data exists.
  const hasImmediateCatalog =
    Array.isArray(contextWebsites) &&
    contextWebsites.length > 0;

  const shouldShowLoading =
    !hasCachedCategory &&
    !hasImmediateCatalog &&
    sorted.length === 0 &&
    loading;
  const handleRetry = () => {
    try {
      window.dispatchEvent(new Event("stea-data-sync"));
    } catch (e) {}
    if (triggerFetch) triggerFetch();
  };

  const isHomepage = !routeCategory && !legacyCategory && (location.pathname.replace(/\/+$/, "") === "/websites" || location.pathname === "/");

  // Hero chips (homepage trending) — computed unconditionally so hooks order remains stable.
  const heroChips = useMemo(() => {
    const catMap = new Map((categories || []).map((c) => [String(c.slug || c.id || "").toLowerCase(), c]));
    const withMatches = DEFAULT_TRENDING_CHIPS.filter(c => catMap.has(c.slug.toLowerCase()));
    return (withMatches.length >= 6 ? withMatches : DEFAULT_TRENDING_CHIPS).slice(0, 10);
  }, [categories]);

  // Hero search across all published docs using weighted multi-attribute ranking
  const heroSearched = useMemo(() => {
    if (!searchQ || !searchQ.trim()) return allDocs;
    return searchWebsites(allDocs, searchQ);
  }, [allDocs, searchQ]);

  const searchCategoryIntent = useMemo(() => {
    if (!searchQ || !searchQ.trim()) return null;
    return detectCategoryIntent(searchQ, categories, developerSubcategories);
  }, [searchQ, categories, developerSubcategories]);

  // P3/P4 — Splash readiness gate. Ready as soon as server snapshot arrived, an error occurred,
  // or we have locally cached data. Intent: never hold the splash artificially.
  const shellReady = Boolean(
    hasReceivedServerSnapshot ||
    error ||
    catsError ||
    (!loading && categories.length >= 0) ||
    contextWebsites.length > 0 ||
    categoryHelperError
  );

  // Release the startup splash once the catalog shell is genuinely ready, and
  // warm the first screen's icons in parallel (bounded concurrency — never the
  // whole catalog at once).
  useEffect(() => {
    if (!shellReady) return;
    if (Array.isArray(allDocs) && allDocs.length > 0) {
      preloadWebsiteIcons(allDocs);
    }
    try {
      if (typeof window.__steaSplashReady === "function") {
        window.__steaSplashReady("websites-catalog-ready");
      }
    } catch {}
  }, [shellReady, allDocs]);

  const commonSeoProps = (() => {
    if (isDeveloperSubcategory && activeDeveloperSub) {
      return {
        title: `${activeDeveloperSub.label} — Developers Resources — STEA`,
        description: activeDeveloperSub.description || `Discover useful ${activeDeveloperSub.label} resources for developers curated by STEA.`,
        keywords: ["developer tools", activeDeveloperSub.label, "programming resources", "STEA Africa"],
        canonical: `https://stea.africa/websites/developers/${activeSubcategorySlug}`,
        ogUrl: `https://stea.africa/websites/developers/${activeSubcategorySlug}`,
        ogImage: WEBSITES_OG_IMAGE,
        siteName: "STEA",
      };
    }
    if (isDevelopersLanding) {
      return {
        title: "Developers Resources — STEA",
        description: "All essential resources for developers. Discover tools, platforms, documentation and resources for every stage of building software.",
        keywords: ["developer tools", "programming resources", "web development", "databases", "cloud", "apis"],
        canonical: "https://stea.africa/websites/developers",
        ogUrl: "https://stea.africa/websites/developers",
        ogImage: WEBSITES_OG_IMAGE,
        siteName: "STEA",
      };
    }
    if (isCategoryPage) {
      return {
        title: `${categoryLabel} Websites — STEA`,
        description: `Discover useful ${categoryLabel} websites curated by STEA.`,
        keywords: ["websites Tanzania", "tovuti za movies Tanzania", "AI websites Tanzania"],
        canonical: `https://stea.africa/websites/${routeCategoryId}`,
        ogUrl: `https://stea.africa/websites/${routeCategoryId}`,
        ogImage: WEBSITES_OG_IMAGE,
        siteName: "STEA",
      };
    }
    return {
      title: "STEA — Discover Useful Websites by Category",
      description: WEBSITES_SEO_DESCRIPTION,
      keywords: ["STEA Websites", "website categories", "best websites Tanzania"],
      canonical: "https://stea.africa/websites",
      ogUrl: "https://stea.africa/websites",
      ogImage: WEBSITES_OG_IMAGE,
      siteName: "STEA",
    };
  })();
  const commonSeo = <SEOHead {...commonSeoProps} />;

  const openWebsiteDetail = (item) => {
    if (item?.id) cacheWebsite(item);
    if (item) setQuickInfoSite(item);
  };

  // P12 + P13: Lightweight favorites (guest-only on listing — full flow lives on detail).
  // Logged-out users that try to favorite a site from compact listing → open gate.
  
  const onToggleFavorite = async (site) => {
    if (!site?.id) return;
    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }
    await toggleFavorite(site);
  };

  useEffect(() => {
    if (!isCategoryPage || sorted.length === 0) return;
    updateCategoryPageCache(routeCategoryId, {
      websites: sorted,
      visibleCount: displayLimit,
      categoryMeta,
      hasLoaded: true,
      loadedAt: Date.now(),
    });
  }, [isCategoryPage, routeCategoryId, sorted, displayLimit, categoryMeta, updateCategoryPageCache]);

  useEffect(() => {
    if (!isCategoryPage) return undefined;
    return () => saveCategoryScroll(routeCategoryId, window.scrollY);
  }, [isCategoryPage, routeCategoryId, saveCategoryScroll]);

  useEffect(() => {
    if (!isCategoryPage || !cachedCategoryPage || sorted.length === 0) return;
    const restoreKey = `${routeCategoryId}:${cachedCategoryPage.loadedAt || 0}`;
    if (restoredCategoryRef.current === restoreKey) return;
    restoredCategoryRef.current = restoreKey;
    const scrollY = Number(cachedCategoryPage.scrollY || 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    });
  }, [isCategoryPage, routeCategoryId, cachedCategoryPage, sorted.length]);

  // Provide a window-level navigate helper (used by compact list back button)
  useEffect(() => {
    window._sitesOnNavigate = (path) => navigate(path);
    return () => { delete window._sitesOnNavigate; };
  }, [navigate]);

  // P12: bump category-visit once per category-page mount.
  // One extra passive gate eligibility check after settle.
  const lastCatBumpRef = useRef("");
  const scrollMainRef = useRef(null);
  useEffect(() => {
    if (!isCategoryPage) return undefined;
    const key = String(routeCategoryId || "");
    if (!key || lastCatBumpRef.current === key) return undefined;
    lastCatBumpRef.current = key;
    try { gate.recordCategoryVisit && gate.recordCategoryVisit(); } catch {}
    const id = setTimeout(() => {
      try { gate.tryPassiveOpen && gate.tryPassiveOpen(); } catch {}
    }, 1500);
    return () => clearTimeout(id);
  }, [isCategoryPage, routeCategoryId, gate]);

  // Real counts by category using the SAME canonical matcher as category pages.
  // This keeps legacy values such as "Movies & TV Shows" compatible with
  // canonical V2 slugs such as "movies-tv-shows".
  const websitesByCategory = useMemo(() => {
    const map = {};

    for (const category of categories || []) {
      const slug = normalizeWebsiteCategorySlug(
        category.slug || category.categoryId || category.id || category.name
      );

      if (!slug) continue;

      map[slug] = allDocs.filter((website) =>
        websiteMatchesCategory(website, slug)
      );
    }

    return map;
  }, [allDocs, categories]);

  const [activeNavCategory, setActiveNavCategory] = useState("");

  // Canonical homepage category order.
  // Single source of truth for: left nav, right sections, active state, section IDs.
  // Movies & TV Shows first, then Live Sports, eBooks, then the rest of the
  // canonical STEA order. Uses real canonical slugs from categoryOrder.js.
  const HOMEPAGE_CATEGORY_ORDER = useMemo(() => {
    // Reuse canonical order, but Movies & TV Shows must be first.
    const base = DEFAULT_WEBSITE_CATEGORY_ORDER.filter((s) => s !== "movies-tv-shows");
    return ["movies-tv-shows", ...base];
  }, []);

  // Dynamic showcase categories derived from real Firestore categories & runtime website records
  const showcaseCategories = useMemo(() => {
    const priorityIndex = (slug) => {
      const i = HOMEPAGE_CATEGORY_ORDER.indexOf(slug);
      return i === -1 ? 999 : i;
    };
    return (categories || [])
      .map((cat) => {
        const slug = normalizeWebsiteCategorySlug(
          cat.slug || cat.categoryId || cat.id || cat.name
        );
        const title = cat.label || cat.name || getWebsiteCategoryLabel(slug);
        const list = websitesByCategory[slug] || [];
        return { slug, title, list, count: list.length };
      })
      .filter((c) => c.slug && c.list.length > 0)
      .sort((a, b) => {
        const pa = priorityIndex(a.slug);
        const pb = priorityIndex(b.slug);
        if (pa !== pb) return pa - pb;
        // Fallback: keep Firestore order (do NOT sort by count — that breaks sync)
        return 0;
      });
  }, [categories, websitesByCategory, HOMEPAGE_CATEGORY_ORDER]);

  // Active category scroll spy.
  // Observes real homepage category sections with focal-point detection
  useEffect(() => {
    if (!isHomepage) return;

    const updateActive = () => {
      const sections = Array.from(document.querySelectorAll(".sites-category-section[id]"));
      if (sections.length === 0) return;

      const focalY = 160; // Focal reading line below 54px header
      let activeSlug = "";

      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= focalY && rect.bottom > focalY) {
          activeSlug = sec.id.replace("cat-sec-", "");
          break;
        }
      }

      if (!activeSlug && window.scrollY < 300) {
        activeSlug = sections[0]?.id.replace("cat-sec-", "");
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        activeSlug = sections[sections.length - 1]?.id.replace("cat-sec-", "");
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
  }, [isHomepage, showcaseCategories.length]);

  // Auto-scroll the active category into view inside the left rail.
  // Only the sidebar's internal list adjusts — never the whole page.
  useEffect(() => {
    if (!isHomepage || !activeNavCategory) return;
    const rail = document.querySelector(".sites-nav-rail-inner");
    if (!rail) return;
    const activeEl = rail.querySelector(
      `.sites-nav-rail-item[data-cat-slug="${CSS.escape(activeNavCategory)}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeNavCategory, isHomepage]);

  if (isHomepage) {
    const heroSearchSubmit = (q) => {
      const clean = (q || "").toLowerCase().trim();
      if (SECRET_AFTER_DARK_KEYWORDS.includes(clean)) {
        setSearchQ("");
        triggerAgeGateOrNavigate(navigate, "/after-dark");
        return;
      }
      setSearchQ(q || "");
      if (q) {
        setTimeout(() => {
          const el = document.getElementById("sites-home-all");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
      }
    };

    const openDetail = (item) => {
      if (item?.id) cacheWebsite(item);
      if (item) setQuickInfoSite(item);
    };

    const handleSelectCategory = (slug, path) => {
      if (slug === "all") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setActiveNavCategory(slug);
      const el = document.getElementById(`cat-sec-${slug}`);
      if (el) {
        const headerOffset = 68;
        const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      } else {
        navigate(path || `/websites/${slug}`);
      }
    };

    return (
      <>
        <SitesV2Shell seo={commonSeo} user={user} isReady={true} progress={100} onSignIn={openSignInFlow}>
          {/* Full-width atmospheric hero above the rail + content */}
          <SitesHomeHero
            initialQuery={searchQ}
            allWebsites={allDocs}
            categories={categories}
            developerSubcategories={developerSubcategories}
            onSearch={heroSearchSubmit}
            onOpenCategory={(slug, path) => navigate(path || `/websites/${slug}`)}
            onSelectWebsite={openDetail}
            trendingChips={heroChips}
            websiteCount={allDocs.length}
            categoryCount={(categories || []).length}
          />

          {/* Floating Protection Alert at the hero border */}
          <AdBlockerProtectionBanner />

          <div className="sites-discovery-workspace">
            {/* Left Fixed Category Navigation Rail & Mobile Sticky Horizontal Nav */}
            <SitesCategoryNavRail
              categories={showcaseCategories}
              websitesByCategory={websitesByCategory}
              activeCategory={activeNavCategory}
              onSelectCategory={handleSelectCategory}
              totalWebsitesCount={allDocs.length}
            />

            {/* Right Main Discovery Stream */}
            <main className="sites-discovery-main" ref={scrollMainRef}>
              <SitesRecentRail onOpenWebsite={openDetail} />

              {/* Error/Loading fallback panel for home category data */}
              {catsError && !catsLoading && categories.length === 0 ? (
                <div style={{ padding: "22px 0" }}>
                  <STEADataFallback onRetry={handleRetry} />
                </div>
              ) : (
                <div id="sites-home-all">
                  {/* P5-P6 search results or empty hint */}
                  {searchQ && (
                    <div style={{ padding: "18px 0 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: TOKENS.text2, fontWeight: 750 }}>
                          {heroSearched.length === 1 ? (
                            <span>1 website found for <strong style={{ color: TOKENS.goldHi }}>&ldquo;{searchQ}&rdquo;</strong></span>
                          ) : (
                            <span>{heroSearched.length} websites found for <strong style={{ color: TOKENS.goldHi }}>&ldquo;{searchQ}&rdquo;</strong></span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchQ("")}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: TOKENS.gold,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "4px 8px",
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      {searchCategoryIntent && (
                        <div
                          onClick={() => navigate(searchCategoryIntent.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: "rgba(245, 166, 35, 0.08)",
                            border: "1px solid rgba(245, 166, 35, 0.25)",
                            marginBottom: 14,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="sites-intent-icon" aria-hidden="true" style={{ color: TOKENS.goldHi, display: "inline-flex", alignItems: "center" }}>
                              {searchCategoryIntent.type === "subcategory" ? (
                                <DeveloperSubcategoryOutlineIcon slug={searchCategoryIntent.id || searchCategoryIntent.slug} size={22} />
                              ) : (
                                <CategoryOutlineIcon slug={searchCategoryIntent.slug || searchCategoryIntent.id} size={22} />
                              )}
                            </span>
                            <div>
                              <div style={{ fontSize: 10, color: TOKENS.goldHi, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                Matching {searchCategoryIntent.type === "subcategory" ? "Subcategory" : "Category"}
                              </div>
                              <strong style={{ fontSize: 14, color: "#fff" }}>{searchCategoryIntent.label}</strong>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: TOKENS.goldHi, fontSize: 12, fontWeight: 700 }}>
                            <span>Browse All</span>
                            <ChevronRight size={15} />
                          </div>
                        </div>
                      )}

                      {heroSearched.length === 0 ? (
                        <div className="empty-state-card" role="status" style={{ background: TOKENS.panel, border: `1px solid ${TOKENS.border}`, color: TOKENS.text, padding: "28px 16px", textAlign: "center", borderRadius: 12 }}>
                          <div className="empty-state-icon" style={{ width: 44, height: 44, borderRadius: 999, background: TOKENS.goldSoft, color: TOKENS.gold, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>🔍</div>
                          <h3 className="empty-state-title" style={{ color: TOKENS.text, margin: "0 0 6px", fontSize: 16, fontWeight: 800 }}>No websites found for &ldquo;{searchQ}&rdquo;</h3>
                          <p className="empty-state-text" style={{ color: TOKENS.text2, fontSize: 13, maxWidth: 360, margin: "0 auto 16px" }}>
                            Try searching with different keywords, check your spelling, or explore categories below.
                          </p>
                          <button type="button" className="empty-state-button" onClick={() => setSearchQ("")} style={{ appearance: "none", border: 0, padding: "8px 16px", borderRadius: 8, background: TOKENS.goldSoft, color: TOKENS.goldHi, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Clear Search</button>
                        </div>
                      ) : (
                        <SitesCompactList
                          favoriteIds={favoriteIds}
                          websites={heroSearched}
                          onOpenWebsite={openDetail}
                          onToggleFavorite={onToggleFavorite}
                          density="compact"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Category Showcase Sections */}
              {!searchQ && (
                <div className="sites-home-showcase-sections" style={{ marginTop: 20 }}>
                  {showcaseCategories.map(({ slug, title, list, count }) => (
                    <SitesCategorySection
                      key={slug}
                      title={title}
                      categorySlug={slug}
                      websites={list}
                      totalCount={count}
                      onOpenWebsite={openDetail}
                      onToggleFavorite={onToggleFavorite}
                      favoriteIds={favoriteIds}
                      maxItems={999}
                    />
                  ))}
                </div>
              )}

              {/* P8: Browse by Category — dark premium tiles with real counts. */}
              <SitesCategoryTiles
                categories={categories}
                developerSubcategories={developerSubcategories}
                websitesByCategory={websitesByCategory}
                allWebsites={allDocs}
                onNavigate={(path) => navigate(path)}
              />

              {/* Branded STEA Ecosystem Showcase & Rich Footer */}
              <Suspense fallback={null}>
                <SitesEcosystemFooter />
              </Suspense>
            </main>
          </div>
        </SitesV2Shell>
        <SitesMemberGate
          open={gate.open}
          user={user}
          onClose={gate.closeGate}
          onDismiss={gate.dismiss}
        />
        <WebsiteQuickInfoModal
          site={quickInfoSite}
          onClose={() => setQuickInfoSite(null)}
          onToggleFavorite={onToggleFavorite}
          isFavorite={quickInfoSite ? (isFavorite ? isFavorite(quickInfoSite.id) : (favoriteIds || []).includes(quickInfoSite.id)) : false}
        />
      </>
    );
  }

  return (
    <>
      <SitesV2Shell seo={commonSeo} user={user} isReady={true} progress={100} onSignIn={openSignInFlow}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="website-category-page-shell" style={{ padding: `16px 0` }}>

        {categoryHelperError ? (
          <WebsitesCategoryLoadFallback onRetry={handleRetry} />
        ) : error || !navigator.onLine ? (
          <div style={{ padding: "22px 0" }}><STEADataFallback onRetry={handleRetry} /></div>
        ) : isDevelopersLanding ? (
          <div className="sites-dev-hub-shell">
            {/* Developer Landing Header */}
            <header className="sites-dev-hub-header">
              <button
                type="button"
                className="sites-compact-back"
                onClick={() => navigate("/websites")}
                aria-label="Back to Categories"
              >
                <ArrowLeft size={14} strokeWidth={2.3} aria-hidden />
                <span>{t("buttons.back", "Back to Categories")}</span>
              </button>

              <div className="sites-dev-hub-badge">
                <Code2 size={13} />
                <span>DEVELOPERS ECOSYSTEM</span>
              </div>

              <h1 className="sites-dev-hub-title">Developers Resources</h1>
              <p className="sites-dev-hub-subtitle">All essential resources for developers</p>
              <p className="sites-dev-hub-desc">
                All essential resources for developers. Discover tools, platforms, documentation and resources for every stage of building software.
              </p>
            </header>

            {/* 20 Developer Subcategory Cards */}
            <div className="sites-dev-hub-subgrid-title">
              <h3>20 Specialized Developer Subcategories</h3>
              <span>Choose a topic or search all resources below</span>
            </div>

            <div className="sites-dev-hub-subgrid">
              {(developerSubcategories && developerSubcategories.length > 0 ? developerSubcategories : DEVELOPER_SUBCATEGORIES).map((sub) => {
                const subId = sub.id || sub.slug;
                const subLabel = sub.label || sub.name;
                const count = typeof sub.count === "number" ? sub.count : getWebsiteCountForSubcategory(subId, allDocs);
                return (
                  <button
                    key={subId}
                    type="button"
                    className="sites-dev-hub-subcard"
                    onClick={() => navigate(`/websites/developers/${subId}`)}
                    aria-label={`${subLabel} — ${count} sites`}
                  >
                    <div className="sites-dev-hub-subcard-left">
                      <span className="sites-dev-hub-sub-icon" aria-hidden="true">
                        <DeveloperSubcategoryOutlineIcon slug={subId} size={20} />
                      </span>
                      <div className="sites-dev-hub-sub-meta">
                        <span className="sites-dev-hub-sub-name">{subLabel}</span>
                        <span className="sites-dev-hub-sub-count">
                          {t("categories.siteCount", "{n} sites").replace("{n}", String(count))}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="sites-dev-hub-sub-chevron" />
                  </button>
                );
              })}
            </div>

            {/* All Developer Tools Compact List */}
            <div className="sites-dev-hub-all-section">
              <SitesCompactList
                loading={shouldShowLoading}
                sites={categoryDocs}
                categoryName="All Developer Resources"
                categorySlug="developers"
                description="Explore all curated developer resources, frameworks, platforms and tools."
                siteCount={categoryDocs.length}
                onOpenWebsite={openWebsiteDetail}
                onToggleFavorite={onToggleFavorite}
                favoriteIds={favoriteIds}
                onBack={() => navigate("/websites")}
                searchPlaceholder="Search all developer resources, APIs, tools, databases..."
              />
            </div>
          </div>
        ) : isDeveloperSubcategory ? (
          <SitesCompactList
            loading={shouldShowLoading}
            sites={categoryDocs}
            categoryName={categoryLabel}
            categorySlug={`developers/${activeSubcategorySlug}`}
            description={categoryMeta?.description}
            siteCount={categoryDocs.length}
            onOpenWebsite={openWebsiteDetail}
            onToggleFavorite={onToggleFavorite}
            favoriteIds={favoriteIds}
            onBack={() => navigate("/websites/developers")}
            searchPlaceholder={`Search in ${categoryLabel}...`}
          />
        ) : (
          <SitesCompactList
            loading={shouldShowLoading}
            sites={isCategoryPage ? categoryDocs : sorted}
            categoryName={isFavoritesPage ? "My Favorites" : (isCategoryPage ? translatedCategoryLabel : t("admin.allCategories", "All Websites"))}
            categorySlug={routeCategoryId || null}
            description={isFavoritesPage ? "Your saved websites" : (categoryMeta?.description || (isCategoryPage ? t("category.heroDescription", { category: translatedCategoryLabel }) : ""))}
            siteCount={isCategoryPage ? categoryDocs.length : sorted.length}
            // Explicit category count label: "{n} useful websites" via SitesCompactList default
            onOpenWebsite={openWebsiteDetail}
            onToggleFavorite={onToggleFavorite}
            favoriteIds={favoriteIds}
            onBack={() => navigate("/websites")}
            searchPlaceholder={isCategoryPage ? t("search.categoryPlaceholder", { category: translatedCategoryLabel }) : t("search.generalPlaceholder")}
          />
        )}

        {suggestSuccess && (
          <div style={{ marginTop: 18, padding: "12px 16px", borderRadius: TOKENS.radius, background: TOKENS.panel2, border: `1px solid ${TOKENS.border}`, color: TOKENS.text2, fontSize: 13, fontWeight: 600 }}>
            {suggestSuccess}
          </div>
        )}
      </div>
      </div>
      {suggestModalOpen && (
        <SuggestWebsiteModal
          categoryLabel={translatedCategoryLabel}
          categorySlug={routeCategoryId}
          onClose={() => setSuggestModalOpen(false)}
          onSuccess={() => setSuggestSuccess(t("notifications.suggestionSent"))}
        />
      )}
      <style>{`
        /* Developer Hub Landing styles */
        .sites-dev-hub-shell {
          padding-bottom: 24px;
        }
        .sites-dev-hub-header {
          margin-bottom: 24px;
        }
        .sites-dev-hub-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: ${TOKENS.goldSoft};
          color: ${TOKENS.goldHi};
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-top: 14px;
          margin-bottom: 10px;
        }
        .sites-dev-hub-title {
          margin: 0 0 6px;
          font-family: "'Bricolage Grotesque', 'Instrument Sans', system-ui, sans-serif";
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 900;
          color: var(--stea-text);
          letter-spacing: -0.02em;
        }
        .sites-dev-hub-subtitle {
          margin: 0 0 8px;
          font-size: clamp(14px, 2.5vw, 17px);
          font-weight: 700;
          color: ${TOKENS.gold};
        }
        .sites-dev-hub-desc {
          margin: 0;
          font-size: 13.5px;
          color: ${TOKENS.text2};
          max-width: 680px;
          line-height: 1.5;
        }
        .sites-dev-hub-subgrid-title {
          margin: 28px 0 14px;
        }
        .sites-dev-hub-subgrid-title h3 {
          margin: 0 0 4px;
          font-family: "'Bricolage Grotesque', sans-serif";
          font-size: 16px;
          font-weight: 800;
          color: ${TOKENS.text};
        }
        .sites-dev-hub-subgrid-title span {
          font-size: 12px;
          color: ${TOKENS.text3};
          font-weight: 600;
        }
        .sites-dev-hub-subgrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 32px;
        }
        @media (max-width: 1100px) { .sites-dev-hub-subgrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 768px)  { .sites-dev-hub-subgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 480px)  { .sites-dev-hub-subgrid { grid-template-columns: repeat(1, minmax(0, 1fr)); } }

        .sites-dev-hub-subcard {
          appearance: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: ${TOKENS.panel};
          border: 1px solid ${TOKENS.border};
          border-radius: 12px;
          cursor: pointer;
          color: var(--stea-text);
          font-family: inherit;
          text-align: left;
          transition: background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
          min-height: 56px;
        }
        .sites-dev-hub-subcard:hover {
          background: ${TOKENS.panel2};
          border-color: #F5A623;
          transform: translateY(-2px);
          box-shadow: 0 0 12px rgba(245, 166, 35, 0.22), 0 8px 20px rgba(0,0,0,0.3);
        }
        .sites-dev-hub-subcard-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sites-dev-hub-sub-icon {
          flex: 0 0 20px;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #a1a1aa;
          flex-shrink: 0;
          transition: color 140ms ease;
        }
        .sites-dev-hub-subcard:hover .sites-dev-hub-sub-icon {
          color: #F5A623;
        }
        .sites-dev-hub-sub-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sites-dev-hub-sub-name {
          font-size: 13px;
          font-weight: 800;
          color: var(--stea-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sites-dev-hub-sub-count {
          font-size: 11px;
          color: ${TOKENS.text3};
          font-weight: 600;
        }
        .sites-dev-hub-sub-chevron {
          color: ${TOKENS.text3};
          flex-shrink: 0;
          margin-left: 6px;
        }
        .sites-dev-hub-subcard:hover .sites-dev-hub-sub-chevron {
          color: ${TOKENS.gold};
        }
        .sites-dev-hub-all-section {
          margin-top: 20px;
          border-top: 1px solid ${TOKENS.border};
          padding-top: 16px;
        }

        .suggest-success-message {
          margin: 0;
        }

        .suggest-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(5, 7, 11, 0.62);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .suggest-modal {
          width: min(640px, 100%);
          max-height: min(760px, calc(100vh - 36px));
          overflow: auto;
          box-sizing: border-box;
          border: 1px solid ${TOKENS.border};
          border-radius: 20px;
          background: ${TOKENS.panel};
          color: ${TOKENS.text};
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.48);
          padding: 22px;
        }

        .suggest-modal-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .suggest-modal-head h2 {
          margin: 0;
          color: ${TOKENS.text};
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .suggest-modal-head p {
          margin: 5px 0 0;
          color: ${TOKENS.text2};
          font-size: 13.5px;
          line-height: 1.5;
        }

        .suggest-modal-head button {
          width: 34px;
          height: 34px;
          border: 1px solid ${TOKENS.border};
          border-radius: 999px;
          background: ${TOKENS.panel2};
          color: ${TOKENS.text2};
          cursor: pointer;
          flex: 0 0 auto;
          font-size: 22px;
          line-height: 1;
        }
        .suggest-modal-head button:hover { color: ${TOKENS.text}; border-color: ${TOKENS.borderHi}; }

        .suggest-modal label {
          display: grid;
          gap: 7px;
          margin-top: 12px;
          color: ${TOKENS.text2};
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        .suggest-modal input,
        .suggest-modal textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid ${TOKENS.border};
          border-radius: 12px;
          background: ${TOKENS.surface};
          color: ${TOKENS.text};
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          outline: none;
          padding: 11px 12px;
          transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }
        .suggest-modal input:focus,
        .suggest-modal textarea:focus {
          border-color: color-mix(in srgb, ${TOKENS.gold} 60%, transparent);
          background: ${TOKENS.panel};
          box-shadow: 0 0 0 4px ${TOKENS.goldSoft};
        }

        .suggest-modal textarea {
          min-height: 88px;
          resize: vertical;
          line-height: 1.45;
        }

        .suggest-form-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .suggest-form-error {
          border: 1px solid color-mix(in srgb, ${TOKENS.danger} 50%, transparent);
          border-radius: 12px;
          background: color-mix(in srgb, ${TOKENS.danger} 14%, transparent);
          color: color-mix(in srgb, ${TOKENS.danger} 90%, #fff);
          font-size: 12.5px;
          font-weight: 800;
          padding: 10px 12px;
          margin-top: 12px;
        }

        .suggest-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .suggest-modal-actions button {
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          font: inherit;
          font-size: 13.5px;
          font-weight: 900;
          padding: 11px 16px;
        }

        .suggest-modal-actions button:first-child {
          background: ${TOKENS.panel2};
          color: ${TOKENS.text2};
          border: 1px solid ${TOKENS.border};
        }

        .suggest-modal-actions button:last-child {
          background: linear-gradient(180deg, ${TOKENS.goldHi}, ${TOKENS.gold});
          color: #111;
          box-shadow: 0 10px 24px rgba(245, 166, 35, 0.22);
        }

        @media(min-width:720px){.sites-lang{display:inline-flex!important}}

        @media(max-width:640px){
          .website-category-page-shell {
            padding: 18px 14px 32px !important;
          }

          .suggest-modal-backdrop {
            align-items: end;
            padding: 10px;
          }

          .suggest-modal {
            max-height: calc(100vh - 20px);
            border-radius: 20px;
            padding: 18px;
          }

          .suggest-modal-head h2 {
            font-size: 20px;
          }

          .suggest-form-two {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .suggest-modal-actions {
            flex-direction: column-reverse;
          }

          .suggest-modal-actions button {
            width: 100%;
          }
        }

        .empty-state-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          border-radius: 28px;
          padding: 48px 24px;
          text-align: center;
          color: #0f172a;
          margin-top: 12px;
        }

        .empty-state-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: #fff7df;
          color: #b77900;
          font-size: 34px;
          margin: 0 auto 18px;
        }

        .empty-state-title {
          color: #0f172a;
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 8px;
        }

        .empty-state-text {
          color: #64748b;
          font-size: 16px;
          line-height: 1.6;
          max-width: 520px;
          margin: 10px auto 0;
        }

        .empty-state-button {
          margin-top: 22px;
          min-height: 48px;
          padding: 0 24px;
          border-radius: 999px;
          background: #f5b52e;
          color: #111827;
          font-weight: 800;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 600px) {
          .empty-state-card {
            padding: 32px 18px;
            border-radius: 22px;
          }
          .empty-state-title {
            font-size: 22px;
          }
          .empty-state-text {
            font-size: 15px;
          }
          .empty-state-button {
            width: 100%;
          }
        }

      `}</style>
        {/* Branded STEA Ecosystem Showcase & Rich Footer */}
        <Suspense fallback={null}>
          <SitesEcosystemFooter />
        </Suspense>
      </SitesV2Shell>
      <SitesMemberGate
        open={gate.open}
        user={user}
        onClose={gate.closeGate}
        onDismiss={gate.dismiss}
      />
      <WebsiteQuickInfoModal
        site={quickInfoSite}
        onClose={() => setQuickInfoSite(null)}
        onToggleFavorite={onToggleFavorite}
        isFavorite={quickInfoSite ? (isFavorite ? isFavorite(quickInfoSite.id) : (favoriteIds || []).includes(quickInfoSite.id)) : false}
      />
    </>
  );
}
