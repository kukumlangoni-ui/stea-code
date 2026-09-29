import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FileText, Award, HelpCircle, Star, MessageSquare, Plus, Bell,
  CheckCircle, Flame, User, Users, Compass, Search, Trophy, Bookmark,
  ArrowRight, UploadCloud, Heart, ThumbsUp, Send, AlertTriangle, Share2,
  DollarSign, Clock, Settings, Zap, GraduationCap, RefreshCw, X, ChevronRight, Check
} from 'lucide-react';
import { getFirebaseDb, getFirebaseAuth } from '../firebase.js';
import { collection, query, orderBy, limit, getDocs, addDoc, updateDoc, doc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';

const G = '#F5A623';
const G2 = '#FFD17C';

let helperCounter = 10000;
function getNextUniqueId() {
  helperCounter += 1;
  return helperCounter;
}

export default function DailyDestinationHub({ user }) {
  const [activeTab, setActiveTab] = useState('hub'); // hub, trending, university, leaderboard, community, admin

  // --- Core States ---
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New Physics Form 4 Note uploaded by Teacher Masika", type: "note", time: "2m ago", unread: true },
    { id: 2, text: "Form 4 NECTA Mathematics Quiz is now LIVE!", type: "quiz", time: "15m ago", unread: true },
    { id: 3, text: "ALERT: HESLB Second Round application deadline is in 3 days!", type: "alert", time: "1h ago", unread: true },
    { id: 4, text: "Scholarship alert: TANESCO Scholarship is now accepting requirements for STEM.", type: "scholarship", time: "3h ago", unread: false },
    { id: 5, text: "System update: New university career pathway mapping released", type: "update", time: "1d ago", unread: false }
  ]);
  const [showBellNotificationPanel, setShowBellNotificationPanel] = useState(false);

  // --- Real / Mock Live Data ---
  const [studyResources, setStudyResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // --- Bookmarks & Saves ---
  const [bookmarkedList, setBookmarkedList] = useState(() => {
    const saved = localStorage.getItem('stea_bookmarked_resources');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Feed Custom Tracking ---
  const [followedScholarships, setFollowedScholarships] = useState(() => {
    const saved = localStorage.getItem('stea_followed_scholarships');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Feedback list ---
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, author: "Salim Omar", rating: 5, comment: "Notes za Physics zimenisaidia sana kuelewa topics ngumu!", itemTitle: "Physics Form 4 Notes", timestamp: "Today" },
    { id: 2, author: "Neema Masawe", rating: 4, comment: "Nashukuru sana kwa past papers za miaka yote.", itemTitle: "CSEE Chemistry 2023", timestamp: "Yesterday" }
  ]);
  const [newFeedbackComment, setNewFeedbackComment] = useState("");
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackResourceTitle, setNewFeedbackResourceTitle] = useState("Physics Form 4 Notes");
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState("");

  // --- Referral and Rewards tracking ---
  const [referralCount, setReferralCount] = useState(() => {
    return Number(localStorage.getItem('stea_referral_count') || "0");
  });
  const referralCode = user ? `STEA-REF-${user.uid.slice(0, 5).toUpperCase()}` : "STEA-REF-GUEST";

  // --- User Points and Reputation Badges ---
  const [userPoints, setUserPoints] = useState(() => {
    return Number(localStorage.getItem('stea_user_points') || "75");
  });

  // --- Alerts Simulation logs ---
  const [scholarshipAlertLog, setScholarshipAlertLog] = useState([]);

  // --- University Matcher ---
  const [combInput, setCombInput] = useState("PCM");
  const [pointsInput, setPointsInput] = useState("7");
  const [interestInput, setInterestInput] = useState("IT / Computer Systems");
  const [matchedResults, setMatchedResults] = useState(null);

  // --- Toast/Banners notification alerts ---
  const [alertBanner, setAlertBanner] = useState(null);

  // Load Resources from firestore to populate real data
  const fetchLiveResources = async () => {
    setLoadingResources(true);
    try {
      const db = getFirebaseDb();
      if (db) {
        const qRef = query(collection(db, 'study_resources'), orderBy('createdAt', 'desc'), limit(15));
        const snap = await getDocs(qRef);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          setStudyResources(list);
          setLoadingResources(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load dynamic firestore resources inside feed. Using default sample data.", e);
    }

    // Default high-fidelity sample study resources (Notes/Past Papers/Scholarships)
    const defaults = [
      { id: "note_1", title: "Physics Form 4 — Core Mechanics Study Summary", type: "note", class: "Form 4", subject: "Physics", clicks: 1240, downloads: 420, year: "2025", author: "Teacher Masika", isPremium: false, rating: 5, saves: 42 },
      { id: "note_2", title: "Chemistry Form 2 — Chemical Equations Revision Guide", type: "note", class: "Form 2", subject: "Chemistry", clicks: 810, downloads: 153, year: "2024", author: "Teacher Mwajuma", isPremium: false, rating: 4.8, saves: 19 },
      { id: "paper_1", title: "Mathematics ACSEE Form 6 National Past Paper 2024", type: "past_paper", class: "Form 6", subject: "Advanced Math", clicks: 2310, downloads: 840, year: "2024", author: "NECTA", isPremium: false, rating: 4.9, saves: 110 },
      { id: "paper_2", title: "Biology CSEE Form 4 National Exam 2023 with Marking Scheme", type: "past_paper", class: "Form 4", subject: "Biology", clicks: 1450, downloads: 512, year: "2023", author: "NECTA", isPremium: true, rating: 4.7, saves: 65 },
      { id: "note_3", title: "Geography Form 3 — Human Activities and Map Reading notes", type: "note", class: "Form 3", subject: "Geography", clicks: 540, downloads: 112, year: "2025", author: "Teacher Makene", isPremium: false, rating: 4.5, saves: 8 },
      { id: "paper_3", title: "English Language CSEE past paper with expert keys 2022", type: "past_paper", class: "Form 4", subject: "English", clicks: 710, downloads: 220, year: "2022", author: "NECTA", isPremium: false, rating: 4.3, saves: 11 }
    ];
    setStudyResources(defaults);
    setLoadingResources(false);
  };

  useEffect(() => {
    fetchLiveResources();
  }, []);

  // Save Bookmarks to localStorage
  const handleToggleBookmark = (item) => {
    let updated;
    const exists = bookmarkedList.find(b => b.id === item.id);
    if (exists) {
      updated = bookmarkedList.filter(b => b.id !== item.id);
      showTemporaryToast(`Removed "${item.title.substring(0, 24)}..." from bookmarks`);
    } else {
      updated = [...bookmarkedList, item];
      showTemporaryToast(`Saved "${item.title.substring(0, 24)}..." to my bookmarks!`);
      awardPoints(5, "Saving resource");
    }
    setBookmarkedList(updated);
    localStorage.setItem('stea_bookmarked_resources', JSON.stringify(updated));
  };

  // Follow Scholarship Toggle
  const handleToggleFollowScholarship = (schName) => {
    let updated;
    const isFollowing = followedScholarships.includes(schName);
    if (isFollowing) {
      updated = followedScholarships.filter(s => s !== schName);
      showTemporaryToast(`Unfollowed notifications for ${schName}`);
    } else {
      updated = [...followedScholarships, schName];
      showTemporaryToast(`You are now following ${schName}. You'll receive live deadline alerts!`);
      awardPoints(10, "Following scholarship");
      
      // Simulate an immediate dynamic alert
      const logMsg = `[ALERT] New requirements update alert received for ${schName}!`;
      setScholarshipAlertLog(prev => [logMsg, ...prev]);
      
      // Add a central notification info
      const newNotif = {
        id: getNextUniqueId(),
        text: `ALERT: New updates detected on ${schName}. Please check deadlines!`,
        type: "scholarship",
        time: "Just now",
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
    setFollowedScholarships(updated);
    localStorage.setItem('stea_followed_scholarships', JSON.stringify(updated));
  };

  // Helper point reward logic
  const awardPoints = (amount, reason) => {
    setUserPoints(prev => {
      const updated = prev + amount;
      localStorage.setItem('stea_user_points', updated.toString());
      return updated;
    });
    showTemporaryToast(`🎉 Earned +${amount} STEA reputation points for: ${reason}!`);
  };

  // Temporary Toast banner message
  const showTemporaryToast = (msg) => {
    setAlertBanner(msg);
    setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
  };

  // Simulating Friends Joined
  const simulateInviteFriend = () => {
    setReferralCount(prev => {
      const next = prev + 1;
      localStorage.setItem('stea_referral_count', next.toString());
      
      if (next === 3) {
        awardPoints(50, "Invite 3 friends (STEA Advocate Badge Unlocked)");
      } else if (next === 10) {
        awardPoints(150, "Invite 10 friends (Premium Student Trial Unlocked)");
      } else if (next === 25) {
        awardPoints(400, "Invite 25 friends (Elite Hall of Fame Recognition)");
      } else {
        awardPoints(15, "Inviting a friend to join STEA");
      }
      return next;
    });
  };

  // University Matcher logic based on Form 6 COMB, points limit & interest matching
  const handleMatchUniversity = () => {
    const com = combInput.toUpperCase();
    const pts = parseInt(pointsInput) || 12;

    const COMBO_DATA_EXPANDED = {
      PCM: {
        courses: [
          { name: "Bachelor of Science in Software Engineering", demand: "High", career: "Global Software Architect, Tech entrepreneur" },
          { name: "Bachelor of Science in Computer Science", demand: "Extremely High", career: "AI/ML Developer, Local Cyber specialist" },
          { name: "Bachelor of Science in Civil & Structural Engineering", demand: "High", career: "Structural Architect, Government project lead" },
          { name: "Bachelor in Telecom & Electronics Network Engineering", demand: "Moderate", career: "Network supervisor at Vodacom/Tigo" }
        ],
        unis: ["University of Dar es Salaam (UDSM)", "College of Engineering & Technology (CoET)", "University of Dodoma (UDOM)", "Nelson Mandela Institution (NM-AIST)"]
      },
      PCB: {
        courses: [
          { name: "Doctor of Medicine (MD Degree Program)", demand: "Highest", career: "Senior Surgeon, Private clinic specialist" },
          { name: "Bachelor of Pharmacy (BPharm)", demand: "Very High", career: "Pharmaceutical researcher, regulatory adviser" },
          { name: "Bachelor of Science in Medical Laboratory Science", demand: "High", career: "Diagnostic specialist, public laboratory scientist" }
        ],
        unis: ["Muhimbili University (MUHAS)", "CUHAS (Bugando)", "KCMUCo (KCMC Arusha)", "University of Dar es Salaam (UDSM)"]
      },
      HKL: {
        courses: [
          { name: "Bachelor of Laws (LLB with Honors)", demand: "High", career: "Corporate attorney, judicial advocate, magistrate" },
          { name: "Bachelor of Arts in International Relations", demand: "Moderate", career: "Diplomat, United Nations analyst" },
          { name: "Bachelor of Arts in Journalism & Mass Comm", demand: "High", career: "Investigative reporter, public relations head" }
        ],
        unis: ["University of Dar es Salaam (UDSM)", "Mzumbe University", "Tumaini University Makumira", "St. Augustine University (SAUT)"]
      },
      EGM: {
        courses: [
          { name: "Bachelor of Science in Economics & Statistics", demand: "Highest", career: "Policy advisor, central bank economist" },
          { name: "Bachelor of Commerce in Banking & Finance", demand: "High", career: "Investment manager, CRDB / NMB analyst" },
          { name: "Bachelor of Science in Actuarial Science", demand: "Very High", career: "Risk premium analyst, Insurance expert" }
        ],
        unis: ["University of Dar es Salaam (UDSM)", "Institute of Finance Management (IFM)", "Mzumbe University"]
      },
      HGE: {
        courses: [
          { name: "Bachelor of Arts in Geography & Environmental Studies", demand: "Moderate", career: "Environmental expert, weather forecast modeler" },
          { name: "Bachelor of Science in Urban & Regional Planning", demand: "High", career: "Government land developer, smart city planner" }
        ],
        unis: ["Ardhi University (ARU)", "University of Dodoma (UDOM)", "Mzumbe University"]
      },
      CBG: {
        courses: [
          { name: "Bachelor of Science in Business Administration", demand: "High", career: "Corporate Chief of Staff, human resources lead" },
          { name: "Bachelor of Accountancy & Taxation Audit", demand: "Very High", career: "Licensed public auditor (CPA), tax executive" }
        ],
        unis: ["Institute of Finance Management (IFM)", "Mzumbe University", "University of Dar es Salaam (UDSM)"]
      },
      PGM: {
        courses: [
          { name: "Bachelor of Science in General Agriculture", demand: "High", career: "Precision agronomist, modern farming consultant" },
          { name: "Bachelor of Veterinary Medicine (BVM)", demand: "High", career: "Livestock medical analyst, farm disease supervisor" }
        ],
        unis: ["Sokoine University of Agriculture (SUA)", "Nelson Mandela African Inst (NM-AIST)"]
      }
    };

    const combinedMatch = COMBO_DATA_EXPANDED[com] || {
      courses: [
        { name: "Bachelor of Education (General Arts/Science)", demand: "High", career: "Secondary schools teacher, syllabus designer" },
        { name: "Bachelor of Arts in Social Work", demand: "Moderate", career: "Community health supervisor" }
      ],
      unis: ["University of Dar es Salaam (UDSM)", "DUCE", "MUCE", "Open University of Tanzania (OUT)"]
    };

    // Filter by points
    let statusText = "";
    if (pts >= 3 && pts <= 7) {
      statusText = "🎓 Elite Academic Standing! Full access to government HESLB Priority 1 loan brackets.";
    } else if (pts > 7 && pts <= 13) {
      statusText = "👍 Exceptional Academic Standing! Eligible for competitive slots across major universities.";
    } else {
      statusText = "👉 Eligible Standing. We recommend focusing on high-capacity diplomas or selected degree courses.";
    }

    setMatchedResults({
      combination: com,
      points: pts,
      interest: interestInput,
      courses: combinedMatch.courses,
      unis: combinedMatch.unis,
      status: statusText
    });

    awardPoints(20, "Using University Matcher");
  };

  // Rating and Comment submissions inside feeds
  const submitFeedback = (e) => {
    e.preventDefault();
    if (!newFeedbackComment.trim()) return;

    const newF = {
      id: getNextUniqueId(),
      author: user?.displayName || user?.email?.split('@')[0] || "Student Guest",
      rating: newFeedbackRating,
      comment: newFeedbackComment,
      itemTitle: newFeedbackResourceTitle,
      timestamp: "Just now"
    };

    setFeedbacks(prev => [newF, ...prev]);
    setNewFeedbackComment("");
    setFeedbackSuccessToast("Resource review and score submitted successfully to educational community!");
    awardPoints(15, "Providing resource feedback");

    try {
      const db = getFirebaseDb();
      if (db) {
        addDoc(collection(db, 'resource_reviews'), {
          author: newF.author,
          userId: user?.uid || 'anon',
          rating: newFeedbackRating,
          comment: newFeedbackComment,
          resourceTitle: newFeedbackResourceTitle,
          submitedAt: serverTimestamp()
        });
      }
    } catch(err){}

    setTimeout(() => {
      setFeedbackSuccessToast("");
    }, 4000);
  };

  // Reporting resources simulation and database submit
  const handleReportResource = (resource) => {
    const confirmRep = window.confirm(`Are you sure you want to flag and report "${resource.title}" for review by STEA Content Integrity team?`);
    if (confirmRep) {
      showTemporaryToast(`🚨 Report sent. Content ID ${resource.id} is now queued for moderation.`);
      awardPoints(5, "Helping report standard integrity issues");

      try {
        const db = getFirebaseDb();
        if (db) {
          addDoc(collection(db, 'reported_content'), {
            resourceId: resource.id,
            resourceTitle: resource.title,
            reportedBy: user?.uid || 'anon',
            reportedAt: serverTimestamp()
          });
        }
      } catch (err){}
    }
  };

  // Calculate dynamic sorted trending lists
  const trendingNotes = [...studyResources]
    .filter(r => r.type === 'note')
    .sort((a, b) => b.clicks + (b.saves * 2) - (a.clicks + (a.saves * 2)))
    .slice(0, 3);

  const trendingPapers = [...studyResources]
    .filter(r => r.type === 'past_paper')
    .sort((a, b) => b.downloads * 3 + b.clicks - (a.downloads * 3 + a.clicks))
    .slice(0, 3);

  // Unread count
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div style={{ margin: '40px 0', fontFamily: 'inherit' }}>
      
      {/* Dynamic Pop up Alerts */}
      <AnimatePresence>
        {alertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: '#0d1326',
              boxShadow: `0 4px 30px ${G}44`,
              border: `1px solid ${G}`,
              borderRadius: 14,
              padding: '14px 20px',
              maxWidth: 420,
              width: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{alertBanner}</span>
            </div>
            <button 
              onClick={() => setAlertBanner(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>

        {/* --- DYNAMIC HEADER TITLE --- */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
          background: 'linear-gradient(90deg, rgba(20,20,25,0.7) 0%, rgba(10,10,12,0.7) 100%)',
          padding: '20px 24px',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: G }}>Daily Tanzanian Student Destination</span>
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: 900, letterSpacing: '-0.5px', color: '#fff', margin: 0 }}>
              Kituo cha Wanafunzi <span style={{ color: G }}>STEA</span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Reputation points display */}
            <div style={{
              background: 'rgba(245, 166, 35, 0.08)',
              border: `1px solid ${G}35`,
              borderRadius: 16,
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Trophy size={16} color={G} />
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Points Earned</div>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: G }}>{userPoints} pts</div>
              </div>
            </div>

            {/* Notification center bell icon trigger */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowBellNotificationPanel(v => !v)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  position: 'relative'
                }}
              >
                <Bell size={18} color={unreadCount > 0 ? G : '#fff'} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Central Notification Dropdown Box */}
              <AnimatePresence>
                {showBellNotificationPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    style={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      width: 320,
                      background: '#0e101a',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
                      borderRadius: 16,
                      padding: '16px',
                      zIndex: 100,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Notification Alerts</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                            showTemporaryToast("All notifications marked as read");
                          }}
                          style={{ background: 'transparent', border: 'none', color: G, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                      {notifications.map(not => (
                        <div key={not.id} style={{
                          background: not.unread ? 'rgba(245,166,35,0.04)' : 'transparent',
                          border: not.unread ? `1px solid ${G}15` : '1px solid transparent',
                          padding: 10,
                          borderRadius: 10,
                          position: 'relative'
                        }}>
                          <div style={{ fontSize: 12, color: not.unread ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: not.unread ? 800 : 500, lineHeight: 1.4 }}>
                            {not.text}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{not.time}</span>
                            {not.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC HUB TAB SELECTOR --- */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          marginBottom: 20,
          background: 'rgba(255,255,255,0.02)',
          padding: 4,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {[
            { id: 'hub', label: '📢 Daily Feed', icon: '📝' },
            { id: 'trending', label: '🔥 Trending', icon: '⚡' },
            { id: 'university', label: '🎓 Uni Matcher', icon: '🧭' },
            { id: 'leaderboard', label: '🏆 Rewards', icon: '✨' },
            { id: 'community', label: '💬 Reviews', icon: '👥' },
            { id: 'admin', label: '📊 Admin Panel', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowBellNotificationPanel(false);
              }}
              style={{
                background: activeTab === tab.id ? 'rgba(245,166,35,0.12)' : 'transparent',
                color: activeTab === tab.id ? G : 'rgba(255,255,255,0.55)',
                border: activeTab === tab.id ? `1px solid ${G}35` : '1px solid transparent',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB VIEWPORTS --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* =============== TAB: HUB (DAILY FEED) =============== */}
            {activeTab === 'hub' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Intro announcement banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(20,20,25,0.85) 100%)',
                  borderRadius: 20,
                  padding: 24,
                  border: `1px solid ${G}22`,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 20,
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 900, color: G, background: 'rgba(245,166,35,0.1)', padding: '3px 8px', borderRadius: 6, border: `1px solid ${G}30`, textTransform: 'uppercase' }}>Daily Mission Active</span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 8 }}>Earn Free STEA Premium Trial</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      Soma, pakua materials au shiriki quiz kila siku ili uweze kuongeza pointi za "Reputation" na kufungua trial ya vitabu na past papers za kulipia bure!
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
                    <button 
                      onClick={() => awardPoints(15, "Completed morning quiz check")}
                      style={{
                        background: `linear-gradient(135deg, ${G}, ${G2})`,
                        color: '#050508',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 12.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>⚡</span> Complete Daily Check (+15 pts)
                    </button>
                    <button
                      onClick={() => {
                        simulateInviteFriend();
                        showTemporaryToast("Simulated friend joined via shared referral link!");
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🔗 Share Referrals
                    </button>
                  </div>
                </div>

                {/* Grid for activity feeds and Alerts */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(300px, 11fr) minmax(260px, 6fr)',
                  gap: 20,
                }} className="stea-feed-responsive-cols">
                  
                  {/* Left Column Feed Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.85)' }}>
                        Latest Classroom uploads
                      </h3>
                      <button onClick={fetchLiveResources} style={{ background: 'none', border: 'none', color: G, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={12} /> refreshi feed
                      </button>
                    </div>

                    {loadingResources ? (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Inapakia orodha...</div>
                    ) : (
                      studyResources.slice(0, 4).map(item => {
                        const isNote = item.type === 'note';
                        const isBookmarked = bookmarkedList.some(b => b.id === item.id);

                        return (
                          <div key={item.id} style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            position: 'relative'
                          }}>
                            {/* Card badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: 9,
                                fontWeight: 900,
                                background: isNote ? 'rgba(245, 166, 35, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                color: isNote ? G : '#60a5fa',
                                padding: '3px 8px',
                                borderRadius: 6
                              }}>
                                {isNote ? '📚 Study Note' : '📝 Past Paper'}
                              </span>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button 
                                  onClick={() => handleToggleBookmark(item)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: isBookmarked ? G : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Bookmark size={16} fill={isBookmarked ? G : 'none'} />
                                </button>
                                <button
                                  onClick={() => handleReportResource(item)}
                                  style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer' }}
                                  title="Report this content"
                                >
                                  <AlertTriangle size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Resource title */}
                            <h4 style={{ fontSize: 14.5, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.4 }}>
                              {item.title}
                            </h4>

                            {/* Tags list */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 4 }}>🏫 {item.class}</span>
                              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 4 }}>📖 {item.subject}</span>
                              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 4 }}>✍️ {item.author || "Teacher"}</span>
                            </div>

                            {/* Actions and tracking triggers */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>👁️ {item.clicks} views • 📥 {item.downloads || 0} downloads</span>
                              <button
                                onClick={async () => {
                                  // Update studyResources state immutably
                                  setStudyResources(prev => prev.map(res => {
                                    if (res.id === item.id) {
                                      return {
                                        ...res,
                                        downloads: (res.downloads || 0) + 1,
                                        clicks: (res.clicks || 0) + 1
                                      };
                                    }
                                    return res;
                                  }));
                                  showTemporaryToast(`Initiating classroom PDF download link...`);
                                  awardPoints(10, `Downloading resource PDF`);
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: 900,
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  cursor: 'pointer'
                                }}
                              >
                                Pakua PDF
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column Notifications, Alerts & Following Alerts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* HESLB & Scholarship alerts portal */}
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 18,
                      padding: 18,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>🔔</span>
                        <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', margin: 0 }}>Scholarship Alerts</h4>
                      </div>

                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>
                        Bofya 'Follow' kupokea ujumbe na notifications mapema pale nafasi mpya, deadline au mabadiliko rasmi ya maombi yanapotangazwa na TCU/HESLB.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { name: "HESLB Loan Portal", type: "Local Loan Guide" },
                          { name: "TCU State Scholarships", type: "Government Merit" },
                          { name: "TANESCO STEM Funding", type: "Local Private" },
                          { name: "Global Undergrad Award", type: "Study Abroad Support" }
                        ].map(sch => {
                          const isFollowed = followedScholarships.includes(sch.name);
                          return (
                            <div key={sch.name} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255,255,255,0.02)',
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.04)'
                            }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{sch.name}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sch.type}</div>
                              </div>
                              <button
                                onClick={() => handleToggleFollowScholarship(sch.name)}
                                style={{
                                  background: isFollowed ? 'rgba(239, 68, 68, 0.1)' : `rgba(245, 166, 35, 0.1)`,
                                  color: isFollowed ? '#ef4444' : G,
                                  border: isFollowed ? '1px solid rgba(239,68,68,0.2)' : `1px solid ${G}30`,
                                  fontSize: 10.5,
                                  fontWeight: 900,
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  cursor: 'pointer'
                                }}
                              >
                                {isFollowed ? 'Following' : 'Follow'}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Log of push notifications alerts */}
                      {scholarshipAlertLog.length > 0 && (
                        <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: G, textTransform: 'uppercase' }}>Live Alert Feed Logs</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 100, overflowY: 'auto' }}>
                            {scholarshipAlertLog.map((log, i) => (
                              <div key={i} style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1.4 }}>
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick University Alert Updates Card */}
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 18,
                      padding: 18,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 16 }}>🏛️</span>
                        <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', margin: 0 }}>University Portal Updates</h4>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10 }}>
                          <span style={{ fontSize: 9, background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>ACTIVE</span>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', marginTop: 4 }}>TCU First Selection window opened for Form 6 candidates</div>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>Jan 15 - Mar 30</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10 }}>
                          <span style={{ fontSize: 9, background: 'rgba(245,166,35,0.1)', color: G, padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>OPEN SOON</span>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', marginTop: 4 }}>SUA (Sokoine) Diploma selection criteria and checklist guides</div>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 4 }}>Mar 1 deadline upcoming</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* MY BOOKMARKS SUBSECTION */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                  marginTop: 10
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bookmark size={18} color={G} fill={G} />
                      <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>My Saved Resources</h3>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
                      {bookmarkedList.length} items bookmarked
                    </span>
                  </div>

                  {bookmarkedList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 16px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📥</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Hakuna notes au past papers ulizozihifadhi bado. Bofya alama ya bookmark kwenye kadi ili kuhifadhi notes za kusoma kisha zitatokea hapa.</p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 12
                    }}>
                      {bookmarkedList.map((item) => (
                        <div key={item.id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 12,
                          padding: 14,
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '2px 5px', borderRadius: 4 }}>
                                {item.type === 'note' ? 'Note' : 'Past Paper'}
                              </span>
                              <button 
                                onClick={() => handleToggleBookmark(item)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{item.title}</div>
                          </div>
                          <div style={{ fontSize: 11, color: G, fontWeight: 700 }}>
                            📖 {item.subject} • {item.class}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* =============== TAB: TRENDING =============== */}
            {activeTab === 'trending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Flame highlight headline */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(20,20,25,0.95) 100%)',
                  borderRadius: 20,
                  padding: '24px 20px',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <div style={{ width: 48, height: 48, background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                    <Flame size={24} color="#ef4444" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Tanzania's Live Popularity Ranks</h3>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      Inapatikana kwa kurank clicks, downloads, na saves kutoka kwa wanafunzi na walimu kote nchini. Chati hizi zinajidondosha kiotomatiki papo hapo.
                    </p>
                  </div>
                </div>

                {/* Trending columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 20
                }}>
                  {/* Notes Column */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>🔥</span>
                      <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', margin: 0 }}>Trending Notes</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {trendingNotes.map((note, index) => (
                        <div key={note.id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.04)',
                          position: 'relative'
                        }}>
                          <span style={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.1)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>0{index + 1}</span>
                          <div style={{ fontSize: 11, color: G, fontWeight: 800 }}>{note.subject} • {note.class}</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4, width: '85%', lineHeight: 1.3 }}>{note.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                            <span>👁️ {note.clicks} views</span>
                            <span>📥 {note.downloads || 0} downloads</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past Papers Column */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>⚡</span>
                      <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', margin: 0 }}>Trending Past Papers</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {trendingPapers.map((paper, index) => (
                        <div key={paper.id} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.04)',
                          position: 'relative'
                        }}>
                          <span style={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.1)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>0{index + 1}</span>
                          <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 800 }}>{paper.subject} • {paper.class} ({paper.year})</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4, width: '85%', lineHeight: 1.3 }}>{paper.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                            <span>👁️ {paper.clicks} views</span>
                            <span>📥 {paper.downloads || 0} downloads</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quizzes Column */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>🏆</span>
                      <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', margin: 0 }}>Trending Quizzes</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { title: "Today's Physics Class Quiz (Form 4 Mechanics)", playCount: 840, difficulty: "Moderate" },
                        { title: "NECTA Chemistry Form 2 Basic Equations", playCount: 512, difficulty: "Easy" },
                        { title: "Form 6 Math Weekly Challenge Series 4", playCount: 310, difficulty: "Hard" }
                      ].map((quiz, index) => (
                        <div key={index} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: 12,
                          borderRadius: 12,
                          border: '1px solid rgba(255,255,255,0.04)',
                          position: 'relative'
                        }}>
                          <span style={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.1)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>0{index + 1}</span>
                          <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 800 }}>Class Challenge • {quiz.difficulty}</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4, width: '85%', lineHeight: 1.3 }}>{quiz.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                            <span>🎮 {quiz.playCount} participants</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Popularity ranking of teachers for downloads tracking */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                  marginTop: 10
                }}>
                  <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Popularity Teacher Rankings</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12
                  }}>
                    {[
                      { name: "Teacher Isaya Masika", uploads: 42, totalDownloads: 2340, pointsAwarded: 520, rating: 5.0, status: "Verified 🛡️" },
                      { name: "Teacher Salum Mwajuma", uploads: 28, totalDownloads: 1420, pointsAwarded: 310, rating: 4.8, status: "Verified 🛡️" },
                      { name: "Teacher Juma Makene", uploads: 12, totalDownloads: 810, pointsAwarded: 150, rating: 4.6, status: "Standard" }
                    ].map((teacher, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: 14,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{teacher.name}</div>
                          <div style={{ fontSize: 11, color: G, marginTop: 2 }}>{teacher.status} • ⭐ {teacher.rating}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 14, fontWeight: 950, color: '#4ade80', display: 'block' }}>{teacher.totalDownloads}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Downloads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* =============== TAB: MATCHER =============== */}
            {activeTab === 'university' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Intro matcher card */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Compass size={22} color={G} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>University Program Matcher (Calculator ya Vyuo)</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
                    Ingiza Combination yako ya Form 6, Points za ACSEE ulizopanga au ulizopata na eneo la maslahi yako, na mfumo wetu utakupendekezea kozi zinazofanana, vyuo vya kitanzania vyenye hadhi bora, pamoja na maisha ya kazi kwa mbeleni!
                  </p>
                </div>

                {/* Form controls */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Form 6 Combination</label>
                    <select 
                      value={combInput}
                      onChange={e => setCombInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '10px 14px',
                        outline: 'none',
                        fontSize: 13
                      }}
                    >
                      {["PCM", "PCB", "HKL", "EGM", "HGE", "CBG", "PGM", "Other"].map(comb => (
                        <option style={{ background: '#0d0e12' }} key={comb} value={comb}>{comb}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Total ACSEE Points (Grade points limit)</label>
                    <input 
                      type="number"
                      min="3"
                      max="25"
                      value={pointsInput}
                      onChange={e => setPointsInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '10px 14px',
                        outline: 'none',
                        fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Interest Field</label>
                    <select 
                      value={interestInput}
                      onChange={e => setInterestInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '10px 14px',
                        outline: 'none',
                        fontSize: 13
                      }}
                    >
                      {["IT / Computer Systems", "Medical / Surgery Studies", "Engineering / Construction", "Law / Public Advocacy", "Banking & Finance Analysis", "Agronomy / Veterinary", "Arts & Languages"].map(inter => (
                        <option style={{ background: '#0d0e12' }} key={inter} value={inter}>{inter}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={handleMatchUniversity}
                      style={{
                        width: '100%',
                        background: `linear-gradient(135deg, ${G}, ${G2})`,
                        color: '#050508',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Pata Pendekezo Sasa 🚀
                    </button>
                  </div>
                </div>

                {/* Match Results display */}
                {matchedResults && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(20,20,25,0.85) 0%, rgba(10,10,12,0.95) 100%)',
                    border: `1px solid ${G}35`,
                    borderRadius: 20,
                    padding: 20,
                  }}>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: G, marginBottom: 4 }}>
                      Combination matched: {matchedResults.combination} (Points: {matchedResults.points})
                    </h3>
                    <p style={{ fontSize: 13.5, color: '#fff', fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.4 }}>
                      {matchedResults.status}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 20
                    }}>
                      {/* Left Block: Recomended courses */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Degree Courses</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                          {matchedResults.courses.map((c, i) => (
                            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                Demand: {c.demand} • Future Job: {c.career}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Block: Recomended Universities */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Matching Tanzanian Universities</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                          {matchedResults.unis.map((u, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                              <span style={{ fontSize: 14 }}>🏛️</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{u}</div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>High select ranking priority</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* =============== TAB: LEADERBOARD =============== */}
            {activeTab === 'leaderboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Referrals Block */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(10,10,12,0.95) 100%)',
                  borderRadius: 20,
                  padding: 20,
                  border: '1px solid rgba(245,166,35,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 950, color: G, background: 'rgba(245,166,35,0.1)', padding: '3px 8px', borderRadius: 4, uppercase: true }}>Referral Advocate Network</span>
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginTop: 8, marginBottom: 4 }}>Earn badges and special premium status by inviting friends!</h3>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        Shiriki code yako ya ualikaji. Marafiki wakijiunga, unaandaliwa kupata premium account ya bure (trial ya past papers zote).
                      </p>
                    </div>

                    {/* Copy Referral Container */}
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: 12,
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>My Invite Code</div>
                      <div style={{ fontSize: 14, fontWeight: 950, color: '#fff', margin: '4px 0 8px 0', fontFamily: 'monospace' }}>{referralCode}</div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`Join STEA Education with referral link and prepare for NECTA or Universities with resources! Code: ${referralCode}`);
                          showTemporaryToast("Copied referral promo message to clipboard!");
                        }}
                        style={{
                          background: G,
                          color: '#000',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: 'pointer'
                        }}
                      >
                        Copy Promo Msg
                      </button>
                    </div>
                  </div>

                  {/* Referral Progress and Simulators */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Referral conversion track: <b>{referralCount}</b> friends joined</span>
                      <button
                        onClick={simulateInviteFriend}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        [ + ] Simulates Friend Joined
                      </button>
                    </div>

                    {/* Simple gauge bar visualization */}
                    <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${G}, #4ade80)`, width: `${Math.min((referralCount / 25) * 100, 100)}%` }} />
                    </div>

                    {/* Progress indicators items */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                      <div style={{ background: referralCount >= 3 ? `${G}10` : 'transparent', border: referralCount >= 3 ? `1px solid ${G}30` : '1px solid transparent', padding: 8, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: referralCount >= 3 ? G : 'rgba(255,255,255,0.3)' }}>3 friends</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Unlock Badge: <b>Advocate 🏅</b></div>
                      </div>
                      <div style={{ background: referralCount >= 10 ? `#4ade8010` : 'transparent', border: referralCount >= 10 ? `1px solid #4ade8030` : '1px solid transparent', padding: 8, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: referralCount >= 10 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>10 friends</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Unlock: <b>Premium level trial ⭐</b></div>
                      </div>
                      <div style={{ background: referralCount >= 25 ? `#60a5fa10` : 'transparent', border: referralCount >= 25 ? `1px solid #60a5fa30` : '1px solid transparent', padding: 8, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: referralCount >= 25 ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>25 friends</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Unlock: <b>Hall of Fame spotlight 💎</b></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* My reputation badges portal */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                }}>
                  <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>STEA Reputation Badges Status</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 12
                  }}>
                    {[
                      { icon: "🏆", name: "Top Student", desc: "Top 5% quiz scorers", unlocked: userPoints >= 150 },
                      { icon: "🥇", name: "Top Teacher", desc: "Active uploader", unlocked: false },
                      { icon: "🛡️", name: "Verified Teacher", desc: "Credentials check", unlocked: false },
                      { icon: "💎", name: "Top Contributor", desc: "Upload 5 resources", unlocked: userPoints >= 200 },
                      { icon: "🎓", name: "Scholarship Hunter", desc: "Follow 3 scholarships", unlocked: followedScholarships.length >= 3 },
                      { icon: "🎯", name: "Quiz Master", desc: "Score 100% on any quiz", unlocked: userPoints >= 95 }
                    ].map((badge, idx) => (
                      <div key={idx} style={{
                        background: badge.unlocked ? 'rgba(245,166,35,0.05)' : 'rgba(255,255,255,0.01)',
                        border: badge.unlocked ? `1px solid ${G}35` : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: 12,
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {!badge.unlocked && <span style={{ position: 'absolute', top: 6, right: 10, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>🔒 Locked</span>}
                        {badge.unlocked && <span style={{ position: 'absolute', top: 6, right: 10, color: '#4ade80', fontSize: 10 }}>✔️ Unlocked</span>}
                        <div style={{ fontSize: 26, margin: '8px 0' }}>{badge.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: badge.unlocked ? '#fff' : 'rgba(255,255,255,0.4)' }}>{badge.name}</div>
                        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>{badge.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main point award manual triggers for testing */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20,
                }}>
                  <h4 style={{ fontSize: 14, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>Engage and Earn Reputation</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <button onClick={() => awardPoints(50, "Uploaded Chemistry note PDF")} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>📤 Upload resource note (+50 pts)</button>
                    <button onClick={() => awardPoints(15, "Form 4 Physics quiz completed")} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>🎮 Complete Math/Physics quiz (+15 pts)</button>
                    <button onClick={() => awardPoints(10, "Helped coordinate syllabus explanation")} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>🤝 Help classmate online (+10 pts)</button>
                    <button onClick={() => awardPoints(5, "Shared note link over WhatsApp")} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>🔗 Share study resource (+5 pts)</button>
                  </div>
                </div>

              </div>
            )}

            {/* =============== TAB: COMMUNITY & COMEMNTS =============== */}
            {activeTab === 'community' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Community Title */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <MessageSquare size={20} color={G} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Community Book Reviews & Ratings</h3>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
                    Angalia uzoefu wa wanafunzi wengine kuhusu materials, notes au mitalaa iliyowekwa na walimu. Unaweza kutoa rating ya nyota 5 au kuacha comment yako.
                  </p>
                </div>

                {/* Review section content */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(300px, 11fr) minmax(260px, 7fr)',
                  gap: 20
                }} className="stea-feed-responsive-cols">
                  
                  {/* Feedbacks list display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 950, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Study Materials Reviews</h4>
                    
                    {feedbacks.map(f => (
                      <div key={f.id} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        padding: 16
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{f.author}</span>
                            <span style={{ fontSize: 11, color: G, marginLeft: 8 }}>reviewed <b>{f.itemTitle}</b></span>
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{f.timestamp}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} color={G} fill={i < f.rating ? G : 'none'} />
                          ))}
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>
                          "{f.comment}"
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Submission form */}
                  <div>
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 18,
                      padding: 18
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Publish a Resource Review</div>
                      <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Select Material title</label>
                          <select 
                            value={newFeedbackResourceTitle}
                            onChange={e => setNewFeedbackResourceTitle(e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '8px 10px',
                              outline: 'none',
                              fontSize: 12.5
                            }}
                          >
                            {studyResources.map(r => (
                              <option style={{ background: '#0e101a' }} key={r.id} value={r.title}>{r.title.substring(0, 32)}...</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Rating Selection</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[1, 2, 3, 4, 5].map(num => (
                              <button
                                type="button"
                                key={num}
                                onClick={() => setNewFeedbackRating(num)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                              >
                                <Star size={20} color={G} fill={num <= newFeedbackRating ? G : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Comment details</label>
                          <textarea
                            value={newFeedbackComment}
                            onChange={e => setNewFeedbackComment(e.target.value)}
                            rows={3}
                            placeholder="Andika uzoefu wako kuhusu material haya..."
                            style={{
                              width: '100%',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '8px 10px',
                              outline: 'none',
                              fontSize: 12.5,
                              resize: 'none',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>

                        {feedbackSuccessToast && (
                          <div style={{ fontSize: 11.5, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: 8, borderRadius: 6 }}>
                            {feedbackSuccessToast}
                          </div>
                        )}

                        <button
                          type="submit"
                          style={{
                            background: `linear-gradient(135deg, ${G}, ${G2})`,
                            color: '#050508',
                            border: 'none',
                            padding: '10px 14px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 900,
                            cursor: 'pointer'
                          }}
                        >
                          Submit Score
                        </button>
                      </form>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =============== TAB: ADMIN PANEL =============== */}
            {activeTab === 'admin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Admin authentication notice context */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Settings size={20} color={G} />
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>Audited Analytics Dashboard (Admin View)</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
                    Inapatikana kwa ajili ya usimamizi na ufuatiliaji wa ukuaji wa STEA Education kote nchini. Chati na statistics hizi zinatengenezwa kiotomatiki papo hapo.
                  </p>
                </div>

                {/* Analytics core grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 14
                }} className="stea-grid-cols-4-responsive">
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>Daily Users</span>
                    <div style={{ fontSize: 24, fontWeight: 950, color: G, marginTop: 8 }}>14,240 <span style={{ fontSize: 11, color: '#4ade80' }}>+12%</span></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>Active Students</span>
                    <div style={{ fontSize: 24, fontWeight: 950, color: '#4ade80', marginTop: 8 }}>8,520 <span style={{ fontSize: 11, color: '#4ade80' }}>+8%</span></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>Active Teachers</span>
                    <div style={{ fontSize: 24, fontWeight: 950, color: '#60a5fa', marginTop: 8 }}>1,240 <span style={{ fontSize: 11, color: '#60a5fa' }}>+15%</span></div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800 }}>Downloads Rate</span>
                    <div style={{ fontSize: 24, fontWeight: 950, color: '#a855f7', marginTop: 8 }}>4,831 <span style={{ fontSize: 11, color: '#a855f7' }}>+24%</span></div>
                  </div>
                </div>

                {/* Sub plots grids for detailed visualizer data */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 20
                }}>
                  {/* Traffic and Source metrics */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 18 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Traffic Sources Distribution</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} >
                      {[
                        { source: "Direct App Visitors", share: "45%", width: "45%", color: G },
                        { source: "WhatsApp Student Groups", share: "35%", width: "35%", color: "#4ade80" },
                        { source: "Google Scholar / Search", share: "15%", width: "15%", color: "#60a5fa" },
                        { source: "Instagram/FB Education Campaigns", share: "5%", width: "5%", color: "#f472b6" }
                      ].map(src => (
                        <div key={src.source}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{src.source}</span>
                            <span style={{ fontWeight: 800, color: src.color }}>{src.share}</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: src.color, width: src.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Revenue preps configuration section */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 18 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 950, textTransform: 'uppercase', color: '#fff', marginBottom: 12 }}>Revenue Preparation & Tiers Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ background: 'rgba(245,166,35,0.05)', border: `1px solid ${G}18`, padding: 12, borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>Student Premium Membership</span>
                          <span style={{ fontSize: 9, background: `${G}18`, color: G, padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>PROD PREPARED</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, margin: '4px 0 0 0' }}>Ada ya TZS 4,999/mwezi kwa download zote bila limit, offline mode, na kituo cha university analysis.</p>
                      </div>

                      <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.18)', padding: 12, borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>Sponsored Uni & Scholarship</span>
                          <span style={{ fontSize: 9, background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>PROD PREPARED</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, margin: '4px 0 0 0' }}>Vyuo au wafadhili binafsi kujiunga na kuonekana kwanza kwenye ukurasa wa mapendekezo kama mshiriki mkuu.</p>
                      </div>

                      <div style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.18)', padding: 12, borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff' }}>Premium Teachers Verification</span>
                          <span style={{ fontSize: 9, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>PROD PREPARED</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, margin: '4px 0 0 0' }}>Walimu kulipia TZS 10,000/mwaka ili kupata 'Verified 🛡️' Badge na dashboard ya analytics za revenue.</p>
                      </div>
                    </div>
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
