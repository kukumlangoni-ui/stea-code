/**
 * STEA Code Real Browser Smoke Test
 * Tests local production bundle with Puppeteer for zero uncaught errors.
 */

import http from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";
import puppeteer from "puppeteer";

const PORT = 4178;
const distDir = join(process.cwd(), "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

// Simple SPA static server that serves dist/ and rewrites all unknown routes to /index.html
const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  let filePath = join(distDir, urlPath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(distDir, "index.html");
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end(e.message);
  }
});

async function runSmokeTests() {
  console.log("\n============================================================");
  console.log("STEA CODE REAL BROWSER SMOKE TESTS (PUPPETEER)");
  console.log("============================================================\n");

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Local static production test server running on port ${PORT}`);

  const executablePath = existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined;

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  let failures = 0;

  try {
    // ─── TEST 1: Public STEA Code Homepage (/code on localhost) ───
    console.log("\n1. Testing /code (Public STEA Code Homepage)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      const consoleErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("  ❌ [PAGE_ERROR]:", e.message);
      });
      page.on("console", (m) => {
        if (m.type() === "error") {
          const text = m.text();
          // Filter out network errors from live backend APIs in offline test mode
          if (!text.includes("net::ERR") && !text.includes("Failed to fetch") && !text.includes("404")) {
            consoleErrors.push(text);
            console.error("  ⚠️  [CONSOLE_ERROR]:", text);
          }
        }
      });

      await page.goto(`http://127.0.0.1:${PORT}/code`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait 1.5s for React hydration and effects
      await new Promise((r) => setTimeout(r, 1500));

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes("Something went wrong")) {
        console.error("  ❌ FAILED: Global ErrorBoundary detected on /code!");
        failures++;
      } else {
        console.log("  ✓ No ErrorBoundary detected on /code.");
      }

      const hasSteaCodeContent =
        bodyText.includes("STEA CODE") ||
        bodyText.includes("BUILT FOR DEVELOPERS") ||
        bodyText.includes("Animations") ||
        bodyText.includes("Components");

      if (!hasSteaCodeContent) {
        console.error("  ❌ FAILED: STEA Code content not found on /code!");
        failures++;
      } else {
        console.log("  ✓ STEA Code content rendered cleanly.");
      }

      if (pageErrors.length > 0) {
        console.error(`  ❌ FAILED: ${pageErrors.length} uncaught page errors on /code.`);
        failures++;
      } else {
        console.log("  ✓ 0 uncaught runtime page errors on /code.");
      }

      await page.close();
    }

    // ─── TEST 2: Dedicated STEA Code Admin (/code-admin/products) ───
    console.log("\n2. Testing /code-admin/products (Dedicated Code Admin)...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("  ❌ [PAGE_ERROR]:", e.message);
      });

      await page.goto(`http://127.0.0.1:${PORT}/code-admin/products`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await new Promise((r) => setTimeout(r, 1500));

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes("Something went wrong")) {
        console.error("  ❌ FAILED: Global ErrorBoundary detected on /code-admin/products!");
        failures++;
      } else {
        console.log("  ✓ No ErrorBoundary detected on /code-admin/products.");
      }

      if (pageErrors.length > 0) {
        console.error(`  ❌ FAILED: ${pageErrors.length} uncaught page errors on /code-admin/products.`);
        failures++;
      } else {
        console.log("  ✓ 0 uncaught runtime page errors on /code-admin/products.");
      }

      await page.close();
    }

    // ─── TEST 3: DEV PREVIEW Product Studio (/code-admin/products/preview-sylva-living-world/edit) ───
    console.log("\n3. Testing DEV PREVIEW Studio Route...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      const pageErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("  ❌ [PAGE_ERROR]:", e.message);
      });

      await page.goto(
        `http://127.0.0.1:${PORT}/code-admin/products/preview-sylva-living-world/edit?tab=preview`,
        { waitUntil: "domcontentloaded", timeout: 30000 }
      );

      await new Promise((r) => setTimeout(r, 1500));

      const bodyText = await page.evaluate(() => document.body.innerText);

      if (bodyText.includes("Something went wrong")) {
        console.error("  ❌ FAILED: Global ErrorBoundary detected on DEV PREVIEW!");
        failures++;
      } else {
        console.log("  ✓ No ErrorBoundary on DEV PREVIEW studio.");
      }

      if (pageErrors.length > 0) {
        console.error(`  ❌ FAILED: ${pageErrors.length} uncaught page errors on DEV PREVIEW.`);
        failures++;
      } else {
        console.log("  ✓ 0 uncaught runtime page errors on DEV PREVIEW.");
      }

      await page.close();
    }

    // ─── TEST 4: Mobile Viewport Readiness (390px iPhone Width) ───
    console.log("\n4. Testing Mobile Viewport (390px) on /code...");
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

      const pageErrors = [];
      page.on("pageerror", (e) => {
        pageErrors.push(e.message);
        console.error("  ❌ [PAGE_ERROR]:", e.message);
      });

      await page.goto(`http://127.0.0.1:${PORT}/code`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await new Promise((r) => setTimeout(r, 1500));

      const overflowCheck = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const innerWidth = window.innerWidth;
        return {
          scrollWidth,
          innerWidth,
          hasOverflow: scrollWidth > innerWidth + 2, // Allow tiny subpixel rounding
        };
      });

      if (overflowCheck.hasOverflow) {
        console.error(`  ❌ FAILED: Horizontal overflow detected at 390px! scrollWidth=${overflowCheck.scrollWidth} > innerWidth=${overflowCheck.innerWidth}`);
        failures++;
      } else {
        console.log(`  ✓ Zero horizontal overflow on 390px mobile view (scrollWidth: ${overflowCheck.scrollWidth}px, innerWidth: ${overflowCheck.innerWidth}px).`);
      }

      if (pageErrors.length > 0) {
        console.error(`  ❌ FAILED: ${pageErrors.length} uncaught page errors on mobile view.`);
        failures++;
      } else {
        console.log("  ✓ 0 uncaught runtime page errors on mobile view.");
      }

      await page.close();
    }

  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n────────────────────────────────────────────────────────────");
  if (failures === 0) {
    console.log("🎉 ALL BROWSER SMOKE TESTS PASSED WITH 0 RUNTIME ERRORS!");
    console.log("────────────────────────────────────────────────────────────\n");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} BROWSER SMOKE TEST FAILURES OCCURRED!`);
    console.log("────────────────────────────────────────────────────────────\n");
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Smoke test runner crashed:", err);
  server.close();
  process.exit(1);
});
