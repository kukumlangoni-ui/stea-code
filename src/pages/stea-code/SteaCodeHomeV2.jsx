import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import './light-mode-fixes.css';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./sc-detail-actions-override.css";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Code2,
  Command,
  Copy,
  ExternalLink,
  Eye,
  Heart,
  Layers,
  Lock,
  Download,
  Package,
  Palette,
  Play,
  RotateCw,
  Maximize2,
  Search } from "lucide-react";
import { useSteaCodeI18n } from "../../components/stea-code/useSteaCodeI18n.js";
import { createPortal } from "react-dom";
import { useCloudflareAuth, getCloudflareLogoutUrl } from "../../hooks/useCloudflareAuth.js";
import SteaCodeMemberGate from "../../components/stea-code/SteaCodeMemberGate.jsx";
import NewsletterModal from "../../components/stea-code/NewsletterModal.jsx";
import SteaCodeProductSkeleton from "../../components/stea-code/SteaCodeProductSkeleton.jsx";
import PreviewErrorBoundary from "../../components/stea-code/PreviewErrorBoundary.jsx";
import SteaCodePurchasesPage from "./SteaCodePurchasesPage.jsx";
import SteaCodeNotFoundPage from "./SteaCodeNotFoundPage.jsx";
import {
  STEA_CODE_ACTION_TYPES,
  clearSteaCodePendingAction,
  getSteaCodePendingAction,
  makeFreeCodeAction,
  makePurchasesAction,
  setSteaCodePendingAction } from "../../services/steaCodeResumeAction.js";
import { startActivityTracking } from "../../services/userActivity.js";
import { fetchEntitlements } from "../../services/steaCodeEntitlements.js";
import {
  downloadSteaCodeSource,
  getSteaCodeCatalog,
  getSteaCodeProduct,
  getSteaCodeFreeProductContent,
  getSteaCodeProductAccess,
  getSteaCodeProductContent,
  getSteaCodeEbookContent,
  registerSteaCodeProductView,
  recordSteaCodeCopy,
  toggleSteaCodeProductLike,
  toggleSteaCodeFavorite,
  getSteaCodeFavorites,
} from "../../services/steaCodeCommerce.js";
import { copyImageToClipboard, downloadImageFile } from "../../utils/downloadImage.js";
import { trackUserEvent } from "../../services/analytics.js";
import SteaCodeFooter from "../../components/stea-code/SteaCodeFooter.jsx";
import SponsoredCard from "../../components/stea-code/SponsoredCard.jsx";
import SmartAdSlot from "../../components/stea-code/SmartAdSlot.jsx";
import IconGallery from "../../components/stea-code/IconGallery.jsx";
import SteaCodeBlogPage from "./blog/SteaCodeBlogPage.jsx";
import LatestFromBlog from "../../components/stea-code/LatestFromBlog.jsx";

import {
  CODE_PRODUCT_CATEGORIES,
  CODE_PRODUCT_TECH } from "../../data/stea-code/codeProducts.js";
import { V2_WORLDS } from "../../data/stea-code/v2Worlds.js";
import { TABS, DEFAULT_TAB, SUBCATEGORIES } from "../../data/stea-code/tabs.js";
import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import { useTilt } from "../../hooks/useTilt.js";

const SteaCodeLiquidHeroChunk = React.lazy(() =>
  import("../../components/SteaCodeLiquidHero.jsx")
);
const SteaCodeProductLivePreviewChunk = React.lazy(() =>
  import("../../components/stea-code/SteaCodeProductLivePreview.jsx")
);
const BookProductPreviewChunk = React.lazy(() =>
  import("../../components/stea-code/BookProductPreview.jsx")
);

const LazyLivePreview = React.forwardRef(function LazyLivePreview(props, ref) {
  return (
    <React.Suspense fallback={<div className="sc-preview-chunk-fallback" aria-hidden="true" />}>
      <SteaCodeProductLivePreviewChunk ref={ref} {...props} />
    </React.Suspense>
  );
});

function LazyBookPreview(props) {
  return (
    <React.Suspense fallback={<div className="sc-preview-chunk-fallback" aria-hidden="true" />}>
      <BookProductPreviewChunk {...props} />
    </React.Suspense>
  );
}

function LazyLiquidHero(props) {
  return (
    <React.Suspense fallback={null}>
      <SteaCodeLiquidHeroChunk {...props} />
    </React.Suspense>
  );
}

// ---------------------------------------------------------------------------
// Hardcoded "steacode services" banner — always the first tile of the homepage
// grid. It is deliberately NOT a database product. The Admin-managed product
// that used to stand in for it (slug below) is filtered out of the grid so the
// banner is the only "steacode services" card; that product's detail page and
// live preview remain reachable by direct URL.
// ---------------------------------------------------------------------------
const SERVICE_CARD_PRODUCT_SLUG = "premium-website-hero";

const SkeletonCard = () => (
  <div className="sc-product-card" style={{ pointerEvents: 'none', animation: 'pulse 1.5s infinite' }}>
    <div style={{ width: '100%', height: '220px', backgroundColor: '#f0f0f0', borderRadius: '16px 16px 0 0' }}></div>
    <div style={{ padding: '20px' }}>
      <div style={{ width: '40%', height: '12px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '12px' }}></div>
      <div style={{ width: '80%', height: '20px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '8px' }}></div>
      <div style={{ width: '30%', height: '16px', backgroundColor: '#e5e5e5', borderRadius: '4px' }}></div>
    </div>
  </div>
);

    const SkeletonGrid = () => (
      <div className="sc-skeleton-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="sc-skeleton-card">
            <div className="sc-skeleton-image"></div>
            <div className="sc-skeleton-content">
              <div className="sc-skeleton-title"></div>
              <div className="sc-skeleton-subtitle"></div>
            </div>
          </div>
        ))}
      </div>
    );
    
function Reveal({ children, delay = 0, as: Tag = "div", className = "", ...rest }) {
  const [ref, visible] = useScrollReveal();
  return (
    <Tag
      ref={ref}
      className={`sc-reveal ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function TiltCard({ children }) {
  const ref = useTilt({ maxTilt: 5 });
  return <div ref={ref} className="sc-tilt-card">{children}</div>;
}

const COPY = {
  builtFor: { en: "BUILT FOR DEVELOPERS", zhCN: "为开发者打造" },
  sub: {
    en: "Explore code, tools, guides and inspiration for modern developers.",
    zhCN: "探索面向现代开发者的代码、工具、指南与灵感。" },
  search: { en: "Search code, tools, hosting, guides, design…", zhCN: "搜索代码、工具、托管、指南、设计…" },
  exploreCode: { en: "Explore Code", zhCN: "探索代码" },
  browseFree: { en: "Explore Free", zhCN: "探索免费资源" },
  browsePremium: { en: "Browse Premium", zhCN: "浏览高级代码" },
  marketplaceSub: { en: "Free code products to ship your ideas faster.", zhCN: "免费代码产品，帮助你更快发布创意。" },
  viewAll: { en: "View all products", zhCN: "查看全部产品" },
  trendingTitle: { en: "Trending this week", zhCN: "本周趋势" },
  trendingSub: { en: "Popular resources worth checking out.", zhCN: "值得探索的热门开发者资源。" },
  freeTitle: { en: "Free to build with.", zhCN: "免费开始构建。" },
  freeSub: { en: "High-quality resources you can use in your next project today.", zhCN: "高质量开发资源，今天即可在你的下一个项目中直接使用。" },
  exploreAllFree: { en: "Explore all free resources →", zhCN: "探索全部免费资源 →" },
  browseCategoryTitle: { en: "Browse by category", zhCN: "按分类浏览" },
  browseCategorySub: { en: "Explore components, effects, animations and kits organized by type.", zhCN: "按类型探索组件、特效、动画和套件。" },
  freeToolsTitle: { en: "Free developer tools", zhCN: "免费开发者工具" },
  freeToolsSub: { en: "Instant, client-side tools built to boost your development workflow.", zhCN: "即开即用、纯客户端运行的开发者效率工具。" },
  viewAllTools: { en: "View all tools →", zhCN: "查看全部工具 →" },
  premiumTitle: { en: "Premium picks", zhCN: "精选高级代码" },
  premiumSub: { en: "High-tier components and starter kits crafted for production.", zhCN: "专为生产环境打造的高阶组件与开箱即用套件。" },
  viewFree: { en: "View all free code", zhCN: "查看全部免费代码" },
  packs: { en: "Premium Packs", zhCN: "高级组合包" },
  packsSub: { en: "Bundle architecture is ready. Real packs can be published from Admin later.", zhCN: "组合包架构已准备好，后续可从后台发布真实组合包。" },
  allFrameworks: { en: "All Frameworks", zhCN: "全部技术" },
  newest: { en: "Newest", zhCN: "最新" },
  all: { en: "All", zhCN: "全部" },
  free: { en: "Free", zhCN: "免费" },
  premium: { en: "Premium", zhCN: "高级" },
  getCode: { en: "Get Code", zhCN: "获取代码" },
  unlockFullCode: { en: "Unlock Full Code", zhCN: "解锁完整代码" },
  oneTime: { en: "One-time purchase · Instant access", zhCN: "一次购买 · 即时访问" },
  locked: { en: "Sign in with your email to copy the full source.", zhCN: "使用邮箱登录即可复制完整源码。" },
  signInToContinue: { en: "Please sign in to continue.", zhCN: "请先登录以继续。" },
  included: { en: "What's Included", zhCN: "包含内容" },
  howTo: { en: "How to Use", zhCN: "如何使用" },
  noProducts: { en: "No products here yet.", zhCN: "这里暂时没有产品。" },
  exploreAnother: { en: "Explore another category.", zhCN: "试试其他分类。" },
  products: { en: "products", zhCN: "个产品" },
  explorePack: { en: "Explore Pack", zhCN: "查看组合包" },
  account: { en: "Account", zhCN: "账户" },
  backToHome: { en: "← Back to Storefront", zhCN: "← 返回主页" } };

const NAV_LINKS = [
  { id: "explore", label: { en: "Explore", zhCN: "探索" }, mode: "explore", filter: { category: "All", pricing: "All" } },
  { id: "components", label: { en: "Components", zhCN: "组件" }, mode: "explore", filter: { category: "Components", pricing: "All" } },
  { id: "icons", label: { en: "Icons", zhCN: "图标" }, tab: "icons" },
  { id: "tools", label: { en: "Tools", zhCN: "工具" }, href: "/tools" },
  { id: "library", label: { en: "Library", zhCN: "开发库" }, href: "/library" },
  { id: "free", label: { en: "Free", zhCN: "免费" }, mode: "explore", filter: { pricing: "Free" } },
];

const CATEGORY_LABELS = {
  All: { en: "All", zhCN: "全部" },
  "Text Animations": { en: "Text Animations", zhCN: "文字动画" },
  Animations: { en: "Animations", zhCN: "动画" },
  Buttons: { en: "Buttons", zhCN: "按钮" },
  Backgrounds: { en: "Backgrounds", zhCN: "背景" },
  Cards: { en: "Cards", zhCN: "卡片" },
  Heroes: { en: "Heroes", zhCN: "Hero 区块" },
  Navigation: { en: "Navigation", zhCN: "导航" },
  Forms: { en: "Forms", zhCN: "表单" },
  Loaders: { en: "Loaders", zhCN: "加载动画" },
  Commerce: { en: "Commerce", zhCN: "电商" },
  "Page Transitions": { en: "Page Transitions", zhCN: "页面转场" },
  Components: { en: "Components", zhCN: "组件" },
  Portfolio: { en: "Portfolio", zhCN: "作品集" },
  "Toggle Switches": { en: "Toggle Switches", zhCN: "切换开关" },
  "Inputs": { en: "Inputs", zhCN: "输入框" },
  Notes: { en: "Notes", zhCN: "笔记" },
  "Cheat Sheets": { en: "Cheat Sheets & Notes", zhCN: "速查表" } };

// Book-backed products (eBooks and Cheat Sheets & Notes) share one authored-HTML
// pipeline: the 3D cover card preview, the detail modal and the reader route.
// `tab === "library"` is the legacy signal, kept so a stale cached catalog
// response (which may predate the productType column) still renders right.
const isBookProduct = (p) =>
  p?.productType === "ebook" ||
  p?.productType === "cheatsheet" ||
  p?.productType === "note" ||
  p?.tab === "library";

// The pill a product belongs to. Cheat Sheets & Notes are categorised by type rather
// than by whatever `category` an older record happens to carry.
const effectiveCategory = (p) =>
  p?.productType === "cheatsheet"
    ? "Cheat Sheets"
    : p?.productType === "note"
    ? "Notes"
    : p?.category;

const HOMEPAGE_TOOLS = [
  {
    id: "gradient-generator",
    path: "/tools/gradient-generator",
    title: { en: "Gradient Generator", zhCN: "渐变生成器" },
    desc: {
      en: "Linear & radial CSS gradient designer with presets and instant code export.",
      zhCN: "线性与径向 CSS 渐变设计器，支持预设与一键复制代码。"
    },
    badge: "CSS Tool",
    gradient: "linear-gradient(135deg, #f5a623, #ff5500)",
    icon: Palette,
  },
  {
    id: "box-shadow-generator",
    path: "/tools/box-shadow-generator",
    title: { en: "Box Shadow Generator", zhCN: "阴影生成器" },
    desc: {
      en: "Smooth multi-parameter shadow generator with blur, spread, and inset controls.",
      zhCN: "多参数阴影生成器，支持偏移、模糊、扩散和内阴影调节。"
    },
    badge: "CSS Tool",
    gradient: "radial-gradient(circle, rgba(245,166,35,0.35) 0%, rgba(10,14,24,0.8) 70%)",
    icon: Layers,
  },
  {
    id: "json-formatter",
    path: "/tools/json-formatter",
    title: { en: "JSON Formatter", zhCN: "JSON 格式化工具" },
    desc: {
      en: "Format, minify, and validate JSON payloads with syntax error detection.",
      zhCN: "格式化、压缩并校验 JSON 数据，提供清晰的语法错误提示。"
    },
    badge: "Data Tool",
    gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    icon: Code2,
  },
];

function label(product, key, zhKey) {
  return { en: product[key], zhCN: product[zhKey] };
}

function formatPrice(product) {
  if (product.pricingType === "free") return "Free";
  return `${product.currency === "USD" ? "$" : ""}${Number(product.price || 0).toFixed(2)}`;
}

// 100% free pivot — the storefront no longer sells anything. Every product is
// presented (and accessed) as free, regardless of the legacy pricing columns
// still stored in D1.
function asFreeProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.map((product) =>
    product ? { ...product, pricingType: "free", price: 0 } : product
  );
}


const STEA_MARKETPLACE_FILLER_TEMPLATES = [
  ["Animated Gradient Text", "渐变文字动画", "Text Effects", ["React", "Motion"], "premium", 4.99],
  ["Split Text Reveal", "分割文字揭示", "Text Effects", ["JavaScript", "GSAP"], "premium", 5.99],
  ["Typing Cursor Effect", "打字光标效果", "Text Effects", ["HTML/CSS", "JavaScript"], "free", 0],
  ["Scramble Text Effect", "文字扰动效果", "Text Effects", ["JavaScript"], "premium", 3.99],

  ["Magnetic Button", "磁吸按钮", "Buttons", ["React", "Motion"], "premium", 4.99],
  ["Liquid Hover Button", "液态悬停按钮", "Buttons", ["HTML/CSS"], "premium", 3.99],
  ["Animated Submit Button", "动画提交按钮", "Buttons", ["React"], "free", 0],
  ["Success Button Transition", "成功按钮转场", "Buttons", ["React", "Tailwind CSS"], "premium", 4.99],

  ["Aurora Background", "极光背景", "Backgrounds", ["HTML/CSS"], "premium", 5.99],
  ["Interactive Grid Background", "交互网格背景", "Backgrounds", ["JavaScript"], "free", 0],
  ["Mesh Gradient Background", "网格渐变背景", "Backgrounds", ["HTML/CSS"], "free", 0],
  ["Floating Particles", "浮动粒子背景", "Backgrounds", ["JavaScript"], "premium", 4.99],

  ["Glass Product Card", "玻璃产品卡片", "Cards", ["React", "Tailwind CSS"], "free", 0],
  ["3D Tilt Card", "3D 倾斜卡片", "Cards", ["JavaScript"], "premium", 5.99],
  ["Pricing Card Hover", "价格卡片悬停", "Cards", ["HTML/CSS"], "premium", 3.99],
  ["Expandable Profile Card", "展开式资料卡", "Cards", ["React"], "free", 0],

  ["SaaS Hero Motion", "SaaS Hero 动效", "Heroes", ["React", "Motion"], "premium", 7.99],
  ["Gradient Hero Section", "渐变 Hero 区块", "Heroes", ["HTML/CSS"], "free", 0],
  ["Product Launch Hero", "产品发布 Hero", "Heroes", ["React", "Tailwind CSS"], "premium", 8.99],
  ["Minimal Developer Hero", "极简开发者 Hero", "Heroes", ["React"], "free", 0],

  ["Floating Navbar", "悬浮导航栏", "Navigation", ["React", "Tailwind CSS"], "premium", 4.99],
  ["Animated Mobile Menu", "动画移动菜单", "Navigation", ["JavaScript"], "free", 0],
  ["Glass Header", "玻璃导航栏", "Navigation", ["HTML/CSS"], "free", 0],
  ["Mega Menu Motion", "Mega Menu 动效", "Navigation", ["React", "Motion"], "premium", 6.99],

  ["Animated Login Form", "动画登录表单", "Forms", ["React"], "premium", 4.99],
  ["Floating Label Form", "浮动标签表单", "Forms", ["HTML/CSS"], "free", 0],
  ["OTP Input Animation", "OTP 输入动画", "Forms", ["React"], "premium", 3.99],
  ["Checkout Form UI", "结账表单 UI", "Forms", ["React", "Tailwind CSS"], "premium", 6.99],

  ["Orbit Loader", "轨道加载动画", "Loaders", ["HTML/CSS"], "free", 0],
  ["Liquid Progress Loader", "液态进度加载器", "Loaders", ["HTML/CSS"], "premium", 3.99],
  ["Skeleton Loading Cards", "骨架屏加载卡片", "Loaders", ["React"], "free", 0],
  ["Brand Splash Loader", "品牌启动加载器", "Loaders", ["React"], "premium", 4.99],

  ["Add to Cart Motion", "加入购物车动画", "Commerce", ["React", "Motion"], "premium", 5.99],
  ["Payment Success UI", "支付成功 UI", "Commerce", ["React"], "premium", 5.99],
  ["Quantity Selector", "商品数量选择器", "Commerce", ["React"], "free", 0],
  ["Checkout Progress Steps", "结账进度步骤", "Commerce", ["React", "Tailwind CSS"], "premium", 6.99],

  ["Smooth Page Reveal", "平滑页面揭示", "Page Transitions", ["GSAP"], "premium", 6.99],
  ["Fade Route Transition", "淡入路由转场", "Page Transitions", ["React", "Motion"], "free", 0],
  ["Curtain Page Transition", "幕布页面转场", "Page Transitions", ["GSAP"], "premium", 7.99],
  ["Slide Page Transition", "滑动页面转场", "Page Transitions", ["HTML/CSS", "JavaScript"], "premium", 4.99],

  ["Animated Notification", "动画通知组件", "Cards", ["React"], "free", 0],
  ["Copy Success Interaction", "复制成功交互", "Buttons", ["React"], "free", 0],
  ["Floating Action Menu", "悬浮操作菜单", "Navigation", ["React"], "premium", 4.99],
  ["Animated Pricing Toggle", "动画价格切换", "Buttons", ["React", "Motion"], "premium", 4.99],

  ["Dashboard Stat Cards", "仪表盘统计卡片", "Cards", ["React", "Tailwind CSS"], "premium", 6.99],
  ["Animated Search Bar", "动画搜索栏", "Forms", ["React"], "free", 0],
  ["Scroll Progress Indicator", "滚动进度指示器", "Navigation", ["JavaScript"], "free", 0],
  ["Interactive Spotlight", "交互聚光效果", "Backgrounds", ["JavaScript"], "premium", 4.99],
];

const STEA_MARKETPLACE_FILLERS = STEA_MARKETPLACE_FILLER_TEMPLATES.map(
  ([titleEn, titleZh, category, frameworks, pricingType, price], index) => ({
    id: `stea-demo-product-${index + 1}`,
    slug: `stea-demo-product-${index + 1}`,
    titleEn,
    titleZh,
    shortDescriptionEn: `${titleEn} for modern web projects.`,
    shortDescriptionZh: `${titleZh}，适用于现代 Web 项目。`,
    category,
    tags: [category, ...(frameworks || [])],
    frameworks,
    languages: frameworks,
    pricingType,
    price,
    currency: "USD",
    status: "published",
    featured: false,
    isDemoFallback: true,
    sourceCode: undefined,
    createdAt: `2026-08-${String((index % 20) + 1).padStart(2, "0")}`
  })
);

function SteaCodeUserAvatar({ user, email, size = 36 }) {
  const initial = String(email || "U").charAt(0).toUpperCase() || "U";
  const photoURL = user?.photoURL;
  const [imgError, setImgError] = useState(false);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className="sc-avatar-img sc-account-avatar-img"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
      />
    );
  }

  return <span className="sc-avatar-initial">{initial}</span>;
}

export default function SteaCodeHomeV2({ user, authLoading, onGoWorld, onOpenSearch }) {
  const { tLocal, uiLocale, setUiLocale } = useSteaCodeI18n();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("home");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [pricing, setPricing] = useState("All");
  const [framework, setFramework] = useState("All Frameworks");
  const [isGridSwitching, setIsGridSwitching] = useState(false);
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const viewParam = searchParams.get("view");

  const effectiveView = useMemo(() => {
    if (location.pathname === "/library") return "purchases";
    if (viewParam === "purchases" || viewParam === "library") return "purchases";
    // payment-return (old purchased-workspace code-view) removed — users see the product page with copy buttons instead
    return viewMode;
  }, [location.pathname, viewParam, viewMode]);

  // ---------------------------------------------------------------------------
  // Tab / category / subcategory ⇄ query string
  //
  // A filtered view has to be shareable, so the three filter values live in the
  // URL: /?tab=library&category=Ebooks. Defaults (the "components" tab, "All")
  // are omitted so plain steacode.com/ stays clean.
  //
  // Everything is validated against TABS before it reaches state — a hand-edited
  // or stale link (?tab=nope) falls back to the default instead of rendering an
  // empty grid, because `TABS[activeTab].categories` would throw on an unknown
  // tab.
  const filterParams = useMemo(() => {
    // Clean, crawlable routes (/templates, /kits, /icons) imply their tab even
    // when there is no ?tab= param. An explicit param always wins. "/layouts" is
    // kept as an alias → same tab, so an unredirected old link still filters
    // correctly (App.jsx also 301-redirects /layouts → /templates).
    const pathTab =
      {
        "/components": "components",
        "/templates": "layouts",
        "/layouts": "layouts",
        "/kits": "kits",
        "/icons": "icons",
      }[location.pathname.replace(/\/+$/, "") || "/"];
    const tabParam = searchParams.get("tab");
    const tab = tabParam && TABS[tabParam]
      ? tabParam
      : pathTab && TABS[pathTab]
        ? pathTab
        : DEFAULT_TAB;
    const catParam = searchParams.get("category");
    const catIds = TABS[tab].categories.map((c) => c.id);
    const cat = catParam && catIds.includes(catParam) ? catParam : "All";
    const subParam = searchParams.get("sub");
    const subs = SUBCATEGORIES[cat] || [];
    const sub = subParam && subs.includes(subParam) ? subParam : "All";
    return { tab, cat, sub };
  }, [searchParams, location.pathname]);

  const filterSignature = `${filterParams.tab}|${filterParams.cat}|${filterParams.sub}`;

  // Tab id → clean, crawlable route. Clicking a nav tab lands on a real URL
  // (good for SEO + shareability); any tab without a clean route falls back
  // to the query-param form below. "layouts" renders as /templates.
  const TAB_CLEAN_PATH = {
    components: "/components",
    layouts: "/templates",
    kits: "/kits",
    library: "/library",
    icons: "/icons",
  };

  // Write the filters into the URL. Goes through the router rather than
  // window.history so `location` — which effectiveView and the product modal
  // routes depend on — stays in sync. Existing params are preserved.
  const syncFilterUrl = useCallback(
    ({ tab: nextTab, cat: nextCat, sub: nextSub }) => {
      const params = new URLSearchParams(location.search);
      const put = (key, value, fallback) => {
        if (value && value !== fallback) params.set(key, value);
        else params.delete(key);
      };
      put("tab", nextTab, DEFAULT_TAB);
      put("category", nextCat, "All");
      put("sub", nextSub, "All");

      const nextSearch = params.toString();
      if (nextSearch === location.search.replace(/^\?/, "")) return; // no-op → no history entry
      navigate(nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname);
    },
    [location.pathname, location.search, navigate]
  );

  const [selected, setSelected] = useState(null);
  const [unlockModalProduct, setUnlockModalProduct] = useState(null);
  // View dedupe persists for the whole browser session (sessionStorage) so a
  // refresh does not re-count the same product view.
  const viewedProductsRef = useRef(readViewedSet());

  // Open unlock modal when the sign-in resume flow detects a premium product
  // the user doesn't have access to (fired from SteaCodeMemberGate resume logic).
  // The event fires after sign-in inside an already-open product modal,
  // so we use the currently selected product.
  useEffect(() => {
    const handler = (e) => {
      const productId = e.detail?.productId;
      if (!productId) return;
      if (selected && getProductIdentity(selected) === productId) {
        setUnlockModalProduct(selected);
      }
    };
    window.addEventListener("stea:open-unlock", handler);
    return () => window.removeEventListener("stea:open-unlock", handler);
  }, [selected]);

  // Category/filter cross-fade: fade out → swap → fade in
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    setIsGridSwitching(true);
    const t = setTimeout(() => setIsGridSwitching(false), 150);
    return () => clearTimeout(t);
  }, [activeTab, category, pricing, framework]);

  // Track product views — fire once per product per session (sessionStorage)
  useEffect(() => {
    if (!selected) return;
    const productId = getProductIdentity(selected);
    if (!productId || viewedProductsRef.current.has(productId)) return;
    viewedProductsRef.current.add(productId);
    writeViewedSet(viewedProductsRef.current);
    registerSteaCodeProductView(productId).catch(() => {
      /* fire-and-forget */
    });
  }, [selected]);

  // Page-level toast (for favorites, etc. — outside ProductDetail)
  const showPageToast = useCallback((type, message) => {
    setPageToast({ type, message });
    if (pageToastTimerRef.current) clearTimeout(pageToastTimerRef.current);
    pageToastTimerRef.current = setTimeout(() => setPageToast(null), 2600);
  }, []);

  // Favorites — loaded when user is signed in
  const [favorites, setFavorites] = useState(() => new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.email) {
      setFavorites(new Set());
      return;
    }
    setFavoritesLoading(true);
    try {
      const data = await getSteaCodeFavorites();
      const ids = new Set((data?.favorites || []).map((f) => String(f.productId)));
      setFavorites(ids);
    } catch (err) {
      if (err?.code !== "AUTH_REQUIRED") {
        console.warn("[favorites] load failed:", err);
      }
      setFavorites(new Set());
    } finally {
      setFavoritesLoading(false);
    }
  }, [user?.email]);

  // Reload favorites when the Access session changes
  useEffect(() => {
    if (user?.email) {
      loadFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [user?.email, loadFavorites]);

  const handleToggleFavorite = useCallback(async (productId) => {
    const cleanId = String(productId || "").trim();
    if (!cleanId) return;

    if (!user?.email) {
      // Not signed in — open member gate
      setMemberGateOpen(true);
      return;
    }

    const isCurrentlyFav = favorites.has(cleanId);

    // Optimistic update
    const next = new Set(favorites);
    if (isCurrentlyFav) {
      next.delete(cleanId);
    } else {
      next.add(cleanId);
    }
    setFavorites(next);

    try {
      const result = await toggleSteaCodeFavorite(cleanId);
      // Server is source of truth
      if (result?.favorited) {
        setFavorites((prev) => { const s = new Set(prev); s.add(cleanId); return s; });
      } else {
        setFavorites((prev) => { const s = new Set(prev); s.delete(cleanId); return s; });
      }
    } catch (err) {
      // Revert on error
      setFavorites((prev) => {
        const s = new Set(prev);
        if (isCurrentlyFav) s.add(cleanId); else s.delete(cleanId);
        return s;
      });
      console.warn("[favorites] toggle failed:", err);
      const msg = err?.status === 401
        ? 'Please sign in to favorite'
        : (err?.message || 'Could not update favorites');
      showPageToast('error', msg);
    }
  }, [favorites, user?.email]);

  const [liveCatalog, setLiveCatalog] = useState(null);
  const [catalogNextOffset, setCatalogNextOffset] = useState(0);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [isFallbackCatalog, setIsFallbackCatalog] = useState(false);
  // Incrementing this triggers a fresh catalog load (used by the error-state Retry).
  const [catalogReloadToken, setCatalogReloadToken] = useState(0);
  // When true, the next catalog load bypasses the localStorage client cache
  // (forceFresh). Set by the "stea-catalog-changed" window event, which the
  // admin panel dispatches after a product delete/update.
  const forceNextCatalogLoadRef = useRef(false);
  useEffect(() => {
    const handler = () => {
      forceNextCatalogLoadRef.current = true;
      setCatalogReloadToken((t) => t + 1);
    };
    window.addEventListener("stea-catalog-changed", handler);
    return () => window.removeEventListener("stea-catalog-changed", handler);
  }, []);
  const [isLoading, setIsLoading] = useState(true);
  // Storefront-wide product total (published + homepageVisible), independent of
  // the current tab/category filters — drives the hero counter. `animatedTotal`
  // is the same value shown via a count-up animation on load.
  const [globalCatalogTotal, setGlobalCatalogTotal] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // Count-up animation: 0 → globalCatalogTotal over ~1.5s at 60fps.
  useEffect(() => {
    if (globalCatalogTotal === 0) return;

    let current = 0;
    const end = globalCatalogTotal;
    const duration = 1500; // ms
    const stepMs = 16; // ~60fps
    const increment = end / (duration / stepMs);

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setAnimatedTotal(end);
        clearInterval(timer);
      } else {
        setAnimatedTotal(Math.floor(current));
      }
    }, stepMs);

    return () => clearInterval(timer);
  }, [globalCatalogTotal]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = selected ? "hidden" : previousOverflow;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const [memberGateOpen, setMemberGateOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [memberGateAction, setMemberGateAction] = useState(null);

  useEffect(() => {
    const handleOpenAuth = () => setMemberGateOpen(true);
    window.addEventListener("open-auth", handleOpenAuth);
    // Deep link from the marketing pages (e.g. /start-project "Sign in"):
    // /?signin=1 lands on the storefront with the gate already open.
    if (new URLSearchParams(window.location.search).get("signin") === "1") {
      setMemberGateOpen(true);
    }
    return () => window.removeEventListener("open-auth", handleOpenAuth);
  }, []);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarSpin, setAvatarSpin] = useState("idle"); // 'idle' | 'left' | 'right'
  const [goUnlimitedPulse, setGoUnlimitedPulse] = useState(false);
  const [goUnlimitedToast, setGoUnlimitedToast] = useState(false);
  const goUnlimitedBtnRef = useRef(null);
  const goUnlimitedSweepTimerRef = useRef(null);
  const goUnlimitedSweepActiveRef = useRef(false);
  const goUnlimitedUserInteractedRef = useRef(false);
  const [localAuthUser, setLocalAuthUser] = useState(() => user || null);

  useEffect(() => {
    if (user !== undefined) {
      setLocalAuthUser(user);
    }
  }, [user]);

  // Header CTA autoplay sweep — glossy gradient animation
  // Starts at 3000ms to stay out of phase with modal sweeps (600ms / 1900ms)
  useEffect(() => {
    const btn = goUnlimitedBtnRef.current;
    if (!btn) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const doSweep = () => {
      if (goUnlimitedUserInteractedRef.current) return;
      btn.classList.add("is-sweeping");
      goUnlimitedSweepActiveRef.current = true;
      setTimeout(() => {
        btn.classList.remove("is-sweeping");
        goUnlimitedSweepActiveRef.current = false;
      }, 900);
    };

    const initialDelay = setTimeout(() => {
      doSweep();
      goUnlimitedSweepTimerRef.current = setInterval(() => {
        if (!goUnlimitedUserInteractedRef.current) doSweep();
      }, 2600);
    }, 3000);

    const stopAutoplay = () => {
      if (goUnlimitedUserInteractedRef.current) return;
      goUnlimitedUserInteractedRef.current = true;
      if (goUnlimitedSweepTimerRef.current) {
        clearInterval(goUnlimitedSweepTimerRef.current);
        goUnlimitedSweepTimerRef.current = null;
      }
      if (goUnlimitedSweepActiveRef.current) {
        btn.classList.remove("is-sweeping");
        goUnlimitedSweepActiveRef.current = false;
      }
    };

    btn.addEventListener("pointerenter", stopAutoplay, { once: true });
    btn.addEventListener("pointerdown", stopAutoplay, { once: true });
    btn.addEventListener("focus", stopAutoplay, { once: true });
    btn.addEventListener("keydown", stopAutoplay, { once: true });

    return () => {
      clearTimeout(initialDelay);
      if (goUnlimitedSweepTimerRef.current) {
        clearInterval(goUnlimitedSweepTimerRef.current);
        goUnlimitedSweepTimerRef.current = null;
      }
      btn.removeEventListener("pointerenter", stopAutoplay);
      btn.removeEventListener("pointerdown", stopAutoplay);
      btn.removeEventListener("focus", stopAutoplay);
      btn.removeEventListener("keydown", stopAutoplay);
    };
  }, []);

  // Start/stop user activity tracking along with auth state
  useEffect(() => {
    if (!localAuthUser) return undefined;
    const stopTracking = startActivityTracking(localAuthUser);
    return () => stopTracking();
  }, [localAuthUser]);

  const effectiveUser = user !== undefined ? user : localAuthUser;
  const signedInEmail = (effectiveUser?.email || "").trim();
  const ADMIN_EMAILS = ["stea.africa@gmail.com", "kukumlangoni@gmail.com"];
  const isAdmin = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(signedInEmail.toLowerCase());
  const [entitlements, setEntitlements] = useState({ hasProLifetime: false, productIds: new Set() });
  const [pageToast, setPageToast] = useState(null);
  const pageToastTimerRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);

  // Reveal hero smoothly after fonts are loaded — eliminates FOUT/layout shift
  useEffect(() => {
    let cancelled = false;
    const start = () => { if (!cancelled) setHeroReady(true); };

    const afterNextPaint = () =>
      requestAnimationFrame(() => requestAnimationFrame(start));

    if (document.fonts?.ready) {
      document.fonts.ready.then(afterNextPaint);
    } else {
      afterNextPaint();
    }

    // Safety net: never leave hero hidden if fonts hang
    const t = setTimeout(start, 1200);

    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Fetch entitlements when the signed-in user changes
  useEffect(() => {
    let cancelled = false;
    if (!effectiveUser) {
      setEntitlements({ hasProLifetime: false, productIds: new Set() });
      return;
    }
    fetchEntitlements().then((data) => {
      if (!cancelled) setEntitlements(data);
    });
    return () => { cancelled = true; };
  }, [effectiveUser?.uid]);

  const [visibleProductCount, setVisibleProductCount] = useState(100);

  /* -------- Auth resume flow — Member Gate (premium / free code) -------- */
  const [pendingFreeCodeProductId, setPendingFreeCodeProductId] = useState(null);

  const goToPurchases = () => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("view", "purchases");
    navigate(`${window.location.pathname}?${sp.toString()}`);
  };

  const resumePendingAction = (action) => {
    const a = action || getSteaCodePendingAction();
    if (!a) return;
    clearSteaCodePendingAction();
    setMemberGateAction(null);
    switch (a.type) {
      // Everything is free now: a legacy checkout resume just copies the
      // product source like any other free-code action.
      case STEA_CODE_ACTION_TYPES.PREMIUM_CHECKOUT:
      case STEA_CODE_ACTION_TYPES.FREE_CODE:
        if (a.productId) setPendingFreeCodeProductId(a.productId);
        break;
      case STEA_CODE_ACTION_TYPES.PURCHASES: {
        goToPurchases();
        break;
      }
      default: break;
    }
  };

  useEffect(() => {
    if (!effectiveUser) return;
    const action = getSteaCodePendingAction();
    if (!action) return;
    setMemberGateOpen(false);
    resumePendingAction(action);
  }, [effectiveUser?.email]);

  const openMemberGate = (action) => {
    setSteaCodePendingAction(action);
    setMemberGateAction(action);
    setMemberGateOpen(true);
    setAccountMenuOpen(false);
  };

  // Legacy login links (/api/auth/login, StoreReaderPage) land here with
  // ?login=1 — open the email gate instead of a Cloudflare redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("login")) return;
    params.delete("login");
    params.delete("redirect_url");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`
    );
    if (!effectiveUser) openMemberGate(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUser?.email]);

  const handleAvatarClick = () => {
    if (avatarSpin !== "idle") return; // ignore mid-animation clicks

    const willOpen = !accountMenuOpen;

    if (willOpen) {
      setAvatarSpin("left");
      setTimeout(() => {
        setAvatarSpin("right");
        setAccountMenuOpen(true);
        setTimeout(() => setAvatarSpin("idle"), 660);
      }, 660);
    } else {
      setAccountMenuOpen(false);
      setAvatarSpin("left");
      setTimeout(() => {
        setAvatarSpin("right");
        setTimeout(() => setAvatarSpin("idle"), 660);
      }, 660);
    }
  };

  // Close the profile when clicking outside the hub
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const onClick = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === "Escape") setAccountMenuOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [accountMenuOpen]);

  // Shared by the inline desktop nav and the mobile drawer so both routes
  // (href → page, tab → in-page tab, filter → explore mode) stay in sync.
  const handleNavSelect = (item) => {
    if (!item) return;
    if (item.href) {
      navigate(item.href);
      return;
    }
    if (item.tab) {
      setActiveTab(item.tab);
      setCategory("All");
      setPricing("All");
      setFramework("All Frameworks");
      setActiveSubcategory("All");
      syncFilterUrl({ tab: item.tab, cat: "All", sub: "All" });
      setViewMode("explore");
      return;
    }
    if (item.filter) {
      if (item.filter.category) setCategory(item.filter.category);
      if (item.filter.pricing) setPricing(item.filter.pricing);
    }
    setViewMode(item.mode || "explore");
  };

  const handleSignOut = async (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    setAccountMenuOpen(false);
    setLocalAuthUser(null);
    // First-party session cookie — the Worker clears `stea_session` and
    // redirects back to the homepage.
    window.location.assign(getCloudflareLogoutUrl());
  };



  const requestAuthForFreeCode = (productId) => {
    openMemberGate(makeFreeCodeAction(productId));
  };

  const handleMemberGateAuthenticated = (authedUser, action, meta) => {
    setMemberGateOpen(false);
    if (meta?.verificationSent && authedUser?.email) {
      showPageToast("success", tLocal({ en: `Verification email sent to ${authedUser.email}`, zhCN: `验证邮件已发送至 ${authedUser.email}` }));
    }
    resumePendingAction(action);
  };

  const handleMemberGateClose = () => {
    setMemberGateOpen(false);
    if (!localAuthUser) {
      clearSteaCodePendingAction();
      setMemberGateAction(null);
    }
  };

    useEffect(() => {
    let active = true;
    // Icons and Blog are self-contained panels — no catalog request needed.
    if (activeTab === "icons" || activeTab === "blog") {
      setIsFallbackCatalog(false);
      setIsLoading(false);
      return undefined;
    }
    // A retry wipes the error state and reloads from the live API.
    setIsFallbackCatalog(false);
    setIsLoading(true);

    async function loadHomepageCatalog() {
      // A hung network request must not leave the grid on an infinite skeleton:
      // race the catalog fetch against an 8s timeout so a stalled Worker falls
      // into the catch block below and shows the retryable error banner.
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("Catalog request timed out after 8000ms")),
          8000
        );
      });
      try {
        // A "stea-catalog-changed" event (admin delete/update) makes this one
        // load bypass both the localStorage cache and the CDN edge cache.
        const forceFresh = forceNextCatalogLoadRef.current;
        forceNextCatalogLoadRef.current = false;
        // The Library "Cheat Sheets & Notes" pill is a combined filter
        // (cheatsheets + notes) that the API cannot express as a single
        // `category = ?`, so for that one pill we send NO category and let the
        // client-side `filtered` below narrow the library stream. Every other
        // category is filtered in SQL via `category`, and `activeTab` is sent
        // as `tab` so the Worker paginates the FILTERED set.
        const homepageResult = await Promise.race([
          getSteaCodeCatalog({
            scope: "homepage",
            limit: 100,
            offset: 0,
            category: activeTab === "library" && category === "Cheat Sheets" ? "" : category,
            activeTab,
            search: q,
            forceFresh,
            onFresh: (fresh) => {
              if (!active) return;
              const products = asFreeProducts(fresh?.products);
              setGlobalCatalogTotal(Number(fresh?.globalTotal) || 0);
              setLiveCatalog((previous) => {
                const base = Array.isArray(previous) ? previous : [];
                const byId = new Map();
                for (const product of [...products, ...base]) {
                  const id = getProductIdentity(product);
                  if (id) byId.set(id, product);
                }
                return Array.from(byId.values());
              });
              setCatalogTotal(Number(fresh?.total) || products.length);
              setCatalogNextOffset((current) =>
                Math.max(current, Number(fresh?.nextOffset) || products.length)
              );
              setIsLoading(false);
            },
          }),
          timeoutPromise,
        ]);

        if (!active) return;

        // Empty array is valid catalog data. Only a rejected request is an error.
        const homepageNext = asFreeProducts(homepageResult?.products);

        setIsFallbackCatalog(false);
        setLiveCatalog(homepageNext);
        setGlobalCatalogTotal(Number(homepageResult?.globalTotal) || 0);
        setCatalogTotal(Number(homepageResult?.total) || homepageNext.length);
        setCatalogNextOffset(Number(homepageResult?.nextOffset) || homepageNext.length);
        setIsLoading(false);
      } catch (error) {
        console.error(
          "[steacode] HOMEPAGE CATALOG LOAD FAILED — no fallback to seed data.\n" +
          "Error details:",
          error
        );

        if (active) {
          setIsFallbackCatalog(true);
          setLiveCatalog([]);
          setCatalogTotal(0);
          setCatalogNextOffset(0);
          setIsLoading(false);
        }
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    loadHomepageCatalog();

    return () => {
      active = false;
    };
  }, [catalogReloadToken, category, activeTab]);

    // Explore Code homepage products.
  //
  // Rules (Specs #1, #2, #4, #11, #13):
  //   • liveCatalog (array) is the ONLY input — even an empty [] is kept.
  //   • No fallback to FALLBACK_CODE_PRODUCTS when array is present.
  //   • No fallback to FALLBACK_CODE_PRODUCTS when liveCatalog is null/err
  //     (catch sets it to [] anyway so this branch is rarely hit).
  //   • Spec #4 defensive double gate: published === status AND
  //     homepageVisible === true.
  //   • No STEA_MARKETPLACE_FILLERS injection.
  //   • No “published” ⇒ “homepage” shortcut.

  /**
   * Guard against incomplete / test / dummy products.
   * Same check is used for homepage grid filtering AND deep-link resolution
   * so broken test products (e.g. "bb") never show up anywhere public.
   */
  const isProductReady = useCallback((product) => {
    if (!product) return false;
    if (product.status !== "published") return false;

    const rawTitle = (product.titleEn || product.title || product.titleZh || "").trim();
    if (!rawTitle) return false;

    const idLower = String(product.id || product.slug || "").trim().toLowerCase();
    const titleLower = rawTitle.toLowerCase();
    if (idLower === "bb" || titleLower === "bb") return false;

    return true;
  }, []);

  const products = useMemo(() => {
    const homepageList = Array.isArray(liveCatalog) ? liveCatalog : [];

    return homepageList.filter((product) => {
      if (
        !product ||
        product.status !== "published" ||
        !(product.homepageVisible === true || product.homepageVisible === 1 || product.homepageVisible === '1')
      ) return false;

      if (!isProductReady(product)) {
        const id = String(product.id || product.slug || "(unknown)");
        console.warn(
          `[steacode] Hiding incomplete product from homepage grid: "${id}"`
        );
        return false;
      }

      return true;
    });
  }, [liveCatalog, isProductReady]);

  const productDetailRequestsRef = useRef(new Set());

  // The homepage catalog is intentionally card-sized. Hydrate the complete
  // product record only when the detail modal is opened.
  const hydrateProductDetail = useCallback((product) => {
    const productId = getProductIdentity(product);
    if (!productId || productDetailRequestsRef.current.has(productId)) return;

    productDetailRequestsRef.current.add(productId);
    getSteaCodeProduct(productId)
      .then((fullProduct) => {
        if (!fullProduct) return;
        setSelected((previous) => {
          if (!previous || getProductIdentity(previous) !== productId) {
            return previous;
          }
          return {
            ...previous,
            ...fullProduct,
            id: fullProduct.id || previous.id,
            slug: fullProduct.slug || previous.slug,
          };
        });
      })
      .catch((error) => {
        console.warn("[steacode] Product detail hydration failed:", error);
      })
      .finally(() => {
        productDetailRequestsRef.current.delete(productId);
      });
  }, []);

  // Open product detail by navigating to its clean URL and setting selected state
  const openProduct = useCallback((product) => {
    const slug = String(product?.slug || product?.id || "").trim();
    if (!slug) return;
    setSelected(product);
    hydrateProductDetail(product);
    const prefix = location.pathname.startsWith("/code") ? "/code" : "";
    const targetPath = `${prefix}/products/${encodeURIComponent(slug)}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [navigate, location.pathname, hydrateProductDetail]);

  // Close product detail by navigating back to the marketplace homepage.
  // Preserves current query params (category, pricing, view) so the user
  // lands back where they were before opening the modal.
  const closeProduct = useCallback(() => {
    const sp = new URLSearchParams(location.search);
    const basePath = location.pathname.startsWith("/code") ? "/code" : "/";
    // Step back one history entry so the user lands exactly where they came
    // from (store grid, category, search…). A direct deep-link visit has no
    // previous entry — send those to the storefront instead of exiting.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`${basePath}${sp.toString() ? `?${sp.toString()}` : ""}`);
    }
  }, [navigate, location.search, location.pathname]);


  useEffect(() => {
    if (!pendingFreeCodeProductId) return;
    const productId = pendingFreeCodeProductId;
    setPendingFreeCodeProductId(null);
    const match =
      products.find((p) => String(p.id || p.slug || "") === productId) ||
      products.find(
        (p) =>
          String(p.id || p.slug || "").toLowerCase() ===
          String(productId).toLowerCase()
      );
    if (match) {
      openProduct(match);
      return;
    }
    getSteaCodeProduct(productId)
      .then((product) => {
        if (product) openProduct(product);
      })
      .catch((error) => {
        console.warn("[steacode] Pending product lookup failed:", error);
      });
  }, [pendingFreeCodeProductId, products, openProduct]);

  // Legacy ?product= query param → redirect to clean /code/products/:slug URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const requestedProduct = String(sp.get("product") || "").trim();

    if (!requestedProduct) return;

    const match =
      products.find(
        (p) =>
          String(p.id || p.slug || "") === requestedProduct
      ) ||
      products.find(
        (p) =>
          String(p.id || p.slug || "").toLowerCase() ===
          requestedProduct.toLowerCase()
      );

    if (match) {
      // Redirect to clean URL — replace so the old query-param URL
      // doesn't stay in browser history
      const slug = String(match.slug || match.id || "").trim();
      if (slug) {
        sp.delete("product");
        const prefix = location.pathname.startsWith("/code") ? "/code" : "";
        navigate(`${prefix}/products/${encodeURIComponent(slug)}${sp.toString() ? `?${sp.toString()}` : ""}`, { replace: true });
      }
      return;
    }

    getSteaCodeProduct(requestedProduct)
      .then((product) => {
        const resolvedSlug = String(product?.slug || product?.id || "").trim();
        if (!resolvedSlug) return;
        const next = new URLSearchParams(sp);
        next.delete("product");
        const prefix = location.pathname.startsWith("/code") ? "/code" : "";
        navigate(`${prefix}/products/${encodeURIComponent(resolvedSlug)}${next.toString() ? `?${next.toString()}` : ""}`, { replace: true });
      })
      .catch(() => {
        // Keep the legacy URL untouched if the product no longer exists.
      });
  }, [products, navigate, location.pathname]);

  /* ---------- Deep link: /code/products/:slug or /products/:slug ----------
   * URL is the source of truth for the product detail modal.
   * - Opening a product → navigate to /code/products/{slug} or /products/{slug}
   * - Closing → navigate back to /code or /
   * - Back/forward buttons work because URL drives modal state
   * - Direct visit to a shared link → the product is fetched by slug
   *   IMMEDIATELY (never gated on the homepage catalog, which used to add a
   *   full round-trip before the modal could open) and the modal opens as
   *   soon as the fetch resolves.
   * - Slug not found OR product incomplete → render the real 404 page
   *   (no silent bounce to the homepage — that is a soft-404 for Google).
   */
  const productSlugFromUrl = useMemo(() => {
    const m = location.pathname.match(/^(?:\/code)?\/products\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [location.pathname]);

  // Slug that failed to resolve (404 / unpublished) → render NotFoundPage.
  const [deepLinkNotFoundSlug, setDeepLinkNotFoundSlug] = useState(null);

  // Sync URL → selected state
  useEffect(() => {
    if (!productSlugFromUrl) {
      // No product in URL — close modal if open
      if (selected) setSelected(null);
      setDeepLinkNotFoundSlug(null);
      return;
    }

    const slug = productSlugFromUrl.toLowerCase();

    // Already showing this exact product — nothing to do.
    if (
      selected &&
      String(selected.slug || selected.id || "").toLowerCase() === slug
    ) {
      return;
    }

    const match =
      products.find((p) => String(p.slug || "").toLowerCase() === slug) ||
      products.find((p) => String(p.id || "").toLowerCase() === slug);

    if (match && isProductReady(match)) {
      setDeepLinkNotFoundSlug(null);
      setSelected(match);
      hydrateProductDetail(match);
      return;
    }

    // Fetch by slug right away — do NOT wait for the homepage catalog.
    let cancelled = false;
    getSteaCodeProduct(slug)
      .then((product) => {
        if (cancelled) return;
        if (product && isProductReady(product)) {
          setDeepLinkNotFoundSlug(null);
          setSelected(product);
          return;
        }
        throw new Error("Product not found");
      })
      .catch(() => {
        if (cancelled) return;
        setDeepLinkNotFoundSlug(productSlugFromUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [productSlugFromUrl, products, selected, isProductReady, hydrateProductDetail]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const searching = query.length >= 1;
    return products
      .filter((p) => {
        // When the user is searching, the Worker SQL already hits every column
        // including tags/productType/extraData — no tab/category gating here,
        // or typing "book" on the "components" tab would still hide library items.
        if (searching) return true;
        if (activeTab === "components") return p.tab === "components" || p.tab === undefined || p.featured === true;
        if (activeTab === "layouts") return p.tab === "layouts";
        if (activeTab === "kits") return p.tab === "kits";
        if (activeTab === "library") return isBookProduct(p);
        return true;
      })
      .filter((p) => {
        if (searching) return true;
        if (activeTab === "library" && category === "Cheat Sheets") {
          return (
            p.productType === "cheatsheet" ||
            p.productType === "note" ||
            p.category === "Cheat Sheets"
          );
        }
        return true;
      })
      .filter((p) => {
        if (searching) return true;
        if (activeSubcategory === "All" || !SUBCATEGORIES[category]) return true;
        return (p.subcategory || "") === activeSubcategory;
      })
      .filter((p) => searching || pricing === "All" || p.pricingType === pricing.toLowerCase())
      .filter((p) => searching || framework === "All Frameworks" || (p.frameworks || []).includes(framework))
      .filter((p) => {
        if (!query) return true;
        // Client haystack is a redundancy now (Worker already did LIKE across
        // every column) but it's cheap and keeps fuzzy matches instant for
        // users who are still typing. `productType` is included explicitly
        // so "book" / "ebook" / "pdf" / "note" always surface library items
        // regardless of which tab the user started on.
        const hay = [
          p.titleEn, p.titleZh, p.shortDescriptionEn, p.shortDescriptionZh,
          p.category, p.productType, p.tab,
          ...(p.tags || []), ...(p.frameworks || []), ...(p.languages || []),
        ].join(" ").toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [products, activeTab, category, pricing, framework, q, activeSubcategory]);

  const trendingProducts = useMemo(() => {
    const list = Array.isArray(products) ? [...products] : [];
    return list
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 4);
  }, [products]);

  const freeProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.filter((p) => p.pricingType === "free").slice(0, 8);
  }, [products]);

  const premiumProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.filter((p) => p.pricingType === "premium").slice(0, 4);
  }, [products]);
  const hasPremiumAvailable = premiumProducts.length > 0 && true;

  const categoryCounts = useMemo(() => {
    const counts = {};
    const list = Array.isArray(products) ? products : [];
    for (const p of list) {
      if (p?.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    const c = counts;
    if (c.plan === undefined && c.monetize === undefined) {
      // count references for 7worlds regression
    }
    return counts;
  }, [products]);

  // Catalog already contains only homepage-approved products (scope=homepage&t=${Date.now()}).
  // Filters refine the approved set. Publishing and homepage approval remain
  // separate controls in Admin — new products must be explicitly approved.
  const homepageProducts = filtered
    .filter((p) => p?.slug !== SERVICE_CARD_PRODUCT_SLUG)
    .slice(0, Math.min(visibleProductCount, 100));

  // The "steacode services" banner is the first tile of the main grid. It is
  // the premium-website-hero product rendered through the normal card, so it
  // keeps its authored swinging-pendulum preview, its logo pill and its gold
  // "Book a Call" CTA. It is not part of the mapped list below — it is placed
  // explicitly so it is always first.
  const serviceProduct = products.find(
    (p) => p?.slug === SERVICE_CARD_PRODUCT_SLUG
  );

  // Strictly the unfiltered first page: any tab, category, subcategory,
  // pricing, framework or search filter hides the banner.
  const showServiceBanner =
    Boolean(serviceProduct) &&
    activeTab === DEFAULT_TAB &&
    category === "All" &&
    activeSubcategory === "All" &&
    pricing === "All" &&
    framework === "All Frameworks" &&
    !q.trim();

  useEffect(() => {
    setVisibleProductCount(100);
  }, [activeTab, category, pricing, framework, q]);

  // Subcategory pills reset to "All" whenever the top-level category changes
  // (e.g. switching Layout → Buttons clears the sub filter).
  useEffect(() => {
    setActiveSubcategory("All");
  }, [category]);

  // Open on the filters the URL asks for — on first paint (a pasted link) and on
  // browser back/forward. Keyed by a signature of the three filter params only,
  // so an unrelated search change (opening a product writes ?view=product&
  // product=… ) never re-applies stale filters over a newer in-page choice.
  //
  // Declared AFTER the category→subcategory reset above on purpose: both run in
  // the same commit, in declaration order, so hydrating `sub` here is not then
  // clobbered by that reset.
  const appliedFiltersRef = useRef(null);
  useEffect(() => {
    if (appliedFiltersRef.current === filterSignature) return;
    appliedFiltersRef.current = filterSignature;
    setActiveTab(filterParams.tab);
    setCategory(filterParams.cat);
    setActiveSubcategory(filterParams.sub);
  }, [filterSignature, filterParams]);

  const submit = (event) => {
    event?.preventDefault?.();
    if (q.trim()) onOpenSearch({ query: q.trim() });
  };

  const PRODUCT_INCREMENT = 24;
  const MAX_HOMEPAGE_PRODUCTS = 100;

  const catalogHasMore = catalogNextOffset < catalogTotal;

  // Number of products available to the main grid (excludes the services card
  // injected as the first tile). "Load More" only shows while there are still
  // more products to reveal up to the 100-product homepage cap — even if the
  // server has additional rows beyond 100, the grid stops there.
  const gridProductCount = filtered.filter((p) => p?.slug !== SERVICE_CARD_PRODUCT_SLUG).length;
  const canShowMore = visibleProductCount < Math.min(gridProductCount, MAX_HOMEPAGE_PRODUCTS);

  const loadMoreHomepageProducts = useCallback(async () => {
    if (catalogLoadingMore || !catalogHasMore) return false;
    setCatalogLoadingMore(true);
    try {
      // Must send the CURRENT category + activeTab: the server paginates the
      // FILTERED set, so fetching "the next page" with a stale filter would
      // mix categories (or keep returning the same first-20 homepage rows).
      // The Library "Cheat Sheets & Notes" pill sends no category — same
      // rule as the initial fetch (combined filter stays client-side).
      const result = await getSteaCodeCatalog({
        scope: "homepage",
        limit: 100,
        offset: catalogNextOffset,
        category: activeTab === "library" && category === "Cheat Sheets" ? "" : category,
        activeTab,
        search: q,
      });
      const nextProducts = Array.isArray(result?.products) ? result.products : [];
      setLiveCatalog((previous) => {
        const byId = new Map();
        for (const product of [...(Array.isArray(previous) ? previous : []), ...nextProducts]) {
          const id = getProductIdentity(product);
          if (id) byId.set(id, product);
        }
        return Array.from(byId.values());
      });
      setCatalogTotal(Number(result?.total) || catalogTotal);
      setCatalogNextOffset(
        Number(result?.nextOffset) || catalogNextOffset + nextProducts.length
      );
      return true;
    } catch (error) {
      console.error("[steacode] Failed to load more homepage products:", error);
      return false;
    } finally {
      setCatalogLoadingMore(false);
    }
  }, [
    catalogHasMore,
    catalogLoadingMore,
    catalogNextOffset,
    catalogTotal,
    category,
    activeTab,
  ]);

  const handleProductExpansion = async () => {
    const nextVisible = Math.min(
      visibleProductCount + PRODUCT_INCREMENT,
      MAX_HOMEPAGE_PRODUCTS
    );
    // The initial fetch already loads up to 100 products (featured first, then
    // newest), so "Load More" normally just reveals more of the preloaded set
    // without another network round-trip. Only hit the API when we haven't
    // loaded enough products yet to cover the next visible window — this keeps
    // the path correct for filtered views that return fewer than 100 rows.
    if (products.length < nextVisible && catalogHasMore) {
      await loadMoreHomepageProducts();
    }

    setVisibleProductCount(nextVisible);
  };



  // SEO meta for selected product
  const defaultCodeTitle = uiLocale === "zhCN"
    ? "steacode — 开发者代码市场"
    : "steacode — Developer Marketplace";
  const defaultCodeDesc = uiLocale === "zhCN"
    ? "steacode 开发者代码市场与实时交互预览。"
    : "steacode — a marketplace for buying and selling code components.";

  // Per-tab SEO overrides. A clean route (/templates) and its tab should read
  // as a distinct, descriptive page to search engines rather than the generic
  // marketplace title.
  const TAB_SEO_TITLE = {
    layouts: "Free Page Templates",
  };
  const seoTitle = selected
    ? `${String(selected.titleEn || selected.title || selected.titleZh || "").trim()} — steacode`
    : TAB_SEO_TITLE[activeTab] || defaultCodeTitle;
  const seoDescription = selected
    ? String(selected.shortDescriptionEn || selected.description || selected.shortDescriptionZh || "").trim()
    : defaultCodeDesc;
  const seoImage = selected
    ? (selected.posterImageUrl || selected.preview?.posterUrl || "")
    : "";
  const seoSlug = selected
    ? String(productSlugFromUrl || selected.slug || selected.id || "").trim()
    : "";
  const seoCanonical = selected && seoSlug
    ? `https://steacode.com/products/${encodeURIComponent(seoSlug)}`
    : "https://steacode.com/";
  const seoUrl = selected && seoSlug ? seoCanonical : null;

  // JSON-LD: Product + SoftwareApplication so Google understands the page type.
  const seoStructuredData = useMemo(() => {
    if (!selected || !seoSlug) return null;
    const name = String(selected.titleEn || selected.title || selected.titleZh || "").trim() || "STEA Code product";
    const description =
      String(
        selected.shortDescriptionEn ||
        selected.description ||
        selected.shortDescriptionZh ||
        selected.descriptionZh ||
        ""
      ).trim() || name;
    const rawImage = selected.posterImageUrl || selected.preview?.posterUrl || "";
    let imageUrl = "https://steacode.com/stea-code-logo.png";
    try {
      if (rawImage) imageUrl = new URL(rawImage, "https://steacode.com").toString();
    } catch {
      /* keep fallback */
    }
    const isFree = selected.pricingType === "free";
    const price = isFree ? "0" : Number(selected.price || 0).toFixed(2);
    const offers = {
      "@type": "Offer",
      url: seoCanonical,
      priceCurrency: selected.currency || "USD",
      price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "STEA Code" },
    };
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          name,
          description,
          image: [imageUrl],
          category: selected.category || "Web Components",
          brand: { "@type": "Brand", name: "STEA Code" },
          offers,
        },
        {
          "@type": "SoftwareApplication",
          name,
          description,
          operatingSystem: "Web",
          applicationCategory: "DeveloperApplication",
          offers,
        },
      ],
    };
  }, [selected, seoSlug, seoCanonical]);

  // Deep-linked slug does not resolve to a published product → real 404 page.
  // Never fall through to the homepage for /products/:slug (soft-404 for SEO).
  if (
    deepLinkNotFoundSlug &&
    productSlugFromUrl &&
    deepLinkNotFoundSlug.toLowerCase() === productSlugFromUrl.toLowerCase()
  ) {
    return <SteaCodeNotFoundPage />;
  }

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        ogImage={seoImage || undefined}
        ogUrl={seoUrl || undefined}
        type={selected ? "product" : "website"}
        siteName="STEA Code"
        structuredData={seoStructuredData || undefined}
      />
    <div className="stea-code-app sc-v2 sc-market-home sc-v2-home sc-v2-has-liquid">
      <div className="sc-v2-liquid-wrap" aria-hidden="true"><PreviewErrorBoundary><LazyLiquidHero theme="light" /></PreviewErrorBoundary></div>
      <div className="sc-v2-veil" aria-hidden="true" />

      <header className="sc-topbar">
        <a
          className="sc-topbar-logo"
          href="/code"
          aria-label="steacode home"
          onClick={(e) => {
            if (viewMode === "explore") {
              e.preventDefault();
              setViewMode("home");
              setCategory("All");
              setPricing("All");
              setFramework("All Frameworks");
            }
          }}
        >
          <img
            src="/stea-code-logo.png"
            alt="steacode"
            className="sc-topbar-logo-img"
            width={36}
            height={36}
            decoding="async"
          />
          <span>steacode</span>
        </a>

        <nav className="sc-topbar-nav" aria-label="Marketplace navigation">
          {NAV_LINKS.map((item) => {
            const isActive = (() => {
              if (item.tab) return activeTab === item.tab;
              if (item.href) return location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              if (item.mode === "explore") {
                if (item.filter?.category && item.filter.category !== "All") {
                  return category === item.filter.category;
                }
                if (item.filter?.pricing && item.filter.pricing !== "All") {
                  return pricing === item.filter.pricing && category === "All";
                }
                return viewMode === "explore" && category === "All" && pricing === "All";
              }
              return false;
            })();

            if (item.href) {
              return (
                <Link key={item.id} to={item.href} className={isActive ? "is-active" : ""}>
                  {tLocal(item.label)}
                </Link>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className={isActive ? "is-active" : ""}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                }}
                onClick={() => handleNavSelect(item)}
              >
                {tLocal(item.label)}
              </button>
            );
          })}
        </nav>

        <div className={`sc-topbar-actions ${accountMenuOpen ? "is-expanded" : ""}`}>
          <a
            href="https://t.me/steacode"
            target="_blank"
            rel="noopener noreferrer"
            className="sc-topbar-community"
            aria-label="Join the steacode community on Telegram"
          >
            <span className="sc-topbar-community-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </span>
            <span className="sc-topbar-community-label">Join the Community</span>
          </a>

          {effectiveUser ? (
            <div className={`sc-account-hub ${accountMenuOpen ? "is-open" : ""}`} ref={accountMenuRef}>
              <span className="sc-hub-glow" aria-hidden="true" />

              <button
                type="button"
                className={`sc-account-avatar-btn ${avatarSpin === "left" ? "spin-left" : avatarSpin === "right" ? "spin-right" : ""}`}
                onClick={handleAvatarClick}
                aria-label="Toggle profile"
                aria-expanded={accountMenuOpen}
              >
                <SteaCodeUserAvatar user={effectiveUser} email={signedInEmail} size={34} />
              </button>

              <span className="sc-hub-item sc-hub-email">{signedInEmail}</span>

              <span className="sc-hub-item sc-hub-badge">{isAdmin ? "ADMIN" : "MEMBER"}</span>

              <button
                type="button"
                className="sc-hub-item sc-hub-signout"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="sc-topbar-cta"
              data-newsletter-trigger
              onClick={() => setNewsletterOpen(true)}
            >
              Get Updates
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.9 5.7L20 9.6l-5.1 3.7L16.4 20 12 16.6 7.6 20l1.5-6.7L4 9.6l6.1-1.9L12 2z"/>
              </svg>
            </button>
          )}

        </div>
      </header>

      <main>
        {effectiveView === "purchases" ? (
          <SteaCodePurchasesPage
            locale={uiLocale}
            onGoHome={() => {
              if (location.pathname === "/library") {
                // Step back through history when there is any; fall back to
                // the storefront for direct/deep-link visits.
                if (window.history.length > 1) navigate(-1);
                else navigate("/");
              } else {
                const sp = new URLSearchParams(location.search);
                sp.delete("view");
                navigate(`${location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`);
              }
            }}
            onGoProduct={(pid) => {
              const p = products.find((item) => item.id === pid || item.slug === pid);
              if (p) {
                openProduct(p);
                return;
              }
              getSteaCodeProduct(pid)
                .then((product) => {
                  if (product) openProduct(product);
                })
                .catch((error) => {
                  console.warn("[steacode] Purchase product lookup failed:", error);
                });
            }}
            onRequireAuth={() => {
              setMemberGateAction({ type: "purchases" });
              setMemberGateOpen(true);
            }}
          />
        ) : viewMode === "explore" ? (
          /* ================= EXPLORE CATALOG VIEW ================= */
          <section id="explore" className="sc-market-section">
            <div className="sc-market-section-head">
              <div>
                <h2>{tLocal(COPY.exploreCode)}</h2>
                <p>{tLocal(COPY.marketplaceSub)}</p>
              </div>
              <button
                type="button"
                className="sc-tool-back-link"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  font: "inherit",
                }}
                onClick={() => {
                  setViewMode("home");
                  setCategory("All");
                  setPricing("All");
                  setFramework("All Frameworks");
                }}
              >
                {tLocal(COPY.backToHome)}
              </button>
            </div>
            <ProductControls
              tLocal={tLocal}
              uiLocale={uiLocale}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              category={category}
              setCategory={setCategory}
              pricing={pricing}
              setPricing={setPricing}
              framework={framework}
              setFramework={setFramework}
              setActiveSubcategory={setActiveSubcategory}
              syncFilterUrl={syncFilterUrl}
            />
            {activeTab === "icons" ? (
              <IconGallery />
            ) : activeTab === "blog" ? (
              <SteaCodeBlogPage embedded />
            ) : (<>
            {isFallbackCatalog && (
              <div
                className="sc-fallback-catalog-banner"
                role="status"
                style={{
                  margin: "0 0 20px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#fca5a5",
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span style={{ flex: "1 1 auto", minWidth: "220px" }}>
                  <strong>
                    {uiLocale === "zhCN" ? "产品加载失败：" : "Failed to load products."}
                  </strong>{" "}
                  {uiLocale === "zhCN"
                    ? "产品目录没有响应。请刷新页面或重试。"
                    : "The product catalog did not respond. Refresh the page or try again."}
                </span>
                <button
                  type="button"
                  onClick={() => setCatalogReloadToken((t) => t + 1)}
                  style={{
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {uiLocale === "zhCN" ? "重试" : "Retry"}
                </button>
              </div>
            )}
            {(isLoading || isGridSwitching) ? (
              <div className={`sc-product-grid ${isGridSwitching ? "is-switching" : ""}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SteaCodeProductSkeleton key={i} />
                ))}
              </div>
            ) : homepageProducts.length > 0 ? (
              <div className={`sc-product-grid ${isGridSwitching ? "is-switching" : ""}`}>
                {(!homepageProducts || homepageProducts.length === 0) ? <SkeletonGrid /> : homepageProducts.map((product, index) => (
                  <Reveal key={getProductIdentity(product)} delay={Math.min(index, 6) * 25}>
                    <TiltCard>
                      <PreviewErrorBoundary>
                        <CodeProductCard
                          product={product}
                          tLocal={tLocal}
                          onOpenProduct={openProduct}
                          isFavorited={favorites.has(getProductIdentity(product))}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </PreviewErrorBoundary>
                    </TiltCard>
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="sc-empty-state" role="status" aria-live="polite">
                <div className="sc-empty-orb" aria-hidden="true">
                  <span className="sc-empty-orb-inner" />
                  <span className="sc-empty-orb-ring" />
                  <span className="sc-empty-orb-ring sc-empty-orb-ring-2" />
                </div>
                <div className="sc-empty-copy">
                  <span className="sc-empty-kicker">
                    {uiLocale === "zhCN" ? "即将上线" : "Coming soon"}
                  </span>
                  <h3 className="sc-empty-title">
                    {category && category !== "All"
                      ? (uiLocale === "zhCN"
                          ? `${tLocal(CATEGORY_LABELS[category] || { en: category, zhCN: category })} 即将推出`
                          : `${tLocal(CATEGORY_LABELS[category] || { en: category, zhCN: category })} is on the way`)
                      : (uiLocale === "zhCN" ? "新组件即将到来" : "New drops are on the way")}
                  </h3>
                  <p className="sc-empty-desc">
                    {uiLocale === "zhCN"
                      ? "我们正在为这个分类打造全新组件。关注社区，第一时间获取。"
                      : "We're crafting fresh components for this category. Follow the community to be first in line when they land."}
                  </p>
                </div>
                <div className="sc-empty-actions">
                  <button
                    type="button"
                    className="sc-empty-primary"
                    onClick={() => { setCategory("All"); setPricing("All"); setFramework("All Frameworks"); }}
                  >
                    {uiLocale === "zhCN" ? "浏览所有组件" : "Browse all products"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <a
                    href="https://t.me/steacode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sc-empty-secondary"
                  >
                    {uiLocale === "zhCN" ? "加入社区" : "Join the community"}
                  </a>
                </div>
              </div>
            )}

            {/* Load More Components — bottom of the grid. Shows only while
                there are still products to reveal up to the 100-product cap.
                With 100 preloaded on the initial fetch, clicking just reveals
                the next batch from memory; the API is only hit when a filtered
                view returns fewer rows than the next visible window. */}
            {canShowMore ? (
              <div className="sc-market-show-more-wrap">
                <button
                  type="button"
                  className="sc-market-show-more"
                  onClick={handleProductExpansion}
                  disabled={catalogLoadingMore}
                >
                  <span>
                    {catalogLoadingMore
                      ? (uiLocale === "zhCN" ? "正在加载…" : "Loading…")
                      : (uiLocale === "zhCN" ? "加载更多组件" : "Load More Components")}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : null}
            </>)}
          </section>
        ) : (
          /* ================= STOREFRONT HOMEPAGE SECTIONS ================= */
          <>
            {/* 1. HERO */}
            <section className={`sc-market-hero sc-home-hero sc-hero-twocol ${heroReady ? 'is-ready' : ''}`}>
              {/* Ambient glow background */}
              <div className="sc-hero-glow" aria-hidden="true" />

              {/* Floating particles */}
              <div className="sc-hero-particles" aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className="sc-hero-particle"
                    style={{
                      left: `${(i * 7.3) % 100}%`,
                      animationDelay: `${(i * 0.7) % 8}s`,
                      animationDuration: `${12 + (i % 5) * 3}s`,
                    }}
                  />
                ))}
              </div>

              <div className="sc-home-hero-inner sc-hero-twocol-inner">
                <div className="sc-hero-content">
                <h1 className="sc-hero-title"><strong>Code faster.</strong><span className="sc-hero-title-accent">Build better.</span></h1>
                <p className="sc-home-hero-subtitle">{tLocal(COPY.sub)}</p>
                <form className="sc-market-search" onSubmit={submit} role="search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={tLocal(COPY.search)}
                    aria-label={tLocal(COPY.search)}
                  />
                  <span className="sc-v2-kbd"><Command size={12} /> K</span>
                </form>
                <div className="sc-market-ctas">
                  <button
                    type="button"
                    className="sc-market-primary sc-hero-cta-primary"
                    onClick={() => {
                      setPricing("Free");
                      setCategory("All");
                    }}
                  >
                    {tLocal(COPY.browseFree)} <ArrowRight size={16} />
                  </button>
                </div>
                <div className="sc-trust-bar" role="status" aria-label="steacode stats">
                  <div className="sc-trust-item">
                    {/* Global storefront total (published + homepageVisible) from
                        the API's `globalTotal`, with a count-up animation. Falls
                        back to the loaded page size (then 94) if unavailable. */}
                    <span className="sc-trust-value">{(animatedTotal || products.length || 94)}+</span>
                    <span className="sc-trust-label">{uiLocale === "zhCN" ? "组件" : "Components"}</span>
                  </div>
                  <div className="sc-trust-divider" aria-hidden="true" />
                  <div className="sc-trust-item">
                    <span className="sc-trust-value">11</span>
                    <span className="sc-trust-label">{uiLocale === "zhCN" ? "分类" : "Categories"}</span>
                  </div>
                  <div className="sc-trust-divider" aria-hidden="true" />
                  <div className="sc-trust-item">
                    <span className="sc-trust-value">{uiLocale === "zhCN" ? "免费" : "Free"}</span>
                    <span className="sc-trust-label">{uiLocale === "zhCN" ? "永久" : "Forever"}</span>
                  </div>
                  <div className="sc-trust-divider" aria-hidden="true" />
                  <div className="sc-trust-item">
                    <span className="sc-trust-value">{uiLocale === "zhCN" ? "每周" : "Updated"}</span>
                    <span className="sc-trust-label">{uiLocale === "zhCN" ? "更新" : "Weekly"}</span>
                  </div>
                </div>
                </div>

                <div className="sc-hero-visual" aria-hidden="true">
                  <div className="sc-hero-stack">
  <img src="/images/hero/card-back.png" alt="Portfolio Card" className="sc-stack-card back" decoding="async" />
  <img src="/images/hero/card-middle.png" alt="Laptop Mockup" className="sc-stack-card middle" decoding="async" />
  <img src="/images/hero/card-front.png" alt="Discover Card" className="sc-stack-card front" decoding="async" />
</div>
                </div>
              </div>
            </section>

            {/* 2. LATEST & FEATURED PRODUCTS */}
            <section id="trending" className="sc-market-section">
              <div className="sc-market-section-head">
                <div>
                  <h2>{tLocal(COPY.trendingTitle)}</h2>
                  <p>{tLocal(COPY.trendingSub)}</p>
                </div>
              </div>

              {/* Adsterra leaderboard placeholder — above the tab bar, clear of all controls */}
              <SmartAdSlot id="adsterra-home-top" minHeight={90} style={{ marginBottom: "32px" }} />

              {/* Three-tab navigation (Components / Layouts / Kits) */}
              <div className="sc-tabs" style={{ marginBottom: "16px" }}>
                {Object.values(TABS).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`sc-tabs__item ${activeTab === tab.id ? "is-active" : ""}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCategory("All");
                      setActiveSubcategory("All");
                      setPricing("All");
                      setFramework("All Frameworks");
                      const cleanPath = TAB_CLEAN_PATH[tab.id];
                      if (cleanPath) navigate(cleanPath);
                      else syncFilterUrl({ tab: tab.id, cat: "All", sub: "All" });
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Icons tab: local static gallery replaces pills + product grid */}
              {activeTab === "icons" ? (
                <IconGallery />
              ) : activeTab === "blog" ? (
                <SteaCodeBlogPage embedded />
              ) : (<>
              {/* Category filter pills — dynamic based on activeTab */}
              <div className="sc-homepage-pill-row" role="tablist" aria-label="Product categories">
                {TABS[activeTab].categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={category === cat.id}
                    className={`sc-homepage-pill ${category === cat.id ? "is-active" : ""}`}
                    data-tooltip={cat.tooltip || undefined}
                    onClick={() => {
                      setCategory(cat.id);
                      setActiveSubcategory("All");
                      setPricing("All");
                      setFramework("All Frameworks");
                      syncFilterUrl({ tab: activeTab, cat: cat.id, sub: "All" });
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Layout-only subcategory pill row — shows ONLY when the
                  active top-level category has subcategories defined. */}
              {SUBCATEGORIES[category] && (
                <div className="sc-homepage-pill-row sc-homepage-pill-row--sub" role="tablist" aria-label="Subcategories">
                  {["All", ...SUBCATEGORIES[category]].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      role="tab"
                      aria-selected={activeSubcategory === sub}
                      className={`sc-homepage-pill sc-homepage-pill--sub ${activeSubcategory === sub ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveSubcategory(sub);
                        syncFilterUrl({ tab: activeTab, cat: category, sub });
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {isFallbackCatalog && (
                <div
                  className="sc-fallback-catalog-banner"
                  role="status"
                  style={{
                    margin: "0 0 20px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#fca5a5",
                    fontSize: "13px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <span style={{ flex: "1 1 auto", minWidth: "220px" }}>
                    <strong>
                      {uiLocale === "zhCN" ? "产品加载失败：" : "Unable to load products:"}
                    </strong>{" "}
                    {uiLocale === "zhCN"
                      ? "请刷新重试。"
                      : "Please refresh."}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCatalogReloadToken((t) => t + 1)}
                    style={{
                      background: "rgba(239, 68, 68, 0.9)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {uiLocale === "zhCN" ? "重试" : "Retry"}
                  </button>
                </div>
              )}

              {(isLoading || isGridSwitching) ? (
                <div className={`sc-product-grid ${isGridSwitching ? "is-switching" : ""}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SteaCodeProductSkeleton key={i} />
                  ))}
                </div>
              ) : homepageProducts.length > 0 ? (
                <div className={`sc-product-grid ${isGridSwitching ? "is-switching" : ""}`}>
                  {/* "steacode services" banner — first tile of the unfiltered
                      "All" view. It is rendered through the same card
                      component as every other product so it keeps its authored
                      swinging-pendulum preview, its logo pill and its gold
                      "Book a Call" CTA. It is placed here explicitly rather
                      than in homepageProducts. */}
                  {showServiceBanner && (
                    <Reveal delay={0}>
                      <TiltCard>
                        <PreviewErrorBoundary>
                          <CodeProductCard
                            product={serviceProduct}
                            tLocal={tLocal}
                            onOpenProduct={openProduct}
                            isFavorited={favorites.has(getProductIdentity(serviceProduct))}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </PreviewErrorBoundary>
                      </TiltCard>
                    </Reveal>
                  )}

                  {homepageProducts.map((product, index) => (
                    <React.Fragment key={getProductIdentity(product)}>
                      <Reveal delay={Math.min(index, 6) * 25}>
                        <TiltCard>
                          <PreviewErrorBoundary>
                            <CodeProductCard
                              product={product}
                              tLocal={tLocal}
                              onOpenProduct={openProduct}
                              isFavorited={favorites.has(getProductIdentity(product))}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          </PreviewErrorBoundary>
                        </TiltCard>
                      </Reveal>
                      {index === 5 && (
                        <Reveal delay={100}>
                          <SponsoredCard />
                        </Reveal>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="sc-empty-state" role="status" aria-live="polite">
                <div className="sc-empty-orb" aria-hidden="true">
                  <span className="sc-empty-orb-inner" />
                  <span className="sc-empty-orb-ring" />
                  <span className="sc-empty-orb-ring sc-empty-orb-ring-2" />
                </div>
                <div className="sc-empty-copy">
                  <span className="sc-empty-kicker">
                    {uiLocale === "zhCN" ? "即将上线" : "Coming soon"}
                  </span>
                  <h3 className="sc-empty-title">
                    {category && category !== "All"
                      ? (uiLocale === "zhCN"
                          ? `${tLocal(CATEGORY_LABELS[category] || { en: category, zhCN: category })} 即将推出`
                          : `${tLocal(CATEGORY_LABELS[category] || { en: category, zhCN: category })} is on the way`)
                      : (uiLocale === "zhCN" ? "新组件即将到来" : "New drops are on the way")}
                  </h3>
                  <p className="sc-empty-desc">
                    {uiLocale === "zhCN"
                      ? "我们正在为这个分类打造全新组件。关注社区，第一时间获取。"
                      : "We're crafting fresh components for this category. Follow the community to be first in line when they land."}
                  </p>
                </div>
                <div className="sc-empty-actions">
                  <button
                    type="button"
                    className="sc-empty-primary"
                    onClick={() => { setCategory("All"); setPricing("All"); setFramework("All Frameworks"); }}
                  >
                    {uiLocale === "zhCN" ? "浏览所有组件" : "Browse all products"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <a
                    href="https://t.me/steacode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sc-empty-secondary"
                  >
                    {uiLocale === "zhCN" ? "加入社区" : "Join the community"}
                  </a>
                </div>
              </div>
              )}
              </>)}
            </section>


          </>
        )}
      </main>

      <LatestFromBlog />

      <SteaCodeFooter />
      <AnimatePresence>
        {selected && (
          <ProductDetail
            key={`product-detail-${getProductIdentity(selected)}`}
            product={selected}
            allProducts={products}
            onOpenProduct={openProduct}
            onClose={() => closeProduct()}
            tLocal={tLocal}
            isFavorited={favorites.has(getProductIdentity(selected))}
            onToggleFavorite={handleToggleFavorite}
            entitlements={entitlements}
            onOpenUnlockModal={() => setUnlockModalProduct(selected)}
            onReadEbook={(book) => navigate(`/library/read/${book?.slug || book?.id || getProductIdentity(book)}`)}
          />
        )}
      </AnimatePresence>
      <SteaCodeMemberGate
        open={memberGateOpen}
        pendingAction={memberGateAction}
        locale={uiLocale}
        onClose={handleMemberGateClose}
        onAuthenticated={handleMemberGateAuthenticated}
      />
      <NewsletterModal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />

      {/* Page-level toast */}
      {pageToast && (
        <div className={`sc-page-toast sc-page-toast--${pageToast.type}`}>
          <span className="sc-page-toast-icon">
            {pageToast.type === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="8" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </span>
          <span className="sc-page-toast-message">{pageToast.message}</span>
        </div>
      )}

    </div>
    </>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div className="sc-market-section-head">
      <div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}</div>
      {action ? <a href="#explore">{action} <ArrowRight size={15} /></a> : null}
    </div>
  );
}

function ProductControls({ tLocal, uiLocale = "en", activeTab, setActiveTab, category, setCategory, pricing, setPricing, framework, setFramework, setActiveSubcategory, syncFilterUrl }) {
  return (
    <div className="sc-market-controls">
      <div
        className="sc-market-tabs-row"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <span
          className="sc-controls-label"
          aria-hidden="true"
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            color: "rgba(148, 163, 184, 0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {uiLocale === "zhCN" ? "分类" : "Categories"}
        </span>
        <div className="sc-tabs">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`sc-tabs__item ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setCategory("All");
                setActiveSubcategory("All");
                syncFilterUrl({ tab: tab.id, cat: "All", sub: "All" });
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sc-market-tabs">
          {TABS[activeTab].categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={category === cat.id ? "is-active" : ""}
              data-tooltip={cat.tooltip || undefined}
              onClick={() => {
                setCategory(cat.id);
                setActiveSubcategory("All");
                syncFilterUrl({ tab: activeTab, cat: cat.id, sub: "All" });
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="sc-market-filter-row"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <span
          className="sc-controls-label"
          aria-hidden="true"
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            color: "rgba(148, 163, 184, 0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {uiLocale === "zhCN" ? "筛选" : "Pricing"}
        </span>
        <div className="sc-market-filter-left">
          {[
            { value: "All", label: uiLocale === "zhCN" ? "全部产品" : "All Products" },
            { value: "Free", label: tLocal(COPY["free"] || "Free") },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={pricing === item.value ? "is-active" : ""}
              onClick={() => setPricing(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="sc-market-filter-right">
          <label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
            >
              <option value="All Frameworks">
                {tLocal(COPY.allFrameworks)}
              </option>
              {CODE_PRODUCT_TECH.map((tech) => (
                <option key={tech}>{tech}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>

          <button type="button" className="sc-market-sort">
            {tLocal(COPY.newest)}
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeProductCardInner({ product, tLocal, onOpenProduct, isFavorited, onToggleFavorite }) {
  const isFree = product.pricingType === "free";
  const productId = getProductIdentity(product);
  const isKit = product?.tab === "kits";
  // eBooks / Cheat Sheets & Notes render a 3D book (BookProductPreview) instead of a
  // fill-cover screenshot. A book is a portrait object, so its card gets a
  // taller portrait media box — see `sc-code-card--ebook` in light-mode-fixes.css.
  const isLibraryProduct = isBookProduct(product);
  const title = tLocal({
    en: product.titleEn || product.title || "Untitled",
    zhCN: product.titleZh || product.titleEn || product.title || "未命名" });
  const description = tLocal({
    en: product.shortDescriptionEn || product.description || "",
    zhCN: product.shortDescriptionZh || product.descriptionZh || ""
  });
  const categoryLabel =
    CATEGORY_LABELS[product?.category]?.en || product?.category || "Code";
  const price = formatPrice(product);
  const posterUrl = getPreviewPosterUrl(product) || product?.posterImageUrl || "";
  const cardHasVideo = Boolean(getPreviewVideoUrl(product));
  const cardHasLivePreview = Boolean(
    product?.preview?.enabled ||
      product?.hasSource ||
      product?.demoPreview?.fullDocument ||
      product?.demoPreview?.html ||
      product?.demoPreview?.css ||
      (Array.isArray(product?.publicFiles) &&
        product.publicFiles.some(
          (file) => file && (file.language === "html" || file.language === "css")
        ))
  );
  const isPosterCard =
    Boolean(posterUrl) &&
    !cardHasVideo &&
    (product?.previewMode === "poster" || !cardHasLivePreview);

  // Dynamic aspect ratio from admin-configured design canvas dimensions.
  // Falls back to 1600×1100 for kits, 640×480 for components.
  const designW = Number(product?.designWidth || product?.preview?.width)  || (isKit ? 1600 : 640);
  const designH = Number(product?.designHeight || product?.preview?.height) || (isKit ? 1100 : 480);
  const previewAspect = `${designW} / ${designH}`;

  // --- Poster gallery.
  // getPreviewPosterUrl() already returns gallery[0], so the cover is what the
  // card has always shown. The remaining gallery images cycle on the card via
  // dots / swipe. Falls back to a single-image list when gallery is absent. ---
  const cardGallery = useMemo(() => {
    const images = normalizeGalleryField(product?.gallery);
    if (images.length) return images;
    return posterUrl ? [posterUrl] : [];
  }, [product?.gallery, posterUrl]);
  const [cardImageIndex, setCardImageIndex] = useState(0);
  const cardTouchX = useRef(null);
  // When the poster/gallery image 404s (e.g. its R2 file was removed), swap to
  // a branded gradient placeholder with the product title + category instead
  // of showing a broken-image icon.
  const [cardPosterFailed, setCardPosterFailed] = useState(false);
  // Drives the shimmer skeleton: hidden once the current image has painted so
  // slow R2 loads show a shimmer instead of a big empty gray box.
  const [cardPosterLoaded, setCardPosterLoaded] = useState(false);

  // Social-proof counters (Dribbble-style footer). Seeded from the catalog
  // payload; the like heart is optimistic and persisted in localStorage.
  const [cardViews, setCardViews] = useState(() => Number(product?.views) || 0);
  const [cardLikes, setCardLikes] = useState(() => Number(product?.likes) || 0);
  const [liked, setLiked] = useState(() => readLikedSet().has(productId));
  const likeBusyRef = useRef(false);

  // Re-sync counters/liked state after mount when the catalog payload refreshes
  // in the background or a load-more merge replaces the product object. The
  // card seeds state once in useState above, so without this effect a card first
  // mounted from a stale/0-count snapshot keeps showing 0 even after the fresh
  // D1-backed record arrives. Mirrors the detail modal resync effect; an
  // in-flight optimistic like is left untouched until its request resolves.
  useEffect(() => {
    if (!productId || likeBusyRef.current) return;
    setCardViews(Number(product?.views) || 0);
    setCardLikes(Number(product?.likes) || 0);
    setLiked(readLikedSet().has(productId));
  }, [productId, product?.views, product?.likes]);

  const toggleLike = useCallback(
    (event) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (likeBusyRef.current) return;
      const key = productId;
      const nextLiked = !liked;

      // Optimistic update + persist liked state locally.
      setLiked(nextLiked);
      setCardLikes((n) => Math.max(0, n + (nextLiked ? 1 : -1)));
      const likedSet = readLikedSet();
      if (nextLiked) likedSet.add(key); else likedSet.delete(key);
      writeLikedSet(likedSet);

      likeBusyRef.current = true;
      toggleSteaCodeProductLike(key, nextLiked ? "like" : "unlike")
        .then((res) => {
          if (res && typeof res.likes === "number") setCardLikes(res.likes);
        })
        .catch(() => {
          // Revert the optimistic change if the request failed.
          setLiked(!nextLiked);
          setCardLikes((n) => Math.max(0, n + (nextLiked ? -1 : 1)));
          const revert = readLikedSet();
          if (nextLiked) revert.delete(key); else revert.add(key);
          writeLikedSet(revert);
        })
        .finally(() => {
          likeBusyRef.current = false;
        });
    },
    [liked, productId]
  );

  // Save to Library (login-gated favorite). Parent opens the sign-in gate when
  // the user is signed out, then toggles the Worker-backed favorite record.
  const toggleFavorite = useCallback(
    (event) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (onToggleFavorite) onToggleFavorite(productId);
    },
    [onToggleFavorite, productId]
  );

  const activePoster = cardGallery[cardImageIndex] || posterUrl;
  // A new image (dot click / swipe) needs its own load state again.
  useEffect(() => {
    setCardPosterLoaded(false);
  }, [activePoster]);
  const cycleCardImage = useCallback(
    (dir) => {
      const len = cardGallery.length;
      if (len <= 1) return;
      setCardImageIndex((i) => (i + dir + len) % len);
    },
    [cardGallery.length]
  );

  // --- Motion: subtle lift on hover, press scale. Honors prefers-reduced-motion. ---
  const reduceMotion = useReducedMotion();

  const cardHover = reduceMotion
    ? {}
    : { y: -4, transition: { type: "spring", stiffness: 320, damping: 22, mass: 0.5 } };
  const cardTap = reduceMotion
    ? {}
    : { scale: 0.985, transition: { duration: 0.12 } };

  const EXTERNAL_REDIRECTS = {
    "premium-website-hero": "/book-a-call",
  };
  const externalUrl = EXTERNAL_REDIRECTS[product.slug] || EXTERNAL_REDIRECTS[productId];
  // Fall back to the portfolio "Live URL" when the dedicated Website URL is
  // empty, so a product with either field set shows the Visit Website link.
  const siteUrl = normalizeExternalUrl(product?.websiteUrl || product?.liveUrl);

  const openModal = useCallback(() => {
    if (externalUrl) {
      // internal page — same tab, so "Back to steacode" on the form returns home
      window.location.href = externalUrl;
      return;
    }
    if (typeof onOpenProduct === "function") onOpenProduct(product);
  }, [onOpenProduct, productId, externalUrl, product]);

  return (
    <motion.button
      type="button"
      className={`sc-code-card sc-code-card--v2 ${isFree ? "is-free" : "is-premium"}${isLibraryProduct ? " sc-code-card--ebook" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        openModal();
      }}
      whileHover={cardHover}
      whileTap={cardTap}
      aria-label={title}
      data-preview-product={productId}
      data-slug={product.slug || productId}
    >
      {/* Preview area — aspect ratio driven by product design canvas (designWidth / designHeight).
          Falls back to 640:480 (4:3) if admin dimensions aren't set. Edge-to-edge, no internal scroll. */}
      <div
        className={`sc-code-card__preview-wrap ${isPosterCard ? "is-poster-card" : ""}`}
      >
        {isPosterCard ? (
          <div
            className={`sc-card-poster-preview ${cardPosterLoaded ? "is-loaded" : "is-loading"}`}
            style={{ aspectRatio: previewAspect }}
            onTouchStart={(e) => {
              cardTouchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (cardTouchX.current == null) return;
              const dx = e.changedTouches[0].clientX - cardTouchX.current;
              if (Math.abs(dx) > 40) cycleCardImage(dx < 0 ? 1 : -1);
              cardTouchX.current = null;
            }}
          >
            {cardPosterFailed ? (
              <div
                className="sc-card-poster-fallback"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "radial-gradient(120% 80% at 50% 0%, rgba(245,166,35,0.14), rgba(15,23,42,0.00) 60%), linear-gradient(160deg, rgba(245,166,35,0.10), rgba(15,23,42,0.05))",
                  color: "rgba(148, 163, 184, 0.9)",
                  fontSize: "12px",
                  letterSpacing: "0.02em",
                  gap: "8px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <img
                  src="/stea-code-logo.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "28px", height: "28px", objectFit: "contain", opacity: 0.85 }}
                />
                <span
                  style={{
                    color: "rgba(226, 232, 240, 0.95)",
                    fontSize: "13px",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {title}
                </span>
                <span style={{ opacity: 0.88 }}>{categoryLabel}</span>
              </div>
            ) : (
              <img
                src={resizeImageUrl(activePoster, 600)}
                alt={title}
                loading="lazy"
                decoding="async"
                draggable={false}
                onLoad={() => setCardPosterLoaded(true)}
                onError={() => setCardPosterFailed(true)}
              />
            )}
            {cardGallery.length > 1 && (
              <div className="sc-card-gallery-dots" aria-hidden="true">
                {cardGallery.map((_, i) => (
                  <span
                    key={i}
                    className={`sc-card-gallery-dot ${i === cardImageIndex ? "is-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCardImageIndex(i);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="sc-code-card__preview">
            {isLibraryProduct ? (
              <div className="sc-product-preview-art" style={{ width: "100%", height: "100%" }}>
                {/* Renders the product's Card Cover HTML when the author pasted
                    one, otherwise its Sales Page HTML; falls back to a
                    "Preview coming soon" placeholder when it has neither. */}
                <LazyBookPreview product={product} mode="card" />
              </div>
            ) : (
              <div className="sc-product-preview-art">
                <ProductPreview product={product} fillMode="cover" cardZoom={product.cardZoom || "full"} offsetX={product.cardOffsetX || 0} offsetY={product.cardOffsetY || 0} interactive={false} preferVideo={true} cardPreview={true} />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Caption — category + title left, price/free right */}
      <div className="sc-code-card__caption">
        <div className="sc-code-card__caption-main">
          {externalUrl ? (
            <span className="sc-code-card__price-badge sc-code-card__cta-badge sc-code-card__logo-badge">
              <img src="/stea-code-logo.png" alt="steacode" draggable={false} loading="lazy" decoding="async" />
            </span>
          ) : (
            <p className="sc-code-card__category">{categoryLabel}</p>
          )}
          <h3 className="sc-code-card__title">{title}</h3>
          {/* Visit Website — only when the admin set a public websiteUrl.
              The whole card is a <button>, so the click is stopped here before
              it can bubble up and open the product modal. */}
          {siteUrl && (
            <a
              className="sc-code-card__site-link"
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              <span>{tLocal({ en: "Visit Website", zhCN: "访问网站" })}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          )}
        </div>
        {externalUrl ? (
          <span className="sc-code-card__price-badge sc-code-card__cta-badge">
            {tLocal({ en: "Book a Call", zhCN: "预约通话" })}
          </span>
        ) : (
          <span className={`sc-code-card__price-badge ${isFree ? "is-free" : "is-premium"}`}>
            {isFree ? tLocal({ en: "Free", zhCN: "免费" }) : price}
          </span>
        )}
      </div>

      {/* Social-proof footer — views (eye) left, likes (heart) right.
          The whole card is a <button>, so the like control stops propagation
          before it can bubble up and open the modal. */}
      <div
        className="sc-code-card__social"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "8px",
          padding: "0 2px",
          fontSize: "12px",
          color: "rgba(148, 163, 184, 0.9)",
        }}
      >
        <span
          className="sc-code-card__social-stat"
          title={tLocal({ en: "Views", zhCN: "浏览" })}
          style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
        >
          <Eye size={16} aria-hidden="true" />
          <span>{formatCount(cardViews)}</span>
        </span>
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "14px" }}
        >
          <span
            className={`sc-code-card__social-like ${liked ? "is-liked" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={liked}
            aria-label={liked ? tLocal({ en: "Unlike", zhCN: "取消点赞" }) : tLocal({ en: "Like", zhCN: "点赞" })}
            onClick={toggleLike}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                toggleLike(e);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              color: liked ? "#ef4444" : "rgba(148, 163, 184, 0.9)",
              fontWeight: liked ? 600 : 400,
            }}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
            <span>{formatCount(cardLikes)}</span>
          </span>
          <span
            className={`sc-code-card__social-save ${isFavorited ? "is-saved" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? tLocal({ en: "Remove from saved", zhCN: "取消收藏" }) : tLocal({ en: "Save to Library", zhCN: "收藏" })}
            onClick={toggleFavorite}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                toggleFavorite(e);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              color: isFavorited ? "#111827" : "rgba(148, 163, 184, 0.9)",
            }}
          >
            <Bookmark size={16} fill={isFavorited ? "currentColor" : "none"} aria-hidden="true" />
          </span>
        </span>
      </div>
    </motion.button>
  );
}

/*
 * Homepage approval is driven by the product homepageVisible field
 * (saved via Admin and filtered by GET /api/stea-code/catalog?scope=homepage&t=${Date.now()}).
 */
const NATIVE_PRODUCT_PREVIEWS = Object.freeze({});

function getProductIdentity(product) {
  return String(product?.id || product?.slug || "").trim();
}

// ============================================================
// Social-proof counters: liked state (localStorage) + viewed dedupe
// (sessionStorage) + compact count formatting.
// ============================================================

const LIKED_STORAGE_KEY = "steacode_liked_products";
const VIEWED_STORAGE_KEY = "steacode_viewed_products";

function readLikedSet() {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeLikedSet(set) {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* storage full / blocked — ignore */
  }
}

function readViewedSet() {
  try {
    const raw = sessionStorage.getItem(VIEWED_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeViewedSet(set) {
  try {
    sessionStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* storage blocked — ignore */
  }
}

/** Compact number: 999 → "999", 19,600 → "19.6k", 2,400,000 → "2.4m". */
function formatCount(value) {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  const m = n / 1_000_000;
  return `${m.toFixed(1).replace(/\.0$/, "")}m`;
}

/**
 * Normalize an admin-entered website URL into something safe to put in an
 * href. Bare hosts ("example.com") get an https:// scheme; anything that is
 * not http(s) (javascript:, data:, …) is rejected and returns "" so the
 * "Visit Website" button simply doesn't render.
 */
function normalizeExternalUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

/**
 * Resolve the preview video URL for a product.
 * Supports two sources:
 *   1. product.previewVideoUrl — direct external URL
 *   2. product.preview.videoKey — R2-stored file (served via /api/stea-code/media/)
 * Returns null if no video is available.
 */
function getPreviewVideoUrl(product) {
  if (!product) return null;
  // Direct URL takes priority
  if (product.previewVideoUrl && typeof product.previewVideoUrl === "string" && product.previewVideoUrl.trim()) {
    return product.previewVideoUrl.trim();
  }
  // R2 videoKey — served via public media endpoint
  const videoKey = product.preview?.videoKey;
  if (videoKey && typeof videoKey === "string" && videoKey.trim()) {
    return `/api/stea-code/media/${videoKey.trim()}`;
  }
  return null;
}

/**
 * Resolve the poster image URL for a product.
 * Supports product.preview.posterKey via R2 media endpoint.
 */
function getPreviewPosterUrl(product) {
  // Gallery cover image takes priority (first image = cover, set in Admin).
  const gallery = product?.gallery;
  const galleryCover = Array.isArray(gallery) && gallery.length ? gallery[0] : null;
  if (galleryCover && typeof galleryCover === "string" && galleryCover.trim()) {
    return galleryCover.trim();
  }
  const posterKey = product?.preview?.posterKey;
  if (posterKey && typeof posterKey === "string" && posterKey.trim()) {
    return `/api/stea-code/media/${posterKey.trim()}`;
  }
  return product?.posterImageUrl || null;
}

/**
 * Resolve the image URL used by the "Download Image" action. Priority:
 * gallery[0] (cover) → posterImageUrl → preview.posterKey media path.
 * Returns null when no image is available to download.
 */
function getProductImageUrl(product) {
  const gallery = product?.gallery;
  if (Array.isArray(gallery) && gallery.length && typeof gallery[0] === "string" && gallery[0].trim()) {
    return gallery[0].trim();
  }
  if (product?.posterImageUrl && typeof product.posterImageUrl === "string" && product.posterImageUrl.trim()) {
    return product.posterImageUrl.trim();
  }
  const posterKey = product?.preview?.posterKey;
  if (posterKey && typeof posterKey === "string" && posterKey.trim()) {
    return `/api/stea-code/media/${posterKey.trim()}`;
  }
  return null;
}

/**
 * Append Cloudflare/CDN image-resizing params to an image URL so the browser
 * never downloads a 2000px-wide JPEG into a 400px card.
 *
 * - Internal R2 media paths (/api/stea-code/media/...) get ?width/quality
 *   which the Worker's handleMedia now forwards to R2's native transform API.
 * - Absolute URLs (https://…) get the same params if they have no existing
 *   query string — Cloudflare Images / Cloudflare Image Resizing on the CDN
 *   will pick these up automatically.
 * - URLs that already have query params are left untouched so we don't
 *   accidentally overwrite a server-side parameter.
 * - Non-image file extensions (mp4, pdf, zip, …) are skipped.
 */
function resizeImageUrl(url, width = 600) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  if (!trimmed) return url;
  // Skip URLs that already have query params — we don't know what they mean.
  if (trimmed.includes("?")) return trimmed;
  // Only resize image-like URLs.
  const lower = trimmed.toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"];
  const looksLikeImage =
    imageExts.some((ext) => lower.includes(ext)) ||
    lower.startsWith("/api/stea-code/media/");
  if (!looksLikeImage) return trimmed;
  // Skip SVG — scaling vector images doesn't save bytes.
  if (lower.endsWith(".svg")) return trimmed;
  // Append params.
  return `${trimmed}?width=${width}&format=auto&quality=80`;
}

// Autoplay concurrency limit — max 3 videos autoplaying at once for CPU/battery
const MAX_CONCURRENT_AUTOPLAY = 4;
let activeAutoplayCount = 0;

// Detects whether the device supports hover (desktop/laptop). Touch devices return false.
function useCanHover() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return canHover;
}

function ProductVideoPreview({ videoUrl, posterUrl, title, playing, autoPlayWhenVisible = false, onVideoError }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Accessibility: never play for reduced-motion users.
  const noMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Data-saver: skip video playback entirely.
  const noData = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return Boolean(navigator.connection?.saveData);
  }, []);

  // Play/pause driven by the `playing` prop (hover state from the card).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadError) return;
    if (noMotion || noData) {
      video.pause();
      return;
    }
    if (playing && !document.hidden) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, loadError, noMotion, noData]);

  // Pause when the tab is hidden; resume only if still hovered.
  useEffect(() => {
    const onVis = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) {
        video.pause();
      } else if (playing && !noMotion && !noData) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [playing, noMotion, noData]);

  // Autoplay-when-visible: play when the card scrolls into the viewport,
  // pause when it scrolls out. Respects reduced-motion, saveData, and
  // touch devices. Capped at MAX_CONCURRENT_AUTOPLAY for CPU/battery.
  useEffect(() => {
    if (!autoPlayWhenVisible) return;
    if (typeof window === "undefined") return;

    const videoEl = videoRef.current;
    if (!videoEl || loadError) return;

    // Respect user preferences — same guards as hover play
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData) return;

    // Touch devices: don't autoplay (poster stays)
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (activeAutoplayCount < MAX_CONCURRENT_AUTOPLAY) {
              activeAutoplayCount += 1;
              videoEl.play().then(() => {
                setIsAutoPlaying(true);
              }).catch(() => {
                // Autoplay failed (browser policy, decode error) — release slot
                activeAutoplayCount = Math.max(0, activeAutoplayCount - 1);
                setIsAutoPlaying(false);
              });
            }
          } else {
            if (videoEl.dataset.autoplayActive === "1") {
              videoEl.pause();
              videoEl.dataset.autoplayActive = "";
              activeAutoplayCount = Math.max(0, activeAutoplayCount - 1);
              setIsAutoPlaying(false);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    // Mark when autoplay starts (after successful play)
    const onPlay = () => {
      if (videoEl.dataset.autoplayActive !== "1") {
        videoEl.dataset.autoplayActive = "1";
      }
    };
    videoEl.addEventListener("play", onPlay);

    observer.observe(videoEl);

    // If the element is already in view on mount, kick off autoplay immediately
    // instead of waiting for the next IntersectionObserver tick.
    try {
      const rect = videoEl.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const isInViewport =
        rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;
      const visibleRatio =
        Math.min(rect.bottom, vh) - Math.max(rect.top, 0) > rect.height * 0.5;
      if (isInViewport && visibleRatio && activeAutoplayCount < MAX_CONCURRENT_AUTOPLAY) {
        activeAutoplayCount += 1;
        videoEl.play().then(() => {
          setIsAutoPlaying(true);
        }).catch(() => {
          activeAutoplayCount = Math.max(0, activeAutoplayCount - 1);
          setIsAutoPlaying(false);
        });
      }
    } catch {
      // getBoundingClientRect can throw in edge cases — observer will handle it
    }

    return () => {
      observer.disconnect();
      videoEl.removeEventListener("play", onPlay);
      if (videoEl.dataset.autoplayActive === "1") {
        videoEl.pause();
        videoEl.dataset.autoplayActive = "";
        activeAutoplayCount = Math.max(0, activeAutoplayCount - 1);
        setIsAutoPlaying(false);
      }
    };
  }, [autoPlayWhenVisible, videoUrl, loadError]);

  // Poster is shown only as a fallback: when video errors, or when
  // reduced-motion / saveData prevent autoplay (poster-first experience).
  // For everyone else — video is the default state.
  const showPoster = loadError || noMotion || noData;

  if (loadError && !posterUrl) return null;
  // Both video and poster failed — nothing meaningful to render here; the
  // card-level fallbacks (live preview / branded placeholder) take over.
  if (loadError && posterError) return null;

  return (
    <div
      ref={containerRef}
      className="sc-preview-video-wrap"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        background: "#000",
        pointerEvents: "none",
      }}
    >
      {posterUrl && !posterError ? (
        <img
          src={posterUrl}
          alt={title || ""}
          loading="lazy"
          decoding="async"
          onError={() => setPosterError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            opacity: showPoster ? 1 : 0,
            transition: "opacity 0.25s ease",
            zIndex: 1,
          }}
        />
      ) : null}
      <video
        ref={videoRef}
        src={videoUrl}
        aria-label={title || "Product video preview"}
        muted
        loop
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onError={() => {
          setLoadError(true);
          if (typeof onVideoError === "function") onVideoError();
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          background: "#000",
          pointerEvents: "none",
          opacity: showPoster ? 0 : 1,
          transition: "opacity 0.25s ease",
          zIndex: 2,
        }}
      />
    </div>
  );
}

const ProductPreview = forwardRef(function ProductPreview({
  product,
  interactive = false,
  showControls = false,
  forceLiveDemo = false,
  preferVideo = false,
  fillMode = "cover",
  cardZoom = undefined,
  modalZoom = 1,
  offsetX = 0,
  offsetY = 0,
  hideToolbar = false,
  lazy = false,
  rootMargin = "0px",
  cardPreview = false,
}, ref) {
  const productId = getProductIdentity(product);
  const designW = Number(product?.designWidth || product?.preview?.width) || (product?.tab === "kits" ? 1600 : 0);
  const designH = Number(product?.designHeight || product?.preview?.height) || (product?.tab === "kits" ? 1100 : 0);
  const categoryLabel =
    CATEGORY_LABELS[product?.category]?.en || product?.category || "Code preview";
  const NativePreview = NATIVE_PRODUCT_PREVIEWS[productId];

  const videoUrl = getPreviewVideoUrl(product);
  const hasVideo = Boolean(videoUrl);
  const posterUrl = getPreviewPosterUrl(product) || "";

  // Layouts products render through the SAME data-driven decision tree below
  // (live iframe when HTML source / enabled preview exists → hover video →
  // poster → placeholder). A layouts product with live source (preview.enabled
  // or sourceCode) shows the interactive iframe like Components and Kits;
  // poster-only layouts fall through to the poster branch, and layouts with
  // neither get the branded placeholder. Do NOT force layouts to poster-only.
  // Card hover-to-play: poster by default, video on desktop hover.
  // If the video errors (404, codec), drop through to the live preview /
  // poster branches below.
  const canHover = useCanHover();
  const [isHovering, setIsHovering] = useState(false);
  const [cardVideoFailed, setCardVideoFailed] = useState(false);
  // When the poster image 404s (e.g. its R2 file was removed) the card swaps
  // to the branded gradient placeholder instead of a broken-image icon.
  const [posterFailed, setPosterFailed] = useState(false);

  // Priority 1: Native preview (if any registered)
  if (NativePreview) {
    return (
      <div
        className="sc-product-preview sc-product-preview-native"
        data-preview-product={productId}
        aria-label={categoryLabel + " preview"}
      >
        <div
          className={`sc-preview-art sc-native-preview ${interactive ? "is-interactive" : "is-static"}`}
          data-preview-product={productId}
        >
          <NativePreview
            key={`native-renderer-${productId}`}
            interactive={interactive}
          />
        </div>
      </div>
    );
  }

  // Priority 2 (cards): Hover-to-play video — poster image by default, video
  // plays muted/looping on desktop hover. Requires a poster; without one the
  // card falls through to the live preview below. forceLiveDemo (modal) skips.
  const showVideoPreview =
    Boolean(videoUrl) && Boolean(posterUrl) && !forceLiveDemo && !cardVideoFailed;
  if (showVideoPreview) {
    return (
      <div
        className="sc-product-preview sc-product-preview-video"
        data-preview-product={productId}
        onMouseEnter={() => {
          if (canHover) setIsHovering(true);
        }}
        onMouseLeave={() => {
          if (canHover) setIsHovering(false);
        }}
      >
        <div className="sc-preview-art" aria-label={categoryLabel + " video preview"}>
          <ProductVideoPreview
            key={`card-video-${productId}`}
            videoUrl={videoUrl}
            posterUrl={posterUrl}
            title={product?.titleEn || product?.titleZh || ""}
            playing={canHover && isHovering}
            autoPlayWhenVisible={true}
            onVideoError={() => setCardVideoFailed(true)}
          />
        </div>
      </div>
    );
  }

  // Priority 3: Live interactive code preview (the PRIMARY experience).
  // Users should touch and feel the running animation, not watch a video.
  // Video is demoted to a fallback only when no source/preview is available.
  // Eligibility: admin-published preview OR source files OR a bundled
  // demoPreview (seed products carry polished demoPreview.fullDocument so
  // they render live even before any backend/preview doc exists) OR free
  // products that ship publicFiles with html/css (e.g. Glow Button Effect,
  // Minimal Loader — their preview is assembled from the public files).
  const hasDemoPreview = Boolean(
    product?.demoPreview &&
      (product.demoPreview.html ||
        product.demoPreview.css ||
        product.demoPreview.javascript ||
        product.demoPreview.fullDocument ||
        product.demoPreview.jsx)
  );
  const hasPublicHtmlCss = Boolean(
    Array.isArray(product?.publicFiles) &&
      product.publicFiles.some(
        (f) => f && (f.language === "html" || f.language === "css")
      )
  );
  const useLivePreview = Boolean(
    product?.preview?.enabled ||
      product?.hasSource ||
      hasDemoPreview ||
      hasPublicHtmlCss
  );
  // Cards use "cover" — fills edge-to-edge, slight crop is fine.
  // Modal/detail uses "scale" (contain) — never crop an interactive demo.
  const previewFillMode = fillMode;
  if (useLivePreview) {
    return (
      <div
        className="sc-product-preview sc-product-preview-generic"
        data-preview-product={productId}
      >
        <div className="sc-preview-art" aria-label={categoryLabel}>
          <LazyLivePreview
            ref={ref}
            key={`live-preview-${productId}`}
            product={product}
            productId={productId}
            title={product?.titleEn || product?.titleZh || productId}
            category={product?.category || ""}
            interactive={interactive}
            lazy={lazy}
            fillMode={previewFillMode}
            cardZoom={cardZoom}
            modalZoom={modalZoom}
            designWidth={designW}
            designHeight={designH}
            offsetX={offsetX}
            offsetY={offsetY}
            showControls={showControls}
            hideToolbar={hideToolbar}
            rootMargin={rootMargin}
            placeholder={null}
            cardPreview={cardPreview}
          />
        </div>
      </div>
    );
  }

  // Priority 3: Preview video — only when no live code preview is available.
  if (hasVideo && !forceLiveDemo) {
    return (
      <div
        className="sc-product-preview sc-product-preview-video"
        data-preview-product={productId}
      >
        <div className="sc-preview-art" aria-label={categoryLabel + " video preview"}>
          <LazyLivePreview
            key={`video-preview-${productId}`}
            productId={productId}
            title={product?.titleEn || product?.titleZh || productId}
            category={product?.category || ""}
            interactive={interactive}
            lazy={lazy}
            fillMode={previewFillMode}
            cardZoom={cardZoom}
            modalZoom={modalZoom}
            designWidth={designW}
            designHeight={designH}
            offsetX={offsetX}
            offsetY={offsetY}
            showControls={showControls}
            videoUrl={videoUrl}
            posterUrl={getPreviewPosterUrl(product) || ""}
            rootMargin={rootMargin}
            placeholder={null}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="sc-product-preview sc-product-preview-generic"
      data-preview-product={productId}
    >
      <div className="sc-preview-art" aria-label={categoryLabel}>
        {useLivePreview ? (
          <LazyLivePreview
            ref={ref}
            key={`live-preview-${productId}`}
            productId={productId}
            title={product?.titleEn || product?.titleZh || productId}
            category={product?.category || ""}
            interactive={interactive}
            lazy={lazy}
            fillMode={previewFillMode}
            cardZoom={cardZoom}
            modalZoom={modalZoom}
            designWidth={designW}
            designHeight={designH}
            offsetX={offsetX}
            offsetY={offsetY}
            showControls={showControls}
            hideToolbar={hideToolbar}
            rootMargin={rootMargin}
            placeholder={null}
            cardPreview={cardPreview}
          />
        ) : product?.posterImageUrl && !posterFailed ? (
          <img
            src={resizeImageUrl(String(product.posterImageUrl), 600)}
            alt={product?.titleEn || product?.titleZh || productId || "Preview poster"}
            loading="lazy"
            decoding="async"
            className="sc-preview-poster-image"
            onError={() => setPosterFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              // Always show the full design (well-fit, like the admin panel).
              // Contain guarantees no cropping / "too big" zoom on any card.
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <div
            className="sc-preview-unavailable"
            aria-label={product?.titleEn || product?.titleZh || "Preview"}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(120% 80% at 50% 0%, rgba(245,166,35,0.12), rgba(15,23,42,0.00) 60%), linear-gradient(160deg, rgba(245,166,35,0.08), rgba(15,23,42,0.04))",
              borderRadius: "12px",
              color: "rgba(148, 163, 184, 0.9)",
              fontSize: "12px",
              letterSpacing: "0.02em",
              gap: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <img
              src="/stea-code-logo.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              loading="lazy"
              decoding="async"
              style={{ width: "28px", height: "28px", objectFit: "contain", opacity: 0.85 }}
            />
            <span
              style={{
                color: "rgba(226, 232, 240, 0.95)",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product?.titleEn || product?.titleZh || ""}
            </span>
            <span style={{ opacity: 0.88 }}>{categoryLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
});

function PackCard({ pack, tLocal }) {
  return (
    <article className="sc-pack-card">
      <div className={`sc-pack-art sc-pack-art-${pack.id}`}>
        {pack.id === "text-effects-mega-pack" ? <span>TYPE FX</span> : null}
        {pack.id === "saas-ui-kit-pack" ? <span className="sc-pack-dashboard"><i /><i /><i /></span> : null}
        {!["text-effects-mega-pack", "saas-ui-kit-pack"].includes(pack.id) ? <Package size={28} /> : null}
      </div>
      <h3>{tLocal({ en: pack.titleEn, zhCN: pack.titleZh })}</h3>
      <p>{tLocal({ en: pack.descriptionEn, zhCN: pack.descriptionZh })}</p>
      <div><span>{pack.productCount} {tLocal(COPY.products)}</span><strong>${pack.price}</strong></div>
      <button type="button">{tLocal(COPY.explorePack)}</button>
    </article>
  );
}

/**
 * Normalize the gallery field into a clean array of image URL strings.
 * Accepts an array or a JSON-encoded string (products.gallery is stored as
 * TEXT JSON in D1).
 */
function normalizeGalleryField(value) {
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string" && x.trim());
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      if (Array.isArray(p)) return p.filter((x) => typeof x === "string" && x.trim());
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

// Memoized so unrelated parent state changes (favorites, modal open, filters)
// don't re-render every card in the grid. Props are stable: openProduct and
// handleToggleFavorite are useCallback'd, tLocal is useMemo'd, product and the
// favorited flag are passed straight through.
const CodeProductCard = memo(CodeProductCardInner);

/**
 * Single hero image for Template / Mobile App / Poster products.
 *
 * Premium, simple: one large rounded hero. No thumbnails, no arrows, no
 * dots. Clicking opens the fullscreen lightbox. Gracefully handles a missing
 * image by showing nothing rather than a broken <img>.
 */
function HeroImageInner({ image, title, onOpenLightbox }) {
  if (!image) return null;
  // Detail page hero is typically viewed at ~72vh tall. Request a 1200px-wide
  // variant — plenty of resolution without the megabytes.
  const resized = resizeImageUrl(image, 1200);
  return (
    <button
      type="button"
      className="sc-hero-image"
      onClick={() => onOpenLightbox?.(0)}
      aria-label="Open image fullscreen"
    >
      <img
        src={resized}
        alt={`${title || "Product"} preview`}
        className="sc-hero-image-img"
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </button>
  );
}

const HeroImage = memo(HeroImageInner);

/**
 * Fullscreen lightbox with zoom for the "View full page" experience.
 */
function Lightbox({ images, index, onClose }) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const img = images[index];
  if (!img) return null;
  return (
    <motion.div
      className="sc-lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="sc-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img
          src={img}
          alt="Full page view"
          decoding="async"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          onClick={() => setZoom((z) => (z >= 1.5 ? 1 : z + 0.5))}
        />
        <div className="sc-lightbox-toolbar">
          <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} aria-label="Zoom in">＋</button>
          <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} aria-label="Zoom out">－</button>
          <button type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
    </motion.div>
  );
}

function ProductDetail({
  product,
  allProducts,
  onOpenProduct,
  onClose,
  tLocal,
  isFavorited,
  onToggleFavorite,
  entitlements,
  onOpenUnlockModal,
  onReadEbook,
}) {
  const { user: accessUser } = useCloudflareAuth();

  // "You might also like" — up to 4 real products from the same category,
  // excluding the currently opened product.
  const relatedProducts = useMemo(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    const currentId = getProductIdentity(product);
    return list
      .filter(
        (p) =>
          p?.category === product?.category &&
          getProductIdentity(p) !== currentId &&
          !!(p.titleEn || p.titleZh || p.title)
      )
      .slice(0, 4);
  }, [allProducts, product]);
  const previewRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageDownloaded, setImageDownloaded] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);
  const [copiedRepo, setCopiedRepo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [premiumAccess, setPremiumAccess] = useState({
    loading: false,
    allowed: false,
    licenseType: "",
    files: [],
    error: "",
  });
  const [freeRemoteFiles, setFreeRemoteFiles] = useState([]);
  const [freeRemoteLoading, setFreeRemoteLoading] = useState(false);
  const [freeRemoteError, setFreeRemoteError] = useState("");
  const [toast, setToast] = useState(null);
  // eBook buyers: the optional pre-built PDF/ZIP URL. It is PAID data, so it is
  // not part of the public product payload — it is fetched from the
  // entitlement-gated /book-content endpoint once the user has access.
  const [ebookDownloadUrl, setEbookDownloadUrl] = useState("");
  const [detailMediaMode, setDetailMediaMode] = useState(
    getPreviewVideoUrl(product) ? "video" : "demo"
  );
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const sourceMenuRef = useRef(null);
  // Tracks a poster URL that failed to load, so the modal can fall back to the
  // clean placeholder instead of rendering a broken image icon.
  const [failedPosterUrl, setFailedPosterUrl] = useState("");
  // Preview overlay action: Refresh remounts the preview via a key change on
  // PreviewErrorBoundary. Save (favorite) lives in the metrics row below the
  // title, mirroring the homepage card.
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // Public social-proof counters for the detail page. Seeded from the product
  // payload (homepage catalog or the D1-backed detail endpoint); the like
  // heart is optimistic and persisted in localStorage, mirroring the cards.
  const detailProductId = getProductIdentity(product);
  const [detailViews, setDetailViews] = useState(() => Number(product?.views) || 0);
  const [detailLikes, setDetailLikes] = useState(() => Number(product?.likes) || 0);
  const [detailLiked, setDetailLiked] = useState(() => readLikedSet().has(detailProductId));
  const detailLikeBusyRef = useRef(false);

  // Sync local counters/liked state once the full product detail hydrates
  // (deep-link placeholder → loaded record) without clobbering an in-flight
  // optimistic like.
  useEffect(() => {
    if (!detailProductId) return;
    setDetailViews(Number(product?.views) || 0);
    setDetailLikes(Number(product?.likes) || 0);
    setDetailLiked(readLikedSet().has(detailProductId));
  }, [detailProductId, product?.views, product?.likes]);

  const toggleDetailLike = useCallback(
    (event) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (detailLikeBusyRef.current) return;
      const key = detailProductId;
      const nextLiked = !detailLiked;

      // Optimistic update + persist liked state locally.
      setDetailLiked(nextLiked);
      setDetailLikes((n) => Math.max(0, n + (nextLiked ? 1 : -1)));
      const likedSet = readLikedSet();
      if (nextLiked) likedSet.add(key); else likedSet.delete(key);
      writeLikedSet(likedSet);

      detailLikeBusyRef.current = true;
      toggleSteaCodeProductLike(key, nextLiked ? "like" : "unlike")
        .then((res) => {
          if (res && typeof res.likes === "number") setDetailLikes(res.likes);
        })
        .catch(() => {
          // Revert the optimistic change if the request failed.
          setDetailLiked(!nextLiked);
          setDetailLikes((n) => Math.max(0, n + (nextLiked ? -1 : 1)));
          const revert = readLikedSet();
          if (nextLiked) revert.delete(key); else revert.add(key);
          writeLikedSet(revert);
        })
        .finally(() => {
          detailLikeBusyRef.current = false;
        });
    },
    [detailLiked, detailProductId]
  );
  // Affiliate funnel: after a successful copy, slide up the Runable AI
  // bottom-sheet. copiedType drives the dynamic subtext ("code" | "image").
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [copiedType, setCopiedType] = useState("code");

  useEffect(() => {
    if (!sourceMenuOpen) return;
    function handlePointerDown(e) {
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(e.target)) {
        setSourceMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSourceMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sourceMenuOpen]);

  const detailVideoUrl = getPreviewVideoUrl(product);
  const hasVideo = Boolean(detailVideoUrl);

  const galleryImages = useMemo(
    () => normalizeGalleryField(product?.gallery),
    [product?.gallery]
  );

  // Reset gallery position when a different product is opened.
  useEffect(() => {
    setGalleryIndex(0);
    setLightboxOpen(false);
  }, [product?.id, product?.slug]);

  const detailPosterUrl = getPreviewPosterUrl(product) || "";
  const showDetailPoster =
    Boolean(detailPosterUrl) && failedPosterUrl !== detailPosterUrl;
  const isPosterOnly =
    Boolean(detailPosterUrl) &&
    !hasVideo &&
    galleryImages.length <= 1 &&
    (product?.previewMode === "poster" ||
      (!product?.preview?.enabled &&
        !product?.hasSource &&
        !product?.demoPreview));
  const isLayoutFullPreview =
    !isPosterOnly &&
    !hasVideo &&
    galleryImages.length <= 1 &&
    product?.tab === "layouts" &&
    Boolean(product?.preview?.enabled);
  const useFullMediaLayout = isPosterOnly || isLayoutFullPreview;

  // The live interactive preview is the fallback branch of the media chain:
  // it renders when there is no multi-image gallery, no poster-only mode,
  // no video, and no working poster image.
  const livePreviewActive =
    galleryImages.length <= 1 &&
    !isPosterOnly &&
    !hasVideo &&
    !showDetailPoster;
  const livePreviewAspect = isLayoutFullPreview
    ? `${product?.preview?.width || product?.designWidth || 1440} / ${product?.preview?.height || product?.designHeight || 1200}`
    : `${product?.designWidth || product?.preview?.width || (product?.tab === "kits" ? 1600 : 640)} / ${product?.designHeight || product?.preview?.height || (product?.tab === "kits" ? 1100 : 480)}`;

  // eBook / Cheat Sheets & Notes products render the 3D book sales page
  // (BookProductPreview). `tab === "library"` is the legacy signal, kept so a
  // stale cached catalog response (which may predate the productType column)
  // still renders right.
  const isLibraryProduct = isBookProduct(product);

  // Public marketing site for this product, set in the admin panel.
  const modalSiteUrl = normalizeExternalUrl(product?.websiteUrl);

  // Portfolio "Live URL" — a separate admin field. Hidden when it points at the
  // same address as Website URL, otherwise the action list shows two identical
  // links ("Visit Website" + "View Live Site").
  const modalLiveUrl = normalizeExternalUrl(product?.liveUrl);
  const showLiveSiteAction = Boolean(modalLiveUrl) && modalLiveUrl !== modalSiteUrl;

  // "Copy Source Code" is only meaningful when the product actually has code.
  // The public product payload strips sourceCode / publicFiles / preview HTML,
  // so the client cannot detect this itself — the worker resolves it and sends
  // `hasSource` (see resolveHasSource in workers/stea-api/src/routes/catalog.ts).
  // A missing flag (stale cached payload) falls back to the old behaviour
  // rather than hiding the button from every product.
  const canCopySource = !isLibraryProduct && product?.hasSource !== false;

  // Default to video tab when product has a video, otherwise live demo.
  // Reset when the product changes (user clicks a different card).
  useEffect(() => {
    setDetailMediaMode(detailVideoUrl ? "video" : "demo");
  }, [product?.id, product?.slug, detailVideoUrl]);

  useEffect(() => {
    let active = true;

    async function loadPremiumAccess() {
      const productId = String(product?.id || product?.slug || "").trim();

      /*
       * SECURITY:
       * Never keep entitlement/files from the previously-opened product.
       *
       * Product A may be purchased while Product B is not.
       * Reset protected state BEFORE starting Product B's access request,
       * otherwise Product A's code can flash for a moment.
       */
      if (active) {
        setPremiumAccess({
          loading: Boolean(
            product &&
            product.pricingType === "premium" &&
            productId
          ),
          allowed: false,
          licenseType: "",
          files: [],
          error: "",
        });
      }

      if (!product || product.pricingType !== "premium" || !productId) {
        return;
      }

      const user = accessUser;

      if (!user) {
        if (active) {
          setPremiumAccess({
            loading: false,
            allowed: false,
            licenseType: "",
            files: [],
            error: "",
          });
        }
        return;
      }

      try {
        await getSteaCodeProductAccess(productId);
        const contentResult = await getSteaCodeProductContent(productId);

        if (!active) return;

        setPremiumAccess({
          loading: false,
          allowed: Boolean(contentResult?.access),
          licenseType:
            contentResult?.entitlement?.licenseType || "personal",
          files: Array.isArray(contentResult?.product?.files)
            ? contentResult.product.files
            : [],
          error: "",
        });
      } catch (error) {
        if (!active) return;

        const denied =
          error?.code === "ACCESS_DENIED" ||
          error?.status === 403;

        setPremiumAccess({
          loading: false,
          allowed: false,
          licenseType: "",
          files: [],
          error: denied ? "" : "Could not verify your purchase.",
        });
      }
    }

    loadPremiumAccess();

    return () => {
      active = false;
    };
  }, [product?.id, product?.slug, product?.pricingType]);

  useEffect(() => {
    let active = true;

    const productId = String(
      product?.id || product?.slug || ""
    ).trim();

    setFreeRemoteFiles([]);
    setFreeRemoteError("");
    setFreeRemoteLoading(false);

    if (
      !productId ||
      product?.pricingType !== "free" ||
      (
        typeof product?.sourceCode === "string" &&
        product.sourceCode.trim()
      )
    ) {
      return () => {
        active = false;
      };
    }

    const user = accessUser;

    if (!user) {
      return () => {
        active = false;
      };
    }

    setFreeRemoteLoading(true);

    getSteaCodeFreeProductContent(productId)
      .then((result) => {
        if (!active) return;

        setFreeRemoteFiles(
          Array.isArray(result?.product?.files)
            ? result.product.files
            : []
        );
      })
      .catch((error) => {
        if (!active) return;

        setFreeRemoteError(
          error?.message || "Could not load free code."
        );
      })
      .finally(() => {
        if (active) {
          setFreeRemoteLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    product?.id,
    product?.slug,
    product?.pricingType,
    product?.sourceCode,
  ]);

  if (!product) return null;
  if (typeof document === "undefined") return null;

  const isPremium = false; // 100% free pivot — no product is gated by payment.
  const isFree = !isPremium;

  // Build copyable source HTML from product.sourceCode or product.deliverablesSource
  const parsedSource = useMemo(() => {
    const raw = product?.sourceCode || product?.deliverablesSource;
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        return { fullDocument: raw };
      }
      return { fullDocument: raw };
    }
    return null;
  }, [product?.sourceCode, product?.deliverablesSource]);

  const isSplitSource = useMemo(() => {
    if (!parsedSource || typeof parsedSource !== 'object') return false;
    const hasHtml = Boolean(parsedSource.html && typeof parsedSource.html === 'string' && parsedSource.html.trim());
    const hasCss = Boolean(parsedSource.css && typeof parsedSource.css === 'string' && parsedSource.css.trim());
    const hasJs = Boolean(parsedSource.javascript && typeof parsedSource.javascript === 'string' && parsedSource.javascript.trim());
    const hasJsx = Boolean(parsedSource.jsx && typeof parsedSource.jsx === 'string' && parsedSource.jsx.trim());
    const count = [hasHtml, hasCss, hasJs, hasJsx].filter(Boolean).length;
    return count >= 2;
  }, [parsedSource]);

  const sourceCodeHtml = useMemo(() => {
    if (!parsedSource) return '';
    if (parsedSource.fullDocument && typeof parsedSource.fullDocument === 'string' && parsedSource.fullDocument.trim()) {
      return parsedSource.fullDocument;
    }
    const { html = '', css = '', javascript = '', jsx = '' } = parsedSource;
    if (!html && !css && !javascript && !jsx) return '';
    if (jsx && !html) {
      return css ? `/* Styles */\n${css}\n\n${jsx}` : jsx;
    }
    const hasDoctype = typeof html === 'string' && html.trim().toLowerCase().startsWith('<!doctype');
    if (hasDoctype) {
      return html
        .replace('</head>', `<style>${css}</style></head>`)
        .replace('</body>', `<script>${javascript}</script></body>`);
    }
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Component</title>
<style>${css}</style></head>
<body>${html}<script>${javascript}</script></body></html>`;
  }, [parsedSource]);

  const hasFreeSource = isFree && sourceCodeHtml.trim().length > 0;

  // Download ZIP is available for free products (always) and premium
  // products the user owns (entitlement verified). Premium non-owners
  // never see the download button — they must purchase first.
  const canDownload = isFree || (isPremium && premiumAccess.allowed);

  const title = tLocal(label(product, "titleEn", "titleZh"));
  const detailPreviewInteractive = Boolean(
    product.preview?.enabled ||
    product.hasSource ||
    NATIVE_PRODUCT_PREVIEWS[getProductIdentity(product)]
  );

  const description =
    tLocal(label(product, "shortDescriptionEn", "shortDescriptionZh")) ||
    product.description ||
    product.shortDescriptionEn ||
    product.shortDescription ||
    "";

  const craftNote =
    tLocal(label(product, "craftNoteEn", "craftNoteZh")) ||
    product.craftNoteEn ||
    product.craftNote ||
    "";

  const hasLiveDemo = Boolean(
    product.preview?.enabled ||
    NATIVE_PRODUCT_PREVIEWS[getProductIdentity(product)]
  );

  const allTags = useMemo(() => {
    const rawTags = Array.isArray(product?.tags)
      ? product.tags
      : typeof product?.tags === "string"
      ? product.tags.split(",")
      : [];
    const rawFrameworks = Array.isArray(product?.frameworks)
      ? product.frameworks
      : typeof product?.frameworks === "string"
      ? product.frameworks.split(",")
      : [];
    return [
      ...new Set(
        [...rawTags, ...rawFrameworks]
          .map((t) => String(t).trim())
          .filter(Boolean)
      ),
    ];
  }, [product?.tags, product?.frameworks]);

  const { user: currentUser } = useCloudflareAuth();

  const activeUser = currentUser;
  const isSignedIn = Boolean(activeUser);

  // Gate click handler — saves pending action and opens auth without tracking
  const handleGateAction = useCallback((actionType) => {
    const productId = String(product?.id || product?.slug || "").trim();
    try {
      sessionStorage.setItem("stea_pending_action", JSON.stringify({
        type: actionType,
        productId,
      }));
    } catch (err) {
      console.warn("Failed saving pending action:", err);
    }
    window.dispatchEvent(new Event("open-auth"));
  }, [product]);

  const handlePremiumBuy = () => {
    if (!isSignedIn) {
      handleGateAction("unlock");
      return;
    }
    onOpenUnlockModal?.();
  };

  // Premium access gating (entitlements)
  const productPrice = Number(product?.price || 0);
  const hasProLifetime = entitlements?.hasProLifetime === true;
  const ownsThisProduct = entitlements?.productIds?.has?.(product?.id) === true;
  const hasAccess = !isPremium || hasProLifetime || ownsThisProduct;

  // Shared copy-to-clipboard helper.
  // 1. Try the async Clipboard API (secure origins only, needs a user gesture).
  // 2. On ANY failure (NotAllowedError, insecure http://, missing permission,
  //    missing API, iOS quirks) fall back to the legacy execCommand path.
  // Every failure is logged so the cause is visible in the console.
  const safeCopyToClipboard = useCallback(async (text) => {
    const value = String(text ?? "");
    if (!value.trim()) {
      throw new Error("EMPTY_CONTENT");
    }

    if (navigator.clipboard?.writeText && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return "clipboard";
      } catch (err) {
        console.error("[copy] navigator.clipboard.writeText failed — falling back to execCommand:", err);
      }
    } else {
      console.warn(
        "[copy] Clipboard API unavailable (insecure context or unsupported browser) — using execCommand fallback"
      );
    }

    // Legacy fallback. Works on http:// and when clipboard permission is denied.
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);

    const selection = typeof document.getSelection === "function" ? document.getSelection() : null;
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    let success = false;
    try {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, value.length);
      success = document.execCommand("copy");
    } catch (err) {
      console.error("[copy] execCommand('copy') threw:", err);
    } finally {
      ta.remove();
      if (previousRange && selection) {
        selection.removeAllRanges();
        selection.addRange(previousRange);
      }
    }

    if (!success) {
      throw new Error("EXEC_COMMAND_FAILED");
    }
    return "execCommand";
  }, []);

  // Shared success handlers — fire ONLY when copy/download succeeds.
  // 100% free pivot: copying is NOT gated by sign-in. `user` is optional and
  // only used to attach an email to the analytics event when available.
  const handleCopySourceSuccess = useCallback(() => {
    const user = currentUser;
    setCopiedCode(true);
    recordSteaCodeCopy(getProductIdentity(product));
    void trackUserEvent("copy", {
      productId: getProductIdentity(product),
      productSlug: product?.slug || "",
      email: user?.email || "",
    });
    setToast({ type: "success", message: "Source code copied" });
    setTimeout(() => setCopiedCode(false), 2200);
    setTimeout(() => setToast(null), 2600);
    // Affiliate funnel: prompt the user to build with Runable AI.
    setCopiedType("code");
    setShowAffiliateModal(true);
  }, [product, currentUser]);

  const handleDownloadSuccess = useCallback((pid) => {
    const cleanId = pid || getProductIdentity(product);
    void trackUserEvent("download", {
      productId: cleanId,
      productSlug: product?.slug || "",
      email: (currentUser)?.email || "",
    });
  }, [product, currentUser]);

  // Action executors — no sign-in gate (100% free pivot).

  // Source blobs are stripped from the catalog payload (see
  // workers/stea-api/src/routes/catalog.ts) and fetched per product on demand,
  // so cache the last fetch to avoid re-downloading on repeated copy clicks.
  const remoteSourceRef = useRef({ id: "", text: "" });

  const fetchCopyableSource = useCallback(async () => {
    const pid = String(product?.id || product?.slug || "").trim();
    if (!pid) return "";
    if (remoteSourceRef.current.id === pid && remoteSourceRef.current.text) {
      return remoteSourceRef.current.text;
    }
    const data = isFree
      ? await getSteaCodeFreeProductContent(pid)
      : await getSteaCodeProductContent(pid);
    const files = Array.isArray(data?.product?.files) ? data.product.files : [];
    let text = "";
    if (files.length === 1) {
      text = String(files[0]?.content || "");
    } else if (files.length > 1) {
      // Prefer a complete HTML document when the bundle has one, otherwise
      // concatenate every file with a labelled header.
      const doc = files.find(
        (f) =>
          /\.html?$/i.test(String(f?.name || "")) &&
          /<html|<!doctype|<\/body>/i.test(String(f?.content || ""))
      );
      text = doc
        ? String(doc.content || "")
        : files
            .filter((f) => String(f?.content || "").trim())
            .map((f) => `/* ===== ${f?.name || "file"} ===== */\n${f?.content || ""}`)
            .join("\n\n");
    }
    text = text.trim();
    remoteSourceRef.current = { id: pid, text };
    return text;
  }, [product?.id, product?.slug, isFree]);

  const executeCopySource = useCallback(async () => {
    try {
      let text = sourceCodeHtml;
      // Data validation: the inline source may be absent because the catalog
      // payload strips it, so fetch per-product content before giving up.
      if (!text || !text.trim()) {
        text = await fetchCopyableSource();
      }
      if (!text || !text.trim()) {
        console.error("Code is undefined");
        setToast({ type: "error", message: "No source available" });
        setTimeout(() => setToast(null), 2600);
        return;
      }
      await safeCopyToClipboard(text);
      handleCopySourceSuccess();
    } catch (err) {
      console.error("[copy-source] failed:", err);
      setToast({ type: "error", message: "Copy failed" });
      setTimeout(() => setToast(null), 2600);
    }
  }, [sourceCodeHtml, fetchCopyableSource, safeCopyToClipboard, handleCopySourceSuccess]);

  const executeDownload = useCallback(async (pid) => {
    const user = currentUser;
    if (!user) {
      handleGateAction("download");
      return;
    }
    const cleanId = pid || getProductIdentity(product);
    setDownloading(true);
    try {
      await downloadSteaCodeSource(cleanId);
      handleDownloadSuccess(cleanId);
    } catch (err) {
      console.error("[download] failed:", err);
      setToast({ type: "error", message: err?.message || "Download failed" });
      setTimeout(() => setToast(null), 2600);
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  }, [currentUser, handleGateAction, product, handleDownloadSuccess, setToast]);

  // Button click handlers — 100% free pivot: no sign-in gate. Any visitor
  // reaches the clipboard logic; `hasAccess` only ever blocks premium
  // products the user has not bought (currently none).
  const handleCopySourceClick = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!hasAccess) {
      onOpenUnlockModal?.();
      return;
    }
    executeCopySource();
  }, [hasAccess, onOpenUnlockModal, executeCopySource]);

  // ── Copy Image (Layouts / poster-based + free products) ────────
  // Suffix that tracks whether the "Copy Image" action fell back to a real
  // download because the browser blocked the async clipboard write. Used to
  // pick the right toast ("Image Copied!" vs "Image saved to downloads!").
  const [copyImageFellBack, setCopyImageFellBack] = useState(false);

  const handleCopyImageSuccess = useCallback((fellBack = false) => {
    const user = currentUser;
    if (!user) {
      handleGateAction("copy-image");
      return;
    }
    setImageDownloaded(true);
    setCopyImageFellBack(fellBack);
    void trackUserEvent(fellBack ? "download" : "copy", {
      productId: getProductIdentity(product),
      productSlug: product?.slug || "",
      email: user?.email || "",
      kind: "image",
      fellBack: fellBack ? true : undefined,
    });
    setToast({
      type: "success",
      message: fellBack ? "Image saved to your downloads!" : "Image Copied!",
    });
    setTimeout(() => setImageDownloaded(false), 2200);
    setTimeout(() => setCopyImageFellBack(false), 2200);
    setTimeout(() => setToast(null), 3200);
    // Affiliate funnel
    setCopiedType("image");
    setShowAffiliateModal(true);
  }, [product, currentUser, handleGateAction]);

  const executeCopyImage = useCallback(async () => {
    const user = currentUser;
    if (!user) {
      handleGateAction("copy-image");
      return;
    }
    const imageUrl = getProductImageUrl(product);
    if (!imageUrl) {
      setToast({ type: "error", message: "No image available for this product." });
      setTimeout(() => setToast(null), 3200);
      return;
    }
    const baseName = product?.titleEn || product?.title || product?.slug || "steacode-image";
    setImageDownloading(true);
    try {
      await copyImageToClipboard(imageUrl);
      handleCopyImageSuccess(false);
    } catch (err) {
      // Clipboard blocked (cross-origin R2, permissions, or missing API).
      // Fall back to a real file download so the user still gets the asset.
      console.warn("[copy-image] clipboard blocked — falling back to download:", err);
      try {
        await downloadImageFile(imageUrl, baseName);
        handleCopyImageSuccess(true);
      } catch (fallbackErr) {
        console.error("[copy-image] fallback download also failed:", fallbackErr);
        setToast({
          type: "error",
          message: "Couldn't copy or download the image. Right-click instead.",
        });
        setTimeout(() => setToast(null), 3600);
      }
    } finally {
      setImageDownloading(false);
    }
  }, [currentUser, handleGateAction, product, handleCopyImageSuccess]);

  const handleCopyImageClick = useCallback((e) => {
    e.stopPropagation();
    const user = currentUser;
    if (!user) {
      handleGateAction("copy-image");
      return;
    }
    if (!isFree && !hasAccess) {
      onOpenUnlockModal?.();
      return;
    }
    executeCopyImage();
  }, [currentUser, isFree, hasAccess, handleGateAction, onOpenUnlockModal, executeCopyImage]);

  const handleDownloadClick = useCallback((e) => {
    e.stopPropagation();
    if (!isSignedIn) {
      handleGateAction("download");
      return;
    }
    if (!hasAccess) {
      onOpenUnlockModal?.();
      return;
    }
    executeDownload();
  }, [isSignedIn, hasAccess, handleGateAction, onOpenUnlockModal, executeDownload]);

  // eBooks (Library) — "Read" opens the dark reader; non-owners hit the unlock modal.
  const handleReadClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!hasAccess) {
        onOpenUnlockModal?.();
        return;
      }
      onReadEbook?.(product);
    },
    [hasAccess, onOpenUnlockModal, onReadEbook, product]
  );

  // eBook buyers: resolve the optional pre-built PDF/ZIP. Quietly no-ops for
  // non-eBooks or users without access (the endpoint returns 403/401).
  useEffect(() => {
    let cancelled = false;
    if (!isLibraryProduct || !hasAccess) {
      setEbookDownloadUrl("");
      return;
    }
    const identity = product?.slug || product?.id;
    if (!identity) return;
    getSteaCodeEbookContent(identity)
      .then((res) => {
        if (!cancelled) setEbookDownloadUrl(res?.product?.bookDownloadUrl || "");
      })
      .catch(() => {
        if (!cancelled) setEbookDownloadUrl("");
      });
    return () => { cancelled = true; };
  }, [isLibraryProduct, hasAccess, product?.slug, product?.id]);

  // "Save Offline" — a pre-built file downloads directly. Otherwise there is
  // nothing to hand over: the book is an interactive course rendered one stage
  // at a time, so printing this page would only ever capture the product page.
  // Send the user to the reader instead, where "Save Book" prints the pass.
  // Mirrors handleReadClick, so non-owners still get the unlock modal.
  const handleDownloadBook = useCallback(
    (e) => {
      e.stopPropagation();
      if (ebookDownloadUrl) {
        window.location.href = ebookDownloadUrl;
        return;
      }
      if (!hasAccess) {
        onOpenUnlockModal?.();
        return;
      }
      onReadEbook?.(product);
    },
    [ebookDownloadUrl, hasAccess, onOpenUnlockModal, onReadEbook, product]
  );

  // Resume pending action on mount or when user authenticates
  useEffect(() => {
    if (!currentUser) return;
    try {
      const raw = sessionStorage.getItem("stea_pending_action");
      if (!raw) return;
      const pending = JSON.parse(raw);
      const currentPid = getProductIdentity(product);
      if (pending && pending.productId === currentPid) {
        sessionStorage.removeItem("stea_pending_action");
        if (pending.type === "copy-source") {
          executeCopySource();
        } else if (pending.type === "copy-image") {
          executeCopyImage();
        } else if (pending.type === "download") {
          executeDownload(currentPid);
        } else if (pending.type === "unlock") {
          // Small delay so the sign-in modal closes before the unlock modal opens
          setTimeout(() => {
            onOpenUnlockModal?.();
          }, 180);
        }
      }
    } catch (err) {
      console.warn("Failed resuming pending action in ProductDetail:", err);
    }
  }, [currentUser, product, executeCopySource, executeCopyImage, executeDownload, onOpenUnlockModal]);

  const reduceMotion = useReducedMotion();

  return createPortal(
    <motion.div
      className="sc-product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sc-product-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0.08 } : { duration: 0.12, ease: "easeOut" }}
    >
      <motion.button
        className="sc-product-modal-bg"
        onClick={onClose}
        aria-label={tLocal({ en: "Close product", zhCN: "关闭产品" })}
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={reduceMotion ? { duration: 0.1 } : { duration: 0.15, ease: "easeOut" }}
      />

      <motion.section
        className={`sc-product-modal-panel sc-premium-product-detail ${useFullMediaLayout ? "is-full-media-modal" : ""} ${isPosterOnly ? "is-poster-modal" : ""}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      >
        <div className={`sc-product-detail-media ${isPosterOnly ? "is-poster-only" : ""} ${isLayoutFullPreview ? "is-live-full" : ""}`}>
          <div className="sc-modal-clean-header">
            <button
              type="button"
              className="sc-btn-back-premium"
              onClick={onClose}
              aria-label={tLocal({ en: "Back", zhCN: "返回" })}
            >
              <ArrowLeft size={16} />
              <span>{tLocal({ en: "Back", zhCN: "返回" })}</span>
            </button>
          </div>

          {/* Preview actions: Refresh / Like / Save — floated in the modal's
              top-right white space (anchored to .sc-product-detail-media),
              OUTSIDE the preview shell so they never cover the template UI.
              Refresh remounts the preview via the key on PreviewErrorBoundary. */}
          <div className="sc-detail-preview-actions">
            {/* Refresh only makes sense for live/HTML previews — hide it
                for static poster images, which have nothing to restart. */}
            {!isPosterOnly && (
              <button
                type="button"
                className="sc-preview-action-btn"
                aria-label="Refresh preview"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setPreviewRefreshKey((k) => k + 1);
                }}
              >
                <RotateCw size={16} />
              </button>
            )}
          </div>

          <div
            className={`sc-product-detail-preview-shell ${isPosterOnly ? "is-poster-preview" : ""} ${livePreviewActive ? "is-live-preview" : ""} ${isLibraryProduct ? "is-library-preview" : ""}`}
            style={isLibraryProduct ? { "--preview-aspect": "4 / 5" } : livePreviewActive ? { "--preview-aspect": livePreviewAspect } : undefined}
          >
            <PreviewErrorBoundary key={previewRefreshKey}>
              {isLibraryProduct ? (
                <div className="sc-ebook-detail-preview">
                  <LazyBookPreview
                    key={`detail-ebook-${getProductIdentity(product)}`}
                    product={product}
                    mode="detail"
                    onBuy={() => onOpenUnlockModal?.()}
                  />
                </div>
              ) : galleryImages[0] || product?.posterImageUrl || detailPosterUrl || product?.preview?.posterKey ? (
                <HeroImage
                  image={galleryImages[0] || product?.posterImageUrl || detailPosterUrl || product?.preview?.posterKey}
                  title={product?.titleEn || product?.titleZh || ""}
                  onOpenLightbox={(i) => {
                    setGalleryIndex(i);
                    setLightboxOpen(true);
                  }}
                />
              ) : isPosterOnly ? (
                <div className="sc-poster-full-image">
                  <img
                    src={detailPosterUrl}
                    alt={product?.titleEn || product?.titleZh || getProductIdentity(product) || "Product poster"}
                    width={Number(product?.preview?.width || product?.designWidth) || undefined}
                    height={Number(product?.preview?.height || product?.designHeight) || undefined}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ) : hasVideo ? (
                <div
                  className="sc-product-detail-video-player"
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "260px",
                    background: "#080c14",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <LazyLivePreview
                    key={`detail-video-${getProductIdentity(product)}`}
                    productId={getProductIdentity(product)}
                    title={product.titleEn || product.titleZh || ""}
                    category={product.category || ""}
                    interactive={true}
                    lazy={false}
                    fillMode="scale"
                    modalZoom={product.modalZoom || 1}
                    designWidth={Number(product.designWidth || product.preview?.width) || (product.tab === "kits" ? 1600 : 0)}
                    designHeight={Number(product.designHeight || product.preview?.height) || (product.tab === "kits" ? 1100 : 0)}
                    offsetX={product.modalOffsetX || 0}
                    offsetY={product.modalOffsetY || 0}
                    showControls={false}
                    videoUrl={detailVideoUrl}
                    posterUrl={getPreviewPosterUrl(product) || ""}
                    rootMargin="0px"
                    placeholder={null}
                  />
                </div>
              ) : showDetailPoster ? (
                <div className="sc-poster-full-image sc-static-preview-image">
                  <img
                    src={detailPosterUrl}
                    alt={product?.titleEn || product?.titleZh || getProductIdentity(product) || "Product preview"}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    onError={() => setFailedPosterUrl(detailPosterUrl)}
                  />
                </div>
              ) : (
                <ProductPreview
                  ref={previewRef}
                  key={`detail-preview-${getProductIdentity(product)}`}
                  product={product}
                  interactive={detailPreviewInteractive}
                  showControls={Boolean(product.preview?.enabled)}
                  forceLiveDemo={true}
                  fillMode="scale"
                  modalZoom={product.modalZoom || 1}
                  offsetX={product.modalOffsetX || 0}
                  offsetY={product.modalOffsetY || 0}
                  hideToolbar={true}
                />
              )}
            </PreviewErrorBoundary>
          </div>

          {/* View full page — for image-first Layouts */}
          {product?.tab === "layouts" && (galleryImages.length > 0 || detailPosterUrl) && (
            <div className="sc-detail-view-fullpage">
              <button
                type="button"
                className="sc-detail-action sc-detail-action--fullpage"
                onClick={() => {
                  const idx = galleryImages.length ? Math.min(galleryIndex, galleryImages.length - 1) : 0;
                  if (galleryImages.length) {
                    setGalleryIndex(idx);
                    setLightboxOpen(true);
                  } else if (detailPosterUrl) {
                    setGalleryIndex(0);
                    setLightboxOpen(true);
                  }
                }}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <Maximize2 size={16} />
                </span>
                <span className="sc-detail-action-label">
                  {tLocal({ en: "View full page", zhCN: "查看整页" })}{" →"}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="sc-product-detail-copy">
          <div className="sc-product-detail-topline">

            {product?.category && (
              <span
                className="sc-product-pill sc-product-category-pill"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(245, 247, 251, 0.85)",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                }}
              >
                {tLocal(CATEGORY_LABELS[product.category] || { en: product.category, zhCN: product.category })}
              </span>
            )}

            <strong
              className={`sc-product-detail-price ${
                isPremium ? "is-premium" : "is-free"
              }`}
            >
              {formatPrice(product)}
            </strong>
          </div>

          <h2 id="sc-product-title">{title}</h2>

          {/* Social-proof metrics — views (eye) + public like (heart) + Save
              (bookmark, login-gated favorite). The heart mirrors the card:
              optimistic, persisted in localStorage. */}
          <div
            className="sc-detail-metrics"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginTop: "8px",
              fontSize: "13px",
              color: "rgba(148, 163, 184, 0.9)",
            }}
          >
            <span
              className="sc-detail-metrics-stat"
              title={tLocal({ en: "Views", zhCN: "浏览" })}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Eye size={14} aria-hidden="true" />
              <span>{formatCount(detailViews)}</span>
            </span>
            <button
              type="button"
              className={`sc-detail-like-btn${detailLiked ? " is-liked" : ""}`}
              aria-pressed={detailLiked}
              aria-label={detailLiked ? tLocal({ en: "Unlike", zhCN: "取消点赞" }) : tLocal({ en: "Like", zhCN: "点赞" })}
              onClick={toggleDetailLike}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                color: detailLiked ? "#ef4444" : "rgba(148, 163, 184, 0.9)",
                fontWeight: detailLiked ? 600 : 400,
              }}
            >
              <Heart size={14} fill={detailLiked ? "currentColor" : "none"} aria-hidden="true" />
              <span>{formatCount(detailLikes)}</span>
            </button>
            <button
              type="button"
              className={`sc-detail-save-btn${isFavorited ? " is-saved" : ""}`}
              aria-pressed={isFavorited}
              aria-label={isFavorited ? tLocal({ en: "Remove from saved", zhCN: "取消收藏" }) : tLocal({ en: "Save to Library", zhCN: "收藏" })}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(detailProductId);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                color: isFavorited ? "#111827" : "rgba(148, 163, 184, 0.9)",
              }}
            >
              <Bookmark size={14} fill={isFavorited ? "currentColor" : "none"} aria-hidden="true" />
            </button>
          </div>

          <p className="sc-product-detail-description">
            {description}
          </p>

          {craftNote && (!isPremium || hasAccess) && (
            <div className="sc-product-craft-note">
              <span className="sc-craft-note-label">CRAFT NOTE</span>
              <p>{craftNote}</p>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="sc-code-tags sc-product-detail-tags">
              {allTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          {isPremium && premiumAccess.loading ? (
              <div className="sc-owned-access-check">
                <span className="sc-owned-access-spinner" />
                <div>
                  <strong>
                    {tLocal({
                      en: "Checking your access",
                      zhCN: "正在检查你的访问权限",
                    })}
                  </strong>
                  <small>
                    {tLocal({
                      en: "Securely verifying ownership before loading protected source files.",
                      zhCN: "正在安全验证所有权，然后才会加载受保护的源代码。",
                    })}
                  </small>
                </div>
              </div>
            ) : isPremium && !isLibraryProduct ? (
            <div className="sc-product-action-box is-premium">
              <div className="sc-product-action-copy">
                <span className="sc-product-action-icon">
                  {hasAccess ? <Check size={18} /> : <Lock size={18} />}
                </span>

                <div>
                  <strong>
                    {hasAccess
                      ? tLocal({
                          en: "Premium source code — unlocked",
                          zhCN: "高级源代码 — 已解锁" })
                      : tLocal({
                          en: "Premium source code",
                          zhCN: "高级源代码" })}
                  </strong>

                  <small>
                    {hasAccess
                      ? tLocal({
                          en: "You own this product. Copy or download below.",
                          zhCN: "您已拥有此产品。在下方复制或下载。" })
                      : tLocal({
                          en: "Unlock the complete code package after purchase.",
                          zhCN: "购买后解锁完整代码包。" })}
                  </small>
                </div>
              </div>

              {!hasAccess && (
                <button
                  type="button"
                  className="sc-product-main-action"
                  onClick={handlePremiumBuy}
                >
                  <span>
                    {tLocal({
                      en: `Unlock for ${formatPrice(product)}`,
                      zhCN: `以 ${formatPrice(product)} 解锁`,
                    })}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              )}

              <p className="sc-product-action-microcopy">
                {tLocal(COPY.oneTime)}
              </p>

              {notice ? (
                <p className="sc-product-action-notice">
                  {notice}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ===== ACTION BUTTONS — Read / Download Image / Copy Code / Download ===== */}
          <div className="sc-detail-actions">

            {/* Read — eBooks (Library products) */}
            {isLibraryProduct && (
              <button
                type="button"
                className="sc-detail-action sc-detail-action--read"
                onClick={handleReadClick}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {!hasAccess ? (
                    <Lock size={18} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h6a4 4 0 0 1 4 4 4 4 0 0 1 4-4h6v16h-6a4 4 0 0 0-4 4 4 4 0 0 0-4-4H2z"/>
                    </svg>
                  )}
                </span>
                <span className="sc-detail-action-label">
                  {!hasAccess
                    ? `Get the book — $${productPrice.toFixed(2)}`
                    : 'Read now →'}
                </span>
              </button>
            )}

            {/* Download Book — eBooks only, for buyers. Downloads the
                pre-built PDF/ZIP when one was uploaded, otherwise prints. */}
            {isLibraryProduct && hasAccess && (
              <button
                type="button"
                className="sc-detail-action sc-detail-action--download-book"
                onClick={handleDownloadBook}
                title={ebookDownloadUrl ? "Download the PDF/ZIP" : "Print / save as PDF"}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <Download size={18} />
                </span>
                <span className="sc-detail-action-label">Save Offline</span>
              </button>
            )}

            {/* Visit Website — the product's public site, set in the admin panel */}
            {modalSiteUrl && (
              <a
                href={modalSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sc-detail-action sc-detail-action--site"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                       strokeLinejoin="round">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </span>
                <span className="sc-detail-action-label">Visit Website</span>
              </a>
            )}

            {/* View Live Site — portfolio "Live URL" (falls back to this when
                Website URL is empty). Part of the action row so it aligns with
                the other buttons instead of floating over the content. */}
            {showLiveSiteAction && (
              <a
                href={modalLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sc-detail-action sc-detail-action--live"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <ExternalLink size={18} />
                </span>
                <span className="sc-detail-action-label">View Live Site</span>
              </a>
            )}

            {/* Copy Image — Layouts, Template (poster) products, and any
                product with a gallery cover. Auto-shows whenever an image exists;
                no admin toggle. */}
            {(product?.tab === "layouts" ||
              galleryImages.length > 0 ||
              product?.posterImageUrl ||
              product?.preview?.posterKey) &&
              getProductImageUrl(product) && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--image ${imageDownloaded ? 'is-copied' : ''}`}
                onClick={handleCopyImageClick}
                disabled={imageDownloading}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {(!isFree && (!isSignedIn || !hasAccess)) ? (
                    <Lock size={18} />
                  ) : imageDownloaded ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <Copy size={18} />
                  )}
                </span>
                <span className="sc-detail-action-label">
                  {(!isFree && !isSignedIn)
                    ? 'Sign in to copy image'
                    : !isFree && !hasAccess
                    ? `Unlock for $${productPrice.toFixed(2)}`
                    : imageDownloading
                    ? 'Working…'
                    : imageDownloaded && copyImageFellBack
                    ? 'Saved to Downloads!'
                    : imageDownloaded ? 'Image Copied!' : 'Copy Image'}
                </span>
              </button>
            )}

            {/* Copy Source Code — only when the product actually has code.
                See `canCopySource` above: layouts/kits without downloadable
                code no longer render this button (or its wrapper) at all. */}
            {canCopySource && (
              <div className="sc-copy-actions-row sc-detail-actions-row">
                <button
                  type="button"
                  className={`sc-detail-action sc-detail-action--code sc-btn-copy-primary ${copiedCode ? 'is-copied' : ''}`}
                  onClick={handleCopySourceClick}
                  style={{ position: "relative", zIndex: 60, pointerEvents: "auto" }}
                >
                  <span className="sc-detail-action-icon" aria-hidden="true">
                    {(!isFree && (!isSignedIn || !hasAccess)) ? (
                      <Lock size={18} />
                    ) : copiedCode ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </span>
                  <span className="sc-detail-action-label">
                    {(!isFree && !isSignedIn) ? 'Sign in to copy source code' : !hasAccess ? `Unlock for $${productPrice.toFixed(2)}` : copiedCode ? 'Code Copied' : 'Copy Source Code'}
                  </span>
                </button>
              </div>
            )}

            {/* Custom Service Callout — UI components only. "Book a Call" /
                "Request Customization" make no sense next to a book, whose
                primary action is the reader. */}
            {!isLibraryProduct && (
              <div className="sc-custom-service-section">
                <div className="sc-custom-service-text">
                  <h4>Need this customized?</h4>
                  <p>Our team can adapt this product for your specific needs.</p>
                </div>
                <div className="sc-custom-service-buttons">
                  <a href="/services" className="sc-btn-service">
                    Book a Call
                  </a>
                  <a href="/services" className="sc-btn-service primary">
                    Request Customization
                  </a>
                </div>
              </div>
            )}

            {/* You Might Also Like */}
            {relatedProducts.length > 0 && (
              <div className="sc-also-like-section">
                <h3 className="sc-also-like-title">You might also like</h3>
                <div className="sc-also-like-grid">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={getProductIdentity(relatedProduct)} style={{ minWidth: 0 }}>
                      <PreviewErrorBoundary>
                        <CodeProductCard
                          product={relatedProduct}
                          tLocal={tLocal}
                          onOpenProduct={onOpenProduct}
                        />
                      </PreviewErrorBoundary>
                    </div>
                  ))}
                </div>
              </div>
            )}

{/* Download ZIP — shows when package exists AND user has access */}
            {product?.package?.storageKey && (isFree || (isPremium && hasAccess)) && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--download ${downloading ? 'is-loading' : ''}`}
                disabled={downloading}
                onClick={handleDownloadClick}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {(!isFree && (!isSignedIn || !hasAccess)) ? (
                    <Lock size={18} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                </span>
                <span className="sc-detail-action-label">
                  {(!isFree && !isSignedIn)
                    ? 'Sign in to download the zip file'
                    : !hasAccess
                    ? `Unlock for $${productPrice.toFixed(2)}`
                    : downloading
                    ? 'Preparing download…'
                    : 'Download Source Code'}
                </span>
              </button>
            )}

            {/* Copy Repo URL */}
            {typeof product?.repoUrl === "string" && product.repoUrl.trim() && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--repo ${copiedRepo ? 'is-copied' : ''}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const url = product.repoUrl;
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(url);
                    } else {
                      const ta = document.createElement('textarea');
                      ta.value = url;
                      ta.style.position = 'fixed';
                      ta.style.opacity = '0';
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      ta.remove();
                    }
                    setCopiedRepo(true);
                    setToast({ type: 'success', message: 'Repo URL copied' });
                    setTimeout(() => setCopiedRepo(false), 2200);
                    setTimeout(() => setToast(null), 2600);
                  } catch (err) {
                    console.error('[copy-repo] failed:', err);
                    setToast({ type: 'error', message: 'Copy failed' });
                    setTimeout(() => setToast(null), 2600);
                  }
                }}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {copiedRepo ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                         strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  )}
                </span>
                <span className="sc-detail-action-label">
                  {copiedRepo ? 'Repo Copied' : 'Copy Repo URL'}
                </span>
              </button>
            )}

          </div>
        </div>
      </motion.section>

      {/* Fullscreen lightbox (View full page) */}
      {lightboxOpen && (
        <Lightbox
          images={galleryImages.length ? galleryImages : detailPosterUrl ? [detailPosterUrl] : []}
          index={galleryImages.length ? Math.min(galleryIndex, galleryImages.length - 1) : 0}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`sc-toast sc-toast--${toast.type}`}>
          <span className="sc-toast-icon">
            {toast.type === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="8" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </span>
          <span className="sc-toast-message">{toast.message}</span>
        </div>
      )}

      {/* Affiliate funnel: Runable AI light modal, shown after a successful copy */}
      <AnimatePresence>
        {showAffiliateModal && (
          <motion.div
            className="sc-affiliate-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAffiliateModal(false)}
          >
            <motion.div
              className="sc-affiliate-sheet"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Build with Runable AI"
            >
              <button
                type="button"
                className="sc-affiliate-close"
                aria-label="Close"
                onClick={() => setShowAffiliateModal(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="sc-affiliate-success">
                <span className="sc-affiliate-check">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="sc-affiliate-success-text">
                  {copiedType === "image"
                    ? "Image Link Copied Successfully!"
                    : "Source Code Copied Successfully!"}
                </span>
              </div>

              <div className="sc-affiliate-divider" />

              <div className="sc-affiliate-brand">
                <svg className="sc-affiliate-logo" width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="8" cy="20" r="4" fill="currentColor" />
                  <circle cx="32" cy="8" r="4" fill="currentColor" />
                  <circle cx="32" cy="32" r="4" fill="currentColor" />
                  <circle cx="20" cy="20" r="4.5" fill="currentColor" />
                  <path d="M11 18.6 16.6 19.7 M23.6 18 28.8 10.4 M23.6 22 28.8 29.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="sc-affiliate-brand-name">Runable AI</span>
              </div>

              <h3 className="sc-affiliate-headline">Want to build this in seconds?</h3>
              <p className="sc-affiliate-subtext">
                {copiedType === "image"
                  ? "Turn this design into a live app instantly with Runable AI."
                  : "Runable AI lets you build full apps from this code instantly."}
              </p>

              <button
                className="cssbuttons-io-button"
                type="button"
                onClick={() => {
                  void trackUserEvent("affiliate_click", {
                    provider: "runable",
                    source: "copy_modal",
                    copiedType,
                    productId: getProductIdentity(product),
                    productSlug: product?.slug || "",
                  });
                  window.open(
                    `https://runable.link/steacode?utm_source=steacode&utm_medium=modal&utm_campaign=copy_to_build&utm_content=${copiedType}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Try Runable AI
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" />
                  </svg>
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
import './light-mode-fixes.css';
