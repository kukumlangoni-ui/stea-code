import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Truck, Plane, ArrowRight } from "lucide-react";
import { ChabaCheckoutModal } from "./ChabaCheckoutModal.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { useSiteSettings } from "../contexts/SiteSettingsContext.jsx";
import { getSafariLink } from "../utils/safariUtils.js";

const G = "#F5A623";
const BORDER = "rgba(0,0,0,0.1)";

function fmtPrice(n) {
  if (!n && n !== 0) return "";
  const num = Number(String(n).replace(/\D/g, ""));
  return `Tsh ${num.toLocaleString()}`;
}

export function ChabaProductModal({ product, onClose, onNextProduct, onPrevProduct, hasNext, hasPrev, onBuyNow }) {
  const isMobile = useMobile();
  const { settings } = useSiteSettings();
  const [activeImg, setActiveImg] = useState(0);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  React.useEffect(() => {
    const oldBodyOverflow = document.body.style.overflow;
    const oldHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("modal-open");

    return () => {
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.overflow = oldHtmlOverflow;
      document.body.classList.remove("modal-open");
    };
  }, []);
  
  const imgs = Array.isArray(product.images) ? product.images : [product.imageUrl || product.image].filter(Boolean);

  const shippingOptions = product.shipping_options || product.transportOptions || ["sea"];
  const [shippingType, setShippingType] = useState(shippingOptions[0] || "sea");

  const productType = product.productType || "single";
  const minQty = Number(product.minQty) || 1;
  const stepQty = Number(product.stepQty) || 1;
  
  const [qty, setQty] = useState(minQty);
  const [isGroupBuy, setIsGroupBuy] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [extraInfo, setExtraInfo] = useState("");

  const basePrice = product.base_price || product.price || 0;
  const groupPrice = product.groupPrice || 0;
  const groupMinQty = product.groupMinQty || 2;

  let unitPrice = basePrice;

  if (isGroupBuy && groupPrice > 0) {
    unitPrice = groupPrice;
  } else if (shippingType === "air" && product.air_price) {
    unitPrice = product.air_price;
  } else if (product.bulk_prices?.length && productType === "bulk") {
    // Find the max tier that qty satisfies
    const sortedTiers = [...product.bulk_prices].sort((a, b) => b.quantity - a.quantity);
    for (let tier of sortedTiers) {
      if (qty >= tier.quantity) {
         unitPrice = tier.price;
         break;
      }
    }
  }

  const totalPrice = unitPrice * qty;

  const toggleGroupBuy = () => {
    const nextVal = !isGroupBuy;
    setIsGroupBuy(nextVal);
    if (nextVal) {
      setQty(Math.max(qty, groupMinQty));
    }
  };

  const handleQtyChange = (newQty) => {
    if (productType === "bulk") {
       const clamped = Math.max(minQty, newQty);
       const stepped = Math.ceil(clamped / stepQty) * stepQty;
       setQty(stepped);
    } else {
       const min = isGroupBuy ? groupMinQty : 1;
       setQty(Math.max(min, newQty));
    }
  };

  const STRE_WA = "255722421313";
  const STEA_WA = "255757053354";
  const handleDirectWhatsApp = () => {
    const msg = [
        `*🛒 AGIZA CHINA - ODA MPYA*`,
        `*Bidhaa:* ${product.name}`,
        `*Idadi:* ${qty}`,
        `*Bei:* Tsh ${Number(unitPrice).toLocaleString()} / pc`,
        `*Jumla:* Tsh ${Number(totalPrice).toLocaleString()}`,
        `*Njia:* Usafiri wa ${shippingType === "sea" ? "Meli" : "Ndege"}`,
        extraInfo ? `*Info:* ${extraInfo}` : ""
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${STEA_WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!product) return null;
  return createPortal(
    <div className="chaba-modal-root" role="dialog" aria-modal="true">
      <div className="chaba-modal-backdrop" onClick={onClose} />
      <motion.div
        className="chaba-modal-card"
        onClick={(e) => e.stopPropagation()}
        key={product.id} // Re-animate when product changes
        initial={isMobile ? { y: "100%", x: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { y: 0, x: 0 } : { opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={isMobile ? { y: "100%", x: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag={isMobile ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        dragListener={!isMobile}
        onDragEnd={(e, { offset }) => {
          const swipeThreshold = 50;
          if (offset.x < -swipeThreshold && onNextProduct) onNextProduct();
          else if (offset.x > swipeThreshold && onPrevProduct) onPrevProduct();
        }}
        style={{ width: "100%", maxWidth: 600, borderRadius: isMobile ? "24px 24px 0 0" : "24px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", touchAction: "pan-y" }}
      >
          {/* Header Options */}
          <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
            <button onClick={onClose} style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={20} /></button>
          </div>

        {/* Next/Prev Floating Buttons for Desktop */}
        {!isMobile && hasPrev && (
          <button onClick={onPrevProduct} style={{ position: "absolute", left: -60, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: `1px solid ${BORDER}`, color: "#fff", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", zIndex: 5, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={24} /></button>
        )}
        {!isMobile && hasNext && (
          <button onClick={onNextProduct} style={{ position: "absolute", right: -60, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: `1px solid ${BORDER}`, color: "#fff", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", zIndex: 5, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={24} /></button>
        )}

        {/* Carousel */}
        <div className="perfect-img-container" style={{ height: isMobile ? 400 : 500 }}>
          <AnimatePresence initial={false} mode="wait">
            {imgs.map((img, idx) => (
              activeImg === idx && (
                <div key={idx} style={{ width: "100%", height: "100%", position: "relative" }}>
                   {/* Blurred background for "fill" effect */}
                   <div className="perfect-img-blur" style={{ backgroundImage: `url(${img})`, opacity: 0.5 }} />
                   
                   <motion.img
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     transition={{ duration: 0.3 }}
                     src={img}
                     alt={product.name}
                     style={{ position: "relative", zIndex: 2 }}
                     className="perfect-img-main"
                   />
                </div>
              )
            ))}
          </AnimatePresence>

          {imgs.length > 1 && (
            <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 5 }}>
              {imgs.map((_, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? 16 : 6, height: 6, borderRadius: 3, background: i === activeImg ? G : "rgba(255,255,255,.4)", transition: "all .3s ease", cursor: "pointer" }} />
              ))}
            </div>
          )}
          {imgs.length > 1 && !isMobile && (
            <>
               <button onClick={() => setActiveImg(a => (a - 1 + imgs.length) % imgs.length)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}><ChevronLeft /></button>
               <button onClick={() => setActiveImg(a => (a + 1) % imgs.length)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", zIndex: 5 }}><ChevronRight /></button>
            </>
          )}
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px 0", color: "#111" }}>{product.name}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: G, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{fmtPrice(totalPrice)}</div>
                {qty > 1 && <div style={{ fontSize: 13, color: "rgba(0,0,0,.5)", fontWeight: 700 }}>({fmtPrice(unitPrice)} / kimoja)</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#22c55e", fontWeight: 700 }}>
                 <Truck size={14} /> Usafiri unachukua: {shippingType === "sea" ? "30-45 Siku" : "7-14 Siku"}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 15, color: "rgba(0,0,0,.6)", lineHeight: 1.6, margin: 0 }}>
            {product.description}
          </div>

          {/* Calculator Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Group Buy Toggle */}
            {groupPrice > 0 && (
              <div 
                onClick={toggleGroupBuy}
                style={{ 
                  padding: 16, borderRadius: 16, border: `1px solid ${isGroupBuy ? G : BORDER}`, 
                  background: isGroupBuy ? `${G}10` : "rgba(0,0,0,0.02)", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: isGroupBuy ? G : "#111" }}>ODA YA KIKUNDI (Group Buy)</div>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>Agiza na wenzako upate bei nafuu (Min {groupMinQty} pcs)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isGroupBuy ? G : "rgba(0,0,0,0.4)" }}>{fmtPrice(groupPrice)}</div>
                  <div style={{ fontSize: 10, textDecoration: "line-through", color: "rgba(0,0,0,0.3)" }}>{fmtPrice(basePrice)}</div>
                </div>
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {product.variants.map((v, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>Chagua {v.type === 'color' ? 'Rangi' : v.type === 'size' ? 'Size' : v.type}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {v.options.map(opt => {
                        const active = selectedVariants[v.type] === opt;
                        return (
                          <div 
                            key={opt}
                            onClick={() => setSelectedVariants(prev => ({...prev, [v.type]: opt}))}
                            style={{ 
                              padding: "8px 16px", borderRadius: 12, border: `1px solid ${active ? G : BORDER}`, 
                              background: active ? `${G}20` : "rgba(0,0,0,0.03)", color: active ? G : "#111",
                              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s"
                            }}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,.03)" }}>
               <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(0,0,0,0.5)", textTransform: "uppercase" }}>Idadi (Quantity)</div>
               <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={() => handleQtyChange(qty - stepQty)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,.05)", color: "#111", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 20 }}>-</button>
                  <div style={{ fontSize: 20, fontWeight: 900, minWidth: 32, textAlign: "center", fontFamily: "'Bricolage Grotesque', sans-serif", color: "#111" }}>{qty}</div>
                  <button onClick={() => handleQtyChange(qty + stepQty)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,.05)", color: "#111", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 20 }}>+</button>
               </div>
            </div>

            {/* Additional Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
               <label style={{ fontSize: 12, fontWeight: 800, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: 4 }}>Maelezo ya Ziada (Rangi, Size, Model)</label>
               <textarea 
                 placeholder="Mfn: iPhone 13 Pro, Rangi ya Bluu, Size XL..."
                 value={extraInfo} 
                 onChange={(e) => setExtraInfo(e.target.value)} 
                 style={{ width: "100%", height: 80, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,0,0,.03)", color: "#111", padding: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit", fontSize: 14, resize: "none" }}
               />
            </div>

            {/* Transport Selection */}
            {shippingOptions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: 4 }}>Chagua Njia ya Usafiri</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {shippingOptions.map(s => {
                    const active = shippingType === s;
                    const time = s === "sea" ? "30-45 Siku" : "7-14 Siku";
                    return (
                      <div key={s} onClick={() => setShippingType(s)} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px", borderRadius: 14, background: active ? `${G}15` : "rgba(0,0,0,.03)", border: `1px solid ${active ? G : BORDER}`, cursor: "pointer", transition: "all .2s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                           {s === "sea" ? <Truck size={16} color={active ? G : "rgba(0,0,0,0.4)"} /> : <Plane size={16} color={active ? G : "rgba(0,0,0,0.4)"} />}
                           <span style={{ fontSize: 14, fontWeight: 800, color: active ? G : "#111", textTransform: "capitalize" }}>{s === "sea" ? "Meli" : "Ndege"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", fontWeight: 700 }}>{time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                if (onBuyNow) {
                  const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ");
                  const finalExtra = [variantStr, extraInfo].filter(Boolean).join(" | ");
                  onBuyNow(product, qty, shippingType, unitPrice, totalPrice, finalExtra);
                } else {
                  setCheckoutOpen(true);
                }
              }}
              style={{ 
                width: "100%", height: 56, borderRadius: 16, border: "none", 
                background: G, color: "#000", fontSize: 16, fontWeight: 900, 
                cursor: "pointer", display: "flex", alignItems: "center", 
                justifyContent: "center", gap: 12, transition: "transform .2s" 
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              ODA SASA <ArrowRight size={20} />
            </button>
            <p style={{ fontSize: 12, color: "rgba(0,0,0,0.5)", textAlign: "center", marginTop: 12, fontWeight: 600 }}>
              * Bonyeza hapa kufungua fomu ya kukamilisha kuagiza.
            </p>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
