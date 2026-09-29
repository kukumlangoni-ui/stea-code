/* ======================================================================
 * STEA Code V2 Shell — single root component for /code.
 *
 * 7-world router (plan/build/tools/ship/learn/inspire/monetize)
 *   - legacy 8 views silently redirect → new canonical view (URL updates once)
 *   - centralized V2 data loader (patterns / resources / knowledge / inspiration)
 *   - region-aware + i18n + prefers-reduced-motion honored
 *   - Cmd/Ctrl+K palette (new V2 palette — groups by 7 worlds)
 *   - focused, quiet shell header inside worlds only (not homepage)
 *   - SEO: document.title + documentElement.lang synced per world + locale
 *
 * Responsibilities:
 *   1. Parse `view` query param, map old → new, normalize to V2_WORLD_ID.
 *   2. Load data (with caching) → pass to 7-world view router + search palette.
 *   3. Animate view transitions.
 *   4. Attach global Cmd+K / slash shortcuts.
 *   5. Set document.title and documentElement.lang per current world + locale.
 * =================================================================== */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";

import SteaCodeShellHeaderV2 from "../../components/stea-code/SteaCodeShellHeaderV2.jsx";
import SearchPaletteV2 from "../../components/stea-code/SearchPaletteV2.jsx";
import SteaCodeHomeV2 from "./SteaCodeHomeV2.jsx";
import V2Views from "./V2Views.jsx";
import SteaCodeCheckoutPage from "./SteaCodeCheckoutPage.jsx";
import SteaCodePaymentReturnPage from "./SteaCodePaymentReturnPage.jsx";
import SteaCodePurchasesPage from "./SteaCodePurchasesPage.jsx";
import { useSteaCodeI18n } from "../../components/stea-code/useSteaCodeI18n.js";
import SteaCodeMemberGate from "../../components/stea-code/SteaCodeMemberGate.jsx";
import {
  STEA_CODE_ACTION_TYPES,
  clearSteaCodePendingAction,
  getSteaCodePendingAction,
  makePaymentReturnAction,
  makePremiumCheckoutAction,
  makePurchasesAction,
  setSteaCodePendingAction,
} from "../../services/steaCodeResumeAction.js";
import { getFirebaseAuth, onAuthStateChanged } from "../../firebase.js";

import {
  v2IdleSnapshot,
  v2LoadingSnapshot,
  adaptIntoV2Snapshot,
} from "../../data/stea-code/loadSteaCodeV2.js";
import { normalizeWorldId, V2_COMPAT_MAP } from "../../data/stea-code/v2Worlds.js";
import { useMultiCollection } from "../../hooks/useMultiCollection.js";

const LEGACY_COLLECTIONS = ["stea_daily", "tips_resources", "resources", "updates", "study_resources"];
const CODE_COLLECTIONS = [
  "stea_code_resources",
  "stea_code_inspiration",
  "stea_code_hosting",
  "stea_code_resources_directory",
];

const IDLE = v2IdleSnapshot();
const LOADING = v2LoadingSnapshot();

const SEO_TITLES = {
  home: {
    en: "STEA Code — Developer Tools, Code, Hosting & Guides",
    zhCN: "STEA Code — 全球开发者工具、代码、托管与指南",
  },
  plan: {
    en: "Plan & Design Tools for Developers | STEA Code",
    zhCN: "开发者规划与设计工具 | STEA Code",
  },
  build: {
    en: "Code Snippets & UI Components for Developers | STEA Code",
    zhCN: "开发者代码片段与 UI 组件 | STEA Code",
  },
  tools: {
    en: "Developer Tools & Resources | STEA Code",
    zhCN: "开发者工具与资源 | STEA Code",
  },
  ship: {
    en: "Hosting & Deployment Tools for Developers | STEA Code",
    zhCN: "网站托管与部署工具 | STEA Code",
  },
  learn: {
    en: "Developer Guides & Web Development Resources | STEA Code",
    zhCN: "Web 开发指南与学习资源 | STEA Code",
  },
  inspire: {
    en: "Website Design Inspiration & UI References | STEA Code",
    zhCN: "网站设计灵感与 UI 参考 | STEA Code",
  },
  monetize: {
    en: "Website Monetization, Payments & SEO Tools | STEA Code",
    zhCN: "网站变现、支付与 SEO 工具 | STEA Code",
  },
  checkout: {
    en: "Checkout · STEA Code",
    zhCN: "结账 · STEA Code",
  },
  "payment-return": {
    en: "Payment Status · STEA Code",
    zhCN: "付款状态 · STEA Code",
  },
  purchases: {
    en: "My Purchases · STEA Code",
    zhCN: "我的购买 · STEA Code",
  },
};

export default function SteaCodeShellV2() {
  const location = useLocation();
  const navigate = useNavigate();
  const { uiLocale } = useSteaCodeI18n();

  /* -------- Auth state — maintained locally so HomeV2 gets user/authLoading -------- */
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  /* -------- Routing (legacy 8 → new 5, canonical view id) ---------- */
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const rawView = (params.get("view") || "").toLowerCase();
  const normalizedWorld = normalizeWorldId(rawView);
  const wasLegacy = Boolean(rawView && V2_COMPAT_MAP[rawView]);

  /** One-time replace for legacy URLs so the user ends up at the clean one. */
  useEffect(() => {
    if (wasLegacy && normalizedWorld) {
      const sp = new URLSearchParams(location.search);
      sp.set("view", normalizedWorld);
      const target = `${location.pathname}?${sp.toString()}${location.hash || ""}`;
      // replace so browser history doesn't retain ugly legacy routes
      navigate(target, { replace: true });
    }
  }, [wasLegacy, normalizedWorld, location.pathname, location.search, location.hash, navigate]);

  // Commerce views (checkout / payment-return / purchases) are not part of the 7-world router.
  const COMMERCE_VIEWS = ["checkout", "payment-return", "purchases"];
  const commerceView = COMMERCE_VIEWS.includes(rawView) ? rawView : null;

  // Commerce query params must exist before auth-gate effects.
  const checkoutProductId = (commerceView === "checkout") ? (params.get("product") || "").trim() : "";
  const orderId = (commerceView === "payment-return") ? (params.get("order") || "").trim() : "";

  const currentWorld = commerceView ? null : normalizedWorld; // null = homepage (or commerce view rendering handled below)

  // SEO titles for commerce / home / worlds
  const seoKey = commerceView || (currentWorld || "home");

  /* -------- STEA Code favicon -------------------------------------- */
  useEffect(() => {
    let icon = document.querySelector('link[rel="icon"]');

    if (!icon) {
      icon = document.createElement("link");
      icon.setAttribute("rel", "icon");
      document.head.appendChild(icon);
    }

    const previousHref = icon.getAttribute("href");
    const previousType = icon.getAttribute("type");

    icon.setAttribute(
      "href",
      "/stea-code-favicon-32.png?v=stea-real-logo-2026"
    );
    icon.setAttribute("type", "image/png");

    let appleIcon = document.querySelector(
      'link[rel="apple-touch-icon"]'
    );

    const hadAppleIcon = Boolean(appleIcon);

    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.setAttribute("rel", "apple-touch-icon");
      document.head.appendChild(appleIcon);
    }

    const previousAppleHref = appleIcon.getAttribute("href");

    appleIcon.setAttribute(
      "href",
      "/stea-code-apple-touch-icon.png?v=stea-real-logo-2026"
    );

    return () => {
      if (previousHref) {
        icon.setAttribute("href", previousHref);
      }

      if (previousType) {
        icon.setAttribute("type", previousType);
      }

      if (previousAppleHref) {
        appleIcon.setAttribute("href", previousAppleHref);
      } else if (!hadAppleIcon) {
        appleIcon.remove();
      }
    };
  }, []);

  /* -------- SEO: document.title + documentElement.lang ------------- */
  useEffect(() => {
    const key = seoKey;
    const titles = SEO_TITLES[key] || SEO_TITLES.home;
    document.title = titles[uiLocale] || titles.en;
    document.documentElement.lang = uiLocale === "zhCN" ? "zh-CN" : "en";

    // SEO noindex for checkout / payment-return / purchases (Section 35)
    let meta = document.querySelector('meta[name="robots"]');
    if (commerceView) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "robots");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", "noindex, nofollow");
    } else if (meta) {
      meta.remove();
    }
  }, [commerceView, seoKey, uiLocale]);

  const setWorld = useCallback(
    (next, extraQuery = {}) => {
      let target;
      if (next == null || next === "home") {
        target = "/code";
      } else {
        const sp = new URLSearchParams(location.search);
        sp.set("view", next);
        Object.entries(extraQuery || {}).forEach(([k, v]) => {
          if (v == null || v === "") sp.delete(k);
          else sp.set(k, String(v));
        });
        target = `${location.pathname}?${sp.toString()}`;
      }
      navigate(target, { replace: false });
    },
    [navigate, location.search, location.pathname]
  );

  /* ----------- Reduced motion --------------------------- */
  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /* ----------- Data loading ----------------------------- */
  const { docs: legacyDocs, loading: legacyLoading } = useMultiCollection(
    LEGACY_COLLECTIONS,
    "createdAt",
    180
  );
  const { docs: cmsDocs, loading: cmsLoading } = useMultiCollection(
    CODE_COLLECTIONS,
    "createdAt",
    260
  );

  const v2Data = useMemo(() => {
    if (cmsLoading || legacyLoading) return LOADING;
    return adaptIntoV2Snapshot(cmsDocs, legacyDocs, "ready", null);
  }, [cmsLoading, legacyLoading, cmsDocs, legacyDocs]);

  /* ----------- Global search palette -------------------- */
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const [initialIntent, setInitialIntent] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setInitialQuery("");
        setInitialIntent(null);
        setPaletteOpen((v) => !v);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
        e.preventDefault();
        setInitialQuery("");
        setInitialIntent(null);
        setPaletteOpen(true);
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [paletteOpen]);

  /* ----------- Motion preset ---------------------------- */
  const motionPreset = reduceMotion
    ? { initial: false, animate: false, exit: false }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.26, ease: "easeOut" },
      };

  /* --------- STEA Code Member Gate (central provider for commerce views) --------- */
  const [memberGateOpen, setMemberGateOpen] = useState(false);
  const [memberGateAction, setMemberGateAction] = useState(null);

  const goToView = (nextView, extras = {}) => {
    const sp = new URLSearchParams(location.search);
    sp.set("view", nextView);
    Object.entries(extras || {}).forEach(([k, v]) => {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, String(v));
    });
    navigate(`${location.pathname}?${sp.toString()}`, { replace: false });
  };

  const resumePendingShellAction = (action) => {
    const a = action || getSteaCodePendingAction();
    if (!a) return;
    clearSteaCodePendingAction();
    setMemberGateAction(null);
    switch (a.type) {
      case STEA_CODE_ACTION_TYPES.PREMIUM_CHECKOUT:
        if (a.productId) goToView("checkout", { product: a.productId });
        break;
      case STEA_CODE_ACTION_TYPES.PURCHASES:
        goToView("purchases");
        break;
      case STEA_CODE_ACTION_TYPES.PAYMENT_RETURN:
        if (a.orderId) goToView("payment-return", { order: a.orderId });
        break;
      default: break;
    }
  };

  // Resume from sessionStorage if authenticated via cross-tab or reload after auth.
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return undefined;
    let handled = false;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !handled) {
        const pending = getSteaCodePendingAction();
        if (pending) {
          handled = true;
          setMemberGateOpen(false);
          resumePendingShellAction(pending);
        }
      }
      if (!user) handled = false;
    });
    return () => unsub();
  }, []);

  const requireAuth = (action) => {
    if (!action) return;
    setSteaCodePendingAction(action);
    setMemberGateAction(action);
    setMemberGateOpen(true);
  };

  const handleShellGateAuth = (_user, action) => {
    setMemberGateOpen(false);
    resumePendingShellAction(action);
  };

  const handleShellGateClose = () => {
    setMemberGateOpen(false);
    const user = getFirebaseAuth()?.currentUser;
    if (!user) {
      clearSteaCodePendingAction();
      setMemberGateAction(null);
    }
  };

  // Pre-check direct views that need authentication → open gate immediately.
  useEffect(() => {
    const user = getFirebaseAuth()?.currentUser;
    if (user) return;
    if (commerceView === "purchases") {
      requireAuth(makePurchasesAction());
    } else if (commerceView === "checkout" && checkoutProductId) {
      requireAuth(makePremiumCheckoutAction(checkoutProductId));
    } else if (commerceView === "payment-return" && orderId) {
      requireAuth(makePaymentReturnAction(orderId));
    }
  }, [commerceView, checkoutProductId, orderId]);

  const isHome = currentWorld == null && commerceView == null;
  const isCommerce = commerceView != null;

  const onPaletteOpen = useCallback(({ query = "", intent = null } = {}) => {
    setInitialQuery(query || "");
    setInitialIntent(intent || null);
    setPaletteOpen(true);
  }, []);

  const onPaletteNavigate = useCallback(
    ({ world, intent, query }) => {
      setPaletteOpen(false);
      setTimeout(() => {
        if (world) setWorld(world);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        }
        if (query || intent) {
          // Pass to world views via query string for filter sync.
          setWorld(world || currentWorld || "build", {
            q: query || "",
            intent: intent || "",
          });
        }
      }, 0);
    },
    [setWorld, reduceMotion, currentWorld]
  );

  const filterQuery = (() => {
    const q = params.get("q") || params.get("filter") || params.get("query") || "";
    return typeof q === "string" ? q.trim() : "";
  })();
  const intent = (params.get("intent") || "").trim();

  return (
    <div className={"stea-code-app sc-v2" + (reduceMotion ? " sc-reduce-motion" : "")}>
      {!isHome && !isCommerce && (
        <SteaCodeShellHeaderV2
          world={currentWorld}
          onHome={() => setWorld(null)}
          onOpenSearch={onPaletteOpen}
          reduceMotion={reduceMotion}
        />
      )}

      {commerceView === "purchases" && (
        <SteaCodeShellHeaderV2
          world="purchases"
          onHome={() => setWorld(null)}
          onOpenSearch={onPaletteOpen}
          reduceMotion={reduceMotion}
          customTitle={{ en: "My Purchases", zhCN: "我的购买" }}
        />
      )}

      <div className="sc-view-stack">
        <AnimatePresence mode="wait">
          {commerceView === "checkout" ? (
            <motion.div
              key="commerce-checkout"
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <SteaCodeCheckoutPage
                productId={checkoutProductId}
                locale={uiLocale}
                onBack={() => setWorld(null)}
                onRequireAuth={(pid) => requireAuth(makePremiumCheckoutAction(pid || checkoutProductId))}
              />
            </motion.div>
          ) : commerceView === "payment-return" ? (
            <motion.div
              key="commerce-payment-return"
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <SteaCodePaymentReturnPage
                orderId={orderId}
                locale={uiLocale}
                onBack={() => setWorld(null)}
                onRequireAuth={(oid) => requireAuth(makePaymentReturnAction(oid || orderId))}
                onGoPurchases={() => {
                  const sp = new URLSearchParams(location.search);
                  sp.set("view", "purchases");
                  sp.delete("order");
                  navigate(`${location.pathname}?${sp.toString()}`, { replace: false });
                }}
                onGoProduct={(productId) => {
                  const sp = new URLSearchParams(location.search);
                  sp.delete("view");
                  sp.delete("order");
                  sp.delete("payment_intent");
                  sp.delete("payment_intent_client_secret");
                  sp.delete("redirect_status");
                  sp.set("product", String(productId || ""));
                  navigate(`${location.pathname}?${sp.toString()}`, {
                    replace: false,
                  });
                }}
              />
            </motion.div>
          ) : commerceView === "purchases" ? (
            <motion.div
              key="commerce-purchases"
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <SteaCodePurchasesPage
                locale={uiLocale}
                onRequireAuth={() => requireAuth(makePurchasesAction())}
                onGoHome={() => setWorld(null)}
                onGoProduct={(productId) => {
                  const sp = new URLSearchParams(location.search);
                  sp.delete("view");
                  sp.set("product", String(productId || ""));
                  navigate(`${location.pathname}?${sp.toString()}`, {
                    replace: false,
                  });
                }}
              />
            </motion.div>
          ) : isHome ? (
            <motion.div
              key="home-v2"
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <SteaCodeHomeV2
                user={user}
                authLoading={authLoading}
                data={v2Data}
                onGoWorld={(w, intent) => {
                  if (intent) {
                    setWorld(w, { intent: String(intent) });
                  } else {
                    setWorld(w);
                  }
                  setTimeout(() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }), 0);
                }}
                onOpenSearch={onPaletteOpen}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentWorld}
              {...motionPreset}
              transition={reduceMotion ? {} : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: "100vh", width: "100%" }}
            >
              <V2Views
                world={currentWorld}
                data={v2Data}
                filterQuery={filterQuery}
                intent={intent}
                reduceMotion={reduceMotion}
                onOpenSearch={onPaletteOpen}
                onGoWorld={(w, extra) => setWorld(w, extra || {})}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SteaCodeMemberGate
        open={memberGateOpen}
        pendingAction={memberGateAction}
        onClose={handleShellGateClose}
        onAuthenticated={handleShellGateAuth}
      />

      <SearchPaletteV2
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={onPaletteNavigate}
        data={v2Data}
        initialQuery={initialQuery}
        initialIntent={initialIntent}
      />
    </div>
  );
}
