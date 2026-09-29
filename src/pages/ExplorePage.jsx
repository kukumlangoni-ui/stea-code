import { useState } from "react";
import { motion } from "framer-motion";
import { useMobile } from "../hooks/useMobile.js";
import { useCollection } from "../hooks/useFirestore.js";
import { CourseExploreCard, ResourceExploreCard, ResourceModal } from "../components/explore/ExploreCards.jsx";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";

const G = "#F5A623";

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", ...style }}>
    {children}
  </div>
);

export default function ExplorePage({ goPage }) {
  const isMobile = useMobile();
  const [activeResource, setActiveResource] = useState(null);

  const { docs: rawCourses, loading: l1 } = useCollection("courses", "createdAt");
  const { docs: rawResources, loading: l2 } = useCollection("resources", "createdAt");
  
  const courses = rawCourses.filter(c => String(c.status).toLowerCase() === "published" || c.published === true);
  const resources = rawResources.filter(r => String(r.status).toLowerCase() === "published" || r.published === true);

  const motivationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const motivationDesc = "Hapa tunakutunza mazingira ya kujifunza bila kelele wala malipo yoyote ya siri. Pata huduma zetu bure kabisa kwa ajili ya maendeleo yako.";

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "transparent", color: "#fff", paddingBottom: 120, overflow: "hidden" }}>
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Motivation Section */}
      <div style={{ padding: "clamp(80px, 10vw, 120px) 16px 40px" }}>
        <W>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={motivationVariants}
            className="glass"
            style={{
              borderRadius: isMobile ? 16 : 24,
              padding: isMobile ? "24px" : "40px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(245,166,35,0.1), transparent 70%)", pointerEvents: "none" }} />
            
            <div style={{ fontSize: isMobile ? 32 : 40, marginBottom: 16 }}>🎓</div>
            <div style={{ 
              fontFamily: "'Bricolage Grotesque', sans-serif", 
              fontSize: isMobile ? 22 : 28, 
              fontWeight: 900, 
              marginBottom: 16,
              letterSpacing: "-.02em"
            }}>
              <BlurText text="Kuwa bora kila siku kwa kujifunza" /> <BlurText className="gold-glow" style={{ color: G }} text="kitu kipya 🚀" delay={0.8} />
            </div>
            
            <p style={{ 
              fontSize: isMobile ? 15 : 16, 
              color: "rgba(255,255,255,0.7)", 
              lineHeight: 1.6, 
              maxWidth: 700, 
              margin: "0 auto 24px" 
            }}>
              {motivationDesc.split(highlight).map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && <span style={{ color: G, fontWeight: 700 }}>{highlight}</span>}
                </span>
              ))}
            </p>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 8, 
              fontSize: isMobile ? 14 : 16, 
              color: "rgba(255,255,255,0.5)",
              fontWeight: 500
            }}>
              <p>Hakuna matangazo yanayokuvuruga.</p>
              <p>Ni elimu tu kwa lugha rahisi ya <span style={{ color: G }}>English & Swahili</span>.</p>
              <p style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: "#fff" }}>Anza safari yako sasa! 🚀</p>
            </div>
          </motion.div>
        </W>
      </div>

      {/* Video Courses Section */}
      <div style={{ padding: "40px 16px" }}>
        <W>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Mafunzo ya Video</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }}>Jifunze kityu kipya leo kupitia mafunzo yetu ya video.</p>
            </div>
            <button 
              onClick={() => goPage("explore/courses")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Angalia Zote
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {l1 ? (
               [1,2,3,4].map(i => <div key={i} style={{ aspectRatio: "16/9", background: "rgba(255,255,255,.03)", borderRadius: 16 }} />)
            ) : courses.length > 0 ? (
               courses.slice(0, 8).map(course => <CourseExploreCard key={course.id} item={course} onClick={(c) => goPage("course-detail", c)} />)
            ) : (
               <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "rgba(255,255,255,.2)" }}>Hakuna mafunzo yaliyopatikana kwa sasa.</div>
            )}
          </div>
        </W>
      </div>

      {/* Learning & Resources Section */}
      <div style={{ padding: "40px 16px" }}>
        <W>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 900, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Rasilimali na Makala</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }}>Pata miongozo, vitabu na makala za kusaidia masomo yako.</p>
            </div>
            <button 
              onClick={() => goPage("explore/resources")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Angalia Zote
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {l2 ? (
               [1,2,3,4,5].map(i => <div key={i} style={{ aspectRatio: "4/5", background: "rgba(255,255,255,.03)", borderRadius: 16 }} />)
            ) : resources.length > 0 ? (
               resources.slice(0, 10).map(res => <ResourceExploreCard key={res.id} item={res} onClick={setActiveResource} />)
            ) : (
               <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "rgba(255,255,255,.2)" }}>Hakuna matokeo yaliyopatikana.</div>
            )}
          </div>
        </W>
      </div>

      </div>
      {activeResource && <ResourceModal item={activeResource} onClose={() => setActiveResource(null)} />}
    </div>
  );
}
