import { useState, useEffect } from "react";
import {
  getFirebaseDb,
  getFirebaseAuth,
  collection,
  onSnapshot,
  query,
  limit,
  doc,
  updateDoc,
  increment,
  getDocs,
  where,
  orderBy,
  handleFirestoreError,
  OperationType,
} from "../firebase.js";
import { firebaseConfig } from "../../firebaseConfig.js";

// Hard Debug Function - Runs once to verify data exists
let debugRun = false;
export const runFirestoreHardDebug = async () => {
  if (debugRun) return;
  debugRun = true;
  
  console.log("==================================================");
  console.log("🔥 FIRESTORE HARD DEBUG START");
  console.log("🔥 Active Project ID:", firebaseConfig.projectId);
  console.log("🔥 Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  console.log("==================================================");

  const db = getFirebaseDb();
  if (!db) {
    console.error("🔥 ERROR: getFirebaseDb() returned null");
    return;
  }

  const collectionsToTest = [
    "posts", "updates", "news", "tips", "marketplace", 
    "products", "courses", "websites", "prompts", "users"
  ];

  for (const colName of collectionsToTest) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef); // Direct getDocs, no filters
      console.log(`✅ [${colName}] Count: ${snapshot.size} documents found.`);
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0].data();
        console.log(`   └─ Sample doc keys:`, Object.keys(firstDoc).join(", "));
      }
    } catch (error) {
      console.error(`❌ [${colName}] Fetch Error:`, error.message);
    }
  }
  console.log("==================================================");
};

export function useCollection(colName, orderField = "createdAt", limitCount = 50) {
  const skipLocalCache = colName === "websites";
  const [docs, setDocs] = useState(() => {
    if (skipLocalCache) return [];
    try {
      const cached = localStorage.getItem(`stea_cache_${colName}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn(`Failed to parse cache for ${colName}:`, err.message);
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = useState(false);
  const [hasReceivedServerSnapshot, setHasReceivedServerSnapshot] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      Promise.resolve().then(() => {
        setLoading(false);
        setInitialLoadDone(true);
      });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
      setInitialLoadDone(true);
      if (skipLocalCache) {
        setError(new Error("Connection problem"));
        return;
      }
      setHasReceivedServerSnapshot(true);
    }, 15000);

    const q = orderField
      ? query(
          collection(db, colName),
          orderBy(orderField, "desc"),
          limit(limitCount)
        )
      : query(
          collection(db, colName),
          limit(limitCount)
        );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        clearTimeout(timer);
        setHasReceivedSnapshot(true);
        if (!snap.metadata.fromCache) {
          setHasReceivedServerSnapshot(true);
        }
        setError(null);
        setIsOfflineData(snap.metadata.fromCache);

        if (snap.empty) {
          console.log(`[useCollection] ${colName} is empty.`);
          setDocs([]);
          if (snap.metadata.fromCache) {
            return;
          }
          setLoading(false);
          setInitialLoadDone(true);
          return;
        }

        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Client-side sort handles missing createdAt fields
        fetched.sort((a, b) => {
          const getTime = (item) => {
            const f = item.updatedAt || item[orderField] || item.createdAt;
            if (!f) return 0;
            if (f?.toDate) return f.toDate().getTime();
            if (typeof f === "number") return f;
            const t = new Date(f).getTime();
            return isNaN(t) ? 0 : t;
          };
          return getTime(b) - getTime(a);
        });

        const cacheable = fetched.map(d => {
          const copy = { ...d };
          for (const key in copy) {
            if (copy[key]?.toDate) copy[key] = copy[key].toDate().toISOString();
          }
          return copy;
        });
        if (!skipLocalCache) {
          try {
            localStorage.setItem(`stea_cache_${colName}`, JSON.stringify(cacheable));
          } catch {
            localStorage.removeItem(`stea_cache_${colName}`);
          }
        } else {
          localStorage.removeItem(`stea_cache_${colName}`);
        }

        setDocs(fetched);
        setLoading(false);
        setInitialLoadDone(true);
      },
      (err) => {
        clearTimeout(timer);
        console.error(`[useCollection] Error fetching ${colName}:`, err.message);
        setError(err);
        setDocs([]);
        setLoading(false);
        setInitialLoadDone(true);
        handleFirestoreError(err, OperationType.LIST, colName);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [colName, orderField, limitCount, skipLocalCache]);

  return {
    docs,
    loading,
    error,
    isOfflineData,
    initialLoadDone,
    hasReceivedSnapshot,
    hasReceivedServerSnapshot,
  };
}

export function useCollectionWhere(colName, field, operator, value, orderField = "createdAt", limitCount = 50) {
  const [docs, setDocs] = useState(() => {
    try {
      const cacheKey = `stea_cache_where_${colName}_${field}_${value}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn(`Failed to parse cache for ${colName} where:`, err.message);
    }
    return [];
  });
  const [loading, setLoading] = useState(docs.length === 0);
  const [error, setError] = useState(null);
  const [isOfflineData, setIsOfflineData] = useState(false);

  useEffect(() => {
    // Skip query if value is placeholder or empty, or if we don't have authenticated user for protected collections
    const auth = getFirebaseAuth();
    const isProtected = ["enrollments", "referrals", "ambassador_applications", "users"].includes(colName);
    const hasAuth = auth && auth.currentUser;
    const isPlaceholder = value === "mock-user-id" || !value;

    if (isProtected && !hasAuth && isPlaceholder) {
      setDocs([]);
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const q = query(collection(db, colName), where(field, operator, value), limit(limitCount));

    const unsub = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      setIsOfflineData(snap.metadata.fromCache);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Cache results
      try {
        const cacheKey = `stea_cache_where_${colName}_${field}_${value}`;
        const cacheable = fetched.map(d => {
          const copy = { ...d };
          for (const k in copy) {
            if (copy[k]?.toDate) copy[k] = copy[k].toDate().toISOString();
          }
          return copy;
        });
        localStorage.setItem(cacheKey, JSON.stringify(cacheable));
      } catch {
        // Silent cache error
      }

      setDocs(fetched);
      setLoading(false);
    }, (err) => {
      console.error(`[useCollectionWhere] Error fetching ${colName}:`, err.message);
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, colName);
    });

    return () => unsub();
  }, [colName, field, operator, value, orderField, limitCount]);

  return { docs, loading, error, isOfflineData };
}

export async function incrementViews(colName, docId) {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, colName, docId), { views: increment(1) });
  } catch (e) {
    console.warn("incrementViews error:", e.message);
  }
}

export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [s, label] of intervals) {
    const n = Math.floor(seconds / s);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function fmtViews(v) {
  if (!v) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return String(v);
}
