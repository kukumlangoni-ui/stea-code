import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";
import { doc, getDoc, collection, addDoc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  Clock, 
  Award, 
  Loader2,
  ChevronRight,
  User,
  AlertCircle
} from "lucide-react";
const GOLD = "#D4AF37";

export default function QuizPlayPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const previewMode = new URLSearchParams(location.search).get("preview") === "1";

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState({ name: "", studentId: "", phone: "" });
  const [isStarted, setIsStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIdx]: selectedIndex OR shortAnswerText }
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/?classroom=true");
    }
  };

  useEffect(() => {
    if (!quizId || !db) return;

    const fetchQuiz = async () => {
      try {
        const snap = await getDoc(doc(db, "quizzes", quizId));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setQuiz(data);
          setTimeLeft(data.durationMinutes * 60);
          
          // Pre-fill user info if logged in
          const u = auth?.currentUser;
          if (u) {
            setStudentInfo({ name: u.displayName || "", studentId: "", phone: "" });
            
            if (data.classId && !previewMode) {
              const collectionName = data.isOldCollection ? "attendanceClasses" : "classes";
              
              // Verify Class Membership
              const studentDoc = await getDoc(doc(db, "classes", data.classId, "classStudents", u.uid));
              let isMember = studentDoc.exists();
              let sData = isMember ? studentDoc.data() : null;
              
              if (!isMember) {
                const legacyDoc = await getDoc(doc(db, "attendanceClasses", data.classId, "classStudents", u.uid));
                isMember = legacyDoc.exists();
                sData = isMember ? legacyDoc.data() : null;
              }

              // Check if teacher/admin
              let isTeacherOrAdmin = false;
              try {
                const classDoc = await getDoc(doc(db, collectionName, data.classId));
                if (classDoc.exists() && classDoc.data().teacherId === u.uid) {
                  isTeacherOrAdmin = true;
                }
                if (u.email === "stea.africa@gmail.com") {
                  isTeacherOrAdmin = true;
                }
              } catch (classErr) {
                console.error("Error checking teacher status:", classErr);
              }

              if (!isMember && !isTeacherOrAdmin) {
                 setError("Hujaunganishwa na darasa hili la masomo.");
                 setLoading(false);
                 return;
              }

              // Check duplicate attempts
              const dupQuery = query(collection(db, "quizResults"), where("quizId", "==", quizId), where("studentUid", "==", u.uid));
              const dupSnap = await getDocs(dupQuery);
              if (!dupSnap.empty && !data.allowQuizRetake) {
                 setError("Ulishafanya quiz hii tayari na kurudia hairuhusiwi.");
                 setLoading(false);
                 return;
              }

              // Check deadline
              const dueDateVal = data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : null);
              const isLate = dueDateVal && dueDateVal < new Date();
              if (isLate && !data.allowLateQuiz) {
                 setError("Muda wa kufanya quiz hii umekwisha pita.");
                 setLoading(false);
                 return;
              }

              if (sData) {
                setStudentInfo({
                  name: sData.studentName || u.displayName || "",
                  studentId: sData.studentId || "",
                  phone: sData.studentPhone || sData.phone || ""
                });
              }
            }
          }

          if (previewMode) {
            setStudentInfo({
              name: auth?.currentUser?.displayName || "Preview Student",
              studentId: "PREVIEW-001",
              phone: ""
            });
          }
        } else {
          setError("Quiz haijapatikana.");
        }
      } catch (err) {
        console.error(err);
        setError("Hitilafu imetokea wakati wa kupakia quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, db, auth?.currentUser, previewMode]);

  const handleSubmit = useCallback(async () => {
    if (submitting || result || !quiz) return;
    if (quiz.status === "closed" && !previewMode) {
      setNotice({ type: "error", message: "This quiz is closed. You can view it, but submissions are disabled." });
      return;
    }
    setSubmitting(true);

    let score = 0;
    let correctCount = 0;
    let needsTeacherGrading = false;

    const submissionAnswers = quiz.questions.map((q, idx) => {
      const studentAnswer = answers[idx]; // index for mc/tf, string for short answer
      let isCorrect = false;
      let pointsEarned = 0;

      if (q.type === 'short') {
        needsTeacherGrading = true;
        const studentText = String(studentAnswer || '').trim().toLowerCase();
        const correctText = String(q.correctAnswerText || '').trim().toLowerCase();
        
        // Auto-grade comparison (matches exact or split keywords)
        isCorrect = studentText !== '' && (
          studentText === correctText || 
          correctText.split(',').map(kw => kw.trim()).includes(studentText)
        );
        pointsEarned = isCorrect ? (q.points || 1) : 0;
      } else {
        const selectedIndex = studentAnswer;
        isCorrect = selectedIndex !== undefined && selectedIndex === q.correctAnswerIndex;
        pointsEarned = isCorrect ? (q.points || 1) : 0;
      }

      if (isCorrect) {
        score += pointsEarned;
        correctCount += 1;
      }

      return {
        questionIndex: idx,
        type: q.type || 'mc',
        selectedAnswerIndex: q.type !== 'short' && studentAnswer !== undefined ? studentAnswer : null,
        selectedAnswerText: q.type === 'short' ? (studentAnswer || '') : (studentAnswer !== undefined ? (q.options[studentAnswer] || '') : ''),
        pointsEarned,
        isCorrect,
        status: q.type === 'short' ? 'needs_grading' : 'auto_graded'
      };
    });

    const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const totalQuestions = quiz.questions.length;
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    const submission = {
      quizId,
      classId: quiz.classId || "",
      className: quiz.className || "",
      teacherId: quiz.teacherId || "",
      studentUid: auth?.currentUser?.uid || null,
      studentUserId: auth?.currentUser?.uid || null, // legacy compatibility
      studentName: studentInfo.name || "Mwanafunzi Mgeni",
      studentId: studentInfo.studentId || "",
      studentEmail: auth?.currentUser?.email || "",
      studentPhone: studentInfo.phone || "",
      answers: submissionAnswers,
      score,
      totalPoints,
      percentage,
      correctCount,
      totalQuestions,
      needsTeacherGrading,
      status: needsTeacherGrading ? "needs_grading" : "completed",
      submittedAt: serverTimestamp()
    };

    try {
      if (previewMode) {
        setNotice({ type: "success", message: "Preview only. No result was saved." });
        setResult({ score, totalPoints, percentage, answers: submissionAnswers, needsTeacherGrading });
        setSubmitting(false);
        return;
      }

      const resultId = `${quizId}_${auth?.currentUser?.uid || "anonymous"}`;
      const existingResultSnap = await getDoc(doc(db, "quizResults", resultId));
      const attemptNumber = existingResultSnap.exists()
        ? (Number(existingResultSnap.data()?.attemptNumber) || 1) + 1
        : 1;

      if (existingResultSnap.exists() && !quiz.allowQuizRetake) {
        setNotice({ type: "error", message: "Ulishafanya quiz hii tayari na kurudia hairuhusiwi." });
        setSubmitting(false);
        return;
      }

      const existingAttempts = existingResultSnap.exists() ? (Array.isArray(existingResultSnap.data()?.attempts) ? existingResultSnap.data().attempts : []) : [];
      const nextAttempt = {
        attemptNumber,
        submittedAt: serverTimestamp(),
        score,
        totalPoints,
        percentage,
        answers: submissionAnswers
      };

      await setDoc(doc(db, "quizResults", resultId), {
        ...submission,
        attemptNumber,
        attempts: [...existingAttempts, nextAttempt],
        status: "submitted"
      });

      await addDoc(collection(db, "notifications"), {
        userId: quiz.teacherId || "",
        classId: quiz.classId || "",
        quizId,
        type: "quiz_submitted",
        title: "New quiz submission",
        message: `${studentInfo.name || "A student"} submitted ${quiz.title}.`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      // Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "quiz_submitted",
        classId: quiz.classId || "",
        className: quiz.className || "",
        userId: auth?.currentUser?.uid || null,
        userName: studentInfo.name || "Mwanafunzi Mgeni",
        timestamp: serverTimestamp(),
        details: {
          quizId,
          quizTitle: quiz.title,
          score,
          totalPoints,
          percentage
        }
      }).catch(err => console.error("Error creating audit log:", err));
      
      setResult({ score, totalPoints, percentage, answers: submissionAnswers, needsTeacherGrading });
    } catch (err) {
      console.error(err);
      setNotice({ type: "error", message: "Error submitting quiz results." });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, result, quiz, answers, studentInfo, auth?.currentUser, db, quizId, previewMode]);

  // Timer logic
  useEffect(() => {
    if (isStarted && timeLeft > 0 && !result) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStarted, timeLeft, result, handleSubmit]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f9fa", color: "#202124" }}>
        <Loader2 className="animate-spin" size={48} color={GOLD} />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f9fa", color: "#202124" }}>
        <div style={{ textAlign: "center", padding: 32, background: "#fff", border: "1px solid #dadce0", borderRadius: 16, maxWidth: 450, width: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <AlertCircle size={48} color="#EF4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#202124" }}>{error || "Quiz not found"}</h2>
          <button onClick={handleBack} style={{ background: GOLD, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, marginTop: 16, cursor: "pointer" }}>Rudi Nyumbani</button>
        </div>
      </div>
    );
  }

  // Result display
  if (result) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", color: "#202124", padding: "40px 16px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          {notice && (
            <div role="status" style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: notice.type === "error" ? "#b91c1c" : "#047857", border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`, fontSize: 13, fontWeight: 700 }}>
              {notice.message}
            </div>
          )}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "#fff", border: "1px solid #dadce0", padding: 32, borderRadius: 24, textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
            
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(212, 175, 55, 0.1)", display: "grid", placeItems: "center", margin: "0 auto 24px", border: `2px solid ${GOLD}40` }}>
              <Award size={44} color={GOLD} />
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: "#202124" }}>Kazi Nzuri!</h1>
            <p style={{ color: "#5f6368", marginBottom: 24, fontSize: 14 }}>Umekamilisha quiz ya <b>{quiz.title}</b></p>

            {quiz.showQuizScoreImmediately !== false ? (
              <>
                <div style={{ background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: 16, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontSize: 10.5, color: "#5f6368", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>SCORE YAKO</div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: GOLD }}>
                    {result.score} <span style={{ fontSize: 20, color: "#5f6368" }}>/ {result.totalPoints}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#137333", marginTop: 6 }}>
                    {Math.round((result.score / result.totalPoints) * 100)}% Accuracy
                  </div>
                </div>

                {result.needsTeacherGrading && (
                  <div style={{ background: "#fef7e0", border: "1px solid #ffe082", padding: 12, borderRadius: 8, fontSize: 12.5, color: "#b78103", marginBottom: 20, textAlign: "left", lineHeight: 1.4 }}>
                    ⚠️ <b>Short Answers Pending Review:</b> Alama zako zinaweza kubadilika baada ya mwalimu wako kusahihisha maswali ya majibu mafupi kwa mkono.
                  </div>
                )}

              </>
            ) : (
              <div style={{ background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: 16, padding: 20, marginBottom: 24, fontSize: 14.5, fontWeight: 600, color: GOLD, lineHeight: 1.5 }}>
                Majibu yako yamehifadhiwa kikamilifu. Alama zitatolewa baada ya mwalimu kusahihisha.
              </div>
            )}

            <button 
              onClick={handleBack}
              style={{ width: "100%", background: GOLD, color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, marginTop: 24, cursor: "pointer" }}
            >
              Rudi kwenye Darasa
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Info Entry screen before quiz starts
  if (!isStarted) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", color: "#202124", padding: "40px 16px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          {notice && (
            <div role="status" style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: notice.type === "error" ? "#b91c1c" : "#047857", border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`, fontSize: 13, fontWeight: 700 }}>
              {notice.message}
            </div>
          )}
          
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: "#fff", border: "1px solid #dadce0", padding: 32, borderRadius: 24, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
             <div style={{ background: "rgba(212, 175, 55, 0.1)", width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", marginBottom: 20 }}>
                <HelpCircle size={28} color={GOLD} />
             </div>
             
             <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: "#202124" }}>{quiz.title}</h1>
             <p style={{ color: "#5f6368", marginBottom: 24, fontSize: 13.5, lineHeight: 1.5 }}>{quiz.description || "Tafadhali kamilisha quiz hii chini ya muda uliopangwa kupima uelewa wako."}</p>

             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                <div style={{ background: "#f8f9fa", border: "1px solid #dadce0", padding: 14, borderRadius: 12 }}>
                   <div style={{ fontSize: 9.5, color: "#5f6368", fontWeight: 700, marginBottom: 2 }}>TOTAL QUESTIONS</div>
                   <div style={{ fontSize: 16, fontWeight: 800, color: "#202124" }}>{quiz.questions.length} Qs</div>
                </div>
                <div style={{ background: "#f8f9fa", border: "1px solid #dadce0", padding: 14, borderRadius: 12 }}>
                   <div style={{ fontSize: 9.5, color: "#5f6368", fontWeight: 700, marginBottom: 2 }}>TIME LIMIT</div>
                   <div style={{ fontSize: 16, fontWeight: 800, color: "#202124" }}>{quiz.durationMinutes} Mins</div>
                </div>
             </div>

             <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                <div>
                   <label style={labelStyle}>Majina yako / Full Name *</label>
                   <input 
                     style={inputStyle} 
                     placeholder="Mfano: Juma Salum"
                     value={studentInfo.name}
                     onChange={e => setStudentInfo({...studentInfo, name: e.target.value})}
                     required
                   />
                </div>

                <div>
                   <label style={labelStyle}>Namba ya Mwanafunzi / Student ID *</label>
                   <input 
                     style={inputStyle} 
                     placeholder="Mfano: STEA-002"
                     value={studentInfo.studentId}
                     onChange={e => setStudentInfo({...studentInfo, studentId: e.target.value})}
                     required
                   />
                </div>

                <div>
                   <label style={labelStyle}>Namba ya Simu / Phone (Hiari)</label>
                   <input 
                     style={inputStyle} 
                     placeholder="Mfano: 0712345678"
                     value={studentInfo.phone}
                     onChange={e => setStudentInfo({...studentInfo, phone: e.target.value})}
                   />
                </div>
             </div>

             {quiz.status === "closed" && !previewMode && (
               <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.18)", fontSize: 13, fontWeight: 700 }}>
                 This quiz is closed. You can view it, but you cannot submit unless the teacher reopens it.
               </div>
             )}

             <button 
               onClick={() => setIsStarted(true)}
               disabled={!studentInfo.name.trim() || !studentInfo.studentId.trim() && !previewMode}
               style={{ 
                 width: "100%", background: GOLD, color: "#fff", border: "none", padding: 16, borderRadius: 12, fontWeight: 700, fontSize: 15, 
                 cursor: (studentInfo.name.trim() && (studentInfo.studentId.trim() || previewMode)) ? "pointer" : "not-allowed", 
                 opacity: (studentInfo.name.trim() && (studentInfo.studentId.trim() || previewMode)) ? 1 : 0.5, 
                 display: "flex", alignItems: "center", justifyContent: "center", gap: 8 
               }}
             >
               ANZA QUIZ SASA <ArrowRight size={18} />
             </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQ];
  const canProceed = currentQuestion.type === 'short' ? true : (answers[currentQ] !== undefined);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", color: "#202124", padding: "24px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {notice && (
          <div role="status" style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: notice.type === "error" ? "#b91c1c" : "#047857", border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`, fontSize: 13, fontWeight: 700 }}>
            {notice.message}
          </div>
        )}
        
        {/* Quiz play header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(212, 175, 55, 0.1)", display: "grid", placeItems: "center" }}>
                <Clock size={18} color={GOLD} />
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: "#5f6368", fontWeight: 700 }}>MUDA ULIOSALIA</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: timeLeft < 60 ? "#d93025" : "#202124" }}>{formatTime(timeLeft)}</div>
              </div>
           </div>
           
           <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9.5, color: "#5f6368", fontWeight: 700 }}>PROGRESS</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{currentQ + 1} <span style={{ fontSize: 11, opacity: 0.5 }}>/ {quiz.questions.length}</span></div>
           </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: 6, background: "#dadce0", borderRadius: 10, marginBottom: 32, overflow: "hidden" }}>
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
             style={{ height: "100%", background: GOLD, borderRadius: 10 }} 
           />
        </div>

        {/* Question area */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQ}
            initial={{ x: 15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -15, opacity: 0 }}
            style={{ background: "#fff", border: "1px solid #dadce0", padding: 24, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: "#202124" }}>{currentQuestion.questionText || currentQuestion.question}</h2>
              <div style={{ display: "inline-flex", background: "rgba(212, 175, 55, 0.1)", color: GOLD, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{currentQuestion.points} POINTS</div>
            </div>

            {/* Answer inputs based on question type */}
            {currentQuestion.type === 'short' ? (
              <div>
                <textarea
                  placeholder="Andika jibu lako hapa..."
                  value={answers[currentQ] || ""}
                  onChange={e => setAnswers({...answers, [currentQ]: e.target.value})}
                  style={{
                    width: "100%", minHeight: 120, padding: 12, borderRadius: 10,
                    border: "1px solid #dadce0", background: "#fff",
                    color: "#202124", fontSize: 14.5, fontFamily: "inherit", outline: "none", resize: "vertical"
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                 {currentQuestion.options.map((opt, i) => (
                   <button 
                     key={i}
                     onClick={() => setAnswers({...answers, [currentQ]: i})}
                     style={{ 
                       display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, 
                       border: "1px solid", 
                       borderColor: answers[currentQ] === i ? GOLD : "#dadce0",
                       background: answers[currentQ] === i ? "#fef7e0" : "#fff",
                       color: "#202124", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "0.2s"
                     }}
                   >
                     <div style={{ 
                       width: 26, height: 26, borderRadius: 6, 
                       background: answers[currentQ] === i ? GOLD : "#f1f3f4",
                       color: answers[currentQ] === i ? "#fff" : "#5f6368",
                       display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700
                     }}>
                       {String.fromCharCode(65 + i)}
                     </div>
                     {opt}
                   </button>
                 ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation actions */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <button 
             onClick={() => setCurrentQ(prev => prev - 1)}
             disabled={currentQ === 0}
             style={{ background: "none", border: "none", color: "#5f6368", fontWeight: 700, padding: 12, cursor: currentQ === 0 ? "not-allowed" : "pointer", fontSize: 13 }}
           >
             NYUMA / PREVIOUS
           </button>

           {currentQ < quiz.questions.length - 1 ? (
             <button 
               onClick={() => setCurrentQ(prev => prev + 1)}
               disabled={!canProceed}
               style={{ 
                 background: GOLD, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, 
                 display: "flex", alignItems: "center", gap: 6, cursor: canProceed ? "pointer" : "not-allowed", opacity: canProceed ? 1 : 0.5, fontSize: 13.5
               }}
             >
               NEXT <ChevronRight size={16} />
             </button>
           ) : (
             <button 
               onClick={handleSubmit}
               disabled={submitting || !canProceed}
               style={{ 
                 background: "#137333", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, 
                 cursor: (submitting || !canProceed) ? "not-allowed" : "pointer", opacity: (submitting || !canProceed) ? 0.5 : 1, 
                 display: "flex", alignItems: "center", gap: 8, fontSize: 13.5
               }}
             >
               {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} 
               SUBMIT QUIZ
             </button>
           )}
        </div>

      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 10.5, color: "#5f6368", fontWeight: 700, marginBottom: 6, marginLeft: 2 };
const inputStyle = { width: "100%", background: "#fff", border: "1px solid #dadce0", padding: "10px 12px", borderRadius: 8, color: "#202124", outline: "none", fontSize: 14 };
