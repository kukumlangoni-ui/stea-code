import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, FileText, BookOpen, Zap, GraduationCap, CreditCard, CheckCircle,
  Globe, Bell, Bot, ChevronRight, ArrowRight, Search, X, Users, Share2, Shield, Sparkles,
  AlertTriangle, Home
} from 'lucide-react';
import AdSlot from '../components/AdSlot.jsx';
import SponsoredCard from '../components/SponsoredCard.jsx';
import SEOHead from '../components/SEOHead.jsx';
import { AnimatedBackground } from '../components/AnimatedBackground.jsx';
import { BlurText } from '../components/BlurText.jsx';
import { getFirebaseDb } from '../firebase.js';
import { collection, getCountFromServer } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth.js';
import ReportModal from '../components/ReportModal.jsx';
import DailyDestinationHub from '../components/DailyDestinationHub.jsx';
import { SteaEcosystemBanner, SteaExploreMore } from '../components/SteaEcosystem.jsx';

// Reusable STEA Main Page Banner
function SteaMainBanner() {
  const [hov, setHov] = useState(false);
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: 28 }}>
      <motion.div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        whileHover={{ scale: 1.01 }}
        style={{
          background: hov ? 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.06))' : 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.5))',
          border: `1px solid ${hov ? 'rgba(245,166,35,0.5)' : 'rgba(245,166,35,0.2)'}`,
          borderRadius: 20,
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: hov ? '0 8px 32px rgba(245,166,35,0.15)' : '0 4px 20px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(245,166,35,0.2)' }}>
            <Home size={20} color="#F5A623" />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>STEA AFRICA</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Visit STEA Main Page</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Duka · TechHub · Services · Gigs & more</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F5A623', fontWeight: 800, fontSize: 12, background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)', padding: '8px 14px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Explore <ArrowRight size={13} style={{ transform: hov ? 'translateX(4px)' : '', transition: 'transform 0.2s' }} />
        </div>
      </motion.div>
    </Link>
  );
}

const G = '#F5A623';
const G2 = '#FFD17C';

const ROTATING_TEXTS = [
  "Pata Notes za Kusoma",
  "Fanya Quiz za Kujipima",
  "Fuata Matokeo ya NECTA",
  "Pata Scholarship Alerts",
  "Jiandae kwa Chuo",
  "Jifunze kwa Ufanisi Zaidi"
];

const SEARCH_EXAMPLES = [
  "NECTA",
  "Past Papers",
  "Scholarships",
  "Study Notes",
  "HESLB",
  "TCU",
  "Classroom"
];

export default function ExamsHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQ, setSearchQ] = useState('');
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [classesCount, setClassesCount] = useState(1280);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchSectionRef = useRef(null);
  const sectionsGridRef = useRef(null);

  // Auto rotate text
  useEffect(() => {
    const timer = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch classes count from firebase
  useEffect(() => {
    const db = getFirebaseDb();
    if (db) {
      getCountFromServer(collection(db, "classes"))
        .then((snap) => {
          const liveClasses = snap.data().count;
          if (liveClasses > 0) {
            setClassesCount(1200 + liveClasses);
          }
        })
        .catch((err) => {
          console.warn("Could not load dynamic classes count, using default:", err);
        });
    }
  }, []);

  const SECTIONS = [
    {
      id: 'classroom',
      path: 'https://classroom.stea.africa',
      icon: <CheckCircle size={28} />,
      color: G,
      title: 'STEA Classroom',
      desc: 'Mfumo wa mahudhurio kwa shule, vyuo na walimu. Tengeneza darasa, shiriki QR au link, wanafunzi wa-scan na mahudhurio yahifadhiwe papo hapo.',
      badge: 'Smart Campus',
      subItems: ['QR Attendance', 'GPS Verification', 'Teacher Dashboard'],
    },
    {
      id: 'necta-results',
      path: '/results',
      icon: <BarChart2 size={28} />,
      color: '#4ade80',
      title: 'NECTA Results',
      desc: 'Tafuta matokeo ya Form 2, Form 4 na Form 6. Chuja kwa shule, mwaka na aina ya mtihani.',
      badge: 'Official',
      subItems: ['Form 2 Results', 'Form 4 Results', 'Form 6 Results', 'Filter by School / Year'],
    },
    {
      id: 'past-papers',
      path: '/past-papers',
      icon: <FileText size={28} />,
      color: '#60a5fa',
      title: 'Past Papers',
      desc: 'Karatasi za mitihani ya miaka iliyopita, marking schemes na maswali ya kujisomea.',
      badge: 'Exam Prep',
      subItems: ['Papers by Class', 'Papers by Subject', 'Marking Schemes', 'Filter by Year'],
    },
    {
      id: 'study-notes',
      path: '/notes',
      icon: <BookOpen size={28} />,
      color: '#facc15',
      title: 'Study Notes',
      desc: 'Notes za masomo yote, muhtasari wa mada na maelezo ya kina kwa ajili ya revision.',
      badge: 'Study',
      subItems: ['Notes by Subject', 'Notes by Class', 'Revision Notes', 'Topic Summaries'],
    },
    {
      id: 'practice',
      path: '/exams/practice',
      icon: <Zap size={28} />,
      color: '#f472b6',
      title: 'Practice & Quizzes',
      desc: 'Quiz library, quiz ya leo, challenge ya wiki, leaderboard na historia ya majaribio yako.',
      badge: 'Interactive',
      subItems: ['Quiz Library', 'Today\'s Quiz', 'Weekly Challenge', 'Leaderboard'],
    },
    {
      id: 'university-guide',
      path: '/university-guide',
      icon: <GraduationCap size={28} />,
      color: '#a855f7',
      title: 'University Guide TZ',
      desc: 'Mwongozo kamili wa chuo Tanzania — calculator ya pointi, kuchagua kozi, namna ya kuomba na maisha chuoni.',
      badge: 'Local Uni',
      subItems: ['Form 6 Points Calculator', 'Find Best Courses', 'University Info Hub', 'How to Apply', 'Admission Requirements', 'Diploma to Degree'],
    },
    {
      id: 'scholarships-tz',
      path: '/scholarships',
      icon: <CreditCard size={28} />,
      color: '#10b981',
      title: 'Scholarships Tanzania',
      desc: 'HESLB, TCU scholarships na ufadhili wa ndani Tanzania. Hati zinazohitajika na tarehe za maombi.',
      badge: 'Funding TZ',
      subItems: ['HESLB Guide', 'TCU Scholarships', 'Local/Private Scholarships', 'Required Documents', 'Deadlines & Eligibility'],
    },
    {
      id: 'study-abroad',
      path: '/exams/abroad',
      icon: <Globe size={28} />,
      color: '#38bdf8',
      title: 'Study Abroad',
      desc: 'Scholarship za kimataifa, masharti ya kuomba, mataifa maarufu, IELTS/TOEFL na wawakilishi wa kuaminika.',
      badge: 'Global',
      subItems: ['Global Scholarships', 'Government Scholarships', 'Requirements', 'Application Steps', 'Countries Guide', 'IELTS / TOEFL / Passport Basics'],
    },
    {
      id: 'student-updates',
      path: '/exams/updates',
      icon: <Bell size={28} />,
      color: '#fb923c',
      title: 'Student Updates',
      desc: 'Habari za HESLB, TCU, maombi ya chuo, tarehe za mwisho na matangazo muhimu ya wanafunzi.',
      badge: 'News',
      subItems: ['HESLB Updates', 'TCU Updates', 'Admission Updates', 'Deadlines', 'Important Student Notices'],
    },
    {
      id: 'student-hub',
      path: '/student-hub',
      icon: <Users size={28} />,
      color: '#fb7185',
      title: 'STEA Student Hub 🇹🇿',
      desc: 'Kuwa mwanachama wa meza yetu ya majadiliano ya kitaaluma. Tazama profile yako, pata Beji adimu, unda na kabiliana na changamoto, alika marafiki na kuomba kuwa Balozi wa Shule!',
      badge: 'COMMUNITY',
      subItems: ['Student Profiles', 'Discussion Forums', 'Subject Communities', 'Referral Hub', 'Campus Ambassadors'],
    },
    {
      id: 'stea-assistant',
      path: null,
      comingSoon: true,
      icon: <Bot size={28} />,
      color: G,
      title: 'STEA AI Assistant',
      desc: 'Uliza AI yoyote swali kuhusu elimu, kozi, vyuo au scholarship. Msaada wa haraka na mwongozo stadi.',
      badge: '🚀 Coming Soon',
      subItems: ['Ask AI', 'Suggested Student Questions', 'Smart Guidance to Other Sections'],
    },
  ];

  const QUICK_PATHS = [
    { label: 'Nataka Majadiliano 💬', path: '/student-hub', color: '#fb7185' },
    { label: 'Nataka Matokeo', path: '/results', color: '#4ade80' },
    { label: 'Nataka Notes', path: '/notes', color: '#facc15' },
    { label: 'Nataka Past Papers', path: '/past-papers', color: '#60a5fa' },
    { label: 'Nataka Scholarship', path: '/scholarships', color: '#10b981' },
    { label: 'Nataka Chuo', path: '/university-guide', color: '#a855f7' },
    { label: 'Nataka Quiz', path: '/exams/practice', color: '#f472b6' },
    { label: 'Nataka Classroom', path: 'https://classroom.stea.africa', color: G },
    { label: 'Nahitaji Msaada', path: '/exams/updates', color: '#fb923c' }
  ];

  // Filter sections based on search
  const filteredSections = searchQ.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.subItems.some(sub => sub.toLowerCase().includes(searchQ.toLowerCase()))
      )
    : SECTIONS;

  // Filter ONLY non-Coming Soon elements for auto-completed live suggestions list
  const liveSuggestions = searchQ.trim()
    ? SECTIONS.filter(s =>
        !s.comingSoon && (
          s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchQ.toLowerCase())
        )
      ).slice(0, 5)
    : [];

  const handleScrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollToGrid = () => {
    sectionsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExampleClick = (val) => {
    setSearchQ(val);
    setShowSuggestions(true);
    handleScrollToGrid();
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#050508', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>
      <AnimatedBackground />
      <SteaEcosystemBanner page="education" />
      <SEOHead 
        title="STEA Education — Tanzania's Ultimate Student Platform"
        description="Jifunze, jipime na ufanikiwe na STEA Education. Pata matokeo ya NECTA, past papers, notes za shule, scholarship za ndani na nje, na mwongozo wa TCU/HESLB Tanzania."
        keywords={["STEA Education", "STEA Shule", "NECTA results 2026", "mitihani ya shule sekondari", "past papers Tanzania", "marking schemes", "notes Tanzania", "HESLB guide"]}
      />

      <div style={{ position: 'relative', zIndex: 11 }}>
        {/* ── HERO SECTION ────────────────────────── */}
        <section style={{
          padding: 'clamp(80px, 12vw, 150px) 20px 60px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="badge-shine glass" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: 999,
                background: 'rgba(245, 166, 35, 0.08)',
                border: `1px solid ${G}44`,
                color: G,
                fontSize: 11,
                fontWeight: 900,
                marginBottom: 24,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                boxShadow: `0 0 15px ${G}15`
              }}
            >
              <GraduationCap size={15} /> 🎓 STEA EDUCATION
            </motion.div>

            {/* Main Headline */}
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(36px, 8vw, 68px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-.04em',
              marginBottom: 16,
            }}>
              <BlurText text="Jifunze. Jipime." />
              <BlurText className="gold-glow" style={{ color: G }} text=" Fanikiwa." delay={0.6} />
            </h1>

            {/* Animated Rotating Subtext */}
            <div style={{ 
              height: 42, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 24,
              overflow: 'hidden'
            }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={rotatingIndex}
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -25, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    fontSize: 'clamp(18px, 3.2vw, 24px)',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Sparkles size={20} color={G} style={{ flexShrink: 0 }} />
                  <span>{ROTATING_TEXTS[rotatingIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Static Subtitle */}
            <p style={{
              fontSize: 'clamp(15px, 2.2vw, 19px)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              maxWidth: 600,
              margin: '0 auto 40px',
            }}>
              Kila kitu mwanafunzi wa Tanzania anachohitaji sehemu moja.
            </p>

            {/* CTAs */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 40
            }}>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleScrollToSearch}
                style={{
                  background: `linear-gradient(135deg, ${G}, ${G2})`,
                  color: '#050508',
                  padding: '15px 36px',
                  borderRadius: 16,
                  fontWeight: 900,
                  fontSize: 16,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${G}35`,
                  transition: 'box-shadow 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Anza Kujifunza <ArrowRight size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleScrollToGrid}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '15px 36px',
                  borderRadius: 16,
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Chunguza Sehemu
              </motion.button>
            </div>

            {/* Visit STEA Main Page Banner — replaced by global banner */}
          </div>
        </section>

        {/* ── SEARCH SECTION ──────────────────────── */}
        <section 
          ref={searchSectionRef}
          style={{
            padding: '40px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'linear-gradient(180deg, transparent 0%, rgba(245,166,35,0.01) 100%)',
            position: 'relative'
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <h2 style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16
            }}>
              TAFUTA MWONGOZO AU NYARAKA
            </h2>

            {/* Input wrap */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '6px 6px 6px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 12
              }}>
                <Search size={20} color={G} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Tafuta notes, necta, past papers, scholarships..."
                  value={searchQ}
                  onChange={(e) => {
                    setSearchQ(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    outline: 'none',
                    padding: '12px 0',
                  }}
                />
                {searchQ && (
                  <button 
                    onClick={() => {
                      setSearchQ('');
                      setShowSuggestions(false);
                    }} 
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      borderRadius: 12,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && searchQ.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      background: '#0d0e12',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 16,
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      zIndex: 99,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                      Live Suggestions
                    </div>
                    {liveSuggestions.length > 0 ? (
                      liveSuggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.path) {
                              if (item.path.startsWith('http')) window.location.href = item.path;
                              else navigate(item.path);
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ color: item.color }}>{item.icon}</span>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{item.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.badge}</div>
                            </div>
                          </div>
                          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', textHeads: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12.5 }}>
                        Type more to load quick categories...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick click search targets */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', marginRight: 4 }}>Examples:</span>
              {SEARCH_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExampleClick(ex)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: 999,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(245,166,35,0.08)';
                    e.currentTarget.style.borderColor = `${G}80`;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>

        <AdSlot id="exams-after-hero" />

        <DailyDestinationHub user={user} />

        {/* ── FEATURED SECTIONS ───────────────────── */}
        <section ref={sectionsGridRef} style={{ padding: '60px 0 20px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
            
            {/* Heading block */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: G }}>
                  {searchQ ? `Imepatikana ya "${searchQ}"` : `Chaguzi Rasmi`}
                </span>
                <h3 style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: 900,
                  letterSpacing: '-.03em',
                  margin: '4px 0 0 0',
                }}>
                  {searchQ ? 'Matokeo ya Utafutaji' : <>Chagua <span style={{ color: G }}>Sehemu Yako</span></>}
                </h3>
              </div>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.03)',
                padding: '6px 12px',
                borderRadius: 999
              }}>
                {filteredSections.length} Sections
              </span>
            </div>

            {/* Grid Layout conforming to mobile standards: 1-col on mobile, 2-col on desktop/tablet */}
            <div className="stea-grid-container" style={{
              display: 'grid',
              gap: 24,
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 11fr))',
              marginBottom: 60
            }}>
              {filteredSections.length > 0 ? (
                filteredSections.map((section, idx) => {
                  const isComingSoon = section.comingSoon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.5 }}
                      whileHover={isComingSoon ? {} : { y: -4 }}
                      onClick={() => {
                        if (!isComingSoon && section.path) {
                          if (section.path.startsWith('http')) window.location.href = section.path;
                          else navigate(section.path);
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(10px)',
                        border: isComingSoon ? '1px dashed rgba(255,255,255,0.08)' : `1px solid rgba(255,255,255,0.06)`,
                        borderRadius: 20,
                        padding: '24px',
                        cursor: isComingSoon ? 'default' : 'pointer',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: 'border-color 0.22s, box-shadow 0.22s, background 0.22s',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (!isComingSoon) {
                          e.currentTarget.style.borderColor = `${section.color}50`;
                          e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                          e.currentTarget.style.boxShadow = `0 15px 35px ${section.color}15`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isComingSoon) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                        }
                      }}
                    >
                      {/* Section Badge */}
                      <span style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'inline-block',
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: isComingSoon ? 'rgba(255,255,255,0.05)' : `${section.color}15`,
                        color: isComingSoon ? 'rgba(255,255,255,0.4)' : section.color,
                        border: isComingSoon ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${section.color}35`
                      }}>
                        {section.badge}
                      </span>

                      {/* Icon */}
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `${section.color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: section.color,
                        marginBottom: 16,
                        border: `1px solid ${section.color}25`
                      }}>
                        {section.icon}
                      </div>

                      {/* Header */}
                      <h4 style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#fff',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {section.title}
                      </h4>

                      {/* Description */}
                      <p style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: 18,
                        minHeight: 40
                      }}>
                        {section.desc}
                      </p>

                      {/* Sub chips */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 20
                      }}>
                        {section.subItems.map((chip, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.5)',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      {/* CTA Trigger */}
                      {isComingSoon ? (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          Maendeleo yanaendelea...
                        </div>
                      ) : (
                        <div 
                          style={{
                            color: section.color,
                            fontSize: 12,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          Fungua Sasa <ChevronRight size={13} />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 24,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Hakuna matokeo</h4>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Hakuna kadi inayolingana na ulichotafuta.</p>
                  <button 
                    onClick={() => setSearchQ('')} 
                    style={{
                      background: G,
                      color: '#000',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Angalia Zote
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── QUICK PATH SECTION ──────────────────── */}
        <section style={{
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: G, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                NJIA YA MKATO
              </span>
              <h3 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 26,
                fontWeight: 900,
                color: '#fff',
                marginTop: 4
              }}>
                Unatafuta nini leo?
              </h3>
            </div>

            {/* Quick target rows resembling a grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 12
            }}>
              {QUICK_PATHS.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (item.path.startsWith('http')) window.location.href = item.path;
                    else navigate(item.path);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${item.color}08`;
                    e.currentTarget.style.borderColor = `${item.color}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>{item.label}</span>
                  <ArrowRight size={14} style={{ color: item.color }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST SECTION ───────────────────────── */}
        <section style={{
          padding: '60px 20px',
          position: 'relative'
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: G, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              STEA STATISTICS
            </span>
            <h3 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 26,
              fontWeight: 900,
              color: '#fff',
              marginTop: 4,
              marginBottom: 36
            }}>
              Inavyoaminika Kote Tanzania
            </h3>

            {/* Grid stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 20
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Users size={24} style={{ color: G, marginBottom: 8 }} />
                <span className="gold-glow" style={{ fontSize: 24, fontWeight: 900, color: G }}>75,000+</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Watumiaji STEA</span>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Share2 size={24} style={{ color: '#4ade80', marginBottom: 8 }} />
                <span style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>{classesCount.toLocaleString()}+</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Madarasa STEA</span>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <BookOpen size={24} style={{ color: '#60a5fa', marginBottom: 8 }} />
                <span style={{ fontSize: 24, fontWeight: 900, color: '#60a5fa' }}>15,000+</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Nukuu za Kusoma</span>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Shield size={24} style={{ color: '#a855f7', marginBottom: 8 }} />
                <span style={{ fontSize: 24, fontWeight: 900, color: '#a855f7' }}>500+</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Past Papers TZ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsored Ads Segment */}
        <SponsoredCard />
      </div>

      {/* Explore More STEA */}
      <SteaExploreMore exclude="education" />
    </div>
  );
}

// Re-export ResourceCard with absolute visual fidelity and dynamic click counters for PastPapers & Notes pages
export function ResourceCard({ item }) {
  const [downloading, setDownloading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { user } = useAuth();

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!item?.downloadUrl) return;
    
    setDownloading(true);
    // Track click event asynchronously
    try {
      const db = getFirebaseDb();
      if (db && item?.id) {
        const { doc: fsDoc, updateDoc, increment, addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const docRef = fsDoc(db, 'study_resources', item.id);
        await updateDoc(docRef, { clicks: increment(1), downloads: increment(1) });

        // Log Dynamic Download Event for Admin Analytics
        await addDoc(collection(db, 'analytics_events'), {
          type: 'download',
          itemId: item.id,
          itemTitle: item.title || 'Untitled',
          itemType: item.type || 'study_resource',
          userEmail: user?.email || 'Anonymous Guest',
          userId: user?.uid || 'guest',
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn("Click tracking failed:", err);
    }

    // Open target url in a secure new tab
    window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  const isPaper = item?.type === 'past_paper';

  return (
    <>
      <motion.div
        whileHover={{ y: -4, borderColor: 'rgba(245, 166, 35, 0.3)', boxShadow: '0 12px 30px rgba(245, 166, 35, 0.08)' }}
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.22s ease-in-out',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div>
          {/* Header Tags & Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 900,
              padding: '3px 8px',
              borderRadius: 999,
              background: isPaper ? 'rgba(96, 165, 250, 0.12)' : 'rgba(250, 204, 21, 0.12)',
              color: isPaper ? '#60a5fa' : '#facc15',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {isPaper ? 'Past Paper' : 'Study Note'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item?.year && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  {item.year}
                </span>
              )}
              {/* Report Abuse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReportOpen(true);
                }}
                title="Ripoti makosa au faili mbaya"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
              >
                <AlertTriangle size={13} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4 style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.4,
            marginBottom: 12,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: 42
          }}>
            {item?.isPremium && <span style={{ color: '#F5A623', marginRight: 6 }}>★ PREMIUM</span>}
            {item?.title || 'Resource Document'}
          </h4>

          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {item?.subject && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.6)'
              }}>
                📚 {item.subject}
              </span>
            )}
            {item?.class && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.6)'
              }}>
                School Level: {item.class}
              </span>
            )}
          </div>
        </div>

        {/* Footer view stats & CTA download trigger */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 14,
          marginTop: 4
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            👁️ {item?.clicks || 0} clicks
          </span>

          {item?.downloadUrl ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: downloading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${G}, ${G2})`,
                color: downloading ? 'rgba(255,255,255,0.6)' : '#050508',
                padding: '6px 14px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 12,
                border: 'none',
                cursor: downloading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'opacity 0.2s'
              }}
            >
              {downloading ? 'Inapakua...' : 'Pakua PDF'}
            </button>
          ) : (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>No Link</span>
          )}
        </div>
      </motion.div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        item={item}
        user={user}
      />
    </>
  );
}
