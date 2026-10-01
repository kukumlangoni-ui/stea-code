/**
 * STEA Code — Application Router (code.stea.africa)
 *
 * Standalone developer marketplace.
 * Backend: Cloudflare Worker (stea-api) + D1 + R2
 * Auth: Firebase (amplified-cache-487223-d3)
 */
import React, { Suspense, lazy, Component } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SitesLanguageProvider } from "./i18n/index.js";
import { PWAProvider } from "./contexts/PWAContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { useAuth } from "./hooks/useAuth.js";

// Code pages
const SteaCodeShellV2 = lazy(() => import("./pages/stea-code/SteaCodeShellV2.jsx"));
const SteaCodeHomeV2 = lazy(() => import("./pages/stea-code/SteaCodeHomeV2.jsx"));
const SteaCodeAdminApp = lazy(() => import("./admin-v2/SteaCodeAdminApp.jsx"));
const SteaCodeNotFoundPage = lazy(() => import("./pages/stea-code/SteaCodeNotFoundPage.jsx"));

// Shared
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.jsx"));
import CookieConsentBanner from "./components/stea-code/CookieConsentBanner.jsx";
import { useConsentGatedScripts } from "./hooks/useConsentGatedScripts.js";

class LocalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // LAYER 2 — chunk-load failure recovery
    // During deploys, HTML and JS bundles can be out of sync. If a
    // dynamic import fails on a stale hash, silently reload once with
    // a cache-bust param instead of showing the error screen.
    const msg = String(error?.message || "");
    const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg);

    if (isChunkError) {
      const now = Date.now();
      const last = Number(sessionStorage.getItem("stea_chunk_reload_at") || "0");
      if (now - last > 20000) {
        sessionStorage.setItem("stea_chunk_reload_at", String(now));
        const clean = window.location.href.split("?")[0];
        window.location.replace(`${clean}?_r=${now}`);
        return;
      }
    }

    console.error("STEA Code Error Boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          backgroundColor: "#080c14", color: "#fff",
          padding: "24px", fontFamily: "system-ui, sans-serif", textAlign: "center"
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(245, 166, 35, 0.12)",
            border: "1px solid rgba(245, 166, 35, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, marginBottom: 16
          }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0", color: "#F5A623" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 0 20px 0" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px", borderRadius: "10px",
              background: "#F5A623", color: "#000", fontWeight: 700,
              fontSize: "14px", border: "none", cursor: "pointer"
            }}
          >Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0f',
    }}>
      <img
        src="/stea-apps/stea-code.png"
        alt=""
        width="56" height="37"
        style={{
          opacity: 0.9,
          filter: 'drop-shadow(0 0 18px rgba(37, 99, 235, 0.35))',
          animation: 'stea-code-fallback-breathe 2.4s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes stea-code-fallback-breathe {
          0%, 100% { opacity: 0.9;  transform: scale(1);    }
          50%      { opacity: 0.65; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes stea-code-fallback-breathe {
            0%, 100% { opacity: 0.9; transform: scale(1); }
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  useConsentGatedScripts();

  return (
    <LocalErrorBoundary>
      <SettingsProvider>
        <SitesLanguageProvider>
          <PWAProvider>
            <div className="stea-master-root" style={{ minHeight: "100vh", background: "#080c14", overflow: "visible" }}>
              <CookieConsentBanner />
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<SteaCodeHomeV2 user={user} authLoading={authLoading} />} />

                  {/* Code shell */}
                  <Route path="/code" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
                  <Route path="/code/products/:slug" element={<SteaCodeHomeV2 user={user} authLoading={authLoading} />} />
                  <Route path="/products/:slug" element={<SteaCodeHomeV2 user={user} authLoading={authLoading} />} />
                  <Route path="/code/*" element={<SteaCodeNotFoundPage />} />
                  <Route path="/products/*" element={<SteaCodeNotFoundPage />} />
                  <Route path="/daily" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
                  <Route path="/developers" element={<Navigate to="/" replace />} />
                  <Route path="/dev" element={<Navigate to="/" replace />} />

                  {/* Admin */}
                  <Route
                    path="/admin/*"
                    element={<SteaCodeAdminApp baseRoute="/admin" user={user} authLoading={authLoading} onRequireSignIn={() => window.dispatchEvent(new Event("open-auth"))} />}
                  />
                  <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
                  <Route
                    path="/code-admin/*"
                    element={<SteaCodeAdminApp baseRoute="/code-admin" user={user} authLoading={authLoading} onRequireSignIn={() => window.dispatchEvent(new Event("open-auth"))} />}
                  />
                  <Route path="/code-admin" element={<Navigate to="/code-admin/products" replace />} />

                  {/* Legacy redirects → Code views */}
                  <Route path="/prompt-lab" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/prompts" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/prompt/*" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/digital-tools" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/tools" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/subscriptions" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/chatgpt" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/ai" element={<Navigate to="/code?view=tools" replace />} />
                  <Route path="/courses" element={<Navigate to="/code?view=learn" replace />} />
                  <Route path="/learning" element={<Navigate to="/code?view=learn" replace />} />
                  <Route path="/exams" element={<Navigate to="/code?view=learn" replace />} />
                  <Route path="/necta" element={<Navigate to="/code?view=learn" replace />} />
                  <Route path="/notes" element={<Navigate to="/code?view=learn" replace />} />
                  <Route path="/past-papers" element={<Navigate to="/code?view=learn" replace />} />

                  {/* Legal */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<SteaCodeNotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          </PWAProvider>
        </SitesLanguageProvider>
      </SettingsProvider>
    </LocalErrorBoundary>
  );
}
