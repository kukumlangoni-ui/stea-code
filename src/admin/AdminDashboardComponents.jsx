import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  MonitorCog,
  Package,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import SteaLogo from "../components/SteaLogo.jsx";

const ADMIN_MENU_GROUPS = [
  { title: "Dashboard", ids: ["overview"] },
  { title: "Revenue & Subs", ids: ["subs", "payments", "vpn"] },
  { title: "E-Commerce", ids: ["marketplace", "chaba", "deals"] },
  { title: "Learning Hub", ids: ["courses", "resources", "tips_resources", "exams", "necta"] },
  { title: "Site Content", ids: ["websites", "content", "prompts", "gigs", "ads"] },
  { title: "Communication", ids: ["notifications", "users"] },
];

const iconMap = {
  overview: LayoutDashboard,
  exams: ClipboardList,
  gigs: BriefcaseBusiness,
  courses: GraduationCap,
  resources: BookOpen,
  tips_resources: FileText,
  websites: Globe,
  content: MonitorCog,
  prompts: Sparkles,
  deals: Zap,
  subs: ShieldCheck,
  payments: ShoppingBag,
  marketplace: ShoppingBag,
  chaba: ShoppingBag,
  vpn: ShieldCheck,
  notifications: Bell,
  ads: Megaphone,
  necta: BarChart3,
  users: Users,
};

const G = "#F5A623";
const G2 = "#FFD17C";
const BORDER = "rgba(255,255,255,.08)";

export function AdminSidebar({ sections, activeId, onSelect, onBack, open, onClose, user }) {
  // Determine initial open groups based on active section
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const activeGroup = ADMIN_MENU_GROUPS.find(g => g.ids.includes(activeId));
    return activeGroup ? [activeGroup.title] : ["Dashboard"];
  });

  const toggleGroup = (title) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const grouped = ADMIN_MENU_GROUPS.map((group) => ({
    ...group,
    items: sections.filter((item) => group.ids.includes(item.id)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {open && <button aria-label="Close admin menu" onClick={onClose} className="admin-sidebar-scrim" />}
      <aside className={`admin-sidebar-shell ${open ? "is-open" : ""}`}>
        <div className="admin-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/stea-brand/favicon-transparent.png" alt="S" style={{ width: 34, height: 34, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} onError={(e) => { e.target.onerror = null; e.target.src = "/stea-brand/app-icon-white-bg.png"; }} />
            <div>
              <div className="admin-brand__name">STEA Admin</div>
              <div className="admin-brand__sub">Control Center</div>
            </div>
          </div>
          <button className="admin-icon-btn admin-sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={17} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {grouped.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            return (
              <div key={group.title} className="admin-nav-group">
                <button 
                  onClick={() => toggleGroup(group.title)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "transparent", border: "none", width: "100%", padding: "8px 10px 4px",
                    cursor: "pointer", color: "rgba(255,255,255,0.4)"
                  }}
                >
                  <div className="admin-nav-group__title" style={{ padding: 0, margin: 0, color: "inherit" }}>{group.title}</div>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                    {group.items.map((item) => {
                      const Icon = iconMap[item.id] || LayoutDashboard;
                      const active = activeId === item.id;
                      return (
                        <button key={item.id} className={`admin-nav-item ${active ? "is-active" : ""}`} onClick={() => onSelect(item.id)}>
                          <Icon size={17} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-mini">
            <div className="admin-user-mini__avatar">{(user?.displayName || user?.email || "A").slice(0, 1).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div className="admin-user-mini__name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || "Admin"}</div>
              <div className="admin-user-mini__role">{user?.role || "admin"}</div>
            </div>
          </div>
          <button onClick={onBack} className="admin-back-btn">
            <ChevronLeft size={16} /> Back to site
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminTopbar({ title, breadcrumb, user, onMenu, onQuickAction }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        <button className="admin-mobile-menu-trigger" onClick={onMenu} aria-label="Open admin menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="admin-breadcrumb">{breadcrumb}</div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="admin-topbar__right">
        <label className="admin-command">
          <Search size={15} />
          <input placeholder="Search admin..." aria-label="Search admin" />
        </label>
        <button className="admin-primary-action" onClick={onQuickAction}>
          <Send size={15} /> <span className="admin-action-text">Quick action</span>
        </button>
        <div className="admin-user-chip">
          <div className="admin-user-chip__avatar">{(user?.displayName || user?.email || "A").slice(0, 1).toUpperCase()}</div>
          <div>
            <div>{user?.displayName || "Admin"}</div>
            <span>{user?.email || "STEA team"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminStatCard({ icon: Icon = LayoutDashboard, label, value, color = G, error, helper }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__icon" style={{ color, background: `${color}16` }}>
        <Icon size={20} />
      </div>
      <div className="admin-stat-card__body">
        <div className="admin-stat-card__label">{label}</div>
        <div className="admin-stat-card__value" style={{ color: error ? "#fca5a5" : "#fff" }}>{error ? "Error" : value}</div>
        <div className="admin-stat-card__helper">{error ? "Needs permission check" : helper}</div>
      </div>
    </div>
  );
}

export function AdminSectionCard({ title, children, action }) {
  return (
    <section className="admin-section-card">
      <div className="admin-section-card__head">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="admin-section-card__body">
        {children}
      </div>
    </section>
  );
}

export function AdminEmptyState({ title = "Nothing here yet", message = "Create content to see it here." }) {
  return (
    <div className="admin-empty-state">
      <Sparkles size={22} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

export function AdminLoadingSkeleton() {
  return <div className="admin-loading-skeleton" />;
}

export function AdminDashboardStyles() {
  return (
    <style>{`
      html, body {
        overflow-x: hidden;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      
      * {
        box-sizing: border-box;
      }

      .admin-layout {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
        background: #0a0b0f;
        background: radial-gradient(circle at 12% 0,rgba(245,166,35,.1),transparent 28%),#08090d;
        color: #fff;
      }

      .admin-sidebar-shell {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 18px 14px;
        padding-top: calc(18px + env(safe-area-inset-top));
        padding-bottom: calc(18px + env(safe-area-inset-bottom));
        padding-left: calc(14px + env(safe-area-inset-left));
        border-right: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(180deg,rgba(13,14,19,.98),rgba(7,8,12,.98));
        display: flex;
        flex-direction: column;
        gap: 18px;
        overflow-y: auto;
        z-index: 100;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .admin-sidebar-scrim {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        z-index: 90;
        border: 0;
        padding: 0;
        margin: 0;
      }

      .admin-brand {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 8px 14px;
        border-bottom: 1px solid rgba(255,255,255,.07);
      }

      .admin-brand__name { font-weight: 900; font-size: 15px; }
      .admin-brand__sub { font-size: 11px; color: rgba(255,255,255,.42); margin-top: 1px; }

      .admin-nav { display: grid; gap: 18px; }
      .admin-nav-group { display: grid; gap: 5px; }
      .admin-nav-group__title { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: rgba(255,255,255,.34); font-weight: 900; padding: 0 10px 5px; }

      .admin-nav-item {
        height: 40px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: rgba(255,255,255,.64);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 11px;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        width: 100%;
      }
      .admin-nav-item:hover { background: rgba(255,255,255,.05); color: #fff; }
      .admin-nav-item.is-active { background: linear-gradient(135deg,#F5A623,#FFD17C); color: #111; }

      .admin-sidebar-footer { margin-top: auto; display: grid; gap: 10px; padding-top: 20px; }
      .admin-user-mini { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(255,255,255,.03); }
      .admin-user-mini__avatar { width: 32px; height: 32px; border-radius: 9px; background: rgba(245,166,35,.14); color: #F5A623; display: grid; place-items: center; font-weight: 900; flex-shrink: 0; }
      .admin-user-mini__name { font-size: 13px; font-weight: 900; }
      .admin-user-mini__role { font-size: 10px; color: rgba(255,255,255,.38); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }

      .admin-back-btn { height: 40px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.045); color: rgba(255,255,255,0.7); border-radius: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; }
      .admin-back-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

      .admin-main-container {
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        max-height: 100vh;
        overflow-y: auto;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-right: env(safe-area-inset-right);
      }

      .admin-main-content {
        padding: 0 32px 40px;
        min-width: 0;
        width: 100%;
      }

      .admin-topbar {
        position: sticky;
        top: 0;
        z-index: 80;
        padding: 20px 32px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        background: rgba(8,9,13,.86);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }

      .admin-topbar__left, .admin-topbar__right { display: flex; align-items: center; gap: 14px; min-width: 0; }
      .admin-breadcrumb { font-size: 11px; color: rgba(255,255,255,.4); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
      .admin-topbar h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .admin-mobile-menu-trigger {
        display: none;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
      }

      .admin-command {
        height: 42px;
        min-width: 240px;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        background: rgba(255,255,255,0.03);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        color: rgba(255,255,255,0.4);
      }
      .admin-command input { background: transparent; border: 0; outline: 0; color: #fff; width: 100%; font-size: 14px; }

      .admin-primary-action {
        height: 42px;
        padding: 0 18px;
        border-radius: 12px;
        background: linear-gradient(135deg,#F5A623,#FFD17C);
        color: #111;
        font-weight: 900;
        border: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
      }

      .admin-user-chip { display: flex; align-items: center; gap: 10px; padding: 4px; padding-right: 12px; border-radius: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
      .admin-user-chip__avatar { width: 32px; height: 32px; border-radius: 10px; background: rgba(245,166,35,0.2); color: #F5A623; display: grid; place-items: center; font-weight: 900; flex-shrink: 0; }
      .admin-user-chip > div:last-child { line-height: 1.25; }
      .admin-user-chip > div:last-child div { font-size: 13px; font-weight: 800; color: #fff; }
      .admin-user-chip > div:last-child span { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 700; display: block; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }

      .admin-grid {
        display: grid;
        gap: 16px;
        width: 100%;
        grid-template-columns: repeat(4, 1fr);
      }

      /* ADMIN DASHBOARD CARD GRID BREAKPOINTS */
      @media (max-width: 480px) {
        .admin-grid { grid-template-columns: 1fr; }
      }
      @media (min-width: 481px) and (max-width: 767px) {
        .admin-grid { grid-template-columns: repeat(2, 1fr); }
      }
      @media (min-width: 768px) and (max-width: 1023px) {
        .admin-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 1024px) {
        .admin-grid { grid-template-columns: repeat(4, 1fr); }
      }

      .admin-stat-card {
        min-height: 160px;
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
        display: flex;
        gap: 16px;
        align-items: flex-start;
        transition: transform 0.2s, border-color 0.2s;
        height: 100%;
      }
      .admin-stat-card:hover { transform: translateY(-2px); border-color: rgba(245,166,35,0.3); }
      .admin-stat-card__icon { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; }
      .admin-stat-card__label { font-size: 12px; color: rgba(255,255,255,.45); font-weight: 850; text-transform: uppercase; letter-spacing: 0.05em; }
      .admin-stat-card__value { font-size: 32px; font-weight: 950; margin-top: 8px; line-height: 1; font-family: 'Bricolage Grotesque', sans-serif; }
      .admin-stat-card__helper { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 10px; line-height: 1.4; }

      @media (max-width: 1023px) {
        .admin-stat-card { min-height: 150px; padding: 20px; }
        .admin-stat-card__value { font-size: 28px; }
      }
      @media (max-width: 767px) {
        .admin-stat-card { min-height: 130px; padding: 16px; border-radius: 18px; }
        .admin-stat-card__icon { width: 42px; height: 42px; border-radius: 11px; }
        .admin-stat-card__value { font-size: 26px; }
      }

      .admin-section-card {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px;
        background: rgba(255,255,255,.025);
        padding: 24px;
        margin-bottom: 24px;
      }
      .admin-section-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
      .admin-section-card h2 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: -0.01em; }

      .admin-quick-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .admin-quick-card {
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 16px;
        background: rgba(255,255,255,.03);
        padding: 20px;
        text-align: left;
        color: #fff;
        cursor: pointer;
        display: grid;
        gap: 10px;
        transition: all 0.2s;
        height: 100%;
        align-content: start;
      }
      .admin-quick-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(245,166,35,0.3); transform: scale(1.02); }
      .admin-quick-card strong { font-size: 15px; font-weight: 800; display: block; }
      .admin-quick-card span { font-size: 12px; color: rgba(255,255,255,.45); line-height: 1.5; }

      .admin-icon-btn { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; cursor: pointer; transition: all 0.2s; }
      .admin-icon-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

      /* RESPONSIVE LAYOUT OVERRIDES */
      @media (max-width: 1024px) {
        .admin-layout { grid-template-columns: 1fr; }
        
        .admin-sidebar-shell {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 300px;
          max-width: 85vw;
          z-index: 1000;
          transform: translateX(-100%);
          height: 100vh;
        }
        .admin-sidebar-shell.is-open { transform: translateX(0); }
        .admin-sidebar-scrim { display: block; }
        .admin-sidebar-close { display: grid; }
        .admin-mobile-menu-trigger { display: grid; }
        
        .admin-main-content { padding: 0 20px 40px; }
        .admin-topbar { padding: 14px 20px; margin: 0 -20px 20px; }
      }

      @media (max-width: 768px) {
        .admin-command, .admin-action-text, .admin-user-chip { display: none; }
        .admin-topbar h1 { font-size: 20px; }
        .admin-topbar { padding: 12px 16px; margin: 0 -16px 16px; }
        .admin-main-content { padding: 0 16px 32px; }
        .admin-section-card { padding: 20px; }
      }

      @media (max-width: 480px) {
        .admin-topbar h1 { font-size: 18px; }
        .admin-stat-card__value { font-size: 24px; }
        .admin-section-card { padding: 16px; border-radius: 18px; }
      }
      
      /* UTILITIES */
      .hidden { display: none !important; }
    `}</style>
  );
}
