import { useEffect, useRef, useState } from "react";

/**
 * Adsterra 300x250 banner. Adsterra ships a classic <script> tag, which
 * React will not execute if pasted into JSX — so we append it to the DOM
 * ourselves on mount and remove it on unmount (SPA route changes).
 *
 * Fill detection: ad blockers or an unfilled network leave the slot blank.
 * We watch the container for an inserted <iframe>; if none appears within a
 * few seconds, we render null. The parent SmartAdSlot then reports an empty
 * DOM and releases its reserved minHeight, so a blocked/unfilled ad never
 * leaves a big white box or a layout gap.
 */
export default function AdsterraBanner() {
  const containerRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const el = containerRef.current;
    if (!el) return;
    if (el.childElementCount > 0) return; // already injected

    window.atOptions = {
      key: "41ea89b66c4b08b9021b9e2d3ee31642",
      format: "iframe",
      height: 250,
      width: 300,
      params: {},
    };

    const script = document.createElement("script");
    script.src = "https://bellnewyork.org/22/41ea89b66c4b08b9021b9e2d3ee31642";
    script.async = true;
    script.setAttribute("data-adsterra", "true");
    el.appendChild(script);

    let filled = false;
    const checkFilled = () => {
      if (el.querySelector("iframe")) {
        filled = true;
        return true;
      }
      return false;
    };

    // If no iframe appears in time, the unit is blocked or unfilled → hide it.
    const collapseTimer = setTimeout(() => {
      if (!filled && !checkFilled()) setCollapsed(true);
    }, 4000);

    const mo = new MutationObserver(() => {
      if (checkFilled()) {
        mo.disconnect();
        clearTimeout(collapseTimer);
      }
    });
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      clearTimeout(collapseTimer);
      el.innerHTML = "";
    };
  }, []);

  // Blocked / unfilled → render nothing so the parent slot collapses cleanly.
  if (collapsed) return null;

  return (
    <div
      ref={containerRef}
      className="adsterra-container"
      style={{ width: "300px", height: "250px", margin: "0 auto", overflow: "hidden" }}
    />
  );
}
