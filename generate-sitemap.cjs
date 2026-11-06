const fs = require('fs');

const SITE = 'https://steacode.com';
// Overridable so the fallback path can be exercised locally:
//   SITEMAP_CATALOG_URL=https://127.0.0.1:9/x node generate-sitemap.cjs
const CATALOG_URL = process.env.SITEMAP_CATALOG_URL || `${SITE}/api/stea-code/catalog?limit=1000`;
const TIMEOUT_MS = 30000;

function writeSitemap(xml) {
  fs.writeFileSync('public/sitemap.xml', xml);
}

/**
 * Minimal, always-valid sitemap: the homepage only.
 * Used when the catalog API is unreachable (e.g. a build running before
 * the Worker is deployed, or a CI runner behind a restrictive proxy).
 */
function fallbackSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url>\n    <loc>${SITE}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `</urlset>`;
  return xml;
}

async function fetchProducts() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CATALOG_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } finally {
    clearTimeout(timer);
  }
}

async function generateSitemap() {
  let products = [];

  try {
    console.log('Fetching products from API...');
    products = await fetchProducts();
  } catch (error) {
    // Never break the build: an unreachable API is an expected condition
    // during early/offline builds, not a fatal error.
    console.warn(`⚠️  Sitemap fetch failed (${error.message}), using fallback (homepage only).`);
    writeSitemap(fallbackSitemap());
    return;
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url>\n    <loc>${SITE}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  products.forEach((product) => {
    if (!product || !product.slug) return;
    xml += `  <url>\n`;
    xml += `    <loc>${SITE}/products/${product.slug}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  writeSitemap(xml);
  console.log(`✅ Sitemap generated successfully with ${products.length + 1} URLs!`);
}

generateSitemap();
