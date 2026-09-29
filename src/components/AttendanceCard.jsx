import { QrCode, MapPin, BarChart3 } from "lucide-react";

export function AttendanceCard({ onClick }) {
  return (
    <div className="glass-card" style={{ borderRadius: 24, padding: 24, cursor: "pointer", transition: "transform 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div className="stea-icon-box glass" style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center" }}>
          <QrCode size={24} color="#F5A623" />
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, background: "rgba(245, 166, 35, 0.2)", color: "#F5A623", padding: "4px 8px", borderRadius: 8, textTransform: "uppercase" }}>
          SMART CAMPUS
        </div>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>STEA Classroom</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginBottom: 24, lineHeight: 1.5 }}>
        Mfumo wa kisasa wa mahudhurio kwa shule, vyuo na walimu. Scan QR, verify GPS, tunza kumbukumbu.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <div style={{ background: "rgba(255,255,255,.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <QrCode size={12} color="rgba(255,255,255,.5)" /> QR
          </div>
          <div style={{ background: "rgba(255,255,255,.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12} color="rgba(255,255,255,.5)" /> GPS
          </div>
          <div style={{ background: "rgba(255,255,255,.05)", padding: "4px 8px", borderRadius: 6, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <BarChart3 size={12} color="rgba(255,255,255,.5)" /> Dash
          </div>
      </div>
      <button 
        onClick={onClick}
        style={{ width: "100%", background: "#F5A623", color: "#111", border: "none", padding: "12px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
      >
        Ingia
      </button>
    </div>
  );
}
