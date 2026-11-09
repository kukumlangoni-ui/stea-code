import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * PubFuture sticky footer ad — fixed banner at the bottom of the screen,
 * shown site-wide (homepage, component pages, blog) but suppressed on
 * admin/staff/auth surfaces. The inner div is the placeholder PubFuture's
 * script will fill once the final tags are approved. Dismissible via the ×
 * button (per page view).
 */
export default function StickyFooterAd() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const suppressed =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/auth");

  // Re-show the banner when navigating between pages.
  useEffect(() => {
    setDismissed(false);
  }, [location.pathname]);

  // Auto-hide: after 30 seconds OR after the user has scrolled three full
  // viewport heights — whichever comes first. Keeps the unit policy-safe
  // and unobtrusive. The × close button remains as the manual path.
  useEffect(() => {
    if (suppressed || dismissed) return undefined;

    const timer = setTimeout(() => setDismissed(true), 30000);

    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 3) {
        setDismissed(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [suppressed, dismissed, location.pathname]);

  if (suppressed || dismissed) return null;

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
