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
  // Tracks whether the slot's DOM actually contains a rendered element. A child
  // component (e.g. AdsterraBanner) can render null when its ad is blocked or
  // unfilled — in that case the slot must stop reserving space and collapse.
  const [domEmpty, setDomEmpty] = useState(true);

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

  // Watch the real DOM. The `children` prop is always truthy (a JSX element),
  // so it can't tell us whether the ad actually rendered — childElementCount
  // can. When the ad collapses to null, childElementCount drops to 0 and we
  // release the reserved minHeight so no blank gap is left behind.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setDomEmpty(el.childElementCount === 0);
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true });
    return () => mo.disconnect();
  }, []);

  // Reserve space (minHeight + caller layout style) only while the slot holds
  // a visible ad. An empty slot renders a bare div (zero height, no margin);
  // inline styles would otherwise defeat the `:empty` collapse rule in CSS.
  const hasContent = Boolean(children) && !domEmpty;
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
      {active && children ? children : null}
    </div>
  );
}
