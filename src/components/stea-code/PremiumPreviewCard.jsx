import { useState } from "react";
import { Heart, Bookmark, RotateCw } from "lucide-react";

/**
 * Premium product preview card (Dribbble / Figma Community style).
 *
 * Self-contained presentational component — only requires `react` and
 * `lucide-react`. Drop it on any page or route.
 *
 * Usage:
 *   import PremiumPreviewCard from "./components/stea-code/PremiumPreviewCard";
 *   <PremiumPreviewCard />
 */

/** Shared classes for the white circular icon buttons (Like / Save / Refresh). */
const WHITE_CIRCLE_BTN =
  "bg-white border border-gray-200 shadow-sm p-3 rounded-full text-gray-700 " +
  "transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:shadow-md";

/** Placeholder "M78" logo rendered inside the sandboxed preview iframe.
 *  Has its own entrance animation, so every refresh visibly replays it. */
const LOGO_SRC_DOC = `<!doctype html><html><head><style>
  html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
  .mark{display:flex;align-items:center;gap:14px;animation:pop .55s cubic-bezier(.2,.8,.3,1) both}
  .box{width:56px;height:56px;background:#0A0A0A;color:#F3E76C;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:28px;border-radius:10px}
  .word{font-weight:800;font-size:48px;letter-spacing:-.02em;color:#0A0A0A}
  @keyframes pop{from{opacity:0;transform:translateY(10px) scale(.95)}to{opacity:1;transform:none}}
</style></head>
<body><div class="mark"><div class="box">M</div><div class="word">78</div></div></body></html>`;

const META_COLUMNS = [
  { bold: "M78", label: "Publisher" },
  { bold: "Logo Design", label: "Project" },
  { bold: "Type08", label: "_026" },
];

export default function PremiumPreviewCard() {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-white p-6 font-sans sm:p-10">
      <div className="mx-auto max-w-5xl">
        {/* ── Header Row ─────────────────────────────────────────────── */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Left — creator info */}
          <div className="flex items-center gap-3">
            {/* Circular avatar with the bold ring from the reference shot.
                Swap the initials for an <img> when a real photo is available. */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-gray-100 text-sm font-bold text-gray-900">
              T8
            </div>
            <div className="leading-tight">
              <p className="font-bold text-gray-900">Type08 (Alen Pavlovic)</p>
              <p className="mt-0.5 text-sm">
                <span className="font-medium text-green-600">Available for work</span>
                <span className="mx-1.5 text-gray-400">·</span>
                <a
                  href="#follow"
                  className="text-gray-500 transition-colors hover:text-gray-900"
                >
                  Follow
                </a>
              </p>
            </div>
          </div>

          {/* Right — action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-pressed={isLiked}
              aria-label="Like"
              onClick={() => setIsLiked((v) => !v)}
              className={WHITE_CIRCLE_BTN}
            >
              <Heart
                className={`h-5 w-5 transition-colors duration-200 ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </button>

            <button
              type="button"
              aria-pressed={isSaved}
              aria-label="Save"
              onClick={() => setIsSaved((v) => !v)}
              className={WHITE_CIRCLE_BTN}
            >
              <Bookmark
                className={`h-5 w-5 transition-colors duration-200 ${
                  isSaved ? "fill-gray-900 text-gray-900" : ""
                }`}
              />
            </button>

            <button
              type="button"
              className="rounded-full bg-[#0A0A0A] px-6 py-3 font-medium text-white transition-colors hover:bg-black"
            >
              Get in touch
            </button>
          </div>
        </header>

        {/* ── Yellow Preview Card ────────────────────────────────────── */}
        <section className="relative rounded-2xl bg-[#F3E76C] p-8 sm:p-12">
          {/* Refresh — absolutely positioned top-right of the yellow card */}
          <button
            type="button"
            aria-label="Refresh preview"
            onClick={() => setRefreshKey((k) => k + 1)}
            className={`absolute right-4 top-4 ${WHITE_CIRCLE_BTN}`}
          >
            <RotateCw className="h-5 w-5" />
          </button>

          {/* Everything inside this keyed div is remounted on refresh, so the
              iframe document reloads from scratch and replays its animation. */}
          <div key={refreshKey} className="flex min-h-[440px] flex-col">
            {/* Preview stage — placeholder iframe; replace srcDoc with a real
                preview URL/srcDoc when wiring up actual product content */}
            <div className="flex flex-1 items-center justify-center py-8">
              <iframe
                title="M78 logo preview"
                srcDoc={LOGO_SRC_DOC}
                sandbox=""
                loading="lazy"
                className="h-56 w-full max-w-md sm:h-64"
              />
            </div>

            {/* Meta grid — thin black rule above each column */}
            <div className="grid grid-cols-3 gap-8">
              {META_COLUMNS.map((col) => (
                <div key={col.label} className="border-t border-black pt-3">
                  <p className="font-bold text-gray-900">{col.bold}</p>
                  <p className="mt-1 text-sm text-gray-800">{col.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
