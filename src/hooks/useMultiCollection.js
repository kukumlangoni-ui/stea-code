import { useState, useEffect } from "react";
import { collection, query, limit, onSnapshot, getDocs, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "../firebase.js";
import { firebaseConfig } from "../../firebaseConfig.js";

export function useMultiCollection(colNames, orderField = "createdAt", limitCount = 50) {
  const colNamesKey = JSON.stringify(colNames);
  const cacheKey = `stea_cache_multi_${colNamesKey}_${orderField}`;

  const [docs, setDocs] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn(`[useMultiCollection] Cache parse error for ${colNamesKey}:`, err.message);
    }
    return [];
  });
  const [loading, setLoading] = useState(docs.length === 0);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubs = [];
    const resultsMap = {};
    let initializedCols = 0;

    const timer = setTimeout(() => {
      if (loading) {
        console.warn(`[useMultiCollection] Timeout reached for ${colNamesKey}`);
        setLoading(false);
      }
    }, 3000);

    colNames.forEach((colName) => {
      try {
        const colRef = collection(db, colName);
        
        const handleSnap = (snap) => {
          clearTimeout(timer);
          const fetched = snap.docs.map((d) => ({ 
            id: d.id, 
            _collection: colName,
            ...d.data() 
          }));
          
          resultsMap[colName] = fetched;
          
          // Merge and sort locally
          const allMerged = Object.values(resultsMap).flat();
          
          allMerged.sort((a, b) => {
            const getVal = (docData, field) => {
               let v = docData[field];
               if (!v && field === "createdAt") v = docData["updatedAt"];
               if (!v) return 0;
               if (v.toDate) return v.toDate().getTime();
               if (v instanceof Date) return v.getTime();
               if (typeof v === 'string') return new Date(v).getTime();
               return v;
            };
            return getVal(b, orderField) - getVal(a, orderField);
          });

          setDocs(allMerged.slice(0, limitCount));
          setLoading(false);

          // Update Cache
          try {
            const cacheable = allMerged.slice(0, limitCount).map(d => {
              const copy = { ...d };
              for (const k in copy) {
                if (copy[k]?.toDate) copy[k] = copy[k].toDate().toISOString();
              }
              return copy;
            });
            localStorage.setItem(cacheKey, JSON.stringify(cacheable));
          } catch (e) {
            // Silently ignore quota or serialization errors
          }
          
          if (initializedCols < colNames.length) {
            initializedCols++;
          }
        };

        const tryQuery = (q) => {
          return onSnapshot(q, handleSnap, (err) => {
            console.warn(`[useMultiCollection] Error in ${colName} with orderBy:`, err.message);
            // Fallback for missing index
            const fallbackQ = query(colRef, limit(limitCount));
            onSnapshot(fallbackQ, handleSnap, (fallbackErr) => {
              console.warn(`[useMultiCollection] Fallback error in ${colName}:`, fallbackErr.message);
              resultsMap[colName] = [];
              if (initializedCols < colNames.length) {
                initializedCols++;
              }
              if (initializedCols === colNames.length) setLoading(false);
            });
          });
        };

        const initialQ = query(colRef, orderBy(orderField, "desc"), limit(limitCount));
        const unsub = tryQuery(initialQ);
        unsubs.push(() => {
            try { unsub(); } catch(e){}
        });
      } catch (e) {
        console.error(`[useMultiCollection] Setup error for ${colName}:`, e);
      }
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [colNamesKey, orderField, limitCount]);

  return { docs, loading };
}
