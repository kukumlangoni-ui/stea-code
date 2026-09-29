import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Compass } from "lucide-react";
import BackButton from "../components/BackButton.jsx";

const G = "#F5A623";

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px", background: "#050505" }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton fallback="/" />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>Under Construction</h1>
        </div>
      </header>

      {/* Small Inline Card Message */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(245,166,35,0.15)",
        borderRadius: "16px",
        padding: "24px 20px",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{ fontSize: "28px", marginBottom: "12px" }}>🚧</div>
        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.9)",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
          fontWeight: 600
        }}>
          Inatengenezwa — jaribu sehemu nyingine kwa sasa.
        </p>
        <p style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.5)",
          lineHeight: "1.5",
          margin: "0 0 20px 0"
        }}>
          🚀 Kipengele hiki kinaendelea kutengenezwa. Tunarudi hivi karibuni na uzoefu bora zaidi.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ flex: 1, padding: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", borderRadius: "10px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <ArrowLeft size={14} /> Go Back
          </button>
          <button 
            onClick={() => navigate("/")} 
            style={{ flex: 1, padding: "10px", border: "none", background: G, color: "#111", borderRadius: "10px", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Home size={14} /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
