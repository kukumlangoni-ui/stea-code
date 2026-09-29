import React, { useState } from "react";
import { getFirebaseDb, collection, addDoc, serverTimestamp } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

export default function ServiceRequestPage({ serviceName, icon: Icon, description }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [form, setForm] = useState({ name: "", phone: "", businessType: "", budget: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const db = getFirebaseDb();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Tafadhali ingia au jisajili kwanza.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "service_requests"), {
        ...form,
        userId: user.uid,
        email: user.email,
        service: serviceName,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Kuna tatizo limetokea.");
    }
    setLoading(false);
  };

  if (success) return (
    <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", background: "#05060a", color: "#fff" }}>
      <div style={{ textAlign: "center", maxWidth: 450, padding: 24, background: "#111218", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
        <CheckCircle2 color={G} size={64} style={{ margin: "0 auto 20px" }} />
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24 }}>Ombi Limepokelewa!</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, lineHeight: 1.6 }}>Asante kwa kutuchagua STEA. Timu yetu itawasiliana nawe hivi karibuni kupitia WhatsApp.</p>
        <button onClick={() => navigate("/")} style={{ marginTop: 28, padding: "14px 28px", background: G, color: "#111", border: "none", borderRadius: 12, fontWeight: 800, cursor: "pointer", width: "100%" }}>Rudi Mwanzo</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", padding: isMobile ? "20px 16px 80px" : "60px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Rudi
        </button>
        
        <div style={{ background: "#111218", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, marginBottom: 8, color: "#F5A623" }}>{serviceName}</h1>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>{description}</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Jina Lako Kamili</label>
              <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Mf. John Doe" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Namba ya WhatsApp</label>
              <input required value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="07XX XXX XXX" style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Aina ya Biashara</label>
              <input required value={form.businessType} onChange={e=>setForm({...form, businessType: e.target.value})} placeholder="Mf. Duka, Shule, Blog..." style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15 }} />
            </div>
            <button disabled={loading} type="submit" style={{ marginTop: 8, padding: "16px", borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, fontSize: 16, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Inatuma..." : "Tuma Maombi Sasa"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
