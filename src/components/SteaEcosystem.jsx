/**
 * SteaEcosystem.jsx
 * ──────────────────────────────────────────────────────────────
 * Provides two reusable components for STEA section pages:
 *
 *  1. <SteaEcosystemBanner page="classroom|education|services|tech|gigs|duka" />
 *     ↳ Dismissable top banner (hidden for 7 days after dismissal)
 *
 *  2. <SteaExploreMore exclude="classroom" />
 *     ↳ Bottom "Explore More STEA" card grid
 * ──────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Home, ExternalLink, Sparkles } from 'lucide-react';

const G = '#F5A623';
const G2 = '#FFD17C';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ── Page-specific banner configs ────────────────────────────────
const PAGE_CONFIG = {
  classroom: {
    icon: '🎓',
    title: 'You are in STEA Classroom',
    desc: 'Discover Education, TechHub, Services and more on STEA Africa.',
  },
  education: {
    icon: '📚',
    title: 'You are in STEA Education',
    desc: 'Explore scholarships, courses, services, jobs and technology resources.',
  },
  services: {
    icon: '💼',
    title: 'You are in STEA Services',
    desc: 'Discover the full STEA ecosystem — Education, TechHub, Duka and more.',
  },
  tech: {
    icon: '⚡',
    title: 'You are in STEA TechHub',
    desc: 'Explore Education, Duka, Services and more on STEA Africa.',
  },
  gigs: {
    icon: '💼',
    title: 'Looking for more opportunities?',
    desc: 'Explore the full STEA ecosystem — Education, TechHub, Duka and more.',
  },
  duka: {
    icon: '🛍️',
    title: 'Welcome to STEA Duka',
    desc: 'Explore Education, TechHub, Services and more on STEA Africa.',
  },
  courses: {
    icon: '📖',
    title: 'You are in STEA Courses',
    desc: 'Discover TechHub, Duka, Services, Gigs and more on STEA Africa.',
  },
  resources: {
    icon: '📂',
    title: 'You are in STEA Resources',
    desc: 'Discover Education, TechHub, Duka and more on STEA Africa.',
  },
};

// ── All STEA ecosystem links ─────────────────────────────────────
const ECOSYSTEM = [
  { id: 'home',      icon: '🏠', label: 'Main Website',       path: '/',             color: G },
  { id: 'education', icon: '🎓', label: 'STEA Education',     path: '/education',    color: '#60a5fa' },
  { id: 'tech',      icon: '⚡', label: 'STEA TechHub',       path: '/tech',         color: '#a78bfa' },
  { id: 'services',  icon: '💼', label: 'STEA Services',      path: '/services',     color: '#f472b6' },
  { id: 'duka',      icon: '🛍️', label: 'STEA Duka',          path: '/duka',         color: '#34d399' },
  { id: 'gigs',      icon: '💻', label: 'Gigs & Kazi',        path: '/kazi',         color: G },
  { id: 'courses',   icon: '📚', label: 'Courses & Resources', path: '/courses',      color: '#fb923c' },
  { id: 'classroom', icon: '🏫', label: 'STEA Classroom',     path: 'https://classroom.stea.africa',    color: '#38bdf8' },
];

// ── localStorage helpers ─────────────────────────────────────────
function getBannerKey(page) {
  return `stea_banner_dismissed_${page}`;
}

function isBannerDismissed(page) {
  try {
    const val = localStorage.getItem(getBannerKey(page));
    if (!val) return false;
    const ts = parseInt(val, 10);
    return Date.now() - ts < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

function dismissBanner(page) {
  try {
    localStorage.setItem(getBannerKey(page), String(Date.now()));
  } catch {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT 1 — SteaEcosystemBanner
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function SteaEcosystemBanner({ page = 'classroom' }) {
  const [visible, setVisible] = useState(false);

  // Mount check — only show if not dismissed recently
  useEffect(() => {
    if (!isBannerDismissed(page)) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [page]);

  const config = PAGE_CONFIG[page] || PAGE_CONFIG.classroom;

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismissBanner(page);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scaleY: 0.92 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -12, scaleY: 0.94 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            zIndex: 9000,
            padding: '0',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15,12,8,0.98) 0%, rgba(8,6,4,0.98) 100%)',
              borderBottom: `1px solid rgba(245,166,35,0.25)`,
              borderTop: `2px solid ${G}`,
              boxShadow: `0 4px 32px rgba(245,166,35,0.08), inset 0 0 60px rgba(245,166,35,0.02)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow orb background */}
            <div style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 300, height: 80,
              background: `radial-gradient(ellipse, ${G}14, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Icon + Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              {/* Pulsing icon badge */}
              <div style={{
                position: 'relative',
                width: 36, height: 36,
                borderRadius: 10,
                background: `rgba(245,166,35,0.12)`,
                border: `1px solid rgba(245,166,35,0.3)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {config.icon}
                {/* Pulse ring */}
                <div style={{
                  position: 'absolute', inset: -4,
                  borderRadius: 14,
                  border: `1px solid rgba(245,166,35,0.2)`,
                  animation: 'stea-pulse 2.4s ease-in-out infinite',
                }} />
              </div>

              {/* Text block */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}>
                  <span style={{ color: G }}>✨ </span>
                  {config.title}
                </div>
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.5)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginTop: 2,
                }}>
                  {config.desc}
                </div>
              </div>
            </div>

            {/* Buttons row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Primary: Visit Main STEA */}
              <Link
                to="/"
                style={{ textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: `linear-gradient(135deg, ${G}, ${G2})`,
                    color: '#0a0800',
                    fontWeight: 900, fontSize: 11,
                    padding: '7px 14px', borderRadius: 9,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 16px rgba(245,166,35,0.3)`,
                  }}
                >
                  <Home size={12} />
                  Visit Main STEA
                </motion.div>
              </Link>

              {/* Secondary: Explore Ecosystem */}
              <Link
                to="/#ecosystem"
                style={{ textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  whileHover={{ scale: 1.04, borderColor: `rgba(245,166,35,0.5)` }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(245,166,35,0.08)',
                    border: '1px solid rgba(245,166,35,0.25)',
                    color: G,
                    fontWeight: 800, fontSize: 11,
                    padding: '7px 12px', borderRadius: 9,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Sparkles size={11} />
                  Explore
                </motion.div>
              </Link>

              {/* Dismiss X */}
              <motion.button
                onClick={handleDismiss}
                whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.12)' }}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s',
                }}
              >
                <X size={13} />
              </motion.button>
            </div>

            {/* Pulse animation style */}
            <style>{`
              @keyframes stea-pulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 0.15; transform: scale(1.18); }
              }
            `}</style>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT 2 — SteaExploreMore (bottom section grid)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EcoCard({ item, isMobile }) {
  const [hov, setHov] = useState(false);
  const isExternal = item.path.startsWith('http');

  const cardContent = (
    <motion.div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: hov
          ? `linear-gradient(135deg, ${item.color}14, rgba(0,0,0,0.7))`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? item.color + '50' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: isMobile ? 14 : 18,
        padding: isMobile ? '14px 12px' : '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: isMobile ? 6 : 10,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: hov
          ? `0 12px 36px ${item.color}18, 0 0 0 1px ${item.color}20`
          : '0 4px 16px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        minHeight: isMobile ? 90 : 120,
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Glow backdrop */}
      {hov && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 30%, ${item.color}10, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: isMobile ? 38 : 48,
        height: isMobile ? 38 : 48,
        borderRadius: isMobile ? 10 : 14,
        background: `${item.color}18`,
        border: `1px solid ${item.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMobile ? 18 : 22,
        transition: 'transform 0.22s',
        transform: hov ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hov ? `0 0 20px ${item.color}30` : 'none',
        flexShrink: 0,
      }}>
        {item.icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize: isMobile ? 11 : 13,
        fontWeight: 800,
        color: hov ? '#fff' : 'rgba(255,255,255,0.75)',
        lineHeight: 1.3,
        transition: 'color 0.2s',
      }}>
        {item.label}
      </div>

      {/* Arrow */}
      {!isMobile && (
        <div style={{
          fontSize: 10,
          color: item.color,
          fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 3,
          opacity: hov ? 1 : 0,
          transform: hov ? 'translateY(0)' : 'translateY(4px)',
          transition: 'all 0.2s',
        }}>
          Open <ArrowRight size={10} />
        </div>
      )}
    </motion.div>
  );

  return isExternal ? (
    <a href={item.path} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      {cardContent}
    </a>
  ) : (
    <Link to={item.path} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
      {cardContent}
    </Link>
  );
}

export function SteaExploreMore({ exclude, isMobile: isMobileProp }) {
  const [isMobile, setIsMobile] = useState(isMobileProp ?? window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const items = ECOSYSTEM.filter(e => e.id !== exclude);

  return (
    <section style={{
      padding: isMobile ? '48px 16px 32px' : '72px 24px 48px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'linear-gradient(180deg, transparent 0%, rgba(245,166,35,0.02) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 200,
        background: `radial-gradient(ellipse, ${G}08, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: 999, padding: '5px 14px',
            color: G, fontSize: 10, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            marginBottom: 14,
          }}>
            <Sparkles size={11} />
            STEA Ecosystem
          </div>

          <h2 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: isMobile ? 22 : 32,
            fontWeight: 900,
            color: '#fff',
            margin: '0 0 10px',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}>
            Explore More{' '}
            <span style={{
              background: `linear-gradient(135deg, ${G}, ${G2})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              STEA Africa
            </span>
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: isMobile ? 13 : 15,
            margin: 0,
            lineHeight: 1.6,
          }}>
            One ecosystem. Many powerful tools. All built for Africa.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(4, 1fr)'
            : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 18,
        }}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <EcoCard item={item} isMobile={isMobile} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: isMobile ? 24 : 36 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${G}, ${G2})`,
                color: '#0a0800',
                fontWeight: 900, fontSize: isMobile ? 13 : 15,
                padding: isMobile ? '12px 24px' : '14px 32px',
                borderRadius: 14, cursor: 'pointer',
                boxShadow: `0 8px 28px rgba(245,166,35,0.3)`,
              }}
            >
              <Home size={16} />
              Visit Main STEA Page
            </motion.div>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Default export for convenience
export default { SteaEcosystemBanner, SteaExploreMore };
