/**
 * NectaResultsPage — Firestore-backed NECTA results browser
 * Routes: /necta, /necta/:level, /necta/:level/:year, /exams/results
 * Collection: necta_results
 * No scraping, no backend API — reads curated links from Firestore
 */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Search, ExternalLink, ArrowLeft, ChevronRight,
  BookOpen, AlertCircle, CheckCircle, Clock, Filter, Award, Sparkles,
  Zap, Share2, Download, History, Camera, User, Star, FolderOpen
} from "lucide-react";
import { getFirebaseDb, collection, query, orderBy, onSnapshot } from "../firebase.js";
import SEOHead from "../components/SEOHead.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";

const G  = "#F5A623";
const G2 = "#FFD17C";
const BG = "#0a0b10";

// ── Level config ────────────────────────────────────
const LEVELS = [
  { id: "psle",  label: "Primary Results",    long: "PSLE — primary School (Std 7)", color: "#10b981", emoji: "📗" },
  { id: "sfna",  label: "Standard 4",         long: "SFNA — Standard Four",         color: "#06b6d4", emoji: "🖍️" },
  { id: "ftna",  label: "Form Two Results",   long: "FTNA — Form Two",              color: "#f59e0b", emoji: "📙" },
  { id: "csee",  label: "Form Four Results",  long: "CSEE — Form Four (O-Level)",   color: "#3b82f6", emoji: "📘" },
  { id: "acsee", label: "Form Six Results",   long: "ACSEE — Form Six (A-Level)",   color: "#a855f7", emoji: "🎓" },
];

const LEVEL_ALIASES = {
  psle: ["psle", "primary", "std7", "standard7"],
  sfna: ["sfna", "std4", "standard4"],
  ftna: ["ftna", "form2", "form-two"],
  csee: ["csee", "form4", "form-four", "o-level"],
  acsee: ["acsee", "form6", "form-six", "a-level"],
};
function resolveLevel(raw) {
  if (!raw) return null;
  const l = raw.toLowerCase();
  for (const [id, aliases] of Object.entries(LEVEL_ALIASES)) {
    if (aliases.includes(l)) return id;
  }
  return null;
}

const YEARS = Array.from({length: 22}, (_, i) => 2026 - i); // 2026→2005

// ── Static known NECTA direct links (fallback) ─────
// Admin can override/add any of these via Firestore necta_results collection
const KNOWN_LINKS = {
  "psle": {
    2024: "https://onlinesys.necta.go.tz/results/2024/psle/",
    2023: "https://onlinesys.necta.go.tz/results/2023/psle/",
    2022: "https://onlinesys.necta.go.tz/results/2022/psle/",
    2021: "https://onlinesys.necta.go.tz/results/2021/psle/",
    2020: "https://onlinesys.necta.go.tz/results/2020/psle/",
    2019: "https://onlinesys.necta.go.tz/results/2019/psle/",
    2018: "https://onlinesys.necta.go.tz/results/2018/psle/",
    2017: "https://onlinesys.necta.go.tz/results/2017/psle/",
    2016: "https://onlinesys.necta.go.tz/results/2016/psle/",
    2015: "https://onlinesys.necta.go.tz/results/2015/psle/",
    2014: "https://necta.go.tz/psle_results",
    2013: "https://necta.go.tz/psle_results",
    2012: "https://necta.go.tz/psle_results",
  },
  "csee": {
    2024: "https://onlinesys.necta.go.tz/results/2024/csee/",
    2023: "https://onlinesys.necta.go.tz/results/2023/csee/",
    2022: "https://onlinesys.necta.go.tz/results/2022/csee/",
    2021: "https://onlinesys.necta.go.tz/results/2021/csee/",
    2020: "https://onlinesys.necta.go.tz/results/2020/csee/",
    2019: "https://onlinesys.necta.go.tz/results/2019/csee/",
    2018: "https://onlinesys.necta.go.tz/results/2018/csee/",
    2017: "https://onlinesys.necta.go.tz/results/2017/csee/",
    2016: "https://onlinesys.necta.go.tz/results/2016/csee/",
    2015: "https://onlinesys.necta.go.tz/results/2015/csee/",
    2014: "https://onlinesys.necta.go.tz/results/2014/csee/",
    2013: "https://onlinesys.necta.go.tz/results/2013/csee/",
    2012: "https://onlinesys.necta.go.tz/results/2012/csee/",
    2011: "https://onlinesys.necta.go.tz/results/2011/csee/",
    2010: "https://onlinesys.necta.go.tz/results/2010/csee/",
  },
  "acsee": {
    2024: "https://onlinesys.necta.go.tz/results/2024/acsee/",
    2023: "https://onlinesys.necta.go.tz/results/2023/acsee/",
    2022: "https://onlinesys.necta.go.tz/results/2022/acsee/",
    2021: "https://onlinesys.necta.go.tz/results/2021/acsee/",
    2020: "https://onlinesys.necta.go.tz/results/2020/acsee/",
    2019: "https://onlinesys.necta.go.tz/results/2019/acsee/",
    2018: "https://onlinesys.necta.go.tz/results/2018/acsee/",
    2017: "https://onlinesys.necta.go.tz/results/2017/acsee/",
    2016: "https://onlinesys.necta.go.tz/results/2016/acsee/",
    2015: "https://onlinesys.necta.go.tz/results/2015/acsee/",
    2014: "https://onlinesys.necta.go.tz/results/2014/acsee/",
    2013: "https://onlinesys.necta.go.tz/results/2013/acsee/",
    2012: "https://onlinesys.necta.go.tz/results/2012/acsee/",
  },
};

// ── Styles ───────────────────────────────────────────
const W = ({ children, style }) => (
  <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 clamp(14px,4vw,32px)", ...style }}>
    {children}
  </div>
);

const chip = (active, color="#F5A623") => ({
  padding:"9px 18px", borderRadius:12,
  border:`1px solid ${active ? color : "rgba(255,255,255,.1)"}`,
  background: active ? `${color}14` : "rgba(255,255,255,.04)",
  color: active ? color : "rgba(255,255,255,.75)",
  fontWeight:700, fontSize:14, cursor:"pointer",
  transition:"all .18s", whiteSpace:"nowrap",
  WebkitTapHighlightColor:"transparent",
});

const NECTA_API_BASE_URL = (import.meta.env.VITE_NECTA_API_BASE_URL || "").replace(/\/+$/, "");

function buildNectaApiUrl(path) {
  if (NECTA_API_BASE_URL) return `${NECTA_API_BASE_URL}${path}`;
  return path;
}

async function readJsonResponse(res, label) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(`${label} returned non-JSON response:`, {
      status: res.status,
      contentType,
      bodySnippet: text.substring(0, 500),
    });
    throw new Error("NECTA_NON_JSON_RESPONSE");
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `${label} failed with status ${res.status}`);
    err.code = data?.code;
    err.payload = data;
    throw err;
  }
  return data;
}

function getFriendlyNectaError(error, fallback) {
  if (error?.message === "NECTA_NON_JSON_RESPONSE") {
    return "NECTA search is temporarily unavailable. The server returned an unexpected page instead of data.";
  }
  if (error?.code === "NECTA_SOURCE_UNAVAILABLE") {
    return error.message || "This older NECTA year is unavailable from the supported public sources.";
  }
  if (error?.code === "UNSUPPORTED_EXAM_TYPE") {
    return "This NECTA exam type is not supported yet.";
  }
  return fallback;
}

// ── Year card ────────────────────────────────────────
function YearCard({ year, level, firestoreData, onSelect }) {
  const fsEntry = firestoreData[`${level}-${year}`];
  const knownUrl = KNOWN_LINKS[level]?.[year];
  const url = fsEntry?.resultUrl || knownUrl;
  const available = true; // Allow checking all years 2005-2026 via search
  const featured  = fsEntry?.featured || false;
  const levelConf = LEVELS.find(l => l.id === level);
  const color = levelConf?.color || G;

  return (
    <motion.div
      initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ duration:.35 }}
      onClick={() => available && onSelect(year, url, fsEntry)}
      style={{
        borderRadius:16, padding:"18px 20px",
        background: available ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.02)",
        border:`1px solid ${available ? (featured ? `${G}40` : "rgba(255,255,255,.09)") : "rgba(255,255,255,.05)"}`,
        cursor: available ? "pointer" : "default",
        transition:"all .2s ease", position:"relative", overflow:"hidden",
        WebkitTapHighlightColor:"transparent",
        ...(available ? {} : { opacity:.55 })
      }}
      onMouseEnter={e => available && (e.currentTarget.style.borderColor = `${color}55`, e.currentTarget.style.transform="translateY(-2px)")}
      onMouseLeave={e => available && (e.currentTarget.style.borderColor = featured ? `${G}40` : "rgba(255,255,255,.09)", e.currentTarget.style.transform="")}
    >
      {featured && (
        <div style={{ position:"absolute", top:10, right:10, padding:"2px 8px", borderRadius:6, background:`${G}20`, color:G, fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".07em" }}>
          <Star size={9} fill={G} style={{ display:"inline", verticalAlign:"-1px", marginRight:3 }} /> Featured
        </div>
      )}

      {/* Year badge */}
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:26, fontWeight:900, letterSpacing:"-.04em", marginBottom:8, color: available ? "#fff" : "rgba(255,255,255,.5)" }}>
        {year}
      </div>

      {/* Title */}
      <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginBottom:12, lineHeight:1.5 }}>
        {fsEntry?.title || `${levelConf?.long} ${year}`}
      </div>

      {/* Status + CTA */}
      {available ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, color:"#4ade80", fontSize:11, fontWeight:800 }}>
            <CheckCircle size={12} /> Available
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, color:color, fontWeight:800, fontSize:12 }}>
            View Results <ChevronRight size={12} />
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,.5)", fontSize:11, fontWeight:700 }}>
          <Clock size={12} /> Not available yet
        </div>
      )}
    </motion.div>
  );
}

// ── Result modal ────────────────────────────────────
function ResultModal({ year, level, url, entry, onClose }) {
  const levelConf = LEVELS.find(l => l.id === level);
  const color = levelConf?.color || G;
  const title = entry?.title || `${levelConf?.long} ${year}`;
  const description = entry?.description || `Official ${levelConf?.long} examination results for ${year}.`;
  const source = entry?.source || "NECTA — necta.go.tz";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 16px" }}>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.8)", backdropFilter:"blur(12px)" }} />
      <motion.div initial={{ opacity:0, scale:.92, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.92, y:16 }}
        style={{ position:"relative", width:"100%", maxWidth:480, background:"#0e101a", borderRadius:28, border:"1px solid rgba(255,255,255,.12)", padding:"32px 28px", boxShadow:"0 40px 100px rgba(0,0,0,.8)" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${color}18`, border:`1px solid ${color}30`, display:"grid", placeItems:"center", fontSize:22 }}>
              {levelConf?.emoji}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".08em" }}>NECTA Results</div>
              <div style={{ fontWeight:900, fontSize:16, color:"#fff" }}>{levelConf?.label}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", borderRadius:10, width:36, height:36, cursor:"pointer", display:"grid", placeItems:"center", fontSize:18 }}>✕</button>
        </div>

        {/* Year badge */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:72, fontWeight:900, color:G, lineHeight:1, letterSpacing:"-.06em" }}>{year}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.55)", marginTop:6 }}>{title}</div>
        </div>

        {/* Description */}
        <p style={{ color:"rgba(255,255,255,.45)", fontSize:13.5, lineHeight:1.7, marginBottom:20, textAlign:"center" }}>
          {description}
        </p>

        {/* Source */}
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", marginBottom:24, fontSize:12, color:"rgba(255,255,255,.4)" }}>
          <FolderOpen size={13} /> Source: {source}
        </div>

        {/* CTA */}
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"14px 0", borderRadius:16, background:`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, fontSize:15, border:"none", cursor:"pointer", textDecoration:"none", boxSizing:"border-box", boxShadow:`0 8px 24px ${G}35` }}>
          <ExternalLink size={18} /> Open Official Results
        </a>
        <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.25)", marginTop:12 }}>
          Opens NECTA official website — necta.go.tz
        </p>
      </motion.div>
    </div>
  );
}

// ── Performance Message Helper ────────────────────────
const getPerformanceMessage = (div, pts) => {
  const d = div?.toUpperCase() || "";
  if (d.includes('I') && !d.includes('II') && !d.includes('III')) {
    return { 
      title: "Umetisha Sana! 🔥", 
      msg: "Outstanding performance! You are leading the way. Sio mchezo, baba lao!",
      emoji: "👑",
      feedback: "HONGERA SANA HAIKUWA RAHISI! 🏆"
    };
  }
  if (d.includes('II')) {
    return { 
      title: "Kazi Safi! 🚀", 
      msg: "Great work! You've shown real potential. Hapo sasa, ongeza kidogo tu uwe Legend!",
      emoji: "🦁",
      feedback: "KAZI NZURI SANA! Pambana zaidi uone matunda makubwa! 💪"
    };
  }
  if (d.includes('III')) {
    return { 
      title: "Hatua Nzuri! 💪", 
      msg: "Every step counts. Embrace the challenge and aim higher. Haujafeli, kaza buti!",
      emoji: "⚡",
      feedback: "SI HABA! Umepambana na umeshinda mpira. Next level utapasua anga! 🛰️"
    };
  }
  return { 
    title: "Kaza zaidi! 💎", 
    msg: "The journey of a thousand miles starts with a single step. Usikate tamaa, bado nafasi ipo!",
    emoji: "🌟",
    feedback: "SAFARI INAENDELEA! Jiamini na piga kazi, kesho itakuwa tamu zaidi na Stea! 🍯"
  };
};

// ── Main page ────────────────────────────────────────
export default function NectaResultsPage() {
  console.log("NectaResultsPage rendering...");
  const { level: levelParam, year: yearParam } = useParams();
  const navigate = useNavigate();

  const resolvedLevel = resolveLevel(levelParam);
  const [activeLevel, setActiveLevel] = useState(resolvedLevel || "csee");
  const [activeYear,  setActiveYear]  = useState(yearParam ? parseInt(yearParam) : 2024);
  
  // Search state
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schools, setSchools] = useState([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  
  // Result state
  const [results, setResults] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [error, setError] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [history, setHistory] = useState([]);
  
  // Personalization state
  const [customName, setCustomName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customMsg, setCustomMsg] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please select a file smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (showCertificate && selectedStudent) {
      const defaultMsg = getPerformanceMessage(selectedStudent.division, selectedStudent.points);
      setCustomTitle(defaultMsg.title);
      setCustomMsg(defaultMsg.feedback);
    }
  }, [showCertificate, selectedStudent]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('necta_history') || '[]'));
  }, []);

  const filteredStudents = useMemo(() => {
    if (!results?.students) return [];
    if (!studentSearch.trim()) return results.students;
    return results.students.filter(s => s.indexNumber.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [results, studentSearch]);

  // Firestore & Fallback Data
  const [fsData,       setFsData]     = useState({});
  const [fsLoading,    setFsLoading]  = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setFsLoading(false); return; }
    try {
      const q = query(collection(db, "necta_results"), orderBy("year", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const lvl = resolveLevel(data.level || "") || data.level;
          if (lvl && data.year) map[`${lvl}-${data.year}`] = { id:d.id, ...data };
        });
        setFsData(map);
        setFsLoading(false);
      }, () => setFsLoading(false));
      return () => unsub();
    } catch(e) { setFsLoading(false); }
  }, []);

  // Fetch schools when typing
  useEffect(() => {
    if (schoolSearch.length < 3 || results) {
      if (!results) setSchools([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingSchools(true);
      setError(null); // Clear previous errors
      try {
        console.log(`Searching schools for query: ${schoolSearch}, level: ${activeLevel}, year: ${activeYear}`);
        const path = `/api/necta/schools?examType=${encodeURIComponent(activeLevel)}&year=${encodeURIComponent(activeYear)}&query=${encodeURIComponent(schoolSearch)}`;
        const res = await fetch(buildNectaApiUrl(path));
        const data = await readJsonResponse(res, "Schools fetch");
        console.log("Schools search results:", data);
        setSchools(data || []);
        if ((data || []).length === 0) {
            setError(`No schools found for "${schoolSearch}". Make sure you are searching in the correct level.`);
        }
      } catch (err) {
        console.error("Schools fetch failed with error:", err);
        setSchools([]);
        setError(getFriendlyNectaError(err, "NECTA results for this exam/year are unavailable or use an older format that STEA cannot read yet."));
      } finally {
        setSearchingSchools(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [schoolSearch, activeLevel, activeYear, results]);

  const fetchFullResults = async (school) => {
    setSelectedSchool(school);
    setFetchingResults(true);
    setResults(null);
    setError(null);
    try {
      const path = `/api/necta/results/${encodeURIComponent(activeLevel)}/${encodeURIComponent(activeYear)}/${encodeURIComponent(school.code)}`;
      const res = await fetch(buildNectaApiUrl(path));
      const data = await readJsonResponse(res, "Results fetch");
      setResults(data);
    } catch (err) {
      setError(getFriendlyNectaError(err, "Results for this school/year combination might not be available yet."));
      console.error(err);
    } finally {
      setFetchingResults(false);
    }
  };

  const downloadPDF = async () => {
    if (!results) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("STEA NECTA Hub", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(results.examTitle || "Examination Results", 105, 25, { align: "center" });
    doc.setFontSize(12);
    doc.text(results.schoolName || results.schoolCode, 105, 32, { align: "center" });

    if (results.students && results.students.length > 0) {
      const tableData = results.students.map(s => [
        s.indexNumber, s.sex, s.points, s.division, (s.subjects || "").substring(0, 50) + "..."
      ]);
      autoTable(doc, {
        startY: 45,
        head: [['Index #', 'Sex', 'Points', 'Div', 'Summary']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 166, 35] }
      });
    }

    doc.save(`${results.schoolCode}_${activeLevel}_${activeYear}_Results.pdf`);
  };

  const saveToHistory = (student, schoolName, examTitle, nowTimestamp) => {
    const hist = JSON.parse(localStorage.getItem('necta_history') || '[]');
    const isDup = hist.some(h => h.student?.indexNumber === student.indexNumber && h.year === activeYear);
    
    if (!isDup) {
      const entry = { 
        id: `res-${nowTimestamp}`,
        level: activeLevel, 
        year: activeYear, 
        school: schoolName, 
        exam: examTitle,
        student: student,
        time: nowTimestamp 
      };
      const newHist = [entry, ...hist.slice(0, 19)];
      localStorage.setItem('necta_history', JSON.stringify(newHist));
      setHistory(newHist);
      
      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [G, G2, '#ffffff']
      });
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your academic history?")) {
      localStorage.removeItem('necta_history');
      setHistory([]);
    }
  };

  const shareResults = async () => {
    const title = results?.schoolName || "STEA NECTA Results";
    const url = `${window.location.origin}/results/${activeYear}/${(results?.schoolCode || selectedSchool?.code || "school").toLowerCase()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check ${title} results on STEA`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setError("Result link copied.");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`, "_blank", "noopener,noreferrer");
    }
  };

  const downloadCertificate = async (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, { 
      scale: 3, 
      backgroundColor: "#0a0b10",
      useCORS: true,
      logging: false,
      allowTaint: true
    });
    const link = document.createElement('a');
    link.download = `STEA_Result_${selectedStudent?.indexNumber || 'Certificate'}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  return (
    <div style={{ position: "relative", minHeight:"100vh", background:BG, color:"#fff", paddingBottom:120, overflow: "hidden" }}>
      <AnimatedBackground />
      <SEOHead
        title={`${activeLevel.toUpperCase()} ${activeYear} NECTA Results Search | STEA`}
        description={`Search ${activeLevel.toUpperCase()} ${activeYear} NECTA schools, view result summaries, save results, and share result pages on STEA.`}
        canonicalUrl={`${window.location.origin}/exams/results`}
        keywords={["NECTA results", activeLevel, activeYear, "Tanzania schools", "STEA"]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": `${activeLevel.toUpperCase()} ${activeYear} NECTA Results Search`,
          "url": `${window.location.origin}/exams/results`,
          "description": "School result search and result discovery page for STEA.",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Hero Header */}
      <section style={{ padding:"100px 0 40px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}>
              <div className="badge-shine glass" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"8px 16px", borderRadius:99, color:G, fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", marginBottom:20 }}>
                <BookOpen size={13} /> NECTA SMART HUB
              </div>
            </motion.div>
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(32px,6vw,56px)", fontWeight:900, letterSpacing:"-.04em", margin:"0 0 16px" }}>
              <BlurText text="Check Results" /> <BlurText className="gold-glow" style={{ color:G }} delay={0.8} text="Faster" />
            </div>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:600, margin:"0 auto" }}>
              Skip the long queues. Search your school and see results instantly inside STEA.
            </p>
          </div>

          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:10, justifyContent:"center" }}>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => { setActiveLevel(l.id); setResults(null); setSelectedSchool(null); }} style={chip(activeLevel === l.id, l.color)}>
                {l.emoji} {l.label}
              </button>
            ))}
          </div>
        </W>
      </section>

      <W style={{ marginTop:40 }}>
        {!results ? (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            style={{ maxWidth:600, margin:"0 auto", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:24, padding:32 }}>
            
            <div style={{ display:"flex", gap:16, marginBottom:24 }}>
               <div style={{ flex:1 }}>
                 <label style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.4)", display:"block", marginBottom:8 }}>SELECT YEAR</label>
                 <select value={activeYear} onChange={e => setActiveYear(parseInt(e.target.value))}
                   style={{ width:"100%", height:52, background:"#0e101a", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, color:"#fff", padding:"0 16px", fontSize:16, fontWeight:700 }}>
                   {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
               </div>
               <div style={{ flex:2 }}>
                 <label style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.4)", display:"block", marginBottom:8 }}>SCHOOL NAME / NUMBER</label>
                 <div style={{ position:"relative" }}>
                   <input value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)} placeholder="e.g. Azania, S0101, or Tabora Boys"
                     style={{ width:"100%", height:52, background:"#0e101a", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, color:"#fff", padding:"0 16px 0 44px", fontSize:16, fontWeight:700, outline:"none", boxSizing:"border-box" }} />
                   <Search size={18} style={{ position:"absolute", left:16, top:17, opacity:0.4 }} />
                   {searchingSchools && <div style={{ position:"absolute", right:16, top:17 }}><Clock size={18} className="animate-spin opacity-50" /></div>}
                 </div>
               </div>
            </div>

            <div style={{ display:"grid", gap:10, maxHeight:300, overflowY:"auto", padding:"0 4px" }}>
              {searchingSchools && <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:20 }}>Searching schools...</p>}
              {!searchingSchools && error && <p style={{ fontSize:13, color:"#ff8888", textAlign:"center", padding:20 }}>{error}</p>}
              {!searchingSchools && !error && schoolSearch.length >= 3 && schools.length === 0 && <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:20 }}>No schools found for "{schoolSearch}"</p>}
              {schools.map(s => (
                <button key={s.code} onClick={() => fetchFullResults(s)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontWeight:900, color:G, fontSize:12 }}>{s.code}</div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{s.name}</div>
                  </div>
                  <ChevronRight size={18} opacity={0.4} />
                </button>
              ))}
              {schoolSearch.length < 3 && !searchingSchools && (
                <div style={{ textAlign:"center", padding:40, opacity:0.3 }}>
                  <Search size={48} style={{ margin:"0 auto 16px" }} />
                  <p style={{ fontSize:14 }}>Type at least 3 letters of your school name</p>
                </div>
              ) }
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:16 }}>
              <button onClick={() => setResults(null)} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"10px 20px", borderRadius:12, fontWeight:700, cursor:"pointer" }}>
                <ArrowLeft size={18} /> Search again
              </button>
              <div style={{ textAlign:"right" }}>
                <h2 style={{ margin:0, fontWeight:900, fontSize:22 }}>{results.schoolName}</h2>
                <div style={{ fontSize:13, color:G, fontWeight:800 }}>{results.examTitle}</div>
              </div>
              <button onClick={downloadPDF} style={{ background:G, color:"#000", padding:"10px 24px", borderRadius:12, fontWeight:900, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                Download Result PDF
              </button>
              <button onClick={shareResults} style={{ background:"rgba(255,255,255,0.06)", color:"#fff", padding:"10px 18px", borderRadius:12, fontWeight:800, border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                <Share2 size={16} /> Share
              </button>
            </div>

            <AdSlot id="necta-result-inline" type="in-feed" style={{ marginBottom: 28 }} />

            {results.summary && results.summary.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                   <div style={{ width:36, height:36, borderRadius:10, background:`${G}20`, display:"grid", placeItems:"center" }}>
                      <Zap size={18} color={G} />
                   </div>
                   <h3 style={{ fontSize:18, fontWeight:900, margin:0, letterSpacing:"-.02em" }}>Performance Analytics</h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {(() => {
                    const headers = results.summary[0];
                    const dataRow = results.summary.find(r => r[0] === 'T') || results.summary[results.summary.length - 1];
                    const stats = [];
                    
                    headers.forEach((h, idx) => {
                      if (['I', 'II', 'III', 'IV', '0'].includes(h)) {
                        stats.push({ label: `DIV ${h}`, value: dataRow[idx], color: h === 'I' ? '#4ade80' : h === 'II' ? G : h === 'III' ? '#3b82f6' : 'rgba(255,255,255,0.4)' });
                      }
                    });

                    return stats.map((s, idx) => (
                      <motion.div key={idx} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.1 }}
                        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, textAlign:"center" }}>
                        <div style={{ fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.4)", marginBottom:4, textTransform:"uppercase" }}>{s.label}</div>
                        <div style={{ fontSize:24, fontWeight:900, color:s.color }}>{s.value}</div>
                      </motion.div>
                    ));
                  })()}
                </div>

                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, overflow:"hidden" }}>
                  <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", gap:8 }}>
                    <History size={14} color={G} />
                    <span style={{ fontSize:11, fontWeight:900, color:G, textTransform:"uppercase", letterSpacing:".05em" }}>Division Performance Summary</span>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", minWidth: 400 }}>
                      <thead>
                        <tr style={{ background:"rgba(255,255,255,0.02)" }}>
                          {results.summary[0].map((h, i) => (
                            <th key={i} style={{ padding:"12px 16px", fontSize:10, fontWeight:900, color:"rgba(255,255,255,0.4)", textAlign:"left", textTransform:"uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.summary.slice(1).map((row, i) => {
                          const isTotal = row[0] === 'T' || row[0] === 'TOTAL';
                          return (
                            <tr key={i} style={{ borderBottom: i === results.summary.length - 2 ? "none" : "1px solid rgba(255,255,255,0.05)", background: isTotal ? "rgba(255,255,255,0.04)" : "transparent" }}>
                              {row.map((cell, j) => (
                                <td key={j} style={{ padding:"12px 16px", fontSize:13, fontWeight: isTotal ? 900 : 500, color: isTotal ? G : (j === 0 ? "rgba(255,255,255,0.6)" : "#fff") }}>{cell}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Student CTA Banner */}
            <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
              style={{ background:`linear-gradient(135deg, ${G}, ${G2})`, borderRadius:24, padding:32, marginBottom:40, position:"relative", overflow:"hidden", color:"#000" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:150, height:150, background:"rgba(255,255,255,0.2)", borderRadius:"50%" }} />
              <div style={{ position:"relative", zIndex:1, maxWidth:500 }}>
                <h3 style={{ fontSize:24, fontWeight:900, margin:"0 0 8px", letterSpacing:"-.03em" }}>Find Your Personal Result</h3>
                <p style={{ margin:"0 0 20px", fontSize:15, fontWeight:600, opacity:0.8 }}>
                  Search for your index number to get a personalized performance message and download your limited edition Stea certificate.
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search size={16} style={{ position:"absolute", left:12, top:13, opacity:0.6 }} />
                    <input 
                      value={studentSearch} 
                      onChange={e => setStudentSearch(e.target.value)} 
                      placeholder="Enter Index Number (e.g. S0101/0001)"
                      style={{ width:"100%", height:42, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"0 12px 0 36px", color:"#000", fontWeight:700, outline:"none", fontSize:13 }} 
                    />
                  </div>
                </div>
              </div>
              <div style={{ position:"absolute", right:40, bottom:-10, fontSize:120, opacity:0.1, fontWeight:900 }}>STEA</div>
            </motion.div>

            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, overflow:"hidden" }}>
            <div style={{ padding:20, background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
                <h3 style={{ margin:0, fontSize:15, fontWeight:900 }}>Detailed Results ({filteredStudents.length} Students)</h3>
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search by Index Number..."
                  style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"8px 12px", color:"#fff", fontSize:13 }} />
              </div>
              
              {filteredStudents.length === 1 && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ 
                    padding:0, borderRadius:24, overflow:"hidden", marginBottom:24,
                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)"
                }}>
                    {(() => {
                        const s = filteredStudents[0];
                        const perf = getPerformanceMessage(s.division, s.points);
                        const isDivI = s.division?.includes("I");
                        return (
                          <div style={{ textAlign:"center" }}>
                            <div style={{ padding:"24px 24px 0" }}>
                                <div style={{ width:72, height:72, borderRadius:"50%", background:isDivI ? "#4ade80" : G, margin:"0 auto 16px", fontSize:32, display:"grid", placeItems:"center" }}>{s.sex === "M" ? "👨‍🎓" : "👩‍🎓"}</div>
                                <h4 style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>{perf.title}</h4>
                                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:15, marginBottom:20 }}>{perf.msg}</p>
                                <button 
                                  onClick={() => { setSelectedStudent(s); setShowCertificate(true); saveToHistory(s, results.schoolName, results.examTitle, Date.now()); }}
                                  style={{ background:G, color:"#000", border:"none", padding:"10px 24px", borderRadius:12, fontWeight:900, cursor:"pointer", marginBottom:20, display:"inline-flex", alignItems:"center", gap:8 }}
                                >
                                  ⭐ Create My Certificate
                                </button>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", background:"rgba(0,0,0,0.2)", padding:"20px" }}>
                                <div><div style={{ fontSize:10, color:"#888" }}>INDEX</div><div style={{ fontWeight:900 }}>{s.indexNumber}</div></div>
                                <div style={{ borderLeft:"1px solid rgba(255,255,255,0.05)", borderRight:"1px solid rgba(255,255,255,0.05)" }}><div style={{ fontSize:10, color:"#888" }}>POINTS</div><div style={{ fontWeight:900, color:isDivI ? "#4ade80" : G }}>{s.points}</div></div>
                                <div><div style={{ fontSize:10, color:"#888" }}>DIV</div><div style={{ fontWeight:900, color:isDivI ? "#4ade80" : G }}>{s.division}</div></div>
                            </div>
                          </div>
                        );
                    })()}
                </motion.div>
              )}

              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"rgba(255,255,255,0.04)", textAlign:"left" }}>
                       <th style={{ padding:16, fontSize:12, fontWeight:900, color:G }}>INDEX NUMBER</th>
                       <th style={{ padding:16, fontSize:12, fontWeight:900, color:G }}>SEX</th>
                       <th style={{ padding:16, fontSize:12, fontWeight:900, color:G }}>POINTS</th>
                       <th style={{ padding:16, fontSize:12, fontWeight:900, color:G }}>DIV</th>
                       <th style={{ padding:16, fontSize:12, fontWeight:900, color:G }}>SUBJECT SCORES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                         <td style={{ padding:16, fontWeight:900, fontSize:14 }}>{s.indexNumber}</td>
                         <td style={{ padding:16, fontSize:14 }}>{s.sex}</td>
                         <td style={{ padding:16, fontSize:14, fontWeight:700 }}>{s.points}</td>
                         <td style={{ padding:16, fontSize:14, fontWeight:900, color: s.division?.includes("I") ? "#4ade80" : "#fff" }}>{s.division}</td>
                         <td style={{ padding:16, fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.4 }}>{s.subjects}</td>
                         <td style={{ padding:16, textAlign:"right" }}>
                            <button 
                              onClick={() => { setSelectedStudent(s); setShowCertificate(true); saveToHistory(s, results.schoolName, results.examTitle, Date.now()); }}
                              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:G, padding:"6px 12px", borderRadius:8, fontSize:11, fontWeight:800, cursor:"pointer" }}
                            >
                              Certificate
                            </button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </W>

      {fetchingResults && (
        <div style={{ position:"fixed", inset:0, zIndex:3000, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", display:"grid", placeItems:"center" }}>
          <div style={{ textAlign:"center" }}>
             <Clock size={48} color={G} className="animate-spin" style={{ margin:"0 auto 20px" }} />
             <h2 style={{ fontWeight:900 }}>Fetching Results...</h2>
             <p style={{ color:"rgba(255,255,255,0.4)" }}>Connecting to official NECTA database for {selectedSchool?.name}</p>
          </div>
        </div>
      )}


      {error && (
        <div style={{ position:"fixed", bottom:40, left:"50%", transform:"translateX(-50%)", zIndex:4000, background:"#ef4444", color:"#fff", padding:"16px 24px", borderRadius:16, boxShadow:"0 20px 40px rgba(239, 68, 68, 0.3)", display:"flex", alignItems:"center", gap:12 }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight:700 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background:"rgba(255,255,255,0.2)", border:"none", width:24, height:24, borderRadius:6, color:"#fff", cursor:"pointer" }}>✕</button>
        </div>
      )}

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && selectedStudent && (
          <div style={{ position:"fixed", inset:0, zIndex:5000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
             <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowCertificate(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)" }} />
              <motion.div initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.9, opacity:0, y:20 }} 
                style={{ position:"relative", width:"100%", maxWidth:480, background:"#0a0b10", borderRadius:32, border:`2px solid ${G}40`, overflow:"hidden", boxShadow:`0 40px 120px rgba(0,0,0,1), 0 0 50px ${G}20` }}>
                
                <div id="cert-capture" style={{ width: 440, margin: "0 auto", padding: 32, background: "#0a0b10", textAlign: "center", position: "relative", minHeight: 600 }}>
                   {/* Background Elements */}
                   <div style={{ position:"absolute", top:-50, right:-50, width:150, height:150, background:`radial-gradient(circle, ${G}22 0%, transparent 70%)` }} />
                   <div style={{ position:"absolute", bottom:-50, left:-50, width:150, height:150, background:`radial-gradient(circle, ${G}22 0%, transparent 70%)` }} />
                   
                   {/* Decorative corners */}
                   <div style={{ position:"absolute", top:20, left:20, width:40, height:40, borderTop:`3px solid ${G}`, borderLeft:`3px solid ${G}`, borderRadius:"8px 0 0 0" }} />
                   <div style={{ position:"absolute", top:20, right:20, width:40, height:40, borderTop:`3px solid ${G}`, borderRight:`3px solid ${G}`, borderRadius:"0 8px 0 0" }} />
                   <div style={{ position:"absolute", bottom:20, left:20, width:40, height:40, borderBottom:`3px solid ${G}`, borderLeft:`3px solid ${G}`, borderRadius:"0 0 0 8px" }} />
                   <div style={{ position:"absolute", bottom:20, right:20, width:40, height:40, borderBottom:`3px solid ${G}`, borderRight:`3px solid ${G}`, borderRadius:"0 0 8px 0" }} />

                   <div style={{ marginBottom:20 }}>
                     <Sparkles size={24} color={G} style={{ margin:"0 auto 8px" }} />
                     <div style={{ fontSize:10, fontWeight:900, color:G, letterSpacing:".3em", textTransform:"uppercase" }}>STEA ACADEMIC EXCELLENCE</div>
                   </div>

                   <div style={{ position:"relative", width:100, height:100, margin:"0 auto 20px" }}>
                      <div style={{ position:"absolute", inset:-10, background:`conic-gradient(from 0deg, transparent, ${G}, transparent)`, borderRadius:"50%", animation:"spin 4s linear infinite" }} />
                      <div style={{ position:"relative", width:"100%", height:"100%", borderRadius:"50%", background:G, display:"grid", placeItems:"center", fontSize:48, boxShadow:`0 0 30px ${G}60`, border:"4px solid #0a0b10", overflow:"hidden" }}>
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        ) : (
                          selectedStudent.sex === "M" ? "👨‍🎓" : "👩‍🎓"
                        )}
                      </div>
                   </div>

                   <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:32, fontWeight:900, color:"#fff", marginBottom:4, letterSpacing:"-.04em" }}>{customTitle || getPerformanceMessage(selectedStudent.division, selectedStudent.points).title}</h2>
                   <div style={{ fontSize:13, fontWeight:700, color:G, marginBottom:24, opacity:0.8 }}>OFFICIAL STEA HALL OF FAME — {activeYear}</div>

                   <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:20, padding:20, border:"1px solid rgba(255,255,255,0.07)", marginBottom:24, position:"relative" }}>
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${G}, transparent)` }} />
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:900, marginBottom:4 }}>STUDENT IDENTITY</div>
                      {customName && (
                        <div style={{ fontSize:18, fontWeight:800, color:G, marginBottom:4, textTransform:"uppercase" }}>{customName}</div>
                      )}
                      <div style={{ fontSize:customName ? 14 : 20, fontWeight:900, color: customName ? "rgba(255,255,255,0.6)" : "#fff", marginBottom:16, fontFamily:"monospace" }}>{selectedStudent.indexNumber}</div>

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"rgba(255,255,255,0.1)", borderRadius:12, overflow:"hidden" }}>
                        <div style={{ background:"rgba(0,0,0,0.3)", padding:12 }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:900 }}>DIVISION</div>
                          <div style={{ fontSize:24, fontWeight:900, color:G }}>{selectedStudent.division}</div>
                        </div>
                        <div style={{ background:"rgba(0,0,0,0.3)", padding:12 }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:900 }}>POINTS</div>
                          <div style={{ fontSize:24, fontWeight:900, color:G }}>{selectedStudent.points}</div>
                        </div>
                      </div>
                   </div>

                   <div style={{ textAlign:"left", background:"rgba(0,0,0,0.2)", borderRadius:20, padding:24, border:"1px solid rgba(255,255,255,0.05)", marginBottom:24 }}>
                      <div style={{ fontSize:10, fontWeight:900, color:G, marginBottom:16, textTransform:"uppercase", display:"flex", alignItems:"center", gap:10, letterSpacing:".1em" }}>
                        <Award size={14} /> Academic Transcript
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"10px 24px" }}>
                        {(selectedStudent.subjects?.match(/[A-Z0-9/.&\s]+-\s*['’]?[A-F0-9SX*]['’]?/gi) || []).map((sub, i) => {
                          const parts = sub.split("-");
                          const name = parts[0]?.trim();
                          const grade = parts[1]?.replace(/['’]/g, "").trim();
                          if (!name || !grade) return null;
                          const isHigh = ["A", "B"].includes(grade.toUpperCase());
                          return (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, borderBottom:"1px solid rgba(255,255,255,0.03)", paddingBottom:4, minWidth:0 }}>
                              <span style={{ color:"rgba(255,255,255,0.5)", fontWeight:700, fontSize:9, textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:8 }}>{name}</span>
                              <span style={{ color: isHigh ? "#4ade80" : G, fontWeight:900, fontSize:15, textAlign:"right" }}>{grade}</span>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div style={{ padding:"0 10px", marginTop: 8 }}>
                      <div style={{ fontSize:28, marginBottom:12 }}>{getPerformanceMessage(selectedStudent.division, selectedStudent.points).emoji}</div>
                      <div style={{ fontSize:16, fontWeight:900, color: "#fff", lineHeight:1.4, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                        {customMsg || getPerformanceMessage(selectedStudent.division, selectedStudent.points).feedback}
                      </div>
                   </div>

                   <div style={{ marginTop:32, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                     <CheckCircle size={14} color={G} />
                     <span style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,0.2)", letterSpacing:".05em" }}>VERIFIED BY STEA TECHNOLOGY</span>
                   </div>
                </div>

                {/* Personalization Controls */}
                <div style={{ padding:20, background:"rgba(255,255,255,0.05)", borderTop:"1px solid rgba(255,255,255,0.1)", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
                   <div style={{ fontSize:11, fontWeight:900, color:G, marginBottom:16, textTransform:"uppercase", letterSpacing:".05em", textAlign:"center" }}>Personalize Your Trophy</div>
                   <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div style={{ position:"relative" }}>
                          <input 
                            type="text" 
                            value={customName} 
                            onChange={e => setCustomName(e.target.value)} 
                            placeholder="Your Full Name"
                            maxLength={30}
                            style={{ width:"100%", height:44, background:"#0a0b10", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"0 12px 0 36px", color:"#fff", fontSize:12, fontWeight:700 }}
                          />
                          <User size={14} style={{ position:"absolute", left:12, top:15, opacity:0.5 }} />
                        </div>
                        <div style={{ position:"relative" }}>
                           <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", height:44, background: profileImage ? `${G}20` : "#0a0b10", border:`1px solid ${profileImage ? G : "rgba(255,255,255,0.1)"}`, borderRadius:12, cursor:"pointer", color: profileImage ? G : "#fff", fontSize:12, fontWeight:700 }}>
                              <Camera size={14} /> {profileImage ? "Change Image" : "Upload Photo"}
                              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }} />
                           </label>
                        </div>
                      </div>

                      <div style={{ position:"relative" }}>
                        <input 
                          type="text" 
                          value={customTitle} 
                          onChange={e => setCustomTitle(e.target.value)} 
                          placeholder="Edit Trophy Title"
                          maxLength={30}
                          style={{ width:"100%", height:44, background:"#0a0b10", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"0 12px 0 36px", color:"#fff", fontSize:12, fontWeight:700 }}
                        />
                        <Zap size={14} style={{ position:"absolute", left:12, top:15, opacity:0.5 }} />
                      </div>

                      <div style={{ position:"relative" }}>
                        <input 
                          type="text" 
                          value={customMsg} 
                          onChange={e => setCustomMsg(e.target.value)} 
                          placeholder="Edit Motivational Words"
                          maxLength={60}
                          style={{ width:"100%", height:44, background:"#0a0b10", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"0 12px 0 36px", color:"#fff", fontSize:12, fontWeight:700 }}
                        />
                        <Sparkles size={14} style={{ position:"absolute", left:12, top:15, opacity:0.5 }} />
                      </div>
                   </div>
                </div>

                <div style={{ padding:24, background:"rgba(255,255,255,0.02)", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", gap:12 }}>
                   <button onClick={() => downloadCertificate('cert-capture')} 
                     style={{ flex:1, height:54, borderRadius:16, background:`linear-gradient(135deg, ${G}, ${G2})`, border:"none", color:"#000", fontWeight:900, cursor:"pointer", transition:"transform 0.2s" }}
                     onMouseDown={e => e.currentTarget.style.transform="scale(0.98)"}
                     onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
                   >
                     Download Trophies Image
                   </button>
                   <button onClick={() => setShowCertificate(false)} style={{ width:54, height:54, borderRadius:16, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer" }}>✕</button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
