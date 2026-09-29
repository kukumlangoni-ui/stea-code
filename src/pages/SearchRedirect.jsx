import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSmartDirectRoute, searchIndex } from "../data/searchIndex.js";

export default function SearchRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q") || "";
    setSearchQ(q);
    const directTarget = getSmartDirectRoute(q);
    
    if (directTarget) {
      const cleanPath = directTarget.startsWith("/") ? directTarget : `/${directTarget}`;
      navigate(cleanPath, { replace: true });
    } else {
      const norm = q.trim().toLowerCase();
      if (!norm) {
        setResults([]);
        return;
      }
      const filtered = searchIndex.filter(item => {
        return (
          item.title.toLowerCase().includes(norm) ||
          item.description.toLowerCase().includes(norm) ||
          item.category.toLowerCase().includes(norm) ||
          item.keywords.some(kw => kw.toLowerCase().includes(norm))
        );
      });
      setResults(filtered);
    }
  }, [location.search, navigate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  return (
    <div style={{ background: "#05060a", minHeight: "100vh", color: "#fff", paddingTop: 100, paddingBottom: 60 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, fontWeight: 900, marginBottom: 8, background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.73))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          STEA Smart Search
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 32 }}>
          Utafutaji wenye akili mahali pamoja. Umetafuta: <span style={{ color: "#F5A623", fontWeight: 700 }}>"{searchQ}"</span>
        </p>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 12, marginBottom: 40 }}>
          <input 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Tafuta bidhaa, mitihani ya NECTA, prompts au kozi..."
            style={{ flex: 1, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", padding: "0 16px", fontSize: 14, outline: "none", transition: "all 0.2s" }}
            onFocus={e => e.currentTarget.style.borderColor = "#F5A623"}
            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
          />
          <button type="submit" style={{ height: 50, padding: "0 24px", background: "#F5A623", color: "#111", border: "none", borderRadius: 14, fontWeight: 900, cursor: "pointer", fontSize: 14 }}>
            Tafuta
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {results.length > 0 ? (
            results.map((item, idx) => (
              <Link 
                key={idx}
                to={item.route}
                style={{ display: "flex", flexDirection: "column", gap: 8, padding: 24, background: "#0d0f1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, textDecoration: "none", color: "#fff", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#F5A623"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#F5A623", background: "rgba(245,166,35,0.12)", padding: "2px 8px", borderRadius: 4 }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                    Fungua kurasa →
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 0", color: "#fff" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
                  {item.description}
                </p>
              </Link>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", background: "#0d0f1a", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24 }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 16 }}>🔍</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>
                Hakuna Matokeo Kamili yaliyopatikana
              </h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, maxWidth: 450, margin: "8px auto 0", lineHeight: 1.6 }}>
                Hukupata kile ulichotafuta? Jaribu kutafuta maneno kama "simu", "necta", "laptop", "kazi" au fungua kurasa ya central menu kuona zote.
              </p>
              <Link to="/menu" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#F5A623", fontWeight: 800, textDecoration: "none" }}>
                Fungua Menu Kuu ya STEA →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
