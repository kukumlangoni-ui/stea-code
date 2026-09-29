import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, BookOpen, Handshake, HelpCircle, Megaphone, Settings,
  Home, Cpu, GraduationCap, ShoppingBag, X, Info, Contact, Shield,
  FileText, LayoutGrid, Award, Brain, Bell, Star
} from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import SettingsModal from "../components/SettingsModal.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD_BG = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 clamp(16px,4vw,36px)", ...style }}>
    {children}
  </div>
);

export default function MenuPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const mainCategories = [
    {
      group: "Core Sections & Hubs",
      items: [
        { label: "Home", path: "/", desc: "Kurasa Kuu ya STEA", icon: <Home size={18} />, color: "#38bdf8" },
        { label: "Tech Hub", path: "/tech", desc: "Zana na teknolojia zote", icon: <Cpu size={18} />, color: G },
        { label: "STEA Education", path: "/education", desc: "Platform ya wanafunzi Tanzania", icon: <GraduationCap size={18} />, color: "#a855f7" },
        { label: "STEA Student Hub", path: "/student-hub", desc: "Student Profiles, Discussion Hub, Badges & Referral Engine", icon: <GraduationCap size={18} />, badge: "NEW", color: "#fb7185" },
        { label: "Duka Marketplace", path: "/duka", desc: "Simu, laptop na kuagiza China", icon: <ShoppingBag size={18} />, color: "#10b981" },
      ]
    },
    {
      group: "AI, Web & Digital Tools",
      items: [
        { label: "Prompt Lab", path: "/prompt-lab", desc: "Kuandika AI prompts", icon: <Brain size={18} />, color: "#ec4899" },
        { label: "AI Lab", path: "/ai-lab", desc: "Majaribio ya akili mnemba", icon: <Star size={18} />, color: "#facc15" },
        { label: "Website Designs", path: "/websites", desc: "Uundaji wa tovuti za kisasa", icon: <LayoutGrid size={18} />, color: "#3b82f6" },
        { label: "Digital Tools", path: "/digital-tools", desc: "Programu na zana za kidijitali", icon: <Award size={18} />, color: "#06b6d4" },
      ]
    },
    {
      group: "Employment & Education",
      items: [
        { label: "STEA Premium & Careers", path: "/premium", desc: "Gigs, Creators, Teacher Pro & Subscriptions", icon: <Award size={18} />, badge: "Phase 5", color: G },
        { label: "Gigs & Kazi Lounge", path: "/kazi", desc: "Remote, Freelance na Internships", icon: <Briefcase size={18} />, color: "#fb923c" },
        { label: "Online Courses", path: "/courses", desc: "Video lessons na kujifunza", icon: <BookOpen size={18} />, color: "#f43f5e" },
        { label: "Professional Services", path: "/services", desc: "Ushauri, matangazo na IT support", icon: <Handshake size={18} />, color: "#10b981" },
        { label: "Gaming Zone", path: "/games", desc: "Cheza michezo ya akili", icon: <Cpu size={18} />, badge: "Coming Soon", color: "#a78bfa" }
      ]
    },
    {
      group: "Company & Support",
      items: [
        { label: "About STEA", path: "/about", desc: "Kuhusu sisi na malengo yetu", icon: <Info size={18} />, color: "#60a5fa" },
        { label: "Advertise with Us", path: "/advertise", desc: "Tangaza bidhaa au chapa yako", icon: <Megaphone size={18} />, color: "#f59e0b" },
        { label: "Contact Support", path: "/contact", desc: "Wasiliana nasi kwa msaada", icon: <Contact size={18} />, color: "#34d399" },
        { label: "FAQs & Guide", path: "/faq", desc: "Maswali yanayoulizwa sana", icon: <HelpCircle size={18} />, color: "#818cf8" }
      ]
    },
    {
      group: "Legal & Settings",
      items: [
        { label: "Privacy Policy", path: "/privacy", desc: "Ulinzi wa data na faragha", icon: <Shield size={18} />, color: "#94a3b8" },
        { label: "Terms of Service", path: "/terms", desc: "Vigezo na masharti ya matumizi", icon: <FileText size={18} />, color: "#94a3b8" }
      ]
    }
  ];

  return (
    <div style={{ background: DARK, minHeight: "100vh", color: "#fff", fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* Header section */}
      <div style={{ paddingTop: isMobile ? 80 : 120, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <W>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? 28 : 42,
                fontWeight: 900,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                margin: 0,
                background: "linear-gradient(to right, #fff, rgba(255,255,255,0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                STEA Central Menu
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "8px 0 0" }}>
                Pata kurasa na huduma zote za STEA kwa haraka mahali pamoja.
              </p>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                width: 44, height: 44,
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${BORDER}`,
                color: G,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <Settings size={20} />
            </button>
          </div>
        </W>
      </div>

      {/* Main body content */}
      <div style={{ padding: "40px 0 80px" }}>
        <W>
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            {mainCategories.map((cat, ci) => (
              <div key={ci}>
                {/* Group Heading */}
                <h3 style={{
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 16
                }}>
                  {cat.group}
                </h3>

                {/* Sub-grid of items */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12
                }}>
                  {cat.items.map((it, idx) => (
                    <Link
                      key={idx}
                      to={it.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: 16,
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${BORDER}`,
                        borderRadius: 16,
                        textDecoration: "none",
                        color: "#fff",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor = BORDER;
                      }}
                    >
                      <div style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: `${it.color}12`,
                        color: it.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {it.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14.5 }}>{it.label}</span>
                          {it.badge && (
                            <span style={{
                              fontSize: 8, fontWeight: 900,
                              textTransform: "uppercase", color: G,
                              background: `${G}18`, padding: "1px 5px", borderRadius: 3
                            }}>
                              {it.badge}
                            </span>
                          )}
                        </div>
                        <span style={{
                          display: "block",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>
                          {it.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </W>
      </div>

      {settingsOpen && (
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
