import React, { useState } from "react";
import { LayoutDashboard, User, ChevronLeft, ShieldCheck } from "lucide-react";
import TechContentManager from "./managers/TechContentManager.jsx";
import ExamsHubManager from "./ExamsHubManager.jsx";
import MarketplaceManager from "./MarketplaceManager.jsx";
import { G, G2 } from "./AdminUI.jsx";

export default function ManagerDashboard({ user, onBack }) {
  const [section, setSection] = useState("dashboard");
  const sector = user?.sector || "general";

  const SECTIONS = [
    { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "manage", icon: <ShieldCheck size={18} />, label: `Manage ${sector.replace('_', ' ')}` },
    { id: "profile", icon: <User size={18} />, label: "My Profile" },
  ];

  const renderContent = () => {
    switch (section) {
      case "dashboard":
        return (
          <div style={{ padding: 20 }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, marginBottom: 24 }}>
              Habari, <span style={{ color: G }}>{user?.displayName || "Manager"}</span>!
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              <div style={{ background: "#141823", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Role</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: G }}>Sector Manager</div>
              </div>
              <div style={{ background: "#141823", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Assigned Sector</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#56b7ff" }}>{sector.toUpperCase()}</div>
              </div>
              <div style={{ background: "#141823", padding: 24, borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Approval Rights</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: user?.canApprove ? "#00c48c" : "#ff4444" }}>
                  {user?.canApprove ? "Enabled ✅" : "Disabled"}
                </div>
              </div>
            </div>
          </div>
        );
      case "manage":
        if (sector === "marketplace") return <MarketplaceManager user={user} />;
        if (sector === "exams") return <ExamsHubManager user={user} />;
        return <TechContentManager collectionName={sector === "tech_tips" ? "tips" : sector} user={user} />;
      default:
        return <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.3)" }}>Hii sehemu inakuja hivi karibuni...</div>;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b0f", color: "#fff" }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: "1px solid rgba(255,255,255,.05)", background: "#0d0f17", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "30px 24px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${G}, ${G2})`, display: "grid", placeItems: "center", color: "#111", fontWeight: 900 }}>S</div>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>STEA <span style={{ color: G }}>MANAGER</span></span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Manager Dashboard</div>
        </div>

        <div style={{ padding: "20px 12px", flex: 1 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 4,
                background: section === s.id ? "rgba(245,166,35,.1)" : "transparent", color: section === s.id ? G : "rgba(255,255,255,.5)", fontWeight: section === s.id ? 700 : 500, transition: "all .2s" }}>
              {s.icon}
              <span style={{ fontSize: 14 }}>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <button onClick={onBack} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <ChevronLeft size={16} /> Back to Site
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 40 }}>
        {renderContent()}
      </div>
    </div>
  );
}
