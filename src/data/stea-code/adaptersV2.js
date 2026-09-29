/* ======================================================================
 * STEA Code V2 — Firestore/legacy adapters → canonical model.
 *   stea_code_resources         → PATTERNS (+ categorize by UI lib tags → also BUILD patterns via category heuristics)
 *   stea_code_inspiration       → INSPIRATION
 *   stea_code_hosting           → RESOURCES (bucket ship + some bucket tools via "DNS"/"domain" stays ship; "monitoring"/"analytics"/"security" → both)
 *   stea_code_resources_directory → RESOURCES (bucket tools + heuristically bucket ship if host-related)
 *   LEGACY (stea_daily/tips/resources/updates/study_resources) → KNOWLEDGE via strict positive/reject tokens
 * =================================================================== */

import { mkPattern, mkResource, mkKnowledge, mkInspiration, strArr } from "./canonical.js";

/* --------------------- categorization heuristics ------------------ */

const PATTERN_CATEGORIES = [
  "Components",
  "Layouts",
  "Navigation",
  "Forms",
  "Buttons",
  "Cards",
  "Modals",
  "Authentication UI",
  "Tables",
  "Dashboards",
  "Landing Sections",
  "Animations",
  "Loaders",
  "Background Effects",
  "Mobile Patterns",
];

const BUILD_TECH_FILTERS = [
  "HTML/CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue",
  "Svelte",
  "Tailwind",
  "Flutter",
];

function classifyPatternCategory(text, fallback) {
  const t = String(text || "").toLowerCase();
  const table = [
    [/modal|dialog|drawer|popup/, "Modals"],
    [/table|datatable|grid/, "Tables"],
    [/auth|login|signin|signup|register/, "Authentication UI"],
    [/dashboard|admin panel|panel/, "Dashboards"],
    [/landing|hero|cta|features? section|pricing|banner/, "Landing Sections"],
    [/navbar|navigation|nav|menu|breadcrumbs|tabs|sidebar/, "Navigation"],
    [/button|cta|toggle|chip/, "Buttons"],
    [/card|tile|feature card/, "Cards"],
    [/layout|grid|flex|stack|container|hero layout/, "Layouts"],
    [/form|input|select|radio|checkbox|textarea|validation/, "Forms"],
    [/animation|motion|transition|hover|micro.?interaction/, "Animations"],
    [/loader|spinner|skeleton|loading|shimmer/, "Loaders"],
    [/background|gradient|mesh|blob|particles|canvas/, "Background Effects"],
    [/mobile|bottom nav|onboarding|ios|android/, "Mobile Patterns"],
  ];
  for (const [re, name] of table) if (re.test(t)) return name;
  return fallback || "Components";
}

function classifyPatternFramework(framework, language, title) {
  const t = `${framework || ""} ${language || ""} ${title || ""}`.toLowerCase();
  const map = [
    [/next\.?js|nextjs/, "Next.js"],
    [/react/, "React"],
    [/vue/, "Vue"],
    [/svelte/, "Svelte"],
    [/tailwind/, "Tailwind"],
    [/flutter/, "Flutter"],
    [/typescript|\bts\b/, "TypeScript"],
    [/javascript|vanilla|\bjs\b/, "JavaScript"],
    [/css\b|scss|sass|stylus|html\b/, "HTML/CSS"],
  ];
  for (const [re, name] of map) if (re.test(t)) return name;
  return BUILD_TECH_FILTERS[1];
}

/* --------------------- Resource heuristics ------------------------- */

const TOOLS_CATEGORIES = [
  "Code & IDE",
  "AI Coding",
  "Source Control",
  "API Development",
  "Design",
  "Assets",
  "Database",
  "Authentication",
  "Testing",
  "DevOps",
  "Monitoring",
  "Analytics",
  "Productivity",
  "Documentation",
  "Packages & Mirrors",
  "Security",
  "Performance",
];

const SHIP_SUBSECTIONS = ["deploy", "hosting", "domains", "backend", "production"];

function resourceBucketsAndSections(categories, tags, description) {
  const text = `${strArr(categories).join(" ")} ${strArr(tags).join(" ")} ${description || ""}`.toLowerCase();
  const buckets = new Set();
  const shipSections = new Set();
  const deployHints = /deploy|deployment|vercel|netlify|render|amplify|heroku|serverless|static|container|frontend hosting|fullstack host/;
  const hostingHints = /host|vps|cloud|server|kubernetes|docker|vm|bare metal|instance/;
  const domainHints = /domain|dns|registrar|ssl|certificate|cdn|nameserver|whois|ttl/;
  const backendHints = /database|storage|auth(entication)?|realtime|queue|caching|cache|redis|rabbit|kafka/;
  const productionHints = /monitor|analytics|error track|logging|apm|performance|security|pager|sentry|datadog|new relic/;
  const toolHints = /ide|editor|code editor|a.i|ai coding|copilot|source control|git|repository|api dev|postman|insomnia|graphql|design tool|figma|sketch|asset|icon|image|testing|test|framework|devops|ci\/cd|pipeline|documentation|docs|package manager|mirror|npm|security tool|perf tool|lighthouse|productivity/;
  if (deployHints.test(text)) { buckets.add("ship"); shipSections.add("deploy"); }
  if (hostingHints.test(text)) { buckets.add("ship"); shipSections.add("hosting"); }
  if (domainHints.test(text)) { buckets.add("ship"); shipSections.add("domains"); }
  if (backendHints.test(text)) { buckets.add("ship"); shipSections.add("backend"); }
  if (productionHints.test(text)) { buckets.add("ship"); shipSections.add("production"); }
  if (toolHints.test(text) || /tool|service|sdk|extension|cli|app|platform/.test(text)) buckets.add("tools");
  if (buckets.size === 0) buckets.add("tools");
  return { buckets: Array.from(buckets), shipSections: Array.from(shipSections) };
}

function labelToolsCategory(text, fallback) {
  const t = String(text || "").toLowerCase();
  const table = [
    [/ide|editor|code editor|vscode|jetbrains|neovim|sublime/, "Code & IDE"],
    [/ai.?coding|copilot|code assistant|ai dev|code gen|ghostwriter|cody/, "AI Coding"],
    [/git|repository|source control|version|merge|diff|github|gitlab|bitbucket|gitee/, "Source Control"],
    [/api|postman|insomnia|openapi|graphql|rest|soap|grpc|mock/, "API Development"],
    [/design|figma|sketch|adobe|xd|prototyp/, "Design"],
    [/assets?|icon|unsplash|image|photo|font|illustrat/, "Assets"],
    [/database|db |sql|nosql|postgres|mysql|redis|mongo|supabase|firebase|planetscale|cockroach/, "Database"],
    [/auth|login|oauth|jwt|clerk|auth0|supabase auth|firebase auth/, "Authentication"],
    [/test|jest|vitest|playwright|cypress|mocha|unit|e2e|qa/, "Testing"],
    [/devops|ci|cd|github actions|gitlab ci|jenkins|terraform|iac|pipeline/, "DevOps"],
    [/monitor|apm|sentry|datadog|new relic|grafana|prometheus|uptime/, "Monitoring"],
    [/analytics|plausible|umami|ga|goatcounter|mixpanel|amplitude/, "Analytics"],
    [/productivity|todo|note|calendar|focus/, "Productivity"],
    [/document|docs|swagger|storybook|docusaurus|mdx|wiki|readme/, "Documentation"],
    [/package|mirror|npm|pnpm|yarn|registry|npmmirror|pip|gem|cargo/, "Packages & Mirrors"],
    [/security|vuln|scan|sast|dast|firewall|waf|oauth|pen test/, "Security"],
    [/performance|lighthouse|perf|speed|web vitals|cwv|bundle/, "Performance"],
  ];
  for (const [re, name] of table) if (re.test(t)) return name;
  return fallback ?? "Productivity";
}

/* --------------------- Knowledge filters --------------------------- */

const DEV_POSITIVE =
  /\b(?:html|css|javascript|typescript|react|next\.?js|git|github|gitlab|firebase|apis?|api|databases?|database|authentication|auth|hosting|host|deployment|deploy|domains?|dns|seo|performance|accessibility|a11y|pwa|frontend|backend|web development|web dev|component|hooks?|state|server|node|node\.?js|vite|npm|yarn|pnpm|webpack|rollup|rest|graphql|jwt|oauth|sql|nosql|redis|cache|caching|ci|cd|pipeline|docker|container|kubernetes|lambda|function|ssl|https|responsive|layout|animation|motion|debug|lint|testing|test|typesafety|schema|prisma|orm|middleware|router|routing|redux|zustand|svelte|vue|angular|tailwind|sass|bootstrap|shadcn|radix|storybook|astro|remix|gatsby|vercel|netlify|cloudflare|render|supabase|postgresql|mysql|mongodb|ai code|code assistant|copilot|codebase|refactor|bundler|build tool|cli|command line|terminal|shell|bash|zsh|scripting|framework|library|package|dependency|markdown|mdx|svg|canvas|webgl|three\.?js|gsap|framer|lighthouse|core web vitals|pagespeed|lcp|cls|inp|fcp|tbt|deployment|frontend|backend|fullstack|full stack|dom|eslint|prettier|typescript|javascript|html|css)\b/;

const DEV_REJECT =
  /\b(?:iphone|ipad|ios 1|ios 2|macos ventura|macos sonoma|watchos|tvos|ipados|android \d+|samsung|samsung s|galaxy|pixel|oneplus|xiaomi|redmi|oppo|vivo|realme|tecno|infinix|itel|huawei|honor|nokia \d|feature phone|smartphone news|tablet spec|laptop spec|laptop price|tvs? ?os|airpods|apple watch|macbook|imac|playstation|ps5|ps4|xbox|nintendo|netflix|spotify|whatsapp update|telegram update|tiktok|instagram|facebook update|x update|twitter update|google ai pro|gemini advanced|chatgpt plus|subscription price|price cut|discount|deal|offer|buying guide|unboxing|leak|leaked|rumor|rumour|launch date|pre.?order|camera|battery life|charging|5g|ota update|firmware update|software update(?!.*(?:react|next|node|firebase|web|vite|npm|css|html|javascript|typescript|tailwind|git)))\b/i;

const KNOWLEDGE_TOPICS = [
  "HTML/CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Backend",
  "Git",
  "APIs",
  "Database",
  "Deployment",
  "Domains",
  "Performance",
  "Security",
  "AI Development",
];

function classifyKnowledgeTopics(text, baseTopics = []) {
  const t = String(text || "").toLowerCase();
  const out = new Set(baseTopics);
  const table = [
    [/html|css|sass|tailwind|bootstrap|responsive|layout|grid|flexbox/, "HTML/CSS"],
    [/javascript|vanilla js|\bjs\b|ecmascript/, "JavaScript"],
    [/typescript|\bts\b|type ?safe/, "TypeScript"],
    [/react|next\.?js|nextjs|remix|gatsby/, "React"],
    [/backend|node|express|fastify|nest|koa|server|api|django|flask|rails|laravel/, "Backend"],
    [/git|github|gitlab|commit|repo|repository|version control/, "Git"],
    [/api|rest|graphql|openapi|endpoint|postman|insomnia|grpc/, "APIs"],
    [/database|sql|nosql|postgres|mysql|mongodb|redis|supabase|firebase|dbms/, "Database"],
    [/deploy|deployment|vercel|netlify|render|cicd|host|ci\/cd/, "Deployment"],
    [/domain|dns|registrar|cdn|nameserver|ssl|certificate/, "Domains"],
    [/perf|lighthouse|core web vitals|speed|lcp|inp|cls|pagespeed|tbt|cache|bundle/, "Performance"],
    [/security|auth|oauth|hashing|xss|csrf|waf|firewall|vulnerab|pen test/, "Security"],
    [/ai.?dev|copilot|prompt eng|llm|agent|code assistant|ai code/, "AI Development"],
  ];
  for (const [re, name] of table) if (re.test(t)) out.add(name);
  if (out.size === 0) out.add("JavaScript");
  return Array.from(out);
}

function classifyKnowledgeType(text, fallback) {
  const t = String(text || "").toLowerCase();
  if (/\bcheat\s*sheet|cheatsheet|one.?page|reference card\b/.test(t)) return "Cheatsheet";
  if (/\breference\b|mdn|spec|docs\b/.test(t)) return "Reference";
  if (/\bguide|walkthrough|tutorial|step by step|how to\b/.test(t)) return "Guide";
  if (/\bquick tip|tip\b|shorts?|minute|pro tip\b/.test(t)) return "Quick Tip";
  return fallback ?? "Quick Tip";
}

function classifyKnowledgeLevel(text, fallback) {
  const t = String(text || "").toLowerCase();
  if (/\badvanced|expert|hard|production grade\b/.test(t)) return "Advanced";
  if (/\bintermediate|mid|proficient\b/.test(t)) return "Intermediate";
  if (/\bbeginner|starter|first|intro|basics|101|getting start|for beginners\b/.test(t)) return "Beginner";
  return fallback ?? "Beginner";
}

export function isDeveloperKnowledgeCandidate(raw) {
  const text = `${raw.title || ""} ${raw.description || raw.body || raw.subtitle || raw.summary || ""} ${
    raw.category || raw.categoryName || ""
  } ${raw.tags ? (Array.isArray(raw.tags) ? raw.tags.join(" ") : raw.tags) : ""} ${raw.type || ""}`.toLowerCase();
  if (DEV_REJECT.test(text)) return false;
  return DEV_POSITIVE.test(text);
}

/* --------------------------- code text helper ---------------------- */

function codeText(item) {
  return (
    item.copyableCode ||
    item.codeReact ||
    item.codeJs ||
    item.codeCss ||
    item.codeHtml ||
    item.codeOther ||
    item.code ||
    ""
  );
}

function isPublished(item) {
  return (
    item.published === true ||
    item.status === "published" ||
    item.published === undefined
  );
}

/* --------------------------- adapters ------------------------------ */

/**
 * @param {any[]} cmsDocs  raw firestore docs including _collection field
 * @returns {{patterns: any[], resources: any[], inspiration: any[]}}
 */
export function adaptCMSCollections(cmsDocs) {
  const patterns = [];
  const resources = [];
  const inspiration = [];

  for (const doc of cmsDocs || []) {
    if (!isPublished(doc)) continue;
    const col = doc._collection;
    try {
      if (col === "stea_code_resources") {
        const tags = strArr(doc.tags);
        const blob = `${doc.title} ${doc.shortDescription || doc.description || doc.fullDescription} ${
          doc.category || ""
        } ${doc.framework || ""} ${tags.join(" ")}`;
        const description = doc.shortDescription || doc.description || doc.fullDescription || "";
        patterns.push(
          mkPattern({
            id: `pat-cms-${doc.id ?? doc.title}`,
            title: doc.title || "Untitled pattern",
            summary: description || `Reusable ${doc.framework || "pattern"} for ${doc.category || "components"}.`,
            category: classifyPatternCategory(blob, doc.category),
            framework: classifyPatternFramework(doc.framework, doc.language, doc.title),
            language: doc.language || classifyPatternFramework(doc.framework, doc.language, doc.title),
            dependencies: strArr(doc.dependencies ?? (doc.framework ? [doc.framework] : [])),
            code: codeText(doc),
            preview: doc.preview || doc.title || "",
            previewImageUrl: doc.previewImageUrl || doc.thumbnailUrl || undefined,
            difficulty: doc.difficulty,
            tags,
            officialUrl: doc.demoUrl || doc.sourceUrl || doc.url || undefined,
            regions: doc.regions,
            chinaAvailable: doc.chinaAvailable,
            chinaAlternative: doc.chinaAlternative,
            updatedAt: doc.updatedAt || doc.createdAt ? (doc.updatedAt?.toDate ? doc.updatedAt.toDate().toISOString().slice(0,10) : String(doc.updatedAt || doc.createdAt || "").slice(0,10)) : undefined,
          })
        );
      } else if (col === "stea_code_inspiration") {
        const text = `${doc.title} ${doc.description || ""} ${doc.category || ""} ${doc.tags ? strArr(doc.tags).join(" ") : ""}`.toLowerCase();
        let group = "websites";
        if (/navigation|hero|pricing|cards|forms|footers|ui kit|component\b/.test(text)) group = "ui";
        else if (/motion|transition|scroll|loading|3d|three\.?js|animation|interact/.test(text)) group = "motion";
        else if (/mobile|ios|android|onboarding|app interface|dashboard app\b/.test(text)) group = "mobile";
        inspiration.push(
          mkInspiration({
            id: `ins-cms-${doc.id ?? doc.title}`,
            title: doc.title || "Untitled inspiration",
            group,
            category: doc.category || {
              websites: "Landing Pages",
              ui: "Hero",
              motion: "Micro-interactions",
              mobile: "Onboarding",
            }[group],
            style: doc.style,
            platform: doc.platform || "Web",
            sourceUrl: doc.url || doc.sourceUrl || doc.demoUrl || undefined,
            thumbnail: doc.thumbnailUrl || doc.imageUrl || undefined,
            relatedPatterns: doc.relatedPatterns ?? [],
          })
        );
      } else if (col === "stea_code_hosting") {
        const desc = doc.description || doc.shortDescription || doc.summary || "";
        const baseCategories = strArr(doc.categories || doc.category || doc.tags || "Hosting");
        const labeled = baseCategories[0] ? labelToolsCategory(`${baseCategories.join(" ")} ${desc}`, null) : "Hosting";
        const { buckets, shipSections } = resourceBucketsAndSections(baseCategories, doc.tags || [], desc);
        const resource = mkResource({
          id: `res-host-${doc.id ?? doc.title}`,
          name: doc.name || doc.title || "Untitled resource",
          buckets,
          shipSections,
          categories: Array.from(new Set([labeled, ...baseCategories])).slice(0, 4),
          tags: strArr(doc.tags ?? []),
          platforms: strArr(doc.platforms ?? doc.supported ?? ["Web"]),
          pricing: doc.pricing || doc.price || doc.tier || "Free tier",
          openSource: Boolean(doc.openSource),
          beginnerFriendly: typeof doc.beginnerFriendly === "boolean" ? doc.beginnerFriendly : true,
          regions: doc.regions,
          chinaAvailable: doc.chinaAvailable,
          chinaAlternative: doc.chinaAlternative,
          chinaNotes: doc.chinaNotes,
          description: desc || `Hosting and deployment option.`,
          officialUrl: doc.url || doc.website || doc.officialUrl || doc.docsUrl || undefined,
          offlineRelevant: Boolean(doc.offlineRelevant),
          verifiedAt: doc.verifiedAt || doc.updatedAt || undefined,
        });
        resources.push(resource);
      } else if (col === "stea_code_resources_directory") {
        const desc = doc.description || doc.shortDescription || doc.body || "";
        const tags = strArr(doc.tags || []);
        const baseCategories = strArr(doc.categories || doc.category || doc.type || "Productivity");
        const labeled = baseCategories[0] ? labelToolsCategory(`${baseCategories.join(" ")} ${desc} ${tags.join(" ")}`, null) : "Productivity";
        const { buckets, shipSections } = resourceBucketsAndSections(baseCategories, tags, desc);
        resources.push(
          mkResource({
            id: `res-dir-${doc.id ?? doc.name ?? doc.title}`,
            name: doc.name || doc.title || "Untitled resource",
            buckets,
            shipSections,
            categories: Array.from(new Set([labeled, ...baseCategories])).slice(0, 4),
            tags,
            platforms: strArr(doc.platforms || doc.supported || ["Web"]),
            pricing: doc.pricing || doc.price || doc.tier || "Free",
            openSource: Boolean(doc.openSource),
            beginnerFriendly: typeof doc.beginnerFriendly === "boolean" ? doc.beginnerFriendly : true,
            regions: doc.regions,
            chinaAvailable: doc.chinaAvailable,
            chinaAlternative: doc.chinaAlternative,
            chinaNotes: doc.chinaNotes,
            description: desc || "Curated tool for developers.",
            officialUrl: doc.url || doc.website || doc.officialUrl || doc.link || undefined,
            offlineRelevant: Boolean(doc.offlineRelevant || doc.installable || doc.desktop),
            verifiedAt: doc.verifiedAt || doc.updatedAt || undefined,
          })
        );
      }
    } catch (err) {
      console.warn("[STEA Code V2] adapter skip CMS doc", doc?._collection, doc?.id, err?.message);
    }
  }

  return { patterns, resources, inspiration };
}

/**
 * @param {any[]} legacyNormalized
 * @returns {any[]} KNOWLEDGE items filtered to developer only.
 */
export function adaptLegacyToKnowledge(legacyNormalized) {
  const out = [];
  for (const it of legacyNormalized || []) {
    try {
      if (!isDeveloperKnowledgeCandidate(it)) continue;
      const text = `${it.title || ""} ${it.description || it.body || ""} ${it.tags ? strArr(it.tags).join(" ") : ""}`;
      out.push(
        mkKnowledge({
          id: `kno-legacy-${it.id ?? it.title}`,
          title: it.title || "Untitled knowledge",
          type: classifyKnowledgeType(text, "Quick Tip"),
          topics: classifyKnowledgeTopics(text, strArr(it.category || [])),
          level: classifyKnowledgeLevel(text, "Beginner"),
          readingTimeMin: Number.isFinite(it.readingTime)
            ? Number(it.readingTime)
            : /guide|tutorial/.test(text.toLowerCase())
              ? 10
              : 3,
          summary: it.description || it.body || it.title,
          content: it.body || it.content || it.description || it.summary || "",
          offlineAvailable: true,
          updatedAt: it.updatedAt || it.createdAt ? (it.updatedAt?.toDate ? it.updatedAt.toDate().toISOString().slice(0,10) : String(it.updatedAt || it.createdAt || "").slice(0,10)) : undefined,
          regions: it.regions,
          chinaNotes: it.chinaNotes,
        })
      );
    } catch (err) {
      console.warn("[STEA Code V2] adapter skip legacy", it?.id, err?.message);
    }
  }
  return out;
}

export const BUILD_CATEGORIES = PATTERN_CATEGORIES;
export const BUILD_TECHS = BUILD_TECH_FILTERS;
export const TOOL_CATS = TOOLS_CATEGORIES;
export const SHIP_SECTIONS = SHIP_SUBSECTIONS;
export const LEARN_TOPICS = KNOWLEDGE_TOPICS;
export const LEARN_TYPES = ["Quick Tip", "Guide", "Cheatsheet", "Reference"];
