import React from "react";

const keyframesStyle = `
@keyframes tanzaniaGlow {
  0%, 100% { fill-opacity: 0.15; }
  50% { fill-opacity: 0.35; }
}
`;

export default function AfricaMapGlow() {
  return (
    <>
      <style>{keyframesStyle}</style>
      <svg
        aria-hidden="true"
        width="200"
        height="240"
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          pointerEvents: "none",
        }}
      >
        {/* Africa continent silhouette — simplified outline */}
        <path
          d="
            M 95 8
            C 75 8, 55 18, 48 35
            C 38 55, 30 70, 28 90
            C 25 115, 32 140, 40 160
            C 48 178, 55 195, 68 210
            C 78 222, 88 230, 95 232
            C 102 230, 108 222, 112 210
            C 120 195, 135 178, 142 160
            C 150 140, 155 120, 152 100
            C 149 80, 142 60, 130 42
            C 120 25, 110 8, 95 8
            Z
          "
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* Horn of Africa bump */}
        <path
          d="
            M 152 100
            C 158 95, 168 92, 175 98
            C 172 105, 162 108, 152 108
          "
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* Tanzania — east coast, south of the horn */}
        <path
          d="
            M 140 138
            L 155 132
            L 160 142
            L 155 155
            L 145 160
            L 135 152
            Z
          "
          fill="rgba(245,166,35,0.25)"
          stroke="rgba(245,166,35,0.4)"
          strokeWidth="0.8"
          style={{
            animation: "tanzaniaGlow 4s ease-in-out infinite",
          }}
        />

        {/* Tanzania glow spot */}
        <circle
          cx="148"
          cy="146"
          r="6"
          fill="rgba(245,166,35,0.12)"
          style={{
            animation: "tanzaniaGlow 4s ease-in-out infinite",
          }}
        />
      </svg>
    </>
  );
}
