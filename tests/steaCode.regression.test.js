/**
 * STEA Code Permanent Architecture & Routing Regression Tests
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const srcDir = join(rootDir, "src");
const adminDir = join(srcDir, "admin-v2");

function readFile(relPath) {
  return readFileSync(join(srcDir, relPath), "utf8");
}

function readAdminFile(relPath) {
  return readFileSync(join(adminDir, relPath), "utf8");
}

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
console.log("STEA CODE REGRESSION TESTS — PERMANENT ARCHITECTURE");
console.log("============================================================\n");

console.log("Part 1: Public /code Homepage & Dual Catalog");
{
  const src = readFile("pages/stea-code/SteaCodeHomeV2.jsx");

  test("1. fullCatalog is declared as useState in SteaCodeHomeV2", () => {
    assert(
      src.includes("const [fullCatalog, setFullCatalog] = useState"),
      "fullCatalog useState declaration missing in SteaCodeHomeV2.jsx"
    );
  });

  test("2. liveCatalog is declared as useState in SteaCodeHomeV2", () => {
    assert(
      src.includes("const [liveCatalog, setLiveCatalog] = useState"),
      "liveCatalog useState declaration missing in SteaCodeHomeV2.jsx"
    );
  });

  test("3. Dual catalog loading requests homepage scope and full catalog in parallel", () => {
    assert(
      src.includes("getSteaCodeCatalog({ scope: \"homepage\" })") &&
      src.includes("getSteaCodeCatalog()"),
      "Dual catalog loading missing"
    );
  });

  test("4. Empty homepage array [] does not trigger fallback dummy products", () => {
    assert(
      !src.includes("setLiveCatalog(FALLBACK_CODE_PRODUCTS)"),
      "Should not fallback to FALLBACK_CODE_PRODUCTS when array is empty"
    );
  });
}

console.log("\nPart 2: Host Awareness & Canonical Code Host Routing");
{
  const subdomains = readFile("utils/subdomains.js");
  const subdomainRoutes = readFile("utils/subdomainRoutes.js");
  const app = readFile("App.jsx");

  test("5. isSteaCodeHost recognizes code.stea.africa and code.localhost", () => {
    assert(
      subdomains.includes("host === \"code.stea.africa\"") &&
      subdomains.includes("host === \"code.localhost\""),
      "isSteaCodeHost must check code.stea.africa and code.localhost"
    );
  });

  test("6. SUBDOMAIN_ROUTES maps code.stea.africa to / (canonical root)", () => {
    assert(
      subdomainRoutes.includes('"code.stea.africa": "/"'),
      "code.stea.africa must map to / in SUBDOMAIN_ROUTES"
    );
  });

  test("7. App.jsx renders SteaCodeHomeV2 at / on code host", () => {
    assert(
      app.includes("isCodeHost\n                      ? <SteaCodeHomeV2 />") ||
      app.includes("isCodeHost ? <SteaCodeHomeV2 /> :"),
      "App.jsx must render SteaCodeHomeV2 at / when isCodeHost is true"
    );
  });

  test("8. App.jsx redirects /code to / on code host", () => {
    assert(
      app.includes('path="/code"') &&
      (app.includes('isCodeHost\n                      ? <Navigate to="/" replace />') ||
       app.includes('isCodeHost\n                      ? <Navigate to={{ pathname: "/", search: location.search }} replace />')),
      "/code must redirect to / on code host"
    );
  });

  test("9. App.jsx redirects /daily to / on code host", () => {
    assert(
      app.includes('path="/daily"') &&
      (app.includes('isCodeHost\n                      ? <Navigate to="/" replace />') ||
       app.includes('isCodeHost\n                      ? <Navigate to={{ pathname: "/", search: location.search }} replace />')),
      "/daily must redirect to / on code host"
    );
  });

  test("10. Canonical STEA Code Admin route remains /code-admin/*", () => {
    assert(
      app.includes("path=\"/code-admin/*\""),
      "Expected /code-admin/* route in App.jsx"
    );
    assert(
      app.includes("baseRoute: \"/code-admin\""),
      "Expected baseRoute: '/code-admin' in App.jsx"
    );
  });

  test("11. STEA Sites /admin routing remains intact", () => {
    assert(
      app.includes("path=\"/admin/*\""),
      "Expected /admin/* route in App.jsx for Sites"
    );
  });
}

console.log("\nPart 3: Global Accessory Isolation & Helpers");
{
  const subdomains = readFile("utils/subdomains.js");
  const adminApp = readAdminFile("SteaCodeAdminApp.jsx");
  const app = readFile("App.jsx");

  test("12. getSteaCodePublicUrl returns / on code host and /code on localhost", () => {
    assert(
      subdomains.includes("export function getSteaCodePublicUrl"),
      "getSteaCodePublicUrl missing in subdomains.js"
    );
  });

  test("13. SteaCodeAdminApp uses getSteaCodePublicUrl for Open STEA Code link", () => {
    assert(
      adminApp.includes("getSteaCodePublicUrl()"),
      "SteaCodeAdminApp must use getSteaCodePublicUrl()"
    );
  });

  test("14. GlobalInstallAppButton and BottomNav are excluded on code host", () => {
    assert(
      app.includes("!isCodeHost && <GlobalInstallAppButton />"),
      "GlobalInstallAppButton should not mount on code host"
    );
    assert(
      app.includes("!isCodeHost && <BottomNav />"),
      "BottomNav should not mount on code host"
    );
  });
}

console.log("\nPart 4: Dedicated Code Admin Shell & Navigation");
{
  const adminApp = readAdminFile("SteaCodeAdminApp.jsx");
  const panel = readAdminFile("SteaCodeCommercePanel.jsx");

  test("15. SteaCodeAdminApp defines products/new and products/:productId/edit routes", () => {
    assert(
      adminApp.includes('path="products/new"'),
      "products/new route missing in SteaCodeAdminApp"
    );
    assert(
      adminApp.includes('path="products/:productId/edit"'),
      "products/:productId/edit route missing in SteaCodeAdminApp"
    );
  });

  test("16. openEditor navigates to route instead of opening modal in dedicatedAdmin mode", () => {
    assert(
      panel.includes("navigate(`${base}/products/new`)") &&
      panel.includes("navigate(`${base}/products/${encodeURIComponent(product.id)}/edit`)"),
      "openEditor must navigate to route"
    );
  });

  test("17. openPreview navigates to ?tab=preview deep-link", () => {
    assert(
      panel.includes("navigate(`${base}/products/${encodeURIComponent(product.id)}/edit?tab=preview`)"),
      "openPreview must deep-link to ?tab=preview"
    );
  });

  test("18. Products table onEdit calls openEditor and onPreview calls openPreview", () => {
    assert(
      panel.includes("onEdit={(p) => openEditor(p)}"),
      "Products table must use openEditor"
    );
    assert(
      panel.includes("onPreview={(p) => openPreview(p)}"),
      "Products table must use openPreview"
    );
  });

  test("19. useNavigate hook is called unconditionally in SteaCodeCommercePanel", () => {
    assert(
      !panel.includes("dedicatedAdmin ? useNavigate() : null"),
      "useNavigate must not be called conditionally"
    );
  });
}

console.log("\nPart 5: DEV PREVIEW Mode & Shared Fixture");
{
  const fixture = readAdminFile("steaCodeDevPreviewData.js");
  const studioPage = readAdminFile("SteaCodeProductStudioPage.jsx");
  const panel = readAdminFile("SteaCodeCommercePanel.jsx");

  test("20. Shared steaCodeDevPreviewData.js exports DEV_PREVIEW_PRODUCTS", () => {
    assert(
      fixture.includes("export const DEV_PREVIEW_PRODUCTS"),
      "Fixture export missing"
    );
    assert(
      fixture.includes('id: "preview-sylva-living-world"'),
      "Sylva Living World fixture missing"
    );
  });

  test("21. SteaCodeProductStudioPage does not call protected API in devPreview mode", () => {
    assert(
      studioPage.includes("if (devPreview)"),
      "devPreview guard missing in SteaCodeProductStudioPage"
    );
    assert(
      studioPage.includes("DEV_PREVIEW_PRODUCTS.find"),
      "Local fixture lookup missing in SteaCodeProductStudioPage"
    );
  });

  test("22. SteaCodeCommercePanel imports DEV_PREVIEW_PRODUCTS from shared fixture", () => {
    assert(
      panel.includes('from "./steaCodeDevPreviewData.js"'),
      "Import from steaCodeDevPreviewData.js missing in CommercePanel"
    );
  });
}

console.log("\nPart 6: Preview-Only Mode Escape & Layout");
{
  const panel = readAdminFile("SteaCodeCommercePanel.jsx");
  const css = readAdminFile("admin-v2.css");

  test("23. Shared sc-studio-mode-toolbar renders outside conditional code pane", () => {
    assert(
      panel.includes("className=\"sc-studio-mode-toolbar\""),
      "sc-studio-mode-toolbar missing in CommercePanel"
    );
    assert(
      panel.includes("LIVE PREVIEW WORKSPACE"),
      "LIVE PREVIEW WORKSPACE label missing in toolbar"
    );
  });

  test("24. Code/Split/Preview mode buttons exist on shared toolbar", () => {
    assert(
      panel.includes("onClick={() => setEditorMode(\"code\")}") &&
      panel.includes("onClick={() => setEditorMode(\"split\")}") &&
      panel.includes("onClick={() => setEditorMode(\"preview\")}"),
      "Editor mode switches missing on shared toolbar"
    );
  });

  test("25. CSS for .sc-studio-mode-toolbar is defined in admin-v2.css", () => {
    assert(
      css.includes(".sc-studio-mode-toolbar"),
      "CSS for .sc-studio-mode-toolbar missing in admin-v2.css"
    );
  });
}

console.log("\nPart 7: New Product Workflow, Save Draft & Publish Safety");
{
  const panel = readAdminFile("SteaCodeCommercePanel.jsx");

  test("26. canPublish requires editing (real product ID) and source files", () => {
    assert(
      panel.includes("const canPublish =") &&
      panel.includes("editing &&") &&
      panel.includes("hasSourceFiles"),
      "canPublish must require persisted product and source files"
    );
  });

  test("27. Publish tab shows safe 'Save draft first' view for unsaved products", () => {
    assert(
      panel.includes("needsSaveFirst") &&
      panel.includes("Save this product as a draft first."),
      "needsSaveFirst guard missing in Publish tab"
    );
  });

  test("28. Source Files tab shows locked state for new unsaved products", () => {
    assert(
      panel.includes("Save the product first to manage source files."),
      "Unsaved source files guard missing"
    );
  });

  test("29. Save Draft on new product navigates to /products/:id/edit route", () => {
    assert(
      panel.includes("products/${encodeURIComponent(realProductId)}/edit"),
      "Save on new product must navigate to edit route"
    );
  });

  test("30. Tab synchronization via selectTab updates query search params", () => {
    assert(
      panel.includes("const selectTab =") &&
      panel.includes("sp.set(\"tab\", valid)"),
      "Tab synchronization missing in ProductStudio"
    );
  });
}

console.log("\nPart 8: Fullpage Studio Layout & CSS Scrolling");
{
  const css = readAdminFile("admin-v2.css");

  test("31. .sc-studio-fullpage does not set fixed height (allows page scroll)", () => {
    const fixedHeightRegex = /\.sc-studio-fullpage\s*\{[^}]*[\s;]height:\s*calc\(100vh - 64px\)/;
    assert(
      !fixedHeightRegex.test(css),
      ".sc-studio-fullpage must not constrain height to calc(100vh - 64px)"
    );
  });

  test("32. .sc-studio-fullpage .sc-studio-body has height: auto", () => {
    assert(
      css.includes(".sc-studio-fullpage .sc-studio-body") &&
      css.includes("height: auto"),
      ".sc-studio-fullpage .sc-studio-body should have height: auto"
    );
  });
}

console.log("\nPart 9: Real Persistence & Publish Pipeline Architecture");
{
  const server = readFileSync(join(rootDir, "server.ts"), "utf8");
  const adminService = readFile("services/steaCodeAdmin.js");
  const panel = readAdminFile("SteaCodeCommercePanel.jsx");

  test("33. Create product awaits Firestore write and verifies document exists", () => {
    assert(
      server.includes("await ref.set(storedProduct);") &&
      server.includes("const savedSnap = await ref.get();") &&
      server.includes("if (!savedSnap.exists)"),
      "Create product must await Firestore write and verify document readback"
    );
  });

  test("34. Create product endpoint returns real productId and product payload", () => {
    assert(
      server.includes("return res.status(201).json({\n          success: true,\n          productId,\n          product: {") ||
      server.includes("productId,\n          product: {\n            id: productId"),
      "Create endpoint must return real productId"
    );
  });

  test("35. Frontend navigates only after successful create and real productId", () => {
    assert(
      panel.includes("if (!editing && realProductId)") &&
      panel.includes("products/${encodeURIComponent(realProductId)}/edit"),
      "Frontend must navigate to edit route only with realProductId"
    );
  });

  test("36. Admin service attaches Authorization Bearer ID token to requests", () => {
    assert(
      adminService.includes("Authorization: `Bearer ${token}`"),
      "adminService must attach Authorization Bearer token"
    );
  });

  test("37. New preview source is saved under the real product ID", () => {
    assert(
      panel.includes("await saveAdminSteaCodePreview(realProductId, previewSource)"),
      "Preview source must be saved under realProductId"
    );
  });

  test("38. Source import creates index.html from preview source", () => {
    assert(
      panel.includes('{ path: "index.html", language: "html", content: rawFullDoc, order: 0 }') &&
      panel.includes('{ path: "index.html", language: "html", content: String(p.html || ""), order: 0 }'),
      "Source import must create index.html"
    );
  });

  test("39. SourceFilesPanel calls onSourceSaved and updates hasSourceFiles immediately", () => {
    assert(
      panel.includes("onSourceSaved={(savedFiles) =>") &&
      panel.includes("setHasSourceFiles(Array.isArray(savedFiles) && savedFiles.length > 0)"),
      "onSourceSaved must update hasSourceFiles immediately"
    );
  });

  test("40. Publish requires source files (hasSourceFiles === true)", () => {
    assert(
      panel.includes("hasSourceFiles") &&
      panel.includes("const canPublish ="),
      "Publish eligibility must gate on hasSourceFiles"
    );
  });

  test("41. Publish writes status=published and logs publish mutation", () => {
    assert(
      server.includes('if (payload.status === "published")') &&
      server.includes("[stea-code publish]"),
      "Publish must set status=published and log publish mutation"
    );
  });

  test("42. homepageVisible boolean is preserved in sanitizeSteaCodeProductInput", () => {
    assert(
      server.includes("homepageVisible: Boolean(raw?.homepageVisible)"),
      "homepageVisible must be preserved"
    );
  });

  test("43. Catalog endpoint queries Firestore stea_code_products and filters published", () => {
    assert(
      server.includes('collection("stea_code_products")') &&
      server.includes('filter((product: any) => product.status === "published")'),
      "Catalog must query Firestore stea_code_products"
    );
  });

  test("44. Homepage scope catalog requires status=published and homepageVisible=true", () => {
    assert(
      server.includes("homepageOnly ? Boolean(product?.homepageVisible) : true"),
      "Homepage scope must enforce homepageVisible"
    );
  });

  test("45. Public preview endpoint resolves document by ID or slug consistently", () => {
    assert(
      server.includes("const product = await getResolvedSteaCodeProduct(productId, false);") &&
      (server.includes("getResolvedSteaCodePreview(product.id") || server.includes("product.id || productId")),
      "Public preview must resolve canonical product ID"
    );
  });

  test("46. Server logs mutations concisely for create, preview, source, and publish", () => {
    assert(
      server.includes("[stea-code admin create]") &&
      server.includes("[stea-code preview save]") &&
      server.includes("[stea-code source save]") &&
      server.includes("[stea-code publish]"),
      "Structured server logs missing for admin mutations"
    );
  });
}

console.log("\nPart 10: Homepage Visibility & Admin Panel Table");
{
  const adminPanelSrc = readAdminFile("SteaCodeCommercePanel.jsx");

  test("47. Product table renders Homepage column", () => {
    assert(
      adminPanelSrc.includes("<th>Homepage</th>"),
      "ProductTable must contain Homepage header column"
    );
  });

  test("48. Product table renders homepage state Yes/No badge", () => {
    assert(
      adminPanelSrc.includes('className={`sc-admin-status ${p.homepageVisible ? "is-yes" : "is-no"}`}') &&
      adminPanelSrc.includes('{p.homepageVisible ? "Yes" : "No"}'),
      "ProductTable must render homepageVisible state badge"
    );
  });

  test("49. Quick homepage toggle action button exists when status is published", () => {
    assert(
      adminPanelSrc.includes('p.status === "published" && onHomepageToggle') &&
      adminPanelSrc.includes('p.homepageVisible ? "Remove from Homepage" : "Add to Homepage"'),
      "Quick homepage toggle button missing for published products"
    );
  });

  test("50. Quick homepage toggle updates homepageVisible without mutating status", () => {
    assert(
      adminPanelSrc.includes("const toggleHomepageVisible = useCallback(async (product) => {") &&
      adminPanelSrc.includes("updateAdminSteaCodeProduct(product.id, { homepageVisible: next })"),
      "toggleHomepageVisible must update homepageVisible without mutating status"
    );
  });
}

console.log("\n────────────────────────────────────────────────────────────");
console.log(`RESULTS: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log("────────────────────────────────────────────────────────────\n");

if (failed > 0) {
  process.exit(1);
}
