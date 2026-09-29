import puppeteer from "puppeteer";

const URL = "https://sites.stea.africa/websites/";

const browser = await puppeteer.launch({
  headless: false,
  args: ["--no-sandbox"],
});

const page = await browser.newPage();

await page.setViewport({
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
});

const errors = [];

page.on("pageerror", error => {
  const msg = error.stack || error.message;
  errors.push(["PAGEERROR", msg]);
  console.error("\n🔥 PAGEERROR\n", msg);
});

page.on("console", msg => {
  if (["error", "warning"].includes(msg.type())) {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  }
});

page.on("requestfailed", req => {
  console.error(
    `[REQUEST FAILED] ${req.url()} :: ${req.failure()?.errorText}`
  );
});

page.on("response", async res => {
  if (res.status() >= 400) {
    console.error(`[HTTP ${res.status()}] ${res.url()}`);
  }
});

console.log("Opening production...");
await page.goto(URL, {
  waitUntil: "networkidle2",
  timeout: 60000,
});

console.log("Loaded:", page.url());

for (let second = 0; second <= 180; second += 5) {
  await new Promise(resolve => setTimeout(resolve, 5000));

  const state = await page.evaluate(() => ({
    title: document.title,
    body: document.body?.innerText?.slice(0, 800) || "",
    errorBoundary:
      document.body?.innerText?.includes("Something went wrong") || false,
    rootExists: Boolean(document.querySelector("#root")),
    rootLength: document.querySelector("#root")?.innerHTML?.length || 0,
  }));

  console.log(
    `${second + 5}s | errorBoundary=${state.errorBoundary} | root=${state.rootLength}`
  );

  if (state.errorBoundary) {
    console.error("\n🚨 ERROR BOUNDARY APPEARED");
    console.error(state.body);

    await page.screenshot({
      path: "/tmp/stea-sites-delayed-crash.png",
      fullPage: true,
    });

    break;
  }
}

console.log("\n====================================");
console.log("CAPTURED ERRORS");
console.log("====================================");

if (!errors.length) {
  console.log("No pageerror captured.");
} else {
  for (const [type, msg] of errors) {
    console.log(`\n${type}\n${msg}`);
  }
}

console.log("\nKeeping browser open for 30 seconds...");
await new Promise(resolve => setTimeout(resolve, 30000));

await browser.close();
