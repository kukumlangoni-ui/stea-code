import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Send } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { G, W, PushBtn } from "../components/ui/LayoutUtils.jsx";

export function CreatorSection({ goPage, siteSettings }) {
  const isMobile = useMobile();
  const [imgError, setImgError] = useState(false);
  const data = siteSettings?.about_creator || {
    fullName: "Isaya Hans Masika",
    title: "Founder & Developer",
    shortBio: "Tanzanian tech creator na web developer.",
    fullBio: "Isaya Hans Masika ni Tanzanian tech creator na web developer, asili yake ikiwa ni mkoani Mbeya na kwa sasa anaishi nchini China. Anashikilia Shahada ya Uzamili (Bachelor’s Degree) katika Computer Science kutoka Guilin University of Electronic Technology, China. Safari yake ya elimu ilianzia Wazo Hill Primary School, akaendelea Mbezi Beach Secondary School, na baadaye Lugufu Boys Secondary School. Isaya ana shauku kubwa na teknolojia, AI, na kujenga majukwaa ya kidijitali yanayosaidia watu kupata maarifa kwa lugha ya Kiswahili.",
    imageUrl: "/stea-icon.jpg",
    imageAlt: "Isaya Hans Masika",
    contactText: "Contact Creator"
  };

  return (
    <section style={{ padding: isMobile ? "40px 0" : "100px 0", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: isMobile ? "100%" : "80%",
          height: isMobile ? "100%" : "80%",
          background: `radial-gradient(circle, ${G}15, transparent 70%)`,
          filter: "blur(80px)",
          zIndex: -1,
        }}
      />
      <W>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))",
            gap: isMobile ? 32 : 60,
            alignItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -30, y: isMobile ? 20 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div
              style={{
                display: "inline-block",
                padding: isMobile ? "3px 10px" : "6px 14px",
                borderRadius: 99,
                background: "rgba(255,209,124,0.1)",
                color: G,
                fontSize: isMobile ? 9 : 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: isMobile ? 12 : 20,
              }}
            >
              The Visionary
            </div>
            <h2
              style={{
                fontSize: isMobile ? "28px" : "clamp(32px, 5vw, 48px)",
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: isMobile ? 16 : 24,
                color: "#fff",
                letterSpacing: "-0.03em",
              }}
            >
              About the <span style={{ color: G }}>Creator</span>
            </h2>
            <div
              style={{
                fontSize: isMobile ? 14 : 18,
                lineHeight: isMobile ? 1.6 : 1.8,
                color: "rgba(255,255,255,0.7)",
                display: "grid",
                gap: isMobile ? 12 : 20,
              }}
            >
              <p>
                <strong style={{ color: "#fff", fontSize: isMobile ? 16 : 20 }}>{data.fullName}</strong> {data.shortBio}
              </p>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {data.fullBio}
              </div>
            </div>
            <div style={{ marginTop: isMobile ? 24 : 40 }}>
              <PushBtn onClick={() => {
                if (data.contactLink) window.open(data.contactLink, "_blank");
                else goPage && goPage("contact");
              }} style={{ fontSize: isMobile ? 13 : 15, padding: isMobile ? "10px 20px" : "12px 24px" }}>
                ✉️ {data.contactText || "Contact Creator"}
              </PushBtn>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ position: "relative", order: isMobile ? -1 : 0 }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: isMobile ? 260 : 400,
                margin: "0 auto",
                position: "relative",
              }}
            >
              <div
                style={{
                  aspectRatio: "1/1",
                  borderRadius: isMobile ? 24 : 40,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 20px ${G}10`,
                }}
              >
                {!imgError && data.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data.imageAlt || data.fullName}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.9,
                    }}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))`,
                    }}
                  >
                    <User size={isMobile ? 60 : 120} color={G} strokeWidth={1} opacity={0.3} />
                  </div>
                )}
                
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, #0a0b10 0%, transparent 40%)",
                    pointerEvents: "none",
                  }}
                />
                
                <div
                  style={{
                    position: "absolute",
                    bottom: isMobile ? 16 : 30,
                    left: isMobile ? 16 : 30,
                    right: isMobile ? 16 : 30,
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                    {data.fullName}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 14, color: G, fontWeight: 700, letterSpacing: 0.5 }}>
                    {data.title}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </W>
    </section>
  );
}

export default function CreatorPage({ goPage, siteSettings }) {
  return (
    <div style={{ padding: "20px 0" }}>
      <CreatorSection goPage={goPage} siteSettings={siteSettings} />
    </div>
  );
}
