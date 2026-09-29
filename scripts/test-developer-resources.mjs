import assert from "node:assert";
import fs from "node:fs";
import { normalizeWebsiteRecords, isPublicWebsiteRecord } from "../src/utils/websiteRecordCompat.js";
import {
  DEVELOPER_SUBCATEGORY_ORDER,
  websiteMatchesCategory,
  websiteMatchesSubcategory,
} from "../src/constants/categoryOrder.js";

const rawSnapshot = JSON.parse(
  fs.readFileSync(new URL("../src/data/sitesCatalogSnapshot.json", import.meta.url), "utf8")
);

const normalized = normalizeWebsiteRecords(rawSnapshot);
const publicWebsites = normalized.filter(isPublicWebsiteRecord);

console.log(`Auditing ${publicWebsites.length} public websites from runtime catalog...`);

// 1. Assert Developers Resources parent matching
const devResources = publicWebsites.filter((site) => websiteMatchesCategory(site, "developers"));
console.log(`Total Developers Resources: ${devResources.length}`);
assert.strictEqual(devResources.length, 48, "Expected exactly 48 Developers Resources");

// 2. Count each subcategory using runtime matcher
const counts = {};
let totalDeveloperSubcategoryMatches = 0;

for (const subcategorySlug of DEVELOPER_SUBCATEGORY_ORDER) {
  const matches = publicWebsites.filter((site) =>
    websiteMatchesSubcategory(site, subcategorySlug)
  );
  counts[subcategorySlug] = matches.length;
  totalDeveloperSubcategoryMatches += matches.length;
  console.log(`  ${subcategorySlug.padEnd(28)}: ${matches.length} sites (${matches.map((m) => m.name).join(", ")})`);
}

// 3. Assertions required by specification:
assert.ok(counts["hosting-domains"] > 0, "hosting-domains > 0");
assert.ok(counts["vibe-coding-ai-dev"] > 0, "vibe-coding-ai-dev > 0");
assert.ok(counts["databases"] > 0, "databases > 0");
assert.ok(counts["documentation-learning"] > 0, "documentation-learning > 0");
assert.ok(counts["blocks-components"] > 0, "blocks-components > 0");

assert.strictEqual(counts["hosting-domains"], 3, "hosting-domains === 3");
assert.strictEqual(counts["vibe-coding-ai-dev"], 6, "vibe-coding-ai-dev === 6");
assert.strictEqual(counts["databases"], 3, "databases === 3");
assert.strictEqual(counts["documentation-learning"], 9, "documentation-learning === 9");
assert.strictEqual(counts["blocks-components"], 2, "blocks-components === 2");

// 4. Assert sum of all 20 developer subcategories
assert.strictEqual(
  totalDeveloperSubcategoryMatches,
  48,
  `Expected sum(all developer subcategories) === 48, got ${totalDeveloperSubcategoryMatches}`
);

console.log("\n✅ ALL DEVELOPER RESOURCES RUNTIME ASSERTIONS PASSED (Total: 48)!");
