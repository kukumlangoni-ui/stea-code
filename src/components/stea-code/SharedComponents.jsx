import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

/**
 * Button system — consistent, accessible, and premium.
 *
 * Variants:
 *   primary     → STEA gold, dark text
 *   secondary   → dark elevated bg, 1px border
 *   ghost       → transparent bg
 *   icon        → compact square button (for icon-only actions)
 *
 * Sizes:
 *   sm / md / lg
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  as: Component = "button",
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const base =
    "sc-btn sc-btn-" +
    variant +
    " sc-btn-" +
    size +
    " " +
    (loading ? "sc-btn-loading" : "") +
    " " +
    className;
  return (
    <Component className={base.trim()} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="sc-btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="1em" height="1em" style={{ animation: "sc-spin 0.8s linear infinite", display: "block" }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity=".25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className="sc-btn-label">{children}</span>
    </Component>
  );
}

/**
 * SectionHero — internal section hero component (non-homepage).
 *
 * Rules:
 *   220–340px tall, dark, subtle grid, soft beam, gold ambient glow.
 *   Liquid WebGL stays homepage-only.
 */
export function SectionHero({ eyebrow, headline, subtitle, searchBar, extra = null }) {
  const head = Array.isArray(headline) ? headline : [headline];
  return (
    <section className="sc-internal-hero" aria-labelledby="sc-section-title">
      <div className="sc-hero-grid" aria-hidden="true" />
      <div className="sc-hero-beam" aria-hidden="true" />
      <div className="sc-hero-glow" aria-hidden="true" />
      <div className="sc-hero-line" aria-hidden="true" />

      <div className="sc-internal-hero-inner">
        {eyebrow && (
          <motion.span
            className="sc-eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {eyebrow}
          </motion.span>
        )}

        <motion.h1
          id="sc-section-title"
          className="sc-section-headline"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
        >
          {head.map((line, i) => (
            <span key={i} className={i === head.length - 1 ? "accent" : ""}>
              {line}
            </span>
          ))}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="sc-section-subtitle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
          >
            {subtitle}
          </motion.p>
        )}

        {searchBar && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
            className="sc-hero-search-wrap"
          >
            {searchBar}
          </motion.div>
        )}

        {extra}
      </div>
    </section>
  );
}

/**
 * FilterChips — horizontally scrollable filter chips.
 * Filters are active / inactive, clickable, keyboard-accessible.
 */
export function FilterChips({ options, value, onChange, label = "Filter by" }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="sc-filter-wrap" role="group" aria-label={label}>
      <div className="sc-filter-chips" style={{ scrollbarWidth: "none" }}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={"sc-chip" + (active ? " active" : "")}
              aria-pressed={active}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * EmptyState — consistent empty / no-results / fallback state.
 */
export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={"sc-empty" + (compact ? " sc-empty-compact" : "")} role="status" aria-live="polite">
      {Icon && (
        <div className="sc-empty-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
      <div className="sc-empty-copy">
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * SkeletonCards — card-shaped skeletons that match real card dimensions.
 */
export function SkeletonCards({ count = 6, cols = 3 }) {
  const items = new Array(Math.max(1, count)).fill(0);
  return (
    <div
      className="sc-skeleton-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {items.map((_, i) => (
        <div className="sc-skeleton-card" key={i}>
          <div className="sc-skeleton-thumb sc-shimmer" />
          <div className="sc-skeleton-line sc-shimmer w60" />
          <div className="sc-skeleton-line sc-shimmer w90" />
          <div className="sc-skeleton-line sc-shimmer w70" />
        </div>
      ))}
    </div>
  );
}

/**
 * SearchBar — small consistent search field with Cmd+K hint.
 */
export function SearchBar({ value, onChange, placeholder = "Search…", onFocus, id }) {
  return (
    <label className="sc-search" htmlFor={id}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocus}
        spellCheck={false}
        autoComplete="off"
      />
      <span className="sc-search-kbd" aria-hidden="true">⌘K</span>
    </label>
  );
}

/**
 * ArrowLink — external / navigate arrow that moves 2px on hover.
 */
export function ArrowLink({ children, className = "", ...rest }) {
  return (
    <span className={"sc-arrow-link " + className} {...rest}>
      <span className="sc-arrow-link-label">{children}</span>
      <ArrowRight size={14} aria-hidden="true" />
    </span>
  );
}
