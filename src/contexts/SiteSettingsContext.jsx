import React, { createContext, useContext, useState, useEffect } from "react";

const SiteSettingsContext = createContext();

/**
 * Legacy site settings (hero / about / contact / stats / websites) are stored
 * in Firebase. This provider wraps the whole app, so Firebase is imported
 * on demand instead of statically: a module-level failure there would abort
 * bundle evaluation and blank every route before React mounts.
 */
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let unsubs = [];
    let fallbackTimer;

    (async () => {
      try {
        const { getFirebaseDb, doc, onSnapshot } = await import("../firebase.js");
        if (!alive) return;

        const db = getFirebaseDb();
        if (!db) {
          setLoading(false);
          return;
        }

        const docs = ["hero", "about_us", "about_creator", "contact_info", "stats", "websites"];
        let loadedCount = 0;

        unsubs = docs.map((id) =>
          onSnapshot(
            doc(db, "site_settings", id),
            (snap) => {
              if (!alive) return;
              if (snap.exists()) {
                setSettings((prev) => ({ ...prev, [id]: snap.data().data }));
              }
              loadedCount++;
              if (loadedCount >= docs.length) setLoading(false);
            },
            (err) => {
              console.error(`Error loading site setting ${id}:`, err);
              loadedCount++;
              if (alive && loadedCount >= docs.length) setLoading(false);
            }
          )
        );

        fallbackTimer = setTimeout(() => {
          if (alive) setLoading(false);
        }, 5000);
      } catch (error) {
        // Settings are optional decoration — never block the app on them.
        console.warn("Site settings unavailable:", error?.message || error);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(fallbackTimer);
      unsubs.forEach((u) => u());
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
