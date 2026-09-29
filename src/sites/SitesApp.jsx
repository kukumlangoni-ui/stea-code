/**
 * SitesApp — Dedicated Lightweight Application Entry for STEA
 *
 * Performance-engineered:
 *  - Eagerly loads ONLY Sites core components & context
 *  - Granular Suspense only for lazy subroutes (WebsiteDetailPage) and deferred UI (Install Banner)
 *  - Zero route-level Suspense blocking on /websites
 *  - Admin code is 100% lazy — public visitors download 0 KB of admin
 */
import React, { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { WebsitesDataProvider } from "../context/WebsitesDataContext.jsx";
import { SitesLanguageProvider } from "../i18n/index.js";
import { PWAProvider } from "../contexts/PWAContext.jsx";
import { SettingsProvider } from "../contexts/SettingsContext.jsx";
import { ErrorBoundary } from "../ErrorBoundary.jsx";
import { useAuth } from "../hooks/useAuth.js";
import WebsiteSolutionsPage from "../pages/WebsiteSolutionsPage.jsx";

const SitesInstallBanner = lazy(() => import("../components/sites/SitesInstallBanner.jsx"));
const WebsiteDetailPage = lazy(() => import("../pages/WebsiteDetailPage.jsx"));
const SitesAdminApp = lazy(() => import("./admin/SitesAdminApp.jsx"));
const SitesMemberAuthModal = lazy(() => import("../components/sites/SitesMemberAuthModal.jsx"));
const SuggestWebsiteModal = lazy(() => import("../components/sites/SuggestWebsiteModal.jsx"));
const SitesNotFoundPage = lazy(() => import("../pages/SitesNotFoundPage.jsx"));
const AfterDarkPage = lazy(() => import("../pages/AfterDarkPage.jsx"));
const AgeGateModal = lazy(() => import("../components/sites/AgeGateModal.jsx"));

export default function SitesApp() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [ageGateOpen, setAgeGateOpen] = useState(false);

  // Check Google redirect result on app mount if user returned from redirect login
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const { getFirebaseAuth, getRedirectResult, getFirebaseDb, doc, getDoc, setDoc, serverTimestamp } = await import("../firebase.js");
        const auth = getFirebaseAuth();
        if (!auth) return;
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const db = getFirebaseDb();
          if (db) {
            const ref = doc(db, "users", result.user.uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                uid: result.user.uid,
                name: result.user.displayName || "",
                email: result.user.email || "",
                role: "member",
                provider: "google",
                photoURL: result.user.photoURL || "",
                createdAt: serverTimestamp(),
                source: "stea_sites",
              });
            }
          }
        }
      } catch (err) {
        console.warn("SitesApp redirect auth check:", err);
      }
    };
    handleRedirectResult();
  }, []);

  useEffect(() => {
    const onOpenAuth = () => setAuthOpen(true);
    const onOpenSuggest = () => {
      // Membership gate: Only members can open Suggest modal
      const activeUser = user || (typeof window !== "undefined" && window._steaAuthUser);
      if (!activeUser && !loading) {
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
  }, [user, loading]);
  return (
    <ErrorBoundary>
      <SettingsProvider>
      <SitesLanguageProvider>
        <WebsitesDataProvider>
          <PWAProvider>
            <Suspense fallback={null}>
              <SitesInstallBanner />
            </Suspense>
            {authOpen && (
              <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--stea-page) 60%, transparent)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>}>
                <SitesMemberAuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
              </Suspense>
            )}
            {suggestOpen && (
              <Suspense fallback={null}>
                <SuggestWebsiteModal open={suggestOpen} onClose={() => setSuggestOpen(false)} user={user} />
              </Suspense>
            )}
            <Suspense fallback={null}>
              <AgeGateModal open={ageGateOpen} onClose={() => setAgeGateOpen(false)} />
            </Suspense>
            <Routes>
              <Route path="/websites" element={<WebsiteSolutionsPage />} />
              <Route path="/websites/:category" element={<WebsiteSolutionsPage />} />
              <Route path="/websites/:category/:subcategory" element={<WebsiteSolutionsPage />} />
              <Route
                path="/after-dark"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08090d" }} />}>
                    <AfterDarkPage />
                  </Suspense>
                }
              />
              <Route
                path="/websites/after-dark"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08090d" }} />}>
                    <AfterDarkPage />
                  </Suspense>
                }
              />
              <Route
                path="/mature"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#08090d" }} />}>
                    <AfterDarkPage />
                  </Suspense>
                }
              />
              <Route
                path="/site/:slug"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080B14" }} />}>
                    <WebsiteDetailPage />
                  </Suspense>
                }
              />
              <Route path="/favorites" element={<WebsiteSolutionsPage />} />
              <Route path="/category/:slug" element={<WebsiteSolutionsPage />} />
              <Route path="/website-solutions" element={<WebsiteSolutionsPage />} />
              <Route path="/website-solutions/:category" element={<WebsiteSolutionsPage />} />
              <Route path="/website-solutions/:category/:subcategory" element={<WebsiteSolutionsPage />} />
              {/* Admin — fully lazy, zero impact on public bundle */}
              <Route
                path="/admin/*"
                element={
                  <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080B14" }} />}>
                    <SitesAdminApp />
                  </Suspense>
                }
              />
              <Route path="/" element={<Navigate to="/websites" replace />} />
              <Route
                path="*"
                element={
                  <Suspense fallback={<div style={{ minHeight: "80vh", background: "#06080f" }} />}>
                    <SitesNotFoundPage />
                  </Suspense>
                }
              />
            </Routes>
            <style>{`
              html {
                scroll-behavior: smooth;
              }
              ::selection {
                background: rgba(245, 166, 35, 0.35);
                color: #ffffff;
              }
              ::-moz-selection {
                background: rgba(245, 166, 35, 0.35);
                color: #ffffff;
              }
              body {
                background-color: #06080f;
                background-image:
                  radial-gradient(ellipse at 50% 0%, rgba(245, 166, 35, 0.035) 0%, transparent 60%),
                  radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.02) 0%, transparent 40%),
                  url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
              }
            `}</style>
          </PWAProvider>
        </WebsitesDataProvider>
      </SitesLanguageProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
