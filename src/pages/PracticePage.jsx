import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, Target, CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Zap, BookOpen, Trophy, Users, Flame } from "lucide-react";
import { useCollection } from "../hooks/useFirestore.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

const QUIZZES = [
  { id:"csee-bio", title:"Biology — Form 4 (CSEE)", emoji:"🧬", color:"#10b981", questions:5, level:"Form 4", subject:"Biology", duration:"8 min",
    qs:[
      { q:"Seli ya damu nyekundu ina jina gani la kisayansi?", opts:["Leukocyte","Erythrocyte","Platelet","Lymphocyte"], ans:1 },
      { q:"Mimea inabadilisha nishati ya jua kuwa chakula kupitia mchakato gani?", opts:["Kupumua","Usagaji","Usanisinuru (Photosynthesis)","Kugawanyika"], ans:2 },
      { q:"Sehemu ya seli inayodhibiti shughuli zote za seli ni:", opts:["Cytoplasm","Cell membrane","Nucleus","Mitochondria"], ans:2 },
      { q:"Moyo wa binadamu una vyumba vingapi?", opts:["2","3","4","5"], ans:2 },
      { q:"Jina la kisayansi la binadamu ni:", opts:["Homo erectus","Homo habilis","Homo sapiens","Homo neanderthalensis"], ans:2 },
    ]
  },
  { id:"csee-math", title:"Mathematics — Form 4", emoji:"📐", color:"#3b82f6", questions:5, level:"Form 4", subject:"Mathematics", duration:"10 min",
    qs:[
      { q:"Suluhisha: 3x + 7 = 22. x = ?", opts:["3","4","5","6"], ans:2 },
      { q:"Mraba wa 144 ni:", opts:["10","11","12","13"], ans:2 },
      { q:"Pi (π) = ?", opts:["3.14159","2.71828","1.61803","1.41421"], ans:0 },
      { q:"Jibu la 2⁵ = ?", opts:["10","16","32","64"], ans:2 },
      { q:"Eneo la mduara wenye radius r = 5 cm ni:", opts:["25π cm²","10π cm²","5π cm²","50π cm²"], ans:0 },
    ]
  },
  { id:"psle-english", title:"English — Standard 7 (PSLE)", emoji:"📚", color:"#8b5cf6", questions:5, level:"Standard 7", subject:"English", duration:"8 min",
    qs:[
      { q:"Choose the correct sentence:", opts:["She don't know the answer.","She doesn't know the answer.","She not know the answer.","She not knowing the answer."], ans:1 },
      { q:"The opposite of 'ancient' is:", opts:["Old","Modern","Huge","Tiny"], ans:1 },
      { q:"What is the plural of 'child'?", opts:["Childs","Childes","Children","Child"], ans:2 },
      { q:"The past tense of 'go' is:", opts:["Goed","Going","Gone","Went"], ans:3 },
      { q:"A word that describes a noun is called:", opts:["Verb","Adjective","Adverb","Conjunction"], ans:1 },
    ]
  },
  { id:"acsee-history", title:"History — Form 6 (ACSEE)", emoji:"🏛️", color:"#f59e0b", questions:5, level:"Form 6", subject:"History", duration:"10 min",
    qs:[
      { q:"Tanganyika ilipata uhuru wake mwaka gani?", opts:["1959","1960","1961","1963"], ans:2 },
      { q:"Julius Nyerere alikuwa Rais wa kwanza wa nchi gani?", opts:["Kenya","Uganda","Tanzania","Zambia"], ans:2 },
      { q:"Vita vya Kwanza vya Ulimwengu vilifanyika kati ya miaka gani?", opts:["1910-1914","1914-1918","1918-1922","1920-1924"], ans:1 },
      { q:"TANU ilianzishwa mwaka gani?", opts:["1952","1953","1954","1955"], ans:2 },
      { q:"UN (United Nations) ilianzishwa mwaka gani?", opts:["1943","1944","1945","1946"], ans:2 },
    ]
  },
];

function QuizCard({ quiz, onStart }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} whileHover={{ y:-4 }}
      style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"24px", cursor:"pointer", transition:"all .25s" }}
      onClick={() => onStart(quiz)}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${quiz.color}30`; e.currentTarget.style.boxShadow=`0 12px 36px rgba(0,0,0,.4)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div style={{ fontSize:40 }}>{quiz.emoji}</div>
        <span style={{ padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:900, background:`${quiz.color}15`, color:quiz.color, textTransform:"uppercase" }}>{quiz.level}</span>
      </div>
      <h3 style={{ fontWeight:900, fontSize:17, marginBottom:10, lineHeight:1.3 }}>{quiz.title}</h3>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><Target size={12}/> {quiz.questions} maswali</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><Clock size={12}/> ~{quiz.duration}</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><BookOpen size={12}/> {quiz.subject}</div>
      </div>
      <button style={{ width:"100%", height:44, borderRadius:12, border:"none", background:`linear-gradient(135deg,${quiz.color},${quiz.color}99)`, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <Zap size={15}/> Anza Quiz
      </button>
    </motion.div>
  );
}

function ActiveQuiz({ quiz, onFinish }) {
  const { t } = useSettings();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const q = quiz.qs[current];

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (current + 1 < quiz.qs.length) {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setShowResult(true);
    }
  };

  if (showResult) {
    const score = answers.filter((a, i) => a === quiz.qs[i].ans).length;
    const pct = Math.round((score / quiz.qs.length) * 100);
    const grade = pct >= 80 ? "A" : pct >= 65 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
    const gColor = pct >= 80 ? "#4ade80" : pct >= 65 ? "#60a5fa" : pct >= 50 ? G : pct >= 40 ? "#f97316" : "#f87171";
    return (
      <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} style={{ maxWidth:520, margin:"0 auto", textAlign:"center" }}>
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:28, padding:"44px 36px" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>{pct >= 80 ? "🏆" : pct >= 65 ? "🎉" : pct >= 50 ? "👍" : "📚"}</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:26, fontWeight:900, marginBottom:6 }}>
            {pct >= 80 ? t("practice_result_great") : pct >= 65 ? t("practice_result_good") : pct >= 50 ? t("practice_result_ok") : t("practice_result_retry")}
          </h2>
          <p style={{ color:"rgba(255,255,255,.5)", marginBottom:28, fontSize:14 }}>{quiz.title}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:28 }}>
            {[["Alama",`${score}/${quiz.qs.length}`],["Asilimia",`${pct}%`],["Daraja",grade]].map(([l,v]) => (
              <div key={l} style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:"14px 10px", border:`1px solid rgba(255,255,255,.06)` }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", fontWeight:800, marginBottom:4, textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:900, color:gColor }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"left", marginBottom:24, maxHeight:240, overflowY:"auto" }}>
            {quiz.qs.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ display:"flex", gap:10, padding:"8px 12px", borderRadius:10, marginBottom:6, background:ok?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)", border:`1px solid ${ok?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}` }}>
                  {ok ? <CheckCircle size={14} color="#4ade80" style={{ flexShrink:0, marginTop:2 }}/> : <XCircle size={14} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>}
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginBottom:2 }}>{q.q}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:ok?"#4ade80":"#f87171" }}>{ok?"✓ Sahihi":"✗ Jibu sahihi: "+q.opts[q.ans]}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false); }}
              style={{ flex:1, height:46, borderRadius:12, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.7)", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <RotateCcw size={14}/> Jaribu Tena
            </button>
            <button onClick={onFinish} style={{ flex:1, height:46, borderRadius:12, border:"none", background:`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, cursor:"pointer" }}>Quiz Nyingine</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth:580, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <button onClick={onFinish} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.05)", border:`1px solid ${BORDER}`, color:"rgba(255,255,255,.6)", padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>
          <ArrowLeft size={14}/> Rudi
        </button>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", fontWeight:700 }}>{current+1} / {quiz.qs.length}</div>
      </div>
      <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,.08)", marginBottom:24, overflow:"hidden" }}>
        <motion.div animate={{ width:`${((current+1)/quiz.qs.length)*100}%` }} style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${quiz.color},${quiz.color}99)` }}/>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:.2 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"28px 24px", marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:800, color:quiz.color, textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>Swali {current+1}</div>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(16px,2.5vw,21px)", fontWeight:900, lineHeight:1.4, margin:0 }}>{q.q}</h3>
          </div>
          <div style={{ display:"grid", gap:10, marginBottom:20 }}>
            {q.opts.map((opt, i) => {
              const isSel = selected === i;
              const isOk = selected !== null && i === q.ans;
              const isWrong = isSel && i !== q.ans;
              let bc = BORDER, bg = "rgba(255,255,255,.03)", tc = "rgba(255,255,255,.8)";
              if (selected !== null) {
                if (isOk) { bc="rgba(74,222,128,.4)"; bg="rgba(74,222,128,.08)"; tc="#4ade80"; }
                else if (isWrong) { bc="rgba(248,113,113,.4)"; bg="rgba(248,113,113,.08)"; tc="#f87171"; }
              }
              return (
                <button key={i} onClick={() => selected===null && setSelected(i)}
                  style={{ width:"100%", padding:"14px 18px", borderRadius:13, border:`1.5px solid ${bc}`, background:bg, color:tc, fontWeight:600, fontSize:14, textAlign:"left", cursor:selected!==null?"default":"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:isOk?"rgba(74,222,128,.2)":isWrong?"rgba(248,113,113,.2)":"rgba(255,255,255,.06)", display:"grid", placeItems:"center", flexShrink:0, fontWeight:900, fontSize:12, color:isOk?"#4ade80":isWrong?"#f87171":"rgba(255,255,255,.4)" }}>
                    {selected!==null ? (isOk?"✓":isWrong?"✗":["A","B","C","D"][i]) : ["A","B","C","D"][i]}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
          <button onClick={handleNext} disabled={selected===null}
            style={{ width:"100%", height:50, borderRadius:13, border:"none", background:selected!==null?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.05)", color:selected!==null?"#111":"rgba(255,255,255,.2)", fontWeight:900, fontSize:15, cursor:selected!==null?"pointer":"default", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {current+1===quiz.qs.length?"Maliza Quiz":"Swali Lifuatalo"} <ArrowRight size={18}/>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function PracticePage() {
  const [activeQuiz, setActiveQuiz]       = useState(null);
  const [filterLevel, setFilterLevel]     = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [activeTab, setActiveTab]         = useState("library");

  // ── Firestore: live daily quiz, weekly challenge, leaderboard ──────────
  const { docs: dailyDocs,  loading: dailyLoading  } = useCollection("quiz_daily",       "date",      5);
  const { docs: weeklyDocs, loading: weeklyLoading } = useCollection("quiz_weekly",      "weekStart", 5);
  const { docs: lbDocs,     loading: lbLoading     } = useCollection("quiz_leaderboard", "score",    20);

  // Today's date string e.g. "2026-04-20"
  const todayKey = new Date().toISOString().slice(0, 10);

  // Daily quiz: Firestore-first, fallback to day-based local rotation
  const firestoreDaily    = dailyDocs.find(d => d.date === todayKey || d.active === true);
  const localDailyFallback = QUIZZES[new Date().getDay() % QUIZZES.length];
  const DAILY_QUIZ = firestoreDaily
    ? { ...localDailyFallback, ...firestoreDaily,
        qs: Array.isArray(firestoreDaily.qs) && firestoreDaily.qs.length ? firestoreDaily.qs : localDailyFallback.qs }
    : localDailyFallback;

  // Weekly challenge: Firestore-first, fallback to offset rotation
  const firestoreWeekly     = weeklyDocs.find(d => d.active !== false);
  const localWeeklyFallback = QUIZZES[(new Date().getDay() + 2) % QUIZZES.length];
  const WEEKLY_CHALLENGE = firestoreWeekly
    ? { ...localWeeklyFallback, ...firestoreWeekly,
        qs: Array.isArray(firestoreWeekly.qs) && firestoreWeekly.qs.length ? firestoreWeekly.qs : localWeeklyFallback.qs }
    : localWeeklyFallback;

  // Leaderboard: Firestore data when available, empty state otherwise (no fake data)
  const RANK_BADGES = ["🏆","🥈","🥉","⭐","⭐","⭐","⭐","⭐","⭐","⭐"];
  const leaderboard = lbDocs.length > 0
    ? [...lbDocs]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((d, i) => ({
          rank: i + 1,
          name: d.displayName || d.name || t("practice_leaderboard_name"),
          score: d.score || 0,
          quizzes: d.quizCount || 0,
          badge: RANK_BADGES[i] || "⭐",
        }))
    : [];

  const levels   = ["All", "Standard 7", "Form 4", "Form 6"];
  const subjects = ["All", ...new Set(QUIZZES.map(q => q.subject))];
  const filtered = QUIZZES.filter(q =>
    (filterLevel === "All" || q.level === filterLevel) &&
    (filterSubject === "All" || q.subject === filterSubject)
  );

  const { t } = useSettings();
  const TABS = [
    { id: "library",     label: t("practice_tab_library"),     emoji: "📚" },
    { id: "daily",       label: t("practice_tab_daily"),        emoji: "⚡" },
    { id: "weekly",      label: t("practice_tab_weekly"),       emoji: "🔥" },
    { id: "leaderboard", label: t("practice_tab_leaderboard"),  emoji: "🏆" },
  ];

  if (activeQuiz) return (
    <div style={{ paddingTop: 100, paddingBottom: 80, minHeight: "100vh", background: DARK, color: "#fff" }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 20px" }}>
        <ActiveQuiz quiz={activeQuiz} onFinish={() => setActiveQuiz(null)} />
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 0, paddingBottom: 80, minHeight: "100vh", background: DARK, color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflowX: "hidden" }}>

      {/* Hero */}
      <section style={{ padding: "clamp(72px,10vw,110px) clamp(16px,4vw,40px) 36px", textAlign: "center", background: `radial-gradient(ellipse at 50% 0%, rgba(245,166,35,.12) 0%, transparent 55%)`, borderBottom: `1px solid ${BORDER}` }}>
        {/* Back button */}
        <div style={{ display: "flex", justifyContent: "flex-start", maxWidth: 1100, margin: "0 auto 24px" }}>
          <Link to="/exams" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,.6)", borderRadius: 12, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Student Center
          </Link>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 999, color: G, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 20 }}>
          <Star size={13} /> Practice & Quizzes
        </div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 14, letterSpacing: "-.04em" }}>
          Jipime Uwezo Wako<br />
          <span style={{ background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kabla ya Mtihani</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,.5)", maxWidth: 460, margin: "0 auto 24px", fontSize: "clamp(13px,1.5vw,15px)", lineHeight: 1.7 }}>
          Maswali halisi ya PSLE, CSEE, na ACSEE. Jibu, jua alama yako, na ujue unakokosea.
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[[QUIZZES.length + "", t("practice_stats_quizzes")], [t("practice_stats_free"), "100%"], ["PSLE·CSEE·ACSEE", t("practice_stats_levels")], [t("practice_stats_fast"), "⚡"]].map(([n, l]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 900, fontSize: 20, color: G }}>{n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sticky tab nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: DARK, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 0", scrollbarWidth: "none" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
                borderRadius: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: activeTab === t.id ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.05)",
                color: activeTab === t.id ? "#111" : "rgba(255,255,255,.55)",
                fontWeight: activeTab === t.id ? 800 : 700, fontSize: 13,
                transition: "all .2s", flexShrink: 0,
                boxShadow: activeTab === t.id ? `0 4px 14px ${G}30` : "none",
              }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(28px,5vw,48px) clamp(16px,4vw,40px)" }}>

        {/* ── QUIZ LIBRARY ── */}
        {activeTab === "library" && (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>Kiwango</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {levels.map(l => <button key={l} onClick={() => setFilterLevel(l)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${filterLevel === l ? G : BORDER}`, background: filterLevel === l ? `${G}15` : "transparent", color: filterLevel === l ? G : "rgba(255,255,255,.5)", cursor: "pointer", transition: "all .15s" }}>{l}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>Somo</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {subjects.map(s => <button key={s} onClick={() => setFilterSubject(s)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, border: `1px solid ${filterSubject === s ? G : BORDER}`, background: filterSubject === s ? `${G}15` : "transparent", color: filterSubject === s ? G : "rgba(255,255,255,.5)", cursor: "pointer", transition: "all .15s" }}>{s}</button>)}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 18, marginBottom: 36 }}>
              {filtered.map((quiz, i) => <motion.div key={quiz.id} transition={{ delay: i * .06 }}><QuizCard quiz={quiz} onStart={setActiveQuiz} /></motion.div>)}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,.02)", borderRadius: 20, border: `1px dashed ${BORDER}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Hakuna quiz kwa kichujio hiki</h3>
                <button onClick={() => { setFilterLevel("All"); setFilterSubject("All"); }} style={{ padding: "10px 24px", borderRadius: 12, border: `1px solid ${G}30`, background: `${G}10`, color: G, fontWeight: 700, cursor: "pointer" }}>{t("practice_view_all")}</button>
              </div>
            )}
          </div>
        )}

        {/* ── DAILY QUIZ ── */}
        {activeTab === "daily" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: `${G}12`, border: `1px solid ${G}25`, color: G, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
                ⚡ Quiz ya Leo — {new Date().toLocaleDateString("sw-TZ", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                Quiz Maalum ya Leo
              </h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.7 }}>
                Kila siku kuna quiz mpya. Jibu leo ili kudumisha streak yako na kushindana na wanafunzi wengine.
              </p>
            </div>

            {/* Daily quiz card — featured */}
            <div style={{ background: `linear-gradient(135deg,${DAILY_QUIZ.color}20,rgba(255,255,255,.03))`, border: `1px solid ${DAILY_QUIZ.color}35`, borderRadius: 24, padding: "clamp(20px,4vw,36px)", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${DAILY_QUIZ.color}18,transparent 70%)`, filter: "blur(30px)", pointerEvents: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: DAILY_QUIZ.color, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>⚡ Quiz ya Leo</div>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 900, margin: 0 }}>{DAILY_QUIZ.title}</h3>
                </div>
                <div style={{ fontSize: 40 }}>{DAILY_QUIZ.emoji}</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}><Target size={12} /> {DAILY_QUIZ.questions} maswali</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> ~{DAILY_QUIZ.duration}</span>
                <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 900, background: `${DAILY_QUIZ.color}15`, color: DAILY_QUIZ.color, textTransform: "uppercase" }}>{DAILY_QUIZ.level}</span>
              </div>
              <button onClick={() => setActiveQuiz(DAILY_QUIZ)} style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={16} /> Anza Quiz ya Leo
              </button>
            </div>

            {/* Streak info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
              {[["🔥", "Streak ya Leo", "Anza leo!"], ["📅", "Jana", "Kukosa au Kufanya"], ["⭐", "Wiki Hii", "0 / 7 Siku"], ["🏅", "Rekordi", "Jaza leo"]].map(([icon, label, val]) => (
                <div key={label} style={{ padding: "16px 14px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WEEKLY CHALLENGE ── */}
        {activeTab === "weekly" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
                🔥 Challenge ya Wiki
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                Shindano la Kila Wiki
              </h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.7 }}>
                Kila wiki kuna challenge ngumu zaidi. Kamilisha ili upande leaderboard na upate alama za ziada.
              </p>
            </div>

            {/* Weekly challenge card */}
            <div style={{ background: "linear-gradient(135deg,rgba(239,68,68,.12),rgba(255,255,255,.03))", border: "1px solid rgba(239,68,68,.3)", borderRadius: 24, padding: "clamp(20px,4vw,36px)", marginBottom: 28, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,.12),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", color: "#f87171", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
                🔥 Challenge — Wiki Hii
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 900, margin: 0 }}>{WEEKLY_CHALLENGE.title}</h3>
                <div style={{ fontSize: 40 }}>{WEEKLY_CHALLENGE.emoji}</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}><Target size={12} /> {WEEKLY_CHALLENGE.questions} maswali</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> ~{WEEKLY_CHALLENGE.duration}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171", display: "flex", alignItems: "center", gap: 5 }}>🔥 Pointi za Ziada</span>
              </div>
              <button onClick={() => setActiveQuiz(WEEKLY_CHALLENGE)} style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(239,68,68,.3)" }}>
                <Star size={16} /> Chukua Challenge
              </button>
            </div>

            {/* Challenge rules */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "22px 20px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📜 Sheria za Challenge</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Challenge inaanza Jumatatu na inamalizika Jumapili usiku",
                  "Unaweza kucheza mara nyingi — alama yako bora itahesabiwa",
                  "Waliofika juu zaidi ya 80% wataingia Leaderboard ya wiki",
                  "Challenge ya wiki hii ina mada tofauti na ya wiki iliyopita",
                  "Jibu kwa uaminifu — hii inakusaidia wewe mwenyewe kujua unaostahili",
                ].map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,.6)", alignItems: "flex-start" }}>
                    <CheckCircle size={14} color={G} style={{ flexShrink: 0, marginTop: 2 }} /> {rule}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {activeTab === "leaderboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(250,204,21,.1)", border: "1px solid rgba(250,204,21,.25)", color: "#facc15", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
                🏆 Leaderboard
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, marginBottom: 10 }}>
                Wanafunzi Bora — Wiki Hii
              </h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.7 }}>
                Cheza quiz na challenge zaidi ili kupanda juu ya orodha. Leaderboard inasasishwa kila wiki.
              </p>
            </div>

            {/* Top 3 podium — only show if enough data */}
            {leaderboard.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 520, margin: "0 auto 28px" }}>
                {[leaderboard[1], leaderboard[0], leaderboard[2]].map((player, i) => {
                  const heights = ["160px", "190px", "140px"];
                  const colors  = ["#9ca3af", "#facc15", "#cd7f32"];
                  const pos     = [2, 1, 3];
                  if (!player) return <div key={i} />;
                  return (
                    <div key={player.rank} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{player.badge}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 6, textAlign: "center" }}>{player.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: colors[i], marginBottom: 8 }}>{player.score} pts</div>
                      <div style={{ width: "100%", height: heights[i], background: `linear-gradient(180deg,${colors[i]}30,${colors[i]}10)`, border: `1px solid ${colors[i]}30`, borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: colors[i] }}>#{pos[i]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table or states */}
            {lbLoading ? (
              <div style={{ textAlign: "center", padding: "36px 20px", background: CARD, borderRadius: 20, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", margin: 0 }}>Inapakia leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🏆</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Leaderboard Bado Haijajazwa</h3>
                <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginBottom: 20, lineHeight: 1.65 }}>
                  Kuwa wa kwanza! Cheza quiz ya leo ili uingie orodha.
                </p>
                <button onClick={() => setActiveTab("daily")} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>
                  ⚡ Anza Quiz ya Leo
                </button>
              </div>
            ) : (
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "grid", gridTemplateColumns: "40px 1fr 80px 70px", gap: 8 }}>
                  {[t("practice_leaderboard_rank"), t("practice_leaderboard_name"), t("practice_leaderboard_score"), t("practice_leaderboard_quizzes")].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</div>
                  ))}
                </div>
                {leaderboard.map((player, i) => (
                  <motion.div key={player.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }}
                    style={{ padding: "14px 20px", borderBottom: i < leaderboard.length - 1 ? `1px solid ${BORDER}` : "none", display: "grid", gridTemplateColumns: "40px 1fr 80px 70px", gap: 8, alignItems: "center", background: i === 0 ? `${G}06` : "transparent" }}>
                    <div style={{ fontSize: 18 }}>{player.badge}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{player.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? G : i === 1 ? "#9ca3af" : i === 2 ? "#cd7f32" : "rgba(255,255,255,.7)" }}>{player.score}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>{player.quizzes} quiz</div>
                  </motion.div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 14, background: `${G}08`, border: `1px solid ${G}20`, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.55)", margin: 0 }}>
                {t("practice_leaderboard_footer")} <button onClick={() => setActiveTab("library")} style={{ background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>{t("practice_leaderboard_play")}</button>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
