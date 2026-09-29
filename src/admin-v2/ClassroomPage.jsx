import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert, X } from "lucide-react";
import { collection, getDocs, getFirebaseDb, limit, query } from "../firebase.js";
import { AdminPageHeader } from "./AdminLayout.jsx";
import { getPreviewCollectionDocs } from "./previewData.js";

const CLASSROOM_SOURCES = [
  { key:"classes", label:"classes", role:"canonical" },
  { key:"attendanceClasses", label:"attendanceClasses", role:"legacy" },
  { key:"attendanceSessions", label:"attendanceSessions", role:"active" },
  { key:"attendanceRecords", label:"attendanceRecords", role:"legacy" },
  { key:"assignments", label:"assignments", role:"active" },
  { key:"assignmentSubmissions", label:"assignmentSubmissions", role:"active" },
  { key:"quizzes", label:"quizzes", role:"active" },
  { key:"quizResults", label:"quizResults", role:"active" },
  { key:"classroomAuditLogs", label:"classroomAuditLogs", role:"active" },
];

const TABS = [
  ["classes", "Classes"], ["attendance", "Attendance"], ["assignments", "Assignments"], ["submissions", "Submissions"],
  ["quizzes", "Quizzes"], ["results", "Quiz Results"], ["audit", "Audit Logs"], ["legacy", "Legacy / Compatibility"],
];

function dateValue(value) {
  if (!value) return "Unknown";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function value(input) {
  return input === null || input === undefined || input === "" ? "Unknown" : String(input);
}

function itemTitle(item) {
  return value(item.className || item.title || item.quizTitle || item.assignmentTitle || item.name || item.sessionCode || item.id);
}

function itemTeacher(item) {
  return value(item.teacherName || item.teacherEmail || item.teacherId);
}

function itemStudent(item) {
  return value(item.studentName || item.studentEmail || item.studentUserId || item.studentUid || item.userId);
}

function DisabledActions({ tab }) {
  const message = "Protected Classroom actions will be enabled after audit-log server actions are ready.";
  const labels = {
    classes:["Edit Class", "Delete Class"], attendance:["End Session", "Modify Attendance"], assignments:["Edit Assignment"],
    submissions:["Grade Submission"], quizzes:["Delete Quiz"], results:["Modify Result"], audit:["No actions"],
  }[tab] || ["No actions"];
  return <div className="admin-v2-user-actions">{labels.map((label) => <button key={label} disabled title={message}>{label}</button>)}</div>;
}

function matchesTab(item, tab) {
  if (tab === "classes") return ["classes", "attendanceClasses"].includes(item.sourceCollection);
  if (tab === "attendance") return ["attendanceSessions", "attendanceRecords"].includes(item.sourceCollection);
  if (tab === "assignments") return item.sourceCollection === "assignments";
  if (tab === "submissions") return item.sourceCollection === "assignmentSubmissions";
  if (tab === "quizzes") return item.sourceCollection === "quizzes";
  if (tab === "results") return item.sourceCollection === "quizResults";
  if (tab === "audit") return item.sourceCollection === "classroomAuditLogs";
  return false;
}

function fieldsFor(tab, item) {
  if (tab === "classes") return [["Class Name", itemTitle(item)], ["Teacher", itemTeacher(item)], ["Students Count", value(item.studentCount ?? item.students?.length)], ["Status", value(item.status)], ["Source Collection", item.sourceCollection], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "attendance") return [["Session Title / Class", itemTitle(item)], ["Teacher", itemTeacher(item)], ["Status", value(item.status)], ["Student Count", value(item.studentCount)], ["Created Date", dateValue(item.createdAt)], ["Source Collection", item.sourceCollection]];
  if (tab === "assignments") return [["Title", itemTitle(item)], ["Class", value(item.className || item.classId)], ["Teacher", itemTeacher(item)], ["Due Date", dateValue(item.dueDate)], ["Status", value(item.status)], ["Total Marks", value(item.totalMarks)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "submissions") return [["Assignment", value(item.assignmentTitle || item.assignmentId)], ["Student", itemStudent(item)], ["Class", value(item.className || item.classId)], ["Status", value(item.status)], ["Marks", value(item.marks ?? item.grade)], ["Submitted Date", dateValue(item.submittedAt)]];
  if (tab === "quizzes") return [["Quiz Title", itemTitle(item)], ["Class", value(item.className || item.classId)], ["Teacher", itemTeacher(item)], ["Status", value(item.status)], ["Created Date", dateValue(item.createdAt)]];
  if (tab === "results") return [["Quiz", value(item.quizTitle || item.quizId)], ["Student", itemStudent(item)], ["Score", value(item.score)], ["Class", value(item.className || item.classId)], ["Submitted Date", dateValue(item.submittedAt || item.createdAt)]];
  return [["Time", dateValue(item.createdAt || item.timestamp)], ["Action", value(item.action || item.eventType)], ["Entity", value(item.entity || item.classId || item.assignmentId || item.quizId)], ["User", itemStudent(item)], ["Source", item.sourceCollection]];
}

function drawerFields(item) {
  return [
    ["Document ID", item.id], ["Source collection", item.sourceCollection], ["Title / name", itemTitle(item)], ["Class ID", value(item.classId)],
    ["Session ID", value(item.sessionId)], ["Assignment ID", value(item.assignmentId)], ["Quiz ID", value(item.quizId)], ["Teacher ID", value(item.teacherId)],
    ["Student / User ID", value(item.studentUserId || item.studentUid || item.userId)], ["Status", value(item.status)], ["Created", dateValue(item.createdAt)],
    ["Updated", dateValue(item.updatedAt)], ["Submitted", dateValue(item.submittedAt)],
  ];
}

export default function ClassroomPage({ devPreview }) {
  const [items, setItems] = useState(() => (devPreview ? [
    ...getPreviewCollectionDocs("classes").map((item) => ({ ...item, sourceCollection:"classes", sourceRole:"canonical" })),
    ...getPreviewCollectionDocs("attendanceClasses").map((item) => ({ ...item, sourceCollection:"attendanceClasses", sourceRole:"legacy" })),
    ...getPreviewCollectionDocs("attendanceSessions").map((item) => ({ ...item, sourceCollection:"attendanceSessions", sourceRole:"active" })),
    ...getPreviewCollectionDocs("attendanceRecords").map((item) => ({ ...item, sourceCollection:"attendanceRecords", sourceRole:"legacy" })),
    ...getPreviewCollectionDocs("assignments").map((item) => ({ ...item, sourceCollection:"assignments", sourceRole:"active" })),
    ...getPreviewCollectionDocs("assignmentSubmissions").map((item) => ({ ...item, sourceCollection:"assignmentSubmissions", sourceRole:"active" })),
    ...getPreviewCollectionDocs("quizzes").map((item) => ({ ...item, sourceCollection:"quizzes", sourceRole:"active" })),
    ...getPreviewCollectionDocs("quizResults").map((item) => ({ ...item, sourceCollection:"quizResults", sourceRole:"active" })),
    ...getPreviewCollectionDocs("classroomAuditLogs").map((item) => ({ ...item, sourceCollection:"classroomAuditLogs", sourceRole:"active" })),
  ] : []));
  const [sourceState, setSourceState] = useState(() => (devPreview ? Object.fromEntries(CLASSROOM_SOURCES.map((source) => [source.key, "Available"])) : {}));
  const [tab, setTab] = useState("classes");
  const [selected, setSelected] = useState(null);

  const loadClassroom = useCallback(async () => {
    if (devPreview) {
      setItems([
        ...getPreviewCollectionDocs("classes").map((item) => ({ ...item, sourceCollection:"classes", sourceRole:"canonical" })),
        ...getPreviewCollectionDocs("attendanceClasses").map((item) => ({ ...item, sourceCollection:"attendanceClasses", sourceRole:"legacy" })),
        ...getPreviewCollectionDocs("attendanceSessions").map((item) => ({ ...item, sourceCollection:"attendanceSessions", sourceRole:"active" })),
        ...getPreviewCollectionDocs("attendanceRecords").map((item) => ({ ...item, sourceCollection:"attendanceRecords", sourceRole:"legacy" })),
        ...getPreviewCollectionDocs("assignments").map((item) => ({ ...item, sourceCollection:"assignments", sourceRole:"active" })),
        ...getPreviewCollectionDocs("assignmentSubmissions").map((item) => ({ ...item, sourceCollection:"assignmentSubmissions", sourceRole:"active" })),
        ...getPreviewCollectionDocs("quizzes").map((item) => ({ ...item, sourceCollection:"quizzes", sourceRole:"active" })),
        ...getPreviewCollectionDocs("quizResults").map((item) => ({ ...item, sourceCollection:"quizResults", sourceRole:"active" })),
        ...getPreviewCollectionDocs("classroomAuditLogs").map((item) => ({ ...item, sourceCollection:"classroomAuditLogs", sourceRole:"active" })),
      ]);
      setSourceState(Object.fromEntries(CLASSROOM_SOURCES.map((source) => [source.key, "Available"])));
      return;
    }
    const db = getFirebaseDb();
    setSourceState(Object.fromEntries(CLASSROOM_SOURCES.map((source) => [source.key, "Loading"])));
    if (!db) { setSourceState(Object.fromEntries(CLASSROOM_SOURCES.map((source) => [source.key, "Unavailable"]))); return; }
    const results = await Promise.all(CLASSROOM_SOURCES.map(async (source) => {
      try {
        const snapshot = await getDocs(query(collection(db, source.key), limit(100)));
        return { source, state:"Available", items:snapshot.docs.map((docSnap) => ({ id:docSnap.id, sourceCollection:source.key, sourceRole:source.role, ...docSnap.data() })) };
      } catch (error) {
        return { source, state:error?.code === "permission-denied" ? "Permission denied" : "Unavailable", items:[] };
      }
    }));
    setItems(results.flatMap((result) => result.items));
    setSourceState(Object.fromEntries(results.map((result) => [result.source.key, result.state])));
  }, [devPreview]);

  useEffect(() => { loadClassroom(); }, [loadClassroom]);
  const visible = useMemo(() => items.filter((item) => matchesTab(item, tab)), [items, tab]);
  const headers = visible[0] ? fieldsFor(tab, visible[0]).map(([label]) => label) : [];

  return <>
    <AdminPageHeader title="Classroom Management" description="Read-only visibility across classes, attendance, assignments, quizzes, results, and existing classroom activity logs." />
    <div className="admin-v2-safety-banner"><ShieldAlert size={18} /><div><strong>Read-only classroom inventory.</strong> Classroom records, attendance, grades, students, and quizzes cannot be changed from this page.</div></div>
    <section className="admin-v2-source-status admin-v2-classroom-source-status"><div className="admin-v2-panel-head">Collection access <button className="admin-v2-text-action" onClick={loadClassroom}><RefreshCw size={14} /> Refresh</button></div>{CLASSROOM_SOURCES.map((source) => <div key={source.key}><strong>{source.label}</strong><span className={`admin-v2-permission ${sourceState[source.key] === "Permission denied" ? "denied" : sourceState[source.key] === "Unavailable" ? "error" : ""}`}>{sourceState[source.key] || "Loading"}</span></div>)}</section>
    <div className="admin-v2-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === "legacy" ? <section className="admin-v2-panel"><div className="admin-v2-panel-head">Legacy and compatibility model</div><div className="admin-v2-duplicate-list"><article><div><strong>classes</strong><span>Canonical classroom collection</span></div><p>Current classroom parent collection and the long-term canonical source.</p></article><article><div><strong>attendanceClasses</strong><span>Legacy compatibility collection</span></div><p>Still actively required by classroom reads and class join/view fallbacks. Do not delete.</p></article><article><div><strong>attendanceRecords</strong><span>Legacy flat attendance fallback</span></div><p>Older top-level attendance model. Review records before a future migration.</p></article><article><div><strong>attendanceSessions / records</strong><span>Preferred attendance model</span></div><p>Session documents with nested records are the preferred attendance design. Nested records are not modified here.</p></article></div></section> : <>{items.length === 0 && Object.values(sourceState).some((state) => state === "Loading") ? <div className="admin-v2-empty">Loading classroom collections...</div> : visible.length === 0 ? <div className="admin-v2-empty">No records are available for this tab. Collection access is shown above.</div> : <><section className="admin-v2-panel admin-v2-classroom-table"><div className="admin-v2-panel-head">{TABS.find(([id]) => id === tab)?.[1]} <span>{visible.length} visible records</span></div><div className="admin-v2-table-wrap"><table className="admin-v2-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}<th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={`${item.sourceCollection}:${item.id}`}>{fieldsFor(tab, item).map(([label, field]) => <td key={label}>{field}</td>)}<td><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View</button><DisabledActions tab={tab} /></td></tr>)}</tbody></table></div></section><section className="admin-v2-classroom-cards">{visible.map((item) => <article key={`${item.sourceCollection}:${item.id}`}><div><strong>{itemTitle(item)}</strong><span>{item.sourceCollection}</span></div><dl>{fieldsFor(tab, item).slice(1, 5).map(([label, field]) => <div key={label}><dt>{label}</dt><dd>{field}</dd></div>)}</dl><button className="admin-v2-view-button" onClick={() => setSelected(item)}>View details</button><DisabledActions tab={tab} /></article>)}</section></>}</>}
    {selected && <div className="admin-v2-drawer-layer" role="dialog" aria-modal="true" aria-label="Classroom record detail"><button className="admin-v2-drawer-backdrop" onClick={() => setSelected(null)} aria-label="Close classroom details" /><aside className="admin-v2-drawer"><button className="admin-v2-drawer-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button><div className="admin-v2-eyebrow">Classroom record detail</div><h2>{itemTitle(selected)}</h2><div className="admin-v2-drawer-status"><span className={`admin-v2-badge ${selected.sourceRole === "legacy" ? "legacy" : ""}`}>{selected.sourceCollection}</span></div><dl>{drawerFields(selected).map(([label, field]) => <div key={label}><dt>{label}</dt><dd>{field}</dd></div>)}</dl><div className="admin-v2-drawer-warning"><AlertTriangle size={17} /><span>{selected.sourceRole === "legacy" ? "Legacy compatibility record. " : "Current classroom record. "}Protected Classroom actions remain disabled until audit-log server actions are ready.</span></div><DisabledActions tab={tab} /></aside></div>}
  </>;
}
