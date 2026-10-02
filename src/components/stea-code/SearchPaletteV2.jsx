/* ======================================================================
 * SearchPaletteV2 — ⌘K / Ctrl+K palette for steacode V2 (7 worlds).
 *
 * Groups: worlds (7) → group by section (Plan cats, Build categories,
 * Tools cats, Ship sections, Learn topics/types, Inspire groups,
 * Monetize cats) → results by world → items. Supports:
 *   - Live typing search, fuzzy-ish (simple lowercase multi-match).
 *   - Enter to go to world + prefilled filters.
 *   - Arrow / mouse selection.
 *   - Intent chips per world.
 *
 * Props:
 *   open, onClose, onNavigate({world, intent?, query?})
 *   data: V2 snapshot (patterns/resources/knowledge/inspiration + sections)
 *   initialQuery, initialIntent (optional seed)
 * =================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search, X, ArrowUpRight, Code2, Hammer, Ship, GraduationCap, Sparkles,
  ChevronRight,
} from "lucide-react";
import { V2_WORLDS } from "../../data/stea-code/v2Worlds.js";
import { useSteaCodeI18n, asSearchText } from "./useSteaCodeI18n.js";

/* ------------------ locks + focus trap ---------------------------- */

function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const doc = typeof document !== "undefined" ? document : null;
    if (!doc) return;
    const htmlEl = doc.documentElement;
    const { classList } = doc.body;
    classList.add("sc-locked-scroll");
    htmlEl.classList.add("sc-locked-scroll");
    const prev = [doc.body.style.overflow, htmlEl.style.overflow];
    doc.body.style.overflow = "hidden";
    htmlEl.style.overflow = "hidden";
    return () => {
      classList.remove("sc-locked-scroll");
      htmlEl.classList.remove("sc-locked-scroll");
      [doc.body.style.overflow, htmlEl.style.overflow] = prev;
    };
  }, [active]);
}

/* ------------------ scoring --------------------------------------- */

function multiMatch(text, query) {
  // All whitespace-or-comma-separated tokens must exist in text.
  const tokens = query.split(/[\s,，;；]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return true;
  const t = String(text || "").toLowerCase();
  return tokens.every((tok) => t.includes(tok));
}

/* ------------------ palette --------------------------------------- */

export default function SearchPaletteV2({
  open,
  onClose,
  onNavigate,
  data,
  initialQuery = "",
  initialIntent = null,
}) {
  useBodyLock(open);
  const { tLocal } = useSteaCodeI18n();
  const [q, setQ] = useState(initialQuery);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ(initialQuery || "");
      setActiveIdx(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  /* Sections: world header + section chips + results. */
  const sections = useMemo(() => buildSections(data, q, tLocal, initialIntent), [data, q, tLocal, initialIntent]);
  const flat = useMemo(() => flatten(sections), [sections]);

  useEffect(() => {
    setActiveIdx((idx) => Math.max(0, Math.min(idx, flat.length - 1)));
  }, [flat.length]);

  const pick = (entry) => {
    if (!entry) return;
    if (entry.kind === "world") onNavigate({ world: entry.world });
    else if (entry.kind === "section") onNavigate({ world: entry.world, query: entry.sectionQuery, intent: entry.intent });
    else if (entry.kind === "item") onNavigate({ world: entry.world, query: entry.itemQuery, intent: entry.intent });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(flat[activeIdx]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(flat.length - 1);
    }
  };

  // scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-active='true']");
    if (selected) selected.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div className="sc-v2pal" role="dialog" aria-modal="true" aria-label="Search steacode V2">
      <button className="sc-v2pal-bg" aria-label="Close search" onClick={onClose} />
      <div className="sc-v2pal-panel" role="region" aria-label="Search results">
        <div className="sc-v2pal-input-row">
          <Search size={16} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search 7 developer worlds: Plan · Build · Tools · Ship · Learn · Inspire · Grow"
            aria-label="Search steacode V2"
            autoComplete="off"
          />
          <button
            type="button"
            className="sc-v2pal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div ref={listRef} className="sc-v2pal-list">
          {flat.length === 0 ? (
            <div className="sc-v2pal-empty">
              <Sparkles size={18} aria-hidden="true" />
              <div>
                <strong>No matches.</strong>
                <p style={{ margin: "2px 0 0" }}>Try another keyword, or select a world below.</p>
                <div className="sc-v2pal-empty-actions">
                  {V2_WORLDS.map((w) => (
                    <button
                      type="button"
                      key={w.id}
                      className="sc-v2-chip"
                      style={{ borderColor: `${w.accent}33`, color: w.accent }}
                      onClick={() => pick({ kind: "world", world: w.id })}
                    >
                      {tLocal(w.title)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {sections.map((section) => (
            <SectionRender
              key={section.key}
              section={section}
              flat={flat}
              activeIdx={activeIdx}
              onPick={pick}
            />
          ))}
        </div>

        <footer className="sc-v2pal-foot">
          <span>↑↓ navigate · Enter open · Esc close</span>
          <span className="sc-v2pal-foot-sub">
            STORAGE: Firestore + curated fallbacks · Offline-ready cache
          </span>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function SectionRender({ section, flat, activeIdx, onPick }) {
  const W = V2_WORLDS.find((w) => w.id === section.world);
  const Icon = W?.icon || ArrowUpRight;
  const activeSet = new Set(
    flat
      .filter((f) => f.sectionKey === section.key)
      .map((f) => ({ flatIdx: f.flatIdx, ref: f.ref }))
  );
  const flatIndexById = new Map(
    flat.map((f, i) => [f.kind + ":" + f.sectionKey + ":" + (f.ref || ""), f.flatIdx || i])
  );
  return (
    <div className="sc-v2pal-section">
      <button
        type="button"
        className="sc-v2pal-world-head"
        onClick={() => onPick({ kind: "world", world: section.world })}
        data-active={flat.findIndex((f) => f.kind === "world" && f.world === section.world) === flat.findIndex((f, i) => i === activeIdx && f.kind === "world" && f.world === section.world) ? "true" : undefined}
      >
        <span className="sc-v2pal-world-icon" style={{ background: `${W?.accent || "#888"}15`, color: W?.accent || "#aaa" }}>
          <Icon size={14} />
        </span>
        <div className="sc-v2pal-world-texts">
          <span className="sc-v2pal-eyebrow" style={{ color: W?.accent }}>{section.eyebrow}</span>
          <strong>{section.title}</strong>
          <small style={{ opacity: 0.6 }}>{section.count || 0} items</small>
        </div>
        <ChevronRight size={14} />
      </button>

      {section.intentChips && section.intentChips.length > 0 ? (
        <div className="sc-v2pal-chips" role="list">
          {section.intentChips.map((chip, i) => {
            const ref = `intent:${chip.label}`;
            const idx = [...activeSet].map((x) => x.flatIdx)[0] + 1 + i; // fallback; flat will be correct
            const entry = flat.find((f) => f.kind === "section" && f.sectionKey === section.key && f.ref === ref);
            return (
              <button
                type="button"
                key={ref}
                className="sc-v2-chip"
                style={{ borderColor: `${W?.accent || "#888"}22`, color: W?.accent || "#aaa" }}
                data-active={entry && entry.flatIdx === activeIdx ? "true" : undefined}
                onClick={() => onPick(entry || { kind: "section", world: section.world, intent: chip.label })}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {section.items.length === 0 ? null : (
        <ul className="sc-v2pal-items" role="listbox">
          {section.items.map((item) => {
            const ref = item.ref;
            const entry = flat.find((f) => f.kind === "item" && f.sectionKey === section.key && f.ref === ref);
            return (
              <li key={ref} role="option" aria-selected={entry && entry.flatIdx === activeIdx}>
                <button
                  type="button"
                  className={"sc-v2pal-item" + (entry && entry.flatIdx === activeIdx ? " is-active" : "")}
                  data-active={entry && entry.flatIdx === activeIdx ? "true" : undefined}
                  onClick={() => onPick(entry || { kind: "item", world: section.world, itemQuery: item.title })}
                >
                  <span className="sc-v2pal-item-title">{item.title}</span>
                  <span className="sc-v2pal-item-sub">{item.sub}</span>
                  <span className="sc-v2pal-item-tags">{item.tags}</span>
                  <ArrowUpRight size={12} className="sc-v2pal-item-arrow" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------ build sections -------------------------------- */

function buildSections(data, q, tLocal, intent) {
  const patterns = Array.isArray(data?.patterns) ? data.patterns : [];
  const resources = Array.isArray(data?.resources) ? data.resources : [];
  const knowledge = Array.isArray(data?.knowledge) ? data.knowledge : [];
  const inspiration = Array.isArray(data?.inspiration) ? data.inspiration : [];
  const query = String(q || "").trim().toLowerCase();
  const sections = [];

  for (const W of V2_WORLDS) {
    const intentPresets = (W.intentPresets || []).map((p) => ({ label: tLocal(p) }));
    let items = [];
    let list = [];
    if (W.id === "build") list = patterns;
    else if (W.id === "plan") list = resources.filter((r) => r.buckets.includes("plan"));
    else if (W.id === "tools") list = resources.filter((r) => r.buckets.includes("tools"));
    else if (W.id === "ship") list = resources.filter((r) => r.buckets.includes("ship"));
    else if (W.id === "monetize") list = resources.filter((r) => r.buckets.includes("monetize"));
    else if (W.id === "learn") list = knowledge;
    else if (W.id === "inspire") list = inspiration;

    items = list
      .map((it) => shapeItem(it, W.id, tLocal))
      .filter((row) => !query || multiMatch(`${row.title} ${row.sub} ${row.tags} ${row.search || ""}`, query));
    // Limit to 8 items per world to keep palette usable.
    items = items.slice(0, 8);

    sections.push({
      key: W.id,
      world: W.id,
      eyebrow: W.eyebrow,
      title: tLocal(W.title),
      count: list.length,
      intentChips: intentPresets,
      items,
    });
  }

  // Re-order: world with a matched item first; then intent matching.
  sections.sort((a, b) => {
    const ai = Math.max(0, (a.items.length > 0 ? 1 : 0) + (q && a.title.toLowerCase().includes(q) ? 1 : 0));
    const bi = Math.max(0, (b.items.length > 0 ? 1 : 0) + (q && b.title.toLowerCase().includes(q) ? 1 : 0));
    if (ai !== bi) return bi - ai;
    return 0;
  });

  return sections;
}

function shapeItem(it, world, tLocal) {
  switch (world) {
    case "build":
      return {
        ref: String(it.id),
        title: tLocal(it.title),
        sub: `${it.framework || "Mixed"} · ${it.category || "Pattern"}${it.difficulty ? ` · ${it.difficulty}` : ""}`,
        tags: (it.tags || []).join(" · "),
        itemQuery: tLocal(it.title),
        search: [
          asSearchText(it.title),
          asSearchText(it.summary),
          asSearchText(it.description),
          it.category || "",
          it.framework || "",
          it.language || "",
          (it.tags || []).join(" "),
        ].join(" "),
      };
    case "plan":
    case "monetize":
    case "tools":
    case "ship":
      return {
        ref: String(it.id),
        title: tLocal(it.name),
        sub: `${(it.categories || []).slice(0, 2).join(" · ") || "Resource"} · ${it.pricing || ""}`,
        tags: (it.tags || []).join(" · ") + " " + (it.platforms || []).join(" · "),
        itemQuery: tLocal(it.name),
        search: [
          asSearchText(it.name),
          asSearchText(it.description),
          asSearchText(it.bestFor),
          (it.categories || []).join(" "),
          (it.tags || []).join(" "),
          (it.platforms || []).join(" "),
          it.pricing || "",
        ].join(" "),
      };
    case "learn":
      return {
        ref: String(it.id),
        title: tLocal(it.title),
        sub: `${it.type || "Quick Tip"} · ${it.level || "Beginner"} · ${(it.topics || []).join("/")}`,
        tags: (it.topics || []).join(" · ") + " " + (it.content || "").slice(0, 120),
        itemQuery: tLocal(it.title),
        search: [
          asSearchText(it.title),
          asSearchText(it.summary),
          asSearchText(it.description),
          (it.topics || []).join(" "),
          it.type || "",
          it.level || "",
          (it.tags || []).join(" "),
        ].join(" "),
      };
    case "inspire":
      return {
        ref: String(it.id),
        title: tLocal(it.title),
        sub: `${it.category || ""}${it.style ? " · " + it.style : ""} · ${it.platform || "Web"}`,
        tags: (it.relatedPatterns || []).join(" · "),
        itemQuery: tLocal(it.title),
        search: [
          asSearchText(it.title),
          asSearchText(it.summary),
          asSearchText(it.description),
          it.category || "",
          it.style || "",
          it.platform || "",
          (it.relatedPatterns || []).join(" "),
          (it.tags || []).join(" "),
        ].join(" "),
      };
    default:
      return {
        ref: String(it.id),
        title: asSearchText(it.title || ""),
        sub: "",
        tags: "",
        itemQuery: asSearchText(it.title || ""),
        search: asSearchText(it.title) + " " + asSearchText(it.description),
      };
  }
}

/* ------------------ flatten for keyboard nav ---------------------- */

function flatten(sections) {
  const flat = [];
  for (const s of sections) {
    flat.push({ kind: "world", sectionKey: s.key, world: s.world, ref: "world", flatIdx: flat.length });
    for (const chip of s.intentChips || []) {
      flat.push({
        kind: "section", sectionKey: s.key, world: s.world, ref: `intent:${chip.label}`, intent: chip.label, flatIdx: flat.length,
      });
    }
    for (const it of s.items || []) {
      flat.push({
        kind: "item",
        sectionKey: s.key,
        world: s.world,
        ref: it.ref,
        itemQuery: it.itemQuery,
        title: it.title,
        flatIdx: flat.length,
      });
    }
  }
  return flat;
}
