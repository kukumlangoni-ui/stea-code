import { useState, useEffect, useRef } from "react";
import { getExactStorageErrorMessage, getFirebaseDb, logFirebaseStorageError, logStorageUpload, storage } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getDoc,
  setDoc,
  getCountFromServer
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "firebase/storage";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  CheckCircle, 
  Clock, 
  FileText,
  User,
  MessageSquare,
  Award,
  Paperclip,
  X,
  AlertCircle,
  BarChart,
  Download,
  ListChecks,
  Eye,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  UserX
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const G = "#F5A623";

export default function AssignmentSubmissions({ assignment, onBack, isTeacher, user, classData, classStudents = [] }) {
  const db = getFirebaseDb();
  const [submissions, setSubmissions] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const [studentRegName, setStudentRegName] = useState(user?.displayName || "");
  const [studentRegId, setStudentRegId] = useState("");
  const [studentRegPhone, setStudentRegPhone] = useState("");
  const [studentProfile, setStudentProfile] = useState(null);
  const [isEditingResubmission, setIsEditingResubmission] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const dueDateVal = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : (assignment.dueDate ? new Date(assignment.dueDate) : null);
  const isLate = dueDateVal && dueDateVal < new Date();
  const isSubmissionBlocked = isLate && !assignment.allowLateSubmission && !assignment.allowLateAssignment;

  const handleStartResubmit = () => {
    if (userSubmission) {
      setTextAnswer(userSubmission.textAnswer || "");
      setFileUrls(userSubmission.fileUrls || (userSubmission.fileUrl ? [{ name: "Faili la Awali", url: userSubmission.fileUrl }] : []));
    }
    setIsEditingResubmission(true);
  };

  useEffect(() => {
    if (!isTeacher && user?.uid && assignment.classId && db) {
      const getProfile = async () => {
        try {
          const studentDoc = await getDoc(doc(db, "classes", assignment.classId, "classStudents", user.uid));
          if (studentDoc.exists()) {
            setStudentProfile(studentDoc.data());
          } else {
            const legacyDoc = await getDoc(doc(db, "attendanceClasses", assignment.classId, "classStudents", user.uid));
            if (legacyDoc.exists()) {
              setStudentProfile(legacyDoc.data());
            }
          }
        } catch (err) {
          console.warn("Failed to load student profile:", err);
        }
      };
      getProfile();
    }
  }, [isTeacher, user?.uid, assignment.classId, db]);

  useEffect(() => {
    if (studentProfile) {
      setStudentRegName(prev => prev || studentProfile.studentName || user?.displayName || "");
      setStudentRegId(prev => prev || studentProfile.studentId || "");
      setStudentRegPhone(prev => prev || studentProfile.studentPhone || studentProfile.phone || "");
    }
  }, [studentProfile, user]);

  // Pagination & Filtering
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, submitted, marked, late
  const PAGE_SIZE = 20;
  
  // Student Form State
  const [textAnswer, setTextAnswer] = useState("");
  const [fileUrls, setFileUrls] = useState([]);
  const [uploads, setUploads] = useState({});
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Success Message
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Teacher Grading State
  const [grading, setGrading] = useState(null); 
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradedSuccess, setGradedSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [counts, setCounts] = useState({ totalSub: 0, marked: 0, late: 0 });

  useEffect(() => {
    if (gradedSuccess) {
      const timer = setTimeout(() => setGradedSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gradedSuccess]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  // Fetcher logic (centralized)
  const fetchSubmissions = async (isLoadMore = false) => {
    const db = getFirebaseDb();
    if (!db || !assignment.id) return;

    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
      setSubmissions([]);
      setLastDoc(null);
    }

    try {
      let q;
      const baseRef = collection(db, "assignmentSubmissions");
      
      if (isTeacher) {
        let q = query(baseRef, where("assignmentId", "==", assignment.id));
        const snap = await getDocs(q);
        let allSubmissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (filter === "marked") allSubmissions = allSubmissions.filter(s => s.status === "marked");
        if (filter === "submitted") allSubmissions = allSubmissions.filter(s => s.status === "submitted");
        if (filter === "late") allSubmissions = allSubmissions.filter(s => s.isLate);
        
        if (searchQuery.trim()) {
          const term = searchQuery.trim().toLowerCase();
          allSubmissions = allSubmissions.filter(s => s.studentName?.toLowerCase().includes(term));
        }

        allSubmissions.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return timeB - timeA;
        });

        // Simple local pagination
        const startIndex = isLoadMore ? submissions.length : 0;
        const newSubmissions = allSubmissions.slice(startIndex, startIndex + PAGE_SIZE);
        
        setSubmissions(prev => isLoadMore ? [...prev, ...newSubmissions] : newSubmissions);
        setHasMore(startIndex + PAGE_SIZE < allSubmissions.length);
      } else {
        if (!user?.uid) {
          setUserSubmission(null);
          return;
        }
        q = query(baseRef, where("assignmentId", "==", assignment.id), where("studentUserId", "==", user.uid), limit(1));
        const snap = await getDocs(q);
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUserSubmission(arr[0] || null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(false);
    
    if (isTeacher) {
      const db = getFirebaseDb();
      const baseRef = collection(db, "assignmentSubmissions");
      const qTotal = query(baseRef, where("assignmentId", "==", assignment.id));
      const qMarked = query(baseRef, where("assignmentId", "==", assignment.id), where("status", "==", "marked"));
      const qLate = query(baseRef, where("assignmentId", "==", assignment.id), where("isLate", "==", true));
      
      Promise.all([
        getCountFromServer(qTotal),
        getCountFromServer(qMarked),
        getCountFromServer(qLate)
      ]).then(([total, marked, late]) => {
        setCounts({
          totalSub: total.data().count,
          marked: marked.data().count,
          late: late.data().count
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.id, isTeacher, user?.uid, filter, searchQuery]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadError("");
    if (!user?.uid) {
      setUploadError("Please sign in before uploading files.");
      return;
    }
    const studentUserId = user.uid;

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`Faili "${file.name}" ni kubwa mno (Max 25MB).`);
        continue;
      }

      const storagePath = `classAssignments/${assignment.classId}/${assignment.id}/submissions/${studentUserId}/${file.name}`;
      logStorageUpload(storagePath);
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploads(prev => ({ ...prev, [file.name]: 0 }));

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploads(prev => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          logFirebaseStorageError(error);
          setUploadError(`Faili "${file.name}" halijapakiwa. ${getExactStorageErrorMessage(error)}`);
          setUploads(prev => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFileUrls(prev => [...prev, { 
            name: file.name, 
            url, 
            size: file.size, 
            type: file.type,
            uploadedAt: new Date().toISOString()
          }]);
          setUploads(prev => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentRegName.trim() || !studentRegId.trim()) {
      setErrorMsg("Full name and student ID are required.");
      return;
    }
    if (!textAnswer.trim() && fileUrls.length === 0) return;
    if (Object.keys(uploads).length > 0) return;

    if (isSubmissionBlocked) {
      setErrorMsg("The submission deadline has passed.");
      return;
    }

    setSubmitting(true);
    try {
      if (!user?.uid) {
        setErrorMsg("Please sign in before submitting.");
        setSubmitting(false);
        return;
      }
      const submissionUser = user;
      
      const dueDateVal = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate || Date.now());
      const isLate = dueDateVal < new Date();

      const payload = {
        assignmentId: assignment.id,
        classId: assignment.classId,
        studentUserId: submissionUser.uid,
        studentUid: submissionUser.uid,
        studentName: studentRegName.trim(),
        studentId: studentRegId.trim(),
        studentRegNo: studentRegId.trim(),
        studentPhone: studentRegPhone.trim(),
        studentEmail: submissionUser.email || "",
        email: submissionUser.email || "", // Dual compatibility
        fileUrl: fileUrls[0]?.url || "", // Dual compatibility
        fileName: fileUrls[0]?.name || "",
        fileType: fileUrls[0]?.type || "",
        fileUrls,
        textAnswer,
        submittedAt: serverTimestamp(),
        status: "submitted",
        isLate,
        marks: userSubmission?.marks || null,
        grade: userSubmission?.marks || null, // Dual compatibility
        teacherComment: userSubmission?.teacherComment || "",
        feedback: userSubmission?.teacherComment || "", // Dual compatibility
        markedAt: userSubmission?.markedAt || null,
        markedBy: userSubmission?.markedBy || null
      };

      console.log("SUBMISSION DEBUG - Assignment Submission Payload:", payload);

      if (userSubmission) {
        await updateDoc(doc(db, "assignmentSubmissions", userSubmission.id), payload);
      } else {
        await setDoc(doc(db, "assignmentSubmissions", `${assignment.id}_${submissionUser.uid}`), payload);
      }

      // Write Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "assignment_submitted",
        classId: assignment.classId || "",
        className: classData?.className || classData?.name || "",
        userId: submissionUser.uid,
        userName: studentRegName.trim(),
        timestamp: serverTimestamp(),
        details: {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          isLate
        }
      }).catch(err => console.error("Error writing audit log:", err));
      await addDoc(collection(db, "notifications"), {
        userId: assignment.teacherId || classData?.teacherId || "",
        classId: assignment.classId,
        assignmentId: assignment.id,
        type: "assignment_submitted",
        title: "New assignment submission",
        message: `${studentRegName.trim()} submitted ${assignment.title}.`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      setShowSuccess(true);
      setIsEditingResubmission(false);
      setTextAnswer("");
      setFileUrls([]);
    } catch (err) {
      console.error("Submission error:", err);
      showNotice("error", "Submission failed. Please try again.");
      setErrorMsg("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;
    
    const marks = Number(grading.marks);
    if (isNaN(marks) || marks < 0 || marks > assignment.totalMarks) {
      setErrorMsg(`Marks must be between 0 and ${assignment.totalMarks}.`);
      return;
    }

    setSavingGrade(true);
    try {
      await updateDoc(doc(db, "assignmentSubmissions", grading.id), {
        marks: marks,
        grade: marks, // Dual compat
        teacherComment: grading.teacherComment || "",
        feedback: grading.teacherComment || "", // Dual compat
        status: "graded",
        markedAt: serverTimestamp(),
        gradedAt: serverTimestamp(),
        markedBy: user?.uid || "teacher"
      });

      // Write Audit Log
      await addDoc(collection(db, "classroomAuditLogs"), {
        action: "assignment_graded",
        classId: assignment.classId || "",
        className: classData?.className || classData?.name || "",
        userId: user?.uid || "teacher",
        userName: user?.displayName || "Mwalimu",
        timestamp: serverTimestamp(),
        details: {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          studentUid: grading.studentUid,
          studentName: grading.studentName,
          marks: marks,
          totalMarks: assignment.totalMarks
        }
      }).catch(err => console.error("Error writing audit log:", err));
      await addDoc(collection(db, "notifications"), {
        userId: grading.studentUid,
        classId: assignment.classId,
        assignmentId: assignment.id,
        type: "assignment_graded",
        title: "Assignment graded",
        message: `${assignment.title} has been graded.`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      showNotice("success", "Submission graded successfully.");
      setGradedSuccess(true);
      setTimeout(() => setGrading(null), 1500);
    } catch (err) {
      showNotice("error", "Something went wrong");
      setErrorMsg("Grade could not be saved.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handlePublishMarks = async () => {
    setPublishing(true);
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "assignments", assignment.id), {
        marksPublished: true,
        marksPublishedAt: serverTimestamp()
      });
      showNotice("success", "Marks returned successfully.");
    } catch (err) {
      showNotice("error", "Failed to return marks. Try again.");
    } finally {
      setPublishing(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Student Name", 
      "Student ID", 
      "Email", 
      "Status", 
      "Submitted At", 
      "On Time/Late", 
      "Marks", 
      "Percentage", 
      "Teacher Comment"
    ];

    const submissionMap = new Map(submissions.map(s => [s.studentUserId, s]));
    
    const rows = classStudents.map(student => {
      const sub = submissionMap.get(student.id || student.studentId);
      const marks = sub?.marks !== null && sub?.marks !== undefined ? sub.marks : "";
      const percentage = marks !== "" ? ((marks / assignment.totalMarks) * 100).toFixed(1) + "%" : "";
      
      return [
        student.studentName,
        student.studentId || "",
        student.studentEmail || "",
        sub ? (sub.status === "marked" ? "Marked" : "Submitted") : "Not Submitted",
        sub?.submittedAt ? (sub.submittedAt.toDate ? sub.submittedAt.toDate().toLocaleString() : new Date(sub.submittedAt).toLocaleString()) : "",
        sub ? (sub.isLate ? "LATE" : "ON TIME") : "",
        marks,
        percentage,
        sub?.teacherComment || ""
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${assignment.title}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = (() => {
    const totalStudents = classStudents.length;
    const submittedCount = counts.totalSub;
    const markedCount = counts.marked;
    
    // Average score is harder with pagination if we don't have all data.
    // We'll calculate it from what we have or just simplify.
    // In a real app, high-volume stats should be pre-aggregated in functions or separate docs.
    const markedSubmissions = submissions.filter(s => s.status === "marked");
    const marksArr = markedSubmissions.map(s => s.marks).filter(m => m !== null);
    const averageScore = marksArr.length > 0 ? marksArr.reduce((a, b) => a + b, 0) / marksArr.length : 0;
    
    const missingCount = totalStudents - submittedCount;

    const highestScore = marksArr.length > 0 ? Math.max(...marksArr) : 0;
    const lowestScore = marksArr.length > 0 ? Math.min(...marksArr) : 0;

    return { totalStudents, submittedCount, markedCount, averageScore, missingCount, highestScore, lowestScore };
  })();

  if (showSuccess) {
    return (
      <div style={{ textAlign: "center", padding: 60 }} className="glass-card">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle size={80} color="#10b981" style={{ margin: "0 auto 24px" }} />
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Umetuma assignment kikamilifu.</h2>
          <p style={{ opacity: 0.6, marginBottom: 32 }}>Kazi yako imepokelewa na mwalimu anasubiri kuisahihisha.</p>
          <button onClick={onBack} className="stea-action-button" style={{ background: G, color: "#000", width: "auto", padding: "0 32px" }}>
            Rudi kwenye Darasa
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {notice && (
        <div role="status" style={{
          padding: "12px 16px",
          borderRadius: 12,
          background: notice.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
          color: notice.type === "error" ? "#fca5a5" : "#86efac",
          border: `1px solid ${notice.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(16,185,129,0.18)"}`,
          fontSize: 13,
          fontWeight: 700
        }}>
          {notice.message}
        </div>
      )}
      <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={18} /> Rudi</button>
          <h3 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>{assignment.title}</h3>
        </div>
        {isTeacher && assignment.type !== "resource" && (
          <div style={{ display: "flex", gap: 16 }}>
             <button 
               onClick={() => setShowReports(!showReports)} 
               style={{ ...btnStyle, color: showReports ? G : "#fff" }}
             >
               {showReports ? <ListChecks size={16} /> : <BarChart size={16} />}
               {showReports ? "Submissions" : "Reports"}
             </button>
             <button onClick={exportCSV} style={{ ...btnStyle, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
               <Download size={16} /> Export
             </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: (isTeacher && !showReports) || assignment.type === "resource" ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        
        {/* Assignment Info Section */}
        {!showReports && (
          <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.02)" }}>
             <h4 style={{ fontSize: 13, fontWeight: 900, color: G, marginBottom: 16, textTransform: "uppercase" }}>Maelekezo</h4>
             <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap" }}>
               {assignment.instructions || "Hakuna maelezo ya ziada yaliyotolewa."}
             </div>
             
             {assignment.type !== "resource" && (
               <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 20 }}>
                  <div style={infoBadgeStyle}><Calendar size={14} /> Out of {assignment.totalMarks} Marks</div>
                  <div style={infoBadgeStyle}><Clock size={14} /> Due: {assignment.dueDate ? (assignment.dueDate.toDate ? assignment.dueDate.toDate().toLocaleString() : new Date(assignment.dueDate).toLocaleString()) : "Not set"}</div>
               </div>
             )}

             {assignment.attachmentUrls?.length > 0 && (
               <div style={{ marginTop: 24 }}>
                 <h4 style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.4)", marginBottom: 12, textTransform: "uppercase" }}>Faili za Mwalimu</h4>
                 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                   {assignment.attachmentUrls.map((file, idx) => (
                     <div key={idx} onClick={() => setPreviewFile(file)} style={{ ...fileLinkStyle, cursor: "pointer" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <FileText size={14} color={G} />
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{file.name}</span>
                       </div>
                       <div style={{ fontSize: 10, fontWeight: 800, color: G }}>{file.name.match(/\.(pdf|jpeg|jpg|gif|png)$/i) ? "PREVIEW" : "DOWNLOAD"}</div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Student View: Form or Status */}
        {!isTeacher && assignment.type !== "resource" && (
          <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.02)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: G, marginBottom: 16, textTransform: "uppercase" }}>Tuma Kazi Yako</h4>
            
            {userSubmission && !isEditingResubmission ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={statusBadgeStyle(userSubmission.isLate)}>
                   <CheckCircle size={20} /> Umeshakabidhi assignment hii. ({userSubmission.submittedAt?.toDate ? userSubmission.submittedAt.toDate().toLocaleString() : new Date(userSubmission.submittedAt).toLocaleString()})
                   {userSubmission.isLate && <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(239,68,68,0.2)", padding: "2px 6px", borderRadius: 4 }}>LATE</span>}
                </div>
                
                {userSubmission.textAnswer && (
                  <div style={readOnlySection}>
                    <div style={sectionLabel}>JIBU LAKO:</div>
                    {userSubmission.textAnswer}
                  </div>
                )}

                {userSubmission.fileUrls?.length > 0 && (
                  <div>
                    <div style={sectionLabel}>FAILI ULIZOTUMA:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {userSubmission.fileUrls.map((f, i) => (
                        <div key={i} onClick={() => setPreviewFile(f)} style={{ ...fileLinkStyle, cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <FileText size={14} color={G} />
                            <span style={{ fontSize: 12 }}>{f.name}</span>
                          </div>
                          <Eye size={14} opacity={0.5} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userSubmission.status === "marked" && (
                  <div style={{ padding: 20, borderRadius: 20, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", marginTop: 8 }}>
                    {assignment.marksPublished ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                           <div style={{ fontSize: 12, fontWeight: 800, color: G }}>MATOKEO / MAONI</div>
                           <div style={{ textAlign: "right" }}>
                             <div style={{ fontSize: 24, fontWeight: 900, color: G }}>{userSubmission.marks} / {assignment.totalMarks}</div>
                             <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 800 }}>({((userSubmission.marks / assignment.totalMarks) * 100).toFixed(1)}%)</div>
                           </div>
                        </div>
                        <p style={{ fontSize: 14, margin: 0, opacity: 0.8 }}>{userSubmission.teacherComment || "Hakuna maoni yaliyotolewa."}</p>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: G, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                           <Clock size={16} /> Marks bado hazijachapishwa.
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>Subira kidogo, mwalimu anasahihisha kazi zako.</p>
                      </div>
                    )}
                  </div>
                )}

                {assignment.allowResubmission && !isSubmissionBlocked && userSubmission.status !== "marked" && (
                   <button 
                     type="button"
                     onClick={handleStartResubmit}
                     style={{ ...btnStyle, background: G, color: "#000", marginTop: 12, justifyContent: "center" }}
                   >
                     Hariri / Tuma Upya (Edit & Resubmit)
                   </button>
                )}
              </div>
            ) : isSubmissionBlocked ? (
              <div style={{ padding: 20, borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 800, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                 <Clock size={32} />
                 <div>Muda wa kutuma umepita.</div>
                 <p style={{ fontSize: 12, opacity: 0.7, margin: 0, fontWeight: 500 }}>Assignment hii haipokei majibu baada ya tarehe ya mwisho.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={labelStyle}>JINA KAMILI (FULL NAME) *</label>
                  <input 
                    type="text" 
                    value={studentRegName} 
                    onChange={e => setStudentRegName(e.target.value)} 
                    placeholder="e.g. John Juma" 
                    required 
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>NAMBA YA MWANAFUNZI (STUDENT ID) *</label>
                  <input 
                    type="text" 
                    value={studentRegId} 
                    onChange={e => setStudentRegId(e.target.value)} 
                    placeholder="e.g. ST-1002" 
                    required 
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>NAMBA YA SIMU (PHONE) - HIARI</label>
                  <input 
                    type="tel" 
                    value={studentRegPhone} 
                    onChange={e => setStudentRegPhone(e.target.value)} 
                    placeholder="e.g. 07XXXXXXXX" 
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Jibu la Maandishi (Text Answer)</label>
                  <textarea 
                    rows={6}
                    placeholder="Andika jibu lako hapa..."
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    style={textareaStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Ongeza Faili (PDF/Image/Doc)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div onClick={() => fileInputRef.current?.click()} style={uploadTriggerStyle}>
                      <Paperclip size={20} opacity={0.5} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Bonyeza kuongeza faili</span>
                      <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                    </div>

                    {uploadError && <div style={{ color: "#ef4444", fontSize: 12 }}><AlertCircle size={14} /> {uploadError}</div>}

                    {Object.entries(uploads).map(([name, progress]) => (
                      <div key={name} style={progressCardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 900, marginBottom: 4 }}>
                          <span>INAPAKIA...</span> <span>{progress}%</span>
                        </div>
                        <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: G, width: `${progress}%` }} />
                        </div>
                      </div>
                    ))}

                    {fileUrls.map((f, i) => (
                      <div key={i} style={fileBadgeStyle}>
                        <FileText size={14} color="#10b981" />
                        <span style={{ fontSize: 12, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                        <button type="button" onClick={() => setFileUrls(fileUrls.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#ef4444", padding: 4 }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  {isEditingResubmission && (
                    <button 
                      type="button" 
                      onClick={() => setIsEditingResubmission(false)} 
                      style={{ ...submitBtnStyle, background: "rgba(255,255,255,0.05)", color: "#fff", flex: 1 }}
                    >
                      Ghairi
                    </button>
                  )}
                  <button type="submit" disabled={submitting || Object.keys(uploads).length > 0} style={{ ...submitBtnStyle, flex: 2 }}>
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} />}
                    {isEditingResubmission ? "Hifadhi & Tuma Upya" : "Tuma Assignment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Teacher Reports View */}
        {isTeacher && showReports && assignment.type !== "resource" && (
          <>
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.02)" }}>
               <h4 style={{ fontSize: 13, fontWeight: 900, color: G, marginBottom: 20, textTransform: "uppercase" }}>Assignment Summary</h4>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  <StatCard label="Total Students" value={stats.totalStudents} />
                  <StatCard label="Submitted" value={stats.submittedCount} />
                  <StatCard label="Not Submitted" value={stats.totalStudents - stats.submittedCount} />
                  <StatCard label="Marked" value={stats.markedCount} />
               </div>
               <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <StatCard label="Average" value={stats.averageScore.toFixed(1)} subLabel="Marks" />
                  <StatCard label="Highest" value={stats.highestScore} subLabel="Marks" />
                  <StatCard label="Lowest" value={stats.lowestScore} subLabel="Marks" />
               </div>
            </div>

            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.02)" }}>
               <h4 style={{ fontSize: 13, fontWeight: 900, color: "#ef4444", marginBottom: 16, textTransform: "uppercase" }}>Quick Stats</h4>
               <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, opacity: 0.6 }}>Submission Rate:</span>
                    <span style={{ fontWeight: 800 }}>{stats.totalStudents > 0 ? ((stats.submittedCount / stats.totalStudents) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: G, width: `${stats.totalStudents > 0 ? (stats.submittedCount / stats.totalStudents) * 100 : 0}%` }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
                    {stats.missingCount} students have not submitted yet.
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Teacher View: List Submissions */}
      {isTeacher && !showReports && assignment.type !== "resource" && (
        <div style={{ marginTop: 32 }}>
          <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 900, color: G, margin: 0, textTransform: "uppercase" }}>Submissions</h4>
            <div style={{ display: "flex", gap: 10 }}>
              {!assignment.marksPublished ? (
                <button 
                  onClick={() => setConfirmDialog({
                    title: "Return marks to students?",
                    message: "Students will be notified and will see their grades and comments.",
                    confirmText: "Return marks",
                    cancelText: "Cancel",
                    onConfirm: () => handlePublishMarks()
                  })} 
                  disabled={publishing}
                  style={{ ...btnStyle, background: G, color: "#000", padding: "10px 20px" }}
                >
                  {publishing ? <Loader2 size={16} className="animate-spin" /> : "Publish Marks"}
                </button>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> MARKS PUBLISHED
                </div>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
                <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                <input 
                  type="text"
                  placeholder="Search by student name or record..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 48, background: "rgba(255,255,255,0.03)" }}
                />
              </div>
              <div style={{ position: "relative" }}>
                <Filter size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }} />
                <select 
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 48, background: "rgba(255,255,255,0.03)", appearance: "none", width: "auto", minWidth: 160 }}
                >
                  <option value="all">All Submissions</option>
                  <option value="submitted">Submitted (Unmarked)</option>
                  <option value="marked">Marked</option>
                  <option value="late">Late Submissions</option>
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.3, pointerEvents: "none" }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <>
                <SubmissionSkeleton />
                <SubmissionSkeleton />
                <SubmissionSkeleton />
              </>
            ) : submissions.length > 0 ? (
              <>
                {submissions.map(s => (
                  <div key={s.id} className="glass-card" style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)" }}>
                    <div className="mobile-stack" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                         <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center" }}>
                              <User size={16} />
                            </div>
                            <div>
                               <div style={{ fontWeight: 800, fontSize: 15 }}>{s.studentName} {s.isLate && <span style={{ color: "#ef4444", fontSize: 10 }}>[LATE]</span>}</div>
                               <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>ID: <span style={{ color: G, fontWeight: 700 }}>{s.studentId || "N/A"}</span> • {s.studentEmail || s.email || ""}</div>
                               <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>{s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleString() : new Date(s.submittedAt).toLocaleString()}</div>
                            </div>
                         </div>
                         
                         {s.textAnswer && (
                           <div style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, fontSize: 14, opacity: 0.8, marginBottom: 12 }}>{s.textAnswer}</div>
                         )}
  
                         {s.fileUrls?.length > 0 && (
                           <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                             {s.fileUrls.map((f, i) => (
                               <div key={i} onClick={() => setPreviewFile(f)} style={{ ...fileLinkStyle, width: "auto", flex: "none", padding: "6px 12px", cursor: "pointer" }}>
                                 <FileText size={12} color={G} />
                                 <span style={{ fontSize: 11 }}>{f.name}</span>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                         {(["marked", "graded"].includes(s.status)) ? (
                           <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 20, fontWeight: 900, color: G }}>{s.marks} / {assignment.totalMarks}</div>
                              <div style={{ fontSize: 11, opacity: 0.5 }}>GRADED</div>
                           </div>
                         ) : (
                           <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(245,166,35,0.1)", color: G, fontWeight: 800 }}>UNGRADED</span>
                         )}
                         <button onClick={() => setGrading(s)} style={btnStyle}>
                           {(["marked", "graded"].includes(s.status)) ? "Edit Grade" : "Sahihisha"}
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <button 
                    onClick={() => fetchSubmissions(true)}
                    disabled={loadingMore}
                    style={{ ...btnStyle, background: "rgba(255,255,255,0.03)", width: "100%", padding: 16, marginTop: 12 }}
                  >
                    {loadingMore ? <Loader2 size={18} className="animate-spin m-auto" /> : "Load More Submissions"}
                  </button>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 64, background: "rgba(255,255,255,0.01)", borderRadius: 32, border: "1px dashed rgba(255,255,255,0.05)" }}>
                <UserX size={48} style={{ margin: "0 auto 16px", opacity: 0.1 }} />
                <p style={{ opacity: 0.3, fontWeight: 700 }}>No submissions found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (() => {
          const p = typeof previewFile === "string" ? { url: previewFile, name: "Attachment", type: "" } : { url: previewFile.url, name: previewFile.name || "Attachment", type: previewFile.type || "" };
          const isImage = (p.type && p.type.includes("image")) || p.name.match(/\.(jpeg|jpg|gif|png)$/i);
          const isPdf = (p.type && p.type.includes("pdf")) || p.name.match(/\.(pdf)$/i);
          return (
          <div style={{...overlayStyle, zIndex: 9000, padding: 0}}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
               className="preview-modal-container"
               style={{
                 width: "100%",
                 maxWidth: 1100,
                 height: "100dvh",
                 maxHeight: "90vh",
                 background: "#0c0e14", 
                 display: "flex", 
                 flexDirection: "column", 
                 overflow: "hidden"
               }}>
               <div style={{height: 70, padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0}}>
                  <div style={{color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", gap: 10, maxWidth: "60%"}}>
                    <FileText color={G} size={18}/> 
                    <span style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{p.name}</span>
                  </div>
                  <div style={{display: "flex", gap: 16, alignItems: "center"}}>
                    <a href={p.url} target="_blank" rel="noreferrer" style={{display: "flex", alignItems: "center", gap: 6, background: G, color: "#000", padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 900, textDecoration: "none"}}>
                      <Download size={14} /> <span className="sm-show">DOWNLOAD</span>
                    </a>
                    <button onClick={() => setPreviewFile(null)} style={{background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer", width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center"}}>
                      <X size={20}/>
                    </button>
                  </div>
               </div>
               
               <div style={{
                 flex: 1, 
                 overflow: "auto", 
                 background: isImage ? "#000" : "#fff",
                 display: isImage ? "flex" : "block",
                 alignItems: "center",
                 justifyContent: "center"
               }}>
                 {isImage ? (
                    <img src={p.url} alt={p.name} style={{width: "100%", height: "auto", maxHeight: "100%", objectFit: "contain", display: "block"}} />
                 ) : isPdf ? (
                    <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(p.url)}&embedded=true`} width="100%" height="100%" style={{border: "none", display: "block", minHeight: "80vh"}} title={p.name} />
                 ) : (
                    <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "80vh", padding: 32, textAlign: "center", color: "#000", background: "#f8f9fa"}}>
                      <FileText size={48} style={{opacity: 0.2, marginBottom: 16}} />
                      <h4 style={{fontSize: 18, fontWeight: 900, marginBottom: 8}}>Preview haipatikani</h4>
                      <p style={{fontSize: 14, opacity: 0.6}}>Preview haipatikani kwa aina hii ya file. Download kuifungua.</p>
                    </div>
                 )}
               </div>
             </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

      {/* Grading Modal Overlay */}
      <AnimatePresence>
        {grading && (
          <div style={overlayStyle} className="px-md-20">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} style={gradingModalStyle}>
               <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                 <Award color={G} /> Sahihisha: {grading.studentName}
               </h3>
               
               {gradedSuccess ? (
                 <div style={{ textAlign: "center", padding: "20px 0" }}>
                   <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 16px" }} />
                   <div style={{ fontSize: 16, fontWeight: 900, color: "#10b981" }}>Marks zimehifadhiwa.</div>
                 </div>
               ) : (
                 <form onSubmit={handleGrade}>
                   <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Marks (Out of {assignment.totalMarks})</label>
                        <input 
                          type="number" 
                          max={assignment.totalMarks}
                          value={grading.marks || ""} 
                          onChange={e => setGrading({ ...grading, marks: e.target.value })}
                          required 
                          style={inputStyle} 
                          disabled={savingGrade}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Maoni ya Mwalimu (Feedback)</label>
                        <textarea 
                          rows={3} 
                          value={grading.teacherComment || ""} 
                          onChange={e => setGrading({ ...grading, teacherComment: e.target.value })}
                          style={textareaStyle} 
                          placeholder="Vizuri sana! Endelea hivi."
                          disabled={savingGrade}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                         <button type="button" onClick={() => setGrading(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700 }} disabled={savingGrade}>Ghairi</button>
                         <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: savingGrade ? "rgba(255,255,255,0.1)" : G, color: savingGrade ? "rgba(255,255,255,0.3)" : "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} disabled={savingGrade}>
                           {savingGrade ? <><Loader2 className="animate-spin" size={16} /> Inahifadhi marks...</> : "Hifadhi Matokeo"}
                         </button>
                      </div>
                   </div>
                 </form>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <div style={overlayStyle} className="px-md-20">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} style={{ background: "#0c0e14", width: "100%", maxWidth: 460, padding: 24, borderRadius: 22, border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{confirmDialog.title}</h3>
              <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.68)", lineHeight: 1.6, fontSize: 14 }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    if (action) await action();
                  }}
                  style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", background: G, color: "#000", fontWeight: 900, cursor: "pointer" }}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, subLabel }) {
  return (
    <div style={{ padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
       <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.4, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
       <div style={{ fontSize: 24, fontWeight: 900, color: G }}>{value}</div>
       {subLabel && <div style={{ fontSize: 10, opacity: 0.5 }}>{subLabel}</div>}
    </div>
  );
}

function SubmissionSkeleton() {
  return (
    <div className="glass-card" style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)" }} className="animate-pulse" />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: "120px", background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
          <div style={{ height: 10, width: "80px", background: "rgba(255,255,255,0.05)", borderRadius: 4 }} className="animate-pulse" />
        </div>
      </div>
      <div style={{ height: 40, width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 12 }} className="animate-pulse" />
    </div>
  );
}

const backBtnStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 800, fontSize: 14 };
const infoBadgeStyle = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "rgba(255,255,255,0.03)", padding: "6px 12px", borderRadius: 8, color: "rgba(255,255,255,0.6)" };
const textareaStyle = { width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", borderRadius: 16, color: "#fff", outline: "none", resize: "none", fontSize: 14 };
const submitBtnStyle = { background: G, color: "#000", border: "none", padding: "14px", borderRadius: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 };
const btnStyle = { background: "rgba(255,255,255,0.05)", border: "none", color: G, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 6000 };
const gradingModalStyle = { background: "#111", width: "100%", maxWidth: 400, padding: 32, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 12, color: "#fff", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 900, opacity: 0.4, marginBottom: 8, textTransform: "uppercase" };
const fileLinkStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", color: "#fff" };
const statusBadgeStyle = (isLate) => ({ padding: 16, borderRadius: 16, background: isLate ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${isLate ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, color: isLate ? "#ef4444" : "#10b981", display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 700 });
const readOnlySection = { padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 14, color: "rgba(255,255,255,0.8)" };
const sectionLabel = { fontSize: 11, fontWeight: 800, opacity: 0.4, marginBottom: 8 };
const uploadTriggerStyle = { border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 };
const progressCardStyle = { background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12 };
const fileBadgeStyle = { display: "flex", alignItems: "center", gap: 10, background: "rgba(16,185,129,0.05)", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.1)" };
