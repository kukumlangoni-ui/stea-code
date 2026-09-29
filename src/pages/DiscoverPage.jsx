import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCollection } from "../hooks/useFirestore.js";
import SEOHead from "../components/SEOHead.jsx";

const CATEGORIES = [
  { id: "all", label: "All Content", emoji: "🔥" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "scholarships", label: "Scholarships", emoji: "🎓" },
  { id: "jobs", label: "Jobs & Gigs", emoji: "💼" },
  { id: "websites", label: "Websites", emoji: "🌐" },
  { id: "creators", label: "Creators", emoji: "🎬" },
  { id: "resources", label: "Resources", emoji: "⚡" },
  { id: "marketplace", label: "Marketplace", emoji: "🛍️" }
];

export default function DiscoverPage() {
  const navigate = useNavigate();

  // Selected tab state (Latest / Trending)
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("stea_discover_tab") || "latest";
  });

  // Category filter state
  const [activeCategory, setActiveCategory] = useState("all");

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Paginated/Infinite scroll counts
  const [visibleCount, setVisibleCount] = useState(10);

  // Retrieve Firebase updates & listings counts
  const { docs: courses, loading: loadingCourses } = useCollection("courses", "createdAt", 30);
  const { docs: updates, loading: loadingUpdates } = useCollection("updates", "createdAt", 30);
  const { docs: jobs, loading: loadingJobs } = useCollection("posts", "createdAt", 30);
  const { docs: tips, loading: loadingTips } = useCollection("tips", "createdAt", 30);

  const selectTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("stea_discover_tab", tab);
  };

  // Compile Latest content items
  const latestItems = [];

  // Classroom
  if (courses) {
    courses.forEach((item, index) => {
      latestItems.push({
        id: `course-${item.id || index}`,
        emoji: "🏫",
        category: "classroom",
        title: item.title || "New Course",
        desc: item.description || "Fresh classroom course content uploaded.",
        to: "https://classroom.stea.africa",
        badge: "Updated",
        metricText: "Active now",
        timestamp: item.createdAt || Date.now() - (index * 3600000)
      });
    });
  }

  // Scholarships / updates
  if (updates) {
    updates.forEach((item, index) => {
      latestItems.push({
        id: `update-${item.id || index}`,
        emoji: "🎓",
        category: "scholarships",
        title: item.title || "Scholarship Alert",
        desc: item.desc || "Fully funded study abroad opportunity listing.",
        to: "/education",
        badge: "New",
        metricText: "Apply Today",
        timestamp: item.createdAt || Date.now() - (index * 4200000)
      });
    });
  }

  // Jobs
  if (jobs) {
    jobs.forEach((item, index) => {
      latestItems.push({
        id: `job-${item.id || index}`,
        emoji: "💼",
        category: "jobs",
        title: item.title || "Career Opportunity",
        desc: item.description || "Find freelance gigs or full-time opportunities.",
        to: "/gigs-kazi",
        badge: "Daily",
        metricText: "Find Work",
        timestamp: item.createdAt || Date.now() - (index * 5000000)
      });
    });
  }

  // Tips / Resources
  if (tips) {
    tips.forEach((item, index) => {
      latestItems.push({
        id: `tip-${item.id || index}`,
        emoji: "⚡",
        category: "resources",
        title: item.title || "Tech Resource",
        desc: item.description || "Widgets, prompt packs and daily guides.",
        to: "/resources",
        badge: "Free",
        metricText: "Download",
        timestamp: item.createdAt || Date.now() - (index * 6000000)
      });
    });
  }

  // Fallbacks if Firestore databases are loading or empty
  const latestFallback = [
    { id: "f1", emoji: "📚", category: "education", title: "Form 4 Math Mock Papers", desc: "Detailed syllabus practice examinations.", to: "/education/past-papers", badge: "Updated Today", metricText: "Study Guide", timestamp: Date.now() - 3600000 },
    { id: "f2", emoji: "🎓", category: "scholarships", title: "Commonwealth Grant 2026", desc: "Fully funded fellowship in United Kingdom.", to: "/education", badge: "New Today", metricText: "Apply Now", timestamp: Date.now() - 7200000 },
    { id: "f3", emoji: "💼", category: "jobs", title: "Remote Visual Designer", desc: "Contract digital designer role.", to: "/gigs-kazi", badge: "Updated Today", metricText: "Apply Gigs", timestamp: Date.now() - 10800000 },
    { id: "f4", emoji: "🌐", category: "websites", title: "SaaS Starter Dashboard", desc: "Curated web template configuration.", to: "/websites", badge: "New Website", metricText: "Get Template", timestamp: Date.now() - 14400000 },
    { id: "f5", emoji: "🎬", category: "creators", title: "Instagram Reels Templates", desc: "Trending visuals and growth tips.", to: "/creators", badge: "Free Assets", metricText: "Create Today", timestamp: Date.now() - 18000000 },
    { id: "f6", emoji: "🛍️", category: "marketplace", title: "Figma UI Kit Asset Pack", desc: "Premium mobile web responsive layout.", to: "/marketplace", badge: "Store Asset", metricText: "Explore Shop", timestamp: Date.now() - 21600000 }
  ];

  const LATEST_ITEMS = latestItems.length > 0 ? latestItems.sort((a, b) => b.timestamp - a.timestamp) : latestFallback;

  // Compile Trending Content items
  const trendingItems = [
    { id: "t1", emoji: "📚", category: "education", title: "Primary & Secondary Study Notes", desc: "Top downloaded notes for primary and high-school syllabus.", to: "/education/notes", metricText: "🔥 2.4k downloads", badge: "Trending Today", popularity: 95 },
    { id: "t2", emoji: "🎓", category: "scholarships", title: "Global Opportunities Guide", desc: "Most viewed listing for abroad grants & scholarship alerts.", to: "/education", metricText: "🔥 1.8k views", badge: "Top Course", popularity: 88 },
    { id: "t3", emoji: "💼", category: "jobs", title: "Fullstack Developer Career Opportunity", desc: "Tanzania IT consultancy position.", to: "/gigs-kazi", metricText: "🔥 950 applications", badge: "High Demand", popularity: 84 },
    { id: "t4", emoji: "🌐", category: "websites", title: "Landing Page Visual Configuration", desc: "Trending responsive web landing templates.", to: "/websites", metricText: "🔥 1.5k visits", badge: "Popular Website", popularity: 80 },
    { id: "t5", emoji: "🎬", category: "creators", title: "Viral Media Growth System", desc: "Weekly hooks, thumbnail assets, and video guides.", to: "/creators", metricText: "🔥 780 downloads", badge: "Creator Pick", popularity: 76 },
    { id: "t6", emoji: "⚡", category: "resources", title: "Developer UI Widget Pack", desc: "Html widgets, icons, templates, and buttons.", to: "/resources", metricText: "🔥 3k views", badge: "Daily Asset", popularity: 98 }
  ];

  const currentSource = activeTab === "latest" ? LATEST_ITEMS : trendingItems.sort((a, b) => b.popularity - a.popularity);

  // Filter content items based on search and category inputs
  const filteredItems = currentSource.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleItems = filteredItems.slice(0, visibleCount);

  // Scroll listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 120) {
        setVisibleCount((prev) => Math.min(prev + 10, filteredItems.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filteredItems.length]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#111827", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: 80 }}>
      <SEOHead title="STEA Discover | Discover Updates & Gigs" description="Browse all new, trending, and valuable resources in the STEA ecosystem." />

      {/* Header element */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid #E2E8F0", background: "rgba(255, 255, 255, 0.94)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <ArrowLeft size={16} color="#4B5563" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0B1736", letterSpacing: "-0.01em" }}>STEA Discover</h1>
            <p style={{ margin: 0, fontSize: 10, color: "#6B7280" }}>Your daily discovery hub</p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        
        {/* Search Bar section */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, jobs, templates and scholarships..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 46px",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              fontSize: 14,
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              transition: "border-color 0.2s",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Dynamic Category Row (Swipe on Mobile) */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12, marginBottom: 20 }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: active ? "1px solid rgba(212,175,55,0.3)" : "1px solid #E2E8F0",
                  background: active ? "#FFFBF0" : "#FFFFFF",
                  color: active ? "#B88E00" : "#4B5563",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Tab Buttons (Latest vs Trending) */}
        <div style={{ display: "flex", gap: 12, borderBottom: "1px solid #E2E8F0", paddingBottom: 10, marginBottom: 20 }}>
          {[
            { id: "latest", label: "Latest Content" },
            { id: "trending", label: "Trending Updates" }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  padding: "6px 0",
                  fontSize: 14,
                  fontWeight: 800,
                  color: active ? "#B88E00" : "#6B7280",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="discoverTabLine"
                    style={{ position: "absolute", bottom: -11, left: 0, right: 0, height: 2, background: "#D4AF37" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content list block */}
        <div style={{ display: "grid", gap: 12 }}>
          {visibleItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", background: "#FFFFFF", borderRadius: 20, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0B1736" }}>No content found</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6B7280" }}>Try adjusting your search queries or category filters.</p>
            </div>
          ) : (
            visibleItems.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={() => {
                  if (item.to.startsWith("http")) window.location.href = item.to;
                  else navigate(item.to);
                }}
                whileHover={{ scale: 1.01, borderColor: "#D4AF37", boxShadow: "0 6px 20px rgba(212,175,55,0.06)" }}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #EEF2F7",
                  borderRadius: 18,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#FAFAFA",
                    border: "1px solid #EEF2F7",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 22,
                    flexShrink: 0
                  }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#0B1736", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </h4>
                      <span style={{
                        fontSize: 8.5,
                        fontWeight: 900,
                        color: "#B88E00",
                        background: "#FFFBF0",
                        border: "1px solid rgba(212,175,55,0.2)",
                        padding: "1px 5px",
                        borderRadius: 4,
                        textTransform: "uppercase"
                      }}>
                        {item.badge}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.desc}
                    </p>
                    <span style={{ display: "block", marginTop: 4, fontSize: 10.5, fontWeight: 700, color: "#B88E00" }}>
                      {item.metricText}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <ArrowRight size={14} color="#D4AF37" />
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load more infinite scroll spinner indicator */}
        {filteredItems.length > visibleItems.length && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Loading more updates...</span>
          </div>
        )}

      </main>
    </div>
  );
}
