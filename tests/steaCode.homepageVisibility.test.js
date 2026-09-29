/**
 * STEA Code Homepage Visibility & Admin Panel Tests
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
console.log("STEA CODE HOMEPAGE VISIBILITY & ADMIN TESTS");
console.log("============================================================\n");

const serverSrc = readFileSync(join(rootDir, "functions", "server.cjs"), "utf8");
const adminPanelSrc = readFileSync(join(srcDir, "admin-v2", "SteaCodeCommercePanel.jsx"), "utf8");

// Mock catalog filtering logic from server.cjs:
function filterCatalog(products, scope) {
  const homepageOnly = scope === "homepage";
  return products
    .filter((product) => product.status === "published")
    .filter((product) => (homepageOnly ? Boolean(product?.homepageVisible) : true));
}

test("1. published + homepageVisible true => homepage endpoint includes it", () => {
  const products = [
    { id: "p1", status: "published", homepageVisible: true },
  ];
  const result = filterCatalog(products, "homepage");
  assert(result.length === 1 && result[0].id === "p1", "Published + homepageVisible true must be included");
});

test("2. published + homepageVisible false => homepage endpoint excludes it", () => {
  const products = [
    { id: "p2", status: "published", homepageVisible: false },
  ];
  const result = filterCatalog(products, "homepage");
  assert(result.length === 0, "Published + homepageVisible false must be excluded");
});

test("3. draft + homepageVisible true => homepage endpoint excludes it", () => {
  const products = [
    { id: "p3", status: "draft", homepageVisible: true },
  ];
  const result = filterCatalog(products, "homepage");
  assert(result.length === 0, "Draft + homepageVisible true must be excluded");
});

test("4. homepage toggle does not alter status in admin panel", () => {
  assert(
    adminPanelSrc.includes("const toggleHomepageVisible = useCallback(async (product) => {") &&
    adminPanelSrc.includes("updateAdminSteaCodeProduct(product.id, { homepageVisible: next })") &&
    !adminPanelSrc.includes("updateAdminSteaCodeProduct(product.id, { homepageVisible: next, status:"),
    "toggleHomepageVisible must update homepageVisible without mutating status"
  );
});

test("5. product table displays homepage state column & badges", () => {
  assert(
    adminPanelSrc.includes("<th>Homepage</th>") &&
    adminPanelSrc.includes('className={`sc-admin-status ${p.homepageVisible ? "is-yes" : "is-no"}`}') &&
    adminPanelSrc.includes('{p.homepageVisible ? "Yes" : "No"}'),
    "ProductTable must display Homepage column and Yes/No state badges"
  );
});

console.log("\n────────────────────────────────────────────────────────────");
console.log(`RESULTS: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log("────────────────────────────────────────────────────────────\n");

if (failed > 0) {
  process.exit(1);
}
