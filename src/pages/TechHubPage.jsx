import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, Cpu, Globe, Key, Server, BookOpen, 
  ArrowRight, ChevronRight, Home, ShieldCheck, Zap
} from "lucide-react";
import SEOHead from "../components/SEOHead.jsx";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { useState } from "react";
import { SteaEcosystemBanner, SteaExploreMore } from "../components/SteaEcosystem.jsx";
import SteaHero from "../components/ui/SteaHero.jsx";

// Reusable STEA Main Page Banner
function SteaMainBanner() {
  const [hov, setHov] = React.useState(false);
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        whileHover={{ scale: 1.01 }}
        style={{
          background: hov ? 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.06))' : 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.5))',
          border: `1px solid ${hov ? 'rgba(245,166,35,0.5)' : 'rgba(245,166,35,0.2)'}`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: hov ? '0 8px 28px rgba(245,166,35,0.15)' : '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Home size={18} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>STEA AFRICA</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Visit STEA Main Page</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Education · Duka · Services · Gigs</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F5A623', fontWeight: 800, fontSize: 11, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}>
          Explore <ArrowRight size={12} style={{ transform: hov ? 'translateX(4px)' : '', transition: 'transform 0.2s' }} />
        </div>
      </motion.div>
    </Link>
  );
}

const G = "#F5A623";
const G2 = "#FFD17C";

// Reusable TechHub navigation tabs for all tech pages
export function TechHubNavbar({ tabs: providedTabs }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const defaultTabs = [
    { label: "AI Lab", path: "/ai", icon: <Sparkles size={14} /> },
    { label: "Prompt Lab", path: "/prompts", icon: <Cpu size={14} /> },
    { label: "Websites", path: "/websites", icon: <Globe size={14} /> },
    { label: "Digital Tools", path: "/digital-tools", icon: <Key size={14} /> },
  ];

  const tabs = providedTabs || defaultTabs;

  return (
    <div className="techhub-tabs" style={{
      width: "100%",
      background: "#080a14",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      position: "sticky",
      top: 60, // Sits comfortably below header
      zIndex: 8500,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        overflowX: "auto",
        scrollbarWidth: "none", // Hide scrollbar Firefox
        msOverflowStyle: "none", // Hide scrollbar IE
        padding: "0 16px",
        height: 48,
      }}>
        {/* Inline CSS to hide scrollbar Chrome/Safari and enforce responsive subnav sticky heights */}
        <style dangerouslySetInnerHTML={{__html: `
          ::-webkit-scrollbar { display: none; }
          .techhub-tabs {
            position: sticky !important;
            top: 54px !important;
            z-index: 8500 !important;
            background: #080a14 !important;
          }
          @media (min-width: 768px) {
            .techhub-tabs {
              top: 60px !important;
              background: #080a14 !important;
            }
          }
        `}} />

        <div style={{ display: "flex", gap: 8, height: "100%", alignItems: "center" }}>
          {tabs.map((tab) => {
            const active = currentPath === tab.path || (tab.path !== "/tech" && currentPath.startsWith(tab.path));
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 14px",
                  height: 32,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 800 : 500,
                  color: active ? "#F5A623" : "rgba(255, 255, 255, 0.6)",
                  background: active ? "rgba(245, 166, 35, 0.1)" : "transparent",
                  border: active ? "1px solid rgba(245, 166, 35, 0.2)" : "1px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TechHubPage() {
  const navigate = useNavigate();

  const cards = [
    { emoji: '✦', name: 'AI Lab', desc: 'ChatGPT, Gemini & more', color: '#C084FC', bg: '#1a0a2e', path: '/ai', label: 'Open', badge: 'AI' },
    { emoji: '⚙️', name: 'Prompt Lab', desc: 'Best AI Prompts', color: '#F472B6', bg: '#2a0a1e', path: '/prompts', label: 'Open', badge: 'HOT' },
    { emoji: '⊞', name: 'Digital Tools', desc: 'Free utilities', color: '#4ADE80', bg: '#0a2a0a', path: '/digital-tools', label: 'Open', badge: 'FREE' },
    { emoji: '🌐', name: 'Web Solutions', desc: 'From TZS 150K', color: '#F5A623', bg: '#2a1a00', path: '/websites', label: 'Open', badge: 'PRO' },
    { emoji: '⚡ 📋 📚', name: 'Daily New Tech Tips & Resources', desc: 'Daily AI tips, useful guides, PDFs, tools and resources from different tech topics.', color: '#F5A623', bg: '#1a1000', path: '/tech/tips-resources', label: 'Open Resources', badge: 'DAILY / FREE', fullWidth: true },
  ];

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "transparent", color: "#fff", paddingBottom: 120, overflow: "hidden" }}>
      <AnimatedBackground />

      {/* Ecosystem Discovery Banner */}
      <SteaEcosystemBanner page="tech" />

      {/* Dynamic dynamically generated SEO tags */}
      <SEOHead 
        title="Tech Hub — AI Lab, Tools na Zana Tanzania | STEA"
        description="Gundua AI Lab, Copy-paste Prompt Lab, bidhaa za kidijitali, tovuti za kisasa, na msaada wa kiteknolojia nchini Tanzania."
        keywords={["AI Lab Tanzania", "digital tools Tanzania", "websites Tanzania", "STEA TechHub", "Prompt lab"]}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* TechHub Subnavbar */}
        <TechHubNavbar />

        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* TechHub Hero */}
        <div className="techhub-hero" style={{ 
          padding: '24px 16px 32px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <SteaHero 
          badge="Tech Hub"
          titleLine1="STEA"
          titleLine2="Tech Hub"
          subtitle="Njia rahisi ya kupata zana za AI, templates za prompt, na huduma za tovuti nchini Tanzania."
        />
        </div>

        {/* Sub-sections Grid */}
        <div style={{ padding: '0 16px' }}>
          {/* Visit STEA Main Page Banner */}
          <SteaMainBanner />
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}>
            {cards.map((card, i) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                onClick={() => navigate(card.path)}
                className="glass-card"
                style={{
                  borderRadius: 14, padding: card.fullWidth ? '20px' : '16px 12px', cursor: 'pointer',
                  position: 'relative', minHeight: 0,
                  display: 'flex', flexDirection: card.fullWidth ? 'row' : 'column',
                  alignItems: card.fullWidth ? 'center' : 'flex-start',
                  gap: card.fullWidth ? '16px' : '0',
                  gridColumn: card.fullWidth ? '1 / -1' : undefined,
                  background: card.fullWidth ? 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(10,10,12,0.9))' : undefined,
                  border: card.fullWidth ? '1px solid rgba(245, 166, 35, 0.2)' : undefined,
                  boxShadow: card.fullWidth ? '0 10px 40px rgba(0,0,0,0.5)' : undefined
                }}
              >
                {/* Badge — tiny, top right */}
                {card.badge && (
                  <span style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: 9, fontWeight: 800,
                    background: `${card.color}20`,
                    color: card.color,
                    border: `1px solid ${card.color}40`,
                    borderRadius: 20, padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}>{card.badge}</span>
                )}
                
                <div style={{ fontSize: card.fullWidth ? 42 : 28, marginBottom: card.fullWidth ? 0 : 10, color: card.color, flexShrink: 0 }}>
                  {card.emoji}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: card.fullWidth ? 16 : 14, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.2, paddingRight: card.fullWidth ? 60 : 0 }}>
                    {card.name}
                  </div>
                  <div style={{ fontSize: card.fullWidth ? 12 : 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: card.fullWidth ? 16 : 12,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: card.fullWidth ? 3 : 1, WebkitBoxOrient: 'vertical'
                  }}>
                    {card.desc}
                  </div>
                  <div style={{ fontSize: card.fullWidth ? 11 : 10, color: card.color, fontWeight: 700, marginTop: 'auto' }}>
                    {card.label} →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
     </div>

      {/* Explore More STEA */}
      <SteaExploreMore exclude="tech" />
    </div>
  );
}
