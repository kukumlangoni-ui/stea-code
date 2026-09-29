/**
 * STEA AI Catalog Ingestion Utility
 * ====================================================================
 * Provides a controlled, schema-canonical path for AI/developer workflows
 * to add website/app records to the Firestore `websites` collection.
 *
 * DESIGN CONTRACT (per STEA spec):
 *  - Uses the SAME canonical record structure as the Admin form
 *    (PremiumWebsiteEditor.jsx / SitesAdminWebsites.handleSaveForm).
 *  - AI-added records are ALWAYS written with status: 'draft',
 *    published: false, active: false — never auto-public.
 *  - Duplicate detection by canonical domain, normalized URL, slug,
 *    and normalized app name. Duplicates are reported, not overwritten.
 *  - createdByType: 'ai' marks the record for Admin review (not public).
 *
 * This module is framework-agnostic: it accepts a Firestore instance
 * (from firebase-admin in scripts, or getFirestore() in the browser).
 * ====================================================================
 */

import { generateSlug } from "./seo.js";
import { extractHostname, normalizeUrl } from "../components/sites/favicon.js";
import { normalizeWebsiteCategorySlug } from "../constants/categoryOrder.js";

// ── Canonical pricing architecture ──────────────────────────────────────
// Database values (pricingType) must follow the existing Admin schema.
// User-facing labels are derived in buildWebsitePayload.
export const PRICING_TYPES = {
  FREE: "free",
  FREEMIUM: "freemium",
  PAID: "paid",
  AD_SUPPORTED: "ad-supported",
  RENTAL_PURCHASE: "rental-purchase",
  UNKNOWN: "unknown",
};

// Map database pricingType → user-facing pricing label (as Admin does).
export function pricingLabelFor(pricingType) {
  switch (pricingType) {
    case PRICING_TYPES.PAID:
      return "Paid";
    case PRICING_TYPES.FREE:
    case PRICING_TYPES.AD_SUPPORTED:
      return "Free";
    case PRICING_TYPES.FREEMIUM:
      return "Free + Paid";
    default:
      return "Free";
  }
}

// ── Source / trust status architecture ──────────────────────────────────
export const SOURCE_STATUSES = {
  OFFICIAL: "official",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  UNOFFICIAL: "unofficial",
};

// ── Domain / URL normalization ──────────────────────────────────────────
export function normalizeDomain(url) {
  return (extractHostname(url) || "").toLowerCase();
}

export function normalizeCanonicalUrl(url) {
  return normalizeUrl(url);
}

export function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

// ── Slug generation (matches seo.generateSlug + Admin behavior) ─────────
export function slugFor(name, category = "") {
  return generateSlug(name, category);
}

// ── Duplicate detection ─────────────────────────────────────────────────
/**
 * Query the `websites` collection for an existing record that matches
 * by canonical domain, normalized URL, slug, or normalized name.
 *
 * Returns the matching document snapshot or null.
 */
export async function findDuplicate(db, { domain, url, slug, name }) {
  const col = db.collection("websites");

  const checks = [];

  if (domain) {
    checks.push(
      col.where("domain", "==", domain).limit(1).get()
        .then((snap) => (snap.empty ? null : snap.docs[0]))
        .catch(() => null)
    );
  }

  if (url) {
    const normUrl = normalizeCanonicalUrl(url);
    checks.push(
      col.where("normalizedUrl", "==", normUrl).limit(1).get()
        .then((snap) => (snap.empty ? null : snap.docs[0]))
        .catch(() => null),
      col.where("url", "==", normUrl).limit(1).get()
        .then((snap) => (snap.empty ? null : snap.docs[0]))
        .catch(() => null)
    );
  }

  if (slug) {
    checks.push(
      col.where("slug", "==", slug).limit(1).get()
        .then((snap) => (snap.empty ? null : snap.docs[0]))
        .catch(() => null)
    );
  }

  if (name) {
    const normName = normalizeName(name);
    checks.push(
      col.where("name", "==", normName).limit(1).get()
        .then((snap) => (snap.empty ? null : snap.docs[0]))
        .catch(() => null)
    );
  }

  const results = await Promise.all(checks);
  return results.find((r) => r && r.id) || null;
}

// ── Canonical payload builder ───────────────────────────────────────────
/**
 * Builds a Firestore website payload that is byte-for-byte compatible
 * with what the Admin form (PremiumWebsiteEditor / SitesAdminWebsites)
 * would produce. AI records are forced into draft state.
 *
 * @param {object} entry    { name, url, category, description, pricingType,
 *                            sourceStatus, tags, subcategory, contentType,
 *                            country, language, appDownloads, customIconUrl,
 *                            availabilityStatus, warningReason }
 * @param {object} options  { createdBy, source }
 */
export function buildWebsitePayload(entry, options = {}) {
  const name = String(entry.name || "").trim();
  const rawUrl = String(entry.url || "").trim();
  const category = String(entry.category || "").trim();
  const subcategory = String(entry.subcategory || "").trim();
  const description = String(entry.description || "").trim();
  const pricingType = entry.pricingType || PRICING_TYPES.UNKNOWN;
  const sourceStatus = entry.sourceStatus || SOURCE_STATUSES.UNVERIFIED;
  const contentType = entry.contentType || "Discovery";
  const country = String(entry.country || "Global").trim();
  const language = String(entry.language || "English").trim();
  const tags = Array.isArray(entry.tags)
    ? entry.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const domain = normalizeDomain(rawUrl);
  const categorySlug = normalizeWebsiteCategorySlug(category);
  const subcategorySlug = subcategory
    ? normalizeWebsiteCategorySlug(subcategory)
    : "";
  const slug = slugFor(name, category);

  const appDownloads = {
    playStore: entry.appDownloads?.playStore || "",
    appStore: entry.appDownloads?.appStore || "",
    windows: entry.appDownloads?.windows || "",
    mac: entry.appDownloads?.mac || "",
    linux: entry.appDownloads?.linux || "",
  };

  const platforms = ["web"];
  const downloadLinks = {};
  if (appDownloads.playStore) { platforms.push("android"); downloadLinks.android = appDownloads.playStore; }
  if (appDownloads.appStore) { platforms.push("ios"); downloadLinks.ios = appDownloads.appStore; }
  if (appDownloads.windows) { platforms.push("windows"); downloadLinks.windows = appDownloads.windows; }
  if (appDownloads.mac) { platforms.push("macos"); downloadLinks.macos = appDownloads.mac; }
  if (appDownloads.linux) { platforms.push("linux"); downloadLinks.linux = appDownloads.linux; }

  const isAdult = Boolean(entry.isAdult);

  const payload = {
    // Identity
    name,
    title: name,
    url: rawUrl,
    normalizedUrl: rawUrl,
    link: rawUrl,
    websiteUrl: rawUrl,
    mainUrl: rawUrl,
    domain,
    hostname: domain,
    slug,
    // Category
    category,
    categoryName: category,
    categorySlug,
    subcategory,
    subCategory: subcategory,
    subcategorySlug,
    subCategorySlug: subcategorySlug,
    // Content
    description,
    summary: description,
    contentType,
    // Publishing — AI records are ALWAYS draft (never auto-public).
    status: "draft",
    published: false,
    active: false,
    // Safety / trust
    isAdult,
    is_adult: isAdult,
    safetyRating: entry.safetyRating || "Unknown",
    sourceStatus,
    verificationStatus: entry.verificationStatus || "unverified",
    trustStatus: entry.trustStatus || "neutral",
    // Availability (for discontinued/redirected services — never invent)
    availabilityStatus: entry.availabilityStatus || "active",
    warningReason: entry.warningReason || "",
    // Pricing
    pricing: pricingLabelFor(pricingType),
    pricingType,
    // Locale
    country,
    language,
    mobileFriendly: entry.mobileFriendly !== false,
    mirrorUrl: entry.mirrorUrl || "",
    // Discovery
    tags,
    featured: false,
    popular: false,
    trending: false,
    // Icon (deferred to the existing STEA icon pipeline; admin can edit)
    customIconUrl: entry.customIconUrl || "",
    // App downloads
    appDownloads,
    platforms,
    downloadLinks,
    // Counters
    visits: 0,
    favoritesCount: 0,
    clicks: 0,
    // AI provenance (Admin-only, not exposed publicly)
    createdByType: "ai",
    createdBy: options.createdBy || "ai-agent",
    source: options.source || "ai_catalog_ingestion",
    // Timestamps (serverTimestamp() must be applied by the caller via admin SDK)
  };

  return payload;
}

// ── Single-record ingestion ─────────────────────────────────────────────
/**
 * Ingest a single website record.
 *
 * @returns {object} { status: 'created'|'duplicate'|'failed', id?, name,
 *                    duplicateId?, duplicateUrl?, error? }
 */
export async function ingestWebsite(db, entry, options = {}) {
  const name = String(entry.name || "").trim();
  const url = String(entry.url || "").trim();

  if (!name || !url) {
    return { status: "failed", name, url, error: "name and url are required" };
  }

  const domain = normalizeDomain(url);
  const slug = slugFor(name, entry.category || "");

  // Duplicate check — never overwrite an existing Admin record.
  const duplicate = await findDuplicate(db, { domain, url, slug, name });
  if (duplicate) {
    const d = duplicate.data();
    return {
      status: "duplicate",
      name,
      url,
      duplicateId: duplicate.id,
      duplicateUrl: d.url || d.normalizedUrl || d.link || "",
    };
  }

  try {
    const payload = buildWebsitePayload(entry, options);

    // serverTimestamp factory — injected by the caller so this works with
    // both firebase-admin (admin.firestore.FieldValue.serverTimestamp) and
    // the client SDK. Falls back to a Date if not provided.
    const now =
      typeof options.serverTimestamp === "function"
        ? options.serverTimestamp()
        : new Date();

    const ref = await db.collection("websites").add({
      ...payload,
      createdAt: now,
      updatedAt: now,
    });

    return { status: "created", id: ref.id, name, url, category: entry.category };
  } catch (err) {
    return { status: "failed", name, url, error: err.message };
  }
}

// ── Batch ingestion ──────────────────────────────────────────────────────
/**
 * Ingest a batch of website records with controlled throttling.
 *
 * @returns {object} { created: [], duplicates: [], failed: [], summary }
 */
export async function ingestBatch(db, entries, options = {}) {
  const {
    delayMs = 250,
    onProgress,
    createdBy = "ai-agent",
    source = "ai_catalog_ingestion",
  } = options;

  const created = [];
  const duplicates = [];
  const failed = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const result = await ingestWebsite(db, entry, { createdBy, source });

    if (result.status === "created") created.push(result);
    else if (result.status === "duplicate") duplicates.push(result);
    else failed.push(result);

    if (typeof onProgress === "function") {
      onProgress({ index: i + 1, total: entries.length, result });
    }

    // Controlled batching — avoid Firestore write storms.
    if (delayMs > 0 && i < entries.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    created,
    duplicates,
    failed,
    summary: {
      requested: entries.length,
      created: created.length,
      duplicates: duplicates.length,
      failed: failed.length,
    },
  };
}
