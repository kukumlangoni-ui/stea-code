/**
 * DEV PREVIEW fixture data — shared between SteaCodeCommercePanel and
 * SteaCodeProductStudioPage so the Sylva product is defined exactly once.
 *
 * This module must never import from Firebase or any protected API.
 * It is safe to import in any component; it contains no credentials.
 */

const BASE_PREVIEW = {
  enabled: false,
  runtime: "html-css-js",
  html: "",
  css: "",
  javascript: "",
  jsx: "",
  tsx: "",
  fullDocument: "",
  baseUrl: "",
  externalUrl: "",
  viewportMode: "desktop",
  width: 1280,
  height: 720,
  scaleMode: "fit",
  interactive: true,
  autoRun: false,
};

export const DEV_PREVIEW_PRODUCTS = [
  {
    id: "preview-sylva-living-world",
    slug: "preview-sylva-living-world",
    titleEn: "Sylva Living World",
    shortDescriptionEn: "Full HTML / Canvas / WebGL product preview sample.",
    category: "Heroes",
    tags: ["threejs", "landing"],
    frameworks: ["HTML/CSS", "Three.js"],
    languages: ["HTML", "CSS", "JavaScript"],
    pricingType: "free",
    price: 0,
    currency: "USD",
    status: "draft",
    featured: true,
    updatedAt: new Date().toISOString(),
    preview: {
      ...BASE_PREVIEW,
      enabled: true,
      runtime: "full-html",
      autoRun: false,
      viewportMode: "wide",
      width: 1600,
      height: 880,
      scaleMode: "fit",
      fullDocument: "<!doctype html><html><head><style>body{margin:0;background:#102018;color:white;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;height:100vh}.wrap{width:86%;display:grid;grid-template-columns:1fr 1fr;gap:60px}.card{background:white;color:#122018;border-radius:18px;padding:30px}h1{font-size:78px;line-height:1;margin:0 0 22px}</style></head><body><main class='wrap'><section><p>STEA CODE PREVIEW</p><h1>Step into the living world</h1><p>1600 by 880 authored viewport scaled to fit the admin panel.</p></section><section class='card'>Preview card one</section><section class='card'>Preview card two</section></main></body></html>",
    },
  },
];
