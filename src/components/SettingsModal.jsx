import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Monitor, Globe2, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const G = "#F5A623";

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, language, setLanguage, t } = useSettings();

  if (!isOpen) return null;

  const themes = [
    { id: 'system', label: t('settings_theme_system'), icon: <Monitor size={18} /> },
    { id: 'light', label: t('settings_theme_light'), icon: <Sun size={18} /> },
    { id: 'dark', label: t('settings_theme_dark'), icon: <Moon size={18} /> },
  ];

  const languages = [
    { id: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
    // Future languages
    // { id: 'ar', label: 'العربية', flag: '🇸🇦' },
    // { id: 'fr', label: 'Français', flag: '🇫🇷' },
    // { id: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(2,3,8,.8)", backdropFilter: "blur(12px)" }}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              background: "#0a0c14",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 24,
              boxShadow: "0 32px 80px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.05)",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: "#fff" }}>
                {t('settings_title')}
              </h2>
              <button
                onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: 12, border: "none", background: "rgba(255,255,255,.05)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, display: "grid", gap: 32 }}>
              {/* Appearance */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  <Sun size={14} /> {t('settings_appearance')}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {themes.map(th => (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      style={{
                        padding: "16px 12px",
                        borderRadius: 16,
                        border: `1.5px solid ${theme === th.id ? G : "rgba(255,255,255,.08)"}`,
                        background: theme === th.id ? `${G}15` : "rgba(255,255,255,.03)",
                        color: theme === th.id ? G : "#fff",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                        transition: "all .2s"
                      }}
                    >
                      {th.icon}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  <Globe2 size={14} /> {t('settings_language')}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {languages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: `1.5px solid ${language === lang.id ? G : "rgba(255,255,255,.08)"}`,
                        background: language === lang.id ? `${G}10` : "rgba(255,255,255,.02)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all .2s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{lang.flag}</span>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{lang.label}</span>
                      </div>
                      {language === lang.id && <Check size={18} color={G} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.01)" }}>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  border: "none",
                  background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                  color: "#111",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: `0 8px 24px ${G}40`
                }}
              >
                {t('settings_save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
