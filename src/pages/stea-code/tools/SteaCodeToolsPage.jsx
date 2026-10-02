import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Code2, Sparkles, Wrench } from "lucide-react";
import GradientGenerator from "./GradientGenerator.jsx";
import BoxShadowGenerator from "./BoxShadowGenerator.jsx";
import JsonFormatter from "./JsonFormatter.jsx";
import ToolsOverview, { DEV_TOOLS } from "./ToolsOverview.jsx";
import SteaCodeLiquidHero from "../../../components/SteaCodeLiquidHero.jsx";
import "../stea-code.css";
import "../stea-code-v2.css";

export default function SteaCodeToolsPage() {
  const { toolId } = useParams();
  const location = useLocation();

  // Route matching
  const currentPath = location.pathname.replace(/\/$/, "");
  let activeTool = null;

  if (toolId) {
    activeTool = toolId;
  } else if (currentPath === "/tools/gradient-generator") {
    activeTool = "gradient-generator";
  } else if (currentPath === "/tools/box-shadow-generator") {
    activeTool = "box-shadow-generator";
  } else if (currentPath === "/tools/json-formatter") {
    activeTool = "json-formatter";
  }

  return (
    <div className="stea-code-app sc-v2 sc-market-home sc-v2-tools-page sc-v2-has-liquid">
      <div className="sc-v2-liquid-wrap" aria-hidden="true">
        <SteaCodeLiquidHero theme="dark" />
      </div>
      <div className="sc-v2-veil" aria-hidden="true" />

      {/* Header */}
      <header className="sc-market-header">
        <a className="sc-market-brand" href="/code" aria-label="steacode home">
          <img src="/stea-apps/stea-code.png" alt="" width={34} height={34} />
          <strong>steacode</strong>
        </a>

        <nav className="sc-market-nav" aria-label="Tools navigation">
          <a href="/code">Explore</a>
          <a href="/tools" className={!activeTool ? "is-active" : ""}>Tools</a>
          {DEV_TOOLS.map((t) => (
            <a
              key={t.id}
              href={t.path}
              className={activeTool === t.id ? "is-active" : ""}
            >
              {t.title.split(" ")[0]}
            </a>
          ))}
        </nav>

        <div className="sc-market-actions">
          <a href="/code" className="sc-tool-back-link">
            <ArrowLeft size={15} />
            <span>steacode</span>
          </a>
        </div>
      </header>

      {/* Main Tool Area */}
      <main className="sc-tool-main-wrap">
        {activeTool === "gradient-generator" ? (
          <GradientGenerator />
        ) : activeTool === "box-shadow-generator" ? (
          <BoxShadowGenerator />
        ) : activeTool === "json-formatter" ? (
          <JsonFormatter />
        ) : (
          <ToolsOverview />
        )}
      </main>

      {/* Footer */}
      <footer className="sc-market-footer">
        <strong>steacode Tools</strong>
        <nav aria-label="steacode footer">
          <a href="/code">steacode</a>
          <a href="/tools">All Tools</a>
          <a href="/code">Components</a>
          <a href="/code">Changelog</a>
        </nav>
      </footer>
    </div>
  );
}
