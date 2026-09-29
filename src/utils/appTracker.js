import { getFirebaseDb, collection, addDoc, doc, setDoc, increment, serverTimestamp } from "../firebase.js";

const ANONYMOUS_KEY = "stea_anonymous_id";
const LAST_WEB_VISIT_KEY = "stea_last_web_visit_event_date";
const STANDALONE_SESSION_KEY = "stea_last_standalone_open_session";

// Unique session ID generated on load
const sessionId = Math.random().toString(36).substring(2, 15);

function getAnonymousId() {
  let id = localStorage.getItem(ANONYMOUS_KEY);
  if (!id) {
    id = "anon_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(ANONYMOUS_KEY, id);
  }
  return id;
}

export async function trackAppEvent(eventType, user = null) {
  const db = getFirebaseDb();
  if (!db) return;

  const anonymousId = getAnonymousId();
  const todayStr = new Date().toDateString();
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );

  // 1. Throttling checks
  if (eventType === "web_visit") {
    const lastWebVisit = localStorage.getItem(LAST_WEB_VISIT_KEY);
    if (lastWebVisit === todayStr) {
      return; // Already tracked today
    }
    localStorage.setItem(LAST_WEB_VISIT_KEY, todayStr);
  }

  if (eventType === "app_opened_standalone") {
    const lastSession = localStorage.getItem(STANDALONE_SESSION_KEY);
    if (lastSession === sessionId) {
      return; // Already tracked this session
    }
    localStorage.setItem(STANDALONE_SESSION_KEY, sessionId);
  }

  // 2. Build Event Data
  const eventData = {
    eventType,
    userId: user?.uid || null,
    email: user?.email || null,
    anonymousId,
    path: window.location.pathname,
    host: window.location.host,
    userAgent: navigator.userAgent,
    displayMode: isStandalone ? "standalone" : "browser",
    createdAt: serverTimestamp(),
  };

  try {
    // Save to detailed log collection
    await addDoc(collection(db, "stea_app_events"), eventData);

    // Try to update aggregates safely
    const metricsDocRef = doc(db, "stea_metrics", "app_install");
    const incrementField = 
      eventType === "install_prompt_shown" ? "installPromptShownCount" :
      eventType === "install_accepted" ? "installAcceptedCount" :
      eventType === "install_dismissed" ? "installDismissedCount" :
      eventType === "app_opened_standalone" ? "standaloneOpenCount" :
      eventType === "web_visit" ? "webVisitCount" : null;

    if (incrementField) {
      await setDoc(metricsDocRef, {
        [incrementField]: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    // Fail silently without disrupting user experience
    console.warn("[Tracking error]", err.message);
  }
}
