import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { STEA_CODE_SERVER_PRODUCTS } from "../src/data/stea-code/codeProductsServer.js";

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

function normalizeFiles(product) {
  const files =
    product.pricingType === "premium"
      ? product.protectedFiles
      : product.publicFiles;

  if (!Array.isArray(files)) return [];

  return files.map((file, index) => ({
    path: String(file.path || `file-${index + 1}.txt`).trim(),
    language: String(file.language || "text").trim().toLowerCase(),
    content: String(file.content || ""),
    order: index,
  }));
}

function metadata(product) {
  return {
    slug: product.slug || product.id,
    titleEn: product.titleEn || "",
    titleZh: product.titleZh || "",
    shortDescriptionEn: product.shortDescriptionEn || "",
    shortDescriptionZh: product.shortDescriptionZh || "",
    productType: product.productType || "Code Product",
    category: product.category || "Components",
    tags: Array.isArray(product.tags) ? product.tags : [],
    frameworks: Array.isArray(product.frameworks) ? product.frameworks : [],
    languages: Array.isArray(product.languages) ? product.languages : [],
    pricingType:
      product.pricingType === "premium" ? "premium" : "free",
    price:
      product.pricingType === "premium"
        ? Number(product.price || 0)
        : 0,
    currency: String(product.currency || "USD").toUpperCase(),
    posterImageUrl: product.posterImageUrl || "",
    previewVideoUrl: product.previewVideoUrl || "",
    included: Array.isArray(product.included) ? product.included : [],
    usageGuideEn: product.usageGuideEn || "",
    usageGuideZh: product.usageGuideZh || "",
    status: product.status || "published",
    featured: Boolean(product.featured),
    fileNames: Array.isArray(product.fileNames)
      ? product.fileNames
      : normalizeFiles(product).map((file) => file.path),
  };
}

const app = getAdminApp();
const db = getFirestore(app);

console.log("");
console.log("========================================");
console.log("STEA CODE FIRESTORE SEED");
console.log("========================================");

let seeded = 0;

for (const product of STEA_CODE_SERVER_PRODUCTS) {
  const id = String(product.id || product.slug || "").trim();

  if (!id) {
    console.warn("SKIP: product missing id");
    continue;
  }

  const productRef = db.collection("stea_code_products").doc(id);
  const sourceRef = db.collection("stea_code_product_sources").doc(id);

  const existing = await productRef.get();
  const files = normalizeFiles(product);

  const base = metadata(product);

  if (existing.exists) {
    await productRef.set(
      {
        ...base,
        updatedAt: FieldValue.serverTimestamp(),
        migratedFromStaticCatalog: true,
      },
      { merge: true }
    );

    console.log(`UPDATE: ${id}`);
  } else {
    await productRef.set({
      ...base,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      migratedFromStaticCatalog: true,
    });

    console.log(`CREATE: ${id}`);
  }

  await sourceRef.set(
    {
      productId: id,
      pricingType:
        product.pricingType === "premium" ? "premium" : "free",
      files,
      migratedFromStaticCatalog: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `  SOURCE: ${files.length} file${files.length === 1 ? "" : "s"}`
  );

  seeded++;
}

console.log("");
console.log(`DONE: ${seeded}/${STEA_CODE_SERVER_PRODUCTS.length} products`);
console.log("========================================");

process.exit(0);
