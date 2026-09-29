
export const normalizeString = (str) => {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "");
};

export const createSearchIndex = (item) => {
  const fields = [
    item.title || item.name || "",
    item.description || "",
    item.category || "",
    item.subcategory || item.subCategory || "",
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.keywords) ? item.keywords : [])
  ];
  return fields.map(normalizeString).filter(Boolean).join(" ");
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const getSearchFields = (item) => {
  const title = item.title || item.name || "";
  return {
    searchTitle: normalizeString(title),
    searchKeywords: createSearchIndex(item)
  };
};
