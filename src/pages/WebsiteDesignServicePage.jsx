import React, { useState } from "react";
import { getFirebaseDb, collection, addDoc, serverTimestamp } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { Globe, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

export default function WebsiteDesignServicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [form, setForm] = useState({ name: "", phone: "", businessType: "", websiteType: "E-Commerce", budget: "" });
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
        service: "Website Design",
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
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, lineHeight: 1.6 }}>Asante kwa kutuchagua STEA. Timu yetu ya watengenezaji itawasiliana nawe hivi karibuni kupitia WhatsApp kujadili mradi wako.</p>
        <button onClick={() => navigate("/")} style={{ marginTop: 28, padding: "14px 28px", background: G, color: "#111", border: "none", borderRadius: 12, fontWeight: 800, cursor: "pointer", width: "100%" }}>Rudi Mwanzo</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", padding: isMobile ? "20px 16px 80px" : "60px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 32, flexDirection: isMobile ? "column" : "row" }}>
        
        {/* Service Details */}
        <div style={{ flex: 1 }}>
          <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
            <ArrowLeft size={16} /> Rudi
          </button>
          
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(245,166,35,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Globe color={G} size={32} />
          </div>
          
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: isMobile ? 32 : 42, margin: "0 0 16px", lineHeight: 1.1 }}>Website Design<br/><span style={{ color: G }}>& Systems</span></h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>Tunatengeneza website za kisasa, mifumo ya mauzo, na blog zenye ubora wa kimataifa. Weka biashara yako mtandaoni leo.</p>
          
          <div style={{ display: "grid", gap: 16 }}>
            {[
              { icon: "🛒", title: "E-Commerce", desc: "Uza bidhaa zako mtandaoni kwa urahisi." },
              { icon: "🏢", title: "Business Portfolio", desc: "Website kwa ajili ya ofisi, NGOs, au shule." },
              { icon: "📝", title: "Blog & News", desc: "Mililiki blog ya habari yenye ads." },
              { icon: "⚡", title: "Custom System", desc: "Mfumo wa shule au mahesabu ya duka." }
            ].map(f => (
              <div key={f.title} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 24 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Form */}
        <div style={{ width: isMobile ? "100%" : 380, flexShrink: 0 }}>
          <div style={{ background: "#111218", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 100 }}>
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, marginBottom: 24 }}>Omba Huduma Sasa</h3>
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
                <input required value={form.businessType} onChange={e=>setForm({...form, businessType: e.target.value})} placeholder="Mf. Duka la Nguo, Shule..." style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Aina ya Website</label>
                <select required value={form.websiteType} onChange={e=>setForm({...form, websiteType: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15, appearance: "none" }}>
                  <option value="E-Commerce">E-Commerce (Pamoja na Malipo)</option>
                  <option value="Portfolio">Business Portfolio / NGO</option>
                  <option value="Blog">Blog / Habari</option>
                  <option value="Custom">Custom System (Mfumo maalum)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Bajeti Yako (Tsh)</label>
                <select required value={form.budget} onChange={e=>setForm({...form, budget: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", fontSize: 15, appearance: "none" }}>
                  <option value="" disabled>Chagua Bajeti...</option>
                  <option value="150K - 300K">150,000 - 300,000 Tsh</option>
                  <option value="300K - 500K">300,000 - 500,000 Tsh</option>
                  <option value="500K - 1M">500,000 - 1,000,000 Tsh</option>
                  <option value="1M+">Zaidi ya Milioni 1 (Mfumo mkubwa)</option>
                </select>
              </div>
              <button disabled={loading} type="submit" style={{ marginTop: 8, padding: "16px", borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, fontSize: 16, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Inatuma..." : "Tuma Maombi Sasa"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
