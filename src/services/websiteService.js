import { getFirebaseDb, collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, limit } from "../firebase.js";
import { normalizeUrl, extractHostname, normalizeWebsiteCategorySlug, getWebsiteCategoryLabel, normalizeStatus, normalizeThumbnailDisplay } from "../utils/websiteRecordCompat.js";

/**
 * Single Canonical Website Creation Service
 */
export async function createCanonicalWebsite(inputData, source = "admin", userId = null, additionalMetadata = {}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not initialized");

  const normalizedUrl = normalizeUrl(inputData.url);
  const hostname = extractHostname(normalizedUrl);
  
  if (!normalizedUrl) {
    throw new Error("A valid URL is required.");
  }
  if (!inputData.title && !inputData.name) {
    throw new Error("A website title/name is required.");
  }

  // Check for duplicates
  const existing = await getDocs(query(collection(db, "websites"), where("url", "==", normalizedUrl), limit(1)));
  if (!existing.empty) {
    throw new Error("This website already exists.");
  }

  const categoryLabel = getWebsiteCategoryLabel(inputData.category || inputData.categoryId);
  const categoryId = normalizeWebsiteCategorySlug(categoryLabel);
  const status = normalizeStatus(inputData.status) || (source === "admin" ? "published" : "pending-review");

  const thumbnailDisplay = normalizeThumbnailDisplay(inputData);

  const payload = {
    url: normalizedUrl,
    normalizedUrl,
    hostname,
    domain: hostname,
    title: inputData.title || inputData.name || "",
    name: inputData.title || inputData.name || "",
    description: inputData.description || "",
    category: categoryLabel,
    categoryName: categoryLabel,
    categoryId,
    categorySlug: categoryId,
    status,
    published: status === "published",
    faviconUrl: inputData.faviconUrl || "",
    customIconUrl: inputData.customIconUrl || inputData.customLogoUrl || "",
    paid: inputData.paid === true,
    thumbnailUrl: inputData.thumbnailUrl || inputData.imageUrl || inputData.image || "",
    imageUrl: inputData.thumbnailUrl || inputData.imageUrl || inputData.image || "",
    image: inputData.thumbnailUrl || inputData.imageUrl || inputData.image || "",
    thumbnailFit: thumbnailDisplay.thumbnailFit,
    thumbnailPosition: thumbnailDisplay.thumbnailPosition,
    thumbnailZoom: thumbnailDisplay.thumbnailZoom,
    thumbnailBg: thumbnailDisplay.thumbnailBg,
    featured: !!inputData.featured,
    tags: Array.isArray(inputData.tags) ? inputData.tags : (typeof inputData.tags === 'string' ? inputData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source,
    submittedBy: userId || "",
    ...additionalMetadata
  };

  const docRef = await addDoc(collection(db, "websites"), payload);
  return { id: docRef.id, ...payload };
}
