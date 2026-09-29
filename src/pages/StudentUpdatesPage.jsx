import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowLeft, ExternalLink, Calendar, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useCollection } from '../hooks/useFirestore.js';
import { Skeleton } from '../components/Skeleton.jsx';

const G  = '#F5A623';
const G2 = '#FFD17C';

const W = ({ children }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
    {children}
  </div>
);

// ── Allowed student-update categories (blocks tech/gadget docs) ──
const STUDENT_CATEGORIES = new Set([
  'heslb','tcu','admission','deadline','notice','announcement',
  'scholarship','exam','results','university','student','update','general',
]);

function isStudentUpdate(item) {
  const cat = (item.category || item.badge || item.type || item.tag || '').toLowerCase().trim();
  // Block explicit tech/gadget categories
  const BLOCKED = ['tech','technology','gadget','apple','samsung','android','instagram',
    'whatsapp','facebook','ai','tips','website','vpn','phone','laptop','app'];
  if (BLOCKED.some(b => cat.includes(b))) return false;
  // If category is in allowlist, pass
  if (STUDENT_CATEGORIES.has(cat)) return true;
  // If category is empty/unknown, check title/summary for tech keywords
  const text = ((item.title || '') + ' ' + (item.summary || item.description || '')).toLowerCase();
  const TECH_WORDS = ['iphone','samsung','galaxy','apple watch','google pixel','android update',
    'instagram update','whatsapp update','tiktok','youtube update'];
  if (TECH_WORDS.some(w => text.includes(w))) return false;
  // Allow by default (benefit of the doubt for unlabeled updates)
  return true;
}


// FILTERS now generated dynamically with t() inside component
const FILTER_IDS = [
  { id: 'all',       emoji: '📢', key: 'updates_filter_all' },
  { id: 'heslb',    emoji: '💳', key: 'updates_filter_heslb' },
  { id: 'tcu',      emoji: '🏛️', key: 'updates_filter_tcu' },
  { id: 'admission', emoji: '🎓', key: 'updates_filter_admission' },
  { id: 'deadline',  emoji: '📅', key: 'updates_filter_deadline' },
  { id: 'notice',    emoji: '📣', key: 'updates_filter_notice' },
];

// ── Static fallback updates ──────────────────────────
const STATIC_UPDATES = [
  {
    id: 's1', category: 'heslb', title: 'HESLB Maombi 2025/2026 — Wazi Sasa',
    summary: 'HESLB imetangaza kwamba maombi ya mikopo ya mwaka wa masomo 2025/2026 yamefunguliwa. Wanafunzi wote wanaostahili wanashauriwa kuomba mapema kupitia OLAMS portal.',
    date: 'Januari 2025', urgent: true, link: 'https://www.heslb.go.tz',
  },
  {
    id: 's2', category: 'tcu', title: 'TCU Selection Results 2025 — Angalia Chaguo Lako',
    summary: 'Matokeo ya awali ya selection ya chuo 2025 yameshafika. Ingia kwenye TCU portal ili kuona chuo ulichopewa na kufanya uthibitisho.',
    date: 'Aprili 2025', urgent: true, link: 'https://www.tcu.go.tz',
  },
  {
    id: 's3', category: 'admission', title: 'UDSM Uandikishaji — Ratiba ya Semester ya Kwanza',
    summary: 'Chuo Kikuu cha Dar es Salaam kimetangaza ratiba ya uandikishaji wa wanafunzi wapya wa mwaka 2025. Wanafunzi wanaoshikilia nafasi wanashauriwa kujiandaa na nyaraka zote.',
    date: 'Agosti 2025', urgent: false, link: 'https://www.udsm.ac.tz',
  },
  {
    id: 's4', category: 'deadline', title: 'Deadline ya HESLB Round 2 — Tarehe 15 Agosti',
    summary: 'Wanafunzi waliokosa awamu ya kwanza ya ombi la mkopo wanaweza kuomba katika awamu ya pili. Deadline ni tarehe 15 Agosti 2025.',
    date: 'Julai 2025', urgent: true, link: 'https://olas.heslb.go.tz',
  },
  {
    id: 's5', category: 'notice', title: 'Tangazo la Muhimu — Mabadiliko ya Programu za TCU',
    summary: 'TCU imetoa mabadiliko madogo katika orodha ya programu zinazohusiana na Computer Science na IT kwa mwaka 2025. Wanafunzi waeleze program wanazotaka tena.',
    date: 'Machi 2025', urgent: false, link: 'https://www.tcu.go.tz',
  },
  {
    id: 's6', category: 'heslb', title: 'HESLB — Jinsi ya Kuangalia Status ya Mkopo Wako',
    summary: 'Wanafunzi wanasubiri majibu ya mkopo wanaweza kuangalia hali yao wakati wowote kwenye OLAMS portal. Ingiza namba yako ya NIDA au reference number.',
    date: 'Oktoba 2025', urgent: false, link: 'https://olas.heslb.go.tz',
  },
];

// ── UpdateCard ────────────────────────────────────────
function UpdateCard({ item, i }) {
  const { t } = useSettings();
  const categoryColors = {
    heslb: '#10b981', tcu: '#a855f7', admission: '#60a5fa',
    deadline: G, notice: '#fb923c', general: 'rgba(255,255,255,0.5)',
  };
  const color = categoryColors[item.category] || categoryColors.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
      style={{
        background: item.urgent ? 'rgba(245,166,35,0.04)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${item.urgent ? G + '25' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20, padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 999,
            background: `${color}14`, color, border: `1px solid ${color}25`,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {item.category?.toUpperCase() || 'UPDATE'}
          </span>
          {item.urgent && (
            <span style={{
              fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 999,
              background: `${G}18`, color: G, border: `1px solid ${G}30`,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <AlertCircle size={10} /> {t('updates_urgent_badge')}
            </span>
          )}
        </div>
        {item.date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            <Calendar size={12} />
            {item.date}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, color: '#fff', margin: 0 }}>
        {item.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>
        {item.summary || item.description}
      </p>

      {/* Link */}
      {item.link && (
        <a href={item.link} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
          fontSize: 12, fontWeight: 800, color: color, textDecoration: 'none',
          padding: '7px 14px', borderRadius: 10,
          background: `${color}10`, border: `1px solid ${color}20`,
          alignSelf: 'flex-start', transition: 'all 0.18s',
        }}>
          <ExternalLink size={12} /> {t('updates_read_more')}
        </a>
      )}
    </motion.div>
  );
}

// ── Main export ──────────────────────────────────────
export default function StudentUpdatesPage() {
  const { t } = useSettings();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  // Primary: dedicated student_updates collection (clean, admin-controlled)
  // Fallback: legacy updates collection filtered through isStudentUpdate()
  const { docs: primaryDocs,  loading: primaryLoading  } = useCollection('student_updates', 'publishDate', 60);
  const { docs: updatesDocs,  loading: updatesLoading  } = useCollection('updates', 'createdAt', 50);

  const loading = primaryLoading && updatesLoading;

  // Merge: prefer student_updates docs; supplement with filtered legacy updates
  const allRemote = [
    ...(primaryDocs || []),
    ...(updatesDocs || []).filter(isStudentUpdate),
  ]
    .filter((item, idx, self) => self.findIndex(t => t.id === item.id) === idx)
    .filter(item => item.status !== 'draft' && item.status !== 'inactive')
    .sort((a, b) => {
      const getTs = d =>
        d.publishDate?.seconds || d.createdAt?.seconds ||
        (d.publishDate ? new Date(d.publishDate).getTime() / 1000 : 0);
      // Urgent/priority items float to top, then newest
      const urgentA = a.urgent || a.priority === 'high' ? 1 : 0;
      const urgentB = b.urgent || b.priority === 'high' ? 1 : 0;
      if (urgentB !== urgentA) return urgentB - urgentA;
      return getTs(b) - getTs(a);
    });

  // Use remote if available, fall back to static
  const sourceItems = allRemote.length > 0 ? allRemote : STATIC_UPDATES;

  const filtered = activeFilter === 'all'
    ? sourceItems
    : sourceItems.filter(item =>
        (item.category || item.badge || item.type || '')
          .toLowerCase()
          .includes(activeFilter)
      );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>

      {/* Hero */}
      <section style={{
        padding: 'clamp(72px,10vw,120px) 20px 52px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.08) 0%, transparent 55%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center',
      }}>
        <W>
          <button onClick={() => navigate('/exams')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '8px 16px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <ArrowLeft size={14} /> Student Center
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 18px', background: 'rgba(251,146,60,0.1)',
            border: '1px solid rgba(251,146,60,0.25)', borderRadius: 999,
            color: '#fb923c', fontSize: 12, fontWeight: 900,
            marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <Bell size={14} /> Student Updates
          </div>

          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(28px, 5.5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.04em', marginBottom: 18,
          }}>
            Habari Muhimu za <span style={{ color: '#fb923c' }}>Wanafunzi</span>
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'rgba(255,255,255,0.52)',
            lineHeight: 1.7, maxWidth: 520, margin: '0 auto',
          }}>
            HESLB, TCU, maombi ya chuo, tarehe za mwisho na matangazo muhimu — yote mahali pamoja.
          </p>
        </W>
      </section>

      {/* Notice: no calculators/tools here */}
      <section style={{ padding: '20px 0 0' }}>
        <W>
          <div style={{
            display: 'flex', gap: 10, padding: '14px 18px', borderRadius: 14,
            background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', alignItems: 'flex-start',
          }}>
            <Info size={16} color='#60a5fa' style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
              Sehemu hii ina habari na matangazo tu. Kwa mwongozo wa chuo au calculator ya pointi, nenda{' '}
              <button onClick={() => navigate('/exams/university-guide')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>{t("updates_nav_uni")}</button>
              {'. '}
              Kwa scholarship, nenda{' '}
              <button onClick={() => navigate('/exams/scholarships')} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>{t("updates_nav_scholarships")}</button>.
            </p>
          </div>
        </W>
      </section>

      {/* Filter tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0a0b0f', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0' }}>
        <W>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
            {FILTER_IDS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
                borderRadius: 12, border: '1px solid',
                borderColor: activeFilter === f.id ? `${G}40` : 'rgba(255,255,255,0.08)',
                background: activeFilter === f.id ? `${G}12` : 'rgba(255,255,255,0.03)',
                color: activeFilter === f.id ? G : 'rgba(255,255,255,0.5)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
              }}>
                {f.emoji} {t(f.key)}
              </button>
            ))}
          </div>
        </W>
      </div>

      {/* Updates grid */}
      <section style={{ padding: 'clamp(32px,5vw,56px) 0' }}>
        <W>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
              {filtered.map((item, i) => <UpdateCard key={item.id || i} item={item} i={i} />)}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Bell size={40} color='rgba(255,255,255,0.15)' style={{ marginBottom: 16 }} />
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{t("updates_no_results")}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 20 }}>{t('updates_try_all')}</p>
              <button onClick={() => setActiveFilter('all')} style={{
                background: `linear-gradient(135deg,${G},${G2})`, color: '#111',
                border: 'none', borderRadius: 12, padding: '10px 24px',
                fontWeight: 900, fontSize: 14, cursor: 'pointer',
              }}>
                Angalia Zote
              </button>
            </div>
          )}
        </W>
      </section>

      {/* Quick links */}
      <section style={{ padding: '0 0 clamp(48px,6vw,72px)' }}>
        <W>
          <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px 22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>{t('updates_quick_links')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'HESLB OLAMS Portal', url: 'https://olas.heslb.go.tz', color: '#10b981' },
                { label: 'TCU Portal', url: 'https://www.tcu.go.tz', color: '#a855f7' },
                { label: 'UDSM', url: 'https://www.udsm.ac.tz', color: '#60a5fa' },
                { label: 'MUHAS', url: 'https://www.muhas.ac.tz', color: '#f472b6' },
                { label: 'Wizara ya Elimu TZ', url: 'https://www.moe.go.tz', color: G },
              ].map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 800, color: link.color,
                  textDecoration: 'none', padding: '7px 14px', borderRadius: 10,
                  background: `${link.color}10`, border: `1px solid ${link.color}22`,
                }}>
                  <ExternalLink size={12} /> {link.label}
                </a>
              ))}
            </div>
          </div>
        </W>
      </section>
    </div>
  );
}
