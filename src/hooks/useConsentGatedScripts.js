/* ======================================================================
 * STEA Code — useConsentGatedScripts Hook
 * Conditionally loads and enables third-party scripts (Ads, Analytics)
 * strictly based on user consent (GDPR / UK GDPR / CCPA).
 * =================================================================== */

import { useEffect, useState } from "react";
import { getConsent, onConsentChange } from "../utils/cookieConsent.js";

export function useConsentGatedScripts() {
  const [consent, setConsentState] = useState(getConsent);

  useEffect(() => {
    // Listen for consent choice updates
    const unsubscribe = onConsentChange((updatedConsent) => {
      setConsentState(updatedConsent);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // 1. Analytics gating
    if (consent.analytics) {
      if (typeof window !== "undefined") {
        window.__STEA_ANALYTICS_ENABLED__ = true;
      }
    } else {
      if (typeof window !== "undefined") {
        window.__STEA_ANALYTICS_ENABLED__ = false;
      }
    }

    // 2. Advertising / Google AdSense gating
    if (consent.advertising) {
      if (typeof window !== "undefined" && !document.getElementById("stea-adsense-script")) {
        const pubId = import.meta.env?.VITE_ADSENSE_PUBLISHER_ID || "ca-pub-2255709876687408";
        const script = document.createElement("script");
        script.id = "stea-adsense-script";
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
    }
  }, [consent]);

  return consent;
}
