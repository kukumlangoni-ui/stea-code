/**
 * Bulk-submit every URL in sitemap.xml to IndexNow (Bing/Yandex + partners).
 *
 * Usage:
 *   node scripts/submit-to-indexnow.mjs
 *
 * Fetches the live sitemap first; if the network is unavailable it falls back
 * to the local `public/sitemap.xml`. Submits up to 10,000 URLs in one bulk
 * request (IndexNow's per-request cap).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  pingIndexNow,
  INDEXNOW_ORIGIN,
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
} from "../src/utils/indexNow.js";

const SITEMAP_URL = `${INDEXNOW_ORIGIN}/sitemap.xml`;
const LOCAL_SITEMAP = path.join(process.cwd(), "public", "sitemap.xml");
const MAX_URLS = 10000;

async function fetchSitemapXml() {
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { "User-Agent": "steacode-indexnow-submitter/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`⚠ Live sitemap fetch failed (${err.message}); falling back to local public/sitemap.xml`);
    return readFile(LOCAL_SITEMAP, "utf8");
  }
}

function extractLocs(xml) {
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  return [...new Set(locs)].filter(Boolean);
}

async function main() {
  const xml = await fetchSitemapXml();
  const allUrls = extractLocs(xml);
  const urls = allUrls.slice(0, MAX_URLS);

  console.log(`🔎 Sitemap: ${SITEMAP_URL}`);
  console.log(`🔎 Unique URLs found: ${allUrls.length} (submitting ${urls.length}, cap ${MAX_URLS})`);
  console.log(`🔑 Key: ${INDEXNOW_KEY}`);
  console.log(`📡 Endpoint: ${INDEXNOW_ENDPOINT}`);

  const summary = await pingIndexNow(urls);

  for (const result of summary.results) {
    console.log(
      result.ok
        ? `✅ IndexNow accepted ${result.accepted} URL(s) — HTTP ${result.status}`
        : `❌ IndexNow rejected ${result.accepted} URL(s) — HTTP ${result.status}: ${result.message}`
    );
  }

  if (!summary.ok) {
    console.error("\n❌ Submission failed. Check the key file is reachable at the keyLocation and that the host matches.");
    process.exit(1);
  }

  console.log(`\n✅ Done. ${summary.submitted} URL(s) submitted to IndexNow. Bing will re-crawl on its own schedule.`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
