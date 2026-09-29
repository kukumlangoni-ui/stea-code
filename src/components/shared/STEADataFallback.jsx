import React from "react";

export default function STEADataFallback({ onRetry }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      background: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #E2E8F0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      maxWidth: "400px",
      margin: "40px auto",
      textAlign: "center",
      fontFamily: "'Instrument Sans', system-ui, sans-serif"
    }}>
      <div style={{
        fontSize: "48px",
        marginBottom: "16px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "80px",
        height: "80px",
        background: "rgba(212, 160, 23, 0.08)",
        borderRadius: "50%",
        color: "#d4a017"
      }}>
        ⚠️
      </div>
      <h3 style={{
        fontSize: "18px",
        fontWeight: 800,
        color: "#0F172A",
        margin: "0 0 8px",
        letterSpacing: "-0.01em"
      }}>
        Connection issue
      </h3>
      <p style={{
        fontSize: "14px",
        color: "#475569",
        lineHeight: 1.6,
        margin: "0 0 20px"
      }}>
        We could not load fresh data. Please check your internet connection or try again.
      </p>
      <button 
        onClick={onRetry || (() => window.location.reload())}
        style={{
          width: "100%",
          padding: "12px 18px",
          background: "#d4a017",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontWeight: 800,
          fontSize: "14px",
          cursor: "pointer",
          transition: "background 0.2s",
          boxShadow: "0 2px 4px rgba(212, 160, 23, 0.2)"
        }}
        onMouseOver={e => e.currentTarget.style.background = "#c29113"}
        onMouseOut={e => e.currentTarget.style.background = "#d4a017"}
      >
        Retry
      </button>
      <span style={{
        fontSize: "11px",
        color: "#94A3B8",
        marginTop: "12px",
        display: "block"
      }}>
        Cached data will appear automatically if available.
      </span>
    </div>
  );
}
