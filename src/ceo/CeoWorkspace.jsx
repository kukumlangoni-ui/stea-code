import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Lock,
  LogIn,
  NotebookPen,
  Plus,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  GoogleAuthProvider,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirebaseAuth,
  getFirebaseDb,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  signInWithPopup,
  updateDoc,
} from "../firebase.js";

import SteaLogo from "../components/SteaLogo.jsx";

const CEO_SESSION_PREFIX = "stea_ceo_unlocked_";
const CEO_ALLOWED_EMAILS = [
  import.meta.env.VITE_CEO_EMAIL,
  "stea.africa@gmail.com"
].filter(Boolean).map((email) => email.toLowerCase().trim());
const CEO_ALLOWED_UIDS = [import.meta.env.VITE_CEO_UID].filter(Boolean);

const todayIso = () => new Date().toISOString().slice(0, 10);
const toDateValue = (value) => {
  if (!value) return "";
  if (value.toDate) return value.toDate().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};
const dateMs = (value) => {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function isCeoUser(user) {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  return CEO_ALLOWED_UIDS.includes(user.uid) || CEO_ALLOWED_EMAILS.includes(email);
}

function useCeoAuth() {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setState({ user: firebaseUser, loading: false });
    });
    return () => unsub();
  }, []);

  return state;
}

function useCeoCollection(uid, name, orderField = "createdAt") {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    const db = getFirebaseDb();
    const q = query(collection(db, "ceoWorkspace", uid, name), orderBy(orderField, "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error(`[CEO] Failed loading ${name}:`, err);
        setError(err.message || "Failed to load data.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid, name, orderField]);

  return { items, loading, error };
}

async function createCeoDoc(uid, name, data) {
  const db = getFirebaseDb();
  return addDoc(collection(db, "ceoWorkspace", uid, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function updateCeoDoc(uid, name, id, data) {
  const db = getFirebaseDb();
  return updateDoc(doc(db, "ceoWorkspace", uid, name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

async function deleteCeoDoc(uid, name, id) {
  const db = getFirebaseDb();
  return deleteDoc(doc(db, "ceoWorkspace", uid, name, id));
}

function LoadingScreen() {
  return (
    <div className="ceo-auth-screen">
      <Loader2 className="ceo-spin" size={28} />
      <span>Loading CEO workspace...</span>
    </div>
  );
}

function DeniedScreen({ user }) {
  return (
    <div className="ceo-auth-screen">
      <ShieldCheck size={34} />
      <h1>CEO access only</h1>
      <p>
        This private workspace is restricted to configured STEA CEO accounts.
        {user?.email ? ` Signed in as ${user.email}.` : ""}
      </p>
    </div>
  );
}

// CeoAccessGate removed due to security policy

export function CeoGuard({ children }) {
  const { user, loading } = useCeoAuth();
  const [signingIn, setSigningIn] = useState(false);

  const signIn = async () => {
    try {
      setSigningIn(true);
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (e) {
      if (import.meta.env.DEV) console.warn("Auth handled:", e?.code || e?.message);
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return <><CeoStyles /><LoadingScreen /></>;

  if (!user) {
    return (
      <>
        <CeoStyles />
        <div className="ceo-auth-screen">
          <div className="ceo-access-card">
            <div className="ceo-lock"><LogIn size={22} /></div>
            <h1>CEO Sign In</h1>
            <p>Sign in with Firebase Auth before opening the private workspace.</p>
            <button type="button" className="ceo-primary-btn" onClick={signIn} disabled={signingIn}>
              {signingIn ? <Loader2 className="ceo-spin" size={16} /> : <LogIn size={16} />}
              Sign in with Google
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!isCeoUser(user)) return <><CeoStyles /><DeniedScreen user={user} /></>;
  
  return <>{children}</>;
}

function Field({ label, children }) {
  return (
    <label className="ceo-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatusLine({ status }) {
  if (!status) return null;
  return <div className={`ceo-status ceo-status--${status.type}`}>{status.message}</div>;
}

function useSaveStatus() {
  const [status, setStatus] = useState(null);
  const run = async (fn, successMessage = "Saved.") => {
    setStatus({ type: "loading", message: "Saving..." });
    try {
      await fn();
      setStatus({ type: "success", message: successMessage });
      setTimeout(() => setStatus(null), 2400);
    } catch (err) {
      console.error("[CEO] Save failed:", err);
      setStatus({ type: "error", message: err.message || "Save failed." });
    }
  };
  return { status, run };
}

function EmptyState({ title, message }) {
  return (
    <div className="ceo-empty">
      <Target size={22} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

export function CeoDashboard({ tasks, accomplishments, weeklyPlans, monthlyPlans, books, setActiveTab }) {
  const today = todayIso();
  const pending = tasks.filter((task) => task.status !== "done");
  const completedToday = tasks.filter((task) => task.completedDate === today || task.accomplishedDate === today);
  const weeklyProgress = weeklyPlans.length
    ? Math.round(weeklyPlans.reduce((sum, plan) => sum + Number(plan.progress || 0), 0) / weeklyPlans.length)
    : 0;
  const reading = books.filter((book) => book.status === "reading").length;

  const stats = [
    { label: "Pending Tasks", value: pending.length, icon: ClipboardList },
    { label: "Completed Today", value: completedToday.length + accomplishments.filter((item) => item.date === today).length, icon: Check },
    { label: "Weekly Progress", value: `${weeklyProgress}%`, icon: TrendingUp },
    { label: "Active Books", value: reading, icon: BookOpen },
  ];

  return (
    <div className="ceo-dashboard">
      <section className="ceo-hero">
        <div>
          <span className="ceo-kicker">Private executive workspace</span>
          <h1>Today is for focused execution.</h1>
          <p>Choose the few actions that move STEA forward, finish them cleanly, then record the win.</p>
        </div>
        <div className="ceo-date-card">
          <span>Today</span>
          <strong>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</strong>
        </div>
      </section>

      <div className="ceo-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="ceo-stat-card" key={stat.label}>
              <Icon size={20} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          );
        })}
      </div>

      <div className="ceo-two-grid">
        <section className="ceo-panel">
          <div className="ceo-panel-head">
            <h2>Priority Queue</h2>
            <button onClick={() => setActiveTab("tasks")}>Open tasks</button>
          </div>
          {pending.slice(0, 5).length ? (
            <div className="ceo-mini-list">
              {pending.slice(0, 5).map((task) => (
                <div key={task.id} className="ceo-mini-item">
                  <strong>{task.title}</strong>
                  <span>{task.category || "General"} · {task.priority || "medium"} · {task.status || "todo"}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No pending tasks" message="Add a task to start today with clear direction." />
          )}
        </section>

        <section className="ceo-panel">
          <div className="ceo-panel-head">
            <h2>Quick Actions</h2>
          </div>
          <div className="ceo-action-grid">
            {[
              ["tasks", "New task", ClipboardList],
              ["accomplishments", "Log win", Check],
              ["weekly", "Weekly plan", CalendarDays],
              ["journal", "Journal", NotebookPen],
            ].map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CeoTaskCard({ task, uid }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);
  const { status, run } = useSaveStatus();

  useEffect(() => setDraft(task), [task]);

  const subtasks = Array.isArray(draft.subtasks) ? draft.subtasks : [];
  const save = () => run(() => updateCeoDoc(uid, "tasks", task.id, {
    title: draft.title || "Untitled task",
    notes: draft.notes || "",
    priority: draft.priority || "medium",
    status: draft.status || "todo",
    dueDate: draft.dueDate || "",
    completedDate: draft.status === "done" ? (draft.completedDate || todayIso()) : "",
    accomplishedDate: draft.accomplishedDate || "",
    category: draft.category || "",
    reminderDate: draft.reminderDate || "",
    progress: Number(draft.progress || 0),
    subtasks,
  }), "Task updated.");

  const toggleDone = () => {
    const done = task.status === "done";
    run(() => updateCeoDoc(uid, "tasks", task.id, {
      status: done ? "todo" : "done",
      completedDate: done ? "" : todayIso(),
      accomplishedDate: done ? "" : todayIso(),
      progress: done ? Number(task.progress || 0) : 100,
    }), done ? "Task reopened." : "Task completed.");
  };

  return (
    <article className={`ceo-task-card priority-${task.priority || "medium"}`}>
      <div className="ceo-task-top">
        <button className={`ceo-check ${task.status === "done" ? "is-done" : ""}`} onClick={toggleDone} aria-label="Toggle task done">
          {task.status === "done" && <Check size={15} />}
        </button>
        <div>
          <h3>{task.title}</h3>
          <span>{task.category || "General"} · {task.priority || "medium"} · {task.status || "todo"}</span>
        </div>
        <div className="ceo-task-actions">
          <button onClick={() => setEditing((value) => !value)}>{editing ? "Close" : "Edit"}</button>
          <button onClick={() => deleteCeoDoc(uid, "tasks", task.id)} aria-label="Delete task"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="ceo-progress"><span style={{ width: `${Number(task.progress || 0)}%` }} /></div>
      {task.notes && <p>{task.notes}</p>}
      {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
        <div className="ceo-subtasks">
          {task.subtasks.map((subtask, index) => (
            <span key={`${subtask.title}-${index}`} className={subtask.done ? "is-done" : ""}>
              {subtask.done ? "✓" : "□"} {subtask.title}
            </span>
          ))}
        </div>
      )}

      {editing && (
        <div className="ceo-edit-grid">
          <Field label="Title"><input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Category"><input value={draft.category || ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
          <Field label="Priority">
            <select value={draft.priority || "medium"} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={draft.status || "todo"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <option value="todo">Todo</option><option value="doing">Doing</option><option value="done">Done</option>
            </select>
          </Field>
          <Field label="Due date"><input type="date" value={draft.dueDate || ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></Field>
          <Field label="Reminder"><input type="datetime-local" value={draft.reminderDate || ""} onChange={(e) => setDraft({ ...draft, reminderDate: e.target.value })} /></Field>
          <Field label="Progress %"><input type="number" min="0" max="100" value={draft.progress || 0} onChange={(e) => setDraft({ ...draft, progress: e.target.value })} /></Field>
          <Field label="Accomplishment date"><input type="date" value={draft.accomplishedDate || ""} onChange={(e) => setDraft({ ...draft, accomplishedDate: e.target.value })} /></Field>
          <label className="ceo-field ceo-field-wide"><span>Notes</span><textarea value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          <label className="ceo-field ceo-field-wide">
            <span>Mini branches / subtasks, one per line. Prefix completed lines with x:</span>
            <textarea
              value={subtasks.map((item) => `${item.done ? "x: " : ""}${item.title}`).join("\n")}
              onChange={(e) => setDraft({
                ...draft,
                subtasks: e.target.value.split("\n").filter(Boolean).map((line) => ({
                  title: line.replace(/^x:\s*/i, "").trim(),
                  done: /^x:\s*/i.test(line),
                })),
              })}
            />
          </label>
          <button className="ceo-primary-btn" onClick={save}><Save size={15} /> Save task</button>
          <StatusLine status={status} />
        </div>
      )}
    </article>
  );
}

export function CeoTodoList({ uid, tasks, loading }) {
  const [draft, setDraft] = useState({
    title: "",
    category: "STEA",
    priority: "medium",
    status: "todo",
    dueDate: todayIso(),
    reminderDate: "",
    progress: 0,
    notes: "",
    subtasksText: "",
  });
  const { status, run } = useSaveStatus();

  const addTask = () => run(async () => {
    await createCeoDoc(uid, "tasks", {
      title: draft.title || "Untitled task",
      category: draft.category,
      priority: draft.priority,
      status: draft.status,
      dueDate: draft.dueDate,
      reminderDate: draft.reminderDate,
      progress: Number(draft.progress || 0),
      notes: draft.notes,
      completedDate: "",
      accomplishedDate: "",
      subtasks: draft.subtasksText.split("\n").filter(Boolean).map((title) => ({ title: title.trim(), done: false })),
    });
    setDraft({ ...draft, title: "", notes: "", subtasksText: "", progress: 0 });
  }, "Task added.");

  return (
    <div className="ceo-section-stack">
      <section className="ceo-panel">
        <div className="ceo-panel-head"><h2>Daily Planner</h2><StatusLine status={status} /></div>
        <div className="ceo-form-grid">
          <Field label="Task title"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ship one concrete STEA improvement" /></Field>
          <Field label="Project/category"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
          <Field label="Priority"><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
          <Field label="Status"><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="todo">Todo</option><option value="doing">Doing</option><option value="done">Done</option></select></Field>
          <Field label="Due date"><input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></Field>
          <Field label="Reminder"><input type="datetime-local" value={draft.reminderDate} onChange={(e) => setDraft({ ...draft, reminderDate: e.target.value })} /></Field>
          <Field label="Progress %"><input type="number" min="0" max="100" value={draft.progress} onChange={(e) => setDraft({ ...draft, progress: e.target.value })} /></Field>
          <label className="ceo-field ceo-field-wide"><span>Notes</span><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          <label className="ceo-field ceo-field-wide"><span>Mini branches / subtasks</span><textarea value={draft.subtasksText} onChange={(e) => setDraft({ ...draft, subtasksText: e.target.value })} placeholder="One subtask per line" /></label>
          <button className="ceo-primary-btn" onClick={addTask}><Plus size={15} /> Add task</button>
        </div>
      </section>

      <section className="ceo-panel">
        <div className="ceo-panel-head"><h2>Task Board</h2><span>{tasks.length} tasks</span></div>
        {loading ? <LoadingScreen /> : tasks.length ? (
          <div className="ceo-task-list">{tasks.map((task) => <CeoTaskCard key={task.id} task={task} uid={uid} />)}</div>
        ) : (
          <EmptyState title="No tasks yet" message="Create your first CEO task above." />
        )}
      </section>
    </div>
  );
}

export function CeoPlanSection({ uid, title, collectionName, fields, items, loading }) {
  const initial = fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || "" }), {});
  const [draft, setDraft] = useState(initial);
  const { status, run } = useSaveStatus();

  const addItem = () => run(async () => {
    await createCeoDoc(uid, collectionName, draft);
    setDraft(initial);
  }, `${title} saved.`);

  return (
    <section className="ceo-panel">
      <div className="ceo-panel-head"><h2>{title}</h2><StatusLine status={status} /></div>
      <div className="ceo-form-grid">
        {fields.map((field) => (
          <Field key={field.name} label={field.label}>
            {field.type === "textarea" ? (
              <textarea value={draft[field.name] || ""} onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })} />
            ) : field.type === "select" ? (
              <select value={draft[field.name] || ""} onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input type={field.type || "text"} value={draft[field.name] || ""} onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })} />
            )}
          </Field>
        ))}
        <button className="ceo-primary-btn" onClick={addItem}><Plus size={15} /> Save</button>
      </div>
      {loading ? <div className="ceo-inline-loading"><Loader2 className="ceo-spin" size={18} /> Loading...</div> : items.length ? (
        <div className="ceo-record-grid">
          {items.map((item) => (
            <article key={item.id} className="ceo-record-card">
              <button onClick={() => deleteCeoDoc(uid, collectionName, item.id)} aria-label="Delete"><Trash2 size={14} /></button>
              <h3>{item.title || item.goal || item.bookTitle || item.date || title}</h3>
              {fields.map((field) => item[field.name] ? <p key={field.name}><strong>{field.label}:</strong> {String(item[field.name])}</p> : null)}
            </article>
          ))}
        </div>
      ) : <EmptyState title={`No ${title.toLowerCase()} yet`} message="Save the first entry above." />}
    </section>
  );
}

export function CeoBooks({ uid, books, loading }) {
  return (
    <CeoPlanSection
      uid={uid}
      title="Books / Learning List"
      collectionName="books"
      items={books}
      loading={loading}
      fields={[
        { name: "bookTitle", label: "Book title" },
        { name: "author", label: "Author" },
        { name: "status", label: "Status", type: "select", defaultValue: "to read", options: ["to read", "reading", "completed"] },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "keyLessons", label: "Key lessons", type: "textarea" },
      ]}
    />
  );
}

export function CeoJournal({ uid, entries, loading }) {
  return (
    <CeoPlanSection
      uid={uid}
      title="Journal / Notes"
      collectionName="journal"
      items={entries}
      loading={loading}
      fields={[
        { name: "date", label: "Date", type: "date", defaultValue: todayIso() },
        { name: "mood", label: "Mood" },
        { name: "title", label: "Title" },
        { name: "story", label: "Story / reflection", type: "textarea" },
      ]}
    />
  );
}

export default function CeoWorkspace() {
  const { user } = useCeoAuth();
  const uid = user?.uid;
  const [activeTab, setActiveTab] = useState("dashboard");
  const tasks = useCeoCollection(uid, "tasks", "createdAt");
  const accomplishments = useCeoCollection(uid, "accomplishments", "date");
  const weeklyPlans = useCeoCollection(uid, "weeklyPlans", "createdAt");
  const monthlyPlans = useCeoCollection(uid, "monthlyPlans", "createdAt");
  const yearlyVision = useCeoCollection(uid, "yearlyVision", "createdAt");
  const books = useCeoCollection(uid, "books", "createdAt");
  const journal = useCeoCollection(uid, "journal", "date");

  const sortedTasks = useMemo(() => [...tasks.items].sort((a, b) => {
    const statusWeight = { doing: 0, todo: 1, done: 2 };
    return (statusWeight[a.status] ?? 1) - (statusWeight[b.status] ?? 1) || dateMs(b.createdAt) - dateMs(a.createdAt);
  }), [tasks.items]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Planner", icon: ClipboardList },
    { id: "accomplishments", label: "Wins", icon: Check },
    { id: "weekly", label: "Weekly", icon: CalendarDays },
    { id: "monthly", label: "Monthly", icon: TrendingUp },
    { id: "yearly", label: "Vision", icon: Flag },
    { id: "books", label: "Books", icon: GraduationCap },
    { id: "journal", label: "Journal", icon: NotebookPen },
  ];

  return (
    <CeoGuard>
      <CeoStyles />
      <div className="ceo-shell">
        <aside className="ceo-sidebar">
          <div className="ceo-brand">
            <img src="/stea-brand/favicon-transparent.png" alt="S" style={{ width: 42, height: 42, objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = "/stea-brand/app-icon-white-bg.png"; }} />
            <span>STEA CEO</span>
          </div>
          <nav>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}>
                  <Icon size={17} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="ceo-main">
          <header className="ceo-topbar">
            <div>
              <span>Private Firestore path</span>
              <h1>ceoWorkspace/{uid}</h1>
            </div>
            <div className="ceo-user-pill">{user?.email}</div>
          </header>

          {activeTab === "dashboard" && <CeoDashboard tasks={sortedTasks} accomplishments={accomplishments.items} weeklyPlans={weeklyPlans.items} monthlyPlans={monthlyPlans.items} books={books.items} setActiveTab={setActiveTab} />}
          {activeTab === "tasks" && <CeoTodoList uid={uid} tasks={sortedTasks} loading={tasks.loading} />}
          {activeTab === "accomplishments" && (
            <CeoPlanSection uid={uid} title="Daily Accomplishments" collectionName="accomplishments" items={accomplishments.items} loading={accomplishments.loading} fields={[
              { name: "title", label: "Title" },
              { name: "date", label: "Date", type: "date", defaultValue: todayIso() },
              { name: "linkedTask", label: "Linked task ID optional" },
              { name: "mood", label: "Mood / productivity rating" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]} />
          )}
          {activeTab === "weekly" && (
            <CeoPlanSection uid={uid} title="Weekly Plan" collectionName="weeklyPlans" items={weeklyPlans.items} loading={weeklyPlans.loading} fields={[
              { name: "title", label: "Week label" },
              { name: "goals", label: "Weekly goals", type: "textarea" },
              { name: "focusAreas", label: "Focus areas", type: "textarea" },
              { name: "progress", label: "Progress %", type: "number" },
              { name: "status", label: "Completed?", type: "select", defaultValue: "not completed", options: ["not completed", "completed"] },
            ]} />
          )}
          {activeTab === "monthly" && (
            <CeoPlanSection uid={uid} title="Monthly Plan" collectionName="monthlyPlans" items={monthlyPlans.items} loading={monthlyPlans.loading} fields={[
              { name: "title", label: "Month" },
              { name: "goals", label: "Monthly goals", type: "textarea" },
              { name: "incomeTarget", label: "Income target" },
              { name: "steaGrowthTarget", label: "STEA growth target" },
              { name: "progressNotes", label: "Progress notes", type: "textarea" },
            ]} />
          )}
          {activeTab === "yearly" && (
            <CeoPlanSection uid={uid} title="Yearly Vision" collectionName="yearlyVision" items={yearlyVision.items} loading={yearlyVision.loading} fields={[
              { name: "title", label: "Year" },
              { name: "bigGoals", label: "Big goals", type: "textarea" },
              { name: "personalDevelopment", label: "Personal development", type: "textarea" },
              { name: "businessTargets", label: "Business targets", type: "textarea" },
              { name: "learningTargets", label: "Learning targets", type: "textarea" },
            ]} />
          )}
          {activeTab === "books" && <CeoBooks uid={uid} books={books.items} loading={books.loading} />}
          {activeTab === "journal" && <CeoJournal uid={uid} entries={journal.items} loading={journal.loading} />}
        </main>
      </div>
    </CeoGuard>
  );
}

function CeoStyles() {
  return (
    <style>{`
      .ceo-shell{min-height:100vh;background:radial-gradient(circle at 18% 0,rgba(245,166,35,.14),transparent 24%),linear-gradient(180deg,#050506,#0b0d10);color:#fff;display:grid;grid-template-columns:260px minmax(0,1fr);font-family:'Instrument Sans',system-ui,sans-serif}
      .ceo-sidebar{position:sticky;top:0;height:100vh;border-right:1px solid rgba(255,255,255,.08);background:rgba(5,6,8,.88);padding:18px 14px;display:flex;flex-direction:column;gap:22px}.ceo-brand{display:flex;align-items:center;gap:10px;font-weight:950}.ceo-brand div{width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,#f5a623,#ffd17c);color:#111;display:grid;place-items:center}.ceo-sidebar nav{display:grid;gap:6px}.ceo-sidebar button{border:0;border-radius:10px;background:transparent;color:rgba(255,255,255,.62);height:40px;padding:0 11px;display:flex;align-items:center;gap:10px;font-weight:850;cursor:pointer;text-align:left}.ceo-sidebar button.is-active,.ceo-sidebar button:hover{background:linear-gradient(135deg,rgba(245,166,35,.96),rgba(255,209,124,.96));color:#111}
      .ceo-main{min-width:0;padding:22px clamp(14px,3vw,34px) 42px}.ceo-topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:22px}.ceo-topbar span,.ceo-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#f5a623;font-weight:950}.ceo-topbar h1{font-size:19px;margin:3px 0 0}.ceo-user-pill{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:999px;padding:9px 12px;font-size:12px;color:rgba(255,255,255,.72)}
      .ceo-hero{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025));padding:24px;display:flex;justify-content:space-between;gap:20px;margin-bottom:16px}.ceo-hero h1{font-size:clamp(27px,4vw,46px);line-height:1;margin:8px 0 12px;max-width:760px}.ceo-hero p{color:rgba(255,255,255,.6);line-height:1.65;max-width:660px}.ceo-date-card{min-width:180px;border:1px solid rgba(245,166,35,.18);border-radius:8px;padding:16px;background:rgba(245,166,35,.06);align-self:flex-start}.ceo-date-card span{display:block;color:rgba(255,255,255,.45);font-size:12px}.ceo-date-card strong{display:block;margin-top:6px;color:#ffd17c}
      .ceo-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.ceo-stat-card,.ceo-panel,.ceo-task-card,.ceo-record-card{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.035)}.ceo-stat-card{padding:16px;display:grid;gap:8px}.ceo-stat-card svg{color:#f5a623}.ceo-stat-card span{font-size:12px;color:rgba(255,255,255,.5);font-weight:850}.ceo-stat-card strong{font-size:28px}.ceo-two-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}.ceo-section-stack{display:grid;gap:16px}.ceo-panel{padding:18px}.ceo-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.ceo-panel h2{font-size:18px;margin:0}.ceo-panel-head button,.ceo-task-actions button,.ceo-record-card button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;border-radius:8px;height:34px;padding:0 10px;font-weight:850;cursor:pointer}
      .ceo-mini-list,.ceo-task-list,.ceo-record-grid{display:grid;gap:10px}.ceo-mini-item{border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:12px;background:rgba(0,0,0,.16)}.ceo-mini-item strong,.ceo-mini-item span{display:block}.ceo-mini-item span{margin-top:4px;color:rgba(255,255,255,.46);font-size:12px}.ceo-action-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ceo-action-grid button{height:46px;border:1px solid rgba(245,166,35,.16);border-radius:8px;background:rgba(245,166,35,.06);color:#ffd17c;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
      .ceo-form-grid,.ceo-edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ceo-edit-grid{margin-top:14px;border-top:1px solid rgba(255,255,255,.07);padding-top:14px}.ceo-field{display:grid;gap:6px}.ceo-field span{font-size:12px;color:rgba(255,255,255,.52);font-weight:850}.ceo-field input,.ceo-field textarea,.ceo-field select,.ceo-access-card input{width:100%;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.22);color:#fff;border-radius:8px;padding:11px;outline:none}.ceo-field textarea{min-height:92px;resize:vertical}.ceo-field-wide{grid-column:1/-1}.ceo-primary-btn{border:0;border-radius:8px;background:linear-gradient(135deg,#f5a623,#ffd17c);color:#111;height:42px;padding:0 15px;font-weight:950;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.ceo-primary-btn:disabled{opacity:.7;cursor:not-allowed}
      .ceo-task-card{padding:14px;border-left:3px solid rgba(255,255,255,.18)}.ceo-task-card.priority-high,.ceo-task-card.priority-critical{border-left-color:#f5a623}.ceo-task-top{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:start}.ceo-check{width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#111;display:grid;place-items:center;cursor:pointer}.ceo-check.is-done{background:#f5a623}.ceo-task-top h3{margin:0 0 4px;font-size:16px}.ceo-task-top span,.ceo-task-card p{color:rgba(255,255,255,.52);font-size:12px;line-height:1.55}.ceo-task-actions{display:flex;gap:6px}.ceo-progress{height:6px;background:rgba(255,255,255,.08);border-radius:999px;margin:12px 0;overflow:hidden}.ceo-progress span{display:block;height:100%;background:linear-gradient(90deg,#f5a623,#ffd17c)}.ceo-subtasks{display:flex;gap:6px;flex-wrap:wrap}.ceo-subtasks span{border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:5px 8px;color:rgba(255,255,255,.62);font-size:12px}.ceo-subtasks span.is-done{color:#ffd17c}
      .ceo-record-grid{grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-top:16px}.ceo-record-card{padding:14px;position:relative}.ceo-record-card button{position:absolute;top:10px;right:10px;width:32px;padding:0}.ceo-record-card h3{font-size:15px;margin:0 32px 10px 0}.ceo-record-card p{margin:6px 0;color:rgba(255,255,255,.56);font-size:12px;line-height:1.5}.ceo-record-card strong{color:rgba(255,255,255,.82)}.ceo-empty{border:1px dashed rgba(255,255,255,.13);border-radius:8px;display:grid;place-items:center;text-align:center;gap:7px;padding:26px;color:rgba(255,255,255,.45)}.ceo-empty strong{color:#fff}.ceo-inline-loading{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.56)}.ceo-status{font-size:12px;font-weight:850}.ceo-status--success{color:#8be28b}.ceo-status--error{color:#ff9a9a}.ceo-status--loading{color:#ffd17c}
      .ceo-auth-screen{min-height:100vh;background:radial-gradient(circle at 50% 0,rgba(245,166,35,.14),transparent 30%),#050506;color:#fff;display:grid;place-items:center;text-align:center;padding:20px;font-family:'Instrument Sans',system-ui,sans-serif}.ceo-access-card{width:min(100%,420px);border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.04);padding:24px;display:grid;gap:14px}.ceo-access-card h1{margin:0}.ceo-access-card p{margin:0;color:rgba(255,255,255,.58);line-height:1.55}.ceo-lock{width:46px;height:46px;border-radius:8px;background:rgba(245,166,35,.12);color:#ffd17c;display:grid;place-items:center;margin:0 auto}.ceo-form-error{color:#ff9a9a;font-size:13px}.ceo-spin{animation:ceoSpin 1s linear infinite}@keyframes ceoSpin{to{transform:rotate(360deg)}}
      @media(max-width:960px){.ceo-shell{grid-template-columns:1fr}.ceo-sidebar{position:static;height:auto;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.ceo-sidebar nav{display:flex;overflow-x:auto;padding-bottom:4px}.ceo-sidebar button{white-space:nowrap}.ceo-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ceo-two-grid{grid-template-columns:1fr}.ceo-form-grid,.ceo-edit-grid{grid-template-columns:1fr 1fr}.ceo-hero{display:block}.ceo-date-card{margin-top:16px}.ceo-topbar{align-items:flex-start;flex-direction:column}}
      @media(max-width:560px){.ceo-main{padding:14px 12px 28px}.ceo-stats-grid,.ceo-form-grid,.ceo-edit-grid{grid-template-columns:1fr}.ceo-action-grid{grid-template-columns:1fr}.ceo-task-top{grid-template-columns:30px minmax(0,1fr)}.ceo-task-actions{grid-column:2}.ceo-hero{padding:18px}.ceo-user-pill{max-width:100%;overflow:hidden;text-overflow:ellipsis}}
    `}</style>
  );
}
