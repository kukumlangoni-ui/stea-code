/**
 * Performance Baseline Measurement Script
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

async function measureViewport(browser, port, name, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  const jsRequests = [];
  const failedRequests = [];
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  page.on("requestfailed", (req) => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.endsWith(".js") || url.includes(".js?")) {
      try {
        const buffer = await res.buffer();
        jsRequests.push({
          url: path.basename(url.split("?")[0]),
          size: buffer.length,
        });
      } catch {
        jsRequests.push({ url: path.basename(url.split("?")[0]), size: 0 });
      }
    }
  });

  const startTime = Date.now();
  await page.goto(`http://localhost:${port}/websites`, { waitUntil: "load", timeout: 30000 });
  const loadTime = Date.now() - startTime;

  // Let client hydrate and run idle tasks
  await new Promise((r) => setTimeout(r, 1500));

  const perfMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0;

    return {
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      loadEvent: nav ? nav.loadEventEnd - nav.startTime : 0,
      fcp,
    };
  });

  const totalJsBytes = jsRequests.reduce((sum, r) => sum + r.size, 0);
  const largestChunk = jsRequests.reduce((max, r) => (r.size > max.size ? r : max), { url: "none", size: 0 });

  console.log(`\n--- ${name} (${viewport.width}x${viewport.height}) ---`);
  console.log(`DOMContentLoaded:       ${perfMetrics.domContentLoaded.toFixed(1)} ms`);
  console.log(`Load Event:             ${perfMetrics.loadEvent.toFixed(1)} ms`);
  console.log(`FCP:                    ${perfMetrics.fcp.toFixed(1)} ms`);
  console.log(`Total JS Requests:      ${jsRequests.length} chunks`);
  console.log(`Total JS Transferred:   ${(totalJsBytes / 1024).toFixed(1)} kB (${(totalJsBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Largest Chunk:          ${largestChunk.url} (${(largestChunk.size / 1024).toFixed(1)} kB)`);
  console.log(`Page Errors:            ${pageErrors.length}`);
  console.log(`Console Errors:         ${consoleErrors.length}`);
  console.log(`Failed Requests:        ${failedRequests.length}`);

  await page.close();

  return {
    name,
    domContentLoaded: perfMetrics.domContentLoaded,
    loadEvent: perfMetrics.loadEvent,
    fcp: perfMetrics.fcp,
    jsChunks: jsRequests.length,
    totalJsBytes,
    largestChunk,
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
    failedRequests: failedRequests.length,
  };
}

async function run() {
  const port = 4174;
  const server = await createStaticServer(port);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    console.log("==================================================");
    console.log("MEASURING STEA SITES CURRENT PRODUCTION PERFORMANCE");
    console.log("==================================================");

    const desktop = await measureViewport(browser, port, "Desktop Baseline", { width: 1440, height: 900 });
    const mobile = await measureViewport(browser, port, "Mobile Baseline", { width: 390, height: 844, isMobile: true });

    fs.writeFileSync(
      ".stea-release/sites-launch-20260902-132300/baseline-metrics.json",
      JSON.stringify({ desktop, mobile, timestamp: new Date().toISOString() }, null, 2)
    );
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
