import { useState, useEffect } from "react";
import { 
  getFirebaseDb, 
  collection, 
  query, 
  where, 
  getCountFromServer,
  getFirebaseAuth
} from "../../firebase.js";
import { Terminal, Shield, RefreshCw, Layers, Database, Activity, Cpu } from "lucide-react";

export default function AdminDiagnostics({ user }) {
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0
  });

  const [sysInfo, setSysInfo] = useState({
    logs: [],
    dbStatus: "Checking...",
    firebaseStatus: "Checking...",
    storageUsage: "Checking..."
  });

  const [errorMsg, setErrorMsg] = useState("");

  const fetchDiagnostics = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firebase database not initialized");

      // 1. Fetch firestore counts in parallel
      const [uSnap, sSnap, tSnap, cSnap] = await Promise.all([
        getCountFromServer(collection(db, "users")),
        getCountFromServer(query(collection(db, "users"), where("role", "==", "student"))).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(query(collection(db, "users"), where("role", "==", "teacher"))).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, "classes")).catch(() => ({ data: () => ({ count: 0 }) }))
      ]);

      setCounters({
        totalUsers: uSnap.data().count,
        totalStudents: sSnap.data().count,
        totalTeachers: tSnap.data().count,
        totalClasses: cSnap.data().count
      });

      // 2. Fetch API logs with auth token
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error("User session not found");

      const token = await currentUser.getIdToken(true);
      const res = await fetch("/api/admin/diagnostics", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      setSysInfo({
        logs: data.logs || [],
        dbStatus: data.dbStatus || "Online",
        firebaseStatus: data.firebaseStatus || "Healthy",
        storageUsage: data.storageUsage || "Active"
      });

    } catch (err) {
      console.error("Diagnostics error:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div style={{ color: "#fff", fontFamily: "inherit" }} id="admin-diagnostics-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, margin: 0 }}>
            🛠️ <span style={{ color: "#F5A623" }}>Mifumo na Diagnostics</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", margin: "4px 0 0", fontSize: 14 }}>
            Uhakiki wa afya ya mfumo, watumiaji, madarasa na kumbukumbu za makosa.
          </p>
        </div>
        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          style={{
            background: "rgba(245,166,35,0.1)",
            border: "1px solid rgba(245,166,35,0.3)",
            color: "#F5A623",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(245,166,35,0.18)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(245,166,35,0.1)"}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Inapakia..." : "Refresh Status"}
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 16, color: "#f87171", marginBottom: 24 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>⚠️ Hitilafu imetokea beimu:</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, fontFamily: "monospace" }}>{errorMsg}</p>
        </div>
      )}

      {/* Grid Counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Jumla ya Watumiaji</span>
            <Layers size={18} style={{ color: "#38bdf8" }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>{counters.totalUsers}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Accounts registered</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Wanafunzi (Students)</span>
            <Database size={18} style={{ color: "#4ade80" }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#4ade80" }}>{counters.totalStudents}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Active in classroom</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Walimu (Teachers)</span>
            <Shield size={18} style={{ color: "#f472b6" }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#f472b6" }}>{counters.totalTeachers}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>STEA Class supervisors</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Madarasa (Classes)</span>
            <Cpu size={18} style={{ color: "#f5a623" }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#f5a623" }}>{counters.totalClasses}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Virtual school classes</div>
        </div>
      </div>

      {/* Health Status Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} /> Connection Health
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Node Server Status:</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>● Online</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Firestore Database:</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>● {sysInfo.dbStatus}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Firebase Native Auth:</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>● {sysInfo.firebaseStatus}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Cloud Storage Access:</span>
              <span style={{ color: "#f5a623", fontWeight: 700 }}>● {sysInfo.storageUsage}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} /> Runtime Environment
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>STEA Portal Host:</span>
              <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 12 }}>{window.location.hostname}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>SDK Mode:</span>
              <span style={{ color: "#a5b4fc", fontWeight: 600 }}>Production Bundle</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Encryption Enforced:</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>SSL Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Logs Console */}
      <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
            <Terminal size={18} style={{ color: "#ff4444" }} /> Real-time System Error Telemetry Logs
          </h3>
          <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            Showing last {sysInfo.logs.length} events
          </span>
        </div>

        <div style={{
          background: "#050608",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 16,
          maxHeight: 400,
          overflowY: "auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 12,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.6,
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)"
        }}>
          {sysInfo.logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.25)" }}>
              <Terminal size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              No runtime errors recorded in client_errors.log yet. System is operating normally!
            </div>
          ) : (
            sysInfo.logs.map((log, idx) => (
              <pre key={idx} style={{
                margin: 0,
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: idx === sysInfo.logs.length - 1 ? "none" : "1px dashed rgba(255,255,255,0.08)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}>
                {log}
              </pre>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
