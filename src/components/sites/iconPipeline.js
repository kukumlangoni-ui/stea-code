/**
 * iconPipeline — fast, cached website-icon resolution + preloading.
 *
 * Why this exists
 * ---------------
 * The catalog (React render + Firestore data) becomes available long before the
 * remote favicon images do. The old pipeline tried `logo.clearbit.com` first —
 * that service is discontinued and every card paid a failed request before
 * falling through to a slow Google s2 lookup. Result: cards painted fast, icons
 * appeared seconds later (or never).
 *
 * Rules implemented here:
 *   1. Admin-supplied custom icon always wins and is never overridden.
 *   2. Stored/verified icon URL from the website document is used next.
 *   3. A remembered winner (previous successful load) is used before any guess.
 *   4. Fast public favicon endpoints are tried before slow ones.
 *   5. Dead sources are never retried within the session.
 *
 * No network calls happen in this module unless `preloadIconUrls` is called.
 */

const LS_KEY = "stea_icon_hit_cache_v2";
const LS_MAX_ENTRIES = 500;

/** Hosts that must never be used again (discontinued or unreliable). */
const BANNED_HOSTS = ["logo.clearbit.com", "clearbit.com"];

const isBanned = (src) => {
  const s = String(src || "").toLowerCase();
  return BANNED_HOSTS.some((h) => s.includes(h));
};

/* ── in-memory + persistent success cache (domain → working icon URL) ── */
const hitCache = new Map();
let hitCacheHydrated = false;

function hydrateHitCache() {
  if (hitCacheHydrated) return;
  hitCacheHydrated = true;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    Object.entries(parsed).forEach(([key, src]) => {
      if (typeof src === "string" && src.startsWith("http") && !isBanned(src)) {
        hitCache.set(key, src);
      }
    });
  } catch {}
}

let persistTimer = null;
function persistHitCache() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const entries = Array.from(hitCache.entries()).slice(-LS_MAX_ENTRIES);
      window.localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }, 400);
}

/** Failed sources for this session only — avoids re-paying a known failure. */
const missCache = new Map(); // key → Set(src)

/* ── eager budget: the first N mounted icons are requested immediately ── */
const EAGER_BUDGET = 18;
/** How many catalog icons we warm in the background after the first screen. */
const PRELOAD_BATCH = 60;
let eagerSlotsUsed = 0;

/** Claim an eager slot for above-the-fold icons. Deterministic, mount-ordered. */
export function claimEagerSlot() {
  if (eagerSlotsUsed >= EAGER_BUDGET) return false;
  eagerSlotsUsed += 1;
  return true;
}

export function resetEagerSlots() {
  eagerSlotsUsed = 0;
}

export const ICON_EAGER_BUDGET = EAGER_BUDGET;

/* ── domain normalisation ── */
export function normalizeIconKey(website) {
  if (!website) return "";
  const raw = typeof website === "string"
    ? website
    : (website.domain || website.hostname || website.url || website.websiteUrl || website.link || website.name || website.title || "");
  let value = String(raw || "").trim().toLowerCase();
  if (!value) return "";
  value = value.replace(/^https?:\/\//, "").replace(/^www\./, "");
  value = value.split("/")[0].split("?")[0].trim();
  return value;
}

function extractDomain(website) {
  const key = normalizeIconKey(website);
  if (!key) return "";
  const host = key.split("@").pop().split(":")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : "";
}

function autoCandidates(domain) {
  if (!domain) return [];
  return [
    { src: `https://icons.duckduckgo.com/ip3/${domain}.ico`, source: "duckduckgo" },
    { src: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, source: "google" },
    { src: `https://${domain}/favicon.ico`, source: "direct" },
  ];
}

/**
 * Ordered candidate list for a website. The first entry is the one we are most
 * confident about; the component walks the list on error.
 */
export function getIconCandidates(website) {
  if (!website) return [];

  if (typeof website === "string") {
    return autoCandidates(extractDomain(website));
  }

  // 1. Admin-supplied custom icon — authoritative, nothing else is tried.
  const custom = website.customIconUrl || website.customLogoUrl;
  if (typeof custom === "string" && custom.trim().startsWith("http")) {
    return [{ src: custom.trim(), source: "custom" }];
  }

  // 2. Explicit stored / verified icon URL.
  const explicit =
    website.verifiedIcon ||
    website.logoUrl ||
    website.faviconUrl ||
    website.logo ||
    website.iconUrl ||
    website.icon ||
    website.favicon;
  const explicitUrl = typeof explicit === "string" && explicit.trim().startsWith("http")
    ? explicit.trim()
    : null;

  const domain = extractDomain(website);
  const key = domain || normalizeIconKey(website);
  const list = [];
  const seen = new Set();
  const push = (src, source) => {
    if (!src || seen.has(src) || isBanned(src)) return;
    seen.add(src);
    list.push({ src, source });
  };

  if (explicitUrl) push(explicitUrl, "stored");

  // 3. Remembered winner for this domain (previous successful load).
  hydrateHitCache();
  const remembered = key ? hitCache.get(key) : null;
  if (remembered) push(remembered, "remembered");

  // 4/5/6. Auto sources, fastest & most reliable first.
  autoCandidates(domain).forEach(({ src, source }) => push(src, source));

  // Drop sources already known to fail in this session.
  const fails = key ? missCache.get(key) : null;
  const filtered = fails ? list.filter((c) => !fails.has(c.src)) : list;
  return filtered.length > 0 ? filtered : list;
}

/** Remember which source actually rendered for this domain. */
export function rememberIconHit(website, src) {
  if (!src || isBanned(src)) return;
  const domain = extractDomain(website) || normalizeIconKey(website);
  if (!domain) return;
  hydrateHitCache();
  if (hitCache.get(domain) === src) return;
  hitCache.delete(domain);
  hitCache.set(domain, src);
  persistHitCache();
}

/** Remember a failed source for this session so we never re-pay for it. */
export function rememberIconMiss(website, src) {
  if (!src) return;
  const domain = extractDomain(website) || normalizeIconKey(website);
  if (!domain) return;
  let set = missCache.get(domain);
  if (!set) {
    set = new Set();
    missCache.set(domain, set);
  }
  set.add(src);
}

export function getRememberedIcon(website) {
  const domain = extractDomain(website) || normalizeIconKey(website);
  if (!domain) return null;
  hydrateHitCache();
  return hitCache.get(domain) || null;
}

/* ── bounded-concurrency preloading ── */

const preloaded = new Set();
const queue = [];
let active = 0;
const MAX_CONCURRENT = 6;

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift();
    active += 1;
    const done = () => {
      active -= 1;
      pump();
    };
    try {
      const img = new Image();
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        if (img.naturalWidth > 0) {
          if (job.website) rememberIconHit(job.website, job.src);
          job.onResult?.(true);
        } else {
          if (job.website) rememberIconMiss(job.website, job.src);
          job.onResult?.(false);
        }
        done();
      };
      img.onerror = () => {
        if (job.website) rememberIconMiss(job.website, job.src);
        job.onResult?.(false);
        done();
      };
      img.src = job.src;
    } catch {
      done();
    }
  }
}

/**
 * Warm the browser cache for an explicit list of icon URLs.
 * Bounded concurrency keeps this from flooding the network on first paint.
 */
export function preloadIconUrls(jobs = []) {
  jobs.forEach((job) => {
    const src = typeof job === "string" ? job : job?.src;
    if (!src || preloaded.has(src)) return;
    preloaded.add(src);
    queue.push(typeof job === "string" ? { src } : job);
  });
  pump();
}

/**
 * Warm icons for a catalog, first screen first.
 * Requests are paced by MAX_CONCURRENT so a 300-card category never floods the
 * network — it just fills the cache ahead of the user's scroll.
 */
export function preloadWebsiteIcons(websites = [], limit = PRELOAD_BATCH) {
  preloadIconUrls(
    websites
      .slice(0, limit)
      .map((website) => {
        const first = getIconCandidates(website)[0];
        return first ? { src: first.src, website } : null;
      })
      .filter(Boolean)
  );
}
