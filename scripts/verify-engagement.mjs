/**
 * Engagement (views/likes) regression test — keeps the like/view flow locked.
 *
 * Modes:
 *   node scripts/verify-engagement.mjs          → API round-trip vs production
 *                                                 (fast, no browser, CI-friendly)
 *   node scripts/verify-engagement.mjs --full   → boots dist/ + /api proxy and
 *                                                 drives the real UI in headless
 *                                                 Chrome through the full flow
 *
 * Exit code 0 = all checks passed. Run `npm run build` first for --full.
 *
 * The API test performs one like→unlike round trip and one view on a single
 * product, so it is net-zero for likes (+1 view per run, by design).
 */

const BASE = process.env.STEA_API_BASE || "https://steacode.com";
const API = `${BASE}/api/stea-code`;
const FULL = process.argv.includes("--full");
// --offline: run the UI flow against deterministic local fixtures instead of
// production. No network required — used when playing safe or in CI.
const OFFLINE = process.argv.includes("--offline");

// Some networks hang on IPv6 connect; Node prefers v6 by default. Prefer v4.
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

let failures = 0;
const ok = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!cond) failures += 1;
};

// Small retry helper — transient connect timeouts / mid-body resets
// (IPv6 races, flaky upstream) happen. Reads the body INSIDE the retry loop.
async function requestRetry(url, options = {}, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, options);
      const buf = Buffer.from(await res.arrayBuffer());
      return { status: res.status, contentType: res.headers.get("content-type") || "application/json", buf };
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

const jfetch = async (url, options) => {
  const r = await requestRetry(url, options);
  return JSON.parse(r.buf.toString("utf8"));
};

// ---------------------------------------------------------------------------
// API round-trip
// ---------------------------------------------------------------------------
async function apiRoundTrip() {
  const res = await jfetch(`${API}/catalog?scope=homepage&limit=100`);
  ok("catalog responds 200", Boolean(res.products), "got payload");
  const data = res;
  const products = data.products || [];
  ok("catalog returns products", products.length > 0, `${products.length} products`);

  // 1. Every counter must be a NUMBER (not string/undefined) — this exact bug
  //    shipped once and made every card show "0 views / 0 likes".
  const nonNumeric = products.filter(
    (p) => !Number.isFinite(p.views) || !Number.isFinite(p.likes)
  );
  ok("all counters numeric", nonNumeric.length === 0,
    nonNumeric.length ? `bad: ${nonNumeric.slice(0, 3).map((p) => p.slug).join(", ")}` : "");

  // 2. The catalog must never look like a ghost town again.
  const withCounts = products.filter((p) => p.views > 0 || p.likes > 0);
  ok("counters populated (not all 0)", withCounts.length >= products.length * 0.9,
    `${withCounts.length}/${products.length} nonzero`);

  // 3. Pick a normal product and do a view/like round trip.
  const product =
    products.find((p) => p.slug && !p.slug.includes("premium-website-hero")) || products[0];
  const slug = product.slug;
  ok("round-trip target chosen", Boolean(slug), slug);

  const detail0 = await jfetch(`${API}/products/${encodeURIComponent(slug)}`);
  const p0 = detail0.product || detail0;
  const views0 = Number(p0.views);
  const likes0 = Number(p0.likes);

  const like = async (action) => {
    const r = await requestRetry(`${API}/products/${encodeURIComponent(slug)}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return JSON.parse(r.buf.toString("utf8"));
  };

  const viewRes = await jfetch(`${API}/products/${encodeURIComponent(slug)}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  ok("POST /view increments", viewRes?.ok !== false && Number(viewRes?.views) === views0 + 1,
    `${views0} → ${viewRes?.views}`);

  const likeRes = await like("like");
  ok("POST /like increments", Number(likeRes?.likes) === likes0 + 1,
    `${likes0} → ${likeRes?.likes}`);

  const unlikeRes = await like("unlike");
  ok("POST /unlike restores", Number(unlikeRes?.likes) === likes0,
    `${likeRes?.likes} → ${unlikeRes?.likes}`);

  const detail1 = await jfetch(`${API}/products/${encodeURIComponent(slug)}`);
  const p1 = detail1.product || detail1;
  ok("persisted after round trip",
    Number(p1.views) === views0 + 1 && Number(p1.likes) === likes0,
    `views ${p1.views} (want ${views0 + 1}), likes ${p1.likes} (want ${likes0})`);
}

// ---------------------------------------------------------------------------
// Full UI flow (headless Chrome against local dist + production API)
// ---------------------------------------------------------------------------
async function fullUiTest() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const http = await import("node:http");
  const { fileURLToPath } = await import("node:url");

  const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(1);
  }

  // Deterministic fixtures for --offline (no network). Counters are deliberately
  // small so formatCount renders plain numbers.
  const FIXTURES = Array.from({ length: 8 }, (_, i) => ({
    id: `fixture-${i}`,
    slug: `fixture-product-${i}`,
    titleEn: `Fixture Product ${i}`,
    titleZh: "",
    shortDescriptionEn: "Deterministic fixture product used by the engagement test.",
    category: "Buttons",
    status: "published",
    homepageVisible: true,
    pricingType: "free",
    price: 0,
    currency: "USD",
    views: 100 + i,
    likes: 10 + i,
  }));
  const mockState = {
    views: new Map(FIXTURES.map((p) => [p.slug, p.views])),
    likes: new Map(FIXTURES.map((p) => [p.slug, p.likes])),
  };
  const json = (res, status, obj) => {
    res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(obj));
  };
  const mockApi = async (req, res, rawBody) => {
    const u = new URL(req.url, "http://x");
    const pathname = u.pathname;
    const m = pathname.match(/^\/api\/stea-code\/products\/([^/]+)(\/.*)?$/);
    if (pathname === "/api/stea-code/catalog") {
      const limit = Number(u.searchParams.get("limit")) || FIXTURES.length;
      const offset = Number(u.searchParams.get("offset")) || 0;
      const products = FIXTURES.slice(offset, offset + limit).map((p) => ({
        ...p, views: mockState.views.get(p.slug), likes: mockState.likes.get(p.slug),
      }));
      return json(res, 200, { products, total: FIXTURES.length, globalTotal: FIXTURES.length,
        offset, limit, nextOffset: offset + products.length, hasMore: offset + products.length < FIXTURES.length });
    }
    if (m) {
      const slug = decodeURIComponent(m[1]);
      const sub = m[2] || "";
      // The app sends either the product id or the slug depending on the call.
      const fixture = FIXTURES.find((p) => p.id === slug || p.slug === slug);
      if (!fixture) return json(res, 404, { error: "not found" });
      const key = fixture.slug;
      if (sub === "/view" && req.method === "POST") {
        const views = (mockState.views.get(key) || 0) + 1;
        mockState.views.set(key, views);
        return json(res, 200, { ok: true, views });
      }
      if (sub === "/like" && req.method === "POST") {
        let action = "like";
        try { action = JSON.parse(rawBody?.toString() || "{}").action || "like"; } catch { /* ignore */ }
        const current = mockState.likes.get(key) || 0;
        const likes = Math.max(0, current + (action === "unlike" ? -1 : 1));
        mockState.likes.set(key, likes);
        return json(res, 200, { ok: true, likes });
      }
      if (sub === "") {
        return json(res, 200, { product: { ...fixture, views: mockState.views.get(key),
          likes: mockState.likes.get(key), hasSource: false } });
      }
      return json(res, 404, { error: "not found" });
    }
    if (pathname === "/api/auth/me") {
      return json(res, 200, { user: null, authenticated: false });
    }
    if (pathname === "/api/blog" || pathname === "/api/stea-code/blog") {
      return json(res, 200, { posts: [], items: [] });
    }
    return json(res, 200, { ok: true });
  };

  // Minimal zero-dependency harness: serve dist, proxy /api to production.
  // Successful GETs are memoized so upstream latency spikes (which trip the
  // app's 8s catalog timeout) can't starve the UI run; POSTs always go live.
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
    ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };
  const getCache = new Map(); // GET url -> { status, contentType, body }
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith("/api/")) {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        if (OFFLINE) return await mockApi(req, res, body);
        if (req.method === "GET" && getCache.has(req.url)) {
          const hit = getCache.get(req.url);
          res.writeHead(hit.status, { "content-type": hit.contentType, "cache-control": "no-store" });
          res.end(hit.body);
          return;
        }
        const upstream = await requestRetry(`${BASE}${req.url}`, {
          method: req.method,
          headers: { accept: "application/json",
            ...(body ? { "content-type": req.headers["content-type"] || "application/json" } : {}) },
          body,
        });
        if (req.method === "GET" && upstream.status === 200) {
          getCache.set(req.url, upstream);
        }
        res.writeHead(upstream.status, { "content-type": upstream.contentType, "cache-control": "no-store" });
        res.end(upstream.buf);
        return;
      }
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p === "/") p = "/index.html";
      let file = path.join(DIST, p);
      if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(DIST, "index.html");
      }
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream",
        "cache-control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;

  const puppeteer = (await import("puppeteer")).default;
  const chromePaths = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const executablePath = chromePaths.find((p) => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox"],
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const page = await browser.newPage();
  if (process.env.ENG_DEBUG) {
    page.on("console", (m) => console.log("[browser]", m.type(), m.text().slice(0, 300)));
    page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
    page.on("requestfailed", (r) => {
      if (r.url().includes("/api/")) console.log("[reqfail]", r.method(), r.url(), r.failure()?.errorText);
    });
  }
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );

  const closeBtn = '.sc-product-modal-panel button[aria-label="Close"]';
  const readCard = (slug) =>
    page.evaluate((s) => {
      const card = document.querySelector(`.sc-code-card[data-slug="${s}"]`);
      if (!card) return null;
      const views = card.querySelector(".sc-code-card__social-stat span:last-child")?.textContent?.trim();
      const likeEl = card.querySelector(".sc-code-card__social-like");
      return {
        views,
        likes: likeEl?.querySelector("span:last-child")?.textContent?.trim(),
        liked: likeEl?.getAttribute("aria-pressed") === "true",
      };
    }, slug);
  const readModal = () =>
    page.evaluate(() => {
      const btn = document.querySelector(".sc-detail-like-btn");
      return { liked: btn?.getAttribute("aria-pressed") === "true", likeBtnPresent: Boolean(btn) };
    });

  try {
    // Pick a normal product, then make sure it is on the grid.
    const slug = OFFLINE
      ? FIXTURES[1].slug
      : (await jfetch(`${API}/catalog?scope=homepage&limit=100`)).products
          .find((p) => p.slug && !p.slug.includes("premium-website-hero")).slug;

    // 0) Fresh load: counters must be real WITHOUT any click (regression guard
    //    for the "homepage shows 0 until you open a card" bug).
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".sc-code-card", { timeout: 60000 });
    await sleep(4000); // let the SWR revalidate land
    const card0 = await readCard(slug);
    ok("card renders with real counters (no 0/0 ghost town)",
      card0 && Number(card0.views) > 0 && Number(card0.likes) > 0,
      card0 ? `views=${card0.views} likes=${card0.likes}` : "card missing");

    // 1) Like on the card.
    const before = Number(card0.likes);
    await page.evaluate((s) => {
      const el = document.querySelector(`.sc-code-card[data-slug="${s}"] .sc-code-card__social-like`);
      el?.scrollIntoView({ block: "center" });
    }, slug);
    await sleep(300);
    await page.click(`.sc-code-card[data-slug="${slug}"] .sc-code-card__social-like`);
    if (process.env.ENG_DEBUG) {
      const dbg = await page.evaluate((s) => {
        const el = document.querySelector(`.sc-code-card[data-slug="${s}"] .sc-code-card__social-like`);
        const r = el.getBoundingClientRect();
        const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          pressed: el.getAttribute("aria-pressed"),
          cls: el.className,
          topEl: at ? `${at.tagName}.${String(at.className).slice(0, 60)}` : null,
          isSame: at === el || el.contains(at),
          pe: getComputedStyle(el).pointerEvents,
          html: el.outerHTML.slice(0, 160),
        };
      }, slug);
      console.log("[dbg-like]", JSON.stringify(dbg));
    }
    await sleep(1800);
    const card1 = await readCard(slug);
    ok("card like increments instantly",
      Number(card1.likes) === before + 1 && card1.liked,
      `${before} → ${card1.likes}, liked=${card1.liked}`);

    // 2) Open the modal — must show the SAME number and red heart.
    await page.evaluate((s) => {
      document.querySelector(`.sc-code-card[data-slug="${s}"] .sc-code-card__preview-wrap`)?.click();
    }, slug);
    await page.waitForSelector(".sc-detail-like-btn", { timeout: 15000 });
    await sleep(1500); // view recording + detail hydration settle into the store
    const modal1 = await readModal();
    const cardBehind = await readCard(slug);
    ok("modal opens liked with matching state",
      modal1.liked && Number(cardBehind.likes) === Number(card1.likes),
      `card=${cardBehind.likes}/${cardBehind.liked ? "red" : "gray"}`);

    // 3) Unlike inside the modal.
    await page.evaluate(() => document.querySelector(".sc-detail-like-btn")?.click());
    await sleep(1800);
    const modal2 = await readModal();
    const cardBehind2 = await readCard(slug);
    ok("modal unlike decrements + syncs card",
      !modal2.liked && Number(cardBehind2.likes) === before && !cardBehind2.liked,
      `card=${cardBehind2.likes}, liked=${cardBehind2.liked}`);

    // 4) Close the modal.
    await page.evaluate((sel) => document.querySelector(sel)?.click(), closeBtn);
    await sleep(1000);

    // 5) Reload — unliked state and count must survive.
    await sleep(2500); // let in-flight like POST + preview fetches settle
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".sc-code-card", { timeout: 60000 });
    await sleep(3000);
    const cardAfterReload = await readCard(slug);
    ok("reload keeps count and unliked heart",
      Number(cardAfterReload.likes) === before && !cardAfterReload.liked,
      `likes=${cardAfterReload.likes} (want ${before}), liked=${cardAfterReload.liked}`);

    // 6) Stale-cache recovery: poison localStorage with 0-counters, reload,
    //    and the background revalidate must fix the grid without clicks.
    await page.evaluate(() => {
      const KEY = "stea_code_catalog_v2_homepage:100:0::components:";
      const stale = {
        timestamp: Date.now(),
        data: { products: [], total: 0, globalTotal: 0, offset: 0, limit: 100,
          nextOffset: 0, hasMore: false },
      };
      localStorage.setItem(KEY, JSON.stringify(stale));
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".sc-code-card", { timeout: 60000 });
    await sleep(4000);
    const cardRecovered = await readCard(slug);
    ok("grid self-corrects from stale/empty cache without clicks",
      cardRecovered && Number(cardRecovered.views) > 0 && Number(cardRecovered.likes) > 0,
      cardRecovered ? `views=${cardRecovered.views} likes=${cardRecovered.likes}` : "card missing");
  } finally {
    await browser.close();
    server.close();
  }
}

const MODE = OFFLINE ? "offline UI" : FULL ? "full UI" : "API";
console.log(`\n=== Engagement verification (${MODE} mode, ${OFFLINE ? "local fixtures" : BASE}) ===\n`);
if (!OFFLINE) {
  try {
    await apiRoundTrip();
  } catch (err) {
    ok("API round-trip reachable", false, err?.cause?.code || err?.message || String(err));
  }
}
if (FULL || OFFLINE) {
  try {
    await fullUiTest();
  } catch (err) {
    ok("full UI flow", false, err?.message?.split("\n")[0] || String(err));
  }
}
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
