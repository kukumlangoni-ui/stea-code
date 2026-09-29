import React, { useState } from "react";
import { getFirebaseDb, collection, addDoc, serverTimestamp } from "../firebase.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

export default function SellerApplicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", businessType: "Electronics", location: "" });
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
      await addDoc(collection(db, "seller_applications"), {
        ...form,
        userId: user.uid,
        email: user.email,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Error submitting application");
    }
    setLoading(false);
  };

  if (success) return (
    <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", background: "#05060a", color: "#fff" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Maombi Yamepokelewa</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 10 }}>Asante kwa kutaka kuwa muuzaji. Timu yetu itapitia maombi yako na kuwasiliana nawe hivi karibuni.</p>
        <button onClick={() => navigate("/duka")} style={{ marginTop: 24, padding: "12px 24px", background: "#F5A623", color: "#111", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Rudi Sokoni</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", padding: "60px 20px" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", background: "#111218", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, marginBottom: 8, color: "#F5A623" }}>Uza na STEA</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 32 }}>Jaza fomu hii kuanza kuuza bidhaa zako kwa wanafunzi 50,00+ wa vyuo vikuu.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Jina kamili au la Biashara</label>
            <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Mf. Kampuni X Mwanza" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Namba ya Simu (WhatsApp)</label>
            <input required value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="07XX XXX XXX" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Aina ya Bidhaa</label>
            <select required value={form.businessType} onChange={e=>setForm({...form, businessType: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none", appearance: "none" }}>
              <option value="Electronics">Electronics (Simu, PC)</option>
              <option value="Clothes">Clothing & Shoes</option>
              <option value="Room Essentials">Room Essentials (Magodoro, Meza)</option>
              <option value="Stationery">Stationery</option>
              <option value="Other">Nyinginezo</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Eneo/Chuo chako</label>
            <input required value={form.location} onChange={e=>setForm({...form, location: e.target.value})} placeholder="Mf. UDSM, Dodoma" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", outline: "none" }} />
          </div>
          <button disabled={loading} type="submit" style={{ marginTop: 12, padding: "16px", borderRadius: 12, border: "none", background: "#F5A623", color: "#111", fontWeight: 800, fontSize: 16, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Inatuma..." : "Tuma Maombi"}
          </button>
        </form>
      </div>
    </div>
  );
}
