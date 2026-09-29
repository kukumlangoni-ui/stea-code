import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, Cpu, Copy, Check, ArrowRight,
  ExternalLink, Zap, BookOpen,
  Lightbulb, Search, X
} from "lucide-react";
import AnimatedAssistantOrb from "../components/AnimatedAssistantOrb";
import { useSettings } from '../contexts/SettingsContext';
import { TechHubNavbar } from "./TechHubPage.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

// ─── AI Tools data ────────────────────────────────────
const AI_TOOLS = [
  {
    id: "chatgpt", name: "ChatGPT", emoji: "🤖", color: "#10a37f",
    desc: "Msaidizi mkubwa wa AI kwa maandishi, maswali na ubunifu. Inafanya kazi vizuri kwa Kiswahili.",
    use: "Andika insha, fanya research, jifunza masomo, tengeneza code",
    url: "https://chat.openai.com", badge: "Popular", free: true,
  },
  {
    id: "gemini", name: "Google Gemini", emoji: "✨", color: "#4285f4",
    desc: "AI ya Google yenye nguvu sana. Inaweza kuona picha na kufanya uchambuzi wa hali ya juu.",
    use: "Analyze picha, fanya research, tengeneza content, fanya math",
    url: "https://gemini.google.com", badge: "New", free: true,
  },
  {
    id: "claude", name: "Claude (Anthropic)", emoji: "🧠", color: "#c96442",
    desc: "AI ya maandishi yenye uwezo mkubwa wa kuelewa muktadha mrefu na kufanya kazi ngumu.",
    use: "Maandishi marefu, uchambuzi wa kina, coding, kufundisha",
    url: "https://claude.ai", badge: "Smart", free: true,
  },
  {
    id: "copilot", name: "Microsoft Copilot", emoji: "💫", color: "#0078d4",
    desc: "AI iliyojengwa ndani ya Microsoft — inafaa kwa Word, Excel, PowerPoint na Windows.",
    use: "Office documents, Excel formulas, Windows productivity",
    url: "https://copilot.microsoft.com", badge: "Free", free: true,
  },
  {
    id: "midjourney", name: "Midjourney", emoji: "🎨", color: "#8b5cf6",
    desc: "Zana bora zaidi ya kutengeneza picha kwa kutumia maandishi tu (text-to-image).",
    use: "Logos, artwork, poster design, product mockups",
    url: "https://midjourney.com", badge: "Creative", free: false,
  },
  {
    id: "canva-ai", name: "Canva AI", emoji: "🖼️", color: "#00c4cc",
    desc: "Canva ina AI iliyojengwa ndani — tengeneza designs, piga picha za AI, na edit kwa urahisi.",
    use: "Social media posts, flyers, presentations, logos",
    url: "https://canva.com", badge: "Design", free: true,
  },
  {
    id: "udio", name: "Udio / Suno", emoji: "🎵", color: "#ec4899",
    desc: "AI inayotengeneza muziki — andika tu maneno na AI itatengeneza wimbo kamili.",
    use: "Tengeneza muziki, jingles za biashara, background music",
    url: "https://udio.com", badge: "Music", free: true,
  },
  {
    id: "elevenlabs", name: "ElevenLabs", emoji: "🔊", color: "#f59e0b",
    desc: "AI ya sauti — geuza maandishi kuwa sauti ya binadamu inayosikika ya kawaida.",
    use: "Podcasts, voiceovers, YouTube narration, audio content",
    url: "https://elevenlabs.io", badge: "Voice", free: true,
  },
  {
    id: "perplexity", name: "Perplexity AI", emoji: "🔍", color: "#06b6d4",
    desc: "Search engine ya AI inayotoa majibu ya moja kwa moja na vyanzo vya kweli vya habari.",
    use: "Research, habari za sasa, fact-checking, utafutaji wa kina",
    url: "https://perplexity.ai", badge: "Research", free: true,
  },
];

// ─── Beginner guides ──────────────────────────────────
const GUIDES = [
  { emoji: "🚀", title: "Jinsi ya Kuanza na ChatGPT", desc: "Hatua za mwanzo kabisa — kuanzia kufungua account hadi kupata majibu mazuri.", tag: "Beginners", color: "#10a37f" },
  { emoji: "📸", title: "Tengeneza Picha kwa AI (Bure)", desc: "Jifunze kutumia Canva AI, Bing Image Creator na Gemini kutengeneza picha za kipekee.", tag: "Creative", color: "#8b5cf6" },
  { emoji: "💼", title: "AI kwa Biashara Ndogo", desc: "Jinsi ya kutumia AI kuandika maelezo ya bidhaa, kutumia social media na kujibu wateja.", tag: "Business", color: G },
  { emoji: "🎓", title: "AI kwa Wanafunzi", desc: "Jinsi ya kutumia AI kusaidia masomo — kuelewa masomo magumu, kuandika insha, na kufanya research.", tag: "Students", color: "#3b82f6" },
  { emoji: "🎨", title: "Canva AI na Design", desc: "Tumia Canva na AI yake kutengeneza designs za hali ya juu bila ujuzi wa design.", tag: "Design", color: "#00c4cc" },
  { emoji: "📝", title: "Andika Vizuri kwa AI", desc: "Vidokezo vya kuandika prompts bora ili upate majibu mazuri kutoka kwa AI yoyote.", tag: "Skills", color: "#ec4899" },
];

// ─── Prompt examples ──────────────────────────────────
const PROMPTS = [
  { cat: "Biashara", prompt: "Niandikia maelezo ya bidhaa yangu ya [jina la bidhaa] kwa Kiswahili. Bidhaa hii inafanya [kazi gani]. Wateja wangu ni [aina ya wateja]. Maelezo yawe na maneno 80-100 na yavutie.", },
  { cat: "Masomo", prompt: "Nifundishe [mada] kwa njia rahisi na mifano ya kuelewa. Nianze na misingi ya msingi kabisa. Niambie pia mifano ya maisha halisi inayohusiana na mada hii.", },
  { cat: "Ubunifu", prompt: "Niandikia hadithi fupi ya Kiswahili kuhusu [mada] yenye urefu wa maneno 200. Hadithi iwe na mhusika mkuu, tatizo, na mwisho wa furaha.", },
  { cat: "Kazi / CV", prompt: "Nisaidie kuandika summary ya CV yangu. Mimi ni [mtu wa aina gani], nina uzoefu wa miaka [namba] katika [sekta]. Strengths zangu ni [orodha]. Summary iwe ya mistari 3-4.", },
  { cat: "Tafsiri", prompt: "Tafsiri sentensi hii kutoka [lugha] kwenda [lugha nyingine], ukihifadhi maana kamili na mtindo: '[sentensi unayotaka kutafsiri]'", },
  { cat: "Social Media", prompt: "Niandikia caption ya Instagram/Facebook kwa Kiswahili kuhusu [mada au bidhaa]. Iwe na emoji, hashtags 3-5 muhimu, na wito wa hatua (CTA).", },
];

// ─── Shared components ────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${copied ? "#10b981" : BORDER}`, background: copied ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.04)", color: copied ? "#10b981" : "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .2s", flexShrink: 0 }}>
      {copied ? <Check size={12}/> : <Copy size={12}/>}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Main AILabPage ───────────────────────────────────
export default function AILabPage() {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState("tools");
  const [searchQ, setSearchQ] = useState("");

  const filteredTools = AI_TOOLS.filter(t =>
    !searchQ || t.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.use.toLowerCase().includes(searchQ.toLowerCase())
  );

  const TABS = [
    { id: "tools",   label: "AI Tools",        icon: <Bot size={15}/> },
    { id: "guides",  label: "Mwongozo wa AI",  icon: <BookOpen size={15}/> },
    { id: "prompts", label: "Prompt Examples", icon: <Cpu size={15}/> },
  ];

  return (
    <div style={{ paddingTop: 0, paddingBottom: 80, minHeight: "100vh", background: DARK, color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <TechHubNavbar />

      {/* ── HERO ── */}
      <section style={{ padding: "52px 20px 40px", textAlign: "center", background: `radial-gradient(ellipse at 50% 0%, rgba(245,166,35,.14) 0%, transparent 55%)` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 999, color: G, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 22 }}>
          <Sparkles size={13}/> STEA AI Lab
        </div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-.04em" }}>
          Zana za <span style={{ background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Akili Bandia</span>
          <br />kwa Watanzania
        </motion.h1>
        <p style={{ color: "rgba(255,255,255,.55)", maxWidth: 520, margin: "0 auto 28px", fontSize: 16, lineHeight: 1.7 }}>
          AI tools bora zaidi, guides za Kiswahili, na prompt templates — zote sehemu moja. Anza kutumia AI leo bila uzoefu wowote.
        </p>

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          {[["9+",t("ailab_stat_tools")],[t("practice_stats_free"),t("ailab_stat_free")],["Kiswahili",t("ailab_stat_guide")],["2025+",t("ailab_stat_updated")]].map(([n,l]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 20, color: G }}>{n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TABS ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${BORDER}`, marginBottom: 36, paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: "12px 20px", border: "none", borderBottom: `2px solid ${activeTab === t.id ? G : "transparent"}`, background: "transparent", color: activeTab === t.id ? G : "rgba(255,255,255,.5)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all .2s", marginBottom: -1 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }}>

            {/* ── TOOLS TAB ── */}
            {activeTab === "tools" && (
              <div>
                {/* Search */}
                <div style={{ position: "relative", maxWidth: 480, marginBottom: 28 }}>
                  <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.35)", pointerEvents: "none" }}/>
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Tafuta AI tool..."
                    style={{ width: "100%", height: 46, borderRadius: 13, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)", color: "#fff", paddingLeft: 40, paddingRight: searchQ ? 36 : 16, outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = G}
                    onBlur={e => e.target.style.borderColor = BORDER}/>
                  {searchQ && <button onClick={() => setSearchQ("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer" }}><X size={13}/></button>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 18 }}>
                  {filteredTools.map((tool, i) => (
                    <motion.div key={tool.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${tool.color}30`; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,.3)`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}>

                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: `${tool.color}15`, border: `1px solid ${tool.color}25`, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>
                          {tool.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <h3 style={{ fontWeight: 900, fontSize: 16, margin: 0 }}>{tool.name}</h3>
                            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900, background: `${tool.color}18`, color: tool.color, textTransform: "uppercase", letterSpacing: ".04em" }}>{tool.badge}</span>
                            {tool.free && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900, background: "rgba(16,185,129,.12)", color: "#10b981" }}>BURE</span>}
                          </div>
                        </div>
                      </div>

                      {/* Desc */}
                      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)", lineHeight: 1.65, margin: 0 }}>{tool.desc}</p>

                      {/* Use cases */}
                      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Tumia kwa:</div>
                        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>{tool.use}</div>
                      </div>

                      {/* CTA */}
                      <a href={tool.url} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, background: `${tool.color}18`, border: `1px solid ${tool.color}30`, color: tool.color, fontWeight: 800, fontSize: 14, textDecoration: "none", transition: "all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${tool.color}25`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${tool.color}18`; }}>
                        <ExternalLink size={14}/> Fungua {tool.name}
                      </a>
                    </motion.div>
                  ))}
                </div>

                {filteredTools.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,.02)", borderRadius: 20, border: `1px dashed rgba(255,255,255,.1)` }}>
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                      <div style={{ background: "rgba(5,6,10,0.5)", padding: 16, borderRadius: 24, border: "1px solid rgba(245,182,66,0.2)" }}>
                        <AnimatedAssistantOrb />
                      </div>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Hakuna tool inayolingana</h3>
                    <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Jaribu maneno mengine ya utafutaji</p>
                  </div>
                )}

                {/* Pro tip */}
                <div style={{ marginTop: 32, background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 18, padding: "20px 24px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Lightbulb size={20} color={G} style={{ flexShrink: 0, marginTop: 2 }}/>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: G, marginBottom: 6 }}>💡 Kidokezo cha Mwanzo</div>
                    <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)", lineHeight: 1.65, margin: 0 }}>
                      Ikiwa hujajua kuanza wapi, anza na <strong style={{ color: "#fff" }}>ChatGPT au Google Gemini</strong> — zote ni bure na zinafanya kazi vizuri kwa Kiswahili. Nenda kwenye kichupo cha <em>Prompt Examples</em> kupata mifano ya maswali mazuri.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── GUIDES TAB ── */}
            {activeTab === "guides" && (
              <div>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: "clamp(24px,4vw,36px)", marginBottom: 10 }}>
                    Mwongozo wa <span style={{ color: G }}>Kuanza na AI</span>
                  </h2>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15 }}>Guides hizi zimeandikwa kwa Kiswahili — hata kama hujawahi kutumia AI kabla, tutakuonyesha jinsi ya kuanza.</p>
                </div>

                {/* What AI can do section */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 22, padding: "32px", marginBottom: 32 }}>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 22, marginBottom: 20 }}>AI Inaweza Kukusaidia na Nini?</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 }}>
                    {[
                      { emoji: "✍️", title: "Kuandika", items: ["Insha na makala", "CV na cover letters", "Maelezo ya bidhaa", "Ujumbe wa biashara"] },
                      { emoji: "📚", title: "Kujifunza", items: ["Eleza masomo magumu", "Jibu maswali yoyote", "Tafsiri lugha", "Tengeneza notes"] },
                      { emoji: "💡", title: "Ubunifu", items: ["Tengeneza picha", "Andika hadithi", "Compose muziki", "Tengeneza designs"] },
                      { emoji: "💼", title: "Biashara", items: ["Social media posts", "Majibu ya wateja", "Uchambuzi wa data", "Business planning"] },
                    ].map((sec, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,.02)", borderRadius: 14, padding: "18px" }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>{sec.emoji}</div>
                        <h4 style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>{sec.title}</h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                          {sec.items.map((item, j) => (
                            <li key={j} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                              <div style={{ width: 5, height: 5, borderRadius: "50%", background: G, flexShrink: 0 }}/>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guides grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 18 }}>
                  {GUIDES.map((g, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "24px", cursor: "default" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ fontSize: 36 }}>{g.emoji}</div>
                        <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 900, background: `${g.color}15`, color: g.color, textTransform: "uppercase" }}>{g.tag}</span>
                      </div>
                      <h3 style={{ fontWeight: 900, fontSize: 16, marginBottom: 8, lineHeight: 1.3 }}>{g.title}</h3>
                      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.5)", lineHeight: 1.65, margin: "0 0 16px" }}>{g.desc}</p>
                      <button onClick={() => setActiveTab("prompts")}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: g.color, fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        Ona Prompts <ArrowRight size={13}/>
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Beginner tip */}
                <div style={{ marginTop: 36, background: `rgba(59,130,246,.06)`, border: `1px solid rgba(59,130,246,.15)`, borderRadius: 20, padding: "28px 28px" }}>
                  <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 16 }}>🎯 Jinsi ya Kupata Majibu Mazuri Zaidi</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
                    {["Kuwa maalum — AI inafanya kazi vizuri zaidi ukitoa maelezo ya kina","Waambie lugha unayotaka — 'nijibu kwa Kiswahili'","Sema urefu unaouhitaji — 'maneno 100' au 'mistari 3'","Rudia na uboreshwe — 'fanya jibu hili kuwa fupi zaidi'","Toa mfano — 'niandikike kama hii: [mfano]'","Waulize maswali ya kufuata ili kupata maelezo zaidi"].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(59,130,246,.15)", color: "#60a5fa", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 11, fontWeight: 900 }}>{i+1}</div>
                        <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.65)", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PROMPTS TAB ── */}
            {activeTab === "prompts" && (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: "clamp(24px,4vw,36px)", marginBottom: 10 }}>
                    Prompt <span style={{ color: G }}>Templates</span>
                  </h2>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15 }}>Copy prompt yoyote, badilisha maneno yaliyomo kwenye [mabano], na itumie kwenye ChatGPT, Gemini, au Claude.</p>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  {PROMPTS.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, background: `${G}15`, color: G }}>{p.cat}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <CopyBtn text={p.prompt}/>
                        </div>
                      </div>
                      <div style={{ padding: "18px 20px" }}>
                        <pre style={{ fontFamily: "inherit", fontSize: 14, color: "rgba(255,255,255,.75)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {p.prompt}
                        </pre>
                        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["ChatGPT","Gemini","Claude"].map(tool => (
                            <span key={tool} style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.45)" }}>✓ {tool}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Custom prompt tip */}
                <div style={{ marginTop: 28, background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 18, padding: "22px 24px", display: "flex", gap: 14 }}>
                  <Zap size={20} color={G} style={{ flexShrink: 0, marginTop: 2 }}/>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: G, marginBottom: 6 }}>Tengeneza Prompt Yako Mwenyewe</div>
                    <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)", lineHeight: 1.65, margin: "0 0 12px" }}>
                      Mfumo wa prompt nzuri: <strong style={{ color: "#fff" }}>[Jukumu la AI] + [Kazi unayotaka] + [Muktadha/Details] + [Format unayotaka]</strong>
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", margin: 0, fontStyle: "italic" }}>
                      Mfano: &quot;Wewe ni mtaalamu wa biashara. Niambie jinsi ya kuanzisha biashara ndogo ya nguo Dar es Salaam na mtaji wa Tsh 500,000. Toa hatua 5 na ushauri wa vitendo.&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
