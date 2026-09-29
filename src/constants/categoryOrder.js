export const DEFAULT_WEBSITE_CATEGORY_ORDER = [
  "live-sports",
  "movies-tv-shows",
  "ebooks",
  "life-hack",
  "money-finance",
  "music",
  "games",
  "online-courses",
  "comics",
  "graphics-design",
  "jobs-career",
  "asian-drama",
  "manga",
  "adblockers",
  "ai",
  "automation",
  "creativity",
  "developers"
];

export const DEVELOPER_SUBCATEGORY_ORDER = [
  "vibe-coding-ai-dev",
  "code-editors-ides",
  "version-control",
  "apis-services",
  "web-development",
  "app-development",
  "backend-development",
  "databases",
  "cloud-platforms",
  "deployment-devops",
  "hosting-domains",
  "ui-ux-design",
  "testing-debugging",
  "performance-monitoring",
  "security",
  "documentation-learning",
  "community-qa",
  "blocks-components",
  "open-source",
  "developer-news"
];

export const normalizeCategorySlugForOrder = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();

  const map = {
    // 1. Live Sports
    "live sports": "live-sports",
    "livesports": "live-sports",
    "live-sports": "live-sports",
    "sports": "live-sports",
    "sport": "live-sports",
    "football": "live-sports",

    // 2. Movies & TV Shows
    "movies & tv shows": "movies-tv-shows",
    "movies and tv shows": "movies-tv-shows",
    "movie and tv shows": "movies-tv-shows",
    "movie-tv-shows": "movies-tv-shows",
    "movies-and-tv-shows": "movies-tv-shows",
    "movies-tv": "movies-tv-shows",
    "movies": "movies-tv-shows",
    "movie": "movies-tv-shows",
    "tv": "movies-tv-shows",
    "tv shows": "movies-tv-shows",
    "shows": "movies-tv-shows",
    "film": "movies-tv-shows",

    // 3. eBooks
    "ebook": "ebooks",
    "ebooks": "ebooks",
    "e-books": "ebooks",
    "e books": "ebooks",
    "books": "ebooks",
    "book": "ebooks",

    // 4. Life Hack
    "lifehack": "life-hack",
    "life hacks": "life-hack",
    "life-hacks": "life-hack",
    "life-hack": "life-hack",
    "life hack": "life-hack",
    "everyday life": "life-hack",
    "life": "life-hack",

    // 5. Money & Finance
    "money-and-finance": "money-finance",
    "money & finance": "money-finance",
    "money and finance": "money-finance",
    "money finance": "money-finance",
    "money-finance": "money-finance",
    "finance": "money-finance",
    "money": "money-finance",

    // 6. Music
    "music": "music",
    "songs": "music",
    "audio": "music",

    // 7. Games
    "game": "games",
    "games": "games",
    "gaming": "games",

    // 8. Online Courses
    "online courses": "online-courses",
    "online course": "online-courses",
    "online-courses": "online-courses",
    "online-course": "online-courses",
    "courses": "online-courses",
    "course": "online-courses",
    "education": "online-courses",
    "learning": "online-courses",

    // 9. Comics
    "comic": "comics",
    "comics": "comics",
    "comic books": "comics",

    // 10. Graphics Design
    "graphics": "graphics-design",
    "graphic": "graphics-design",
    "graphic-design": "graphics-design",
    "graphic design": "graphics-design",
    "graphics design": "graphics-design",
    "graphics-design": "graphics-design",
    "design": "graphics-design",

    // 11. Jobs & Career
    "job-career": "jobs-career",
    "job career": "jobs-career",
    "jobs": "jobs-career",
    "career": "jobs-career",
    "jobs & career": "jobs-career",
    "jobs and career": "jobs-career",
    "jobs-career": "jobs-career",
    "work": "jobs-career",

    // 12. Asian Drama
    "asian drama": "asian-drama",
    "asian dramas": "asian-drama",
    "asian-dramas": "asian-drama",
    "asian-drama": "asian-drama",
    "k-drama": "asian-drama",
    "kdrama": "asian-drama",

    // 13. Manga
    "manga": "manga",
    "anime": "manga",

    // 14. AdBlockers & VPN
    "adblockers": "adblockers",
    "adblock": "adblockers",
    "ad blocker": "adblockers",
    "ad blockers": "adblockers",
    "ad-blocker": "adblockers",
    "ad-blockers": "adblockers",
    "adblocker": "adblockers",
    "adblocking": "adblockers",
    "ads blocker": "adblockers",
    "ads blockers": "adblockers",
    "advert blocker": "adblockers",
    "advert blockers": "adblockers",
    "adblockers & vpn": "adblockers",
    "adblockers and vpn": "adblockers",
    "ad blockers & vpn": "adblockers",
    "ad blockers and vpn": "adblockers",
    "ads blocker & vpn": "adblockers",
    "ads blocker and vpn": "adblockers",
    "adblockers-vpn": "adblockers",
    "adblocker-vpn": "adblockers",
    "vpn": "adblockers",
    "vpns": "adblockers",

    // 15. AI
    "ai": "ai",
    "artificial intelligence": "ai",
    "ai tools": "ai",
    "ai tool": "ai",
    "ai-tools": "ai",

    // 16. Automation
    "automation": "automation",
    "auto": "automation",
    "workflow": "automation",

    // 17. Creativity
    "creativity": "creativity",
    "creative": "creativity",

    // 18. Developers Resources (Canonical slug: developers)
    "developers": "developers",
    "developer": "developers",
    "developer resources": "developers",
    "developers resources": "developers",
    "developer-resources": "developers",
    "developers-resources": "developers",
    "programming": "developers",
    "coding": "developers",
    "developer tools": "developers",
    "dev tools": "developers",
    "tools": "developers",
    "tool": "developers",
    "dev": "developers",

    // Developer subcategories aliases
    "vibe-coding-ai-dev": "vibe-coding-ai-dev",
    "vibe coding & ai dev": "vibe-coding-ai-dev",
    "vibe coding and ai dev": "vibe-coding-ai-dev",
    "vibe coding": "vibe-coding-ai-dev",
    "vibe-coding": "vibe-coding-ai-dev",
    "ai dev": "vibe-coding-ai-dev",
    "ai coding": "vibe-coding-ai-dev",

    "code-editors-ides": "code-editors-ides",
    "code editors & ides": "code-editors-ides",
    "code editors and ides": "code-editors-ides",
    "code editors": "code-editors-ides",
    "ides": "code-editors-ides",
    "ide": "code-editors-ides",

    "version-control": "version-control",
    "version control": "version-control",
    "git": "version-control",

    "apis-services": "apis-services",
    "apis & services": "apis-services",
    "apis and services": "apis-services",
    "api": "apis-services",
    "apis": "apis-services",

    "web-development": "web-development",
    "web development": "web-development",
    "web dev": "web-development",
    "frontend": "web-development",

    "app-development": "app-development",
    "app development": "app-development",
    "mobile development": "app-development",

    "backend-development": "backend-development",
    "backend development": "backend-development",
    "backend": "backend-development",

    "databases": "databases",
    "database": "databases",
    "db": "databases",

    "cloud-platforms": "cloud-platforms",
    "cloud platforms": "cloud-platforms",
    "cloud": "cloud-platforms",

    "deployment-devops": "deployment-devops",
    "deployment & devops": "deployment-devops",
    "deployment and devops": "deployment-devops",
    "devops": "deployment-devops",
    "deployment": "deployment-devops",

    "hosting-domains": "hosting-domains",
    "hosting & domains": "hosting-domains",
    "hosting and domains": "hosting-domains",
    "hosting": "hosting-domains",
    "domains": "hosting-domains",

    "ui-ux-design": "ui-ux-design",
    "ui/ux & design tools": "ui-ux-design",
    "ui-ux & design tools": "ui-ux-design",
    "ui/ux design": "ui-ux-design",
    "ui design": "ui-ux-design",

    "testing-debugging": "testing-debugging",
    "testing & debugging": "testing-debugging",
    "testing and debugging": "testing-debugging",
    "testing": "testing-debugging",
    "debugging": "testing-debugging",

    "performance-monitoring": "performance-monitoring",
    "performance & monitoring": "performance-monitoring",
    "performance and monitoring": "performance-monitoring",
    "performance": "performance-monitoring",
    "monitoring": "performance-monitoring",

    "security": "security",
    "dev security": "security",

    "documentation-learning": "documentation-learning",
    "documentation & learning": "documentation-learning",
    "documentation and learning": "documentation-learning",
    "documentation": "documentation-learning",

    "community-qa": "community-qa",
    "community & q&a": "community-qa",
    "community and q&a": "community-qa",
    "community": "community-qa",
    "q&a": "community-qa",

    "blocks-components": "blocks-components",
    "blocks & components": "blocks-components",
    "blocks and components": "blocks-components",
    "components": "blocks-components",
    "ui blocks": "blocks-components",

    "open-source": "open-source",
    "open source": "open-source",
    "oss": "open-source",

    "developer-news": "developer-news",
    "developer news": "developer-news",
    "dev news": "developer-news"
  };

  if (map[raw]) return map[raw];

  return raw
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const normalizeWebsiteCategorySlug = normalizeCategorySlugForOrder;

export const normalizeDeveloperSubcategorySlug = (value = "") => {
  const normalized = normalizeCategorySlugForOrder(value);
  if (DEVELOPER_SUBCATEGORY_ORDER.includes(normalized)) return normalized;
  return normalized;
};

export const getWebsiteCategoryPossibleValues = (website = {}) => [
  website.category,
  website.categorySlug,
  website.categoryName,
  ...(Array.isArray(website.categories) ? website.categories : []),
  website.categoryId
].filter(Boolean);

export const getWebsiteSubcategoryPossibleValues = (website = {}) => [
  website.subcategory,
  website.subcategorySlug,
  website.subCategory,
  website.subCategoryId,
  website.subCategoryName
].filter(Boolean);

export const websiteMatchesCategory = (website, category) => {
  const categorySlug = normalizeWebsiteCategorySlug(
    category?.slug || category?.id || category?.categoryId || category?.name || category
  );

  // If matching "developers", any website with category "developers" (or legacy "programming"/"tools")
  // OR any website assigned to any developer subcategory matches.
  if (categorySlug === "developers") {
    const isDirectDev = getWebsiteCategoryPossibleValues(website).some((value) => {
      const norm = normalizeWebsiteCategorySlug(value);
      return norm === "developers";
    });
    if (isDirectDev) return true;

    // Check if website has a recognized developer subcategory
    const subVal = getWebsiteSubcategoryPossibleValues(website);
    if (subVal.length > 0) {
      return subVal.some((v) => DEVELOPER_SUBCATEGORY_ORDER.includes(normalizeDeveloperSubcategorySlug(v)));
    }

    return false;
  }

  // If category is one of the developer subcategories, match subcategory
  if (DEVELOPER_SUBCATEGORY_ORDER.includes(categorySlug)) {
    return websiteMatchesSubcategory(website, categorySlug);
  }

  return getWebsiteCategoryPossibleValues(website).some(
    (value) => normalizeWebsiteCategorySlug(value) === categorySlug
  );
};

export const websiteMatchesSubcategory = (website, subcategory) => {
  const targetSlug = normalizeDeveloperSubcategorySlug(
    subcategory?.slug || subcategory?.id || subcategory?.name || subcategory
  );

  const subValues = getWebsiteSubcategoryPossibleValues(website);
  if (subValues.some((v) => normalizeDeveloperSubcategorySlug(v) === targetSlug)) {
    return true;
  }

  // Also check if tags contain the subcategory keywords
  if (Array.isArray(website.tags) && website.tags.length > 0) {
    const rawTarget = targetSlug.replace(/-/g, " ");
    const hasTagMatch = website.tags.some((t) => {
      const tagNorm = String(t || "").toLowerCase().trim();
      return tagNorm === targetSlug || tagNorm === rawTarget;
    });
    if (hasTagMatch) return true;
  }

  return false;
};

export const getWebsiteCountForCategory = (category, websites = []) => {
  return (websites || []).filter((website) => websiteMatchesCategory(website, category)).length;
};

export const getWebsiteCountForSubcategory = (subcategory, websites = []) => {
  return (websites || []).filter((website) => websiteMatchesSubcategory(website, subcategory)).length;
};

export const getDefaultCategorySortOrder = (category) => {
  const slug = normalizeCategorySlugForOrder(
    category?.slug || category?.id || category?.name || category
  );

  const index = DEFAULT_WEBSITE_CATEGORY_ORDER.indexOf(slug);
  return index === -1 ? 999 : index + 1;
};

export const sortWebsiteCategories = (categories = []) => {
  return [...categories].sort((a, b) => {
    const aSlug = normalizeCategorySlugForOrder(a.slug || a.id || a.name);
    const bSlug = normalizeCategorySlugForOrder(b.slug || b.id || b.name);

    const aDefault = getDefaultCategorySortOrder(aSlug);
    const bDefault = getDefaultCategorySortOrder(bSlug);

    if (aDefault !== bDefault) return aDefault - bDefault;

    const aSort = Number(a.sortOrder ?? 999);
    const bSort = Number(b.sortOrder ?? 999);

    if (aSort !== bSort) return aSort - bSort;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
};
