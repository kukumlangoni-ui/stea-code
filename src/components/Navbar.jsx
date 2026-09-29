import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Bell, LogOut, User, Settings,
  ShieldCheck, Cpu, Globe, Zap, GraduationCap, ShoppingBag,
  Briefcase, Sparkles, BookOpen, LayoutGrid, Wifi,
  HelpCircle, Megaphone, Star, Tag, Laptop, Smartphone,
  ChevronDown, ArrowRight, Heart
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import SettingsModal from "./SettingsModal";
import SteaLogo from "./SteaLogo";
import GlobalNotificationBell from "./GlobalNotificationBell";
import STEAAppsLauncher from "./shared/STEAAppsLauncher.jsx";
import { isAdminEmail } from "../firebase.js";
import STEAAvatar from "./STEAAvatar.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Nav Taxonomy ─────────────────────────────────────
const getNav = (t) => [
  { id: "home", label: t('nav_home') || "Home", path: "/" },
  {
    id: "tech-hub", label: t('nav_tech_hub') || "Tech Hub",
    featured: { title: "Tech Hub", desc: t('nav_tech_hub_desc') || "AI Tools & Solutions", path: "/tech", icon: "💡" },
    cols: [
      {
        heading: t('nav_tech_tools_heading') || "AI & Tools",
        items: [
          { label: t('section_ai_lab') || "AI Lab", desc: t('nav_tech_ai_desc'), path: "/ai-lab", icon: <Sparkles size={15} />, hot: true },
          { label: t('section_prompt_lab') || "Prompt Lab", desc: t('nav_tech_prompt_desc'), path: "/prompt-lab", icon: <Cpu size={15} /> },
        ],
      },
      {
        heading: t('nav_tech_sol_heading') || "Web & Digital",
        items: [
          { label: "Website Solutions", desc: t('nav_tech_web_desc'), path: "/websites", icon: <Globe size={15} /> },
          { label: t('nav_tech_digi_label') || "Digital Tools", desc: t('nav_tech_digi_desc'), path: "/digital-tools", icon: <LayoutGrid size={15} /> },
        ],
      },
    ],
  },
  {
    id: "exams", label: "Student",
    featured: { title: t('nav_exams_title') || "STEA Education", desc: t('nav_exams_desc') || "Results, Past Papers, Notes", path: "/education", icon: "🎓" },
    cols: [
      {
        heading: t('nav_exams_res_heading') || "Exams & Results",
        items: [
          { label: t('nav_exams_necta_label') || "NECTA Results", desc: t('nav_exams_necta_desc'), path: "/results", icon: <LayoutGrid size={15} />, hot: true },
          { label: t('nav_exams_past_label') || "Past Papers", desc: t('nav_exams_past_desc'), path: "/past-papers", icon: <BookOpen size={15} /> },
          { label: t('nav_exams_prac_label') || "Practice & Quiz", desc: t('nav_exams_prac_desc'), path: "/exams/practice", icon: <Star size={15} /> },
        ],
      },
      {
        heading: "Resources",
        items: [
          { label: t('nav_exams_notes_label') || "Study Notes", desc: t('nav_exams_notes_desc'), path: "/notes", icon: <BookOpen size={15} /> },
          { label: t('nav_exams_uni_label') || "University Guide", desc: t('nav_exams_uni_desc'), path: "/university-guide", icon: <GraduationCap size={15} />, hot: true, badge: "New" },
          { label: t('nav_exams_courses_label') || "Online Courses", desc: t('nav_exams_courses_desc'), path: "/courses", icon: <GraduationCap size={15} /> },
        ],
      },
    ],
  },
  {
    id: "duka", label: t('nav_duka') || "Duka",
    featured: { title: t('nav_duka_title') || "STEA Duka", desc: t('nav_duka_desc') || "Top Deals, Local & China", path: "/duka/phones", icon: "🛍️" },
    cols: [
      {
        heading: t('nav_duka_cat_heading') || "Categories",
        items: [
          { label: t('nav_duka_tech_label') || "Phones", desc: t('nav_duka_tech_desc'), path: "/duka/phones", icon: <Smartphone size={15} />, hot: true },
          { label: t('nav_duka_acc_label') || "Laptops", desc: t('nav_duka_acc_desc'), path: "/duka/laptops", icon: <Laptop size={15} /> },
          { label: t('nav_duka_accessories_label') || "Accessories", desc: "Chargers, powerbanks & gadgets", path: "/duka/accessories", icon: <ShoppingBag size={15} /> },
        ],
      },
      {
        heading: t('nav_duka_seller_heading') || "Seller Guide",
        items: [
          { label: "Furniture", desc: "STEA Duka Furniture", path: "/duka/furniture", icon: <LayoutGrid size={15} /> },
          { label: "Beauty", desc: "STEA Cosmetics & Beauty", path: "/duka/beauty", icon: <Sparkles size={15} /> },
          { label: t('nav_duka_uza_label') || "Sell on STEA", desc: t('nav_duka_uza_desc'), path: "/sell", icon: <Tag size={15} />, badge: "Join" },
        ],
      },
    ],
  },
  {
    id: "gigs", label: t('nav_gigs') || "Gigs",
    featured: { title: t('nav_gigs_title') || "STEA Gigs", desc: t('nav_gigs_desc') || "Jobs & Service Gigs", path: "/kazi", icon: "💼" },
    cols: [
      {
        heading: t('nav_gigs_find_heading') || "Find Opportunities",
        items: [
          { label: t('nav_gigs_remote_label') || "Remote Gigs", desc: t('nav_gigs_remote_desc'), path: "/kazi?type=remote", icon: <Wifi size={15} />, hot: true },
          { label: t('nav_gigs_local_label') || "Local Gigs", desc: t('nav_gigs_local_desc'), path: "/kazi?type=local", icon: <Briefcase size={15} /> },
          { label: t('nav_gigs_free_label') || "Freelance", desc: t('nav_gigs_free_desc'), path: "/kazi?type=freelance", icon: <LayoutGrid size={15} /> },
        ],
      },
      {
        heading: t('nav_gigs_post_heading') || "Post Gigs",
        items: [
          { label: t('nav_gigs_post_label') || "Internships", desc: t('nav_gigs_post_desc'), path: "/kazi?type=internship", icon: <GraduationCap size={15} /> },
          { label: t('nav_gigs_tuma_label') || "Tuma Kazi Mpya", desc: t('nav_gigs_tuma_desc'), path: "/kazi?action=post", icon: <Zap size={15} />, badge: "Bure" },
        ],
      },
    ],
  },
  { id: "premium", label: "Premium & Careers", path: "/premium" },
  { id: "services", label: "Services", path: "/services" },
  { id: "about", label: t('nav_about') || "About", path: "/about" },
];

// ── UserChip ─────────────────────────────────────────
function UserChip({ user, onLogout, onAdmin, onProfile, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);


  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)} aria-label="Account"
        style={{
          width: 36, height: 36, borderRadius: "50%", border: `2px solid ${open ? G : "rgba(245,166,35,.3)"}`,
          background: open ? G : "rgba(245,166,35,.12)", color: open ? "#111" : G,
          fontWeight: 900, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s", overflow: "hidden",
          padding: 0,
        }}>
        <STEAAvatar user={user} size="sm" style={{ borderColor: open ? G : "rgba(245,166,35,.6)", boxShadow: "none" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .96 }}
            transition={{ duration: .14 }}
            style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 220, background: "rgba(8,9,18,.99)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.8)", padding: 8, zIndex: 10001, backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.displayName || "STEA User"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{user.email}</div>
              {(isAdminEmail(user.email) || user.role === "super_admin" || user.role === "admin" || user.role === "manager" || user.role === "seller" || user.role === "creator" || user.role === "reviewer" || user.role === "ceo") && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", color: G, background: `${G}15`, padding: "2px 8px", borderRadius: 4 }}>
                  <ShieldCheck size={9} /> {(isAdminEmail(user.email) ? "admin" : user.role).replace("_", " ")}
                </div>
              )}
            </div>
            {(isAdminEmail(user.email) || user.role === "super_admin" || user.role === "admin" || user.role === "manager" || user.role === "seller" || user.role === "creator" || user.role === "reviewer" || user.role === "ceo") && (
              <MenuItem 
                icon={<ShieldCheck size={15} />} 
                label={
                  user.role === "ceo" ? t('ceo_workspace', 'CEO Workspace') :
                  user.role === "seller" ? t('seller_dashboard') : 
                  user.role === "manager" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Manager` :
                  user.role === "creator" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Creator` :
                  user.role === "reviewer" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Reviewer` :
                  t('admin_panel')
                } 
                color={G} onClick={() => { setOpen(false); onAdmin(); }} />
            )}
            <MenuItem icon={<User size={15} />} label={t('user_profile')} onClick={() => { setOpen(false); onProfile(); }} />
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginTop: 6, paddingTop: 6 }}>
              <MenuItem icon={<LogOut size={15} />} label={t('user_logout')} color="#ef4444" onClick={() => { setOpen(false); onLogout(); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MenuItem = ({ icon, label, color = "rgba(255,255,255,.8)", onClick }) => (
  <button onClick={onClick}
    style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", color, fontWeight: 700, fontSize: 13, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderRadius: 10, transition: "background .15s" }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
    <span style={{ opacity: .7 }}>{icon}</span>{label}
  </button>
);

// ── Mega Menu Panel ──────────────────────────────────
function MegaMenu({ item, onClose, onTangazaNasi }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: .18, ease: [.4, 0, .2, 1] }}
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: item.cols?.length === 2 ? 520 : 300,
        background: "rgba(6,7,14,.98)",
        border: "1px solid rgba(255,255,255,.09)",
        borderRadius: 20,
        boxShadow: "0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(245,166,35,.05)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* Featured header */}
      {item.featured && (
        <Link to={item.featured.path}
          onClick={(e) => {
            if (item.featured.path === "/advertise") { e.preventDefault(); onTangazaNasi(); }
            onClose();
          }}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "linear-gradient(135deg,rgba(245,166,35,.1),rgba(245,166,35,.03))", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(245,166,35,.15)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
            {item.featured.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{item.featured.title}</span>
              {item.featured.badge && (
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em", color: "#111", background: G, padding: "2px 7px", borderRadius: 4 }}>{item.featured.badge}</span>
              )}
            </div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 2 }}>{item.featured.desc}</div>
          </div>
          <ArrowRight size={14} color="rgba(255,255,255,.25)" />
        </Link>
      )}

      {/* Columns */}
      <div style={{ display: "grid", gridTemplateColumns: item.cols?.length === 2 ? "1fr 1fr" : "1fr", padding: "10px 8px 10px" }}>
        {(item.cols || []).map((col, ci) => (
          <div key={ci} style={{ padding: "0 6px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.25)", padding: "6px 10px", marginBottom: 2 }}>
              {col.heading}
            </div>
            {col.items.map((it) => (
              <Link key={it.path + it.label} to={it.path}
                onClick={(e) => {
                  if (it.special || it.path === "/advertise") { e.preventDefault(); onTangazaNasi(); }
                  onClose();
                }}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, color: "#fff", transition: "background .14s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: it.hot ? `${G}18` : "rgba(255,255,255,.05)", display: "grid", placeItems: "center", color: it.hot ? G : "rgba(255,255,255,.4)", flexShrink: 0 }}>
                  {it.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{it.label}</span>
                    {it.badge && (
                      <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: G, background: `${G}18`, padding: "1px 5px", borderRadius: 3 }}>{it.badge}</span>
                    )}
                    {it.hot && <span style={{ fontSize: 8, color: "#ef4444", fontWeight: 900 }}>●</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.32)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Mobile Drawer ────────────────────────────────────
// ── Main Navbar ──────────────────────────────────────
export default function Navbar({ user, onAuth, onAdmin, onProfile, onSearch, onNotif, onTangazaNasi, onLogout, onDrawerOpen }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const location = useLocation();
  const closeTimer = useRef(null);
  const { t } = useSettings();

  const NAV = typeof t === 'function' ? getNav(t) : [];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mega menu on route change
  useEffect(() => { 
    const timer = setTimeout(() => {
      setActiveMenu(null); 
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleMenuEnter = useCallback((id) => {
    clearTimeout(closeTimer.current);
    setActiveMenu(id);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const isNavItemActive = (item) => {
    if (item.path) return location.pathname === item.path;
    if (item.cols) {
      const allPaths = item.cols.flatMap(c => c.items.map(i => i.path));
      return allPaths.some(p => location.pathname.startsWith(p) && p !== "/");
    }
    return false;
  };

  return (
    <>
      {/* MOBILE COMPACT NAVBAR (from User Prompt) */}
      <nav className="md:hidden" style={{
        position: 'sticky', top: 0, zIndex: 9990,
        background: 'rgba(10,10,10,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(245,166,35,0.1)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
      }}>
        {/* Logo left */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img 
            src="/stea-brand/favicon-transparent.png" 
            alt="STEA"
            style={{ 
              height: 34, 
              width: 34, 
              objectFit: 'contain',
              borderRadius: 8
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none', width: 34, height: 34, background: '#F5A623',
            borderRadius: 8, alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#000' }}>S</div>
          <span style={{ fontWeight: 900, fontSize: 19, color: '#fff', letterSpacing: -0.5 }}>
            STEA
          </span>
        </Link>

        {/* Icons right */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent('open-stea-support'))} className="glass" style={{
            height: 34, borderRadius: 10, padding: '0 10px',
            border: 'none', background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#fff'
          }}>
            <Heart size={14} fill="#ef4444" color="#ef4444" />
            <span className="hidden sm:inline">Support STEA</span>
          </button>

          <button onClick={onSearch} className="glass" style={{
            width: 36, height: 36, borderRadius: 10,
            border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15, position: 'relative', color: '#fff'
          }}>
            <Search size={16} />
          </button>
          
          <button onClick={() => setSwitcherOpen(true)} className="glass" style={{
            width: 36, height: 36, borderRadius: 10,
            border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 18, position: 'relative', color: '#fff'
          }}>
            ⊞
          </button>

          <GlobalNotificationBell user={user} />
          
          {user ? (
            <UserChip user={user} onLogout={onLogout} onAdmin={onAdmin} onProfile={onProfile} t={t} />
          ) : (
            <div onClick={onAuth} className="glass" style={{
              width: 34, height: 34, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#F5A623',
              cursor: 'pointer', background: 'rgba(245,166,35,0.1)'
            }}>
              <User size={16}/>
            </div>
          )}
        </div>
      </nav>

      <header className="hidden md:block" style={{
        position: "sticky", top: 0, zIndex: 9000,
        transition: "all .3s cubic-bezier(.4,0,.2,1)",
        background: scrolled
          ? "rgba(4, 5, 10, 0.9)"
          : "rgba(4, 5, 10, 0.6)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.04)",
        boxShadow: scrolled
          ? "0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.45)"
          : "none",
      }}>
        <div className="mobile-header-padding" style={{
          maxWidth: 1300, margin: "0 auto",
          padding: scrolled ? "0 24px" : "0 24px",
          height: scrolled ? 60 : 68,
          display: "flex", alignItems: "center", gap: 8,
          transition: "height .3s",
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: 8 }}>
            <SteaLogo size={scrolled ? "sm" : "md"} />
          </Link>

          {/* ── Desktop Nav ── */}
          <nav id="desktopNav" style={{
            display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 2,
          }}>
            {NAV.map((item) => {
              const isActive = isNavItemActive(item);
              const isOpen = activeMenu === item.id;

              if (!item.cols) {
                return (
                  <Link key={item.id} to={item.path}
                    style={{
                      padding: "8px 13px", borderRadius: 10,
                      color: isActive ? G : "rgba(255,255,255,.65)",
                      fontWeight: isActive ? 800 : 700, fontSize: 13.5,
                      textDecoration: "none", transition: "all .15s",
                      background: isActive ? `${G}12` : "transparent",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive ? G : "rgba(255,255,255,.65)"; e.currentTarget.style.background = isActive ? `${G}12` : "transparent"; }}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.id} style={{ position: "relative" }}
                  onMouseEnter={() => handleMenuEnter(item.id)}
                  onMouseLeave={handleMenuLeave}>
                  <button 
                    onClick={() => setActiveMenu(isOpen ? null : item.id)}
                    style={{
                    background: isOpen ? `${G}12` : "transparent",
                    border: "none",
                    padding: "8px 13px", borderRadius: 10,
                    color: isActive || isOpen ? G : "rgba(255,255,255,.65)",
                    fontWeight: isActive || isOpen ? 800 : 700, fontSize: 13.5,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = isActive || isOpen ? G : "#fff"; e.currentTarget.style.background = `${G}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive || isOpen ? G : "rgba(255,255,255,.65)"; e.currentTarget.style.background = isOpen ? `${G}12` : "transparent"; }}>
                    {item.label}
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .2 }}>
                      <ChevronDown size={13} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <MegaMenu item={item} onClose={() => setActiveMenu(null)} onTangazaNasi={onTangazaNasi} />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <STEAAppsLauncher actionButtonStyle={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(245,166,35,0.2)", background: "rgba(245,166,35,0.06)", color: G }} />

            {/* Search */}
            <button onClick={onSearch}
              style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Search size={17} />
            </button>

            {/* Settings */}
            <button onClick={() => setSettingsOpen(true)}
              style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Settings size={17} />
            </button>

            {/* Support STEA */}
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-stea-support'))}
              style={{ height: 38, padding: "0 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .15s", fontWeight: 800, fontSize: 13, WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Heart size={15} fill="#ef4444" color="#ef4444" style={{ filter: "drop-shadow(0 0 6px rgba(239,68,68,0.5))" }} />
              Support STEA
            </button>

            {/* Notif */}
            <GlobalNotificationBell user={user} />

            {user ? (
              <UserChip user={user} onLogout={onLogout} onAdmin={onAdmin} onProfile={onProfile} t={t} />
            ) : (
              <button onClick={onAuth}
                style={{ height: 38, padding: "0 18px", borderRadius: 11, background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, fontSize: 13, border: "none", cursor: "pointer", boxShadow: `0 4px 14px ${G}35`, transition: "all .2s", WebkitTapHighlightColor: "transparent" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 22px ${G}45`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 14px ${G}35`; }}
                onTouchStart={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
                onTouchEnd={e => { e.currentTarget.style.transform = ""; }}>
                {t('auth_login')}
              </button>
            )}

            {/* Hamburger — mobile */}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {createPortal(
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />,
        document.body
      )}

      {/* Removed SteaSwitcherOverlay portal */}

      <style>{`
        @media (max-width: 640px) {
          .mobile-header-padding {
            padding: 0 12px !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </>
  );
}
