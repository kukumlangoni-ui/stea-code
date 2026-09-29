import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";

import SteaCodeHeader from "../../components/stea-code/SteaCodeHeader.jsx";
import SearchPalette from "../../components/stea-code/SearchPalette.jsx";
import SteaCodeHome from "./SteaCodeHome.jsx";
import CodeView from "./CodeView.jsx";
import TipsView from "./TipsView.jsx";
import HostingView from "./HostingView.jsx";
import DomainsView from "./DomainsView.jsx";
import InspirationView from "./InspirationView.jsx";
import UILibrariesView from "./UILibrariesView.jsx";
import EssentialsView from "./EssentialsView.jsx";
import GuidesView from "./GuidesView.jsx";

import { useMultiCollection } from "../../hooks/useMultiCollection.js";
import { VIEW_IDS, getGateway } from "../../data/stea-code/gateways.js";

const LEGACY_COLLECTIONS = ["stea_daily", "tips_resources", "resources", "updates", "study_resources"];
const CODE_COLLECTIONS = ["stea_code_resources", "stea_code_inspiration", "stea_code_hosting", "stea_code_resources_directory"];

function isPublished(item) {
  return item.published === true || item.status === "published" || item.published === undefined;
}

function codeText(item) {
  return (
    item.copyableCode ||
    item.codeReact ||
    item.codeJs ||
    item.codeCss ||
    item.codeHtml ||
    item.codeOther ||
    item.code ||
    ""
  );
}

function normalizeCode(item) {
  const tags = Array.isArray(item.tags) ? item.tags.join(" ") : item.tags || "";
  return {
    ...item,
    title: item.title || "Untitled code resource",
    description: item.shortDescription || item.description || item.fullDescription || "Reusable STEA Code resource.",
    category: item.category || "Component",
    framework: item.framework || "Code",
    language: item.language || "Mixed",
    difficulty: item.difficulty || "Beginner",
    preview: item.preview || item.title || "",
    code: codeText(item),
    searchable: `${item.title || ""} ${item.shortDescription || ""} ${item.fullDescription || ""} ${item.category || ""} ${item.framework || ""} ${item.language || ""} ${tags}`.toLowerCase(),
  };
}

function normalizeItem(item) {
  const type = String(item.type || item.fileType || item.category || "").toLowerCase();
  const url = item.link || item.url || item.mediaUrl || item.downloadUrl || item.fileUrl || item.pdfUrl || "";
  const text = `${item.title || ""} ${item.description || ""} ${item.category || ""} ${item.categoryName || ""} ${type}`.toLowerCase();
  const isPdf = type.includes("pdf") || Boolean(item.pdfUrl || item.fileUrl || item.downloadUrl);
  const isVideo = type.includes("video") || /youtube|youtu\.be|vimeo/.test(url);
  return {
    ...item,
    title: item.title || item.name || "Untitled resource",
    description: item.description || item.body || "Useful STEA resource.",
    category: item.categoryName || item.category || item.type || "Resource",
    url,
    isPdf,
    isVideo,
    searchable: text,
  };
}

/**
 * SteaCodeShell — orchestrates STEA Code view routing and data.
 *
 * Responsibilities:
 *   - Parses the `view` query param deterministically (React Router).
 *   - Loads Firestore data via useMultiCollection + applies fallbacks.
 *   - Renders Home or internal Shell + Header + current view.
 *   - Provides Cmd/Ctrl+K command palette.
 *   - Premium transitions with prefers-reduced-motion respect.
 */
export default function SteaCodeShell() {
  const location = useLocation();
  const navigate = useNavigate();

  // ---------- Routing ----------
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const viewParam = (params.get("view") || "").toLowerCase();
  const currentView = VIEW_IDS.includes(viewParam) ? viewParam : null;

  const setView = useCallback(
    (next) => {
      const target = next == null || next === "home" || !VIEW_IDS.includes(next)
        ? "/code"
        : `/code?view=${encodeURIComponent(next)}`;
      navigate(target, { replace: false });
    },
    [navigate]
  );

  // ---------- Prefers reduced motion ----------
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // ---------- Data loading ----------
  const { docs: legacyDocs, loading: legacyLoading } = useMultiCollection(LEGACY_COLLECTIONS, "createdAt", 120);
  const { docs: cmsDocs, loading: cmsLoading } = useMultiCollection(CODE_COLLECTIONS, "createdAt", 180);

  const codeResources = useMemo(
    () =>
      cmsDocs
        .filter((d) => d._collection === "stea_code_resources" && isPublished(d))
        .map(normalizeCode),
    [cmsDocs]
  );

  const inspirationResources = useMemo(
    () => cmsDocs.filter((d) => d._collection === "stea_code_inspiration" && isPublished(d)),
    [cmsDocs]
  );

  const hostingResources = useMemo(
    () => cmsDocs.filter((d) => d._collection === "stea_code_hosting" && isPublished(d)),
    [cmsDocs]
  );

  const directoryResources = useMemo(
    () => cmsDocs.filter((d) => d._collection === "stea_code_resources_directory" && isPublished(d)),
    [cmsDocs]
  );

  const legacyNormalized = useMemo(() => legacyDocs.map(normalizeItem), [legacyDocs]);
  const steaDaily = useMemo(() => legacyNormalized.filter((d) => d._collection === "stea_daily"), [legacyNormalized]);
  const tipsLegacy = useMemo(() => legacyNormalized.filter((d) => d._collection === "tips_resources"), [legacyNormalized]);
  const resourcesLegacy = useMemo(() => legacyNormalized.filter((d) => d._collection === "resources"), [legacyNormalized]);
  const updatesLegacy = useMemo(() => legacyNormalized.filter((d) => d._collection === "updates"), [legacyNormalized]);
  const studyLegacy = useMemo(() => legacyNormalized.filter((d) => d._collection === "study_resources"), [legacyNormalized]);

  // ---------- Search palette ----------
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Open palette from anywhere
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  // ---------- Render ----------
  const isHome = currentView == null;

  const motionPreset = reduceMotion
    ? { initial: false, animate: false, exit: false }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.26, ease: "easeOut" },
      };

  const paletteSources = useMemo(
    () => ({
      code: codeResources,
      tips: tipsLegacy.concat([]), // enriched in palette
      hosting: hostingResources,
      inspiration: inspirationResources,
      ui: [],
      essentials: directoryResources,
      guides: [].concat(steaDaily, tipsLegacy, resourcesLegacy, updatesLegacy, studyLegacy),
    }),
    [codeResources, tipsLegacy, hostingResources, inspirationResources, directoryResources, steaDaily, resourcesLegacy, updatesLegacy, studyLegacy]
  );

  return (
    <div className={"stea-code-app" + (reduceMotion ? " sc-reduce-motion" : "")}>
      {!isHome && (
        <SteaCodeHeader
          activeView={currentView}
          onNavigate={setView}
          onOpenSearch={() => setPaletteOpen(true)}
        />
      )}

      <div className="sc-view-stack">
        <AnimatePresence mode="wait">
          {isHome ? (
            <motion.div
              key="home"
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <SteaCodeHome
                onNavigate={setView}
                onOpenSearch={() => setPaletteOpen(true)}
                query={query}
                onQueryChange={(v) => {
                  setQuery(v);
                  if (v) setPaletteOpen(true);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentView}
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <ViewRouter
                view={currentView}
                codeResources={codeResources}
                hostingResources={hostingResources}
                inspirationResources={inspirationResources}
                directoryResources={directoryResources}
                legacyTips={tipsLegacy}
                steaDaily={steaDaily}
                resourcesLegacy={resourcesLegacy}
                updatesLegacy={updatesLegacy}
                studyLegacy={studyLegacy}
                loading={cmsLoading || legacyLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SearchPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(id) => {
          setView(id);
          setTimeout(() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }), 10);
        }}
        dataSources={paletteSources}
      />
    </div>
  );
}

/**
 * Pure switch helper — renders the appropriate view component.
 */
function ViewRouter({
  view,
  codeResources,
  hostingResources,
  inspirationResources,
  directoryResources,
  legacyTips,
  steaDaily,
  resourcesLegacy,
  updatesLegacy,
  studyLegacy,
  loading,
}) {
  switch (view) {
    case "code":
      return <CodeView codeResources={codeResources} loading={loading} />;
    case "tips":
      return <TipsView legacyTips={legacyTips.concat(steaDaily)} loading={loading} />;
    case "hosting":
      return <HostingView hostingResources={hostingResources} loading={loading} />;
    case "domains":
      return <DomainsView loading={loading} />;
    case "inspiration":
      return <InspirationView inspirationResources={inspirationResources} loading={loading} />;
    case "ui":
      return (
        <UILibrariesView
          directoryResources={directoryResources}
          loading={loading}
        />
      );
    case "essentials":
      return (
        <EssentialsView
          directoryResources={directoryResources}
          loading={loading}
        />
      );
    case "guides":
      return (
        <GuidesView
          steaDaily={steaDaily}
          tips={legacyTips}
          resources={resourcesLegacy}
          updates={updatesLegacy}
          study={studyLegacy}
          loading={loading}
        />
      );
    default:
      return null;
  }
}
