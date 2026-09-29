import React, { useState, useEffect, useRef } from "react";
import { useSitesLanguage } from "../../i18n/index.js";
import { useSettings } from "../../contexts/SettingsContext.jsx";

const LANGUAGE_OPTIONS = [
  { code: "en", labelKey: "language.english", label: "English", short: "EN" },
  { code: "sw", labelKey: "language.swahili", label: "Kiswahili", short: "SW" },
  { code: "zh", labelKey: "language.chinese", label: "中文", short: "ZH" },
];

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export function setCookie(name, value, days = 365) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;domain=.stea.africa;SameSite=Lax;Secure`;
}

export function STEALanguageSwitcher({ actionButtonStyle = {}, onMenuToggle }) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const containerRef = useRef(null);

  // Hook contexts safely
  let contextLang = "en";
  let contextSetLang = null;
  let contextT = null;

  try {
    const sitesLang = useSitesLanguage();
    if (sitesLang) {
      contextLang = sitesLang.lang || sitesLang.language;
      contextSetLang = sitesLang.setLang || sitesLang.setLanguage;
      contextT = sitesLang.t;
    }
  } catch {}

  try {
    const settingsLang = useSettings();
    if (settingsLang && !contextSetLang) {
      contextLang = settingsLang.language;
      contextSetLang = settingsLang.setLanguage;
    }
  } catch {}

  const activeLanguage = ["en", "sw", "zh"].includes(contextLang) ? contextLang : "en";
  const activeOption = LANGUAGE_OPTIONS.find((option) => option.code === activeLanguage) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    // Sync cookie/localStorage initial load
    const cookieVal = getCookie("stea_lang");
    let isExplicit = false;
    try { isExplicit = localStorage.getItem("stea_lang_explicit") === "true"; } catch {}

    if (isExplicit && ["en", "sw", "zh"].includes(cookieVal) && cookieVal !== activeLanguage && contextSetLang) {
      contextSetLang(cookieVal);
    } else if (!isExplicit && contextLang !== "en" && contextSetLang) {
      // Force EN if not explicitly set
      contextSetLang("en");
    }
  }, [activeLanguage, contextSetLang, contextLang]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (code) => {
    if (contextSetLang) {
      contextSetLang(code);
    }
    setCookie("stea_lang", code);
    try {
      localStorage.setItem("stea_lang", code);
      localStorage.setItem("stea_sites_language", code);
      localStorage.setItem("stea_lang_explicit", "true");
    } catch {}
    setLanguageOpen(false);
  };

  const languageLabel = activeOption.short;

  return (
    <div ref={containerRef} className="stea-language-switcher-wrap" style={{ position: "relative", display: "inline-flex" }}>
      <button 
        type="button" 
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          border: "1px solid #E5EAF0",
          background: "#fff",
          color: "#374151",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          ...actionButtonStyle
        }} 
        onClick={() => {
          const next = !languageOpen;
          setLanguageOpen(next);
          onMenuToggle?.(next);
        }} 
        aria-label={`Language ${languageLabel}`}
      >
        <span style={{ fontSize: 12, fontWeight: 900, color: "#8F6D00" }}>{languageLabel}</span>
      </button>
      {languageOpen && (
        <div 
          className="stea-shared-product-header__panel"
          style={{
            position: "absolute",
            right: 0,
            top: 56,
            width: 230,
            padding: 8,
            border: "1px solid #E5EAF0",
            borderRadius: 16,
            background: "#fff",
            boxShadow: "0 18px 42px rgba(17,24,39,.14)",
            zIndex: 2000,
            display: "grid",
            gap: 4
          }}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <button 
              key={option.code} 
              type="button" 
              className={activeLanguage === option.code ? "active" : ""} 
              onClick={() => handleSelectLanguage(option.code)}
              style={{
                minHeight: 42,
                border: 0,
                borderRadius: 10,
                background: activeLanguage === option.code ? "#F8FAFC" : "transparent",
                color: activeLanguage === option.code ? "#8F6D00" : "#111827",
                display: "grid",
                gridTemplateColumns: "28px minmax(0,1fr) auto",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                textAlign: "left",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              <span style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>🌐</span>
              <strong style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{contextT ? contextT(option.labelKey, option.label) : option.label}</strong>
              <small style={{ fontSize: 10, color: "#64748B", fontWeight: 800 }}>{option.short}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default STEALanguageSwitcher;
