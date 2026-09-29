// Lightweight analytics and activity logging for STEA

// Helper for deferred execution
const runDeferred = (fn) => {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => fn().catch(console.error));
  } else {
    setTimeout(() => fn().catch(console.error), 2000);
  }
};

export const trackSiteEvent = (eventName, eventData = {}) => {
  runDeferred(async () => {
    try {
      const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import('../firebase.js');
      const db = getFirebaseDb();
      if (!db) return;
      
      const payload = {
        eventName,
        ...eventData,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        path: window.location.pathname
      };
      
      await addDoc(collection(db, 'siteAnalyticsEvents'), payload);
    } catch (e) {
      // Fail silently to not impact user experience
    }
  });
};

export const trackSearch = (query, normalizedQuery, resultCount, categoryIntent = null) => {
  runDeferred(async () => {
    if (!query) return;
    try {
      const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import('../firebase.js');
      const db = getFirebaseDb();
      if (!db) return;
      
      await addDoc(collection(db, 'siteSearchEvents'), {
        query,
        normalizedQuery,
        resultCount,
        categoryIntent,
        timestamp: serverTimestamp()
      });
    } catch (e) {}
  });
};

export const logAdminActivity = async (user, action, targetType, targetId, details = {}) => {
  try {
    if (!user) return;
    const { getFirebaseDb, collection, addDoc, serverTimestamp } = await import('../firebase.js');
    const db = getFirebaseDb();
    if (!db) return;
    
    await addDoc(collection(db, 'sitesAdminActivity'), {
      adminUid: user.uid,
      adminEmail: user.email || '',
      action,
      targetType,
      targetId,
      details,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Failed to log admin activity", e);
  }
};
