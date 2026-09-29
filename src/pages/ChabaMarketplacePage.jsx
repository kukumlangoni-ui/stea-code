import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getFirebaseDb, collection, onSnapshot, query } from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { MarketplaceProductCard } from "../components/MarketplaceProductCard.jsx";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { CHINA_MARKET_CATEGORIES } from "../constants/marketplace.js";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
// ChabaProductModal and ChabaCheckoutModal are kept but no longer used in marketplace flow

const G = "#F5A623";

/** Legacy wrapper — Agiza China listing uses shared marketplace card (no Msaada on card). */
function ChabaProductCard({ product }) {
  return (
    <MarketplaceProductCard product={{ ...product, market: "china" }} type="china" />
  );
}

export default function ChabaMarketplacePage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [activeCat, setActiveCat] = useState("Zote");

  const dynamicCategories = ["Zote", ...new Set(products.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    const db = getFirebaseDb();
    const unsub = onSnapshot(query(collection(db, "chaba_products")), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => p.visible !== false));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = products.filter(p => {
    if (activeCat !== "Zote" && p.category?.toLowerCase() !== activeCat.toLowerCase()) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (p.name || "").toLowerCase().includes(q) ||
             (p.category || "").toLowerCase().includes(q) ||
             (p.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ position: "relative", paddingBottom: 60, minHeight: "100vh", background: "var(--home-bg, #ffffff)", color: "var(--home-text, #0f172a)", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflow: "hidden" }}>
       <STEAHeader title="Marketplace" user={user} />
       <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 10px 0" : "28px 28px 0" }}>
          
          {/* MARKETPLACE SWITCHER (TZ vs China) */}
          <div style={{ marginTop: 12, marginBottom: 12, display: "flex", padding: "4px", background: "var(--home-alpha-04, #f1f5f9)", borderRadius: 999, width: isMobile ? "100%" : "360px", margin: isMobile ? "12px 0" : "12px auto 24px", position: "relative" }}>
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <button onClick={() => navigate("/duka")} style={{ width: "100%", padding: "8px 16px", border: "none", background: "transparent", color: "var(--home-muted, #64748b)", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "color .2s" }}>
                 🇹🇿 TZ Market
              </button>
            </div>
            <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
              <button style={{ width: "100%", padding: "8px 16px", border: "none", background: "transparent", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                 🇨🇳 Agiza China
              </button>
              <div style={{ position: "absolute", inset: 0, background: G, borderRadius: 999, zIndex: -1, boxShadow: "0 4px 12px rgba(245,166,35,0.2)" }} />
            </div>
          </div>

          {/* Improved Hero Section */}
          <div style={{
            textAlign: "center",
            padding: isMobile ? "24px 16px" : "48px 24px",
            background: "linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)",
            borderRadius: 24,
            marginBottom: 32,
            border: "1px solid rgba(245,166,35,0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: isMobile ? 32 : 48, fontWeight: 900, color: "var(--home-text, #0f172a)", margin: "0 0 12px 0", letterSpacing: "-0.03em" }}>
              Agiza <span style={{ color: "#F5A623" }}>Kutoka China</span>
            </h2>
            <p style={{ fontSize: isMobile ? 15 : 18, color: "var(--home-muted, #64748b)", maxWidth: 600, margin: "0 auto 24px", lineHeight: 1.5, fontWeight: 500 }}>
              Nunua bidhaa moja kwa moja kutoka nje kwa bei ya kiwandani na uhakika wa STEA.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {["🔥 Ofa Mpya Kila Siku", "📱 Simu Za Kisasa", "🇨🇳 Agiza China", "🚚 Usafirishaji Salama", "💰 Bei Nafuu"].map(chip => (
                <span key={chip} style={{ background: "var(--home-surface, #fff)", border: "1px solid var(--home-border, #e2e8f0)", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "var(--home-muted, #64748b)" }}>
                  {chip}
                </span>
              ))}
            </div>

            {/* Category switcher centered and animated */}
            <div 
              className="stea-category-scroll no-scrollbar" 
              style={{ 
                padding: isMobile ? "8px 0" : "20px 0",
                display: "flex",
                overflowX: "auto",
                gap: isMobile ? 8 : 32,
                justifyContent: isMobile ? "flex-start" : "center",
                width: "100%",
                scrollPadding: "20px",
                scrollSnapType: "x mandatory"
              }}
            >
              <motion.div 
                className={`stea-category-card ${activeCat === "Zote" ? "stea-category-card--active" : ""}`}
                onClick={() => setActiveCat("Zote")}
                style={{ width: isMobile ? 60 : 120, flexShrink: 0, scrollSnapAlign: "center" }}
                whileTap={{ scale: 0.9 }}
              >
                <div className="stea-category-icon-wrap" style={{ 
                  width: isMobile ? 44 : 90, 
                  height: isMobile ? 44 : 90, 
                  fontSize: isMobile ? 18 : 42, 
                  borderRadius: isMobile ? 12 : 28,
                  background: activeCat === "Zote" ? "rgba(245,166,35,0.1)" : "var(--home-surface, #ffffff)",
                  border: `1px solid ${activeCat === "Zote" ? "#F5A623" : "var(--home-border, #e2e8f0)"}`,
                  boxShadow: activeCat === "Zote" ? "0 4px 12px rgba(245,166,35,0.15)" : "0 2px 8px rgba(15,23,42,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: activeCat === "Zote" ? (isMobile ? "scale(1.1)" : "scale(1.15)") : "scale(1)"
                }}>🌏</div>
                <span className="stea-category-label" style={{ fontSize: isMobile ? 10 : 13, marginTop: 8, fontWeight: 700, color: activeCat === "Zote" ? G : "var(--home-text, #0f172a)" }}>Zote</span>
              </motion.div>
              
              {Object.values(CHINA_MARKET_CATEGORIES).map(c => (
                <motion.div 
                  key={c.id} 
                  className={`stea-category-card ${activeCat === c.label ? "stea-category-card--active" : ""}`}
                  onClick={() => setActiveCat(c.label)}
                  style={{ width: isMobile ? 60 : 120, flexShrink: 0, scrollSnapAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="stea-category-icon-wrap" data-cat={c.id} style={{ 
                    width: isMobile ? 44 : 90, 
                    height: isMobile ? 44 : 90, 
                    fontSize: isMobile ? 18 : 42, 
                    borderRadius: isMobile ? 12 : 28,
                    background: activeCat === c.label ? "rgba(245,166,35,0.1)" : "var(--home-surface, #ffffff)",
                    border: `1px solid ${activeCat === c.label ? "#F5A623" : "var(--home-border, #e2e8f0)"}`,
                    boxShadow: activeCat === c.label ? "0 4px 12px rgba(245,166,35,0.15)" : "0 2px 8px rgba(15,23,42,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: activeCat === c.label ? (isMobile ? "scale(1.1)" : "scale(1.15)") : "scale(1)"
                  }}>{c.emoji}</div>
                  <span className="stea-category-label" style={{ fontSize: isMobile ? 10 : 13, marginTop: 8, fontWeight: 700, color: activeCat === c.label ? G : "var(--home-text, #0f172a)" }}>{c.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20, color: "var(--home-muted, #64748b)", fontSize: 13, fontWeight: 700 }}>{filtered.length} bidhaa zinapatikana</div>

          {loading ? (
             <div className="marketplace-product-grid">
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ minHeight: 260, borderRadius: 16, background: "var(--home-surface, #ffffff)", border: "1px solid var(--home-border, #e2e8f0)" }} />)}
             </div>
          ) : filtered.length === 0 ? (
             <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--home-text, #0f172a)" }}>Hakuna Bidhaa</h3>
                <p style={{ color: "var(--home-muted, #64748b)", marginTop: 8, marginBottom: 24 }}>Jaribu kubadilisha kategoria au utafutaji.</p>
                <button onClick={() => { setSearchQ(""); setActiveCat("Zote"); }} style={{ background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>Onyesha Zote →</button>
             </div>
          ) : (
             <div className="marketplace-product-grid">
                {filtered.map(p => <ChabaProductCard key={p.id} product={p} />)}
             </div>
          )}
       </div>

    </div>
  );
}
