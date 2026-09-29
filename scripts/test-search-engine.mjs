import assert from "node:assert";
import fs from "node:fs";
import { normalizeWebsiteRecords, isPublicWebsiteRecord } from "../src/utils/websiteRecordCompat.js";
import { searchWebsites, detectCategoryIntent, getSearchSuggestions } from "../src/hooks/useSearch.js";
import { DEVELOPER_SUBCATEGORIES, WEBSITE_CATEGORIES } from "../src/data/websiteCategories.js";

const rawSnapshot = JSON.parse(
  fs.readFileSync(new URL("../src/data/sitesCatalogSnapshot.json", import.meta.url), "utf8")
);

const baseCatalog = normalizeWebsiteRecords(rawSnapshot).filter(isPublicWebsiteRecord);
console.log(`Auditing search engine over ${baseCatalog.length} runtime catalog sites...`);

// ----------------------------------------------------
// 1. DYNAMIC WEBSITE SEARCH TEST (Simulate Admin addition)
// ----------------------------------------------------
console.log("\n1. Testing Dynamic Website Search (Admin live-add simulation)...");
const dynamicSite = {
  id: "test-react-bits-dynamic",
  name: "React Bits",
  url: "https://reactbits.dev",
  domain: "reactbits.dev",
  description: "An open source collection of animated, interactive and fully customizable React components to build stunning animated websites.",
  category: "Developers Resources",
  categorySlug: "developers",
  subcategory: "Blocks & Components",
  subcategorySlug: "blocks-components",
  tags: ["react", "animation", "components", "frontend"],
  status: "published",
};

const dynamicCatalog = [...baseCatalog, dynamicSite];

const testQueries = ["React Bits", "reactbits", "React", "components", "animation", "frontend"];
for (const q of testQueries) {
  const results = searchWebsites(dynamicCatalog, q);
  const found = results.some((r) => r.id === "test-react-bits-dynamic" || r.name === "React Bits");
  console.log(`  Query "${q}" -> found dynamically: ${found ? "YES" : "NO"} (total results: ${results.length})`);
  assert.ok(found, `Expected search to dynamically find React Bits for query "${q}"`);
}
console.log("✅ DYNAMIC WEBSITE SEARCH TEST: PASSED");

// ----------------------------------------------------
// 2. ACCEPTANCE SEARCH QUERIES TEST
// ----------------------------------------------------
console.log("\n2. Testing Acceptance Search Queries...");

function testQuery(query, expectedTopNames, options = {}) {
  const results = searchWebsites(baseCatalog, query);
  const suggestions = getSearchSuggestions(baseCatalog, query, { max: 6 });
  const topNames = results.slice(0, 5).map((r) => r.name);
  
  console.log(`\n  Search "${query}":`);
  console.log(`    Top results: ${topNames.join(", ")}`);
  
  if (suggestions.categoryIntent) {
    console.log(`    Category Intent detected: [${suggestions.categoryIntent.type}] ${suggestions.categoryIntent.label} (${suggestions.categoryIntent.path})`);
  }

  for (const expected of expectedTopNames) {
    const matched = results.some((r) => r.name.toLowerCase().includes(expected.toLowerCase()));
    assert.ok(matched, `Expected query "${query}" to return result matching "${expected}"`);
  }

  if (options.expectedIntent) {
    assert.ok(suggestions.categoryIntent, `Expected category intent for "${query}"`);
    assert.strictEqual(suggestions.categoryIntent.label.toLowerCase(), options.expectedIntent.toLowerCase());
  }
}

// Exact Name / Domain queries
testQuery("GitHub", ["GitHub"]);
testQuery("github.com", ["GitHub"]);
testQuery("Firebase", ["Firebase"]);
testQuery("Cursor", ["Cursor AI"]);
testQuery("Vercel", ["Vercel"]);

// Subcategory / Concept queries
testQuery("database", ["Firebase", "Supabase", "MongoDB Atlas"], { expectedIntent: "Databases" });
testQuery("hosting", ["Vercel", "Netlify", "Cloudflare"], { expectedIntent: "Hosting & Domains" });
testQuery("vibe coding", ["Cursor AI", "Lovable AI", "Bolt.new", "v0 by Vercel"], { expectedIntent: "Vibe Coding & AI Dev" });
testQuery("API testing", ["Postman", "Apifox"], { expectedIntent: "APIs & Services" });
testQuery("react components", ["shadcn/ui", "Aceternity UI"]);
testQuery("security", ["Snyk"], { expectedIntent: "Security" });

// Category intent queries
testQuery("sports", ["SportSurge", "VipLeague"], { expectedIntent: "Live Sports" });
testQuery("manga", ["MangaDex"], { expectedIntent: "Manga" });
testQuery("movies", ["Moviesnchill", "FMovies", "123Movies"], { expectedIntent: "Movies & TV Shows" });
testQuery("developers", ["Cursor AI", "Visual Studio Code"], { expectedIntent: "Developers Resources" });

console.log("\n✅ ALL ACCEPTANCE SEARCH QUERIES: PASSED (100%)");
