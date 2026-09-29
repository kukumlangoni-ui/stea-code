import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCollection } from "../hooks/useFirestore.js";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const gold = "#F5A623";

const checkIsVideoUrl = (url) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return cleanUrl.endsWith(".mp4") || 
         cleanUrl.endsWith(".webm") || 
         cleanUrl.endsWith(".ogg") || 
         cleanUrl.endsWith(".mov") ||
         url.includes("/video/upload/");
};

export default function SponsoredCard() {
  const navigate = useNavigate();
  // Fetch up to 10 ads, sorted by createdAt desc
  const { docs: sponsoredDocs, loading } = useCollection("sponsored_ads", "createdAt", 10);

  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const handleClick = (url) => {
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate(url);
    }
  };

  // Safe checks: filter docs where status is active or published is true
  const activeAd = Array.isArray(sponsoredDocs)
    ? sponsoredDocs.find(doc => {
        const isLive = doc.status === "active" || doc.published === true;
        let meetsPlacement = true;
        
        if (doc.placement) {
          const placementLower = String(doc.placement).toLowerCase();
          meetsPlacement = placementLower.includes("homepage") || placementLower.includes("home");
        }
        
        let isNotExpired = true;
        if (doc.expiresAt) {
          try {
            const expDate = doc.expiresAt.toDate ? doc.expiresAt.toDate() : new Date(doc.expiresAt);
            isNotExpired = expDate > new Date();
          } catch(e) {
            console.error("Error parsing expiresAt:", e);
          }
        }
        return isLive && meetsPlacement && isNotExpired;
      })
    : null;

  // Reset loading & error states when activeAd source changes
  useEffect(() => {
    setMediaLoaded(false);
    setMediaError(false);
  }, [activeAd?.id, activeAd?.imageUrl, activeAd?.image, activeAd?.videoUrl]);

  // Handle fallback if no active ad or loading state of the query
  if (loading) {
    return (
      <div style={{ padding: '0 16px 24px' }}>
        <div className="animate-pulse bg-neutral-900" style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 22,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }} />
      </div>
    );
  }

  // Support media resolution
  const resolveAdMedia = () => {
    if (!activeAd) return { isVideo: false, videoUrl: null, imageUrl: null, posterUrl: null };

    // Possible video fields
    const videoUrl = activeAd.videoUrl || activeAd.video_url || activeAd.adVideo || activeAd.mediaUrl;
    // Possible image/general fields
    const imageUrl = activeAd.imageUrl || activeAd.image || activeAd.image_url || activeAd.fileUrl;
    // Poster / thumbnail
    const posterUrl = activeAd.thumbnailUrl || activeAd.thumbnail || activeAd.poster;

    const generalMediaIsVideo = checkIsVideoUrl(imageUrl);
    const videoFieldIsVideo = checkIsVideoUrl(videoUrl);

    if (videoFieldIsVideo) {
      return { isVideo: true, videoUrl, imageUrl: null, posterUrl };
    } else if (generalMediaIsVideo) {
      return { isVideo: true, videoUrl: imageUrl, imageUrl: null, posterUrl };
    } else if (imageUrl) {
      return { isVideo: false, videoUrl: null, imageUrl, posterUrl: null };
    } else if (videoUrl) {
      return { isVideo: true, videoUrl, imageUrl: null, posterUrl };
    }

    return { isVideo: false, videoUrl: null, imageUrl: null, posterUrl: null };
  };

  const { isVideo, videoUrl, imageUrl, posterUrl } = resolveAdMedia();
  const hasNoMedia = !videoUrl && !imageUrl;

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {activeAd ? (
        (mediaError || hasNoMedia) ? (
          /* Fallback for error/missing media */
          <div style={{
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 22,
            border: "1px solid rgba(245, 166, 35, 0.15)",
            background: "rgba(18, 18, 18, 0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center"
          }}>
            <AlertCircle size={28} color="#F5A623" />
            <div style={{ color: "#eee", fontWeight: 700, fontSize: 14 }}>Sponsored ad is unavailable.</div>
            <button 
              onClick={() => navigate("/advertise")}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffc107",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              Advertise here
            </button>
          </div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.01, borderColor: "rgba(245, 166, 35, 0.45)" }}
            transition={{ duration: 0.2 }}
            onClick={() => handleClick(activeAd.ctaUrl || activeAd.url || activeAd.slug || "/advertise")}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(245, 166, 35, 0.25)",
              background: "#08080c",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              cursor: "pointer",
            }}
          >
            {/* Loading skeleton wrapper inside the card to keep layout stable */}
            {!mediaLoaded && (
              <div className="animate-pulse bg-neutral-900" style={{
                position: "absolute",
                inset: 0,
                zIndex: 1
              }} />
            )}

            {/* Media rendering */}
            {isVideo ? (
              <video
                src={videoUrl}
                poster={posterUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedData={() => setMediaLoaded(true)}
                onError={() => setMediaError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: mediaLoaded ? 1 : 0,
                  transition: "opacity 0.2s ease"
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                onLoad={() => setMediaLoaded(true)}
                onError={() => setMediaError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: mediaLoaded ? 1 : 0,
                  transition: "opacity 0.2s ease"
                }}
              />
            )}

            {/* Bottom Dark Gradient overlay for premium contrast */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)",
              zIndex: 2,
            }} />

            {/* Sponsored label top-left */}
            <span style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "#F5A623",
              color: "#000",
              fontSize: 9,
              fontWeight: 900,
              padding: "4px 10.5px",
              borderRadius: 20,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              zIndex: 3,
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            }}>
              {activeAd.badge || "SPONSORED"}
            </span>

            {/* Content overlay */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "16px 20px",
              zIndex: 3,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}>
              <h4 style={{
                fontSize: "1.05rem",
                fontWeight: 850,
                color: "#fff",
                margin: 0,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                letterSpacing: "-0.01em",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}>
                {activeAd.title || "Special Sponsor Promo"}
              </h4>
              
              <p style={{
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.85)",
                margin: "0 0 4px 0",
                fontWeight: 500,
                lineHeight: 1.4,
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {activeAd.description || "Discover premium services sponsored on STEA."}
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: "#F5A623",
                fontSize: "0.82rem",
                fontWeight: 900,
                alignSelf: "flex-start",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)"
              }}>
                <span>{activeAd.ctaText || "Fahamu Zaidi"}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </motion.div>
        )
      ) : (
        /* Fallback: Premium prompt to Tangaza Nasi */
        <div
          onClick={() => navigate("/advertise")}
          style={{
            background: "linear-gradient(135deg, #161616 0%, #0d0d0d 100%)",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "24px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = gold;
            e.currentTarget.style.background = "linear-gradient(135deg, #1a1a1a 0%, #111 100%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.background = "linear-gradient(135deg, #161616 0%, #0d0d0d 100%)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(245,166,35,0.1)", color: gold,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px", fontFamily: "'Instrument Sans', sans-serif" }}>
                Tangaza Bidhaa Yako STEA hapa
              </h4>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                Wanafunzi na wajasiriamali 15,000+ wanatutembelea kila wiki. Tangaza sasa!
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            Fahamu Zaidi
          </button>
        </div>
      )}
    </div>
  );
}
