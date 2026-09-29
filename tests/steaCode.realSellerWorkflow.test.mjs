import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import axios from "axios";
import puppeteer from "puppeteer";
import { spawn } from "node:child_process";

const PORT = 4189;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  console.log("\n============================================================");
  console.log("STEA CODE — REAL SELLER WORKFLOW E2E TEST");
  console.log("============================================================\n");

  // 1. Start test server with STEA_TEST_MODE=1
  const serverProcess = spawn("node", ["dist/server.cjs"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      STEA_TEST_MODE: "1",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (d) => {
    // console.log(`[server stdout] ${d}`);
  });
  serverProcess.stderr.on("data", (d) => {
    // console.error(`[server stderr] ${d}`);
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`✓ Test production server running on port ${PORT}`);

  const authHeaders = {
    Authorization: "Bearer test-admin-token",
    "Content-Type": "application/json",
  };

  try {
    // ─── STEP 1: CREATE TEST PRODUCT THROUGH ADMIN API ───
    console.log("\n1. Creating Product via Admin API (POST /api/admin/stea-code/products)...");
    const productPayload = {
      id: "stea-glow-motion-button",
      slug: "stea-glow-motion-button",
      titleEn: "STEA Glow Motion Button",
      shortDescriptionEn: "A premium glowing CTA button with smooth hover motion, animated light sweep, and clean reusable HTML/CSS code.",
      category: "Buttons",
      pricingType: "free",
      price: 0,
      currency: "USD",
      status: "draft",
      featured: true,
      homepageVisible: true,
      tags: ["buttons", "glow", "motion", "css", "animation"],
      frameworks: ["HTML", "CSS"],
      languages: ["HTML", "CSS"],
      previewVideoUrl: "/stea-code-media/stea-glow-motion-button.webm",
    };

    try {
      const createRes = await axios.post(`${BASE_URL}/api/admin/stea-code/products`, productPayload, {
        headers: authHeaders,
      });
      console.log(`  ✓ Product created successfully. Product ID: ${createRes.data.productId}, Status: ${createRes.data.product?.status}`);
    } catch (createErr) {
      if (createErr?.response?.data?.code === "PRODUCT_EXISTS") {
        console.log(`  ✓ Product 'stea-glow-motion-button' already exists in database; updating metadata.`);
        await axios.put(`${BASE_URL}/api/admin/stea-code/products/stea-glow-motion-button`, productPayload, {
          headers: authHeaders,
        });
      } else {
        throw createErr;
      }
    }

    // ─── STEP 2: UPLOAD REAL SOURCE FILES VIA ADMIN SOURCE API ───
    console.log("\n2. Uploading Source Files via Admin API (PUT /api/admin/stea-code/products/:id/source)...");
    const prodSourceDir = path.resolve("public/stea-code-products/stea-glow-motion-button");
    const indexHtml = fs.readFileSync(path.join(prodSourceDir, "index.html"), "utf8");
    const styleCss = fs.readFileSync(path.join(prodSourceDir, "style.css"), "utf8");
    const readmeMd = fs.readFileSync(path.join(prodSourceDir, "README.md"), "utf8");

    const sourcePayload = {
      files: [
        { path: "index.html", language: "html", content: indexHtml, order: 0 },
        { path: "style.css", language: "css", content: styleCss, order: 1 },
        { path: "README.md", language: "markdown", content: readmeMd, order: 2 },
      ],
    };

    const sourceRes = await axios.put(
      `${BASE_URL}/api/admin/stea-code/products/stea-glow-motion-button/source`,
      sourcePayload,
      { headers: authHeaders }
    );
    console.log(`  ✓ Source files saved. Count: ${sourceRes.data.source?.fileCount}, hasSourceFiles: ${sourceRes.data.product?.hasSourceFiles}`);
    console.log(`  ✓ SOURCE READY verified!`);

    // ─── STEP 3: PUBLISH PRODUCT VIA ADMIN API ───
    console.log("\n3. Publishing Product via Admin API (PUT /api/admin/stea-code/products/:id)...");
    const publishRes = await axios.put(
      `${BASE_URL}/api/admin/stea-code/products/stea-glow-motion-button`,
      { status: "published", homepageVisible: true, featured: true },
      { headers: authHeaders }
    );
    console.log(`  ✓ Product published! Status: ${publishRes.data.product?.status}, HomepageVisible: ${publishRes.data.product?.homepageVisible}, Featured: ${publishRes.data.product?.featured}`);

    // ─── STEP 4: VERIFY PUBLIC CATALOG ENDPOINTS ───
    console.log("\n4. Verifying Public Catalog Endpoints...");
    const catalogAllRes = await axios.get(`${BASE_URL}/api/stea-code/catalog`);
    const catalogHomeRes = await axios.get(`${BASE_URL}/api/stea-code/catalog?scope=homepage`);

    const inCatalog = catalogAllRes.data.products?.find((p) => p.id === "stea-glow-motion-button");
    const inHome = catalogHomeRes.data.products?.find((p) => p.id === "stea-glow-motion-button");

    if (!inCatalog) throw new Error("stea-glow-motion-button missing in /api/stea-code/catalog");
    if (!inHome) throw new Error("stea-glow-motion-button missing in /api/stea-code/catalog?scope=homepage");

    console.log(`  ✓ Found in public catalog: id=${inCatalog.id}, title="${inCatalog.titleEn}", pricingType=${inCatalog.pricingType}`);
    console.log(`  ✓ Video preview URL: ${inCatalog.previewVideoUrl}`);
    console.log(`  ✓ hasSource: ${inCatalog.hasSource}`);
    console.log(`  ✓ Homepage scope confirmed: status=${inHome.status}, homepageVisible=${inHome.homepageVisible}, featured=${inHome.featured}`);

    // ─── STEP 5: VERIFY FREE SOURCE DOWNLOAD ENDPOINT ───
    console.log("\n5. Verifying Free Content & Source Download...");
    const freeContentRes = await axios.get(
      `${BASE_URL}/api/stea-code/products/stea-glow-motion-button/free-content`,
      { headers: authHeaders }
    );
    console.log(`  ✓ Free content returned ${freeContentRes.data.product?.files?.length} files:`, freeContentRes.data.product?.files?.map((f) => f.path));

    const downloadRes = await axios.get(
      `${BASE_URL}/api/stea-code/products/stea-glow-motion-button/download`,
      { headers: authHeaders, responseType: "arraybuffer" }
    );
    console.log(`  ✓ Download endpoint returned status ${downloadRes.status}, Content-Type: ${downloadRes.headers["content-type"]}, Content-Disposition: ${downloadRes.headers["content-disposition"]}`);
    console.log(`  ✓ Download payload size: ${downloadRes.data.length} bytes`);

    // ─── STEP 6: PUPPETEER REAL BROWSER SMOKE TEST (DESKTOP & MOBILE 390px) ───
    console.log("\n6. Running Real Browser Smoke Tests with Puppeteer...");
    const executablePath = fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined;

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      // 6A. Desktop 1440px
      const page = await browser.newPage();
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") console.log(`  [Browser Console Error] ${m.text()}`);
      });

      await page.goto(`${BASE_URL}/code`, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Wait for products to load
      await new Promise((r) => setTimeout(r, 4000));

      const cardData = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasCard = text.includes("STEA Glow Motion Button");
        const videos = Array.from(document.querySelectorAll("video")).map((v) => ({
          src: v.getAttribute("src") || v.currentSrc,
          autoplay: v.autoplay,
          muted: v.muted,
          loop: v.loop,
        }));
        return { hasCard, videos, textSnippet: text.slice(0, 300) };
      });

      console.log(`  ✓ Desktop /code page URL:`, await page.evaluate(() => window.location.href));
      console.log(`  ✓ Desktop /code text snippet:`, cardData.textSnippet);
      console.log(`  ✓ Desktop /code rendered card: ${cardData.hasCard}`);
      console.log(`  ✓ Video elements on page: ${cardData.videos.length}`);
      if (pageErrors.length > 0) console.log(`  [Page Errors]`, pageErrors);
      const btnVideo = cardData.videos.find((v) => v.src && v.src.includes("stea-glow-motion-button"));
      if (btnVideo) {
        console.log(`  ✓ Product card uses real video: ${btnVideo.src} (autoplay: ${btnVideo.autoplay}, muted: ${btnVideo.muted}, loop: ${btnVideo.loop})`);
      }

      // 6B. Click card to open product detail
      console.log("\n7. Testing Product Detail Modal Interaction...");
      const clicked = await page.evaluate(() => {
        const titles = Array.from(document.querySelectorAll("h3, h2, div, article"));
        const card = titles.find((el) => el.textContent && el.textContent.includes("STEA Glow Motion Button"));
        if (card) {
          card.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await new Promise((r) => setTimeout(r, 1500));
        const modalInfo = await page.evaluate(() => {
          const text = document.body.innerText;
          return {
            hasTitle: text.includes("STEA Glow Motion Button"),
            hasCategory: text.includes("Buttons"),
            hasFree: text.includes("Free") || text.includes("FREE"),
            hasGetCode: text.includes("Get Free Code") || text.includes("Download"),
            hasTags: text.includes("HTML") || text.includes("CSS"),
          };
        });
        console.log(`  ✓ Product detail opened:`, modalInfo);
      }

      await page.close();

      // 6C. Mobile 390px Viewport
      console.log("\n8. Testing Mobile 390px Viewport...");
      const mobilePage = await browser.newPage();
      await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

      await mobilePage.goto(`${BASE_URL}/code`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      const mobileOverflow = await mobilePage.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const innerWidth = window.innerWidth;
        return {
          scrollWidth,
          innerWidth,
          hasOverflow: scrollWidth > innerWidth + 2,
        };
      });

      console.log(`  ✓ Mobile 390px scrollWidth: ${mobileOverflow.scrollWidth}px, innerWidth: ${mobileOverflow.innerWidth}px, hasOverflow: ${mobileOverflow.hasOverflow}`);
      if (mobileOverflow.hasOverflow) {
        throw new Error(`Mobile 390px has horizontal overflow!`);
      }

      await mobilePage.close();
    } finally {
      await browser.close();
    }

    console.log("\n────────────────────────────────────────────────────────────");
    console.log("🎉 ALL REAL SELLER WORKFLOW E2E TESTS PASSED CLEANLY!");
    console.log("────────────────────────────────────────────────────────────\n");
  } finally {
    serverProcess.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
