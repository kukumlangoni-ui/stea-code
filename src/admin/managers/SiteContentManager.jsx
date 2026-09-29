import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, doc, onSnapshot, setDoc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ImageUploadField } from "../AdminUI.jsx";
import FAQManager from "./FAQManager.jsx";

const G = "#F5A623", G2 = "#FFD17C";

export default function SiteContentManager() {
  const [subTab, setSubTab] = useState("about_us");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const [hero, setHero] = useState({ title1: "", title2: "", topSubtitle: "", subtitle: "", quote: "", typedStrings: [] });
  const [aboutUs, setAboutUs] = useState({ title: "", shortDesc: "", fullDesc: "", mission: "", vision: "", btnText: "", btnLink: "" });
  const [aboutCreator, setAboutCreator] = useState({ fullName: "", title: "", shortBio: "", fullBio: "", origin: "", location: "", education: "", career: "", hobbies: "", contactText: "", contactLink: "", imageUrl: "", imageAlt: "" });
  const [contactInfo, setContactInfo] = useState({ whatsapp: "", email: "", safariCta: "", supportMsg: "", officeText: "", socialLinks: { facebook: "", twitter: "", instagram: "", youtube: "", linkedin: "", tiktok: "" } });
  const [stats, setStats] = useState({ websitesBuilt: "", activeProjects: "", launchDate: "", achievements: "" });
  const [websitesSettings, setWebsitesSettings] = useState({ adBlockerGuideUrl: "", adBlockerNoticeEnabled: false, customNoticeText: "", videoGuideUrl: "" });

  useEffect(() => {
    if (!db) return;
    const docs = ["hero", "about_us", "about_creator", "contact_info", "stats", "websites"];
    const unsubs = docs.map(id => 
      onSnapshot(doc(db, "site_settings", id), (snap) => {
        if (snap.exists()) {
          const data = snap.data().data;
          if (id === "hero") setHero(prev => ({ ...prev, ...data }));
          if (id === "about_us") setAboutUs(prev => ({ ...prev, ...data }));
          if (id === "about_creator") setAboutCreator(prev => ({ ...prev, ...data }));
          if (id === "contact_info") setContactInfo(prev => ({ ...prev, ...data }));
          if (id === "stats") setStats(prev => ({ ...prev, ...data }));
          if (id === "websites") setWebsitesSettings(prev => ({ ...prev, ...data }));
        }
      })
    );
    return () => unsubs.forEach(u => u());
  }, [db]);

  const saveSettings = async (id, data) => {
    setLoading(true);
    try {
      await setDoc(doc(db, "site_settings", id), { data, updatedAt: serverTimestamp() });
      toast_("Imesahihishwa kikamilifu!");
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, OperationType.WRITE, `site_settings/${id}`);
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const SUB_TABS = [
    { id: "hero", label: "Hero Section", icon: "⚡" },
    { id: "about_us", label: "About Us", icon: "🏢" },
    { id: "about_creator", label: "Creator", icon: "👨‍💻" },
    { id: "contact_info", label: "Contact", icon: "📞" },
    { id: "stats", label: "Stats", icon: "📈" },
    { id: "websites", label: "Websites Hub", icon: "🌐" },
    { id: "faq", label: "FAQ", icon: "❓" },
  ];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{ border: "none", borderRadius: 12, padding: "10px 18px", cursor: "pointer", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap",
              background: subTab === t.id ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.06)", color: subTab === t.id ? "#111" : "rgba(255,255,255,.6)",
              display: "flex", alignItems: "center", gap: 8 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24 }}>
        {subTab === "hero" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>⚡ Hero Section Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Title Part 1 (White)"><Input value={hero.title1} onChange={e => setHero({ ...hero, title1: e.target.value })} placeholder="SwahiliTech" /></Field>
              <Field label="Title Part 2 (Gradient)"><Input value={hero.title2} onChange={e => setHero({ ...hero, title2: e.target.value })} placeholder="Elite Academy" /></Field>
            </div>
            <Field label="Top Subtitle"><Input value={hero.topSubtitle} onChange={e => setHero({ ...hero, topSubtitle: e.target.value })} placeholder="Teknolojia kwa Kiswahili 🇹🇿" /></Field>
            <Field label="Main Description"><Textarea value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} placeholder="STEA inaleta tech tips..." style={{ minHeight: 80 }} /></Field>
            <Field label="Yearly Quote"><Input value={hero.quote} onChange={e => setHero({ ...hero, quote: e.target.value })} placeholder="“Mwaka 2026 ni mwaka wako...”" /></Field>
            
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>Typed Strings (Animated Text)</label>
              {(hero.typedStrings || []).map((str, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8 }}>
                  <Input value={str} onChange={e => {
                    const newStrings = [...hero.typedStrings];
                    newStrings[idx] = e.target.value;
                    setHero({ ...hero, typedStrings: newStrings });
                  }} />
                  <button onClick={() => setHero({ ...hero, typedStrings: hero.typedStrings.filter((_, i) => i !== idx) })}
                    style={{ background: "rgba(255,0,0,.1)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#ff4444" }}>
                    🗑️
                  </button>
                </div>
              ))}
              <button onClick={() => setHero({ ...hero, typedStrings: [...(hero.typedStrings || []), ""] })}
                style={{ background: "rgba(255,255,255,.05)", border: "1px dashed rgba(255,255,255,.2)", borderRadius: 8, padding: 8, cursor: "pointer", color: G }}>
                + Add String
              </button>
            </div>

            <Btn onClick={() => saveSettings("hero", hero)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "about_us" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>🏢 About STEA / About Us</h3>
            <Field label="Section Title"><Input value={aboutUs.title} onChange={e => setAboutUs({ ...aboutUs, title: e.target.value })} placeholder="Kuhusu STEA" /></Field>
            <Field label="Short Description"><Textarea value={aboutUs.shortDesc} onChange={e => setAboutUs({ ...aboutUs, shortDesc: e.target.value })} placeholder="Short intro..." style={{ minHeight: 60 }} /></Field>
            <Field label="Full Description"><Textarea value={aboutUs.fullDesc} onChange={e => setAboutUs({ ...aboutUs, fullDesc: e.target.value })} placeholder="Detailed about us..." style={{ minHeight: 120 }} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Mission"><Textarea value={aboutUs.mission} onChange={e => setAboutUs({ ...aboutUs, mission: e.target.value })} placeholder="Our mission..." style={{ minHeight: 80 }} /></Field>
              <Field label="Vision"><Textarea value={aboutUs.vision} onChange={e => setAboutUs({ ...aboutUs, vision: e.target.value })} placeholder="Our vision..." style={{ minHeight: 80 }} /></Field>
            </div>
            <Btn onClick={() => saveSettings("about_us", aboutUs)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "about_creator" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>👨‍💻 About the Creator</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Creator Full Name"><Input value={aboutCreator.fullName} onChange={e => setAboutCreator({ ...aboutCreator, fullName: e.target.value })} placeholder="Isaya Hans Masika" /></Field>
              <Field label="Title / Role"><Input value={aboutCreator.title} onChange={e => setAboutCreator({ ...aboutCreator, title: e.target.value })} placeholder="Founder & Developer" /></Field>
            </div>
            <ImageUploadField label="Creator Image" value={aboutCreator.imageUrl} onChange={val => setAboutCreator({ ...aboutCreator, imageUrl: val })} />
            <Field label="Short Bio"><Textarea value={aboutCreator.shortBio} onChange={e => setAboutCreator({ ...aboutCreator, shortBio: e.target.value })} placeholder="One sentence bio..." style={{ minHeight: 60 }} /></Field>
            <Field label="Full Bio"><Textarea value={aboutCreator.fullBio} onChange={e => setAboutCreator({ ...aboutCreator, fullBio: e.target.value })} placeholder="Detailed background..." style={{ minHeight: 120 }} /></Field>
            <Btn onClick={() => saveSettings("about_creator", aboutCreator)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "contact_info" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>📞 Contact & Support Info</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="WhatsApp Number"><Input value={contactInfo.whatsapp} onChange={e => setContactInfo({ ...contactInfo, whatsapp: e.target.value })} placeholder="255..." /></Field>
              <Field label="Email Address"><Input value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="support@stea.africa" /></Field>
              <Field label="Safari CTA (WA or URL)"><Input value={contactInfo.safariCta} onChange={e => setContactInfo({ ...contactInfo, safariCta: e.target.value })} placeholder="+255... or https://..." /></Field>
            </div>
            <Field label="Support Message"><Textarea value={contactInfo.supportMsg} onChange={e => setContactInfo({ ...contactInfo, supportMsg: e.target.value })} placeholder="How can we help you?" style={{ minHeight: 60 }} /></Field>
            <Btn onClick={() => saveSettings("contact_info", contactInfo)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "stats" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>📈 Founder & Website Stats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Websites Built"><Input value={stats.websitesBuilt} onChange={e => setStats({ ...stats, websitesBuilt: e.target.value })} placeholder="50+" /></Field>
              <Field label="Active Projects"><Input value={stats.activeProjects} onChange={e => setStats({ ...stats, activeProjects: e.target.value })} placeholder="12" /></Field>
            </div>
            <Btn onClick={() => saveSettings("stats", stats)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "websites" && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>🌐 Website Hub Platform Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Ad Blocker Guide URL"><Input value={websitesSettings.adBlockerGuideUrl} onChange={e => setWebsitesSettings({ ...websitesSettings, adBlockerGuideUrl: e.target.value })} placeholder="Link to guide video or page" /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <Field label="Video Guide URL"><Input value={websitesSettings.videoGuideUrl} onChange={e => setWebsitesSettings({ ...websitesSettings, videoGuideUrl: e.target.value })} placeholder="Link to video for AdBlock education" /></Field>
              <Field label="Custom Notice Text"><Input value={websitesSettings.customNoticeText} onChange={e => setWebsitesSettings({ ...websitesSettings, customNoticeText: e.target.value })} placeholder="Some websites may contain ads, popups or regional restrictions..." /></Field>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", margin: "8px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>
                <input type="checkbox" checked={websitesSettings.adBlockerNoticeEnabled} onChange={e => setWebsitesSettings({ ...websitesSettings, adBlockerNoticeEnabled: e.target.checked })} style={{ width: 18, height: 18, accentColor: G }} />
                Ad Blocker Notice Enabled
              </label>
            </div>
            <Btn onClick={() => saveSettings("websites", websitesSettings)} disabled={loading}>{loading ? "Inahifadhi..." : "💾 Hifadhi Mabadiliko"}</Btn>
          </div>
        )}

        {subTab === "faq" && <FAQManager />}
      </div>
    </div>
  );
}
