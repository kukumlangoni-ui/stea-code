/**
 * CategoryOutlineIcons.jsx — Pure Inline Lucide Outline SVG Icons
 * Zero heavy libraries, pure lightweight SVG primitives, uniform 1.85px stroke.
 *
 * Part 1: 18 Homepage Main Category Icons (24px)
 * Part 2: 20 Developers Resources Sub-Category Icons (20px)
 */
import React from "react";
import {
  normalizeWebsiteCategorySlug,
  normalizeDeveloperSubcategorySlug,
} from "../../constants/categoryOrder.js";

// Part 1: Main Category SVG path definitions
const MAIN_CATEGORY_SVGS = {
  // 1. Live Sports → trophy
  "live-sports": (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </>
  ),
  // 2. Movies & TV Shows → film
  "movies-tv-shows": (
    <>
      <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
      <line x1="7" x2="7" y1="2" y2="22" />
      <line x1="17" x2="17" y1="2" y2="22" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="2" x2="7" y1="7" y2="7" />
      <line x1="2" x2="7" y1="17" y2="17" />
      <line x1="17" x2="22" y1="17" y2="17" />
      <line x1="17" x2="22" y1="7" y2="7" />
    </>
  ),
  // 3. eBooks → book
  ebooks: (
    <>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </>
  ),
  // 4. Life Hack → lightbulb
  "life-hack": (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  // 5. Money & Finance → wallet
  "money-finance": (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  // 6. Music → music
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  // 7. Games → gamepad-2
  games: (
    <>
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="6" />
    </>
  ),
  // 8. Online Courses → graduation-cap
  "online-courses": (
    <>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </>
  ),
  // 9. Comics → book-open
  comics: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  // 10. Graphics Design → palette
  "graphics-design": (
    <>
      <circle cx="13.5" cy="6.5" r=".7" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".7" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".7" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".7" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </>
  ),
  // 11. Jobs & Career → briefcase
  "jobs-career": (
    <>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  // 12. Asian Drama → clapperboard
  "asian-drama": (
    <>
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
      <path d="m6.2 5.3 3.1 3.9" />
      <path d="m12.4 3.4 3.1 4" />
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </>
  ),
  // 13. Manga → book-open-check
  manga: (
    <>
      <path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4Z" />
      <path d="m16 12 2 2 4-4" />
      <path d="M22 6V3h-6c-2.2 0-4 1.8-4 4v14c0-1.7 1.3-3 3-3h7v-2.3" />
    </>
  ),
  // 14. AdBlockers → shield-ban
  adblockers: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <circle cx="12" cy="11" r="3.5" />
      <path d="m9.5 13.5 5-5" />
    </>
  ),
  // 15. AI → bot
  ai: (
    <>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </>
  ),
  // 16. Automation → cogs / settings-2
  automation: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  // 17. Creativity → sparkles
  creativity: (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </>
  ),
  // 18. Developers Resources → laptop
  developers: (
    <>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </>
  ),
};

// Part 2: Developers Resources Sub-Categories SVG path definitions
const DEV_SUBCATEGORY_SVGS = {
  // 1. Vibe Coding & AI Dev → code-2
  "vibe-coding-ai-dev": (
    <>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </>
  ),
  // 2. Code Editors & IDEs → terminal-square
  "code-editors-ides": (
    <>
      <path d="m7 11 2-2-2-2" />
      <path d="M11 13h4" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </>
  ),
  // 3. Version Control → git-branch
  "version-control": (
    <>
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </>
  ),
  // 4. APIs & Services → link-2
  "apis-services": (
    <>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </>
  ),
  // 5. Web Development → globe
  "web-development": (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  // 6. App Development → smartphone
  "app-development": (
    <>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </>
  ),
  // 7. Backend Development → server
  "backend-development": (
    <>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </>
  ),
  // 8. Databases → database
  databases: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </>
  ),
  // 9. Cloud Platforms → cloud
  "cloud-platforms": (
    <>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </>
  ),
  // 10. Deployment & DevOps → rocket
  "deployment-devops": (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  // 11. UI/UX & Design Tools → layout
  "ui-ux-design": (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="9" x2="9" y1="21" y2="9" />
    </>
  ),
  // 12. Hosting & Domains → home-wifi
  "hosting-domains": (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 17a3 3 0 0 1 6 0" />
      <path d="M12 14v.01" />
    </>
  ),
  // 13. Testing & Debugging → bug-play
  "testing-debugging": (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="8" height="14" x="8" y="6" rx="4" />
      <path d="M19 7l3 2" />
      <path d="M5 7L2 9" />
      <path d="M19 19l3-2" />
      <path d="M5 19l-3-2" />
      <path d="M20 13h4" />
      <path d="M0 13h4" />
      <polygon points="10 11 10 15 14 13" fill="currentColor" />
    </>
  ),
  // 14. Performance & Monitoring → activity-square
  "performance-monitoring": (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M17 12h-2l-2 5-2-10-2 5H7" />
    </>
  ),
  // 15. Security → shield
  security: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </>
  ),
  // 16. Documentation & Learning → book-open
  "documentation-learning": (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  // 17. Community & Q&A → messages-square
  "community-qa": (
    <>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </>
  ),
  // 18. Blocks & Components → puzzle
  "blocks-components": (
    <>
      <path d="M19.439 7.85c0-1.574-1.277-2.85-2.85-2.85a2.85 2.85 0 0 0-2.85 2.85V9H10V5.261a2.85 2.85 0 0 0 2.85-2.85 2.85 2.85 0 0 0-5.7 0A2.85 2.85 0 0 0 10 5.26V9H6.261a2.85 2.85 0 0 0-2.85-2.85 2.85 2.85 0 0 0 0 5.7A2.85 2.85 0 0 0 6.26 9H10v3.739a2.85 2.85 0 0 0-2.85 2.85 2.85 2.85 0 0 0 5.7 0 2.85 2.85 0 0 0-2.85-2.85V9h3.739v3.739a2.85 2.85 0 0 0 2.85-2.85 2.85 2.85 0 0 0 0-5.7A2.85 2.85 0 0 0 19.44 9V7.85Z" />
    </>
  ),
  // 19. Open Source → github
  "open-source": (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </>
  ),
  // 20. Developer News → newspaper
  "developer-news": (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </>
  ),
};

// Aliases and slug variants
const CATEGORY_SLUG_ALIAS = {
  sports: "live-sports",
  football: "live-sports",
  movies: "movies-tv-shows",
  tv: "movies-tv-shows",
  books: "ebooks",
  finance: "money-finance",
  money: "money-finance",
  education: "online-courses",
  courses: "online-courses",
  design: "graphics-design",
  jobs: "jobs-career",
  career: "jobs-career",
  "ai-tools": "ai",
  tools: "developers",
  "developer-resources": "developers",
  "developers-resources": "developers",
  programming: "developers",
  coding: "developers",
};

const DEV_SUBCAT_SLUG_ALIAS = {
  "vibe-coding": "vibe-coding-ai-dev",
  "ai-dev": "vibe-coding-ai-dev",
  ides: "code-editors-ides",
  "code-editors": "code-editors-ides",
  git: "version-control",
  apis: "apis-services",
  frontend: "web-development",
  mobile: "app-development",
  backend: "backend-development",
  database: "databases",
  cloud: "cloud-platforms",
  devops: "deployment-devops",
  "ui-ux": "ui-ux-design",
  "ui-ux-and-design-tools": "ui-ux-design",
  domains: "hosting-domains",
  hosting: "hosting-domains",
  testing: "testing-debugging",
  monitoring: "performance-monitoring",
  learning: "documentation-learning",
  community: "community-qa",
  components: "blocks-components",
  blocks: "blocks-components",
  news: "developer-news",
};

/**
 * CategoryOutlineIcon — Renders 24px Lucide Outline SVG for main categories.
 */
export function CategoryOutlineIcon({ slug = "", size = 24, className = "" }) {
  const normalized = normalizeWebsiteCategorySlug(slug);
  const resolvedKey = CATEGORY_SLUG_ALIAS[normalized] || normalized;
  const svgContent = MAIN_CATEGORY_SVGS[resolvedKey] || MAIN_CATEGORY_SVGS["developers"];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`sites-cat-lucide-icon ${className}`}
      aria-hidden="true"
    >
      {svgContent}
    </svg>
  );
}

/**
 * DeveloperSubcategoryOutlineIcon — Renders 20px Lucide Outline SVG for developer subcategories.
 */
export function DeveloperSubcategoryOutlineIcon({ slug = "", size = 20, className = "" }) {
  const normalized = normalizeDeveloperSubcategorySlug(slug);
  const resolvedKey = DEV_SUBCAT_SLUG_ALIAS[normalized] || normalized;
  const svgContent = DEV_SUBCATEGORY_SVGS[resolvedKey] || DEV_SUBCATEGORY_SVGS["web-development"];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`sites-dev-lucide-icon ${className}`}
      aria-hidden="true"
    >
      {svgContent}
    </svg>
  );
}
