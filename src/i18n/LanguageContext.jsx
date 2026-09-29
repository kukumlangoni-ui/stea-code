import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "../../locales/en.json";

const STORAGE_KEY = "stea_sites_language";
const SUPPORTED_LANGUAGES = ["en", "sw", "zh"];
const LANGUAGE_LOADERS = {
  sw: () => import("../../locales/sw.json"),
  zh: () => import("../../locales/zh.json"),
};

const loadedLocales = { en };
const LEGACY_KEY_ALIASES = {
  websitesTitle: "hero.badge",
  searchPlaceholder: "search.placeholder",
  discoverTitle: "hero.title",
  discoverSubtitle: "hero.subtitle",
  loadingWebsites: "empty.loadingWebsites",
  noWebsitesYet: "empty.noWebsitesYet",
  connectionProblem: "error.connectionProblem",
  connectionProblemMessage: "error.connectionProblemMessage",
  tryAgain: "buttons.retry",
  websites: "category.websites",
  openWebsite: "buttons.openWebsite",
  saveToFavorites: "buttons.saveToFavorites",
  downloadWebsite: "buttons.downloadWebsite",
  share: "buttons.share",
  copyLink: "buttons.copyLink",
  copied: "buttons.copied",
  feedback: "buttons.feedback",
  reportBrokenLink: "buttons.reportBrokenLink",
  importantInfo: "buttons.importantInfo",
  curatedByStea: "detail.curatedByStea",
  savedOnDevice: "notifications.saved",
  removedFromFavorites: "notifications.removedFromFavorites",
  websiteLinkCopied: "notifications.websiteLinkCopied",
  downloadGuideTitle: "detail.downloadGuideTitle",
  downloadGuideSubtitle: "detail.downloadGuideSubtitle",
  android: "detail.android",
  iphone: "detail.iphone",
  computer: "detail.computer",
  downloadAndroid1: "detail.downloadAndroid1",
  downloadAndroid2: "detail.downloadAndroid2",
  downloadAndroid3: "detail.downloadAndroid3",
  downloadAndroid4: "detail.downloadAndroid4",
  downloadIphone1: "detail.downloadIphone1",
  downloadIphone2: "detail.downloadIphone2",
  downloadIphone3: "detail.downloadIphone3",
  downloadIphone4: "detail.downloadIphone4",
  downloadComputer1: "detail.downloadComputer1",
  downloadComputer2: "detail.downloadComputer2",
  downloadComputer3: "detail.downloadComputer3",
  downloadApp: "buttons.downloadApp",
  openWebsiteFirst: "buttons.openWebsiteFirst",
  close: "buttons.close",
  importantInfoTitle: "detail.betterExperienceTitle",
  importantInfoMessage: "detail.betterExperienceMessage",
  adBlockerWebsites: "buttons.adBlockerWebsites",
  steaVpn: "buttons.steaVpn",
  vpnComingSoon: "notifications.vpnComingSoon",
  sendFeedback: "detail.sendFeedback",
  feedbackPlaceholder: "detail.feedbackPlaceholder",
  submit: "buttons.submit",
  cancel: "buttons.cancel",
  thanksFeedback: "notifications.thanksFeedback",
  language: "nav.language",
  notifications: "nav.notifications",
  steaApps: "nav.apps",
  profile: "nav.profile",
  signIn: "nav.signIn",
  notificationsComingSoon: "notifications.comingSoon",
  english: "language.english",
  kiswahili: "language.swahili",
  chooseDisplayLanguage: "language.chooseDisplayLanguage",
  categoryOnlineCourses: "categories.online-courses",
  categoryMoneyFinance: "categories.money-finance",
  categoryProgramming: "categories.programming",
  categoryJobsCareer: "categories.jobs-career",
  categoryGraphicsDesign: "categories.graphics-design",
  categoryLifeHack: "categories.life-hack",
  categoryAdBlockers: "categories.ad-blockers",
  categoryAutomation: "categories.automation",
  categoryGames: "categories.games",
  categoryAi: "categories.ai",
  categoryLiveSports: "categories.live-sports",
  categoryManga: "categories.manga",
  categoryEbooks: "categories.ebooks",
  categoryComics: "categories.comics",
  categoryMoviesTvShows: "categories.movies-tv-shows"
};

const SitesLanguageContext = createContext({
  lang: "en",
  language: "en",
  setLang: () => {},
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

function safeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "en";
}

function readInitialLanguage() {
  try {
    const isExplicit = localStorage.getItem("stea_lang_explicit");
    if (isExplicit === "true") {
      return safeLanguage(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("stea_lang") || "en");
    }
    return "en";
  } catch {
    return "en";
  }
}

function readPath(source, key) {
  if (!source || !key) return undefined;
  return String(key).split(".").reduce((current, part) => {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) return current[part];
    return undefined;
  }, source);
}

function interpolate(value, params = {}) {
  if (typeof value !== "string") return "";
  return value.replace(/\{(\w+)\}/g, (_, name) => {
    const next = params[name];
    return next === undefined || next === null ? "" : String(next);
  });
}

export function SitesLanguageProvider({ children }) {
  const [languageState, setLanguageState] = useState(readInitialLanguage);
  const [locales, setLocales] = useState(loadedLocales);
  const lang = safeLanguage(languageState);

  useEffect(() => {
    if (lang === "en" || locales[lang]) return undefined;
    let cancelled = false;
    LANGUAGE_LOADERS[lang]?.()
      .then((module) => {
        if (cancelled) return;
        const messages = module.default || module;
        loadedLocales[lang] = messages;
        setLocales((current) => ({ ...current, [lang]: messages }));
      })
      .catch((error) => {
        console.warn(`[sites-i18n] Could not load ${lang}; falling back to English.`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, locales]);

  const setLang = useCallback((nextLanguage) => {
    const next = safeLanguage(nextLanguage);
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem("stea_lang", next);
      localStorage.setItem("stea_lang_explicit", "true");
    } catch {}
  }, []);

  const t = useCallback((key, fallbackOrParams, maybeParams) => {
    const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
    const params = typeof fallbackOrParams === "object" && fallbackOrParams !== null ? fallbackOrParams : (maybeParams || {});
    const resolvedKey = LEGACY_KEY_ALIASES[key] || key;
    const activeValue = readPath(locales[lang], resolvedKey);
    const englishValue = readPath(en, resolvedKey);
    const value = activeValue || englishValue || fallback || key;
    return interpolate(value, params);
  }, [lang, locales]);

  const value = useMemo(() => ({
    lang,
    language: lang,
    setLang,
    setLanguage: setLang,
    t,
  }), [lang, setLang, t]);

  return <SitesLanguageContext.Provider value={value}>{children}</SitesLanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(SitesLanguageContext);
}

export function useSitesLanguage() {
  return useTranslation();
}

export { STORAGE_KEY as sitesLanguageStorageKey, SUPPORTED_LANGUAGES };
