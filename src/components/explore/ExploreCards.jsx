import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useMobile } from "../../hooks/useMobile.js";

const G = "#F5A623";

export function CourseExploreCard({ item, onClick }) {
  const lang = item.language || "English";
  const level = item.level || "Beginner";
  const duration = item.duration || "";

  const title = item.title || item.title_sw || "Untitled Course";

  return (
    <motion.div 
      whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(16, 185, 129, 0.2), 0 1px 3px rgba(255,255,255,0.05) inset" }}
      onClick={() => onClick(item)}
      style={{
        flexShrink: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(20, 20, 20, 0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        padding: "16px",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(255, 255, 255, 0.05) inset",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {/* Thumbnail Area - 16:9 */}
      <div style={{ 
        width: "calc(100% + 32px)", 
        margin: "-16px -16px 16px -16px",
        aspectRatio: "16/9", 
        position: "relative", 
        overflow: "hidden", 
        background: "#000",
        borderRadius: "14px 14px 0 0"
      }}>
        {(item.thumbnail || item.imageUrl || item.image) && (
          <img 
            src={item.thumbnail || item.imageUrl || item.image} 
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            referrerPolicy="no-referrer"
          />
        )}
        
        {/* Level Badge - Compact */}
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{ 
            fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6, 
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)" 
          }}>
            {level}
          </span>
        </div>
      </div>

      {/* Content Area - Compact */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4px 4px 6px 4px", justifyContent: "space-between" }}>
        <h4 style={{ 
          fontSize: 13, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.4, 
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          color: "#fff"
        }}>
          {title}
        </h4>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{lang}</span>
              {duration && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>●</span>}
              {duration && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{duration}</span>}
           </div>
           
           <span style={{ color: G, fontSize: 10, fontWeight: 900 }}>
             {item.courseType === "free" || item.free ? "Watch Free" : "View Course"}
           </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ResourceExploreCard({ item, onClick }) {
  const fileType = item.type || "PDF";
  const price = item.price || "Free";
  const isFree = price.toString().toLowerCase().includes("free");

  const title = item.title || item.title_sw || "Untitled Resource";

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={() => onClick(item)}
      style={{
        flexShrink: 0,
        width: "100%",
        cursor: "pointer",
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.07)",
        position: "relative",
        transition: "all 0.2s ease"
      }}
    >
      {/* Thumbnail Area */}
      <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden", background: "#111" }}>
        {(item.coverImage || item.imageUrl || item.image) && (
          <img 
            src={item.coverImage || item.imageUrl || item.image} 
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            referrerPolicy="no-referrer"
          />
        )}
        
        {/* Badges */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ 
            fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6, 
            background: isFree ? "rgba(16,185,129,0.9)" : "rgba(245,166,35,0.9)", color: "#fff" 
          }}>
            {price}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 8 }}>
          <span style={{ 
            fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6, 
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", color: "#fff"
          }}>
            {fileType}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "12px" }}>
        <h4 style={{ 
          fontSize: 13, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.4, 
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          color: "#fff"
        }}>
          {title}
        </h4>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 800, textTransform: "uppercase" }}>{item.category || "Resource"}</span>
           <span style={{ color: G, fontSize: 10, fontWeight: 900 }}>Get resource</span>
        </div>
      </div>
    </motion.div>
  );
}

export function VideoModal({ item, onClose }) {
  const isMobile = useMobile();
  if (!item) return null;

  const title = item.title || item.title_sw || "";
  const description = item.description || item.description_sw || "";

  // Extract YT video ID
  let videoId = "";
  const ytUrl = item.youtubeUrl || item.embedUrl || item.videoUrl;
  if (ytUrl) {
    const match = ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (match && match[1]) videoId = match[1];
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? 10 : 20
        }}
        onClick={onClose}
      >
        <div style={{ position: "absolute", top: isMobile ? 10 : 30, right: isMobile ? 10 : 30, cursor: "pointer", background: "rgba(255,255,255,0.1)", padding: 12, borderRadius: "50%", zIndex: 10 }}>
          <X size={24} color="#fff" onClick={onClose} />
        </div>
        
        <div 
          style={{ width: "100%", maxWidth: 1000, background: "#000", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {videoId ? (
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              <iframe
                title="Course Video"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
             <div style={{ padding: 60, textAlign: "center", color: "#fff" }}>
               <p>No video available</p>
             </div>
          )}

          <div style={{ padding: isMobile ? "24px" : "32px 40px", background: "#0d0f1a" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
               <span style={{ fontSize: 11, fontWeight: 900, color: G, background: "rgba(245,166,35,0.1)", padding: "4px 12px", borderRadius: 8 }}>{item.level || "Beginner"}</span>
               <span style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: 8 }}>{item.language || "English"}</span>
            </div>
            
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, margin: "0 0 12px", color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
               <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontWeight: 800 }}>{item.instructorName?.[0] || 'S'}</div>
               <span style={{ fontSize: 14, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>Instructor: <span style={{ color: "#fff" }}>{item.instructorName || "STEA Elite"}</span></span>
            </div>

            {description && (
              <p style={{ fontSize: 16, color: "rgba(255,255,255,.6)", lineHeight: 1.7, margin: 0, maxWidth: 800 }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ResourceModal({ item, onClose }) {
  const isMobile = useMobile();
  if (!item) return null;
  const price = item.price || "Free";
  const isFree = price.toString().toLowerCase().includes("free");

  const title = item.title || item.title_sw || "";
  const description = item.description || item.description_sw || "";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? 10 : 20
        }}
        onClick={onClose}
      >
        <div style={{ position: "absolute", top: 30, right: 30, cursor: "pointer", background: "rgba(255,255,255,0.1)", padding: 12, borderRadius: "50%" }}>
          <X size={24} color="#fff" onClick={onClose} />
        </div>
        
        <div 
          style={{ width: "100%", maxWidth: 480, background: "#111", borderRadius: 32, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ aspectRatio: "4/3", background: "#000", position: "relative" }}>
             {(item.coverImage || item.imageUrl || item.image) && (
                <img 
                  src={item.coverImage || item.imageUrl || item.image} 
                  alt={title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  referrerPolicy="no-referrer"
                />
             )}
          </div>

          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
               <span style={{ fontSize: 11, fontWeight: 900, padding: "5px 12px", borderRadius: 10, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                 {item.type || "PDF"}
               </span>
               <span style={{ fontSize: 18, fontWeight: 900, color: isFree ? "#10b981" : "#F5A623" }}>
                 {price}
               </span>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px", color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em" }}>{title}</h2>
            
            {description && (
              <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", lineHeight: 1.6, margin: "0 0 32px" }}>
                {description}
              </p>
            )}

            <button 
               style={{ 
                 width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
                 background: isFree ? "#fff" : G, color: "#000", fontSize: 16, fontWeight: 900,
                 cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                 transition: "transform 0.2s"
               }}
               onClick={() => {
                 if (item.fileUrl || item.link) window.open(item.fileUrl || item.link, "_blank");
               }}
               onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
               onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              <Download size={20} /> {isFree ? "Download Free" : "Buy Now"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
