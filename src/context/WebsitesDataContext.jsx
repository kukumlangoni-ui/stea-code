import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { collection, getFirebaseDb, onSnapshot, query } from "../firebase.js";
import seedMovieSites from "../data/seedMovieSites.js";

function numericSortOrder(value, fallback = 999) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function websiteSortTime(site) {
  const value = site?.updatedAt || site?.createdAt || site?.lastCheckedAt;
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === "number") return value;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortWebsitesByOrder(a, b) {
  const orderDiff = numericSortOrder(a?.sortOrder, numericSortOrder(a?.sort_order, numericSortOrder(a?.displayOrder)))
    - numericSortOrder(b?.sortOrder, numericSortOrder(b?.sort_order, numericSortOrder(b?.displayOrder)));
  if (orderDiff !== 0) return orderDiff;
  return websiteSortTime(b) - websiteSortTime(a);
}

const formattedSeedMovieSites = (Array.isArray(seedMovieSites) ? seedMovieSites : []).map((site, index) => {
  let domain = "";
  try {
    if (site.url) domain = new URL(site.url).hostname.replace(/^www\./, "");
  } catch {}
  const slug = String(site.name || `site-${index}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `seed-movie-${index}-${slug}`,
    slug: slug,
    name: site.name,
    title: site.name,
    url: site.url,
    domain: domain,
    categoryId: "movies-tv-shows",
    categorySlug: "movies-tv-shows",
    category: "Movies & TV Shows",
    description: site.description || "",
    pricing: site.pricing || "Free",
    pricingType: site.pricingType || "free",
    sourceStatus: site.sourceStatus || "official",
    isTrusted: site.sourceStatus === "official" || site.sourceStatus === "verified" || index < 6,
    tags: site.tags || ["movies", "tv shows"],
    sortOrder: index + 1,
    views: Math.floor(1200 + index * 45),
    ...site,
  };
});

function buildInitialCatalog(sitesSnapshot = []) {
  const existingMap = new Map();
  if (Array.isArray(sitesSnapshot)) {
    sitesSnapshot.forEach((s) => {
      const key = (s.domain || s.url || s.name || s.id || "").toLowerCase();
      if (key) existingMap.set(key, s);
    });
  }
  formattedSeedMovieSites.forEach((seed) => {
    const key = (seed.domain || seed.url || seed.name || seed.id || "").toLowerCase();
    if (!existingMap.has(key)) {
      existingMap.set(key, seed);
    } else {
      const existing = existingMap.get(key);
      existingMap.set(key, { ...seed, ...existing });
    }
  });
  return Array.from(existingMap.values()).sort(sortWebsitesByOrder);
}

const initialSnapshot = buildInitialCatalog();

// ── Persistent offline catalog cache ───────────────────────────────────────
// Keeps the user's last successfully loaded Firestore catalog available on
// offline refresh. Priority on startup:
//   1. localStorage cache (last seen online catalog) — preferred
//   2. initialSnapshot (bundled static catalog) — emergency baseline
// On onSnapshot error (offline), the existing docs state is preserved
// rather than being replaced with [] — see the error handler below.
const CATALOG_CACHE_KEY = "stea_websites_catalog_v1";
const CATALOG_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const CATALOG_CACHE_MAX_BYTES = 4_000_000; // localStorage safety cap

function loadCachedCatalog() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.websites)) return null;
    if (typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > CATALOG_CACHE_MAX_AGE_MS) return null;
    return parsed.websites;
  } catch {
    return null;
  }
}

function saveCachedCatalog(websites) {
  if (typeof localStorage === "undefined") return;
  try {
    if (!Array.isArray(websites) || websites.length === 0) return;
    const payload = JSON.stringify({ version: 1, savedAt: Date.now(), websites });
    if (payload.length > CATALOG_CACHE_MAX_BYTES) return;
    localStorage.setItem(CATALOG_CACHE_KEY, payload);
  } catch {
    // localStorage may be full or blocked (private mode) — silently ignore.
  }
}

const initialCachedCatalog = loadCachedCatalog();
const initialDocs =
  Array.isArray(initialCachedCatalog) && initialCachedCatalog.length > 0
    ? initialCachedCatalog
    : initialSnapshot;

const WebsitesDataContext = createContext({
  websites: initialSnapshot,
  loading: false,
  error: null,
  initialLoadDone: true,
  hasReceivedServerSnapshot: false,
  catalogProgress: 100,
  lastUpdatedAt: 0,
  cacheWebsite: () => {},
  triggerFetch: () => {},
  getCategoryPageCache: () => null,
  updateCategoryPageCache: () => {},
  saveCategoryScroll: () => {},
});

function mergeWebsite(existing, incoming) {
  if (!incoming?.id) return existing;
  const index = existing.findIndex((site) => site.id === incoming.id);
  if (index === -1) return [incoming, ...existing];
  const next = [...existing];
  next[index] = { ...next[index], ...incoming };
  return next;
}

export function WebsitesDataProvider({ children, enabled = true }) {
  const [docs, setDocs] = useState(initialDocs);
  const [hasTriggeredFetch, setHasTriggeredFetch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(true);
  const [hasReceivedServerSnapshot, setHasReceivedServerSnapshot] = useState(false);
  const [localWebsites, setLocalWebsites] = useState([]);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(0);
  const [collectionUpdatedAt, setCollectionUpdatedAt] = useState(0);
  const [cacheBust, setCacheBust] = useState(0);

  // ── Deferred static catalog (performance) ────────────────────────────────
  // sitesCatalogSnapshot.json is ~1.6 MB. Importing it statically pulls the
  // whole file into the entry bundle and delays the first paint of every
  // visit. It is now imported dynamically after mount, so the initial bundle
  // stays light and the snapshot is merged in as the LOWEST-priority baseline
  // once it arrives — Firestore data and locally cached data always win.
  const [snapshotSites, setSnapshotSites] = useState([]);

  useEffect(() => {
    let cancelled = false;
    import("../data/sitesCatalogSnapshot.json")
      .then((mod) => {
        if (cancelled) return;
        const snapshot = Array.isArray(mod.default) ? mod.default : [];
        if (snapshot.length > 0) setSnapshotSites(snapshot);
      })
      .catch(() => {
        // Ignore snapshot failures — the catalog still renders from Firestore
        // and from the localStorage cache.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshotCatalog = useMemo(() => buildInitialCatalog(snapshotSites), [snapshotSites]);

  const triggerFetch = useCallback(() => {
    setHasTriggeredFetch(true);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setCacheBust((prev) => prev + 1);
    };
    window.addEventListener("stea-data-sync", handleSync);
    return () => window.removeEventListener("stea-data-sync", handleSync);
  }, []);

  useEffect(() => {
    if (!enabled || !hasTriggeredFetch) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      setInitialLoadDone(true);
      setError(new Error("Connection problem"));
      return undefined;
    }

    setLoading(docs.length === 0);
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setLoading(false);
      setInitialLoadDone(true);
      setError((current) => current || new Error("Connection problem"));
    }, 15000);

    const unsub = onSnapshot(
      query(collection(db, "websites")),
      { includeMetadataChanges: true },
      (snap) => {
        if (!isMounted) return;
        clearTimeout(timer);
        if (!snap.metadata.fromCache) setHasReceivedServerSnapshot(true);
        setError(null);
        const fetched = snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort(sortWebsitesByOrder);
        setDocs(fetched);
        // Persist the latest canonical catalog so a later offline refresh
        // can show the user's last-seen catalog instead of the bundled
        // emergency baseline. Only server-fresh snapshots are persisted.
        if (!snap.metadata.fromCache) saveCachedCatalog(fetched);
        setLoading(false);
        setInitialLoadDone(true);
      },
      (err) => {
        if (!isMounted) return;
        clearTimeout(timer);
        setError(err);
        setLoading(false);
        setInitialLoadDone(true);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsub();
    };
  }, [enabled, hasTriggeredFetch, cacheBust]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Array.isArray(docs) && docs.length > 0) setCollectionUpdatedAt(Date.now());
  }, [docs]);

  const websites = useMemo(() => {
    const byId = new Map();
    // Lowest priority: deferred bundled snapshot (static baseline).
    snapshotCatalog.forEach((site) => {
      if (site?.id) byId.set(site.id, site);
    });
    localWebsites.forEach((site) => {
      if (site?.id) byId.set(site.id, site);
    });
    (Array.isArray(docs) ? docs : []).forEach((site) => {
      if (site?.id) byId.set(site.id, { ...(byId.get(site.id) || {}), ...site });
    });
    return Array.from(byId.values()).sort(sortWebsitesByOrder);
  }, [docs, localWebsites, snapshotCatalog]);

  const cacheWebsite = useCallback((site) => {
    if (!site?.id) return;
    setLocalWebsites((current) => mergeWebsite(current, site));
    setLocalUpdatedAt(Date.now());
  }, []);

  const getCategoryPageCache = useCallback((categorySlug) => {
    return null;
  }, []);

  const updateCategoryPageCache = useCallback((categorySlug, patch) => {}, []);

  const saveCategoryScroll = useCallback((categorySlug, scrollY) => {}, []);

  const catalogProgress = useMemo(() => {
    if (hasReceivedServerSnapshot || (initialLoadDone && docs.length > 0)) return 100;
    if (docs.length > 0) return 85;
    if (websites.length > 0) return 35;
    if (hasTriggeredFetch) return 20;
    return 12;
  }, [hasReceivedServerSnapshot, initialLoadDone, docs.length, websites.length, hasTriggeredFetch]);

  const value = useMemo(() => ({
    websites,
    loading: loading && websites.length === 0,
    error,
    initialLoadDone: initialLoadDone || websites.length > 0 || !hasTriggeredFetch,
    hasReceivedServerSnapshot,
    catalogProgress,
    lastUpdatedAt: Math.max(localUpdatedAt, collectionUpdatedAt),
    cacheWebsite,
    triggerFetch,
    getCategoryPageCache,
    updateCategoryPageCache,
    saveCategoryScroll,
  }), [websites, loading, error, initialLoadDone, hasReceivedServerSnapshot, catalogProgress, localUpdatedAt, collectionUpdatedAt, cacheWebsite, triggerFetch, hasTriggeredFetch, getCategoryPageCache, updateCategoryPageCache, saveCategoryScroll]);

  return <WebsitesDataContext.Provider value={value}>{children}</WebsitesDataContext.Provider>;
}

export function useWebsitesData() {
  return useContext(WebsitesDataContext);
}
