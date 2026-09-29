import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronRight, Braces, Wrench, Server, Globe2, Palette, Sparkles, Laptop, FileText, ArrowUpRight } from "lucide-react";
import { GATEWAYS, getGateway } from "../../data/stea-code/gateways.js";

const KIND_ICON = {
  Code: Braces,
  Tips: Wrench,
  Hosting: Server,
  Domains: Globe2,
  Inspiration: Palette,
  UI: Sparkles,
  Essentials: Laptop,
  Guides: FileText,
  Tool: Laptop,
  Link: ArrowUpRight,
};

function safeIcon(kind) {
  if (kind && KIND_ICON[kind]) return KIND_ICON[kind];
  if (kind) {
    // Map gateway id to icon
    const g = getGateway(kind);
    if (g) return g.icon;
  }
  return ArrowUpRight;
}

function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const doc = typeof document !== "undefined" ? document : null;
    if (!doc) return;
    const htmlEl = doc.documentElement;
    const { classList } = doc.body;
    classList.add("sc-locked-scroll");
    htmlEl.classList.add("sc-locked-scroll");
    const prevOverflow = [doc.body.style.overflow, htmlEl.style.overflow];
    doc.body.style.overflow = "hidden";
    htmlEl.style.overflow = "hidden";
    return () => {
      classList.remove("sc-locked-scroll");
      htmlEl.classList.remove("sc-locked-scroll");
      [doc.body.style.overflow, htmlEl.style.overflow] = prevOverflow;
    };
  }, [active]);
}

function useFocusTrap(rootRef, onClose) {
  useEffect(() => {
    const root = rootRef?.current;
    if (!root) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        // handled separately at higher priority; safe to also fire close here
      }
      if (e.key !== "Tab") return;
      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, false);
    return () => window.removeEventListener("keydown", onKey, false);
  }, [rootRef, onClose]);
}

/**
 * SearchPalette — Cmd/Ctrl+K Raycast-style overlay.
 *
 * Features:
 *   - Search across Code, Tips, Hosting, Domains, Inspiration, UI, Essentials, Guides
 *   - Results grouped by type
 *   - Arrow Up/Down navigation, Enter to open, Esc to close
 *   - Works on current in-memory data (no heavy library)
 */
export default function SearchPalette({
  open,
  onClose,
  onNavigate,
  dataSources = {
    code: [],
    tips: [],
    hosting: [],
    inspiration: [],
    ui: [],
    essentials: [],
    guides: [],
    domains: [
      { id: "domains-quick", title: "Domain basics", kind: "Domains", description: "DNS, records, registrars, propagation" },
      { id: "domains-records", title: "DNS Records", kind: "Domains", description: "A, AAAA, CNAME, TXT, MX, NS explained" },
      { id: "domains-mistakes", title: "Common domain mistakes", kind: "Domains", description: "www, http, TTL, privacy" },
    ],
  },
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [flashInit, setFlashInit] = useState(0);

  useBodyLock(open);
  useFocusTrap(containerRef, onClose);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setFlashInit((v) => v + 1);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open, flashInit]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const results = useMemo(() => buildResults(dataSources, q), [dataSources, q]);
  const flat = useMemo(() => results.flatMap((g) => g.items), [results]);

  // Clamp cursor and sync arrow keys
  useEffect(() => {
    if (cursor > flat.length - 1) setCursor(Math.max(0, flat.length - 1));
  }, [flat.length, cursor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(flat.length - 1, c + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[cursor];
        if (item) {
          onClose();
          if (item.navigateTo) {
            onNavigate(item.navigateTo);
          } else if (item.url) {
            try {
              if (item.url.startsWith("/code")) {
                const params = new URL(item.url, window.location.origin).searchParams;
                const v = params.get("view");
                if (v) onNavigate(v);
                else onNavigate(null);
              } else {
                window.open(item.url, "_blank", "noopener,noreferrer");
              }
            } catch (_) {
              window.open(item.url, "_blank", "noopener,noreferrer");
            }
          }
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, flat, cursor, onNavigate, onClose]);

  if (!open) return null;

  let flatIdx = -1;

  return createPortal(
    <div className="sc-palette-shell" role="dialog" aria-modal="true" aria-label="Search STEA Code">
      <button
        type="button"
        className="sc-palette-backdrop"
        onClick={onClose}
        aria-label="Close search"
      />
      <div className="sc-palette" role="search" ref={containerRef}>
        <header className="sc-palette-head">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            placeholder="Search code, tips, hosting, domains, inspiration, UI, tools, guides…"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="sc-icon-btn"
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </header>

        <div className="sc-palette-body" role="listbox">
          {flat.length === 0 ? (
            <div className="sc-palette-empty">
              <Search size={18} />
              <span>No results. Try another search.</span>
            </div>
          ) : (
            results.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.kind} className="sc-palette-group">
                  <div className="sc-palette-group-label">{group.kind}</div>
                  {group.items.map((item) => {
                    flatIdx++;
                    const localIdx = flatIdx;
                    const active = localIdx === cursor;
                    const Icon = safeIcon(item.kind);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={"sc-palette-item" + (active ? " active" : "")}
                        onClick={() => {
                          onClose();
                          if (item.navigateTo) onNavigate(item.navigateTo);
                          else if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <span className="sc-palette-item-icon" aria-hidden="true">
                          <Icon size={16} />
                        </span>
                        <span className="sc-palette-item-copy">
                          <strong>{highlight(item.title, q)}</strong>
                          {item.description && <span>{highlight(item.description, q)}</span>}
                        </span>
                        {item.navigateTo ? (
                          <span className="sc-palette-item-meta">View →</span>
                        ) : (
                          <ChevronRight size={14} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            )
          )}
        </div>

        <footer className="sc-palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function buildResults(sources, rawQuery) {
  const q = rawQuery.trim().toLowerCase();

  // Quick jump: if query is empty, show gateway shortcuts first
  const quickJumps = q
    ? []
    : GATEWAYS.map((g) => ({
        id: "jump-" + g.id,
        title: g.title,
        description: g.description,
        kind: "Jump to",
        navigateTo: g.id,
        searchable: g.title + " " + g.description,
      }));

  const toMap = (items, kind, extra = {}) =>
    (items || []).map((it) => ({
      id: kind + "-" + (it.id || it.title || Math.random().toString(36).slice(2)),
      title: it.title || it.name || "Untitled",
      description: it.description || it.benefit || it.whyUseful || it.bestFor || it.meaning || "",
      kind,
      url: it.url || it.guideUrl || "",
      searchable:
        `${it.title || ""} ${it.name || ""} ${it.description || ""} ${it.category || ""} ${it.framework || ""} ${it.language || ""} ${it.bestFor || ""} ${it.desc || ""} ${Array.isArray(it.tags) ? it.tags.join(" ") : it.tags || ""}`.toLowerCase(),
      ...extra,
    }));

  const code = toMap(sources.code || [], "Code", { navigateTo: "code" });
  const tips = toMap(sources.tips || [], "Tips", { navigateTo: "tips" });
  const hosting = toMap(sources.hosting || [], "Hosting", { navigateTo: "hosting" });
  const domains = toMap(sources.domains || [], "Domains", { navigateTo: "domains" });
  const inspiration = toMap(sources.inspiration || [], "Inspiration", { navigateTo: "inspiration" });
  const ui = toMap(sources.ui || [], "UI", { navigateTo: "ui" });
  const essentials = toMap(
    (sources.essentials || []).map((e) => ({ ...e, title: e.name })),
    "Essentials",
    { navigateTo: "essentials" }
  );
  const guides = toMap(sources.guides || [], "Guides", { navigateTo: "guides" });

  const all = [
    ...quickJumps,
    ...code,
    ...tips,
    ...hosting,
    ...domains,
    ...inspiration,
    ...ui,
    ...essentials,
    ...guides,
  ];

  const filtered = q
    ? all.filter((i) => (i.searchable || "").includes(q))
    : all;

  const groupOrder = ["Jump to", "Code", "Tips", "Hosting", "Domains", "Inspiration", "UI", "Essentials", "Guides"];
  const grouped = {};
  groupOrder.forEach((k) => (grouped[k] = []));
  filtered.forEach((item) => {
    if (!grouped[item.kind]) grouped[item.kind] = [];
    grouped[item.kind].push(item);
  });

  // Limit per group for sensible UX
  return groupOrder
    .concat(Object.keys(grouped).filter((k) => !groupOrder.includes(k)))
    .map((kind) => ({ kind, items: (grouped[kind] || []).slice(0, kind === "Jump to" ? 8 : 5) }))
    .filter((g) => g.items.length > 0);
}

function highlight(text, query) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const t = String(text || "");
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return t;
  return (
    <span>
      {t.slice(0, idx)}
      <mark className="sc-mark">{t.slice(idx, idx + q.length)}</mark>
      {t.slice(idx + q.length)}
    </span>
  );
}
