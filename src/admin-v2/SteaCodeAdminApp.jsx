import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Box,
  CreditCard,
  Database,
  ExternalLink,
  FolderKanban,
  Globe,
  KeyRound,
  LayoutDashboard,
  ListTree,
  LogIn,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { getFirebaseAuth, signOut } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { getSteaCodePublicUrl, isSteaCodeHost } from "../utils/subdomains.js";
import { hasAdminV2Permission } from "./permissions.js";
import { ADMIN_V2_PREVIEW_BANNER, ADMIN_V2_PREVIEW_USER } from "./previewData.js";
import AdminLoadingScreen from "./AdminLoadingScreen.jsx";
import SitesAdminLogin from "../sites/admin/SitesAdminLogin.jsx";
import SteaCodePage from "./SteaCodePage.jsx";
import LocalFirestoreBadge from "./LocalFirestoreBadge.dev-only.jsx";
import SteaCodeProductStudioPage from "./SteaCodeProductStudioPage.jsx";
import SteaCodeLogo from "../components/stea-code/SteaCodeLogo.jsx";
import "./admin-v2.css";
import "./stea-code-admin.css";

/* DEV-only auth/permission logger (no tokens/secrets).
   Strictly import.meta.env.DEV so production build dead-code eliminates the entire block. */
const DEV_ADMIN_LOG = import.meta.env.DEV
    ? (...args) => {
        // eslint-disable-next-line no-console
        console.log(
          "[SteaCodeAdminApp]",
          ...args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 0) : String(a)))
        );
      }
    : () => {};

/**
 * Dedicated STEA CODE ADMIN navigation (code.stea.africa/admin shell).
 *
 * Reuses one implementation source of truth:
 *   SteaCodeAdminApp -> SteaCodePage -> SteaCodeCommercePanel -> existing APIs
 *
 * Do NOT copy CRUD logic. Do NOT show unrelated STEA ecosystem admin modules.
 */
const // Spec T + Y: Primary Product Studio navigation (focused around products).
// directory / hosting / inspiration / legacy removed from primary UI.
// Their render branches + direct URLs remain for compatibility.
CODE_ADMIN_NAV = [
  { id: "products", label: "Products", icon: Package, path: "/admin/products" },
  { id: "categories", label: "Categories", icon: ListTree, path: "/admin/categories" },
  { id: "orders", label: "Orders", icon: CreditCard, path: "/admin/orders" },
  { id: "entitlements", label: "Entitlements", icon: KeyRound, path: "/admin/entitlements" },
];

/**
 * Top-level map for the dedicated Code Admin shell.
 * The default route /admin redirects to /admin/products (Products first).
 */
const CODE_ADMIN_TITLES = {
  products: "Products — STEA Code Admin",
  directory: "Developer Resources — STEA Code Admin",
  hosting: "Hosting — STEA Code Admin",
  inspiration: "Website Inspiration — STEA Code Admin",
  categories: "Categories — STEA Code Admin",
  orders: "Orders — STEA Code Admin",
  entitlements: "Entitlements — STEA Code Admin",
  legacy: "More / Legacy — STEA Code Admin",
};

function applyTitle(title) {
  if (typeof document === "undefined") return;
  try {
    document.title = title;
  } catch {
    /* ignore */
  }
}

function SteaCodeAdminAccessScreen({
  user,
  profileStatus = null,
  adminAuthState = null,
  usingStableFallback = false,
  onRequireSignIn,
  onRetry,
  onLogout,
  reason = "unauthorized",
}) {
  const profileError = profileStatus?.phase === "error";
  const den = profileStatus?.error === "permission-denied";
  const heading =
    reason === "profile-error" || profileError
      ? "Unable to confirm access"
      : reason === "login"
      ? "Admin sign in required"
      : "Admin access denied";

  return (
    <div
      className="sca-admin-access-screen"
      aria-label="STEA Code Admin access state"
    >
      <div className="sca-admin-access-card">
        <div className="sca-admin-access-eyebrow">STEA CODE · STUDIO</div>
        <h1 className="sca-admin-access-title">{heading}</h1>
        <p className="sca-admin-access-text">
          {profileError
            ? den
              ? "Your admin profile client read was denied. Server APIs remain authoritative. Use Retry or sign in with the official owner email."
              : "Your admin profile could not be loaded right now. No data was changed."
            : reason === "login"
            ? "Sign in with your STEA Code admin account to open the Control Center."
            : "This account does not have the code.view permission for STEA Code Studio."}
        </p>

        <div className="sca-admin-access-stats">
          <div className="sca-admin-access-stat">
            <div>User</div>
            <strong>{user?.email || user?.displayName || user?.uid || "—"}</strong>
          </div>
          <div className="sca-admin-access-stat">
            <div>Role</div>
            <strong>{user?.role || "unknown"}</strong>
          </div>
          <div className="sca-admin-access-stat">
            <div>Profile</div>
            <strong className={profileError ? "warn" : "ok"}>
              {profileStatus?.phase === "error"
                ? den
                  ? "permission-denied"
                  : profileStatus?.message || "error"
                : profileStatus?.phase || "unknown"}
            </strong>
          </div>
          <div className="sca-admin-access-stat">
            <div>Session</div>
            <strong className={usingStableFallback ? "warn" : "ok"}>
              {adminAuthState || (usingStableFallback ? "stable-fallback" : "active")}
            </strong>
          </div>
        </div>

        <div className="sca-admin-access-actions">
          {onRetry && (
            <button className="sca-admin-btn ghost" onClick={onRetry} type="button">
              <RefreshCw size={15} /> Retry
            </button>
          )}
          {onRequireSignIn && (
            <button className="sca-admin-btn primary" onClick={onRequireSignIn} type="button">
              <LogIn size={15} /> Sign In Again
            </button>
          )}
          {!user?.email && (
            <div className="sca-admin-access-hint">
              <KeyRound size={15} /> Login with stea.africa@gmail.com
            </div>
          )}
          {onLogout && user?.email && (
            <button className="sca-admin-btn ghost" onClick={onLogout} type="button">
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SteaCodeAdminTopbar({ user, isSuperAdmin, devPreview, onLogout, onRequireSignIn }) {
  const avatarUrl =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.displayName || user?.email || "Admin"
    )}&background=1a1f28&color=F5A623&bold=true`;

  const codePublicUrl = useMemo(() => {
    return getSteaCodePublicUrl();
  }, []);

  return (
    <header className="sca-admin-topbar" role="banner">
      <div className="sca-admin-topbar-left">
        <div className="sca-admin-brand">
          <SteaCodeLogo size={24} />
          <div className="sca-admin-brand-text">
            <div className="sca-admin-brand-title">STEA CODE</div>
            <div className="sca-admin-brand-sub">Studio</div>
          </div>
        </div>
      </div>

      <div className="sca-admin-topbar-right">
        <a
          className="sca-admin-link"
          href={codePublicUrl}
          target="_blank"
          rel="noreferrer noopener"
          title="Open public STEA Code"
        >
          <ExternalLink size={14} /> Open STEA Code
        </a>

        {devPreview ? (
          <div className="sca-admin-badge preview">
            <User size={13} /> <span>PREVIEW</span>
          </div>
        ) : isSuperAdmin ? (
          <div className="sca-admin-badge super">
            <ShieldCheck size={13} /> <span>SUPER ADMIN</span>
          </div>
        ) : (
          <div className="sca-admin-badge read">
            <User size={13} /> <span>{user?.role || "ADMIN"}</span>
          </div>
        )}

        <div className="sca-admin-account">
          <img src={avatarUrl} alt="" className="sca-admin-avatar" />
          <div className="sca-admin-account-text">
            <strong>{user?.displayName || "Admin"}</strong>
            {user?.email && <span>{user.email}</span>}
          </div>
          {onLogout ? (
            <button
              className="sca-admin-btn icon"
              onClick={onLogout}
              title="Logout"
              type="button"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          ) : onRequireSignIn ? (
            <button
              className="sca-admin-btn icon"
              onClick={onRequireSignIn}
              title="Sign In"
              type="button"
              aria-label="Sign In"
            >
              <LogIn size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SteaCodeAdminNav({ activeId, onSelect, baseRoute = "/admin" }) {
  return (
    <nav className="sca-admin-nav" aria-label="STEA Code Admin sections">
      {CODE_ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <button
            type="button"
            key={item.id}
            className={`sca-admin-nav-item ${active ? "is-active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <Icon size={15} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function SteaCodeAdminApp(props) {
  const {
    user: userProp,
    devPreview: devPreviewProp = false,
    profileStatus = null,
    adminAuthState = null,
    usingStableFallback = false,
    onRequireSignIn,
    onRetryProfile,
    baseRoute = "/admin",
    onLogout: onLogoutProp,
  } = props || {};

  const navigate = useNavigate();
  const location = useLocation();
  const authFromHook = useAuth();

  const isLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  // Derive auth user & loading state:
  // If user prop is passed explicitly, use it; otherwise read from useAuth()
  const authUser = userProp !== undefined ? userProp : authFromHook.user;
  const isAuthLoading = userProp !== undefined ? false : authFromHook.loading;

  // Dev mock mode is opt-in only via VITE_STEA_CODE_MOCK=1.
  // On localhost without an explicit mock flag, the admin reads/writes the
  // SAME live database as the homepage — no more "1 product in admin, 9 on
  // homepage" mismatch. Sign in as a real admin to make changes.
  const mockOptIn = import.meta.env.VITE_STEA_CODE_MOCK === "1";
  const isDevPreview = devPreviewProp || (mockOptIn && !authUser && isLocal);
  const effectiveUser = authUser || (mockOptIn && isLocal ? ADMIN_V2_PREVIEW_USER : null);
  const devPreview = isDevPreview;

  // Derive active section from URL segment.
  // This helper must exist before hook declarations so hooks always execute
  // in the same order on every render.
  const deriveSectionFromPath = (path) => {
    const prefix = baseRoute.replace(/\/$/, "");
    const rest = path.slice(prefix.length).replace(/^\//, "").split("/")[0] || "products";

    switch (rest) {
      case "":
      case "products":
        return "products";
      case "resources":
        return "directory";
      case "hosting":
        return "hosting";
      case "inspiration":
        return "inspiration";
      case "categories":
        return "categories";
      case "orders":
        return "orders";
      case "entitlements":
        return "entitlements";
      case "legacy":
        return "legacy";
      default:
        return "products";
    }
  };

  const derivedSection = deriveSectionFromPath(location.pathname);
  const [activeSection, setActiveSection] = useState(derivedSection);

  // Product Studio sub-routes own the full viewport — hide hero + section nav.
  const pathAfterPrefix = location.pathname.slice(baseRoute.replace(/\/$/, "").length);
  const isStudioRoute = /^\/products\/(new|[^/]+\/edit)(\/.*)?$/.test(pathAfterPrefix);

  useEffect(() => {
    DEV_ADMIN_LOG(
      "mount role=" +
        String(effectiveUser?.role || "?") +
        " devPreview=" +
        devPreview +
        " profilePhase=" +
        String(profileStatus?.phase || "?") +
        " authState=" +
        String(adminAuthState || "?") +
        " stableFallback=" +
        usingStableFallback +
        " path=" +
        location.pathname
    );
  }, [
    effectiveUser?.role,
    effectiveUser?.uid,
    effectiveUser?.email,
    devPreview,
    profileStatus?.phase,
    profileStatus?.error,
    adminAuthState,
    usingStableFallback,
    location.pathname,
  ]);

  useEffect(() => {
    const next = deriveSectionFromPath(location.pathname);
    DEV_ADMIN_LOG("location.pathname=" + location.pathname + " section=" + next);
    setActiveSection(next);
    applyTitle(CODE_ADMIN_TITLES[next] || "STEA Code Studio — Admin");
  }, [location.pathname, baseRoute]);

  // Only after ALL hooks have executed may we return loading/access states.
  if (isAuthLoading) {
    DEV_ADMIN_LOG("auth is loading; show AdminLoadingScreen");
    return <AdminLoadingScreen />;
  }

  if (!effectiveUser) {
    DEV_ADMIN_LOG("effectiveUser missing and not local preview; show sign in");
    return <SitesAdminLogin />;
  }

  const isOwner =
    ["stea.africa@gmail.com", "kukumlangoni@gmail.com"].includes(String(effectiveUser?.email || "").trim().toLowerCase());
  const roleEffective = isOwner ? "super_admin" : (isLocal && (!effectiveUser?.role || effectiveUser?.role === "user") ? "super_admin" : effectiveUser?.role || null);
  const isSuperAdmin = roleEffective === "super_admin" || isOwner || isLocal;
  const canCodeView = isSuperAdmin || effectiveUser?.role === "admin" || hasAdminV2Permission(effectiveUser, "code.view") || isLocal;
  const profileError = profileStatus?.phase === "error";

  const onLogout = onLogoutProp
    ? onLogoutProp
    : async () => {
        try {
          const auth = getFirebaseAuth();
          if (auth) await signOut(auth);
        } catch (e) {
          // Swallow; parent onAuthStateChanged handles state.
          console.warn("SteaCodeAdminApp logout failed", e);
        }
      };

  // Rule: Profile error for the owner does NOT remove access.
  // Rule: If any profile error occurs, show the screen with Retry (do not silently throw to "/").
  // Rule: If truly no code.view and not owner → in-admin access denied screen.
  if (!canCodeView && !isOwner) {
    DEV_ADMIN_LOG("code.view denied, not owner; in-admin access screen");
    return (
      <SteaCodeAdminAccessScreen
        user={effectiveUser}
        profileStatus={profileStatus}
        adminAuthState={adminAuthState}
        usingStableFallback={usingStableFallback}
        onRequireSignIn={onRequireSignIn || undefined}
        onRetry={onRetryProfile || undefined}
        onLogout={onLogout}
        reason="unauthorized"
      />
    );
  }

  const selectSection = (id) => {
    const segmentMap = {
      products: "products",
      directory: "resources",
      hosting: "hosting",
      inspiration: "inspiration",
      categories: "categories",
      orders: "orders",
      entitlements: "entitlements",
      legacy: "legacy",
    };
    const segment = segmentMap[id] || "products";
    const target = `${baseRoute.replace(/\/$/, "")}/${segment}`;
    if (target !== location.pathname) {
      navigate(target, { replace: false });
    }
    setActiveSection(id);
    applyTitle(CODE_ADMIN_TITLES[id] || "STEA Code Studio — Admin");
  };

  const Banner = profileError || usingStableFallback ? (
    <div
      role="status"
      className={
        "sca-admin-banner " + (profileError ? "sca-admin-banner--error" : "sca-admin-banner--stable")
      }
    >
      <div className="sca-admin-banner-left">
        {profileError ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
        <span>
          {profileError
            ? `Profile read: ${profileStatus?.message || "error"} — Admin UI remains available; server APIs verify permissions independently.`
            : "Admin session stabilized during auth transition — your Product Studio state is preserved."}
        </span>
      </div>
      <div className="sca-admin-banner-actions">
        {profileError && onRetryProfile && (
          <button
            type="button"
            onClick={onRetryProfile}
            className="sca-admin-btn ghost small"
          >
            <RefreshCw size={13} /> Retry
          </button>
        )}
        {onRequireSignIn && (
          <button
            type="button"
            onClick={onRequireSignIn}
            className="sca-admin-btn ghost small"
          >
            <LogIn size={13} /> Sign In Again
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="sca-admin-shell" data-stea-code-admin>
      <SteaCodeAdminTopbar
        user={effectiveUser}
        isSuperAdmin={isSuperAdmin}
        devPreview={devPreview}
        onRequireSignIn={onRequireSignIn || undefined}
        onLogout={effectiveUser ? onLogout : undefined}
      />

      <div className="sca-admin-page">
        {!isStudioRoute && (
          <div className="sca-admin-hero sca-admin-hero-compact">
            <div className="sca-admin-hero-copy">
              <div className="sca-admin-hero-eyebrow">STEA CODE · STUDIO</div>
              <h1 className="sca-admin-hero-title sca-admin-hero-title-compact">
                Product Studio
              </h1>
              <p className="sca-admin-hero-sub">
                Manage products, categories, orders and source access entitlements.
              </p>
            </div>
          </div>
        )}

        {!isStudioRoute && (
          <SteaCodeAdminNav
            activeId={activeSection}
            onSelect={selectSection}
            baseRoute={baseRoute}
          />
        )}

        {Banner}

        {devPreview && (
          <div className="admin-v2-preview-banner sca-admin-preview-banner">
            {ADMIN_V2_PREVIEW_BANNER}
          </div>
        )}

        {import.meta.env.DEV && <LocalFirestoreBadge />}

        <div className="sca-admin-content">
          {/*
            Routes are kept simple and intentionally collapse to a single SteaCodePage
            because SteaCodePage already owns the complete tabbed data-management UX.
            The clean URL segments (/admin/products, /admin/resources ...) provide
            stable navigation and bookmarkable deep-links while preserving one
            canonical implementation (Products/Resources/Hosting/Inspiration/Categories
            /Orders/Entitlements/Legacy are internal tabs inside SteaCodePage).

            baseRoute is passed as <Routes basename> so /code-admin/products also works
            on the localhost dedicated preview entry.

            hideInternalTabs + dedicatedAdmin ensure SteaCodePage does NOT render
            a duplicate tab strip — the dedicated shell owns the navigation.
          */}
          <Routes basename={baseRoute.replace(/\/$/, "")}>
            <Route index element={<Navigate to="products" replace />} />

            {/* Full-page Product Studio routes (no modal). */}
            <Route
              path="products/new"
              element={
                <SteaCodeProductStudioPage
                  isSuperAdmin={isSuperAdmin}
                  devPreview={devPreview}
                  baseRoute={baseRoute}
                />
              }
            />
            <Route
              path="products/:productId/edit"
              element={
                <SteaCodeProductStudioPage
                  isSuperAdmin={isSuperAdmin}
                  devPreview={devPreview}
                  baseRoute={baseRoute}
                />
              }
            />

            {[
              "products",
              "resources",
              "hosting",
              "inspiration",
              "categories",
              "orders",
              "entitlements",
              "legacy",
            ].map((segment) => {
              const tabId = segment === "resources" ? "directory" : segment;
              return (
                <Route
                  key={segment}
                  path={segment}
                  element={
                    <SteaCodePage
                      isSuperAdmin={isSuperAdmin}
                      devPreview={devPreview}
                      initialTab={tabId}
                      compactHeader
                      hideInternalTabs
                      dedicatedAdmin
                      baseRoute={baseRoute}
                    />
                  }
                />
              );
            })}
            {/* Unknown segment under baseRoute → products (never public "/") */}
            <Route path="*" element={<Navigate to="products" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
