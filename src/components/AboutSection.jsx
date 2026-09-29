import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Sparkles, ShoppingBag, Megaphone, CheckCircle, Target, Eye, Users } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const AboutSection = () => {
  const { t } = useSettings();
  const G = "#F5A623";

  const offers = [
    { icon: <GraduationCap size={24} />, label: t('about_offer_1') },
    { icon: <Briefcase size={24} />, label: t('about_offer_2') },
    { icon: <Sparkles size={24} />, label: t('about_offer_3') },
    { icon: <ShoppingBag size={24} />, label: t('about_offer_4') },
    { icon: <Megaphone size={24} />, label: t('about_offer_5') },
  ];

  const whys = [t('about_why_1'), t('about_why_2'), t('about_why_3'), t('about_why_4')];

  return (
    <section style={{ padding: "80px 20px", background: "#05070D", color: "#fff" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, marginBottom: 16 }}>{t('about_title')}</h2>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.7)", maxWidth: 700, margin: "0 auto" }}>{t('about_desc')}</p>
          <p style={{ color: G, fontWeight: 700, marginTop: 20, fontSize: 18 }}>{t('about_tagline')}</p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 60 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{t('about_offer_title')}</h3>
            <div style={{ display: "grid", gap: 16 }}>
              {offers.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                  <div style={{ color: G }}>{o.icon}</div>
                  {o.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Target color={G} />
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t('about_mission_title')}</h3>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>{t('about_mission_desc')}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Eye color={G} />
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>{t('about_vision_title')}</h3>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>{t('about_vision_desc')}</p>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", padding: 40, borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, textAlign: "center" }}>{t('about_why_title')}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {whys.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", padding: "16px", borderRadius: 12 }}>
                <CheckCircle size={18} color={G} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${G}20, transparent)`, padding: 40, borderRadius: 24, border: `1px solid ${G}40`, textAlign: "center" }}>
          <Users size={40} color={G} style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{t('about_partner_title')}</h3>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)" }}>{t('about_partner_desc')}</p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
