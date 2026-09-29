import React from "react";

export default function SteaCodeLogo({ size = 24, className = "", alt = "STEA Code" }) {
  return (
    <img
      src="/stea-code-logo.png"
      width={size}
      height={size}
      alt={alt}
      className={className}
      draggable={false}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        objectFit: "contain",
        width: size,
        height: size,
      }}
    />
  );
}
