import React, { useState, useMemo } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

const PRESETS = [
  { name: "STEA Gold Glow", x: 0, y: 18, blur: 40, spread: -12, color: "#f5a623", opacity: 0.45, inset: false },
  { name: "Soft Elevation", x: 0, y: 10, blur: 30, spread: -5, color: "#000000", opacity: 0.5, inset: false },
  { name: "Deep Float", x: 0, y: 25, blur: 50, spread: -10, color: "#000000", opacity: 0.7, inset: false },
  { name: "Sharp Cyber", x: 8, y: 8, blur: 0, spread: 0, color: "#f5a623", opacity: 0.8, inset: false },
  { name: "Inner Glow", x: 0, y: 0, blur: 25, spread: 4, color: "#f5a623", opacity: 0.3, inset: true },
  { name: "Dark Inset", x: 0, y: 4, blur: 16, spread: 0, color: "#000000", opacity: 0.6, inset: true },
];

function hexToRgb(hex) {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function BoxShadowGenerator() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(20);
  const [blur, setBlur] = useState(40);
  const [spread, setSpread] = useState(-10);
  const [color, setColor] = useState("#f5a623");
  const [opacity, setOpacity] = useState(0.4);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const rgbaColor = useMemo(() => {
    const { r, g, b } = hexToRgb(color || "#000000");
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, [color, opacity]);

  const cssValue = useMemo(() => {
    const prefix = inset ? "inset " : "";
    return `box-shadow: ${prefix}${x}px ${y}px ${blur}px ${spread}px ${rgbaColor};`;
  }, [x, y, blur, spread, rgbaColor, inset]);

  const previewShadow = useMemo(() => {
    const prefix = inset ? "inset " : "";
    return `${prefix}${x}px ${y}px ${blur}px ${spread}px ${rgbaColor}`;
  }, [x, y, blur, spread, rgbaColor, inset]);

  const copyCss = () => {
    navigator.clipboard.writeText(cssValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const applyPreset = (p) => {
    setX(p.x);
    setY(p.y);
    setBlur(p.blur);
    setSpread(p.spread);
    setColor(p.color);
    setOpacity(p.opacity);
    setInset(p.inset);
  };

  return (
    <div className="sc-tool-container">
      <div className="sc-tool-header">
        <span className="sc-tool-badge">CSS Tool</span>
        <h1 className="sc-tool-title">Box Shadow Generator</h1>
        <p className="sc-tool-sub">
          Design crisp, multi-layer CSS box shadows with interactive sliders and real-time preview.
        </p>
      </div>

      <div className="sc-tool-workspace">
        {/* Controls Column */}
        <div className="sc-tool-controls">
          <div className="sc-tool-section">
            <div className="sc-tool-slider-row">
              <label>Horizontal Offset (X): <strong>{x}px</strong></label>
              <input
                type="range"
                min="-50"
                max="50"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="sc-tool-slider"
              />
            </div>

            <div className="sc-tool-slider-row">
              <label>Vertical Offset (Y): <strong>{y}px</strong></label>
              <input
                type="range"
                min="-50"
                max="50"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                className="sc-tool-slider"
              />
            </div>

            <div className="sc-tool-slider-row">
              <label>Blur Radius: <strong>{blur}px</strong></label>
              <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="sc-tool-slider"
              />
            </div>

            <div className="sc-tool-slider-row">
              <label>Spread Radius: <strong>{spread}px</strong></label>
              <input
                type="range"
                min="-20"
                max="50"
                value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
                className="sc-tool-slider"
              />
            </div>

            <div className="sc-tool-slider-row">
              <label>Shadow Opacity: <strong>{Math.round(opacity * 100)}%</strong></label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="sc-tool-slider"
              />
            </div>
          </div>

          <div className="sc-tool-section">
            <div className="sc-tool-color-row">
              <div className="sc-tool-color-field">
                <span className="sc-tool-color-tag">Shadow Color</span>
                <div className="sc-tool-color-input-wrap">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="sc-tool-color-picker"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="sc-tool-hex-input"
                  />
                </div>
              </div>

              <div className="sc-tool-toggle-field">
                <label className="sc-tool-checkbox-label">
                  <input
                    type="checkbox"
                    checked={inset}
                    onChange={(e) => setInset(e.target.checked)}
                    className="sc-tool-checkbox"
                  />
                  <span>Inset Shadow</span>
                </label>
              </div>
            </div>
          </div>

          <div className="sc-tool-section">
            <label className="sc-tool-label">Presets</label>
            <div className="sc-tool-presets-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="sc-tool-preset-chip"
                  onClick={() => applyPreset(p)}
                >
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview & Code Output */}
        <div className="sc-tool-preview-pane">
          <div className="sc-tool-preview-box is-shadow-preview-stage">
            <div
              className="sc-tool-shadow-target-card"
              style={{ boxShadow: previewShadow }}
            >
              <span>Shadow Preview Card</span>
            </div>
          </div>

          <div className="sc-tool-code-box">
            <div className="sc-tool-code-header">
              <span>CSS Output</span>
              <button
                type="button"
                className={`sc-tool-copy-btn ${copied ? "is-copied" : ""}`}
                onClick={copyCss}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copied!" : "Copy CSS"}</span>
              </button>
            </div>
            <pre className="sc-tool-code-snippet">
              <code>{cssValue}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
