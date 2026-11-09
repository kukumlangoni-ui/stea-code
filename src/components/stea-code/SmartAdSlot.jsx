import { useEffect, useRef, useState } from "react";

/**
 * SmartAdSlot — lazy-loading, CLS-safe ad placeholder.
 *
 * - Renders nothing visible until 200px before the slot scrolls into the
 *   viewport (IntersectionObserver). Inactive + empty slots are hidden by
 *   CSS (:empty:not(.is-active)) so users never see blank gray boxes.
 * - Once active, reserves `minHeight` so an arriving ad causes zero layout
 *   shift — the space is already there.
 * - `data-ad-active="true"` is set when armed; network tag components can
 *   key off that (or be passed as children, which only render when active).
 */
export default function SmartAdSlot({ id, minHeight = 90, className = "", style, children }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={`sc-ad-slot${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      style={active ? { minHeight: `${minHeight}px`, ...style } : style}
      data-ad-active={active ? "true" : undefined}
    >
      {active ? children : null}
    </div>
  );
}
