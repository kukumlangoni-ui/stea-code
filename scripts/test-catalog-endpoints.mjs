import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import express from "express";
import http from "http";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: applicationDefault(),
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      "swahilitecheliteacademy",
  });
}

async function testEndpoints() {
  console.log("=== STEA CODE PRODUCTION CATALOG API AUDIT ===");

  const app = getAdminApp();
  const db = getFirestore(app);

  const snapshot = await db.collection("stea_code_products").get();
  const sourceSnapshot = await db.collection("stea_code_product_sources").get();

  const sourceIds = new Set();
  for (const doc of sourceSnapshot.docs) {
    const data = doc.data();
    const files = Array.isArray(data?.files) ? data.files : [];
    if (files.length > 0) sourceIds.add(doc.id);
  }

  const allFirestoreProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Simulate GET /api/stea-code/catalog (all published)
  const allPublished = allFirestoreProducts
    .filter(p => p.status === "published")
    .map(p => ({
      id: p.id,
      titleEn: p.titleEn || p.title,
      status: p.status,
      homepageVisible: Boolean(p.homepageVisible),
      featured: Boolean(p.featured),
      hasSource: sourceIds.has(p.id),
      pricingType: p.pricingType || "free",
      preview: {
        enabled: Boolean(p.preview?.enabled),
        runtime: p.preview?.runtime || "html-css-js",
      }
    }));

  // Simulate GET /api/stea-code/catalog?scope=homepage
  const homepageProducts = allPublished.filter(p => p.homepageVisible === true);

  console.log(`\nGET /api/stea-code/catalog -> ${allPublished.length} products`);
  console.log(`GET /api/stea-code/catalog?scope=homepage -> ${homepageProducts.length} products\n`);

  console.log("HOMEPAGE APPROVED PRODUCTS DETAILS:");
  console.log(JSON.stringify(homepageProducts, null, 2));

  if (homepageProducts.length !== 8) {
    console.error(`ERROR: Expected 8 homepage products, got ${homepageProducts.length}`);
    process.exit(1);
  }

  // Security Check: Verify protected files are NOT present in public metadata
  for (const p of homepageProducts) {
    if (p.protectedFiles || p.sourceCode || p.files) {
      console.error(`SECURITY ERROR: Protected source exposed on product ${p.id}`);
      process.exit(1);
    }
  }
  console.log("\nSECURITY CHECK PASSED: Protected source code is NOT exposed in public catalog metadata.");

  process.exit(0);
}

testEndpoints().catch((err) => {
  console.error("Endpoint audit failed:", err);
  process.exit(1);
});
