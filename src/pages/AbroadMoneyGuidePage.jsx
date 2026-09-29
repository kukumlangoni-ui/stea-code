/**
 * AbroadMoneyGuidePage.jsx — STEA Africa v2
 * Fixed: runtime crashes, null safety, integrated MoneySearch
 * All .map() calls are safe with optional chaining and fallback arrays
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ChevronDown, ArrowRight, MessageCircle,
  Shield, AlertTriangle, CheckCircle, HelpCircle,
  Eye, Banknote,
  TrendingUp, Clock, Star, Send, Info,
  Zap, MapPin, BadgeCheck, PhoneCall
} from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { useSettings } from "../contexts/SettingsContext";
import MoneySearch from "../components/MoneySearch.jsx";
import MONEY_METHODS_RAW from "../data/moneyMethods.json";

// ── Null-safe data access ─────────────────────────────────────────────────────
const MONEY_METHODS = Array.isArray(MONEY_METHODS_RAW) ? MONEY_METHODS_RAW : [];

// ── Brand tokens ──────────────────────────────────────────────────────────────
const G      = "#F5A623";
const G2     = "#FFD17C";
const DARK   = "#05060a";
const CARD   = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN  = "#10b981";
const BLUE   = "#3B82F6";
const PURPLE = "#8b5cf6";
const RED    = "#ef4444";

// ── WhatsApp links ────────────────────────────────────────────────────────────
const WA_MAIN  = "https://wa.me/255757053354?text=" + encodeURIComponent("Habari STEA! Nahitaji msaada wa kutuma pesa nje ya nchi. Tafadhali niongoze.");
const WA_CHINA = "https://wa.me/255757053354?text=" + encodeURIComponent("Habari STEA! Nahitaji msaada wa kutuma pesa China. Ninaomba mwongozo.");
const WA_RATE  = "https://wa.me/255757053354?text=" + encodeURIComponent("Habari STEA! Ningependa kujua rate ya leo ya kubadilisha pesa. Tafadhali nisaidie.");
const WA_SAFE  = "https://wa.me/255757053354?text=" + encodeURIComponent("Habari STEA! Nahitaji ushauri wa njia salama ya kutuma pesa nje ya nchi.");

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", ...style }}>
    {children}
  </div>
);

function SectionLabel({ children, color = G }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:999, background:`${color}12`, border:`1px solid ${color}25`, color, fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", marginBottom:20 }}>
      {children}
    </div>
  );
}

function GoldBtn({ href, onClick, children, outline, small }) {
  const s = {
    display:"inline-flex", alignItems:"center", gap:10,
    padding: small ? "10px 20px" : "14px 28px",
    borderRadius:14, fontWeight:900, fontSize: small ? 13 : 15,
    cursor:"pointer", textDecoration:"none", border:"none", transition:"all .2s",
    ...(outline
      ? { background:"transparent", color:G, border:`1.5px solid ${G}50` }
      : { background:`linear-gradient(135deg,${G},${G2})`, color:"#111", boxShadow:`0 6px 20px ${G}35` }
    ),
  };
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={s}>{children}</a>;
  return <button onClick={onClick} style={s}>{children}</button>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  if (!q || !a) return null;
  return (
    <div style={{ border:`1px solid ${open ? `${G}40` : BORDER}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", background:"none", border:"none", color:"#fff", fontWeight:700, fontSize:15, textAlign:"left", cursor:"pointer", gap:16 }}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:.2 }}>
          <ChevronDown size={17} color={G}/>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 22px 20px", color:"rgba(255,255,255,.65)", lineHeight:1.75, fontSize:14 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Static data (crash-safe) ──────────────────────────────────────────────────
const getCountries = (t) => [
  { flag:"🇨🇳", name:"China", color:RED, active:true, badge:t('money_test_badge_success'),
    desc:t('money_countries_china_desc'),
    note:t('money_countries_china_note'),
    cta:t('money_countries_cta_guide'), link:WA_CHINA },
  { flag:"🇦🇪", name:"UAE / Dubai", color:"#f59e0b", active:false,
    desc:t('money_countries_uae_desc'),
    note:t('money_countries_uae_note'),
    cta:t('money_countries_cta_soon') },
  { flag:"🇮🇳", name:"India", color:"#f97316", active:false,
    desc:t('money_countries_india_desc'),
    note:t('money_countries_india_note'),
    cta:t('money_countries_cta_soon') },
  { flag:"🌍", name:t('money_countries_other_desc').split(' — ')[0], color:BLUE, active:false,
    desc:t('money_countries_other_desc'),
    note:t('money_countries_other_note'),
    cta:t('money_countries_cta_help'), link:WA_MAIN },
];

const getSteps = (t) => [
  { icon:<MapPin size={24}/>,     color:BLUE,   num:"01", title:t('money_step1_title'),         desc:t('money_step1_desc') },
  { icon:<Banknote size={24}/>,   color:G,      num:"02", title:t('money_step2_title'),         desc:t('money_step2_desc') },
  { icon:<BadgeCheck size={24}/>, color:GREEN,  num:"03", title:t('money_step3_title'),         desc:t('money_step3_desc') },
  { icon:<TrendingUp size={24}/>, color:PURPLE, num:"04", title:t('money_step4_title'),         desc:t('money_step4_desc') },
  { icon:<Send size={24}/>,       color:RED,    num:"05", title:t('money_step5_title'),         desc:t('money_step5_desc') },
  { icon:<CheckCircle size={24}/>,color:GREEN,  num:"06", title:t('money_step6_title'),         desc:t('money_step6_desc') },
];

const getProblems = (t) => [
  { icon:"📉", title:t('money_prob1_title'),    desc:t('money_prob1_desc') },
  { icon:"⏳", title:t('money_prob2_title'),    desc:t('money_prob2_desc') },
  { icon:"💸", title:t('money_prob3_title'),    desc:t('money_prob3_desc') },
  { icon:"🔒", title:t('money_prob4_title'),    desc:t('money_prob4_desc') },
  { icon:"⚠️", title:t('money_prob5_title'),    desc:t('money_prob5_desc') },
  { icon:"❓", title:t('money_prob6_title'),    desc:t('money_prob6_desc') },
  { icon:"📋", title:t('money_prob7_title'),    desc:t('money_prob7_desc') },
];

const getSafetyTips = (t) => [
  t('money_safety_tip1'),
  t('money_safety_tip2'),
  t('money_safety_tip3'),
  t('money_safety_tip4'),
  t('money_safety_tip5'),
  t('money_safety_tip6'),
  t('money_safety_tip7'),
  t('money_safety_tip8'),
];

const getTestimonials = (t) => [
  { initials:"AM", name:"Amina M.", context:t('money_test1_context'), color:RED, quote:t('money_test1_quote'), badge:t('money_test_badge_success') },
  { initials:"KJ", name:"Kelvin J.", context:t('money_test2_context'), color:BLUE, quote:t('money_test2_quote'), badge:t('money_test_badge_verified') },
  { initials:"FN", name:"Fatuma N.", context:t('money_test3_context'), color:GREEN, quote:t('money_test3_quote'), badge:t('money_test_badge_success') },
];

const getFaqs = (t) => [
  { q:t('money_faq1_q'), a:t('money_faq1_a') },
  { q:t('money_faq2_q'), a:t('money_faq2_a') },
  { q:t('money_faq3_q'), a:t('money_faq3_a') },
  { q:t('money_faq4_q'), a:t('money_faq4_a') },
  { q:t('money_faq5_q'), a:t('money_faq5_a') },
  { q:t('money_faq6_q'), a:t('money_faq6_a') },
];

// ════════════════════════════════════════════════════════════════════════════
export default function AbroadMoneyGuidePage() {
  const isMobile = useMobile();
  const { t } = useSettings();
  const [openMethod, setOpenMethod] = useState(null);

  const COUNTRIES = getCountries(t);
  const STEPS = getSteps(t);
  const PROBLEMS = getProblems(t);
  const SAFETY_TIPS = getSafetyTips(t);
  const TESTIMONIALS = getTestimonials(t);
  const FAQS = getFaqs(t);

  return (
    <div style={{ minHeight:"100vh", background:DARK, color:"#fff", overflowX:"hidden", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ padding:"clamp(72px,10vw,100px) clamp(16px,4vw,40px) 80px", position:"relative", overflow:"hidden",
        background:"radial-gradient(ellipse at 70% -5%, rgba(245,166,35,.12) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(59,130,246,.08) 0%, transparent 50%)",
        textAlign:"center" }}>

        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.06 }}>
          <svg width="100%" height="100%" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid slice">
            <circle cx="450" cy="250" r="160" fill="none" stroke={G} strokeWidth="1"/>
            <circle cx="450" cy="250" r="260" fill="none" stroke={G} strokeWidth=".5"/>
            <circle cx="450" cy="250" r="380" fill="none" stroke={G} strokeWidth=".3"/>
            <line x1="0" y1="250" x2="900" y2="250" stroke={G} strokeWidth=".4"/>
            <line x1="450" y1="0" x2="450" y2="500" stroke={G} strokeWidth=".4"/>
            {[[200,150],[650,200],[300,350],[700,320],[450,250]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="4" fill={G} opacity=".6"/>
            ))}
          </svg>
        </div>

        <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:`${G}14`, border:`1px solid ${G}25`, borderRadius:20, color:G, fontSize:13, fontWeight:700, marginBottom:28 }}>
            <Banknote size={15}/> {t('money_hero_tag')}
          </div>

          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(32px,5.5vw,64px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-.04em", marginBottom:22, maxWidth:820, margin:"0 auto 22px" }}>
            {t('money_hero_title')}
          </h1>

          <p style={{ color:"rgba(255,255,255,.6)", maxWidth:560, margin:"0 auto 42px", fontSize:17, lineHeight:1.75 }}>
            {t('money_hero_desc')}
          </p>

          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:40 }}>
            <GoldBtn href={WA_MAIN}><MessageCircle size={18}/> {t('money_hero_cta_start')}</GoldBtn>
            <GoldBtn outline onClick={() => document.getElementById("search-section")?.scrollIntoView({ behavior:"smooth" })}>
              {t('money_hero_cta_search')} <ArrowRight size={16}/>
            </GoldBtn>
          </div>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            {["🇨🇳 China Guide Ipo","✅ Msaada wa WhatsApp","🔒 Mwongozo wa Usalama","📚 Elimu ya Bure"].map(t => (
              <div key={t} style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600, padding:"6px 12px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20 }}>{t}</div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 2. SEARCH SECTION ════════════════════════════════════════════════ */}
      <section id="search-section" style={{ padding:"80px 0" }}>
        <W>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <SectionLabel color={G}><Zap size={13}/> {t('money_search_tag')}</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,4vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
                {t('money_search_title')}
              </h2>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:15, maxWidth:480, margin:"0 auto" }}>
                {t('money_search_desc')}
              </p>
            </div>

            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, padding: isMobile ? "24px 20px" : "32px 36px",
              boxShadow:"0 24px 60px rgba(0,0,0,.4)" }}>
              <MoneySearch
                initialData={MONEY_METHODS}
                placeholder={t('money_search_placeholder')}
              />
            </div>
          </div>
        </W>
      </section>

      {/* ══ 3. COUNTRIES ═════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <SectionLabel color={BLUE}><Globe size={13}/> {t('money_countries_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('money_countries_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:500, margin:"0 auto" }}>
              {t('money_countries_desc')}
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:18 }}>
            {(COUNTRIES || []).map((c, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}
                style={{ background:CARD, border:`1px solid ${c.active ? `${c.color}35` : BORDER}`, borderRadius:22, padding:"26px 22px", position:"relative", overflow:"hidden" }}>
                {c.active && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c.color},${c.color}60)` }}/>}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ fontSize:36 }}>{c.flag || "🌍"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>{c.name}</div>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
                      background: c.active ? `${c.color}18` : "rgba(255,255,255,.05)",
                      border:`1px solid ${c.active ? `${c.color}30` : "rgba(255,255,255,.07)"}`,
                      color: c.active ? c.color : "rgba(255,255,255,.4)",
                      fontSize:10, fontWeight:900, letterSpacing:".04em" }}>
                      {c.active ? <><Zap size={9}/> {c.badge || "Active"}</> : "Inakuja"}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.6)", lineHeight:1.65, marginBottom:14 }}>{c.desc}</p>
                {c.note && (
                  <div style={{ fontSize:12, padding:"8px 12px", background:`${c.color}0d`, borderRadius:8, color:`${c.color}cc`, fontWeight:700, borderLeft:`3px solid ${c.color}40`, marginBottom:18 }}>
                    💡 {c.note}
                  </div>
                )}
                {(c.active || c.link) ? (
                  <a href={c.link || WA_MAIN} target="_blank" rel="noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:`linear-gradient(135deg,${c.color},${c.color}aa)`, color:"#fff", fontWeight:800, fontSize:13, borderRadius:10, textDecoration:"none" }}>
                    {c.cta || "Angalia"} <ArrowRight size={14}/>
                  </a>
                ) : (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:"rgba(255,255,255,.05)", color:"rgba(255,255,255,.35)", fontWeight:800, fontSize:13, borderRadius:10 }}>
                    <Clock size={13}/> {c.cta || "Inakuja"}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:.2 }}
            style={{ marginTop:28, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.22)", borderRadius:18, padding:"20px 24px", display:"flex", gap:16, alignItems:"flex-start" }}>
            <AlertTriangle size={22} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#f87171", marginBottom:6 }}>{t('money_countries_china_warning_title')}</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.6)", lineHeight:1.65, margin:0 }}>
                {t('money_countries_china_warning_desc')}
              </p>
            </div>
          </motion.div>
        </W>
      </section>

      {/* ══ 4. METHODS (compact, crash-safe) ════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color={GREEN}><Banknote size={13}/> {t('money_methods_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('money_methods_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:520, margin:"0 auto" }}>
              {t('money_methods_desc')}
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
            {(MONEY_METHODS || []).map((m, i) => {
              if (!m) return null;
              const isOpen = openMethod === i;
              return (
                <motion.div key={m.id || i}
                  initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.06 }}
                  onClick={() => setOpenMethod(isOpen ? null : i)}
                  style={{ background:CARD, border:`1px solid ${isOpen ? `${m.color || G}40` : BORDER}`, borderRadius:20, padding:"24px 22px", cursor:"pointer", transition:"all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`${m.color || G}30`; e.currentTarget.style.transform="translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor= isOpen ? `${m.color || G}40` : BORDER; e.currentTarget.style.transform=""; }}>

                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                    <div style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{m.emoji || "💳"}</div>
                    <div style={{ flex:1 }}>
                      <h3 style={{ fontWeight:900, fontSize:17, marginBottom:2, color:"#fff" }}>{m.name}</h3>
                      {m.speed && <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontWeight:600 }}>⏱ {m.speed}</div>}
                    </div>
                    <motion.div animate={{ rotate:isOpen ? 180 : 0 }} transition={{ duration:.2 }}>
                      <ChevronDown size={16} color="rgba(255,255,255,.3)"/>
                    </motion.div>
                  </div>

                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{m.description || ""}</p>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
                        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${BORDER}` }}>
                          {(m.strengths || []).length > 0 && (
                            <div style={{ marginBottom:12 }}>
                              <div style={{ fontSize:11, fontWeight:900, color:GREEN, letterSpacing:".06em", textTransform:"uppercase", marginBottom:8 }}>Faida</div>
                              {(m.strengths || []).map((s,j) => (
                                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                                  <CheckCircle size={13} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
                                  <span style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(m.limitations || []).length > 0 && (
                            <div style={{ marginBottom:14 }}>
                              <div style={{ fontSize:11, fontWeight:900, color:"#f87171", letterSpacing:".06em", textTransform:"uppercase", marginBottom:8 }}>Tahadhari</div>
                              {(m.limitations || []).map((lim,j) => (
                                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                                  <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
                                  <span style={{ fontSize:13, color:"rgba(255,255,255,.65)" }}>{lim}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {m.waLink && (
                            <a href={m.waLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px", background:`${m.color || G}15`, border:`1px solid ${m.color || G}30`, borderRadius:10, color:m.color || G, fontWeight:700, fontSize:12, textDecoration:"none" }}>
                              <MessageCircle size={13}/> Niambie zaidi
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </W>
      </section>

      {/* ══ 5. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:26, padding:"clamp(32px,5vw,56px)" }}>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <SectionLabel color={BLUE}><Zap size={13}/> {t('money_steps_tag')}</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
                {t('money_steps_title')}
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile ? "100%" : "300px"}, 1fr))`, gap:16 }}>
              {(STEPS || []).map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}
                  style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:18, padding:"24px 20px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:14, right:18, fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:44, fontWeight:900, color:"rgba(255,255,255,.04)" }}>{s.num}</div>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${s.color}18`, color:s.color, display:"grid", placeItems:"center", marginBottom:16 }}>{s.icon}</div>
                  <h3 style={{ fontWeight:900, fontSize:16, marginBottom:8 }}>{s.title}</h3>
                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 6. PROBLEMS ══════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color="#f97316"><AlertTriangle size={13}/> {t('money_problems_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('money_problems_title')}
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
            {(PROBLEMS || []).map((p, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.06 }}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:"22px 20px", display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <h4 style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>{p.title}</h4>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ══ 7. SAFETY ════════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:`linear-gradient(135deg, rgba(16,185,129,.08), rgba(16,185,129,.02))`, border:`1px solid rgba(16,185,129,.2)`, borderRadius:26, padding:"clamp(32px,5vw,56px)" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <SectionLabel color={GREEN}><Shield size={13}/> {t('money_safety_tag')}</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
                {t('money_safety_title')}
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile ? "100%" : "340px"}, 1fr))`, gap:12 }}>
              {(SAFETY_TIPS || []).map((tip, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*.05 }}
                  style={{ display:"flex", gap:12, alignItems:"flex-start", background:"rgba(16,185,129,.05)", border:`1px solid rgba(16,185,129,.12)`, borderRadius:14, padding:"14px 16px" }}>
                  <CheckCircle size={16} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,.78)", lineHeight:1.55, fontWeight:600 }}>{tip}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 8. RATE INFO ═════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"clamp(28px,4vw,44px)", display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:64, height:64, borderRadius:18, background:`${G}15`, display:"grid", placeItems:"center", flexShrink:0 }}>
              <TrendingUp size={30} color={G}/>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <SectionLabel color={G}><Info size={12}/> Rate ya Ubadilishaji</SectionLabel>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(20px,3vw,28px)", fontWeight:900, lineHeight:1.2, marginBottom:12 }}>
                Kuhusu Rate ya Kubadilisha Pesa
              </h3>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", lineHeight:1.75, marginBottom:20 }}>
                Rate hubadilika kila saa kulingana na soko la fedha duniani. Inategemea njia unayotumia, kiasi cha pesa, and nchi unayotuma. Usitegemee rate ya jana — angalia siku unayotuma.
              </p>
              <div style={{ background:"rgba(245,166,35,.08)", border:"1px solid rgba(245,166,35,.2)", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                <Info size={16} color={G} style={{ flexShrink:0, marginTop:2 }}/>
                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.65)", lineHeight:1.65, margin:0 }}>
                  <strong style={{ color:G }}>Ushauri:</strong> Wasiliana nasi kupata mwongozo wa rate ya sasa kabla ya kufanya maamuzi.
                </p>
              </div>
              <GoldBtn href={WA_RATE} small><PhoneCall size={15}/> Omba Rate ya Leo</GoldBtn>
            </div>
          </div>
        </W>
      </section>

      {/* ══ 9. STEA HELPS CTA ════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:`linear-gradient(135deg, rgba(245,166,35,.1), rgba(245,166,35,.03))`, border:"1px solid rgba(245,166,35,.22)", borderRadius:24, padding:"clamp(32px,5vw,56px)", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>💬</div>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(22px,3.5vw,34px)", fontWeight:900, marginBottom:14, letterSpacing:"-.02em" }}>
              Tayari Kupata Msaada?
            </h3>
            <p style={{ color:"rgba(255,255,255,.6)", maxWidth:480, margin:"0 auto 36px", fontSize:16, lineHeight:1.7 }}>
              STEA inatoa mwongozo, ushauri, and msaada wa mawasiliano ya kuaminika kulingana na mahitaji ya kutuma pesa kimataifa.
            </p>
            <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
              <GoldBtn href={WA_MAIN}><MessageCircle size={18}/> Omba Msaada WhatsApp</GoldBtn>
              <GoldBtn href={WA_SAFE} outline>Uliza Njia Salama</GoldBtn>
              <GoldBtn href={WA_RATE} outline><Zap size={15}/> Msaada wa Haraka</GoldBtn>
            </div>
            <div style={{ marginTop:28, display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
              {["✅ Mwongozo wa bure","✅ Kupitia WhatsApp","✅ Kiswahili"].map(t => (
                <div key={t} style={{ fontSize:13, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{t}</div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 10. TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color={PURPLE}><Star size={13}/> Maoni</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
              Watu Wanasema Nini
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:18 }}>
            {(TESTIMONIALS || []).map((t, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"28px 24px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:20, right:22, fontSize:48, color:`${G}15`, fontFamily:"Georgia,serif", lineHeight:1 }}>&ldquo;</div>
                <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={G} color={G}/>)}
                </div>
                <p style={{ fontSize:14.5, color:"rgba(255,255,255,.75)", lineHeight:1.75, fontStyle:"italic", marginBottom:22 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${t.color || G},${t.color || G}80)`, display:"grid", placeItems:"center", fontWeight:900, fontSize:16, color:"#fff", flexShrink:0 }}>
                    {t.initials || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{t.context}</div>
                  </div>
                  {t.badge && (
                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:`${GREEN}12`, border:`1px solid ${GREEN}25`, borderRadius:20, color:GREEN, fontSize:10, fontWeight:900 }}>
                      <BadgeCheck size={11}/> {t.badge}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ══ 11. FAQ ══════════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <SectionLabel color={BLUE}><HelpCircle size={13}/> FAQ</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
              Maswali Yanayoulizwa Mara kwa Mara
            </h2>
          </div>
          <div style={{ maxWidth:760, margin:"0 auto", display:"grid", gap:10 }}>
            {(FAQS || []).map((faq, i) => <FaqItem key={i} {...faq}/>)}
          </div>
        </W>
      </section>

      {/* ══ 12. DISCLAIMER ═══════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 clamp(80px,12vw,120px)" }}>
        <W>
          <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:20, padding:"28px 32px", display:"flex", gap:18, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,.04)", display:"grid", placeItems:"center", flexShrink:0 }}>
              <Eye size={22} color="rgba(255,255,255,.4)"/>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>Uwazi Kutoka STEA</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.5)", lineHeight:1.8, margin:0 }}>
                <strong style={{ color:"#fff" }}>STEA haitoi huduma za kifedha moja kwa moja kwa sasa.</strong> Tunatoa mwongozo, ushauri, and msaada wa mawasiliano ya kuaminika kulingana na mahitaji ya mtumiaji.
                Tafadhali zingatia sheria za nchi yako and uthibitishe maelezo yote kabla ya kufanya muamala wowote wa kifedha.
              </p>
            </div>
          </div>
        </W>
      </section>

    </div>
  );
}
