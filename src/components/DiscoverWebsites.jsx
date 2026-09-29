import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "../hooks/useMobile.js";
import { safeArray } from "../utils/safeRender.js";

const G = "#F5A623";

const categories = [
  { emoji: "🎬", name: "Movies" },
  { emoji: "🤖", name: "AI Tools" },
  { emoji: "📚", name: "Education" },
  { emoji: "🛡️", name: "Ad Blockers" },
  { emoji: "🎮", name: "Games" },
  { emoji: "📺", name: "Streaming" },
  { emoji: "📱", name: "Apps" },
];

export default function DiscoverWebsites() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const chipPadding = isMobile ? "10px 14px" : "12px 18px";
  const chipFontSize = isMobile ? 13 : 14;

  return (
    <section style={{ padding: "32px 0 24px" }}>
      <div
        className="stea-container"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px)",
        }}
      >
        {/* Section title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: isMobile ? 18 : 22,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}
          >
            Discover{" "}
            <span style={{ color: G }}>Websites</span>
          </h2>
          <button
            onClick={() => navigate("/websites")}
            style={{
              background: "none",
              border: "none",
              color: G,
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 0",
              whiteSpace: "nowrap",
            }}
          >
            View All →
          </button>
        </div>

        {/* Horizontal scroll wrapper */}
        <div style={{ position: "relative" }}>
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 4,
            }}
            className="hide-scrollbar"
          >
            {safeArray(categories).map((cat) => (
              <button
                key={cat.name}
                onClick={() =>
                  navigate(
                    `/websites?cat=${cat.name.toLowerCase().replace(/\s+/g, "-")}`
                  )
                }
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: chipPadding,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                  fontFamily: "'Instrument Sans', system-ui, sans-serif",
                  fontSize: chipFontSize,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(245,166,35,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <span style={{ fontSize: isMobile ? 16 : 18 }}>{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Gradient fade mask on right edge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 4,
              width: 48,
              background:
                "linear-gradient(to right, transparent, #05070c)",
              pointerEvents: "none",
              borderRadius: "0 12px 12px 0",
            }}
          />
        </div>
      </div>

      {/* Hide scrollbar globally for this component */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
