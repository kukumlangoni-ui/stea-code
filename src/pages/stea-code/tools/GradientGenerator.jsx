import React, { useState, useMemo } from "react";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";

const DIRECTIONS = [
  { label: "To Right (90°)", value: "to right" },
  { label: "To Bottom (180°)", value: "to bottom" },
  { label: "Diagonal (135°)", value: "135deg" },
  { label: "Diagonal (45°)", value: "45deg" },
  { label: "To Top Right", value: "to top right" },
  { label: "Radial (Circle)", value: "radial" },
];

const PRESETS = [
  { name: "STEA Gold", color1: "#f5a623", color2: "#ff5500", dir: "135deg" },
  { name: "Neon Cyber", color1: "#8b5cf6", color2: "#06b6d4", dir: "135deg" },
  { name: "Sunset Blaze", color1: "#f43f5e", color2: "#fbbf24", dir: "45deg" },
  { name: "Emerald Wave", color1: "#10b981", color2: "#047857", dir: "to bottom" },
  { name: "Cosmic Deep", color1: "#4f46e5", color2: "#7c3aed", dir: "135deg" },
  { name: "Dark Amber", color1: "#1e1704", color2: "#f5a623", dir: "radial" },
];

export default function GradientGenerator() {
  const [color1, setColor1] = useState("#f5a623");
  const [color2, setColor2] = useState("#ff5500");
  const [direction, setDirection] = useState("135deg");
  const [copied, setCopied] = useState(false);

  const cssValue = useMemo(() => {
    if (direction === "radial") {
      return `background: radial-gradient(circle, ${color1}, ${color2});`;
    }
    return `background: linear-gradient(${direction}, ${color1}, ${color2});`;
  }, [color1, color2, direction]);

  const cssStyle = useMemo(() => {
    if (direction === "radial") {
      return { background: `radial-gradient(circle, ${color1}, ${color2})` };
    }
    return { background: `linear-gradient(${direction}, ${color1}, ${color2})` };
  }, [color1, color2, direction]);

  const copyCss = () => {
    navigator.clipboard.writeText(cssValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const randomize = () => {
    const randomHex = () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    setColor1(randomHex());
    setColor2(randomHex());
  };

  return (
    <div className="sc-tool-container">
      <div className="sc-tool-header">
        <span className="sc-tool-badge">CSS Tool</span>
        <h1 className="sc-tool-title">Gradient Generator</h1>
        <p className="sc-tool-sub">
          Create fluid CSS linear and radial gradients with live visual preview and instant code export.
        </p>
      </div>

      <div className="sc-tool-workspace">
        {/* Controls Column */}
        <div className="sc-tool-controls">
          <div className="sc-tool-section">
            <label className="sc-tool-label">Direction / Angle</label>
            <div className="sc-tool-grid-dirs">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`sc-tool-dir-btn ${direction === d.value ? "is-active" : ""}`}
                  onClick={() => setDirection(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sc-tool-section">
            <label className="sc-tool-label">Colors</label>
            <div className="sc-tool-color-row">
              <div className="sc-tool-color-field">
                <span className="sc-tool-color-tag">Color 1</span>
                <div className="sc-tool-color-input-wrap">
                  <input
                    type="color"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="sc-tool-color-picker"
                  />
                  <input
                    type="text"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="sc-tool-hex-input"
                  />
                </div>
              </div>

              <div className="sc-tool-color-field">
                <span className="sc-tool-color-tag">Color 2</span>
                <div className="sc-tool-color-input-wrap">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="sc-tool-color-picker"
                  />
                  <input
                    type="text"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="sc-tool-hex-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sc-tool-section">
            <div className="sc-tool-label-row">
              <label className="sc-tool-label">Presets</label>
              <button
                type="button"
                className="sc-tool-random-btn"
                onClick={randomize}
                title="Random colors"
              >
                <RefreshCw size={13} /> Randomize
              </button>
            </div>
            <div className="sc-tool-presets-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="sc-tool-preset-chip"
                  onClick={() => {
                    setColor1(p.color1);
                    setColor2(p.color2);
                    setDirection(p.dir);
                  }}
                >
                  <span
                    className="sc-tool-preset-dot"
                    style={{
                      background: `linear-gradient(135deg, ${p.color1}, ${p.color2})`,
                    }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview & Code Output */}
        <div className="sc-tool-preview-pane">
          <div className="sc-tool-preview-box" style={cssStyle}>
            <div className="sc-tool-preview-inner">
              <span>Live Gradient Preview</span>
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
