import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ExternalLink, Download, PlayCircle, BookOpen, FileText, LayoutTemplate, Star, Sparkles, AlertCircle } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { useMultiCollection } from "../hooks/useMultiCollection.js";
import { useAuth } from "../hooks/useAuth.js";

import { useCustomCategories } from "../hooks/useCustomCategories.js";

const DEFAULT_CATEGORIES = [
  "Videos",
  "PDFs",
  "Articles",
  "Tech Tips",
  "STEA Tutorials",
  "AI",
  "Education",
  "Marketplace",
  "Websites"
];

const LOCAL_VIDEOS = [
  { id: 'v1', type: 'Video Tutorial', title: 'Jinsi ya Kuzuia Matangazo (Ads) Kwenye Simu', description: 'Jifunze njia rahisi ya kuzuia matangazo yote yanayosumbua kwenye simu yako ya Android.', duration: '5:30', language: 'Swahili', source: 'YouTube', thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', isFree: true, link: '#' },
  { id: 'v2', type: 'Video Tutorial', title: 'Siri 5 za Kutumia ChatGPT kwa Ufanisi', description: 'Ongeza ufanisi wako kwa kutumia AI. Hizi ni siri 5 ambazo watu wengi hawajui kuhusu ChatGPT.', duration: '8:45', language: 'Swahili', source: 'STEA', thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', isFree: true, link: '#' },
  { id: 'v3', type: 'Video Tutorial', title: 'Fanya iPhone Yako Iwe Faster', description: 'Njia za kufanya iPhone yako iwe nyepesi na kutunza chaji muda mrefu zaidi.', duration: '12:10', language: 'Swahili', source: 'YouTube', thumbnailUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80', isFree: true, link: '#' },
];

const LOCAL_TUTORIALS = [
  { id: 't1', type: 'Feature Tutorial', title: 'How to use STEA Classroom', description: 'Step-by-step guide to join classes, submit assignments and view attendance.', category: 'Education', link: 'https://classroom.stea.africa' },
  { id: 't2', type: 'Feature Tutorial', title: 'How to find notes & past papers', description: 'Navigate the education hub to download official NECTA past papers and study notes.', category: 'Education', link: '/education' },
  { id: 't3', type: 'Feature Tutorial', title: 'How to request STEA Services', description: 'Learn how to book digital services, website design, and product promotion.', category: 'Services', link: '/services' },
  { id: 't4', type: 'Feature Tutorial', title: 'How to use Marketplace', description: 'A buyer and seller guide for the STEA Duka marketplace.', category: 'Marketplace', link: '/duka' },
];

const getCategoryBadgeColor = (category) => {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("tech") || normalized.includes("phone")) return { bg: "#EFF6FF", text: "#1D4ED8" };
  if (normalized.includes("pdf") || normalized.includes("guide")) return { bg: "#FEF2F2", text: "#B91C1C" };
  if (normalized.includes("video") || normalized.includes("tutorial")) return { bg: "#F3E8FF", text: "#7E22CE" };
  if (normalized.includes("ai")) return { bg: "#F5F3FF", text: "#6D28D9" };
  if (normalized.includes("education") || normalized.includes("study") || normalized.includes("necta")) return { bg: "#ECFDF5", text: "#047857" };
  if (normalized.includes("marketplace") || normalized.includes("duka")) return { bg: "#FFFBEB", text: "#B45309" };
  if (normalized.includes("update") || normalized.includes("stea") || normalized.includes("announcement") || normalized.includes("article")) return { bg: "#FFF9E8", text: "#D4AF37" };
  return { bg: "#F3F4F6", text: "#374151" };
};

export default function ExploreResourcesPage() {
  const isMobile = useMobile();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const { docs: firestoreDocs, loading } = useMultiCollection(["stea_daily", "tips_resources", "resources", "updates", "study_resources"], "createdAt", 100);

  const { categories: rawCategories, loading: catsLoading } = useCustomCategories("stea_daily_categories", []);
  
  const dynamicCategories = useMemo(() => {
    if (catsLoading) return ["All", ...DEFAULT_CATEGORIES];
    if (!catsLoading && rawCategories.length === 0) return ["All", ...DEFAULT_CATEGORIES];
    
    // Get active categories sorted by sortOrder
    const activeCats = rawCategories
      .filter(c => c.status !== "inactive")
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(c => c.name);
      
    // Always include standard tabs plus whatever is in the DB
    const finalTabs = ["All"];
    
    // We can merge standard content types with DB categories if we want,
    // but the DB categories should suffice, along with "Videos", "PDFs", "Articles" which are content types.
    // Let's add standard content types first if they are not in the DB list
    ["Videos", "PDFs", "Articles"].forEach(t => {
      if (!activeCats.includes(t)) finalTabs.push(t);
    });
    
    activeCats.forEach(c => {
      if (!finalTabs.includes(c)) finalTabs.push(c);
    });
    
    return finalTabs;
  }, [rawCategories, catsLoading]);

  const allResources = useMemo(() => {
    return [...LOCAL_VIDEOS, ...firestoreDocs, ...LOCAL_TUTORIALS];
  }, [firestoreDocs]);

  const filteredResources = useMemo(() => {
    return allResources.filter((item) => {
      // 1. Filter by category
      if (activeFilter !== "All") {
        const itemType = (item.type || item.category || item.fileType || "").toLowerCase();
        const filterType = activeFilter.toLowerCase();
        
        let matchesFilter = false;
        if (filterType === "videos" && (itemType.includes("video") || itemType.includes("youtube"))) matchesFilter = true;
        else if (filterType === "pdfs" && (itemType.includes("pdf") || item.pdfUrl || item.fileUrl)) matchesFilter = true;
        else if (filterType === "articles" && (itemType.includes("article") || itemType.includes("post"))) matchesFilter = true;
        else if (filterType === "tech tips" && (itemType.includes("tech") || itemType.includes("tip"))) matchesFilter = true;
        else if (filterType === "stea tutorials" && (itemType.includes("feature tutorial") || itemType.includes("stea tutorial"))) matchesFilter = true;
        else if (filterType === "ai" && itemType.includes("ai")) matchesFilter = true;
        else if (filterType === "education" && (itemType.includes("education") || itemType.includes("study") || itemType.includes("necta"))) matchesFilter = true;
        else if (filterType === "marketplace" && (itemType.includes("market") || itemType.includes("duka") || itemType.includes("product"))) matchesFilter = true;
        else if (filterType === "websites" && (itemType.includes("website") || itemType.includes("web"))) matchesFilter = true;
        else if (itemType.includes(filterType)) matchesFilter = true;
        
        if (!matchesFilter && item.title?.toLowerCase().includes(filterType.split(" ")[0])) matchesFilter = true;
        
        if (!matchesFilter) return false;
      }

      // 2. Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const textToSearch = `${item.title || ""} ${item.description || ""} ${item.type || ""} ${item.category || ""}`.toLowerCase();
        if (!textToSearch.includes(query)) return false;
      }

      return true;
    });
  }, [allResources, activeFilter, searchQuery]);

  // Grouping filtered items into sections
  const videos = filteredResources.filter(item => (item.type || item.category || "").toLowerCase().includes("video"));
  const pdfs = filteredResources.filter(item => (item.type || item.category || "").toLowerCase().includes("pdf") || item.pdfUrl || item.fileUrl);
  const tutorials = filteredResources.filter(item => (item.type || item.category || "").toLowerCase().includes("tutorial") && !item.type?.toLowerCase().includes("video"));
  const articlesAndTips = filteredResources.filter(item => {
    const t = (item.type || item.category || "").toLowerCase();
    return !t.includes("video") && !t.includes("pdf") && !item.pdfUrl && !item.fileUrl && !t.includes("tutorial");
  });

  const featured = filteredResources.length > 0 ? filteredResources[0] : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#0B1736", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <STEAHeader title="Daily" user={user} />

      <main style={{ width: "min(1240px, 100%)", margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "40px 24px 100px" }}>
        
        {/* Hero Section */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 24, 
          padding: isMobile ? "32px 20px" : "48px 40px", 
          boxShadow: "0 10px 30px rgba(15,23,42,0.03)", 
          border: "1px solid rgba(15,23,42,0.06)",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF9E8", border: "1px solid rgba(212,175,55,0.3)", padding: "6px 12px", borderRadius: 999, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", letterSpacing: "0.05em" }}>DAILY / FREE / UPDATED</span>
          </div>
          
          <h1 style={{ fontSize: isMobile ? 32 : 46, fontWeight: 900, color: "#0B1736", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Learn something useful <br/> every day.
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 18, color: "#475569", margin: "0", maxWidth: 500, lineHeight: 1.5 }}>
            Watch tutorials, read guides, download PDFs and discover new STEA updates.
          </p>
        </div>

        {/* Search and Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #E2E8F0", padding: "12px 20px", borderRadius: 16, boxShadow: "0 4px 12px rgba(15,23,42,0.02)" }}>
            <Search size={20} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Search videos, PDFs, articles, tips..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, background: "transparent", color: "#0B1736" }}
            />
          </div>
          
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {dynamicCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${activeFilter === category ? "rgba(212,175,55,0.4)" : "#E2E8F0"}`,
                  background: activeFilter === category ? "#FFF9E8" : "#fff",
                  color: activeFilter === category ? "#B45309" : "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: 220, background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, border: "1px dashed #CBD5E1", padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 64, height: 64, background: "#F1F5F9", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertCircle size={32} color="#94A3B8" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#0B1736" }}>No content found</h3>
            <p style={{ margin: 0, color: "#64748B", fontSize: 14 }}>Try a different search term or filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            
            {/* 1. Featured Today */}
            {featured && activeFilter === "All" && !searchQuery && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Star size={20} color="#D4AF37" fill="#D4AF37" />
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0B1736", margin: 0, letterSpacing: "-0.02em" }}>Featured Today</h2>
                </div>
                
                <div style={{ 
                  background: "#fff", 
                  borderRadius: 24, 
                  border: "1px solid #E2E8F0", 
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  boxShadow: "0 8px 24px rgba(15,23,42,0.03)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(15,23,42,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.03)"; }}
                >
                  {(featured.thumbnailUrl || featured.imageUrl) && (
                    <div style={{ width: isMobile ? "100%" : "40%", height: isMobile ? 200 : "auto", background: "#F1F5F9", position: "relative" }}>
                      <img src={featured.thumbnailUrl || featured.imageUrl} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {featured.type?.toLowerCase().includes("video") && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
                          <PlayCircle size={48} color="#fff" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ padding: isMobile ? 24 : 36, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ 
                        background: getCategoryBadgeColor(featured.type || featured.category).bg, 
                        color: getCategoryBadgeColor(featured.type || featured.category).text, 
                        padding: "4px 10px", 
                        borderRadius: 6, 
                        fontSize: 11, 
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        {featured.type || featured.category || "Feature"}
                      </span>
                    </div>
                    
                    <h3 style={{ margin: "0 0 12px", fontSize: isMobile ? 22 : 28, fontWeight: 900, color: "#0B1736", lineHeight: 1.2 }}>
                      {featured.title}
                    </h3>
                    
                    <p style={{ margin: "0 0 24px", fontSize: 15, color: "#64748B", lineHeight: 1.6, flex: 1 }}>
                      {featured.description}
                    </p>
                    
                    <a 
                      href={featured.link || featured.pdfUrl || featured.fileUrl || `/resources/${featured.id}`}
                      target={(featured.link?.startsWith("/") || featured.url?.startsWith("/")) ? "_self" : "_blank"}
                      rel="noreferrer"
                      style={{ 
                        alignSelf: "flex-start",
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: 8,
                        background: "#0B1736", 
                        color: "#fff", 
                        border: "none",
                        padding: "12px 24px", 
                        borderRadius: 12, 
                        fontSize: 14, 
                        fontWeight: 800,
                        textDecoration: "none"
                      }}
                    >
                      {featured.type?.toLowerCase().includes("video") ? "Watch Tutorial" : featured.pdfUrl ? "Download PDF" : "Read More"} 
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Video Tutorials */}
            {videos.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <PlayCircle size={20} color="#0B1736" />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0B1736", margin: 0, letterSpacing: "-0.01em" }}>Video Tutorials</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                  {videos.map(video => (
                    <a 
                      key={video.id} 
                      href={video.link || video.url || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        background: "#fff", 
                        borderRadius: 20, 
                        overflow: "hidden", 
                        border: "1px solid #E2E8F0", 
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.02)",
                        transition: "transform 0.2s, box-shadow 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.05)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.02)"; }}
                    >
                      <div style={{ height: 170, background: "#1E293B", position: "relative" }}>
                        {video.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <PlayCircle size={24} color="#fff" fill="#fff" />
                          </div>
                        </div>
                        <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(11,23,54,0.8)", color: "#fff", padding: "2px 6px", borderRadius: 6, fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                          {video.duration || "Video"}
                        </div>
                        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                          {video.isFree && <span style={{ background: "#EF4444", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900 }}>FREE</span>}
                          {video.language && <span style={{ background: "rgba(255,255,255,0.9)", color: "#0B1736", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{video.language}</span>}
                        </div>
                      </div>
                      
                      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#0B1736", lineHeight: 1.3 }}>{video.title}</h3>
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B", lineHeight: 1.5, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {video.description}
                        </p>
                        
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: 16, marginTop: "auto" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", display: "flex", alignItems: "center", gap: 4 }}>
                            Watch free <ArrowRight size={14} />
                          </span>
                          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{video.source || "STEA"}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Guides & PDFs */}
            {pdfs.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <FileText size={20} color="#0B1736" />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0B1736", margin: 0, letterSpacing: "-0.01em" }}>Guides & PDFs</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {pdfs.map(pdf => {
                    const badge = getCategoryBadgeColor(pdf.category || pdf.type);
                    return (
                      <div key={pdf.id} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(15,23,42,0.02)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                          <div style={{ width: 44, height: 44, background: "#FEF2F2", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={20} color="#DC2626" />
                          </div>
                          <span style={{ background: badge.bg, color: badge.text, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                            {pdf.category || pdf.type || "Guide"}
                          </span>
                        </div>
                        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#0B1736" }}>{pdf.title}</h3>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748B", lineHeight: 1.5, flex: 1 }}>{pdf.description}</p>
                        
                        <div style={{ display: "flex", gap: 8 }}>
                          <a href={pdf.link || pdf.url || `/resources/${pdf.id}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", background: "#F8FAFC", color: "#0B1736", padding: "8px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", border: "1px solid #E2E8F0" }}>Open Guide</a>
                          {(pdf.pdfUrl || pdf.fileUrl) && (
                            <a href={pdf.pdfUrl || pdf.fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, background: "#FFF9E8", color: "#D4AF37", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)" }}>
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. Articles & Tips */}
            {articlesAndTips.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <BookOpen size={20} color="#0B1736" />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0B1736", margin: 0, letterSpacing: "-0.01em" }}>Articles & Tips</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {articlesAndTips.map(article => {
                    const badge = getCategoryBadgeColor(article.category || article.type);
                    return (
                      <a key={article.id} href={article.link || article.url || `/resources/${article.id}`} target="_self" style={{ textDecoration: "none", background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(15,23,42,0.02)", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                           <span style={{ background: badge.bg, color: badge.text, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{article.category || article.type || "Article"}</span>
                        </div>
                        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#0B1736", lineHeight: 1.3 }}>{article.title}</h3>
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B", lineHeight: 1.5, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.description}</p>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>Read more <ArrowRight size={14} /></span>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 5. What's New on STEA (Feature Tutorials) */}
            {tutorials.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Sparkles size={20} color="#D4AF37" />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0B1736", margin: 0, letterSpacing: "-0.01em" }}>What's New on STEA</h2>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {tutorials.map(tutorial => (
                    <a key={tutorial.id} href={tutorial.link || tutorial.url || "/"} style={{ textDecoration: "none", background: "#fff", borderRadius: 16, padding: 20, border: "1px solid rgba(212,175,55,0.2)", display: "flex", gap: 16, alignItems: "center", boxShadow: "0 4px 12px rgba(212,175,55,0.05)", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "none"}>
                      <div style={{ width: 40, height: 40, background: "#FFF9E8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <LayoutTemplate size={18} color="#D4AF37" />
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#0B1736" }}>{tutorial.title}</h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>{tutorial.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}

// Ensure ArrowRight is added to lucide-react imports
const ArrowRight = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);
