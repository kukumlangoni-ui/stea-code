/**
 * SteaGlobalBackground — System B: Whole STEA App Subtle Atmosphere Canvas
 *
 * Provides a quiet, deep, cinematic digital canvas behind all STEA pages.
 * - Single global instance mounted in App.jsx
 * - 100% pure CSS, hardware-accelerated transforms & opacity
 * - Completely non-interactive (pointer-events: none)
 * - Safe z-index: 0 (sits behind all content, modals, nav, and interactive elements)
 * - Built-in dark/light mode reactivity via CSS tokens
 * - Reduced-motion compliant
 */
import React, { memo } from "react";

function SteaGlobalBackground() {
  return (
    <div className="stea-app-background" aria-hidden="true">
      {/* Base digital canvas depth gradient */}
      <div className="stea-app-base" />

      {/* Top large blurred atmospheric light */}
      <div className="stea-app-atmosphere-top" />

      {/* Subtle side atmospheric accent */}
      <div className="stea-app-atmosphere-side" />

      {/* Faint gold brand aura */}
      <div className="stea-app-atmosphere-brand" />

      {/* Outer edge vignette */}
      <div className="stea-app-vignette" />
    </div>
  );
}

export default memo(SteaGlobalBackground);
