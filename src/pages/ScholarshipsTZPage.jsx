import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ChevronDown, ExternalLink, ArrowLeft, CheckCircle, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const G  = '#F5A623';
const G2 = '#FFD17C';

const W = ({ children }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
    {children}
  </div>
);

// ── Data ─────────────────────────────────────────────
const TABS = [
  { id: 'heslb',    label: 'HESLB Guide',           emoji: '💳' },
  { id: 'tcu',      label: 'TCU Scholarships',       emoji: '🏛️' },
  { id: 'local',    label: 'Local Scholarships',     emoji: '🌍' },
  { id: 'docs',     label: 'Documents Required',     emoji: '📄' },
  { id: 'deadlines',label: 'Deadlines & Eligibility',emoji: '📅' },
];

const HESLB_STEPS = [
  { num: '01', title: 'Apply Online', desc: 'Nenda OLAMS portal: olas.heslb.go.tz. Jiandikishe kwa namba yako ya NIDA au birth certificate.', link: 'https://olas.heslb.go.tz', linkText: 'Open OLAMS' },
  { num: '02', title: 'Jaza Fomu ya Maombi', desc: 'Weka taarifa zako za familia, hali ya kiuchumi, matokeo ya masomo na chuo ulichochaguliwa na TCU.' },
  { num: '03', title: 'Pakia Nyaraka', desc: 'Pakia nyaraka zote zinazohitajika kama PDF wazi. Hakikisha kila kitu ni wazi na kinasomeka.' },
  { num: '04', title: 'Subiri Tathmini', desc: 'HESLB watatathmini maombi yako. Unaweza kuangalia hali (status) yako kwenye OLAMS portal wakati wowote.' },
  { num: '05', title: 'Pokea Jibu', desc: 'Jibu hutolewa Oktoba-Novemba. Kama umepata mkopo, utapokea barua ya mkopo (Loan Letter) kupitia barua pepe au portal.' },
  { num: '06', title: 'Thibitisha Mkopo', desc: 'Nenda chuoni na thibitisha mkopo wako. Fedha zitatumwa moja kwa moja kwa chuo chako.' },
];

const TCU_SCHOLARSHIPS = [
  { name: 'Government Sponsorship (Serikali)', desc: 'Ufadhili wa serikali kwa wanafunzi wa public universities wanaostahili kiakademia na kiuchumi. Inajumuisha ada za masomo na allowances.', coverage: 'Ada + Allowance', deadline: 'Maombi pamoja na TCU application', color: G },
  { name: 'TCU Merit Award', desc: 'Tuzo ya wanafunzi waliopata matokeo bora sana ya ACSEE. Huhitaji kuomba — TCU hutoa moja kwa moja baada ya kupata nafasi.', coverage: 'Sehemu ya ada', deadline: 'Automatic baada ya selection', color: '#4ade80' },
  { name: 'Presidential Award', desc: 'Ufadhili maalum kwa wanafunzi bora zaidi wa kitaifa. Hutolewa na Wizara ya Elimu na TCU kwa kushirikiana.', coverage: 'Full Tuition + Allowance', deadline: 'Check Ministry of Education announcement', color: '#60a5fa' },
];

const LOCAL_SCHOLARSHIPS = [
  { org: 'TANESCO Foundation', field: 'Engineering, Science', amount: 'TZS 2M-5M/mwaka', url: 'https://www.tanesco.go.tz' },
  { org: 'CRDB Foundation', field: 'Business, Finance, Economics', amount: 'TZS 1.5M-3M/mwaka', url: 'https://www.crdbbank.co.tz' },
  { org: 'NMB Foundation', field: 'All fields (priority STEM)', amount: 'TZS 1M-2.5M/mwaka', url: 'https://www.nmbtz.com' },
  { org: 'Vodacom Foundation TZ', field: 'ICT, Computer Science', amount: 'Varies by year', url: 'https://www.vodacom.co.tz' },
  { org: 'TADB Scholarship', field: 'Agriculture, Finance', amount: 'Full/Partial', url: 'https://www.tadb.co.tz' },
  { org: 'Julius Nyerere Foundation', field: 'All fields', amount: 'Varies', url: '#' },
];

const REQUIRED_DOCS = [
  { doc: 'Form 4 Certificate (CSEE)', note: 'Namba ya cheti lazima iwe sahihi' },
  { doc: 'Form 6 Certificate (ACSEE)', note: 'Kwa wanaoomba mkopo wa degree' },
  { doc: 'NIDA / Birth Certificate', note: 'Utambulisho rasmi wa Tanzania' },
  { doc: 'Cheti cha TCU Selection', note: 'Kuthibitisha umepata nafasi chuoni' },
  { doc: 'Vyeti vya Wazazi/Walezi', note: 'Hali ya kiuchumi (income, NIDA)' },
  { doc: 'Bank Statement / Pay Slip', note: 'Hali ya fedha ya mzazi/mlezi' },
  { doc: 'Barua ya Shule za Msingi/Sekondari', note: 'Kwa wanafunzi waliosoma shule za serikali' },
  { doc: 'Picha za Pasipoti (2)', note: 'Background nyeupe, hivi karibuni' },
  { doc: 'Death Certificate (ikiwa ni yatima)', note: 'Ikiwa mzazi amefariki' },
];

const DEADLINES = [
  { event: 'Maombi ya TCU (Round 1)', period: 'Januari – Machi', urgent: false, note: 'Fungua baada ya ACSEE results' },
  { event: 'Maombi ya HESLB', period: 'Februari – Aprili', urgent: true, note: 'Tumia OLAMS portal' },
  { event: 'Jibu la Selection ya Awali', period: 'Aprili', urgent: false, note: 'Check TCU portal' },
  { event: 'TCU Round 2 (Kubadilisha chaguo)', period: 'April – May', urgent: false, note: 'Kwa waliokosa au wanaotaka kubadilisha' },
  { event: 'Malipo ya Ada ya Awali', period: 'Kabla ya usajili', urgent: true, note: 'Lazima ulipe kabla ya registration' },
  { event: 'Usajili Chuoni', period: 'Septemba – Oktoba', urgent: false, note: 'Semester huanza baada ya usajili' },
  { event: 'HESLB Round 2', period: 'Julai – Agosti', urgent: false, note: 'Kwa wanafunzi walioko chuoni tayari' },
  { event: 'Jibu la Mkopo wa HESLB', period: 'Oktoba – Novemba', urgent: false, note: 'Check status on OLAMS' },
];

// ── Step Card ─────────────────────────────────────────
function StepCard({ step, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.06 }}
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '24px 22px', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 12, right: 16,
        fontSize: 48, fontWeight: 900, color: 'rgba(255,255,255,0.03)',
        fontFamily: "'Bricolage Grotesque',sans-serif", lineHeight: 1,
      }}>{step.num}</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: 12,
        background: `${G}18`, color: G, fontSize: 14, fontWeight: 900,
        marginBottom: 14, border: `1px solid ${G}25`,
      }}>{step.num}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{step.title}</h3>
      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: step.link ? 14 : 0 }}>{step.desc}</p>
      {step.link && (
        <a href={step.link} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 800, color: G, textDecoration: 'none',
          padding: '6px 14px', borderRadius: 8,
          background: `${G}12`, border: `1px solid ${G}25`,
        }}>
          <ExternalLink size={13} /> {step.linkText}
        </a>
      )}
    </motion.div>
  );
}

// ── FAQ item ─────────────────────────────────────────
function FaqItem({ q, a, i }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${open ? G+'35' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: 'none', border: 'none',
        color: '#fff', fontWeight: 700, fontSize: 14, textAlign: 'left', cursor: 'pointer', gap: 16,
      }}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color={G} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontSize: 13.5 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ──────────────────────────────────────
export default function ScholarshipsTZPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('heslb');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>

      {/* Hero */}
      <section style={{
        padding: 'clamp(72px,10vw,120px) 20px 52px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 55%)',
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
            padding: '7px 18px', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)', borderRadius: 999,
            color: '#10b981', fontSize: 12, fontWeight: 900,
            marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <CreditCard size={14} /> Scholarships Tanzania
          </div>

          <h1 style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 'clamp(28px, 5.5vw, 52px)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.04em', marginBottom: 18,
          }}>
            Pata Ufadhili wa <span style={{ color: '#10b981' }}>Masomo Tanzania</span>
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'rgba(255,255,255,0.52)',
            lineHeight: 1.7, maxWidth: 540, margin: '0 auto',
          }}>
            HESLB, TCU scholarships na ufadhili wa sekta binafsi Tanzania. Mwongozo kamili wa hatua kwa hatua.
          </p>
        </W>
      </section>

      {/* Tab nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0a0b0f', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0' }}>
        <W>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                borderRadius: 12, border: '1px solid',
                borderColor: activeTab === tab.id ? `${G}40` : 'rgba(255,255,255,0.08)',
                background: activeTab === tab.id ? `${G}12` : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? G : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}>
                <span>{tab.emoji}</span> {tab.label}
              </button>
            ))}
          </div>
        </W>
      </div>

      {/* Content */}
      <section style={{ padding: 'clamp(36px,5vw,64px) 0' }}>
        <W>
          <AnimatePresence mode="wait">

            {/* HESLB */}
            {activeTab === 'heslb' && (
              <motion.div key="heslb" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, marginBottom: 10 }}>
                    💳 HESLB — Mkopo wa Serikali
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
                    Higher Education Students' Loans Board (HESLB) inatoa mikopo kwa wanafunzi wanaosoma vyuo vya Tanzania. Omba mapema — deadline huwa Februari hadi Aprili.
                  </p>
                  <a href="https://olas.heslb.go.tz" target="_blank" rel="noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
                    background: `linear-gradient(135deg,${G},${G2})`, color: '#111',
                    padding: '12px 24px', borderRadius: 14, fontWeight: 900,
                    fontSize: 14, textDecoration: 'none', boxShadow: `0 6px 20px ${G}30`,
                  }}>
                    <ExternalLink size={15} /> Open OLAMS Portal
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
                  {HESLB_STEPS.map((step, i) => <StepCard key={i} step={step} i={i} />)}
                </div>

                {/* FAQs */}
                <div style={{ marginTop: 48 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Maswali ya HESLB</h3>
                  <div style={{ display: 'grid', gap: 10, maxWidth: 720 }}>
                    {[
                      { q: 'Ni nani anayestahili mkopo wa HESLB?', a: 'Wanafunzi wote wa Tanzania wanaosoma katika vyuo vya kutambuliwa vya Tanzania (public na private) wanaweza kuomba. Kipaumbele hutolewa kwa wenye hali ngumu kiuchumi.' },
                      { q: 'Mkopo wa HESLB unajumuisha nini?', a: 'Mkopo unaweza kujumuisha: ada za masomo (tuition), ada za matunzo (living expenses), na ada za vitabu. Kiasi hutegemea hali ya kiuchumi na chuo.' },
                      { q: 'Ninaomba mkopo mpya kila mwaka?', a: 'Ndiyo, unahitaji kuomba upya kila mwaka wa masomo. Walioanza wanaomba tena kupitia OLAMS portal.' },
                      { q: 'Mkopo hurejelewa lini?', a: 'Mkopo unarudi mwaka mmoja baada ya kukamilisha masomo yako na kupata ajira. Kiwango cha malipo kinaanzia 10% ya mshahara.' },
                    ].map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} i={i} />)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TCU */}
            {activeTab === 'tcu' && (
              <motion.div key="tcu" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, marginBottom: 10 }}>
                    🏛️ Scholarship za TCU
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
                    Tanzania Commission for Universities (TCU) inasimamia ufadhili wa serikali na tuzo mbalimbali kwa wanafunzi wa vyuo vikuu Tanzania.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                  {TCU_SCHOLARSHIPS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}25`, borderRadius: 20, padding: '24px 22px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, marginBottom: 16 }} />
                      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>{s.name}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}22` }}>
                          ✓ {s.coverage}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          📅 {s.deadline}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 16, background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                    💡 <strong style={{ color: G }}>Kumbuka:</strong> Maombi ya TCU na HESLB hufanywa wakati huo huo. Tumia TCU Inter-University Selection System (ISS) kuomba chuo, kisha omba mkopo wa HESLB kupitia OLAMS portal.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Local */}
            {activeTab === 'local' && (
              <motion.div key="local" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, marginBottom: 10 }}>
                    🌍 Scholarship za Sekta Binafsi Tanzania
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
                    Makampuni na mashirika ya Tanzania yanatoa scholarship za ziada. Angalia kila mwaka kwenye tovuti zao rasmi.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
                  {LOCAL_SCHOLARSHIPS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '20px 18px' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{s.org}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📚 {s.field}</span>
                        <span style={{ fontSize: 12, color: G, fontWeight: 700 }}>💰 {s.amount}</span>
                      </div>
                      {s.url !== '#' && (
                        <a href={s.url} target="_blank" rel="noreferrer" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)',
                          textDecoration: 'none', padding: '5px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          <ExternalLink size={12} /> Tovuti Rasmi
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                    💡 <strong style={{ color: '#10b981' }}>Ushauri:</strong> Angalia tovuti rasmi za makampuni mara kwa mara — tangazo la scholarship mara nyingi hutoka Januari hadi Machi kila mwaka.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Documents */}
            {activeTab === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, marginBottom: 10 }}>
                    📄 Nyaraka Zinazohitajika
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
                    Tayarisha nyaraka hizi zote kabla ya kuanza ombi lako. Kuhakikisha uandaaji mapema kunakuokoa muda na msongo wa mawazo.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14, maxWidth: 900 }}>
                  {REQUIRED_DOCS.map((doc, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', gap: 14, padding: '16px 18px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, alignItems: 'flex-start',
                      }}>
                      <CheckCircle size={18} color={G} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{doc.doc}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{doc.note}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color='#f87171' style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                      <strong style={{ color: '#f87171' }}>Muhimu:</strong> Hakikisha nyaraka zote ni za awali (originals) au nakala zilizoidhinishwa. Nyaraka zinazosomeka vibaya zinakataliwa moja kwa moja na HESLB.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Deadlines */}
            {activeTab === 'deadlines' && (
              <motion.div key="deadlines" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, marginBottom: 10 }}>
                    📅 Tarehe Muhimu za Mwaka
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, maxWidth: 680 }}>
                    Fuata ratiba hii kila mwaka wa masomo ili usikose deadline muhimu.
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 12, maxWidth: 800 }}>
                  {DEADLINES.map((d, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', gap: 16, padding: '16px 20px',
                        background: d.urgent ? 'rgba(245,166,35,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${d.urgent ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 16, alignItems: 'flex-start',
                      }}>
                      <Calendar size={18} color={d.urgent ? G : 'rgba(255,255,255,0.3)'} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{d.event}</span>
                          {d.urgent && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 999, background: `${G}18`, color: G, border: `1px solid ${G}25`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Muhimu</span>}
                        </div>
                        <div style={{ fontSize: 13, color: G, fontWeight: 700, marginBottom: 4 }}>📅 {d.period}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{d.note}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </W>
      </section>
    </div>
  );
}
