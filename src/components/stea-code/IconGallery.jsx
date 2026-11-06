import React, { useMemo, useRef, useState } from "react";
import * as LucideIcons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import SteaCodeMemberGate from "./SteaCodeMemberGate.jsx";
import { useCloudflareAuth } from "../../hooks/useCloudflareAuth.js";
import { iconsData, iconCategories } from "../../data/iconsData.js";

const STROKE = 1.75;

/**
 * "Live preview" set: icons whose real-world usage is motion, so the gallery
 * animates them on hover (classes defined in src/index.css).
 * Keyed by icon id — never by the lucide export name, because one glyph can
 * back several catalogue entries (e.g. `ball` and `circle-dot` are both
 * lucide's CircleDot) and only some of them should move.
 * Copying is unaffected — iconToSvg() always serializes a static SVG.
 */
const ANIMATION_MAP = {
  // ── Spinners / continuous rotation ──────────────────────────
  loader: "anim-spin",
  "loader-circle": "anim-spin",
  "circle-dashed": "anim-spin",
  orbit: "anim-spin",
  refresh: "anim-spin",
  undo: "anim-spin",
  repeat: "anim-spin",
  settings: "anim-spin",

  // ── Bells ring (they swing from the mount, not the centre) ──
  bell: "anim-ring",
  "alarm-clock": "anim-ring",

  // ── Signals & vitals pulse ──────────────────────────────────
  heart: "anim-pulse",
  "heart-pulse": "anim-pulse",
  activity: "anim-pulse",
  radio: "anim-pulse",
  "circle-dot": "anim-pulse",
  status: "anim-pulse",
  wifi: "anim-pulse",
  "battery-charging": "anim-pulse",
  flame: "anim-pulse",

  // ── Directional motion ──────────────────────────────────────
  "arrow-down": "anim-bounce",
  download: "anim-bounce",
  "cloud-download": "anim-bounce",
  "arrow-up": "anim-bounce",
  "chevrons-down": "anim-bounce",
  "arrow-right": "anim-bounce",
  send: "anim-bounce",
  more: "anim-bounce",
  "trending-up": "anim-bounce",
  "trending-down": "anim-bounce",

  // ── Physical shake / rattle ─────────────────────────────────
  volume: "anim-shake",
  mic: "anim-shake",
  bug: "anim-shake",

  // ── Half-turn flip ──────────────────────────────────────────
  hourglass: "anim-flip",
};

// NB: keyed by icon `id`, never by the lucide export name — see note above.
function animationFor(icon) {
  return ANIMATION_MAP[icon.id] || "";
}

/**
 * Serialize a lucide icon to a standalone, copy-paste-ready <svg> string.
 * `stroke="currentColor"` is kept so the pasted SVG inherits text color in
 * whatever project the user drops it into (same convention as lucide.dev).
 */
function iconToSvg(icon) {
  const Comp = LucideIcons[icon.lucide];
  if (!Comp) return "";
  return renderToStaticMarkup(
    <Comp
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/**
 * IconGallery — the "Icons" tab content for the marketplace.
 *
 * All icons are free (user-acquisition goal), but copying requires an email
 * login: logged-out clicks open the SteaCodeMemberGate OTP modal and the
 * originally-clicked icon is copied automatically once login succeeds.
 */
export default function IconGallery() {
  const { user } = useCloudflareAuth();
  const [activeCat, setActiveCat] = useState("All");
  const [query, setQuery] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success" | "error", msg }
  const pendingIconRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Per-category counts for the filter pills ("Loaders 14").
  const counts = useMemo(() => {
    const map = { All: iconsData.length };
    for (const icon of iconsData) {
      map[icon.category] = (map[icon.category] || 0) + 1;
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return iconsData.filter((icon) => {
      if (activeCat !== "All" && icon.category !== activeCat) return false;
      if (!q) return true;
      return (
        icon.name.toLowerCase().includes(q) ||
        icon.category.toLowerCase().includes(q) ||
        icon.id.toLowerCase().includes(q)
      );
    });
  }, [activeCat, query]);

  const showToast = (type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 1800);
  };

  const copyIcon = async (icon) => {
    const svg = iconToSvg(icon);
    if (!svg) {
      showToast("error", "Could not render this icon.");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(svg);
      } else {
        // Fallback for non-secure contexts / older browsers.
        const ta = document.createElement("textarea");
        ta.value = svg;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("success", `${icon.name} copied!`);
    } catch {
      showToast("error", "Copy failed. Please try again.");
    }
  };

  const handleIconClick = (icon) => {
    if (user?.email) {
      copyIcon(icon);
    } else {
      // Free, but gated: remember the icon so we can copy it post-login.
      pendingIconRef.current = icon;
      setGateOpen(true);
    }
  };

  const handleAuthenticated = () => {
    setGateOpen(false);
    const icon = pendingIconRef.current;
    pendingIconRef.current = null;
    // Small delay lets useCloudflareAuth re-read /api/auth/me first.
    if (icon) setTimeout(() => copyIcon(icon), 350);
  };

  return (
    <div className="w-full">
      {/* ---------- Search + filters ---------- */}
      <div className="mb-6! rounded-3xl border border-gray-200 bg-white p-4! shadow-sm sm:p-5!">
        <div className="relative">
          <LucideIcons.Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons (arrow, mail, settings…)"
            aria-label="Search icons"
            className="h-12 w-full rounded-2xl border border-transparent bg-gray-100 pl-11! pr-4! text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
          />
        </div>

        <div
          className="mt-4! flex gap-2 overflow-x-auto pb-1! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Icon categories"
        >
          {["All", ...iconCategories].map((cat) => {
            const isActive = activeCat === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4! py-1.5! text-[13px] font-medium transition-colors ${
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
                <span
                  className={`ml-1.5! text-[11px] tabular-nums ${
                    isActive ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  {counts[cat] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- Icon grid ---------- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
        {filtered.map((icon) => {
          const LucideComp = LucideIcons[icon.lucide];
          if (!LucideComp) return null;
          return (
            <button
              key={icon.id}
              type="button"
              onClick={() => handleIconClick(icon)}
              title={`Copy ${icon.name} SVG`}
              className="icon-card group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-4! rounded-2xl border border-gray-200 bg-white p-4! shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-yellow-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            >
              {/* Icons are free — no "Pro" tag. Logged-out visitors get a
                  subtle lock hinting that copying needs a sign-in. */}
              {!user?.email && (
                <LucideIcons.Lock
                  size={12}
                  className="absolute right-3 top-3 text-gray-300"
                  aria-label="Sign in to copy"
                />
              )}

              {/* 40px tile: the icon stays 36px so a rotating glyph never
                  clips its own bounds; hover zoom lives on this wrapper,
                  the animation lives on the svg, so they compose. */}
              <span className="flex h-10 w-10 items-center justify-center text-gray-800 transition-transform duration-200 group-hover:scale-110">
                <LucideComp
                  size={36}
                  strokeWidth={STROKE}
                  className={`h-9 w-9 ${animationFor(icon)}`}
                  aria-hidden="true"
                />
              </span>

              <span className="text-center text-sm font-medium leading-tight text-gray-600">
                {icon.name}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">
          No icons match “{query || activeCat}”.
        </div>
      )}

      {/* Email OTP gate — opened when a logged-out visitor clicks an icon */}
      <SteaCodeMemberGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          pendingIconRef.current = null;
        }}
        onAuthenticated={handleAuthenticated}
      />

      {/* "Copied!" toast */}
      {toast && (
        <div
          className={`fixed bottom-7 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border px-4! py-2.5! text-[13px] font-medium shadow-lg backdrop-blur ${
            toast.type === "success"
              ? "border-gray-800 bg-black/90 text-white"
              : "border-red-300 bg-red-50/95 text-red-600"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <LucideIcons.CheckCircle2 size={15} />
          ) : (
            <LucideIcons.AlertCircle size={15} />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
