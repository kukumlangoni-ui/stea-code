import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext();

export const PWAProvider = ({ children }) => {
  const [deferredPrompt,    setDeferredPrompt]    = useState(null);
  const [isInstalled,       setIsInstalled]       = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [updateAvailable,    setUpdateAvailable]    = useState(false);

  useEffect(() => {
    // ── Install prompt ──────────────────────────────────────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log("beforeinstallprompt fired");
      window.__steaDeferredPrompt = e;
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__steaDeferredPrompt = null;
      setDeferredPrompt(null);
      setShowInstallSuccess(true);
      setTimeout(() => setShowInstallSuccess(false), 5000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    const promptEvent = deferredPrompt || window.__steaDeferredPrompt;
    if (!promptEvent) return { outcome: "unavailable" };
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      window.__steaDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
    return choice || { outcome: "dismissed" };
  };

  return (
    <PWAContext.Provider value={{ deferredPrompt, isInstalled, installApp, showInstallSuccess, updateAvailable }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) throw new Error('usePWA must be used within a PWAProvider');
  return context;
};
