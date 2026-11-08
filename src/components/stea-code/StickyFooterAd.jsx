import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * PubFuture sticky footer ad — fixed banner at the bottom of the screen,
 * blog routes only (/blog and /blog/:slug). The inner div is the
 * placeholder PubFuture's script will fill once the final tags are
 * approved. Dismissible via the × button (per page view).
 */
export default function StickyFooterAd() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const isBlogRoute =
    location.pathname === "/blog" || location.pathname.startsWith("/blog/");

  // Re-show the banner when navigating between blog pages.
  useEffect(() => {
    setDismissed(false);
  }, [location.pathname]);

  if (!isBlogRoute || dismissed) return null;

  return (
    <div
      className="pubfuture-sticky-footer-wrap"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
        background: "#ffffff",
        borderTop: "1px solid rgba(17, 24, 39, 0.12)",
        boxShadow: "0 -4px 16px rgba(17, 24, 39, 0.08)",
      }}
    >
      <button
        type="button"
        aria-label="Close ad"
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          top: "4px",
          right: "8px",
          zIndex: 1,
          width: "24px",
          height: "24px",
          padding: 0,
          border: "none",
          borderRadius: "50%",
          background: "rgba(17, 24, 39, 0.08)",
          color: "#111827",
          fontSize: "14px",
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        ×
      </button>
      <div id="pubfuture-sticky-footer" style={{ minHeight: "90px" }} />
    </div>
  );
}
