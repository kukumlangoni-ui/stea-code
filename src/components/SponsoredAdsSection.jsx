import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAds } from "../hooks/useAds.js";
import { X, ExternalLink, ArrowRight } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";

// Safe link opener — handles WhatsApp (wa.me) and normal URLs
function openExternalLink(link) {
  if (!link) return;
  const url = String(link).trim();
  if (!url) return;
  const safe = (url.startsWith("http://") || url.startsWith("https://")) ? url : "https://" + url;
  window.open(safe, "_blank", "noopener,noreferrer");
}
import { Skeleton, OfflineNotice } from "./Skeleton.jsx";
import { useNetwork } from "../hooks/useNetwork.js";

export function BannerAd() {
  const { ads, loading, isOfflineData } = useAds();
  const isMobile = useMobile();
  const { isOnline } = useNetwork();
  const G = "#F5A623";

  const bannerAds = useMemo(() => ads.filter((ad) => !ad.adType || ad.adType === "banner"), [ads]);

  if (loading) {
    return (
      <div style={{ padding: isMobile ? "24px 0" : "48px 0", display: "flex", justifyContent: "center" }}>
        <Skeleton width={isMobile ? "min(92vw, 420px)" : "100%"} height={isMobile ? "320px" : "420px"} borderRadius="24px" />
      </div>
    );
  }

  if (bannerAds.length === 0) return null;

  return (
    <div style={{ padding: isMobile ? "16px 0" : "40px 0", position: "relative" }}>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        alignItems: "center",
      }}>
        {bannerAds.map((ad) => (
          <SponsoredAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
}

function SponsoredAdCard({ ad }) {
  const isMobile = useMobile();
  const G = "#F5A623";
  const G2 = "#FFD17C";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{
        width: isMobile ? "min(92vw, 420px)" : "100%",
        maxWidth: isMobile ? 420 : 800,
        margin: isMobile ? "0 auto" : "0",
        padding: "18px",
        borderRadius: "24px",
        overflow: "hidden",
        position: "relative",
        background: "rgba(15, 18, 28, 0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
        cursor: "pointer"
      }}
      onClick={() => openExternalLink(ad.ctaUrl || ad.ctaLink)}
    >
      <div style={{
        position: "absolute",
        top: 14,
        left: 14,
        background: `${G}20`,
        color: G,
        fontSize: 10,
        padding: "4px 10px",
        borderRadius: "8px",
        textTransform: "uppercase",
        fontWeight: 900,
        zIndex: 10,
        border: `1px solid ${G}30`,
        letterSpacing: "0.5px"
      }}>
        Sponsored
      </div>

      {(ad.imageUrl || ad.image) && (
        <div style={{
          width: isMobile ? "100%" : "260px",
          height: isMobile ? "140px" : "180px",
          flexShrink: 0,
          borderRadius: "18px",
          overflow: "hidden",
          background: "#000"
        }}>
          {ad.mediaType === "video" || String(ad.imageUrl || ad.image).match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
            <video
              src={ad.imageUrl || ad.image}
              autoPlay loop muted playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={ad.imageUrl || ad.image}
              alt={ad.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h3 style={{
          color: "#fff",
          fontSize: isMobile ? "1.1rem" : "1.5rem",
          fontWeight: 900,
          lineHeight: 1.25,
          margin: "0 0 8px",
          fontFamily: "'Bricolage Grotesque', sans-serif"
        }}>
          {ad.title}
        </h3>
        <p style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: isMobile ? "0.9rem" : "1rem",
          lineHeight: 1.45,
          margin: "0 0 16px",
          display: "-webkit-box",
          WebkitLineClamp: isMobile ? 2 : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {ad.shortText || ad.description}
        </p>
        
        <button
          style={{
            marginTop: "auto",
            width: "100%",
            minHeight: "44px",
            padding: "10px 20px",
            background: `linear-gradient(135deg, ${G}, ${G2})`,
            color: "#000",
            borderRadius: "999px",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer"
          }}
        >
          {ad.ctaText || "Check it out"} <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function InlineAd({ index }) {
  const { ads } = useAds();
  const inlineAds = ads.filter((ad) => ad.adType === "inline");
  
  const ad = useMemo(() => {
    if (inlineAds.length === 0) return null;
    return inlineAds[index % inlineAds.length];
  }, [inlineAds, index]);

  if (!ad) return null;

  return (
    <div style={{ margin: "24px 0", display: "flex", justifyContent: "center" }}>
      <SponsoredAdCard ad={ad} />
    </div>
  );
}


export function PopupAd() {
  const { ads } = useAds();
  const isMobile = useMobile();
  const [show, setShow] = useState(false);

  const [ad, setAd] = useState(null);
  const popupAds = useMemo(() => ads.filter((ad) => ad.adType === "popup"), [ads]);

  const G = "#F5A623";
  const G2 = "#FFD17C";

  useEffect(() => {
    Promise.resolve().then(() => {
      if (popupAds.length > 0) {
        setAd(popupAds[Math.floor(Math.random() * popupAds.length)]);
      } else {
        setAd(null);
      }
    });
  }, [popupAds]);

  useEffect(() => {
    if (ad) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 5000); // Show after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [ad]);

  if (!ad) return null;

  return (
    <AnimatePresence>
      {show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              width: "100%",
              maxWidth: 450,
              background: "#141823",
              borderRadius: 32,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              position: "relative",
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            }}
          >
            <button
              onClick={() => setShow(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 20,
              }}
            >
              <X size={20} />
            </button>

            <div style={{ position: "relative", height: isMobile ? 300 : 250 }}>
              {ad.mediaType === "video" || String(ad.imageUrl || ad.image).match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                <video
                  src={ad.imageUrl || ad.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={ad.imageUrl || ad.image}
                  alt={ad.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  referrerPolicy="no-referrer"
                />
              )}
              <div style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "#F5A623",
                color: "#000",
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 8,
                fontWeight: 900,
                textTransform: "uppercase",
              }}>
                Sponsored
              </div>
            </div>

            <div style={{ padding: isMobile ? "24px" : "32px", textAlign: "center" }}>
              <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: "#fff", marginBottom: 12, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em" }}>
                {ad.title}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: isMobile ? 15 : 16, lineHeight: 1.6, marginBottom: 28 }}>
                {ad.shortText || ad.description}
              </p>
              <button
                onClick={() => { openExternalLink(ad.ctaUrl || ad.ctaLink); setShow(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "16px",
                  background: `linear-gradient(135deg, ${G}, ${G2})`,
                  color: "#000",
                  borderRadius: 16,
                  fontWeight: 900,
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  boxShadow: `0 8px 20px ${G}30`
                }}
              >
                {ad.ctaText || "Get Started"} <ExternalLink size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
