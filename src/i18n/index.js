import { sw } from './sw';
import { en } from './en';
export { sitesTranslations } from './translations.js';
export { SitesLanguageProvider, useSitesLanguage, useTranslation, sitesLanguageStorageKey, SUPPORTED_LANGUAGES } from './LanguageContext.jsx';

export const translations = {
  sw,
  en,
  ar: { ...en },
  fr: { ...en },
  zh: { ...en }
};

export const getTranslation = (lang, key) => {
  const activeValue = translations[lang] && translations[lang][key];
  const englishValue = translations["en"] && translations["en"][key];
  return activeValue || englishValue || key;
};
