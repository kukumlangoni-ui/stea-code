import { useState, useEffect } from "react";
import { Trophy, Medal, User, Award, Loader2, ChevronDown, ChevronUp, AlertCircle, FileSpreadsheet, FileText, Check, Save } from "lucide-react";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth } from "../../firebase";

const GOLD = "#D4AF37";

export default function QuizLeaderboard({ quizId, role }) {
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [notice, setNotice] = useState(null);
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  // Local state for grading
  const [editingScores, setEditingScores] = useState({}); // { [submissionId_qIdx]: score }
  const [editingFeedback, setEditingFeedback] = useState({}); // { [submissionId_qIdx]: feedback }
  const [savingGradeId, setSavingGradeId] = useState(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!quizId || !db) return;

    // 1. Fetch Quiz details
    getDoc(doc(db, "quizzes", quizId)).then(snap => {
      if (snap.exists()) {
        setQuiz({ id: snap.id, ...snap.data() });
      }
    }).catch(err => console.error("Error fetching quiz:", err));

    // 2. Monitor Submissions
    const q = query(
      collection(db, "quizResults"),
      where("quizId", "==", quizId)
    );

    const unsub = onSnapshot(q, (snap) => {
      let subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      subs.sort((a, b) => b.score - a.score);
      setSubmissions(subs);
      setLoading(false);
    });

    return unsub;
  }, [quizId, db]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <Loader2 className="animate-spin" color={GOLD} />
      </div>
    );
  }

  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((acc, sub) => acc + (sub.percentage !== undefined ? sub.percentage : (sub.totalPoints ? (sub.score/sub.totalPoints)*100 : 0)), 0) / submissions.length)
    : 0;

  // Calculate Weak Areas (accuracy < 60%)
  const weakAreas = [];
  if (quiz && quiz.questions && submissions.length > 0) {
    quiz.questions.forEach((q, qIdx) => {
      const correctCount = submissions.filter(sub => {
        const ans = sub.answers?.find(a => a.questionIndex === qIdx);
        return ans?.isCorrect || ans?.pointsEarned > 0;
      }).length;
      const acc = Math.round((correctCount / submissions.length) * 100);
      if (acc < 60) {
        weakAreas.push({
          questionIndex: qIdx + 1,
          questionText: q.questionText || q.question,
          type: q.type || "mc",
          accuracy: acc,
          correctAnswerText: q.correctAnswerText || ""
        });
      }
    });
  }

  // Export Results to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Student Name,Student ID,Email,Phone,Score,Total Points,Percentage,Status,Submitted At\n";
    
    submissions.forEach((sub, idx) => {
      const statusText = sub.needsTeacherGrading && sub.status === "needs_grading" ? "Needs Grading" : "Graded";
      const timeStr = sub.submittedAt?.toDate ? new Date(sub.submittedAt.toDate()).toLocaleString() : "N/A";
      csvContent += `"${idx + 1}","${sub.studentName}","${sub.studentId || 'N/A'}","${sub.studentEmail || 'N/A'}","${sub.studentPhone || 'N/A'}","${sub.score}","${sub.totalPoints}","${Math.round(sub.percentage)}%","${statusText}","${timeStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz_results_${quiz?.title || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Results to PDF
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    const title = quiz?.title || "Quiz Results";
    const submissionsCount = submissions.length;
    const averageScore = avgScore;

    let rowsHtml = "";
    submissions.forEach((sub, idx) => {
      const statusText = sub.needsTeacherGrading && sub.status === "needs_grading" ? "Needs Grading" : "Graded";
      const timeStr = sub.submittedAt?.toDate ? new Date(sub.submittedAt.toDate()).toLocaleDateString() : "N/A";
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${sub.studentName}</b><br><small>${sub.studentId || 'No ID'}</small></td>
          <td>${sub.studentEmail || 'N/A'}</td>
          <td>${sub.score} / ${sub.totalPoints}</td>
          <td>${Math.round(sub.percentage)}%</td>
          <td>${statusText}</td>
          <td>${timeStr}</td>
        </tr>
      `;
    });

    let weakAreasHtml = "";
    if (weakAreas.length > 0) {
      weakAreasHtml = `
        <div class="weak-areas" style="background:#fce8e6; border:1px solid #f9d2cd; border-radius:8px; padding:16px; margin-bottom:30px;">
          <h3 style="margin-top:0; color:#c5221f; font-size:15px;">Maeneo ya Kurekebisha / Weak Areas</h3>
          <ul style="margin:0; padding-left:20px; font-size:13px;">
            ${weakAreas.map(w => `<li><b>Swali ${w.questionIndex}:</b> "${w.questionText}" - <b>Accuracy:</b> <span style="color:#d93025; font-weight:bold;">${w.accuracy}%</span></li>`).join("")}
          </ul>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #202124; padding: 40px; line-height: 1.5; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #202124; }
            .meta { color: #5f6368; font-size: 13px; margin-bottom: 24px; border-bottom: 2px solid ${GOLD}; padding-bottom: 10px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { flex: 1; border: 1px solid #dadce0; border-radius: 8px; padding: 16px; text-align: center; }
            .stat-val { font-size: 28px; font-weight: bold; color: ${GOLD}; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border-bottom: 1px solid #dadce0; padding: 10px; text-align: left; }
            th { background: #f8f9fa; font-weight: bold; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h1>Ripoti ya Quiz: ${title}</h1>
              <div class="meta">Imetolewa tarehe ${new Date().toLocaleDateString()}</div>
            </div>
            <button onclick="window.print()" style="background:${GOLD}; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer;">Print / Save PDF</button>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div>Jumla ya Waliotuma</div>
              <div class="stat-val">${submissionsCount}</div>
            </div>
            <div class="stat-card">
              <div>Wastani wa Ufaulu</div>
              <div class="stat-val">${averageScore}%</div>
            </div>
          </div>

          ${weakAreasHtml}

          <h3>Orodha ya Wanafunzi na Alama zao</h3>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Mwanafunzi</th>
                <th>Email</th>
                <th>Alama / Score</th>
                <th>Ufaulu</th>
                <th>Hali</th>
                <th>Tarehe</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Submit manual score grade override
  const handleSaveManualGrade = async (sub) => {
    if (!quiz) return;
    setSavingGradeId(sub.id);

    const updatedAnswers = sub.answers.map((ans, idx) => {
      const scoreKey = `${sub.id}_${idx}`;
      const manuallyGradedScore = editingScores[scoreKey];
      const manuallyGradedFeedback = editingFeedback[scoreKey];

      const cleanScore = manuallyGradedScore !== undefined ? Number(manuallyGradedScore) : (ans.pointsEarned || 0);
      const cleanFeedback = manuallyGradedFeedback !== undefined ? manuallyGradedFeedback : (ans.feedback || "");

      const q = quiz.questions[idx];
      const maxPts = q?.points || 1;
      const finalScore = Math.min(Math.max(0, cleanScore), maxPts);

      return {
        ...ans,
        pointsEarned: finalScore,
        isCorrect: finalScore > 0,
        feedback: cleanFeedback,
        status: "manually_graded"
      };
    });

    const newScore = updatedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const totalPoints = sub.totalPoints || 1;
    const newPercentage = (newScore / totalPoints) * 100;

    try {
      await updateDoc(doc(db, "quizResults", sub.id), {
        answers: updatedAnswers,
        score: newScore,
        percentage: newPercentage,
        needsTeacherGrading: false,
        status: "graded",
        gradedAt: serverTimestamp(),
        gradedBy: auth?.currentUser?.uid || ""
      });
      setNotice({ type: "success", message: "Submission graded successfully." });
    } catch (err) {
      console.error(err);
      setNotice({ type: "error", message: "Something went wrong" });
    } finally {
      setSavingGradeId(null);
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, padding: 20, border: "1px solid #dadce0", color: "#202124", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
      {notice && (
        <div role="status" style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 12, background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: notice.type === "error" ? "#b91c1c" : "#047857", border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`, fontSize: 13, fontWeight: 700 }}>
          {notice.message}
        </div>
      )}
      
      {/* Header and Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #e0e0e0", paddingBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy color={GOLD} size={18} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#202124" }}>Matokeo & Leaderboard</h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#5f6368", fontWeight: 600 }}>
            {submissions.length} Submissions | Avg: {avgScore}%
          </span>
          {role === 'teacher' && submissions.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
              <button
                onClick={handleExportCSV}
                style={{
                  background: "#fff", border: "1px solid #dadce0", color: "#3c4043",
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4
                }}
                title="Download CSV"
              >
                <FileSpreadsheet size={13} /> CSV
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  background: "#fff", border: "1px solid #dadce0", color: "#3c4043",
                  padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4
                }}
                title="Print PDF Report"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics: Weak Areas Panel (Teacher Only) */}
      {role === 'teacher' && weakAreas.length > 0 && (
        <div style={{ background: "#fef7e0", border: "1px solid #ffe082", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 6px 0", color: "#b78103", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={15} /> Weak Areas / Mapungufu ya Uelewa (Accuracy &lt; 60%)
          </h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#665014", lineHeight: 1.4 }}>
            {weakAreas.map(w => (
              <li key={w.questionIndex} style={{ marginBottom: 4 }}>
                <b>Swali {w.questionIndex}</b>: "{w.questionText}" 
                &nbsp;(Accuracy: <span style={{ color: "#c5221f", fontWeight: 700 }}>{w.accuracy}%</span>)
                {w.correctAnswerText && <span> | Jibu Sahihi: <i>{w.correctAnswerText}</i></span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Leaderboard List */}
      <div style={{ display: "flex", flexDir: "column", gap: 10, flexDirection: "column" }}>
        {submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: "#5f6368", fontSize: 13.5, fontStyle: "italic" }}>
            Bado hakuna wanafunzi waliofanya quiz hii.
          </div>
        ) : (
          submissions.map((sub, index) => {
            const perc = sub.percentage !== undefined ? Math.round(sub.percentage) : (sub.totalPoints ? Math.round((sub.score/sub.totalPoints)*100) : 0);
            const needsGrading = sub.needsTeacherGrading && sub.status === "needs_grading";
            
            return (
              <div 
                key={sub.id} 
                style={{ 
                  background: index === 0 ? "#fffbeb" : "#fff", 
                  borderRadius: 10, 
                  border: index === 0 ? `1.5px solid ${GOLD}` : "1px solid #dadce0", 
                  overflow: "hidden" 
                }}
              >
                <div 
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  style={{ 
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer"
                  }}
                >
                  <div style={{ minWidth: 24, fontSize: 12.5, fontWeight: 700, color: index < 3 ? GOLD : "#5f6368", display: "flex", alignItems: "center", gap: 2 }}>
                    {index === 0 ? <Medal size={15} /> : index === 1 ? <Medal size={15} style={{ opacity: 0.7 }} /> : index === 2 ? <Medal size={15} style={{ opacity: 0.4 }} /> : `#${index + 1}`}
                  </div>
                  
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f3f4", display: "grid", placeItems: "center" }}>
                    <User size={15} color={index === 0 ? GOLD : "#5f6368"} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, color: "#202124" }}>
                      {sub.studentName}
                      <span style={{ fontSize: 10, background: "#f1f3f4", padding: "1px 5px", borderRadius: 4, color: "#5f6368", fontWeight: 500 }}>
                        {sub.studentId || "No ID"}
                      </span>
                      {needsGrading && (
                        <span style={{ fontSize: 9.5, background: "#fce8e6", color: "#c5221f", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                          Needs Grading
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10.5, color: "#5f6368", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                      {sub.studentEmail && <span>📧 {sub.studentEmail}</span>}
                      {sub.studentPhone && <span>📞 {sub.studentPhone}</span>}
                      <span>⏱️ {sub.submittedAt?.toDate ? new Date(sub.submittedAt.toDate()).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", marginRight: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: index === 0 ? GOLD : "#202124" }}>
                      {sub.score} <span style={{ fontSize: 11, color: "#5f6368" }}>/ {sub.totalPoints}</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: "#5f6368", fontWeight: 700 }}>Ufaulu: {perc}%</div>
                  </div>
                  
                  <div style={{ color: "#5f6368" }}>
                    {expandedId === sub.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>
                
                {/* Expanded details & Manual grading */}
                {expandedId === sub.id && sub.answers && (
                  <div style={{ padding: "12px 14px", background: "#f8f9fa", borderTop: "1px solid #dadce0" }}>
                    <h4 style={{ fontSize: 11.5, color: "#5f6368", margin: "0 0 10px 0", fontWeight: 700, textTransform: "uppercase" }}>Question Review & Manual Grading</h4>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {sub.answers.map((ans, aIdx) => {
                        const q = quiz?.questions?.[ans.questionIndex];
                        const scoreKey = `${sub.id}_${aIdx}`;
                        
                        const currentScoreValue = editingScores[scoreKey] !== undefined ? editingScores[scoreKey] : (ans.pointsEarned || 0);
                        const currentFeedbackValue = editingFeedback[scoreKey] !== undefined ? editingFeedback[scoreKey] : (ans.feedback || "");

                        return (
                          <div key={aIdx} style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 8, padding: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#202124" }}>
                                Swali {ans.questionIndex + 1}: {q?.questionText || `Question ${ans.questionIndex + 1}`}
                              </div>
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: ans.isCorrect || ans.pointsEarned > 0 ? "#e6f4ea" : "#fce8e6", color: ans.isCorrect || ans.pointsEarned > 0 ? "#137333" : "#d93025" }}>
                                {ans.isCorrect || ans.pointsEarned > 0 ? `Correct: ${ans.pointsEarned}/${q?.points || 1}` : `Wrong: 0/${q?.points || 1}`}
                              </span>
                            </div>

                            {/* Render student selected option or written answer */}
                            <div style={{ fontSize: 12, color: "#3c4043", marginBottom: 6 }}>
                              <b>Jibu la Mwanafunzi:</b>&nbsp;
                              {ans.selectedAnswerText ? (
                                <span style={{ color: "#202124", fontWeight: 600 }}>{ans.selectedAnswerText}</span>
                              ) : (
                                <span style={{ fontStyle: "italic", color: "#5f6368" }}>Hakujibu</span>
                              )}
                            </div>

                            {/* Correct answer reference */}
                            <div style={{ fontSize: 11, color: "#5f6368", marginBottom: 8 }}>
                              <b>Correct Answer (Expected):</b> {q?.type === 'short' ? q.correctAnswerText : (q?.options?.[q.correctAnswerIndex] || "N/A")}
                            </div>

                            {/* Manual grade controls (Teacher Only) */}
                            {role === 'teacher' && (
                              <div style={{ display: "flex", gap: 10, alignItems: "center", borderTop: "1px dashed #e0e0e0", paddingTop: 8, marginTop: 8, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "#5f6368" }}>Override Score:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={q?.points || 1}
                                    value={currentScoreValue}
                                    onChange={e => setEditingScores({ ...editingScores, [scoreKey]: e.target.value })}
                                    style={{ width: 50, padding: "3px 6px", border: "1px solid #dadce0", borderRadius: 4, fontSize: 11.5, textAlign: "center", outline: "none" }}
                                  />
                                  <span style={{ fontSize: 11, color: "#5f6368" }}>/ {q?.points || 1}</span>
                                </div>

                                <input
                                  type="text"
                                  placeholder="Type feedback for this question..."
                                  value={currentFeedbackValue}
                                  onChange={e => setEditingFeedback({ ...editingFeedback, [scoreKey]: e.target.value })}
                                  style={{ flex: 1, minWidth: 150, padding: "3px 8px", border: "1px solid #dadce0", borderRadius: 4, fontSize: 11.5, outline: "none" }}
                                />
                              </div>
                            )}

                            {/* Display feedback if exists */}
                            {ans.feedback && (
                              <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#b78103", marginTop: 6 }}>
                                💡 <b>Maoni ya Mwalimu:</b> {ans.feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Return grades button */}
                    {role === 'teacher' && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                        <button
                          type="button"
                          disabled={savingGradeId === sub.id}
                          onClick={() => handleSaveManualGrade(sub)}
                          style={{
                            background: "#137333", color: "#fff", border: "none", borderRadius: 6,
                            padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6, opacity: savingGradeId === sub.id ? 0.7 : 1
                          }}
                        >
                          {savingGradeId === sub.id ? (
                            <>
                              <Loader2 className="animate-spin" size={13} /> Inarekodiwa...
                            </>
                          ) : (
                            <>
                              <Save size={13} /> Hifadhi & Rudisha Alama
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
