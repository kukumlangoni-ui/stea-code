import { normalizeWebsiteCategorySlug, normalizeDeveloperSubcategorySlug } from "../constants/categoryOrder.js";

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function categoryDisplayName(value) {
  const text = firstText(value);
  if (!text) return "";

  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function looksLikeFirestoreAutoId(value) {
  const text = firstText(value);
  return /^[A-Za-z0-9]{20}$/.test(text);
}

export function normalizeWebsiteRecord(raw = {}) {
  const id = firstText(raw.id);

  const url = firstText(
    raw.url,
    raw.websiteUrl,
    raw.link,
    raw.externalUrl
  );

  const name = firstText(
    raw.name,
    raw.title,
    raw.websiteName
  );

  const rawCategory = firstText(
    raw.category,
    raw.categorySlug,
    raw.categoryName
  );

  const usableCategory =
    rawCategory ||
    (!looksLikeFirestoreAutoId(raw.categoryId) ? firstText(raw.categoryId) : "");

  const canonicalCategory = usableCategory
    ? normalizeWebsiteCategorySlug(usableCategory)
    : "";

  const categoryName = firstText(
    raw.categoryName,
    raw.category,
    categoryDisplayName(canonicalCategory)
  );

  const rawSubcategory = firstText(
    raw.subcategory,
    raw.subCategory,
    raw.subcategorySlug,
    raw.subCategoryId
  );

  const subcategorySlug = rawSubcategory
    ? normalizeDeveloperSubcategorySlug(rawSubcategory)
    : "";

  let faviconUrl = firstText(
    raw.faviconUrl,
    raw.favicon,
    raw.iconUrl,
    raw.logoUrl
  );

  // Fix Big Problem #6: Prevent incorrect cached blobs from Google/DDG from overriding the correct domain.
  if (faviconUrl && url) {
    try {
      const u = url.startsWith("http") ? url : "https://" + url;
      const parsed = new URL(u);
      const siteHost = parsed.hostname.replace(/^www\./i, "");
      
      if (
        faviconUrl.includes("google.com/s2/favicons") ||
        faviconUrl.includes("duckduckgo.com") ||
        faviconUrl.includes("favicon")
      ) {
        if (!faviconUrl.includes(siteHost)) {
          faviconUrl = ""; // Reject wrong icon, allow fallback pipeline to fetch fresh
        }
      }
    } catch (err) {}
  }

  const description = firstText(
    raw.description,
    raw.summary,
    raw.shortDescription
  );

  return {
    ...raw,

    id,

    name,
    title: firstText(raw.title, raw.name, raw.websiteName) || name,

    url,
    normalizedUrl: url,
    domain: firstText(raw.domain, raw.hostname),

    faviconUrl,

    category: firstText(raw.category, categoryName),
    categoryId: raw.categoryId || "",
    categorySlug: canonicalCategory,
    categoryName,

    subcategory: rawSubcategory,
    subCategory: rawSubcategory,
    subcategorySlug,
    subCategorySlug: subcategorySlug,

    description,
    tags: normalizeTags(raw.tags),
    aliases: normalizeTags(raw.aliases || raw.alias),

    isPopular: Boolean(raw.isPopular === true || raw.popular === true),
    priorityIcon: Boolean(raw.priorityIcon === true),
    directOpen: Boolean(raw.directOpen === true),

    status: firstText(raw.status),

    isAdult: Boolean(
      raw.isAdult === true ||
      raw.is_adult === true ||
      String(raw.category || "").toLowerCase() === "after dark" ||
      String(raw.category || "").toLowerCase() === "mature (18+)" ||
      String(raw.categoryName || "").toLowerCase() === "after dark" ||
      String(raw.categorySlug || "").toLowerCase() === "after-dark"
    ),
    is_adult: Boolean(
      raw.isAdult === true ||
      raw.is_adult === true ||
      String(raw.category || "").toLowerCase() === "after dark" ||
      String(raw.category || "").toLowerCase() === "mature (18+)" ||
      String(raw.categoryName || "").toLowerCase() === "after dark" ||
      String(raw.categorySlug || "").toLowerCase() === "after-dark"
    ),

    featured: Boolean(
      raw.featured === true ||
      raw.isFeatured === true
    ),
  };
}

export function isPublicWebsiteRecord(site = {}) {
  if (!site) return false;
  if (site.deleted === true) return false;
  if (site.active === false) return false;

  const status = String(site.status || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (
    status === "draft" ||
    status === "pending-review" ||
    status === "deleted" ||
    status === "inactive" ||
    status === "rejected"
  ) {
    return false;
  }

  return true;
}

export function normalizeWebsiteRecords(records = []) {
  return (Array.isArray(records) ? records : [])
    .map(normalizeWebsiteRecord)
    .filter((site) => site.id);
}
