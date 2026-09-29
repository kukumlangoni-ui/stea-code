import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Globe, Star, Users, Zap, ArrowRight,
  Search, MapPin, Clock, DollarSign,
  Shield, TrendingUp, MessageCircle,
  X, Send, Home
} from "lucide-react";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { SteaEcosystemBanner, SteaExploreMore } from "../components/SteaEcosystem.jsx";
import SteaHero from "../components/ui/SteaHero.jsx";

// Reusable STEA Main Page Banner
function SteaMainBanner({ isMobile }) {
  const [hov, setHov] = React.useState(false);
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: isMobile ? 16 : 24 }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'linear-gradient(135deg, rgba(245,166,35,0.14), rgba(245,166,35,0.05))' : 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.4))',
          border: `1px solid ${hov ? 'rgba(245,166,35,0.45)' : 'rgba(245,166,35,0.2)'}`,
          borderRadius: 16,
          padding: isMobile ? '14px 16px' : '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          cursor: 'pointer',
          transition: 'all 0.22s ease',
          boxShadow: hov ? '0 8px 28px rgba(245,166,35,0.12)' : '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Home size={16} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>STEA AFRICA</div>
            <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: '#fff' }}>Visit STEA Main Page</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Education · Duka · TechHub · Services</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F5A623', fontWeight: 800, fontSize: 11, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Explore <ArrowRight size={12} style={{ transform: hov ? 'translateX(4px)' : '', transition: 'transform 0.2s' }} />
        </div>
      </div>
    </Link>
  );
}

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD_BG = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

// ── Job Types ────────────────────────────────────────
const JOB_TYPES = [
  { id: "all",        label: "Zote",       icon: "🌐", color: G },
  { id: "remote",     label: "Remote",     icon: "💻", color: "#3b82f6" },
  { id: "local",      label: "Local",      icon: "📍", color: "#10b981" },
  { id: "freelance",  label: "Freelance",  icon: "🎯", color: "#8b5cf6" },
  { id: "internship", label: "Internship", icon: "🎓", color: "#f59e0b" },
];

const SKILLS = [
  "Web Development","Graphic Design","Video Editing","Social Media",
  "Data Entry","Copywriting","Translation","Photography",
  "App Development","Digital Marketing","Customer Service","Accounting",
  "Teaching / Tutoring","Electrical Work","Plumbing","Carpentry",
];

// ── Sample Gigs (shown when Firebase has no data yet) ──
const SAMPLE_GIGS = [
  { id:"g1", title:"Web Developer (React/Node)", type:"remote", budget:"500,000–1,500,000", deadline:"Open", skills:["Web Development","React","Node.js"], location:"Remote", company:"TechStart TZ", logo:"🏢", featured:true, verified:true, desc:"Tunatafuta developer wa React/Node.js kujenga platform mpya. Uzoefu wa miaka 1+ unahitajika. Unaweza kufanya kazi kutoka nyumbani." },
  { id:"g2", title:"Social Media Manager", type:"remote", budget:"300,000–600,000", deadline:"15 Mei 2026", skills:["Social Media","Copywriting","Design"], location:"Remote", company:"Brand Agency DSM", logo:"📱", featured:true, verified:true, desc:"Kutunza accounts za Instagram, Facebook na TikTok kwa mteja wetu. Uzoefu wa miaka 1+ na content creation." },
  { id:"g3", title:"Graphic Designer", type:"freelance", budget:"Per Project", deadline:"Open", skills:["Graphic Design","Photoshop","Illustrator"], location:"Dar es Salaam / Remote", company:"Freelance", logo:"🎨", featured:false, verified:true, desc:"We need a designer to create logos, flyers, and social media posts. Many ongoing projects." },
  { id:"g4", title:"Data Entry Specialist", type:"remote", budget:"200,000–400,000", deadline:"Open", skills:["Data Entry","Excel","Typing"], location:"Remote", company:"DataCorp Africa", logo:"📊", featured:false, verified:true, desc:"Kazi ya kuingiza data kutoka PDF/scan kwenye Excel. Unahitaji kompyuta na internet nzuri. Mwanzo kabisa!" },
  { id:"g5", title:"Video Editor (TikTok/Reels)", type:"freelance", budget:"Per Video", deadline:"Open", skills:["Video Editing","TikTok","CapCut"], location:"Remote", company:"Content Creator", logo:"🎬", featured:false, verified:false, desc:"Looking for a video editor for TikTok and Instagram Reels. Regular weekly work available." },
  { id:"g6", title:"IT Intern — Dar es Salaam", type:"internship", budget:"Allowance + Training", deadline:"30 April 2026", skills:["Web Development","Networking","Support"], location:"Dar es Salaam", company:"TechHub TZ", logo:"🖥️", featured:true, verified:true, desc:"Internship ya miezi 3 kwa vijana wanaosomea IT au Computer Science. Tutakufundisha kwa vitendo. Cheti kinatolarwa." },
  { id:"g7", title:"Copywriter (Kiswahili)", type:"freelance", budget:"Per Article", deadline:"Open", skills:["Copywriting","Translation","SEO"], location:"Remote", company:"Media House", logo:"✍️", featured:false, verified:true, desc:"We need a Kiswahili copywriter for blogs and social media. Writing experience required." },
  { id:"g8", title:"Customer Service Rep", type:"local", budget:"400,000–700,000", deadline:"Open", skills:["Customer Service","Communication"], location:"Arusha", company:"Safari Company", logo:"🏨", featured:false, verified:true, desc:"Mhudumu wa wateja kwa kampuni ya utalii Arusha. Kiingereza kizuri kinahitajika. Uzoefu si lazima." },
];

// ── HOW IT WORKS ──────────────────────────────────────
const HOW_STEPS = [
  { num:"01", icon:<Users size={26}/>, title:"Create Your Profile", desc:"Sign up and build your profile — describe your skills, experience, and the type of work you're looking for.", color:"#3b82f6" },
  { num:"02", icon:<Search size={26}/>, title:"Search & Apply", desc:"Find jobs that match your skills. Apply directly or send your proposal.", color:G },
  { num:"03", icon:<DollarSign size={26}/>, title:"Get Paid", desc:"Complete your work, finish the project, and receive payment safely via M-Pesa or other methods.", color:"#10b981" },
];

// ── WHY STEA GIGS ─────────────────────────────────────
const WHY_ITEMS = [
  { icon:<Shield size={22}/>, title:"Verified Employers", desc:"Waajiri wote wanakaguliwa — hakuna scam. Nafasi halisi tu." },
  { icon:<Globe size={22}/>, title:"Remote Friendly", desc:"Kazi nyingi zinafanywa online — earn kutoka nyumbani kwako Tanzania." },
  { icon:<Star size={22}/>, title:"Beginner Friendly", desc:"Huhitaji uzoefu mkubwa. Kazi nyingi zinakubaliana na beginners." },
  { icon:<Zap size={22}/>, title:"Apply Haraka", desc:"Apply ndani ya dakika chache. Hakuna paperwork nyingi." },
  { icon:<TrendingUp size={22}/>, title:"Jenga Career Yako", desc:"Pata experience, testimonials, na jenga jina lako kidijitali." },
  { icon:<MessageCircle size={22}/>, title:"Msaada wa STEA", desc:"Tuko hapa kukusaidia kupata kazi na kukua. Support ya kweli." },
];

// ── Post Gig Modal (Placeholder) ──────────────────────
function PostGigModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title:"", type:"remote", budget:"", location:"", skills:"", desc:"", company:"", contact:"" });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(4,5,9,.96)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div initial={{ scale:.94, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:.94, opacity:0 }}
        style={{ width:"100%", maxWidth:560, background:CARD_BG, borderRadius:24, border:`1px solid ${BORDER}`, overflow:"hidden", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ padding:"28px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:22, fontWeight:900, margin:0 }}>Tuma Gig / Kazi</h2>
            <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, margin:"4px 0 0" }}>Hatua {step} ya 2</p>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={18}/>
          </button>
        </div>

        {/* Progress */}
        <div style={{ padding:"16px 28px 0", display:"flex", gap:8 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex:1, height:3, borderRadius:99, background: s <= step ? G : "rgba(255,255,255,.1)", transition:"background .3s" }}/>
          ))}
        </div>

        <div style={{ padding:28 }}>
          {step === 1 && (
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Jina la Kazi / Gig" required>
                <input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="mf. Web Developer, Graphic Designer..." style={inputStyle}/>
              </Field>
              <Field label="Aina ya Kazi">
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {JOB_TYPES.filter(t => t.id!=="all").map(t => (
                    <button key={t.id} onClick={() => setForm({...form, type:t.id})}
                      style={{ padding:"8px 14px", borderRadius:10, border:`1px solid ${form.type===t.id ? t.color : BORDER}`, background:form.type===t.id ? `${t.color}15` : "transparent", color:form.type===t.id ? t.color : "rgba(255,255,255,.55)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Mshahara / Budget">
                <input value={form.budget} onChange={e => setForm({...form, budget:e.target.value})} placeholder="mf. 300,000–600,000 au Kwa Project" style={inputStyle}/>
              </Field>
              <Field label="Mahali (Location)">
                <input value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="mf. Dar es Salaam / Remote" style={inputStyle}/>
              </Field>
              <button onClick={() => form.title && setStep(2)} style={{ height:50, borderRadius:14, border:"none", background:form.title ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.05)", color:form.title ? "#111" : "rgba(255,255,255,.3)", fontWeight:900, fontSize:15, cursor:form.title ? "pointer" : "default" }}>
                Endelea →
              </button>
            </div>
          )}
          {step === 2 && (
            <div style={{ display:"grid", gap:18 }}>
              <Field label="Maelezo ya Kazi">
                <textarea value={form.desc} onChange={e => setForm({...form, desc:e.target.value})} placeholder="Eleza kazi, mahitaji, na faida kwa mwombaji..." style={{ ...inputStyle, height:120, resize:"vertical", paddingTop:14 }}/>
              </Field>
              <Field label="Skills Zinazohitajika">
                <input value={form.skills} onChange={e => setForm({...form, skills:e.target.value})} placeholder="mf. React, Photoshop, Kiingereza..." style={inputStyle}/>
              </Field>
              <Field label="Jina la Kampuni / Mtu">
                <input value={form.company} onChange={e => setForm({...form, company:e.target.value})} placeholder="Jina lako au la kampuni yako" style={inputStyle}/>
              </Field>
              <Field label="Mawasiliano (WhatsApp / Email)">
                <input value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} placeholder="WhatsApp au email yako" style={inputStyle}/>
              </Field>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep(1)} style={{ flex:1, height:50, borderRadius:14, border:`1px solid ${BORDER}`, background:"transparent", color:"rgba(255,255,255,.6)", fontWeight:700, cursor:"pointer" }}>← Rudi</button>
                <a href={`https://wa.me/255757053354?text=${encodeURIComponent(`*STEA GIGS — TUMA KAZI*\n\nKazi: ${form.title}\nAina: ${form.type}\nBudget: ${form.budget}\nMahali: ${form.location}\nSkills: ${form.skills}\nKampuni: ${form.company}\nMawasiliano: ${form.contact}\n\nMaelezo:\n${form.desc}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{ flex:2, height:50, borderRadius:14, border:"none", background:`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, textDecoration:"none" }}>
                  <Send size={16}/> Tuma kupitia WhatsApp
                </a>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.25)", textAlign:"center", lineHeight:1.5 }}>
                Kazi yako itakaguliwa na STEA team na kuchapishwa ndani ya masaa 24.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Apply Modal ────────────────────────────────────────
function ApplyModal({ gig, onClose }) {
  const [form, setForm] = useState({ name:"", contact:"", proposal:"" });

  const waMsg = `*STEA GIGS — APPLICATION*\n\nKazi: ${gig.title}\nKampuni: ${gig.company}\n\nJina langu: ${form.name}\nMawasiliano: ${form.contact}\n\nProposal yangu:\n${form.proposal}\n\n— Sent via STEA Gigs`;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(4,5,9,.96)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div initial={{ scale:.94, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:.94, opacity:0 }}
        style={{ width:"100%", maxWidth:480, background:CARD_BG, borderRadius:24, border:`1px solid ${BORDER}`, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Apply: {gig.title}</h2>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:13, margin:0 }}>{gig.company} · {gig.location}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.08)", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><X size={16}/></button>
        </div>
        <div style={{ display:"grid", gap:16 }}>
          <Field label="Jina Lako">
            <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Jina lako kamili" style={inputStyle}/>
          </Field>
          <Field label="WhatsApp / Email yako">
            <input value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} placeholder="+255..." style={inputStyle}/>
          </Field>
          <Field label="Proposal Yako (kwa nini WEWE?)">
            <textarea value={form.proposal} onChange={e => setForm({...form, proposal:e.target.value})} placeholder="Eleza kwa ufupi kwa nini unastahili kazi hii, uzoefu wako, na unaweza kuanza lini..." style={{ ...inputStyle, height:110, resize:"vertical", paddingTop:14 }}/>
          </Field>
          <a href={`https://wa.me/255757053354?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer"
            style={{ height:50, borderRadius:14, border:"none", background:`linear-gradient(135deg,#25d366,#1ab855)`, color:"#fff", fontWeight:900, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, textDecoration:"none" }}>
            <MessageCircle size={18}/> Tuma Application (WhatsApp)
          </a>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.25)", textAlign:"center" }}>
            Application yako itatumwa kwa STEA ambao wataikabidhi kwa employer.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Gig Card ──────────────────────────────────────────
function GigCard({ gig, onApply }) {
  const isMobile = useMobile();
  const typeInfo = JOB_TYPES.find(t => t.id === gig.type) || JOB_TYPES[0];
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-2, boxShadow:`0 16px 48px rgba(0,0,0,.5), 0 0 0 1px ${G}20` }}
      className="glass-card"
      style={{
        borderRadius:12, 
        padding: isMobile ? "12px 10px" : "16px 14px", 
        display:"flex", 
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "flex-start", 
        gap: isMobile ? 10 : 14, 
        cursor:"default", position:"relative", overflow:"hidden",
        height: "100%" 
      }}
    >
      {gig.featured && (
        <div style={{ position:"absolute", top:0, left:0, background:`linear-gradient(135deg,${G},${G2})`, width: isMobile ? '100%' : 4, height: isMobile ? 3 : '100%', borderRadius: isMobile ? 0 : '12px 0 0 12px' }} />
      )}
      
      {/* Icon Left */}
      <div className="glass" style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius:12, display:"grid", placeItems:"center", fontSize: isMobile ? 20 : 24, flexShrink:0, position: 'relative' }}>
        {gig.logo}
        {gig.verified && (
          <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#10b981', borderRadius: '50%', padding: 2, border: `1.5px solid ${CARD_BG}` }}>
            <Shield size={isMobile ? 8 : 10} color="#fff" />
          </div>
        )}
      </div>

      {/* Text Right */}
      <div style={{ flex:1, minWidth:0, display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4, flexDirection: isMobile ? "column" : "row" }}>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 12 : 14, fontWeight: 900, margin:0, lineHeight:1.3, letterSpacing:"-.01em", color: "#fff", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {gig.title}
            </h3>
            {gig.budget && <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 900, color:G, flexShrink: 0 }}>{gig.budget}</div>}
          </div>
          <div style={{ fontSize: isMobile ? 10 : 11, color:"rgba(255,255,255,.45)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop: 2 }}>
            {gig.company}
          </div>
        </div>

        {/* Desc (Hidden/Smaller on mobile for 2cols) */}
        {!isMobile && (
          <p style={{ fontSize:11, color:"rgba(255,255,255,.5)", lineHeight:1.4, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {gig.desc}
          </p>
        )}

        {/* Skills & Action */}
        <div style={{ display:"flex", alignItems: "center", justifyContent: "space-between", marginTop: isMobile ? 4 : 4, gap: 6, flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap", flex: 1, width: isMobile ? "100%" : "auto" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:2, padding:"2px 5px", borderRadius:4, fontSize: isMobile ? 8 : 9, fontWeight:800, background:`${typeInfo.color}15`, color:typeInfo.color }}>
              {typeInfo.icon} {isMobile ? typeInfo.label.slice(0,6) : typeInfo.label}
            </span>
            {!isMobile && (gig.skills||[]).slice(0,1).map(s => (
              <span key={s} style={{ padding:"2px 6px", borderRadius:6, fontSize:9, fontWeight:700, background:"rgba(255,255,255,.05)", color:"rgba(255,255,255,.55)", border:`1px solid ${BORDER}` }}>{s}</span>
            ))}
          </div>
          
          <button onClick={() => onApply(gig)}
            style={{ 
              height: isMobile ? 28 : 26, 
              width: isMobile ? "100%" : "auto",
              padding: '0 12px', borderRadius:8, border:"none", background:`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize: isMobile ? 10 : 11, cursor:"pointer", flexShrink: 0 
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Field helper ──────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:12, fontWeight:800, color:"rgba(255,255,255,.4)", marginBottom:8, letterSpacing:".05em" }}>
        {label} {required && <span style={{ color:G }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", height:50, borderRadius:13, border:`1px solid ${BORDER}`,
  background:"rgba(255,255,255,.04)", color:"#fff", padding:"0 16px",
  outline:"none", fontSize:14, fontFamily:"inherit", boxSizing:"border-box",
};

// ── Skill to Salary tool ──────────────────────────────
function SkillSalaryTool() {
  const [skill, setSkill] = useState("");
  const SKILL_SALARIES = {
    "Web Development":     { low:"500,000", high:"3,000,000+", demand:"Juu Sana", color:"#10b981" },
    "Graphic Design":      { low:"200,000", high:"1,500,000",  demand:"Juu",      color:G },
    "Video Editing":       { low:"200,000", high:"1,200,000",  demand:"Juu",      color:G },
    "Social Media":        { low:"150,000", high:"800,000",    demand:"Wastani",  color:"#60a5fa" },
    "Data Entry":          { low:"100,000", high:"400,000",    demand:"Wastani",  color:"#94a3b8" },
    "Copywriting":         { low:"100,000", high:"600,000",    demand:"Wastani",  color:"#94a3b8" },
    "App Development":     { low:"800,000", high:"5,000,000+", demand:"Juu Sana", color:"#10b981" },
    "Digital Marketing":   { low:"300,000", high:"1,500,000",  demand:"Juu",      color:G },
    "Customer Service":    { low:"250,000", high:"700,000",    demand:"Wastani",  color:"#94a3b8" },
    "Teaching / Tutoring": { low:"100,000", high:"500,000",    demand:"Wastani",  color:"#94a3b8" },
  };
  const result = skill ? SKILL_SALARIES[skill] : null;

  return (
    <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:20, padding:"28px 28px" }}>
      <h3 style={{ fontWeight:900, fontSize:18, marginBottom:6 }}>💡 Pata kiasi cha pesa unachoweza kupata</h3>
      <p style={{ color:"rgba(255,255,255,.4)", fontSize:13, marginBottom:20 }}>Chagua skill yako uone earning potential yako Tanzania</p>
      <select value={skill} onChange={e => setSkill(e.target.value)}
        style={{ width:"100%", height:50, borderRadius:13, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:"#fff", padding:"0 16px", outline:"none", fontSize:14, appearance:"none", cursor:"pointer", marginBottom:result?16:0 }}>
        <option value="">-- Chagua Skill Yako --</option>
        {Object.keys(SKILL_SALARIES).map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden" }}>
            <div style={{ background:`${result.color}08`, border:`1px solid ${result.color}20`, borderRadius:14, padding:"18px 20px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,.35)", marginBottom:4, textTransform:"uppercase" }}>Min (TZS/Mwezi)</div>
                  <div style={{ fontWeight:900, fontSize:20, color:result.color }}>{result.low}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,.35)", marginBottom:4, textTransform:"uppercase" }}>Max (TZS/Mwezi)</div>
                  <div style={{ fontWeight:900, fontSize:20, color:result.color }}>{result.high}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,.35)", marginBottom:4, textTransform:"uppercase" }}>Demand</div>
                  <div style={{ fontWeight:900, fontSize:16, color:result.color }}>{result.demand}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main GigsPage ─────────────────────────────────────
export default function GigsPage() {
  const isMobile = useMobile();
  const { t } = useSettings();
  const [searchParams] = useSearchParams();
  const JOB_LABELS = { all: t("gigs_filter_all"), remote: t("gigs_filter_remote"), local: t("gigs_filter_local"), freelance: t("gigs_filter_freelance"), internship: t("gigs_filter_internship") };
  const urlType = searchParams.get("type") || "all";
  const urlAction = searchParams.get("action");

  const [activeType, setActiveType] = useState(urlType);
  const [searchQ, setSearchQ] = useState("");
  const [applyingTo, setApplyingTo] = useState(null);
  const [showPostModal, setShowPostModal] = useState(urlAction === "post");
  const [showSalaryTool, setShowSalaryTool] = useState(false);

  // Sync type filter with URL changes
  useEffect(() => { setActiveType(urlType); }, [urlType]);
  useEffect(() => { if (urlAction === "post") setShowPostModal(true); }, [urlAction]);

  const filtered = SAMPLE_GIGS.filter(g => {
    if (activeType !== "all" && g.type !== activeType) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (g.title||"").toLowerCase().includes(q) ||
             (g.skills||[]).some(s => s.toLowerCase().includes(q)) ||
             (g.company||"").toLowerCase().includes(q) ||
             (g.location||"").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ position: "relative", paddingBottom:80, minHeight:"100vh", background:DARK, color:"#fff", fontFamily:"'Instrument Sans',system-ui,sans-serif", overflow: "hidden" }}>
      <AnimatedBackground />

      {/* Ecosystem Discovery Banner */}
      <SteaEcosystemBanner page="gigs" />

      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── HERO ── */}
      <SteaHero 
        badge="STEA Digital Ecosystem"
        titleLine1="STEA"
        titleLine2="Gigs & Kazi"
        subtitle="Anza bila experience, jenga skills zako, na anza earning leo. Nafasi za kweli kwa Watanzania."
      />
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => document.getElementById("gigs-list")?.scrollIntoView({ behavior:"smooth" })}
            className="glass-strong"
            style={{ padding: isMobile ? "12px 20px" : "15px 32px", borderRadius:14, color:G, fontWeight:900, fontSize: isMobile ? 14 : 16, cursor:"pointer", display:"flex", alignItems:"center", gap:8, backgroundColor: "transparent" }}>
            TAFUTA KAZI <ArrowRight size={16}/>
          </button>
          <button onClick={() => setShowPostModal(true)}
            className="glass"
            style={{ padding: isMobile ? "12px 20px" : "15px 28px", borderRadius:14, color:"#fff", fontWeight:700, fontSize: isMobile ? 14 : 16, cursor:"pointer", backgroundColor: "transparent" }}>
            + Tuma Gig
          </button>
        </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ maxWidth:1000, margin:"0 auto", padding: isMobile ? "0 0 40px" : "20px 20px 60px" }}>
        <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 22 : "clamp(26px,4vw,36px)", fontWeight:900, textAlign:"center", marginBottom: isMobile ? 20 : 40 }}>
          Jinsi <span className="gold-glow" style={{ color:G }}>Inavyofanya Kazi</span>
        </h2>
        <div style={{ 
          display: isMobile ? "flex" : "grid", 
          gridTemplateColumns: isMobile ? "none" : "repeat(auto-fit, minmax(260px,1fr))", 
          gap: isMobile ? 12 : 20, 
          overflowX: isMobile ? "auto" : "visible", 
          padding: isMobile ? "0 16px 12px" : 0,
          scrollbarWidth: "none"
        }}>
          {HOW_STEPS.map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}
              className="glass-card"
              style={{ 
                borderRadius:20, 
                padding: isMobile ? "20px" : "28px 26px", 
                position:"relative", 
                overflow:"hidden",
                minWidth: isMobile ? 240 : "auto",
                flex: isMobile ? "0 0 240px" : 1
              }}>
              <div style={{ position:"absolute", top:14, right:18, fontSize:32, fontWeight:900, color:"rgba(255,255,255,.04)", fontFamily:"'Bricolage Grotesque',sans-serif" }}>{s.num}</div>
              <div className="glass" style={{ width:40, height:40, borderRadius:12, color:s.color, display:"grid", placeItems:"center", marginBottom: isMobile ? 12 : 18 }}>
                {isMobile ? React.cloneElement(s.icon, { size: 20 }) : s.icon}
              </div>
              <h3 style={{ fontWeight:900, fontSize: isMobile ? 16 : 18, marginBottom:4 }}>{s.title}</h3>
              <p style={{ fontSize: isMobile ? 13 : 14, color:"rgba(255,255,255,.5)", lineHeight: 1.5, margin:0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── GIGS LIST ── */}
      <section id="gigs-list" style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px 60px" }}>
        {/* Search + Type filter */}
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 280px", position:"relative" }}>
            <Search size={16} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.35)", pointerEvents:"none" }}/>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Tafuta kazi, skill, au kampuni..."
              className="glass"
              style={{ width:"100%", height:46, borderRadius:13, color:"#fff", paddingLeft:42, paddingRight:16, outline:"none", fontSize:14, fontFamily:"inherit", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor=G}
              />
            {searchQ && <button onClick={() => setSearchQ("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,.4)", cursor:"pointer" }}><X size={13}/></button>}
          </div>
          <button onClick={() => setShowPostModal(true)}
            className="glass"
            style={{ height:46, padding:"0 20px", borderRadius:13, color:G, fontWeight:800, fontSize:14, cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:8 }}>
            + Tuma Gig
          </button>
        </div>

        {/* Type filter chips */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:28, paddingBottom:4, scrollbarWidth:"none" }}>
          {JOB_TYPES.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)}
              style={{ padding:"8px 18px", borderRadius:999, fontSize:13, fontWeight:700, border:`1px solid ${activeType===t.id ? t.color : BORDER}`, background:activeType===t.id ? `${t.color}15` : "transparent", color:activeType===t.id ? t.color : "rgba(255,255,255,.5)", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all .15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.45)", fontWeight:600 }}>
            {filtered.length} {t("gigs_filter_all").toLowerCase()} {activeType!=="all" && `· ${JOB_LABELS[activeType] || ""}`}
          </div>
          <button onClick={() => setShowSalaryTool(v => !v)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.03)", color:"rgba(255,255,255,.55)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            <TrendingUp size={14} color={G}/> Earning Potential
          </button>
        </div>

        {/* Salary Tool */}
        <AnimatePresence>
          {showSalaryTool && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:"hidden", marginBottom:20 }}>
              <SkillSalaryTool/>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gigs Grid */}
        <SteaMainBanner isMobile={isMobile} />
        {filtered.length > 0 ? (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(320px,1fr))", gap: isMobile ? 12 : 20 }}>
            {filtered.map((g, i) => (
              <motion.div key={g.id} transition={{ delay:i*.05 }} style={{ height: "100%" }}>
                <GigCard gig={g} onApply={setApplyingTo}/>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"rgba(255,255,255,.02)", borderRadius:20, border:`1px dashed ${BORDER}` }}>
            <Briefcase size={48} color="rgba(255,255,255,.15)" style={{ margin:"0 auto 16px", display:"block" }}/>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Hakuna kazi inayolingana</h3>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:14, marginBottom:20 }}>Jaribu kuchagua aina nyingine au badilisha maneno ya utafutaji.</p>
            <button onClick={() => { setActiveType("all"); setSearchQ(""); }} style={{ padding:"10px 24px", borderRadius:12, border:`1px solid ${G}30`, background:`${G}10`, color:G, fontWeight:700, cursor:"pointer" }}>
              Ona Kazi Zote
            </button>
          </div>
        )}

        {/* Load more notice */}
        <div style={{ textAlign:"center", marginTop:32, padding:"20px", background:"rgba(255,255,255,.02)", borderRadius:16, border:`1px dashed ${BORDER}` }}>
          <p style={{ color:"rgba(255,255,255,.35)", fontSize:13, margin:"0 0 12px" }}>Tunaongeza kazi mpya kila wiki. Una kazi ya kutoa?</p>
          <button onClick={() => setShowPostModal(true)}
            style={{ padding:"10px 24px", borderRadius:12, border:`1px solid ${G}30`, background:`${G}10`, color:G, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            + Tuma Kazi Yako Bure
          </button>
        </div>
      </section>

      {/* ── WHY STEA GIGS ── */}
      <section style={{ maxWidth:1000, margin:"0 auto", padding: isMobile ? "0 16px 40px" : "0 20px 60px" }}>
        <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 22 : "clamp(24px,4vw,36px)", fontWeight:900, textAlign:"center", marginBottom: isMobile ? 20 : 40 }}>
          Kwa Nini <span className="gold-glow" style={{ color:G }}>STEA Gigs</span>?
        </h2>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(280px,1fr))", gap: isMobile ? 8 : 18 }}>
          {WHY_ITEMS.map((w,i) => (
            <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.07 }}
              className="glass-card"
              style={{ borderRadius:18, padding: isMobile ? "12px" : "22px 22px", display:"flex", gap: isMobile ? 8 : 16, alignItems:"flex-start", flexDirection: isMobile ? "column" : "row" }}>
              <div className="glass" style={{ width: isMobile ? 32 : 46, height: isMobile ? 32 : 46, borderRadius:10, color:G, display:"grid", placeItems:"center", flexShrink:0 }}>
                {isMobile ? React.cloneElement(w.icon, { size: 16 }) : w.icon}
              </div>
              <div>
                <h3 style={{ fontWeight:800, fontSize: isMobile ? 13 : 15, marginBottom: isMobile ? 2 : 6 }}>{w.title}</h3>
                {!isMobile && <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.6, margin:0 }}>{w.desc}</p>}
                {isMobile && <p style={{ fontSize:10, color:"rgba(255,255,255,.45)", lineHeight:1.4, margin:0 }}>{w.desc.split('—')[0]}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SKILL CATEGORIES */}
      <section style={{ maxWidth:1000, margin:"0 auto", padding:"0 20px 80px" }}>
        <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(22px,3.5vw,30px)", fontWeight:900, marginBottom:24, textAlign:"center" }}>
          Anza na <span className="gold-glow" style={{ color:G }}>Skill Yoyote</span>
        </h2>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
          {SKILLS.map(skill => (
            <button key={skill} onClick={() => { setSearchQ(skill); document.getElementById("gigs-list")?.scrollIntoView({ behavior:"smooth" }); }}
              style={{ padding:"9px 18px", borderRadius:999, fontSize:13, fontWeight:700, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.03)", color:"rgba(255,255,255,.6)", cursor:"pointer", transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G; e.currentTarget.style.background=`${G}10`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.color="rgba(255,255,255,.6)"; e.currentTarget.style.background="rgba(255,255,255,.03)"; }}>
              {skill}
            </button>
          ))}
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {applyingTo && <ApplyModal gig={applyingTo} onClose={() => setApplyingTo(null)}/>}
        {showPostModal && <PostGigModal onClose={() => setShowPostModal(false)}/>}
      </AnimatePresence>

      {/* Explore More STEA */}
      <SteaExploreMore exclude="gigs" />
     </div>
    </div>
  );
}