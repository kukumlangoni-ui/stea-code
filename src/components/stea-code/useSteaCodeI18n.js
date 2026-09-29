/* ======================================================================
 * STEA Code V2 — region + localization hooks.
 * Wraps existing `useSitesLanguage` and exposes:
 *   - uiLocale: "en" | "zhCN" | "sw" (current UI language id)
 *   - tLocal(value): resolve {en, zhCN?, sw?} or plain string → string
 *   - region: "GLOBAL" | "MAINLAND_CN" (based on TZ + user override)
 *   - isMainlandCN, setRegionOverride(region|null) persisted in localStorage
 *
 * No new provider — piggybacks on SitesLanguageProvider in App.jsx.
 * =================================================================== */

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSitesLanguage } from "../../i18n/index.js";
import { pickLocal, toLocal } from "../../data/stea-code/canonical.js";

const REGION_STORAGE_KEY = "stea-code:region-override";

function readNavigatorRegionFallback() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (/Asia\/Shanghai|Asia\/Urumqi|Asia\/Chongqing|Asia\/Harbin|Asia\/Hong_Kong|Asia\/Macau/.test(tz)) {
      return "MAINLAND_CN";
    }
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    if (/zh-(CN|Hans|SG)/i.test(lang)) return "MAINLAND_CN";
    return "GLOBAL";
  } catch {
    return "GLOBAL";
  }
}

function readRegionOverride() {
  try {
    const raw = localStorage.getItem(REGION_STORAGE_KEY);
    if (raw === "MAINLAND_CN" || raw === "GLOBAL") return raw;
    return null;
  } catch {
    return null;
  }
}

let regionListenerVersion = 0;
const regionListeners = new Set();
function emitRegionChange() {
  regionListenerVersion += 1;
  regionListeners.forEach((l) => l(regionListenerVersion));
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === REGION_STORAGE_KEY) emitRegionChange();
  });
}

/**
 * Return [subscribe, getSnapshot, getServerSnapshot] tuple for useSyncExternalStore
 * to keep region-UI state sync across tabs/components.
 */
function useRegionStore() {
  const value = useSyncExternalStore(
    (cb) => {
      const wrapper = () => cb();
      regionListeners.add(wrapper);
      return () => regionListeners.delete(wrapper);
    },
    () => {
      const override = readRegionOverride();
      return override ?? readNavigatorRegionFallback();
    },
    () => "GLOBAL"
  );
  return value;
}

export function useSteaCodeI18n() {
  const sitesLanguage = useSitesLanguage() || {};
  const sitesLocale = sitesLanguage.locale || sitesLanguage.lang || sitesLanguage.language || "en";
  const setSitesLocale = sitesLanguage.setLocale || sitesLanguage.setLang || sitesLanguage.setLanguage || (() => {});
  const uiLocale = sitesLocale === "zh" || sitesLocale === "zhCN" || sitesLocale === "zh-CN"
    ? "zhCN"
    : sitesLocale === "sw" || sitesLocale === "sw-KE" || sitesLocale === "sw-TZ"
      ? "sw"
      : "en";

  const region = useRegionStore();
  const isMainlandCN = region === "MAINLAND_CN";

  const setRegionOverride = useMemo(
    () => (nextRegion) => {
      try {
        if (nextRegion == null || nextRegion === false) {
          localStorage.removeItem(REGION_STORAGE_KEY);
        } else if (nextRegion === "MAINLAND_CN" || nextRegion === "GLOBAL") {
          localStorage.setItem(REGION_STORAGE_KEY, nextRegion);
        }
      } catch {
        /* ignore */
      }
      emitRegionChange();
    },
    []
  );

  const tLocal = useMemo(
    () => (value, overrides) => {
      const lang = (overrides && overrides.lang) || uiLocale;
      const out = pickLocal(value, lang);
      return typeof out === "string" ? out : toLocal(value || "").en || "";
    },
    [uiLocale]
  );

  const setUiLocale = useMemo(
    () => (nextLocale) => {
      if (nextLocale === "zhCN" || nextLocale === "zh" || nextLocale === "zh-CN") setSitesLocale("zh");
      else if (nextLocale === "sw") setSitesLocale("sw");
      else setSitesLocale("en");
    },
    [setSitesLocale]
  );

  return { uiLocale, setUiLocale, tLocal, region, isMainlandCN, setRegionOverride };
}

/**
 * Convert world/category titles (may be plain string or {en,zhCN,sw}) into
 * Searchable/Tag text. Used by SearchPalette grouping.
 */
export function asSearchText(value) {
  const en = pickLocal(value, "en") || "";
  const zh = pickLocal(value, "zhCN") || "";
  const sw = pickLocal(value, "sw") || "";
  return `${en} ${zh} ${sw}`;
}

export const STEA_CODE_SUPPORTED_LOCALES = ["en", "zhCN", "sw"];
