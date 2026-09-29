import fs from "fs";
import path from "path";
import { WEBSITE_CATEGORIES } from "../src/data/websiteCategories.js";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const ogImage = "https://sites.stea.africa/seo/stea-websites-og-v2.png";
const homeTitle = "STEA Websites — Discover Useful Websites by Category";
const homeDescription = "Explore curated websites for learning, programming, AI tools, jobs, design, books, comics, sports, movies, and more.";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceTag(html, selector, replacement) {
  const [attr, key] = selector;
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `    ${replacement}\n</head>`);
}

function replaceLink(html, rel, href) {
  const pattern = new RegExp(`<link\\s+rel="${rel}"[^>]*>`, "i");
  const replacement = `<link rel="${rel}" href="${escapeHtml(href)}">`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `    ${replacement}\n</head>`);
}

function withMeta(baseHtml, { title, description, url }) {
  let html = baseHtml;
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceTag(html, ["name", "description"], `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, ["property", "og:title"], `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceTag(html, ["property", "og:description"], `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, ["property", "og:image"], `<meta property="og:image" content="${ogImage}" />`);
  html = replaceTag(html, ["property", "og:type"], `<meta property="og:type" content="website" />`);
  html = replaceTag(html, ["property", "og:site_name"], `<meta property="og:site_name" content="STEA Websites" />`);
  html = replaceTag(html, ["property", "og:url"], `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = replaceTag(html, ["name", "twitter:card"], `<meta name="twitter:card" content="summary_large_image" />`);
  html = replaceTag(html, ["name", "twitter:title"], `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceTag(html, ["name", "twitter:description"], `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, ["name", "twitter:image"], `<meta name="twitter:image" content="${ogImage}" />`);
  html = replaceLink(html, "canonical", url);
  return html;
}

function writeRoute(routePath, meta) {
  fs.writeFileSync(path.join(distDir, routePath), withMeta(baseHtml, meta));
}

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html not found. Run this script after vite build.");
}

const baseHtml = fs.readFileSync(indexPath, "utf8");

writeRoute("websites.html", {
  title: homeTitle,
  description: homeDescription,
  url: "https://sites.stea.africa/websites",
});

for (const category of WEBSITE_CATEGORIES) {
  writeRoute(`websites-${category.id}.html`, {
    title: `${category.label} Websites — STEA Websites`,
    description: `Discover useful ${category.label} websites curated by STEA.`,
    url: `https://sites.stea.africa/websites/${category.id}`,
  });
}

console.log("Generated STEA Websites static OG HTML routes.");
