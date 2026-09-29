/**
 * STEA — Clean Master Application Router
 *
 * Unified Architecture:
 *  1. STEA Sites (Master Discovery on stea.africa & sites.stea.africa)
 *  2. STEA Code (Developer Hub on code.stea.africa & /code)
 *  3. Unified Shared STEA Auth & Account Identity
 */
import React, { Suspense, lazy, Component, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { WebsitesDataProvider } from "./context/WebsitesDataContext.jsx";
import { SitesLanguageProvider } from "./i18n/index.js";
import { PWAProvider } from "./contexts/PWAContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { isSteaCodeHost } from "./utils/subdomains.js";

// Core Master STEA Pages
const WebsiteSolutionsPage = lazy(() => import("./pages/WebsiteSolutionsPage.jsx"));

// Modals
const SitesMemberAuthModal = lazy(() => import("./components/sites/SitesMemberAuthModal.jsx"));
const SuggestWebsiteModal = lazy(() => import("./components/sites/SuggestWebsiteModal.jsx"));
const AgeGateModal = lazy(() => import("./components/sites/AgeGateModal.jsx"));

// Lazy-loaded Submodules & Products
const WebsiteDetailPage = lazy(() => import("./pages/WebsiteDetailPage.jsx"));
const AfterDarkPage = lazy(() => import("./pages/AfterDarkPage.jsx"));
const SteaCodeShellV2 = lazy(() => import("./pages/stea-code/SteaCodeShellV2.jsx"));
const SteaCodeHomeV2 = lazy(() => import("./pages/stea-code/SteaCodeHomeV2.jsx"));
const SitesAdminApp = lazy(() => import("./sites/admin/SitesAdminApp.jsx"));
const SteaCodeAdminApp = lazy(() => import("./admin-v2/SteaCodeAdminApp.jsx"));
const SteaCodeNotFoundPage = lazy(() => import("./pages/stea-code/SteaCodeNotFoundPage.jsx"));
const SitesNotFoundPage = lazy(() => import("./pages/SitesNotFoundPage.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.jsx"));
import CookieConsentBanner from "./components/stea-code/CookieConsentBanner.jsx";
import { useConsentGatedScripts } from "./hooks/useConsentGatedScripts.js";

// ── Error Boundary ──────────────────────────────────────────────────────────
class LocalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("STEA Error Boundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080c14",
          color: "#fff",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center"
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "rgba(245, 166, 35, 0.12)",
            border: "1px solid rgba(245, 166, 35, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 16
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0", color: "#F5A623" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 0 20px 0" }}>
            {this.state.error?.message || "An unexpected error occurred while loading this view."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#F5A623",
              color: "#000",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Reload STEA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Subtle Loading Screen ───────────────────────────────────────────────────
function PageLoadingFallback() {
  const isSteaCode =
    typeof window !== 'undefined' &&
    window.location.hostname === 'code.stea.africa';

  if (!isSteaCode) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#05060a',
      }} />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
    }}>
      <img
        src="/stea-apps/stea-code.png"
        alt=""
        width="56"
        height="37"
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

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isCodeHost = isSteaCodeHost(hostname);

  // GDPR Consent-Gated Scripts
  useConsentGatedScripts();

  const [authOpen, setAuthOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [ageGateOpen, setAgeGateOpen] = useState(false);

  useEffect(() => {
    const onOpenAuth = () => setAuthOpen(true);
    const onOpenSuggest = () => {
      const activeUser = user || (typeof window !== "undefined" && window._steaAuthUser);
      if (!activeUser && !authLoading) {
        setAuthOpen(true);
      } else {
        setSuggestOpen(true);
      }
    };
    const onOpenAgeGate = () => setAgeGateOpen(true);

    window.addEventListener("open-auth", onOpenAuth);
    window.addEventListener("open-suggest-site", onOpenSuggest);
    window.addEventListener("open-age-gate", onOpenAgeGate);
    return () => {
      window.removeEventListener("open-auth", onOpenAuth);
      window.removeEventListener("open-suggest-site", onOpenSuggest);
      window.removeEventListener("open-age-gate", onOpenAgeGate);
    };
  }, [user, authLoading]);

  return (
    <LocalErrorBoundary>
      <SettingsProvider>
        <SitesLanguageProvider>
          <WebsitesDataProvider>
            <PWAProvider>
              <div className="stea-master-root" style={{ minHeight: "100vh", background: "#080c14", overflow: "visible" }}>
                <CookieConsentBanner />
                {authOpen && (
                  <Suspense fallback={null}>
                    <SitesMemberAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
                  </Suspense>
                )}
                {suggestOpen && (
                  <Suspense fallback={null}>
                    <SuggestWebsiteModal open={suggestOpen} onClose={() => setSuggestOpen(false)} user={user} />
                  </Suspense>
                )}
                {ageGateOpen && (
                  <Suspense fallback={null}>
                    <AgeGateModal open={ageGateOpen} onClose={() => setAgeGateOpen(false)} />
                  </Suspense>
                )}
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    {/* 1. STEA Master / Sites Core Routes */}
                    <Route
                      path="/"
                      element={
                        isCodeHost
                          ? <SteaCodeHomeV2 user={user} authLoading={authLoading} />
                          : <WebsiteSolutionsPage />
                      }
                    />
                    <Route path="/websites" element={<WebsiteSolutionsPage />} />
                    <Route path="/websites/:category" element={<WebsiteSolutionsPage />} />
                    <Route path="/website-solutions" element={<Navigate to="/websites" replace />} />
                    <Route path="/website-solutions/:category" element={<WebsiteSolutionsPage />} />
                    <Route path="/site/:slug" element={<WebsiteDetailPage />} />
                    <Route path="/after-dark" element={<AfterDarkPage />} />
                    <Route path="/websites/after-dark" element={<AfterDarkPage />} />
                    <Route path="/mature" element={<AfterDarkPage />} />

                    {/* 2. STEA Code Developer Hub Routes */}
                    <Route
                      path="/code"
                      element={
                        isCodeHost
                          ? <Navigate to={{ pathname: "/", search: location.search }} replace />
                          : <SteaCodeShellV2 />
                      }
                    />
                    <Route
                      path="/code/products/:slug"
                      element={
                        isCodeHost
                          ? <SteaCodeHomeV2 user={user} authLoading={authLoading} />
                          : <SteaCodeShellV2 />
                      }
                    />
                    <Route
                      path="/products/:slug"
                      element={
                        isCodeHost
                          ? <SteaCodeHomeV2 user={user} authLoading={authLoading} />
                          : <Navigate to="/code" replace />
                      }
                    />
                    <Route
                      path="/code/*"
                      element={
                        isCodeHost
                          ? <SteaCodeNotFoundPage />
                          : <SteaCodeShellV2 />
                      }
                    />
                    <Route
                      path="/products/*"
                      element={
                        isCodeHost
                          ? <SteaCodeNotFoundPage />
                          : <Navigate to="/code" replace />
                      }
                    />
                    <Route
                      path="/daily"
                      element={
                        isCodeHost
                          ? <Navigate to={{ pathname: "/", search: location.search }} replace />
                          : <Navigate to="/code?view=tools" replace />
                      }
                    />
                    <Route path="/developers" element={<Navigate to={isCodeHost ? "/" : "/code"} replace />} />
                    <Route path="/dev" element={<Navigate to={isCodeHost ? "/" : "/code"} replace />} />

                    {/* 3. Administration */}
                    <Route
                      path="/admin/*"
                      element={
                        isCodeHost
                          ? <SteaCodeAdminApp baseRoute="/admin" user={user} authLoading={authLoading} onRequireSignIn={() => setAuthOpen(true)} />
                          : <SitesAdminApp />
                      }
                    />
                    <Route path="/admin" element={<Navigate to={isCodeHost ? "/admin/products" : "/admin/"} replace />} />
                    <Route
                      path="/code-admin/*"
                      element={<SteaCodeAdminApp baseRoute="/code-admin" user={user} authLoading={authLoading} onRequireSignIn={() => setAuthOpen(true)} />}
                    />
                    <Route path="/code-admin" element={<Navigate to="/code-admin/products" replace />} />

                    {/* 4. Backward-Compatible Legacy Redirects to STEA Code */}
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

                    {/* 5. Backward-Compatible Legacy Redirects to STEA Sites */}
                    <Route path="/classroom" element={<Navigate to="/" replace />} />
                    <Route path="/classroom/*" element={<Navigate to="/" replace />} />
                    <Route path="/alpha" element={<Navigate to="/" replace />} />
                    <Route path="/alpha/*" element={<Navigate to="/" replace />} />
                    <Route path="/attendance" element={<Navigate to="/" replace />} />
                    <Route path="/attendance/*" element={<Navigate to="/" replace />} />
                    <Route path="/marketplace" element={<Navigate to="/" replace />} />
                    <Route path="/duka" element={<Navigate to="/" replace />} />
                    <Route path="/chaba" element={<Navigate to="/" replace />} />
                    <Route path="/seller" element={<Navigate to="/" replace />} />
                    <Route path="/seller/*" element={<Navigate to="/" replace />} />
                    <Route path="/creators" element={<Navigate to="/" replace />} />
                    <Route path="/creators/*" element={<Navigate to="/" replace />} />
                    <Route path="/gigs" element={<Navigate to="/" replace />} />
                    <Route path="/jobs" element={<Navigate to="/" replace />} />
                    <Route path="/menu" element={<Navigate to="/" replace />} />
                    <Route path="/utilities" element={<Navigate to="/" replace />} />

                    {/* 6. Legal & Compliance */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />

                    {/* 7. Catch-all fallback */}
                    <Route
                      path="*"
                      element={
                        isCodeHost
                          ? <SteaCodeNotFoundPage />
                          : <SitesNotFoundPage />
                      }
                    />
                  </Routes>
                </Suspense>
              </div>
            </PWAProvider>
          </WebsitesDataProvider>
        </SitesLanguageProvider>
      </SettingsProvider>
    </LocalErrorBoundary>
  );
}
