import { useState, useEffect } from "react";
import { Plus, Trash2, X, Save, Clock, HelpCircle, CheckCircle2, Loader2, Check, Search, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { serverTimestamp, addDoc, updateDoc, collection, doc, Timestamp, query, where, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { notifyClassStudents } from "./notificationUtils";

const GOLD = "#D4AF37";

export default function QuizCreatorModal({ classId, teacherId, classData, teacherName, quiz = null, onClose, onCreated, onUpdated }) {
  const db = getFirebaseDb();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([
    { question: "", type: "mc", options: ["", "", ""], correctIndex: null, correctAnswerText: "", points: "1", explanation: "" }
  ]);
  const [allowQuizRetake, setAllowQuizRetake] = useState(false);
  const [showQuizScoreImmediately, setShowQuizScoreImmediately] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [allowLateQuiz, setAllowLateQuiz] = useState(false);
  const [status, setStatus] = useState("published");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notice, setNotice] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (!quiz) return;
    setTitle(quiz.title || "");
    setDescription(quiz.description || "");
    setDuration(Number(quiz.durationMinutes) || 15);
    setQuestions((quiz.questions || []).map((q) => ({
      question: q.questionText || q.question || "",
      type: q.type || "mc",
      options: q.options && q.options.length > 0 ? [...q.options] : (q.type === "tf" ? ["Kweli (True)", "Si Kweli (False)"] : ["", "", ""]),
      correctIndex: q.correctAnswerIndex ?? null,
      correctAnswerText: q.correctAnswerText || "",
      points: String(q.points || 1),
      explanation: q.explanation || ""
    })));
    setAllowQuizRetake(Boolean(quiz.allowQuizRetake));
    setShowQuizScoreImmediately(quiz.showQuizScoreImmediately !== undefined ? quiz.showQuizScoreImmediately : true);
    setDueDate(quiz.dueDate ? (quiz.dueDate.toDate ? quiz.dueDate.toDate().toISOString().slice(0, 16) : new Date(quiz.dueDate).toISOString().slice(0, 16)) : "");
    setAllowLateQuiz(Boolean(quiz.allowLateQuiz));
    setStatus(quiz.status || "published");
  }, [quiz]);

  // Question Bank States
  const [showBank, setShowBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (type, message) => setNotice({ type, message });

  // Monitor Question Bank in real-time
  useEffect(() => {
    if (!teacherId || !db) return;
    const q = query(collection(db, "questionBank"), where("teacherId", "==", teacherId));
    const unsub = onSnapshot(q, (snap) => {
      setBankQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [teacherId, db]);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", type: "mc", options: ["", "", ""], correctIndex: null, correctAnswerText: "", points: "1", explanation: "" }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    
    // Autofill options if True/False selected
    if (field === "type" && value === "tf") {
      newQuestions[index].options = ["Kweli (True)", "Si Kweli (False)"];
      newQuestions[index].correctIndex = null;
    } else if (field === "type" && value === "mc") {
      newQuestions[index].options = ["", "", ""];
      newQuestions[index].correctIndex = null;
    } else if (field === "type" && value === "short") {
      newQuestions[index].options = [];
      newQuestions[index].correctIndex = null;
    }

    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length < 5) {
      newQuestions[qIndex].options.push("");
      setQuestions(newQuestions);
    }
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  // Save single question to question bank
  const saveQuestionToBank = async (q) => {
    if (!q.question.trim()) {
      showNotice("error", "Tafadhali andika swali kwanza.");
      return;
    }
    if (q.type === "mc" && (q.options.filter(o => o.trim()).length < 2 || q.correctIndex === null)) {
      showNotice("error", "Swali la Multiple Choice linahitaji angalau machaguo mawili na jibu sahihi lilichaguliwa.");
      return;
    }
    if (q.type === "tf" && q.correctIndex === null) {
      showNotice("error", "Tafadhali chagua jibu sahihi (Kweli au Si Kweli).");
      return;
    }
    if (q.type === "short" && !q.correctAnswerText.trim()) {
      showNotice("error", "Tafadhali andika jibu sahihi la mfano kwa ajili ya Short Answer.");
      return;
    }

    try {
      const cleanOptions = q.type !== "short" ? q.options.filter(o => o.trim() !== "") : [];
      let correctIdx = q.correctIndex;
      if (q.type === "mc") {
        const originalCorrectText = q.options[q.correctIndex] || "";
        correctIdx = cleanOptions.indexOf(originalCorrectText);
        if (correctIdx < 0) correctIdx = 0;
      }

      await addDoc(collection(db, "questionBank"), {
        questionText: q.question.trim(),
        type: q.type,
        options: cleanOptions,
        correctAnswerIndex: correctIdx,
        correctAnswerText: q.type === "short" ? q.correctAnswerText.trim() : "",
        points: Number(q.points) || 1,
        explanation: q.explanation.trim() || "",
        teacherId,
        createdAt: serverTimestamp()
      });
      showNotice("success", "Swali limehifadhiwa kwenye Benki ya Maswali!");
    } catch (err) {
      console.error(err);
      showNotice("error", "Imeshindwa kuhifadhi swali.");
    }
  };

  // Load question from Question Bank side panel
  const loadQuestionFromBank = (bq) => {
    setQuestions([
      ...questions,
      {
        question: bq.questionText || "",
        type: bq.type || "mc",
        options: bq.options && bq.options.length > 0 ? [...bq.options] : (bq.type === "mc" ? ["", "", ""] : bq.type === "tf" ? ["Kweli (True)", "Si Kweli (False)"] : []),
        correctIndex: bq.correctAnswerIndex !== undefined ? bq.correctAnswerIndex : null,
        correctAnswerText: bq.correctAnswerText || "",
        points: String(bq.points || "1"),
        explanation: bq.explanation || ""
      }
    ]);
  };

  const hasChanges = title.trim() !== "" || description.trim() !== "" || questions.some(q => q.question.trim() !== "");

  const handleClose = () => {
    if (hasChanges && !success) {
      setConfirmDialog({
        title: "Discard changes?",
        message: "You have unsaved quiz changes. If you close now, they will not be saved.",
        confirmText: "Discard",
        cancelText: "Keep editing",
        onConfirm: () => onClose()
      });
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!classId) {
      setErrorMsg("Class ID missing");
      return;
    }
    if (!teacherId) {
      setErrorMsg("Teacher ID missing");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Tafadhali andika jina la quiz (Quiz Title).");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Tafadhali weka angalau swali moja.");
      return;
    }
    
    // Detailed Validation
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) {
            setErrorMsg(`Tafadhali andika swali kwenye Namba ${i + 1}.`);
            return;
        }
        if (q.type === "mc") {
            const validOptions = q.options.filter(o => o.trim());
            if (validOptions.length < 2) {
                setErrorMsg(`Tafadhali weka angalau machaguo mawili kwenye Swali Namba ${i + 1}.`);
                return;
            }
            if (q.correctIndex === null) {
                setErrorMsg(`Tafadhali chagua jibu sahihi kwenye Swali Namba ${i + 1}.`);
                return;
            }
        } else if (q.type === "tf") {
            if (q.correctIndex === null) {
                setErrorMsg(`Tafadhali chagua Kweli au Si Kweli kwenye Swali Namba ${i + 1}.`);
                return;
            }
        } else if (q.type === "short") {
            if (!q.correctAnswerText.trim()) {
                setErrorMsg(`Tafadhali andika jibu sahihi la mfano kwa ajili ya kusahihisha otomatiki kwenye Swali Namba ${i + 1}.`);
                return;
            }
        }
        const pts = Number(q.points);
        if (isNaN(pts) || pts < 1) {
            setErrorMsg(`Alama za Swali Namba ${i + 1} lazima ziwe angalau 1.`);
            return;
        }
    }
    
    setSubmitting(true);
    setErrorMsg("");
    try {
      const safeDuration = Number(duration) || 15;

      const formattedQuestions = questions.map(q => {
        const cleanOptions = q.options.filter(o => o.trim() !== "");
        let newIndex = q.correctIndex;
        if (q.type === "mc") {
          const originalCorrectText = q.options[q.correctIndex] || "";
          newIndex = cleanOptions.indexOf(originalCorrectText);
          if (newIndex < 0) newIndex = 0;
        }

        return {
          questionText: q.question.trim(),
          type: q.type,
          options: cleanOptions,
          correctAnswerIndex: q.type !== "short" ? newIndex : null,
          correctAnswerText: q.type === "short" ? q.correctAnswerText.trim() : (cleanOptions[newIndex] || ""),
          points: Number(q.points) || 1,
          explanation: q.explanation.trim() || ""
        };
      });

      const quizData = {
        title: title.trim(),
        description: description.trim(),
        classId,
        classCode: classData?.classCode || classData?.joinCode || "",
        className: classData?.className || classData?.name || "Unknown Class",
        teacherId,
        teacherName: teacherName || "",
        questions: formattedQuestions,
        durationMinutes: safeDuration,
        status,
        allowQuizRetake,
        showQuizScoreImmediately,
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        allowLateQuiz,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (quiz?.id) {
        const updateData = { ...quizData };
        delete updateData.createdAt;
        await updateDoc(doc(db, "quizzes", quiz.id), {
          ...updateData,
          updatedAt: serverTimestamp()
        });
        await notifyClassStudents(classId, {
          type: "quiz",
          title: quiz.status !== "published" && status === "published" ? "New quiz published" : "Quiz updated",
          message: quiz.status !== "published" && status === "published" ? `${title.trim()} is now available.` : `Quiz "${title.trim()}" was updated.`,
          link: "quizzes",
          createdBy: teacherId
        });
        showNotice("success", "Quiz updated successfully.");
        setSuccess(true);
        setTimeout(() => {
          onUpdated?.({ id: quiz.id, ...updateData });
          onClose();
        }, 1200);
        return;
      }

      const docRef = await addDoc(collection(db, "quizzes"), quizData);
      
      await notifyClassStudents(classId, {
         type: "quiz",
         title: "Quiz Mpya Imetolewa",
         message: `Quiz mpya "${title.trim()}" ipo tayari.`,
         link: "quizzes",
         createdBy: teacherId
      });

      setSuccess(true);
      showNotice("success", "Quiz saved successfully.");
      setTimeout(() => {
        onCreated({ id: docRef.id, ...quizData });
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Quiz haijahifadhiwa. Tafadhali jaribu tena.");
      showNotice("error", "Something went wrong");
      setSubmitting(false);
    }
  };

  const filteredBankQuestions = bankQuestions.filter(bq => 
    (bq.questionText || "").toLowerCase().includes(bankSearch.toLowerCase()) ||
    (bq.explanation || "").toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div style={modalOverlayStyle}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          ...modalContentStyle,
          maxWidth: showBank ? 950 : 650,
          width: "95%",
          maxHeight: "90vh",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid #dadce0",
          background: "#ffffff",
          color: "#202124",
          fontFamily: "inherit"
        }}
      >
        {notice && (
          <div role="status" style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            color: notice.type === "error" ? "#b91c1c" : "#047857",
            border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`,
            fontSize: 13,
            fontWeight: 700
          }}>
            {notice.message}
          </div>
        )}
        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e0e0e0", paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#202124", display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle color={GOLD} size={22} /> Unda Quiz Mpya
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#5f6368" }}>Darasa: {classData?.className || classData?.name || "N/A"}</p>
          </div>
          
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowBank(!showBank)}
              style={{
                background: showBank ? "#fef7e0" : "#f1f3f4",
                border: showBank ? `1px solid ${GOLD}` : "1px solid #dadce0",
                color: showBank ? GOLD : "#3c4043",
                padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <Database size={16} /> Benki ya Maswali
            </button>
            <button onClick={handleClose} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", display: "grid", placeItems: "center" }}><X size={20} /></button>
          </div>
        </div>

        {/* Outer Split Layout */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 20 }}>
          
          {/* Main Quiz Editor Panel (Left) */}
          <div style={{ flex: 2, minHeight: 0, overflowY: "auto", paddingRight: 8 }} className="custom-scroll">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Jina la Quiz / Title</label>
                <input 
                  style={inputStyle} 
                  placeholder="Mfano: Physics Motion Quiz" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>
              <div>
                <label style={labelStyle}>Maelezo / Description</label>
                <input 
                  style={inputStyle} 
                  placeholder="Maelekezo mafupi..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Muda wa Kufanya (Minutes)</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[10, 15, 30, 60].map(m => (
                    <button 
                      key={m} 
                      type="button"
                      onClick={() => setDuration(m)}
                      style={{ 
                        flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #dadce0", fontWeight: 700, fontSize: 12,
                        background: duration === m ? GOLD : "#fff",
                        color: duration === m ? "#fff" : "#3c4043",
                        cursor: "pointer", transition: "0.2s"
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    style={{ width: 60, padding: 8, border: "1px solid #dadce0", borderRadius: 8, fontSize: 12, textAlign: "center" }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Muda wa mwisho / Due Date</label>
                <input 
                  type="datetime-local" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ ...inputStyle, padding: "8px 12px", marginBottom: 0 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, padding: "8px 12px" }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Quiz Settings */}
            <div style={{ background: "#f8f9fa", border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input 
                  type="checkbox" 
                  checked={allowQuizRetake}
                  onChange={e => setAllowQuizRetake(e.target.checked)}
                  id="allowQuizRetake"
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="allowQuizRetake" style={{ fontSize: 12.5, fontWeight: 600, color: "#3c4043", cursor: "pointer" }}>Ruhusu Kurudia (Retake)</label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input 
                  type="checkbox" 
                  checked={showQuizScoreImmediately}
                  onChange={e => setShowQuizScoreImmediately(e.target.checked)}
                  id="showQuizScoreImmediately"
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="showQuizScoreImmediately" style={{ fontSize: 12.5, fontWeight: 600, color: "#3c4043", cursor: "pointer" }}>Onyesha alama mara moja</label>
              </div>

              {dueDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={allowLateQuiz}
                    onChange={e => setAllowLateQuiz(e.target.checked)}
                    id="allowLateQuiz"
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="allowLateQuiz" style={{ fontSize: 12.5, fontWeight: 600, color: "#3c4043", cursor: "pointer" }}>Kuchelewa kunaruhusiwa</label>
                </div>
              )}
            </div>

            {/* Questions list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#5f6368", margin: 0 }}>MASWALI ({questions.length})</h3>
              
              {questions.map((q, qIdx) => (
                <div key={qIdx} style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>SWALI {qIdx + 1}</span>
                    
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {/* Save to Bank Button */}
                      <button
                        type="button"
                        onClick={() => saveQuestionToBank(q)}
                        style={{
                          background: "none", border: "none", color: "#5f6368", cursor: "pointer",
                          fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4
                        }}
                        title="Save this question to Question Bank"
                      >
                        <Database size={13} /> Hifadhi Benki
                      </button>

                      {questions.length > 1 && (
                        <button onClick={() => removeQuestion(qIdx)} style={{ background: "none", border: "none", color: "#d93025", cursor: "pointer", display: "grid", placeItems: "center" }}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>

                  {/* Question Type selector */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    {["mc", "tf", "short"].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateQuestion(qIdx, "type", type)}
                        style={{
                          flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid #dadce0",
                          background: q.type === type ? "#e8f0fe" : "#fff",
                          color: q.type === type ? "#1a73e8" : "#5f6368",
                          fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {type === "mc" ? "Multiple Choice" : type === "tf" ? "True / False" : "Short Answer"}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    style={{ ...inputStyle, minHeight: 60, padding: 10, fontSize: 13.5, marginBottom: 12 }} 
                    placeholder="Andika swali lako hapa..." 
                    value={q.question} 
                    onChange={e => updateQuestion(qIdx, "question", e.target.value)}
                  />

                  {/* Options container based on type */}
                  {q.type === "short" ? (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ ...labelStyle, fontSize: 10 }}>Jibu Sahihi la Auto-Grade (Keywords / Jibu sahihi kabisa)</label>
                      <input
                        style={{ ...inputStyle, padding: 10, fontSize: 13, marginBottom: 0 }}
                        placeholder="Mfano: Newton's Law, au Newton"
                        value={q.correctAnswerText}
                        onChange={e => updateQuestion(qIdx, "correctAnswerText", e.target.value)}
                      />
                      <p style={{ margin: "4px 0 0 4px", fontSize: 11, color: "#5f6368" }}>
                        Weka neno muhimu litakalotumika kusahihisha otomatiki. Mwalimu ataweza kusahihisha kwa mkono pia.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      <label style={{ ...labelStyle, fontSize: 10 }}>Options (Chagua jibu sahihi kwa kubonyeza mduara)</label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <button 
                            type="button"
                            onClick={() => updateQuestion(qIdx, "correctIndex", oIdx)}
                            style={{ 
                              width: 20, height: 20, borderRadius: "50%", border: "2px solid", 
                              borderColor: q.correctIndex === oIdx ? "#137333" : "#dadce0",
                              background: q.correctIndex === oIdx ? "#137333" : "none",
                              display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer"
                            }}
                          >
                            {q.correctIndex === oIdx && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                          </button>
                          
                          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                            <span style={{ position: "absolute", left: 10, color: "#5f6368", fontWeight: 700, fontSize: 12, pointerEvents: "none" }}>
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <input 
                              style={{ ...inputStyle, marginBottom: 0, padding: "8px 10px 8px 30px", fontSize: 13, border: "1px solid #dadce0" }} 
                              placeholder={q.type === "tf" ? (oIdx === 0 ? "Kweli" : "Si Kweli") : `Option ${oIdx + 1}`}
                              value={opt} 
                              disabled={q.type === "tf"} // Lock options editing for true/false
                              onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                            />
                          </div>

                          {q.type === "mc" && q.options.length > 2 && (
                            <button onClick={() => removeOption(qIdx, oIdx)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", flexShrink: 0 }}><X size={16} /></button>
                          )}
                        </div>
                      ))}

                      {q.type === "mc" && q.options.length < 5 && (
                        <button 
                          type="button"
                          onClick={() => addOption(qIdx)}
                          style={{
                            background: "#f1f3f4", border: "1px dashed #dadce0", padding: "6px 0", borderRadius: 8,
                            color: "#3c4043", fontSize: 11.5, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", paddingLeft: 12, paddingRight: 12
                          }}
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Points / Alama</label>
                      <input 
                        type="number" 
                        style={{ ...inputStyle, padding: "6px 10px", fontSize: 13, marginBottom: 0 }} 
                        value={q.points} 
                        onChange={e => updateQuestion(qIdx, "points", e.target.value)} 
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Ufafanuzi wa Jibu (Explanation - Optional)</label>
                      <input 
                        style={{ ...inputStyle, padding: "6px 10px", fontSize: 13, marginBottom: 0 }} 
                        placeholder="Kwa nini jibu hili ni sahihi?" 
                        value={q.explanation} 
                        onChange={e => updateQuestion(qIdx, "explanation", e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button"
              onClick={addQuestion}
              style={{
                width: "100%", padding: 14, borderRadius: 12, border: "1px dashed #dadce0", color: "#5f6368", background: "#f8f9fa",
                fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer"
              }}
            >
              <Plus size={16} /> Unda Swali Jingine
            </button>
          </div>

          {/* Question Bank Side Panel (Right) */}
          {showBank && (
            <div style={{ width: 320, borderLeft: "1px solid #dadce0", paddingLeft: 20, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#202124", margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <Database size={16} color={GOLD} /> Benki ya Maswali
              </h3>
              
              <div style={{ position: "relative", marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Tafuta swali..."
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #dadce0", borderRadius: 8, fontSize: 12, outline: "none" }}
                />
                <Search size={14} color="#5f6368" style={{ position: "absolute", left: 10, top: 10 }} />
              </div>

              <div style={{ flex: 1, overflowY: "auto" }} className="custom-scroll">
                {filteredBankQuestions.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#5f6368", textAlign: "center", padding: 20 }}>Benki haina maswali bado.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredBankQuestions.map(bq => (
                      <div key={bq.id} style={{ background: "#f8f9fa", border: "1px solid #dadce0", borderRadius: 8, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase",
                            background: bq.type === "mc" ? "#e8f0fe" : bq.type === "tf" ? "#fce8e6" : "#e6f4ea",
                            color: bq.type === "mc" ? "#1a73e8" : bq.type === "tf" ? "#d93025" : "#137333"
                          }}>
                            {bq.type === "mc" ? "MC" : bq.type === "tf" ? "T/F" : "Short"}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => loadQuestionFromBank(bq)}
                            style={{
                              background: GOLD, color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px",
                              fontSize: 10.5, fontWeight: 700, cursor: "pointer"
                            }}
                          >
                            + Ongeza
                          </button>
                        </div>
                        <p style={{ fontSize: 12, color: "#202124", margin: "0 0 4px 0", fontWeight: 600 }}>{bq.questionText}</p>
                        {bq.options && bq.options.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 10, color: "#5f6368" }}>
                            {bq.options.map((o, idx) => (
                              <span key={idx} style={{ background: "#fff", border: "1px solid #dadce0", padding: "1px 4px", borderRadius: 3 }}>
                                {String.fromCharCode(65 + idx)}. {o}
                              </span>
                            ))}
                          </div>
                        )}
                        {bq.type === "short" && (
                          <div style={{ fontSize: 10, color: "#137333", fontStyle: "italic" }}>
                            Jibu: {bq.correctAnswerText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {errorMsg && (
          <div style={{ flexShrink: 0, marginTop: 12, padding: 10, background: "#fce8e6", border: "1px solid #f9d2cd", borderRadius: 8, color: "#c5221f", fontSize: 12.5, fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Footer actions */}
        <div style={{ flexShrink: 0, display: "flex", gap: 12, marginTop: 20, borderTop: "1px solid #e0e0e0", paddingTop: 16 }}>
          <button 
            type="button"
            onClick={handleClose} 
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #dadce0", background: "#fff", color: "#3c4043", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
          >
            Ghairi / Cancel
          </button>
          
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitting || success}
            style={{ 
              flex: 2, 
              padding: 12, 
              borderRadius: 8, 
              border: "none", 
              background: success ? "#137333" : GOLD, 
              color: "#fff", 
              fontWeight: 900, 
              fontSize: 13.5,
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 8, 
              cursor: (submitting || success) ? "not-allowed" : "pointer", 
              opacity: submitting ? 0.7 : 1 
            }}
          >
            {success ? (
              <>
                <Check size={18} /> Imehifadhiwa kikamilifu!
              </>
            ) : submitting ? (
              <>
                <Loader2 size={18} className="spin-anim" /> Inatengenezwa...
              </>
            ) : (
              <>
                <Save size={18} /> Save & Publish Quiz
              </>
            )}
          </button>
        </div>

      </motion.div>

      <AnimatePresence>
        {confirmDialog && (
          <div style={modalOverlayStyle}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} style={{ ...modalContentStyle, maxWidth: 460, background: "#fff", borderRadius: 16, border: "1px solid #dadce0", color: "#202124" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{confirmDialog.title}</h3>
              <p style={{ margin: "12px 0 0", color: "#5f6368", lineHeight: 1.6, fontSize: 14 }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setConfirmDialog(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #dadce0", background: "#fff", color: "#202124", fontWeight: 700 }}>
                  {confirmDialog.cancelText}
                </button>
                <button type="button" onClick={async () => { const action = confirmDialog.onConfirm; setConfirmDialog(null); if (action) await action(); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: GOLD, color: "#fff", fontWeight: 800 }}>
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); borderRadius: 10px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 4000 };
const modalContentStyle = { padding: 24, display: "flex", flexDirection: "column" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#5f6368", textTransform: "uppercase", letterSpacing: 0.5 };
const inputStyle = { width: "100%", background: "#fff", border: "1px solid #dadce0", padding: "10px 14px", borderRadius: 8, color: "#202124", outline: "none", fontSize: 13.5, marginBottom: 12 };
