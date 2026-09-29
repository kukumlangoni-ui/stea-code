import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.js';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync favorites from local storage (guest) or Firestore (member)
  useEffect(() => {
    let isMounted = true;
    
    if (!user) {
      try {
        const raw = localStorage.getItem("stea_guest_favorites") || "[]";
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        setFavoriteIds(list.map(x => x.websiteId).filter(Boolean));
      } catch (e) {
        setFavoriteIds([]);
      }
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { getFirebaseDb, doc, getDoc } = await import('../firebase.js');
        const db = getFirebaseDb();
        if (!db) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (isMounted) {
          const current = (userDoc.exists() ? (userDoc.data().favoriteWebsites || []) : []) || [];
          setFavoriteIds(current);
          setLoading(false);
          
          // Migrate guest favorites to user
          try {
            const raw = localStorage.getItem("stea_guest_favorites");
            if (raw) {
              const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
              const guestIds = list.map(x => x.websiteId).filter(Boolean);
              if (guestIds.length > 0) {
                const { setDoc, serverTimestamp } = await import('../firebase.js');
                const next = Array.from(new Set([...guestIds, ...current]));
                await setDoc(doc(db, "users", user.uid), { favoriteWebsites: next, updatedAt: serverTimestamp() }, { merge: true });
                setFavoriteIds(next);
                localStorage.removeItem("stea_guest_favorites"); // clean up
              }
            }
          } catch (e) {
            console.error("Failed to migrate guest favorites", e);
          }
        }
      } catch (e) {
        console.error("Failed to fetch favorites:", e);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchFavorites();
    
    return () => { isMounted = false; };
  }, [user]);

  const toggleFavorite = useCallback(async (site) => {
    if (!site?.id) return { isAdding: false };
    
    const isAdding = !favoriteIds.includes(site.id);
    const next = isAdding 
      ? [site.id, ...favoriteIds] 
      : favoriteIds.filter(id => id !== site.id);
      
    // Optimistic UI update
    setFavoriteIds(next);
    
    if (!user) {
      try {
        const raw = localStorage.getItem("stea_guest_favorites") || "[]";
        let list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        if (isAdding) {
          list = [{
            websiteId: site.id,
            title: site.name || site.title || "",
            url: site.url || site.link || "",
            faviconUrl: site.faviconUrl || "",
            category: site.category || "",
            savedAt: Date.now(),
          }, ...list].slice(0, 100);
        } else {
          list = list.filter(x => x.websiteId !== site.id);
        }
        localStorage.setItem("stea_guest_favorites", JSON.stringify(list));
      } catch (e) {}
      return { isAdding };
    }
    
    try {
      const { getFirebaseDb, doc, setDoc, serverTimestamp } = await import('../firebase.js');
      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, "users", user.uid), { favoriteWebsites: next, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to sync favorite to firestore", e);
      // Revert on failure
      setFavoriteIds(favoriteIds);
      return { isAdding: false, error: e };
    }
    
    return { isAdding };
  }, [favoriteIds, user]);
  
  const isFavorite = useCallback((siteId) => {
    return favoriteIds.includes(siteId);
  }, [favoriteIds]);

  return { favoriteIds, toggleFavorite, isFavorite, loading };
}
