import React, { useState } from "react";
import { G } from "./ui/LayoutUtils.jsx";

export function ToolLink({ tool }) {
  const [iconError, setIconError] = useState(false);
  const hasIcon = tool.iconUrl && !iconError;
  let hostname;
  try {
    hostname = new URL(tool.toolUrl).hostname.replace("www.", "");
  } catch {
    hostname = "Tool";
  }

  return (
    <a
      href={tool.toolUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.1)",
        textDecoration: "none",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        transition: ".2s",
      }}
      onMouseEnter={(ev) =>
        (ev.currentTarget.style.background = "rgba(255,255,255,.1)")
      }
      onMouseLeave={(ev) =>
        (ev.currentTarget.style.background = "rgba(255,255,255,.05)")
      }
    >
      {hasIcon ? (
        <img
          loading="lazy"
          src={tool.iconUrl}
          style={{ width: 20, height: 20, borderRadius: 4 }}
          referrerPolicy="no-referrer"
          onError={() => setIconError(true)}
        />
      ) : (
        "🔗"
      )}
      {hostname}
    </a>
  );
}

export function ToolIcon({ tool }) {
  const [iconError, setIconError] = useState(false);
  const hasIcon = tool.iconUrl && !iconError;
  
  const handleClick = (e) => {
    if (tool.toolUrl) {
      e.stopPropagation();
      window.open(tool.toolUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      title={tool.toolUrl || tool.name}
      onClick={handleClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.1)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        cursor: tool.toolUrl ? "pointer" : "default",
        transition: ".2s",
      }}
      onMouseEnter={(e) => { if (tool.toolUrl) e.currentTarget.style.borderColor = G; }}
      onMouseLeave={(e) => { if (tool.toolUrl) e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; }}
    >
      {hasIcon ? (
        <img
          loading="lazy"
          src={tool.iconUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          referrerPolicy="no-referrer"
          onError={() => setIconError(true)}
        />
      ) : (
        <span style={{ fontSize: 12 }}>🔗</span>
      )}
    </div>
  );
}
