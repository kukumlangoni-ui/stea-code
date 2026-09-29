import React from "react";
import { ArrowRight, Box, Code2, Layers, Palette, Wrench } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const DEV_TOOLS = [
  {
    id: "gradient-generator",
    path: "/tools/gradient-generator",
    title: "Gradient Generator",
    description: "Design linear and radial CSS gradients with presets, angle controls, and instant code export.",
    icon: Palette,
    badge: "CSS Tool",
    gradientPreview: "linear-gradient(135deg, #f5a623, #ff5500)",
  },
  {
    id: "box-shadow-generator",
    path: "/tools/box-shadow-generator",
    title: "Box Shadow Generator",
    description: "Multi-parameter box shadow generator with X/Y offsets, blur, spread, opacity, and inset support.",
    icon: Layers,
    badge: "CSS Tool",
    gradientPreview: "radial-gradient(circle, rgba(245,166,35,0.35) 0%, rgba(10,14,24,0.8) 70%)",
  },
  {
    id: "json-formatter",
    path: "/tools/json-formatter",
    title: "JSON Formatter & Validator",
    description: "Format, minify, and validate JSON data in real time with line-by-line syntax error detection.",
    icon: Code2,
    badge: "Data Tool",
    gradientPreview: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  },
];

export default function ToolsOverview() {
  const navigate = useNavigate();

  return (
    <div className="sc-tools-overview">
      <div className="sc-tools-hero">
        <span className="sc-tool-badge"><Wrench size={13} /> Built for Builders</span>
        <h1 className="sc-tool-title">Free Developer Tools</h1>
        <p className="sc-tool-sub">
          Fast, client-side utilities with zero tracking, no login required, and instant clipboard export.
        </p>
      </div>

      <div className="sc-tools-grid">
        {DEV_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="sc-tool-card"
              onClick={() => navigate(tool.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(tool.path);
              }}
            >
              <div
                className="sc-tool-card-preview"
                style={{ background: tool.gradientPreview }}
              >
                <div className="sc-tool-card-icon-bubble">
                  <Icon size={24} />
                </div>
              </div>
              <div className="sc-tool-card-content">
                <div className="sc-tool-card-meta">
                  <span className="sc-tool-card-badge">{tool.badge}</span>
                </div>
                <h2 className="sc-tool-card-title">{tool.title}</h2>
                <p className="sc-tool-card-desc">{tool.description}</p>
                <div className="sc-tool-card-cta">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
