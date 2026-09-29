import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowRight, 
  Globe, 
  BookOpen, 
  School, 
  Globe2, 
  PlayCircle, 
  BriefcaseBusiness, 
  Wrench, 
  Sparkles, 
  Search, 
  Bell, 
  Heart,
  NotebookPen,
  FileText,
  ChartColumn,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { STEAAppsLauncher } from "../components/shared/STEAAppsLauncher.jsx";
import GlobalNotificationBell from "../components/GlobalNotificationBell.jsx";

// Standard Apps Definition
const APPS = [
  { 
    id: "education", 
    name: "Education", 
    emoji: "🎓", 
    desc: "Notes, past papers, classroom, and exam results to help you excel.",
    items: ["Notes", "Past Papers", "NECTA Results", "Classroom"],
    to: "/education", 
    buttonText: "Open Education",
    color: "#D4AF37" 
  },
  { 
    id: "websites", 
    name: "Websites", 
    emoji: "🌐", 
    desc: "Handpicked premium sites, learning resources, and productivity hubs.",
    items: ["Curated websites", "AI tools", "Streaming", "Learning resources"],
    to: "/websites", 
    buttonText: "Open Websites",
    color: "#2563EB" 
  },
  { 
    id: "ai", 
    name: "STEA AI", 
    emoji: "🤖", 
    desc: "Intelligent tools, assistants, prompt templates, and automation workflows.",
    items: ["AI tools", "Assistants", "Prompts", "Automation"],
    to: "/ai", 
    buttonText: "Open AI",
    color: "#10B981" 
  },
  { 
    id: "gigs", 
    name: "Gigs & Kazi", 
    emoji: "💼", 
    desc: "Find remote projects, local opportunities, internships, and work.",
    items: ["Jobs", "Freelance work", "Remote opportunities"],
    to: "/gigs-kazi", 
    buttonText: "Open Gigs",
    color: "#A855F7" 
  },
  { 
    id: "creators", 
    name: "Creators", 
    emoji: "👨‍💻", 
    desc: "Bespoke platform resources, creator tips, videos, and templates.",
    items: ["Creator hub", "Videos", "Community"],
    to: "/creators", 
    buttonText: "Open Creators",
    color: "#F97316" 
  },
  { 
    id: "services", 
    name: "Services", 
    emoji: "🛠", 
    desc: "Get custom website design, software systems, and modern digital support.",
    items: ["Website design", "Software", "Digital services"],
    to: "/services", 
    buttonText: "Open Services",
    color: "#EF4444" 
  }
];

const ROTATING_LABELS = [
  "Learn Smarter",
  "Create Faster",
  "Work Better",
  "Build Your Future",
  "Grow With STEA"
];

export default function HomePageV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useSettings();
  
  // States for search and animated title
  const [searchQuery, setSearchQuery] = useState("");
  const [rotationIndex, setRotationIndex] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % ROTATING_LABELS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const closeProfile = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const triggerSupport = () => {
    window.dispatchEvent(new CustomEvent("open-stea-support"));
  };

  const initial = (user?.displayName || user?.email || "S").slice(0, 1).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", color: "#111827", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      
      {/* ── TOP NAVIGATION ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 1000, background: "rgba(255, 255, 255, 0.96)", borderBottom: "1px solid #E5E7EB", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          
          {/* Brand Left */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#111827" }}>
            <div style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid #D4AF37", borderRadius: 10, background: "#FFFFFF", flexShrink: 0 }}>
              <img src="/stea-brand/stea-s-logo-transparent-512.png" alt="STEA" style={{ width: 22, height: 22, objectFit: "contain" }} />
            </div>
            <strong style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>STEA</strong>
          </Link>

          {/* Global Search Center */}
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: 460, position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search notes, websites, jobs, AI tools, results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontSize: 14,
                color: "#111827",
                outline: "none",
                transition: "border-color 0.2s, background-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D4AF37";
                e.target.style.backgroundColor = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.backgroundColor = "#F9FAFB";
              }}
            />
          </form>

          {/* Controls Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Language switches */}
            <div style={{ display: "flex", border: "1px solid #E5E7EB", borderRadius: 8, padding: 2, background: "#F9FAFB" }}>
              {[["en", "EN"], ["sw", "SW"]].map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  style={{
                    border: 0,
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: language === code ? "#FFFFFF" : "transparent",
                    color: language === code ? "#D4AF37" : "#4B5563",
                    boxShadow: language === code ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Notification & Grid Icons */}
            {user && <GlobalNotificationBell user={user} />}
            <STEAAppsLauncher compact />

            {/* Support Heart Trigger */}
            <button
              onClick={triggerSupport}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#EF4444",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              ❤️
            </button>

            {/* Profile Avatar */}
            {user ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    border: "1px solid #E5E7EB",
                    background: "#EFF6FF",
                    color: "#2563EB",
                    fontWeight: 800,
                    fontSize: 14,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    overflow: "hidden"
                  }}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : initial}
                </button>
                {profileOpen && (
                  <div style={{ position: "absolute", right: 0, top: 46, width: 220, padding: 8, border: "1px solid #E5E7EB", borderRadius: 12, background: "#FFFFFF", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.displayName || "STEA User"}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      style={{ width: "100%", padding: "8px 12px", border: 0, borderRadius: 8, background: "transparent", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#111827", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); triggerSupport(); }}
                      style={{ width: "100%", padding: "8px 12px", border: 0, borderRadius: 8, background: "transparent", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#111827", cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      Support STEA
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/profile")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "#111827",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "64px 20px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, border: "1px solid rgba(212,175,55,0.3)", background: "#FFFBF0", color: "#B88E00", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 20 }}>
          <Globe size={11} /> AFRICA'S DIGITAL ECOSYSTEM
        </div>
        
        {/* Animated Rotating Subheadline */}
        <div style={{ height: 28, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37", transition: "all 0.5s ease" }}>
            {ROTATING_LABELS[rotationIndex]}
          </span>
        </div>

        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          One Platform.<br />Many Opportunities.
        </h1>

        <p style={{ margin: "0 auto 32px", maxWidth: 600, fontSize: "clamp(15px, 2.2vw, 18px)", lineHeight: 1.6, color: "#4B5563" }}>
          Education, AI, websites, creators, jobs and digital services in one ecosystem.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => document.getElementById("apps-grid-section")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: "#111827",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 14,
              border: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(17,24,39,0.15)"
            }}
          >
            Explore STEA <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate("/profile")}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#111827",
              fontWeight: 700,
              fontSize: 14,
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}
          >
            Sign In
          </button>
        </div>

        <div style={{ marginTop: 28, fontSize: 12, color: "#9CA3AF" }}>
          Used by students, creators and professionals.
        </div>
      </section>

      {/* ── QUICK ACCESS SECTION ── */}
      <section style={{ borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA", padding: "24px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {[
              { label: "Notes", emoji: "📚", to: "/education/notes" },
              { label: "Past Papers", emoji: "📄", to: "/education/past-papers" },
              { label: "Results", emoji: "📊", to: "/education/results" },
              { label: "Classroom", emoji: "🏫", to: "https://classroom.stea.africa" },
              { label: "AI", emoji: "🤖", to: "/ai" },
              { label: "Websites", emoji: "🌐", to: "/websites" }
            ].map((qa) => (
              <button
                key={qa.label}
                onClick={() => (qa.to.startsWith("http") ? window.location.href = qa.to : navigate(qa.to))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "transform 0.15s, border-color 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.borderColor = "#D4AF37";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                <span style={{ fontSize: 16 }}>{qa.emoji}</span>
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN APPS GRID ── */}
      <section id="apps-grid-section" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 20px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {APPS.map((app) => (
            <div
              key={app.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 20,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                transition: "border-color 0.25s, transform 0.25s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#D4AF37";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{app.emoji}</div>
                <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{app.name}</h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, lineHeight: 1.5, color: "#6B7280" }}>{app.desc}</p>
                
                {/* Embedded tags/modules list */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                  {app.items.map((it) => (
                    <span key={it} style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", background: "#F3F4F6", padding: "4px 8px", borderRadius: 6 }}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => (app.to.startsWith("http") ? window.location.href = app.to : navigate(app.to))}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F3F4F6"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#F9FAFB"}
              >
                {app.buttonText} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY STEA ── */}
      <section style={{ background: "#FAFAFA", borderTop: "1px solid #F3F4F6", padding: "64px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 40px", fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center" }}>Why STEA?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
            {[
              {
                title: "Education",
                desc: "High-quality academic resources, digitized note-taking, and simplified access to exam verification."
              },
              {
                title: "Technology",
                desc: "Modern utilities, AI productivity boosters, and curated digital solutions for online workflows."
              },
              {
                title: "Opportunities",
                desc: "Connecting local and remote talent to freelance gigs, work directories, and developer support."
              }
            ].map((item) => (
              <div key={item.title} style={{ background: "#FFFFFF", padding: 24, borderRadius: 16, border: "1px solid #E5E7EB" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#4B5563" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORT STEA ── */}
      <section style={{ maxWidth: 760, margin: "64px auto", padding: "0 20px", textAlign: "center" }}>
        <div style={{ background: "#FFFDF6", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 20, padding: "36px 24px" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>Help Build Africa's Digital Future</h3>
          <p style={{ margin: "0 auto 24px", maxWidth: 500, fontSize: 13, lineHeight: 1.6, color: "#6B7280" }}>
            STEA is a community-first ecosystem. Your contributions help maintain high-speed servers, database systems, and open digital access.
          </p>
          <button
            onClick={triggerSupport}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: 0,
              background: "linear-gradient(180deg, #D4AF37 0%, #B88E00 100%)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(212,175,55,0.2)"
            }}
          >
            Support STEA ❤️
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #F3F4F6", background: "#FFFFFF", padding: "48px 20px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, marginBottom: 40 }}>
            <div>
              <strong style={{ fontSize: 16, fontWeight: 800, color: "#D4AF37", display: "block", marginBottom: 12 }}>STEA</strong>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "#9CA3AF", margin: 0 }}>
                Africa's unified platform for knowledge, tools, and digital solutions.
              </p>
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>Ecosystem</span>
              <div style={{ display: "grid", gap: 8 }}>
                <Link to="/education" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Education</Link>
                <Link to="/websites" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Websites</Link>
                <Link to="/ai" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>AI Tools</Link>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>Services</span>
              <div style={{ display: "grid", gap: 8 }}>
                <Link to="/creators" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Creators</Link>
                <Link to="/services" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Services</Link>
                <Link to="/gigs-kazi" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Gigs & Kazi</Link>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>Legal</span>
              <div style={{ display: "grid", gap: 8 }}>
                <Link to="/privacy" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Privacy Policy</Link>
                <Link to="/terms" style={{ fontSize: 12, color: "#6B7280", textDecoration: "none" }}>Terms of Service</Link>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 20, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
            &copy; {new Date().getFullYear()} STEA. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
