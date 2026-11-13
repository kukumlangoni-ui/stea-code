// BUILD-MARKER: cache-bust entry bundle after a poisoned edge response (2026-11-07)
if (typeof window !== "undefined") { window.__STEACODE_BUILD_ID__ = "2026-11-07a"; }
// ============================================================
// Auto-recover from chunk-load failures (deploy race condition)
// When Vite's dynamic import fails because the browser has stale
// HTML pointing at a bundle hash that no longer exists, we reload
// with a cache-bust param. Uses an attempt counter (max 3) instead
// of a single-shot timestamp so back-to-back deploys can't strand
// the user on the error screen. Counter clears after 2 min stable.
// ============================================================
if (typeof window !== "undefined") {
  const RECOVERY_KEY = "stea_chunk_recovery";
  const MAX_ATTEMPTS = 3;
  const WINDOW_MS = 120000;

  const isChunkError = (msg) =>
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      String(msg || "")
    );

  const recover = () => {
    const now = Date.now();
    let state = { attempts: 0, firstAt: 0 };
    try {
      state = JSON.parse(sessionStorage.getItem(RECOVERY_KEY) || "{}") || state;
    } catch { /* corrupted state — start fresh */ }

    const attempts = now - Number(state.firstAt || 0) > WINDOW_MS ? 0 : Number(state.attempts || 0);
    if (attempts >= MAX_ATTEMPTS) return false; // give up — let the error screen show

    sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({ attempts: attempts + 1, firstAt: state.firstAt || now })
    );
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(now));
    window.location.replace(url.toString());
    return true;
  };

  window.__steaRecoverChunkError = recover;

  window.addEventListener("error", (e) => {
    if (isChunkError(e?.message)) recover();
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (isChunkError(e?.reason?.message)) recover();
  });

  // App is stable — reset the counter so the next deploy gets fresh attempts
  setTimeout(() => sessionStorage.removeItem(RECOVERY_KEY), WINDOW_MS);
}

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

console.log('Main.jsx starting...');
window.__STEA_BUILD_VERSION = "alpha-tenant-cache-bust-20260708-002";

// Global error catcher for module loading errors
window.addEventListener('error', (e) => {
  const errData = { type: 'GLOBAL_ERROR', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: e.error ? String(e.error.stack || e.error) : null };
  originalConsoleError('GLOBAL RUNTIME ERROR:', e.message, e.filename, e.lineno);
  const sendLog = () => fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errData)
  }).catch(() => {});
  if ('requestIdleCallback' in window) {
    requestIdleCallback(sendLog, { timeout: 2000 });
  } else {
    setTimeout(sendLog, 0);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  const errData = { type: 'UNHANDLED_REJECTION', reason: e.reason ? String(e.reason.stack || e.reason) : String(e.reason) };
  originalConsoleError('UNHANDLED PROMISE REJECTION:', e.reason);
  const sendLog = () => fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errData)
  }).catch(() => {});
  if ('requestIdleCallback' in window) {
    requestIdleCallback(sendLog, { timeout: 2000 });
  } else {
    setTimeout(sendLog, 0);
  }
});

import React from 'react'
import ReactDOM from 'react-dom/client'
// Install the autoplay guard before any component mounts (patches media + Web Audio).
import './utils/audioGuard.js'
import App from './App.jsx'
import 'react-easy-crop/react-easy-crop.css'
import './index.css'

console.log('Main.jsx dependencies loaded');

// Safe console overrides to prevent "Converting circular structure to JSON"
const safeArgsMap = (args) => args.map(arg => {
  if (arg instanceof Error) return arg.message;
  if (arg && typeof arg === 'object') {
    try { JSON.stringify(arg); return arg; }
    catch { return String(arg); }
  }
  return arg;
});

console.error = (...args) => {
  const mapped = safeArgsMap(args);
  originalConsoleError.apply(console, mapped);
  const sendLog = () => fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'CONSOLE_ERROR', data: mapped, url: window.location.href, agent: navigator.userAgent })
  }).catch(() => {});
  if ('requestIdleCallback' in window) {
    requestIdleCallback(sendLog, { timeout: 2000 });
  } else {
    setTimeout(sendLog, 0);
  }
};
console.log = (...args) => originalConsoleLog.apply(console, safeArgsMap(args));
console.warn = (...args) => originalConsoleWarn.apply(console, safeArgsMap(args));

import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext.jsx";
import { CheckoutProvider } from "./contexts/CheckoutContext.jsx";
import { PWAProvider } from "./contexts/PWAContext.jsx";

console.log('Rendering App...');

// Last-resort fallback for a boot failure: if React never mounts (module
// evaluation error, browser API missing, inaccessible storage) the #root node
// stays empty and the user sees a blank page with no way forward. This writes
// a friendly message directly into the DOM, outside React.
const showFatalBootFallback = (detail) => {
  try {
    const container = document.getElementById('root');
    if (!container || container.childElementCount > 0) return;
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#080c14;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box">
        <div style="font-size:28px;margin-bottom:14px">⚠️</div>
        <h1 style="font-size:20px;color:#F5A623;margin:0 0 10px">Something went wrong</h1>
        <p style="font-size:14px;color:rgba(255,255,255,0.65);max-width:420px;margin:0 0 20px">The app could not start. Refresh the page to try again.</p>
        <button onclick="window.location.reload()" style="padding:10px 22px;border-radius:10px;background:#F5A623;color:#000;font-weight:700;font-size:14px;border:none;cursor:pointer">Refresh</button>
      </div>`;
    if (detail) originalConsoleError('[stea] boot fallback shown:', detail);
  } catch { /* nothing else we can do */ }
};

try {
  const container = document.getElementById('root');
  if (!container) throw new Error('Root container not found');
  
  const root = ReactDOM.createRoot(container);
  window._debugLogs = [];
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <SettingsProvider>
            <SiteSettingsProvider>
              <CheckoutProvider>
                <PWAProvider>
                  <App />
                </PWAProvider>
              </CheckoutProvider>
            </SiteSettingsProvider>
          </SettingsProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('App render initiated');

  // Hide the boot loader once React has committed and painted the first frame.
  const startTime = performance.now();
  const MIN_VISIBLE_MS = 400;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const elapsed = performance.now() - startTime;
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(() => {
        const loader = document.getElementById('stea-boot-loader');
        if (loader) {
          loader.classList.add('is-hidden');
          // Remove from DOM after fade-out
          setTimeout(() => loader.remove(), 300);
        }
      }, delay);
    });
  });

  // Safety: if the app crashes or fails to mount within 10 seconds, hide the
  // loader — and if #root is still empty, show a recovery message instead of
  // leaving the user on a blank page.
  setTimeout(() => {
    const loader = document.getElementById('stea-boot-loader');
    if (loader && !loader.classList.contains('is-hidden')) {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 300);
    }
    showFatalBootFallback('React tree did not mount within 10s');
  }, 10000);
} catch (err) {
  console.error('Fatal error during React root creation:', err);
  showFatalBootFallback(err);
}

// Unregister stale service workers and clear caches on every visit.
// Push-notification workers are intentionally kept:
//  - /sw.js                     → Monetag (verification + web push)
//  - /firebase-messaging-sw.js  → Firebase Cloud Messaging
const KEEP_SERVICE_WORKERS = ['/sw.js', '/firebase-messaging-sw.js'];
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        const scriptUrl = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
        if (KEEP_SERVICE_WORKERS.some((keep) => scriptUrl.endsWith(keep))) return;
        reg.unregister();
        console.info('[STEA] Unregistered stale service worker:', reg.scope);
      });
    });
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
  });
}
