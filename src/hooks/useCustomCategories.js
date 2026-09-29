/**
 * useCustomCategories — Phase 2
 * Reads admin-created categories from Firestore.
 * Falls back to deriving from docs if collection is empty.
 */
import { useState, useEffect, useMemo } from "react";
import { getFirebaseDb, collection, onSnapshot, query, orderBy, limit } from "../firebase.js";

function numericSortOrder(value, fallback = 999) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * @param {string} collectionName  e.g. "website_solution_categories"
 * @param {Array}  docs            fallback source docs
 */
export function useCustomCategories(collectionName, docs = []) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !collectionName) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      query(collection(db, collectionName), orderBy("sortOrder", "asc"), limit(200)),
      snap => {
        setCats(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
          const orderDiff = numericSortOrder(a.sortOrder, numericSortOrder(a.sort_order, numericSortOrder(a.displayOrder)))
            - numericSortOrder(b.sortOrder, numericSortOrder(b.sort_order, numericSortOrder(b.displayOrder)));
          if (orderDiff !== 0) return orderDiff;
          return String(a.name || "").localeCompare(String(b.name || ""));
        }));
        setLoading(false);
        setError(null);
      },
      err => {
        console.warn(`useCustomCategories(${collectionName}):`, err.message);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [collectionName, retryTrigger]);

  // If no admin categories defined, derive from docs (with robust case-insensitive and trimmed deduplication)
  const derived = useMemo(() => {
    const seenSlug = new Set();
    const seenName = new Set();
    const seenId   = new Set();
    const out = [];

    if (cats.length > 0) {
      cats.forEach(c => {
        const slugNorm = String(c.slug || c.categorySlug || c.id || "").trim().toLowerCase();
        const nameNorm = String(c.name || "").trim().toLowerCase();
        const idNorm   = String(c.id || "").trim();
        if (slugNorm && seenSlug.has(slugNorm)) return;
        if (nameNorm && seenName.has(nameNorm) && seenId.has(idNorm)) return;
        if (slugNorm) seenSlug.add(slugNorm);
        if (nameNorm) seenName.add(nameNorm);
        if (idNorm) seenId.add(idNorm);
        if (nameNorm || slugNorm) {
          out.push(c);
        }
      });
      return out.sort((a, b) => {
        const aOrd = numericSortOrder(a.sortOrder, numericSortOrder(a.sort_order, numericSortOrder(a.displayOrder)));
        const bOrd = numericSortOrder(b.sortOrder, numericSortOrder(b.sort_order, numericSortOrder(b.displayOrder)));
        if (aOrd !== bOrd) return aOrd - bOrd;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    }

    (docs || []).forEach(d => {
      const c = d.category;
      if (c) {
        const slugNorm = String(d.categorySlug || d.slug || c).trim().toLowerCase();
        const nameNorm = String(c).trim().toLowerCase();
        const idNorm   = String(c).trim();
        if (slugNorm && seenSlug.has(slugNorm)) return;
        if (nameNorm && seenName.has(nameNorm) && seenId.has(idNorm)) return;
        if (slugNorm) seenSlug.add(slugNorm);
        if (nameNorm) seenName.add(nameNorm);
        if (idNorm) seenId.add(idNorm);
        if (nameNorm || slugNorm) {
          out.push({ id: String(c).trim(), name: String(c).trim() });
        }
      }
    });
    return out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [cats, docs]);

  const retry = () => setRetryTrigger(prev => prev + 1);

  return { categories: derived, loading, error, retry };
}

export function useCustomSubCategories(collectionName, parentCategory = null, docs = []) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !collectionName) { setLoading(false); return; }

    const unsub = onSnapshot(
      query(collection(db, collectionName), orderBy("sortOrder", "asc"), limit(500)),
      snap => {
        let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
          const orderDiff = numericSortOrder(a.sortOrder, numericSortOrder(a.sort_order, numericSortOrder(a.displayOrder)))
            - numericSortOrder(b.sortOrder, numericSortOrder(b.sort_order, numericSortOrder(b.displayOrder)));
          if (orderDiff !== 0) return orderDiff;
          return String(a.name || "").localeCompare(String(b.name || ""));
        });
        if (parentCategory) {
          fetched = fetched.filter(s => s.parentCategory === parentCategory || s.category === parentCategory);
        }
        setSubs(fetched);
        setLoading(false);
      },
      err => {
        console.warn(`useCustomSubCategories:`, err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [collectionName, parentCategory]);

  const derived = useMemo(() => {
    const seenName = new Set();
    const seenId   = new Set();
    const out = [];

    if (subs.length > 0) {
      subs.forEach(s => {
        const nameNorm = String(s.name || "").trim().toLowerCase();
        const idNorm   = String(s.id || "").trim();
        if (nameNorm && !seenName.has(nameNorm) && !seenId.has(idNorm)) {
          seenName.add(nameNorm);
          seenId.add(idNorm);
          out.push(s);
        }
      });
      return out.sort((a, b) => {
        const aOrd = numericSortOrder(a.sortOrder, numericSortOrder(a.sort_order, numericSortOrder(a.displayOrder)));
        const bOrd = numericSortOrder(b.sortOrder, numericSortOrder(b.sort_order, numericSortOrder(b.displayOrder)));
        if (aOrd !== bOrd) return aOrd - bOrd;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    }

    (docs || []).forEach(d => {
      const c = d.subCategory || d.subcategory;
      if (c) {
        const nameNorm = String(c).trim().toLowerCase();
        const idNorm   = String(c).trim();
        if (nameNorm && !seenName.has(nameNorm) && !seenId.has(idNorm)) {
          seenName.add(nameNorm);
          seenId.add(idNorm);
          out.push({ id: String(c).trim(), name: String(c).trim() });
        }
      }
    });
    return out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [subs, docs]);

  return { subCategories: derived, loading };
}
