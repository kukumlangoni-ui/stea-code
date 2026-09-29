import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Search, X, Download, Check } from "lucide-react";
import { usePWA } from "../../contexts/PWAContext.jsx";
import { STEA_APPS } from "../../config/steaApps.js";

const PANEL_WIDTH = 760;
const MAIN_APP_IDS = ["websites", "education", "classroom", "services", "ai"];

export function STEAAppsLauncher({ compact = false, actionButtonStyle = {} }) {
  const { deferredPrompt, isInstalled, installApp } = usePWA();
  const triggerRef = useRef(null);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [panelPosition, setPanelPosition] = useState({ top: 64, left: 12 });
  const [installMessage, setInstallMessage] = useState("");
  const canInstall = isInstalled || Boolean(deferredPrompt || (typeof window !== "undefined" && window.__steaDeferredPrompt));

  const placePanel = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxLeft = Math.max(12, window.innerWidth - PANEL_WIDTH - 12);
    setPanelPosition({
      top: Math.min(rect.bottom + 8, window.innerHeight - 140),
      left: Math.min(Math.max(12, rect.right - PANEL_WIDTH), maxLeft)
    });
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width:640px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    placePanel();
    const close = (event) => event.key === "Escape" && setOpen(false);
    const reposition = () => placePanel();
    window.addEventListener("keydown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return STEA_APPS.filter(
      (app) =>
        app.title.toLowerCase().includes(needle) ||
        (app.keywords && app.keywords.some((k) => k.includes(needle)))
    );
  }, [query]);

  const homeApp = STEA_APPS.find((app) => app.id === "home");
  const mainApps = STEA_APPS.filter((app) => MAIN_APP_IDS.includes(app.id));
  const allApps = STEA_APPS.filter((app) => app.id !== "home" && !MAIN_APP_IDS.includes(app.id));
  const visibleMainApps = query ? mainApps.filter((app) => filtered.includes(app)) : mainApps;
  const visibleAllApps = query ? allApps.filter((app) => filtered.includes(app)) : allApps;
  const showHome = homeApp && (!query || filtered.includes(homeApp));

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const AppLink = ({ app, children, style, className }) => {
    const isExternal = /^https?:\/\//i.test(app.url);
    const active = !isExternal && location.pathname === app.url;
    const commonProps = {
      onClick: close,
      className,
      style: {
        position: "relative",
        color: "#111827",
        textDecoration: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        borderColor: active ? "rgba(212,175,55,.75)" : undefined,
        background: active ? "#FFF9E8" : undefined,
        ...style
      },
      onMouseEnter: (event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 12px 26px rgba(17,24,39,.10)";
      },
      onMouseLeave: (event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "none";
      }
    };

    return isExternal ? (
      <a key={app.id} href={app.url} {...commonProps}>{children}</a>
    ) : (
      <Link key={app.id} to={app.url} {...commonProps}>{children}</Link>
    );
  };

  const appIcon = (app, size = 24) => (
    <span aria-hidden="true" style={{ width: size + 8, height: size + 8, display: "grid", placeItems: "center", flexShrink: 0, fontSize: size, lineHeight: 1 }}>
      {app.icon}
    </span>
  );

  const mainTile = (app) => (
    <AppLink
      key={app.id}
      app={app}
      className="stea-apps-main-card"
      style={{
        minWidth: mobile ? 128 : 132,
        minHeight: 48,
        padding: "10px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #E7ECF2",
        borderRadius: 14,
        background: "#fff",
        transition: "transform .16s ease, box-shadow .16s ease"
      }}
    >
      {appIcon(app, 22)}
      <strong style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, lineHeight: 1.15 }}>{app.title}</strong>
    </AppLink>
  );

  const gridTile = (app) => (
    <AppLink
      key={app.id}
      app={app}
      style={{
        minHeight: 58,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid #E7ECF2",
        borderRadius: 14,
        background: "#fff",
        transition: "transform .16s ease, box-shadow .16s ease"
      }}
    >
      {appIcon(app, 22)}
      <strong style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, lineHeight: 1.15 }}>{app.title}</strong>
    </AppLink>
  );

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="STEA Apps"
      onClick={(event) => event.stopPropagation()}
      style={{
        width: mobile ? "100%" : PANEL_WIDTH,
        maxWidth: mobile ? "100%" : "calc(100vw - 24px)",
        maxHeight: mobile ? "86dvh" : "min(700px, calc(100vh - 84px))",
        overflowY: "auto",
        overflowX: "hidden",
        padding: mobile ? "16px 16px max(18px, env(safe-area-inset-bottom))" : 18,
        border: "1px solid #E4E8ED",
        borderRadius: mobile ? "24px 24px 0 0" : 22,
        background: "#fff",
        boxShadow: "0 24px 70px rgba(17,24,39,.2)",
        boxSizing: "border-box"
      }}
    >
      {mobile && <div style={{ width: 40, height: 4, margin: "0 auto 12px", borderRadius: 99, background: "#D9DEE6" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, letterSpacing: "-.02em" }}>STEA Apps</h2>
          <span style={{ color: "#6B7280", fontSize: 11 }}>Your STEA ecosystem</span>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close apps"
          style={{
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            background: "#fff",
            cursor: "pointer"
          }}
        >
          <X size={17} />
        </button>
      </div>
      <label
        style={{
          height: 43,
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          border: "1px solid #DEE4EA",
          borderRadius: 12,
          background: "#F8FAFC"
        }}
      >
        <Search size={16} color="#6B7280" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search STEA apps..."
          style={{ width: "100%", border: 0, outline: 0, background: "transparent", fontSize: 13 }}
        />
      </label>

      {showHome && (
        <section style={{ marginTop: 14 }}>
          <AppLink
            app={homeApp}
            style={{
              minHeight: 70,
              padding: mobile ? "12px 13px" : "13px 15px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(212,175,55,.42)",
              borderRadius: 16,
              background: "linear-gradient(135deg,#FFFBF0,#FFFFFF)",
              transition: "transform .16s ease, box-shadow .16s ease"
            }}
          >
            <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 13, background: "#fff", border: "1px solid rgba(212,175,55,.45)", fontSize: 23, flexShrink: 0 }}>
              {homeApp.icon}
            </span>
            <span style={{ minWidth: 0, flex: 1, display: "grid", gap: 3 }}>
              <strong style={{ fontSize: 14, lineHeight: 1.1 }}>STEA Home</strong>
              <span style={{ color: "#6B7280", fontSize: 12, lineHeight: 1.25 }}>Go back to the main STEA platform</span>
            </span>
            <ArrowRight size={18} color="#9A7700" style={{ flexShrink: 0 }} />
          </AppLink>
        </section>
      )}

      {visibleMainApps.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <strong style={{ color: "#4B5563", fontSize: 12 }}>Main Apps</strong>
          <div
            style={{
              display: "flex",
              flexWrap: mobile ? "nowrap" : "wrap",
              gap: 9,
              marginTop: 9,
              overflowX: mobile ? "auto" : "visible",
              overflowY: "hidden",
              paddingBottom: 3,
              scrollSnapType: "x proximity",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {visibleMainApps.map(mainTile)}
          </div>
        </section>
      )}

      {(!query || visibleAllApps.length > 0) && (
      <section style={{ marginTop: 18 }}>
        <strong style={{ color: "#4B5563", fontSize: 12 }}>
          {query ? `Results (${filtered.length})` : "All STEA Apps"}
        </strong>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: mobile ? 8 : 9,
            marginTop: 9
          }}
        >
          {visibleAllApps.map(gridTile)}
        </div>
        {filtered.length === 0 && (
          <p style={{ padding: "24px 0", margin: 0, color: "#6B7280", fontSize: 13, textAlign: "center" }}>
            No STEA apps found.
          </p>
        )}
      </section>
      )}

      {query && filtered.length === 0 && (
        <p style={{ padding: "24px 0", margin: 0, color: "#6B7280", fontSize: 13, textAlign: "center" }}>
          No STEA apps found.
        </p>
      )}

      {!query && canInstall && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #E4E8ED" }}>
          <button
            onClick={async () => {
              if (isInstalled) return;
              try {
                const choice = await installApp();
                if (!choice) setInstallMessage("Install is not available on this browser yet");
              } catch (err) {
                setInstallMessage("Install is not available on this browser yet");
              }
            }}
            disabled={isInstalled}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: isInstalled ? "#F3F4F6" : "linear-gradient(135deg, #F5A623, #FFD17C)",
              color: isInstalled ? "#9CA3AF" : "#111",
              fontSize: 14,
              fontWeight: 800,
              cursor: isInstalled ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {isInstalled ? <Check size={16} strokeWidth={2.5} /> : <Download size={16} strokeWidth={2.5} />}
            {isInstalled ? "STEA App already installed" : "Install STEA App"}
          </button>
          {installMessage && !isInstalled && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626", textAlign: "center" }}>
              {installMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const overlay =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            role="presentation"
            onClick={close}
            style={
              mobile
                ? {
                    position: "fixed",
                    inset: 0,
                    zIndex: 2147483000,
                    display: "flex",
                    alignItems: "flex-end",
                    background: "rgba(17,24,39,.42)"
                  }
                : { position: "fixed", inset: 0, zIndex: 2147483000, background: "transparent" }
            }
          >
            <div style={mobile ? { width: "100%" } : { position: "fixed", top: panelPosition.top, left: panelPosition.left }}>
              {panel}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          placePanel();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        style={{
          height: 48,
          width: 48,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          border: "1px solid rgba(15,23,42,.08)",
          background: "#fff",
          color: "#111827",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(15,23,42,.04)",
          flexShrink: 0,
          ...actionButtonStyle
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>▦</span>
      </button>
      {overlay}
    </>
  );
}

export default STEAAppsLauncher;
