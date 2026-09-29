// src/utils/safeRender.js
// Helper utilities for safe rendering and data sanitisation

/**
 * Ensure a value is an array; otherwise return empty array.
 */
export const safeArray = (data) => (Array.isArray(data) ? data : []);

/**
 * Normalise website objects fetched from Firestore.
 */
export const safeWebsite = (w) => ({
  id: w.id ?? "",
  title: w.title ?? "Untitled",
  image: w.image ?? "/placeholder.png",
  favicon: w.favicon ?? "/default-icon.png",
  category: w.category ?? "general",
  likes: w.likes ?? 0,
  views: w.views ?? 0,
  url: w.url ?? "#",
});

/**
 * Normalise category objects, ensuring nested websites array is safe.
 */
export const safeCategory = (cat) => ({
  ...cat,
  websites: safeArray(cat.websites),
});



