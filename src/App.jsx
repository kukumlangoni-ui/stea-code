/**
 * STEA Code — Application Router (code.stea.africa)
 *
 * Standalone developer marketplace.
 * Backend: Cloudflare Worker (stea-api) + D1 + R2
 * Auth: Cloudflare Access for the storefront; Firebase auth still backs the admin app
 */
import React, { Suspense, lazy, Component } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SitesLanguageProvider } from "./i18n/index.js";
import { PWAProvider } from "./contexts/PWAContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useCloudflareAuth } from "./hooks/useCloudflareAuth.js";

// Code pages
const SteaCodeHomeV2 = lazy(() => import("./pages/stea-code/SteaCodeHomeV2.jsx"));
const SteaCodeAdminApp = lazy(() => import("./admin-v2/SteaCodeAdminApp.jsx"));
const StaffAuthGate = lazy(() => import("./admin-v2/StaffAuthGate.jsx"));
const StaffLoginPage = lazy(() => import("./admin-v2/StaffLoginPage.jsx"));
const SteaCodeNotFoundPage = lazy(() => import("./pages/stea-code/SteaCodeNotFoundPage.jsx"));
const LibraryReader = lazy(() => import("./pages/stea-code/LibraryReader.jsx"));
const StoreHomePage = lazy(() => import("./pages/stea-code/store/StoreHomePage.jsx"));
const StoreSalesPage = lazy(() => import("./pages/stea-code/store/StoreSalesPage.jsx"));
const StoreReaderPage = lazy(() => import("./pages/stea-code/store/StoreReaderPage.jsx"));
const SteaCodeAboutPage = lazy(() => import("./pages/stea-code/SteaCodeAboutPage.jsx"));
const SteaCodeContactPage = lazy(() => import("./pages/stea-code/SteaCodeContactPage.jsx"));
const SteaCodeServicesPage = lazy(() => import("./pages/stea-code/SteaCodeServicesPage.jsx"));
const SteaCodeTermsPage = lazy(() => import("./pages/stea-code/SteaCodeTermsPage.jsx"));
const SteaCodeLicensingPage = lazy(() => import("./pages/stea-code/SteaCodeLicensingPage.jsx"));
const SteaCodeBlogPage = lazy(() => import("./pages/stea-code/blog/SteaCodeBlogPage.jsx"));
const SteaCodeBlogPostPage = lazy(() => import("./pages/stea-code/blog/SteaCodeBlogPostPage.jsx"));
const SteaCodeBlogShell = lazy(() => import("./components/stea-code/SteaCodeBlogShell.jsx"));

// Shared
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.jsx"));
// import CookieConsentBanner from "./components/stea-code/CookieConsentBanner.jsx";
import { useConsentGatedScripts } from "./hooks/useConsentGatedScripts.js";
import EzoicRouteListener from "./components/stea-code/EzoicRouteListener.jsx";
import StickyFooterAd from "./components/stea-code/StickyFooterAd.jsx";
import SteaCodeChatbot from "./components/stea-code/SteaCodeChatbot.jsx";

const isChunkLoadError = (message) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String(message || "")
  );

// Noisy but harmless errors that must never replace the app with an error
// screen (ResizeObserver is fired by the live previews, "Script error." comes
// from cross-origin ad scripts, AbortError from cancelled fetches).
const BENIGN_ERROR =
  /ResizeObserver loop|^Script error\.?$|AbortError|The operation was aborted|Non-Error promise rejection|play\(\) failed because the user didn't interact/i;

class LocalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleWindowError = this.handleWindowError.bind(this);
    this.handleRejection = this.handleRejection.bind(this);
    this.captureFatal = this.captureFatal.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    if (typeof window === "undefined") return;
    // Render/lifecycle crashes reach componentDidCatch. Crashes thrown from
    // effects, WebGL init, Web Audio nodes or event handlers do NOT — they
    // surface here instead. Without these listeners those failures leave a
    // mounted-but-empty tree, i.e. the blank page.
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleRejection);
  }

  componentWillUnmount() {
    if (typeof window === "undefined") return;
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
  }

  componentDidCatch(error, info) {
    const msg = String(error?.message || "");

    // LAYER 2 — chunk-load failure recovery
    // Delegates to the shared recovery helper in main.jsx (attempt
    // counter + cache-bust). Only shows the error screen after the
    // helper gives up (3 failed attempts within 2 minutes).
    if (isChunkLoadError(msg) && typeof window !== "undefined") {
      const recovered = window.__steaRecoverChunkError?.();
      if (recovered) return; // navigation in progress — error screen may flash briefly
    }

    this.setState({ errorInfo: info });
    console.error("STEA Code Error Boundary:", error, info);
  }

  handleWindowError(event) {
    // Resource load failures (img/script/preload) fire "error" with no
    // `error` object — those must not take the app down.
    if (!event?.error) return;
    this.captureFatal(event.error);
  }

  handleRejection(event) {
    const reason = event?.reason;
    // Third-party ad/analytics scripts reject with strings or plain objects.
    // Only a real Error with a stack indicates an application crash.
    if (!(reason instanceof Error) || !reason.stack) return;
    this.captureFatal(reason);
  }

  captureFatal(error) {
    if (this.state.hasError) return;
    const message = String(error?.message || "");
    if (!message) return;

    if (isChunkLoadError(message)) {
      window.__steaRecoverChunkError?.();
      return; // a full reload is already being attempted
    }
    if (BENIGN_ERROR.test(message)) return;

    // Async errors (event handlers, timers, isolated previews) usually leave a
    // perfectly usable page behind. Only take over the screen when the app
    // rendered nothing — that is the blank-page case we need to fix. If the
    // tree is alive, log it and let the page continue.
    const rootEl = document.getElementById("root");
    const appIsBlank = !rootEl || rootEl.childElementCount === 0;

    console.error("STEA Code fatal async error:", error);
    if (!appIsBlank) return;

    this.setState({ hasError: true, error });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const detail = import.meta.env.DEV
        ? String(this.state.error?.stack || this.state.error?.message || "")
        : "";
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
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: 460, margin: "0 0 20px 0" }}>
            The page could not finish loading. Refresh to try again.
          </p>
          {detail && (
            <pre style={{
              maxWidth: 720, width: "100%", maxHeight: 220, overflow: "auto",
              textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word",
              padding: 14, borderRadius: 10, marginBottom: 20, fontSize: 11,
              background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#fca5a5",
            }}>{detail}</pre>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px", borderRadius: "10px",
                background: "#F5A623", color: "#000", fontWeight: 700,
                fontSize: "14px", border: "none", cursor: "pointer"
              }}
            >Refresh</button>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 20px", borderRadius: "10px",
                background: "transparent", color: "rgba(255,255,255,0.7)", fontWeight: 600,
                fontSize: "14px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer"
              }}
            >Try again</button>
          </div>
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
        src="/stea-code-logo.png"
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
  // Storefront sessions come from Cloudflare Access.
  const { user: cfUser, loading: cfLoading } = useCloudflareAuth();
  // Admin still relies on the legacy Firebase staff flow.
  const { user: firebaseUser, loading: firebaseLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useConsentGatedScripts();

  return (
    <LocalErrorBoundary>
      <SettingsProvider>
        <SitesLanguageProvider>
          <PWAProvider>
            <div className="stea-master-root" style={{ minHeight: "100vh", background: "#050505", overflow: "visible" }}>
              {/* <CookieConsentBanner /> removed */}
              <Suspense fallback={<PageLoadingFallback />}>
                <EzoicRouteListener />
                <StickyFooterAd />
                {/* Floating assistant — hangs around the whole storefront.
                    Hidden on admin/staff surfaces. */}
                {!/^\/(admin|code-admin|staff)/.test(location.pathname) && (
                  <SteaCodeChatbot
                    onCommand={(action) => {
                      if (!action || typeof action !== "object") return;
                      if (action.type === "tab" && action.tab) {
                        const sp = new URLSearchParams();
                        sp.set("tab", String(action.tab));
                        if (action.category && action.category !== "All") sp.set("category", String(action.category));
                        if (action.sub) sp.set("sub", String(action.sub));
                        navigate(`/?${sp.toString()}`);
                        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                      } else if (action.type === "url" && action.url) {
                        navigate(action.url);
                        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                      } else if (action.type === "search") {
                        // Ensure the homepage (with its hero search) is mounted,
                        // then let HomeV2 focus + prefill the search box.
                        if (!location.pathname.startsWith("/library") && location.pathname !== "/") {
                          navigate("/");
                        }
                        window.setTimeout(() => {
                          window.dispatchEvent(new CustomEvent("stea:chatbot-search", { detail: action.query || "" }));
                        }, location.pathname === "/" ? 120 : 500);
                      }
                    }}
                  />
                )}
                <Routes>
                  {/* SteaCodeHomeV2 stays mounted across all homepage tabs + product
                      detail routes. This prevents the catalog from being refetched
                      and images from being re-downloaded whenever the user navigates
                      between the grid and a product detail (/products/:slug), or
                      presses the browser Back button.

                      Layout-route pattern (same as the blog/about shells below):
                      the pathless parent renders an <Outlet/> pass-through, and each
                      leaf carries its own <SteaCodeHomeV2/> element. An element-less
                      leaf makes React Router warn "matched leaf route does not have
                      an element" and render a null Outlet. HomeV2 is the same
                      component type at every leaf, so the instance and its cached
                      catalog state are preserved across these navigations. */}
                  <Route element={<Outlet />}>
                    <Route path="/" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/components" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/templates" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/kits" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/library" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/icons" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/code/products/:slug" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                    <Route path="/products/:slug" element={<SteaCodeHomeV2 user={cfUser} authLoading={cfLoading} />} />
                  </Route>

                  {/* Legacy standalone /code shell redirects before SteaCodeHomeV2 */}
                  <Route path="/code" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
                  <Route path="/layouts" element={<Navigate to="/templates" replace />} />
                  <Route path="/library/read/:slug" element={<LibraryReader user={cfUser} authLoading={cfLoading} />} />

                  {/* Blog — wrapped in the marketplace shell (sticky nav + footer) */}
                  <Route element={<SteaCodeBlogShell />}>
                    <Route path="/blog" element={<SteaCodeBlogPage />} />
                    <Route path="/blog/:slug" element={<SteaCodeBlogPostPage />} />
                  </Route>

                  {/* E-book & Notes Store */}
                  <Route path="/store" element={<StoreHomePage />} />
                  <Route path="/store/read/:slug" element={<StoreReaderPage user={cfUser} authLoading={cfLoading} />} />
                  <Route path="/store/:slug" element={<StoreSalesPage />} />
                  <Route path="/code/*" element={<SteaCodeNotFoundPage />} />
                  <Route path="/products/*" element={<SteaCodeNotFoundPage />} />
                  <Route path="/daily" element={<Navigate to={{ pathname: "/", search: location.search }} replace />} />
                  <Route path="/developers" element={<Navigate to="/" replace />} />
                  <Route path="/dev" element={<Navigate to="/" replace />} />

                  {/* Staff login (parallel to Firebase, takes priority via StaffAuthGate) */}
                  <Route path="/staff/login" element={<StaffLoginPage />} />

                  {/* Admin */}
                  <Route
                    path="/admin/*"
                    element={
                      <StaffAuthGate>
                        <SteaCodeAdminApp baseRoute="/admin" user={firebaseUser} authLoading={firebaseLoading} onRequireSignIn={() => window.dispatchEvent(new Event("open-auth"))} />
                      </StaffAuthGate>
                    }
                  />
                  <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
                  <Route
                    path="/code-admin/*"
                    element={
                      <StaffAuthGate>
                        <SteaCodeAdminApp baseRoute="/code-admin" user={firebaseUser} authLoading={firebaseLoading} onRequireSignIn={() => window.dispatchEvent(new Event("open-auth"))} />
                      </StaffAuthGate>
                    }
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

                  {/* Icon Gallery — lives in the homepage "Icons" tab now;
                      keep the old URL as a deep link to it. */}
                  {/* /icons is now a real tab route (declared above) */}

                  {/* About & trust + Legal — same marketplace shell as the blog
                      (sticky top nav + footer + newsletter modal) */}
                  <Route element={<SteaCodeBlogShell />}>
                    <Route path="/about" element={<SteaCodeAboutPage />} />
                    <Route path="/contact" element={<SteaCodeContactPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/terms" element={<SteaCodeTermsPage />} />
                    <Route path="/licensing" element={<SteaCodeLicensingPage />} />
                  </Route>
                  <Route path="/hello" element={<Navigate to="/contact" replace />} />
                  <Route path="/book-a-call" element={<SteaCodeServicesPage />} />

                  {/* Legal redirects */}
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
