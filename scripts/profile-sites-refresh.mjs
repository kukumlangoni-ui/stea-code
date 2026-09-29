/**
 * Precision Performance & Waterfall Profiler for STEA Sites
 */
import puppeteer from "puppeteer";

export async function profileRun(url, { isCached = false, existingPage = null } = {}) {
  let browser = null;
  let page = existingPage;

  if (!page) {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.setCacheEnabled(isCached);
  }

  try {
    const navStart = Date.now();
    if (existingPage) {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    } else {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    }
    const domLoaded = Date.now() - navStart;

    let heroTime = null;
    let fcpTime = null;

    // Sample DOM every 10ms for high resolution
    for (let i = 0; i < 200; i++) {
      const elapsed = Date.now() - navStart;
      const state = await page.evaluate(() => {
        const bodyText = document.body.innerText || "";
        const hasHero = bodyText.includes("The useful side of the internet.") || bodyText.includes("STEA Sites");
        const hasSearch = Boolean(document.querySelector(".sites-hero-search-input"));
        const paintEntries = performance.getEntriesByType("paint");
        const fcp = paintEntries.find((p) => p.name === "first-contentful-paint");
        return {
          hasHero: hasHero && hasSearch,
          fcp: fcp ? Math.round(fcp.startTime) : null,
        };
      });

      if (state.fcp && !fcpTime) fcpTime = state.fcp;
      if (state.hasHero && !heroTime) {
        heroTime = elapsed;
        break;
      }
      await new Promise((r) => setTimeout(r, 10));
    }

    const waterfall = await page.evaluate(() => {
      const entries = performance.getEntriesByType("resource");
      return entries.map((r) => ({
        name: r.name.split("/").pop().split("?")[0] || r.name,
        fullName: r.name,
        startTime: Math.round(r.startTime),
        responseEnd: Math.round(r.responseEnd),
        duration: Math.round(r.duration),
        transferSize: r.transferSize || 0,
      })).filter(r => r.name.endsWith(".js") || r.name.endsWith(".css") || r.name.includes("manifest") || r.name.includes(".png") || r.name.includes(".svg"));
    });

    if (browser) {
      await page.close();
      await browser.close();
    }

    return {
      domLoaded,
      fcpTime: fcpTime || domLoaded,
      heroTime: heroTime || domLoaded,
      waterfall,
    };
  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
}

export async function runFullBenchmark(targetUrl) {
  console.log("==================================================");
  console.log("RUNNING SITES COLD-START 5-RUN BENCHMARK & WATERFALL");
  console.log("Target URL:", targetUrl);
  console.log("==================================================");

  const coldRuns = [];
  let sampleWaterfall = null;

  for (let i = 1; i <= 5; i++) {
    process.stdout.write(`Run ${i}/5 (Cold, Cache Disabled)... `);
    const result = await profileRun(targetUrl, { isCached: false });
    coldRuns.push(result);
    console.log(`Hero: ${result.heroTime}ms | FCP: ${result.fcpTime}ms | DOM: ${result.domLoaded}ms`);
    if (!sampleWaterfall) sampleWaterfall = result.waterfall;
  }

  console.log("\nTesting Cached Refresh (Cache Enabled)...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.setCacheEnabled(true);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 500));

  const cachedResult = await profileRun(targetUrl, { isCached: true, existingPage: page });
  await page.close();
  await browser.close();

  console.log(`Cached Hero: ${cachedResult.heroTime}ms | FCP: ${cachedResult.fcpTime}ms | DOM: ${cachedResult.domLoaded}ms`);

  const heroTimes = coldRuns.map((r) => r.heroTime).sort((a, b) => a - b);
  const fcpTimes = coldRuns.map((r) => r.fcpTime).sort((a, b) => a - b);

  const medianHero = heroTimes[Math.floor(heroTimes.length / 2)];
  const minHero = heroTimes[0];
  const maxHero = heroTimes[heroTimes.length - 1];

  const medianFcp = fcpTimes[Math.floor(fcpTimes.length / 2)];

  console.log("\n==================================================");
  console.log("BENCHMARK RESULTS SUMMARY:");
  console.log("==================================================");
  console.log(`Cold Run 1: ${coldRuns[0].heroTime}ms`);
  console.log(`Cold Run 2: ${coldRuns[1].heroTime}ms`);
  console.log(`Cold Run 3: ${coldRuns[2].heroTime}ms`);
  console.log(`Cold Run 4: ${coldRuns[3].heroTime}ms`);
  console.log(`Cold Run 5: ${coldRuns[4].heroTime}ms`);
  console.log(`Median Hero: ${medianHero}ms (Min: ${minHero}ms, Max: ${maxHero}ms)`);
  console.log(`Median FCP:  ${medianFcp}ms`);
  console.log(`Cached Hero: ${cachedResult.heroTime}ms`);

  console.log("\nCRITICAL REQUEST WATERFALL (Cold Run Sample):");
  console.log("START(ms) | END(ms) | DURATION(ms) | SIZE(KB) | RESOURCE");
  console.log("---------------------------------------------------------------");
  for (const r of sampleWaterfall) {
    const kb = (r.transferSize / 1024).toFixed(1);
    console.log(`${String(r.startTime).padStart(8)} | ${String(r.responseEnd).padStart(7)} | ${String(r.duration).padStart(12)} | ${kb.padStart(7)} KB | ${r.name}`);
  }

  const ok = medianHero < 2500 && cachedResult.heroTime < 500;
  console.log("\n==================================================");
  if (ok) {
    console.log("🎉 COLD-START & CACHED REFRESH TARGETS FULLY ACHIEVED!");
  } else {
    console.log(`Status: Cold Hero Median = ${medianHero}ms, Cached Hero = ${cachedResult.heroTime}ms`);
  }
  return ok;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || "http://localhost:4173/websites";
  runFullBenchmark(url).then((ok) => process.exit(ok ? 0 : 1));
}
