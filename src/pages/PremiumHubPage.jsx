import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Zap,
  Check,
  ChevronRight,
  ShieldCheck,
  Users,
  CreditCard,
  Briefcase,
  GraduationCap,
  Sparkles,
  Search,
  MapPin,
  TrendingUp,
  Download,
  Award,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Share2,
  Lock,
  Compass,
  ArrowRight,
  Calculator,
  QrCode,
  FileCheck,
  Megaphone,
  UserCheck,
  Filter,
  BarChart3,
  BookOpen,
  FolderLock
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Color constants matching the rest of STEA premium style
const G = "#F5A623";
const G_LIGHT = "#FFD17C";
const CARD_BG = "rgba(255, 255, 255, 0.03)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";

// Mock data representing university/education listings clearly labeled as "Sponsored"
const SPONSORED_LISTINGS = [
  {
    id: "spon-1",
    title: "Master of Science in Artificial Intelligence",
    institution: "University of Dar es Salaam (CoICT)",
    type: "Degree Program",
    badge: "Sponsored",
    description: "Unlock future career potential with Tanzania's premium AI certification. Scholarships up to 30% available for early applicant groups.",
    link: "/university-guide",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "spon-2",
    title: "Advanced Web & Cyber Security Bootcamp",
    institution: "Kibo School of Digital Technologies",
    type: "Professional Course",
    badge: "Sponsored",
    description: "Earn an industry-recognized certificate in cloud security in partnership with Cisco and STEA Education platforms.",
    link: "/courses",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: "spon-3",
    title: "Presidential Merit Scholarship 2026",
    institution: "Alliance of Education Companies",
    type: "Scholarship",
    badge: "Sponsored",
    description: "Fully funding computer engineering and medical programs for first-generation university scholars from rural Zanzibar and Mbeya.",
    link: "/scholarships",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop"
  }
];

// Jobs and Internship listings
const MOCK_JOBS = [
  {
    id: "job-1",
    title: "Digital Marketing Intern",
    company: "Trinova Technology Solutions",
    location: "Dar es Salaam / Remote",
    type: "Internship",
    salary: "TZS 350,000 / mwnz",
    featured: true,
    desc: "Help drive social content curation. Ideal for university students looking for practical skill building.",
    skills: ["SEO", "Social Content", "Canva"]
  },
  {
    id: "job-2",
    title: "Python Software Developer",
    company: "Bongo Tech Labs",
    location: "Remote (TZ/KE)",
    type: "Remote Opportunity",
    salary: "TZS 1,200,000 - 1,800,000",
    featured: true,
    desc: "Develop integration routes, database servers, and micro-API frameworks matching client requests.",
    skills: ["Python", "FastAPI", "SQL"]
  },
  {
    id: "job-3",
    title: "Assistant Academic Tutor",
    company: "STEA Study Network",
    location: "Arusha / Hybrid",
    type: "Part-time Job",
    salary: "TZS 450,000 / mwnz",
    featured: false,
    desc: "Assist high school students with notes and past papers prep for upcoming NECTA advanced level exams.",
    skills: ["Physics/Che", "Communication"]
  },
  {
    id: "job-4",
    title: "Graduate Analyst Program",
    company: "CRDB Bank Plc",
    location: "Dar es Salaam",
    type: "Graduate Program",
    salary: "TZS 900,000 / mwnz",
    featured: false,
    desc: "Fast-track career foundation at one of East Africa's leading financial centers.",
    skills: ["Finance", "Excel", "Data Models"]
  }
];

// Study products in Digital Marketplace
const DIGITAL_PRODUCTS = [
  {
    id: "prod-1",
    title: "Form Six Physics Masterclass Book",
    creator: "Mwalimu James (Physics Expert)",
    category: "Exam Preparation Packs",
    price: "TZS 4,500",
    rating: "4.9",
    downloads: 382,
    commission: "STEA Commission: TZS 900 (20%)",
    payout: "Creator Earns: TZS 3,600",
    desc: "Detailed explanations of modern physics, electromagnetism waves, and 12 years of solved past paper questions."
  },
  {
    id: "prod-2",
    title: "STEA Secondary Teacher Syllabus Planner",
    creator: "Zanzibar Education Resource Council",
    category: "Templates & Planners",
    price: "TZS 6,000",
    rating: "4.8",
    downloads: 148,
    commission: "STEA Commission: TZS 1,200 (20%)",
    payout: "Creator Earns: TZS 4,800",
    desc: "Complete lesson frameworks, student check-sheets, and attendance export worksheets in PDF/Word templates."
  },
  {
    id: "prod-3",
    title: "High School Biology Revision Guide",
    creator: "Dr. Lilian S.",
    category: "Study Guides",
    price: "TZS 3,000",
    rating: "4.7",
    downloads: 512,
    commission: "STEA Commission: TZS 600 (20%)",
    payout: "Creator Earns: TZS 2,400",
    desc: "Visual diagrams, mnemonic grids, and biology test-sheet generators designed for fast integration."
  }
];

// Sample education Ads to demo compliant ad rotation
const AD_RESOURCES = [
  {
    id: "ad-1",
    banner: "👉 Upgrade to STEA Student Premium today! Unlock study planners, unlimited resources & advanced quizzes.",
    linkText: "Get Premium",
    sponsor: "STEA Official"
  },
  {
    id: "ad-2",
    banner: "🎓 Learn Cloud Computing free with ALX Africa sponsorships. Clearly targeted for university seniors.",
    linkText: "Apply Free",
    sponsor: "ALX Africa"
  },
  {
    id: "ad-3",
    banner: "📱 CRDB Scholars Bank Account - No monthly fees, instant mobile transactions & study savings boosters.",
    linkText: "Open Account",
    sponsor: "CRDB Bank"
  }
];

export default function PremiumHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pricing"); // pricing, jobs, digital, ads, teacher, admin
  const [currentUserPlan, setCurrentUserPlan] = useState("Free Student"); // "Free Student", "Student Premium", "Teacher Free", "Teacher Pro"
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  
  // Checkout simulator states
  const [paymentProvider, setPaymentProvider] = useState("mpesa"); // mpesa, tigopesa, airtel, cards, bank
  const [mobileNumber, setMobileNumber] = useState("");
  const [controlNum, setControlNum] = useState("");
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = prompt instructions or card info, 2 = verifying transaction receipt, 3 = success celebration
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  
  // Job and Internship states
  const [jobSearch, setJobSearch] = useState("");
  const [jobFilterType, setJobFilterType] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [employerTitle, setEmployerTitle] = useState("");
  const [employerCompany, setEmployerCompany] = useState("");
  const [employerSponsorship, setEmployerSponsorship] = useState(false);
  
  // Digital Products state
  const [payoutSliderValue, setPayoutSliderValue] = useState(5000);
  const [creatorName, setCreatorName] = useState("");
  const [creatorSlogan, setCreatorSlogan] = useState("");
  const [creatorGroup, setCreatorGroup] = useState("Study Guides");
  const [creatorRegistered, setCreatorRegistered] = useState(false);

  // Sponsored Listing Submit states
  const [sponsTitle, setSponsTitle] = useState("");
  const [sponsSchool, setSponsSchool] = useState("");
  const [sponsBudget, setSponsBudget] = useState("TZS 150,000");

  // Ad rotation simulator state
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [blockedAds, setBlockedAds] = useState([]);

  // Teacher Pro States
  const [teacherClasses, setTeacherClasses] = useState([
    { id: "c1", name: "Form VI Physics Core", students: 48, code: "PHY6-A" },
    { id: "c2", name: "Form V Elective Applied Math", students: 31, code: "MATH5-X" }
  ]);
  const [newClassName, setNewClassName] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("2026-06-06");
  const [attendanceReportStatus, setAttendanceReportStatus] = useState("not-generated"); // not-generated, generated, exporting-pdf

  // Trigger ad rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % AD_RESOURCES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.company.toLowerCase().includes(jobSearch.toLowerCase()) ||
                          job.skills.some(s => s.toLowerCase().includes(jobSearch.toLowerCase()));
      const matchType = jobFilterType === "all" ? true : job.type.toLowerCase().includes(jobFilterType.toLowerCase());
      return matchSearch && matchType;
    });
  }, [jobSearch, jobFilterType]);

  // Handle premium upgrade trigger
  const handleUpgradeTrigger = (planName, price) => {
    setSelectedPlanDetails({ planName, price });
    setCheckoutStep(1);
    setMobileNumber("");
    setControlNum("");
    setCardName("");
    setCardNumber("");
    setControlNum(`STEA-${Math.floor(100000 + Math.random() * 900000)}`);
    setShowCheckoutModal(true);
  };

  const handleApplyJob = (job) => {
    if (currentUserPlan === "Free Student" && appliedJobs.length >= 2) {
      alert("❌ Free student limit reached! Upgrade to STEA Student Premium to apply to unlimited internship & job opportunities.");
      return;
    }
    setAppliedJobs(prev => [...prev, job.id]);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    alert(`🎉 Application sent to ${job.company} for ${job.title}! They will reach you via email.`);
  };

  const handleAdBlock = (adId) => {
    setBlockedAds(prev => [...prev, adId]);
    alert("🛡️ Ad blocked. Thank you. STEA guarantees only education-targeted, scam-free resources.");
  };

  // Checkout submit simulation
  const handleVerifyCheckout = () => {
    setCheckoutStep(2);
    setTimeout(() => {
      setCheckoutStep(3);
      setCurrentUserPlan(selectedPlanDetails.planName);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }, 2500);
  };

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Monetization Top Display Banner */}
      <div style={{ position: "relative", overflow: "hidden", padding: "80px 20px 40px", background: "linear-gradient(180deg, rgba(245, 166, 35, 0.08) 0%, rgba(5,6,10,1) 100%)", borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(242, 166, 35, 0.12)", color: G, padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 900, marginBottom: 16 }}>
            <Zap size={14} /> PHASE 5 - MONETIZATION & CAREERS
          </div>
          
          <h1 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 950, tracking: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
            Empowering Tanzanian Scholars & Educators
          </h1>
          
          <p style={{ maxWidth: 680, margin: "0 auto 20px", color: "rgba(255,255,255,0.6)", fontSize: "clamp(14px, 2.8vw, 16px)", lineHeight: 1.5 }}>
            Unlock advanced classroom logs, export analytics, find paid internships, publish study packs, or target student-approved sponsorships.
          </p>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            <span>🔒 Scam & Gambling Free Ads</span>
            <span>•</span>
            <span>💳 Real-time Local Integration ready</span>
            <span>•</span>
            <span>✨ Commission split model</span>
          </div>

          {/* Current active user status ribbon */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER_COLOR}`, padding: "10px 20px", borderRadius: 14, marginTop: 24 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Your Active Tier:</span>
            <span style={{ color: G, fontWeight: 900, fontSize: 14, textTransform: "uppercase", letterSpacing: ".04em" }}>{currentUserPlan}</span>
            {currentUserPlan.includes("Free") ? (
              <span style={{ fontSize: 10, background: "rgba(255,0,0,0.1)", color: "#FF7373", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>LIMITS ATTACHED</span>
            ) : (
              <span style={{ fontSize: 10, background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>PRO ACTIVATED</span>
            )}
          </div>

        </div>
      </div>

      {/* Main Secondary Sub-Navigation */}
      <div style={{ borderBottom: `1px solid ${BORDER_COLOR}`, background: "rgba(5, 6, 10, 0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 8, overflowX: "auto", padding: "14px 20px" }}>
          {[
            { id: "pricing", label: "Premium Tiers", icon: <Zap size={15} /> },
            { id: "jobs", label: "Job & Internship Center", icon: <Briefcase size={15} /> },
            { id: "digital", label: "Creator Shop & Estimator", icon: <Calculator size={15} /> },
            { id: "ads", label: "Ad System & Sponsors", icon: <Megaphone size={15} /> },
            { id: "teacher", label: "Teacher Pro Sandbox", icon: <GraduationCap size={15} /> },
            { id: "admin", label: "Admin Analytics Dashboard", icon: <BarChart3 size={15} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 18px",
                borderRadius: 12,
                border: "1px solid",
                borderColor: activeTab === tab.id ? G : "rgba(255, 255, 255, 0.05)",
                background: activeTab === tab.id ? `${G}15` : "transparent",
                color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: activeTab === tab.id ? 850 : 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px 80px" }}>
        
        {/* ======================= TAB: PRICING PLANS ======================= */}
        {activeTab === "pricing" && (
          <div style={{ display: "grid", gap: 40 }}>
            {/* Display Freemium Model */}
            <div>
              <div style={{ textAlign: "center", marginBottom: 30 }}>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Choose Your Path on STEA</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Affordable learning resources, professional templates, and analytical suites for Tanzanian scholars.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                
                {/* Package: Free Student */}
                <div style={{ ...cardStStyle, border: currentUserPlan === "Free Student" ? `2px solid ${G}` : `1px solid ${BORDER_COLOR}`, position: "relative" }}>
                  {currentUserPlan === "Free Student" && <div style={activeTierBadgeStyle}>YOUR ACTIVE TIER</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Free Student Tier</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Everyday essential academic tooling</p>
                    </div>
                    <span style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: 8, fontWeight: 800 }}>FREE</span>
                  </div>

                  <div style={{ fontSize: 28, fontWeight: 950, color: "#fff", marginBottom: 20 }}>
                    TZS 0 <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/ forever</span>
                  </div>

                  <div style={{ display: "grid", gap: 12, marginBottom: 30 }}>
                    <div style={featureItemStyle}><Check size={14} color="#22c55e" /> Access Classroom Lectures</div>
                    <div style={featureItemStyle}><Check size={14} color="#22c55e" /> View Syllabus Study Notes</div>
                    <div style={featureItemStyle}><Check size={14} color="#22c55e" /> Browse Recent Past Papers</div>
                    <div style={featureItemStyle}><Check size={14} color="#22c55e" /> Standard Scholarships List</div>
                    <div style={featureItemStyle}><Check size={14} color="#22c55e" /> University Admission Guide</div>
                    <div style={{ ...featureItemStyle, color: "rgba(255,255,255,0.3)" }}><Lock size={12} /> Limit: 2 digital downloads</div>
                    <div style={{ ...featureItemStyle, color: "rgba(255,255,255,0.3)" }}><Lock size={12} /> No priority tutoring support</div>
                  </div>

                  <button 
                    disabled={currentUserPlan === "Free Student"} 
                    onClick={() => setCurrentUserPlan("Free Student")}
                    style={{ 
                      width: "100%", height: 44, borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, 
                      background: currentUserPlan === "Free Student" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                      color: currentUserPlan === "Free Student" ? "rgba(255,255,255,0.4)" : "#fff",
                      fontWeight: 800, fontSize: 13, cursor: currentUserPlan === "Free Student" ? "default" : "pointer"
                    }}
                  >
                    {currentUserPlan === "Free Student" ? "Selected Plan" : "Downgrade to Standard"}
                  </button>
                </div>

                {/* Package: Premium Student */}
                <div style={{ ...cardStStyle, border: `2px solid ${G}`, position: "relative", background: "linear-gradient(145deg, rgba(245,166,35,0.04) 0%, rgba(5,6,10,0.5) 100%)" }}>
                  {currentUserPlan === "Student Premium" && <div style={activeTierBadgeStyle}>YOUR ACTIVE TIER</div>}
                  <div style={{ position: "absolute", top: -11, right: 16, background: G, color: "#111", padding: "2px 10px", borderRadius: 8, fontSize: 10, fontWeight: 950 }}>POPULAR CHOICE</div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: G_LIGHT, margin: 0 }}>Student Premium</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Unlimited study aids & advanced support</p>
                    </div>
                    <span style={{ fontSize: 12, background: "rgba(245,166,35,0.15)", color: G, padding: "4px 10px", borderRadius: 8, fontWeight: 800 }}>GOLD TIER</span>
                  </div>

                  <div style={{ fontSize: 28, fontWeight: 950, color: "#fff", marginBottom: 20 }}>
                    TZS 5,000 <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/ month</span>
                  </div>

                  <div style={{ display: "grid", gap: 12, marginBottom: 30 }}>
                    <div style={featureItemStyle}><Check size={14} color={G} /> <b>Unlimited Downloads</b> (No Limits)</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Premium Solved Resources & Guides</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Advanced Inter-School Quizzes</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Personal AI Study Planner</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Priority Feature Access & Tutoring</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Ad-Free Dashboard Switcher</div>
                    <div style={featureItemStyle}><Check size={14} color={G} /> Fast Track University Applications</div>
                  </div>

                  <button 
                    onClick={() => handleUpgradeTrigger("Student Premium", 5000)}
                    style={{ 
                      width: "100%", height: 44, borderRadius: 12, border: "none", 
                      background: G, color: "#111", fontWeight: 900, fontSize: 13, cursor: "pointer",
                      boxShadow: `0 8px 16px rgba(245,166,35,0.15)`, transition: "transform 0.15s"
                    }}
                  >
                    {currentUserPlan === "Student Premium" ? "Extend Subscription" : "Upgrade to Premium Student"}
                  </button>
                </div>

                {/* Package: Teacher Pro */}
                <div style={{ ...cardStStyle, border: currentUserPlan === "Teacher Pro" ? `2px solid #8B5CF6` : `1px solid ${BORDER_COLOR}`, position: "relative" }}>
                  {currentUserPlan === "Teacher Pro" && <div style={{ ...activeTierBadgeStyle, background: "#8B5CF6" }}>ACTIVE PRO TEACHER</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: "#A78BFA", margin: 0 }}>Teacher Pro</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Unlimited digital class analytics</p>
                    </div>
                    <span style={{ fontSize: 11, background: "rgba(139,92,246,0.15)", color: "#A78BFA", padding: "4px 10px", borderRadius: 8, fontWeight: 800 }}>PRO TIER</span>
                  </div>

                  <div style={{ fontSize: 28, fontWeight: 950, color: "#fff", marginBottom: 20 }}>
                    TZS 15,000 <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/ month</span>
                  </div>

                  <div style={{ display: "grid", gap: 12, marginBottom: 30 }}>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> <b>Unlimited Managed Classes</b></div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> Advanced Attendance Reports</div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> <b>Export PDF Reports</b> (Class rosters)</div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> Student Performance Analytics</div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> Direct Parental Alerting Dash</div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> Host Live Quizzes & Reward Badges</div>
                    <div style={featureItemStyle}><Check size={14} color="#A78BFA" /> Collect Homework digitally (Submissions)</div>
                  </div>

                  <button 
                    onClick={() => handleUpgradeTrigger("Teacher Pro", 15000)}
                    style={{ 
                      width: "100%", height: 44, borderRadius: 12, border: "none", 
                      background: "#8B5CF6", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer",
                      boxShadow: "0 8px 16px rgba(139,92,246,0.15)"
                    }}
                  >
                    {currentUserPlan === "Teacher Pro" ? "Extend Pro Access" : "Upgrade to Teacher Pro"}
                  </button>
                </div>

              </div>
            </div>

            {/* Preparation notice on Payments */}
            <div style={{ ...cardStStyle, background: "rgba(59, 130, 246, 0.04)", border: "1px solid rgba(59, 130, 246, 0.15)", padding: 24 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>💡</span>
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#60A5FA" }}>Payment Security & Local Networks Note</h4>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    STEA incorporates mock payment gateways below to simulate actual local mobile money integrations before production launch. Try checking out using Vodacom M-Pesa, TigoPesa, AirtelMoney, or Visa/Mastercard without risking live wallet tokens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ======================= TAB: JOB & INTERNSHIP CENTER ======================= */}
        {activeTab === "jobs" && (
          <div style={{ display: "grid", gap: 24 }}>
            
            {/* Top filter station */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: "rgba(255,255,255,0.3)" }} />
                <input
                  type="text"
                  placeholder="Seach internships, keyword, or skills (e.g. Canva, Python, SEO)..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 42 }}
                />
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {["all", "internship", "part-time", "remote", "graduate"].map(type => (
                  <button
                    key={type}
                    onClick={() => setJobFilterType(type)}
                    style={{
                      height: 42, padding: "0 14px", borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: "pointer",
                      border: `1px solid ${jobFilterType === type ? G : BORDER_COLOR}`,
                      background: jobFilterType === type ? G : "rgba(255,255,255,0.03)",
                      color: jobFilterType === type ? "#111" : "rgba(255,255,255,0.6)",
                      textTransform: "capitalize"
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Grid / Split layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
              
              {/* Left: Job listings */}
              <div style={{ display: "grid", gap: 12 }}>
                {filteredJobs.length === 0 ? (
                  <div style={{ ...cardStStyle, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    No jobs match your filter criteria. Try searching for something else.
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => setSelectedJob(job)}
                      style={{ 
                        ...cardStStyle, 
                        border: selectedJob?.id === job.id ? `1.5px solid ${G}` : `1px solid ${BORDER_COLOR}`, 
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{job.title}</h3>
                            {job.featured && <span style={{ background: "rgba(242,166,35,0.12)", color: G, padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 900 }}>FEATURED</span>}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 }}>{job.company} • {job.location}</div>
                        </div>
                        <span style={{ fontSize: 11, color: G_LIGHT, fontWeight: 800 }}>{job.salary}</span>
                      </div>

                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineClamp: 2, margin: "10px 0" }}>{job.desc}</p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {job.skills.map(s => (
                            <span key={s} style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{s}</span>
                          ))}
                        </div>
                        <button 
                          style={{
                            background: "transparent", border: "none", color: G, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", gap: 4
                          }}
                        >
                          View Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right panel: Active selected detail or submit featured job */}
              <div style={{ display: "grid", gap: 16 }}>
                
                {/* Panel 1: Job Details View */}
                {selectedJob ? (
                  <div style={cardStStyle}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px" }}>{selectedJob.title}</h3>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{selectedJob.company}</div>
                    
                    <div style={{ display: "grid", gap: 8, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
                      <div><b>Category:</b> {selectedJob.type}</div>
                      <div><b>Stipend/Salary:</b> {selectedJob.salary}</div>
                      <div><b>Location:</b> {selectedJob.location}</div>
                    </div>

                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 20 }}>
                      {selectedJob.desc} This position is directly available on STEA's career portal for regional Tanzanian universities. All communication flows through the employer recruitment module.
                    </p>

                    <button
                      onClick={() => handleApplyJob(selectedJob)}
                      disabled={appliedJobs.includes(selectedJob.id)}
                      style={{
                        width: "100%", height: 42, borderRadius: 10, border: "none",
                        background: appliedJobs.includes(selectedJob.id) ? "rgba(255,255,255,0.06)" : G,
                        color: appliedJobs.includes(selectedJob.id) ? "rgba(255,255,255,0.4)" : "#111",
                        fontWeight: 900, fontSize: 13, cursor: appliedJobs.includes(selectedJob.id) ? "default" : "pointer"
                      }}
                    >
                      {appliedJobs.includes(selectedJob.id) ? "✓ Applied Successfully" : "Apply to Opportunity"}
                    </button>
                  </div>
                ) : (
                  <div style={{ ...cardStStyle, background: "rgba(255,255,255,0.01)", borderStyle: "dashed", textAlign: "center", padding: "30px 20px" }}>
                    <Briefcase size={24} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 8, margin: "0 auto" }} />
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Select any internship on the left to read and apply.</p>
                  </div>
                )}

                {/* Panel 2: Recruiter / Employer Area */}
                <div style={cardStStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 12 }}>
                    <Megaphone size={16} />
                    <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>Recruiter Area - Promote Lisiting</h3>
                  </div>

                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.4 }}>
                    Increase your visibility! For TZS 20,000, stand out above organic listings as a **Featured Spotlight** for Tanzanian students.
                  </p>

                  <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                    <input 
                      type="text" 
                      placeholder="Job / Internship Title" 
                      value={employerTitle}
                      onChange={e => setEmployerTitle(e.target.value)}
                      style={inputStyle} 
                    />
                    <input 
                      type="text" 
                      placeholder="Company / Institution Name" 
                      value={employerCompany}
                      onChange={e => setEmployerCompany(e.target.value)}
                      style={inputStyle} 
                    />
                    
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={employerSponsorship}
                        onChange={e => setEmployerSponsorship(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: G }} 
                      />
                      Add Premium Featured Tag (+ TZS 20,000)
                    </label>
                  </div>

                  <button
                    onClick={() => {
                      if (!employerTitle || !employerCompany) {
                        alert("⚠️ Please fill out the Company and Job Title parameters first.");
                        return;
                      }
                      if (employerSponsorship) {
                        handleUpgradeTrigger(`Featured Job: ${employerTitle}`, 20000);
                      } else {
                        alert("🎉 Job posted to review queue. Standard listings are free!");
                        setEmployerTitle("");
                        setEmployerCompany("");
                      }
                    }}
                    style={{
                      width: "100%", height: 38, borderRadius: 10, border: `1px solid ${G}`, background: "transparent",
                      color: G, fontSize: 12, fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    {employerSponsorship ? "Proceed to Checkout" : "Post Free Listing"}
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}


        {/* ======================= TAB: DIGITAL CREATOR PRODUCTS ======================= */}
        {activeTab === "digital" && (
          <div style={{ display: "grid", gap: 30 }}>
            
            {/* Split Creator Simulator & products list */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24 }}>
              
              {/* Left Column: Estimator Slider & Creator Registration */}
              <div style={{ display: "grid", gap: 20 }}>
                
                {/* 1. Commission slide calculator */}
                <div style={cardStStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 16 }}>
                    <TrendingUp size={18} />
                    <h3 style={{ fontSize: 16, fontWeight: 955, margin: 0 }}>Digital Creator Commission Split Estimator</h3>
                  </div>

                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 1.5 }}>
                    Help Tanzanian students pass with study plans, worksheets, and blueprints. Set your retail price to find out how much you earn. STEA splits <b>20% commission</b> to maintain database speeds.
                  </p>

                  <div style={{ background: "rgba(255,255,255,0.02)", padding: 18, borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Product Base Price:</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: G_LIGHT }}>TZS {payoutSliderValue.toLocaleString()}</span>
                    </div>

                    <input 
                      type="range" 
                      min="1000" 
                      max="50000" 
                      step="500" 
                      value={payoutSliderValue}
                      onChange={e => setPayoutSliderValue(Number(e.target.value))}
                      style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 4, outline: "none", appearance: "none", cursor: "pointer" }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18, borderTop: `1px solid ${BORDER_COLOR}`, paddingTop: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>STEA 20% COMMISSION</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#FF7373" }}>TZS {(payoutSliderValue * 0.20).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>CREATOR NET PAYOUT</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#22C55E" }}>TZS {(payoutSliderValue * 0.80).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    <span>✨ Payout frequency: Bi-Monthly (every 14 days)</span>
                    <span>•</span>
                    <span>🏧 Supported: M-Pesa, Halopesa, CRDB, NMB bank</span>
                  </div>
                </div>

                {/* 2. Join as creator form */}
                <div style={cardStStyle}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Register as a STEA Creator</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 }}>Start selling past exam preparation tools, notes, or code sheets directly to student wallets.</p>

                  {creatorRegistered ? (
                    <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", padding: 16, borderRadius: 10, textAlign: "center" }}>
                      <p style={{ margin: 0, color: "#22c55e", fontWeight: 800, fontSize: 13 }}>🎉 Creator application registered! Our reviewers will approve your store within 24 hours.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      <input 
                        type="text" 
                        placeholder="Your Store Name (e.g. Mwalimu James Revision Centre)" 
                        value={creatorName}
                        onChange={e => setCreatorName(e.target.value)}
                        style={inputStyle} 
                      />
                      <input 
                        type="text" 
                        placeholder="Primary focus (e.g. Physics syllabuses, IT codes, design templates)" 
                        value={creatorSlogan}
                        onChange={e => setCreatorSlogan(e.target.value)}
                        style={inputStyle} 
                      />
                      <select 
                        value={creatorGroup}
                        onChange={e => setCreatorGroup(e.target.value)}
                        style={inputStyle}
                      >
                        <option>Study Guides</option>
                        <option>Exam Preparation Packs</option>
                        <option>Teacher Resources</option>
                        <option>Templates</option>
                      </select>

                      <button
                        onClick={() => {
                          if (!creatorName) return alert("⚠️ Please provide a Creator / Store name.");
                          setCreatorRegistered(true);
                          confetti({ particleCount: 50, spread: 40 });
                        }}
                        style={{
                          height: 40, borderRadius: 10, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer"
                        }}
                      >
                        Launch Creator Hub Profile
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Existing Products listing in marketplace */}
              <div style={{ display: "grid", gap: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Available Study Products</h3>
                
                {DIGITAL_PRODUCTS.map(prod => (
                  <div key={prod.id} style={{ ...cardStStyle, background: "rgba(255,255,255,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                          {prod.category}
                        </span>
                        <h4 style={{ margin: "4px 0 2px", fontSize: 14, fontWeight: 900 }}>{prod.title}</h4>
                        <div style={{ fontSize: 11, color: G_LIGHT }}>Store: {prod.creator}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: G }}>{prod.price}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{prod.downloads} buys</div>
                      </div>
                    </div>

                    <p style={{ margin: "10px 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{prod.desc}</p>

                    <div style={{ borderTop: `1px dashed ${BORDER_COLOR}`, paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        <span>{prod.commission}</span> • <span style={{ color: "#22c55e" }}>{prod.payout}</span>
                      </div>

                      <button
                        onClick={() => handleUpgradeTrigger(prod.title, parseInt(prod.price.replace(/[^\d]/g, "")))}
                        style={{
                          height: 28, padding: "0 12px", borderRadius: 6, border: "none", background: "rgba(245,166,35,0.15)",
                          color: G, fontSize: 11, fontWeight: 900, cursor: "pointer"
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}


        {/* ======================= TAB: EDUCATION SPONSOR AD SYSTEM ======================= */}
        {activeTab === "ads" && (
          <div style={{ display: "grid", gap: 30 }}>
            
            {/* Interactive demo on ad slots block and scam free standard */}
            <div style={cardStStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldCheck size={18} color="#22c55e" />
                  <h3 style={{ fontSize: 16, fontWeight: 955, margin: 0 }}>Education-Only Clean Advertisement Network</h3>
                </div>
                <span style={{ fontSize: 10, background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "4px 10px", borderRadius: 6, fontWeight: 900 }}>STEA SAFE-GUARD GUARANTEED</span>
              </div>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 20px", lineHeight: 1.5 }}>
                We strictly ban all <b>scams, gambling, betting, and adult materials</b> on STEA website to preserve student focus and families security. Only regional tutoring hubs, courses, training organizations, or schools are permitted to schedule displays.
              </p>

              {/* Live Slot Demo */}
              <div style={{ border: `1px solid ${BORDER_COLOR}`, background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
                  <span>📢 Live Active Ad Broadcast Slot</span>
                  <span>Targeted Ad Partner</span>
                </div>

                {blockedAds.includes(AD_RESOURCES[currentAdIndex].id) ? (
                  <div style={{ textAlign: "center", padding: 12, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                    🚫 [You have blocked this slot display. A fresh academic partner will rotate shortly.]
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ background: G, color: "#111", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 950 }}>SPONSORED</span>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{AD_RESOURCES[currentAdIndex].banner}</p>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => handleUpgradeTrigger(`Partner Campaign: ${AD_RESOURCES[currentAdIndex].sponsor}`, 10000)}
                        style={{
                          height: 30, padding: "0 14px", borderRadius: 8, border: "none", background: G, color: "#111", fontSize: 11, fontWeight: 900, cursor: "pointer"
                        }}
                      >
                        {AD_RESOURCES[currentAdIndex].linkText}
                      </button>
                      <button
                        onClick={() => handleAdBlock(AD_RESOURCES[currentAdIndex].id)}
                        style={{
                          height: 30, width: 30, borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", display: "grid", placeItems: "center", cursor: "pointer"
                        }}
                        title="Block this partner display"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsored listings showcase */}
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Promoted Academic Listings (Schools & Events)</h3>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Clearly labeled as Sponsored / Tangazo</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                {SPONSORED_LISTINGS.map(listing => (
                  <div key={listing.id} style={{ ...cardStStyle, display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" }}>
                    <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                      <img src={listing.image} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "coverOpacity", opacity: 0.7 }} referrerPolicy="no-referrer" />
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "4px 10px", borderRadius: 6, fontSize: 9, color: G_LIGHT, fontWeight: 955, border: "1px solid rgba(245,166,35,0.3)" }}>
                        {listing.badge.toUpperCase()}
                      </div>
                    </div>

                    <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 10, color: G, fontWeight: 800 }}>{listing.type}</span>
                      <h4 style={{ margin: "4px 0 2px", fontSize: 15, fontWeight: 900 }}>{listing.title}</h4>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{listing.institution}</div>
                      <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, flex: 1 }}>{listing.description}</p>
                      
                      <button
                        onClick={() => alert(`🔗 Navigating to academic detail page for: ${listing.title}`)}
                        style={{
                          width: "100%", height: 36, borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, background: "rgba(255,255,255,0.02)",
                          color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer"
                        }}
                      >
                        Explore Program Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* University sponsor submission portal */}
            <div style={{ ...cardStStyle, background: "linear-gradient(135deg, rgba(245,166,35,0.03) 0%, rgba(5,6,10,0.5) 100%)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Universities & Training Centers Sponsorship Program</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    Promote your degree programs, scholarships, and professional courses directly to over 50,000 top-performing secondary school students and college applicants looking for options in Tanzania.
                  </p>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <input 
                    type="text" 
                    placeholder="E.g. MUHAS Medicine Scholarship Intake" 
                    value={sponsTitle}
                    onChange={e => setSponsTitle(e.target.value)}
                    style={inputStyle} 
                  />
                  <input 
                    type="text" 
                    placeholder="Institution / School Name" 
                    value={sponsSchool}
                    onChange={e => setSponsSchool(e.target.value)}
                    style={inputStyle} 
                  />
                  
                  <div style={{ display: "flex", gap: 10 }}>
                    <select 
                      value={sponsBudget}
                      onChange={e => setSponsBudget(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      <option>TZS 150,000 (15 days)</option>
                      <option>TZS 280,000 (30 days)</option>
                      <option>TZS 500,000 (3 months Campaign)</option>
                    </select>

                    <button
                      onClick={() => {
                        if (!sponsTitle || !sponsSchool) return alert("⚠️ Please provide campaign name and institution first.");
                        handleUpgradeTrigger(`Sponsored: ${sponsTitle}`, parseInt(sponsBudget.replace(/[^\d]/g, "")));
                      }}
                      style={{
                        padding: "0 20px", borderRadius: 10, border: "none", background: G, color: "#111", fontWeight: 900, fontSize: 12, cursor: "pointer"
                      }}
                    >
                      Request Campaign
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}


        {/* ======================= TAB: TEACHER PRO SANDBOX ======================= */}
        {activeTab === "teacher" && (
          <div style={{ display: "grid", gap: 24 }}>
            
            {/* Direct sandbox toggle explanation */}
            <div style={{ ...cardStStyle, borderLeft: `4px solid ${currentUserPlan === "Teacher Pro" ? "#22c55e" : "#8B5CF6"}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>
                Teacher Analytical Workspace {currentUserPlan === "Teacher Pro" ? "(PRO TIER MOUNTED)" : "(STANDARD MODE DEMO)"}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                {currentUserPlan === "Teacher Pro" ? (
                  "Thank you for purchasing STEA Teacher Pro. You have full access to unlimited classrooms database creation, student participation curves, performance indexes, and PDF attendance exports."
                ) : (
                  "You are running on a standard Teacher Free tier. Try adding a 3rd class or exporting PDF reports below to see where the advanced gating limits occur. Simply toggle or join Teacher Pro to experience full analytics."
                )}
              </p>
            </div>

            {/* Classroom controller sandbox */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              
              {/* Box 1: Class Generator & Gating demo */}
              <div style={cardStStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: G_LIGHT, textTransform: "uppercase", letterSpacing: ".04em", margin: 0 }}>Active Class Management</h3>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                    {teacherClasses.length} Classes Created
                  </span>
                </div>

                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  {teacherClasses.map(cls => (
                    <div key={cls.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: `1px solid ${BORDER_COLOR}` }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{cls.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Code: {cls.code} | Attendance: {cls.students} students logged</div>
                      </div>
                      <span style={{ fontSize: 11, color: G }}>Active</span>
                    </div>
                  ))}
                </div>

                {/* Gated add class trigger */}
                <div style={{ borderTop: `1px dashed ${BORDER_COLOR}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Add New Class Node:</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      type="text" 
                      placeholder="E.g. Form VI Computer Studies" 
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={() => {
                        if (!newClassName) return;
                        if (currentUserPlan !== "Teacher Pro" && teacherClasses.length >= 2) {
                          alert("❌ GATED LIMIT: Standard Teacher Free users can only manage up to 2 active classes. Upgrade to Teacher Pro to create unlimited digital classes!");
                          return;
                        }
                        const newCls = {
                          id: `c-${Date.now()}`,
                          name: newClassName,
                          students: Math.floor(10 + Math.random() * 40),
                          code: `STUDY-${Math.floor(100 + Math.random() * 900)}`
                        };
                        setTeacherClasses(prev => [...prev, newCls]);
                        setNewClassName("");
                        confetti({ particleCount: 30, spread: 40 });
                      }}
                      style={{
                        padding: "0 14px", borderRadius: 10, border: "none", background: G, color: "#111", fontWeight: 900, fontSize: 12, cursor: "pointer"
                      }}
                    >
                      Create Class
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 2: Attendance PDF Generator & Reports simulator */}
              <div style={cardStStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: G_LIGHT, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 14 }}>
                  Attendance Report & Export Panel
                </h3>

                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.4 }}>
                  Choose a date and class roster to compile advanced presence indices. Pro subscribers can export the report in structural print layouts.
                </p>

                <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Select Academic Session Date:</label>
                    <input 
                      type="date" 
                      value={attendanceDate}
                      onChange={e => setAttendanceDate(e.target.value)}
                      style={{ ...inputStyle, marginTop: 4 }} 
                    />
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        setAttendanceReportStatus("generated");
                        alert("📊 Report generated! Review the analytical class charts below.");
                      }}
                      style={{
                        width: "100%", height: 38, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.06)",
                        color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer"
                      }}
                    >
                      Calculate Participation Analytics
                    </button>
                  </div>
                </div>

                {/* PDF Export Gating */}
                <div style={{ borderTop: `1px dashed ${BORDER_COLOR}`, paddingTop: 14, display: "grid", gap: 10 }}>
                  <button
                    onClick={() => {
                      if (currentUserPlan !== "Teacher Pro") {
                        alert("❌ GATED LIMIT: Exporting PDF classroom reports is a Prioritized Feature exclusive to Teacher Pro subscribers.");
                        return;
                      }
                      setAttendanceReportStatus("exporting-pdf");
                      setTimeout(() => {
                        setAttendanceReportStatus("generated");
                        alert("📄 Success! Complete Class Attendance Sheet exported into downloads folder (Simulated via jspdf wrapper).");
                        confetti({ particleCount: 50, spread: 60 });
                      }, 2000);
                    }}
                    style={{
                      width: "100%", height: 40, borderRadius: 10, border: "none", background: "#8B5CF6",
                      color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    <FileText size={14} />
                    {attendanceReportStatus === "exporting-pdf" ? "Compiling PDF data..." : "Export Official PDF Attendance sheet"}
                  </button>
                </div>
              </div>

            </div>

            {/* Classroom performance charts visual simulator */}
            <div style={cardStStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: G_LIGHT, marginBottom: 14 }}>Student Performance Tracking Analytics Curve</h3>
              
              <div style={{ height: 200, position: "relative", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, display: "grid", placeItems: "center" }}>
                {currentUserPlan !== "Teacher Pro" ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Lock size={26} style={{ color: "#8B5CF6", marginBottom: 8, margin: "0 auto" }} />
                    <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 922 }}>Student Metrics Gated</h4>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Upgrade to Teacher Pro to preview weekly performance charts, average grade projections, and attendance drop indicators.</p>
                  </div>
                ) : (
                  <div style={{ position: "absolute", inset: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    
                    {/* Simulated bar chart via SVG */}
                    <svg viewBox="0 0 400 120" style={{ width: "100%", height: "100%", flex: 1 }}>
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      
                      {/* Trend Curve */}
                      <path d="M 30,100 Q 100,20 180,60 T 360,15" fill="none" stroke="#8B5CF6" strokeWidth="3" />
                      <circle cx="360" cy="15" r="4" fill="#A78BFA" />

                      {/* Bar Indicators */}
                      <rect x="50" y="80" width="16" height="40" fill="rgba(139,92,246,0.3)" rx="2" />
                      <rect x="120" y="40" width="16" height="80" fill="rgba(139,92,246,0.5)" rx="2" />
                      <rect x="190" y="60" width="16" height="60" fill="rgba(139,92,246,0.3)" rx="2" />
                      <rect x="260" y="30" width="16" height="90" fill="rgba(139,92,246,0.6)" rx="2" />
                      <rect x="330" y="15" width="16" height="105" fill="rgba(245,166,35,0.7)" rx="2" />
                    </svg>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", padding: "8px 10px 0" }}>
                      <span>Jan (Mid-term)</span>
                      <span>Feb (Review)</span>
                      <span>Mar (Practical)</span>
                      <span>Apr (Pre-Mock)</span>
                      <span>May (NECTA Target)</span>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ======================= TAB: ADMIN REVENUE & ANALYTICS ======================= */}
        {activeTab === "admin" && (
          <div style={{ display: "grid", gap: 24 }}>
            
            {/* Admin top credentials prompt */}
            <div style={{ ...cardStStyle, background: "rgba(245,166,35,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: G }}>STEA Financial Administrator Monitor</h3>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Internal revenue flows, premium subscribers count, downloads, and regional educational growth charts.</p>
              </div>

              <span style={{ fontSize: 10, background: "rgba(245,166,35,0.15)", color: G, padding: "4px 12px", borderRadius: 6, fontWeight: 955 }}>
                SECURE SSL VERIFIED
              </span>
            </div>

            {/* Quick stats panel */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              
              <div style={statBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  <span>MONTHLY REVENUE</span>
                  <DollarSign size={14} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 955, color: "#22c55e" }}>TZS 3,842,000</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>+24% from previous month</div>
              </div>

              <div style={statBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  <span>ACTIVE SUBSCRIPTIONS</span>
                  <Users size={14} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 955, color: G_LIGHT }}>491 Subscriptions</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>381 Students, 110 Teachers</div>
              </div>

              <div style={statBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  <span>RESOURCE DOWNLOADS</span>
                  <Download size={14} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 955, color: "#60A5FA" }}>18,482 downloads</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>82% by premium student accounts</div>
              </div>

              <div style={statBoxStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  <span>PLATFORM GROWTH</span>
                  <TrendingUp size={14} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 955, color: "#A78BFA" }}>+42.5%</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Year-over-Year subscriber count</div>
              </div>

            </div>

            {/* Split layout: top resources & top teachers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexWrap: "wrap" }}>
              
              {/* Table A: Top resources sold & downloaded */}
              <div style={cardStStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: G_LIGHT, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 14 }}>
                  Top Performed Resources
                </h3>

                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { rank: 1, title: "Zanzibar Mock Exam Solved Physics 2025", category: "Exam Packs", count: "1,280 downloads", revenue: "TZS 5.76M", earnings: "TZS 1.15M STEA Share" },
                    { rank: 2, title: "Advanced Level General Chemistry Note Pack", category: "Study Notes", count: "982 downloads", revenue: "TZS 2.94M", earnings: "TZS 588k STEA Share" },
                    { rank: 3, title: "Form 4 Math Algebra Revision Sheets", category: "Templates", count: "812 downloads", revenue: "TZS 2.43M", earnings: "TZS 486k STEA Share" }
                  ].map(res => (
                    <div key={res.rank} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", padding: 10, borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, fontSize: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>#{res.rank} {res.title}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>{res.category} | {res.count}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "#22c55e" }}>{res.revenue}</div>
                        <div style={{ fontSize: 9, color: G }}>{res.earnings}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table B: Top Instructors / Teachers */}
              <div style={cardStStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: G_LIGHT, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 14 }}>
                  Top Performing Educators
                </h3>

                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { rank: 1, name: "Mwalimu James M. (Arusha Core)", students: "411 Students active", rating: "⭐ 4.93", payouts: "TZS 910k Paid" },
                    { rank: 2, name: "Dr. Catherine L. (UDSM CoICT)", students: "283 Students active", rating: "⭐ 4.88", payouts: "TZS 540k Paid" },
                    { rank: 3, name: "Teacher Baraka S. (Zanzibar Secondary)", students: "192 Students active", rating: "⭐ 4.82", payouts: "TZS 320k Paid" }
                  ].map(teacher => (
                    <div key={teacher.rank} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", padding: 10, borderRadius: 8, border: `1px solid ${BORDER_COLOR}`, fontSize: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>#{teacher.rank} {teacher.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>{teacher.students} • {teacher.rating}</div>
                      </div>

                      <span style={{ fontWeight: 800, color: G }}>{teacher.payouts}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>


      {/* ======================= CHECKOUT / UPGRADE MODAL OVERLAY ======================= */}
      <AnimatePresence>
        {showCheckoutModal && selectedPlanDetails && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5, 6, 10, 0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 99999, padding: 20 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                maxWidth: 480, width: "100%", background: "#0c0d16", border: `1px solid ${BORDER_COLOR}`, borderRadius: 24, boxShadow: "0 24px 80px rgba(0,0,0,0.8)", overflow: "hidden", outline: "none"
              }}
            >
              {/* Header */}
              <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${BORDER_COLOR}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: G, fontWeight: 900, textTransform: "uppercase" }}>STEA PAYOUT GATEWAY</div>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: "#fff" }}>Secure Subscription Checkout</h3>
                </div>

                <button
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "grid", placeItems: "center"
                  }}
                >
                  ×
                </button>
              </div>

              {/* Step 1: Selection & Input details */}
              {checkoutStep === 1 && (
                <div style={{ padding: 24 }}>
                  
                  {/* Selected Plan Details box */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Selected Plan:</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{selectedPlanDetails.planName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Billing Total:</div>
                      <div style={{ fontSize: 15, fontWeight: 955, color: G }}>TZS {selectedPlanDetails.price.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Payment provider tab pick */}
                  <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                    Select Payment Method:
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 20 }}>
                    {[
                      { id: "mpesa", label: "M-Pesa", desc: "Vodacom" },
                      { id: "tigopesa", label: "TigoPesa", desc: "Tigo" },
                      { id: "airtel", label: "AirtelMoney", desc: "Airtel" },
                      { id: "halopesa", label: "HaloPesa", desc: "Halotel" },
                      { id: "cards", label: "Visa / Card", desc: "Direct Card" },
                      { id: "bank", label: "Bank QR", desc: "CRDB/NMB" }
                    ].map(prov => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setPaymentProvider(prov.id)}
                        style={{
                          padding: "8px", borderRadius: 10, border: "1px solid",
                          borderColor: paymentProvider === prov.id ? G : "rgba(255,255,255,0.05)",
                          background: paymentProvider === prov.id ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.02)",
                          color: paymentProvider === prov.id ? "#fff" : "rgba(255,255,255,0.6)",
                          cursor: "pointer", transition: "all 0.15s"
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 900 }}>{prov.label}</div>
                        <div style={{ fontSize: 8, opacity: 0.5 }}>{prov.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic checkout detail inputs based on choice */}
                  {paymentProvider !== "cards" && paymentProvider !== "bank" && (
                    <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                          Enter mobile money registered phone number (Tanzania):
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 07XXXXXXXX"
                          value={mobileNumber}
                          onChange={e => setMobileNumber(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 10, fontSize: 12, border: `1px solid ${BORDER_COLOR}` }}>
                        <div style={{ color: G_LIGHT, fontWeight: 800, marginBottom: 4 }}>Instructions:</div>
                        <ol style={{ paddingLeft: 16, margin: 0, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                          <li>Submit your mobile wallet number.</li>
                          <li>You will receive an instant push query or USSD PIN request.</li>
                          <li>Punch in your Mobile Money secure PIN.</li>
                          <li>We'll auto-check verification here.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {paymentProvider === "cards" && (
                    <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
                      <input
                        type="text"
                        placeholder="Cardholder Complete Name"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        maxLength="19"
                        placeholder="Card Number (4000 1234 5678 9010)"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        style={inputStyle}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input type="text" placeholder="MM/YY" style={inputStyle} />
                        <input type="password" maxLength="3" placeholder="CVV" style={inputStyle} />
                      </div>
                    </div>
                  )}

                  {paymentProvider === "bank" && (
                    <div style={{ textAlign: "center", display: "grid", gap: 12, marginBottom: 20 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        Scan the unified payment control code via NMB Mkononi, CRDB SimBanking, or any local bank application:
                      </p>
                      
                      <div style={{ background: "#fff", padding: 14, borderRadius: 14, width: 140, height: 140, margin: "10px auto", display: "grid", placeItems: "center" }}>
                        <QRCodeSVG value={`STEA-PAY-CONTROL:${selectedPlanDetails.price}`} size={120} />
                      </div>

                      <input
                        type="text"
                        placeholder="Reference / Control Number"
                        value={controlNum}
                        disabled
                        style={{ ...inputStyle, textAlign: "center", color: G }}
                      />
                    </div>
                  )}

                  {/* Action submission triggers */}
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      style={{
                        flex: 1, height: 42, borderRadius: 12, border: `1px solid ${BORDER_COLOR}`, background: "transparent",
                        color: "rgba(255,255,255,0.7)", fontWeight: 800, cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleVerifyCheckout}
                      style={{
                        flex: 1, height: 42, borderRadius: 12, border: "none", background: G,
                        color: "#111", fontWeight: 900, cursor: "pointer"
                      }}
                    >
                      Authorize Payment
                    </button>
                  </div>

                </div>
              )}

              {/* Step 2: Verification loading */}
              {checkoutStep === 2 && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <div style={{ display: "inline-block", width: 44, height: 44, border: `4px solid ${BORDER_COLOR}`, borderTopColor: G, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>

                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: "20px 0 8px" }}>Securing Wallet Connection...</h3>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5 }}>
                    Waiting for mobile carrier approval token. Please check your phone for a push PIN prompt sequence or confirm in your bank application.
                  </p>
                </div>
              )}

              {/* Step 3: Success Celebration */}
              {checkoutStep === 3 && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.12)", color: "#22c55e", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
                    <Check size={32} strokeWidth={3} />
                  </div>

                  <h3 style={{ fontSize: 20, fontWeight: 955, color: "#fff", margin: "0 0 8px" }}>Transaction Fully Approved!</h3>
                  <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5 }}>
                    Your subscription state has been upgraded, unlocking unlimited academic downloads and priority cloud speed boosters across high-school sectors in Tanzania.
                  </p>

                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    style={{
                      width: "100%", height: 42, borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    Enter Premium Workspace
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline Sub-Components & Styles to bypass large CSS edits
const cardStStyle = {
  background: CARD_BG,
  borderRadius: 20,
  border: `1.5px solid ${BORDER_COLOR}`,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
};

const activeTierBadgeStyle = {
  position: "absolute",
  top: -11,
  left: 16,
  background: G,
  color: "#111",
  padding: "2px 10px",
  borderRadius: 8,
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".04em"
};

const featureItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  color: "rgba(255,255,255,0.75)"
};

const inputStyle = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  background: "rgba(255, 255, 255, 0.04)",
  border: `1.5px solid ${BORDER_COLOR}`,
  color: "#fff",
  padding: "0 14px",
  outline: "none",
  fontSize: 13,
  transition: "border-color 0.15s"
};

const statBoxStyle = {
  background: CARD_BG,
  borderRadius: 16,
  border: `1px solid ${BORDER_COLOR}`,
  padding: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
};
