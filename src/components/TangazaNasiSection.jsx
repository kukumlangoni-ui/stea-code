import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { TangazaNasiFormContent } from './services/TangazaNasiForm';

const TangazaNasiSection = () => {
  const G = "#F5A623";

  return (
    <section style={{ padding: "80px 0", background: "#05070D", color: "#fff", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 60, alignItems: "start" }}>
          
          {/* Left Side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            style={{ paddingTop: 20 }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(245,166,35,0.1)", borderRadius: 20, color: G, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
              Business Solutions
            </div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-.04em" }}>
              Tangaza Nasi <br/>
              <span style={{ color: G }}>Kuza Biashara Yako</span>
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              Tangaza biashara yako kupitia STEA na ufikie maelfu ya watumiaji wa teknolojia Tanzania kwa urahisi na gharama nafuu.
            </p>
            
            <div style={{ display: "grid", gap: 20 }}>
              {[
                { t: 'Fikia maelfu ya watumiaji', d: 'Watumiaji wetu ni vijana na wadau wa tech.' },
                { t: 'Kuza brand yako kwa haraka', d: 'Pata visibility kubwa ndani ya muda mfupi.' },
                { t: 'Gharama nafuu', d: 'Tuna vifurushi vinavyoendana na kila aina ya bajeti.' }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                    <CheckCircle color="#10b981" size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{item.t}</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 48 }}>
              <a 
                href="https://wa.me/255757053354?text=Hello%20STEA%20Manager,%20I%20want%20to%20advertise%20on%20STEA." 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#25d366", padding: "16px 32px", borderRadius: 16, color: "#fff", fontWeight: 900, fontSize: 16, textDecoration: "none", boxShadow: "0 10px 25px rgba(37,211,102,0.3)", transition: "all 0.3s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}
              >
                <MessageCircle size={20} /> Chat on WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }} 
            style={{ background: "rgba(255,255,255,0.02)", padding: "clamp(24px, 5vw, 48px)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}
          >
            <TangazaNasiFormContent isModal={false} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TangazaNasiSection;
