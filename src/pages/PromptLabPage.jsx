import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFirebaseDb, collection, query, onSnapshot,
  limit, updateDoc, doc, increment, handleFirestoreError, OperationType
} from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { Search, ChevronLeft, AlertCircle } from "lucide-react";
import SEOHead from "../components/SEOHead.jsx";
import { PromptLabCard } from "../components/PromptLabCard.jsx";
import { TechHubNavbar } from "./TechHubPage.jsx";
import { useSearch as useSearchHook } from "../hooks/useSearch.js";
import { useCustomCategories } from "../hooks/useCustomCategories.js";

const G = "#F5A623";
const BG = "#0a0b0f";

const FALLBACK_PROMPTS = [
  {
    id: "default-marketing-writer",
    title: "Mwandishi wa Copy za Mitandao ya Kijamii",
    description: "Tengeneza maudhui ya kuvutia na yenye mauzo makubwa kwa Kiswahili safi kwa akaunti zako za kijamii kama Instagram na Facebook.",
    prompt: "Wewe ni mwandishi nguli wa matangazo ya biashara na mitandao ya kijamii nchini Tanzania. Andika chapisho la Instagram la kuvutia sana kuhusu [ingiza jina la bidhaa/huduma]. Chapisho liwe na lugha ya msisimko, chachu ya mauzo, emoji zinazofaa, na mwisho uweke wito wa kuchukua hatua (CTA).",
    category: "Marketing",
    tags: ["Marketing", "Copywriting", "ChatGPT"],
    likes: 125,
    isPremium: false
  },
  {
    id: "default-logo-designer",
    title: "Logo Designer Professional",
    description: "Generate high-quality minimalist vector logo design prompts for Midjourney and DALL-E 3 instantly.",
    prompt: "Generate a minimalist vector logo design for a [insert business type] called [insert name]. The logo should use clean lines, [insert 2 colors] color scheme, and be set on a pure solid black background. Include no text unless requested, sharp details, vector silhouette, highly polished.",
    category: "Graphics & Design",
    tags: ["Design", "Midjourney", "Graphics"],
    likes: 98,
    isPremium: true
  },
  {
    id: "default-business-plan",
    title: "Mchanganuo wa Biashara (Business Plan Creator)",
    description: "Andika mchanganuo kamili na madhubuti wa biashara ukiwemo mtaji, mapato, na mbinu za ushindani sokoni.",
    prompt: "Tengeneza mchanganuo wa biashara (business plan) ya kina kwa ajili ya biashara ya [ingiza aina ya biashara] nchini Tanzania. Mchanganuo uhusishe: 1. Muhtasari Mtendaji na Malengo. 2. Mtaji unaohitajika na makadirio ya gharama za awali. 3. Mpango wa uuzaji (Marketing strategy). 4. Mpango wa uendeshaji wa kila siku. Fanya uchambuzi uwe wa kweli na wa vitendo.",
    category: "Business",
    tags: ["Business", "Plan", "ChatGPT"],
    likes: 154,
    isPremium: true
  },
  {
    id: "default-swahili-translator",
    title: "English to Swahili Standard Translator",
    description: "Tafsiri Kiingereza kwenda Kiswahili kinachoeleweka vizuri na cha kitaalamu bila kutafsiri neno kwa neno.",
    prompt: "Translate the following English text into natural, professional Swahili as spoken in East Africa. Avoid word-for-word translation. Ensure the tone matches [insert tone: professional/casual/editorial] and that localized idioms or terminology are used where appropriate. Here is the text: [insert English text]",
    category: "Translation & Writing",
    tags: ["Translation", "Writing", "Claude"],
    likes: 87,
    isPremium: false
  }
];

export default function PromptLabPage() {
  const isMobile = useMobile();
  const location = useLocation();
  
  // Set up local state loaded initially from cache
  const [docs, setDocs] = useState(() => {
    try {
      const cached = localStorage.getItem("stea_cache_prompts");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return FALLBACK_PROMPTS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const [activeTag, setActiveTag] = useState(location.state?.cat || "All");
  const [displayLimit, setDisplayLimit] = useState(12);
  const db = getFirebaseDb();

  // Robust real-time listener for "prompts" collection
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "prompts"), limit(300));

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Client-side sort by updatedAt or createdAt
        fetched.sort((a, b) => {
          const tA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const tB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return tB - tA;
        });

        // Safe cache write
        try {
          localStorage.setItem("stea_cache_prompts", JSON.stringify(fetched));
        } catch (err) {
          console.warn("Storage caching error prompts:", err);
        }

        setDocs(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore loading error prompts:", err);
        setError(err);
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, "prompts");
        } catch {}
      }
    );

    return () => unsub();
  }, [db, retryTrigger]);

  const handleRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  // Ensure and filter ONLY active, published prompts
  const publishedDocs = useMemo(() => {
    const rawFiltered = docs.filter(p => {
      if (p.visible === false) return false;
      if (p.published === false) return false;
      if (p.status && !["active", "published", "approved"].includes(p.status)) return false;
      return true;
    });

    // Merge raw filtered prompts with fallbacks so the grid remains rich and functional
    let merged = [...rawFiltered];
    FALLBACK_PROMPTS.forEach(fb => {
      if (!merged.some(m => String(m.title || m.name).toLowerCase() === String(fb.title).toLowerCase())) {
        merged.push(fb);
      }
    });
    return merged;
  }, [docs]);

  // Phase 2: custom categories from Firestore
  const { categories: customCats } = useCustomCategories("prompt_categories", publishedDocs);

  // Phase 1: debounced search
  const { query: searchQ, setQuery: setSearchQ, filtered: searchFiltered, isSearching } = useSearchHook(publishedDocs);

  useEffect(() => { setDisplayLimit(12); }, [searchQ, activeTag]);

  const allTags = useMemo(() => {
    const tags = new Set(customCats.map(c => c.name || c).filter(Boolean));
    publishedDocs.forEach(d => {
      if (d.category) tags.add(d.category);
      if (Array.isArray(d.tags)) d.tags.forEach(t => tags.add(t));
    });
    return ["All", ...Array.from(tags).sort()];
  }, [publishedDocs, customCats]);

  const filtered = useMemo(() => {
    if (activeTag === "All") return searchFiltered;
    return searchFiltered.filter(p =>
      p.category === activeTag || (Array.isArray(p.tags) && p.tags.includes(activeTag))
    );
  }, [searchFiltered, activeTag]);

  const handleLike = async (e, id) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "prompts", id), {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: BG, 
      color: "#fff", 
      fontFamily: "'Instrument Sans', system-ui, sans-serif",
      paddingTop: 0,
      paddingBottom: 60
    }}>
      <TechHubNavbar />
      <SEOHead 
        title="Prompt Lab — AI Prompts za Kiswahili na Kiingereza | STEA"
        description="Maktaba ya AI prompts bora kwa ChatGPT, Claude, Midjourney na AI nyingine. Nakili na tumia mara moja kwa biashara, elimu na ubunifu."
        keywords={["AI prompts Tanzania", "ChatGPT prompts Kiswahili", "AI prompts bure", "prompt lab Tanzania"]}
      />
      <div style={{ 
        maxWidth: 700, 
        margin: "0 auto", 
        padding: isMobile ? "0 16px" : "0 24px" 
      }}>
        
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            background: "none", 
            border: "none", 
            color: "rgba(255,255,255,.5)", 
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
            padding: 0
          }}
        >
          <ChevronLeft size={18} /> Rudi
        </button>

        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, margin: "0 0 8px", color: "#fff" }}>
            Prompt Lab
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,.6)", margin: 0 }}>
            Maktaba ya AI Prompts bora zilizojaribiwa kwa Kiswahili.
          </p>
        </header>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <Search 
            size={20} 
            style={{ 
              position: "absolute", 
              left: 16, 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "rgba(255,255,255,.4)" 
            }} 
          />
          <input 
            type="text"
            placeholder="Search Prompt Lab — e.g. logo, cinematic, business..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{
              width: "100%",
              height: 56,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 16,
              color: "#fff",
              padding: "0 16px 0 48px",
              fontSize: 16,
              outline: "none",
              transition: "border-color .2s",
            }}
            onFocus={(e) => e.target.style.borderColor = G}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,.1)"}
          />
        </div>

        {/* Error State */}
        {error && (
          <div style={{ 
            textAlign: "center", 
            padding: "40px 24px", 
            background: "rgba(239, 68, 68, 0.08)", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            borderRadius: 16, 
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12
          }}>
            <AlertCircle size={32} color="#f87171" />
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#fca5a5" }}>Could not load prompts.</h3>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, margin: 0 }}>Tap to retry.</p>
            </div>
            <button
              onClick={handleRetry}
              style={{
                marginTop: 8,
                background: G,
                border: "none",
                borderRadius: 12,
                padding: "10px 28px",
                color: "#000",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .2s"
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Tags */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          overflowX: "auto", 
          paddingBottom: 12, 
          marginBottom: 24,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                whiteSpace: "nowrap",
                padding: "8px 16px",
                borderRadius: 99,
                background: activeTag === tag ? G : "rgba(255,255,255,.05)",
                color: activeTag === tag ? "#000" : "rgba(255,255,255,.7)",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all .2s"
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* List */}
        {!loading && (
          <div style={{ marginBottom: 12, fontSize: 12, color: "rgba(255,255,255,.3)", fontWeight: 700 }}>
            {searchQ ? `${filtered.length} results for "${searchQ}"` : `${filtered.length} prompts`}
            {isSearching && " — searching…"}
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
          ) : filtered.length > 0 ? (
            <>
              {filtered.slice(0, displayLimit).map((p) => (
                <PromptLabCard key={p.id} p={p} onLike={handleLike} />
              ))}
              {filtered.length > displayLimit && (
                <div style={{ textAlign: "center", paddingTop: 8 }}>
                  <button
                    onClick={() => setDisplayLimit(n => n + 12)}
                    style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"12px 28px", color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}
                  >
                    Load more ({filtered.length - displayLimit} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Search size={32} color="rgba(255,255,255,.3)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Hakuna matokeo</h3>
              <p style={{ color: "rgba(255,255,255,.5)", marginTop: 8 }}>
                {searchQ ? `No prompts match "${searchQ}". Try another keyword.` : "No prompts available."}
              </p>
              {searchQ && <button onClick={() => setSearchQ("")} style={{ marginTop: 16, background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Clear search →</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  const BORDER = "rgba(255,255,255,.08)";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        background: "rgba(15, 17, 21, 0.6)",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        width: "100%",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      {/* Shimmer Image Box */}
      <div 
        className="skeleton-shimmer" 
        style={{ 
          width: "100%", 
          aspectRatio: "4 / 3", 
        }} 
      />

      {/* Content Area */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
        
        {/* Shimmer Category Line */}
        <div 
          className="skeleton-shimmer" 
          style={{ 
            height: 10, 
            width: "30%", 
            borderRadius: 4,
            marginBottom: 8 
          }} 
        />

        {/* Shimmer Title Line */}
        <div 
          className="skeleton-shimmer" 
          style={{ 
            height: 18, 
            width: "70%", 
            borderRadius: 4,
            marginBottom: 12 
          }} 
        />

        {/* Shimmer Subtitle Line 1 */}
        <div 
          className="skeleton-shimmer" 
          style={{ 
            height: 13, 
            width: "90%", 
            borderRadius: 4,
            marginBottom: 6 
          }} 
        />
        {/* Shimmer Subtitle Line 2 */}
        <div 
          className="skeleton-shimmer" 
          style={{ 
            height: 13, 
            width: "75%", 
            borderRadius: 4,
            marginBottom: 16 
          }} 
        />

        {/* Shimmer Button/CTA Line */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: 12,
          marginTop: "auto",
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div 
            className="skeleton-shimmer" 
            style={{ 
              flex: 1, 
              height: 36, 
              borderRadius: 8 
            }} 
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(23, 26, 35, 0.4) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(23, 26, 35, 0.4) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
