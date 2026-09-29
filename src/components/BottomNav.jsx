/**
 * BottomNav — Premium glass mobile navigation
 * Smooth active indicators · haptic-feel press · gold accents
 * Multi-page active matches & premium slide-up drawer
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, Cpu, GraduationCap, ShoppingBag, Menu, X,
  Briefcase, BookOpen, Handshake, HelpCircle, Megaphone, Settings, Video
} from "lucide-react";
import SettingsModal from "./SettingsModal";

const G = "#F5A623";

const ITEMS = [
  { to: "/",             icon: "🏠",          label: "Home",        match: (p) => p === "/" },
  { to: "/education",   icon: "🎓",          label: "Education",   match: (p) => p.startsWith("/education") || p.startsWith("/student") || p === "/courses" || p.startsWith("/results") || p.startsWith("/notes") || p.startsWith("/past-papers") || p.startsWith("/scholarships") || p.startsWith("/exams") },
  { to: "/websites",    icon: "🌐",          label: "Websites",    match: (p) => p.startsWith("/websites") || p.startsWith("/site") },
  { to: "/marketplace", icon: "🛍️",          label: "Marketplace", match: (p) => p.startsWith("/marketplace") || p.startsWith("/duka") },
  { to: "/gigs",        icon: "💼",          label: "Work",        match: (p) => p.startsWith("/gigs") || p.startsWith("/kazi") },
  { to: "/creators",    icon: "🎬",          label: "Creators",    match: (p) => p.startsWith("/creators") || p.startsWith("/creator") || p.startsWith("/watch") },
];

function NavItem({ to, icon, label, active, onClick, isDark }) {
  const G = "#F5A623";
  const inactiveColor = isDark ? 'rgba(255,255,255,0.4)' : '#64748b';
  const activeColor = isDark ? G : '#d4a017';
  const [w, setW] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setW(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const compact = w < 370;

  const content = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: compact ? 1 : 3, padding: compact ? '2px 4px' : '4px 6px',
      borderRadius: 12, transition: 'all 0.2s',
    }}>
      <span className="bottom-nav-icon" style={{
        fontSize: compact ? 22 : 24,
        lineHeight: 1,
        display: 'block',
        filter: 'none',
        transition: 'transform 0.2s',
        transform: active ? 'translateY(-1px)' : 'none',
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: compact ? 9.5 : 10.5,
        fontWeight: 700,
        color: active ? activeColor : inactiveColor,
        marginTop: 1
      }}>
        {label}
      </span>
      {active && (
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: activeColor, marginTop: 1 }} />
      )}
    </div>
  );

  const style = {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    gap: 3, padding: '8px 0',
    position: 'relative',
    textDecoration: 'none',
    WebkitTapHighlightColor: "transparent",
    userSelect: "none"
  };

  if (to) {
    return (
      <Link to={to} style={style} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button style={style} onClick={onClick}>
      {content}
    </button>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const [theme, setTheme] = React.useState(() => localStorage.getItem("stea_home_theme") || "light");

  React.useEffect(() => {
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener("stea-theme-change", handleThemeChange);
    return () => window.removeEventListener("stea-theme-change", handleThemeChange);
  }, []);

  const isDark = theme === "dark";

  return (
    <nav className="mobile-bottom-nav" style={{
      position: 'fixed', 
      bottom: 'calc(16px + env(safe-area-inset-bottom))', 
      left: 'calc(16px + env(safe-area-inset-left))', 
      right: 'calc(16px + env(safe-area-inset-right))',
      zIndex: 'var(--stea-z-bottom-nav, 70)',
      background: isDark ? 'rgba(3, 7, 18, 0.94)' : 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5eaf0',
      borderRadius: 28,                      // ← pill shaped!
      display: 'flex', alignItems: 'center',
      height: 60,
      paddingBottom: 0,
      boxShadow: isDark ? '0 18px 45px rgba(0,0,0,0.45)' : '0 18px 45px rgba(15, 23, 42, 0.12)',
      maxWidth: 480, margin: '0 auto',
    }}>
      {ITEMS.map((item) => (
        <NavItem
          key={item.label}
          to={item.to}
          icon={item.icon}
          label={item.label}
          active={item.match(path)}
          isDark={isDark}
        />
      ))}
    </nav>
  );
}
