/**
 * Cloudflare Pages Function — pre-renders SEO tags for /products/:slug.
 *
 * The React app is client-side rendered, so Googlebot would otherwise need to
 * execute JS before it can see <title>, <meta>, canonical, or JSON-LD. This
 * Function intercepts product page requests, fetches the product from the
 * existing Worker API, and injects everything into the static index.html
 * shell at the edge — first byte already contains the final SEO tags.
 *
 * Invoked only for /products/* (see public/_routes.json). React still hydrates
 * the same shell afterwards, so the SPA is unaffected.
 */

const SITE_ORIGIN = "https://steacode.com";
const SITE_NAME = "STEA Code";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg`;
const DESCRIPTION_LIMIT = 160;
const TITLE_LIMIT = 60;

function truncate(text, limit) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= limit) return value;
  return value.slice(0, limit - 1).replace(/[\s,;:.!?—-]*$/, "") + "…";
}

function absoluteUrl(value, origin) {
  if (!value) return null;
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
}

class SetContentAttribute {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    if (this.value) element.setAttribute("content", this.value);
  }
}

class SetHrefAttribute {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    if (this.value) element.setAttribute("href", this.value);
  }
}

class SetTitleText {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    element.setInnerContent(this.value);
  }
}

class AppendJsonLd {
  constructor(jsonLd) {
    // Escape "<" so the payload can never break out of the <script> tag.
    this.json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  }
  element(element) {
    element.append(`<script type="application/ld+json">${this.json}</script>`, { html: true });
  }
}

/**
 * Fetch the product from the existing Worker API (same origin → hits the
 * steacode.com/api/* route). Cached at the edge for 5 minutes.
 */
async function fetchProduct(request, slug) {
  try {
    const apiUrl = new URL(`/api/stea-code/products/${encodeURIComponent(slug)}`, request.url);
    const res = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.product || null;
  } catch {
    return null;
  }
}

function buildSeoPayload(product, slug) {
  const name =
    String(product.titleEn || product.title || product.titleZh || "").trim() ||
    "Premium web component";
  const title = truncate(`${name} — ${SITE_NAME}`, TITLE_LIMIT);
  const description = truncate(
    product.shortDescriptionEn ||
      product.description ||
      product.shortDescriptionZh ||
      product.descriptionZh ||
      `${name} — a premium, copy-paste web component from ${SITE_NAME}.`,
    DESCRIPTION_LIMIT
  );
  const productSlug = String(product.slug || slug).trim();
  const canonical = `${SITE_ORIGIN}/products/${encodeURIComponent(productSlug)}`;
  const image = absoluteUrl(product.posterImageUrl, SITE_ORIGIN) || DEFAULT_OG_IMAGE;

  const isFree = product.pricingType === "free";
  const price = isFree ? "0" : Number(product.price || 0).toFixed(2);
  const offers = {
    "@type": "Offer",
    url: canonical,
    priceCurrency: product.currency || "USD",
    price,
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: SITE_NAME },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name,
        description,
        image: [image],
        category: product.category || "Web Components",
        brand: { "@type": "Brand", name: SITE_NAME },
        offers,
      },
      {
        "@type": "SoftwareApplication",
        name,
        description,
        operatingSystem: "Web",
        applicationCategory: "DeveloperApplication",
        offers,
      },
    ],
  };

  return { title, description, canonical, image, jsonLd };
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const slug = String(params?.slug || "").trim();

  // 1. Load the static SPA shell.
  // Request the root path, NOT /index.html: Cloudflare Pages issues a 308
  // redirect from /index.html to /, and env.ASSETS.fetch does not follow that
  // redirect. Fetching /index.html therefore returns the 308 itself; handing
  // that response back to the browser bounced every /products/:slug deep link
  // straight to the homepage (soft-404 / unindexable product pages).
  const shellUrl = new URL("/", request.url);
  let assetResponse = await env.ASSETS.fetch(new Request(shellUrl.toString(), request));

  // Defensive: if the asset fetch still returns a same-origin redirect, follow
  // it once to the real HTML body instead of returning the redirect to the browser.
  if (
    assetResponse.status >= 300 &&
    assetResponse.status < 400 &&
    assetResponse.headers.get("location")
  ) {
    const redirectUrl = new URL(assetResponse.headers.get("location"), request.url);
    assetResponse = await env.ASSETS.fetch(new Request(redirectUrl.toString(), request));
  }

  if (!assetResponse.ok || !slug) return assetResponse;

  // 2. Resolve the product. Unknown slug → plain shell (React renders the 404).
  const product = await fetchProduct(request, slug);
  if (!product) return assetResponse;

  // 3. Inject SEO tags into the shell.
  const seo = buildSeoPayload(product, slug);

  const transformed = new HTMLRewriter()
    .on("title", new SetTitleText(seo.title))
    .on('meta[name="description"]', new SetContentAttribute(seo.description))
    .on('link[rel="canonical"]', new SetHrefAttribute(seo.canonical))
    .on('meta[property="og:title"]', new SetContentAttribute(seo.title))
    .on('meta[property="og:description"]', new SetContentAttribute(seo.description))
    .on('meta[property="og:url"]', new SetContentAttribute(seo.canonical))
    .on('meta[property="og:image"]', new SetContentAttribute(seo.image))
    .on('meta[property="og:type"]', new SetContentAttribute("product"))
    .on('meta[name="twitter:title"]', new SetContentAttribute(seo.title))
    .on('meta[property="twitter:title"]', new SetContentAttribute(seo.title))
    .on('meta[name="twitter:description"]', new SetContentAttribute(seo.description))
    .on('meta[property="twitter:description"]', new SetContentAttribute(seo.description))
    .on('meta[name="twitter:url"]', new SetContentAttribute(seo.canonical))
    .on('meta[property="twitter:url"]', new SetContentAttribute(seo.canonical))
    .on('meta[name="twitter:image"]', new SetContentAttribute(seo.image))
    .on('meta[property="twitter:image"]', new SetContentAttribute(seo.image))
    .on("head", new AppendJsonLd(seo.jsonLd))
    .transform(assetResponse);

  const headers = new Headers(transformed.headers);
  headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return new Response(transformed.body, {
    status: transformed.status,
    statusText: transformed.statusText,
    headers,
  });
}
