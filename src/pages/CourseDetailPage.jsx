import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { getFirebaseDb } from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import SEOHead from "../components/SEOHead.jsx";
import { ChevronRight } from "lucide-react";
import { G, G2, W, GoldBtn } from "../components/ui/LayoutUtils.jsx";

export function CourseDetailWrapper({ selectedCourse, goPage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [course, setCourse] = useState(selectedCourse || location.state?.course || null);
  const [loading, setLoading] = useState(!course);

  useEffect(() => {
    if (course) { setLoading(false); return; }
    if (!slug) { setLoading(false); return; }
    
    const fetchCourse = async () => {
      try {
        const db = getFirebaseDb();
        const q = query(collection(db, "courses"), where("slug", "==", slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setCourse({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error("Error fetching course by slug:", err);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [slug, course]);

  if (loading) {
    return <div style={{ minHeight:"100vh", background:"#06080f", display:"grid", placeItems:"center", color:"#fff" }}>Loading...</div>;
  }

  if (!course) {
    return (
      <div style={{ minHeight:"100vh", background:"#06080f", display:"grid", placeItems:"center", textAlign:"center", padding:32, color:"#fff" }}>
        <div>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:22, fontWeight:900, marginBottom:10 }}>Course not found</h2>
          <p style={{ color:"rgba(255,255,255,.45)", fontSize:14, marginBottom:24 }}>Please select a course from the library.</p>
          <button onClick={() => navigate("/courses")}
            style={{ padding:"10px 24px", borderRadius:12, background:"linear-gradient(135deg,#F5A623,#FFD17C)", color:"#111", fontWeight:800, border:"none", cursor:"pointer" }}>
            ← Browse Courses
          </button>
        </div>
      </div>
    );
  }
  return <CourseDetailPage course={course} goPage={goPage} />;
}

export default function CourseDetailPage({ course: c, goPage }) {
  const isMobile = useMobile();
  const [playing, setPlaying] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);

  if (!c) return null;

  const isFree = c.free || c.courseType === "free" || !c.newPrice || String(c.price||"").toLowerCase().includes("bure") || String(c.newPrice||"").toLowerCase().includes("bure");
  const displayTitle = c.title || c.titleEn || c.titleSw || c.name || "STEA Course";
  const displayDesc = c.description || c.descriptionEn || c.descriptionSw || c.desc || c.caption || "";
  const thumb = c.imageUrl || c.image || c.thumbnailUrl || c.thumbnail || c.coverImage || "";
  const hasImg = !!thumb && !imgErr;

  const rawVideoUrl = c.youtubeUrl || c.videoUrl || c.embedUrl || c.url || c.link || "";
  const getVideoId = (url) => {
    if (!url) return null;
    const s = String(url).trim();
    const em = s.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (em) return em[1];
    const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|v\/|live\/))([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    return null;
  };
  const videoId = getVideoId(rawVideoUrl);

  return (
    <div style={{ minHeight:"100vh", background:"#06080f", paddingTop: isMobile?72:100, paddingBottom:80, color:"#fff" }}>
      <SEOHead 
        title={displayTitle} 
        category={c.category || "Courses"} 
        tags={c.tags} 
        description={displayDesc} 
        url={c.slug ? `${window.location.origin}/courses/${c.slug}` : window.location.href}
      />
      <div style={{ maxWidth:900, margin:"0 auto", padding:"0 clamp(16px,4vw,32px)" }}>

        <button onClick={() => goPage("courses")} style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,.5)", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"8px 16px", cursor:"pointer", marginBottom:28, fontSize:13, fontWeight:700, transition:"all .18s" }}
          onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="rgba(255,255,255,.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,.5)"; e.currentTarget.style.borderColor="rgba(255,255,255,.1)"; }}>
          <ChevronRight size={16} style={{ transform:"rotate(180deg)" }} /> Back to Courses
        </button>

        <div style={{ borderRadius:20, overflow:"hidden", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", marginBottom:28, aspectRatio:"16/9", position:"relative" }}>
          {!videoId ? (
            <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", background:"#161820" }}>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:14 }}>Video not available for this course</p>
            </div>
          ) : !playing ? (
            <div onClick={() => setPlaying(true)} style={{ width:"100%", height:"100%", cursor:"pointer", position:"relative" }}>
              <img
                src={hasImg ? thumb : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={displayTitle}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                referrerPolicy="no-referrer"
                onError={e => {
                  setImgErr(true);
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }}
              />
              <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", background:"rgba(0,0,0,.2)" }}>
                <div style={{ width:68, height:68, borderRadius:"50%", background:"rgba(255,0,0,.88)", display:"grid", placeItems:"center", boxShadow:"0 4px 24px rgba(0,0,0,.5)", transition:"transform .15s" }}>
                  <div style={{ marginLeft:5, borderLeft:"26px solid #fff", borderTop:"16px solid transparent", borderBottom:"16px solid transparent" }} />
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={displayTitle}
              width="100%" height="100%"
              style={{ display:"block", border:"none", position:"absolute", inset:0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {isFree && <span style={{ padding:"4px 12px", borderRadius:999, background:`${G}14`, border:`1px solid ${G}22`, color:G, fontSize:11, fontWeight:900 }}>Free</span>}
          {c.level && <span style={{ padding:"4px 12px", borderRadius:999, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", fontSize:11, fontWeight:700 }}>{c.level}</span>}
          {c.category && <span style={{ padding:"4px 12px", borderRadius:999, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.55)", fontSize:11, fontWeight:700 }}>{c.category}</span>}
          {c.language && <span style={{ padding:"4px 12px", borderRadius:999, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.55)", fontSize:11, fontWeight:700 }}>🌐 {c.language}</span>}
        </div>

        <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:isMobile?"clamp(22px,7vw,32px)":"clamp(26px,4vw,40px)", fontWeight:900, letterSpacing:"-.04em", margin:"0 0 12px", lineHeight:1.15 }}>
          {displayTitle}
        </h1>

        {(c.instructorName || c.instructor) && (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`${G}20`, border:`1px solid ${G}30`, display:"grid", placeItems:"center", fontSize:14, color:G, fontWeight:900, flexShrink:0 }}>
              {(c.instructorName||c.instructor||"?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:"rgba(255,255,255,.85)" }}>{c.instructorName||c.instructor}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:600 }}>Instructor</div>
            </div>
          </div>
        )}

        {(c.duration || c.totalLessons) && (
          <div style={{ display:"flex", gap:16, marginBottom:20, color:"rgba(255,255,255,.45)", fontSize:13 }}>
            {c.duration && <span>⏱ {c.duration}</span>}
            {c.totalLessons && <span>📖 {c.totalLessons} Modules</span>}
          </div>
        )}

        {displayDesc && (
          <p style={{ color:"rgba(255,255,255,.6)", fontSize:isMobile?14:16, lineHeight:1.78, marginBottom:28, maxWidth:700 }}>
            {displayDesc}
          </p>
        )}
      </div>
    </div>
  );
}
