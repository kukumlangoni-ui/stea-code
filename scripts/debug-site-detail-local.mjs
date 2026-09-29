import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});

const page = await browser.newPage();
page.on("pageerror", err => console.error("PAGE ERROR:", err.message));
page.on("console", msg => console.log("CONSOLE:", msg.text()));

await page.goto("http://localhost:5005/site/internet-canva", { waitUntil: "networkidle2" });
await new Promise(r => setTimeout(r, 2000));
console.log(await page.evaluate(() => document.body.innerHTML.slice(0, 500)));
await browser.close();
