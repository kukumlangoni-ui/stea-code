import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

async function audit() {
  const app = getAdminApp();
  const db = getFirestore(app);

  console.log("=================================================");
  console.log("STEA CODE FIRESTORE & CATALOG AUDIT");
  console.log("=================================================\n");

  const snapshot = await db.collection("stea_code_products").get();
  const sourceSnapshot = await db.collection("stea_code_product_sources").get();

  const sourceMap = new Map();
  for (const doc of sourceSnapshot.docs) {
    const data = doc.data();
    const files = Array.isArray(data?.files) ? data.files : [];
    sourceMap.set(doc.id, files.length);
  }

  console.log(`Total Firestore Product Documents: ${snapshot.docs.length}`);
  console.log(`Total Product Source Documents: ${sourceSnapshot.docs.length}\n`);

  const results = [];

  for (const doc of snapshot.docs) {
    const p = doc.data();
    const sourceCount = sourceMap.get(doc.id) || 0;
    const hasSource = sourceCount > 0;

    const item = {
      id: doc.id,
      title: p.titleEn || p.titleZh || p.title || "Untitled",
      slug: p.slug || doc.id,
      status: p.status,
      homepageVisible: Boolean(p.homepageVisible),
      featured: Boolean(p.featured),
      category: p.category,
      pricingType: p.pricingType,
      price: p.price || 0,
      runtime: p.preview?.runtime || "html-css-js",
      previewEnabled: Boolean(p.preview?.enabled),
      hasSource,
      sourceFileCount: sourceCount,
    };
    results.push(item);
  }

  console.log("PRODUCTS AUDIT LIST:");
  console.log(JSON.stringify(results, null, 2));

  const homepageApproved = results.filter(r => r.status === "published" && r.homepageVisible === true);
  console.log(`\nHomepage Eligible Products Count: ${homepageApproved.length} / ${results.length}`);
  for (const p of homepageApproved) {
    console.log(`  ✓ [${p.id}] "${p.title}" | runtime=${p.runtime} | previewEnabled=${p.previewEnabled} | hasSource=${p.hasSource} (${p.sourceFileCount} files)`);
  }

  process.exit(0);
}

audit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
