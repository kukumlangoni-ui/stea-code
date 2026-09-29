/* ======================================================================
 * V2Views — seven world view switcher + shared primitives.
 *
 * Each world view renders:
 *   1. World eyebrow + giant centered title + short sentence.
 *   2. Filter row: category/topic chips + search text + region badge.
 *   3. Card grid (responsive: 1/2/3+ cols depending on width).
 *   4. Empty / loading / error states.
 *   5. Honest offline/region badges per card, or on row.
 *
 *   Plan:     resources bucket="plan"     → grouped by design category.
 *   Build:    patterns  → click card → show modal with code + copy button.
 *   Tools:    resources bucket="tools"   → grouped by category.
 *   Ship:     resources bucket="ship"    → grouped by shipSection subsection.
 *   Learn:    knowledge → strict developer content only; no unrelated news.
 *   Inspire:  inspiration → website/ui/motion/mobile visual references.
 *   Monetize: resources bucket="monetize"→ grouped by monetization category.
 *
 * Props:
 *   world: "plan"|"build"|"tools"|"ship"|"learn"|"inspire"|"monetize"
 *   data: V2 snapshot (status + patterns/resources/knowledge/inspiration)
 *   filterQuery: optional q=… string from URL
 *   intent: optional intent=… chip string from URL
 *   reduceMotion: boolean
 *   onOpenSearch({query?})
 *   onGoWorld(worldId, extraQuery?)
 * =================================================================== */

import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import {
  Copy, Check, ExternalLink, AlertTriangle,
  BookOpen, Lightbulb, GraduationCap, Code2,
  ShieldAlert, Server, Sparkles, MonitorPlay,
  Hammer, Ship, ChevronDown, Search,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useSteaCodeI18n } from "../../components/stea-code/useSteaCodeI18n.js";
import { V2_WORLDS } from "../../data/stea-code/v2Worlds.js";

const UI = {
  all: { en: "All", zhCN: "全部" },
  global: { en: "Global", zhCN: "全球" },
  mainlandCN: { en: "Mainland China", zhCN: "中国大陆" },
  globalCN: { en: "Global + Mainland China", zhCN: "全球 + 中国大陆" },
  openWebsite: { en: "Open Website", zhCN: "打开官网" },
  external: { en: "External", zhCN: "外部网站" },
  needsReview: { en: "Needs review", zhCN: "待复核" },
  whatBuilding: { en: "What are you building?", zhCN: "你想开发什么？" },
  stages: { en: "Website stages", zhCN: "网站开发阶段" },
  whatItDoes: { en: "What it does", zhCN: "用途" },
  bestFor: { en: "Best for", zhCN: "最适合" },
  platforms: { en: "Platforms", zhCN: "平台" },
  pricing: { en: "Pricing", zhCN: "价格" },
  openSource: { en: "Open source", zhCN: "开源" },
  offline: { en: "Offline capability", zhCN: "离线能力" },
  chinaAvailability: { en: "China availability", zhCN: "中国大陆可用性" },
  chinaAlternative: { en: "China alternative", zhCN: "国内替代" },
  officialWebsite: { en: "Official website", zhCN: "官方网站" },
  yes: { en: "Yes", zhCN: "是" },
  no: { en: "No", zhCN: "否" },
  close: { en: "Close", zhCN: "关闭" },
  showMore: { en: "Show more tools", zhCN: "显示更多工具" },
  filterTools: { en: "Filter tools: AI coding, API, Git, design…", zhCN: "搜索工具：AI 编程、接口、Git、设计…" },
  noToolsTitle: { en: "No tools match.", zhCN: "没有匹配的工具。" },
  noToolsDesc: { en: "Try a different search, category, or region filter.", zhCN: "换一个搜索词、分类或地区筛选试试。" },
  whatDeploying: { en: "What are you deploying?", zhCN: "你要部署什么？" },
  recommendedFor: { en: "Recommended for...", zhCN: "推荐用于..." },
  chinaRealityTitle: { en: "Deploying in Mainland China", zhCN: "在中国大陆部署" },
  chinaRealityBody: {
    en: "Mainland China deployment can involve ICP filing, public security filing, domain real-name verification, DNS, CDN and SSL setup. A Mainland server is different from a Hong Kong or global server. This is product guidance, not legal advice.",
    zhCN: "中国大陆部署可能涉及 ICP 备案、公安备案、域名实名认证、DNS、CDN 和 SSL 配置。大陆服务器与香港或海外服务器要求不同。这里是产品指引，不构成法律建议。",
  },
  officialDocs: { en: "Official docs", zhCN: "官方文档" },
  filterShip: { en: "Search hosting, domain, DNS, Docker, Next.js…", zhCN: "搜索托管、域名、DNS、Docker、Next.js、部署…" },
  noShipTitle: { en: "No deployment resources match.", zhCN: "没有匹配的部署资源。" },
  noShipDesc: { en: "Try another workload, category, search, or region filter.", zhCN: "换一个部署类型、分类、搜索词或地区筛选试试。" },
  supportedWorkloads: { en: "Supported workloads", zhCN: "支持的工作负载" },
  pricingModel: { en: "Pricing model", zhCN: "价格模式" },
  domainSupport: { en: "Domain support", zhCN: "域名支持" },
  databaseStorage: { en: "Database/storage", zhCN: "数据库/存储" },
  filterPlan: { en: "Search design tools, wireframes, icons, fonts…", zhCN: "搜索设计工具、线框图、图标、字体…" },
  noPlanTitle: { en: "No design resources match.", zhCN: "没有匹配的设计资源。" },
  noPlanDesc: { en: "Try a different search, category, or region filter.", zhCN: "换一个搜索词、分类或地区筛选试试。" },
  filterMonetize: { en: "Search payments, ads, SEO, analytics…", zhCN: "搜索支付、广告、SEO、数据分析…" },
  noMonetizeTitle: { en: "No monetization resources match.", zhCN: "没有匹配的变现资源。" },
  noMonetizeDesc: { en: "Try a different search, category, or region filter.", zhCN: "换一个搜索词、分类或地区筛选试试。" },
};

const PRICING_LABELS = {
  "Free": { en: "Free", zhCN: "免费" },
  "Free tier": { en: "Free tier", zhCN: "免费套餐" },
  "Freemium": { en: "Freemium", zhCN: "免费增值" },
  "Paid": { en: "Paid", zhCN: "付费" },
  "Open Source": { en: "Open Source", zhCN: "开源" },
  "At-cost": { en: "At-cost", zhCN: "成本价" },
  "Free trial + paid": { en: "Free trial + paid", zhCN: "免费试用 + 付费" },
};

const CATEGORY_LABELS = {
  "AI Coding": { en: "AI & Vibe Coding", zhCN: "AI 与 Vibe Coding" },
  "AI & Vibe Coding": { en: "AI & Vibe Coding", zhCN: "AI 与 Vibe Coding" },
  "Code & IDE": { en: "IDE & Code Editors", zhCN: "IDE 与代码编辑器" },
  "IDE & Code Editors": { en: "IDE & Code Editors", zhCN: "IDE 与代码编辑器" },
  "API Development": { en: "API Development", zhCN: "API 开发" },
  "Source Control": { en: "Source Control", zhCN: "代码托管" },
  "Database Tools": { en: "Database Tools", zhCN: "数据库工具" },
  "Design": { en: "Design Tools", zhCN: "设计工具" },
  "Design Tools": { en: "Design Tools", zhCN: "设计工具" },
  "Testing": { en: "Testing", zhCN: "测试" },
  "DevOps": { en: "DevOps", zhCN: "DevOps" },
  "Security": { en: "Security", zhCN: "安全" },
  "Documentation": { en: "Documentation", zhCN: "文档" },
  "Packages & Mirrors": { en: "Package Mirrors", zhCN: "包镜像" },
  "Package Mirrors": { en: "Package Mirrors", zhCN: "包镜像" },
  "Developer Productivity": { en: "Developer Productivity", zhCN: "开发效率" },
  "Mobile Development": { en: "Mobile Development", zhCN: "移动开发" },
  "China Development": { en: "China Development", zhCN: "中国开发生态" },
  "Hosting": { en: "Hosting", zhCN: "托管部署" },
  "Domains": { en: "Domains", zhCN: "域名" },
  "Backend": { en: "Backend", zhCN: "后端" },
  "Monitoring": { en: "Monitoring", zhCN: "监控" },
  "Authentication": { en: "Database Tools", zhCN: "数据库工具" },
  "Database": { en: "Database Tools", zhCN: "数据库工具" },
  "Deploy": { en: "Frontend Hosting", zhCN: "前端托管" },
  "Frontend Hosting": { en: "Frontend Hosting", zhCN: "前端托管" },
  "Full-stack Hosting": { en: "Full-stack Hosting", zhCN: "全栈托管" },
  "Backend & APIs": { en: "Backend & APIs", zhCN: "后端与 API" },
  "Cloud & VPS": { en: "Cloud & VPS", zhCN: "云与 VPS" },
  "Serverless": { en: "Serverless", zhCN: "Serverless" },
  "Containers": { en: "Containers", zhCN: "容器" },
  "Domains & DNS": { en: "Domains & DNS", zhCN: "域名与 DNS" },
  "DNS": { en: "Domains & DNS", zhCN: "域名与 DNS" },
  "CDN & Edge": { en: "CDN & Edge", zhCN: "CDN 与边缘网络" },
  "Databases": { en: "Databases", zhCN: "数据库" },
  "Storage": { en: "Storage", zhCN: "存储" },
  "Mainland China Deployment": { en: "Mainland China Deployment", zhCN: "中国大陆部署" },
  "Product Planning": { en: "Product Planning", zhCN: "产品规划" },
  "Wireframes": { en: "Wireframes", zhCN: "线框图" },
  "User Flows": { en: "User Flows", zhCN: "用户流程" },
  "Sitemaps": { en: "Sitemaps", zhCN: "站点地图" },
  "UI/UX Design": { en: "UI/UX Design", zhCN: "UI/UX 设计" },
  "Prototyping": { en: "Prototyping", zhCN: "原型" },
  "Design Systems": { en: "Design Systems", zhCN: "设计系统" },
  "Design Handoff": { en: "Design Handoff", zhCN: "设计交付" },
  "Design-to-Code": { en: "Design-to-Code", zhCN: "设计转代码" },
  "Icons": { en: "Icons", zhCN: "图标" },
  "Fonts": { en: "Fonts", zhCN: "字体" },
  "Images": { en: "Images", zhCN: "图片" },
  "Illustrations": { en: "Illustrations", zhCN: "插画" },
  "Colors": { en: "Colors", zhCN: "配色" },
  "Mockups": { en: "Mockups", zhCN: "模型" },
  "Branding": { en: "Branding", zhCN: "品牌" },
  "Payments": { en: "Payments", zhCN: "支付" },
  "Subscriptions": { en: "Subscriptions", zhCN: "订阅" },
  "Advertising": { en: "Advertising", zhCN: "广告" },
  "Affiliate Marketing": { en: "Affiliate Marketing", zhCN: "联盟营销" },
  "Digital Products": { en: "Digital Products", zhCN: "数字产品" },
  "E-commerce": { en: "E-commerce", zhCN: "电商" },
  "SaaS Billing": { en: "SaaS Billing", zhCN: "SaaS 计费" },
  "Membership": { en: "Membership", zhCN: "会员" },
  "Donations": { en: "Donations", zhCN: "捐赠" },
  "SEO": { en: "SEO", zhCN: "SEO" },
  "Search Engines": { en: "Search Engines", zhCN: "搜索引擎" },
  "Analytics": { en: "Analytics", zhCN: "数据分析" },
  "Conversion": { en: "Conversion", zhCN: "转化" },
  "Email Marketing": { en: "Email Marketing", zhCN: "邮件营销" },
  "Growth": { en: "Growth", zhCN: "增长" },
};

const PRIMARY_TOOL_CATEGORIES = [
  "AI & Vibe Coding",
  "IDE & Code Editors",
  "API Development",
  "Source Control",
  "Database Tools",
  "Design Tools",
  "Testing",
  "DevOps",
  "Security",
  "Documentation",
  "Package Mirrors",
  "Developer Productivity",
  "Mobile Development",
  "China Development",
];

const CATEGORY_ALIASES = {
  "AI Coding": "AI & Vibe Coding",
  "Code & IDE": "IDE & Code Editors",
  "Design": "Design Tools",
  "Packages & Mirrors": "Package Mirrors",
  "Database": "Database Tools",
  "Authentication": "Database Tools",
};

function canonicalCategory(value) {
  return CATEGORY_ALIASES[value] || value || "Developer Productivity";
}

const SHIP_CATEGORIES = [
  "Frontend Hosting",
  "Full-stack Hosting",
  "Backend & APIs",
  "Cloud & VPS",
  "Serverless",
  "Containers",
  "Domains & DNS",
  "CDN & Edge",
  "Databases",
  "Storage",
  "Monitoring",
  "Mainland China Deployment",
];

const PLAN_CATEGORIES = [
  "Product Planning",
  "Wireframes",
  "User Flows",
  "Sitemaps",
  "UI/UX Design",
  "Prototyping",
  "Design Systems",
  "Design Handoff",
  "Design-to-Code",
  "Icons",
  "Fonts",
  "Images",
  "Illustrations",
  "Colors",
  "Mockups",
  "Branding",
];

const MONETIZE_CATEGORIES = [
  "Payments",
  "Subscriptions",
  "Advertising",
  "Affiliate Marketing",
  "Digital Products",
  "E-commerce",
  "SaaS Billing",
  "Membership",
  "Donations",
  "SEO",
  "Search Engines",
  "Analytics",
  "Conversion",
  "Email Marketing",
  "Growth",
];

/* Component library categories for the Build world. External resources
 * (component libraries, animation, 3D, charts) are shown below the
 * STEA-owned patterns grid. UI shows "Open Documentation" / "Open Website"
 * rather than STEA's own "Preview" / "Copy Code". */
const BUILD_LIBRARY_CATEGORIES = [
  "Component Libraries",
  "UI Components",
  "Mobile UI",
  "Animation Libraries",
  "Charts",
  "Data Visualization",
  "3D / WebGL",
  "Design Systems",
];

const SHIP_CATEGORY_ALIASES = {
  Hosting: "Frontend Hosting",
  Deploy: "Frontend Hosting",
  Backend: "Backend & APIs",
  Database: "Databases",
  Domains: "Domains & DNS",
  DNS: "Domains & DNS",
  Security: "CDN & Edge",
};

function canonicalShipCategory(value) {
  return SHIP_CATEGORY_ALIASES[value] || value || "Full-stack Hosting";
}

const DEPLOYING_OPTIONS = [
  ["static", { en: "Static Website", zhCN: "静态网站" }, ["static", "frontend", "portfolio", "cdn"]],
  ["react", { en: "React App", zhCN: "React 应用" }, ["react", "frontend", "spa", "firebase"]],
  ["next", { en: "Next.js App", zhCN: "Next.js 应用" }, ["nextjs", "frontend", "serverless", "fullstack"]],
  ["node", { en: "Node.js API", zhCN: "Node.js API" }, ["node", "api", "backend"]],
  ["python", { en: "Python App", zhCN: "Python 应用" }, ["python", "api", "docker"]],
  ["java", { en: "Java App", zhCN: "Java 应用" }, ["java", "docker", "cloud"]],
  ["docker", { en: "Docker App", zhCN: "Docker 应用" }, ["docker", "containers"]],
  ["ai", { en: "AI App", zhCN: "AI 应用" }, ["ai", "python", "cloud", "serverless"]],
  ["portfolio", { en: "Portfolio", zhCN: "作品集" }, ["portfolio", "static", "github"]],
  ["ecommerce", { en: "E-commerce", zhCN: "电商网站" }, ["e-commerce", "database", "storage", "fullstack"]],
];

const SHIP_RECOMMENDATIONS = [
  ["beginner", { en: "Best for beginners", zhCN: "适合新手" }, ["beginner"]],
  ["react", { en: "Best for React", zhCN: "适合 React" }, ["react", "frontend"]],
  ["next", { en: "Best for Next.js", zhCN: "适合 Next.js" }, ["nextjs"]],
  ["static", { en: "Best for static sites", zhCN: "适合静态网站" }, ["static"]],
  ["api", { en: "Best for APIs", zhCN: "适合 API" }, ["api", "backend"]],
  ["docker", { en: "Best for Docker", zhCN: "适合 Docker" }, ["docker", "containers"]],
  ["china", { en: "Best for Mainland China", zhCN: "适合中国大陆" }, ["china", "中国云", "mainland"]],
  ["enterprise", { en: "Best for enterprise cloud", zhCN: "适合企业云" }, ["enterprise", "cloud"]],
];

const BUILDER_INTENTS = [
  ["Website", { en: "Website", zhCN: "网站" }],
  ["SaaS", { en: "SaaS", zhCN: "SaaS 产品" }],
  ["Mobile App", { en: "Mobile App", zhCN: "移动应用" }],
  ["API", { en: "API", zhCN: "API" }],
  ["AI App", { en: "AI App", zhCN: "AI 应用" }],
  ["E-commerce", { en: "E-commerce", zhCN: "电商网站" }],
  ["Mini Program", { en: "Mini Program", zhCN: "小程序" }],
];

const WEBSITE_STAGES = [
  ["Plan", { en: "Plan", zhCN: "规划" }],
  ["Design", { en: "Design", zhCN: "设计" }],
  ["Code", { en: "Code", zhCN: "编码" }],
  ["Components", { en: "Components", zhCN: "组件" }],
  ["Backend", { en: "Backend", zhCN: "后端" }],
  ["Database", { en: "Database", zhCN: "数据库" }],
  ["APIs", { en: "APIs", zhCN: "API" }],
  ["Domain", { en: "Domain", zhCN: "域名" }],
  ["Hosting", { en: "Hosting", zhCN: "托管部署" }],
  ["SEO", { en: "SEO", zhCN: "SEO" }],
  ["Analytics", { en: "Analytics", zhCN: "数据分析" }],
  ["Security", { en: "Security", zhCN: "安全" }],
  ["Payments", { en: "Payments", zhCN: "支付" }],
  ["Monetization", { en: "Monetization", zhCN: "变现" }],
  ["Maintenance", { en: "Maintenance", zhCN: "维护" }],
];

function priceLabel(value, tLocal) {
  return tLocal(PRICING_LABELS[value] || value || "Free tier");
}

function categoryLabel(value, tLocal) {
  return tLocal(CATEGORY_LABELS[value] || value || "Other");
}

function localSearchText(value) {
  if (!value || typeof value !== "object") return String(value || "");
  return [value.en, value.zhCN, value.sw].filter(Boolean).join(" ");
}

function categorySearchText(values = []) {
  return values
    .map((value) => {
      const label = CATEGORY_LABELS[value] || CATEGORY_LABELS[canonicalCategory(value)] || CATEGORY_LABELS[canonicalShipCategory(value)];
      return `${value || ""} ${localSearchText(label)}`;
    })
    .join(" ");
}

function regionLabel(regions, tLocal) {
  const set = new Set(Array.isArray(regions) ? regions : []);
  if (set.has("GLOBAL") && set.has("MAINLAND_CN")) return tLocal(UI.globalCN);
  if (set.has("MAINLAND_CN")) return tLocal(UI.mainlandCN);
  return tLocal(UI.global);
}

function matchesRegion(item, regionFilter) {
  if (!regionFilter || regionFilter === "ALL") return true;
  const regions = Array.isArray(item.regions) ? item.regions : ["GLOBAL"];
  return regions.includes(regionFilter);
}

function LocaleRegionControls({ regionFilter, onRegionFilter }) {
  const { uiLocale, setUiLocale, tLocal } = useSteaCodeI18n();
  return (
    <div className="sc-v2-locale-region" aria-label="STEA Code language and region filters">
      <div className="sc-v2-segment">
        <button type="button" className={uiLocale === "en" ? "is-active" : ""} onClick={() => setUiLocale("en")}>EN</button>
        <button type="button" className={uiLocale === "zhCN" ? "is-active" : ""} onClick={() => setUiLocale("zhCN")}>简体中文</button>
      </div>
      <div className="sc-v2-segment">
        {[
          ["ALL", UI.all],
          ["GLOBAL", UI.global],
          ["MAINLAND_CN", UI.mainlandCN],
        ].map(([id, label]) => (
          <button key={id} type="button" className={regionFilter === id ? "is-active" : ""} onClick={() => onRegionFilter(id)}>
            {tLocal(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function BuilderJourney({ selected, onSelect }) {
  const { tLocal } = useSteaCodeI18n();
  const isWebsite = selected === "Website";
  return (
    <div className="sc-v2-builder">
      <div className="sc-v2-builder-title">{tLocal(UI.whatBuilding)}</div>
      <div className="sc-v2-filter-chips">
        {BUILDER_INTENTS.map(([id, label]) => (
          <button key={id} type="button" className={"sc-v2-chip" + (selected === id ? " is-active" : "")} onClick={() => onSelect(selected === id ? "" : id)}>
            {tLocal(label)}
          </button>
        ))}
      </div>
      {isWebsite ? (
        <>
          <div className="sc-v2-builder-title sc-v2-builder-title-small">{tLocal(UI.stages)}</div>
          <div className="sc-v2-filter-chips sc-v2-filter-chips-secondary">
            {WEBSITE_STAGES.map(([id, label]) => (
              <button key={id} type="button" className="sc-v2-chip" onClick={() => onSelect(id)}>
                {tLocal(label)}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ====================================================================== *
 * Shared Card + Filter + State helpers
 * ====================================================================== */

function Title({ eyebrow, accent, title, sub, intro }) {
  const { tLocal } = useSteaCodeI18n();
  return (
    <div className="sc-v2-world-head">
      <span
        className="sc-v2-eyebrow"
        style={{ color: accent, borderColor: `${accent}33` }}
      >
        {eyebrow}
      </span>
      <h1 className="sc-v2-world-title">{tLocal(title)}</h1>
      <p className="sc-v2-world-sub">{tLocal(sub)}</p>
      {intro ? (
        <p className="sc-v2-world-intro">{tLocal(intro)}</p>
      ) : null}
    </div>
  );
}

function FilterBar({ placeholder, value, onChange, chips, activeChip, onChip, rightSlot }) {
  const { tLocal } = useSteaCodeI18n();
  return (
    <div className="sc-v2-filters">
      <div className="sc-v2-filter-search">
        <Search size={14} aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Filter this world"
        />
      </div>
      {chips && chips.length > 0 && (
        <div className="sc-v2-filter-chips">
          <button
            type="button"
            className={"sc-v2-chip sc-v2-chip-all" + (!activeChip ? " is-active" : "")}
            onClick={() => onChip(null)}
          >
            {tLocal(UI.all)}
          </button>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className={"sc-v2-chip" + (activeChip === c ? " is-active" : "")}
              onClick={() => onChip(activeChip === c ? null : c)}
            >
              {categoryLabel(c, tLocal)}
            </button>
          ))}
        </div>
      )}
      {rightSlot}
    </div>
  );
}

function useTextFilter(list, { textFields, filterQuery, chipKey, activeChip }) {
  return useMemo(() => {
    const q = String(filterQuery || "").trim().toLowerCase();
    return list.filter((item) => {
      if (activeChip) {
        const value = typeof chipKey === "function" ? chipKey(item) : item[chipKey];
        if (Array.isArray(value)) {
          if (!value.includes(activeChip)) return false;
        } else if (Array.isArray(chipKey)) {
          // e.g., resource.categories + resource.tags
          let ok = false;
          for (const k of chipKey) {
            const v = typeof k === "function" ? k(item) : item[k];
            if (Array.isArray(v) ? v.includes(activeChip) : v === activeChip) {
              ok = true;
              break;
            }
          }
          if (!ok) return false;
        } else if (value !== activeChip) {
          return false;
        }
      }
      if (!q) return true;
      for (const f of textFields) {
        const v = (() => {
          if (typeof f === "function") return f(item);
          return item[f];
        })();
        if (v != null && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [list, filterQuery, activeChip, chipKey, textFields]);
}

function BadgeRow({ item, regions, chinaAvailable, chinaAlternative, offline }) {
  const { isMainlandCN, tLocal } = useSteaCodeI18n();
  const badges = [];
  const regionsArr = Array.isArray(regions) && regions.length > 0 ? regions : null;
  if (regionsArr) {
    badges.push(<span key="region" className="sc-v2-badge sc-v2-badge-cn">{regionLabel(regionsArr, tLocal)}</span>);
    if (!regionsArr.includes("MAINLAND_CN") && isMainlandCN) {
      badges.push(
        <span key="not-cn" className="sc-v2-badge sc-v2-badge-warn" title="This resource is not officially reachable in Mainland China.">
          <AlertTriangle size={12} aria-hidden="true" /> 境外服务
        </span>
      );
    }
  } else if (chinaAvailable === true) {
    badges.push(<span key="cn" className="sc-v2-badge sc-v2-badge-cn">{tLocal(UI.globalCN)}</span>);
  } else if (chinaAvailable === false && isMainlandCN) {
    badges.push(<span key="not-cn" className="sc-v2-badge sc-v2-badge-warn"><AlertTriangle size={12} aria-hidden="true"/> 境外服务</span>);
  }
  if (chinaAlternative && isMainlandCN) {
    badges.push(<span key="alt" className="sc-v2-badge sc-v2-badge-alt"><ShieldAlert size={12} aria-hidden="true"/> 国内替代</span>);
  }
  if (offline === true) {
    badges.push(<span key="offline" className="sc-v2-badge sc-v2-badge-offline">Cached / Offline-safe</span>);
  }
  if (item?.needsReview) {
    badges.push(<span key="review" className="sc-v2-badge sc-v2-badge-warn">{tLocal(UI.needsReview)}</span>);
  }
  return badges.length === 0 ? null : <div className="sc-v2-badges">{badges}</div>;
}

function EmptyState({ title, description, onOpenSearch, actionLabel = "Search across worlds" }) {
  return (
    <div className="sc-v2-empty">
      <div className="sc-v2-empty-icon" aria-hidden="true"><Sparkles size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="sc-v2-primary-btn" type="button" onClick={onOpenSearch}>{actionLabel}</button>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="sc-v2-grid">
      {[0,1,2,3,4,5].map((i) => (
        <div key={i} className="sc-v2-card sc-v2-card-skeleton" aria-hidden="true">
          <div className="sc-v2-skel-line sc-v2-skel-eyebrow" />
          <div className="sc-v2-skel-line sc-v2-skel-title" />
          <div className="sc-v2-skel-line sc-v2-skel-sub" />
          <div className="sc-v2-skel-line sc-v2-skel-sub" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ error }) {
  return (
    <div className="sc-v2-banner" role="status" aria-live="polite">
      <AlertTriangle size={16} aria-hidden="true" />
      <div>
        <strong>Live data failed to load.</strong> Showing curated offline-safe content.
        {error && <small style={{ display: "block", marginTop: 4, opacity: 0.7 }}>{String(error).slice(0, 160)}</small>}
      </div>
    </div>
  );
}

/* ====================================================================== *
 * Build world (PATTERNS) — click card opens modal with code + copy.
 * ====================================================================== */

function BuildView({ data, filterQuery, intent, reduceMotion, onOpenSearch }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "build");
  const [chip, setChip] = useState(null);
  const [localQ, setLocalQ] = useState("");
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLibId, setSelectedLibId] = useState(null);
  const [libChip, setLibChip] = useState(null);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [visibleLibCount, setVisibleLibCount] = useState(48);
  const patterns = Array.isArray(data.patterns) ? data.patterns : [];
  const categories = Array.isArray(data.buildCategories) ? data.buildCategories : Array.from(new Set(patterns.map((p) => p.category)));
  const filtered = useTextFilter(patterns, {
    textFields: [
      (p) => tLocal(p.title),
      (p) => tLocal(p.summary),
      "framework", "language", "category", "difficulty",
      (p) => (p.tags || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: "category",
    activeChip: chip,
  });
  const selected = selectedId ? patterns.find((p) => p.id === selectedId) : null;

  /* External component libraries — separate from STEA-owned patterns.
   * UI shows "Open Documentation" / "Open Website", never "Copy Code". */
  const libAll = useMemo(
    () => (Array.isArray(data.resources) ? data.resources.filter((r) => r.buckets.includes("build")) : []),
    [data.resources]
  );
  const libCats = useMemo(() => {
    const present = new Set(libAll.flatMap((r) => (r.categories || []).map(canonicalCategory)));
    return BUILD_LIBRARY_CATEGORIES.filter((c) => present.has(c));
  }, [libAll]);
  useEffect(() => { setVisibleLibCount(48); }, [libChip, regionFilter, filterQuery, localQ]);
  const libFiltered = useTextFilter(libAll, {
    textFields: [
      (r) => tLocal(r.name),
      (r) => localSearchText(r.name),
      (r) => tLocal(r.description),
      (r) => localSearchText(r.description),
      (r) => tLocal(r.bestFor || ""),
      (r) => localSearchText(r.bestFor || ""),
      (r) => (r.categories || []).map((c) => categoryLabel(c, tLocal)).join(" "),
      (r) => categorySearchText(r.categories || []),
      (r) => (r.tags || []).join(" "),
      (r) => (r.frameworks || []).join(" "),
      (r) => (r.languagesUsed || []).join(" "),
      "pricing", (r) => (r.platforms || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: [(r) => (r.categories || []).map(canonicalCategory)],
    activeChip: libChip,
  });
  const libRegionFiltered = useMemo(
    () => libFiltered.filter((r) => matchesRegion(r, regionFilter)),
    [libFiltered, regionFilter]
  );
  const libVisible = useMemo(() => libRegionFiltered.slice(0, visibleLibCount), [libRegionFiltered, visibleLibCount]);
  const libGrouped = useMemo(() => {
    const m = new Map();
    for (const r of libVisible) {
      const key = canonicalCategory((r.categories && r.categories[0]) ? r.categories[0] : "Component Libraries");
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return BUILD_LIBRARY_CATEGORIES
      .filter((cat) => m.has(cat))
      .map((cat) => [cat, m.get(cat)]);
  }, [libVisible]);
  const selectedLib = selectedLibId ? libAll.find((r) => r.id === selectedLibId) : null;

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder="Filter patterns: modal, hero, button…"
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={categories}
        activeChip={chip}
        onChip={setChip}
        rightSlot={
          <div className="sc-v2-filter-meta">
            <Code2 size={12} aria-hidden="true" /> {patterns.length} patterns · {categories.length} categories
          </div>
        }
      />
      {data.status === "loading" && patterns.length === 0 ? (
        <LoadingSkeletons />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Build patterns match."
          description="Try removing the current filter or search across the seven worlds."
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-grid sc-v2-grid-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="sc-v2-card sc-v2-card-pattern"
              style={{ "--card-accent": world.accent }}
            >
              <div className="sc-v2-card-head">
                <span className="sc-v2-tag">{p.category}</span>
                <span className="sc-v2-tag sc-v2-tag-muted">{p.framework}{p.language && p.language !== p.framework ? ` · ${p.language}` : ""}</span>
              </div>
              <h3 className="sc-v2-card-title">{tLocal(p.title)}</h3>
              <p className="sc-v2-card-sub">{tLocal(p.summary)}</p>
              {p.previewImageUrl ? (
                <div className="sc-v2-card-preview" style={{ backgroundImage: `url(${p.previewImageUrl})` }} aria-hidden="true" />
              ) : p.preview ? (
                <pre className="sc-v2-card-preview" aria-hidden="true"><code>{p.preview}</code></pre>
              ) : null}
              <div className="sc-v2-card-foot">
                <BadgeRow item={p} regions={p.regions} chinaAvailable={p.chinaAvailable} chinaAlternative={p.chinaAlternative} />
                <span className="sc-v2-card-cta">View code <ExternalLink size={12} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
      <PatternModal
        pattern={selected}
        reduceMotion={reduceMotion}
        onClose={() => setSelectedId(null)}
      />

      {/* External component libraries — separate section below patterns. */}
      {libAll.length > 0 ? (
        <section className="sc-v2-libraries" aria-label="Component libraries">
          <div className="sc-v2-libraries-head">
            <h2 className="sc-v2-libraries-title">
              {tLocal({ en: "Component libraries & runtimes", zhCN: "组件库与运行时" })}
            </h2>
            <p className="sc-v2-libraries-sub">
              {tLocal({
                en: "External, well-known libraries. Open documentation or the official website — not STEA-owned code.",
                zhCN: "外部知名库。可查看文档或官网，并非 STEA 自有代码。",
              })}
            </p>
          </div>
          <FilterBar
            placeholder={tLocal({ en: "Filter libraries: react, vue, tailwind, charts, animation…", zhCN: "筛选组件库：react、vue、tailwind、图表、动画…" })}
            value={filterQuery || localQ}
            onChange={(v) => setLocalQ(v)}
            chips={libCats}
            activeChip={libChip}
            onChip={setLibChip}
            rightSlot={
              <div className="sc-v2-filter-meta">
                {libAll.length} libraries · {libCats.length} categories
                {isMainlandCN ? " · 含中国大陆可用信息" : ""}
              </div>
            }
          />
          <LocaleRegionControls regionFilter={regionFilter} onRegionFilter={setRegionFilter} />
          {libGrouped.length === 0 ? (
            <EmptyState
              title={tLocal({ en: "No libraries match.", zhCN: "没有匹配的组件库。" })}
              description={tLocal({ en: "Try a different keyword or region filter.", zhCN: "尝试更换关键词或区域筛选。" })}
              onOpenSearch={onOpenSearch}
            />
          ) : (
            <div className="sc-v2-sections">
              {libGrouped.map(([cat, items]) => (
                <section key={cat} className="sc-v2-section-block">
                  <h2 className="sc-v2-section-block-title">{categoryLabel(cat, tLocal)}</h2>
                  <div className="sc-v2-grid sc-v2-grid-tools">
                    {items.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        className="sc-v2-card sc-v2-card-resource sc-v2-card-tool"
                        style={{ "--card-accent": world.accent }}
                        onClick={() => setSelectedLibId(r.id)}
                      >
                        <div className="sc-v2-card-head">
                          <span className="sc-v2-tool-initial" aria-hidden="true">{String(tLocal(r.name) || "?").slice(0, 1).toUpperCase()}</span>
                          <span className="sc-v2-tag">{categoryLabel(canonicalCategory((r.categories || [])[0]), tLocal)}</span>
                        </div>
                        <h3 className="sc-v2-card-title">{tLocal(r.name)}</h3>
                        <p className="sc-v2-card-sub">{tLocal(r.description)}</p>
                        <BadgeRow
                          item={r}
                          regions={r.regions}
                          chinaAvailable={r.chinaAvailable}
                          chinaAlternative={r.chinaAlternative}
                          offline={r.offlineRelevant}
                        />
                        <div className="sc-v2-card-foot">
                          <span className="sc-v2-tag sc-v2-tag-muted">{priceLabel(r.pricing, tLocal)}</span>
                          <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                            {tLocal(UI.openWebsite)} <ExternalLink size={12} />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {visibleLibCount < libRegionFiltered.length ? (
                <div className="sc-v2-load-more">
                  <button type="button" className="sc-v2-primary-btn" onClick={() => setVisibleLibCount((n) => n + 48)}>
                    {tLocal(UI.showMore)} · {libRegionFiltered.length - visibleLibCount}
                  </button>
                </div>
              ) : null}
            </div>
          )}
          <ToolDetailModal tool={selectedLib} onClose={() => setSelectedLibId(null)} />
        </section>
      ) : null}
    </>
  );
}

function PatternModal({ pattern, reduceMotion, onClose }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!pattern) return;
    setCopied(false);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pattern, onClose]);
  if (!pattern || typeof document === "undefined") return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pattern.code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return createPortal(
    <div className="sc-v2-modal" role="dialog" aria-modal="true" aria-labelledby="pm-title">
      <div className="sc-v2-modal-bg" onClick={onClose} aria-label="Close" />
      <div className={"sc-v2-modal-panel" + (reduceMotion ? "" : " sc-v2-modal-in")}>
        <header className="sc-v2-modal-head">
          <div>
            <span className="sc-v2-eyebrow" style={{ color: "#f5a623", borderColor: "#f5a62333" }}>
              {pattern.category} · {pattern.framework}
            </span>
            <h2 id="pm-title" style={{ margin: "6px 0 2px" }}>{tLocal(pattern.title)}</h2>
            <p style={{ opacity: 0.7, margin: 0 }}>{tLocal(pattern.summary)}</p>
          </div>
          <button type="button" className="sc-v2-ghost-btn" onClick={onClose} aria-label="Close">Close</button>
        </header>
        <BadgeRow item={pattern} regions={pattern.regions} chinaAvailable={pattern.chinaAvailable} chinaAlternative={pattern.chinaAlternative} />
        {pattern.officialUrl && (
          <p className="sc-v2-meta-row">Official reference:
            <a className="sc-v2-link" href={pattern.officialUrl} target="_blank" rel="noreferrer noopener">{pattern.officialUrl}</a>
          </p>
        )}
        {isMainlandCN && pattern.chinaAlternative && (
          <div className="sc-v2-block-note">
            <strong>中国大陆替代方案：</strong>
            <div style={{ marginTop: 4 }}>{tLocal(pattern.chinaAlternative)}</div>
          </div>
        )}
        {pattern.code ? (
          <div className="sc-v2-code-wrap">
            <div className="sc-v2-code-head">
              <span>Copyable code · {pattern.language || pattern.framework || "Mixed"}</span>
              <button type="button" className="sc-v2-ghost-btn" onClick={copy}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <pre className="sc-v2-code-pre" aria-label="Pattern source code"><code>{pattern.code}</code></pre>
          </div>
        ) : (
          <EmptyState title="No copyable code." description="This pattern entry has no embedded code yet. Check the official link for reference." onOpenSearch={() => {}} actionLabel="Dismiss" />
        )}
      </div>
    </div>,
    document.body
  );
}

/* ====================================================================== *
 * Tools world (RESOURCES where buckets.includes("tools"))
 * ====================================================================== */

function ToolsView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "tools");
  const [chip, setChip] = useState(null);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [localQ, setLocalQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = useMemo(
    () => (Array.isArray(data.resources) ? data.resources.filter((r) => r.buckets.includes("tools")) : []),
    [data.resources]
  );
  const cats = useMemo(() => {
    const present = new Set(all.flatMap((r) => (r.categories || []).map(canonicalCategory)));
    return PRIMARY_TOOL_CATEGORIES.filter((c) => present.has(c));
  }, [all]);
  const selected = selectedId ? all.find((r) => r.id === selectedId) : null;
  useEffect(() => { setVisibleCount(48); }, [chip, regionFilter, filterQuery, localQ]);
  const filtered = useTextFilter(all, {
    textFields: [
      (r) => tLocal(r.name),
      (r) => localSearchText(r.name),
      (r) => tLocal(r.description),
      (r) => localSearchText(r.description),
      (r) => tLocal(r.bestFor || ""),
      (r) => localSearchText(r.bestFor || ""),
      (r) => tLocal(r.chinaAlternative || ""),
      (r) => localSearchText(r.chinaAlternative || ""),
      (r) => (r.categories || []).map((c) => categoryLabel(c, tLocal)).join(" "),
      (r) => categorySearchText(r.categories || []),
      (r) => (r.tags || []).join(" "),
      "pricing", (r) => (r.platforms || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: [(r) => (r.categories || []).map(canonicalCategory)],
    activeChip: chip,
  });
  const regionFiltered = useMemo(() => filtered.filter((r) => matchesRegion(r, regionFilter)), [filtered, regionFilter]);
  const visibleItems = useMemo(() => regionFiltered.slice(0, visibleCount), [regionFiltered, visibleCount]);
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of visibleItems) {
      const key = canonicalCategory((r.categories && r.categories[0]) ? r.categories[0] : "Developer Productivity");
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return PRIMARY_TOOL_CATEGORIES
      .filter((cat) => m.has(cat))
      .map((cat) => [cat, m.get(cat)]);
  }, [visibleItems]);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder={tLocal(UI.filterTools)}
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={cats}
        activeChip={chip}
        onChip={setChip}
        rightSlot={
          <div className="sc-v2-filter-meta">
            <Hammer size={12} aria-hidden="true" /> {all.length} tools · {cats.length} categories
            {isMainlandCN ? " · 含中国大陆可用信息" : ""}
          </div>
        }
      />
      <LocaleRegionControls regionFilter={regionFilter} onRegionFilter={setRegionFilter} />
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : grouped.length === 0 ? (
        <EmptyState
          title={tLocal(UI.noToolsTitle)}
          description={tLocal(UI.noToolsDesc)}
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-sections">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="sc-v2-section-block">
              <h2 className="sc-v2-section-block-title">{categoryLabel(cat, tLocal)}</h2>
              <div className="sc-v2-grid sc-v2-grid-tools">
                {items.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className="sc-v2-card sc-v2-card-resource sc-v2-card-tool"
                    style={{ "--card-accent": world.accent }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="sc-v2-card-head">
                      <span className="sc-v2-tool-initial" aria-hidden="true">{String(tLocal(r.name) || "?").slice(0, 1).toUpperCase()}</span>
                      <span className="sc-v2-tag">{categoryLabel(canonicalCategory((r.categories || [])[0]), tLocal)}</span>
                    </div>
                    <h3 className="sc-v2-card-title">{tLocal(r.name)}</h3>
                    <p className="sc-v2-card-sub">{tLocal(r.description)}</p>
                    <BadgeRow
                      item={r}
                      regions={r.regions}
                      chinaAvailable={r.chinaAvailable}
                      chinaAlternative={r.chinaAlternative}
                      offline={r.offlineRelevant}
                    />
                    <div className="sc-v2-card-foot">
                      <span className="sc-v2-tag sc-v2-tag-muted">{priceLabel(r.pricing, tLocal)}</span>
                      <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                        {tLocal(UI.openWebsite)} <ExternalLink size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleCount < regionFiltered.length ? (
            <div className="sc-v2-load-more">
              <button type="button" className="sc-v2-primary-btn" onClick={() => setVisibleCount((n) => n + 48)}>
                {tLocal(UI.showMore)} · {regionFiltered.length - visibleCount}
              </button>
            </div>
          ) : null}
        </div>
      )}
      <ToolDetailModal tool={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function ToolDetailModal({ tool, onClose }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  useEffect(() => {
    if (!tool) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [tool, onClose]);
  if (!tool || typeof document === "undefined") return null;
  const rows = [
    [UI.whatItDoes, tLocal(tool.description)],
    [UI.bestFor, tLocal(tool.bestFor)],
    [UI.platforms, (tool.platforms || []).join(" · ") || "Web"],
    [UI.pricing, priceLabel(tool.pricing, tLocal)],
    [UI.openSource, tool.openSource ? tLocal(UI.yes) : tLocal(UI.no)],
    [UI.offline, tool.offlineRelevant ? tLocal(UI.yes) : tLocal(UI.no)],
    [UI.chinaAvailability, regionLabel(tool.regions, tLocal)],
  ];
  return createPortal(
    <div className="sc-v2-modal" role="dialog" aria-modal="true" aria-labelledby="tool-title">
      <button className="sc-v2-modal-bg" type="button" onClick={onClose} aria-label={tLocal(UI.close)} />
      <section className="sc-v2-modal-panel sc-v2-tool-modal">
        <header className="sc-v2-modal-head">
          <div className="sc-v2-tool-modal-title">
            <span className="sc-v2-tool-initial sc-v2-tool-initial-large" aria-hidden="true">{String(tLocal(tool.name) || "?").slice(0, 1).toUpperCase()}</span>
            <div>
              <span className="sc-v2-eyebrow" style={{ color: "#8b5cf6", borderColor: "#8b5cf633" }}>
                {categoryLabel(canonicalCategory((tool.categories || [])[0]), tLocal)}
              </span>
              <h2 id="tool-title" style={{ margin: "8px 0 0" }}>{tLocal(tool.name)}</h2>
            </div>
          </div>
          <button type="button" className="sc-v2-ghost-btn" onClick={onClose}>{tLocal(UI.close)}</button>
        </header>
        <BadgeRow item={tool} regions={tool.regions} chinaAvailable={tool.chinaAvailable} chinaAlternative={tool.chinaAlternative} offline={tool.offlineRelevant} />
        <div className="sc-v2-tool-detail-grid">
          {rows.map(([label, value]) => (
            <div key={tLocal(label)} className="sc-v2-tool-detail-row">
              <span>{tLocal(label)}</span>
              <strong>{value || "—"}</strong>
            </div>
          ))}
          {tool.chinaAlternative ? (
            <div className="sc-v2-tool-detail-row sc-v2-tool-detail-row-wide">
              <span>{tLocal(UI.chinaAlternative)}</span>
              <strong>{tLocal(tool.chinaAlternative)}</strong>
            </div>
          ) : null}
          {tool.officialUrl ? (
            <div className="sc-v2-tool-detail-row sc-v2-tool-detail-row-wide">
              <span>{tLocal(UI.officialWebsite)}</span>
              <a className="sc-v2-link" href={tool.officialUrl} target="_blank" rel="noopener noreferrer">{tool.officialUrl}</a>
            </div>
          ) : null}
        </div>
        {isMainlandCN && tool.chinaAlternative ? (
          <div className="sc-v2-block-note">
            <strong>{tLocal(UI.chinaAlternative)}:</strong>
            <div style={{ marginTop: 4 }}>{tLocal(tool.chinaAlternative)}</div>
          </div>
        ) : null}
        <div className="sc-v2-tool-modal-actions">
          {tool.officialUrl ? (
            <a className="sc-v2-primary-btn" href={tool.officialUrl} target="_blank" rel="noopener noreferrer">
              {tLocal(UI.openWebsite)} <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  );
}

/* ====================================================================== *
 * Ship world (RESOURCES where buckets.includes("ship")) — by shipSection.
 * ====================================================================== */

function ShipView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "ship");
  const [chip, setChip] = useState(null);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [localQ, setLocalQ] = useState("");
  const [deploying, setDeploying] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = useMemo(
    () => (Array.isArray(data.resources) ? data.resources.filter((r) => r.buckets.includes("ship")) : []),
    [data.resources]
  );
  const sections = useMemo(() => {
    const present = new Set(all.flatMap((r) => (r.categories || []).map(canonicalShipCategory)));
    return SHIP_CATEGORIES.filter((c) => present.has(c));
  }, [all]);
  const selected = selectedId ? all.find((r) => r.id === selectedId) : null;
  useEffect(() => { setVisibleCount(48); }, [chip, regionFilter, filterQuery, localQ, deploying, recommendation]);
  const activeTokens = useMemo(() => {
    const deployTokens = DEPLOYING_OPTIONS.find(([id]) => id === deploying)?.[2] || [];
    const recTokens = SHIP_RECOMMENDATIONS.find(([id]) => id === recommendation)?.[2] || [];
    return [...deployTokens, ...recTokens].map((t) => String(t).toLowerCase());
  }, [deploying, recommendation]);
  const filtered = useTextFilter(all, {
    textFields: [
      (r) => tLocal(r.name),
      (r) => localSearchText(r.name),
      (r) => tLocal(r.description),
      (r) => localSearchText(r.description),
      (r) => tLocal(r.bestFor || ""),
      (r) => localSearchText(r.bestFor || ""),
      (r) => tLocal(r.chinaAlternative || ""),
      (r) => localSearchText(r.chinaAlternative || ""),
      (r) => (r.categories || []).map((c) => categoryLabel(c, tLocal)).join(" "),
      (r) => categorySearchText(r.categories || []),
      (r) => (r.tags || []).join(" "),
      (r) => (r.shipSections || []).join(" "),
      "pricing", (r) => (r.platforms || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: [(r) => (r.categories || []).map(canonicalShipCategory)],
    activeChip: chip,
  });
  const regionFiltered = useMemo(() => {
    return filtered.filter((r) => {
      if (!matchesRegion(r, regionFilter)) return false;
      if (activeTokens.length === 0) return true;
      const hay = [
        tLocal(r.name),
        tLocal(r.description),
        tLocal(r.bestFor || ""),
        ...(r.tags || []),
        ...(r.categories || []),
        ...(r.shipSections || []),
      ].join(" ").toLowerCase();
      return activeTokens.some((tok) => hay.includes(tok));
    });
  }, [filtered, regionFilter, activeTokens, tLocal]);
  const visibleItems = useMemo(() => regionFiltered.slice(0, visibleCount), [regionFiltered, visibleCount]);
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of visibleItems) {
      const key = canonicalShipCategory((r.categories && r.categories[0]) ? r.categories[0] : "Full-stack Hosting");
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return SHIP_CATEGORIES.filter((cat) => m.has(cat)).map((cat) => [cat, m.get(cat)]);
  }, [visibleItems]);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder={tLocal(UI.filterShip)}
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={sections}
        activeChip={chip}
        onChip={setChip}
        rightSlot={
          <div className="sc-v2-filter-meta">
            <Ship size={12} aria-hidden="true" /> {all.length} resources · {sections.length} categories
          </div>
        }
      />
      <LocaleRegionControls regionFilter={regionFilter} onRegionFilter={setRegionFilter} />
      <DeployingSelector selected={deploying} onSelect={setDeploying} />
      <RecommendationChips selected={recommendation} onSelect={setRecommendation} />
      <ChinaDeploymentNote />
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : grouped.length === 0 ? (
        <EmptyState
          title={tLocal(UI.noShipTitle)}
          description={tLocal(UI.noShipDesc)}
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-sections">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="sc-v2-section-block">
              <h2 className="sc-v2-section-block-title">{categoryLabel(cat, tLocal)}</h2>
              <div className="sc-v2-grid sc-v2-grid-tools">
                {items.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className="sc-v2-card sc-v2-card-resource sc-v2-card-tool"
                    style={{ "--card-accent": world.accent }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="sc-v2-card-head">
                      <span className="sc-v2-tool-initial" aria-hidden="true">{String(tLocal(r.name) || "?").slice(0, 1).toUpperCase()}</span>
                      <span className="sc-v2-tag">{categoryLabel(cat, tLocal)}</span>
                    </div>
                    <h3 className="sc-v2-card-title">{tLocal(r.name)}</h3>
                    <p className="sc-v2-card-sub">{tLocal(r.description)}</p>
                    <BadgeRow item={r} regions={r.regions} chinaAvailable={r.chinaAvailable} chinaAlternative={r.chinaAlternative} offline={r.offlineRelevant} />
                    <div className="sc-v2-card-foot">
                      <span className="sc-v2-tag sc-v2-tag-muted">{priceLabel(r.pricing, tLocal)}</span>
                      <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                        {tLocal(UI.openWebsite)} <ExternalLink size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleCount < regionFiltered.length ? (
            <div className="sc-v2-load-more">
              <button type="button" className="sc-v2-primary-btn" onClick={() => setVisibleCount((n) => n + 48)}>
                {tLocal(UI.showMore)} · {regionFiltered.length - visibleCount}
              </button>
            </div>
          ) : null}
        </div>
      )}
      <ShipDetailModal resource={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function SECTION_TITLE(id) {
  return {
    deploy: "Deploy",
    hosting: "Hosting",
    domains: "Domains + DNS",
    backend: "Managed Backend",
    production: "Production Ops",
  }[id] || id || "Other";
}
function SECTION_DESC(id) {
  return {
    deploy: "CI/CD, static hosts, frontend platforms.",
    hosting: "Full VPS, VM, Kubernetes, cloud providers.",
    domains: "Registrars, DNS, CDN, certificates.",
    backend: "Managed DB, auth, storage, queues.",
    production: "Monitoring, error tracking, analytics.",
  }[id] || "";
}

function DeployingSelector({ selected, onSelect }) {
  const { tLocal } = useSteaCodeI18n();
  return (
    <div className="sc-v2-builder">
      <div className="sc-v2-builder-title">{tLocal(UI.whatDeploying)}</div>
      <div className="sc-v2-filter-chips">
        {DEPLOYING_OPTIONS.map(([id, label]) => (
          <button key={id} type="button" className={"sc-v2-chip" + (selected === id ? " is-active" : "")} onClick={() => onSelect(selected === id ? "" : id)}>
            {tLocal(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function RecommendationChips({ selected, onSelect }) {
  const { tLocal } = useSteaCodeI18n();
  return (
    <div className="sc-v2-builder sc-v2-recommendations">
      <div className="sc-v2-builder-title">{tLocal(UI.recommendedFor)}</div>
      <div className="sc-v2-filter-chips sc-v2-filter-chips-secondary">
        {SHIP_RECOMMENDATIONS.map(([id, label]) => (
          <button key={id} type="button" className={"sc-v2-chip" + (selected === id ? " is-active" : "")} onClick={() => onSelect(selected === id ? "" : id)}>
            {tLocal(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChinaDeploymentNote() {
  const { tLocal } = useSteaCodeI18n();
  return (
    <section className="sc-v2-china-note">
      <div>
        <h2>{tLocal(UI.chinaRealityTitle)}</h2>
        <p>{tLocal(UI.chinaRealityBody)}</p>
      </div>
      <div className="sc-v2-china-links">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{tLocal(UI.officialDocs)} · ICP</a>
        <a href="https://beian.mps.gov.cn/" target="_blank" rel="noopener noreferrer">{tLocal(UI.officialDocs)} · 公安备案</a>
      </div>
    </section>
  );
}

function hasAnyTag(resource, terms) {
  const hay = [
    ...(resource.tags || []),
    ...(resource.categories || []),
    ...(resource.shipSections || []),
    resource.description?.en,
    resource.description?.zhCN,
  ].join(" ").toLowerCase();
  return terms.some((term) => hay.includes(term));
}

function ShipDetailModal({ resource, onClose }) {
  const { tLocal } = useSteaCodeI18n();
  useEffect(() => {
    if (!resource) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [resource, onClose]);
  if (!resource || typeof document === "undefined") return null;
  const workloads = [
    ...(resource.tags || []),
    ...(resource.shipSections || []),
  ].filter(Boolean).slice(0, 8).join(" · ");
  const rows = [
    [UI.whatItDoes, tLocal(resource.description)],
    [UI.bestFor, tLocal(resource.bestFor)],
    [UI.supportedWorkloads, workloads || "Web"],
    [UI.chinaAvailability, regionLabel(resource.regions, tLocal)],
    [UI.pricingModel, priceLabel(resource.pricing, tLocal)],
    [UI.domainSupport, hasAnyTag(resource, ["domain", "dns", "ssl", "cdn"]) ? tLocal(UI.yes) : tLocal(UI.no)],
    [UI.databaseStorage, hasAnyTag(resource, ["database", "storage", "postgres", "mysql", "s3", "oss"]) ? tLocal(UI.yes) : tLocal(UI.no)],
  ];
  return createPortal(
    <div className="sc-v2-modal" role="dialog" aria-modal="true" aria-labelledby="ship-title">
      <button className="sc-v2-modal-bg" type="button" onClick={onClose} aria-label={tLocal(UI.close)} />
      <section className="sc-v2-modal-panel sc-v2-tool-modal">
        <header className="sc-v2-modal-head">
          <div className="sc-v2-tool-modal-title">
            <span className="sc-v2-tool-initial sc-v2-tool-initial-large" aria-hidden="true">{String(tLocal(resource.name) || "?").slice(0, 1).toUpperCase()}</span>
            <div>
              <span className="sc-v2-eyebrow" style={{ color: "#22c55e", borderColor: "#22c55e33" }}>
                {categoryLabel(canonicalShipCategory((resource.categories || [])[0]), tLocal)}
              </span>
              <h2 id="ship-title" style={{ margin: "8px 0 0" }}>{tLocal(resource.name)}</h2>
            </div>
          </div>
          <button type="button" className="sc-v2-ghost-btn" onClick={onClose}>{tLocal(UI.close)}</button>
        </header>
        <BadgeRow item={resource} regions={resource.regions} chinaAvailable={resource.chinaAvailable} chinaAlternative={resource.chinaAlternative} offline={resource.offlineRelevant} />
        <div className="sc-v2-tool-detail-grid">
          {rows.map(([label, value]) => (
            <div key={tLocal(label)} className="sc-v2-tool-detail-row">
              <span>{tLocal(label)}</span>
              <strong>{value || "—"}</strong>
            </div>
          ))}
          {resource.chinaAlternative ? (
            <div className="sc-v2-tool-detail-row sc-v2-tool-detail-row-wide">
              <span>{tLocal(UI.chinaAlternative)}</span>
              <strong>{tLocal(resource.chinaAlternative)}</strong>
            </div>
          ) : null}
          {resource.officialUrl ? (
            <div className="sc-v2-tool-detail-row sc-v2-tool-detail-row-wide">
              <span>{tLocal(UI.officialWebsite)}</span>
              <a className="sc-v2-link" href={resource.officialUrl} target="_blank" rel="noopener noreferrer">{resource.officialUrl}</a>
            </div>
          ) : null}
        </div>
        <div className="sc-v2-tool-modal-actions">
          {resource.officialUrl ? (
            <a className="sc-v2-primary-btn" href={resource.officialUrl} target="_blank" rel="noopener noreferrer">
              {tLocal(UI.openWebsite)} <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  );
}

/* ====================================================================== *
 * Learn world — strictly developer content. No consumer tech news.
 * ====================================================================== */

function LearnView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "learn");
  const [chip, setChip] = useState(null);
  const [typeChip, setTypeChip] = useState(null);
  const [localQ, setLocalQ] = useState("");
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = Array.isArray(data.knowledge) ? data.knowledge : [];
  const topics = Array.isArray(data.learnTopics) ? data.learnTopics : Array.from(new Set(all.flatMap((k) => k.topics)));
  const types = Array.isArray(data.learnTypes) && data.learnTypes.length > 0 ? data.learnTypes : ["Quick Tip", "Guide", "Cheatsheet", "Reference"];
  const filteredPre = useTextFilter(all, {
    textFields: [
      (k) => tLocal(k.title),
      (k) => tLocal(k.summary),
      "type", "level",
      (k) => (k.topics || []).join(" "),
      "content",
    ],
    filterQuery: filterQuery || localQ,
    chipKey: "topics",
    activeChip: chip,
  });
  const filtered = useMemo(
    () => (typeChip ? filteredPre.filter((k) => k.type === typeChip) : filteredPre),
    [filteredPre, typeChip]
  );
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <FilterBar
          placeholder="Filter guides: git, react, dns, performance, security…"
          value={filterQuery || localQ}
          onChange={(v) => setLocalQ(v)}
          chips={topics}
          activeChip={chip}
          onChip={setChip}
          rightSlot={
            <div className="sc-v2-filter-meta">
              <GraduationCap size={12} aria-hidden="true" /> {all.length} lessons · {topics.length} topics · Dev-only content
            </div>
          }
        />
        <div className="sc-v2-filter-chips sc-v2-filter-chips-secondary">
          <button
            type="button"
            className={"sc-v2-chip sc-v2-chip-all" + (!typeChip ? " is-active" : "")}
            onClick={() => setTypeChip(null)}
          >
            All types
          </button>
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={"sc-v2-chip" + (typeChip === t ? " is-active" : "")}
              onClick={() => setTypeChip(typeChip === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No lessons match."
          description="Consumer tech news is intentionally excluded — Learn contains developer guidance only."
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-list">
          {filtered.map((k) => {
            const open = openId === k.id;
            return (
              <article key={k.id} className={"sc-v2-card sc-v2-card-knowledge" + (open ? " is-open" : "")}>
                <button
                  type="button"
                  className="sc-v2-card-head sc-v2-accordion-head"
                  onClick={() => setOpenId(open ? null : k.id)}
                  aria-expanded={open}
                >
                  <div className="sc-v2-card-head-left">
                    <span className="sc-v2-tag sc-v2-tag-type" data-type={k.type}>{k.type}</span>
                    <span className="sc-v2-tag sc-v2-tag-muted">{k.level}</span>
                    <span className="sc-v2-tag sc-v2-tag-muted">{k.readingTimeMin} min</span>
                    <div className="sc-v2-topics">
                      {(k.topics || []).map((t) => <span key={t} className="sc-v2-topic">{t}</span>)}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={"sc-v2-chev" + (open ? " is-up" : "")}
                    aria-hidden="true"
                  />
                </button>
                <h3 className="sc-v2-card-title">{tLocal(k.title)}</h3>
                <p className="sc-v2-card-sub">{tLocal(k.summary)}</p>
                {open && (
                  <div className="sc-v2-accordion-body">
                    <BadgeRow
                      item={k}
                      regions={k.regions}
                      chinaAvailable={k.chinaAvailable}
                      chinaAlternative={k.chinaNotes}
                      offline={k.offlineAvailable}
                    />
                    <pre className="sc-v2-knowledge-body"><code>{k.content || ""}</code></pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ====================================================================== *
 * Inspire world — visual references grouped by group.
 * ====================================================================== */

function InspireView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "inspire");
  const [chip, setChip] = useState(null);
  const [localQ, setLocalQ] = useState("");
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = Array.isArray(data.inspiration) ? data.inspiration : [];
  const groups = Array.isArray(data.inspireGroups) && data.inspireGroups.length > 0
    ? data.inspireGroups
    : Array.from(new Set(all.map((i) => i.group)));
  const filtered = useTextFilter(all, {
    textFields: [
      (i) => tLocal(i.title),
      "category", "style", "platform",
      (i) => (i.relatedPatterns || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: "group",
    activeChip: chip,
  });
  const grouped = useMemo(() => {
    const m = new Map();
    for (const i of filtered) {
      const key = i.group || "websites";
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(i);
    }
    return groups.map((g) => [g, m.get(g) || []]).filter(([, list]) => list.length > 0);
  }, [filtered, groups]);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder="Filter inspiration: hero, dashboard, onboarding, motion…"
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={groups.map((g) => GROUP_TITLE(g))}
        activeChip={chip ? GROUP_TITLE(chip) : null}
        onChip={(c) => {
          if (!c) { setChip(null); return; }
          const id = groups.find((g) => GROUP_TITLE(g) === c);
          setChip(id || null);
        }}
        rightSlot={
          <div className="sc-v2-filter-meta">
            <Sparkles size={12} aria-hidden="true" /> {all.length} references
          </div>
        }
      />
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No inspiration matches."
          description="Try another keyword, group, or search across the seven worlds."
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-sections">
          {grouped.map(([group, list]) => (
            <section key={group} className="sc-v2-section-block">
              <div className="sc-v2-subsection-head">
                <h2 className="sc-v2-section-block-title">{GROUP_TITLE(group)}</h2>
                <span className="sc-v2-section-block-desc">{GROUP_DESC(group)}</span>
              </div>
              <div className="sc-v2-grid sc-v2-grid-masonry">
                {list.map((i) => (
                  <a
                    key={i.id}
                    className="sc-v2-card sc-v2-card-inspire"
                    style={{ "--card-accent": world.accent }}
                    href={i.sourceUrl || "#"}
                    target={i.sourceUrl ? "_blank" : undefined}
                    rel="noreferrer noopener"
                  >
                    <div
                      className="sc-v2-inspire-media"
                      style={{
                        backgroundImage: i.thumbnail ? `url(${i.thumbnail})` : undefined,
                      }}
                      aria-hidden="true"
                    >
                      <div className="sc-v2-inspire-fallback" aria-hidden="true">
                        <MonitorPlay size={24} />
                      </div>
                    </div>
                    <div className="sc-v2-card-head">
                      <span className="sc-v2-tag">{i.category || GROUP_TITLE(group)}</span>
                      <span className="sc-v2-tag sc-v2-tag-muted">{i.platform || "Web"}</span>
                    </div>
                    <h3 className="sc-v2-card-title">{tLocal(i.title)}</h3>
                    {i.style ? <p className="sc-v2-card-sub" style={{ marginTop: 2 }}>Style: {i.style}</p> : null}
                    <div className="sc-v2-card-foot">
                      <BadgeRow item={i} regions={i.regions} chinaAvailable={i.chinaAvailable} />
                      {i.sourceUrl ? (
                        <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                          Visit <ExternalLink size={12} />
                        </span>
                      ) : null}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function GROUP_TITLE(g) {
  return { websites: "Websites", ui: "UI", motion: "Motion", mobile: "Mobile" }[g] || g;
}
function GROUP_DESC(g) {
  return {
    websites: "Marketing sites, portfolios, landing pages.",
    ui: "Strong patterns: navigation, cards, tables, pricing.",
    motion: "Transitions, scroll, page-in animation, microinteractions.",
    mobile: "iOS/Android reference screens, onboarding flows.",
  }[g] || "";
}

/* ====================================================================== *
 * Plan world (RESOURCES where buckets.includes("plan"))
 * ====================================================================== */

function PlanView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "plan");
  const [chip, setChip] = useState(null);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [localQ, setLocalQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = useMemo(
    () => (Array.isArray(data.resources) ? data.resources.filter((r) => r.buckets.includes("plan")) : []),
    [data.resources]
  );
  const cats = useMemo(() => {
    const present = new Set(all.flatMap((r) => (r.categories || []).map(canonicalCategory)));
    return PLAN_CATEGORIES.filter((c) => present.has(c));
  }, [all]);
  const selected = selectedId ? all.find((r) => r.id === selectedId) : null;
  useEffect(() => { setVisibleCount(48); }, [chip, regionFilter, filterQuery, localQ]);
  const filtered = useTextFilter(all, {
    textFields: [
      (r) => tLocal(r.name),
      (r) => localSearchText(r.name),
      (r) => tLocal(r.description),
      (r) => localSearchText(r.description),
      (r) => tLocal(r.bestFor || ""),
      (r) => localSearchText(r.bestFor || ""),
      (r) => tLocal(r.chinaAlternative || ""),
      (r) => localSearchText(r.chinaAlternative || ""),
      (r) => (r.categories || []).map((c) => categoryLabel(c, tLocal)).join(" "),
      (r) => categorySearchText(r.categories || []),
      (r) => (r.tags || []).join(" "),
      "pricing", (r) => (r.platforms || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: [(r) => (r.categories || []).map(canonicalCategory)],
    activeChip: chip,
  });
  const regionFiltered = useMemo(() => filtered.filter((r) => matchesRegion(r, regionFilter)), [filtered, regionFilter]);
  const visibleItems = useMemo(() => regionFiltered.slice(0, visibleCount), [regionFiltered, visibleCount]);
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of visibleItems) {
      const key = canonicalCategory((r.categories && r.categories[0]) ? r.categories[0] : "Product Planning");
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return PLAN_CATEGORIES
      .filter((cat) => m.has(cat))
      .map((cat) => [cat, m.get(cat)]);
  }, [visibleItems]);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder={tLocal(UI.filterPlan)}
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={cats}
        activeChip={chip}
        onChip={setChip}
        rightSlot={
          <div className="sc-v2-filter-meta">
            {all.length} resources · {cats.length} categories
            {isMainlandCN ? " · 含中国大陆可用信息" : ""}
          </div>
        }
      />
      <LocaleRegionControls regionFilter={regionFilter} onRegionFilter={setRegionFilter} />
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : grouped.length === 0 ? (
        <EmptyState
          title={tLocal(UI.noPlanTitle)}
          description={tLocal(UI.noPlanDesc)}
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-sections">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="sc-v2-section-block">
              <h2 className="sc-v2-section-block-title">{categoryLabel(cat, tLocal)}</h2>
              <div className="sc-v2-grid sc-v2-grid-tools">
                {items.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className="sc-v2-card sc-v2-card-resource sc-v2-card-tool"
                    style={{ "--card-accent": world.accent }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="sc-v2-card-head">
                      <span className="sc-v2-tool-initial" aria-hidden="true">{String(tLocal(r.name) || "?").slice(0, 1).toUpperCase()}</span>
                      <span className="sc-v2-tag">{categoryLabel(canonicalCategory((r.categories || [])[0]), tLocal)}</span>
                    </div>
                    <h3 className="sc-v2-card-title">{tLocal(r.name)}</h3>
                    <p className="sc-v2-card-sub">{tLocal(r.description)}</p>
                    <BadgeRow
                      item={r}
                      regions={r.regions}
                      chinaAvailable={r.chinaAvailable}
                      chinaAlternative={r.chinaAlternative}
                      offline={r.offlineRelevant}
                    />
                    <div className="sc-v2-card-foot">
                      <span className="sc-v2-tag sc-v2-tag-muted">{priceLabel(r.pricing, tLocal)}</span>
                      <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                        {tLocal(UI.openWebsite)} <ExternalLink size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleCount < regionFiltered.length ? (
            <div className="sc-v2-load-more">
              <button type="button" className="sc-v2-primary-btn" onClick={() => setVisibleCount((n) => n + 48)}>
                {tLocal(UI.showMore)} · {regionFiltered.length - visibleCount}
              </button>
            </div>
          ) : null}
        </div>
      )}
      <ToolDetailModal tool={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

/* ====================================================================== *
 * Monetize world (RESOURCES where buckets.includes("monetize"))
 * ====================================================================== */

function MonetizeView({ data, filterQuery, intent, onOpenSearch }) {
  const { tLocal, isMainlandCN } = useSteaCodeI18n();
  const world = V2_WORLDS.find((w) => w.id === "monetize");
  const [chip, setChip] = useState(null);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [localQ, setLocalQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => { if (intent) setLocalQ(intent); }, [intent]);
  const all = useMemo(
    () => (Array.isArray(data.resources) ? data.resources.filter((r) => r.buckets.includes("monetize")) : []),
    [data.resources]
  );
  const cats = useMemo(() => {
    const present = new Set(all.flatMap((r) => (r.categories || []).map(canonicalCategory)));
    return MONETIZE_CATEGORIES.filter((c) => present.has(c));
  }, [all]);
  const selected = selectedId ? all.find((r) => r.id === selectedId) : null;
  useEffect(() => { setVisibleCount(48); }, [chip, regionFilter, filterQuery, localQ]);
  const filtered = useTextFilter(all, {
    textFields: [
      (r) => tLocal(r.name),
      (r) => localSearchText(r.name),
      (r) => tLocal(r.description),
      (r) => localSearchText(r.description),
      (r) => tLocal(r.bestFor || ""),
      (r) => localSearchText(r.bestFor || ""),
      (r) => tLocal(r.chinaAlternative || ""),
      (r) => localSearchText(r.chinaAlternative || ""),
      (r) => (r.categories || []).map((c) => categoryLabel(c, tLocal)).join(" "),
      (r) => categorySearchText(r.categories || []),
      (r) => (r.tags || []).join(" "),
      "pricing", (r) => (r.platforms || []).join(" "),
    ],
    filterQuery: filterQuery || localQ,
    chipKey: [(r) => (r.categories || []).map(canonicalCategory)],
    activeChip: chip,
  });
  const regionFiltered = useMemo(() => filtered.filter((r) => matchesRegion(r, regionFilter)), [filtered, regionFilter]);
  const visibleItems = useMemo(() => regionFiltered.slice(0, visibleCount), [regionFiltered, visibleCount]);
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of visibleItems) {
      const key = canonicalCategory((r.categories && r.categories[0]) ? r.categories[0] : "Payments");
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(r);
    }
    return MONETIZE_CATEGORIES
      .filter((cat) => m.has(cat))
      .map((cat) => [cat, m.get(cat)]);
  }, [visibleItems]);

  return (
    <>
      <Title
        eyebrow={world.eyebrow}
        accent={world.accent}
        title={world.title}
        sub={world.short}
        intro={world.sectionIntro}
      />
      {data.status === "error" ? <ErrorBanner error={data.error} /> : null}
      <FilterBar
        placeholder={tLocal(UI.filterMonetize)}
        value={filterQuery || localQ}
        onChange={(v) => setLocalQ(v)}
        chips={cats}
        activeChip={chip}
        onChip={setChip}
        rightSlot={
          <div className="sc-v2-filter-meta">
            {all.length} resources · {cats.length} categories
            {isMainlandCN ? " · 含中国大陆可用信息" : ""}
          </div>
        }
      />
      <LocaleRegionControls regionFilter={regionFilter} onRegionFilter={setRegionFilter} />
      {data.status === "loading" && all.length === 0 ? (
        <LoadingSkeletons />
      ) : grouped.length === 0 ? (
        <EmptyState
          title={tLocal(UI.noMonetizeTitle)}
          description={tLocal(UI.noMonetizeDesc)}
          onOpenSearch={onOpenSearch}
        />
      ) : (
        <div className="sc-v2-sections">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="sc-v2-section-block">
              <h2 className="sc-v2-section-block-title">{categoryLabel(cat, tLocal)}</h2>
              <div className="sc-v2-grid sc-v2-grid-tools">
                {items.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className="sc-v2-card sc-v2-card-resource sc-v2-card-tool"
                    style={{ "--card-accent": world.accent }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <div className="sc-v2-card-head">
                      <span className="sc-v2-tool-initial" aria-hidden="true">{String(tLocal(r.name) || "?").slice(0, 1).toUpperCase()}</span>
                      <span className="sc-v2-tag">{categoryLabel(canonicalCategory((r.categories || [])[0]), tLocal)}</span>
                    </div>
                    <h3 className="sc-v2-card-title">{tLocal(r.name)}</h3>
                    <p className="sc-v2-card-sub">{tLocal(r.description)}</p>
                    <BadgeRow
                      item={r}
                      regions={r.regions}
                      chinaAvailable={r.chinaAvailable}
                      chinaAlternative={r.chinaAlternative}
                      offline={r.offlineRelevant}
                    />
                    <div className="sc-v2-card-foot">
                      <span className="sc-v2-tag sc-v2-tag-muted">{priceLabel(r.pricing, tLocal)}</span>
                      <span className="sc-v2-card-cta" style={{ color: world.accent }}>
                        {tLocal(UI.openWebsite)} <ExternalLink size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleCount < regionFiltered.length ? (
            <div className="sc-v2-load-more">
              <button type="button" className="sc-v2-primary-btn" onClick={() => setVisibleCount((n) => n + 48)}>
                {tLocal(UI.showMore)} · {regionFiltered.length - visibleCount}
              </button>
            </div>
          ) : null}
        </div>
      )}
      <ToolDetailModal tool={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

/* ====================================================================== *
 * Exported switcher
 * ====================================================================== */

export default function V2Views(props) {
  const { world } = props;
  switch (world) {
    case "plan":    return <PlanView {...props} />;
    case "build":   return <BuildView {...props} />;
    case "tools":   return <ToolsView {...props} />;
    case "ship":    return <ShipView {...props} />;
    case "learn":   return <LearnView {...props} />;
    case "inspire": return <InspireView {...props} />;
    case "monetize":return <MonetizeView {...props} />;
    default: return (
      <EmptyState
        title="This world does not exist."
        description="Return home and choose one of the seven gateways."
        onOpenSearch={() => (window.location.href = "/code")}
        actionLabel="Go home"
      />
    );
  }
}
