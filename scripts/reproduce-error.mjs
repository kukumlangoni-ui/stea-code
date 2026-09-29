import puppeteer from "puppeteer";

async function inspectUrl(url, expectedTexts = []) {
  console.log(`\n========================================`);
  console.log(`Inspecting URL: ${url}`);
  console.log(`========================================`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  const page = await browser.newPage();
  
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
    console.error(`  [PAGE_ERROR]:`, err.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.error(`  [CONSOLE_ERROR]:`, msg.text());
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2500)); // allow React to mount and hydrate
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasErrorBoundary = bodyText.includes("Something went wrong");
    
    console.log(`  ErrorBoundary displayed: ${hasErrorBoundary ? "YES (FAILED)" : "NO (PASSED)"}`);
    
    for (const text of expectedTexts) {
      const found = bodyText.includes(text);
      console.log(`  Contains "${text}": ${found ? "YES" : "NO (MISSING)"}`);
      if (!found) {
        throw new Error(`Missing expected text: "${text}"`);
      }
    }
    
    const fatalErrors = pageErrors.concat(consoleErrors.filter((e) => !e.includes("Failed to load resource")));
    if (hasErrorBoundary || fatalErrors.length > 0) {
      throw new Error(`Fatal runtime error on ${url}`);
    }
    
    console.log(`  ✓ Route render PASSED!`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const base = "https://swahilitecheliteacademy--sites-runtime-fix-xofw1jr1.web.app";
  
  await inspectUrl(`${base}/websites/`, [
    "The useful side of the internet.",
    "Browse by Category",
    "Developers Resources"
  ]);
  
  await inspectUrl(`${base}/websites/developers`, [
    "Developers Resources",
    "All essential resources for developers",
    "Vibe Coding & AI Dev",
    "Hosting & Domains"
  ]);
  
  await inspectUrl(`${base}/websites/developers/hosting-domains`, [
    "Vercel",
    "Netlify",
    "Cloudflare"
  ]);
  
  await inspectUrl(`${base}/websites/developers/vibe-coding-ai-dev`, [
    "Cursor AI",
    "Lovable AI",
    "Bolt.new",
    "v0 by Vercel",
    "Opal",
    "Codehype.in"
  ]);
  
  await inspectUrl(`${base}/websites/developers/databases`, [
    "Firebase",
    "Supabase",
    "MongoDB Atlas"
  ]);
  
  console.log(`\n🎉 ALL LIVE PREVIEW BROWSER TESTS PASSED!`);
}

main().catch((err) => {
  console.error("Browser validation failed:", err);
  process.exit(1);
});
