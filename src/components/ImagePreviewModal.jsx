import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImagePreviewModal({ product, onClose }) {
  const [activeImg, setActiveImg] = useState(0);
  const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [(product.imageUrl || product.image)].filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!imgs.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 5000,
        background: "rgba(0,0,0,.9)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: 10, borderRadius: "50%", cursor: "pointer", zIndex: 10 }}><X size={24} /></button>
      
      <div style={{ position: "relative", width: "90%", maxWidth: 600, height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
        <img src={imgs[activeImg]} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} referrerPolicy="no-referrer" />
        
        {imgs.length > 1 && (
          <>
            <button onClick={() => setActiveImg(a => (a - 1 + imgs.length) % imgs.length)} style={{ position: "absolute", left: 10, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: 10, borderRadius: "50%", cursor: "pointer" }}><ChevronLeft /></button>
            <button onClick={() => setActiveImg(a => (a + 1) % imgs.length)} style={{ position: "absolute", right: 10, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: 10, borderRadius: "50%", cursor: "pointer" }}><ChevronRight /></button>
          </>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 20, color: "#fff", textAlign: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{product.name}</h2>
        {/* Potentially add price here if needed */}
      </div>
    </motion.div>
  );
}
