import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  PlayCircle, 
  CheckCircle,
  Settings,
  Bell,
  Users,
  MessageSquare,
  Share2,
  Send,
  HelpCircle,
  CheckCircle2,
  Plus,
  Search,
  ArrowUp,
  ChevronDown,
  MapPin,
  UserPlus,
  Megaphone,
  Copy,
  Activity,
  ThumbsUp,
  X,
  FileText,
  Bookmark,
  Sparkles,
  Link as LinkIcon,
  Check,
  Tv
} from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import STEAAvatar from "../components/STEAAvatar.jsx";
import { useCollection, useCollectionWhere } from "../hooks/useFirestore.js";
import { 
  db, 
  getFirebaseAuth, 
  onAuthStateChanged,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp 
} from "../firebase.js";
import { AnimatedBackground } from "../components/AnimatedBackground.jsx";
import { BlurText } from "../components/BlurText.jsx";
import { AttendanceCard } from "../components/AttendanceCard.jsx";
import confetti from "canvas-confetti";

const G = "#F5A623";
const G2 = "#FFD17C";
const CARD_BG = "#0d111d";

// Standard padding container
const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", ...style }}>
    {children}
  </div>
);

// Formatted past time helper
function timeAgo(dateInput) {
  if (!dateInput) return "just now";
  let date;
  if (dateInput?.toDate) date = dateInput.toDate();
  else if (dateInput instanceof Date) date = dateInput;
  else date = new Date(dateInput);

  if (isNaN(date.getTime())) return "just now";
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    [31536000, "mwaka"],
    [2592000, "mwezi"],
    [86400, "siku"],
    [3600, "saa"],
    [60, "dakika"],
  ];
  for (const [s, label] of intervals) {
    const n = Math.floor(seconds / s);
    if (n >= 1) return `${n} ${label}${n > 1 ? "" : ""} iliyopita`;
  }
  return "sasa hivi";
}

export default function StudentCenterPage({ goPage }) {
  const isMobile = useMobile();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    school: "",
    educationLevel: "",
    points: 100,
    referralsCount: 0,
    questionsCount: 0,
    answersCount: 0,
    quizzesCount: 0,
    savedResourcesCount: 0,
    badges: [],
  });
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, communities, Q&A, badges, referrals
  
  // Communities tab states
  const [selectedSubTab, setSelectedSubTab] = useState("level"); // level or subject
  const [selectedGroup, setSelectedGroup] = useState("Form 4 Students"); // standard starting level
  
  // Forum thread state
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Form 4 Students");
  
  // Active thread detail modal
  const [activeThread, setActiveThread] = useState(null);
  const [threadAnswers, setThreadAnswers] = useState([]);
  const [newAnswerContent, setNewAnswerContent] = useState("");
  
  // Referral flow states
  const [myReferrals, setMyReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const [simulateLoading, setSimulateLoading] = useState(false);
  
  // Campus Ambassador recruiter states
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [ambassadorSchool, setAmbassadorSchool] = useState("");
  const [ambassadorLevel, setAmbassadorLevel] = useState("University");
  const [ambassadorReason, setAmbassadorReason] = useState("");
  const [ambassadorSocials, setAmbassadorSocials] = useState("");
  const [ambassadorStatus, setAmbassadorStatus] = useState(null); // null, pending, approved
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSchool, setProfileSchool] = useState("");
  const [profileLevel, setProfileLevel] = useState("Form 4");
  
  // Confetti trigger reference
  const celebrationRef = useRef(null);

  // Load existing enrolled courses counts
  const { docs: enrolledCourses, loading: coursesLoading } = useCollectionWhere(
    "enrollments", 
    "studentId", 
    "==", 
    user?.uid || "mock-user-id"
  );

  // Load referrals helper
  const loadReferrals = async (uid) => {
    try {
      const qRef = query(collection(db, "referrals"), where("referrerUid", "==", uid));
      const res = await getDocs(qRef);
      setMyReferrals(res.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setReferralsLoading(false);
    } catch (err) {
      console.warn("Could not load referrals collection:", err.message);
      setReferralsLoading(false);
    }
  };

  // Check Ambassador Application state
  const loadAmbassadorApplication = async (uid) => {
    try {
      const qRef = query(collection(db, "ambassador_applications"), where("uid", "==", uid));
      const res = await getDocs(qRef);
      if (!res.empty) {
        const data = res.docs[0].data();
        setAmbassadorStatus(data.status);
      }
    } catch (err) {
      console.warn("Could not load ambassador info:", err);
    }
  };

  // Global auth tracking
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          // Fetch or initialize custom user stats document
          const userDocRef = doc(db, "users", u.uid);
          try {
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile({
                school: data.school || "",
                educationLevel: data.educationLevel || data.education || "",
                points: data.points || 150,
                referralsCount: data.referralsCount || 0,
                questionsCount: data.questionsCount || 0,
                answersCount: data.answersCount || 0,
                quizzesCount: data.quizzesCount || 0,
                savedResourcesCount: data.savedResourcesCount || 0,
                badges: data.badges || [],
              });
              setProfileSchool(data.school || "");
              setProfileLevel(data.educationLevel || data.education || "Form 4");
            } else {
              // Create default profile configuration inside users store
              const defaults = {
                uid: u.uid,
                email: u.email,
                displayName: u.displayName || u.email.split("@")[0],
                photoURL: u.photoURL || "",
                role: "user",
                school: "",
                educationLevel: "",
                points: 150,
                referralsCount: 0,
                questionsCount: 0,
                answersCount: 0,
                quizzesCount: 0,
                savedResourcesCount: 0,
                badges: []
              };
              await setDoc(userDocRef, defaults);
              setUserProfile(defaults);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
          }
          
          // Load referral records
          loadReferrals(u.uid);
          // Load Ambassador Application state
          loadAmbassadorApplication(u.uid);
        }
      });
      return () => unsub();
    }
  }, []);

  // Fetch discussions real-time
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "communities_posts"), orderBy("createdAt", "desc")),
      (snap) => {
        const posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDiscussions(posts);
        setDiscussionsLoading(false);
      },
      (error) => {
        console.error("Error loading forum threads:", error);
        setDiscussionsLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // Load answers when active thread is updated
  useEffect(() => {
    if (!activeThread) return;
    const unsub = onSnapshot(
      query(
        collection(db, "communities_answers"), 
        where("postId", "==", activeThread.id),
        orderBy("createdAt", "asc")
      ),
      (snap) => {
        const ans = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setThreadAnswers(ans);
      },
      (error) => {
        console.error("Error loading answers container:", error);
      }
    );
    return () => unsub();
  }, [activeThread]);

  // Simulation Trigger: simulate a student registering with user's referral code!
  const handleInviteSimulate = async () => {
    if (simulateLoading) return;
    setSimulateLoading(true);
    
    setTimeout(async () => {
      try {
        const dummyNames = ["Amina Juma", "Baraka Mwakatobe", "Giveness Mushi", "Isaya Shayo", "Fatuma Ally", "Kevin Temu"];
        const dummyCourses = ["Form 4 Mathematics", "Form 6 Physics", "University Business ICT", "Form 4 Biology Review"];
        const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        const randomEmail = `${randomName.toLowerCase().replace(" ", "")}${Math.floor(Math.random() * 90) + 10}@steastudent.ac.tz`;
        
        // Add new student referral record as 'joined'
        const refId = `sim_${Date.now()}`;
        const refData = {
          referrerUid: user.uid,
          refereeName: randomName,
          refereeEmail: randomEmail,
          status: "joined",
          createdAt: serverTimestamp(),
          joinedAt: serverTimestamp(),
        };
        await setDoc(doc(db, "referrals", refId), refData);

        // Increment User profile values and award points
        const userDocRef = doc(db, "users", user.uid);
        const currentPoints = userProfile.points + 100;
        const currentRefs = userProfile.referralsCount + 1;
        
        // Update local profile first so badges trigger instantly
        const updatedBadges = [...userProfile.badges];
        if (currentRefs >= 1 && !updatedBadges.includes("STEA Ambassador")) {
          updatedBadges.push("STEA Ambassador");
          triggerUnlockCelebration("STEA Ambassador");
        }

        await updateDoc(userDocRef, {
          points: increment(100),
          referralsCount: increment(1),
          badges: updatedBadges,
        });

        setUserProfile(prev => ({
          ...prev,
          points: currentPoints,
          referralsCount: currentRefs,
          badges: updatedBadges,
        }));

        loadReferrals(user.uid);
        setSimulateLoading(false);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (err) {
        console.error("Failed to simulate registration:", err);
        setSimulateLoading(false);
      }
    }, 1500);
  };

  // Triggers visual banner for unlocking badge achievements
  const triggerUnlockCelebration = (badgeName) => {
    confetti({
      particleCount: 150,
      spread: 80,
      colors: [G, "#ff0000", "#00ff00", G2]
    });
    // Visual alert feedback
    window.dispatchEvent(new CustomEvent('stea-notify', {
      detail: {
        type: 'success',
        title: '🏆 BEJI MPYA IMEFUNGULIWA!',
        message: `Hongera sana! Umefungua beji ya "${badgeName}" na kupata bonasi ya Points 100!`
      }
    }));
  };

  // Submit profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileSchool.trim()) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        school: profileSchool,
        educationLevel: profileLevel,
      });
      setUserProfile(prev => ({ ...prev, school: profileSchool, educationLevel: profileLevel }));
      setIsEditingProfile(false);
      window.dispatchEvent(new CustomEvent('stea-notify', {
        detail: { type: 'success', title: 'Profile Updated', message: 'Taarifa zako zimehifadhiwa kikamilifu.' }
      }));
    } catch (err) {
      console.error("Save profile error:", err);
    }
  };

  // Apply to become Campus Ambassador
  const handleApplyAmbassador = async (e) => {
    e.preventDefault();
    if (!ambassadorSchool || !ambassadorReason) return;

    try {
      const appRef = doc(db, "ambassador_applications", user.uid);
      await setDoc(appRef, {
        uid: user.uid,
        name: user.displayName || user.email.split("@")[0],
        schoolName: ambassadorSchool,
        level: ambassadorLevel,
        reason: ambassadorReason,
        socialLinks: ambassadorSocials,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setAmbassadorStatus("pending");
      setShowAmbassadorModal(false);
      window.dispatchEvent(new CustomEvent('stea-notify', {
        detail: { 
          type: 'success', 
          title: 'Maombi Yamepokelewa!', 
          message: 'Asante kwa kuomba kuwa STEA Campus Ambassador. Tutakagua maombi yako ndani ya masaa 48.' 
        }
      }));
    } catch (err) {
      console.error("Ambassador application error:", err);
    }
  };

  // Create discussion Thread / Question
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      const postRef = collection(db, "communities_posts");
      const postVal = {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        authorId: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        authorPhoto: user.photoURL || "",
        upvotes: 0,
        upvotedBy: [],
        answersCount: 0,
        helpfulAnswerId: "",
        createdAt: serverTimestamp(),
      };
      
      await addDoc(postRef, postVal);

      // Increment profile questions stats
      const userRef = doc(db, "users", user.uid);
      const currentQuestions = userProfile.questionsCount + 1;
      const updatedBadges = [...userProfile.badges];
      
      // Unlock badge Quiz Prepper/Top Contributor if question goal is met
      if (currentQuestions >= 3 && !updatedBadges.includes("Top Contributor")) {
        updatedBadges.push("Top Contributor");
        triggerUnlockCelebration("Top Contributor");
      }

      await updateDoc(userRef, {
        questionsCount: increment(1),
        points: increment(15), // Post gets 15 points
        badges: updatedBadges
      });

      setUserProfile(prev => ({ 
        ...prev, 
        questionsCount: currentQuestions,
        points: prev.points + 15,
        badges: updatedBadges
      }));

      // Reset form
      setNewPostTitle("");
      setNewPostContent("");
      setIsAsking(false);

      window.dispatchEvent(new CustomEvent('stea-notify', {
        detail: { type: 'success', title: 'Post Released', message: 'Swali lako limetumwa kikamilifu kwenye jukwaa.' }
      }));
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Submit Answer to Discussion Thread
  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswerContent.trim() || !activeThread) return;

    try {
      const answersRef = collection(db, "communities_answers");
      const answerVal = {
        postId: activeThread.id,
        content: newAnswerContent.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        authorPhoto: user.photoURL || "",
        upvotes: 0,
        upvotedBy: [],
        isHelpful: false,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(answersRef, answerVal);

      // Increment total answers count on post thread with simple transaction
      const postRef = doc(db, "communities_posts", activeThread.id);
      await updateDoc(postRef, {
        answersCount: increment(1)
      });

      // Update student points & counts
      const userRef = doc(db, "users", user.uid);
      const currentAnswers = userProfile.points + 10; // 10 points per answer
      await updateDoc(userRef, {
        answersCount: increment(1),
        points: increment(10),
      });

      setUserProfile(prev => ({
        ...prev,
        answersCount: prev.answersCount + 1,
        points: prev.points + 10,
      }));

      setNewAnswerContent("");
      window.dispatchEvent(new CustomEvent('stea-notify', {
        detail: { type: 'success', title: 'Jibu Limewasilishwa', message: 'Hongera sana! Umepata Points 10 kwa kujibu swali la mwanafunzi.' }
      }));
    } catch (err) {
      console.error("Error posting answer:", err);
    }
  };

  // Upvote Thread
  const handleVoteThread = async (postId, upvotedBy = [], e) => {
    e.stopPropagation();
    if (!user) return;
    
    const postRef = doc(db, "communities_posts", postId);
    const hasUpvoted = upvotedBy.includes(user.uid);

    try {
      if (hasUpvoted) {
        await updateDoc(postRef, {
          upvotedBy: arrayRemove(user.uid),
          upvotes: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          upvotedBy: arrayUnion(user.uid),
          upvotes: increment(1)
        });
      }
    } catch (err) {
      console.error("Error voting thread:", err);
    }
  };

  // Upvote Answer
  const handleVoteAnswer = async (ansId, upvotedBy = []) => {
    if (!user) return;
    const ansRef = doc(db, "communities_answers", ansId);
    const hasUpvoted = upvotedBy.includes(user.uid);

    try {
      if (hasUpvoted) {
        await updateDoc(ansRef, {
          upvotedBy: arrayRemove(user.uid),
          upvotes: increment(-1)
        });
      } else {
        await updateDoc(ansRef, {
          upvotedBy: arrayUnion(user.uid),
          upvotes: increment(1)
        });
      }
    } catch (err) {
      console.error("Error voting answer:", err);
    }
  };

  // Mark/Toggle Answer as Helpful (StackOverflow style verification)
  const handleToggleHelpful = async (ansItem) => {
    if (!user || user.uid !== activeThread.authorId) return; // Only Thread owner can review solutions
    
    const checkHelpful = !ansItem.isHelpful;
    const ansRef = doc(db, "communities_answers", ansItem.id);
    const postRef = doc(db, "communities_posts", activeThread.id);

    try {
      await updateDoc(ansRef, {
        isHelpful: checkHelpful
      });

      await updateDoc(postRef, {
        helpfulAnswerId: checkHelpful ? ansItem.id : ""
      });

      // Award additional 40 points to the genius peer who answered
      if (checkHelpful) {
        const peerRef = doc(db, "users", ansItem.authorId);
        await updateDoc(peerRef, {
          points: increment(40)
        });
        
        // Check if peer got awarded Top Teacher badge
        const peerSnap = await getDoc(peerRef);
        if (peerSnap.exists()) {
          const peerData = peerSnap.data();
          const pBadges = peerData.badges || [];
          if (!pBadges.includes("Top Teacher")) {
            pBadges.push("Top Teacher");
            await updateDoc(peerRef, { badges: pBadges });
          }
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        window.dispatchEvent(new CustomEvent('stea-notify', {
          detail: { 
            type: 'success', 
            title: 'Iliyoandaliwa kama Suluhisho! ✅', 
            message: `Umethibitisha jibu la ${ansItem.authorName} kuwa ni sahihi na la msaada!` 
          }
        }));
      }

      // Sync active thread state locally
      setActiveThread(prev => ({
        ...prev,
        helpfulAnswerId: checkHelpful ? ansItem.id : ""
      }));

    } catch (err) {
      console.error("Error marking answer helpful:", err);
    }
  };

  // Badges lists metadata state
  const badgesMetadata = [
    {
      id: "Quiz Master",
      label: "Quiz Master",
      desc: "Score high in classroom attendance quizzes.",
      criteria: "Fanya quiz 3+ ukitumia mfumo wa STEA Classroom",
      icon: "⚡",
      color: "#3b82f6",
      met: userProfile.quizzesCount >= 3,
      current: userProfile.quizzesCount,
      target: 3
    },
    {
      id: "Top Contributor",
      label: "Top Contributor",
      desc: "Post educational queries and study aids.",
      criteria: "Weka posts au maswali 3+ kwenye Study Forums",
      icon: "💬",
      color: "#ec4899",
      met: userProfile.questionsCount >= 3,
      current: userProfile.questionsCount,
      target: 3
    },
    {
      id: "Top Student",
      label: "Top Student",
      desc: "Broaden your academic profile with STEA courses.",
      criteria: "Jiunge na kozi 2+ za mafunzo (enrolled courses)",
      icon: "🎓",
      color: "#a855f7",
      met: enrolledCourses?.length >= 2,
      current: enrolledCourses?.length || 0,
      target: 2
    },
    {
      id: "Top Teacher",
      label: "Top Teacher",
      desc: "Give accurate academic guides to fellow students.",
      criteria: "Toa jibu lililowabadilishia mada ambalo litathibitishwa na mwanafunzi mwingine (Helpful Answer ✅)",
      icon: "🌟",
      color: "#10b981",
      met: userProfile.badges.includes("Top Teacher"),
      current: userProfile.badges.includes("Top Teacher") ? 1 : 0,
      target: 1
    },
    {
      id: "Scholarship Hunter",
      label: "Scholarship Hunter",
      desc: "Save and search educational scholarship details.",
      criteria: "Hifadhi au kagua scholarship yoyote kwenye mtandao wetu",
      icon: "🎯",
      color: "#f59e0b",
      met: userProfile.savedResourcesCount >= 1 || userProfile.badges.includes("Scholarship Hunter"),
      current: userProfile.savedResourcesCount,
      target: 1
    },
    {
      id: "STEA Ambassador",
      label: "STEA Ambassador",
      desc: "Help the community grow by inviting your school peers.",
      criteria: "Mwalike rafiki kuingia na kujisajili kwenye Program ya STEA",
      icon: "🔥",
      color: G,
      met: userProfile.referralsCount >= 1 || ambassadorStatus === "approved",
      current: userProfile.referralsCount,
      target: 1
    }
  ];

  // Filter threads by search and tags
  const filteredDiscussions = discussions.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "communities") {
      // Must exactly match current level / subject tag
      return matchesSearch && d.category === selectedGroup;
    }
    return matchesSearch;
  });

  const levelCommunities = ["Form 4 Students", "Form 6 Students", "University Students"];
  const subjectCommunities = ["Math", "Physics", "Chemistry", "Biology", "ICT", "Commerce"];

  if (!user) {
    return (
      <div style={{ minHeight: "85vh", display: "grid", placeItems: "center", background: "#05060a", color: "#fff" }}>
        <W style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: "bounce 2s infinite" }}>🎓</div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: isMobile ? 26 : 38, fontWeight: 900, marginBottom: 16 }}>
            Karibu Student Community Center 🇹🇿
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.6, fontSize: 15 }}>
            Mtandao mkubwa kabisa wa wanafunzi Tanzania. Unaweza kukusanya asilimia za maendeleo, kujibu maswali na marafiki, kupata Beji za heshima, na kujiunga na meza ya majadiliano!
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))}
            style={{ 
              background: G, color: "#111", border: "none", padding: "16px 44px", 
              borderRadius: 16, fontWeight: 900, fontSize: 16, cursor: "pointer",
              boxShadow: `0 8px 24px ${G}30`, transition: "all 0.2s"
            }}
          >
            Ingia kama Mwanafunzi (Login)
          </button>
        </W>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#05060a", color: "#fff", paddingTop: 40, paddingBottom: 120 }}>
      <AnimatedBackground />
      <W style={{ position: "relative", zIndex: 1 }}>
        
        {/* Profile Card Header Banner */}
        <div className="glass-card" style={{ padding: isMobile ? 18 : 28, borderRadius: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <STEAAvatar user={user} size="xl" alt="Your profile" />
              <div style={{ 
                position: "absolute", bottom: 0, right: 0, background: "#10b981", 
                width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center",
                border: "3px solid #0d111d"
              }}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </div>
            </div>

            <div style={{ flex: 1, textAlign: isMobile ? "center" : "left" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 900, margin: 0 }}>
                  {user.displayName || user.email.split("@")[0]}
                </h1>
                {ambassadorStatus === "approved" && (
                  <span style={{ background: `${G}20`, border: `1px solid ${G}`, color: G, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>
                     SWIFT AMBASSADOR ⚡
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: isMobile ? "center" : "flex-start", marginTop: 8, flexWrap: "wrap", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} color={G} />
                  <span>{userProfile.school || "School sio set"}</span>
                </div>
                <span>•</span>
                <span style={{ fontWeight: 800, color: "#a855f7" }}>{userProfile.educationLevel || "Form haija-set"}</span>
                <span>•</span>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "2px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontWeight: 800, color: G2 }}>
                  <span>⭐ {userProfile.points} Pts</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="glass" 
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <Settings size={16} /> Edit Student Profile
              </button>
            </div>
          </div>
        </div>

        {/* Global Action Subheader Tab Controls */}
        <div style={{ 
          display: "flex", 
          gap: 6, 
          overflowX: "auto", 
          paddingBottom: 8, 
          marginBottom: 32, 
          borderBottom: "1px solid rgba(255,255,255,0.05)" 
        }} className="no-scrollbar">
          {[
            { id: "dashboard", label: "Dashboard / Maendeleo", icon: Activity },
            { id: "communities", label: "Vikundi vya Masomo", icon: Users },
            { id: "Q&A", label: "Jukwaa la Q&A (Discussion)", icon: MessageSquare },
            { id: "badges", label: "Beji & Mafanikio", icon: Award },
            { id: "referrals", label: "Kituo cha Mialiko (Network)", icon: UserPlus }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isSel ? `${G}18` : "transparent",
                  color: isSel ? G2 : "rgba(255,255,255,0.45)",
                  border: isSel ? `1px solid ${G}40` : "1px solid transparent",
                  borderRadius: 16,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
              >
                <Icon size={16} color={isSel ? G : "rgba(255,255,255,0.4)"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================
            TAB 1: STUDENT DASHBOARD & DEVELOPMENT OVERVIEW
            ======================================================== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2.2fr 1fr", gap: 28 }}>
            
            {/* Left Main Activities */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              
              {/* Classroom Attendance Smart Badge Card wrapper */}
              <AttendanceCard onClick={() => goPage("attendance")} />

              {/* Enrolled Courses list with Quick Action */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div className="badge-shine glass" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "5px 14px" }}>
                    <BookOpen size={13} color={G} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: G, letterSpacing: 1.5, textTransform: "uppercase" }}>
                      MASOMO NILIYOJIUNGA NAYO
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {coursesLoading ? (
                    [1, 2].map(i => <div key={i} style={{ height: 110, background: "rgba(255,255,255,.02)", borderRadius: 20 }} />)
                  ) : enrolledCourses.length > 0 ? (
                    enrolledCourses.map(e => (
                      <div key={e.id} className="glass-card" style={{ borderRadius: 20, padding: 18, display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ width: 80, height: 50, background: "rgba(255,255,255,.05)", borderRadius: 10, overflow: "hidden" }}>
                          <img src={e.courseImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{e.courseTitle}</h4>
                          <div style={{ marginTop: 8, height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, width: "100%" }}>
                            <div style={{ height: "100%", width: `${e.progress || 0}%`, background: G, borderRadius: 3 }} />
                          </div>
                          <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,.4)", display: "flex", justifyContent: "space-between" }}>
                            <span>{e.progress || 0}% Complete</span>
                            <span>Somo Liingine: {e.nextLesson || "Topic 1: Intro"}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => goPage(`course-detail?id=${e.courseId}`)}
                          style={{ background: "rgba(255,255,255,.05)", border: "none", color: G, width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <PlayCircle size={20} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 40, textAlign: "center", background: "rgba(255,255,255,.01)", borderRadius: 24, border: "1px dashed rgba(255,255,255,.08)" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>Unalo somo lililosajiliwa</h3>
                      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginBottom: 18, maxWidth: 360, margin: "0 auto 16px" }}>
                        Anza kujifunza masomo muhimu na thabiti ya kiakademia sasa!
                      </p>
                      <button 
                        onClick={() => goPage("courses")}
                        style={{ background: "rgba(255,255,255,.05)", color: G, border: `1px solid ${G}30`, padding: "8px 20px", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                      >
                        Gundua Masomo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Contribution history & timeline */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div className="badge-shine glass" style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "5px 14px" }}>
                    <TrendingUp size={13} color="#a855f7" />
                    <span style={{ fontSize: 9, fontWeight: 900, color: "#a855f7", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      HISTORIA YA SHUGHULI / MICHANGO (timeline)
                    </span>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 20, borderRadius: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: G }} />
                        <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 6 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Umejisajili Kwenye Kituo cha Wanafunzi</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>Umepokea Zawadi ya Points 100 kwa usajili wako kamilifu.</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#a855f7" }} />
                        <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 6 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Uliza / Jibu Masomo</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                          Umesaidia kuanzisha {userProfile.questionsCount} threads za kusaidia wenzako na kuandika {userProfile.answersCount} majibu.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Alika & Kua na STEA</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
                          Umealika {userProfile.referralsCount} marafiki chini ya namba yako kujiunga marafiki Tz nzima!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side Stats & Streak Bento Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              
              {/* Daily learning streak card */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,166,35,0.1)", display: "grid", placeItems: "center" }}>
                    <TrendingUp size={16} color={G} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>Daily learning streak</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Streak ya kusoma kila siku</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginBottom: 16 }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700 }}>{d}</span>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: "50%", 
                        background: i < 3 ? `linear-gradient(to bottom, #f3a623, #ff4c29)` : "rgba(255,255,255,0.04)",
                        border: i < 3 ? "none" : "1px solid rgba(255,255,255,0.06)",
                        display: "grid", placeItems: "center", fontSize: 10, fontWeight: 900, color: i < 3 ? "#000" : "rgba(255,255,255,0.3)"
                      }}>
                        {i < 3 ? "✓" : i + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.5, margin: 0 }}>
                  Endelea kufungua masomo kwa siku husika ili kukuza streak yako na kupata badg ya high efficiency.
                </p>
              </div>

              {/* Achievements Badges summary list */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={16} color={G} /> Beji Zangu Unlocked
                  </h3>
                  <button 
                    onClick={() => setActiveTab("badges")} 
                    style={{ background: "none", border: "none", color: G, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                  >
                    View All
                  </button>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {userProfile.badges.length > 0 ? (
                    userProfile.badges.map((badge, idx) => {
                      const details = badgesMetadata.find(b => b.id === badge) || { icon: "🏆", color: G };
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: `${details.color}15`, 
                            border: `1px solid ${details.color}40`, 
                            borderRadius: 12, 
                            padding: "6px 12px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 6, 
                            fontSize: 11, 
                            fontWeight: 800, 
                            color: details.color 
                          }}
                        >
                          <span>{details.icon}</span>
                          <span>{details.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: "center", width: "100%", padding: "16px 0", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                      Bado hujafungua beji yoyote. Anza kualika marafiki au fanya majaribio kulainisha beji kwanza!
                    </div>
                  )}
                </div>
              </div>

              {/* Saved resources and Bookmarks checklist */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Bookmark size={15} color="#ec4899" /> Rasilimali Zilizohifadhiwa (Bookmarks)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ background: "rgba(96,165,250,0.1)", width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", color: "#60a5fa" }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Mathematics Form 4 Past Papers 2024</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>Karata ya Mtihani wa Necta</div>
                    </div>
                    <button 
                      onClick={() => goPage("past-papers")}
                      style={{ background: "none", border: "none", color: G, strokeWidth: 2, cursor: "pointer" }}
                    >
                      <PlayCircle size={18} />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ background: "rgba(245,158,11,0.1)", width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", color: "#f59e0b" }}>
                      <Award size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>Darmouth Fellowship Program</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2 }}>Scholarship ya Ndani</div>
                    </div>
                    <button 
                      onClick={() => goPage("scholarships")}
                      style={{ background: "none", border: "none", color: G, strokeWidth: 2, cursor: "pointer" }}
                    >
                      <PlayCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: VIKUNDI VYA MASOMO (SUBJECTS & LEVEL FORUMS)
            ======================================================== */}
        {activeTab === "communities" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: 28 }}>
            
            {/* Sidebar with Subject & Level Group Selectors */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Type Sub-tabs (Levels vs Subjects) */}
              <div className="glass" style={{ display: "flex", padding: 4, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <button
                  onClick={() => setSelectedSubTab("level")}
                  style={{
                    flex: 1,
                    background: selectedSubTab === "level" ? "rgba(255,255,255,0.06)" : "transparent",
                    color: selectedSubTab === "level" ? "#fff" : "rgba(255,255,255,0.4)",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  OLevel & Uni
                </button>
                <button
                  onClick={() => setSelectedSubTab("subject")}
                  style={{
                    flex: 1,
                    background: selectedSubTab === "subject" ? "rgba(255,255,255,0.06)" : "transparent",
                    color: selectedSubTab === "subject" ? "#fff" : "rgba(255,255,255,0.4)",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Masomo (Subjects)
                </button>
              </div>

              {/* Group selectors list */}
              <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 8, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 8 : 0 }} className="no-scrollbar">
                {(selectedSubTab === "level" ? levelCommunities : subjectCommunities).map((name) => {
                  const isS = selectedGroup === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedGroup(name)}
                      style={{
                        background: isS ? `${G}12` : "rgba(255,255,255,0.01)",
                        color: isS ? G : "rgba(255,255,255,0.5)",
                        border: isS ? `1px solid ${G}30` : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        padding: "14px 18px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        width: isMobile ? "auto" : "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        whiteSpace: "nowrap"
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isS ? G : "rgba(255,255,255,0.2)" }} />
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Feed Feed for selected Level/Subject Community */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Cover Banner for Selected Group */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 24, border: `1px solid ${G}20`, background: `linear-gradient(135deg, ${CARD_BG} 0%, rgba(245,166,35,0.05) 100%)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>👥 {selectedGroup} Forum</h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 0" }}>
                      Wapate wanafunzi wenzako wanaosoma kundi moja la {selectedGroup} hapa Tanzania.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewPostCategory(selectedGroup);
                      setIsAsking(true);
                    }}
                    style={{
                      background: G, color: "#000", border: "none", display: "flex", alignItems: "center", gap: 6,
                      borderRadius: 12, padding: "10px 16px", fontSize: 12, fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    <Plus size={16} strokeWidth={3} /> Post thread hapa
                  </button>
                </div>
              </div>

              {/* Feed posts list */}
              {discussionsLoading ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div className="profile-empty">Kupakia jukwaa...</div>
                </div>
              ) : filteredDiscussions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: i === 0 ? 16 : 16 }}>
                  {filteredDiscussions.map((d, i) => (
                    <div 
                      key={d.id} 
                      onClick={() => setActiveThread(d)}
                      className="glass-card zoom-hover" 
                      style={{ padding: 18, borderRadius: 20, cursor: "pointer", transition: "transform 0.15s, background 0.1s" }}
                    >
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                          display: "grid", placeItems: "center", fontSize: 14, fontWeight: 900, color: G
                        }}>
                          {d.authorPhoto ? <img src={d.authorPhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : d.authorName?.charAt(0).toUpperCase()}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "2px 8px", color: G2, fontWeight: 800 }}>
                            {d.category}
                          </span>
                          <h3 style={{ fontSize: 15, fontWeight: 900, margin: "8px 0 6px" }}>{d.title}</h3>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5, margin: "0 0 12px" }}>
                            {d.content}
                          </p>

                          <div style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                            <span>Na: {d.authorName}</span>
                            <span>•</span>
                            <span>{timeAgo(d.createdAt)}</span>
                          </div>
                        </div>

                        {/* Voting & answers info on card edge */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                          <button 
                            onClick={(e) => handleVoteThread(d.id, d.upvotedBy || [], e)}
                            style={{ 
                              background: d.upvotedBy?.includes(user?.uid) ? `${G}18` : "rgba(255,255,255,0.03)", 
                              borderRadius: 10, width: 44, height: 44, border: "1px solid rgba(255,255,255,0.06)",
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: d.upvotedBy?.includes(user?.uid) ? G : "#fff"
                            }}
                          >
                            <ThumbsUp size={13} />
                            <span style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>{d.upvotes || 0}</span>
                          </button>

                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontStyle: "normal", fontSize: 12, color: d.helpfulAnswerId ? "#10b981" : "rgba(255,255,255,0.45)" }}>
                            <MessageSquare size={13} />
                            <span style={{ fontWeight: 800 }}>{d.answersCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 48, textAlign: "center", background: "rgba(255,255,255,.01)", borderRadius: 24, border: "1px dashed rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>💬</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>Hakuna posts za {selectedGroup} bado</h3>
                  <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, marginBottom: 20, maxWidth: 320, margin: "0 auto 16px" }}>
                    Kuwa wa kwanza kuanzisha mada au kusaidiana maswali na marafiki wa kundi hili!
                  </p>
                  <button
                    onClick={() => {
                      setNewPostCategory(selectedGroup);
                      setIsAsking(true);
                    }}
                    style={{ background: "rgba(255,255,255,.05)", color: G, border: `1px solid ${G}40`, padding: "8px 24px", borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                  >
                    Post Somo Lako la Kwanza
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: UNIFIED DISCUSSION SYSTEM (STACK OVERFLOW FOR STUDENTS)
            ======================================================== */}
        {activeTab === "Q&A" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* QA Board Control Header */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  💬 Jukwaa Kuu la Majadiliano na Q&A
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 0" }}>
                  Toleo letu mbadala la Stack Overflow. Uliza maswali ya kazi za shule au chuo na upate majibu ya kuelezeka sahihi!
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, width: isMobile ? "100%" : "auto" }}>
                <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "auto" : 240 }}>
                  <Search size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Tafuta majadiliano..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14, padding: "12px 16px 12px 42px", color: "#fff", fontSize: 14, outline: "none"
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsAsking(true)}
                  style={{
                    background: G, color: "#000", border: "none", fontWeight: 900, borderRadius: 14, padding: "0 22px", height: 46, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
                  }}
                >
                  <Plus size={16} strokeWidth={3} /> Anzisha Mada
                </button>
              </div>
            </div>

            {/* Questions lists Grid layout */}
            {discussionsLoading ? (
              <div style={{ padding: 60, textAlign: "center" }}>Kusoma jukwaa la Q&A...</div>
            ) : filteredDiscussions.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                {filteredDiscussions.map((d) => (
                  <div 
                    key={d.id} 
                    onClick={() => setActiveThread(d)}
                    className="glass-card zoom-hover" 
                    style={{ padding: 20, borderRadius: 20, cursor: "pointer", border: d.helpfulAnswerId ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      
                      {/* Left stack-overflow style votes block */}
                      <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", gap: 12, minWidth: 64, alignSelf: isMobile ? "flex-start" : "center", background: "rgba(255,255,255,0.01)", padding: "10px", borderRadius: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: G2 }}>{d.upvotes || 0}</div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase" }}>Votes</div>
                        </div>
                        
                        <div style={{ textAlign: "center", background: d.helpfulAnswerId ? "#10b98120" : "transparent", padding: d.helpfulAnswerId ? "4px 8px" : 0, borderRadius: 6, border: d.helpfulAnswerId ? "1px solid #10b98140" : "none" }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: d.helpfulAnswerId ? "#10b981" : "rgba(255,255,255,0.5)" }}>{d.answersCount || 0}</div>
                          <div style={{ fontSize: 9, color: d.helpfulAnswerId ? "#10b981" : "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase" }}>
                            {d.helpfulAnswerId ? "Solved" : "Answers"}
                          </div>
                        </div>
                      </div>

                      {/* Thread detail representation */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", color: G, fontWeight: 800 }}>
                            {d.category}
                          </span>
                          {d.helpfulAnswerId && (
                            <span style={{ fontSize: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "2px 8px", color: "#10b981", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                              ✓ JIBU SAHIHI LIMEKUBALIWA
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px", color: "#fff", lineHeight: 1.4 }}>
                          {d.title}
                        </h3>

                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                          {d.content}
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>
                              {d.authorName?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Na: <strong>{d.authorName}</strong></span>
                          </div>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Mada Ilianza {timeAgo(d.createdAt)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 50, textAlign: "center", background: "rgba(255,255,255,0.01)", borderRadius: 24, border: "1px dashed rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Hakuna vigezo vya majadiliano vinavyolingana</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>Anzisha swali lako kwanza ili kufunua uwezekano mpya!</p>
                <button
                  onClick={() => setIsAsking(true)}
                  style={{ background: G, color: "#111", border: "none", padding: "10px 24px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  Anzisha Swali Lako Sasa
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            TAB 4: ACHIEVEMENT BADGES & REWARDS CORNER
            ======================================================== */}
        {activeTab === "badges" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Badges explanation banner */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: `linear-gradient(135deg, ${CARD_BG} 0%, rgba(168,85,247,0.04) 100%)` }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                🏆 Beji za Mafanikio na Zawadi (Achievements)
              </h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                Kamilisha majukumu ya kila siku, jibu maswali ya wenzako, fanya majaribio, na ualike marafiki ili kulainisha beji adimu za STEA Elite na kupata Points zaidi!
              </p>
            </div>

            {/* Badges Bento Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20 }}>
              {badgesMetadata.map((badge) => {
                const isUnlocked = userProfile.badges.includes(badge.id) || badge.met;
                return (
                  <div 
                    key={badge.id} 
                    className="glass-card" 
                    style={{ 
                      padding: 24, 
                      borderRadius: 24, 
                      position: "relative", 
                      overflow: "hidden",
                      border: isUnlocked ? `1px solid ${badge.color}40` : "1px solid rgba(255,255,255,0.04)",
                      background: isUnlocked ? `linear-gradient(185deg, ${CARD_BG} 0%, ${badge.color}06 100%)` : "rgba(255,255,255,0.01)"
                    }}
                  >
                    {/* Lock / Glimmer overlay if locked */}
                    {!isUnlocked && (
                      <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                        🔒 LOCKED
                      </div>
                    )}

                    {isUnlocked && (
                      <div style={{ position: "absolute", top: 14, right: 14, background: `${badge.color}20`, borderRadius: 10, padding: "4px 10px", fontSize: 10, fontWeight: 900, color: badge.color, display: "flex", alignItems: "center", gap: 4 }}>
                        ✨ UNLOCKED
                      </div>
                    )}

                    {/* Badge Icon circle */}
                    <div style={{ 
                      width: 56, height: 56, borderRadius: 16, 
                      background: isUnlocked ? `${badge.color}20` : "rgba(255,255,255,0.03)", 
                      display: "grid", placeItems: "center", fontSize: 28, marginBottom: 20,
                      boxShadow: isUnlocked ? `0 8px 20px ${badge.color}25` : "none"
                    }}>
                      {badge.icon}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 6px", color: isUnlocked ? "#fff" : "rgba(255,255,255,0.4)" }}>{badge.label}</h3>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", height: 36, overflow: "hidden" }}>{badge.desc}</p>
                    
                    {/* Badge criteria check */}
                    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, marginBottom: 6, color: "rgba(255,255,255,0.5)" }}>
                        <span>Lengo: Progress</span>
                        <span>{badge.current}/{badge.target}</span>
                      </div>
                      
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, width: "100%", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min((badge.current / badge.target) * 100, 100)}%`, background: badge.color, borderRadius: 2 }} />
                      </div>
                      
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "8px 0 0", lineHeight: 1.4 }}>
                         <strong>Vigezo:</strong> {badge.criteria}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 5: REFERRAL LOOP & CAMPUS AMBASSADORS PORTAL
            ======================================================== */}
        {activeTab === "referrals" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1.2fr", gap: 28 }}>
            
            {/* Left referral control center */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              
              {/* Dynamic Referral link sharing element */}
              <div className="glass-card" style={{ padding: 24, borderRadius: 24, border: `1px solid ${G}20`, background: `linear-gradient(135deg, ${CARD_BG} 0%, rgba(245,166,35,0.04) 100%)` }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>🤝 Alika Rafiki & Nufaika Pamoja</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "6px 0 20px", lineHeight: 1.5 }}>
                  Alika wanafunzi wenzako kujiunga na STEA. Kila rafiki anayejisajili kupitia kiunganishi chako atapata Points 150 na wewe utapokea Points 100 na kulainisha beji ya <strong>STEA Ambassador</strong>!
                </p>

                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 8, fontSize: 10, fontWeight: 800, color: G2 }}>
                    LINK YAKO
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`https://stea-website.web.app/ref?by=${user.uid}`}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: 12, outline: "none", flex: 1 }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://stea-website.web.app/ref?by=${user.uid}`);
                      window.dispatchEvent(new CustomEvent('stea-notify', {
                        detail: { type: 'success', title: 'Kiunganishi Kimekopwa', message: 'Invite link imehifadhiwa kwenye clipboard.' }
                      }));
                    }}
                    style={{ background: "none", border: "none", color: G, cursor: "pointer" }}
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <a
                    href={`https://api.whatsapp.com/send?text=Kaka/Dada soma nasi bure STEA Swahili Tech! Past Papers, Notes zilizohaririwa, na miongozo ya HESLB vyote mahali pamoja. Kagua hapa na upate zawadi ya kuanzia: https://stea-website.web.app/ref?by=${user.uid}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1, background: "#25d366", color: "#000", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      borderRadius: 12, padding: "12px", fontSize: 12, fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    <Share2 size={16} /> Shiriki WhatsApp
                  </a>

                  <button
                    disabled={simulateLoading}
                    onClick={handleInviteSimulate}
                    style={{
                      flex: 1, background: "rgba(255,255,255,0.03)", color: G, border: `1px solid ${G}30`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      borderRadius: 12, padding: "12px", fontSize: 12, fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    {simulateLoading ? "Inasajili..." : "Simulate Peer Registration 🤖"}
                  </button>
                </div>
              </div>

              {/* Referrals list tables */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={16} color={G} /> Marafiki Waliojisajili ({myReferrals.length})
                </h3>

                {referralsLoading ? (
                  <div style={{ padding: 32, textAlign: "center" }}>Kusoma orodha...</div>
                ) : myReferrals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {myReferrals.map((ref) => (
                      <div key={ref.id} className="glass-card" style={{ padding: 14, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800 }}>{ref.refereeName || "STEA Student"}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{ref.refereeEmail}</div>
                        </div>

                        <span style={{ fontSize: 10, background: "#10b98115", border: "1px solid #10b98130", color: "#10b981", fontWeight: 900, padding: "3px 10px", borderRadius: 20 }}>
                          Joined ✅ (+100 Pts)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 36, textAlign: "center", background: "rgba(255,255,255,0.01)", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>Bado hakuna rafiki aliyetumia msimbo wako. Shiriki leo kwenye makundi ya shule!</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Campus Ambassador recruits card block */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* Ambassador program layout */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(168,85,247,0.1)", display: "grid", placeItems: "center", marginBottom: 20 }}>
                  <Megaphone size={20} color="#a855f7" />
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 10px" }}>STEA Campus Ambassador Program</h3>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 20px" }}>
                  Je, wewe ni kiongozi au mshawishi shuleni kwako au chuoni kukuza jina lake? Jiunge sasa na kuwa balozi wetu rasmi wa STEA. Pata mafunzo, beji maalum ya Balozi, zawadi za kila mwezi, na vyeti vya upendeleo!
                </p>

                {/* Status indicator / Application forms */}
                {ambassadorStatus === "pending" ? (
                  <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <Clock size={16} color="#f59e0b" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>Ombi lako linatazamwa ⏳</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Tunapitia mikakati yako ya kueneza STEA.</div>
                    </div>
                  </div>
                ) : ambassadorStatus === "approved" ? (
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle size={16} color="#10b981" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981" }}>Balozi Rasmi 🌟 (Approved Elite)</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Asante kwa kukubali kuwa kiongozi wetu Tanzania!</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAmbassadorModal(true)}
                    style={{
                      width: "100%", background: "linear-gradient(to right, #f3a623, #ff4c29)", color: "#000", border: "none",
                      borderRadius: 12, padding: "12px", fontSize: 12, fontWeight: 900, cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                     Omba kuwa Campus Ambassador sasa!
                  </button>
                )}
              </div>

              {/* Recognition list of Campus ambassadors */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={15} color={G} /> Mabalozi Wakuu Tz (Leaderboard)
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { name: "Salum Masumbuko", school: "University of Dar es Salaam", count: 24, rank: "1" },
                    { name: "Loveness Mtambo", school: "Mzumbe University", count: 18, rank: "2" },
                    { name: "Faraji Hamisi", school: "Dodoma Secondary School", count: 12, rank: "3" }
                  ].map((amb, idx) => (
                    <div key={idx} style={{ display: "flex", justify: "space-between", align: "center", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${G}20`, color: G, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>
                          {amb.rank}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{amb.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>{amb.school}</div>
                        </div>
                      </div>
                      <div style={{ alignSelf: "center" }}>
                        <span style={{ fontSize: 10, color: G2, fontWeight: 800 }}>{amb.count} Refs invited</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </W>

      {/* ========================================================
          MODAL 1: EDIT PROFILE BOX
          ======================================================== */}
      {isEditingProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16, zIndex: 10000 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 440, padding: 24, borderRadius: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>✏️ Hariri Taarifa Zako</h3>
              <button onClick={() => setIsEditingProfile(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Jina la Shule / Chuo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mf. Jangwani High School, au UDSM"
                  value={profileSchool}
                  onChange={(e) => setProfileSchool(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Kiwango cha Masomo (Education Level)
                </label>
                <select
                  value={profileLevel}
                  onChange={(e) => setProfileLevel(e.target.value)}
                  style={{
                    width: "100%", background: "#1c2030", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                >
                  <option value="Form 4">Form 4 Students</option>
                  <option value="Form 6">Form 6 Students</option>
                  <option value="University">University Students</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", color: "#fff", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: G, color: "#000", border: "none", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  Hifadhi Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ASK A QUESTION / SUBMIT THREAD FORM
          ======================================================== */}
      {isAsking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16, zIndex: 10000 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 520, padding: 24, borderRadius: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>💬 Anzisha Swali au Mada</h3>
              <button onClick={() => setIsAsking(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAskQuestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Mada Kuu (Question Title)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mf. Jinsi ya kutafuta derivative ya f(x) = sin(x)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Somo au Kikundi Kinachohusika
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  style={{
                    width: "100%", background: "#1c2030", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                >
                  <optgroup label="Daraja la Shule">
                    {levelCommunities.map(l => <option key={l} value={l}>{l}</option>)}
                  </optgroup>
                  <optgroup label="Somo/Topic Maalum">
                    {subjectCommunities.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Eleza kwa Kina Swali Lako (Content / Body)
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Andika swali lako kwa kina hapa. Unaweza kuweka mifano au kueleza shida ipo wapi husika..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13, resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAsking(false)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", color: "#fff", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: G, color: "#000", border: "none", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  Tuma Swali (+15 Pts)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: DISCUSSIONS SINGLE THREAD DETAILED MODAL
          ======================================================== */}
      {activeThread && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16, zIndex: 10000 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 660, maxHeight: "90vh", overflowY: "auto", padding: 24, borderRadius: 24 }}>
            
            {/* Header detail close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", color: G, fontWeight: 800 }}>
                  {activeThread.category}
                </span>
              </div>
              <button onClick={() => setActiveThread(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Main Thread details */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${G}18`, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 900, color: G }}>
                {activeThread.authorPhoto ? <img src={activeThread.authorPhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : activeThread.authorName?.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.4 }}>
                  {activeThread.title}
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", whitespace: "pre-line", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {activeThread.content}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.35)", flexWrap: "wrap", gap: 8 }}>
                  <span>Iliandikwa na: <strong>{activeThread.authorName}</strong></span>
                  <span>Mada Ilianza {timeAgo(activeThread.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Answer Feed lists */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 900, margin: "0 0 16px", color: G2 }}>
                Majibu kutoka kwa Wanafunzi ({threadAnswers.length})
              </h4>

              {threadAnswers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {threadAnswers.map((ans) => {
                    const isOP = user.uid === activeThread.authorId;
                    return (
                      <div key={ans.id} style={{ 
                        padding: 16, 
                        borderRadius: 16, 
                        background: ans.isHelpful ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.02)", 
                        border: ans.isHelpful ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.04)" 
                      }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800 }}>
                            {ans.authorName?.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{ans.authorName}</span>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{timeAgo(ans.createdAt)}</span>
                            </div>

                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: "6px 0 12px" }}>
                              {ans.content}
                            </p>

                            {/* Verification Toggle helper and votes */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              
                              <div style={{ display: "flex", gap: 12 }}>
                                <button 
                                  onClick={() => handleVoteAnswer(ans.id, ans.upvotedBy || [])}
                                  style={{ 
                                    background: "none", border: "none", color: ans.upvotedBy?.includes(user.uid) ? G : "rgba(255,255,255,0.45)", 
                                    cursor: "pointer", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 
                                  }}
                                >
                                  <ThumbsUp size={12} /> Upvote ({ans.upvotes || 0})
                                </button>
                              </div>

                              {/* Helpful check status */}
                              {ans.isHelpful ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10b981", fontSize: 11, fontWeight: 900 }}>
                                  <CheckCircle2 size={14} /> JIBU SAHIHI (SOLVED)
                                  {isOP && (
                                    <button 
                                      onClick={() => handleToggleHelpful(ans)}
                                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: 10, cursor: "pointer", textDecoration: "underline" }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              ) : (
                                isOP && (
                                  <button
                                    onClick={() => handleToggleHelpful(ans)}
                                    style={{ 
                                      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981",
                                      borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 800, cursor: "pointer" 
                                    }}
                                  >
                                    Accept Solution ✓
                                  </button>
                                )
                              )}

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: "center", background: "rgba(255,255,255,0.01)", borderRadius: 16 }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>Bado hakuna jibu kwenye mada hii. Kuwa wa kwanza kujibu!</p>
                </div>
              )}
            </div>

            {/* Post Answer Form */}
            <form onSubmit={handlePostAnswer} style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#fff" }}>Toa Jibu Lako la Kuelimisha</h4>
              <textarea
                required
                rows={3}
                placeholder="Andika jibu au ufafanuzi wako hapa..."
                value={newAnswerContent}
                onChange={(e) => setNewAnswerContent(e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13, resize: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  alignSelf: "flex-end", background: G, color: "#000", border: "none",
                  borderRadius: 10, padding: "10px 24px", fontSize: 12, fontWeight: 900, cursor: "pointer"
                }}
              >
                Tuma Jibu (+10 Pts)
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CAMPUS AMBASSADOR APPLICATION FORM
          ======================================================== */}
      {showAmbassadorModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "grid", placeItems: "center", padding: 16, zIndex: 10000 }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: 460, padding: 24, borderRadius: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>📢 Omba kuwa Campus Ambassador</h3>
              <button onClick={() => setShowAmbassadorModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyAmbassador} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Jina la Chuo au Shule Upendayo Kuwakilisha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mf. University of Dar es Salaam (UDSM)"
                  value={ambassadorSchool}
                  onChange={(e) => setAmbassadorSchool(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Kiwango chako cha Elimu Sasa
                </label>
                <select
                  value={ambassadorLevel}
                  onChange={(e) => setAmbassadorLevel(e.target.value)}
                  style={{
                    width: "100%", background: "#1c2030", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                >
                  <option value="Secondary School">Secondary School (High School)</option>
                  <option value="University">Chuo Kikuu (University)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Nia na Mikakati yako kwa STEA
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Kwa nini unataka kuwa balaozi wetu na una mpango gani gani wa kueneza jina la STEA shuleni kwako..."
                  value={ambassadorReason}
                  onChange={(e) => setAmbassadorReason(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13, resize: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  Social media links / Instagram handle (Ukiyataka)
                </label>
                <input
                  type="text"
                  placeholder="Mf. @isaya_shayo au linkedin.com/in/username"
                  value={ambassadorSocials}
                  onChange={(e) => setAmbassadorSocials(e.target.value)}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: 12, color: "#fff", outline: "none", fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAmbassadorModal(false)}
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "none", color: "#fff", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: G, color: "#000", border: "none", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  Tuma Ombi 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
