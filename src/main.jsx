
// ============================================================
// Auto-recover from chunk-load failures (deploy race condition)
// When Vite's dynamic import fails because the browser has stale
// HTML pointing at a bundle hash that no longer exists, we reload
// the page once to fetch the fresh HTML + bundle pair.
// ============================================================
if (typeof window !== "undefined") {
  const RELOAD_KEY = "stea_chunk_reload_at";
  const now = Date.now();
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");

  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      // Only auto-reload if we haven't done so in the last 15 seconds
      if (now - last > 15000) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        window.location.reload();
      }
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = String(e?.reason?.message || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      if (now - last > 15000) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        window.location.reload();
      }
    }
  });
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

  // Safety: if the app crashes or fails to mount within 10 seconds, hide loader
  setTimeout(() => {
    const loader = document.getElementById('stea-boot-loader');
    if (loader && !loader.classList.contains('is-hidden')) {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 300);
    }
  }, 10000);
} catch (err) {
  console.error('Fatal error during React root creation:', err);
}

// Unregister any stale service workers and clear caches on every visit.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
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
