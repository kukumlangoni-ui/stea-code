/**
 * Suspense & First-Load Speed Test Suite
 */
import puppeteer from "puppeteer";

export async function runSpeedAudit(targetUrl) {
  console.log("==================================================");
  console.log("RUNNING SITES FIRST-LOAD SPEED & SUSPENSE AUDIT");
  console.log("Target URL:", targetUrl);
  console.log("==================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let failures = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    // Disable browser cache to test worst-case first-time visitor
    await page.setCacheEnabled(false);

    const consoleErrors = [];
    const pageErrors = [];
    page.on("pageerror", (e) => { pageErrors.push(e.message); console.error("  [PAGE ERROR]:", e.message); });
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

    console.log("\n1. Navigating with Cache Disabled...");
    const navStart = Date.now();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    const domLoadedTime = Date.now() - navStart;
    console.log(`  ✓ DOMContentLoaded in ${domLoadedTime}ms`);

    // Check state immediately and then every 250ms
    console.log("\n2. Sampling state every 250ms for first 5 seconds, then every 1s up to 10s...");
    let heroVisibleTime = null;
    let fallbackDuration = 0;

    for (let i = 0; i <= 20; i++) {
      const elapsed = Date.now() - navStart;

      const state = await page.evaluate(() => {
        const rootHtml = document.getElementById("root")?.innerHTML || "";
        const bodyText = document.body.innerText || "";
        const hasHeroText = bodyText.includes("The useful side of the internet.") || bodyText.includes("STEA Sites");
        const hasSearch = Boolean(document.querySelector(".sites-hero-search-input"));
        const hasCategories = Boolean(document.querySelector(".sites-category-tiles-v2, .sites-categories-grid"));
        const isFallback = !hasHeroText && !hasSearch && (rootHtml.includes("min-height: 100vh") || rootHtml.includes("min-height:100vh"));

        return {
          isFallback,
          hasHeroText,
          hasSearch,
          hasCategories,
          bodySnippet: bodyText.slice(0, 80).replace(/\n/g, " "),
        };
      });

      if (i % 4 === 0 || i === 0) {
        console.log(`  [t = ${(elapsed / 1000).toFixed(2)}s] Hero: ${state.hasHeroText ? "YES" : "NO"}, Search: ${state.hasSearch ? "YES" : "NO"}, Fallback: ${state.isFallback ? "YES" : "NO"}`);
      }

      if (state.hasHeroText && !heroVisibleTime) {
        heroVisibleTime = elapsed;
      }
      if (state.isFallback) {
        fallbackDuration += 0.25;
      }

      await new Promise((r) => setTimeout(r, 250));
    }

    console.log(`\nTime to Hero Visible: ${heroVisibleTime ? `${heroVisibleTime}ms` : "NOT VISIBLE"}`);
    if (!heroVisibleTime || heroVisibleTime > 3500) {
      console.error("  ❌ FAILED: Hero took too long to become visible (> 3.5s)!");
      failures++;
    } else {
      console.log("  ✓ Hero visible within target threshold (< 2.5-3.5s).");
    }

    if (fallbackDuration > 2) {
      console.error(`  ❌ FAILED: Root was stuck in Suspense fallback for ${fallbackDuration}s!`);
      failures++;
    } else {
      console.log(`  ✓ Suspense fallback cleared immediately (${fallbackDuration}s total).`);
    }

    // 3. Search Bar Functional Test
    console.log("\n3. Verifying Search Responsiveness...");
    const searchInput = await page.$(".sites-hero-search-input");
    if (searchInput) {
      await searchInput.type("insta");
      await new Promise((r) => setTimeout(r, 600));

      const dropdown = await page.evaluate(() => {
        const dd = document.querySelector(".sites-search-dropdown");
        const items = Array.from(dd?.querySelectorAll(".sites-search-suggestion-item") || []);
        const first = items[0];
        return {
          count: items.length,
          topName: first?.querySelector(".sites-sugg-name")?.innerText || "",
          topDomain: first?.querySelector(".sites-sugg-domain")?.innerText || "",
          hasIcon: Boolean(first?.querySelector("svg, img")),
        };
      });

      console.log("  ✓ Search result for 'insta':", dropdown);
      if (dropdown.topName !== "Instagram") {
        console.error(`  ❌ FAILED: Search top item is '${dropdown.topName}', expected 'Instagram'!`);
        failures++;
      }
    } else {
      console.error("  ❌ FAILED: Search input element not found!");
      failures++;
    }

    await page.close();
  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("🎉 SITES FIRST-LOAD SPEED AUDIT PASSED 100%!");
    return true;
  } else {
    console.error(`❌ ${failures} SPEED AUDIT FAILURES OCCURRED!`);
    return false;
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || "http://localhost:4173/websites";
  runSpeedAudit(url).then((ok) => process.exit(ok ? 0 : 1));
}
