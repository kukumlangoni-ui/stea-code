import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, BookOpen, CreditCard, Calendar, Users,
  ChevronDown, ArrowRight, ArrowLeft, CheckCircle, Star, MapPin,
  FileText, AlertCircle, Bot, Trophy, Zap,
  ExternalLink, Sparkles, School, Download, Search, Check, Info,
  Compass, Award, Globe, DollarSign, ListFilter, HelpCircle
} from "lucide-react";

// Import structured data
import {
  COURSES,
  UNIVERSITIES,
  CAREERS,
  STUDY_ABROAD,
  SCHOLARSHIPS_LIST
} from "../data/universityCareerData.js";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0e101a";
const BORDER = "rgba(255,255,255,0.08)";
const NEUTRAL = "rgba(255,255,255,0.6)";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function UniversityGuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // --- Sub-States for Course Explorer ---
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [courseSearch, setCourseSearch] = useState("");

  // --- Sub-States for University Directory ---
  const [selectedUni, setSelectedUni] = useState(UNIVERSITIES[0]);
  const [uniSearch, setUniSearch] = useState("");

  // --- Sub-States for Form 4 Pathfinder ---
  const [f4Division, setF4Division] = useState("Division I");
  const [f4Interest, setF4Interest] = useState("Engineering/Tech");
  const [f4PathResult, setF4PathResult] = useState(null);

  // --- Sub-States for Form 6 Pathfinder ---
  const [f6Combo, setF6Combo] = useState("PCM");
  const [f6Points, setF6Points] = useState(7);
  const [f6PathResult, setF6PathResult] = useState(null);

  // --- Sub-States for Points Calculator & Estimator & Eligibility ---
  const [calcGrades, setCalcGrades] = useState({
    somo1: "C",
    somo2: "C",
    somo3: "D",
    GS: "S",
    Bam: "F"
  });
  const [calcResult, setCalcResult] = useState(null);
  const [eligibilityCheckCourse, setEligibilityCheckCourse] = useState("engineering");
  const [eligibilityStatus, setEligibilityStatus] = useState(null);

  // --- Sub-States for Career Hub ---
  const [selectedCareer, setSelectedCareer] = useState(CAREERS[0]);
  const [careerSearch, setCareerSearch] = useState("");

  // --- Sub-States for Scholarships Matcher ---
  const [matchLevel, setMatchLevel] = useState("Undergraduate");
  const [matchCountry, setMatchCountry] = useState("Turkey");
  const [matchCourse, setMatchCourse] = useState("Engineering/Tech");
  const [matchedList, setMatchedList] = useState([]);

  // --- Quick Helpers ---
  const getGradeValue = (grade) => {
    const values = { A: 5, B: 4, C: 3, D: 2, E: 1, S: 0.5, F: 0 };
    return values[grade] || 0;
  };

  const handleCalculateForm6Points = () => {
    const p1 = getGradeValue(calcGrades.somo1);
    const p2 = getGradeValue(calcGrades.somo2);
    const p3 = getGradeValue(calcGrades.somo3);

    // Sort to take top 3 principal subjects
    const subjectsList = [
      { name: "Somo la Kwanza", grade: calcGrades.somo1, pts: p1 },
      { name: "Somo la Pili", grade: calcGrades.somo2, pts: p2 },
      { name: "Somo la Tatu", grade: calcGrades.somo3, pts: p3 }
    ];

    const totalPts = p1 + p2 + p3;
    let rank = "AVERAGE";
    let message = "Una sifa ya kujiunga na Diploma au Vyuo vya kati na kozi za kawaida za digrii.";
    let probabilityUDSM = "Mawasiliano na Chuo yanahitajika (GPA ya Diploma huongeza nafasi)";

    if (totalPts >= 12) {
      rank = "EXCELLENT (Ufaulu Mkubwa Kupitiliza)";
      message = "Hongera sana! Una sifa ya kujiunga na kozi yoyote ya juu ikiwemo Medicine (PCB), Engineering (PCM), na Law (HKL) katika vyuo vikubwa tanzania kabisa kama MUHAS na UDSM.";
      probabilityUDSM = "Asilimia 95%+ ya kupata chuo chaguo la kwanza.";
    } else if (totalPts >= 8) {
      rank = "VERY GOOD (Sifa Kubwa za Udahili)";
      message = "Una pointi nzuri zinazokutosheleza kupata kozi bora za Kompyuta, Uhasibu, Biashara, Usimamizi na Ualimu katika vyuo kama UDOM, IFM, Ardhi na Mzumbe.";
      probabilityUDSM = "Asilimia 80%+ ya kukubalika chuo kikuu.";
    } else if (totalPts >= 4) {
      rank = "GOOD / ELIGIBLE (Una Sifa ya Vyuo Vikuu)";
      message = "Umefaulu kwa vigezo vya chini vya TCU (Principal Passes mbili zenye jumla ya pointi 4). Unaweza kuchagua kozi za utawala, jamii au ualimu, au kuanza na Advanced Diploma.";
      probabilityUDSM = "Nafasi ya Wastani (Asilimia 50% kulingana na mahitaji ya kozi).";
    } else {
      rank = "DIPLOMA CANDIDATE / RETAKE REQUIRED";
      message = "Hujafikia sifa ya chini ya TCU ya Pointi 4 kutoka masomo mawili ya principal. Tunakushauri kufikiria kusoma stashahada (Diploma) kwanza au kufanya jaribio upya la mtihani kujenga sifa bora.";
      probabilityUDSM = "Chini ya 10%. Inashauriwa kuomba Diploma kwanza.";
    }

    setCalcResult({
      total: totalPts,
      rank,
      message,
      probabilityUDSM,
      breakdown: subjectsList
    });
  };

  const handleCheckEligibility = () => {
    const score = getGradeValue(calcGrades.somo1) + getGradeValue(calcGrades.somo2) + getGradeValue(calcGrades.somo3);
    const selectedObj = COURSES.find(c => c.id === eligibilityCheckCourse);
    let minNeeded = 8;
    if (eligibilityCheckCourse === "medicine") minNeeded = 11;
    if (eligibilityCheckCourse === "engineering") minNeeded = 9;
    if (eligibilityCheckCourse === "law") minNeeded = 7;
    if (eligibilityCheckCourse === "education") minNeeded = 4.5;
    if (eligibilityCheckCourse === "business") minNeeded = 5;

    const eligible = score >= minNeeded;
    setEligibilityStatus({
      eligible,
      score,
      minNeeded,
      courseName: selectedObj ? selectedObj.name : "N/A"
    });
  };

  // --- Pathfinder Algorithms ---
  const handleF4Pathfinder = () => {
    let comb = [];
    let dipl = [];
    let cert = [];

    if (f4Interest === "Engineering/Tech") {
      comb = ["PCM (Physics, Chemistry, Pure Math)", "PEM (Physics, Economics, Pure Math)", "PGM (Physics, Geography, Pure Math)"];
      dipl = ["Diploma in Civil Engineering", "Diploma in Computer Engineering", "Diploma in Information Tech (IT)", "Diploma in Electronics"];
      cert = ["Certificate in Electrical Installation", "Certificate in Basic Computing & IT Support", "Certificate in Automobile Engineering"];
    } else if (f4Interest === "Health/Sciences") {
      comb = ["PCB (Physics, Chemistry, Biology)", "CBG (Chemistry, Biology, Geography)", "CBA (Chemistry, Biology, Agriculture)"];
      dipl = ["Diploma in Clinical Medicine", "Diploma in Nursing & Midwifery", "Diploma in Pharmaceutical Sciences", "Diploma in Medical Laboratory"];
      cert = ["Certificate in Community Health", "Certificate in Environmental Health", "Certificate in Nursing Assistance"];
    } else if (f4Interest === "Commerce/Accounting") {
      comb = ["EGM (Economics, Geography, Pure Math)", "ECA (Economics, Commerce, Accountancy)", "CBG (Commerce, Biology, Geography)"];
      dipl = ["Diploma in Accountancy", "Diploma in Banking & Finance", "Diploma in Procurement and Logistics", "Diploma in Tax Management"];
      cert = ["Certificate in Business Administration", "Certificate in Bookkeeping & Storekeeping", "Certificate in Custom Clearing & Forwarding"];
    } else if (f4Interest === "Social Sciences/Law") {
      comb = ["HKL (History, Kiswahili, Literature)", "HGL (History, Geography, Literature)", "HGK (History, Geography, Kiswahili)"];
      dipl = ["Diploma in Law (LLB foundation)", "Diploma in Public Relations", "Diploma in Community Development", "Diploma in Journalism"];
      cert = ["Certificate in Legal Assistantship", "Certificate in Records Management", "Certificate in Local Government Administration"];
    } else if (f4Interest === "Agriculture/Environment") {
      comb = ["CBA (Chemistry, Biology, Agriculture)", "CBG (Chemistry, Biology, Geography)"];
      dipl = ["Diploma in Agribusiness & Horticulture", "Diploma in Animal Health & Production", "Diploma in Forestry", "Diploma in Wildlife Management"];
      cert = ["Certificate in General Agriculture", "Certificate in Animal Production", "Certificate in Forestry Basics"];
    } else {
      // Default / Education / General
      comb = ["HGE (History, Geography, Economics)", "HGK (History, Geography, Kiswahili)", "CBG (Chemistry, Biology, Geography)"];
      dipl = ["Diploma in Primary Education", "Diploma in Social Work", "Diploma in Tourism & Hospitality Management"];
      cert = ["Certificate in Early Childhood Education", "Certificate in Wildlife Tour Guiding", "Certificate in Community Social Work"];
    }

    if (f4Division === "Division IV" || f4Division === "Division IV/Fail") {
      // Limit combinations due to potential lack of principal entry criteria
      comb = ["Nafasi ya A-Level ni finyu sana. Inashauriwa chagua kusoma Diploma au Certificate kwanza kupata sifa za juu baadae."];
    }

    setF4PathResult({
      division: f4Division,
      interest: f4Interest,
      comb,
      dipl,
      cert
    });
  };

  const handleF6Pathfinder = () => {
    let courses = [];
    let unis = [];
    let careersList = [];

    if (f6Combo === "PCM" || f6Combo === "PGM") {
      courses = ["Bachelor of Civil Engineering", "B.Sc. in Computer Science", "Bachelor of Electrical Engineering", "B.Sc. in Information Technology", "B.Sc. in Telecommunications"];
      careersList = ["Software Engineer", "Civil Engineer", "IT Administrator", "Network Specialist", "Telecom Consultant"];
      unis = ["UDSM (CoET)", "DIT", "Ardhi University", "UDOM", "MUST"];
    } else if (f6Combo === "PCB") {
      courses = ["Doctor of Medicine (MD)", "Bachelor of Pharmacy", "B.Sc. in Nursing", "Bachelor of Medical Laboratory Science", "B.Sc. in Anatomy & Physiology"];
      careersList = ["Medical Doctor", "Pharmacist", "Clinical Researcher", "Surgeon Assistant", "Medical Administrator"];
      unis = ["MUHAS", "CUHAS", "KCMUCo", "UDOM (College of Medicine)", "UDSM (Mbeya)"];
    } else if (f6Combo === "CBG" || f6Combo === "PGM") {
      courses = ["Bachelor of Science in Agriculture", "B.Sc. in Environmental Sciences", "Bachelor of Agribusiness Management", "B.Sc. in Food Science", "Bachelor of Forestry"];
      careersList = ["Agronomist", "Farm Manager", "Socio-Environmental Planner", "Food Quality Officer", "Agriculture Teacher"];
      unis = ["SUA Sokoine", "UDOM", "UDSM", "Mzumbe University"];
    } else if (f6Combo === "HGE" || f6Combo === "EGM" || f6Combo === "CBG") {
      courses = ["Bachelor of Banking & Finance", "Bachelor of Accounting", "B.A. in Economics", "Bachelor of Business Administration", "B.Sc. in Actuarial Sciences"];
      careersList = ["Accountant", "Financial Analyst", "Operations Manager", "Insurance Consultant", "Tax Advisor"];
      unis = ["IFM", "Mzumbe University", "UDSM (UDBS)", "CBE", "TIA"];
    } else if (f6Combo === "HKL" || f6Combo === "HGL") {
      courses = ["Bachelor of Laws (LLB)", "Bachelor of Public Administration", "B.A. in International Relations", "B.A. in Journalism", "B.A. in Political Science"];
      careersList = ["Advocate", "State Attorney", "Public Relations Specialist", "Journalist / News Producer", "Human Resource Specialist"];
      unis = ["UDSM", "Mzumbe University", "SAUT", "Ruaha Catholic University", "Open University"];
    } else {
      courses = ["Bachelor of Education (Arts/Sciences)", "Bachelor of Social Work", "Bachelor of Tourism & Hospitality", "Bachelor of Library Management", "B.A. in Sociology"];
      careersList = ["Secondary Teacher", "Social Worker", "Hotel/Tourism Manager", "Records Archivist", "Welfare Coordinator"];
      unis = ["DUCE", "MUCE", "UDOM", "UDSM", "St. John's University"];
    }

    if (f6Points < 4) {
      courses = ["Sifa za Digrii hazijafikiwa (Pointi < 4). Mapendekezo yetu: Omba Stashahada (Diploma ya Miaka 2-3) katika fani hiyo ili upate nafasi ya Digrii baadae."];
    }

    setF6PathResult({
      combo: f6Combo,
      points: f6Points,
      courses,
      unis,
      careers: careersList
    });
  };

  const handleMatchScholarships = () => {
    const list = SCHOLARSHIPS_LIST.filter(s => {
      const matchL = s.level.toLowerCase().includes(matchLevel.toLowerCase().slice(0, 5)) || s.level.toLowerCase().includes("all");
      const matchC = s.country.toLowerCase() === matchCountry.toLowerCase() || s.country.toLowerCase() === "all" || (matchCountry === "Europe" && (s.country === "Turkey" || s.country === "Poland" || s.country === "Hungary"));
      const matchI = s.courseInterest.toLowerCase().includes(matchCourse.toLowerCase().split("/")[0].slice(0, 4)) || s.courseInterest.toLowerCase().includes("all");
      return matchC || matchI;
    });
    setMatchedList(list.slice(0, 5));
  };

  // Filter courses & careers based on search inputs
  const filteredCourses = COURSES.filter(c =>
    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.overview.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredCareers = CAREERS.filter(car =>
    car.title.toLowerCase().includes(careerSearch.toLowerCase()) ||
    car.responsibilities.toLowerCase().includes(careerSearch.toLowerCase())
  );

  const filteredUniversities = UNIVERSITIES.filter(u =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.location.toLowerCase().includes(uniSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#fff", display: "flex", flexDirection: "column" }}>
      
      {/* ── HEADER ── */}
      <header className="glass" style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifySelf: "stretch", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: `linear-gradient(135deg, ${G}, ${G2})`, width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center" }}>
              <GraduationCap size={24} color="#111" />
            </div>
            <div>
              <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", margin: 0, color: "#fff" }}>
                UNIVERSITY & CAREER HUB
              </h1>
              <p style={{ fontSize: 11, color: NEUTRAL, margin: 0, textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}>
                STEA Education Portal
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            id="back-to-hub-btn"
            onClick={() => navigate("/education")} 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 8, 
              background: "rgba(255,255,255,0.06)", 
              border: `1px solid ${BORDER}`, 
              color: "#fff", 
              padding: "10px 18px", 
              borderRadius: 12, 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: "pointer",
              transition: "0.2s"
            }}
          >
            <ArrowLeft size={16} /> Rudi Nyuma (Student Hub)
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT GRID ── */}
      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "28px 16px", display: "grid", gridTemplateColumns: "280px 1fr", gap: 28, alignContent: "start" }} className="md:grid-cols-1">
        
        {/* SIDEBAR NAVIGATION TAB PANELS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: NEUTRAL, paddingLeft: 12, marginBottom: 4, letterSpacing: "2px", textTransform: "uppercase" }}>
            NAVIGATE CENTERS
          </div>
          
          {[
            { id: "overview", label: "Mwanzo/Overview", icon: <Compass size={16} />, color: G },
            { id: "courses", label: "Course Explorer", icon: <BookOpen size={16} />, color: "#4ade80" },
            { id: "universities", label: "University Directory", icon: <School size={16} />, color: "#60a5fa" },
            { id: "form4path", label: "Form 4 Pathfinder", icon: <Zap size={16} />, color: "#facc15" },
            { id: "form6path", label: "Form 6 Pathfinder", icon: <Trophy size={16} />, color: "#a855f7" },
            { id: "points", label: "Points Calculator", icon: <Award size={16} />, color: "#fb923c" },
            { id: "careers", label: "Career Info Hub", icon: <Users size={16} />, color: "#f472b6" },
            { id: "heslb", label: "HESLB Center", icon: <CreditCard size={16} />, color: "#10b981" },
            { id: "tcu", label: "TCU Center", icon: <FileText size={16} />, color: "#38bdf8" },
            { id: "abroad", label: "Study Abroad Center", icon: <Globe size={16} />, color: "#ef4444" },
            { id: "matcher", label: "Scholarship Matcher", icon: <Sparkles size={16} />, color: G2 },
            { id: "ai", label: "STEA AI Assistant", icon: <Bot size={16} />, color: "#a855f7" },
          ].map((tabItem) => {
            const isSelected = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                id={`tab-btn-${tabItem.id}`}
                onClick={() => setActiveTab(tabItem.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: isSelected ? `linear-gradient(135deg, ${G}20, ${G2}12)` : "transparent",
                  borderLeft: isSelected ? `3px solid ${G}` : "3px solid transparent",
                  color: isSelected ? G : NEUTRAL,
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out"
                }}
              >
                <span style={{ color: isSelected ? G : tabItem.color }}>{tabItem.icon}</span>
                <span>{tabItem.label}</span>
                {isSelected && <ChevronDown size={14} style={{ marginLeft: "auto", transform: "rotate(-90deg)" }} />}
              </button>
            );
          })}
        </div>

        {/* DETAILS SECTION VIEWS CONTAINER */}
        <section style={{ minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "clamp(16px, 4vw, 36px)" }}
            >
              
              {/* ── 1. HUB OVERVIEW ── */}
              {activeTab === "overview" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 12 }}>
                    <Compass size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.5px" }}>Wakaribishwa STEA University & Career Center</span>
                  </div>
                  
                  <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px 0", letterSpacing: "-1px" }}>
                    Chora Ramani ya <span style={{ color: G }}>Malengo na Ndoto Zako</span>
                  </h2>
                  
                  <p style={{ color: NEUTRAL, fontSize: 14, lineHeight: 1.7, marginBottom: 32, maxWidth: 680 }}>
                    STEA sasa imekamilika! Kutoka kuajiriwa au kujiajiri, kujiandaa na mitihani mikuu, kukokotoa pointi za chuo, TCU na maombi ya mkopo HESLB, safari yako nzima ipo mikononi mwako. Browse na uelekezwe sasa.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 38 }}>
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <Trophy size={18} color={G} />
                        <h4 style={{ margin: 0, fontWeight: 800 }}>Uchaguzi Bora</h4>
                      </div>
                      <p style={{ fontSize: 13, color: NEUTRAL, lineHeight: 1.6, margin: 0 }}>
                        Zana yetu ya Pathfinder na Kikokotoo cha pointi za NECTA kukuchuja na chuo mapema.
                      </p>
                    </div>
                    
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <CreditCard size={18} color="#4ade80" />
                        <h4 style={{ margin: 0, fontWeight: 800 }}>Mipango ya Fedha</h4>
                      </div>
                      <p style={{ fontSize: 13, color: NEUTRAL, lineHeight: 1.6, margin: 0 }}>
                        Soma mwongozo rasmi wa HESLB kuomba mfuko wa masomo na upelekaji wa mkopo bila usumbufu.
                      </p>
                    </div>

                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <Globe size={18} color="#38bdf8" />
                        <h4 style={{ margin: 0, fontWeight: 800 }}>Mielekeo Kimataifa</h4>
                      </div>
                      <p style={{ fontSize: 13, color: NEUTRAL, lineHeight: 1.6, margin: 0 }}>
                        Vyuo vya juu Uturuki, China, USA na Canada. Match fursa za scholarship kwa sekunde.
                      </p>
                    </div>
                  </div>

                  <div style={{ height: 1, background: BORDER, margin: "32px 0" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <button 
                      type="button"
                      id="overview-explore-btn"
                      onClick={() => setActiveTab("courses")} 
                      style={{ background: `linear-gradient(135deg, ${G}, ${G2})`, border: "none", color: "#111", padding: "14px 28px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 14 }}
                    >
                      Tafuta Kozi na Vyuo Vikuu
                    </button>
                    <button 
                      type="button"
                      id="overview-pathfinder-btn"
                      onClick={() => setActiveTab("form4path")} 
                      style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#fff", padding: "14px 28px", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                    >
                      Tumia Pathfinder Sasa 🧭
                    </button>
                  </div>
                </div>
              )}

              {/* ── 2. COURSE EXPLORER ── */}
              {activeTab === "courses" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Course Explorer (Vinjari Masomo)</h3>
                      <p style={{ fontSize: 13, color: NEUTRAL, margin: "4px 0 0 0" }}>Bofya kozi kupata uelewa kamili, mshahara na vyuo vinavyotoa.</p>
                    </div>
                    
                    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
                      <Search size={16} color={NEUTRAL} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input 
                        type="text" 
                        id="course-search-input"
                        placeholder="Tafuta kozi (e.g. Medicine)..." 
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        style={{ width: "100%", height: 42, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, outline: "none", color: "#wrap", padding: "0 16px 0 40px", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }} className="md:grid-cols-1">
                    {/* Course list left panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto", paddingRight: 8 }}>
                      {filteredCourses.map((c) => {
                        const isChosen = selectedCourse.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            id={`course-${c.id}`}
                            onClick={() => setSelectedCourse(c)}
                            style={{
                              padding: "14px 16px",
                              borderRadius: 12,
                              border: isChosen ? `1px solid ${G}` : "1px solid transparent",
                              background: isChosen ? "rgba(245, 166, 35, 0.08)" : "rgba(255,255,255,0.02)",
                              color: isChosen ? G : "#fff",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 13.5,
                              fontWeight: 700,
                              transition: "0.2s"
                            }}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Course detail right panel */}
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, background: "rgba(255,255,255,0.01)" }}>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: G, margin: "0 0 12px 0" }}>{selectedCourse.name}</h4>
                      
                      <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.6, marginBottom: 20 }}>
                        <span style={{ fontWeight: 800, color: NEUTRAL }}>Malelezo ya Kozi: </span>
                        {selectedCourse.overview}
                      </div>

                      <div style={{ display: "grid", gap: 16 }}>
                        <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>💼 Career Opportunities (Kazi Baada ya Chuo)</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {selectedCourse.careers.map((car, idx) => (
                              <span key={idx} style={{ padding: "4px 10px", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#38bdf8", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                                {car}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>💰 Average Starting Salary (Wastani wa Mshahara)</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>
                            {selectedCourse.salary}
                          </div>
                        </div>

                        <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>⚙️ Skills Needed (Stadi Zinazohitajika)</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {selectedCourse.skills.map((st, idx) => (
                              <span key={idx} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#fff", borderRadius: 8, fontSize: 12 }}>
                                ✓ {st}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>🏛️ Top Tanzanian Universities Offering It (Vyuo)</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {selectedCourse.universities.map((uni, idx) => (
                              <span key={idx} style={{ padding: "4px 10px", background: "rgba(245, 166, 35, 0.12)", border: `1px solid ${G}30`, color: G2, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                                🏛️ {uni}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 3. UNIVERSITY DIRECTORY ── */}
              {activeTab === "universities" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>University Directory (Chaguzi za Chuo)</h3>
                      <p style={{ fontSize: 13, color: NEUTRAL, margin: "4px 0 0 0" }}>Orodha ya vyuo vikuu vya juu nchini, andalio la masomo, ada na maelekezo.</p>
                    </div>

                    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
                      <Search size={16} color={NEUTRAL} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input 
                        type="text" 
                        id="uni-search-input"
                        placeholder="Tafuta chuo sasa (e.g. UDSM)..." 
                        value={uniSearch}
                        onChange={(e) => setUniSearch(e.target.value)}
                        style={{ width: "100%", height: 42, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, outline: "none", color: "#wrap", padding: "0 16px 0 40px", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }} className="md:grid-cols-1">
                    {/* Left List panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto", paddingRight: 8 }}>
                      {filteredUniversities.map((u) => {
                        const isChosen = selectedUni.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            id={`uni-${u.id}`}
                            onClick={() => setSelectedUni(u)}
                            style={{
                              padding: "14px 16px",
                              borderRadius: 12,
                              border: isChosen ? `1px solid ${G}` : "1px solid transparent",
                              background: isChosen ? "rgba(245, 166, 35, 0.08)" : "rgba(255,255,255,0.02)",
                              color: isChosen ? G : "#fff",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 700,
                              transition: "0.2s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{u.name}</span>
                              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: NEUTRAL }}>{u.nickname}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Directory profile detail */}
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <h4 style={{ fontSize: 20, fontWeight: 900, color: G, margin: 0 }}>{selectedUni.name}</h4>
                          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: NEUTRAL, display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={13} /> {selectedUni.location}
                          </p>
                        </div>
                        <a 
                          href={selectedUni.website} 
                          target="_blank" 
                          rel="noreferrer" 
                          id={`uni-web-${selectedUni.id}`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: G2, textDecoration: "none", fontWeight: 700, background: "rgba(245, 166, 35, 0.06)", padding: "6px 12px", border: `1px solid ${G}25`, borderRadius: 8 }}
                        >
                          <ExternalLink size={13} /> Tovuti
                        </a>
                      </div>

                      <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />

                      <div style={{ display: "grid", gap: 18 }}>
                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>📚 Programu Kuu Zinazotolewa</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {selectedUni.programs.map((p, idx) => (
                              <span key={idx} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }}>
                                • {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>📉 Kiwango cha Ada (Tuitions/Fees)</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{selectedUni.fees}</div>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>📝 Vigezo vya Udahili (Entry Requirements)</span>
                          <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 10, borderLeft: `3px solid ${G}` }}>
                            {selectedUni.requirements}
                          </div>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>ℹ️ Mwongozo wa Maombi (Application Guide)</span>
                          <p style={{ fontSize: 13, color: NEUTRAL, lineHeight: 1.6, margin: 0 }}>
                            {selectedUni.guide}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. FORM 4 PATHFINDER ── */}
              {activeTab === "form4path" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 12 }}>
                    <Compass size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Jenga Safari Yako Baada ya O-Level</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>Form 4 Pathfinder 🚀</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
                    Chagua ufaulu wako wa Division pamoja na fani inayokuvutia, kisha mfumo utakupa mapendekezo thabiti ya combinations unazostahili kusoma A-Level, Diploma na cheti kwa ushiriano bora na vigezo vya nchi.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }} className="md:grid-cols-1">
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Ufaulu wako wa Division (Makadirio)</label>
                      <select 
                        value={f4Division} 
                        onChange={(e) => setF4Division(e.target.value)}
                        style={{ width: "100%", height: 48, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 14px" }}
                      >
                        <option>Division I</option>
                        <option>Division II</option>
                        <option>Division III</option>
                        <option>Division IV</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Fani / Maelekezo Unayopenda</label>
                      <select 
                        value={f4Interest} 
                        onChange={(e) => setF4Interest(e.target.value)}
                        style={{ width: "100%", height: 48, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 14px" }}
                      >
                        <option>Engineering/Tech</option>
                        <option>Health/Sciences</option>
                        <option>Commerce/Accounting</option>
                        <option>Social Sciences/Law</option>
                        <option>Agriculture/Environment</option>
                        <option>Education/Social Work</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="f4-pathfinder-btn"
                    onClick={handleF4Pathfinder}
                    style={{ width: "100%", height: 48, background: `linear-gradient(135deg, ${G}, ${G2})`, border: "none", color: "#111", borderRadius: 11, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, shadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  >
                    <Sparkles size={16} /> Angalia Mapendekezo Bora
                  </button>

                  {f4PathResult && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28, padding: 22, border: `1px solid rgba(245, 166, 35, 0.2)`, borderRadius: 16, background: "rgba(245, 166, 35, 0.03)" }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, color: G, margin: "0 0 18px 0", display: "flex", alignItems: "center", gap: 8 }}>
                        🎯 Mapendekezo kwa mwanafunzi wa O-Level ({f4PathResult.division}) mwenye ndoto za {f4PathResult.interest}:
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="md:grid-cols-1">
                        <div>
                          <strong style={{ fontSize: 13, color: G2, display: "block", marginBottom: 8 }}>📚 Combinations za A-Level (Advanced Level)</strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {f4PathResult.comb.map((cc, i) => (
                              <div key={i} style={{ padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12.5, border: `1px solid ${BORDER}` }}>
                                {cc}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <strong style={{ fontSize: 13, color: "#38bdf8", display: "block", marginBottom: 8 }}>💼 Stashahada (Diploma Options) & Cheti (Certificates)</strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: NEUTRAL }}>Diploma:</span>
                            {f4PathResult.dipl.map((dp, i) => (
                              <div key={i} style={{ padding: 8, background: "rgba(56, 189, 248, 0.05)", borderRadius: 8, fontSize: 12.5, color: "#93c5fd" }}>
                                {dp}
                              </div>
                            ))}
                            <span style={{ fontSize: 11, fontWeight: 700, color: NEUTRAL, marginTop: 4 }}>Certificates:</span>
                            {f4PathResult.cert.map((cr, i) => (
                              <div key={i} style={{ padding: 8, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12.5 }}>
                                {cr}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── 5. FORM 6 PATHFINDER ── */}
              {activeTab === "form6path" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 12 }}>
                    <Compass size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Jenga Safari Yako Baada ya High School</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>Form 6 Pathfinder 🎓</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
                    Ingiza combination yako ya masomo ya A-Level pamoja na makadirio ya jumla ya pointi za NECTA (ACSEE), na mfumo utakupa mapendekezo ya digrii unazokidhi, vyuo bora na mielekeo mizuri ya kazi nchini.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }} className="md:grid-cols-1">
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Combination Yako</label>
                      <select 
                        value={f6Combo} 
                        onChange={(e) => setF6Combo(e.target.value)}
                        style={{ width: "100%", height: 48, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 14px" }}
                      >
                        <option>PCM</option>
                        <option>PCB</option>
                        <option>CBG</option>
                        <option>EGM</option>
                        <option>HKL</option>
                        <option>HGL</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Jumla ya Pointi za NECTA (ACSEE)</label>
                      <input 
                        type="number" 
                        min={3} 
                        max={15} 
                        id="f6-points-input"
                        value={f6Points} 
                        onChange={(e) => setF6Points(Number(e.target.value))}
                        style={{ width: "100%", height: 48, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 14px" }}
                      />
                      <span style={{ fontSize: 11, color: NEUTRAL }}>Kiwango ni Pointi 3 hadi 15 (Mfumo wa TCU principal passes)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="f6-pathfinder-btn"
                    onClick={handleF6Pathfinder}
                    style={{ width: "100%", height: 48, background: `linear-gradient(135deg, ${G}, ${G2})`, border: "none", color: "#111", borderRadius: 11, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  >
                    <Trophy size={16} /> Tafuta Fursa Zinazokufaa
                  </button>

                  {f6PathResult && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28, padding: 22, border: `1px solid rgba(245, 166, 35, 0.2)`, borderRadius: 16, background: "rgba(245, 166, 35, 0.03)" }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, color: G, margin: "0 0 16px 0" }}>
                        ✅ Mapendekezo ya Chuo na Kazi kulingana na combination yako ({f6PathResult.combo}) na ufaulu wa {f6PathResult.points} points:
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="md:grid-cols-1">
                        <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${BORDER}` }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: G2, textTransform: "uppercase", marginBottom: 8 }}>🎓 Bachelor Courses Eligible (Kozi unazoingia)</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {f6PathResult.courses.map((crs, i) => (
                              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>• {crs}</div>
                            ))}
                          </div>
                        </div>

                        <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${BORDER}` }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 8 }}>🏛️ Vyuo Bora Vinavyokidhi</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {f6PathResult.unis.map((un, i) => (
                              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>• {un}</div>
                            ))}
                          </div>
                        </div>

                        <div style={{ padding: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: `1px solid ${BORDER}` }}>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>💼 Fursa za Kazi (Career Paths)</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {f6PathResult.careers.map((cr, i) => (
                              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>• {cr}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── 6. POINTS CALCULATOR & ESTIMATOR ── */}
              {activeTab === "points" && (
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px 0" }}>Form 6 Points Calculator & Admission Estimator</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13, marginBottom: 28 }}>
                    Mahesabu ni rahisi. Weka daraja za masomo yako ya principal (A, B, C, D, E, S, F) na mfumo utakupa jumla ya pointi kulingana na muundo wa TCU uweze kukadiria nafasi za kupata vyuo vya juu.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }} className="md:grid-cols-1">
                    
                    {/* Calculator Form */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, border: `1px solid ${BORDER}`, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: G2, borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 6 }}>
                        HESABU ZA TCU KWA ACSEE (PRINCIPAL GRADES):
                      </div>

                      {[
                        { key: "somo1", label: "Principal Subject 1 (E.g. Physics)" },
                        { key: "somo2", label: "Principal Subject 2 (E.g. Chemistry)" },
                        { key: "somo3", label: "Principal Subject 3 (E.g. Mathematics)" }
                      ].map((item) => (
                        <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                          <select
                            value={calcGrades[item.key]}
                            onChange={(e) => setCalcGrades({ ...calcGrades, [item.key]: e.target.value })}
                            style={{ height: 40, width: 80, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#fff", textAlign: "center" }}
                          >
                            {["A", "B", "C", "D", "E", "S", "F"].map(grade => (
                              <option key={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                      ))}

                      <div style={{ height: 1, background: BORDER, margin: "10px 0" }} />

                      <button
                        type="button"
                        id="calculate-pts-btn"
                        onClick={handleCalculateForm6Points}
                        style={{ height: 44, background: `linear-gradient(135deg, ${G}, ${G2})`, border: "none", color: "#111", borderRadius: 10, fontWeight: 900, cursor: "pointer", fontSize: 13 }}
                      >
                        🧮 Kokotoa Pointi & Admission Likelihood
                      </button>

                      {calcResult && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14, borderLeft: `3px solid ${G}`, paddingLeft: 14 }}>
                          <div style={{ fontSize: 13 }}>JUMLA: <strong style={{ fontSize: 20, color: G }}>{calcResult.total} Points</strong></div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: G2, marginTop: 4 }}>{calcResult.rank}</div>
                          <p style={{ fontSize: 12, color: NEUTRAL, margin: "6px 0 0 0", lineHeight: 1.5 }}>
                            {calcResult.message}
                          </p>
                          <div style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", padding: 6, borderRadius: 6, marginTop: 8, color: "#fff" }}>
                            <strong>Nafasi ya kujiunga UDSM/MUHAS:</strong> {calcResult.probabilityUDSM}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Eligibility checker */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, border: `1px solid ${BORDER}`, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#38bdf8", borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 6 }}>
                        COURSE ELIGIBILITY CHECKER (Kagua Kozi):
                      </div>

                      <label style={{ fontSize: 12, color: NEUTRAL }}>Chagua masomo ya kujiunga unayotaka kukiuka vigezo:</label>
                      <select 
                        value={eligibilityCheckCourse} 
                        onChange={(e) => { setEligibilityCheckCourse(e.target.value); setEligibilityStatus(null); }}
                        style={{ height: 42, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "#wrap", padding: "0 10px" }}
                      >
                        {COURSES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        id="check-eligibility-btn"
                        onClick={handleCheckEligibility}
                        style={{ height: 42, background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#38bdf8", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontSize: 13 }}
                      >
                        🔎 Angalia Kama Unakidhi Vigezo
                      </button>

                      {eligibilityStatus && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10, padding: 12, borderRadius: 8, background: eligibilityStatus.eligible ? "rgba(74, 222, 128, 0.08)" : "rgba(239, 68, 68, 0.08)", border: eligibilityStatus.eligible ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: eligibilityStatus.eligible ? "#4ade80" : "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                            {eligibilityStatus.eligible ? "✓ UNAKIDHI VIGEZO" : "✖ HUKIDHI VIGEZO"}
                          </div>
                          <p style={{ fontSize: 12, color: NEUTRAL, margin: "6px 0 0 0", lineHeight: 1.4 }}>
                            Kozi ya <strong>{eligibilityStatus.courseName}</strong> inapaswa kuwa na wastani wa pointi <strong>{eligibilityStatus.minNeeded}</strong> au zaidi kulingana na TCU. Pointi zako zilizokokotolewa ni {eligibilityStatus.score}.
                          </p>
                        </motion.div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* ── 7. CAREER HUB ── */}
              {activeTab === "careers" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Career Hub (Mfumo wa Kazi & Tasnia)</h3>
                      <p style={{ fontSize: 13, color: NEUTRAL, margin: "4px 0 0 0" }}>Jifunze wajibu, stadi kamili, kiwango cha mshahara na kukua kwa fani mbalimbali nchini.</p>
                    </div>

                    <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
                      <Search size={16} color={NEUTRAL} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input 
                        type="text" 
                        id="career-search-input"
                        placeholder="Tafuta fani/kazi (e.g. Architect)..." 
                        value={careerSearch}
                        onChange={(e) => setCareerSearch(e.target.value)}
                        style={{ width: "100%", height: 42, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, outline: "none", color: "#wrap", padding: "0 16px 0 40px", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }} className="md:grid-cols-1">
                    {/* Career List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto", paddingRight: 8 }}>
                      {filteredCareers.map((car) => {
                        const isChosen = selectedCareer.id === car.id;
                        return (
                          <button
                            key={car.id}
                            type="button"
                            id={`career-${car.id}`}
                            onClick={() => setSelectedCareer(car)}
                            style={{
                              padding: "14px 16px",
                              borderRadius: 12,
                              border: isChosen ? `1px solid ${G}` : "1px solid transparent",
                              background: isChosen ? "rgba(245, 166, 35, 0.08)" : "rgba(255,255,255,0.02)",
                              color: isChosen ? G : "#fff",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 700,
                              transition: "0.2s"
                            }}
                          >
                            {car.title}
                          </button>
                        );
                      })}
                    </div>

                    {/* Career Detail view */}
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, background: "rgba(255,255,255,0.01)" }}>
                      <h4 style={{ fontSize: 18, fontWeight: 900, color: G, margin: "0 0 16px 0" }}>{selectedCareer.title}</h4>

                      <div style={{ display: "grid", gap: 18 }}>
                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>💼 Majukumu na Wajibu Mkuu (Responsibilities)</span>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
                            {selectedCareer.responsibilities}
                          </p>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>🛠️ Uuzi na Stadi Muhimu (Skills Needed)</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {selectedCareer.skills.map((sk, i) => (
                              <span key={i} style={{ padding: "4px 10px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                                ✓ {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>🚀 Maendeleo na Kupanda fani (Career Growth)</span>
                          <p style={{ fontSize: 13, color: NEUTRAL, lineHeight: 1.6, margin: 0 }}>
                            {selectedCareer.growth}
                          </p>
                        </div>

                        <div>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 6 }}>💰 Kipato na Mshahara kwa mwezi (Salary Range)</span>
                          <div style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>
                            {selectedCareer.salary}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 8. HESLB CENTER ── */}
              {activeTab === "heslb" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 12 }}>
                    <CreditCard size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Bodi ya Mikopo ya Elimu ya Juu (HESLB)</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>HESLB Resource Center 💳</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 26 }}>
                    Ufadhili na Mikopo ya wanafunzi wa Vyuo Vikuu. Pata maelezo, vigezo kamili na jinsi ya kuomba mkopo kupitia mfumo wa OLAMS bila kikwazo chochote.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }} className="md:grid-cols-1">
                    {/* Left: Guide & Steps */}
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: G2, marginBottom: 12 }}>📌 Hatua 4 za Maombi ya Mkopo kupitia OLAMS:</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[
                          { step: "01", title: "Kujisajili OLAMS", text: "Fungua akaunti kwenye olas.heslb.go.tz ukitumia index number ya Form 4 ya NECTA. Jaza taarifa za mawasiliano." },
                          { step: "02", title: "Kazi na Nyaraka (Uploading)", text: "Pakia vyeti vilivyothibitishwa (Birth Certificate, Form 4 & 6 Results, NIDA Card, na picha yako)." },
                          { step: "03", title: "Mawasiliano na Mdhamini", text: "Jaza taarifa za wadhamini 2 ikiwa ni pamoja na namba ya simu zao thabiti kwa upimaji upatikanaji." },
                          { step: "04", title: "Kulipia na Kuwasilisha", text: "Lipa ada ya maombi (TSH 30,000) kupitia Control Number ya GePG, thibitisha fomu, kisha wasilisha mtandaoni." }
                        ].map((s) => (
                          <div key={s.step} style={{ display: "flex", gap: 14, padding: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                            <div style={{ width:32, height: 32, borderRadius: 8, background: `${G}18`, color: G, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 13 }}>{s.step}</div>
                            <div>
                              <strong style={{ display: "block", fontSize: 13.5, marginBottom: 2 }}>{s.title}</strong>
                              <p style={{ margin: 0, fontSize: 12.5, color: NEUTRAL, lineHeight: 1.5 }}>{s.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Requirements & FAQs */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div style={{ border: `1px solid ${BORDER}`, padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.01)" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 10 }}>📋 Nyaraka Zinazotakiwa (Required Docs)</span>
                        <div style={{ display: "grid", gap: 8 }}>
                          {[
                            "Nakala thabiti ya Cheti cha Kuzaliwa (kutoka RITA/ZCSRA)",
                            "Nakala ya Cheti cha Kuzaliwa cha Mzazi/Wazazi wote wawili",
                            "Cheti cha Form 4/Form 6 / Diploma",
                            "Kitambulisho cha NIDA cha kwako au cha mdhamini",
                            "Barua rasmi kutoka Ustawi wa Jamii ikiwa yatima au mlemavu",
                            "Saini ya kiongozi wa kijiji/mtaa"
                          ].map((docItem, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
                              <CheckCircle size={13} color="#10b981" /> <span>{docItem}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ border: `1px solid ${BORDER}`, padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.01)" }}>
                        <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, textTransform: "uppercase", marginBottom: 10 }}>⏳ Deadlines Muhimu (Est. 2026)</span>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                          <span>Ufunguzi wa OLAMS:</span>
                          <span style={{ fontWeight: 800, color: G }}>Julai 15, 2026</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "8px 0" }}>
                          <span>Mwisho wa Maombi:</span>
                          <span style={{ fontWeight: 800, color: "#ef4444" }}>Septemba 15, 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 9. TCU CENTER ── */}
              {activeTab === "tcu" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#38bdf8", marginBottom: 12 }}>
                    <FileText size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Tanzania Commission for Universities (TCU)</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>TCU Admission Portal 🏛️</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
                    TCU ndiyo asasi inayoratibu udahili mzima wa vyuo vikuu nchini Tanzania. Fuata miongozo yetu kuelewa jinsi ya kuchagua na kuzuia multiple admissions.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="md:grid-cols-1">
                    <div style={{ border: `1px solid ${BORDER}`, padding: 20, borderRadius: 16 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8", margin: "0 0 14px 0" }}>⚙️ Taratibu za Maombi (Process)</h4>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                        Maombi yako yanapaswa kupelekwa **moja kwa moja** moja kwenye tovuti rasmi ya Chuo unachotaka, siyo TCU. TCU inafanya kazi ya kuvuta algorithms, kuhakiki vyeti kutoka NECTA/NACTE, na kutoa orodha iliyothibitishwa ya multiple admissions.
                      </p>
                      <ul style={{ paddingLeft: 18, fontSize: 12.5, color: NEUTRAL, lineHeight: 1.6 }}>
                        <li>Andika Index Number za NECTA kwa usahihi wa hali ya juu.</li>
                        <li>Chagua kozi angalau tatu hadi tano kutegemeana na vipaumbele vyako.</li>
                        <li>Nenda tcu.go.tz kupakua kijitabu cha mwongozo cha TCU (Admission Guidebook) kila mwaka.</li>
                      </ul>
                    </div>

                    <div style={{ border: `1px solid ${BORDER}`, padding: 20, borderRadius: 16 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: G2, margin: "0 0 14px 0" }}>📊 Udahili Multi-selection (Multiple Admissions)</h4>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                        Ukichaguliwa kwenye Vyuo zaidi ya kimoja, TCU itatuma ujumbe (SMS/Email) kuonyesha status yako. Lazima uthibitishe chuo kimoja tu ukitumia namba maalum ya siri (Confirmation Code).
                      </p>
                      <div style={{ padding: 12, borderRadius: 8, background: "rgba(56, 189, 248, 0.05)", fontSize: 12, color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                        <strong>Angalizo la TCU:</strong> Kukosa kuthibitisha (confirm) chuo kwa wakati thabiti kunaweza kufanya umiliki wako wa nafasi ufutwe kabisa.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 10. STUDY ABROAD CENTER ── */}
              {activeTab === "abroad" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#ef4444", marginBottom: 12 }}>
                    <Globe size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Study Abroad (Kusoma Nje ya Nchi)</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>Study Abroad Hub ✈️</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
                    Chunguza mataifa yanayoshiriki mafunzo na kutoa scholarship bora zaidi kwa wanafunzi wa Kitanzania.
                  </p>

                  <div style={{ display: "grid", gap: 20 }}>
                    {STUDY_ABROAD.map((s) => (
                      <div key={s.id} style={{ padding: 20, border: `1px solid ${BORDER}`, borderRadius: 16, background: "rgba(255,255,255,0.01)" }}>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: G, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                          🌍 {s.country}
                        </h4>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }} className="md:grid-cols-1">
                          <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 10 }}>
                            <strong style={{ fontSize: 12, color: G2, display: "block", marginBottom: 4 }}>🎓 Scholarships na Udhamini Kuu:</strong>
                            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: 0 }}>{s.scholarships}</p>
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 10 }}>
                            <strong style={{ fontSize: 12, color: "#38bdf8", display: "block", marginBottom: 4 }}>📋 Entry Requirements:</strong>
                            <p style={{ fontSize: 12.5, color: NEUTRAL, lineHeight: 1.5, margin: 0 }}>{s.requirements}</p>
                          </div>
                        </div>

                        <div style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                          <strong style={{ fontSize: 12, display: "block", marginBottom: 4, color: "#fff" }}>🛠️ Application Steps (Mchakato wa Maombi):</strong>
                          <p style={{ fontSize: 12.5, color: NEUTRAL, lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>{s.process}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 11. SCHOLARSHIP MATCHER ── */}
              {activeTab === "matcher" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G2, marginBottom: 12 }}>
                    <Sparkles size={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Tafuta Scholarship & Udhamini kwa sekunde</span>
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 16px 0" }}>Scholarship Matcher ✨</h3>
                  <p style={{ color: NEUTRAL, fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
                    Ingiza kiwango chako cha masomo, nchi unayopendelea kusoma, pamoja na fani yako uone fursa za ufadhili wa masomo (scholarships) zinazoendana nawe.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }} className="md:grid-cols-1">
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Kiwango cha Masomo (Level)</label>
                      <select 
                        value={matchLevel} 
                        onChange={(e) => setMatchLevel(e.target.value)}
                        style={{ width: "100%", height: 44, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 10px" }}
                      >
                        <option>Undergraduate</option>
                        <option>Graduate (Masters/PhD)</option>
                        <option>Diploma</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Nchi Unayopendelea (Country)</label>
                      <select 
                        value={matchCountry} 
                        onChange={(e) => setMatchCountry(e.target.value)}
                        style={{ width: "100%", height: 44, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 10px" }}
                      >
                        <option>Turkey</option>
                        <option>China</option>
                        <option>UK</option>
                        <option>USA</option>
                        <option>Canada</option>
                        <option>Local Tanzania</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: NEUTRAL, marginBottom: 8, textTransform: "uppercase" }}>Fani ya Masomo (Course Interest)</label>
                      <select 
                        value={matchCourse} 
                        onChange={(e) => setMatchCourse(e.target.value)}
                        style={{ width: "100%", height: 44, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#fff", border: `1px solid ${BORDER}`, padding: "0 10px" }}
                      >
                        <option>Engineering/Tech</option>
                        <option>Medicine/Health</option>
                        <option>Business/Law</option>
                        <option>Any Courses</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="find-scholarships-btn"
                    onClick={handleMatchScholarships}
                    style={{ width: "100%", height: 44, background: `linear-gradient(135deg, ${G}, ${G2})`, border: "none", color: "#111", borderRadius: 9, fontWeight: 900, cursor: "pointer" }}
                  >
                    🚀 Match Hati & Makala za Scholarships
                  </button>

                  <div style={{ marginTop: 24 }}>
                    {matchedList.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {matchedList.map((sc) => (
                          <div key={sc.id} style={{ border: `1px solid ${BORDER}`, padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <strong style={{ fontSize: 14.5, color: G }}>{sc.name}</strong>
                              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 4, color: NEUTRAL }}>{sc.country}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                              <span style={{ color: NEUTRAL }}>Yaliyomo/Benefit: </span>
                              <strong>{sc.benefit}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: NEUTRAL }}>
                              <span>Kiwango: <strong>{sc.level}</strong></span>
                              <span>Mwezi Maombi hufunguliwa: <strong>{sc.applyMonth}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textSelf: "center", height: 100, display: "grid", placeItems: "center", border: `1px dashed ${BORDER}`, borderRadius: 12, color: NEUTRAL, fontSize: 13 }}>
                        Bofya kitufe hapo juu kuona mashindano au scholarship zinazoendana.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 12. STEA AI ASSISTANT (COMING SOON) ── */}
              {activeTab === "ai" && (
                <div style={{ textAlign: "center", padding: "40px calc(10px + 2vw)" }}>
                  <div style={{ background: `linear-gradient(135deg, ${G}20, ${G2}10)`, width: 80, height: 80, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 24px" }}>
                    <Bot size={40} color={G} />
                  </div>

                  <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>🚀 Coming Soon</h3>
                  <p style={{ fontSize: 15, color: NEUTRAL, maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
                    AI-powered academic guidance is currently under development. Soon, you will be able to converse in English and Swahili with step-by-step counselor support.
                  </p>
                  
                  <div style={{ display: "inline-block", background: "rgba(245, 166, 35, 0.08)", border: `1px solid ${G}35`, color: G, fontSize: 12, fontWeight: 800, padding: "8px 18px", borderRadius: 999 }}>
                    Coming in Phase 5 • Endelea kufungua na NECTA
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </section>

      </main>

      {/* ── FOOTER FOOTPRINT ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "24px", textAlign: "center", marginTop: "auto" }}>
        <p style={{ margin: 0, fontSize: 12, color: NEUTRAL }}>
          &copy; 2026 STEA Education. Panga maisha yako ya chuo kwa kigezo rasmi na usaidizi bora wa kitaaluma.
        </p>
      </footer>
    </div>
  );
}
