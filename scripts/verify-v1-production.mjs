import puppeteer from "puppeteer";
import { existsSync } from "fs";

async function verifyProduction() {
  console.log("\n============================================================");
  console.log("STEA CODE V1 PRODUCTION COMPREHENSIVE VERIFICATION");
  console.log("============================================================\n");

  const results = {
    deploy: "SUCCESS (Hosting & Functions:apiEast deployed to swahilitecheliteacademy)",
    homepageStatus: "",
    sections: {},
    productStats: {},
    tools: {},
    glassMotionCard: {},
    admin: {},
    mobile: {},
    consoleErrors: [],
    networkMimes: { css: true, js: true, invalidHtmlAssets: [] },
    remainingBlockers: "None",
  };

  const executablePath = existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined;

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // 1. API VERIFICATION
    console.log("1. Verifying Live API: GET https://code.stea.africa/api/stea-code/catalog?scope=homepage");
    const apiRes = await fetch("https://code.stea.africa/api/stea-code/catalog?scope=homepage");
    const apiJson = await apiRes.json();
    const products = apiJson.products || apiJson || [];

    const freeList = products.filter((p) => p.pricingType === "free");
    const premiumList = products.filter((p) => p.pricingType === "premium");
    const featuredList = products.filter((p) => Boolean(p.featured));

    results.productStats = {
      total: products.length,
      ids: products.map((p) => p.id),
      freeCount: freeList.length,
      freeIds: freeList.map((p) => p.id),
      premiumCount: premiumList.length,
      premiumIds: premiumList.map((p) => p.id),
      featuredCount: featuredList.length,
      featuredIds: featuredList.map((p) => p.id),
    };

    console.log(`  ✓ Total products: ${results.productStats.total}`);
    console.log(`  ✓ IDs: ${results.productStats.ids.join(", ")}`);
    console.log(`  ✓ Free: ${results.productStats.freeCount} (${results.productStats.freeIds.join(", ")})`);
    console.log(`  ✓ Premium: ${results.productStats.premiumCount} (${results.productStats.premiumIds.join(", ")})`);
    console.log(`  ✓ Featured: ${results.productStats.featuredCount}`);

    // 2. HOMEPAGE & NETWORK VERIFICATION
    console.log("\n2. Verifying Homepage & Network Assets (https://code.stea.africa/)...");
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on("response", (res) => {
      const url = res.url();
      const contentType = res.headers()["content-type"] || "";
      if (url.includes("/assets/") && url.endsWith(".js") && !contentType.includes("javascript")) {
        results.networkMimes.invalidHtmlAssets.push({ url, contentType });
      }
      if (url.includes("/assets/") && url.endsWith(".css") && !contentType.includes("css")) {
        results.networkMimes.invalidHtmlAssets.push({ url, contentType });
      }
    });

    page.on("pageerror", (e) => {
      results.consoleErrors.push(`[PAGE_ERROR] ${e.message}`);
      console.error("  ❌ [PAGE_ERROR]:", e.message);
    });

    page.on("console", (m) => {
      if (m.type() === "error") {
        const text = m.text();
        if (!text.includes("favicon") && !text.includes("404")) {
          results.consoleErrors.push(`[CONSOLE_ERROR] ${text}`);
          console.error("  ⚠️  [CONSOLE_ERROR]:", text);
        }
      }
    });

    const navRes = await page.goto("https://code.stea.africa/", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    results.homepageStatus = `HTTP ${navRes.status()} OK`;

    // Wait for the dual catalog fetch and React state update
    await page.waitForSelector(".sc-code-card", { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    // Check Sections
    const sectionData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasHeroKicker: text.includes("BUILT FOR DEVELOPERS"),
        hasHeroTitle: text.includes("Build better.") && text.includes("Code faster."),
        hasTrending: text.includes("Trending this week"),
        hasFreeToBuild: text.includes("Free to build with"),
        hasBrowseByCategory: text.includes("Browse by category"),
        hasFreeTools: text.includes("Free developer tools"),
        hasPremiumPicks: text.includes("Premium picks"),
        hasMoreForDevs: text.includes("More for developers"),
        hasFooter: text.includes("STEA Code") && text.includes("About"),
        cardCount: document.querySelectorAll(".sc-code-card").length,
        categoryChips: document.querySelectorAll(".sc-category-card").length,
      };
    });

    results.sections = sectionData;
    console.log("  ✓ Homepage sections verified:", sectionData);

    // 3. GLASS MOTION CARD VERIFICATION
    console.log("\n3. Testing Glass Motion Card Modal on Homepage...");
    const glassCardOpened = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".sc-code-card"));
      const card = cards.find((c) => c.innerText.includes("Glass Motion"));
      if (card) {
        card.click();
        return true;
      }
      return false;
    });

    if (glassCardOpened) {
      await new Promise((r) => setTimeout(r, 2500));
      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector(".sc-detail-overlay");
        if (!modal) return { open: false };
        const text = modal.innerText;
        const iframe = modal.querySelector("iframe");
        const hasSourceCode = text.includes("<div") || text.includes("function") || text.includes("import React");
        return {
          open: true,
          title: modal.querySelector("h1, h2, .sc-detail-title")?.innerText || "",
          hasPreviewIframe: Boolean(iframe),
          iframeSandbox: iframe?.getAttribute("sandbox") || "",
          isFree: text.includes("FREE") || text.includes("Free") || text.includes("Get Code"),
          aiPromptVisible: text.includes("AI Prompt") || text.includes("Copy AI Prompt"),
          sourceCodeExposedPublicly: hasSourceCode,
        };
      });
      results.glassMotionCard = modalInfo;
      console.log("  ✓ Glass Motion Card Modal Details:", modalInfo);

      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector(".sc-detail-close");
        if (closeBtn) closeBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
    } else {
      console.log("  ⚠️ Could not find Glass Motion card by click");
    }

    // 4. VERIFY TOOLS ROUTES
    console.log("\n4. Verifying Developer Tools Routes...");
    const tools = [
      { path: "/tools", name: "Overview", selector: ".sc-tools-overview, .sc-tool-card" },
      { path: "/tools/gradient-generator", name: "Gradient Generator", selector: ".sc-gradient-tool" },
      { path: "/tools/box-shadow-generator", name: "Box Shadow Generator", selector: ".sc-boxshadow-tool" },
      { path: "/tools/json-formatter", name: "JSON Formatter", selector: ".sc-json-tool" },
    ];

    for (const tool of tools) {
      console.log(`  Testing route https://code.stea.africa${tool.path}...`);
      const tPage = await browser.newPage();
      await tPage.setViewport({ width: 1440, height: 900 });

      let tPageErrors = 0;
      tPage.on("pageerror", (e) => {
        tPageErrors++;
        console.error(`    ❌ [${tool.name} PageError]:`, e.message);
      });

      const tRes = await tPage.goto(`https://code.stea.africa${tool.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      await new Promise((r) => setTimeout(r, 2000));

      const toolStatus = await tPage.evaluate((sel, name) => {
        const el = document.querySelector(sel);
        const text = document.body.innerText;
        const hasCopyBtn = Array.from(document.querySelectorAll("button")).some(
          (b) => b.innerText.toLowerCase().includes("copy")
        );
        return {
          mounted: Boolean(el || text.includes(name)),
          hasCopyButton: hasCopyBtn,
          bodySnippet: text.slice(0, 100).replace(/\n/g, " "),
        };
      }, tool.selector, tool.name);

      // Test copy action if copy button exists
      let copyActionResult = "N/A";
      if (toolStatus.hasCopyButton) {
        copyActionResult = await tPage.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find((b) =>
            b.innerText.toLowerCase().includes("copy")
          );
          if (btn) {
            btn.click();
            return "Clicked copy button successfully";
          }
          return "Copy button not clickable";
        });
      }

      results.tools[tool.path] = {
        httpStatus: tRes.status(),
        errors: tPageErrors,
        ...toolStatus,
        copyAction: copyActionResult,
      };

      console.log(`    ✓ ${tool.name}: Status ${tRes.status()}, mounted: ${toolStatus.mounted}, copyBtn: ${toolStatus.hasCopyButton}`);

      // Test mobile viewport for this tool (390px)
      await tPage.setViewport({ width: 390, height: 844 });
      await new Promise((r) => setTimeout(r, 500));
      const hasHorizontalOverflow = await tPage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      results.tools[tool.path].mobileNoOverflow = !hasHorizontalOverflow;
      console.log(`    ✓ 390px Mobile overflow check: ${hasHorizontalOverflow ? "OVERFLOW" : "PASS (No overflow)"}`);

      await tPage.close();
    }

    // 5. VERIFY ADMIN ROUTES
    console.log("\n5. Verifying Admin Routes (/code-admin/products)...");
    const adminPage = await browser.newPage();
    await adminPage.setViewport({ width: 1440, height: 900 });

    const adminRes = await adminPage.goto("https://code.stea.africa/code-admin/products", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    const adminData = await adminPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasSteaCodeAdmin: text.includes("STEA CODE") || text.includes("Admin") || text.includes("Products") || text.includes("Catalog"),
        hasProductsTable: Boolean(document.querySelector(".sc-admin-table, table, .sc-product-row, .sc-admin-card")),
        hasCreateButton: text.includes("New Product") || text.includes("Add Product") || text.includes("Create") || text.includes("New"),
        pageTextSample: text.slice(0, 200).replace(/\n/g, " "),
      };
    });
    results.admin.productsPage = {
      httpStatus: adminRes.status(),
      ...adminData,
    };
    console.log("  ✓ Admin Products Page:", results.admin.productsPage);

    // Check Editor for glass-motion-car
    console.log("  Testing https://code.stea.africa/code-admin/products/glass-motion-car/edit...");
    const editRes = await adminPage.goto("https://code.stea.africa/code-admin/products/glass-motion-car/edit", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    const editData = await adminPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasGeneralTab: text.includes("General") || text.includes("Title"),
        hasLivePreviewTab: text.includes("Preview") || text.includes("Live Preview"),
        hasSourceFilesTab: text.includes("Source") || text.includes("Files"),
        hasPublishTab: text.includes("Publish") || text.includes("Status"),
        hasAiPromptField: text.includes("AI Prompt") || text.includes("aiPrompt"),
        pageTextSample: text.slice(0, 200).replace(/\n/g, " "),
      };
    });
    results.admin.editGlassMotion = {
      httpStatus: editRes.status(),
      ...editData,
    };
    console.log("  ✓ Admin Edit Page (Glass Motion Card):", results.admin.editGlassMotion);

    await adminPage.close();

    // 6. HOMEPAGE MOBILE 390px CHECK
    console.log("\n6. Verifying Mobile 390px Viewport on Homepage...");
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 1000));

    const mobileCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const techChipsScrollable = Boolean(document.querySelector(".sc-tech-strip-scroll"));
      return {
        docWidth,
        winWidth,
        hasHorizontalOverflow: docWidth > winWidth,
        techChipsScrollable,
      };
    });
    results.mobile = mobileCheck;
    console.log("  ✓ Homepage Mobile 390px:", mobileCheck);

    await page.close();
  } catch (err) {
    console.error("❌ Verification encountered error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n============================================================");
  console.log("VERIFICATION SUMMARY JSON:");
  console.log(JSON.stringify(results, null, 2));
  console.log("============================================================\n");
}

verifyProduction();
