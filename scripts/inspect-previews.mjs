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

async function inspectPreviews() {
  const app = getAdminApp();
  const db = getFirestore(app);

  const snapshot = await db.collection("stea_code_products").get();
  const sourceSnapshot = await db.collection("stea_code_product_sources").get();
  const previewSnapshot = await db.collection("stea_code_product_previews").get();

  console.log("=== STEA CODE PREVIEWS AUDIT ===");
  console.log(`Product previews docs count: ${previewSnapshot.docs.length}\n`);

  for (const doc of snapshot.docs) {
    const p = doc.data();
    const prevDoc = previewSnapshot.docs.find(d => d.id === doc.id);
    const prevData = prevDoc ? prevDoc.data() : null;
    const sourceDoc = sourceSnapshot.docs.find(d => d.id === doc.id);
    const sourceData = sourceDoc ? sourceDoc.data() : null;

    console.log(`Product: ${doc.id} ("${p.titleEn || p.title}")`);
    console.log(`  Metadata preview field:`, p.preview);
    console.log(`  Preview collection document:`, prevData ? {
      enabled: prevData.enabled,
      runtime: prevData.runtime,
      hasHtml: Boolean(prevData.html),
      hasCss: Boolean(prevData.css),
      hasJs: Boolean(prevData.javascript),
      hasFullDoc: Boolean(prevData.fullDocument),
    } : "NONE");
    console.log(`  Source collection files (${sourceData?.files?.length || 0}):`, (sourceData?.files || []).map(f => f.path));
    console.log("-------------------------------------------------\n");
  }

  process.exit(0);
}

inspectPreviews().catch((err) => {
  console.error(err);
  process.exit(1);
});
