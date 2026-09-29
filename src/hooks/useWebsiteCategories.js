import { useState, useEffect, useMemo, useCallback } from "react";
import { getFirebaseDb, collection, getDocs, query, limit, orderBy } from "../firebase.js";
import {
  WEBSITE_CATEGORIES,
  DEVELOPER_SUBCATEGORIES,
  getCategoryIcon,
  getCategoryId,
  canonicalCategoryFrom,
  getCategoryIconAndDescription,
  CATEGORY_ORDER
} from "../data/websiteCategories.js";
import {
  getWebsiteCountForCategory,
  getWebsiteCountForSubcategory,
  sortWebsiteCategories,
  normalizeCategorySlugForOrder
} from "../constants/categoryOrder.js";

const CAT_CACHE_KEY = "stea_sites_categories_cache_v3";
const CAT_CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes — categories very rarely change

function readCatCache() {
  try {
    const raw = localStorage.getItem(CAT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.categories)) return null;
    const age = Date.now() - (parsed.savedAt || 0);
    if (age > CAT_CACHE_MAX_AGE) return null;
    return parsed.categories;
  } catch { return null; }
}
function writeCatCache(categories) {
  try {
    localStorage.setItem(CAT_CACHE_KEY, JSON.stringify({ categories, savedAt: Date.now() }));
  } catch {}
}

export function invalidateWebsiteCategoriesCache() {
  try {
    localStorage.removeItem(CAT_CACHE_KEY);
    window.dispatchEvent(new CustomEvent("stea-websites-categories-invalidated"));
    window.dispatchEvent(new Event("stea-data-sync"));
  } catch {}
}

function numericSortOrder(value, fallback = 999) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * useWebsiteCategories
 * Single source of truth for all website categories across the STEA ecosystem.
 * Merges:
 * 1. Firestore `website_solution_categories`
 * 2. Built-in defaults `WEBSITE_CATEGORIES`
 * 3. Discovered categories from published websites
 *
 * @param {Array} websites - Raw website documents (e.g. from useWebsitesData) to discover categories from.
 */
export function useWebsiteCategories(websites = []) {
  const [firestoreCats, setFirestoreCats] = useState(() => readCatCache() || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheBust, setCacheBust] = useState(0);

  const reloadFromStorage = useCallback(() => {
    try { localStorage.removeItem(CAT_CACHE_KEY); } catch {}
    setCacheBust((value) => value + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("stea-websites-categories-invalidated", reloadFromStorage);
    window.addEventListener("stea-data-sync", reloadFromStorage);
    return () => {
      window.removeEventListener("stea-websites-categories-invalidated", reloadFromStorage);
      window.removeEventListener("stea-data-sync", reloadFromStorage);
    };
  }, [reloadFromStorage]);

  // 1. Fetch Firestore categories — one-time + local cache
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return undefined; }

    const hasCache = firestoreCats.length > 0;
    setLoading(!hasCache);

    let cancelled = false;
    getDocs(query(collection(db, "website_solution_categories"), limit(300)))
      .then((snap) => {
        if (cancelled) return;
        const nextCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setError(null);
        setFirestoreCats(nextCategories);
        writeCatCache(nextCategories);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("useWebsiteCategories firestore error:", err.message);
        if (!hasCache) setError(err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [cacheBust]); // eslint-disable-line react-hooks/exhaustive-deps

  // Published websites filter
  const publishedWebsites = useMemo(() => {
    return (websites || []).filter(site => {
      const status = String(site.status || "published").toLowerCase().trim();
      return (status === "published" || !site.status) && site.deleted !== true && site.active !== false;
    });
  }, [websites]);

  // 2. Developer Subcategories with real counts
  const developerSubcategories = useMemo(() => {
    return DEVELOPER_SUBCATEGORIES.map((sub, index) => {
      const count = getWebsiteCountForSubcategory(sub.id, publishedWebsites);
      return {
        ...sub,
        count,
        websiteCount: count,
        slug: sub.id,
        name: sub.label,
        sortOrder: index + 1
      };
    });
  }, [publishedWebsites]);

  // 3. Merge all sources for main categories
  const mergedCategories = useMemo(() => {
    const byId = new Map();

    // Helper to shape and merge category
    const addCategory = (raw, source) => {
      const canonical = canonicalCategoryFrom(raw.name || raw.slug || raw.id || raw.title);
      if (!canonical.id) return;
      
      const normalizedStatus = String(raw.status || "active").toLowerCase().trim();
      const isDeleted = normalizedStatus === "deleted" || raw.deleted === true;
      const isInactive = raw.isActive === false || normalizedStatus === "inactive";
      const status = isDeleted ? "deleted" : (isInactive ? "inactive" : "active");

      const existing = byId.get(canonical.id);
      const fallbackMeta = getCategoryIconAndDescription(canonical.label);
      const nextActive = status === "active";
      const fallbackIndex = CATEGORY_ORDER.indexOf(canonical.id);
      const fallbackOrder = fallbackIndex === -1 ? 999 : fallbackIndex + 1;

      const newCat = {
        ...existing,
        ...raw,
        id: existing?.id || raw.id || canonical.id,
        categoryId: canonical.id,
        name: canonical.label,
        slug: canonical.id,
        icon: String(raw.icon || raw.emoji || raw.categoryIcon || existing?.icon || fallbackMeta.icon || getCategoryIcon(canonical.label)).trim(),
        description: String(raw.description || existing?.description || fallbackMeta.description || "").trim(),
        status: source === "firestore" ? status : (existing?.status || (nextActive ? "active" : status)),
        sortOrder: numericSortOrder(raw.sortOrder, fallbackOrder),
        source: existing ? `${existing.source},${source}` : source,
        builtIn: existing?.builtIn || source === "builtin",
      };

      byId.set(canonical.id, newCat);
    };

    // A. Built-in (18 canonical categories)
    WEBSITE_CATEGORIES.forEach(cat => addCategory({ ...cat, name: cat.label }, "builtin"));

    // B. Firestore
    firestoreCats.forEach(cat => addCategory(cat, "firestore"));

    // C. Discovered from websites
    publishedWebsites.forEach(site => {
      const categoryValue = site.categorySlug || site.category || site.categoryName || site.categoryId;
      if (categoryValue) {
        const canonical = canonicalCategoryFrom(categoryValue);
        if (canonical.id && !byId.has(canonical.id)) {
          addCategory({ name: canonical.label, slug: canonical.id }, "discovered");
        }
      }
    });

    // Final mapping with counts and visibility
    const mapped = Array.from(byId.values()).map(cat => {
      const count = getWebsiteCountForCategory(cat, publishedWebsites);
      const isVisible = cat.status === "active" || count > 0;
      return {
        ...cat,
        websiteCount: count,
        count,
        isVisible
      };
    });

    const dedupeMap = new Map();
    mapped.forEach((cat) => {
      const slug = normalizeCategorySlugForOrder(cat.slug || cat.id || cat.name);
      const existing = dedupeMap.get(slug);

      if (!existing) {
        dedupeMap.set(slug, { ...cat, slug });
      } else {
        dedupeMap.set(slug, {
          ...existing,
          ...cat,
          slug,
          websiteCount: Math.max(existing.websiteCount || 0, cat.websiteCount || 0),
          count: Math.max(existing.count || 0, cat.count || 0),
        });
      }
    });

    const dedupedCategories = Array.from(dedupeMap.values());
    return sortWebsiteCategories(dedupedCategories);

  }, [firestoreCats, publishedWebsites]);

  return {
    categories: mergedCategories,
    developerSubcategories,
    loading: loading && mergedCategories.length === 0,
    error,
    refreshCategories: reloadFromStorage
  };
}
