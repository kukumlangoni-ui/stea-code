/**
 * Comprehensive Browser Acceptance & Search Integrity Test Runner
 */
import puppeteer from "puppeteer";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

function createStaticServer(port = 4173) {
  const distDir = path.resolve(process.cwd(), "dist");
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0];
    if (reqPath.endsWith("/")) reqPath += "index.html";
    let filePath = path.join(distDir, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, "index.html");
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runBrowserTests() {
  const port = 4173;
  const server = await createStaticServer(port);
  console.log(`Local production static server running on http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalFailures = 0;

  async function testRoute(name, routePath, assertions = {}, viewport = { width: 1440, height: 900 }) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("stea_lang", "en");
      localStorage.setItem("stea_lang_explicit", "true");
    });

    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
      console.error(`  [PAGE_ERROR on ${routePath}]:`, err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
        console.error(`  [CONSOLE_ERROR on ${routePath}]:`, msg.text());
      }
    });

    const url = `http://localhost:${port}${routePath}`;
    console.log(`\nTesting ${name} (${viewport.width}x${viewport.height}) -> ${url}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise((r) => setTimeout(r, 1500));

      const bodyText = await page.evaluate(() => document.body.innerText);
      const normalizedBody = bodyText.replace(/\s+/g, " ");

      if (bodyText.includes("Something went wrong")) {
        console.error(`  ❌ FAILED: Found "Something went wrong" ErrorBoundary!`);
        totalFailures++;
      }

      // Assert mustContain
      if (assertions.mustContain) {
        for (const str of assertions.mustContain) {
          if (!bodyText.includes(str) && !normalizedBody.includes(str)) {
            console.error(`  ❌ FAILED: Missing expected text: "${str}"`);
            totalFailures++;
          } else {
            console.log(`  ✓ Contains: "${str}"`);
          }
        }
      }

      // Assert mustNotContain (badges removed)
      if (assertions.mustNotContain) {
        for (const str of assertions.mustNotContain) {
          if (bodyText.includes(str)) {
            console.error(`  ❌ FAILED: Found forbidden text that should have been removed: "${str}"`);
            totalFailures++;
          } else {
            console.log(`  ✓ Forbidden badge absent: "${str}"`);
          }
        }
      }

      // Assert 0 horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      if (overflow.hasOverflow) {
        console.error(`  ❌ FAILED: Horizontal overflow detected! (scrollWidth: ${overflow.scrollWidth}px > innerWidth: ${overflow.innerWidth}px)`);
        totalFailures++;
      } else {
        console.log(`  ✓ Horizontal overflow: 0px (scrollWidth: ${overflow.scrollWidth}px <= innerWidth: ${overflow.innerWidth}px)`);
      }

      // Live search queries test in browser
      if (assertions.searchTests) {
        for (const st of assertions.searchTests) {
          console.log(`  Performing live browser search for "${st.query}"...`);
          const searchInput = await page.$(".sites-hero-search-input");
          if (searchInput) {
            await page.evaluate((el) => {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              nativeInputValueSetter.call(el, "");
              el.dispatchEvent(new Event("input", { bubbles: true }));
            }, searchInput);
            await searchInput.type(st.query);
            await new Promise((r) => setTimeout(r, 600));

            const dropdownResult = await page.evaluate(() => {
              const dropdown = document.querySelector(".sites-search-dropdown");
              if (!dropdown) return null;
              const items = Array.from(dropdown.querySelectorAll(".sites-search-suggestion-item"));
              const first = items[0];
              const name = first?.querySelector(".sites-sugg-name")?.innerText || "";
              const domain = first?.querySelector(".sites-sugg-domain")?.innerText || "";
              const hasImg = Boolean(first?.querySelector("img, svg"));
              const hasLetterOnly = Boolean(first?.querySelector(".sites-brand-icon-letter"));
              return {
                isOpen: true,
                count: items.length,
                topName: name,
                topDomain: domain,
                hasRealIcon: hasImg && !hasLetterOnly,
                allNames: items.map((i) => i.querySelector(".sites-sugg-name")?.innerText),
              };
            });

            if (dropdownResult && dropdownResult.topName.toLowerCase().includes(st.expectedTop.toLowerCase())) {
              console.log(`  ✓ Live search "${st.query}" -> Top: "${dropdownResult.topName}" (${dropdownResult.topDomain}), Real Icon: ${dropdownResult.hasRealIcon ? "YES" : "NO"}`);
            } else {
              console.error(`  ❌ FAILED: Search "${st.query}" expected top "${st.expectedTop}", got: "${dropdownResult?.topName || "NONE"}"`);
              totalFailures++;
            }
          }
        }
      }

      const fatalErrors = pageErrors.concat(consoleErrors.filter((e) => !e.includes("Failed to load resource")));
      if (fatalErrors.length > 0) {
        console.error(`  ❌ FAILED: ${fatalErrors.length} fatal runtime errors occurred.`);
        totalFailures++;
      } else {
        console.log(`  ✓ 0 fatal runtime errors`);
      }
    } catch (e) {
      console.error(`  ❌ FAILED with exception:`, e.message);
      totalFailures++;
    } finally {
      await page.close();
    }
  }

  try {
    // 1. Desktop Viewports
    for (const width of [1280, 1440, 1920]) {
      await testRoute(`Desktop ${width}px`, "/websites", {
        mustContain: ["The useful side of the internet.", "STEA Africa", "STEA Code", "STEA 360", "STEA Daily", "STEA Sites"],
        mustNotContain: ["BUILT BY STEA"],
        searchTests: width === 1440 ? [
          { query: "insta", expectedTop: "Instagram" },
          { query: "instagram.com", expectedTop: "Instagram" },
          { query: "GitHub", expectedTop: "GitHub" },
          { query: "Firebase", expectedTop: "Firebase" },
          { query: "Vercel", expectedTop: "Vercel" },
        ] : undefined,
      }, { width, height: 900 });
    }

    // 2. Mobile Viewports
    for (const width of [320, 360, 375, 390, 430]) {
      await testRoute(`Mobile ${width}px`, "/websites", {
        mustContain: ["The useful side of the internet.", "Sports", "Movies & TV", "STEA Sites"],
        mustNotContain: ["BUILT BY STEA"],
        searchTests: width === 390 ? [
          { query: "insta", expectedTop: "Instagram" },
          { query: "vibe coding", expectedTop: "Bolt.new" },
        ] : undefined,
      }, { width, height: 844 });
    }

    // 3. Subcategory and Hub routes
    await testRoute("Hosting & Domains Desktop", "/websites/developers/hosting-domains", {
      mustContain: ["Vercel", "Netlify", "Cloudflare"],
    }, { width: 1440, height: 900 });

    await testRoute("Vibe Coding Desktop", "/websites/developers/vibe-coding-ai-dev", {
      mustContain: ["Cursor AI", "Lovable AI", "Bolt.new", "v0 by Vercel"],
    }, { width: 1440, height: 900 });

    await testRoute("Databases Mobile (390px)", "/websites/developers/databases", {
      mustContain: ["Firebase", "Supabase", "MongoDB Atlas"],
    }, { width: 390, height: 844 });

  } finally {
    await browser.close();
    server.close();
  }

  if (totalFailures === 0) {
    console.log(`\n🎉 ALL RESPONSIVE, LIVE SEARCH & MOBILE BROWSER TESTS PASSED (0 Horizontal Overflow, 0 ErrorBoundary)!`);
    process.exit(0);
  } else {
    console.error(`\n❌ ${totalFailures} BROWSER TESTS FAILED.`);
    process.exit(1);
  }
}

runBrowserTests().catch((e) => {
  console.error("Browser test runner crashed:", e);
  process.exit(1);
});
