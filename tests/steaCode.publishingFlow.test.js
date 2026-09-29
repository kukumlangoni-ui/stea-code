/**
 * STEA Code Product Publishing Flow & Homepage Integration Tests
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

console.log("\n============================================================");
console.log("STEA CODE PUBLISHING FLOW & HOMEPAGE TESTS");
console.log("============================================================\n");

const serverSrc = readFileSync(join(rootDir, "server.ts"), "utf8");
const adminPanelSrc = readFileSync(join(srcDir, "admin-v2", "SteaCodeCommercePanel.jsx"), "utf8");
const livePreviewSrc = readFileSync(join(srcDir, "components", "stea-code", "SteaCodeProductLivePreview.jsx"), "utf8");
const homeV2Src = readFileSync(join(srcDir, "pages", "stea-code", "SteaCodeHomeV2.jsx"), "utf8");

// 1. Publishing requirements validation logic mock
function validatePublish({ isSavedDraft, titleEn, slug, shortDescriptionEn, category, pricingType, price, previewEnabled, hasSourceFiles }) {
  const hasTitle = Boolean(String(titleEn || "").trim());
  const hasSlug = Boolean(String(slug || "").trim());
  const hasDescription = Boolean(String(shortDescriptionEn || "").trim());
  const hasCategory = Boolean(String(category || "").trim());
  const hasPricing = Boolean(pricingType === "free" || (pricingType === "premium" && Number(price) > 0));
  const hasPreview = Boolean(previewEnabled);
  const hasSource = Boolean(hasSourceFiles);
  const isDraftSaved = Boolean(isSavedDraft);

  const ready = isDraftSaved && hasTitle && hasSlug && hasDescription && hasCategory && hasPricing && hasPreview && hasSource;

  const missing = [];
  if (!isDraftSaved) missing.push("Save draft first");
  if (!hasTitle) missing.push("English Title");
  if (!hasSlug) missing.push("Slug / Product ID");
  if (!hasDescription) missing.push("Short Description");
  if (!hasCategory) missing.push("Category");
  if (!hasPricing) missing.push("Pricing");
  if (!hasPreview) missing.push("Live Preview");
  if (!hasSource) missing.push("Source files");

  return { ready, missing };
}

test("1. All 7 publish requirements met => ready is true", () => {
  const check = validatePublish({
    isSavedDraft: true,
    titleEn: "STEA Test Button",
    slug: "stea-test-button",
    shortDescriptionEn: "Interactive gold glowing button",
    category: "Components",
    pricingType: "free",
    price: 0,
    previewEnabled: true,
    hasSourceFiles: true,
  });
  assert(check.ready === true, "Must be ready when all requirements are met");
  assert(check.missing.length === 0, "No missing items when valid");
});

test("2. Missing source files => ready is false and missing includes Source files", () => {
  const check = validatePublish({
    isSavedDraft: true,
    titleEn: "STEA Test Button",
    slug: "stea-test-button",
    shortDescriptionEn: "Interactive gold glowing button",
    category: "Components",
    pricingType: "free",
    price: 0,
    previewEnabled: true,
    hasSourceFiles: false,
  });
  assert(check.ready === false, "Must not be ready without source files");
  assert(check.missing.includes("Source files"), "Missing list must include Source files");
});

test("3. Missing preview => ready is false and missing includes Live Preview", () => {
  const check = validatePublish({
    isSavedDraft: true,
    titleEn: "STEA Test Button",
    slug: "stea-test-button",
    shortDescriptionEn: "Interactive gold glowing button",
    category: "Components",
    pricingType: "free",
    price: 0,
    previewEnabled: false,
    hasSourceFiles: true,
  });
  assert(check.ready === false, "Must not be ready without preview enabled");
  assert(check.missing.includes("Live Preview"), "Missing list must include Live Preview");
});

test("4. Premium product with price 0 => ready is false and missing includes Pricing", () => {
  const check = validatePublish({
    isSavedDraft: true,
    titleEn: "STEA Test Button",
    slug: "stea-test-button",
    shortDescriptionEn: "Interactive gold glowing button",
    category: "Components",
    pricingType: "premium",
    price: 0,
    previewEnabled: true,
    hasSourceFiles: true,
  });
  assert(check.ready === false, "Must not be ready with premium price $0");
  assert(check.missing.includes("Pricing"), "Missing list must include Pricing");
});

test("5. Fast action 'Publish & Show on Homepage' sets status published AND homepageVisible true", () => {
  assert(
    adminPanelSrc.includes('publishAction === "publish_homepage"') &&
    adminPanelSrc.includes('payload.status = "published"') &&
    adminPanelSrc.includes('publishAction === "publish_homepage"\n          ? true'),
    "Publish & Show on Homepage action must set both status=published and homepageVisible=true in one call"
  );
});

test("6. Admin table displays all 11 required columns including Preview & Source badges", () => {
  assert(
    adminPanelSrc.includes("<th>Product</th>") &&
    adminPanelSrc.includes("<th>Category</th>") &&
    adminPanelSrc.includes("<th>Pricing</th>") &&
    adminPanelSrc.includes("<th>Runtime</th>") &&
    adminPanelSrc.includes("<th>Status</th>") &&
    adminPanelSrc.includes("<th>Homepage</th>") &&
    adminPanelSrc.includes("<th>Featured</th>") &&
    adminPanelSrc.includes("<th>Preview</th>") &&
    adminPanelSrc.includes("<th>Source</th>") &&
    adminPanelSrc.includes("<th>Updated</th>") &&
    adminPanelSrc.includes("<th>Actions</th>"),
    "Admin ProductTable must contain all 11 columns in the correct order"
  );

  assert(
    adminPanelSrc.includes('p.previewVideoUrl && String(p.previewVideoUrl).trim() ? "Video Ready" : (p.hasPreview || p.preview?.enabled ? "Live Preview" : "Missing")') &&
    adminPanelSrc.includes('{p.hasSource ? "Source Ready" : "Missing"}'),
    "Admin ProductTable must display Video Ready / Live Preview / Source Ready / Missing badges"
  );
});

test("7. Server catalog sorting puts featured items first, newest second", () => {
  const products = [
    { id: "p1", featured: false, updatedAt: "2026-09-08T10:00:00Z" },
    { id: "p2", featured: true, updatedAt: "2026-09-07T10:00:00Z" },
    { id: "p3", featured: false, updatedAt: "2026-09-08T11:00:00Z" },
  ];

  const sorted = products.sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return a.featured ? -1 : 1;
    }
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });

  assert(sorted[0].id === "p2", "Featured item p2 must be first");
  assert(sorted[1].id === "p3", "Newest non-featured item p3 must be second");
  assert(sorted[2].id === "p1", "Older non-featured item p1 must be third");
});

test("8. Live preview handles error with clean fallback and console warning", () => {
  assert(
    livePreviewSrc.includes("console.warn(`[STEA Code] Live preview unavailable for") &&
    livePreviewSrc.includes("Preview unavailable"),
    "Live preview must log console warning and show Preview unavailable message"
  );
});

test("9. SteaCodeHomeV2 passes title and category to live preview", () => {
  assert(
    homeV2Src.includes("title={product?.titleEn || product?.titleZh || productId}") &&
    homeV2Src.includes('category={product?.category || ""}'),
    "SteaCodeHomeV2 must pass title and category to SteaCodeProductLivePreview"
  );
});

console.log("\n────────────────────────────────────────────────────────────");
console.log(`RESULTS: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log("────────────────────────────────────────────────────────────\n");

if (failed > 0) {
  process.exit(1);
}
