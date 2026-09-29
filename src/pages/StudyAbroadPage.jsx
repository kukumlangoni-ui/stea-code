/**
 * StudyAbroadPage.jsx — STEA Student Center
 * Study Abroad Global: scholarships, countries, requirements, trusted agents, application steps
 * NO money transfer / money guide content here
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ArrowLeft, ExternalLink, ChevronDown, CheckCircle,
  AlertCircle, BookOpen, FileText, Star, MapPin, Award,
  Users, Calendar, ArrowRight, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext.jsx";

const G    = "#F5A623";
const G2   = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.08)";

const W = ({ children }) => (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)" }}>
    {children}
  </div>
);

// ── Tabs ─────────────────────────────────────────────
const TABS = [
  { id: "overview",     label: "Overview",            emoji: "🌍" },
  { id: "scholarships", label: "Scholarships",       emoji: "🏆" },
  { id: "countries",    label: "Countries",    emoji: "🗺️" },
  { id: "requirements", label: "Requirements",            emoji: "📋" },
  { id: "steps",        label: "Application Steps",    emoji: "📝" },
  { id: "agents",       label: "Trusted Agents", emoji: "🤝" },
  { id: "tests",        label: "IELTS / TOEFL",      emoji: "📖" },
];

// ── Data ─────────────────────────────────────────────
const SCHOLARSHIPS = [
  {
    name: "Mastercard Foundation Scholars Program",
    countries: "Canada, USA, UK, Africa",
    level: "Degree & Masters",
    coverage: "Ada kamili + accommodation + nauli",
    deadline: "Angalia tovuti kila mwaka",
    url: "https://mastercardfdn.org/all/scholars/",
    color: "#f59e0b",
    tag: "Maarufu Sana",
  },
  {
    name: "Chevening Scholarships (UK)",
    countries: "United Kingdom",
    level: "Masters (1 year)",
    coverage: "Ada + maisha + nauli ya kwenda na kurudi",
    deadline: "Novemba kila mwaka",
    url: "https://www.chevening.org",
    color: "#3b82f6",
    tag: "UK Government",
  },
  {
    name: "Commonwealth Scholarships",
    countries: "UK & Commonwealth Nations",
    level: "Masters & PhD",
    coverage: "Ada kamili + allowance ya kila mwezi",
    deadline: "Desemba / Januari",
    url: "https://cscuk.fcdo.gov.uk",
    color: "#10b981",
    tag: "Commonwealth",
  },
  {
    name: "Chinese Government Scholarship (CSC)",
    countries: "China",
    level: "Degree, Masters, PhD",
    coverage: "Ada kamili + bursary ya kila mwezi + chumba",
    deadline: "Machi – Aprili kila mwaka",
    url: "https://www.csc.edu.cn",
    color: "#ef4444",
    tag: "China Gov",
  },
  {
    name: "Fulbright Foreign Student Program (USA)",
    countries: "United States of America",
    level: "Masters & PhD",
    coverage: "Ada + maisha + bima ya afya + nauli",
    deadline: "Machi – Mei (Tanzania)",
    url: "https://foreign.fulbrightonline.org",
    color: "#6366f1",
    tag: "USA Government",
  },
  {
    name: "Erasmus Mundus (EU)",
    countries: "Ulaya (EU countries)",
    level: "Masters & PhD",
    coverage: "Ada + posho ya kila mwezi + nauli",
    deadline: "Januari – Machi",
    url: "https://erasmus-plus.ec.europa.eu",
    color: "#8b5cf6",
    tag: "EU",
  },
  {
    name: "Japanese Government Scholarship (MEXT)",
    countries: "Japan",
    level: "Undergraduate, Masters, PhD",
    coverage: "Ada kamili + posho ya kila mwezi",
    deadline: "Mei – Juni (kupitia embassy)",
    url: "https://www.mext.go.jp/en/policy/education/highered/title02/detail02/1373897.htm",
    color: "#ec4899",
    tag: "Japan Gov",
  },
  {
    name: "Turkish Government Scholarship (Türkiye Bursları)",
    countries: "Turkey",
    level: "Degree, Masters, PhD",
    coverage: "Ada + posho + chumba + bima + kozi ya Kituruki",
    deadline: "Februari – Machi",
    url: "https://www.turkiyeburslari.gov.tr",
    color: "#f97316",
    tag: "Turkey Gov",
  },
];

const COUNTRIES = [
  {
    name: "China 🇨🇳",
    desc: "Scholarships nyingi za serikali (CSC). Vyuo kama GXNU, GUET, Beijing ni maarufu. Wanafunzi wengi wa Tanzania wanasomea China kwa CSC Scholarship.",
    pros: ["Scholarship nyingi za serikali", "Ada nafuu kwa self-sponsored", "Fursa za biashara"],
    req: "IELTS/HSK au darasa la Kichina. Matokeo ya Form 6.",
    color: "#ef4444",
  },
  {
    name: "United Kingdom 🇬🇧",
    desc: "Chevening, Commonwealth, na scholarship nyingine nyingi. Programu za Masters za miaka 1 zinapatikana. IELTS inahitajika.",
    pros: ["Vyuo vya kiwango cha juu (Oxford, Imperial)", "Masters ya mwaka 1", "Chevening inalipa kila kitu"],
    req: "IELTS 6.5+. Degree ya awali. Experience ya kazi (kwa Chevening).",
    color: "#3b82f6",
  },
  {
    name: "United States 🇺🇸",
    desc: "Fulbright na scholarships za university nyingi. GRE/GMAT inaweza kuhitajika. Fursa za postgraduate ni nyingi.",
    pros: ["Vyuo vya best globally", "Fursa za kazi baada ya masomo", "Scholarship nyingi"],
    req: "TOEFL/IELTS. GRE kwa programu nyingi. Degree ya kwanza.",
    color: "#6366f1",
  },
  {
    name: "Turkey 🇹🇷",
    desc: "Türkiye Bursları inashughulikia kila kitu — ada, maisha, nauli. Wanafunzi wengi kutoka Afrika Mashariki wanasomea Turkey.",
    pros: ["Scholarship inayolipa kila kitu", "Kozi za Kiingereza zinapatikana", "Mazingira mazuri"],
    req: "Matokeo mazuri ya sekondari / chuo. Barua ya motisha. Passport.",
    color: "#f97316",
  },
  {
    name: "Germany 🇩🇪",
    desc: "DAAD scholarships na vyuo vingi vya bure (public universities). Kozi nyingi kwa Kiingereza katika ngazi ya Masters.",
    pros: ["Ada nyingi bure (public unis)", "DAAD inalipa posho", "Uchumi mkubwa = fursa za kazi"],
    req: "Kiingereza (IELTS/TOEFL) au Kijerumani (kwa baadhi). Degree ya awali.",
    color: "#facc15",
  },
  {
    name: "Japan 🇯🇵",
    desc: "MEXT Scholarship ya serikali. Vyuo kama Tokyo University ni vya hali ya juu. Wanafunzi wanaweza kuomba kupitia embassy ya Japan Tanzania.",
    pros: ["Scholarship ya serikali (MEXT)", "Teknolojia ya hali ya juu", "Mazingira salama"],
    req: "Matokeo bora. Maslahi ya teknolojia/sayansi husaidia. Kozi ya Kijapani inaweza kuhitajika.",
    color: "#ec4899",
  },
];

const APP_STEPS = [
  {
    num: "01",
    title: "Jiandaa Mapema — Miaka 1-2 Kabla",
    desc: "Amua nchi na programu unazotaka. Angalia mahitaji (IELTS/TOEFL, GRE). Anza kujifunza Kiingereza au lugha nyingine inayohitajika. Unda akaunti ya LinkedIn yenye taarifa kamili.",
    color: G,
    tips: ["Angalia rankings za vyuo (QS World Rankings)", "Join groups za wanafunzi wa Tanzania nje ya nchi", "Bonyeza kufuatilia scholarship portals"],
  },
  {
    num: "02",
    title: "Fanya Mitihani ya Lugha (IELTS / TOEFL)",
    desc: "Mitihani hii inachukua miezi 2-3 ya maandalizi. Jiandikishe mapema. IELTS na TOEFL zinakubaliwa duniani kote. Angalia kiwango kinachohitajika na chuo unacholenga.",
    color: "#60a5fa",
    tips: ["IELTS Academic (si IELTS General) kwa masomo", "Score ya kawaida: 6.0–7.0 kwa UK/US", "Majibu huchukua siku 13 (IELTS)"],
  },
  {
    num: "03",
    title: "Tafuta na Chagua Scholarship Unayofaa",
    desc: "Tumia portals kama Chevening, CSC, Türkiye Bursları. Angalia tarehe za mwisho (deadlines). Kila scholarship ina mahitaji tofauti — soma kwa makini.",
    color: "#10b981",
    tips: ["Usiomba scholarship moja tu — ombe nyingi", "Deadlines nyingi huwa Novemba–Machi", "Angalia scholarship za university moja kwa moja pia"],
  },
  {
    num: "04",
    title: "Andaa Nyaraka Zako",
    desc: "Kusanya nyaraka zote kabla ya mwisho. Hati nyingi zinahitaji kuthibitishwa (certified/notarized). Sura za hati lazima ziwe wazi na za sasa.",
    color: "#a855f7",
    tips: ["Thibitisha hati kwa Notary Public au Wizara ya Mambo ya Nje", "Picha za pasporti: background nyeupe, hivi karibuni", "Transcript ya chuo iwe na muhuri rasmi"],
  },
  {
    num: "05",
    title: "Andika Personal Statement / Motivation Letter",
    desc: "Hii ndiyo sehemu muhimu zaidi ya maombi mengi. Eleza ni nani wewe, kwa nini unataka scholarship hii, na utafanya nini baada ya masomo. Iwe ya kweli na ya kuvutia.",
    color: "#f472b6",
    tips: ["Anza na hadithi inayovutia — si 'My name is...'", "Eleza jinsi masomo yatakavyosaidia Tanzania/Afrika", "Acha mtu mwingine aisomee kabla hujawasilisha"],
  },
  {
    num: "06",
    title: "Omba na Fuatilia",
    desc: "Wasilisha maombi yako kwa wakati. Hifadhi nakala za kila kitu ulichotuma. Fuatilia hali ya maombi yako kupitia portals au email. Jibu haraka ukipigiwa simu au ukiandikiwa.",
    color: "#fb923c",
    tips: ["Thibitisha email yako inafanya kazi", "Angalia spam/junk folder pia", "Jibu interview invitation ndani ya saa 24"],
  },
  {
    num: "07",
    title: "Pokea Jibu na Jiandae",
    desc: "Ukipata scholarship au admission — hongera! Sasa jiandae: pata passport na visa, tafuta mahali pa kuishi, jifunze kuhusu nchi unayokwenda, na wasiliana na wanafunzi wengine wa Tanzania wanaosomea nchi hiyo.",
    color: "#4ade80",
    tips: ["Jiunge na groups za wanafunzi wa Tanzania nje", "Fungua akaunti ya benki ya kimataifa (Wise, Equity)", "Jifunza mambo ya msingi ya utamaduni wa nchi hiyo"],
  },
];

const TRUSTED_AGENTS = [
  {
    name: "Tanzania Education Authority (TEA)",
    type: "Serikali",
    desc: "Chombo rasmi cha serikali kwa utambuzi wa shahada za nje. Ziara: Wizara ya Elimu, Dar es Salaam.",
    url: "https://www.moe.go.tz",
    color: G,
    verified: true,
  },
  {
    name: "British Council Tanzania",
    type: "Shirika la Kimataifa",
    desc: "Inasaidia wanafunzi kutaka kusoma UK. Inatoa IELTS, taarifa za vyuo vya UK, na programu za scholarship.",
    url: "https://www.britishcouncil.or.tz",
    color: "#3b82f6",
    verified: true,
  },
  {
    name: "US Embassy Dar es Salaam — Education (EducationUSA)",
    type: "Embassy ya USA",
    desc: "Inatoa ushauri bure wa kusomea USA, taarifa za scholarship, na msaada wa application.",
    url: "https://tz.usembassy.gov/education-culture/educationusa/",
    color: "#6366f1",
    verified: true,
  },
  {
    name: "Chinese Embassy Tanzania — Scholarship Office",
    type: "Embassy ya China",
    desc: "Inasimamia CSC Government Scholarship applications kwa wanafunzi wa Tanzania.",
    url: "https://www.mofcom.gov.cn",
    color: "#ef4444",
    verified: true,
  },
  {
    name: "Türkiye Bursları Official Portal",
    type: "Serikali ya Turkey",
    desc: "Portal rasmi ya scholarship ya serikali ya Turkey. Omba moja kwa moja bila wakala.",
    url: "https://www.turkiyeburslari.gov.tr",
    color: "#f97316",
    verified: true,
  },
  {
    name: "DAAD Tanzania (German Academic Exchange)",
    type: "Shirika la Kimataifa",
    desc: "Inasaidia wanafunzi wa Tanzania kutaka kusomea Germany. DAAD scholarships na maelezo ya vyuo vya Ujerumani.",
    url: "https://www.daad.de/en/",
    color: "#facc15",
    verified: true,
  },
];

const REQUIRED_DOCS = [
  { doc: "Passport yenye uhalali wa angalau miaka 2", note: "Pasipoti lazima iwe sahihi — isiishe mapema" },
  { doc: "Transcript ya masomo (chuo/shule)", note: "Iwe certified/notarized — muhuri rasmi" },
  { doc: "Certificate ya Form 4 (CSEE)", note: "Kwa programu za degree" },
  { doc: "Certificate ya Form 6 (ACSEE)", note: "Kwa wengi wa scholarships za degree" },
  { doc: "Degree Certificate (kwa Masters/PhD)", note: "Na transcript ya kila semester" },
  { doc: "IELTS / TOEFL Score Report", note: "Si zaidi ya miaka 2 iliyopita" },
  { doc: "Personal Statement / Motivation Letter", note: "500–1000 maneno — ya kibinafsi na ya kweli" },
  { doc: "Barua ya Mapendekezo (2-3)", note: "Kutoka kwa walimu / wasimamizi wa kazi" },
  { doc: "CV / Resume ya kisasa", note: "Max kurasa 2, format ya wazi" },
  { doc: "Picha za Pasipoti (2+)", note: "Background nyeupe, hivi karibuni" },
  { doc: "Birth Certificate", note: "Na tafsiri ya Kiingereza ikiwa ni Kiswahili" },
  { doc: "Medical Certificate (baadhi ya scholarship)", note: "Kutoka hospitali inayotambuliwa" },
];

const LANGUAGE_TESTS = [
  {
    name: "IELTS Academic",
    org: "British Council / IDP",
    usage: "UK, Australia, Canada, Europe, na nchi nyingi",
    bands: "6.0–7.0 kwa Undergraduate; 6.5–7.5 kwa Masters",
    prep: "Angalau miezi 2-3 ya maandalizi. Practice papers zipo online bure.",
    url: "https://www.ielts.org",
    color: "#3b82f6",
  },
  {
    name: "TOEFL iBT",
    org: "ETS (Educational Testing Service)",
    usage: "USA hasa, lakini inakubaliwa duniani kote",
    bands: "Score 80-100 kwa Undergraduate; 90-110 kwa Masters",
    prep: "Miezi 2-3. ETS ina materials rasmi za practice.",
    url: "https://www.ets.org/toefl",
    color: "#10b981",
  },
  {
    name: "SAT / ACT",
    org: "College Board / ACT Inc.",
    usage: "Hasa USA kwa Undergraduate programs",
    bands: "SAT 1200+; ACT 24+ kwa vyuo vizuri",
    prep: "Miezi 3-6. Khan Academy ina kozi bure za SAT.",
    url: "https://satsuite.collegeboard.org",
    color: "#6366f1",
  },
  {
    name: "GRE",
    org: "ETS",
    usage: "Masters na PhD nchini USA hasa",
    bands: "Score 310+ (Quant+Verbal) inachukuliwa vizuri",
    prep: "Miezi 3-4. Magoosh na Manhattan Prep ni vizuri.",
    url: "https://www.ets.org/gre",
    color: "#a855f7",
  },
  {
    name: "HSK (Chinese Proficiency Test)",
    org: "Hanban / China",
    usage: "Kwa kujiunga na vyuo vya China bila scholarship ya Kiingereza",
    bands: "HSK 4 au 5 kwa degree; HSK 5-6 kwa Masters",
    prep: "Miezi 6-12. Apps kama HelloChinese na ChineseSkill zinasaidia.",
    url: "https://www.chinesetest.cn",
    color: "#ef4444",
  },
];

// ── Reusable components ───────────────────────────────
function Chip({ children, color = G }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 900,
      background: `${color}14`, color, border: `1px solid ${color}25`,
      textTransform: "uppercase", letterSpacing: "0.07em",
    }}>
      {children}
    </span>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${open ? G + "35" : BORDER}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "left", cursor: "pointer", gap: 16 }}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: .2 }}>
          <ChevronDown size={16} color={G} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 16px", color: "rgba(255,255,255,.6)", lineHeight: 1.7, fontSize: 13.5 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────
function TabBtn({ tab, id, label, emoji, setTab }) {
  const active = tab === id;
  return (
    <button onClick={() => setTab(id)} style={{
      display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
      borderRadius: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap",
      background: active ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.05)",
      color: active ? "#111" : "rgba(255,255,255,.55)",
      fontWeight: active ? 800 : 700, fontSize: 13,
      transition: "all .2s", flexShrink: 0,
      boxShadow: active ? `0 4px 14px ${G}30` : "none",
    }}>
      {emoji} {label}
    </button>
  );
}

// ── Main export ───────────────────────────────────────
export default function StudyAbroadPage() {
  const { t } = useSettings();
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [pageError] = useState(null);
  const [tab, setTab] = useState("overview");

  if (hasError) return (
    <div style={{ minHeight:"100vh", background:"#06080f", display:"grid", placeItems:"center", textAlign:"center", padding:32 }}>
      <div>
        <div style={{ fontSize:48, marginBottom:16 }}>✈️</div>
        <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:24, fontWeight:900, marginBottom:12 }}>Study Abroad</h2>
        <p style={{ color:"rgba(255,255,255,.45)", fontSize:15, marginBottom:24 }}>This section is being updated. Check back soon.</p>
        <button onClick={() => navigate("/exams")} style={{ padding:"10px 24px", borderRadius:12, background:"linear-gradient(135deg,#F5A623,#FFD17C)", color:"#111", fontWeight:800, border:"none", cursor:"pointer" }}>← Back to Student Center</button>
      </div>
    </div>
  );

  if (pageError) {
    return (
      <div style={{ minHeight:"100vh", background:"#06080f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✈️</div>
        <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:24, fontWeight:900, marginBottom:12 }}>Study Abroad Guide</h2>
        <p style={{ color:"rgba(255,255,255,.45)", fontSize:14, marginBottom:24 }}>Coming soon — detailed guide on studying abroad.</p>
        <button onClick={() => navigate("/exams")} style={{ padding:"10px 22px", borderRadius:12, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"rgba(255,255,255,.7)", fontWeight:700, fontSize:13, cursor:"pointer" }}>← Back to Student Center</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#fff", overflowX: "hidden", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{
        padding: "clamp(72px,10vw,110px) 20px 52px",
        background: "radial-gradient(ellipse at 50% -5%, rgba(56,189,248,0.12) 0%, transparent 55%)",
        textAlign: "center", borderBottom: `1px solid ${BORDER}`,
      }}>
        <W>
          {/* Back button */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 28 }}>
            <button onClick={() => navigate("/exams")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`,
              color: "rgba(255,255,255,.6)", borderRadius: 12, padding: "8px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .18s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.09)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
            >
              <ArrowLeft size={14} /> Student Center
            </button>
          </div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 18px", background: "rgba(56,189,248,.1)",
              border: "1px solid rgba(56,189,248,.25)", borderRadius: 999,
              color: "#38bdf8", fontSize: 12, fontWeight: 900,
              marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              <Globe size={13} /> Study Abroad Global
            </div>

            <h1 style={{
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontSize: "clamp(28px,5.5vw,56px)",
              fontWeight: 900, lineHeight: 1.08, letterSpacing: "-.04em", marginBottom: 18,
            }}>
              Soma Nje ya Nchi —<br />
              <span style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Mwongozo Kamili
              </span>
            </h1>

            <p style={{
              color: "rgba(255,255,255,.55)", maxWidth: 540, margin: "0 auto 32px",
              fontSize: "clamp(14px,1.8vw,17px)", lineHeight: 1.75,
            }}>
              Scholarships za kimataifa, mataifa maarufu, hatua za kuomba, IELTS/TOEFL, na wakala wa kuaminika — yote sehemu moja.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {[["8+", t("abroad_stat_scholarships")], ["6+", t("abroad_stat_countries")], ["7", t("abroad_stat_steps")], [t("practice_stats_free"), t("abroad_stat_free")]].map(([n, l]) => (
                <div key={n} style={{ textAlign: "center", padding: "12px 20px", background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`, borderRadius: 14 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 20, color: "#38bdf8" }}>{n}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </W>
      </section>

      {/* ── STICKY TABS ──────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: DARK, borderBottom: `1px solid ${BORDER}` }}>
        <W>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
            {TABS.map(t => <TabBtn key={t.id} tab={tab} id={t.id} label={t.label} emoji={t.emoji} setTab={setTab} />)}
          </div>
        </W>
      </div>

      {/* ── TAB CONTENT ──────────────────────────── */}
      <section style={{ padding: "clamp(32px,5vw,60px) 0 100px" }}>
        <W>
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ─── */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  🌍 Kwa Nini Usomee Nje ya Nchi?
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.75, maxWidth: 680, marginBottom: 36 }}>
                  Kusomea nje kunakupa uzoefu wa kimataifa, mtandao wa kimataifa, na fursa za kazi duniani kote. Scholarships nyingi zinalipia kila kitu — ada, maisha, na nauli.
                </p>

                {/* Quick nav cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16, marginBottom: 40 }}>
                  {[
                    { emoji: "🏆", title: "Scholarships", desc: "Global na za serikali", tab_id: "scholarships", color: "#f59e0b" },
                    { emoji: "🗺️", title: "Mataifa Maarufu", desc: "China, UK, USA, Turkey...", tab_id: "countries", color: "#38bdf8" },
                    { emoji: "📋", title: "Mahitaji", desc: "Nyaraka unazohitaji", tab_id: "requirements", color: "#10b981" },
                    { emoji: "📝", title: "Application Steps", desc: "Mwongozo wa hatua kwa hatua", tab_id: "steps", color: "#a855f7" },
                    { emoji: "🤝", title: "Wakala & Mashirika", desc: "Waaminifu tu", tab_id: "agents", color: G },
                    { emoji: "📖", title: "IELTS / TOEFL", desc: "Mitihani ya lugha", tab_id: "tests", color: "#f472b6" },
                  ].map((item) => (
                    <motion.div key={item.tab_id} whileHover={{ y: -4 }} onClick={() => setTab(item.tab_id)}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "20px 18px", cursor: "pointer", transition: "all .22s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}35`; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,.35)`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 12 }}>{item.emoji}</div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 5 }}>{item.title}</h3>
                      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)", margin: 0 }}>{item.desc}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: item.color, fontSize: 12, fontWeight: 700, marginTop: 12 }}>
                        Angalia <ArrowRight size={12} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Warning: avoid fake agents */}
                <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#f87171", marginBottom: 4 }}>Tahadhari: Wakala wa Uongo</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.65, margin: 0 }}>
                      Wakala wengi wanaoitwa "study abroad consultants" wanakudanganya. Scholarships za serikali (CSC, Chevening, Fulbright, Türkiye Bursları) hazihusu malipo ya wakala — omba moja kwa moja kupitia portals rasmi. Angalia tab "Wakala & Mashirika" kwa orodha ya waaminifu.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SCHOLARSHIPS ─── */}
            {tab === "scholarships" && (
              <motion.div key="scholarships" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  🏆 Scholarships za Kimataifa
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                  Zote hizi zinapatikana kwa wanafunzi wa Tanzania. Angalia deadline na ombe mapema.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
                  {SCHOLARSHIPS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Chip color={s.color}>{s.tag}</Chip>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, marginTop: 4 }} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35, margin: 0 }}>{s.name}</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}><MapPin size={11} style={{ display: "inline", marginRight: 5 }} />{s.countries}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}><Award size={11} style={{ display: "inline", marginRight: 5 }} />{s.level}</div>
                        <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}><CheckCircle size={11} style={{ display: "inline", marginRight: 5 }} />{s.coverage}</div>
                        <div style={{ fontSize: 12, color: G, fontWeight: 700 }}><Calendar size={11} style={{ display: "inline", marginRight: 5 }} />{s.deadline}</div>
                      </div>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: 6, marginTop: "auto",
                        fontSize: 12, fontWeight: 800, color: s.color, textDecoration: "none",
                        padding: "7px 14px", borderRadius: 10,
                        background: `${s.color}12`, border: `1px solid ${s.color}22`,
                        alignSelf: "flex-start",
                      }}>
                        <ExternalLink size={12} /> Omba Hapa
                      </a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── COUNTRIES ─── */}
            {tab === "countries" && (
              <motion.div key="countries" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  🗺️ Mataifa Maarufu kwa Wanafunzi wa Tanzania
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                  Chagua nchi inayofaa malengo yako ya masomo na hali yako ya fedha.
                </p>
                <div style={{ display: "grid", gap: 20 }}>
                  {COUNTRIES.map((c, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "22px 22px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 900, margin: 0 }}>{c.name}</h3>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, background: `${c.color}14`, color: c.color, border: `1px solid ${c.color}25`, whiteSpace: "nowrap" }}>
                          Inafaa kwa TZ
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 14 }}>{c.desc}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {c.pros.map((p, j) => (
                          <span key={j} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "rgba(74,222,128,.07)", color: "#4ade80", border: "1px solid rgba(74,222,128,.15)" }}>✓ {p}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)", padding: "8px 12px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: `1px solid ${BORDER}` }}>
                        📋 <strong style={{ color: "rgba(255,255,255,.7)" }}>Mahitaji ya Kawaida:</strong> {c.req}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── REQUIREMENTS ─── */}
            {tab === "requirements" && (
              <motion.div key="requirements" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  📋 Nyaraka za Kawaida Zinazohitajika
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Tayarisha hizi mapema — nyaraka nyingi zinachukua muda kupata.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginBottom: 32 }}>
                  {REQUIRED_DOCS.map((d, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * .04 }}
                      style={{ display: "flex", gap: 12, padding: "14px 16px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, alignItems: "flex-start" }}>
                      <CheckCircle size={16} color={G} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>{d.doc}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.42)", lineHeight: 1.5 }}>{d.note}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(245,166,35,.06)", border: `1px solid ${G}25` }}>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", lineHeight: 1.7, margin: 0 }}>
                    💡 <strong style={{ color: G }}>Kumbuka:</strong> Scholarship tofauti zinahitaji nyaraka tofauti. Soma mahitaji ya kila scholarship kwa makini kabla hujaandaa. Hizi ni nyaraka za jumla tu.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── APPLICATION STEPS ─── */}
            {tab === "steps" && (
              <motion.div key="steps" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  📝 Hatua za Kuomba Scholarship / Chuo Nje
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                  Fuata hatua hizi kwa mpangilio. Kila hatua ina vidokezo muhimu.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
                  {APP_STEPS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "22px 20px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 10, right: 14, fontSize: 42, fontWeight: 900, color: "rgba(255,255,255,.03)", fontFamily: "'Bricolage Grotesque',sans-serif", lineHeight: 1 }}>{s.num}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 12, background: `${s.color}18`, color: s.color, fontSize: 13, fontWeight: 900, marginBottom: 14, border: `1px solid ${s.color}25` }}>{s.num}</div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.35 }}>{s.title}</h3>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,.52)", lineHeight: 1.65, marginBottom: 14 }}>{s.desc}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {s.tips.map((tip, j) => (
                          <div key={j} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,.5)", alignItems: "flex-start" }}>
                            <Zap size={11} color={s.color} style={{ flexShrink: 0, marginTop: 2 }} /> {tip}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── TRUSTED AGENTS ─── */}
            {tab === "agents" && (
              <motion.div key="agents" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  🤝 Wakala na Mashirika ya Kuaminika
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Hizi ni taasisi rasmi tu. Zote zina uhusiano wa moja kwa moja na mchakato wa scholarship au admission.
                </p>
                <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", marginBottom: 28 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: "#f87171" }}>Tahadhari ya Wakala wa Uongo:</strong> Mtu yeyote anayekuomba <em>malipo ya pesa</em> ili kukusaidia kupata scholarship awe na wasiwasi. Portals rasmi za serikali ni BURE. Tumia tu taasisi zilizoorodheshwa hapa chini.
                    </p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
                  {TRUSTED_AGENTS.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Chip color={a.color}>{a.type}</Chip>
                        {a.verified && <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 999, background: "rgba(74,222,128,.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,.2)" }}>✓ RASMI</span>}
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, margin: 0 }}>{a.name}</h3>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.6, margin: 0, flex: 1 }}>{a.desc}</p>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 800, color: a.color, textDecoration: "none",
                        padding: "7px 12px", borderRadius: 10,
                        background: `${a.color}10`, border: `1px solid ${a.color}20`, alignSelf: "flex-start",
                      }}>
                        <ExternalLink size={12} /> Tembelea
                      </a>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── LANGUAGE TESTS ─── */}
            {tab === "tests" && (
              <motion.div key="tests" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                  📖 Mitihani ya Lugha — IELTS, TOEFL & Zaidi
                </h2>
                <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                  Mitihani hii inahitajika na vyuo vya nje. Jiandikishe mapema — vituo vya mitihani Tanzania vina nafasi chache.
                </p>
                <div style={{ display: "grid", gap: 18, marginBottom: 36 }}>
                  {LANGUAGE_TESTS.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "22px 22px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                        <div>
                          <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{t.name}</h3>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>by {t.org}</div>
                        </div>
                        <Chip color={t.color}>Muhimu</Chip>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 14 }}>
                        {[
                          { label: "Inatumika", val: t.usage },
                          { label: "Score Inayohitajika", val: t.bands },
                          { label: "Maandalizi", val: t.prep },
                        ].map((item, j) => (
                          <div key={j} style={{ padding: "10px 12px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: `1px solid ${BORDER}` }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                      <a href={t.url} target="_blank" rel="noreferrer" style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 800, color: t.color, textDecoration: "none",
                        padding: "7px 14px", borderRadius: 10,
                        background: `${t.color}10`, border: `1px solid ${t.color}20`,
                      }}>
                        <ExternalLink size={12} /> Tovuti Rasmi
                      </a>
                    </motion.div>
                  ))}
                </div>

                {/* Passport reminder */}
                <div style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.2)" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8", marginBottom: 8 }}>🛂 Passport — Jiandae Mapema</h3>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.65)", lineHeight: 1.7, margin: 0 }}>
                    Passport inachukua wiki 2-8 Tanzania. Omba mapema kupitia <strong>Immigration Services Tanzania</strong> kabla hujaomba scholarship yoyote. Passport lazima iwe na uhalali wa angalau miaka 2 zaidi ya tarehe ya kuanza masomo. Tembelea: <a href="https://www.immigration.go.tz" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", fontWeight: 700 }}>immigration.go.tz</a>
                  </p>
                </div>

                {/* Motivation letter tips */}
                <div style={{ marginTop: 20, padding: "18px 20px", borderRadius: 16, background: `${G}08`, border: `1px solid ${G}22` }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: G, marginBottom: 8 }}>✍️ Barua ya Motisha (Motivation Letter)</h3>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: 10 }}>
                    Barua yenye nguvu inaweza kukuinua juu ya wagombea wengine wenye matokeo sawa nawe. Vidokezo:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      "Anza na hadithi yenye nguvu — si 'My name is...' au 'I am writing to...'",
                      "Eleza kwa nini scholarship HII na chuo HII specifically — isiwe barua ya jumla",
                      "Onyesha jinsi utakavyotumia elimu hiyo kusaidia Tanzania / Afrika",
                      "Iweke fupi na yenye nguvu: kurasa 1-2 tu",
                      "Acha mtu mwingine aisomee kabla hujawasilisha",
                    ].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "rgba(255,255,255,.6)", alignItems: "flex-start" }}>
                        <span style={{ color: G, flexShrink: 0, marginTop: 1 }}>→</span> {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </W>
      </section>
    </div>
  );
}
