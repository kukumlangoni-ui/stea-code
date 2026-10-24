const fs = require('fs');

async function generateSitemap() {
  try {
    console.log("Fetching products from API...");
    
    // Fetch products from your live API
    const res = await fetch("https://steacode.com/api/stea-code/catalog?limit=1000"); 
    const data = await res.json();
    const products = data.products || [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Add Homepage
    xml += `  <url>\n    <loc>https://steacode.com/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // 2. Add all Products
    products.forEach((product) => {
      if (product.slug) {
        xml += `  <url>\n`;
        xml += `    <loc>https://steacode.com/products/${product.slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });

    xml += `</urlset>`;

    fs.writeFileSync('public/sitemap.xml', xml);
    console.log(`✅ Sitemap generated successfully with ${products.length + 1} URLs!`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error.message);
  }
}

generateSitemap();
