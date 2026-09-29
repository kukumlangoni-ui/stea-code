import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, Calendar, ArrowUpRight, PlayCircle } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { fmtViews, timeAgo } from "../hooks/useFirestore.js";
import { G, BORDER } from "./ui/LayoutUtils.jsx";

export function ArticleCard({ item, onRead, collection: col }) {
  const isMobile = useMobile();
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const title = item.title || item.name || "STEA Article";
  const desc = item.description || item.desc || item.caption || "";
  const thumb = item.imageUrl || item.image || item.thumbnailUrl || "/stea-icon.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onRead && onRead(item)}
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${hov ? "rgba(245,166,35,0.2)" : BORDER}`,
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex", flexDirection: "column"
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", overflow: "hidden" }}>
        {imgErr ? (
          <div style={{ width: "100%", height: "100%", background: "#111", display: "grid", placeItems: "center" }}>
            <span style={{ fontSize: 40 }}>📄</span>
          </div>
        ) : (
          <img
            src={thumb}
            alt={title}
            onError={() => setImgErr(true)}
            referrerPolicy="no-referrer"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hov ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
        {item.badge && (
          <div style={{ position: "absolute", top: 16, right: 16, padding: "5px 12px", borderRadius: 8, background: G, color: "#000", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
            {item.badge}
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? 20 : 24, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={12} /> {timeAgo(item.createdAt)}
          </div>
          {item.views > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={12} /> {fmtViews(item.views)}
            </div>
          )}
        </div>

        <h3 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 20, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>
        
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: hov ? G : "rgba(255,255,255,0.6)", transition: "0.2s" }}>Read More</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: hov ? G : "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: hov ? "#000" : "#fff", transition: "0.2s" }}>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function VideoCard({ item, collection: col }) {
  const isMobile = useMobile();
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const title = item.title || item.name || "STEA Video";
  const desc = item.description || item.desc || item.caption || "";
  const thumb = item.imageUrl || item.image || item.thumbnailUrl || "/stea-icon.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 24,
        overflow: "hidden",
        border: `1px solid ${hov ? "rgba(245,166,35,0.2)" : BORDER}`,
        cursor: "pointer",
        transition: "all 0.3s ease"
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
        <img
          src={thumb}
          alt={title}
          onError={() => setImgErr(true)}
          referrerPolicy="no-referrer"
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.05)" : "scale(1)",
            transition: "0.3s ease"
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "grid", placeItems: "center" }}>
          <div style={{ 
            width: isMobile ? 50 : 64, height: isMobile ? 50 : 64, 
            borderRadius: "50%", background: "rgba(245,166,35,0.9)", 
            display: "grid", placeItems: "center", color: "#000",
            boxShadow: "0 0 20px rgba(245,166,35,0.3)",
            transform: hov ? "scale(1.1)" : "scale(1)",
            transition: "0.2s"
          }}>
            <PlayCircle size={isMobile ? 24 : 32} />
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>{desc}</p>
      </div>
    </motion.div>
  );
}
