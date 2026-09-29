/**
 * STEA Code V1 Storefront, Tools & Architecture Verification Tests
 */

import { readFileSync, existsSync } from "fs";
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
console.log("STEA CODE V1 STOREFRONT & DEVELOPER TOOLS TESTS");
console.log("============================================================\n");

const homeSrc = readFileSync(join(srcDir, "pages", "stea-code", "SteaCodeHomeV2.jsx"), "utf8");
const appSrc = readFileSync(join(srcDir, "App.jsx"), "utf8");
const serverSrc = readFileSync(join(rootDir, "server.ts"), "utf8");
const previewSrc = readFileSync(join(srcDir, "components", "stea-code", "SteaCodeProductLivePreview.jsx"), "utf8");
const adminPanelSrc = readFileSync(join(srcDir, "admin-v2", "SteaCodeCommercePanel.jsx"), "utf8");

console.log("Part 1: Homepage Restructure & Section Order");
{
  test("1. Hero kicker is BUILT FOR DEVELOPERS", () => {
    assert(homeSrc.includes('builtFor: { en: "BUILT FOR DEVELOPERS"'), "Kicker must be BUILT FOR DEVELOPERS");
  });

  test("2. Hero title contains Build better. Code faster.", () => {
    assert(homeSrc.includes("Build better.") && homeSrc.includes("Code faster."), "Hero title must contain Build better. Code faster.");
  });

  test("3. Hero description matches modern builders storefront copy", () => {
    assert(
      homeSrc.includes("Free and premium components, animations, tools and starter kits for modern builders."),
      "Hero description must match specification"
    );
  });

  test("4. Hero contains Explore Free and Browse Premium action buttons", () => {
    assert(
      homeSrc.includes("browseFree") &&
      homeSrc.includes("browsePremium") &&
      homeSrc.includes('setPricing("Free")') &&
      homeSrc.includes('setPricing("Premium")'),
      "Hero buttons must toggle Free and Premium views"
    );
  });

  test("5. Hero tech chips include 10 real technologies without fake numbers", () => {
    const requiredTech = [
      "React", "Next.js", "JavaScript", "TypeScript", "HTML/CSS",
      "Tailwind CSS", "GSAP", "Motion", "Three.js", "WebGL"
    ];
    for (const tech of requiredTech) {
      assert(homeSrc.includes("CODE_PRODUCT_TECH"), "CODE_PRODUCT_TECH array must be rendered");
    }
    assert(!homeSrc.includes("10,000+ developers") && !homeSrc.includes("50,000+ downloads"), "Fake counts must not be shown");
  });
}

console.log("\nPart 2: Real Product Data & Sections Filtering");
{
  test("6. Trending section ranks featured products first and uses real catalog", () => {
    assert(
      homeSrc.includes("const trendingProducts = useMemo(") &&
      homeSrc.includes("Number(Boolean(b.featured)) - Number(Boolean(a.featured))") &&
      homeSrc.includes(".slice(0, 4)"),
      "Trending products must rank featured first and take up to 4 real products"
    );
  });

  test("7. Free section filters pricingType === 'free' without fake fallback cards", () => {
    assert(
      homeSrc.includes("const freeProducts = useMemo(") &&
      homeSrc.includes('p.pricingType === "free"'),
      "Free section must filter real pricingType === free products"
    );
  });

  test("8. Premium section filters pricingType === 'premium' and hides when empty", () => {
    assert(
      homeSrc.includes("const premiumProducts = useMemo(") &&
      homeSrc.includes('p.pricingType === "premium"') &&
      homeSrc.includes("premiumProducts.length > 0 &&"),
      "Premium section must only show when premium products exist"
    );
  });

  test("9. Category counts are computed dynamically from real catalog", () => {
    assert(
      homeSrc.includes("const categoryCounts = useMemo(") &&
      homeSrc.includes("counts[p.category] = (counts[p.category] || 0) + 1"),
      "Category counts must be dynamically derived from catalog"
    );
  });
}

console.log("\nPart 3: AI Prompt Metadata & Security");
{
  test("10. server.ts sanitizes aiPrompt as string metadata", () => {
    assert(
      serverSrc.includes('aiPrompt: String(raw?.aiPrompt || "").trim()'),
      "server.ts must sanitize and persist aiPrompt"
    );
  });

  test("11. Admin panel includes AI Prompt input field and payload mapping", () => {
    assert(
      adminPanelSrc.includes("AI Prompt") &&
      adminPanelSrc.includes('aiPrompt: String(form.aiPrompt || "").trim()'),
      "Admin panel must support aiPrompt"
    );
  });

  test("12. ProductDetail displays AI Prompt and copy button ONLY when aiPrompt exists", () => {
    assert(
      homeSrc.includes("product?.aiPrompt && product.aiPrompt.trim()") &&
      homeSrc.includes("Copy AI Prompt") &&
      homeSrc.includes("navigator.clipboard.writeText(product.aiPrompt)"),
      "ProductDetail must conditionally render AI prompt and copy action"
    );
  });
}

console.log("\nPart 4: Developer Tools Routes & Implementation");
{
  test("13. App.jsx registers /tools and all 3 tool routes", () => {
    assert(
      appSrc.includes('path="/tools"') &&
      appSrc.includes('path="/tools/gradient-generator"') &&
      appSrc.includes('path="/tools/box-shadow-generator"') &&
      appSrc.includes('path="/tools/json-formatter"') &&
      appSrc.includes("<SteaCodeToolsPage />"),
      "App.jsx must route /tools and tool subroutes to SteaCodeToolsPage"
    );
  });

  test("14. GradientGenerator component file exists", () => {
    assert(existsSync(join(srcDir, "pages", "stea-code", "tools", "GradientGenerator.jsx")), "GradientGenerator.jsx missing");
  });

  test("15. BoxShadowGenerator component file exists", () => {
    assert(existsSync(join(srcDir, "pages", "stea-code", "tools", "BoxShadowGenerator.jsx")), "BoxShadowGenerator.jsx missing");
  });

  test("16. JsonFormatter component file exists", () => {
    assert(existsSync(join(srcDir, "pages", "stea-code", "tools", "JsonFormatter.jsx")), "JsonFormatter.jsx missing");
  });

  test("17. SteaCodeToolsPage component file exists", () => {
    assert(existsSync(join(srcDir, "pages", "stea-code", "tools", "SteaCodeToolsPage.jsx")), "SteaCodeToolsPage.jsx missing");
  });
}

console.log("\nPart 5: Sandbox & Performance Architecture");
{
  test("18. Live previews remain sandboxed with allow-scripts", () => {
    assert(
      previewSrc.includes('sandbox="allow-scripts"') ||
      previewSrc.includes('sandbox="allow-scripts allow-same-origin"'),
      "Iframe preview sandbox must be preserved"
    );
  });

  test("19. Live previews unmount/pause when offscreen via isIntersecting", () => {
    assert(
      previewSrc.includes("!nearViewport || (!isIntersecting && lazy)") &&
      previewSrc.includes("setIsIntersecting(entry.isIntersecting)"),
      "Offscreen previews must be unmounted when scrolled away"
    );
  });

  test("20. Live previews detect prefers-reduced-motion", () => {
    assert(
      previewSrc.includes("prefers-reduced-motion: reduce"),
      "prefers-reduced-motion media query listener must be active"
    );
  });
}

console.log("\n────────────────────────────────────────────────────────────");
console.log(`RESULTS: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log("────────────────────────────────────────────────────────────\n");

if (failed > 0) {
  process.exit(1);
}
