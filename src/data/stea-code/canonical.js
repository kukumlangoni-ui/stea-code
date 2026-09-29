/* ======================================================================
 * STEA Code V2 — Canonical data model factories + i18n helpers.
 * Four concepts: PATTERN (Build), RESOURCE (Tools/Ship),
 * KNOWLEDGE (Learn), INSPIRATION (Inspire). All translatable fields
 * accept either a plain string or { en, zhCN, sw } object.
 * =================================================================== */

export const WORLD_IDS = ["plan", "build", "tools", "ship", "learn", "inspire", "monetize"];
export const REGIONS = { GLOBAL: "GLOBAL", MAINLAND_CN: "MAINLAND_CN" };

/* ------------------------------ i18n ------------------------------- */

function isPlain(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Return string in `lang` with en fallback, then zhCN, then sw. */
export function pickLocal(value, lang = "en") {
  if (value == null) return undefined;
  if (!isPlain(value)) return value;
  const o = value;
  return o[lang] ?? o.en ?? o.zhCN ?? o.sw;
}

/** Coerce string | {en,zhCN,sw} → normalized {en, zhCN?, sw?}. */
export function toLocal(value) {
  if (typeof value === "string") return { en: value };
  if (isPlain(value)) {
    return {
      en: String(value.en ?? ""),
      zhCN: value.zhCN != null ? String(value.zhCN) : undefined,
      sw: value.sw != null ? String(value.sw) : undefined,
    };
  }
  return { en: "" };
}

export function strArr(input) {
  if (Array.isArray(input)) return input.map((x) => String(x)).filter(Boolean);
  if (typeof input === "string")
    return input
      .split(/[,，;；|、/\\]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

/* ------------------------------ misc ------------------------------- */

const uid = (() => {
  let i = 0;
  return (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${(++i).toString(36)}`;
})();

function lo(value, allowed, fallback) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "symbol") {
    if (allowed.includes(value)) return value;
  }
  return fallback;
}

function regionsFor(input) {
  if (Array.isArray(input.regions) && input.regions.length > 0) {
    const out = [];
    for (const r of input.regions) {
      const s = String(r).toUpperCase().replace(/-/g, "_");
      if (s === "GLOBAL") out.push("GLOBAL");
      else if (s === "MAINLAND_CN" || s === "CN" || s === "CHINA" || s === "ZH" || s === "MAINLAND")
        out.push("MAINLAND_CN");
    }
    if (out.length === 0) out.push("GLOBAL");
    return Array.from(new Set(out));
  }
  if (input.chinaAvailable === true) return ["GLOBAL", "MAINLAND_CN"];
  const text = `${String(input.tags || "")} ${String(input.category || "")}`.toLowerCase();
  const cnHints =
    /china|chinese|中国大陆|国内|cn-|mirror|aliyun|tencent|huawei|qiniu|upyun|gitee|netease|juejin|csdn|npmmirror|腾讯云|阿里云|华为云|七牛|又拍云|码云/.test(
      text
    );
  return cnHints ? ["GLOBAL", "MAINLAND_CN"] : ["GLOBAL"];
}

/* --------------------------- factories ----------------------------- */

// PATTERN — Build world
export function mkPattern(partial) {
  if (!partial || !partial.title || !partial.category || !partial.framework) {
    throw new Error("mkPattern requires title, category, framework");
  }
  const title = toLocal(partial.title);
  const summary = toLocal(partial.summary ?? "Implementation-ready pattern you can copy and adapt.");
  return {
    id: partial.id ?? uid("pat"),
    kind: "pattern",
    world: "build",
    title,
    summary,
    category: partial.category,
    framework: partial.framework,
    language: partial.language ?? "Mixed",
    dependencies: strArr(partial.dependencies ?? []),
    code: String(partial.code ?? ""),
    preview: String((partial.preview ?? pickLocal(title, "en")) || ""),
    previewImageUrl: partial.previewImageUrl || undefined,
    tags: strArr(partial.tags ?? []),
    officialUrl: partial.officialUrl || undefined,
    regions: regionsFor(partial),
    chinaAvailable: typeof partial.chinaAvailable === "boolean" ? partial.chinaAvailable : undefined,
    chinaAlternative: partial.chinaAlternative ? toLocal(partial.chinaAlternative) : undefined,
    updatedAt: partial.updatedAt ?? new Date().toISOString().slice(0, 10),
    difficulty: lo(partial.difficulty, ["Beginner", "Intermediate", "Advanced"], "Beginner"),
  };
}

// RESOURCE — resource-heavy worlds (can be multi-bucket)
export function mkResource(partial) {
  if (!partial || !partial.name || !partial.buckets || !partial.categories) {
    throw new Error("mkResource requires name, buckets, categories");
  }
  return {
    id: partial.id ?? uid("res"),
    kind: "resource",
    buckets: Array.from(new Set(partial.buckets.filter((b) => WORLD_IDS.includes(b)))),
    shipSections: Array.from(new Set((partial.shipSections ?? []).filter(Boolean))),
    name: toLocal(partial.name),
    description: toLocal(partial.description ?? "Curated developer resource."),
    bestFor: toLocal(partial.bestFor ?? partial.description ?? "Choosing the right developer tool for the job."),
    categories: strArr(partial.categories),
    category: partial.category || strArr(partial.categories)[0] || undefined,
    subcategory: partial.subcategory || undefined,
    tags: strArr(partial.tags ?? []),
    frameworks: strArr(partial.frameworks ?? []),
    languagesUsed: strArr(partial.languagesUsed ?? []),
    platforms: strArr(partial.platforms ?? ["Web"]),
    regions: regionsFor(partial),
    pricing: String(partial.pricing ?? "Free tier"),
    openSource: Boolean(partial.openSource),
    beginnerFriendly: typeof partial.beginnerFriendly === "boolean" ? partial.beginnerFriendly : true,
    chinaAvailable: typeof partial.chinaAvailable === "boolean" ? partial.chinaAvailable : undefined,
    chinaStatus: partial.chinaStatus || (partial.chinaAvailable === true ? "AVAILABLE" : partial.chinaAvailable === false ? "UNKNOWN" : "UNKNOWN"),
    chinaAlternative: partial.chinaAlternative ? toLocal(partial.chinaAlternative) : undefined,
    chinaNotes: partial.chinaNotes ? toLocal(partial.chinaNotes) : undefined,
    officialUrl: partial.officialUrl || undefined,
    offlineRelevant: Boolean(partial.offlineRelevant || partial.offline),
    offline: Boolean(partial.offlineRelevant || partial.offline),
    sourceType: partial.sourceType || "curated",
    /* `external: true` marks third-party resources (component libraries,
       SaaS, docs sites). UI shows "Open Documentation" / "Open Website"
       instead of STEA's own "Preview" / "Copy Code". Defaults to true for
       resource entries since most are external links. */
    external: typeof partial.external === "boolean" ? partial.external : true,
    docsUrl: partial.docsUrl || undefined,
    verified: Boolean(partial.verified || partial.verifiedAt),
    verifiedAt: partial.verifiedAt || undefined,
    needsReview: Boolean(partial.needsReview || !partial.verifiedAt),
  };
}

// KNOWLEDGE — Learn world
const KNOWLEDGE_TYPES = ["Quick Tip", "Guide", "Cheatsheet", "Reference"];
const KNOWLEDGE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export function mkKnowledge(partial) {
  if (!partial || !partial.title || !partial.type || !partial.topics || !partial.content) {
    throw new Error("mkKnowledge requires title, type, topics, content");
  }
  const type = lo(partial.type, KNOWLEDGE_TYPES, "Quick Tip");
  return {
    id: partial.id ?? uid("kno"),
    kind: "knowledge",
    world: "learn",
    type,
    topics: strArr(partial.topics),
    level: lo(partial.level, KNOWLEDGE_LEVELS, "Beginner"),
    readingTimeMin: Number.isFinite(partial.readingTimeMin)
      ? partial.readingTimeMin
      : type === "Guide"
        ? 10
        : 3,
    title: toLocal(partial.title),
    summary: toLocal(
      partial.summary ?? toLocal(partial.title).en ?? "Developer learning content."
    ),
    content: String(partial.content ?? ""),
    offlineAvailable: typeof partial.offlineAvailable === "boolean" ? partial.offlineAvailable : true,
    updatedAt: partial.updatedAt ?? new Date().toISOString().slice(0, 10),
    regions: regionsFor(partial),
    chinaNotes: partial.chinaNotes ? toLocal(partial.chinaNotes) : undefined,
  };
}

export const KNOWLEDGE_TYPE_LABELS = KNOWLEDGE_TYPES;
export const KNOWLEDGE_LEVEL_LABELS = KNOWLEDGE_LEVELS;

// INSPIRATION — Inspire world
const INSPIRATION_GROUPS = ["websites", "ui", "motion", "mobile"];

export function mkInspiration(partial) {
  if (!partial || !partial.title || !partial.group || !partial.category) {
    throw new Error("mkInspiration requires title, group, category");
  }
  return {
    id: partial.id ?? uid("ins"),
    kind: "inspiration",
    world: "inspire",
    group: lo(partial.group, INSPIRATION_GROUPS, "websites"),
    title: toLocal(partial.title),
    category: String(partial.category),
    style: partial.style || undefined,
    platform: partial.platform || undefined,
    sourceUrl: partial.sourceUrl || undefined,
    thumbnail: partial.thumbnail || undefined,
    relatedPatterns: strArr(partial.relatedPatterns ?? []),
  };
}

export const INSPIRATION_GROUP_LABELS = INSPIRATION_GROUPS;
