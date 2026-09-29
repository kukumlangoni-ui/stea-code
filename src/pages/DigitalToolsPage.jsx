import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useSettings } from '../contexts/SettingsContext.jsx';
import SEOHead from '../components/SEOHead.jsx';
// Removed SteaAppSwitcher import
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { useMultiCollection } from "../hooks/useMultiCollection.js";
import { useCustomCategories } from "../hooks/useCustomCategories.js";

const DEFAULT_CATEGORIES = [
  { id: "ai", name: "AI Tools", icon: "🧠" },
  { id: "editing", name: "Editing", icon: "✂️" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "productivity", name: "Productivity", icon: "⚡" },
  { id: "education", name: "Education", icon: "📚" },
  { id: "vpn", name: "VPN & Security", icon: "🛡️" },
  { id: "automation", name: "Automation", icon: "🤖" },
];

export default function DigitalToolsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { docs: toolsDocs, loading: toolsLoading } = useMultiCollection(["digital_tools", "digitalTools"], "createdAt", 300);
  const { categories: rawCategories, loading: catsLoading } = useCustomCategories("digital_tool_categories", DEFAULT_CATEGORIES);

  const categories = useMemo(() => {
    if (!catsLoading && rawCategories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    return rawCategories.filter(c => c.status !== "inactive");
  }, [rawCategories, catsLoading]);

  const filteredTools = useMemo(() => {
    return toolsDocs.filter(t => {
      if (t.status === "inactive") return false;
      const matchesSearch = !searchTerm || (t.title || t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [toolsDocs, searchTerm, activeCategory]);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#111827', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <SEOHead title="STEA Digital Tools" description="Affordable digital tools, AI subscriptions, editing apps, and productivity resources." />
      
      <STEAHeader 
        title="Digital Tools" 
        user={user} 
      />

      <main style={{ width: 'min(1120px, 100%)', margin: '0 auto', padding: '38px 16px 52px' }}>
        <section style={{ maxWidth: 720, marginBottom: 30 }}>
          <p style={{ margin: '0 0 8px', color: '#9A7700', fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase', display: 'inline-block', background: '#FFFBF0', border: '1px solid rgba(212,175,55,0.3)', padding: '4px 10px', borderRadius: 999 }}>
            Digital Tools
          </p>
          <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(34px, 7vw, 54px)', letterSpacing: '-.05em', lineHeight: 1.02 }}>
            Affordable digital tools for work, study and creativity.
          </h1>
          <p style={{ margin: '15px 0 24px', color: '#4B5563', fontSize: 16, lineHeight: 1.65 }}>
            Find AI tools, editing apps, premium subscriptions and productivity tools through STEA.
          </p>
          
          <div style={{ position: "relative", maxWidth: 480 }}>
            <Search size={20} color="#9CA3AF" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text" 
              placeholder="Search tools, apps, subscriptions..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "16px 16px 16px 46px", borderRadius: 14, border: "1px solid #E5E7EB", fontSize: 16, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", outlineColor: "#D4AF37" }}
            />
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            <button 
              onClick={() => setActiveCategory("All")}
              style={{ padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
                border: activeCategory === "All" ? "1px solid #111827" : "1px solid #E5E7EB",
                background: activeCategory === "All" ? "#111827" : "#fff",
                color: activeCategory === "All" ? "#fff" : "#4B5563"
              }}
            >
              All Tools
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id || cat.name}
                onClick={() => setActiveCategory(cat.name)}
                style={{ padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                  border: activeCategory === cat.name ? "1px solid #111827" : "1px solid #E5E7EB",
                  background: activeCategory === cat.name ? "#111827" : "#fff",
                  color: activeCategory === cat.name ? "#fff" : "#4B5563"
                }}
              >
                {cat.icon && <span>{cat.icon}</span>} {cat.name}
              </button>
            ))}
          </div>
        </section>

        {toolsLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading tools...</div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredTools.map(tool => {
              const title = tool.title || tool.name;
              return (
                <article 
                  key={tool.id} 
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(17,24,39,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }} 
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(17,24,39,0.04)'; e.currentTarget.style.borderColor = '#E5E7EB'; }} 
                  style={{ minHeight: 220, padding: 20, display: 'flex', flexDirection: 'column', border: '1px solid #E5E7EB', borderRadius: 20, background: '#fff', boxShadow: '0 8px 24px rgba(17,24,39,0.04)', transition: 'all 0.2s ease', cursor: "pointer", position: "relative", overflow: "hidden" }}
                  onClick={() => {
                    const link = tool.actionLink || tool.url || tool.link;
                    if (link) window.open(link, "_blank");
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "#F3F4F6", overflow: "hidden", display: "grid", placeItems: "center", border: "1px solid #E5E7EB" }}>
                      {(tool.thumbnailUrl || tool.icon) ? (
                        <img src={tool.thumbnailUrl || tool.icon} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>🛠️</span>
                      )}
                    </div>
                    {tool.category && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#B88E00", background: "#FFFBF0", border: "1px solid rgba(212,175,55,0.2)", padding: "4px 8px", borderRadius: 6, letterSpacing: "0.03em" }}>
                        {tool.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>{title}</h2>
                  <p style={{ flex: 1, margin: 0, color: '#4B5563', fontSize: 14, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tool.description}</p>
                  
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                      {tool.price || "Free"}
                    </div>
                    <button style={{ padding: '8px 16px', border: 0, borderRadius: 10, background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      {tool.actionText || "Request Tool"} <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
            {filteredTools.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🔍</span>
                <h3 style={{ margin: "0 0 8px", color: "#111827", fontSize: 18 }}>No tools found</h3>
                <p style={{ margin: 0, color: "#6B7280" }}>Try adjusting your search or category filter.</p>
              </div>
            )}
          </section>
        )}

        <section style={{ marginTop: 40, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderRadius: 20, background: '#111827', color: '#fff', boxShadow: '0 12px 32px rgba(17,24,39,0.15)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Need a custom tool or plan?</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.7)', fontSize: 14 }}>Contact STEA support and we'll help you find it.</p>
          </div>
          <button onClick={() => navigate('/contact')} style={{ padding: '12px 20px', border: 0, borderRadius: 12, background: '#D4AF37', color: '#111827', fontWeight: 900, cursor: 'pointer', fontSize: 14 }}>
            Contact Support
          </button>
        </section>
      </main>

    </div>
  );
}
