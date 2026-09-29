import React, { useState } from "react";
import { Send } from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";
import { G, G2 } from "./ui/LayoutUtils.jsx";

export function SupportForm() {
  const isMobile = useMobile();
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "General",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, "support_messages", Date.now().toString()), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      setSent(true);
      (async () => { const { default: confetti } = await import("canvas-confetti"); confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } }); })();
    } catch (err) {
      console.error(err);
      alert("Samahani, imeshindikana kutuma ujumbe.");
    } finally {
      setLoading(false);
    }
  };

  if (sent)
    return (
      <div style={{ textAlign: "center", padding: isMobile ? "30px 16px" : "40px 20px" }}>
        <div
          style={{
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            borderRadius: "50%",
            background: "rgba(16,185,129,.1)",
            color: "#10b981",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          <Send size={28} />
        </div>
        <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, marginBottom: 8 }}>Asante!</h3>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: isMobile ? 13 : 15 }}>
          Ujumbe wako umepokelewa. Tutakujibu hivi karibuni.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: isMobile ? 12 : 20, padding: isMobile ? "0 4px" : "0" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 20 }}>
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jina lako"
          style={{
            height: isMobile ? 46 : 54,
            borderRadius: isMobile ? 10 : 14,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.05)",
            color: "#fff",
            padding: "0 14px",
            outline: "none",
            fontSize: isMobile ? 13 : 16,
          }}
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Barua pepe (Email)"
          style={{
            height: isMobile ? 46 : 54,
            borderRadius: isMobile ? 10 : 14,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.05)",
            color: "#fff",
            padding: "0 14px",
            outline: "none",
            fontSize: isMobile ? 13 : 16,
          }}
        />
      </div>
      <select
        value={form.topic}
        onChange={(e) => setForm({ ...form, topic: e.target.value })}
        style={{
          height: isMobile ? 46 : 54,
          borderRadius: isMobile ? 10 : 14,
          border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(255,255,255,.05)",
          color: "#fff",
          padding: "0 14px",
          outline: "none",
          fontSize: isMobile ? 13 : 16,
        }}
      >
        <option value="General">General Inquiry</option>
        <option value="Courses">Courses Support</option>
        <option value="Digital Tools">Digital Tools</option>
        <option value="Technical">Technical Issue</option>
      </select>
      <textarea
        required
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="Ujumbe wako..."
        style={{
          height: isMobile ? 80 : 120,
          borderRadius: isMobile ? 10 : 14,
          border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(255,255,255,.05)",
          color: "#fff",
          padding: "14px",
          outline: "none",
          resize: "none",
          fontSize: isMobile ? 13 : 16,
        }}
      />
      <button
        disabled={loading}
        style={{
          height: isMobile ? 46 : 54,
          borderRadius: isMobile ? 12 : 16,
          border: "none",
          background: `linear-gradient(135deg,${G},${G2})`,
          color: "#111",
          fontWeight: 900,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: isMobile ? 14 : 16,
          transition: ".2s"
        }}
      >
        {loading ? (
          "Inatuma..."
        ) : (
          <>
            <Send size={isMobile ? 14 : 18} /> Tuma Ujumbe
          </>
        )}
      </button>
    </form>
  );
}
