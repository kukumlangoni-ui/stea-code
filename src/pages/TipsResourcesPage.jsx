/**
 * TipsResourcesPage — /tech/tips-resources
 * Shows published resource cards from tips_resources Firestore collection
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Download, Search, FileText } from "lucide-react";
import { getFirebaseDb, collection, query, onSnapshot, where } from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

function ResourceCard({ item }) {
  const [hov, setHov] = useState(false);
  const [orientation, setOrientation] = useState("landscape");
  const navigate = useNavigate();

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth > naturalHeight) setOrientation("landscape");
    else if (naturalHeight > naturalWidth) setOrientation("portrait");
    else setOrientation("square");
  };

  return (
    <div
      onClick={() => navigate(`/r/${item.slug}`)}
      className={`resource-card ${orientation}`}
      style={{
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        background: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 24,
        overflow: "hidden",
        transition: "all 0.22s cubic-bezier(0.16,1,0.3,1)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 16px 40px rgba(0,0,0,0.4)" : "none",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Thumbnail */}
      <div 
        className={`resource-thumbnail-wrap ${orientation}`}
        style={{ 
          width: "100%", 
          background: "#050505", 
          position: "relative", 
          overflow: "hidden", 
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            onLoad={handleImageLoad}
            className={`resource-thumbnail ${orientation}`}
            style={{ width: "100%", height: "100%", display: "block" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        ) : item.pdfUrl ? (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1f2937, #111827)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "rgba(245,166,35,0.1)", borderRadius: "50%", width: 64, height: 64, display: "grid", placeItems: "center", marginBottom: 12 }}>
              <FileText size={32} color={G} />
            </div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>PDF Document</div>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 48, opacity: 0.5 }}>📋</div>
        )}

        {/* Category badge */}
        {item.category && (
          <div className="resource-badge" style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: G, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase", zIndex: 5 }}>
            {item.category}
          </div>
        )}
        {/* PDF badge */}
        {item.pdfUrl && (
          <div className="resource-pdf-button" style={{ position: "absolute", top: 16, right: 16, background: "rgba(245,166,35,0.9)", color: "#000", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", gap: 4, zIndex: 5 }}>
            <Download size={10} /> PDF
          </div>
        )}
        {/* Featured badge */}
        {item.featured && (
          <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(59,130,246,0.85)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, zIndex: 5 }}>
            ⭐ Featured
          </div>
        )}
      </div>
      <style>{`
        .resources-container {
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
        }
        .resources-grid {
          display: grid;
          gap: 22px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .resources-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .resource-thumbnail-wrap.landscape { aspectRatio: 16 / 9; }
        .resource-thumbnail-wrap.portrait { aspectRatio: 4 / 5; }
        .resource-thumbnail-wrap.square { aspectRatio: 1 / 1; }
        .resource-thumbnail.landscape { object-fit: cover; }
        .resource-thumbnail.portrait { object-fit: contain; background: #050505; }
        .resource-thumbnail.square { object-fit: cover; }

        @media (min-width: 768px) {
          .resource-thumbnail-wrap { max-height: 260px; }
        }
      `}</style>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 8, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.title}
        </h3>
        {item.shortDescription && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.shortDescription}
          </p>
        )}
        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
          {(item.steps || []).length > 0 && <span>{(item.steps || []).length} hatua</span>}
          {(item.links || []).length > 0 && <span>{(item.links || []).length} viungo</span>}
        </div>
        {/* Open arrow and PDF button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: G, fontWeight: 800, fontSize: 13 }}>
            Fungua
            <ArrowRight size={14} style={{ transform: hov ? "translateX(4px)" : "", transition: "transform 0.2s" }} />
          </div>

          {item.pdfUrl && (
            <button 
              onClick={(e) => { e.stopPropagation(); window.open(item.pdfUrl, "_blank"); }}
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, color: G, fontWeight: 700, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}
            >
              <Download size={14} /> View PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TipsResourcesPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Zote");

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, "resources"));
    const unsub = onSnapshot(q, (snap) => {
      let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter out drafts on the client side to bypass any index/cache issues
      items = items.filter(item => {
        const stat = String(item.status).toLowerCase();
        return stat === "published" || stat === "active" || item.published === true || item.isPublished === true || String(item.visibility).toLowerCase() === "public";
      });

      items.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setResources(items);
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const categories = ["Zote", ...Array.from(new Set(resources.map(r => r.category).filter(Boolean)))];

  const filtered = resources.filter(r => {
    const matchCat = activeCategory === "Zote" || r.category === activeCategory;
    const matchSearch = !search || (r.title || "").toLowerCase().includes(search.toLowerCase()) || (r.shortDescription || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = resources.filter(r => r.featured);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", paddingBottom: 80 }}>
      {/* Hero — extra top padding so back nav clears sticky header (Navbar uses negative margin on main) */}
      <section
        style={{
          padding: "clamp(104px, 16vw, 132px) 20px 40px",
          background: "radial-gradient(circle at top, rgba(245,166,35,0.07) 0%, transparent 55%)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <button
            type="button"
            onClick={() => navigate("/tech")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 28,
              position: "relative",
              zIndex: 2,
            }}
          >
            <ArrowLeft size={14} /> Tech Hub
          </button>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(245,166,35,0.1)", borderRadius: 20, color: G, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            📖 Tips Resources
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(26px,4vw,44px)", fontWeight: 900, lineHeight: 1.2, marginBottom: 14 }}>
            Guides kutoka{" "}
            <span style={{ color: G }}>Instagram</span>
          </h1>
          <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 600 }}>
            Guides, PDFs, hatua kwa hatua, na nyenzo nyingine kutoka kwenye machapisho yetu ya Instagram.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {/* Featured */}
        {!search && activeCategory === "Zote" && featured.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>⭐ Featured</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
              {featured.map(r => <ResourceCard key={r.id} item={r} />)}
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 520, marginBottom: 24 }}>
          <Search size={16} color="rgba(255,255,255,.35)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tafuta resource..."
            style={{ width: "100%", height: 46, borderRadius: 23, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#fff", paddingLeft: 44, paddingRight: 16, outline: "none", fontSize: 14, boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Category tabs */}
        {categories.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 28, scrollbarWidth: "none" }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                style={{ padding: "8px 18px", borderRadius: 20, border: `1px solid ${activeCategory === c ? G : "rgba(255,255,255,.08)"}`, background: activeCategory === c ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,.03)", color: activeCategory === c ? G : "rgba(255,255,255,.55)", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 20 }}>
          {loading ? "Inapakia..." : `${filtered.length} resources zinapatikana`}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="resources-container">
            <div className="resources-grid">
              {[1,2,3,4].map(i => (
                <div key={i} style={{ borderRadius: 24, background: "rgba(255,255,255,0.03)", aspectRatio: "16/9", border: "1px solid rgba(255,255,255,.05)" }} />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {search ? "Hakuna resource inayofanana" : "Bado hakuna resources"}
            </h3>
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>
              {search ? "Jaribu maneno mengine" : "Resources zitaonekana hapa baada ya kuchapishwa na admin."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} style={{ marginTop: 16, background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                Onyesha Zote →
              </button>
            )}
          </div>
        ) : (
          <div className="resources-container">
            <div className="resources-grid">
              {filtered.map(r => <ResourceCard key={r.id} item={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
