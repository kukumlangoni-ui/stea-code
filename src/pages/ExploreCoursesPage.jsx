import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { useCollection } from "../hooks/useFirestore.js";
import { CourseExploreCard, VideoModal } from "../components/explore/ExploreCards.jsx";
import { useSearchParams } from "react-router-dom";

const CATEGORIES = [
  "All", "Programming", "Business", "AI & Tech", "Video Editing", "Mobile & Apps", "Digital Skills", "Finance", "Marketing"
];

export default function ExploreCoursesPage({ goPage }) {
  const isMobile = useMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  
  const categoryFilter = searchParams.get("category") || "All";
  const setCategoryFilter = (cat) => {
    if (cat === "All") searchParams.delete("category");
    else searchParams.set("category", cat);
    setSearchParams(searchParams);
  };
  
  const [languageFilter] = useState("All");

  const { docs: courses, loading } = useCollection("courses", "createdAt");

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (categoryFilter !== "All" && (c.category || "General") !== categoryFilter) return false;
      if (languageFilter !== "All" && (c.language || "EN") !== languageFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        if (!c.title?.toLowerCase().includes(query) && !c.description?.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [courses, search, categoryFilter, languageFilter]);

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff" }}>
      {/* Header */}
      <div style={{ padding: "clamp(80px, 10vw, 110px) clamp(16px,4vw,48px) 20px", position: "relative" }}>
        {goPage && (
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goPage("explore")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              color: "#fff", cursor: "pointer",
              marginBottom: 24
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>
        )}
        <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 900, marginTop: 0, marginBottom: 24 }}>
          Explore Courses
        </h1>

        {/* Category Navigation Bar */}
        <div style={{ 
          display: "flex", overflowX: "auto", gap: 8, paddingBottom: 16, 
          scrollbarWidth: "none", msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "8px 20px", borderRadius: 999, border: "none",
                background: categoryFilter === cat ? "#F5A623" : "rgba(255,255,255,.05)",
                color: categoryFilter === cat ? "#000" : "#fff",
                fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "8px 16px", marginTop: 16 }}>
             <Search size={18} color="rgba(255,255,255,.4)" />
             <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: "none", border: "none", color: "#fff", fontSize: 15, outline: "none", flex: 1 }} />
        </div>
      </div>
...

      <div style={{ padding: "0 clamp(16px,4vw,48px) 100px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 md:gap-x-6 gap-y-[24px]">
          {loading ? (
             [1,2,3,4,5,6].map(i => <div key={i} style={{ width: "100%", aspectRatio: "16/9", background: "rgba(255,255,255,.03)", borderRadius: 20 }} />)
          ) : filteredCourses.length === 0 ? (
             <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "rgba(255,255,255,.4)" }}>No courses found.</div>
          ) : (
            filteredCourses.map(course => <CourseExploreCard key={course.id} item={course} onClick={() => setActiveVideo(course)} />)
          )}
        </div>
      </div>

      {activeVideo && <VideoModal item={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
