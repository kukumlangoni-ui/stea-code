/**
 * Test Search Integrity & Popular Consistency Suite
 */
import sitesCatalogSnapshot from "../src/data/sitesCatalogSnapshot.json" with { type: "json" };
import { CANONICAL_POPULAR_APPS } from "../src/data/canonicalPopularApps.js";
import { normalizeWebsiteRecords } from "../src/utils/websiteRecordCompat.js";
import { searchWebsites, calculateSearchScore, getSearchSuggestions } from "../src/hooks/useSearch.js";
import { getWebsiteIcon } from "../src/components/sites/websiteIconHelper.js";
import { websiteMatchesCategory } from "../src/constants/categoryOrder.js";

console.log("==================================================");
console.log("RUNNING STEA SITES SEARCH INTEGRITY AUDIT");
console.log("==================================================");

// 1. Build Single Connected Runtime Catalog
const runtimeCatalog = normalizeWebsiteRecords([
  ...(Array.isArray(sitesCatalogSnapshot) ? sitesCatalogSnapshot : []),
  ...CANONICAL_POPULAR_APPS,
]);

console.log(`Unified Runtime Catalog size: ${runtimeCatalog.length} websites.`);

let totalFailures = 0;

// ==================================================
// 1. INSTAGRAM TRACE AND ACCEPTANCE
// ==================================================
console.log("\n1. Instagram Trace & Ranking Test...");
const instagramRecord = runtimeCatalog.find(
  (s) => s.name?.toLowerCase() === "instagram" || s.domain === "instagram.com"
);

console.log("POPULAR INSTAGRAM RECORD:      ", CANONICAL_POPULAR_APPS.some(s => s.name === "Instagram") ? "found" : "missing");
console.log("STATIC SNAPSHOT INSTAGRAM:     ", sitesCatalogSnapshot.some(s => s.name === "Instagram") ? "found" : "missing");
console.log("NORMALIZED RUNTIME INSTAGRAM:  ", instagramRecord ? "found" : "missing");

if (!instagramRecord) {
  console.error("❌ CRITICAL: Instagram record not found in runtime catalog!");
  totalFailures++;
} else {
  console.log("Canonical ID/domain:           ", `${instagramRecord.id} / ${instagramRecord.domain}`);
}

const instaQueries = ["Instagram", "instagram", "insta", "instagram.com"];
for (const q of instaQueries) {
  const results = searchWebsites(runtimeCatalog, q);
  const top = results[0];
  const instaScore = instagramRecord ? calculateSearchScore(instagramRecord, q) : 0;
  const isFirst = top && (top.name === "Instagram" || top.domain === "instagram.com");

  console.log(`\nSEARCH "${q}":`);
  console.log(`  Top result: ${top ? `${top.name} (${top.domain}) [score: ${calculateSearchScore(top, q)}]` : "NONE"}`);
  console.log(`  Instagram score: ${instaScore}, rank: ${results.findIndex(r => r.name === "Instagram") + 1}`);

  if (!isFirst) {
    console.error(`❌ FAILED: Query "${q}" did not rank Instagram at #1!`);
    totalFailures++;
  } else {
    console.log(`  ✓ Ranked #1 successfully!`);
  }
}

// ==================================================
// 2. POPULAR 16/16 APPS SEARCH & ICON CONSISTENCY
// ==================================================
console.log("\n2. Popular Apps 16/16 Consistency Test...");
const POPULAR_TEST_NAMES = [
  "Instagram", "TikTok", "WhatsApp", "YouTube", "ChatGPT", "Netflix",
  "Canva", "Spotify", "GitHub", "Gmail", "Google Maps", "X",
  "Reddit", "LinkedIn", "Telegram", "Discord"
];

let popularPassCount = 0;
for (const name of POPULAR_TEST_NAMES) {
  const record = runtimeCatalog.find(
    (s) => s.name?.toLowerCase() === name.toLowerCase()
  );

  if (!record) {
    console.error(`❌ Missing popular app in catalog: ${name}`);
    totalFailures++;
    continue;
  }

  const results = searchWebsites(runtimeCatalog, name);
  const isTop = results[0] && results[0].name.toLowerCase() === name.toLowerCase();

  const iconInfo = getWebsiteIcon(record);
  const hasRealIcon = iconInfo.type === "svg" || (iconInfo.type === "img" && iconInfo.url);

  if (!isTop) {
    console.error(`❌ Popular app "${name}" not ranked #1 (got: ${results[0]?.name})`);
    totalFailures++;
  } else if (!hasRealIcon) {
    console.error(`❌ Popular app "${name}" does not have real icon!`);
    totalFailures++;
  } else {
    popularPassCount++;
    console.log(`  ✓ ${name.padEnd(12)} -> #1 (score: ${calculateSearchScore(record, name)}), Icon: ${iconInfo.type} ${iconInfo.url || ""}`);
  }
}

console.log(`Popular Consistency: ${popularPassCount}/${POPULAR_TEST_NAMES.length} ${popularPassCount === 16 ? "PASS" : "FAIL"}`);

// ==================================================
// 3. DISPLAYED SITES SEARCHABILITY TEST
// ==================================================
console.log("\n3. Displayed Sites Searchability Test...");
let displayedChecks = 0;
let displayedPasses = 0;

const devResourcesList = runtimeCatalog.filter(s => websiteMatchesCategory(s, "developers"));

for (const devSite of devResourcesList) {
  displayedChecks++;
  const results = searchWebsites(runtimeCatalog, devSite.name);
  if (results.some(r => r.name === devSite.name)) {
    displayedPasses++;
  } else {
    console.error(`❌ Dev site not searchable: ${devSite.name}`);
    totalFailures++;
  }
}

console.log(`Developer Resources Searchability: ${displayedPasses}/${displayedChecks} PASS`);

// ==================================================
// 4. DYNAMIC ADMIN SEARCH TEST
// ==================================================
console.log("\n4. Dynamic Admin Website Search Test...");
const mockAdminSite = {
  id: "admin-added-supabase-tool",
  name: "Supabase Vector UI",
  url: "https://supabase-vector-ui.io",
  domain: "supabase-vector-ui.io",
  description: "Visual query builder for Supabase pgvector embeddings.",
  category: "developers",
  categorySlug: "developers",
  subcategory: "Databases",
  subcategorySlug: "databases",
  tags: ["supabase", "vector", "database", "embeddings", "ai"],
  status: "active",
  published: true,
};

const dynamicCatalog = normalizeWebsiteRecords([...runtimeCatalog, mockAdminSite]);
const dynamicSearch1 = searchWebsites(dynamicCatalog, "Supabase Vector UI");
const dynamicSearch2 = searchWebsites(dynamicCatalog, "supabase-vector-ui.io");
const dynamicSearch3 = searchWebsites(dynamicCatalog, "embeddings");

if (
  dynamicSearch1[0]?.id === mockAdminSite.id &&
  dynamicSearch2[0]?.id === mockAdminSite.id &&
  dynamicSearch3.some(r => r.id === mockAdminSite.id)
) {
  console.log("✅ DYNAMIC ADMIN SEARCH TEST: PASSED");
} else {
  console.error("❌ DYNAMIC ADMIN SEARCH TEST: FAILED");
  totalFailures++;
}

console.log("\n==================================================");
if (totalFailures === 0) {
  console.log("🎉 ALL SEARCH INTEGRITY & POPULAR AUDITS PASSED 100%!");
  process.exit(0);
} else {
  console.error(`❌ ${totalFailures} AUDIT FAILURES OCCURRED!`);
  process.exit(1);
}
