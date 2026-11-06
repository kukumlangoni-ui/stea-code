import { useEffect } from "react";
import { steaCodeGraph } from "../utils/steaCodeOrgSchema.js";

const DEFAULT_TITLE = "SteaCode — Premium Code Components & UI Kits";
const DEFAULT_DESCRIPTION = "STEA Africa is a digital ecosystem for education, AI tools, curated websites, creators, jobs, and digital services across Africa.";
const DEFAULT_IMAGE = "https://stea.africa/seo/stea-og.jpg";

function upsertMeta(selectorAttr, key, content) {
  if (!content) return;
  const selector = `meta[${selectorAttr}="${key}"]`;
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(selectorAttr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
  // Never leave two meta tags with the same key in <head> (Bing: "More than
  // one Meta Description tag") — drop any duplicates beyond the first.
  document.head.querySelectorAll(selector).forEach((el, i) => {
    if (i > 0) el.remove();
  });
}

function upsertLink(rel, href) {
  if (!href) return;
  const selector = `link[rel="${rel}"]`;
  let link = document.head.querySelector(selector);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  // Same dedupe rule for <link rel="canonical"> etc.
  document.head.querySelectorAll(selector).forEach((el, i) => {
    if (i > 0) el.remove();
  });
}

function toAbsoluteUrl(value, base = "https://stea.africa") {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function upsertJsonLd(id, data) {
  if (!data) return;
  let el = document.head.querySelector(`#${id}`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  const el = document.head.querySelector(`#${id}`);
  if (el) el.remove();
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  canonical,
  canonicalUrl,
  ogImage,
  image,
  ogUrl,
  robots,
  noIndex = false,
  type = "website",
  siteName = "STEA Africa",
  structuredData,
}) {
  useEffect(() => {
    const finalTitle = title || DEFAULT_TITLE;
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const finalCanonical = toAbsoluteUrl(canonical || canonicalUrl || window.location.href);
    const finalImage = toAbsoluteUrl(ogImage || image || DEFAULT_IMAGE, finalCanonical || "https://stea.africa");
    const finalRobots = robots || (noIndex ? "noindex,nofollow" : "index,follow");
    const keywordText = Array.isArray(keywords) ? keywords.filter(Boolean).join(", ") : keywords;

    // Exactly one <title> in <head> (Bing: "More than one title tag").
    document.head.querySelectorAll("title").forEach((el, i) => {
      if (i > 0) el.remove();
    });
    document.title = finalTitle;
    upsertMeta("name", "description", finalDescription);
    upsertMeta("name", "robots", finalRobots);
    upsertMeta("name", "keywords", keywordText);

    upsertLink("canonical", finalCanonical);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", siteName);
    upsertMeta("property", "og:title", finalTitle);
    upsertMeta("property", "og:description", finalDescription);
    upsertMeta("property", "og:image", finalImage);
    upsertMeta("property", "og:url", toAbsoluteUrl(ogUrl || finalCanonical));

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", finalTitle);
    upsertMeta("name", "twitter:description", finalDescription);
    upsertMeta("name", "twitter:image", finalImage);

    // 1. Always inject SteaCode's Organization + founder Person schema — this
    //    is the "source of truth" for every crawler (Google, OpenAI, Claude,
    //    Perplexity). Never remove it, even when a page passes structuredData.
    upsertJsonLd("seo-org-json-ld", steaCodeGraph());

    // 2. Merge page-specific structured data (Product, SoftwareApplication,
    //    BreadcrumbList, etc.) with the org schema so the graph is cohesive.
    removeJsonLd("seo-page-json-ld");
    if (structuredData) {
      upsertJsonLd("seo-page-json-ld", structuredData);
    }

    return () => {
      removeJsonLd("seo-org-json-ld");
      removeJsonLd("seo-page-json-ld");
    };
  }, [title, description, keywords, canonical, canonicalUrl, ogImage, image, ogUrl, robots, noIndex, type, siteName, structuredData]);

  return null;
}

