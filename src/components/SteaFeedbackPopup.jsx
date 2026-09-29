import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Star, Heart, Info, Copy, CheckCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "../firebase";
import EcosystemModalShell from "./EcosystemModalShell.jsx";

const GOLD = "#D4AF37";
const BLUE = "#2563EB";

const SECTION_MESSAGES = {
  "STEA Education": {
    en: "Support STEA Education to help students access notes, past papers, classroom tools and scholarships.",
    sw: "Support STEA Education kusaidia wanafunzi kupata notes, past papers, zana za darasani na scholarships.",
  },
  TechHub: {
    en: "Support STEA TechHub to help us continue sharing AI tools, guides and digital solutions.",
    sw: "Support STEA TechHub kutusaidia kuendelea kushiriki zana za AI, miongozo na suluhisho za kidigitali.",
  },
  "STEA Duka": {
    en: "Support STEA Duka to help us improve trusted product access and customer service.",
    sw: "Support STEA Duka kutusaidia kuboresha upatikanaji wa bidhaa za uhakika na huduma kwa wateja.",
  },
  "Gigs & Kazi": {
    en: "Support STEA Gigs & Kazi to help young people find work and opportunities.",
    sw: "Support STEA Gigs & Kazi kusaidia vijana kupata kazi na fursa.",
  },
  Courses: {
    en: "Support STEA Courses to help us create more practical learning content.",
    sw: "Support STEA Courses kutusaidia kutengeneza maudhui zaidi ya kujifunzia kwa vitendo.",
  },
  Services: {
    en: "Support STEA Services to help us improve digital support, design and IT services.",
    sw: "Support STEA Services kutusaidia kuboresha huduma za kidigitali, ubunifu na IT.",
  },
  "STEA Classroom": {
    en: "Support STEA Classroom to help students and teachers access better class management and attendance tools.",
    sw: "Support STEA Classroom kusaidia wanafunzi na walimu kupata zana bora za usimamizi wa darasa na mahudhurio.",
  },
  STEA: {
    en: "Support STEA to help us pay for servers, storage, security, and future development.",
    sw: "Support STEA kutusaidia kulipia server, storage, security na kuendeleza huduma zaidi.",
  },
};

const COPY = {
  en: {
    feedbackTitle: "How was your STEA experience?",
    feedbackSubtitle: "Share a quick rating so we can improve STEA for students, creators and communities.",
    whatLike: "What did you like most?",
    whatImprove: "What should we improve?",
    submitFeedback: "Submit Feedback",
    maybeLater: "Maybe Later",
    thanks: "Thank you for helping us improve STEA.",
    supportTitle: "Support STEA",
    supportSubtitle:
      "Help us keep STEA growing for students, creators and digital communities in Africa.",
    supportMain: "Support STEA",
    learnMore: "Learn More About STEA",
    supportNote:
      "Every contribution helps us improve servers, storage, security and new features.",
    bankTitle: "Bank support",
    mobileTitle: "Mobile money support",
    paymentNameRule:
      "If paying through Selcom, the name may appear as: ISAYA HANCE MASIKA. If paying through Vodacom/M-Pesa, the name may appear as: PROSPER MALEKO MFURU.",
    confirmNameWarning: "Please confirm the payment name before sending.",
    copied: "Copied!",
    aboutTitle: "About STEA",
    aboutContent:
      "STEA is an education and technology platform created to help Tanzanian and African students learn, build, and access opportunities.",
  },
  sw: {
    feedbackTitle: "Umeionaje STEA?",
    feedbackSubtitle: "Toa rating fupi ili tuendelee kuboresha STEA kwa wanafunzi, wabunifu na jamii.",
    whatLike: "Unapenda zaidi nini?",
    whatImprove: "Tuboreshe nini?",
    submitFeedback: "Wasilisha Maoni",
    maybeLater: "Labda Baadaye",
    thanks: "Asante kwa kutusaidia kuboresha STEA.",
    supportTitle: "Support STEA",
    supportSubtitle:
      "Tusaidie STEA kuendelea kukua kwa wanafunzi, wabunifu na jamii za kidigitali Afrika.",
    supportMain: "Support STEA",
    learnMore: "Jifunze Zaidi kuhusu STEA",
    supportNote:
      "Kila mchango unatusaidia kuboresha servers, storage, security na features mpya.",
    bankTitle: "Msaada wa benki",
    mobileTitle: "Msaada wa simu",
    paymentNameRule:
      "Ukilipa kupitia Selcom, jina linaweza kuonekana kama: ISAYA HANCE MASIKA. Ukilipa kupitia Vodacom/M-Pesa, jina linaweza kuonekana kama: PROSPER MALEKO MFURU.",
    confirmNameWarning: "Tafadhali hakiki jina la malipo kabla ya kutuma.",
    copied: "Imenakiliwa!",
    aboutTitle: "Kuhusu STEA",
    aboutContent:
      "STEA ni platform ya elimu na teknolojia iliyotengenezwa kusaidia wanafunzi wa Tanzania na Afrika kujifunza, kujenga ujuzi na kupata fursa.",
  },
};

const FEEDBACK_OPTIONS = {
  en: ["Easy to use", "Important information", "Good design", "Fast experience", "Helpful service", "Other"],
  sw: ["Rahisi kutumia", "Taarifa muhimu", "Muundo mzuri", "Kasi nzuri", "Huduma nzuri", "Mengineyo"],
};

function getSection(pathname) {
  if (pathname.includes("/class") || pathname.includes("/attendance")) return "STEA Classroom";
  if (pathname.includes("/education") || pathname.includes("/past") || pathname.includes("/scholar") || pathname.includes("/uni")) return "STEA Education";
  if (pathname.includes("/marketplace") || pathname.includes("/cart") || pathname.includes("/checkout")) return "STEA Duka";
  if (pathname.includes("/techhub") || pathname.includes("/tool") || pathname.includes("/prompt")) return "TechHub";
  if (pathname.includes("/gig") || pathname.includes("/kazi")) return "Gigs & Kazi";
  if (pathname.includes("/course")) return "Courses";
  if (pathname.includes("/service")) return "Services";
  return "STEA";
}

function LanguageToggle({ lang, setLang }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      {[
        ["en", "EN"],
        ["sw", "SW"],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          style={{
            border: 0,
            borderRadius: 999,
            padding: "6px 10px",
            background: lang === code ? "rgba(212,175,55,0.16)" : "transparent",
            color: lang === code ? "#F3C95C" : "#94A3B8",
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function SteaFeedbackPopup() {
  const location = useLocation();
  const section = useMemo(() => getSection(location.pathname), [location.pathname]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("feedback"); // feedback | support
  const [lang, setLang] = useState("sw");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [improvementText, setImprovementText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copyState, setCopyState] = useState("");

  const t = COPY[lang];

  useEffect(() => {
    const doNotShowUntil = localStorage.getItem("stea_feedback_doNotShowUntil");
    let pagesVisited = parseInt(sessionStorage.getItem("stea_pages_visited") || "0", 10);
    pagesVisited += 1;
    sessionStorage.setItem("stea_pages_visited", String(pagesVisited));

    let timer;
    if ((!doNotShowUntil || Date.now() >= Number(doNotShowUntil)) && !open) {
      timer = setTimeout(() => {
        setMode("feedback");
        setOpen(true);
      }, pagesVisited === 3 ? 2000 : 120000);
    }

    const openSupport = () => {
      setMode("support");
      setOpen(true);
    };

    window.addEventListener("open-stea-support", openSupport);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("open-stea-support", openSupport);
    };
  }, [location.pathname, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const closePopup = () => {
    setOpen(false);
    setMode("feedback");
    localStorage.setItem("stea_feedback_doNotShowUntil", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    localStorage.setItem("stea_supportPopupDismissedAt", String(Date.now()));
  };

  const toggleOption = (option) => {
    setSelectedOptions((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    );
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(t.copied);
      window.clearTimeout(copyText._timer);
      copyText._timer = window.setTimeout(() => setCopyState(""), 1500);
    } catch {
      setCopyState("");
    }
  };

  const submitFeedback = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const db = getFirebaseDb();
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;

      if (db) {
        await addDoc(collection(db, "feedback"), {
          userId: user ? user.uid : null,
          userName: user?.displayName || "",
          userEmail: user?.email || "",
          rating,
          selectedReasons: selectedOptions,
          message: improvementText,
          page: location.pathname,
          language: lang,
          sectionName: section,
          createdAt: serverTimestamp(),
          status: "new",
        });
      }
      localStorage.setItem("stea_feedbackSubmitted", "true");
      setMode("support");
    } catch (error) {
      console.error(error);
      setMode("support");
    } finally {
      setSubmitting(false);
    }
  };

  const supportMessage = SECTION_MESSAGES[section]?.[lang] || SECTION_MESSAGES.STEA[lang];

  return (
    <EcosystemModalShell
      open={open}
      title={mode === "support" ? t.supportTitle : t.feedbackTitle}
      subtitle={mode === "support" ? t.supportSubtitle : t.feedbackSubtitle}
      onClose={closePopup}
      maxWidth={mode === "support" ? 640 : 560}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <LanguageToggle lang={lang} setLang={setLang} />
      </div>

      {mode === "feedback" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  size={30}
                  fill={value <= (hoverRating || rating) ? GOLD : "transparent"}
                  color={value <= (hoverRating || rating) ? GOLD : "#475569"}
                />
              </button>
            ))}
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 900, color: "#F8FAFC" }}>{t.whatLike}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {FEEDBACK_OPTIONS[lang].map((option) => {
              const active = selectedOptions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  style={{
                    border: `1px solid ${active ? "rgba(212,175,55,0.58)" : "#334155"}`,
                    background: active ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.035)",
                    color: active ? "#F3C95C" : "#E5E7EB",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 900, color: "#F8FAFC" }}>
            {t.whatImprove}
          </label>
          <textarea
            value={improvementText}
            onChange={(event) => setImprovementText(event.target.value)}
            placeholder={lang === "sw" ? "Andika hapa..." : "Tell us here..."}
            style={{
              width: "100%",
              minHeight: 104,
              borderRadius: 16,
              border: "1px solid #334155",
              background: "#0B111C",
              color: "#F8FAFC",
              padding: 14,
              resize: "vertical",
              outline: "none",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={closePopup}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                border: "1px solid #334155",
                background: "rgba(255,255,255,0.035)",
                color: "#CBD5E1",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {t.maybeLater}
            </button>
            <button
              type="button"
              disabled={submitting || rating === 0}
              onClick={submitFeedback}
              style={{
                flex: 1.4,
                height: 46,
                borderRadius: 14,
                border: `1px solid ${rating === 0 ? "#2B3648" : "rgba(212,175,55,0.45)"}`,
                background:
                  rating === 0
                    ? "#202938"
                    : "linear-gradient(135deg, #D4AF37 0%, #F3C95C 100%)",
                color: rating === 0 ? "#64748B" : "#111827",
                fontSize: 13,
                fontWeight: 900,
                cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "..." : t.submitFeedback}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 18,
              borderRadius: 18,
              border: "1px solid rgba(212,175,55,0.18)",
              background: "linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(212,175,55,0.055) 100%)",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background: "rgba(212,175,55,0.13)",
                border: "1px solid rgba(212,175,55,0.34)",
                color: "#F3C95C",
                flexShrink: 0,
              }}
            >
              <Heart size={24} fill="currentColor" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#F8FAFC", marginBottom: 4 }}>{t.supportTitle}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.55 }}>{t.supportSubtitle}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              style={{
                height: 48,
                borderRadius: 14,
                border: "1px solid rgba(212,175,55,0.38)",
                background: "linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.10) 100%)",
                color: "#F3C95C",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <Heart size={16} fill="currentColor" style={{ display: "inline", marginRight: 8 }} />
              {t.supportMain}
            </button>

            <button
              type="button"
              style={{
                height: 48,
                borderRadius: 14,
                border: "1px solid #334155",
                background: "rgba(255,255,255,0.035)",
                color: "#E5E7EB",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <Info size={16} style={{ display: "inline", marginRight: 8 }} />
              {t.learnMore}
            </button>
          </div>

          <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.65, color: "#94A3B8" }}>
            {t.supportNote}
          </p>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 16, border: "1px solid #2B3648", background: "rgba(255,255,255,0.035)" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#F3C95C", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                {t.bankTitle}
              </div>
              <div style={{ display: "grid", gap: 6, color: "#E5E7EB", fontSize: 13, lineHeight: 1.5 }}>
                <div>Bank: Selcom Microfinance Bank</div>
                <div>Name: ISAYA HANCE MASIKA</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  Account: 5525106819163
                  <button
                    type="button"
                    onClick={() => copyText("5525106819163")}
                    style={{
                      border: "1px solid #334155",
                      background: "rgba(255,255,255,0.045)",
                      color: "#CBD5E1",
                      borderRadius: 10,
                      padding: "6px 8px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    <Copy size={12} /> {copyState || "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 16, border: "1px solid #2B3648", background: "rgba(255,255,255,0.035)" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#F3C95C", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                {t.mobileTitle}
              </div>
              <div style={{ display: "grid", gap: 6, color: "#E5E7EB", fontSize: 13, lineHeight: 1.5 }}>
                <div>Number: 255758561747</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {t.paymentNameRule}
                  <button
                    type="button"
                    onClick={() => copyText("255758561747")}
                    style={{
                      border: "1px solid #334155",
                      background: "rgba(255,255,255,0.045)",
                      color: "#CBD5E1",
                      borderRadius: 10,
                      padding: "6px 8px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    <Copy size={12} /> {copyState || "Copy"}
                  </button>
                </div>
                <div style={{ padding: 10, borderRadius: 12, background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.25)", color: "#F3C95C", fontSize: 12, fontWeight: 800 }}>
                  {t.confirmNameWarning}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#F8FAFC" }}>{t.aboutTitle}</div>
          </div>
          <p style={{ margin: "8px 0 0", color: "#94A3B8", fontSize: 13, lineHeight: 1.65 }}>
            {t.aboutContent}
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setMode("feedback")}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                border: "1px solid #334155",
                background: "rgba(255,255,255,0.035)",
                color: "#CBD5E1",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={closePopup}
              style={{
                flex: 1.2,
                height: 46,
                borderRadius: 14,
                border: "1px solid rgba(212,175,55,0.38)",
                background: "rgba(212,175,55,0.13)",
                color: "#F3C95C",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </EcosystemModalShell>
  );
}
