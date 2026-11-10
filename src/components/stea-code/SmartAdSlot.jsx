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
 * - A slot with NO children collapses to zero height (no reserved space, no
 *   margins) so awaiting an approved ad network leaves no blank gap.
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

  // Only reserve space (minHeight + caller layout style) when the slot actually
  // has ad content. An empty slot renders a bare div so it takes zero height
  // and contributes no margin — inline styles would otherwise defeat the
  // `:empty` collapse rule in CSS.
  const hasContent = Boolean(children);
  const resolvedStyle = hasContent
    ? active
      ? { minHeight: `${minHeight}px`, ...style }
      : style
    : undefined;

  return (
    <div
      ref={ref}
      id={id}
      className={`sc-ad-slot${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      style={resolvedStyle}
      data-ad-active={active ? "true" : undefined}
    >
      {active && hasContent ? children : null}
    </div>
  );
}
