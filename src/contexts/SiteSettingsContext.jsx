import React, { createContext, useContext, useState, useEffect } from "react";
import { getFirebaseDb, doc, onSnapshot } from "../firebase.js";

const SiteSettingsContext = createContext();

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const db = getFirebaseDb();

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const docs = ["hero", "about_us", "about_creator", "contact_info", "stats", "websites"];
    let loadedCount = 0;
    
    const unsubs = docs.map(id => 
      onSnapshot(doc(db, "site_settings", id), (snap) => {
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, [id]: snap.data().data }));
        }
        loadedCount++;
        if (loadedCount >= docs.length) setLoading(false);
      }, (err) => {
        console.error(`Error loading site setting ${id}:`, err);
        loadedCount++;
        if (loadedCount >= docs.length) setLoading(false);
      })
    );

    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      unsubs.forEach(u => u());
    };
  }, [db]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
