import React from "react";
import { motion } from "framer-motion";
import { Gamepad2, Sparkles, Trophy, Tv, Play, ChevronRight, Zap, Target, Brain } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { BlurText } from "../components/BlurText.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD_BG = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", ...style }}>
    {children}
  </div>
);

export default function GamesPage() {
  const isMobile = useMobile();

  const activeGames = [
    {
      id: "g1",
      title: "Swahili Word Quest",
      desc: "Chagua herufi sahihi na uunde maneno ya Kiswahili dhidi ya muda. Imarisha ubongo na msamiati wako!",
      icon: <Brain size={28} />,
      badge: "Kizazi kipya",
      color: "#3b82f6",
      ready: false
    },
    {
      id: "g2",
      title: "IQ Trivia Challenge",
      desc: "Maswali ya akili, hesabu za haraka, na sayansi. Shindana kwenye leaderboard na ujishindie pointi za STEA.",
      icon: <Target size={28} />,
      badge: "Inakuja hivi karibuni",
      color: G,
      ready: false
    },
    {
      id: "g3",
      title: "Math Speed Run",
      desc: "Kokotoa hesabu rahisi kwa sekunde chache. Kila jibu sahihi linaongeza sekunde za kuendelea kucheza.",
      icon: <Zap size={28} />,
      badge: "Demo available soon",
      color: "#10b981",
      ready: false
    }
  ];

  return (
    <div style={{ background: DARK, minHeight: "100vh", color: "#fff", fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* Header Space */}
      <div style={{ paddingTop: isMobile ? 80 : 120, paddingBottom: 40 }}>
        <W>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 50 }}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{
                width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg, ${G}18, ${G2}10)`,
                border: `1.5px solid ${G}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: G, marginBottom: 20,
                boxShadow: `0 8px 30px ${G}12`
              }}
            >
              <Gamepad2 size={36} />
            </motion.div>

            <h1 style={{
              fontSize: isMobile ? "2.2rem" : "3.5rem",
              fontWeight: 900,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 16,
              background: "linear-gradient(to right, #fff, rgba(255,255,255,0.75))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              STEA Gaming Zone
            </h1>

            <p style={{
              fontSize: isMobile ? 15 : 18,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 600,
              lineHeight: 1.6,
              margin: 0
            }}>
              Cheza michezo ya kusisimua, jibu maswali ya akili (Quiz Trivia), na imarisha ubongo wako ukiwa unajishindia pointi maalum za STEA.
            </p>
          </div>

          {/* Active / Coming Soon Grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 24, marginBottom: 60 }}>
            {activeGames.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 24,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Visual Glow Ornament */}
                <div style={{
                  position: "absolute",
                  top: -40, right: -40,
                  width: 120, height: 120,
                  borderRadius: "50%",
                  background: `${game.color}08`,
                  filter: "blur(20px)",
                  pointerEvents: "none"
                }} />

                <div>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${game.color}15`,
                    color: game.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24
                  }}>
                    {game.icon}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff" }}>{game.title}</h3>
                    <span style={{
                      fontSize: 9, fontWeight: 900,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      background: idx === 0 ? "#1e293b" : "rgba(255,255,255,0.04)",
                      color: idx === 0 ? game.color : "rgba(255,255,255,0.5)",
                      padding: "2px 7px", borderRadius: 4, display: "inline-block"
                    }}>
                      {game.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
                    {game.desc}
                  </p>
                </div>

                <div style={{ marginTop: 28 }}>
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      background: "rgba(255,255,255,0.03)",
                      border: `1.5px solid rgba(255,255,255,0.04)`,
                      borderRadius: 14,
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 700,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "not-allowed"
                    }}
                  >
                    <span>Hivi Karibuni</span>
                    <Play size={13} style={{ opacity: 0.3 }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick FAQ / Community panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              background: "linear-gradient(135deg, rgba(245,166,35,0.05), rgba(245,166,35,0.01))",
              border: `1px solid rgba(245,166,35,0.15)`,
              borderRadius: 30,
              padding: isMobile ? 32 : 48,
              textAlign: "center"
            }}
          >
            <Trophy size={40} color={G} style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              STEA Weekly Leaderboard & Rewards
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, maxWidth: 650, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Weka rekodi zako za michezo! Kila wiki wachezaji 3 bora wa Swahili Word Quest watapokea vocha za bure za matumizi ya STEA Prompt Lab na AI tools.
            </p>
            <div style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: G, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ● TO BE LAUNCHED IN THE NEXT RELEASE
              </span>
            </div>
          </motion.div>
        </W>
      </div>
    </div>
  );
}
