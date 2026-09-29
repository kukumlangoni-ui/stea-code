import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { OrderFormModal } from "./OrderFormModal.jsx";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { getSafariLink } from "../utils/safariUtils.js";
import { ArrowRight } from "lucide-react";
import SEOHead from "./SEOHead.jsx";
import { generateProductSchema } from "../utils/seo.js";

const G = "#F5A623";
const BORDER = "rgba(255,255,255,0.06)";

function fmtPrice(n) {
  if (!n && n !== 0) return "";
  const num = Number(String(n).replace(/\D/g, ""));
  return `Tsh ${num.toLocaleString()}`;
}

export function TanzaniaProductModal({ product, onClose }) {
  const isMobile = useMobile();
  const { settings } = useSiteSettings();
  const [activeImg, setActiveImg] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const safariLink = getSafariLink(settings, product);
  
  const rawImages = Array.isArray(product.images) ? product.images : [product.imageUrl || product.image];
  const imgs = rawImages.filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!product) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
      <SEOHead 
        title={`${product.title || product.name} | STEA Duka`}
        description={product.description || `Nunua ${product.title || product.name} mtandaoni Tanzania. Bidhaa bora kwa bei nafuu.`}
        ogImage={imgs[0]}
        structuredData={generateProductSchema(product)}
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)" }} onClick={onClose} />
      
      <motion.div
        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ position: "relative", width: "100%", maxWidth: 800, background: "#0A0B10", borderRadius: isMobile ? "24px 24px 0 0" : "24px", border: `1px solid ${BORDER}`, padding: 0, boxShadow: "0 20px 40px rgba(0,0,0,.5)", maxHeight: "94vh", overflowY: "auto", display: "flex", flexDirection: isMobile ? "column" : "row" }}
      >
        {/* Gallery Section */}
        <div style={{ width: isMobile ? "100%" : 400, flexShrink: 0, background: "#050609", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div 
             className="perfect-img-container" 
             style={{ aspectRatio: isMobile ? "3/4" : "1/1", width: "100%", touchAction: "pan-y" }}
          >
            <AnimatePresence initial={false} mode="wait">
              {imgs.length > 0 ? (
                <motion.div 
                  key={activeImg} 
                  style={{ width: "100%", height: "100%", position: "relative" }}
                  drag={isMobile ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  dragListener={!isMobile}
                  onDragEnd={(e, { offset }) => {
                    const swipeThreshold = 50;
                    if (offset.x < -swipeThreshold) {
                      setActiveImg(a => (a + 1) % imgs.length);
                    } else if (offset.x > swipeThreshold) {
                      setActiveImg(a => (a - 1 + imgs.length) % imgs.length);
                    }
                  }}
                >
                   {/* Blurred background for "fill" effect */}
                   <div className="perfect-img-blur" style={{ backgroundImage: `url(${imgs[activeImg]})`, opacity: 0.5 }} />
                   
                   <motion.img
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     transition={{ duration: 0.3 }}
                     src={imgs[activeImg]}
                     alt={product.name}
                     style={{ position: "relative", zIndex: 2 }}
                     className="perfect-img-main"
                   />
                </motion.div>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", opacity: 0.1 }}>📦</div>
              )}
            </AnimatePresence>
            
            {imgs.length > 1 && !isMobile && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setActiveImg(a => (a - 1 + imgs.length) % imgs.length); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}><ChevronLeft size={20} /></button>
                <button onClick={(e) => { e.stopPropagation(); setActiveImg(a => (a + 1) % imgs.length); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.4)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          
          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: 8, padding: 12, overflowX: "auto", borderTop: `1px solid ${BORDER}` }}>
              {imgs.map((src, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === activeImg ? G : "transparent"}`, transition: "all .2s" }}>
                  <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div style={{ flex: 1, padding: isMobile ? 24 : 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
               <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, margin: "0 0 4px 0", color: "#fff", lineHeight: 1.2 }}>{product.name}</h2>
               {product.location && <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>{product.location}</div>}
            </div>
            {!isMobile && <button onClick={onClose} style={{ background: "rgba(255,255,255,.05)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}><X size={20} /></button>}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: G, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {fmtPrice(product.discountPrice || product.price)}
            </div>
            {(product.discountPrice && product.price) && (
              <div style={{ fontSize: 16, color: "rgba(255,255,255,.3)", textDecoration: "line-through", fontWeight: 700 }}>
                {fmtPrice(product.price)}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: BORDER }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".05em" }}>Maelezo ya Bidhaa</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.7)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {product.description || "Maelezo ya bidhaa hii hayajaandikwa bado."}
            </p>
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
             {safariLink && (
               <a
                 href={safariLink.link}
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{
                   width: "100%", height: "52px",
                   borderRadius: 14,
                   background: "linear-gradient(135deg, #10b981, #059669)",
                   color: "#fff", fontWeight: 900, fontSize: 16,
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                   textDecoration: "none", transition: "all .2s"
                 }}
                 onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
                 onMouseOut={e => e.currentTarget.style.transform = ""}
               >
                 🌍 {safariLink.type === "whatsapp" ? "Book via WhatsApp" : "Book Your Safari"} <ArrowRight size={20} />
               </a>
             )}
             
             <div style={{ display: "flex", gap: 12 }}>
               <button 
                onClick={() => { setCheckoutOpen(true); }}
                style={{ flex: 2, height: 52, borderRadius: 14, background: G, color: "#000", fontWeight: 900, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
               >
                  <ShoppingCart size={20} /> ODA SASA
               </button>
               {checkoutOpen && createPortal(
                 <OrderFormModal product={product} onClose={() => setCheckoutOpen(false)} />,
                 document.body
               )}
               <button 
                onClick={() => {
                  const text = `Habari STEA Marketplace, nahitaji bidhaa hii:\n\nBidhaa: ${product.name}\nBei: ${fmtPrice(product.discountPrice || product.price)}\n\nLink: ${window.location.origin}/marketplace`;
                  window.open(`https://wa.me/255757053354?text=${encodeURIComponent(text)}`, "_blank");
                }}
                style={{ flex: 1, height: 52, borderRadius: 14, background: "rgba(37, 211, 102, .1)", color: "#25d366", fontWeight: 800, fontSize: 14, border: "1px solid rgba(37, 211, 102, .2)", cursor: "pointer" }}
               >
                  WHATSAPP
               </button>
             </div>
          </div>
        </div>
        
        {isMobile && <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", display: "grid", placeItems: "center" }}><X size={20} /></button>}
      </motion.div>
    </div>,
    document.body
  );
}
