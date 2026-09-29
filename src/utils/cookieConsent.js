/* ======================================================================
 * STEA Code — Cookie Consent Storage & Event Utility (GDPR / UK GDPR / CCPA)
 * =================================================================== */

const CONSENT_STORAGE_KEY = "stea_cookie_consent_v1";
const CONSENT_EVENT_NAME = "stea-cookie-consent-change";

/**
 * Returns the current consent state.
 * @returns {{ necessary: boolean, analytics: boolean, advertising: boolean, timestamp: number|null }}
 */
export function getConsent() {
  if (typeof window === "undefined") {
    return { necessary: true, analytics: false, advertising: false, timestamp: null };
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return { necessary: true, analytics: false, advertising: false, timestamp: null };
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        advertising: Boolean(parsed.advertising),
        timestamp: parsed.timestamp || null,
      };
    }
  } catch (err) {
    console.warn("[STEA] Failed to read cookie consent:", err);
  }

  return { necessary: true, analytics: false, advertising: false, timestamp: null };
}

/**
 * Checks whether the user has previously recorded a consent choice.
 * @returns {boolean}
 */
export function hasConsented() {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.timestamp);
  } catch {
    return false;
  }
}

/**
 * Stores the user's consent choice in localStorage and notifies subscribers.
 * @param {{ analytics?: boolean, advertising?: boolean }} choices
 */
export function setConsent({ analytics = false, advertising = false } = {}) {
  if (typeof window === "undefined") return;

  const data = {
    version: 1,
    timestamp: Date.now(),
    necessary: true,
    analytics: Boolean(analytics),
    advertising: Boolean(advertising),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[STEA] Failed to save cookie consent:", err);
  }

  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: data }));
  } catch {
    // ignore
  }
}

/**
 * Subscribes to consent updates.
 * @param {(consent: { necessary: boolean, analytics: boolean, advertising: boolean, timestamp: number|null }) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function onConsentChange(callback) {
  if (typeof window === "undefined" || typeof callback !== "function") {
    return () => {};
  }

  const handler = (e) => {
    callback(e.detail || getConsent());
  };

  const storageHandler = (e) => {
    if (e.key === CONSENT_STORAGE_KEY) {
      callback(getConsent());
    }
  };

  window.addEventListener(CONSENT_EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
