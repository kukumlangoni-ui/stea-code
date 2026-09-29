import { useState, useEffect } from "react";
import { getFirebaseDb } from "../../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from "firebase/firestore";
import { 
  BarChart, 
  Download, 
  Users, 
  CheckCircle, 
  HelpCircle, 
  ClipboardList, 
  TrendingUp, 
  UserMinus,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

const G = "#F5A623";

export default function ClassReports({ classId, classData, classStudents }) {
  const [data, setData] = useState({
    attendanceSessions: [],
    quizzes: [],
    assignments: [],
    submissions: [],
    loading: true
  });

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db || !classId) return;

    const fetchData = async () => {
      try {
        // Fetch All relevant data for the class
        const assignmentsSnap = await getDocs(query(collection(db, "assignments"), where("classId", "==", classId)));
        const assignments = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const submissionsSnap = await getDocs(query(collection(db, "assignmentSubmissions"), where("classId", "==", classId)));
        const submissions = submissionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const quizzesSnap = await getDocs(query(collection(db, "quizzes"), where("classId", "==", classId)));
        const quizzes = quizzesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setData({
          assignments,
          submissions,
          quizzes,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching reports data:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [classId]);

  const stats = (() => {
    const totalStudents = classStudents.length;
    
    // Assignment Stats
    const totalAssignments = data.assignments.length;
    const totalSubmissions = data.submissions.length;
    const submissionRate = totalStudents > 0 && totalAssignments > 0 
      ? (totalSubmissions / (totalStudents * totalAssignments) * 100).toFixed(1) 
      : 0;
    
    const markedSubmissions = data.submissions.filter(s => s.status === "marked");
    const avgScore = markedSubmissions.length > 0 
      ? markedSubmissions.reduce((acc, s) => {
          const assignment = data.assignments.find(a => a.id === s.assignmentId);
          const weight = assignment?.totalMarks || 100;
          return acc + (s.marks / weight);
        }, 0) / markedSubmissions.length * 100
      : 0;

    return { totalStudents, totalAssignments, submissionRate, avgScore, totalQuizzes: data.quizzes.length };
  })();

  const exportGlobalCSV = () => {
    const headers = ["Student Name", "Student ID", "Assignments Submitted", "Avg Score %", "Quizzes Taken"];
    
    const rows = classStudents.map(student => {
      const studentSubmissions = data.submissions.filter(s => s.studentUserId === student.id);
      const studentQuizzes = 0; // Placeholder for quiz participation if tracked similarly
      
      const weightedScore = studentSubmissions.filter(s => s.status === "marked").reduce((acc, s) => {
        const assignment = data.assignments.find(a => a.id === s.assignmentId);
        const weight = assignment?.totalMarks || 100;
        return acc + (s.marks / weight);
      }, 0);
      
      const avg = studentSubmissions.filter(s => s.status === "marked").length > 0 
        ? (weightedScore / studentSubmissions.filter(s => s.status === "marked").length * 100).toFixed(1) + "%"
        : "N/A";

      return [
        student.studentName,
        student.studentId || "",
        studentSubmissions.length,
        avg,
        studentQuizzes
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${classData.className}_Global_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (data.loading) {
    return <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Inapakia ripoti...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div className="mobile-stack" style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Ripoti za Darasa</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Muhtasari wa maendeleo ya wanafunzi.</p>
        </div>
        <button 
          onClick={exportGlobalCSV}
          className="stea-action-button"
          style={{ background: G, color: "#000", width: "auto", padding: "0 24px" }}
        >
          <Download size={18} /> Export Full Report
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        <ReportCard icon={Users} label="Total Students" value={stats.totalStudents} color="#3B82F6" />
        <ReportCard icon={ClipboardList} label="Assignments" value={stats.totalAssignments} color={G} />
        <ReportCard icon={TrendingUp} label="Submission Rate" value={`${stats.submissionRate}%`} color="#10B981" />
        <ReportCard icon={CheckCircle} label="Class Average" value={`${stats.avgScore.toFixed(1)}%`} color="#8B5CF6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {/* Performance List */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={20} color={G} /> Performance Ranking
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {classStudents.length > 0 ? (
              classStudents.map((s, i) => {
                const subCount = data.submissions.filter(sub => sub.studentUserId === s.id).length;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900, color: G }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{s.studentName}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{subCount} assignments submitted</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ opacity: 0.3, textAlign: "center", padding: 20 }}>Hakuna mwanafunzi bado.</p>
            )}
          </div>
        </div>

        {/* Missing Submissions Summary */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#ef4444" }}>
            <UserMinus size={20} /> Danger Zone (Missing Work)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
             {data.assignments.length > 0 ? (
               data.assignments.slice(0, 3).map(a => {
                 const subs = data.submissions.filter(s => s.assignmentId === a.id);
                 const missing = classStudents.length - subs.length;
                 return (
                   <div key={a.id} style={{ padding: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>{missing} students missing</div>
                   </div>
                 );
               })
             ) : (
               <p style={{ opacity: 0.3, textAlign: "center", padding: 20 }}>Hakuna zoezi lililopewa.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 900, opacity: 0.4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <div style={{ padding: 8, borderRadius: 12, background: `${color}20` }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
