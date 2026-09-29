import React, { useState } from "react";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

const TABS = ["All", "Education", "Creators", "Jobs", "Marketplace"];

const TRENDING_ITEMS = [
  { id: 1, title: "CSEE 2025 Results Analysis", category: "Education", timeAgo: "2h ago" },
  { id: 2, title: "Top AI Tools for Students", category: "Education", timeAgo: "4h ago" },
  { id: 3, title: "New Creator Fund Open", category: "Creators", timeAgo: "1h ago" },
  { id: 4, title: "50 Remote Jobs Available", category: "Jobs", timeAgo: "3h ago" },
  { id: 5, title: "iPhone Cases from China", category: "Marketplace", timeAgo: "5h ago" },
  { id: 6, title: "Study Abroad Scholarships", category: "Education", timeAgo: "6h ago" },
  { id: 7, title: "Graphic Design Gigs", category: "Jobs", timeAgo: "2h ago" },
  { id: 8, title: "Premium Templates Drop", category: "Marketplace", timeAgo: "4h ago" },
];

const categoryColors = {
  Education: { bg: "rgba(59,130,246,0.12)", text: "#60A5FA" },
  Creators: { bg: "rgba(168,85,247,0.12)", text: "#C084FC" },
  Jobs: { bg: "rgba(34,197,94,0.12)", text: "#4ADE80" },
  Marketplace: { bg: "rgba(245,166,35,0.12)", text: "#FFD17C" },
};

export default function TrendingSection() {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? TRENDING_ITEMS
      : TRENDING_ITEMS.filter((item) => item.category === activeTab);

  const visibleCount = isMobile ? 2 : 4;
  const visibleItems = filtered.slice(0, visibleCount);

  return (
    <section style={{ padding: "28px 0 32px" }}>
      <div
        className="stea-container"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px)",
        }}
      >
        {/* Section title */}
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: isMobile ? 18 : 22,
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 16px 0",
          }}
        >
          🔥 Trending{" "}
          <span style={{ color: G }}>Now</span>
        </h2>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            marginBottom: 20,
            paddingBottom: 2,
          }}
          className="hide-scrollbar-trending"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flexShrink: 0,
                  padding: isMobile ? "7px 14px" : "8px 18px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: isActive
                    ? "rgba(245,166,35,0.3)"
                    : "rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(245,166,35,0.15)"
                    : "rgba(255,255,255,0.04)",
                  color: isActive ? G : "rgba(255,255,255,0.6)",
                  fontFamily: "'Instrument Sans', system-ui, sans-serif",
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition:
                    "background 0.2s cubic-bezier(0.16,1,0.3,1), color 0.2s, border-color 0.2s",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Content cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {visibleItems.map((item) => {
            const badge = categoryColors[item.category] || {
              bg: "rgba(255,255,255,0.08)",
              text: "#aaa",
            };
            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(20,20,20,0.6)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: isMobile ? "14px 16px" : "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  transition:
                    "border-color 0.25s cubic-bezier(0.16,1,0.3,1), background 0.25s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(245,166,35,0.2)";
                  e.currentTarget.style.background =
                    "rgba(20,20,20,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background =
                    "rgba(20,20,20,0.6)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontFamily:
                        "'Instrument Sans', system-ui, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.text,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily:
                          "'Instrument Sans', system-ui, sans-serif",
                      }}
                    >
                      {item.category}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        fontFamily:
                          "'Instrument Sans', system-ui, sans-serif",
                      }}
                    >
                      {item.timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {visibleItems.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Instrument Sans', system-ui, sans-serif",
              fontSize: 14,
            }}
          >
            No trending items in this category yet.
          </div>
        )}

        {/* View More button */}
        {filtered.length > visibleCount && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <button
              style={{
                padding: "10px 28px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "#fff",
                fontFamily:
                  "'Instrument Sans', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition:
                  "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor =
                  "rgba(245,166,35,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.15)";
              }}
            >
              View More
            </button>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar-trending::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
