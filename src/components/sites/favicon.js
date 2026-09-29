/**
 * Favicon resolver + hostname/domain normalization helpers.
 *
 * Priority order for favicon lookups:
 *   1. stored faviconUrl if given
 *   2. DuckDuckGo icon endpoint (clean, simple)
 *   3. Google s2 favicon (fallback)
 *   4. first-letter tile rendered by <Favicon> component
 *
 * These are pure functions — no React. Imported by Favicon.jsx component
 * and by admin URL-first flows.
 */

export function extractHostname(urlOrHost) {
  if (!urlOrHost) return "";
  const raw = String(urlOrHost).trim();
  if (!raw) return "";
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    const u = new URL(hasProtocol ? raw : `https://${raw}`);
    return (u.hostname || "").replace(/^www\./i, "");
  } catch {
    return raw.replace(/^www\./i, "").toLowerCase();
  }
}

export function normalizeUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    const u = new URL(hasProtocol ? raw : `https://${raw}`);
    return u.toString();
  } catch {
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
}

export function protocolOf(url) {
  try {
    const u = new URL(normalizeUrl(url));
    return u.protocol.replace(":", "");
  } catch {
    return "https";
  }
}

/**
 * Build a priority list of candidate favicon URLs for a given site.
 * Caller iterates them on error.
 */
export function buildFaviconCandidates({ faviconUrl, url, domain }) {
  const host = extractHostname(domain || url);
  const out = [];
  if (faviconUrl) out.push({ src: faviconUrl, weight: 0 });
  if (host) {
    // DDG first — simple, privacy-friendly, usually square clean icons
    out.push({ src: `https://icons.duckduckgo.com/ip3/${host}.ico`, weight: 1 });
    // Google fallback
    out.push({ src: `https://www.google.com/s2/favicons?domain=${host}&sz=128`, weight: 2 });
    // Also try /favicon.ico last as a raw guess
    out.push({ src: `https://${host}/favicon.ico`, weight: 3 });
  }
  return out;
}

/**
 * Derive a sensible default display name from a URL.
 *
 *   "https://docs.pika.art/guide" → "Pika"
 *   "https://www.netflix.com"     → "Netflix"
 */
export function deriveNameFromUrl(url) {
  const host = extractHostname(url);
  if (!host) return "";
  const root = host.split(".").slice(-2, -1)[0] || host.split(".")[0] || host;
  if (!root) return "";
  return root.charAt(0).toUpperCase() + root.slice(1);
}

/** Deterministic small glyph color palette for letter-fallback tiles. */
const FALLBACK_PALETTE = [
  ["#F5A623", "#1a1105"],
  ["#8B7BFA", "#110e22"],
  ["#4AA3FF", "#06121f"],
  ["#EF6A6A", "#1e0a0a"],
  ["#56C28A", "#071a11"],
  ["#FF8F3D", "#1d0f04"],
  ["#34C9C0", "#041616"],
  ["#F26FB2", "#1f0815"],
];

export function pickFallbackPalette(seedText) {
  const s = String(seedText || "?");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export function siteLetter(name, domain) {
  const raw = (name || domain || "").trim();
  return raw ? raw.charAt(0).toUpperCase() : "?";
}

/* ========================= P11 FAVICON CACHING LAYER =========================
 * resolveFavicon — cheap, cached resolution for the full pipeline.
 * Priority order (per spec P11):
 *   1. existing valid stored faviconUrl (given as input)
 *   2. sites' known favicon if available (duckduckgo ip3)
 *   3. safe favicon service/fallback strategy (Google s2, then /favicon.ico)
 *   4. deterministic letter fallback — ALWAYS available (returns { fallback: true, letter, palette })
 *
 * Rules:
 *   - No fetch() / page body downloads (CORS blocked anyway). Only candidate URLs.
 *   - Cached in-process by (hostname+faviconUrl) key. Client code may persist the
 *     cache map to localStorage under "stea_sites_favicon_cache_v1" optionally.
 *   - Never blocks card rendering — returns synchronously. The <img onerror>
 *     pipeline uses buildFaviconCandidates to try subsequent candidates.
 * ========================================================================== */

const IN_PROCESS_CACHE = new Map();
const LS_KEY = "stea_sites_favicon_cache_v1";

function loadPersistentCache() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    for (const [k, v] of Object.entries(parsed)) {
      if (!IN_PROCESS_CACHE.has(k)) IN_PROCESS_CACHE.set(k, v);
    }
  } catch {}
}

function savePersistentCache() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const obj = {};
    for (const [k, v] of IN_PROCESS_CACHE.entries()) obj[k] = v;
    window.localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

export function resetFaviconCache() {
  IN_PROCESS_CACHE.clear();
  try { if (typeof window !== "undefined") window.localStorage.removeItem(LS_KEY); } catch {}
}

/**
 * @param {{faviconUrl?:string, url?:string, domain?:string, name?:string}} opts
 * @returns {{
 *   url?:string, candidates:Array<{src:string,weight:number}>,
 *   fallback?:boolean, letter:string, palette:[string,string]
 * }}
 */
export function resolveFavicon(opts = {}) {
  loadPersistentCache();
  const { faviconUrl, url, domain, name } = opts || {};
  const host = extractHostname(domain || url) || "";
  const key = `${host}||${String(faviconUrl || "")}`;
  const letter = siteLetter(name, host);
  const palette = pickFallbackPalette(letter || host || "?");
  if (IN_PROCESS_CACHE.has(key)) {
    const cached = IN_PROCESS_CACHE.get(key);
    return { ...cached, letter, palette };
  }
  const candidates = buildFaviconCandidates({ faviconUrl, url, domain: host });
  const firstUrl = candidates[0]?.src || "";
  const result = {
    url: firstUrl || undefined,
    candidates: candidates.map(c => ({ src: c.src, weight: c.weight })),
    letter,
    palette,
  };
  IN_PROCESS_CACHE.set(key, result);
  savePersistentCache();
  return result;
}
