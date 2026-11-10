/**
 * IndexNow submission helper.
 *
 * IndexNow lets us proactively notify Bing/Yandex (and other participating
 * engines) that pages were published or updated, instead of waiting for the
 * next crawl. The ownership key lives in `/public/<KEY>.txt` and is served at
 * `https://steacode.com/<KEY>.txt`; the validator fetches it to confirm the
 * key belongs to this host.
 *
 * Docs: https://www.indexnow.org/documentation
 */

export const INDEXNOW_KEY = "8c027b63cc7247afa01a08d2c86eb0db";
export const INDEXNOW_HOST = "steacode.com";
export const INDEXNOW_ORIGIN = `https://${INDEXNOW_HOST}`;
export const INDEXNOW_KEY_LOCATION = `${INDEXNOW_ORIGIN}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow accepts up to 10,000 URLs per request. */
const MAX_URLS_PER_REQUEST = 10000;

/**
 * Normalize an entry into an absolute https URL on our host.
 * Accepts full URLs, protocol-relative URLs, or root-relative slugs.
 * Returns null for anything outside `steacode.com` (IndexNow rejects mixed hosts).
 */
function normalizeUrl(input) {
  if (!input || typeof input !== "string") return null;
  let value = input.trim();
  if (!value) return null;

  // Root-relative slug → prefix the site origin.
  if (value.startsWith("/")) {
    value = `${INDEXNOW_ORIGIN}${value}`;
  }
  // Protocol-relative URL → https.
  if (value.startsWith("//")) {
    value = `https:${value}`;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  // Treat www.steacode.com as the apex host.
  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== INDEXNOW_HOST) return null;

  parsed.protocol = "https:";
  parsed.hostname = INDEXNOW_HOST;
  parsed.port = "";
  return parsed.toString();
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

/**
 * Send one IndexNow POST for a batch of URLs.
 *
 * @param {string[]} urls - Absolute URLs or root-relative slugs to submit.
 * @param {object} [options]
 * @param {string} [options.endpoint] - Override the IndexNow endpoint (e.g. a
 *   Bing-local endpoint).
 * @returns {Promise<{ok:boolean, status:number|null, accepted:number, message:string}>}
 */
async function postBatch(urls, options = {}) {
  const endpoint = options.endpoint || INDEXNOW_ENDPOINT;
  const urlList = urls.filter(Boolean);

  if (!urlList.length) {
    return { ok: false, status: null, accepted: 0, message: "No valid URLs to submit." };
  }

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  };

  if (typeof fetch !== "function") {
    return { ok: false, status: null, accepted: 0, message: "fetch is unavailable in this environment." };
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { ok: false, status: null, accepted: 0, message: `Network error: ${err?.message || err}` };
  }

  const bodyText = await response.text().catch(() => "");
  // 200 = URLs accepted; 202 = accepted, still processing.
  const ok = response.status === 200 || response.status === 202;
  return {
    ok,
    status: response.status,
    accepted: urlList.length,
    message: bodyText || response.statusText || "",
  };
}

/**
 * Submit a list of URLs to IndexNow. Splits into 10k-URL batches automatically.
 *
 * @param {string[]} urls - Product/blog/page URLs (absolute or root-relative).
 * @param {object} [options] - Passed through to `postBatch`.
 * @returns {Promise<{ok:boolean, submitted:number, results:Array}>}
 */
export async function pingIndexNow(urls, options = {}) {
  const normalized = [...new Set((urls || []).map(normalizeUrl).filter(Boolean))];

  if (!normalized.length) {
    return { ok: false, submitted: 0, results: [{ ok: false, status: null, accepted: 0, message: "No valid URLs under this host." }] };
  }

  const batches = chunk(normalized, MAX_URLS_PER_REQUEST);
  const results = [];
  for (const batch of batches) {
    // eslint-disable-next-line no-await-in-loop
    const result = await postBatch(batch, options);
    results.push(result);
  }

  return {
    ok: results.every((r) => r.ok),
    submitted: normalized.length,
    results,
  };
}

/** Convenience: ping a single product page by slug or full URL. */
export function pingProduct(slugOrUrl) {
  const path = slugOrUrl && slugOrUrl.startsWith("/") ? slugOrUrl : `/products/${slugOrUrl}`;
  return pingIndexNow([path]);
}

/** Convenience: ping a single blog post page by slug or full URL. */
export function pingBlogPost(slugOrUrl) {
  const path = slugOrUrl && slugOrUrl.startsWith("/") ? slugOrUrl : `/blog/${slugOrUrl}`;
  return pingIndexNow([path]);
}
