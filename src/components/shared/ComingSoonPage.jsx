import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const GOLD = "#D4AF37";

export default function ComingSoonPage({
  icon = "🚧",
  label = "STEA Product",
  title = "Coming Soon",
  description = "This STEA product is currently being prepared. We are working to make it useful, fast, and safe for users.",
  expectedStatus = "🚧 Work in Progress",
  primaryButtonText = "Back Home",
  primaryButtonHref = "/",
  secondaryButtonText = "Join Updates",
  secondaryButtonHref = "/contact",
}) {
  const [theme, setTheme] = useState(() => localStorage.getItem("stea_home_theme") || "light");

  useEffect(() => {
    const onThemeChange = (event) => setTheme(event.detail || localStorage.getItem("stea_home_theme") || "light");
    window.addEventListener("stea-theme-change", onThemeChange);
    return () => window.removeEventListener("stea-theme-change", onThemeChange);
  }, []);

  const isDark = theme === "dark";

  return (
    <main
      style={{
        minHeight: "calc(100vh - 84px)",
        display: "grid",
        placeItems: "center",
        padding: "clamp(22px, 6vw, 56px) 16px calc(96px + env(safe-area-inset-bottom))",
        background: isDark ? "#05060A" : "#F8FAFC",
        color: isDark ? "#F9FAFB" : "#111827",
        overflowX: "hidden",
      }}
    >
      <section
        style={{
          width: "min(100%, 760px)",
          borderRadius: 28,
          border: isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(15,23,42,.08)",
          background: isDark ? "linear-gradient(180deg, #111827 0%, #090B12 100%)" : "#FFFFFF",
          boxShadow: isDark ? "0 24px 70px rgba(0,0,0,.42)" : "0 24px 70px rgba(15,23,42,.12)",
          padding: "clamp(22px, 6vw, 44px)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            margin: "0 auto 18px",
            borderRadius: 24,
            display: "grid",
            placeItems: "center",
            fontSize: 36,
            background: isDark ? "rgba(212,175,55,.12)" : "rgba(212,175,55,.13)",
            border: "1px solid rgba(212,175,55,.28)",
            boxShadow: "0 16px 34px rgba(212,175,55,.14)",
          }}
        >
          {icon}
        </div>

        <p
          style={{
            margin: "0 0 10px",
            color: GOLD,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".14em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(30px, 8vw, 54px)",
            lineHeight: 1.04,
            letterSpacing: 0,
            fontWeight: 950,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            maxWidth: 560,
            margin: "16px auto 0",
            color: isDark ? "rgba(255,255,255,.68)" : "#526176",
            fontSize: "clamp(15px, 4vw, 18px)",
            lineHeight: 1.65,
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 22,
            padding: "8px 13px",
            borderRadius: 999,
            color: isDark ? "#FFE8A3" : "#6F5200",
            background: isDark ? "rgba(212,175,55,.13)" : "#FFF7DC",
            border: "1px solid rgba(212,175,55,.24)",
            fontSize: 13,
            fontWeight: 850,
          }}
        >
          {expectedStatus}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 28,
          }}
        >
          <Link
            to={primaryButtonHref}
            style={{
              minHeight: 48,
              minWidth: 150,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 18px",
              borderRadius: 14,
              textDecoration: "none",
              color: "#111827",
              background: "linear-gradient(135deg, #D4AF37, #FFE39A)",
              fontWeight: 900,
              boxShadow: "0 14px 28px rgba(212,175,55,.22)",
            }}
          >
            {primaryButtonText}
          </Link>
          <Link
            to={secondaryButtonHref}
            style={{
              minHeight: 48,
              minWidth: 150,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 18px",
              borderRadius: 14,
              textDecoration: "none",
              color: isDark ? "#F9FAFB" : "#111827",
              background: isDark ? "rgba(255,255,255,.06)" : "#FFFFFF",
              border: isDark ? "1px solid rgba(255,255,255,.12)" : "1px solid #E5E7EB",
              fontWeight: 900,
              boxShadow: isDark ? "none" : "0 10px 24px rgba(15,23,42,.06)",
            }}
          >
            {secondaryButtonText}
          </Link>
        </div>
      </section>
    </main>
  );
}
