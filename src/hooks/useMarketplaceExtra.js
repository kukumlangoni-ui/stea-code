import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '../firebase';

export function useMarketplaceExtra() {
  const [extraSubcategories, setExtraSubcategories] = useState({
    electronics: [],
    spare_parts: []
  });

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "site_settings", "marketplace_extra"), (snap) => {
      if (snap.exists()) {
        setExtraSubcategories(snap.data().subcategories || { electronics: [], spare_parts: [] });
      }
    });
    return () => unsub();
  }, []);

  return { extraSubcategories };
}
