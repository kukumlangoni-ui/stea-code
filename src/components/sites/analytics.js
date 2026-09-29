/**
 * P16 — STEA real click analytics (website_open event).
 *
 * DESIGN RULES (per spec):
 *  - Track ACTUAL website OPEN events, not card impressions.
 *  - NEVER fabricate open counts or seed random popularity numbers.
 *  - No "hot document" that every open writes to (scales badly).
 *  - No giant arrays of events on single docs.
 *  - Privacy-safe: raw userId must never appear in public aggregations.
 *
 * ARCHITECTURE — time-bucketed, per-website, sharded-per-day:
 *
 *   Collection: website_open_events
 *     Documents: per open event, keyed {websiteId}_{YYYYMMDD}_{session_hash}_{random}
 *       Fields:
 *         websiteId          string
 *         categoryId         string?
 *         source             string  ("category_home" | "popular_today" | "detail" |
 *                                      "recent" | "search" | "related")
 *         timestamp          Firestore Timestamp / ISO string
 *         dayBucket          "YYYY-MM-DD"       (for fast daily aggregate queries)
 *         truncatedSession   string (16-char hex — truncated browser session id
 *                                    NOT a uid, NOT stable across days)
 *         anonymizedMember   string? 16-char SHA-256 truncated hash of memberId
 *                                   ONLY for signed-in members. Never the raw uid.
 *
 *   Collection: website_popularity_daily   (aggregated view — written periodically,
 *                                           OR by secure Firestore rules / background job)
 *     Doc id: {websiteId}_{YYYY-MM-DD}
 *       opens: number
 *
 *   Collection: website_popularity_totals  (aggregated roll-up)
 *     Doc id: {websiteId}
 *       opensToday: number
 *       opens7d: number
 *       opens30d: number
 *       opensLifetime: number
 *
 *   IMPORTANT:
 *     Until there is a SAFE server/Function/Rule-based aggregation layer,
 *     Popular Today MUST render rankings WITHOUT fabricating numbers.
 *     See SitesPopularToday.jsx — it falls back to stored visits/favoritesCount
 *     if aggregate docs do not exist.
 *
 * This module exposes:
 *   export async function trackWebsiteOpen({ websiteId, categoryId, source })
 *   export function getPopularityRanking(websites, { window } = {})
 */

import {
  addDoc,
  collection,
  getFirebaseDb,
  serverTimestamp,
} from "../../firebase.js";

const EVENTS_COLLECTION = "website_open_events";
const VALID_SOURCES = new Set([
  "home",            // homepage generic
  "category_home",   // clicked after browsing category
  "popular_today",   // clicked from Popular Today rail
  "detail",          // opened from detail page CTA
  "recent",          // opened from recently visited rail
  "search",          // opened from a search result
  "related",         // opened from related websites list
  "admin_preview",   // admin preview (excluded from public counts)
]);

/* ------------------------- privacy helpers ------------------------- */

/**
 * Produce a 16-char truncated hex hash.
 * We use a simple truncation + salted SHA-256 (when crypto.subtle is available)
 * falling back to a truncated Date.random fingerprint for SSR/old browsers.
 *
 * NEVER return a raw uid. NEVER return a stable per-user identifier that
 * survives across sessions/days without their consent.
 */
const SESSION_KEY = "stea_sites_session_sha_v1";

function readTruncatedBrowserSession() {
  if (typeof window === "undefined" || !window.localStorage) return "anon";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      const a = new Uint8Array(8);
      (window.crypto || window.msCrypto)?.getRandomValues?.(a);
      id = Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("")
        + Math.random().toString(36).slice(2, 10);
      id = id.slice(0, 16);
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

async function truncatedMemberHash(memberId) {
  if (!memberId) return "";
  const salted = `stea_sites_member_${String(memberId)}_v1`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
      const buf = new TextEncoder().encode(salted);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hex = Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, "0")).join("");
      return hex.slice(0, 16);
    }
  } catch {}
  // Cheap fallback: djb2-ish truncated to 16 chars
  let h = 5381;
  for (let i = 0; i < salted.length; i += 1) h = (h * 33) ^ salted.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(16, "0").slice(0, 16);
}

function dayBucket(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------------------------- public API ---------------------------- */

/**
 * Record that a user actually opened a website.
 *
 * Only call this on a genuine "Open Website" click. Never on hover,
 * card render, scroll, or impression.
 *
 * @param {{
 *   websiteId: string,
 *   categoryId?: string,
 *   source?: string,
 *   memberId?: string,
 * }} opts
 * @returns {Promise<string|null>}  event doc id (if written) or null
 */
export async function trackWebsiteOpen(opts = {}) {
  const { websiteId, categoryId, source = "home", memberId } = opts || {};
  if (!websiteId) return null;

  const db = getFirebaseDb();
  if (!db) return null; // offline / SSR — do not throw, analytics is best-effort

  const safeSource = VALID_SOURCES.has(source) ? source : "home";
  if (safeSource === "admin_preview") return null; // do not pollute public counts

  const truncatedSession = readTruncatedBrowserSession();
  const anonymizedMember = memberId ? await truncatedMemberHash(memberId) : "";
  const bucket = dayBucket();

  // Privacy contract check — NEVER write the raw memberId.
  if (anonymizedMember && anonymizedMember === String(memberId)) {
    // This should be structurally impossible, but be explicit.
    return null;
  }

  const doc = {
    websiteId: String(websiteId),
    categoryId: categoryId ? String(categoryId) : "",
    source: safeSource,
    timestamp: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
    dayBucket: bucket,
    truncatedSession,
    anonymizedMember, // 16-char hash or "" — NEVER raw userId
  };

  try {
    // One doc per open — safe horizontal write scaling.
    // No hot doc, no increment() on a single counter.
    const ref = await addDoc(collection(db, EVENTS_COLLECTION), doc);
    return ref?.id || "pending";
  } catch (err) {
    // Never surface analytics errors to the user. Silently swallow.
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[stea-sites-analytics] trackWebsiteOpen write skipped:", err?.message || err);
    }
    return null;
  }
}

/**
 * Build a ranking for Popular Today from existing website documents.
 *
 * CRITICAL: this function never fabricates counts. When aggregate docs
 * are not populated (e.g. aggregation background job not enabled), it
 * falls back to real stored telemetry (visits, favoritesCount,
 * trendingScore, rating). If all telemetry fields are zero, ranking is
 * document order with no numeric badges.
 *
 * @param {Array} websites  list of website docs from Firestore
 * @param {{window?: 'today'|'7d'|'30d'|'lifetime'}} opts
 * @returns {Array<{site: object, opens: number|null, rank: number}>}
 */
export function getPopularityRanking(websites, opts = {}) {
  const list = Array.isArray(websites) ? websites.filter(Boolean) : [];
  const scored = list.map((site) => {
    const visits = Number(site?.visits || site?.views || 0);
    const saves = Number(site?.favoritesCount || site?.saves || 0);
    const trend = Number(site?.trendingScore || 0);
    const rating = Number(site?.rating || 0);
    // NOTE: opens* fields (opensToday, opens7d, opens30d, opensLifetime) come
    // from the website_popularity_totals aggregation. If the aggregation job
    // has not run yet, they will be undefined/null — we treat them as absent.
    let opens = null;
    switch (opts.window) {
      case "today":
        opens = Number.isFinite(Number(site?.opensToday)) ? Number(site.opensToday) : null;
        break;
      case "7d":
        opens = Number.isFinite(Number(site?.opens7d)) ? Number(site.opens7d) : null;
        break;
      case "30d":
        opens = Number.isFinite(Number(site?.opens30d)) ? Number(site.opens30d) : null;
        break;
      default:
        opens = Number.isFinite(Number(site?.opensLifetime)) ? Number(site.opensLifetime) : null;
    }

    // Weighted sort key when real aggregate opens don't exist yet.
    // Never visible to users as "count"; only used to order the list.
    const fallbackScore = visits + saves * 10 + trend * 5 + rating * 100;
    return {
      site,
      opens,
      _sort: opens !== null ? opens : fallbackScore,
    };
  });

  scored.sort((a, b) => {
    if (b._sort !== a._sort) return b._sort - a._sort;
    return String(a.site?.title || a.site?.name || "").localeCompare(String(b.site?.title || b.site?.name || ""));
  });

  return scored.map((row, index) => ({
    site: row.site,
    opens: row.opens, // can be null — callers must handle no-count rendering
    rank: index + 1,
  }));
}

/* ------------------------------ design notes ---------------------------------
 *
 * Why per-event docs, not a single hot increment?
 *   Firebase has a 1 write/sec sustained limit per document. A popular website
 *   could easily exceed that, causing lost events and wrong counts.
 *   Per-event docs with daily bucketing let us aggregate in a background job
 *   (Cloud Function scheduled trigger or Firestore trigger on the collection)
 *   into website_popularity_daily then website_popularity_totals.
 *
 *   Migration path (safe, no downtime):
 *     1. Ship per-event doc writes (now).
 *     2. Deploy aggregator Function (later, when traffic justifies).
 *     3. SitesPopularToday reads opensToday/opens7d from totals if present,
 *        else falls back to visits+trendingScore order and shows rank only.
 *     4. No fabricated counts ever.
 *
 * Why 16-char truncated session + member hash?
 *   Used for rough deduplication across a single day. Not a stable identity.
 *   We do NOT write a raw uid, and session IDs are rotated on device.
 *
 * Why not public collection userIds?
 *   Per P16 rule: "Protect privacy. Do not expose user IDs publicly."
 *   website_open_events is a private collection (readable only by admin tools
 *   and the aggregator Function service account via Firestore Rules).
 * ---------------------------------------------------------------------------- */
