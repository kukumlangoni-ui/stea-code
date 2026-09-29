/**
 * CoursesPage — Phase 1+2
 * Fast debounced search · admin-created custom categories · load more
 */
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, ArrowLeft, BookOpen, Home, ArrowRight } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { useCollection } from "../hooks/useFirestore.js";
import { useSearch } from "../hooks/useSearch.js";
import { useCustomCategories } from "../hooks/useCustomCategories.js";
import { CourseCard } from "../components/CourseCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { SteaEcosystemBanner, SteaExploreMore } from "../components/SteaEcosystem.jsx";

// Reusable STEA Main Page Banner
function SteaMainBanner({ isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: isMobile ? 20 : 28 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'linear-gradient(135deg, rgba(245,166,35,0.14), rgba(245,166,35,0.05))' : 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.5))',
          border: `1px solid ${hov ? 'rgba(245,166,35,0.45)' : 'rgba(245,166,35,0.2)'}`,
          borderRadius: 16,
          padding: isMobile ? '14px 16px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          transition: 'all 0.22s ease',
          boxShadow: hov ? '0 8px 28px rgba(245,166,35,0.15)' : '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Home size={16} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>STEA AFRICA</div>
            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: '#fff' }}>Visit STEA Main Page</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Education · Duka · TechHub · Services</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F5A623', fontWeight: 800, fontSize: 11, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Explore <ArrowRight size={12} style={{ transform: hov ? 'translateX(4px)' : '', transition: 'transform 0.2s' }} />
        </div>
      </div>
    </Link>
  );
}

const G = "#F5A623";
const BG = "#07080f";
const BORDER = "rgba(255,255,255,.08)";

function Skel() {
  return (
    <div style={{
      width: "100%", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden",
      background: "rgba(15,17,21,0.6)", border: "1px solid rgba(255,255,255,0.08)",
      animation: "cspulse 1.6s ease-in-out infinite",
    }}>
      <div style={{ width: "100%", height: "60%", background: "rgba(255,255,255,.04)" }} />
      <div style={{ padding: "16px 20px" }}>
        <div style={{ height: 10, width: "30%", borderRadius: 4, background: "rgba(255,255,255,.05)", marginBottom: 12 }} />
        <div style={{ height: 16, width: "80%", borderRadius: 4, background: "rgba(255,255,255,.06)", marginBottom: 10 }} />
        <div style={{ height: 12, width: "95%", borderRadius: 4, background: "rgba(255,255,255,.04)" }} />
      </div>
      <style>{`@keyframes cspulse{0%,100%{opacity:.5}50%{opacity:.8}}`}</style>
    </div>
  );
}

function EmptyState({ query, onClear, goPage }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <BookOpen size={28} color="rgba(255,255,255,.25)" />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>
        {query ? `No results for "${query}"` : "No courses yet"}
      </h3>
      <p style={{ color: "rgba(255,255,255,.4)", margin: "0 0 22px", fontSize: 14 }}>
        {query ? "Try a different keyword or browse all." : "Check back soon for new courses."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {query && (
          <button onClick={onClear} style={{ background: G, border: "none", borderRadius: 10, padding: "10px 20px", color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Clear search
          </button>
        )}
        {goPage && (
          <button onClick={() => goPage("/")} style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Go home
          </button>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage({ goPage }) {
  const isMobile = useMobile();
  const { docs: rawDocs, loading } = useCollection("courses", "createdAt", 500);
  const [activeCat, setActiveCat] = useState("All");
  const [displayLimit, setDisplayLimit] = useState(12);

  // Published courses only
  const allDocs = useMemo(() =>
    (rawDocs || []).filter(d =>
      d.status !== "draft" &&
      d.published !== false &&
      d.active !== false
    ),
    [rawDocs]
  );

  // Phase 2: custom categories from Firestore
  const { categories: customCats } = useCustomCategories("course_categories", allDocs);

  // Phase 1: debounced search
  const { query: searchQ, setQuery: setSearchQ, filtered: searched, isSearching } = useSearch(allDocs);

  // Reset page when filter/search changes
  useEffect(() => setDisplayLimit(12), [searchQ, activeCat]);

  // All category tags
  const allCats = useMemo(() => {
    const fromCustom = Array.from(new Set(customCats.map(c => c.name || c).filter(Boolean)));
    if (fromCustom.length > 0) return ["All", ...fromCustom];
    const fromDocs = new Set();
    allDocs.forEach(d => { if (d.category) fromDocs.add(d.category); });
    return ["All", ...Array.from(fromDocs).sort()];
  }, [customCats, allDocs]);

  // Apply category filter on top of search
  const filtered = useMemo(() => {
    if (activeCat === "All") return searched;
    return searched.filter(d =>
      d.category === activeCat ||
      d.subCategory === activeCat ||
      d.subcategory === activeCat
    );
  }, [searched, activeCat]);

  const shown = filtered.slice(0, displayLimit);
  const hasMore = filtered.length > displayLimit;

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh", background: BG, color: "#fff",
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
      padding: isMobile ? "0 0 80px" : "0 0 60px",
      overflow: "hidden"
    }}>
      <AnimatedBackground />
      <SteaEcosystemBanner page="courses" />
      <SEOHead 
        title="Kozi na Mafunzo ya Kidijitali | STEA Tanzania"
        description="Jifunze skills mpya na kozi za video, mwongozo wa PDF na bidhaa za kidijitali. Kozi za bure na za kulipa Tanzania."
        keywords={["online courses Tanzania", "kozi za kidijitali Tanzania", "mafunzo Tanzania"]}
      />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1160, margin: "0 auto", padding: isMobile ? "16px clamp(16px,4vw,40px) 0" : "28px clamp(16px,4vw,40px) 0" }}>

        {/* Back */}
        <button onClick={() => window.history.length > 1 ? window.history.back() : (goPage && goPage("/"))}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 28 }}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="badge-shine glass" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 999, color: "#10b981", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
            <BookOpen size={11} /> Courses & Learning
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 8px", lineHeight: 1.12 }}>
            <BlurText text="Learning &" />
            <BlurText text="Resources" className="gold-glow" delay={0.8} />
          </div>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: isMobile ? 14 : 16, lineHeight: 1.65, maxWidth: 520, margin: 0 }}>
            Video courses, paid guides, PDFs and digital products — learn at your own pace.
          </p>
        </div>

        {/* Visit STEA Main Page Banner — replaced by global ecosystem banner */}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 18 }}>
          <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.38)", pointerEvents: "none" }} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder='Search courses — e.g. "React", "design", "AI"...'
            className="glass"
            style={{ width: "100%", height: 52, borderRadius: 14, color: "#fff", padding: "0 48px 0 48px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .2s" }}
            onFocus={e => e.target.style.borderColor = "rgba(16,185,129,.5)"}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", padding: 4 }}>
              <X size={16} />
            </button>
          )}
          {isSearching && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700 }}>Searching…</div>}
        </div>

        {/* Category chips */}
        {allCats.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 18, scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {allCats.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                whiteSpace: "nowrap", padding: "7px 16px", borderRadius: 999, border: "none",
                background: activeCat === cat ? G : "rgba(255,255,255,.06)",
                color: activeCat === cat ? "#000" : "rgba(255,255,255,.7)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .15s",
                fontFamily: "inherit",
              }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        {!loading && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 700, marginBottom: 18 }}>
            {searchQ
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQ}"`
              : `${filtered.length} course${filtered.length !== 1 ? "s" : ""}`}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 md:gap-x-6 gap-y-[24px]">
            {Array.from({ length: 8 }).map((_, i) => <Skel key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState query={searchQ} onClear={() => setSearchQ("")} goPage={goPage} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 md:gap-x-6 gap-y-[24px]">
              {shown.map(course => (
                <CourseCard key={course.id} course={course} onClick={() => goPage("course-detail", course)} isMobile={isMobile} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button onClick={() => setDisplayLimit(n => n + 12)} style={{ background: "rgba(255,255,255,.06)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Load more ({filtered.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Explore More STEA */}
      <SteaExploreMore exclude="courses" />
    </div>
  );
}
