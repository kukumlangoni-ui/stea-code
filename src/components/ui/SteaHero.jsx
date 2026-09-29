import React from "react";
import { useMobile } from "../../hooks/useMobile.js";

const G = "#F5A623";

export default function SteaHero({ badge, titleLine1, titleLine2, subtitle, variant = "section" }) {
  const isMobile = useMobile();

  return (
    <div style={{
      textAlign: "center",
      padding: isMobile ? "40px 16px 24px" : "60px 20px 48px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      position: "relative",
      zIndex: 2
    }}>
      {badge && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          borderRadius: 999,
          background: "rgba(245, 166, 35, 0.1)",
          border: "1px solid rgba(245, 166, 35, 0.25)",
          color: G,
          fontSize: 10,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          marginBottom: 28
        }}>
          {badge}
        </div>
      )}

      <h1 className="stea-hero-title" style={{
        fontSize: "clamp(34px, 7.5vw, 68px)",
        lineHeight: 1.0,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        textAlign: "center",
        margin: "0 0 24px",
        fontFamily: "'Bricolage Grotesque', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <span className="line-1" style={{ color: "#fff" }}>{titleLine1}</span>
        <span className="line-2" style={{
          background: "linear-gradient(90deg, #fff5df, #f6a800)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent"
        }}>{titleLine2}</span>
      </h1>

      {subtitle && (
        <p className="stea-text-muted" style={{
          maxWidth: 680,
          margin: "0 auto",
          textAlign: "center",
          fontSize: "clamp(13px, 3.5vw, 15px)",
          lineHeight: 1.6
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
