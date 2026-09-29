import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Portal } from "./ui/LayoutUtils.jsx";

export function VideoModal({ video, onClose }) {
  if (!video) return null;

  const getVidId = (url) => {
    if (!url) return "";
    const m = url.match(/(?:\?v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/|\/live\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : url;
  };

  const id = getVidId(video.youtubeUrl || video.url || video.link || "");

  return (
    <Portal>
      <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "grid", placeItems: "center", padding: 20 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ position: "relative", width: "100%", maxWidth: 1000, aspectRatio: "16/9", background: "#000", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
        >
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
          >
            <X size={20} />
          </button>
          {id ? (
            <iframe
              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.5)" }}>
              Video not found
            </div>
          )}
        </motion.div>
      </div>
    </Portal>
  );
}
