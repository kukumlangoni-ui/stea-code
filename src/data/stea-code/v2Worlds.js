/* ======================================================================
 * STEA Code V2 — 7 developer worlds. Single source of truth.
 *
 * Old 8-view → 7-world compatibility map:
 *   code        → build
 *   tips        → learn
 *   hosting     → ship
 *   domains     → ship
 *   inspiration → inspire
 *   ui          → build   (UI Libraries → component libs reference + Build patterns)
 *   essentials  → tools
 *   guides      → learn
 *   design      → plan
 *   planning    → plan
 *   monetize    → monetize
 *   growth      → monetize
 *
 * New 7 worlds: PLAN, BUILD, TOOLS, SHIP, LEARN, INSPIRE, MONETIZE.
 * =================================================================== */

import { BookOpen, ChartNoAxesCombined, CloudUpload, Code2, PanelsTopLeft, Sparkles, Wrench } from "lucide-react";

export const V2_WORLDS = [
  {
    id: "plan",
    eyebrow: "01 / PLAN",
    title: { en: "Plan & Design", zhCN: "规划与设计", sw: "Panga" },
    short: {
      en: "Plan products, prototype ideas and design better interfaces.",
      zhCN: "规划产品、制作原型并设计更好的界面。",
      sw: "Panga bidhaa na michoro ya awali.",
    },
    description: {
      en: "Everything before serious coding begins: planning, flows, wireframes, prototypes, design systems and assets.",
      zhCN: "正式编码前的一切：规划、流程、线框图、原型、设计系统与素材。",
      sw: "Kupanga, michoro ya awali, mifumo ya muundo na rasilimali.",
    },
    sectionIntro: {
      en: "Use this section before you start coding. Find tools for product planning, wireframes, UI/UX design, prototypes, design systems, icons, fonts and visual assets.",
      zhCN: "在开始编码之前使用这个板块。这里可以找到产品规划、线框图、UI/UX 设计、原型、设计系统、图标、字体和视觉素材工具。",
    },
    cta: { en: "Explore Planning", zhCN: "探索规划", sw: "Chunguza Plan" },
    icon: PanelsTopLeft,
    accent: "#38bdf8",
    href: "/code?view=plan",
    intentPresets: [
      { en: "Wireframes", zhCN: "线框图", sw: "Wireframes" },
      { en: "Design systems", zhCN: "设计系统", sw: "Mifumo ya muundo" },
      { en: "Icons", zhCN: "图标", sw: "Ikoni" },
      { en: "Fonts", zhCN: "字体", sw: "Fonti" },
      { en: "Colors", zhCN: "配色", sw: "Rangi" },
    ],
  },
  {
    id: "build",
    eyebrow: "02 / BUILD",
    title: { en: 'Code Snippets', zhCN: "代码片段", sw: "Code Snippets" },
    short: {
      en: "Components, patterns and ready-to-use code.",
      zhCN: "组件、开发模式与可直接使用的代码。",
      sw: "Mifano, muundo na UI ya kutoa nakala",
    },
    description: {
      en: "Production UI patterns, components, and snippets you can copy, adapt, and ship.",
      zhCN: "适合真实项目的 UI 模式、组件与代码片段，可直接复制、改造与上线。",
      sw: "Mifano ya UI wa utamaduni, vipengele, na vitambulisho vya kutoa nakala, kurekebisha, na kutoa.",
    },
    sectionIntro: {
      en: "Use this section when you are ready to build. Find reusable code, components, UI libraries, animations, charts and development patterns for modern web projects.",
      zhCN: "当你准备开始开发时使用这个板块。这里可以找到可复用代码、组件、UI 库、动画、图表和现代 Web 开发模式。",
    },
    cta: { en: "Explore Snippets", zhCN: "查看代码", sw: "Chunguza Snippets" },
    icon: Code2,
    accent: "#06b6d4",
    href: "/code?view=build",
    intentPresets: [
      { en: "Hero patterns", zhCN: "Hero 模式", sw: "Mifano ya Hero" },
      { en: "Cards", zhCN: "卡片", sw: "Kadi" },
      { en: "Buttons", zhCN: "按钮", sw: "Vifunguo" },
      { en: "Modals", zhCN: "弹窗", sw: "Madirisha" },
      { en: "Mobile UI", zhCN: "移动端 UI", sw: "UI ya Simu" },
    ],
  },
  {
    id: "tools",
    eyebrow: "03 / TOOLS",
    title: { en: 'Developer Tools', zhCN: "开发者工具", sw: "Zana" },
    short: {
      en: "Tools and services for better development.",
      zhCN: "提升开发效率的工具与服务。",
      sw: "Zana bora za wasanii wa programu",
    },
    description: {
      en: "Everything developers use to build, test, debug and ship.",
      zhCN: "开发、测试、调试和发布所需的一切工具。",
      sw: "IDE, usanii wa AI, usajili wa toleo, muundo, upimaji, nyaraka, ufuatiliaji, na mirror: zilizochaguliwa kwa jua.",
    },
    sectionIntro: {
      en: "Your complete developer toolbox. Find AI coding tools, IDEs, Git platforms, API tools, databases, testing, debugging, DevOps and China-friendly alternatives.",
      zhCN: "你的开发者工具箱。查找 AI 编程工具、IDE、Git 平台、API 工具、数据库、测试、调试、DevOps 以及中国大陆友好的替代方案。",
    },
    cta: { en: "Browse Tools", zhCN: "浏览工具", sw: "Chagua Zana" },
    icon: Wrench,
    accent: "#8b5cf6",
    href: "/code?view=tools",
    intentPresets: [
      { en: "AI Coding", zhCN: "AI 编码", sw: "Usanii AI" },
      { en: "VS Code / IDE", zhCN: "编辑器", sw: "Vihariri" },
      { en: "Git hosting", zhCN: "Git 托管", sw: "Usajili wa Git" },
      { en: "Design", zhCN: "设计", sw: "Muundo" },
      { en: "China mirrors", zhCN: "国内镜像", sw: "Mirror vya China" },
    ],
  },
  {
    id: "ship",
    eyebrow: "04 / SHIP",
    title: { en: 'Hosting & Deployment', zhCN: "托管与部署", sw: "Toa" },
    short: {
      en: "Domains, hosting, cloud and production.",
      zhCN: "域名、托管、云服务与生产环境。",
      sw: "Kutoa, ujenzi, majina ya tovuti na utamaduni",
    },
    description: {
      en: "Ship your project with confidence.",
      zhCN: "将项目自信地部署到生产环境。",
      sw: "Jukwaa la ujenzi, kutoa tovuti, majina ya tovuti na DNS, backend na utaratibu wa uzalishaji.",
    },
    sectionIntro: {
      en: "Use this section when your project is ready to go online. Find hosting, cloud platforms, domains, DNS, CDN, databases, storage and Mainland China deployment options.",
      zhCN: "当你的项目准备上线时使用这个板块。这里可以找到托管、云平台、域名、DNS、CDN、数据库、存储以及中国大陆部署方案。",
    },
    cta: { en: "Explore Hosting", zhCN: "探索托管", sw: "Chunguza Hosting" },
    icon: CloudUpload,
    accent: "#22c55e",
    href: "/code?view=ship",
    intentPresets: [
      { en: "Free hosting", zhCN: "免费托管", sw: "Ujenzi Bure" },
      { en: "Full-stack deploy", zhCN: "全栈上线", sw: "Kutoa Full-stack" },
      { en: "Domains + DNS", zhCN: "域名与 DNS", sw: "Majina + DNS" },
      { en: "Serverless backend", zhCN: "Serverless 后端", sw: "Backend isiyo na seva" },
      { en: "Production ops", zhCN: "生产运维", sw: "Uzalishaji Ops" },
    ],
  },
  {
    id: "learn",
    eyebrow: "05 / LEARN",
    title: { en: 'Developer Guides', zhCN: "开发者指南", sw: "Developer Guides" },
    short: {
      en: "Guides, tutorials, tips and references.",
      zhCN: "指南、教程、技巧与技术参考。",
      sw: "Maarifa ya usanii wa programu. Bure na habari za dondoo.",
    },
    description: {
      en: "Quick tips, guides, cheatsheets, references. Strictly developer content. No consumer tech news.",
      zhCN:
        "Quick Tip、完整指南、速查表、参考手册。严格开发者内容，不收录消费电子产品新闻或手机发布。",
      sw: "Vidokezo vya haraka, mwongozo, cheat sheets, na kumbukumbu. Maudhui tu ya usanii wa programu.",
    },
    sectionIntro: {
      en: "Use this section when you need to learn, understand or solve something. Find practical tutorials, guides, tips, references and developer knowledge.",
      zhCN: "当你需要学习、理解或解决开发问题时使用这个板块。这里提供实用教程、指南、技巧、参考资料和开发知识。",
    },
    cta: { en: "Read Guides", zhCN: "阅读指南", sw: "Soma Miongozo" },
    icon: BookOpen,
    accent: "#f59e0b",
    href: "/code?view=learn",
    intentPresets: [
      { en: "React", zhCN: "React", sw: "React" },
      { en: "Git", zhCN: "Git", sw: "Git" },
      { en: "DNS / Domains", zhCN: "DNS / 域名", sw: "DNS / Majina" },
      { en: "Performance", zhCN: "性能优化", sw: "Utendeaji" },
      { en: "Security", zhCN: "安全", sw: "Usalama" },
    ],
  },
  {
    id: "inspire",
    eyebrow: "06 / INSPIRE",
    title: { en: 'Website Inspiration', zhCN: "网站灵感", sw: "Website Inspiration" },
    short: {
      en: "Great websites, UI, motion and design ideas.",
      zhCN: "优秀网站、UI、动效与设计灵感。",
      sw: "Tovuti vya kushangaza, UI, na mifano ya simu",
    },
    description: {
      en: "Websites, UI patterns, motion, and mobile inspiration. Tag related patterns you can copy.",
      zhCN: "优质网站、UI 细节、动效与移动端参考，关联可直接复制的实现模式。",
      sw: "Tovuti, mifano ya UI, na mifano ya simu inayounga na vipengele vya kutoa nakala.",
    },
    sectionIntro: {
      en: "Use this section when you need ideas. Explore websites, landing pages, interfaces, motion, mobile experiences and global and Chinese design communities.",
      zhCN: "当你需要设计灵感时使用这个板块。探索优秀网站、落地页、界面、动效、移动体验以及全球和中国设计社区。",
    },
    cta: { en: "Get Inspired", zhCN: "寻找灵感", sw: "Pata Msukumo" },
    icon: Sparkles,
    accent: "#ec4899",
    href: "/code?view=inspire",
    intentPresets: [
      { en: "Marketing sites", zhCN: "营销官网", sw: "Tovuti za Masoko" },
      { en: "Dashboards", zhCN: "后台面板", sw: "Dashboards" },
      { en: "Motion", zhCN: "动效", sw: "Mienendo" },
      { en: "Onboarding", zhCN: "引导页", sw: "Utangulizi" },
      { en: "Portfolios", zhCN: "作品集", sw: "Mkusanyiko" },
    ],
  },
  {
    id: "monetize",
    eyebrow: "07 / GROW",
    title: { en: "Monetize & Grow", zhCN: "变现与增长", sw: "Kukuza" },
    short: {
      en: "Payments, SEO, analytics and ways to grow.",
      zhCN: "支付、SEO、数据分析与网站增长工具。",
      sw: "Malipo, matangazo, SEO, takwimu na ukuaji.",
    },
    description: {
      en: "Turn your website into a real product.",
      zhCN: "把你的网站变成真正的产品。",
      sw: "Geuza tovuti yako kuwa bidhaa halisi.",
    },
    sectionIntro: {
      en: "Use this section when you want to turn your website into a real product. Find payment tools, subscriptions, advertising, affiliate platforms, SEO, analytics and growth resources.",
      zhCN: "当你希望把网站变成真正的产品时使用这个板块。这里可以找到支付、订阅、广告、联盟营销、SEO、数据分析和增长工具。",
    },
    cta: { en: "Explore Growth", zhCN: "探索增长", sw: "Chunguza Growth" },
    icon: ChartNoAxesCombined,
    accent: "#f97316",
    href: "/code?view=monetize",
    intentPresets: [
      { en: "Payments", zhCN: "支付", sw: "Malipo" },
      { en: "SEO", zhCN: "SEO", sw: "SEO" },
      { en: "Analytics", zhCN: "数据分析", sw: "Takwimu" },
      { en: "Ads", zhCN: "广告", sw: "Matangazo" },
      { en: "Subscriptions", zhCN: "订阅", sw: "Usajili" },
    ],
  },
];

export const V2_WORLD_IDS = V2_WORLDS.map((w) => w.id);

export const V2_COMPAT_MAP = Object.freeze({
  code: "build",
  tips: "learn",
  hosting: "ship",
  domains: "ship",
  inspiration: "inspire",
  ui: "build",
  essentials: "tools",
  guides: "learn",
  design: "plan",
  planning: "plan",
  monetize: "monetize",
  growth: "monetize",
});

/**
 * Normalize a `view` param to a V2 world id, mapping old 8-view ids to
 * their new 7-world home. Returns `null` for homepage.
 */
export function normalizeWorldId(raw) {
  if (!raw) return null;
  const id = String(raw).trim().toLowerCase();
  if (V2_WORLD_IDS.includes(id)) return id;
  const mapped = V2_COMPAT_MAP[id];
  if (mapped) return mapped;
  return null;
}

/** Lookup helper for the new worlds, returns null if not a V2 world. */
export function getWorld(worldId) {
  return V2_WORLDS.find((w) => w.id === worldId) || null;
}

export default V2_WORLDS;
