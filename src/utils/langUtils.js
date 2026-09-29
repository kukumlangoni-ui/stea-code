/**
 * Helper to get content in the selected language with fallback.
 * @param {Object} item - The data object from database
 * @param {string} field - The base field name (e.g. 'title', 'description')
 * @param {string} language - Current selected language ('sw' or 'en')
 * @param {string} fallbackText - Default text if everything is empty
 * @returns {string}
 */
export const getLangContent = (item, field, language, fallbackText = "") => {
  if (!item) return fallbackText;
  
  const swField = `${field}_sw`;
  const enField = `${field}_en`;
  
  // Logic: 
  // 1. Try specified language field
  // 2. Try the other language field
  // 3. Try the legacy base field
  // 4. Return fallback
  
  if (language === 'sw') {
    return item[swField] || item[enField] || item[field] || fallbackText;
  } else {
    return item[enField] || item[swField] || item[field] || fallbackText;
  }
};
