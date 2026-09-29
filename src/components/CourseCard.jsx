import React from "react";
import { Play, Sparkles, GraduationCap } from "lucide-react";
import LazyImage from "./LazyImage.jsx";

/**
 * CourseCard — Premium Platform-style Card for Video Courses / Learning Resources
 * Reuses the design language of WebsiteSolutionCard
 */
export function CourseCard({ course, onClick, isMobile }) {
  const ACCENT = "#10b981"; // Green for learning
  const G = "#F5A623";
  const BORDER = "rgba(255,255,255,.08)";
  const lang = typeof window !== "undefined" ? (localStorage.getItem("stea_lang_explicit") === "true" ? localStorage.getItem("stea_lang") : "en") : "en";

  const title = (lang === "sw" ? course.titleSw : course.titleEn) || course.titleEn || course.title || course.name || "Untitled Course";
  const desc = (lang === "sw" ? course.descriptionSw : course.descriptionEn) || course.descriptionEn || course.summary || course.description || "";
  const imageUrl = course.imageUrl || course.image || course.thumbnailUrl || course.thumbnail || course.coverImage || "";
  const isFree = course.free || course.courseType === "free" || !course.newPrice;
  const price = isFree ? "Free" : (course.newPrice || course.price);

  return (
    <button
      onClick={onClick}
      className="stea-btn glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        width: "100%",
        position: "relative",
        height: "100%",
        padding: "16px",
        background: "rgba(20, 20, 20, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(255, 255, 255, 0.05) inset"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(16, 185, 129, 0.2), 0 1px 3px rgba(255,255,255,0.05) inset";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(255, 255, 255, 0.05) inset";
      }}
    >
      {/* Image Container */}
      <div style={{ 
        width: "calc(100% + 32px)", 
        margin: "-16px -16px 16px -16px",
        aspectRatio: "16 / 9", 
        background: "rgba(255,255,255,.03)", 
        position: "relative", 
        overflow: "hidden",
        borderRadius: "14px 14px 0 0"
      }}>
        {imageUrl ? (
          <LazyImage
            src={imageUrl}
            alt={title}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              objectPosition: "center",
              display: "block",
              transition: "transform 0.4s ease"
            }}
          />
        ) : (
          <div style={{ 
            width: "100%", 
            height: "100%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            background: "rgba(16,185,129,.06)" 
          }}>
            <GraduationCap size={40} color="rgba(16,185,129,.2)" />
          </div>
        )}

        {/* Free/Paid Badge */}
        <div style={{ 
          position: "absolute", 
          top: 12, 
          left: 12, 
          background: isFree ? ACCENT : G, 
          color: "#000", 
          fontSize: 10, 
          fontWeight: 900, 
          padding: "4px 10px", 
          borderRadius: 8, 
          textTransform: "uppercase", 
          letterSpacing: ".04em",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          {isFree && <Sparkles size={10} />} {price}
        </div>

        {/* Play Icon Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.2)",
          opacity: 0,
          transition: "opacity 0.3s ease"
        }} className="play-overlay">
          <div style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.3)"
          }}>
            <Play size={20} fill="#fff" color="#fff" />
          </div>
        </div>
        <style>{`
          .stea-btn:hover .play-overlay { opacity: 1; }
        `}</style>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 4px 6px 4px" }}>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 900, 
          color: ACCENT, 
          textTransform: "uppercase", 
          letterSpacing: ".08em", 
          marginBottom: 6,
          opacity: 0.9
        }}>
          {course.language || "Swahili / English"}
        </div>

        <h3 style={{ 
          fontSize: 16, 
          fontWeight: 800, 
          color: "#fff", 
          margin: "0 0 8px", 
          lineHeight: 1.2, 
          display: "-webkit-box", 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden" 
        }}>
          {title}
        </h3>

        <p style={{ 
          fontSize: 13, 
          color: "rgba(255,255,255,0.5)", 
          margin: "0 0 16px", 
          lineHeight: 1.5, 
          display: "-webkit-box", 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden", 
          flex: 1 
        }}>
          {desc}
        </p>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: ACCENT, fontWeight: 800 }}>
             {isFree ? "Watch free" : "View course"} <ArrowRightIcon />
          </div>
          {course.duration && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>
              {course.duration}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-7-7 7 7-7 7"/>
    </svg>
  );
}
