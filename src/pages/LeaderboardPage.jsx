import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Trophy, BookOpen, Award, Sparkles, ArrowLeft, Shield } from "lucide-react";
import { db, collection, getDocs, limit, query, orderBy } from "../firebase";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { useAuth } from "../hooks/useAuth";
import STEAAvatar from "../components/STEAAvatar.jsx";

const G = "#D4AF37";

const LEVELS = [
  { name: "Beginner", icon: "🌱", minPoints: 0 },
  { name: "Explorer", icon: "🚀", minPoints: 200 },
  { name: "Achiever", icon: "🏆", minPoints: 600 },
  { name: "Expert", icon: "💎", minPoints: 1500 },
  { name: "Elite", icon: "👑", minPoints: 3000 },
  { name: "Legend", icon: "🔥", minPoints: 6000 }
];

const getLevelInfo = (points = 0) => {
  let matched = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) {
      matched = lvl;
    }
  }
  return matched;
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "referrals" ? "referrals" : "learners");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        let q;
        
        if (activeTab === "contributors") {
          // Top Contributors (contributorPoints or uploads count)
          q = query(usersRef, orderBy("contributorPoints", "desc"), limit(20));
        } else if (activeTab === "creators") {
          // Top Creators (creatorPoints or views)
          q = query(usersRef, orderBy("creatorPoints", "desc"), limit(20));
        } else if (activeTab === "referrals") {
          q = query(usersRef, orderBy("referralCount", "desc"), limit(20));
        } else {
          // Top Learners (default, by points / XP)
          q = query(usersRef, orderBy("points", "desc"), limit(20));
        }

        const snap = await getDocs(q);
        const list = snap.docs.map((doc, index) => {
          const data = doc.data();
          return {
            id: doc.id,
            rank: index + 1,
            displayName: data.displayName || data.fullName || "STEA Member",
            photoURL: data.photoURL,
            points: data.points || 0,
            contributorPoints: data.contributorPoints || 0,
            creatorPoints: data.creatorPoints || 0,
            referralCount: data.referralCount || 0,
            referralPoints: data.referralPoints || 0,
            role: data.role || "user",
          };
        });

        // Fallback placeholder data if Firebase results are sparse
        if (list.length === 0) {
          const fallbacks = Array.from({ length: 10 }).map((_, idx) => ({
            id: `fallback-${idx}`,
            rank: idx + 1,
            displayName: ["Alex K.", "Fatuma M.", "John S.", "Neema L.", "Joseph P.", "Salma H.", "Dismas R.", "Mariam A.", "Grace J.", "Baraka T."][idx],
            photoURL: null,
            points: (10 - idx) * 250,
            contributorPoints: (10 - idx) * 15,
            creatorPoints: (10 - idx) * 120,
            referralCount: 10 - idx,
            referralPoints: (10 - idx) * 50,
            role: "user"
          }));
          setLeaderboardData(fallbacks);
        } else {
          setLeaderboardData(list);
        }
      } catch (err) {
        console.error("Failed to load leaderboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  const getScoreDisplay = (item) => {
    if (activeTab === "contributors") {
      return `${item.contributorPoints || 0} pts`;
    }
    if (activeTab === "creators") {
      return `${item.creatorPoints || 0} views`;
    }
    if (activeTab === "referrals") {
      return `${item.referralCount || 0} invites`;
    }
    return `${item.points || 0} pts`;
  };

  const getPodiumOrder = () => {
    if (leaderboardData.length < 3) return leaderboardData;
    // Map order [Second, First, Third] for aesthetic podium presentation
    return [leaderboardData[1], leaderboardData[0], leaderboardData[2]];
  };

  const podiumItems = getPodiumOrder();
  const restItems = leaderboardData.slice(3);

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", paddingBottom: 100 }}>
      <STEAHeader title="Leaderboard" user={user} />

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px" }}>
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: "#6B7280",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 16
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#111827", margin: "0 0 6px 0", letterSpacing: "-0.03em" }}>
            🏆 STEA Leaderboard
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
            Top learners, contributors, creators, and growth partners.
          </p>
        </div>

        {/* Tabs switcher */}
        <div style={{
          display: "flex",
          background: "#F3F4F6",
          padding: 4,
          borderRadius: 16,
          marginBottom: 24,
          border: "1px solid #E5E7EB"
        }}>
          {[
            { id: "learners", label: "Top Learners", icon: Trophy },
            { id: "contributors", label: "Contributors", icon: BookOpen },
            { id: "creators", label: "Creators", icon: Award },
            { id: "referrals", label: "Referrals", icon: Sparkles }
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "none",
                  background: active ? "#FFFFFF" : "none",
                  color: active ? "#111827" : "#6B7280",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <ActiveIcon size={14} style={{ color: active ? G : "inherit" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280" }}>
            Loading top ranks...
          </div>
        ) : (
          <>
            {/* Podium Presentation */}
            {leaderboardData.length >= 3 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 32,
                marginTop: 16,
                padding: "0 10px"
              }}>
                {podiumItems.map((item, idx) => {
                  if (!item) return null;
                  const isFirst = item.rank === 1;
                  const isSecond = item.rank === 2;
                  const height = isFirst ? 140 : isSecond ? 115 : 100;
                  const level = getLevelInfo(item.points);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                      }}
                    >
                      {/* Avatar container */}
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        {isFirst && (
                          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 24 }}>
                            👑
                          </div>
                        )}
                        <div style={{
                          width: isFirst ? 64 : 52,
                          height: isFirst ? 64 : 52,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          border: `2px solid ${isFirst ? G : isSecond ? "#C0C0C0" : "#CD7F32"}`,
                          boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: isFirst ? 22 : 18,
                          fontWeight: 900,
                          color: G,
                          overflow: "hidden"
                        }}>
                          <STEAAvatar user={item} size={isFirst ? "lg" : "md"} alt={item.displayName} />
                        </div>
                        {/* Rank Badge */}
                        <div style={{
                          position: "absolute",
                          bottom: -4,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: isFirst ? G : isSecond ? "#9CA3AF" : "#CD7F32",
                          color: "#FFFFFF",
                          fontSize: 10,
                          fontWeight: 900,
                          padding: "2px 8px",
                          borderRadius: 99,
                          border: "1.5px solid #FFFFFF",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}>
                          #{item.rank}
                        </div>
                      </div>

                      {/* Name / Info */}
                      <div style={{ textAlign: "center", width: "100%", marginBottom: 6 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {item.displayName}
                        </div>
                        <div style={{ fontSize: 10, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                          <span>{level.icon}</span>
                          <span>{level.name}</span>
                        </div>
                      </div>

                      {/* Podium Stand */}
                      <div style={{
                        width: "100%",
                        height: height,
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderBottom: "none",
                        borderRadius: "16px 16px 0 0",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingBottom: 16,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.02)"
                      }}>
                        <strong style={{ fontSize: 13, color: "#111827", fontWeight: 900 }}>
                          {getScoreDisplay(item)}
                        </strong>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Ranks 4+ List */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 24,
              padding: 6,
              boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
              display: "flex",
              flexDirection: "column",
              gap: 2
            }}>
              {restItems.map((item) => {
                const level = getLevelInfo(item.points);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 16,
                      transition: "background 0.2s"
                    }}
                  >
                    {/* Rank index */}
                    <div style={{ width: 24, textAlign: "center", fontSize: 13, fontWeight: 800, color: "#9CA3AF" }}>
                      {item.rank}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#F3F4F6",
                      border: "1.5px solid #E5E7EB",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      color: "#4B5563",
                      fontSize: 14,
                      overflow: "hidden"
                    }}>
                      <STEAAvatar user={item} size="md" alt={item.displayName} />
                    </div>

                    {/* User Profile */}
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: 13, color: "#111827", fontWeight: 800 }}>
                        {item.displayName}
                      </strong>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#6B7280" }}>
                        <span>{level.icon}</span>
                        <span>{level.name}</span>
                      </span>
                    </div>

                    {/* Score badge */}
                    <div style={{
                      background: "#FFF8E1",
                      border: "1px solid rgba(212,175,55,0.25)",
                      color: "#8F6D00",
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 900
                    }}>
                      {getScoreDisplay(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
