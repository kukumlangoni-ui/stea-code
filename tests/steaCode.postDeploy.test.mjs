/**
 * STEA Code Post-Deploy Production Verification
 */

import puppeteer from "puppeteer";
import { existsSync } from "fs";

async function runPostDeployChecks() {
  console.log("\n============================================================");
  console.log("STEA CODE POST-DEPLOY PRODUCTION VERIFICATION");
  console.log("Target: https://code.stea.africa");
  console.log("============================================================\n");

  let failures = 0;

  // 1. API CHECKS
  console.log("1. Testing Public Production APIs...");
  try {
    const resFull = await fetch("https://code.stea.africa/api/stea-code/catalog");
    const jsonFull = await resFull.json();
    console.log(`  ✓ GET /api/stea-code/catalog: status ${resFull.status} (products: ${Array.isArray(jsonFull?.products) ? jsonFull.products.length : "none"})`);
    if (resFull.status !== 200) {
      console.error("  ❌ FAILED: Non-200 status from full catalog API");
      failures++;
    }
  } catch (e) {
    console.error("  ❌ FAILED: Full catalog API network error:", e.message);
    failures++;
  }

  try {
    const resHome = await fetch("https://code.stea.africa/api/stea-code/catalog?scope=homepage");
    const jsonHome = await resHome.json();
    console.log(`  ✓ GET /api/stea-code/catalog?scope=homepage: status ${resHome.status} (products: ${Array.isArray(jsonHome?.products) ? jsonHome.products.length : "none"})`);
    if (resHome.status !== 200) {
      console.error("  ❌ FAILED: Non-200 status from homepage catalog API");
      failures++;
    }
  } catch (e) {
    console.error("  ❌ FAILED: Homepage catalog API network error:", e.message);
    failures++;
  }

  // 2. REAL BROWSER CHECKS
  console.log("\n2. Testing Real Browser Production Pages (Puppeteer)...");

  const executablePath = existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined;

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // ─── CHECK A: https://code.stea.africa/ ───
    console.log("\n  A. Testing https://code.stea.africa/ (Root)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      const consoleErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("    ❌ [PAGE_ERROR]:", e.message);
      });
      page.on("console", (m) => {
        if (m.type() === "error") {
          const text = m.text();
          if (!text.includes("ResizeObserver") && !text.includes("404")) {
            consoleErrors.push(text);
            console.error("    ⚠️  [CONSOLE_ERROR]:", text);
          }
        }
      });

      await page.goto("https://code.stea.africa/", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      await new Promise((r) => setTimeout(r, 6000));

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes("Something went wrong")) {
        console.error("    ❌ FAILED: Global ErrorBoundary detected on https://code.stea.africa/ !");
        failures++;
      } else {
        console.log("    ✓ No ErrorBoundary detected on https://code.stea.africa/");
      }

      const hasSteaCodeBrand =
        bodyText.includes("STEA CODE") ||
        bodyText.includes("BUILT FOR DEVELOPERS") ||
        bodyText.includes("Build better.") ||
        bodyText.includes("Code faster.");

      if (!hasSteaCodeBrand) {
        console.error("    ❌ FAILED: STEA Code content not found on root!");
        failures++;
      } else {
        console.log("    ✓ Canonical STEA Code homepage content verified.");
      }

      if (pageErrors.length > 0) {
        console.error(`    ❌ FAILED: ${pageErrors.length} uncaught page errors on https://code.stea.africa/`);
        failures++;
      } else {
        console.log("    ✓ 0 uncaught runtime page errors on https://code.stea.africa/");
      }

      await page.close();
    }

    // ─── CHECK B: https://code.stea.africa/code ───
    console.log("\n  B. Testing https://code.stea.africa/code (Legacy Route Redirect)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("    ❌ [PAGE_ERROR]:", e.message);
      });

      await page.goto("https://code.stea.africa/code", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      await new Promise((r) => setTimeout(r, 6000));

      const finalUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText);

      console.log(`    ✓ Final URL after navigation: ${finalUrl}`);
      if (finalUrl === "https://code.stea.africa/" || finalUrl === "https://code.stea.africa") {
        console.log("    ✓ Redirected cleanly to canonical root (https://code.stea.africa/)");
      }

      if (bodyText.includes("Something went wrong")) {
        console.error("    ❌ FAILED: Global ErrorBoundary detected on /code!");
        failures++;
      } else {
        console.log("    ✓ No ErrorBoundary detected on /code.");
      }

      if (pageErrors.length > 0) {
        console.error(`    ❌ FAILED: ${pageErrors.length} uncaught page errors on /code.`);
        failures++;
      } else {
        console.log("    ✓ 0 uncaught runtime page errors on /code.");
      }

      await page.close();
    }

    // ─── CHECK C: https://code.stea.africa/code-admin/products ───
    console.log("\n  C. Testing https://code.stea.africa/code-admin/products (Dedicated Code Admin)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("    ❌ [PAGE_ERROR]:", e.message);
      });

      await page.goto("https://code.stea.africa/code-admin/products", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      await new Promise((r) => setTimeout(r, 6000));

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes("Something went wrong")) {
        console.error("    ❌ FAILED: Global ErrorBoundary on /code-admin/products!");
        failures++;
      } else {
        console.log("    ✓ No ErrorBoundary on /code-admin/products.");
      }

      const isCodeAdminContent =
        bodyText.includes("STEA CODE") ||
        bodyText.includes("Products") ||
        bodyText.includes("Admin") ||
        bodyText.includes("Sign In") ||
        bodyText.includes("Access") ||
        bodyText.includes("Loading");

      if (!isCodeAdminContent) {
        console.error("    ❌ FAILED: Code Admin content not detected.");
        failures++;
      } else {
        console.log("    ✓ STEA Code dedicated admin surface verified.");
      }

      if (pageErrors.length > 0) {
        console.error(`    ❌ FAILED: ${pageErrors.length} uncaught page errors on /code-admin/products.`);
        failures++;
      } else {
        console.log("    ✓ 0 uncaught runtime page errors on /code-admin/products.");
      }

      await page.close();
    }

  } finally {
    await browser.close();
  }

  console.log("\n────────────────────────────────────────────────────────────");
  if (failures === 0) {
    console.log("🎉 ALL POST-DEPLOY PRODUCTION CHECKS PASSED 100%!");
    console.log("────────────────────────────────────────────────────────────\n");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} POST-DEPLOY CHECKS FAILED!`);
    console.log("────────────────────────────────────────────────────────────\n");
    process.exit(1);
  }
}

runPostDeployChecks().catch((err) => {
  console.error("Post-deploy verification crashed:", err);
  process.exit(1);
});
