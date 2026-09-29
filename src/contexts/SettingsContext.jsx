import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../i18n';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('stea_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  
  const [language, setLanguage] = useState(() => {
    try {
      const isExplicit = localStorage.getItem("stea_lang_explicit");
      if (isExplicit === "true") {
        return localStorage.getItem('stea_lang') || 'en';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stea_theme', theme);
    } catch (e) {
      console.warn("localStorage not available", e);
    }
    
    const applyTheme = (t) => {
      const root = document.documentElement;
      if (t === 'light') {
        root.classList.add('light-mode');
      } else if (t === 'dark') {
        root.classList.remove('light-mode');
      } else {
        // System
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          root.classList.add('light-mode');
        } else {
          root.classList.remove('light-mode');
        }
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = (e) => {
        if (e.matches) {
          document.documentElement.classList.add('light-mode');
        } else {
          document.documentElement.classList.remove('light-mode');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('stea_lang', language);
    } catch (e) {
      console.warn("localStorage not available", e);
    }
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => getTranslation(language, key);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
