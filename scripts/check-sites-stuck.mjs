import puppeteer from "puppeteer";

const URL = "https://sites.stea.africa/websites/";

async function test(browser, label, bypassSW) {
  const page = await browser.newPage();

  await page.setViewport({
    width: 1440,
    height: 900,
  });

  await page.setBypassServiceWorker(bypassSW);

  const errors = [];

  page.on("pageerror", e => {
    errors.push(`PAGEERROR: ${e.message}`);
  });

  page.on("console", msg => {
    if (msg.type() === "error") {
      errors.push(`CONSOLE: ${msg.text()}`);
    }
  });

  page.on("requestfailed", req => {
    const url = req.url();
    if (!url.includes("google-analytics") && !url.includes("google.com/g/collect")) {
      errors.push(`FAILED: ${url} :: ${req.failure()?.errorText}`);
    }
  });

  console.log("\n==========================================");
  console.log(label);
  console.log("BYPASS SERVICE WORKER:", bypassSW);
  console.log("==========================================");

  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await new Promise(r => setTimeout(r, 10000));

  const state = await page.evaluate(() => {
    const root = document.querySelector("#root");

    return {
      title: document.title,
      text: document.body?.innerText?.slice(0, 1000) || "",
      rootHTML: root?.innerHTML || "",
      rootLength: root?.innerHTML?.length || 0,
      errorBoundary:
        document.body?.innerText?.includes("Something went wrong") || false,
      hero:
        document.body?.innerText?.includes("The useful side of the internet") || false,
      swController:
        navigator.serviceWorker?.controller?.scriptURL || null,
      scripts: performance
        .getEntriesByType("resource")
        .filter(x => x.name.includes(".js"))
        .map(x => ({
          file: x.name.split("/").pop(),
          duration: Math.round(x.duration),
          bytes: x.transferSize,
        }))
        .slice(0, 30),
    };
  });

  console.log("TITLE:", state.title);
  console.log("HERO:", state.hero);
  console.log("ERROR BOUNDARY:", state.errorBoundary);
  console.log("ROOT LENGTH:", state.rootLength);
  console.log("SERVICE WORKER:", state.swController);

  console.log("\nROOT HTML:");
  console.log(state.rootHTML.slice(0, 1200) || "[EMPTY]");

  console.log("\nJS RESOURCES:");
  console.table(state.scripts);

  console.log("\nERRORS:");
  console.log(errors.length ? errors.join("\n") : "NONE");

  await page.close();

  return state;
}

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});

const normal = await test(browser, "NORMAL PRODUCTION", false);
const bypass = await test(browser, "SERVICE WORKER BYPASSED", true);

console.log("\n==========================================");
console.log("DIAGNOSIS");
console.log("==========================================");

if (!normal.hero && bypass.hero) {
  console.log("🔥 SERVICE WORKER / OLD CACHE IS THE PROBLEM");
} else if (!normal.hero && !bypass.hero) {
  console.log("🔥 APPLICATION / SUSPENSE IS THE PROBLEM");
} else if (normal.hero && bypass.hero) {
  console.log("✅ SITE CURRENTLY RENDERS IN BOTH MODES");
} else {
  console.log("⚠️ MIXED RESULT — inspect output above");
}

await browser.close();
