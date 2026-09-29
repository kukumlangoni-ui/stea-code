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

async function main() {
  const isExecute = process.argv.includes("--execute") || process.argv.includes("--apply");
  console.log(`=== STEA Code Homepage Visibility Migration ===`);
  console.log(`Mode: ${isExecute ? "EXECUTE / APPLY" : "DRY RUN ONLY"}\n`);

  const app = getAdminApp();
  const db = getFirestore(app);

  const snapshot = await db.collection("stea_code_products").get();
  console.log(`Total Firestore documents in stea_code_products: ${snapshot.docs.length}`);

  const publishedDocs = [];
  const otherDocs = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const info = {
      id: docSnap.id,
      title: data.titleEn || data.titleZh || data.title || docSnap.id,
      status: data.status,
      currentHomepageVisible: Boolean(data.homepageVisible),
    };

    if (data.status === "published") {
      publishedDocs.push(info);
    } else {
      otherDocs.push(info);
    }
  }

  console.log(`\n--- Published Products (${publishedDocs.length}) ---`);
  for (const p of publishedDocs) {
    console.log(`- ID: ${p.id} | Title: "${p.title}" | Status: ${p.status} | homepageVisible: ${p.currentHomepageVisible}`);
  }

  if (otherDocs.length > 0) {
    console.log(`\n--- Other Products (Drafts / Archived: ${otherDocs.length}) ---`);
    for (const p of otherDocs) {
      console.log(`- ID: ${p.id} | Title: "${p.title}" | Status: ${p.status} | homepageVisible: ${p.currentHomepageVisible}`);
    }
  }

  if (!isExecute) {
    console.log(`\n[DRY RUN COMPLETE] No Firestore mutations were performed.`);
    console.log(`To execute migration, run: node scripts/migrate-stea-code-homepage-visible.mjs --execute`);
    process.exit(0);
  }

  console.log(`\n--- Applying Mutations ---`);
  let updatedCount = 0;

  for (const p of publishedDocs) {
    const docRef = db.collection("stea_code_products").doc(p.id);
    await docRef.update({
      homepageVisible: true,
      updatedAt: new Date().toISOString(),
    });
    console.log(`✓ Updated ${p.id}: set homepageVisible = true`);
    updatedCount++;
  }

  console.log(`\nSUCCESS: Updated ${updatedCount} published product documents in Firestore.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
