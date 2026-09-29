import { useEffect } from "react";

const DEFAULT_TITLE = "STEA Africa — Education, AI Tools, Websites & Digital Services for Africa";
const DEFAULT_DESCRIPTION = "STEA Africa is a digital ecosystem for education, AI tools, curated websites, creators, jobs, and digital services across Africa.";
const DEFAULT_IMAGE = "https://stea.africa/seo/stea-og.jpg";

function upsertMeta(selectorAttr, key, content) {
  if (!content) return;
  let meta = document.head.querySelector(`meta[${selectorAttr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(selectorAttr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function toAbsoluteUrl(value, base = "https://stea.africa") {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
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

    let jsonLd = document.head.querySelector("#seo-json-ld");
    if (structuredData) {
      if (!jsonLd) {
        jsonLd = document.createElement("script");
        jsonLd.type = "application/ld+json";
        jsonLd.id = "seo-json-ld";
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify(structuredData);
    } else if (jsonLd) {
      jsonLd.remove();
    }
  }, [title, description, keywords, canonical, canonicalUrl, ogImage, image, ogUrl, robots, noIndex, type, siteName, structuredData]);

  return null;
}

