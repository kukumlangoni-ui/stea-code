/**
 * Live Final Preview Validation
 */
import puppeteer from "puppeteer";

async function run() {
  const previewUrl = "https://swahilitecheliteacademy--sites-speed-final-zb8e9a74.web.app/websites/";
  console.log("==================================================");
  console.log("TESTING LIVE SITES PREVIEW CHANNEL LIKE A REAL USER");
  console.log("URL:", previewUrl);
  console.log("==================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let failures = 0;

  try {
    // 1. Fresh Visitor Load on Mobile (390x844)
    console.log("\n1. Fresh Visitor Experience on Mobile (390x844)...");
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (e) => { pageErrors.push(e.message); console.error("  [PAGE_ERROR]:", e.message); });
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

    const startTime = Date.now();
    await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    const domLoadedTime = Date.now() - startTime;
    console.log(`  ✓ DOMContentLoaded in ${domLoadedTime}ms`);

    await page.waitForSelector(".sites-header-v2", { timeout: 15000 });

    const bodyText = await page.evaluate(() => document.body.innerText);

    if (bodyText.includes("Something went wrong")) {
      console.error("  ❌ FAILED: ErrorBoundary detected on live preview!");
      failures++;
    } else {
      console.log("  ✓ No ErrorBoundary.");
    }

    if (bodyText.includes("BUILT BY STEA")) {
      console.error("  ❌ FAILED: Found 'BUILT BY STEA' badge!");
      failures++;
    } else {
      console.log("  ✓ Forbidden badge absent: 'BUILT BY STEA'");
    }

    // Check 0 overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(`  ✓ Mobile horizontal overflow: ${overflow ? "0px (PASS)" : "FAIL"}`);
    if (!overflow) failures++;

    // Wait for PWA banner to mount
    await page.waitForSelector(".sites-top-install-banner", { timeout: 8000 });

    // Check PWA top banner details
    const bannerInfo = await page.evaluate(() => {
      const banner = document.querySelector(".sites-top-install-banner");
      const title = banner?.querySelector(".sites-install-title")?.innerText || "";
      const desc = banner?.querySelector(".sites-install-desc")?.innerText || "";
      const icon = banner?.querySelector(".sites-install-icon")?.getAttribute("src") || "";
      const btnText = banner?.querySelector(".sites-install-action-btn")?.innerText || "";
      const hasProgressBar = Boolean(banner?.querySelector(".sites-install-progress-bar"));
      return {
        exists: Boolean(banner),
        title,
        desc,
        icon,
        btnText,
        hasProgressBar,
      };
    });

    console.log("  ✓ Top Install Banner Details:", bannerInfo);
    if (!bannerInfo.exists || bannerInfo.title !== "STEA Sites" || !bannerInfo.hasProgressBar) {
      console.error("  ❌ FAILED: Top install banner missing required structure!");
      failures++;
    }

    // Test Dismiss action and Cooldown
    console.log("  Testing banner dismiss action...");
    await page.evaluate(() => document.querySelector(".sites-install-close-btn")?.click());
    await new Promise((r) => setTimeout(r, 400));
    const bannerAfterDismiss = await page.evaluate(() => {
      const banner = document.querySelector(".sites-top-install-banner");
      const cooldown = localStorage.getItem("stea_sites_pwa_dismissed_until");
      return { exists: Boolean(banner), cooldownSet: Boolean(cooldown) };
    });
    console.log("  ✓ Banner after dismiss:", bannerAfterDismiss);
    if (bannerAfterDismiss.exists || !bannerAfterDismiss.cooldownSet) {
      console.error("  ❌ FAILED: Dismiss did not hide banner or set cooldown!");
      failures++;
    }

    // 2. Returning Visitor (Cooldown Active)
    console.log("\n2. Returning Visitor (Cooldown Active)...");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".sites-header-v2", { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    const bannerOnReload = await page.evaluate(() => Boolean(document.querySelector(".sites-top-install-banner")));
    console.log("  ✓ Banner hidden on reload with cooldown:", !bannerOnReload ? "PASS" : "FAIL");
    if (bannerOnReload) failures++;

    // 3. Live search on mobile
    console.log("\n3. Testing live mobile search for 'insta'...");
    const searchInput = await page.$(".sites-hero-search-input");
    if (searchInput) {
      await searchInput.type("insta");
      await new Promise((r) => setTimeout(r, 800));

      const dropdown = await page.evaluate(() => {
        const dd = document.querySelector(".sites-search-dropdown");
        if (!dd) return null;
        const items = Array.from(dd.querySelectorAll(".sites-search-suggestion-item"));
        const first = items[0];
        return {
          count: items.length,
          topName: first?.querySelector(".sites-sugg-name")?.innerText || "",
          topDomain: first?.querySelector(".sites-sugg-domain")?.innerText || "",
          hasIcon: Boolean(first?.querySelector("svg, img")),
        };
      });

      console.log("  ✓ Mobile search result for 'insta':", dropdown);
      if (dropdown?.topName !== "Instagram") {
        console.error(`  ❌ FAILED: Expected Instagram as #1, got: ${dropdown?.topName}`);
        failures++;
      }
    }

    await page.close();
    await context.close();

    // 4. Desktop 1440x900 Test
    console.log("\n4. Desktop 1440x900 Verification...");
    const deskContext = await browser.createBrowserContext();
    const deskPage = await deskContext.newPage();
    await deskPage.setViewport({ width: 1440, height: 900 });
    await deskPage.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await deskPage.waitForSelector(".sites-header-v2", { timeout: 15000 });

    const deskOverflow = await deskPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(`  ✓ Desktop horizontal overflow: ${deskOverflow ? "0px (PASS)" : "FAIL"}`);
    if (!deskOverflow) failures++;

    const headerInstall = await deskPage.evaluate(() => {
      const btn = document.querySelector(".sites-header-install-btn");
      return { exists: Boolean(btn), text: btn?.innerText || "" };
    });
    console.log("  ✓ Header Install button:", headerInstall);
    if (!headerInstall.exists) {
      console.error("  ❌ FAILED: Header install button missing!");
      failures++;
    }

    await deskPage.close();
    await deskContext.close();

  } finally {
    await browser.close();
  }

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("🎉 ALL LIVE PREVIEW VALIDATIONS PASSED 100%!");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} PREVIEW VALIDATION FAILURES OCCURRED!`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
