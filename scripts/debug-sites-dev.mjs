import puppeteer from "puppeteer";

const ports = [3000, 5173, 5174, 4173, 8080];
const hosts = ["sites.localhost", "localhost", "127.0.0.1"];

async function findWorkingUrl() {
  for (const port of ports) {
    for (const host of hosts) {
      const url = `http://${host}:${port}/websites/`;

      try {
        const response = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(1500),
        });

        if (response.ok) {
          console.log(`FOUND DEV URL: ${url}`);
          return url;
        }
      } catch {}
    }
  }

  return null;
}

const url = await findWorkingUrl();

if (!url) {
  console.error("\n❌ Could not find the STEA dev server.");
  console.error("Run this separately:");
  console.error('lsof -nP -iTCP -sTCP:LISTEN | grep -E "node|tsx|vite"');
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});

const page = await browser.newPage();

page.on("console", msg => {
  console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
});

page.on("pageerror", error => {
  console.error("\n🔥 PAGE ERROR");
  console.error(error.stack || error.message);
});

page.on("requestfailed", request => {
  console.error(
    `[REQUEST FAILED] ${request.url()} :: ${request.failure()?.errorText}`
  );
});

const response = await page.goto(url, {
  waitUntil: "networkidle2",
  timeout: 30000,
});

console.log("\n========================================");
console.log("HTTP STATUS:", response?.status());
console.log("FINAL URL:", page.url());
console.log("TITLE:", await page.title());

const diagnostic = await page.evaluate(() => ({
  text: document.body?.innerText?.slice(0, 1500) || "",
  htmlLength: document.documentElement?.outerHTML?.length || 0,
  bodyChildren: document.body?.children?.length || 0,
  rootHTML: document.querySelector("#root")?.innerHTML?.slice(0, 1000) || "",
  bg: getComputedStyle(document.body).backgroundColor,
}));

console.log("\n========================================");
console.log("BODY TEXT");
console.log("========================================");
console.log(diagnostic.text || "[EMPTY BODY TEXT]");

console.log("\n========================================");
console.log("ROOT HTML");
console.log("========================================");
console.log(diagnostic.rootHTML || "[EMPTY #root]");

console.log("\nHTML LENGTH:", diagnostic.htmlLength);
console.log("BODY CHILDREN:", diagnostic.bodyChildren);
console.log("BODY BG:", diagnostic.bg);

await page.screenshot({
  path: "/tmp/stea-sites-dev-debug.png",
  fullPage: true,
});

console.log("\nScreenshot: /tmp/stea-sites-dev-debug.png");

await browser.close();
