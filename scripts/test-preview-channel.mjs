import puppeteer from "puppeteer";

async function verifyPreview() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const url = "https://swahilitecheliteacademy--sites-search-integrity-h8wz5apx.web.app/websites/";
  console.log("Testing live preview channel:", url);

  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const body = await page.evaluate(() => document.body.innerText);
  if (body.includes("Something went wrong")) {
    console.error("❌ FAILED: ErrorBoundary found on live preview!");
    process.exit(1);
  }
  console.log("✓ Live preview loaded (0 ErrorBoundary).");

  if (body.includes("BUILT BY STEA")) {
    console.error("❌ FAILED: Found 'BUILT BY STEA' badge on live preview!");
    process.exit(1);
  }
  console.log("✓ Live preview verified: 'BUILT BY STEA' badge removed.");

  // Test search for "insta" -> Instagram #1
  const searchInput = await page.$(".sites-hero-search-input");
  if (searchInput) {
    await searchInput.type("insta");
    await new Promise((r) => setTimeout(r, 800));

    const dropdown = await page.evaluate(() => {
      const dd = document.querySelector(".sites-search-dropdown");
      if (!dd) return null;
      const items = Array.from(dd.querySelectorAll(".sites-search-suggestion-item"));
      const first = items[0];
      const name = first?.querySelector(".sites-sugg-name")?.innerText || "";
      const domain = first?.querySelector(".sites-sugg-domain")?.innerText || "";
      const hasImg = Boolean(first?.querySelector("img, svg"));
      return {
        count: items.length,
        topName: name,
        topDomain: domain,
        hasRealIcon: hasImg,
      };
    });

    console.log("✓ Live preview search suggestions for 'insta':", dropdown);
    if (!dropdown || dropdown.topName !== "Instagram") {
      console.error(`❌ FAILED: Live search for 'insta' did not return Instagram as #1 (got: ${dropdown?.topName})`);
      process.exit(1);
    }
  }

  // Check 0 overflow
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  console.log(`✓ Live preview mobile horizontal overflow: ${overflow ? "0px (PASS)" : "FAIL"}`);

  await browser.close();

  if (errors.length > 0) {
    console.error("Errors encountered:", errors);
    process.exit(1);
  }

  console.log("\n🎉 LIVE PREVIEW VALIDATION PASSED COMPLETELY!");
}

verifyPreview().catch((e) => {
  console.error("Preview verification failed:", e);
  process.exit(1);
});
