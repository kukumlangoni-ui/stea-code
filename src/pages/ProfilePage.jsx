import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Shield, Calendar, Edit3, Settings, Bell, Globe, Heart, LogOut, Camera, Check, X 
} from "lucide-react";
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  isAdminEmail
} from "../firebase";
import STEAHeader from "../components/shared/STEAHeader.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import ReferralCard from "../components/ReferralCard.jsx";
import { ensureReferralProfile } from "../services/referralService.js";
import STEAAvatar from "../components/STEAAvatar.jsx";

const G = "#D4AF37"; // Active STEA gold accent

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Editable Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/");
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    const authFallback = {
      uid: authUser.uid,
      email: authUser.email || "",
      displayName: authUser.displayName || "",
      photoURL: authUser.photoURL || "",
      role: "user"
    };
    // Render from Auth immediately. Firestore can enrich this profile when it responds.
    setUser((current) => current || authFallback);
    setFullName((current) => current || authUser.displayName || "");
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", authUser.uid));
        if (snap.exists() && active) {
          const data = snap.data();
          const role = isAdminEmail(authUser.email) ? "super_admin" : (data.role || "user");
          const referralCode = data.referralCode || await ensureReferralProfile(authUser);
          setUser({ uid: authUser.uid, email: authUser.email, ...data, role, referralCode });
          
          if (import.meta.env.DEV) {
            console.log(`[AUTH DEBUG] UID: ${authUser.uid} | Email: ${authUser.email} | Detected Role: ${role} | Source: ${isAdminEmail(authUser.email) ? 'isAdminEmail whitelist' : 'Firestore document'}`);
          }
          setFullName(data.fullName || data.displayName || authUser.displayName || "");
          setPhone(data.phone || "");
        } else if (active) {
          const referralCode = await ensureReferralProfile(authUser);
          const role = isAdminEmail(authUser.email) ? "super_admin" : "user";
          setUser({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName || "",
            role: role,
            referralCode
          });
          
          if (import.meta.env.DEV) {
            console.log(`[AUTH DEBUG] UID: ${authUser.uid} | Email: ${authUser.email} | Detected Role: ${role} | Source: ${isAdminEmail(authUser.email) ? 'isAdminEmail whitelist' : 'Fallback (no document)'}`);
          }
          setFullName(authUser.displayName || "");
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        // Auth fallback is already visible; this fetch only enriches it.
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
  }, [authUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        fullName,
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUser(prev => ({ ...prev, fullName, phone }));
      setEditOpen(false);
    } catch (err) {
      console.error("Save profile error", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAFA" }}>
        <div style={{ height: 60, background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }} />
        <main style={{ maxWidth: 640, margin: "24px auto", padding: "0 16px" }} aria-label="Loading STEA profile">
          <div style={{ height: 310, borderRadius: 24, background: "linear-gradient(90deg, #FFFFFF, #F3F4F6, #FFFFFF)", border: "1px solid #E5E7EB" }} />
          <div style={{ height: 180, marginTop: 20, borderRadius: 24, background: "linear-gradient(90deg, #FFFFFF, #F3F4F6, #FFFFFF)", border: "1px solid #E5E7EB" }} />
        </main>
      </div>
    );
  }

  const joinDate = user?.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "June 2026";

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", paddingBottom: 100 }}>
      {/* Shared Header */}
      <STEAHeader title="Profile" user={user} />

      <main style={{ maxWidth: 640, margin: "24px auto", padding: "0 16px" }}>
        {/* Profile Card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
          textAlign: "center"
        }}>
          {/* Avatar */}
          <STEAAvatar user={{ ...user, displayName: fullName || user?.displayName }} size="xl" alt="Your profile" />

          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
              {fullName || "STEA Member"}
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Mail size={14} /> {user?.email}
            </p>
          </div>

          {/* Role & Date Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#FFF8E1",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#8F6D00",
              fontSize: 12,
              fontWeight: 800
            }}>
              <Shield size={13} />
              <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{String(user?.role || "user").replace("_", " ")}</span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#F3F4F6",
              border: "1px solid #E5E7EB",
              color: "#4B5563",
              fontSize: 12,
              fontWeight: 700
            }}>
              <Calendar size={13} />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <ReferralCard profile={user} compact onViewLeaderboard={() => navigate("/leaderboard?tab=referrals")} />
        </div>

        {/* Admin Panel Button */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: '#111827',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(17,24,39,0.15)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Shield size={18} color="#D4AF37" />
              Open Admin Panel
            </button>
          </div>
        )}

        {/* DEV-ONLY DEBUG PANEL */}
        {import.meta.env.DEV && authUser && (
          <div style={{
            marginTop: 20,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 16,
            padding: 16,
            fontSize: 12,
            fontFamily: "monospace",
            color: "#92400E"
          }}>
            <h4 style={{ margin: "0 0 8px 0", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Shield size={14} /> ROLE DETECTION DEBUG</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div><strong>Email:</strong> {authUser.email}</div>
              <div><strong>Detected Role:</strong> {authUser.role || user?.role || "user"}</div>
              <div><strong>Role Source:</strong> {authUser.roleSource || "Unknown"}</div>
              <div><strong>canEditUsers:</strong> {(authUser.role === "super_admin").toString()}</div>
            </div>
          </div>
        )}

        {/* Achievement Progress Card */}
        {(() => {
          const LEVELS = [
            { name: "Beginner", icon: "🌱", minPoints: 0, maxPoints: 199 },
            { name: "Explorer", icon: "🚀", minPoints: 200, maxPoints: 599 },
            { name: "Achiever", icon: "🏆", minPoints: 600, maxPoints: 1499 },
            { name: "Expert", icon: "💎", minPoints: 1500, maxPoints: 2999 },
            { name: "Elite", icon: "👑", minPoints: 3000, maxPoints: 5999 },
            { name: "Legend", icon: "🔥", minPoints: 6000, maxPoints: 999999 }
          ];

          const points = user?.points || 0;
          const streak = user?.streak || 0;
          
          let currentLvl = LEVELS[0];
          let nextLvl = LEVELS[1];
          for (let i = 0; i < LEVELS.length; i++) {
            if (points >= LEVELS[i].minPoints) {
              currentLvl = LEVELS[i];
              nextLvl = LEVELS[i + 1] || LEVELS[i];
            }
          }

          const pointsInCurrentRange = points - currentLvl.minPoints;
          const rangeTotal = nextLvl.minPoints - currentLvl.minPoints;
          const progressPercent = nextLvl === currentLvl ? 100 : Math.min(100, Math.max(0, (pointsInCurrentRange / rangeTotal) * 100));

          // Predefined Badges structure
          const BADGES = [
            { id: "login_1", name: "Day One", desc: "Logged in to STEA", icon: "🎉", target: 1, current: user?.logins || 0 },
            { id: "views_10", name: "Avid Reader", desc: "Viewed 10 resources", icon: "📚", target: 10, current: user?.resourceViews || 0 },
            { id: "downloads_5", name: "Archivist", desc: "Downloaded 5 past papers", icon: "💾", target: 5, current: user?.downloads || 0 },
            { id: "quizzes_3", name: "Brainiac", desc: "Completed 3 quizzes", icon: "🧠", target: 3, current: user?.quizzesCompleted || 0 },
            { id: "classroom_join", name: "Scholar", desc: "Joined STEA Classroom", icon: "🏫", target: 1, current: user?.classroomJoined ? 1 : 0 },
            { id: "referral_1", name: "Ambassador", desc: "Referred a friend", icon: "🤝", target: 1, current: user?.referrals || 0 }
          ];

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
              {/* Progress Level Card */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                position: "relative"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: G, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Level</span>
                    <h3 style={{ margin: "2px 0 0 0", fontSize: 20, fontWeight: 900, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{currentLvl.icon}</span> {currentLvl.name}
                    </h3>
                  </div>

                  {/* Streak Card */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#FFF8E1",
                    border: "1.5px solid rgba(212,175,55,0.25)",
                    padding: "6px 12px",
                    borderRadius: 16,
                    color: "#8F6D00"
                  }}>
                    <span style={{ fontSize: 16 }}>🔥</span>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{streak} Day</span>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", opacity: 0.8 }}>Streak</span>
                    </div>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#6B7280", marginBottom: 4 }}>
                    <span>{points} STEA Points</span>
                    {nextLvl !== currentLvl && <span>{nextLvl.minPoints} pts for {nextLvl.name}</span>}
                  </div>
                  <div style={{ width: "100%", height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent}%`, height: "100%", background: G, borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>

              {/* Badges Grid */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                  🏅 Unlocked Badges
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {BADGES.map((badge) => {
                    const unlocked = badge.current >= badge.target;
                    return (
                      <div
                        key={badge.id}
                        style={{
                          background: unlocked ? "#FFFDF5" : "#FAFAFA",
                          border: unlocked ? `1px solid rgba(212,175,55,0.3)` : "1px solid #E5E7EB",
                          borderRadius: 16,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          opacity: unlocked ? 1 : 0.6,
                          transition: "all 0.2s"
                        }}
                      >
                        <span style={{ fontSize: unlocked ? 24 : 20, filter: unlocked ? "none" : "grayscale(100%)", marginBottom: 4 }}>
                          {badge.icon}
                        </span>
                        <strong style={{ fontSize: 11, fontWeight: 900, color: unlocked ? "#8F6D00" : "#4B5563", display: "block", marginBottom: 2 }}>
                          {badge.name}
                        </strong>
                        <span style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.1 }}>
                          {badge.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity History Logs */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                  📜 Recent Activity History
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {user?.activities && user.activities.length > 0 ? (
                    user.activities.slice(0, 5).map((act, idx) => (
                      <div key={idx} style={{ display: "flex", justifyItems: "center", gap: 10, borderBottom: idx < 4 ? "1px solid #F3F4F6" : "none", paddingBottom: 8 }}>
                        <div style={{ fontSize: 14 }}>⚡</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#111827" }}>{act.title || "Points Earning"}</span>
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{act.time || "Recently"}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: G }}>+{act.points || 10} pts</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 12 }}>
                      No recent activities logged. View courses, download notes, or take quizzes to earn points!
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quick Actions List */}
        <div style={{
          marginTop: 20,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 24,
          padding: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}>
          {/* Edit Profile Action */}
          <button
            onClick={() => setEditOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderRadius: 16,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FFF8E1", color: G, display: "grid", placeItems: "center" }}>
              <Edit3 size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14, color: "#111827", fontWeight: 800 }}>Edit Profile</strong>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Update name and contact phone</span>
            </div>
          </button>

          {/* Settings Action */}
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderRadius: 16,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF6FF", color: "#2563EB", display: "grid", placeItems: "center" }}>
              <Settings size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14, color: "#111827", fontWeight: 800 }}>Settings</strong>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Adjust options and settings</span>
            </div>
          </button>

          {/* Support STEA Action */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-stea-support"))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderRadius: 16,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FEE2E2", color: "#EF4444", display: "grid", placeItems: "center" }}>
              <Heart size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14, color: "#111827", fontWeight: 800 }}>Support STEA</strong>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Help support the digital ecosystem</span>
            </div>
          </button>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "14px 16px",
              background: "none",
              border: "none",
              borderRadius: 16,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F3F4F6", color: "#4B5563", display: "grid", placeItems: "center" }}>
              <LogOut size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14, color: "#111827", fontWeight: 800 }}>Logout</strong>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Sign out of your account</span>
            </div>
          </button>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1px solid #E5E7EB",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                Edit Profile
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                style={{ background: "#F3F4F6", border: "none", color: "#9CA3AF", cursor: "pointer", borderRadius: "50%", padding: 6, display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#4B5563", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    color: "#111827",
                    outline: "none"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#4B5563", marginBottom: 6 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    color: "#111827",
                    outline: "none"
                  }}
                  placeholder="+255..."
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: "1px solid #E5E7EB",
                    background: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    background: G,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
