import { jsPDF } from "jspdf";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import SEO from "../../components/SEO.jsx";
import "./stea-code.css";
import "./stea-code-v2.css";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Command,
  Copy,
  ExternalLink,
  Globe2,
  Layers,
  Lock,
  Package,
  Palette,
  Play,
  RotateCw,
  Maximize2,
  Minimize2,
  Search,
  Wrench,
  X } from "lucide-react";
import SteaCodeLiquidHero from "../../components/SteaCodeLiquidHero.jsx";
import { useSteaCodeI18n } from "../../components/stea-code/useSteaCodeI18n.js";
import { createPortal } from "react-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import SteaCodeMemberGate from "../../components/stea-code/SteaCodeMemberGate.jsx";
import SteaCodeProductLivePreview from "../../components/stea-code/SteaCodeProductLivePreview.jsx";
import SteaCodeProductSkeleton from "../../components/stea-code/SteaCodeProductSkeleton.jsx";
import PreviewErrorBoundary from "../../components/stea-code/PreviewErrorBoundary.jsx";
import SteaCodeCheckoutPage from "./SteaCodeCheckoutPage.jsx";
import SteaCodePurchasesPage from "./SteaCodePurchasesPage.jsx";
import SteaCodePaymentReturnPage from "./SteaCodePaymentReturnPage.jsx";
import {
  STEA_CODE_ACTION_TYPES,
  clearSteaCodePendingAction,
  getSteaCodePendingAction,
  makeFreeCodeAction,
  makePaymentReturnAction,
  makePremiumCheckoutAction,
  makePurchasesAction,
  setSteaCodePendingAction } from "../../services/steaCodeResumeAction.js";
import { getFirebaseAuth } from "../../firebase.js";
import {
  downloadSteaCodeSource,
  getSteaCodeCatalog,
  getSteaCodeFreeProductContent,
  getSteaCodeProductAccess,
  getSteaCodeProductContent,
  registerSteaCodeProductView,
  recordSteaCodeCopy,
  toggleSteaCodeFavorite,
  getSteaCodeFavorites,
} from "../../services/steaCodeCommerce.js";

import {
  CODE_PRODUCT_CATEGORIES,
  CODE_PRODUCT_TECH,
  FALLBACK_CODE_PACKS,
  FALLBACK_CODE_PRODUCTS } from "../../data/stea-code/codeProducts.js";
import { STEA_CODE_SERVER_PRODUCTS } from "../../data/stea-code/codeProductsServer.js";
import { V2_WORLDS } from "../../data/stea-code/v2Worlds.js";

const COPY = {
  builtFor: { en: "BUILT FOR DEVELOPERS", zhCN: "为开发者打造" },
  sub: {
    en: "Explore code, tools, guides and inspiration for modern developers.",
    zhCN: "探索面向现代开发者的代码、工具、指南与灵感。" },
  search: { en: "Search code, tools, hosting, guides, design…", zhCN: "搜索代码、工具、托管、指南、设计…" },
  exploreCode: { en: "Explore Code", zhCN: "探索代码" },
  browseFree: { en: "Explore Free", zhCN: "探索免费资源" },
  browsePremium: { en: "Browse Premium", zhCN: "浏览高级代码" },
  marketplaceSub: { en: "Premium code products to ship your ideas faster.", zhCN: "高级代码产品，帮助你更快发布创意。" },
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
  locked: { en: "Premium source is locked until purchase is verified.", zhCN: "高级源码会在购买验证后解锁。" },
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
  { id: "tools", label: { en: "Tools", zhCN: "工具" }, href: "/tools" },
  { id: "library", label: { en: "Library", zhCN: "开发库" }, href: "/library" },
  { id: "free", label: { en: "Free", zhCN: "免费" }, mode: "explore", filter: { pricing: "Free" } },
  { id: "premium", label: { en: "Premium", zhCN: "高级" }, mode: "explore", filter: { pricing: "Premium" } },
];

const CATEGORY_LABELS = {
  All: { en: "All", zhCN: "全部" },
  "Text Effects": { en: "Text Effects", zhCN: "文字效果" },
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
  "Toggle Switches": { en: "Toggle Switches", zhCN: "切换开关" } };

const BROWSE_CATEGORIES = [
  "Animations",
  "Buttons",
  "Backgrounds",
  "Cards",
  "Heroes",
  "Navigation",
  "Forms",
  "Loaders",
  "Text Effects",
  "Page Transitions",
  "Components",
  "Portfolio",
];

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

const RESOURCE_LINKS = [
  { id: "tools", icon: Wrench, title: { en: "Developer Tools", zhCN: "开发者工具" }, desc: { en: "AI, APIs, design, testing, productivity and more.", zhCN: "AI、API、设计、测试、效率工具等。" }, view: "tools" },
  { id: "ship", icon: Boxes, title: { en: "Hosting & Deployment", zhCN: "托管与部署" }, desc: { en: "Deploy apps fast with the best platforms.", zhCN: "用优质平台快速部署应用。" }, view: "ship" },
  { id: "learn", icon: BookOpen, title: { en: "Developer Guides", zhCN: "开发者指南" }, desc: { en: "Tutorials, tips and in-depth guides.", zhCN: "教程、技巧与深入指南。" }, view: "learn" },
  { id: "inspire", icon: Globe2, title: { en: "Website Inspiration", zhCN: "网站灵感" }, desc: { en: "Great websites, UI, motion and design ideas.", zhCN: "优秀网站、UI、动效与设计灵感。" }, view: "inspire" },
  { id: "monetize", icon: Package, title: { en: "Monetize & Grow", zhCN: "变现与增长" }, desc: { en: "Payments, SEO, analytics and growth resources.", zhCN: "支付、SEO、数据分析与增长资源。" }, view: "monetize" },
  { id: "china", icon: Globe2, title: { en: "Mainland China", zhCN: "中国大陆" }, desc: { en: "China-friendly tools, hosting and services.", zhCN: "适合中国大陆的工具、托管与服务。" }, view: "tools", intent: "china" },
];

function label(product, key, zhKey) {
  return { en: product[key], zhCN: product[zhKey] };
}

function formatPrice(product) {
  if (product.pricingType === "free") return "Free";
  return `${product.currency === "USD" ? "$" : ""}${Number(product.price || 0).toFixed(2)}`;
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
  const [pricing, setPricing] = useState("All");
  const [framework, setFramework] = useState("All Frameworks");
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const viewParam = searchParams.get("view");
  const orderParam = searchParams.get("order");
  const checkoutProductId = searchParams.get("product");

  const effectiveView = useMemo(() => {
    if (location.pathname === "/library") return "purchases";
    if (viewParam === "purchases" || viewParam === "library") return "purchases";
    if (viewParam === "checkout") return "checkout";
    if (viewParam === "payment-return") return "payment-return";
    return viewMode;
  }, [location.pathname, viewParam, viewMode]);

  const [selected, setSelected] = useState(null);
  const viewedProductsRef = useRef(new Set());

  // Track product views — fire once per product per session
  useEffect(() => {
    if (!selected) return;
    const productId = getProductIdentity(selected);
    if (!productId || viewedProductsRef.current.has(productId)) return;
    viewedProductsRef.current.add(productId);
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
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) {
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
  }, []);

  // Reload favorites on auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return undefined;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadFavorites();
      } else {
        setFavorites(new Set());
      }
    });
    return () => unsub();
  }, [loadFavorites]);

  const handleToggleFavorite = useCallback(async (productId) => {
    const cleanId = String(productId || "").trim();
    if (!cleanId) return;

    const auth = getFirebaseAuth();
    if (!auth?.currentUser) {
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
  }, [favorites]);

  const [liveCatalog, setLiveCatalog] = useState(null);
  const [fullCatalog, setFullCatalog] = useState([]);
  const [isFallbackCatalog, setIsFallbackCatalog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = selected ? "hidden" : previousOverflow;

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [memberGateOpen, setMemberGateOpen] = useState(false);
  const [memberGateAction, setMemberGateAction] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarSpin, setAvatarSpin] = useState("idle"); // 'idle' | 'left' | 'right'
  const [goUnlimitedPulse, setGoUnlimitedPulse] = useState(false);
  const [goUnlimitedToast, setGoUnlimitedToast] = useState(false);
  const [localAuthUser, setLocalAuthUser] = useState(() => user || getFirebaseAuth()?.currentUser || null);

  useEffect(() => {
    if (user !== undefined) {
      setLocalAuthUser(user);
    }
  }, [user]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return undefined;
    const unsub = onAuthStateChanged(auth, (u) => {
      setLocalAuthUser(u || null);
    });
    return () => unsub();
  }, []);

  const effectiveUser = user !== undefined ? user : localAuthUser;
  const signedInEmail = (effectiveUser?.email || "").trim();
  const ADMIN_EMAILS = ["stea.africa@gmail.com", "kukumlangoni@gmail.com"];
  const isAdmin = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(signedInEmail.toLowerCase());
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
  const [visibleProductCount, setVisibleProductCount] = useState(24);

  /* -------- Auth resume flow — Member Gate (premium / free code) -------- */
  const [pendingFreeCodeProductId, setPendingFreeCodeProductId] = useState(null);

  const goToCheckout = (productId) => {
    const sp = new URLSearchParams(window.location.search);
    sp.set("view", "checkout");
    sp.set("product", String(productId));
    navigate(`${window.location.pathname}?${sp.toString()}`);
  };

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
      case STEA_CODE_ACTION_TYPES.PREMIUM_CHECKOUT:
        if (a.productId) goToCheckout(a.productId);
        break;
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
    const auth = getFirebaseAuth();
    if (!auth) return undefined;
    let processed = false;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !processed) {
        const action = getSteaCodePendingAction();
        if (action) {
          processed = true;
          setMemberGateOpen(false);
          resumePendingAction(action);
        }
      }
      if (!user) processed = false;
    });
    return () => unsub();
  }, []);

  const openMemberGate = (action) => {
    setSteaCodePendingAction(action);
    setMemberGateAction(action);
    setMemberGateOpen(true);
    setAccountMenuOpen(false);
  };

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

  const handleGoUnlimited = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (goUnlimitedPulse) return; // ignore mid-animation clicks
    setGoUnlimitedPulse(true);
    setGoUnlimitedToast(true);
    setTimeout(() => setGoUnlimitedPulse(false), 1200);
    setTimeout(() => setGoUnlimitedToast(false), 2600);
  };

  const handleSignOut = async (e) => {
    console.log('[signout] handler fired', { event: e?.type, target: e?.target?.className });
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch (err) {
      console.error('[signout] failed', err);
    } finally {
      // Always close the account menu and clear local user state immediately
      setAccountMenuOpen(false);
      setLocalAuthUser(null);
    }
  };



  const requestAuthForCheckout = (productId) => {
    openMemberGate(makePremiumCheckoutAction(productId));
  };

  const requestAuthForFreeCode = (productId) => {
    openMemberGate(makeFreeCodeAction(productId));
  };

  const handleMemberGateAuthenticated = (_user, action) => {
    setMemberGateOpen(false);
    resumePendingAction(action);
  };

  const handleMemberGateClose = () => {
    setMemberGateOpen(false);
    const user = getFirebaseAuth()?.currentUser;
    if (!user) {
      clearSteaCodePendingAction();
      setMemberGateAction(null);
    }
  };

    useEffect(() => {
    let active = true;

    async function loadDualCatalogs() {
      // Spec #12: two catalogs loaded in parallel from dedicated routes.
      //   homepageCatalog -> Explore Code homepage cards ONLY.
      //   fullCatalog     -> direct product detail (by URL slug), search
      //                      palette, purchases — every published product.
      // The two are intentionally separate so Admin can fully control
      // which products surface on /code without losing the ability to
      // deep-link to any published product.
      try {
        // Stale-while-revalidate: returns cached data instantly (if available),
        // then onFresh fires when the network response arrives.
        let homepageFresh = false;
        let fullFresh = false;

        const tryApplyFresh = () => {
          if (!homepageFresh || !fullFresh || !active) return;
        };

        const [homepageResult, fullResult] = await Promise.all([
          getSteaCodeCatalog({
            scope: "homepage",
            onFresh: (fresh) => {
              homepageFresh = true;
              if (!active) return;
              const products = Array.isArray(fresh?.products) ? fresh.products : [];
              setLiveCatalog(products);
              tryApplyFresh();
            },
          }),
          getSteaCodeCatalog({
            onFresh: (fresh) => {
              fullFresh = true;
              if (!active) return;
              const products = Array.isArray(fresh?.products)
                ? fresh.products.filter((p) => p?.status === "published")
                : [];
              setFullCatalog(products);
              tryApplyFresh();
            },
          }),
        ]);

        if (!active) return;

        // Spec #2 + #13: EMPTY ARRAY [] IS VALID DATA. DO NOT interpret it
        // as failure. Only the catch() block represents failure. KEEP empty.
        const homepageNext = Array.isArray(homepageResult?.products)
          ? homepageResult.products
          : [];

        const fullNext = Array.isArray(fullResult?.products)
          ? fullResult.products.filter(
              (product) => product?.status === "published"
            )
          : [];

        setIsFallbackCatalog(false);
        setLiveCatalog(homepageNext);
        setFullCatalog(fullNext);
        setIsLoading(false);
      } catch (error) {
        console.error(
          "[STEA Code] LIVE API LOAD FAILED — FALLING BACK TO SEED DATA!\n" +
          "Error details:",
          error
        );

        if (active) {
          setIsFallbackCatalog(true);
          // API unavailable (no backend deployed yet, network error, etc.).
          // Fall back to the bundled seed products so the grid is never empty
          // — a working grid with real seed demos is strictly better for
          // conversion than a blank page. The admin/Firestore catalog takes
          // precedence whenever the API responds successfully.
          const seedPublished = STEA_CODE_SERVER_PRODUCTS.filter(
            (p) => p?.status === "published"
          );
          const seedHomepage = seedPublished.filter(
            (p) => p?.homepageVisible === true
          );
          setLiveCatalog(seedHomepage);
          setFullCatalog(seedPublished);
          setIsLoading(false);
        }
      }
    }

    loadDualCatalogs();

    return () => {
      active = false;
    };
  }, []);

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
        product.homepageVisible !== true
      ) return false;

      if (!isProductReady(product)) {
        const id = String(product.id || product.slug || "(unknown)");
        console.warn(
          `[STEA Code] Hiding incomplete product from homepage grid: "${id}"`
        );
        return false;
      }

      return true;
    });
  }, [liveCatalog, isProductReady]);

  // Open product detail by navigating to its clean URL and setting selected state
  const openProduct = useCallback((product) => {
    const slug = String(product?.slug || product?.id || "").trim();
    if (!slug) return;
    setSelected(product);
    const prefix = location.pathname.startsWith("/code") ? "/code" : "";
    const targetPath = `${prefix}/products/${encodeURIComponent(slug)}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [navigate, location.pathname]);

  // Close product detail by navigating back to the marketplace homepage.
  // Preserves current query params (category, pricing, view) so the user
  // lands back where they were before opening the modal.
  const closeProduct = useCallback(() => {
    const sp = new URLSearchParams(location.search);
    const basePath = location.pathname.startsWith("/code") ? "/code" : "/";
    navigate(`${basePath}${sp.toString() ? `?${sp.toString()}` : ""}`);
  }, [navigate, location.search, location.pathname]);


  useEffect(() => {
    if (!pendingFreeCodeProductId) return;
    const productId = pendingFreeCodeProductId;
    setPendingFreeCodeProductId(null);
    const searchable = [
      ...(Array.isArray(products) ? products : []),
      ...(Array.isArray(fullCatalog) ? fullCatalog : []),
    ];
    const match =
      searchable.find((p) => String(p.id || p.slug || "") === productId) ||
      searchable.find(
        (p) =>
          String(p.id || p.slug || "").toLowerCase() ===
          String(productId).toLowerCase()
      );
    if (match) openProduct(match);
  }, [pendingFreeCodeProductId, products, fullCatalog, openProduct]);

  // Legacy ?product= query param → redirect to clean /code/products/:slug URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const requestedProduct = String(sp.get("product") || "").trim();

    if (!requestedProduct) return;

    const searchableProducts = [
      ...(Array.isArray(products) ? products : []),
      ...(Array.isArray(fullCatalog) ? fullCatalog : []),
    ];

    if (!searchableProducts.length) return;

    const match =
      searchableProducts.find(
        (p) =>
          String(p.id || p.slug || "") === requestedProduct
      ) ||
      searchableProducts.find(
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
    }
  }, [products, fullCatalog, navigate, location.pathname]);

  /* ---------- Deep link: /code/products/:slug or /products/:slug ----------
   * URL is the source of truth for the product detail modal.
   * - Opening a product → navigate to /code/products/{slug} or /products/{slug}
   * - Closing → navigate back to /code or /
   * - Back/forward buttons work because URL drives modal state
   * - Direct visit to a shared link → modal opens automatically
   * - Slug not found OR product incomplete → silent redirect to homepage
   */
  const productSlugFromUrl = useMemo(() => {
    const m = location.pathname.match(/^(?:\/code)?\/products\/([^/]+)\/?$/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [location.pathname]);

  // Sync URL → selected state
  useEffect(() => {
    if (!productSlugFromUrl) {
      // No product in URL — close modal if open
      if (selected) setSelected(null);
      return;
    }

    // Search both homepage products and full catalog so any published
    // product is reachable via deep link, not just homepage-approved ones.
    const searchable = [
      ...(Array.isArray(products) ? products : []),
      ...(Array.isArray(fullCatalog) ? fullCatalog : []),
    ];
    if (!searchable.length) return; // wait for data

    const slug = productSlugFromUrl.toLowerCase();
    const match =
      searchable.find((p) => String(p.slug || "").toLowerCase() === slug) ||
      searchable.find((p) => String(p.id || "").toLowerCase() === slug);

    if (match && isProductReady(match)) {
      if (!selected || getProductIdentity(selected) !== getProductIdentity(match)) {
        setSelected(match);
      }
    } else if (liveCatalog !== null || (Array.isArray(fullCatalog) && fullCatalog.length > 0)) {
      // Product genuinely not found or incomplete after catalog loaded — redirect to homepage
      const sp = new URLSearchParams(location.search);
      const basePath = location.pathname.startsWith("/code") ? "/code" : "/";
      navigate(`${basePath}${sp.toString() ? `?${sp.toString()}` : ""}`, { replace: true });
    }
  }, [productSlugFromUrl, products, fullCatalog, liveCatalog, navigate, location.search, isProductReady, selected, location.pathname]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products
      .filter((p) => category === "All" || p.category === category)
      .filter((p) => pricing === "All" || p.pricingType === pricing.toLowerCase())
      .filter((p) => framework === "All Frameworks" || (p.frameworks || []).includes(framework))
      .filter((p) => {
        if (!query) return true;
        const hay = [
          p.titleEn, p.titleZh, p.shortDescriptionEn, p.shortDescriptionZh,
          p.category, ...(p.tags || []), ...(p.frameworks || []), ...(p.languages || []),
        ].join(" ").toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [products, category, pricing, framework, q]);

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
    const list = Array.isArray(fullCatalog) && fullCatalog.length ? fullCatalog : (Array.isArray(products) ? products : []);
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
  }, [fullCatalog, products]);

  // Catalog already contains only homepage-approved products (scope=homepage).
  // Filters refine the approved set. Publishing and homepage approval remain
  // separate controls in Admin — new products must be explicitly approved.
  const homepageProducts = filtered.slice(
    0,
    Math.min(visibleProductCount, 50)
  );

  const canShowMore =
    homepageProducts.length <
    Math.min(filtered.length, 50);

  useEffect(() => {
    setVisibleProductCount(24);
  }, [category, pricing, framework, q]);

  const submit = (event) => {
    event?.preventDefault?.();
    if (q.trim()) onOpenSearch({ query: q.trim() });
  };

  const INITIAL_PRODUCT_COUNT = 24;
  const PRODUCT_INCREMENT = 12;
  const MAX_HOMEPAGE_PRODUCTS = 50;

  const maxVisibleProducts = Math.min(
    filtered.length,
    MAX_HOMEPAGE_PRODUCTS
  );

  const hasExpandableProducts =
    maxVisibleProducts > INITIAL_PRODUCT_COUNT;

  const isFullyExpanded =
    visibleProductCount >= maxVisibleProducts;

  const handleProductExpansion = () => {
    if (isFullyExpanded) {
      setVisibleProductCount(INITIAL_PRODUCT_COUNT);

      requestAnimationFrame(() => {
        document.getElementById("explore")?.scrollIntoView({
          behavior: "smooth",
          block: "start" });
      });

      return;
    }

    setVisibleProductCount((current) =>
      Math.min(
        current + PRODUCT_INCREMENT,
        maxVisibleProducts
      )
    );
  };



  // SEO meta for selected product
  const defaultCodeTitle = uiLocale === "zhCN"
    ? "STEA Code — 开发者代码市场"
    : "STEA Code — Developer Marketplace";
  const defaultCodeDesc = uiLocale === "zhCN"
    ? "STEA Code 开发者代码市场与实时交互预览。"
    : "STEA Code — a marketplace for buying and selling code components.";

  const seoTitle = selected
    ? `${String(selected.titleEn || selected.title || selected.titleZh || "").trim()} — STEA Code`
    : defaultCodeTitle;
  const seoDescription = selected
    ? String(selected.shortDescriptionEn || selected.description || selected.shortDescriptionZh || "").trim()
    : defaultCodeDesc;
  const seoImage = selected
    ? (selected.posterImageUrl || selected.preview?.posterUrl || "")
    : "";
  const seoUrl = selected && productSlugFromUrl
    ? `/code/products/${encodeURIComponent(productSlugFromUrl)}`
    : null;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        ogImage={seoImage || undefined}
        ogUrl={seoUrl || undefined}
        type={selected ? "article" : "website"}
        siteName="STEA Code"
      />
    <div className="stea-code-app sc-v2 sc-market-home sc-v2-home sc-v2-has-liquid">
      <div className="sc-v2-liquid-wrap" aria-hidden="true"><PreviewErrorBoundary><SteaCodeLiquidHero theme="dark" /></PreviewErrorBoundary></div>
      <div className="sc-v2-veil" aria-hidden="true" />

      <header className="sc-topbar">
        <a
          className="sc-topbar-logo"
          href="/code"
          aria-label="STEA Code home"
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
            src="/stea-apps/stea-code.png"
            alt="STEA Code"
            className="sc-topbar-logo-img"
            width={36}
            height={36}
          />
          <span>STEA Code</span>
        </a>

        <nav className="sc-topbar-nav" aria-label="Marketplace navigation">
          {NAV_LINKS.map((item) => {
            const isActive = (() => {
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
                <a key={item.id} href={item.href} className={isActive ? "is-active" : ""}>
                  {tLocal(item.label)}
                </a>
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
                onClick={() => {
                  if (item.filter) {
                    if (item.filter.category) setCategory(item.filter.category);
                    if (item.filter.pricing) setPricing(item.filter.pricing);
                  }
                  setViewMode(item.mode || "explore");
                }}
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
            aria-label="Join the STEA Code community on Telegram"
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
              onClick={() => setMemberGateOpen(true)}
            >
              Sign in
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                   strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          )}

          <button
            type="button"
            className={`sc-go-unlimited-btn ${goUnlimitedPulse ? "is-pulsing" : ""}`}
            onClick={handleGoUnlimited}
            aria-label="Go Unlimited — subscription plans coming soon"
          >
            <span className="sc-go-unlimited-shine" aria-hidden="true" />
            <span className="sc-go-unlimited-label">Go Unlimited</span>
          </button>

          <button
            type="button"
            className="sc-topbar-icon-btn sc-mobile-only"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {goUnlimitedToast && (
        <div className="sc-go-unlimited-toast" role="status">
          <span className="sc-go-unlimited-toast-dot" aria-hidden="true" />
          Plans launching soon — stay tuned
        </div>
      )}

      {menuOpen ? (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          onGoWorld={onGoWorld}
          tLocal={tLocal}
          onSelectNav={(item) => {
            setMenuOpen(false);
            if (item.href) {
              navigate(item.href);
            } else {
              if (item.filter?.category) setCategory(item.filter.category);
              if (item.filter?.pricing) setPricing(item.filter.pricing);
              setViewMode(item.mode || "explore");
            }
          }}
        />
      ) : null}

      <main>
        {effectiveView === "checkout" ? (
          <SteaCodeCheckoutPage
            productId={checkoutProductId}
            locale={uiLocale}
            onBack={() => {
              const sp = new URLSearchParams(location.search);
              sp.delete("view");
              sp.delete("product");
              navigate(`${location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`);
            }}
            onRequireAuth={(pid) => {
              setMemberGateAction({ type: "checkout", productId: pid || checkoutProductId });
              setMemberGateOpen(true);
            }}
          />
        ) : effectiveView === "payment-return" ? (
          <SteaCodePaymentReturnPage
            orderId={orderParam}
            locale={uiLocale}
            onBack={() => {
              const sp = new URLSearchParams(location.search);
              sp.delete("view");
              sp.delete("order");
              sp.delete("payment_intent");
              sp.delete("payment_intent_client_secret");
              sp.delete("redirect_status");
              navigate(`${location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`);
            }}
            onGoPurchases={() => {
              const sp = new URLSearchParams(location.search);
              sp.set("view", "purchases");
              sp.delete("order");
              navigate(`${location.pathname}?${sp.toString()}`);
            }}
            onGoProduct={(pid) => {
              const p = fullCatalog.find((item) => item.id === pid || item.slug === pid);
              if (p) {
                openProduct(p);
              } else {
                const sp = new URLSearchParams(location.search);
                sp.delete("view");
                sp.delete("order");
                navigate(`${location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`);
              }
            }}
            onRequireAuth={() => {
              setMemberGateAction({ type: "purchases" });
              setMemberGateOpen(true);
            }}
          />
        ) : effectiveView === "purchases" ? (
          <SteaCodePurchasesPage
            locale={uiLocale}
            onGoHome={() => {
              if (location.pathname === "/library") {
                navigate("/");
              } else {
                const sp = new URLSearchParams(location.search);
                sp.delete("view");
                navigate(`${location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`);
              }
            }}
            onGoProduct={(pid) => {
              const p = fullCatalog.find((item) => item.id === pid || item.slug === pid);
              if (p) {
                openProduct(p);
              }
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
              category={category}
              setCategory={setCategory}
              pricing={pricing}
              setPricing={setPricing}
              framework={framework}
              setFramework={setFramework}
            />
            {isFallbackCatalog && (
              <div
                className="sc-fallback-catalog-banner"
                role="status"
                style={{
                  margin: "0 0 20px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  background: "rgba(245, 166, 35, 0.12)",
                  border: "1px solid rgba(245, 166, 35, 0.35)",
                  color: "#f5a623",
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "14px" }}>⚡</span>
                <span>
                  <strong>{uiLocale === "zhCN" ? "演示/备用数据：" : "Fallback / Demo Catalog:"}</strong>{" "}
                  {uiLocale === "zhCN"
                    ? "实时 API 暂不可达，当前正在展示内置种子产品。"
                    : "Live API unreachable or returned non-JSON. Showing bundled seed products."}
                </span>
              </div>
            )}
            {isLoading ? (
              <div className="sc-product-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SteaCodeProductSkeleton key={i} />
                ))}
              </div>
            ) : homepageProducts.length > 0 ? (
              <div className="sc-product-grid">
                {homepageProducts.map((product) => (
                  <PreviewErrorBoundary key={getProductIdentity(product)}>
                    <CodeProductCard
                      product={product}
                      tLocal={tLocal}
                      onOpen={() => openProduct(product)}
                      isFavorited={favorites.has(getProductIdentity(product))}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </PreviewErrorBoundary>
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

            {hasExpandableProducts ? (
              <div className="sc-market-show-more-wrap">
                <button
                  type="button"
                  className="sc-market-show-more"
                  onClick={handleProductExpansion}
                  aria-expanded={isFullyExpanded}
                >
                  <span>
                    {isFullyExpanded
                      ? (uiLocale === "zhCN" ? "收起" : "Show less")
                      : (uiLocale === "zhCN" ? "显示更多" : "Show more")}
                  </span>
                  <span aria-hidden="true">
                    {isFullyExpanded ? "↑" : "→"}
                  </span>
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          /* ================= STOREFRONT HOMEPAGE SECTIONS ================= */
          <>
            {/* 1. HERO */}
            <section className={`sc-market-hero ${heroReady ? 'is-ready' : ''}`}>
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

              <h1 className="sc-hero-title"><span>Build better.</span><strong>Code faster.</strong></h1>
              <p>{tLocal(COPY.sub)}</p>
              <form className="sc-market-search" onSubmit={submit} role="search">
                <Search size={18} />
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
                    setViewMode("explore");
                  }}
                >
                  {tLocal(COPY.browseFree)} <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="sc-market-secondary sc-hero-cta-secondary"
                  onClick={() => {
                    setPricing("Premium");
                    setCategory("All");
                    setViewMode("explore");
                  }}
                >
                  {tLocal(COPY.browsePremium)}
                </button>
              </div>
              <div
                className="sc-tech-strip sc-hero-tech-pills"
                aria-label="Supported technologies"
              >
                {CODE_PRODUCT_TECH.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
            </section>

            {/* 2. LATEST & FEATURED PRODUCTS */}
            <section id="trending" className="sc-market-section">
              <div className="sc-market-section-head">
                <div>
                  <h2>{tLocal(COPY.trendingTitle)}</h2>
                  <p>{tLocal(COPY.trendingSub)}</p>
                </div>
                <button
                  type="button"
                  className="sc-tool-back-link sc-view-all-link"
                  onClick={() => {
                    setCategory("All");
                    setPricing("All");
                    setViewMode("explore");
                  }}
                >
                  <span>{tLocal(COPY.viewAll)}</span>
                  <svg className="sc-view-all-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>

              {/* Category filter pills */}
              <div className="sc-homepage-pill-row" role="tablist" aria-label="Product categories">
                {["All", "Buttons", "Cards", "Forms", "Text Effects", "Animations", "Backgrounds", "Loaders", "Navigation", "Portfolio", "Toggle Switches"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={category === cat}
                    className={`sc-homepage-pill ${category === cat ? "is-active" : ""}`}
                    onClick={() => {
                      setCategory(cat);
                      setPricing("All");
                      setFramework("All Frameworks");
                    }}
                  >
                    {tLocal(CATEGORY_LABELS[cat] || { en: cat, zhCN: cat })}
                  </button>
                ))}
              </div>

              {isFallbackCatalog && (
                <div
                  className="sc-fallback-catalog-banner"
                  role="status"
                  style={{
                    margin: "0 0 20px",
                    padding: "9px 14px",
                    borderRadius: "10px",
                    background: "rgba(245, 166, 35, 0.12)",
                    border: "1px solid rgba(245, 166, 35, 0.35)",
                    color: "#f5a623",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚡</span>
                  <span>
                    <strong>{uiLocale === "zhCN" ? "演示/备用数据：" : "Fallback / Demo Catalog:"}</strong>{" "}
                    {uiLocale === "zhCN"
                      ? "实时 API 暂不可达，当前正在展示内置种子产品。"
                      : "Live API unreachable or returned non-JSON. Showing bundled seed products."}
                  </span>
                </div>
              )}

              {isLoading ? (
                <div className="sc-product-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SteaCodeProductSkeleton key={i} />
                  ))}
                </div>
              ) : homepageProducts.length > 0 ? (
                <div className="sc-product-grid">
                  {homepageProducts.map((product) => (
                    <PreviewErrorBoundary key={getProductIdentity(product)}>
                      <CodeProductCard
                        product={product}
                        tLocal={tLocal}
                        onOpen={() => openProduct(product)}
                        isFavorited={favorites.has(getProductIdentity(product))}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </PreviewErrorBoundary>
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
            </section>


          </>
        )}
      </main>

      <footer className="sc-footer">
        <div className="sc-footer-grid">
          {/* BRAND COLUMN */}
          <div className="sc-footer-brand">
            <a href="/code" className="sc-footer-brand-logo">
              <img src="/stea-apps/stea-code.png" alt="STEA Code" width={28} height={28} />
              STEA Code
            </a>
            <p className="sc-footer-tagline">
              The home of premium code components for modern developers.
            </p>
            <div className="sc-footer-social" aria-label="Social links">
              <a href="https://www.instagram.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://t.me/steacode" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://x.com/steacode" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@steacode" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* EXPLORE COLUMN */}
          <div className="sc-footer-column">
            <h4>Explore</h4>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("All"); setPricing("All"); }}>All Components</a>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("Buttons"); setPricing("All"); }}>Buttons</a>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("Cards"); setPricing("All"); }}>Cards</a>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("Forms"); setPricing("All"); }}>Forms</a>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("Loaders"); setPricing("All"); }}>Loaders</a>
            <a href="/code" onClick={(e) => { e.preventDefault(); setViewMode("explore"); setCategory("Navigation"); setPricing("All"); }}>Navigation</a>
          </div>

          {/* RESOURCES COLUMN */}
          <div className="sc-footer-column">
            <h4>Resources</h4>
            <a href="/tools">Developer Tools</a>
            <a href="#hosting-deployment">Hosting &amp; Deployment</a>
            <a href="#guides">Developer Guides</a>
            <a href="#inspiration">Website Inspiration</a>
            <a href="#monetize">Monetize &amp; Grow</a>
            <a href="/china">Mainland China</a>
          </div>

          {/* COMPANY COLUMN */}
          <div className="sc-footer-column">
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/changelog">Changelog</a>
            <a href="/contact">Contact</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/refund">Refund Policy</a>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="sc-footer-bottom">
          <span>&copy; 2026 STEA Code. All rights reserved.</span>
          <span className="sc-footer-bottom-right">Made for developers &hearts;</span>
        </div>

        {/* GIANT FADED WORDMARK */}
        <div className="sc-footer-wordmark" aria-hidden="true">
          <svg
            className="sc-footer-wordmark-svg"
            viewBox="0 0 1200 200"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="STEA CODE"
          >
            <text
              x="600"
              y="150"
              textAnchor="middle"
              fontFamily="'Instrument Serif', Georgia, serif"
              fontWeight="700"
              fontSize="180"
              fill="currentColor"
              letterSpacing="-4"
            >
              STEA CODE
            </text>
          </svg>
        </div>
      </footer>
      <AnimatePresence>
        {selected && (
          <ProductDetail
            key={`product-detail-${getProductIdentity(selected)}`}
            product={selected}
            onClose={() => closeProduct()}
            tLocal={tLocal}
            isFavorited={favorites.has(getProductIdentity(selected))}
            onToggleFavorite={handleToggleFavorite}
            onUnlockPremium={(product) => {
              const productId = String(
                product?.id || product?.slug || ""
              ).trim();

              if (!productId) return;

              const user = getFirebaseAuth()?.currentUser;

              if (!user) {
                closeProduct();
                requestAuthForCheckout(productId);
                return;
              }
              closeProduct();
              goToCheckout(productId);
            }}
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

function MobileMenu({ onClose, onGoWorld, tLocal, onSelectNav }) {
  return (
    <div className="sc-market-drawer" role="dialog" aria-modal="true" aria-label="STEA Code menu">
      <button className="sc-market-drawer-bg" onClick={onClose} aria-label="Close menu" />
      <section className="sc-market-drawer-panel">
        <button type="button" className="sc-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {NAV_LINKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="sc-mobile-nav-item"
            style={{
              background: "none",
              border: "none",
              color: "#f8fafc",
              fontSize: "16px",
              fontWeight: "600",
              textAlign: "left",
              padding: "12px 0",
              cursor: "pointer",
            }}
            onClick={() => onSelectNav?.(item)}
          >
            {tLocal(item.label)}
          </button>
        ))}
        <a href="/profile" onClick={onClose}>{tLocal(COPY.account)}</a>
        {RESOURCE_LINKS.map((item) => (
          <button key={item.id} type="button" onClick={() => { onClose(); onGoWorld(item.view, item.intent); }}>
            {tLocal(item.title)}
          </button>
        ))}
      </section>
    </div>
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

function ProductControls({ tLocal, uiLocale = "en", category, setCategory, pricing, setPricing, framework, setFramework }) {
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
        <div className="sc-market-tabs">{CODE_PRODUCT_CATEGORIES.map((cat) => <button key={cat} type="button" className={category === cat ? "is-active" : ""} onClick={() => setCategory(cat)}>{tLocal(CATEGORY_LABELS[cat] || { en: cat, zhCN: cat })}</button>)}</div>
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
            { value: "Premium", label: tLocal(COPY["premium"] || "Premium") },
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

function CodeProductCard({ product, tLocal, onOpen, isFavorited, onToggleFavorite }) {
  const isFree = product.pricingType === "free";
  const productId = getProductIdentity(product);
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

  // Dynamic aspect ratio from admin-configured design canvas dimensions.
  // Falls back to 640×480 (4:3 — STEA Code standard card canvas) if not set.
  const designW = Number(product?.designWidth)  || 640;
  const designH = Number(product?.designHeight) || 480;
  const previewAspect = `${designW} / ${designH}`;

  // --- Motion: subtle lift on hover, press scale. Honors prefers-reduced-motion. ---
  const reduceMotion = useReducedMotion();

  const cardHover = reduceMotion
    ? {}
    : { y: -4, transition: { type: "spring", stiffness: 320, damping: 22, mass: 0.5 } };
  const cardTap = reduceMotion
    ? {}
    : { scale: 0.985, transition: { duration: 0.12 } };

  const openModal = useCallback(() => {
    console.log("[STEA Code] Card clicked, opening modal for:", productId);
    if (typeof onOpen === "function") onOpen();
  }, [onOpen, productId]);

  return (
    <motion.button
      type="button"
      className={`sc-code-card sc-code-card--v2 ${isFree ? "is-free" : "is-premium"}`}
      onClick={(event) => {
        event.preventDefault();
        openModal();
      }}
      whileHover={cardHover}
      whileTap={cardTap}
      aria-label={title}
      data-preview-product={productId}
    >
      {/* Preview area — aspect ratio driven by product design canvas (designWidth / designHeight).
          Falls back to 640:480 (4:3) if admin dimensions aren't set. Edge-to-edge, no internal scroll. */}
      <div
        className="sc-code-card__preview-wrap"
        style={{ aspectRatio: previewAspect }}
      >
        <div className="sc-code-card__preview">
          <div className="sc-product-preview-art">
            <ProductPreview product={product} fillMode="cover" cardZoom={product.cardZoom || "full"} offsetX={product.cardOffsetX || 0} offsetY={product.cardOffsetY || 0} interactive={false} />
          </div>
        </div>

        {/* Favorite button */}
        <button
          type="button"
          className={`sc-card-favorite ${isFavorited ? 'is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onToggleFavorite) onToggleFavorite(productId);
          }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Caption — title + category left, badge right */}
      <div className="sc-code-card__caption">
        <div className="sc-code-card__caption-main">
          <h3 className="sc-code-card__title">{title}</h3>
          <p className="sc-code-card__category">{categoryLabel}</p>
        </div>
        <span className={`sc-code-card__price-badge ${isFree ? "is-free" : "is-premium"}`}>
          {isFree ? tLocal({ en: "Free", zhCN: "免费" }) : price}
        </span>
      </div>
    </motion.button>
  );
}

/*
 * Homepage approval is driven by the product homepageVisible field
 * (saved via Admin and filtered by GET /api/stea-code/catalog?scope=homepage).
 */
const NATIVE_PRODUCT_PREVIEWS = Object.freeze({});

function getProductIdentity(product) {
  return String(product?.id || product?.slug || "").trim();
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
  const posterKey = product?.preview?.posterKey;
  if (posterKey && typeof posterKey === "string" && posterKey.trim()) {
    return `/api/stea-code/media/${posterKey.trim()}`;
  }
  return product?.posterImageUrl || null;
}

function ProductVideoPreview({ videoUrl, title, onVideoError }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || loadError) return undefined;

    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            video.play().catch(() => {});
          } else if (entry && !entry.isIntersecting) {
            video.pause();
          }
        },
        { threshold: 0.05, rootMargin: "150px" }
      );
      observer.observe(container);
    } else {
      video.play().catch(() => {});
    }

    return () => {
      if (observer && container) {
        observer.unobserve(container);
        observer.disconnect();
      }
    };
  }, [videoUrl, loadError]);

  if (loadError) return null;

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
        background: "#080c14",
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        aria-label={title || "Product video preview"}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        onError={() => {
          setLoadError(true);
          if (typeof onVideoError === "function") onVideoError();
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          borderRadius: "12px",
          pointerEvents: "none",
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
  fillMode = "cover",
  cardZoom = undefined,
  modalZoom = 1,
  offsetX = 0,
  offsetY = 0,
  hideToolbar = false,
  lazy = false,
  rootMargin = "0px",
}, ref) {
  const productId = getProductIdentity(product);
  const designW = Number(product?.designWidth) || 0;
  const designH = Number(product?.designHeight) || 0;
  const categoryLabel =
    CATEGORY_LABELS[product?.category]?.en || product?.category || "Code preview";
  const NativePreview = NATIVE_PRODUCT_PREVIEWS[productId];

  const videoUrl = getPreviewVideoUrl(product);
  const hasVideo = Boolean(videoUrl);

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

  // Priority 2: Live interactive code preview (the PRIMARY experience).
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
          <SteaCodeProductLivePreview
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
          <SteaCodeProductLivePreview
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
          <SteaCodeProductLivePreview
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
          />
        ) : product?.posterImageUrl ? (
          <img
            src={String(product.posterImageUrl)}
            alt={product?.titleEn || product?.titleZh || productId || "Preview poster"}
            loading="lazy"
            className="sc-preview-poster-image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              borderRadius: "12px",
            }}
          />
        ) : (
          <div
            className="sc-preview-unavailable"
            aria-label="Preview unavailable"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(120% 80% at 50% 0%, rgba(245,166,35,0.06), rgba(15,23,42,0.00) 60%), rgba(15,23,42,0.02)",
              borderRadius: "12px",
              color: "rgba(148, 163, 184, 0.9)",
              fontSize: "12px",
              letterSpacing: "0.02em",
              gap: "8px",
            }}
          >
            <Code2 size={24} style={{ color: "rgba(245, 166, 35, 0.7)" }} />
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

function ProductDetail({
  product,
  onClose,
  tLocal,
  onUnlockPremium,
  isFavorited,
  onToggleFavorite,
}) {
  const previewRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRepo, setCopiedRepo] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const [premiumAccess, setPremiumAccess] = useState({
    loading: false,
    allowed: false,
    licenseType: "",
    files: [],
    error: "",
  });
  const [activePremiumFile, setActivePremiumFile] = useState(0);
  const [premiumCopied, setPremiumCopied] = useState("");
  const [packageDownloading, setPackageDownloading] = useState(false);
  const [packageError, setPackageError] = useState("");
  const [freeRemoteFiles, setFreeRemoteFiles] = useState([]);
  const [freeRemoteLoading, setFreeRemoteLoading] = useState(false);
  const [freeRemoteError, setFreeRemoteError] = useState("");
  const [aiPromptCopied, setAiPromptCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailMediaMode, setDetailMediaMode] = useState("demo");
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const sourceMenuRef = useRef(null);

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

  // Always default to the interactive live demo — users should touch and
  // feel the running code, not watch a recorded video. Video remains an
  // optional secondary tab for products that ship one.
  useEffect(() => {
    setDetailMediaMode("demo");
  }, [product?.id, product?.slug]);

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

        setActivePremiumFile(0);
        setPremiumCopied("");
      }

      if (!product || product.pricingType !== "premium" || !productId) {
        return;
      }

      const user = getFirebaseAuth()?.currentUser;

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

        setActivePremiumFile(0);
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

    const user = getFirebaseAuth()?.currentUser;

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

  const isPremium = product.pricingType === "premium";
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

  const usageGuide =
    tLocal(label(product, "usageGuideEn", "usageGuideZh")) ||
    product.usageGuideEn ||
    product.usageGuide ||
    product.howToUse ||
    "Add the files to your project, follow the included setup instructions and customize the component for your interface.";

  const usageSteps = useMemo(() => {
    const raw = String(usageGuide || "").trim();
    if (!raw) return [];
    return raw
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^#{1,6}\s/.test(line))          // drop markdown headings
      .map((line) =>
        line
          .replace(/^\d+[\.\)]\s*/, "")                   // drop "1. " or "2) "
          .replace(/^[-*•]\s*/, "")                       // drop bullets
          .trim()
      )
      .filter((line) => line.length > 0);
  }, [usageGuide]);

  const included =
    Array.isArray(product.included) && product.included.length
      ? product.included
      : isPremium
      ? [
          product.hasSource !== false ? "Complete source files" : null,
          "Ready-to-use component",
          "Responsive design",
          "Installation instructions",
          "Commercial use according to license",
        ].filter(Boolean)
      : [
          product.hasSource !== false ? "Complete source files" : null,
          "Ready-to-use component",
          "Responsive design",
          "Installation instructions",
          "Free for personal and commercial projects",
        ].filter(Boolean);

  const safeIncluded =
    isFree && product.hasSource === false
      ? included.filter(
          (item) =>
            !/source\s*files?/i.test(String(item)) &&
            !/源代码/i.test(String(item))
        )
      : included;

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

  const handlePremiumBuy = () => {
    onUnlockPremium?.(product);
  };

  const premiumFiles = premiumAccess.files || [];
  const selectedPremiumFile =
    premiumFiles[activePremiumFile] || premiumFiles[0] || null;

  const copyPremiumFile = async (file) => {
    if (!file?.content) return;

    try {
      await navigator.clipboard.writeText(file.content);
      setPremiumCopied(file.path || "file");
      window.setTimeout(() => setPremiumCopied(""), 1500);
    } catch (error) {
      console.error("Premium file copy failed", error);
    }
  };

  const copyAllPremiumCode = async () => {
    if (!premiumFiles.length) return;

    const combined = premiumFiles
      .map(
        (file) =>
          `/* ==========================================
   ${file.path}
   ========================================== */

${file.content}`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(combined);
      setPremiumCopied("__all__");
      window.setTimeout(() => setPremiumCopied(""), 1600);
    } catch (error) {
      console.error("Copy all premium code failed", error);
    }
  };

  const downloadPremiumPdf = () => {
    if (!premiumFiles.length) return;

    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    let y = 54;

    const ensureSpace = (needed = 80) => {
      if (y + needed > pageHeight - 50) {
        doc.addPage();
        y = 54;
      }
    };

    const heading = (text, size = 16) => {
      ensureSpace(50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.text(String(text), margin, y);
      y += size + 10;
    };

    const paragraph = (text, size = 10) => {
      const lines = doc.splitTextToSize(
        String(text || ""),
        contentWidth
      );

      ensureSpace(lines.length * (size + 4) + 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.text(lines, margin, y);
      y += lines.length * (size + 4) + 10;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("STEA Code", margin, y);
    y += 36;

    doc.setFontSize(24);
    doc.text(title, margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `${
        premiumAccess.licenseType === "commercial"
          ? "Commercial"
          : "Personal"
      } License`,
      margin,
      y
    );

    y += 38;

    heading("What you purchased", 15);
    paragraph(description);

    heading("Requirements", 15);
    paragraph(
      frameworks.length
        ? frameworks.join(" • ")
        : "Use the included files in your web project."
    );

    heading("How to use", 15);

    const pdfSteps = usageSteps.length
      ? usageSteps
      : [
          "Add the included files to your project.",
          "Import the component and its styles.",
          "Render the component where you need it.",
          "Customize text, colors, timing and layout for your project.",
        ];

    pdfSteps.forEach((step, index) => {
      paragraph(`${index + 1}. ${step}`);
    });

    heading("Project files", 15);

    premiumFiles.forEach((file) => {
      ensureSpace(100);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(file.path || "Code file", margin, y);
      y += 18;

      doc.setFont("courier", "normal");
      doc.setFontSize(8);

      const lines = doc.splitTextToSize(
        String(file.content || ""),
        contentWidth
      );

      for (const line of lines) {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 11;
      }

      y += 18;
    });

    heading("Need more help?", 15);
    paragraph(
      "Visit STEA Code Developer Guides for free tutorials, setup help and developer resources."
    );

    heading("License", 15);
    paragraph(
      premiumAccess.licenseType === "commercial"
        ? "Commercial license. Use according to the license included with this purchase."
        : "Personal license. Redistribution of this code as a standalone product is not permitted."
    );

    const safeTitle = String(
      product?.slug || product?.id || "premium-code"
    )
      .replace(/[^a-z0-9-_]+/gi, "-")
      .toLowerCase();

    doc.save(`stea-code-${safeTitle}-complete-guide.pdf`);
  };

  // Download the full product package from R2 (signed URL, 5-min expiry).
  const downloadPackage = async () => {
    const productId = String(product?.id || product?.slug || "").trim();
    if (!productId || packageDownloading) return;
    setPackageDownloading(true);
    setPackageError("");
    try {
      await downloadSteaCodeSource(productId);
    } catch (err) {
      setPackageError(err?.message || "Download failed. Please try again.");
    } finally {
      setPackageDownloading(false);
    }
  };


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
        className="sc-product-modal-panel sc-premium-product-detail"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      >
        <div className="sc-product-detail-media">
          <div className="sc-modal-media-header">
            <div className="sc-modal-media-header-left">
              <div
                className={`sc-product-detail-type ${
                  isPremium ? "is-premium" : "is-free"
                }`}
              >
                {isPremium
                  ? tLocal({ en: "PREMIUM", zhCN: "高级" })
                  : tLocal({ en: "FREE", zhCN: "免费" })}
              </div>

              {hasVideo && hasLiveDemo && (
                <div
                  className="sc-detail-media-switcher"
                  style={{
                    display: "inline-flex",
                    gap: "4px",
                    background: "rgba(255,255,255,0.05)",
                    padding: "3px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <button
                    type="button"
                    className={`sc-media-switch-btn ${detailMediaMode === "video" ? "is-active" : ""}`}
                    onClick={() => setDetailMediaMode("video")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      background: detailMediaMode === "video" ? "rgba(245,166,35,0.2)" : "transparent",
                      color: detailMediaMode === "video" ? "#f5a623" : "rgba(245,247,251,0.6)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {tLocal({ en: "Preview Video", zhCN: "视频预览" })}
                  </button>
                  <button
                    type="button"
                    className={`sc-media-switch-btn ${detailMediaMode === "demo" ? "is-active" : ""}`}
                    onClick={() => setDetailMediaMode("demo")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      background: detailMediaMode === "demo" ? "rgba(245,166,35,0.2)" : "transparent",
                      color: detailMediaMode === "demo" ? "#f5a623" : "rgba(245,247,251,0.6)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {tLocal({ en: "Live Demo", zhCN: "实时演示" })}
                  </button>
                </div>
              )}
            </div>

            <div className="sc-product-modal-actions">
              <button
                className={`sc-product-fav-btn ${isFavorited ? 'is-active' : ''}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleFavorite) onToggleFavorite(getProductIdentity(product));
                }}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>

              <div className="sc-modal-actions-divider" />

              <button
                type="button"
                className="sc-modal-preview-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  previewRef.current?.reload();
                }}
                aria-label="Reload preview"
                title="Reload preview"
              >
                <RotateCw size={16} />
              </button>
              <button
                type="button"
                className="sc-modal-preview-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  previewRef.current?.toggleFullscreen();
                  setIsFullscreen((v) => !v);
                }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <div className="sc-modal-actions-spacer" />

              <button
                className="sc-product-close sc-icon-btn"
                type="button"
                onClick={onClose}
                aria-label={tLocal({ en: "Close", zhCN: "关闭" })}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="sc-product-detail-preview-shell"
            style={{
              '--preview-aspect': `${product.designWidth || 640} / ${product.designHeight || 480}`,
            }}
          >
            <PreviewErrorBoundary>
              {hasVideo && detailMediaMode === "video" ? (
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
                  <SteaCodeProductLivePreview
                    key={`detail-video-${getProductIdentity(product)}`}
                    productId={getProductIdentity(product)}
                    title={product.titleEn || product.titleZh || ""}
                    category={product.category || ""}
                    interactive={true}
                    lazy={false}
                    fillMode="scale"
                    modalZoom={product.modalZoom || 1}
                    designWidth={Number(product.designWidth) || 0}
                    designHeight={Number(product.designHeight) || 0}
                    offsetX={product.modalOffsetX || 0}
                    offsetY={product.modalOffsetY || 0}
                    showControls={false}
                    videoUrl={detailVideoUrl}
                    posterUrl={getPreviewPosterUrl(product) || ""}
                    rootMargin="0px"
                    placeholder={null}
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

          <div className="sc-product-preview-caption">
            <span>
              {hasVideo && detailMediaMode === "video"
                ? tLocal({ en: "Preview Video", zhCN: "视频预览" })
                : tLocal({ en: "Interactive preview", zhCN: "交互预览" })}
            </span>

            <small>
              {tLocal({
                en: "Preview the experience before getting the code.",
                zhCN: "获取代码前先体验最终效果。" })}
            </small>
          </div>
        </div>

        <div className="sc-product-detail-copy">
          <div className="sc-product-detail-topline">
            <span
              className={`sc-product-pill ${
                isPremium ? "is-premium" : "is-free"
              }`}
            >
              {isPremium
                ? tLocal({ en: "Premium Code", zhCN: "高级代码" })
                : tLocal({ en: "Free Code", zhCN: "免费代码" })}
            </span>

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

          <p className="sc-product-detail-description">
            {description}
          </p>

          {craftNote && (
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
            ) : isPremium && premiumAccess.allowed ? (
              <div className="sc-owned-workspace">
                <div className="sc-owned-banner">
                  <div>
                    <span className="sc-owned-badge">
                      ✓ {tLocal({
                        en: "PURCHASED · FULL ACCESS",
                        zhCN: "已购买 · 完整访问",
                      })}
                    </span>

                    <strong>
                      {tLocal({
                        en: "Your complete developer package is unlocked",
                        zhCN: "你的完整开发者代码包已解锁",
                      })}
                    </strong>

                    <small>
                      {premiumAccess.licenseType === "commercial"
                        ? tLocal({
                            en: "Commercial License",
                            zhCN: "商业许可",
                          })
                        : tLocal({
                            en: "Personal License",
                            zhCN: "个人许可",
                          })}
                    </small>
                  </div>
                </div>

                <div className="sc-owned-main-actions">
                  <button
                    type="button"
                    className="sc-owned-primary"
                    onClick={() => {
                      document
                        .querySelector(".sc-owned-files")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    <span>
                      {tLocal({
                        en: "Access Full Code",
                        zhCN: "访问完整代码",
                      })}
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button"
                    className="sc-owned-secondary"
                    onClick={downloadPremiumPdf}
                  >
                    <span>
                      {tLocal({
                        en: "Download Complete PDF",
                        zhCN: "下载完整 PDF",
                      })}
                    </span>
                    <small>
                      {tLocal({
                        en: "Code + setup instructions",
                        zhCN: "代码 + 设置说明",
                      })}
                    </small>
                  </button>

                  {product?.package?.storageKey && (
                    <button
                      type="button"
                      className="sc-owned-secondary"
                      onClick={downloadPackage}
                      disabled={packageDownloading}
                    >
                      <span>
                        {packageDownloading
                          ? tLocal({ en: "Preparing download…", zhCN: "准备下载…" })
                          : tLocal({ en: "Download Package (.zip)", zhCN: "下载压缩包" })}
                      </span>
                      <small>
                        {packageError
                          ? packageError
                          : tLocal({ en: "Full project archive", zhCN: "完整项目压缩包" })}
                      </small>
                    </button>
                  )}
                </div>

                <div className="sc-owned-code-workspace">
                  <aside className="sc-owned-project-panel">
                    <div className="sc-owned-project-head">
                      <div>
                        <strong>
                          {tLocal({
                            en: "Project Files",
                            zhCN: "项目文件",
                          })}
                        </strong>

                        <span>
                          {premiumFiles.length}{" "}
                          {premiumFiles.length === 1
                            ? tLocal({ en: "file", zhCN: "个文件" })
                            : tLocal({ en: "files", zhCN: "个文件" })}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="sc-owned-copy-all-icon"
                        onClick={copyAllPremiumCode}
                        title={
                          premiumCopied === "__all__"
                            ? "Copied"
                            : "Copy all code"
                        }
                      >
                        {premiumCopied === "__all__" ? "✓" : "⧉"}
                      </button>
                    </div>

                    <div className="sc-owned-project-tree">
                      <div className="sc-owned-tree-folder is-open">
                        <span className="sc-owned-tree-chevron">⌄</span>
                        <span className="sc-owned-tree-folder-icon">▰</span>
                        <strong>source</strong>
                      </div>

                      <div className="sc-owned-tree-files">
                        {premiumFiles.map((file, index) => (
                          <button
                            type="button"
                            key={`${file.path}-${index}`}
                            className={
                              "sc-owned-tree-file" +
                              (index === activePremiumFile
                                ? " is-active"
                                : "")
                            }
                            onClick={() =>
                              setActivePremiumFile(index)
                            }
                          >
                            <span
                              className={
                                "sc-owned-file-type-dot is-" +
                                String(
                                  file.language || "text"
                                ).toLowerCase()
                              }
                            >
                              {String(
                                file.language || "txt"
                              )
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>

                            <span className="sc-owned-tree-file-info">
                              <strong>{file.path}</strong>
                              <small>{file.language}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sc-owned-project-footer">
                      <button
                        type="button"
                        onClick={copyAllPremiumCode}
                      >
                        <span>⧉</span>
                        {premiumCopied === "__all__"
                          ? tLocal({
                              en: "All code copied",
                              zhCN: "全部代码已复制",
                            })
                          : tLocal({
                              en: "Copy All Code",
                              zhCN: "复制全部代码",
                            })}
                      </button>
                    </div>
                  </aside>

                  <section className="sc-owned-editor-panel">
                    {selectedPremiumFile ? (
                      <>
                        <header className="sc-owned-editor-head">
                          <div className="sc-owned-editor-file">
                            <span
                              className={
                                "sc-owned-file-type-dot is-" +
                                String(
                                  selectedPremiumFile.language ||
                                    "text"
                                ).toLowerCase()
                              }
                            >
                              {String(
                                selectedPremiumFile.language ||
                                  "txt"
                              )
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {selectedPremiumFile.path}
                              </strong>

                              <small>
                                {String(
                                  selectedPremiumFile.language ||
                                    "text"
                                ).toUpperCase()}
                              </small>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="sc-owned-editor-copy"
                            onClick={() =>
                              copyPremiumFile(
                                selectedPremiumFile
                              )
                            }
                          >
                            <span>⧉</span>

                            {premiumCopied ===
                            selectedPremiumFile.path
                              ? tLocal({
                                  en: "Copied",
                                  zhCN: "已复制",
                                })
                              : tLocal({
                                  en: "Copy",
                                  zhCN: "复制",
                                })}
                          </button>
                        </header>

                        <div className="sc-owned-editor-tabs">
                          <span className="is-active">
                            {selectedPremiumFile.path}
                          </span>
                        </div>

                        <div className="sc-owned-editor-scroll">
                          <pre className="sc-owned-editor-code">
                            {String(
                              selectedPremiumFile.content ||
                                ""
                            )
                              .split("\\n")
                              .map((line, index) => (
                                <span
                                  className="sc-owned-code-line"
                                  key={`${index}-${line.slice(
                                    0,
                                    15
                                  )}`}
                                >
                                  <span className="sc-owned-line-number">
                                    {index + 1}
                                  </span>

                                  <code>
                                    {line || " "}
                                  </code>
                                </span>
                              ))}
                          </pre>
                        </div>

                        <footer className="sc-owned-editor-status">
                          <div>
                            <span>
                              Ln{" "}
                              {String(
                                selectedPremiumFile.content ||
                                  ""
                              ).split("\\n").length}
                            </span>
                            <span>UTF-8</span>
                            <span>LF</span>
                          </div>

                          <strong>
                            ✓{" "}
                            {tLocal({
                              en: "Source ready",
                              zhCN: "源代码已准备好",
                            })}
                          </strong>
                        </footer>
                      </>
                    ) : (
                      <div className="sc-owned-editor-empty">
                        <span>{"</>"}</span>

                        <strong>
                          {tLocal({
                            en: "No source file selected",
                            zhCN: "未选择源文件",
                          })}
                        </strong>
                      </div>
                    )}
                  </section>
                </div>

                <div className="sc-owned-guide">
                  <div>
                    <span>
                      {tLocal({
                        en: "HOW TO USE",
                        zhCN: "使用方法",
                      })}
                    </span>

                    <strong>
                      {tLocal({
                        en: "Turn the purchased code into a working project",
                        zhCN: "将购买的代码应用到实际项目",
                      })}
                    </strong>
                  </div>

                  <div className="sc-owned-guide-steps">
                    {(usageSteps.length
                      ? usageSteps
                      : [
                          tLocal({
                            en: "Add the provided files to your project.",
                            zhCN: "将提供的文件添加到你的项目。",
                          }),
                          tLocal({
                            en: "Import the component and styles.",
                            zhCN: "导入组件和样式。",
                          }),
                          tLocal({
                            en: "Render it where you want the effect.",
                            zhCN: "在需要效果的位置渲染它。",
                          }),
                          tLocal({
                            en: "Customize colors, timing and content.",
                            zhCN: "自定义颜色、时间和内容。",
                          }),
                        ]
                    )
                      .slice(0, 5)
                      .map((step, index) => (
                        <div key={`${index}-${step}`}>
                          <span>{index + 1}</span>
                          <p>{step}</p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="sc-owned-help">
                  <div>
                    <small>
                      {tLocal({
                        en: "Not sure how to use it?",
                        zhCN: "不确定如何使用？",
                      })}
                    </small>

                    <strong>
                      {tLocal({
                        en: "Developer Guides are completely free",
                        zhCN: "开发者指南完全免费",
                      })}
                    </strong>
                  </div>

                  <a href="/code?view=learn">
                    {tLocal({
                      en: "Developer Guides",
                      zhCN: "开发者指南",
                    })}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            ) : isPremium ? (
            <div className="sc-product-action-box is-premium">
              <div className="sc-product-action-copy">
                <span className="sc-product-action-icon">
                  <Lock size={18} />
                </span>

                <div>
                  <strong>
                    {tLocal({
                      en: "Premium source code",
                      zhCN: "高级源代码" })}
                  </strong>

                  <small>
                    {tLocal({
                      en: "Unlock the complete code package after purchase.",
                      zhCN: "购买后解锁完整代码包。" })}
                  </small>
                </div>
              </div>

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

              <p className="sc-product-action-microcopy">
                {tLocal(COPY.oneTime)}
              </p>

              {notice ? (
                <p className="sc-product-action-notice">
                  {notice}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="sc-product-action-box is-free">
              <div className="sc-product-action-copy">
                <span className="sc-product-action-icon">
                  <Check size={18} />
                </span>

                <div>
                  <strong>
                    {tLocal({
                      en: "Free to use",
                      zhCN: "免费使用" })}
                  </strong>

                  <small>
                    {tLocal({
                      en: "Open the code and start building.",
                      zhCN: "打开代码并开始构建。" })}
                  </small>
                </div>
              </div>
            </div>
          )}

          {safeIncluded.length > 0 && (
            <div className="sc-product-detail-section">
              <div className="sc-product-detail-heading">
                <span>
                  {tLocal({
                    en: "What you get",
                    zhCN: "包含内容" })}
                </span>

                <small>
                  {tLocal({
                    en: "Everything needed to start quickly.",
                    zhCN: "快速开始所需的核心内容。" })}
                </small>
              </div>

              <div className="sc-product-included-grid">
                {safeIncluded.map((item, idx) => (
                  <div key={`${idx}-${item}`}>
                    <Check size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ACTION BUTTONS — Copy Prompt / Copy Code / Download ===== */}
          <div className="sc-detail-actions">

            {/* Copy AI Prompt */}
            {product?.aiPrompt && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--prompt ${copiedPrompt ? 'is-copied' : ''}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const text = String(product.aiPrompt);
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(text);
                    } else {
                      // Fallback for non-secure contexts
                      const ta = document.createElement('textarea');
                      ta.value = text;
                      ta.style.position = 'fixed';
                      ta.style.opacity = '0';
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      ta.remove();
                    }
                    setCopiedPrompt(true);
                    recordSteaCodeCopy(getProductIdentity(product));
                    setToast({ type: 'success', message: 'AI Prompt copied' });
                    setTimeout(() => setCopiedPrompt(false), 2200);
                    setTimeout(() => setToast(null), 2600);
                  } catch (err) {
                    console.error('[copy-prompt] failed:', err);
                    setToast({ type: 'error', message: 'Copy failed' });
                    setTimeout(() => setToast(null), 2600);
                  }
                }}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {copiedPrompt ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
                      <circle cx="12" cy="12" r="3.5"/>
                    </svg>
                  )}
                </span>
                <span className="sc-detail-action-label">
                  {copiedPrompt ? 'Prompt Copied' : 'Copy AI Prompt'}
                </span>
              </button>
            )}

            {/* Copy Source Code */}
            {hasFreeSource && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--code ${copiedCode ? 'is-copied' : ''}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const text = sourceCodeHtml;
                    if (!text || !text.trim()) {
                      setToast({ type: 'error', message: 'No source available' });
                      setTimeout(() => setToast(null), 2600);
                      return;
                    }
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(text);
                    } else {
                      const ta = document.createElement('textarea');
                      ta.value = text;
                      ta.style.position = 'fixed';
                      ta.style.opacity = '0';
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      ta.remove();
                    }
                    setCopiedCode(true);
                    recordSteaCodeCopy(getProductIdentity(product));
                    setToast({ type: 'success', message: 'Source code copied' });
                    setTimeout(() => setCopiedCode(false), 2200);
                    setTimeout(() => setToast(null), 2600);
                  } catch (err) {
                    console.error('[copy-source] failed:', err);
                    setToast({ type: 'error', message: 'Copy failed' });
                    setTimeout(() => setToast(null), 2600);
                  }
                }}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  {copiedCode ? (
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
                  {copiedCode ? 'Code Copied' : 'Copy Source Code'}
                </span>
              </button>
            )}

            {/* Download ZIP */}
            {canDownload && product?.package?.storageKey && (
              <button
                type="button"
                className={`sc-detail-action sc-detail-action--download ${downloading ? 'is-loading' : ''}`}
                disabled={downloading}
                onClick={(e) => {
                  e.stopPropagation();
                  setDownloading(true);
                  window.location.href = `/api/stea-code/products/${product.id}/download`;
                  setTimeout(() => setDownloading(false), 1500);
                }}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </span>
                <span className="sc-detail-action-label">
                  {downloading ? 'Preparing download…' : 'Download Source Code'}
                </span>
              </button>
            )}

            {/* View Live Site */}
            {typeof product?.liveUrl === "string" && product.liveUrl.trim() && (
              <a
                href={product.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sc-detail-action sc-detail-action--live"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sc-detail-action-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                       strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </span>
                <span className="sc-detail-action-label">View Live Site</span>
              </a>
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

          <div className="sc-product-detail-section">
            <div className="sc-product-detail-heading">
              <span>
                {tLocal({
                  en: "How to use",
                  zhCN: "如何使用" })}
              </span>

              <small>
                {tLocal({
                  en: "Simple setup. No unnecessary documentation.",
                  zhCN: "简单设置，无需冗长文档。" })}
              </small>
            </div>

            <div className="sc-product-usage-steps">
              {(usageSteps.length
                ? usageSteps
                : [
                    tLocal({
                      en: "Add the component to your project.",
                      zhCN: "将组件添加到你的项目。" }),
                  ]
              ).map((step, index) => (
                <div key={`${index}-${step}`}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

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
    </motion.div>,
    document.body
  );
}
