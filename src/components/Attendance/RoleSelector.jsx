import { useState } from "react";
import { motion } from "motion/react";

export function RoleSelector({ onSelect }) {
  const [clickedRole, setClickedRole] = useState(null);

  const roles = [
    { 
      id: 'teacher', 
      title: 'Teacher (Mwalimu)', 
      emoji: '👨‍🏫', 
      color: '#D4AF37', 
      desc: 'Create classroom structures, track attendance lists in real-time, and run quizzes.' 
    },
    { 
      id: 'student', 
      title: 'Student (Mwanafunzi)', 
      emoji: '👨‍Grad', 
      color: '#F5A623', 
      desc: 'Join active class codes, record your daily attendance, and take quizzes.' 
    }
  ];

  const handleSelect = (roleId) => {
    if (clickedRole) return;
    setClickedRole(roleId);
    setTimeout(() => {
      onSelect(roleId);
    }, 850);
  };

  return (
    <div style={{ padding: "24px 16px", width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 760, width: "100%" }}>
        <motion.h2 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: "#fff", letterSpacing: "-0.02em" }}
        >
          Your Role, Your Classroom
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ color: "rgba(255,255,255,0.45)", marginBottom: 32, fontSize: 14, maxWidth: 480, margin: "0 auto 32px auto", lineHeight: 1.5 }}
        >
          Chagua jinsi ya kuingia STEA Classroom ili uweze kusimamia au kujiunga na masomo.
        </motion.p>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
          gap: "20px", 
          width: "100%", 
          maxWidth: "600px", 
          margin: "0 auto" 
        }}>
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              onClick={() => handleSelect(role.id)}
              style={{ 
                padding: "24px 20px", 
                borderRadius: 16, 
                cursor: "pointer", 
                border: "1px solid rgba(255,255,255,0.06)", 
                background: "rgba(8,9,13,0.75)",
                color: "#fff",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "220px",
                height: "100%",
                userSelect: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
              }}
              whileHover={{ scale: 1.02, border: `1px solid ${role.color}45`, background: "rgba(16,18,25,0.9)" }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Spinning Click Loading Overlay */}
              {clickedRole === role.id && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   style={{
                     position: "absolute",
                     inset: 0,
                     background: "rgba(5, 6, 10, 0.96)",
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     justifyContent: "center",
                     gap: 12,
                     zIndex: 10
                   }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "3px solid rgba(245, 166, 35, 0.1)",
                      borderTop: `3px solid ${role.color}`
                    }}
                  />
                  <span style={{ color: role.color, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                    Loading...
                  </span>
                </motion.div>
              )}
 
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  {role.id === 'student' ? '👨‍🎓' : role.emoji}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: role.color, letterSpacing: "-0.01em", marginBottom: 6 }}>{role.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.45 }}>{role.desc}</p>
              </div>
              
              <div style={{ 
                marginTop: 16, 
                paddingTop: 12, 
                borderTop: "1px solid rgba(255,255,255,0.05)", 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                color: role.color,
                fontWeight: 700,
                fontSize: 13
              }}>
                {role.id === 'teacher' ? 'Continue as Teacher →' : 'Continue as Student →'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

