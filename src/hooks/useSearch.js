/**
 * useSearch — High-performance weighted multi-attribute search engine for STEA Sites
 *
 * Single connected runtime search:
 *  - Indexes: name, domain, url, description, category, subcategory, tags, keywords, aliases.
 *  - Normalizes: protocol (http/https), www., case, punctuation, trailing slashes.
 *  - Multi-attribute weighted ranking (Exact name > Exact domain > Prefix > Subcategory > Tags > Full tokens > Partial).
 *  - Category & Subcategory Intent Matching (e.g. "hosting", "database", "sports", "developers").
 *  - Instant suggestions generator (top 5-8 items with category badge & intent shortcut).
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { DEVELOPER_SUBCATEGORIES, WEBSITE_CATEGORIES } from "../data/websiteCategories.js";

export const SECRET_AFTER_DARK_KEYWORDS = [
  "afterdark",
  "after dark",
  "mature",
  "18plus",
  "18+",
  "after-dark",
  "nsfw",
];

/**
 * Clean & extract domain key from URL or domain field
 */
export function extractCleanDomain(doc) {
  if (!doc) return "";
  const raw = typeof doc === "string" ? doc : (doc.domain || doc.hostname || (doc.url ? (() => {
    try {
      const u = doc.url.startsWith("http") ? doc.url : "https://" + doc.url;
      return new URL(u).hostname;
    } catch {
      return "";
    }
  })() : ""));
  return String(raw || "").replace(/^www\./i, "").toLowerCase().trim();
}

/**
 * Clean string for search token matching
 */
function cleanStr(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a document against a query — returns relevance score (0 = no match)
 *
 * Scoring Hierarchy:
 *  - Exact website name: 5000
 *  - Exact domain: 4800
 *  - Exact alias: 4500
 *  - Name starts with query: 4000
 *  - Domain starts with query: 3800
 *  - Name word starts with query: 3500
 *  - Exact tag: 3000
 *  - Subcategory exact: 2600
 *  - Category exact: 2400
 *  - Strong multi-token match: 2000
 *  - Name contains: 1600
 *  - Domain contains: 1500
 *  - Tag contains: 1100
 *  - Description contains: 300
 */
export function calculateSearchScore(doc, query) {
  if (!query || !doc) return 0;
  const rawQ = String(query).toLowerCase().trim();
  if (!rawQ) return 0;

  const q = cleanStr(rawQ);
  const tokens = q.split(/\s+/).filter(Boolean);

  const name = cleanStr(doc.name || doc.title || doc.titleEn || doc.titleSw || "");
  const nameWords = name.split(/\s+/).filter(Boolean);
  const domain = extractCleanDomain(doc);
  const domainNoTld = domain.split(".")[0] || "";
  const category = cleanStr(doc.category || doc.categoryName || doc.categorySlug || "");
  const subcategory = cleanStr(doc.subcategory || doc.subCategory || doc.subcategorySlug || "");
  const tags = (Array.isArray(doc.tags) ? doc.tags : []).map(cleanStr);
  const keywords = (Array.isArray(doc.keywords) ? doc.keywords : []).map(cleanStr);
  const aliases = (Array.isArray(doc.aliases) ? doc.aliases : []).map(cleanStr);
  const description = cleanStr(doc.description || doc.summary || doc.prompt || "");

  let score = 0;

  // 1. Exact Name match (5000)
  if (name === q) {
    score += 5000;
  } else if (name.startsWith(q)) {
    // 4. Name starts with query (4000)
    score += 4000;
  } else if (nameWords.some((w) => w.startsWith(q))) {
    // 6. Name word starts with query (3500)
    score += 3500;
  } else if (name.includes(q)) {
    // 11. Name contains query (1600)
    score += 1600;
  }

  // 2. Exact Domain match (4800)
  if (domain === q || domain === rawQ || domainNoTld === q || domain === q + ".com" || domain === q + ".dev" || domain === q + ".io" || domain === q + ".org" || domain === q + ".app" || domain === q + ".net") {
    score += 4800;
  } else if (domain.startsWith(q) || domainNoTld.startsWith(q)) {
    // 5. Domain starts with query (3800)
    score += 3800;
  } else if (domain.includes(q)) {
    // 12. Domain contains query (1500)
    score += 1500;
  }

  // 3. Exact Aliases match (4500)
  if (aliases.includes(q)) {
    score += 4500;
  } else if (aliases.some((a) => a.startsWith(q))) {
    score += 3800;
  } else if (aliases.some((a) => a.includes(q))) {
    score += 2000;
  }

  // 7. Exact Tag / Keyword match (3000)
  if (tags.includes(q) || keywords.includes(q)) {
    score += 3000;
  } else if (tags.some((t) => t.startsWith(q)) || keywords.some((k) => k.startsWith(q))) {
    score += 2200;
  } else if (tags.some((t) => t.includes(q)) || keywords.some((k) => k.includes(q))) {
    // 13. Tag contains (1100)
    score += 1100;
  }

  // 8. Subcategory exact match (2600)
  if (subcategory === q) {
    score += 2600;
  } else if (subcategory.startsWith(q)) {
    score += 1800;
  } else if (subcategory.includes(q)) {
    score += 1200;
  }

  // 9. Category exact match (2400)
  if (category === q) {
    score += 2400;
  } else if (category.startsWith(q)) {
    score += 1600;
  } else if (category.includes(q)) {
    score += 1000;
  }

  // 10. Multi-token coverage (2000)
  if (tokens.length > 1) {
    let matchedTokens = 0;
    tokens.forEach((tok) => {
      let tokenMatched = false;
      if (name.includes(tok)) { score += 500; tokenMatched = true; }
      if (domain.includes(tok) || domainNoTld.includes(tok)) { score += 450; tokenMatched = true; }
      if (aliases.some((a) => a.includes(tok))) { score += 400; tokenMatched = true; }
      if (tags.some((t) => t.includes(tok)) || keywords.some((k) => k.includes(tok))) { score += 350; tokenMatched = true; }
      if (subcategory.includes(tok)) { score += 300; tokenMatched = true; }
      if (category.includes(tok)) { score += 250; tokenMatched = true; }
      if (description.includes(tok)) { score += 100; tokenMatched = true; }
      if (tokenMatched) matchedTokens++;
    });

    if (matchedTokens === tokens.length) {
      score += 2000;
    }
  } else {
    // 14. Description contains (300)
    if (description.includes(q)) {
      score += 300;
    }
  }

  return score;
}

/**
 * Detect Category or Developer Subcategory intent from query
 */
export function detectCategoryIntent(query, categories = [], developerSubcategories = []) {
  if (!query || typeof query !== "string") return null;
  const q = query.trim().toLowerCase().replace(/[^\w\s.-]/g, " ").trim();
  if (q.length < 2) return null;

  const subList = Array.isArray(developerSubcategories) && developerSubcategories.length > 0
    ? developerSubcategories
    : DEVELOPER_SUBCATEGORIES;

  const tokens = q.split(/\s+/).filter(t => t.length >= 3);

  // 1. Check developer subcategories first
  for (const sub of subList) {
    const slug = String(sub.id || sub.slug || "").toLowerCase();
    const label = String(sub.label || sub.name || "").toLowerCase();
    if (
      label === q ||
      slug === q ||
      label.startsWith(q) ||
      slug.startsWith(q) ||
      (q.length >= 3 && (label.includes(q) || slug.includes(q))) ||
      tokens.some(t => slug.includes(t) || label.split(/\s+/).some(w => w.startsWith(t)))
    ) {
      return {
        type: "subcategory",
        id: sub.id || sub.slug,
        slug: sub.id || sub.slug,
        label: sub.label || sub.name,
        path: `/websites/developers/${sub.id || sub.slug}`,
        icon: sub.icon || "💻",
        count: sub.count || null,
        parentLabel: "Developers Resources",
      };
    }
  }

  // 2. Check main categories
  const catList = Array.isArray(categories) && categories.length > 0
    ? categories
    : WEBSITE_CATEGORIES;

  for (const cat of catList) {
    const slug = String(cat.slug || cat.id || cat.categoryId || "").toLowerCase();
    const label = String(cat.label || cat.name || "").toLowerCase();
    if (
      label === q ||
      slug === q ||
      label.startsWith(q) ||
      slug.startsWith(q) ||
      (q.length >= 3 && (label.includes(q) || slug.includes(q))) ||
      tokens.some(t => slug.includes(t) || label.split(/\s+/).some(w => w.startsWith(t)))
    ) {
      return {
        type: "category",
        id: cat.id || cat.slug,
        slug: cat.slug || cat.id,
        label: cat.label || cat.name,
        path: `/websites/${cat.slug || cat.id}`,
        icon: cat.icon || "🌐",
        count: cat.count || null,
      };
    }
  }

  return null;
}

/**
 * Instant Search suggestions generator
 */
export function getSearchSuggestions(docs, query, { max = 6, categories = [], developerSubcategories = [] } = {}) {
  if (!query || !query.trim() || !Array.isArray(docs) || docs.length === 0) {
    return { categoryIntent: null, results: [] };
  }

  const categoryIntent = detectCategoryIntent(query, categories, developerSubcategories);

  const scored = docs
    .map((doc) => ({ doc, score: calculateSearchScore(doc, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((item) => item.doc);

  return {
    categoryIntent,
    results: scored,
  };
}

/**
 * Filter and sort a list of documents by query relevance
 */
export function searchWebsites(docs, query) {
  if (!Array.isArray(docs) || docs.length === 0) return [];
  if (!query || !query.trim()) return docs;

  return docs
    .map((doc) => ({ doc, score: calculateSearchScore(doc, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.doc);
}

/**
 * Normalise any value to a searchable lowercase string (legacy helper)
 */
function norm(v) {
  if (!v) return "";
  if (Array.isArray(v)) return v.join(" ").toLowerCase();
  return String(v).toLowerCase();
}

/**
 * Legacy matchesQuery helper for backwards compatibility
 */
export function matchesQuery(doc, query) {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const searchable = [
    doc.title, doc.name, doc.titleEn, doc.titleSw,
    doc.description, doc.descriptionEn, doc.descriptionSw,
    doc.summary, doc.prompt,
    doc.category,
    doc.searchTitle,
    doc.url, doc.slug,
    ...(Array.isArray(doc.tags) ? doc.tags : []),
    ...(Array.isArray(doc.keywords) ? doc.keywords : []),
  ].map(norm).join(" ");
  return searchable.includes(q);
}

/**
 * useSearch hook with debounced input and relevance scoring
 */
export function useSearch(docs, debounceMs = 160) {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(rawQuery), debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [rawQuery, debounceMs]);

  const filtered = useMemo(() => {
    return searchWebsites(docs, debouncedQ);
  }, [docs, debouncedQ]);

  return {
    query: rawQuery,
    setQuery: setRawQuery,
    filtered,
    isSearching: rawQuery !== debouncedQ,
  };
}

/**
 * useCategories — extracts unique categories from docs
 */
export function useCategories(docs, customCats = []) {
  return useMemo(() => {
    const cats = new Set(customCats.map((c) => c.name || c).filter(Boolean));
    (docs || []).forEach((d) => {
      if (d.category) cats.add(d.category);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [docs, customCats]);
}

/**
 * Build normalized search fields to store alongside a document
 */
export function buildSearchFields(data) {
  const title = data.title || data.name || data.titleEn || "";
  const tags = [
    data.category,
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.keywords) ? data.keywords : []),
  ].filter(Boolean);

  return {
    searchTitle: title.toLowerCase(),
    searchKeywords: tags.map((t) => t.toLowerCase()).join(" "),
  };
}
