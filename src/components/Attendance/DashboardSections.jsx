import React from "react";
import { 
  Plus, Play, Users, BookOpen, School, Copy, QrCode as QrCodeAlt, 
  MoreVertical, LayoutDashboard, FileText, ChevronRight, History, 
  Settings, Scan, Loader2, Check, HelpCircle, Bell, Search, 
  Trash2, Edit3, Eye, CheckCircle2, X, BarChart3, Menu, LogOut, 
  Calendar, FileDown, ShieldCheck, Mail, Info, TrendingUp, AlertCircle, ArrowLeft, Square, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LiveTimer } from "./AttendanceModals.jsx";
import { updateDoc } from "../../firebase.js";

export function DashboardOverview({ 
  activeSessions, setLiveSession, setExtendingSession, handleEndSession, 
  counters, setShowCreateModal, setTargetSelectionAction, setShowResourceModal, 
  classes, setClassSelectorAction, setView, allQuizzes, notify, isEnding, isMobile 
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* SECTION 0 - LIVE CONTROL CENTER */}
      <AnimatePresence>
        {activeSessions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "#10B981", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="live-pulse" style={{ width: 10, height: 10, background: "#10B981", borderRadius: "50%" }} />
              Section 0 • Live Control Room / Active Registers
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {activeSessions.map(sess => {
                const isClosed = sess.status === 'closed' || sess.status === 'ended';
                return (
                <div key={sess.id} className="glass-card" style={{ padding: 24, borderRadius: 24, border: isClosed ? "1px solid rgba(255,255,255, 0.1)" : "1px solid rgba(16, 185, 129, 0.4)", position: "relative", overflow: "hidden", opacity: isClosed ? 0.8 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                     <div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: isClosed ? "rgba(255,255,255,0.7)" : "#10B981" }}>{sess.className}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Code: <span style={{ color: "#F5A623", fontWeight: 800 }}>{sess.sessionCode || sess.joinCode}</span></div>
                     </div>
                     <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative", zIndex: 10 }}>
                       {!isClosed && (
                       <>
                         <button 
                           onClick={() => setLiveSession(sess)}
                           style={{ background: "#10B981", color: "#000", border: "none", padding: "8px 16px", borderRadius: 10, fontWeight: 900, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                         >
                           <Eye size={14} /> Open Monitor
                         </button>
                         <button 
                           onClick={() => setExtendingSession(sess)}
                           style={{ background: "rgba(245, 166, 35, 0.1)", color: "#F5A623", border: "1px solid rgba(245, 166, 35, 0.2)", padding: "8px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                         >
                           <Clock size={14} /> Extend Time
                         </button>
                       </>
                       )}
                       <button 
                         onClick={() => !isClosed && handleEndSession(sess.sessionCode || sess.id)}
                         disabled={isEnding || isClosed}
                         style={{ 
                           background: isClosed ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.1)", 
                           color: isClosed ? "rgba(255,255,255,0.3)" : "#EF4444", 
                           border: isClosed ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(239, 68, 68, 0.3)", 
                           padding: "8px 16px", 
                           borderRadius: 10, 
                           fontWeight: 800, 
                           cursor: (isEnding || isClosed) ? "not-allowed" : "pointer", 
                           fontSize: 12, 
                           display: "flex", 
                           alignItems: "center", 
                           gap: 6,
                           opacity: isEnding ? 0.7 : 1
                         }}
                       >
                         {isEnding ? (
                           <><Loader2 size={14} className="animate-spin" /> Ending...</>
                         ) : isClosed ? (
                           <><CheckCircle2 size={14} /> REGISTER ENDED</>
                         ) : (
                           <><Square size={14} fill="currentColor" /> End Register</>
                         )}
                       </button>
                     </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                     <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700 }}>STUDENTS LIVE</div>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{sess.studentCount || 0}</div>
                     </div>
                     <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700 }}>TIME REMAINING</div>
                        {isClosed ? <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Closed</div> : <LiveTimer endTime={sess.endTime} />}
                     </div>
                  </div>
                </div>
              )})}
            </div>
            <style>{`
              .live-pulse { animation: live-glow 1.5s infinite; }
              @keyframes live-glow { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "#F5A623", marginBottom: 16 }}>
          Section 1 • Control Center Summary Metrics
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))", gap: isMobile ? 12 : 16 }}>
          {[
            { label: "My Classes", count: counters.classesCount, sub: "Active Classrooms", color: "#F5A623" },
            { label: "Total Students", count: counters.studentsCount, sub: "Unique Learners", color: "#3B82F6" },
            { label: "My Notes", count: counters.notesCount, sub: "Published Guides", color: "#10B981" },
            { label: "My Quizzes", count: counters.quizzesCount, sub: "Interactive Quizzes", color: "#EC4899" },
            { label: "My Resources", count: counters.resourcesCount, sub: "Past papers / Sheets", color: "#8B5CF6" },
            { label: "Attendance Logs", count: counters.sessionsCount, sub: "Total Sessions Run", color: "#06B6D4" }
          ].map((c, idx) => (
            <div 
              key={idx} 
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: c.color }} />
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", opacity: 0.4 }}>{c.label}</span>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "6px 0" }}>{c.count}</div>
              </div>
              <span style={{ fontSize: 11, color: c.color, fontWeight: 700 }}>{c.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 - QUICK ACTIONS */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "#F5A623", marginBottom: 16 }}>
          Section 2 • General Quick Classroom Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { id: "create_class", action: () => setShowCreateModal(true), title: "Create Class", body: "Establish customized classrooms to take live registers", icon: Plus },
            { id: "upload_note", action: () => {
              const noteClasses = classes.filter(c => c.status !== 'closed');
              if (noteClasses.length === 0) { 
                setShowResourceModal({ type: 'note', target: 'website' });
              } else {
                setTargetSelectionAction("upload_note");
              }
            }, title: "Upload Note", body: "Upload study summaries to the STEA Africa hub or Class", icon: BookOpen },
            { id: "upload_resource", action: () => {
              const resClasses = classes.filter(c => c.status !== 'closed');
              if (resClasses.length === 0) {
                setShowResourceModal({ type: 'resource', target: 'website' });
              } else {
                setTargetSelectionAction("upload_resource");
              }
            }, title: "Upload Resource", body: "Post study revision files to Website or Class", icon: FileDown },
            { id: "create_assignment", action: () => {
              if (classes.length === 0) { notify("Unda darasa kwanza kutengeneza Assignment.", "error"); return; }
              setClassSelectorAction("create_assignment");
            }, title: "Create Assignment", body: "Distribute tasks securely to designated classes", icon: FileText },
            { id: "create_quiz", action: () => {
              if (classes.length === 0) { notify("Unda darasa kwanza kutengeneza Quiz.", "error"); return; }
              setClassSelectorAction("create_quiz");
            }, title: "Create Quiz", body: "Assemble interactive question builders for direct evaluation", icon: HelpCircle },
            { id: "take_register", action: () => {
              if (classes.length === 0) { notify("Unda darasa kwanza", "error"); return; }
              setClassSelectorAction("take_register");
            }, title: "Take Attendance", body: "Generate realtime secure codes & location identifiers", icon: CheckCircle2 },
            { id: "post_announcement", action: () => {
              if (classes.length === 0) { notify("Unda darasa kwanza", "error"); return; }
              setClassSelectorAction("post_announcement");
            }, title: "Post Announcement", body: "Broadcast urgent notices & reminders instantly", icon: Bell },
            { id: "view_anal", action: () => setView("reports"), title: "View Reports", body: "Inspect downloadable performance Excel maps & PDF charts", icon: BarChart3 }
          ].map((act, index) => (
            <button
              key={index}
              onClick={act.action}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 16,
                textAlign: "left",
                color: "#fff",
                display: "flex",
                gap: 12,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              className="hover:bg-white/5 hover:border-gold"
            >
              <div style={{ background: "rgba(245, 166, 35, 0.15)", color: "#F5A623", padding: 10, borderRadius: 12, height: "fit-content" }}>
                <act.icon size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{act.title}</div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: "1.4" }}>{act.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3 - RECENT ACTIVITY TIMELINE LISTS */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "#F5A623", marginBottom: 16 }}>
          Section 3 • Timeline Recent Classroom Activities
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Recent Classes</span>
              <button onClick={() => setView("classes")} style={{ background: "none", border: "none", color: "#F5A623", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Orodha Yote →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {classes.slice(0, 3).map(c => (
                <div key={c.id} style={{ padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{c.className}</div>
                  <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.subject} • Join Code: {c.joinCode}</p>
                </div>
              ))}
              {classes.length === 0 && <span style={{ opacity: 0.3, fontSize: 12 }}>Hakuna darasa bado...</span>}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>Recent Quizzes</span>
              <button onClick={() => setView("quizzes")} style={{ background: "none", border: "none", color: "#F5A623", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Orodha Yote →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allQuizzes.slice(0, 3).map(q => (
                <div key={q.id} style={{ padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{q.title}</div>
                  <p style={{ margin: "2px 0 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>⏱️ {q.durationMinutes}m • {q.questions?.length || 0} Maswali</p>
                </div>
              ))}
              {allQuizzes.length === 0 && <span style={{ opacity: 0.3, fontSize: 12 }}>Hakuna quiz bado...</span>}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export function MyClassesView({ classes, setShowCreateModal, navigate, handleStartAttendance, setQrItem, setDeleteItem, notify, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 0 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900 }}>My Managed Classes</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 14 }}>Create and manage active classrooms for teaching, attendance tracking and material syndication</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          style={{ background: "#F5A623", color: "#000", border: 'none', padding: "12px 20px", borderRadius: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: isMobile ? "100%" : "auto", justifyContent: "center" }}
        >
          <Plus size={18} /> Tengeneza Darasa
        </button>
      </div>

      {classes.length === 0 ? (
        <div style={{ padding: 80, textAlign: "center", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 24 }}>
          <School size={48} style={{ margin: "0 auto 16px" }} />
          <p>You haven't setup any class yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {classes.map(item => {
            const studentCount = item.studentCount || item.students?.length || item.studentUids?.length || 0;
            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 18,
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.1fr) minmax(250px, 0.9fr) auto",
                  gap: 14,
                  alignItems: "start"
                }}
              >
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: "4px 8px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>ACTIVE</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#F5A623", display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={12} /> {studentCount} students
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px 0", lineHeight: 1.2 }}>{item.className}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0, lineHeight: 1.45 }}>Subject: {item.subject || "All subject revision"}</p>
                  </div>
                </div>

                <div
                  style={{
                    padding: 14,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.06)",
                    display: "grid",
                    gap: 12,
                    minWidth: 0
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 82, height: 82, borderRadius: 12, background: "#fff", display: "grid", placeItems: "center", margin: isMobile ? "0 auto" : 0 }}>
                      {jCode ? <QRCodeSVG value={joinLink} size={62} /> : <span style={{ color: "#5f6368", fontSize: 11, fontWeight: 700 }}>Code pending</span>}
                    </div>
                    <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", fontWeight: 800 }}>Class Code</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#F5A623", letterSpacing: 1.2, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{jCode || "Generating..."}</div>
                          <button
                            disabled={!jCode}
                            onClick={() => jCode && navigator.clipboard.writeText(jCode).then(() => notify("Class code copied.")).catch(() => notify("Unable to copy class code.", "error"))}
                            title="Copy code"
                            style={{ width: 30, height: 30, borderRadius: 8, background: "#fff", border: "1px solid #dadce0", color: "#3c4043", display: "grid", placeItems: "center", cursor: jCode ? "pointer" : "not-allowed", flexShrink: 0 }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", fontWeight: 800 }}>Join Link</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{joinLink || "Generating invite link..."}</div>
                          <button
                            disabled={!jCode}
                            onClick={() => jCode && navigator.clipboard.writeText(joinLink).then(() => notify("Join link copied.")).catch(() => notify("Unable to copy join link.", "error"))}
                            title="Copy join link"
                            style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(245, 166, 35, 0.12)", border: "1px solid rgba(245, 166, 35, 0.28)", color: "#F5A623", display: "grid", placeItems: "center", cursor: jCode ? "pointer" : "not-allowed", flexShrink: 0 }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    <button onClick={() => navigate(`/teacher/classes/${item.id}`)} style={{ background: "#fff", color: "#000", border: "none", padding: "10px 12px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Settings size={14} /> Open Class
                    </button>
                    <button onClick={() => handleStartAttendance(item)} style={{ background: "rgba(245, 166, 35, 0.1)", color: "#F5A623", border: "none", padding: "10px 12px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <CheckCircle2 size={14} /> Attendance
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button onClick={() => setDeleteItem(item)} title="Delete class" style={{ width: 34, height: 34, background: "none", border: "1px solid rgba(239,68,68,0.18)", color: "#EF4444", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AttendanceSessionsView({ allSessions, setLiveSession, deleteDoc, doc, db, notify, isMobile, setClassSelectorAction, handleEndSession, handleExtendTime }) {
  const [filter, setFilter] = React.useState("all");
  const [showConfirmDeleteSess, setShowConfirmDeleteSess] = React.useState(null);
  const [showPromptExtendSess, setShowPromptExtendSess] = React.useState(null);
  const [extendTimeInput, setExtendTimeInput] = React.useState("15");

  const filteredSessions = React.useMemo(() => {
    let list = [...allSessions];
    // sort sessions putting active first, then sorting by creation date descending
    list.sort((a,b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      const tA = a.createdAt?.seconds || a.createdAt || 0;
      const tB = b.createdAt?.seconds || b.createdAt || 0;
      return tB - tA;
    });

    if (filter === "active") list = list.filter(s => s.status === "active");
    if (filter === "ended") list = list.filter(s => s.status !== "active");
    return list;
  }, [allSessions, filter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: '#fff', margin: 0 }}>Attendance Registers</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 14 }}>Log in register lists and monitor student live presence sessions</p>
        </div>
        <button 
          onClick={() => setClassSelectorAction('take_register')}
          style={{ background: "#F5A623", color: "#000", border: 'none', padding: "12px 20px", borderRadius: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: isMobile ? "100%" : "auto", justifyContent: "center" }}
        >
          <Plus size={18} /> New Attendance
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {["all", "active", "ended"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: filter === f ? "1px solid #F5A623" : "1px solid rgba(255,255,255,0.1)",
              background: filter === f ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.02)",
              color: filter === f ? "#F5A623" : "rgba(255,255,255,0.6)",
              fontWeight: filter === f ? 800 : 600,
              fontSize: 13,
              cursor: "pointer",
              textTransform: "capitalize",
              whiteSpace: "nowrap"
            }}
          >
            {f} Registers
          </button>
        ))}
      </div>

      {filteredSessions.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 20 }}>
          <CheckCircle2 size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <p style={{ opacity: 0.5 }}>You haven't run any attendance register sessions yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filteredSessions.map(sess => (
            <div key={sess.id} style={{ background: "rgba(255,255,255,0.02)", border: sess.status === "active" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 10, background: sess.status === "active" ? "rgba(16, 185, 129, 0.12)" : "rgba(255,255,255,0.05)", color: sess.status === "active" ? "#10B981" : "rgba(255,255,255,0.4)", padding: "4px 8px", borderRadius: 6, fontWeight: 800 }}>
                  {sess.status?.toUpperCase() || "CLOSED"}
                </span>
                <span style={{ fontSize: 14, color: "#F5A623", fontWeight: 900, background: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: 6 }}>{sess.sessionCode}</span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px 0" }}>{sess.className}</h4>
              <p style={{ fontSize: 12, opacity: 0.4, margin: "0 0 16px 0" }}>Duration: {sess.durationMinutes || sess.duration || 15} mins • Created: {sess.createdAt && sess.createdAt.seconds ? new Date(sess.createdAt.seconds*1000).toLocaleDateString() : 'N/A'}</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                {sess.status === "active" && (
                  <button onClick={() => setLiveSession(sess)} style={{ flex: 1, background: "#F5A623", border: "none", color: "#000", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, minWidth: 100 }}>
                    <Scan size={14} /> Open Monitor
                  </button>
                )}
                {sess.status === "active" ? (
                  <>
                    <button onClick={() => {
                        setExtendTimeInput("15");
                        setShowPromptExtendSess(sess);
                    }} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)", padding: '8px 12px', borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      + Time
                    </button>
                    <button onClick={() => handleEndSession(sess.id)} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.2)", padding: '8px 12px', borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      End
                    </button>
                  </>
                ) : (
                  <button onClick={() => setLiveSession(sess)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                     <BarChart3 size={14} /> View Report
                  </button>
                )}
                <button 
                  onClick={() => setShowConfirmDeleteSess(sess)}
                  style={{ background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", padding: '8px 12px', borderRadius: 8, cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPromptExtendSess && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(5, 6, 10, 0.75)", backdropFilter: "blur(10px)",
          display: "grid", placeItems: "center", zIndex: 99999
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 24, width: "min(380px, calc(100vw - 32px))",
            textAlign: "center", color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px" }}>Ongeza Muda wa Kipindi</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "0 0 16px" }}>Ingiza idadi ya dakika za kuongeza:</p>
            <input 
              type="number" 
              value={extendTimeInput} 
              onChange={e => setExtendTimeInput(e.target.value)}
              style={{
                width: "100%", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)", color: "#fff", textAlign: "center", fontSize: 16, outline: "none", marginBottom: 20
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPromptExtendSess(null)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Ghairi / Cancel</button>
              <button onClick={() => {
                const mins = parseInt(extendTimeInput);
                if (mins && mins > 0) {
                  handleExtendTime(showPromptExtendSess.id, mins);
                }
                setShowPromptExtendSess(null);
              }} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#F5A623", color: "#000", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ongeza / Extend</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeleteSess && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(5, 6, 10, 0.75)", backdropFilter: "blur(10px)",
          display: "grid", placeItems: "center", zIndex: 99999
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 24, width: "min(380px, calc(100vw - 32px))",
            textAlign: "center", color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px" }}>Futa Rekodi ya Mahudhurio?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Je, una uhakika unataka kufuta rekodi hii ya mahudhurio? Kitendo hiki hakiwezi kurejeshwa.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirmDeleteSess(null)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Ghairi / Cancel</button>
              <button onClick={async () => {
                const id = showConfirmDeleteSess.id;
                setShowConfirmDeleteSess(null);
                await deleteDoc(doc(db, "attendanceSessions", id));
                notify("Record deleted");
              }} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#dc2626", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ndiyo / Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationsView({ classes, announcements, deleteDoc, doc, db, notify, user, addDoc, collection, serverTimestamp, isMobile }) {
  const [confirmDeleteAnn, setConfirmDeleteAnn] = React.useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900 }}>Class Announcements Notice Board</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 14 }}>Publish general news updates, homework reminders, or exam cancellations to classrooms</p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#F5A623", margin: "0 0 16px 0" }}>Write New Announcement</h3>
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const tit = e.target.announce_title.value;
            const con = e.target.announce_content.value;
            const cid = e.target.announce_class.value;
            if (!tit || !cid) return;

            const clData = classes.find(c => c.id === cid);
            await addDoc(collection(db, "announcements"), {
              title: tit,
              content: con,
              classId: cid,
              className: clData?.className || clData?.name || "General",
              teacherId: user.uid,
              teacherName: user.displayName || "Mwalimu",
              createdAt: serverTimestamp()
            });
            notify("Tangazo limechapishwa kikamilifu!");
            e.target.reset();
          }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <input name="announce_title" placeholder="Announcement Title" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none" }} required />
            <select name="announce_class" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none" }} required>
              <option value="">Chagua Darasa</option>
              {classes.map(c => <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.className || c.name}</option>)}
            </select>
          </div>
          <textarea name="announce_content" rows={3} placeholder="Write announcement details..." style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "#fff", outline: "none", resize: "none" }} />
          <button type="submit" style={{ background: "#F5A623", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 900, cursor: 'pointer' }}>Publish Announcement</button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {announcements.map(ann => (
          <div key={ann.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: 16, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, background: "rgba(245, 166, 35, 0.15)", color: "#F5A623", padding: "2px 8px", borderRadius: 6, fontWeight: 800 }}>
                  {ann.className || classes.find(c => c.id === ann.classId)?.className || "STEA Class"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "4px 0" }}>{ann.title || "Class Announcement"}</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>{ann.content || ann.message}</p>
            </div>
             <button 
              onClick={() => setConfirmDeleteAnn(ann)}
              style={{ background: "none", border: "none", color: "#EF4444", cursor: 'pointer' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {announcements.length === 0 && <p style={{ opacity: 0.3, textAlign: 'center', padding: 40 }}>Hakuna matangazo bado.</p>}
      </div>

      {confirmDeleteAnn && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(5, 6, 10, 0.75)", backdropFilter: "blur(10px)",
          display: "grid", placeItems: "center", zIndex: 99999
        }}>
          <div style={{
            background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: 24, width: "min(380px, calc(100vw - 32px))",
            textAlign: "center", color: "#fff"
          }}>
            <h3 style={{ margin: "0 0 10px" }}>Futa Tangazo hili?</h3>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Je, una uhakika unataka kufuta tangazo hili? Kitendo hiki hakiwezi kurejeshwa.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDeleteAnn(null)} style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", borderRadius: 8, cursor: "pointer" }}>Ghairi / Cancel</button>
              <button onClick={async () => {
                const id = confirmDeleteAnn.id;
                setConfirmDeleteAnn(null);
                await deleteDoc(doc(db, "announcements", id));
                notify("Tangazo limefutwa!");
              }} style={{ flex: 1, padding: "10px 14px", border: 0, background: "#dc2626", color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ndiyo / Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsView({ user }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Teacher Settings</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: 14 }}>Inspect account identity and preferences</p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #F5A623 0%, #B47B18 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#000" }}>
            {user.displayName ? user.displayName[0].toUpperCase() : "M"}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{user.displayName || "STEA Mwalimu"}</h3>
            <p style={{ margin: "2px 0 0 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, opacity: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Unique Teacher ID (UID)</label>
            <input value={user.uid} readOnly style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", padding: 12, borderRadius: 10, color: "rgba(255,255,255,0.5)", outline: "none", fontSize: 12, fontFamily: "monospace" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, opacity: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Email verified</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, color: "#10B981", fontSize: 13, fontWeight: 700 }}>
              <ShieldCheck size={16} /> Yes, authenticated STEA professional
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
