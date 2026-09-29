import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import { ADMIN_V2_NAVIGATION, hasAdminV2Permission } from "./permissions.js";
import { ADMIN_V2_PREVIEW_BANNER } from "./previewData.js";
import "./admin-v2.css";

const iconFor = (name) => Icons[name] || Icons.Circle;

export function AdminPageHeader({ title, description, eyebrow = "STEA ADMIN V2" }) {
  return (
    <header className="admin-v2-page-header">
      <div>
        <div className="admin-v2-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}

export function AdminSidebar({ user, open, onClose }) {
  const location = useLocation();
  const items = ADMIN_V2_NAVIGATION.filter((item) => hasAdminV2Permission(user, item.permission));
  return (
    <>
      {open && <button aria-label="Close navigation" className="admin-v2-scrim" onClick={onClose} />}
      <aside className={`admin-v2-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-v2-brand"><span>STEA</span><small>ADMIN V2</small></div>
        <nav aria-label="Admin navigation">
          {items.map((item) => {
            const Icon = iconFor(item.icon);
            const active = item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path);
            return <Link key={item.path} to={item.path} onClick={onClose} className={`admin-v2-nav-item ${active ? "is-active" : ""}`}><Icon size={18} />{item.label}</Link>;
          })}
        </nav>
        <div className="admin-v2-sidebar-user"><strong>{user?.displayName || user?.email || "Admin"}</strong><span>{String(user?.role || "admin").replace("_", " ")}</span></div>
      </aside>
    </>
  );
}

export function AdminTopbar({ onMenu, isSuperAdmin, user }) {
  const location = useLocation();
  const avatarUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || "Admin")}&background=D4AF37&color=fff&bold=true`;
  
  const navItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Users", path: "/admin/users" },
    { label: "Marketing", path: "/admin/marketing" },
    { label: "Websites", path: "/admin/websites" },
    { label: "STEA Daily", path: "/admin/daily" },
    { label: "Products", path: "/admin/products" },
    { label: "Orders", path: "/admin/orders" },
    { label: "Settings", path: "/admin/settings" }
  ];

  return (
    <header className="admin-v2-topbar-premium">
      <div className="admin-v2-topbar-left">
        <button className="admin-v2-menu" onClick={onMenu} aria-label="Open navigation" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
          <Icons.Menu size={22} color="#4B5563" />
        </button>
        <img src="/stea-brand/stea-s-logo-transparent-512.png" alt="STEA" className="admin-v2-brand-logo" style={{ width: 24, height: 24 }} />
        <div className="admin-v2-topbar-titles">
          <span className="admin-v2-topbar-title-main">STEA Admin</span>
          <span className="admin-v2-topbar-title-sub">Manage Ecosystem</span>
        </div>
      </div>

      <div className="admin-v2-topbar-center">
        <nav className="admin-v2-topbar-nav">
          {navItems.map(item => {
            const isActive = item.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={isActive ? "is-active" : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="admin-v2-topbar-right">
        <button onClick={() => window.location.href = '/'} className="admin-v2-home-btn" aria-label="Go to Main Site">
          <Icons.Home size={16} />
        </button>
        {isSuperAdmin ? (
          <div className="admin-v2-super-admin-badge-premium">
            <Icons.Shield size={14} /> <span>SUPER ADMIN</span>
          </div>
        ) : (
          <div className="admin-v2-super-admin-badge-premium" style={{ color: "#6B7280" }}>
            <Icons.LockKeyhole size={14} style={{ color: "#9CA3AF" }} /> <span>READ ONLY</span>
          </div>
        )}
        <img src={avatarUrl} alt="Avatar" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #E5E7EB", objectFit: "cover" }} />
      </div>
    </header>
  );
}

export function AdminContentArea({ children }) {
  return <main className="admin-v2-content">{children}</main>;
}

export function AdminLayout({ user, title, children, sidebarOpen, onSidebarClose, onSidebarOpen, devPreview, isSuperAdmin }) {
  return <div className="admin-v2-shell"><AdminSidebar user={user} open={sidebarOpen} onClose={onSidebarClose} /><div className="admin-v2-main"><AdminTopbar onMenu={onSidebarOpen} isSuperAdmin={isSuperAdmin} user={user} />{devPreview && <div className="admin-v2-preview-banner">{ADMIN_V2_PREVIEW_BANNER}</div>}<AdminContentArea>{children}</AdminContentArea></div></div>;
}
