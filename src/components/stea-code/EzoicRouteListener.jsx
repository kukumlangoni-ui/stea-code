import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const GA4_MEASUREMENT_ID = "G-9B54M5Q1S6";

/**
 * Ezoic SPA integration: React Router changes pages without a full reload,
 * so ad placeholders would never refresh on navigation. On every route
 * change we push a `showAds()` call onto Ezoic's command queue. The 150ms
 * delay lets React mount the new page's placeholder divs before Ezoic
 * tries to fill them.
 *
 * Also re-registers the GA4 page_view on each navigation — gtag only fires
 * one automatically on initial load, so SPA route changes would otherwise
 * go untracked. The first run is skipped for GA4 because index.html's
 * gtag('config') already counted that page view.
 */
export default function EzoicRouteListener() {
  const location = useLocation();
  const isFirstRun = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.ezstandalone && window.ezstandalone.cmd) {
        window.ezstandalone.cmd.push(function () {
          window.ezstandalone.showAds();
        });
      }

      if (isFirstRun.current) {
        isFirstRun.current = false;
      } else if (window.gtag) {
        window.gtag("config", GA4_MEASUREMENT_ID, {
          page_path: location.pathname + location.search,
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
