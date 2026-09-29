/**
 * MobileAppGuidePage.jsx — STEA Mobile Launch Hub & Store Deployment Blueprint
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, Apple, Play, Sparkles, CheckCircle, ChevronDown, 
  Code, Info, ShieldCheck, Mail, User, Phone, Zap, ArrowRight,
  Database, RefreshCw, Send, AlertTriangle, Layers, BookOpen, Clock, Heart
} from 'lucide-react';
import { getFirebaseDb, collection, addDoc, serverTimestamp } from '../firebase.js';
import { useMobile } from '../hooks/useMobile.js';
import confetti from 'canvas-confetti';

// Shared premium width wrapper
const W = ({ children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
    {children}
  </div>
);

export default function MobileAppGuidePage() {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('simulator'); // simulator, playStore, appStore, tech
  
  // Simulator state
  const [simulatedScreen, setSimulatedScreen] = useState('splash'); // splash, duka, edu, ai, gigs

  // Form states for Closed Beta registration
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', platform: 'Android', device: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Interactive Checklist toggles managed locally for the user
  const [checklistPlay, setChecklistPlay] = useState({
    sdk34: true,
    testers20: false,
    keystore: false,
    privacyUrl: true,
    mPesaLegal: false,
    closedAlpha: false
  });

  const [checklistApp, setChecklistApp] = useState({
    humanIterface: true,
    transporter: false,
    appleSignIn: false,
    privacyHosting: true,
    termsOfUse: false,
    ageRating: false
  });

  const handleTesterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Tafadhali jaza jina na barua pepe yako (Name and Email are required).');
      return;
    }
    setFormSubmitting(true);
    setFormError('');

    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firebase runtime database missing or not initialized.");

      await addDoc(collection(db, "mobile_testers"), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        platform: formData.platform,
        device: formData.device.trim(),
        message: formData.message.trim(),
        registeredAt: serverTimestamp() || new Date(),
        status: 'pending'
      });

      setFormSuccess(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F5A623', '#FFD17C', '#ffffff', '#111111']
      });
    } catch (err) {
      console.error("Failed to add mobile tester:", err);
      // Fallback local support
      setFormError('Tafadhali jaribu tena. Hitilafu ya mfumo: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ background: '#07070a', color: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
      {/* 1. HERO HEADER */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '60px 0 40px', background: 'radial-gradient(circle at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 65%)' }}>
        <W>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(245,166,35,0.04)',
                border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 99,
                padding: '6px 16px',
                fontSize: 12,
                color: '#F5A623',
                fontWeight: 800,
                marginBottom: 24,
                letterSpacing: 0.5
              }}
            >
              <Smartphone size={14} className="animate-pulse" />
              STEA Mobile App Hub & Blueprint
            </motion.div>

            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 900,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              marginBottom: 16
            }}>
              Let’s Build Something <br />
              <span style={{ color: '#F5A623' }}>Strong & Amazing</span> for App Stores
            </h1>

            <p style={{
              fontSize: 15,
              color: '#888',
              lineHeight: 1.6,
              maxWidth: 620,
              margin: '0 auto 32px'
            }}>
              Transitioning STEA from a high-performance web platform to native iOS & Android applications. Examine live mockups, app store checklists, and mobile architecture blueprints.
            </p>
          </div>
        </W>
      </div>

      {/* 2. DYNAMIC NAVIGATION TABS */}
      <W>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 10,
          background: '#121215',
          border: '1px solid #1e1e24',
          borderRadius: 16,
          padding: 6,
          marginBottom: 40
        }}>
          {[
            { id: 'simulator', label: '📱 Device Emulator', desc: 'Try Interactive Mobile UI' },
            { id: 'playStore', label: '🤖 Google Play Store', desc: 'Requirements & Checklist' },
            { id: 'appStore', label: '🍎 Apple App Store', desc: 'iOS Approval Strategy' },
            { id: 'tech', label: '⚡ Technical Specs', desc: 'Frameworks, DB, payments' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #1e1e24 0%, #151518 100%)' : 'transparent',
                border: activeTab === tab.id ? '1px solid #2a2a32' : '1px solid transparent',
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: isMobile ? 'center' : 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                color: activeTab === tab.id ? '#F5A623' : '#fff',
                marginBottom: 3
              }}>
                {tab.label}
              </div>
              <div style={{ fontSize: 10, color: activeTab === tab.id ? '#aaa' : '#666' }}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>
      </W>

      {/* 3. TAB CONENT */}
      <W>
        {activeTab === 'simulator' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 390px',
            gap: 40,
            alignItems: 'start'
          }}>
            {/* Left: Configuration Controls */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, letterSpacing: 1.5 }}>✦ INTERACTIVE PREVIEW</span>
                <h3 style={{ fontSize: 24, fontWeight: 900, marginTop: 4, marginBottom: 12 }}>STEA Mobile Simulator</h3>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, margin: 0 }}>
                  Select the simulated screen flow below to preview the mobile layout on the virtual smartphone. This is the visual baseline for our cross-platform client development.
                </p>
              </div>

              {/* Selector grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
                {[
                  { id: 'splash', label: 'Splash Animation', desc: 'STEA startup experience', color: '#F5A623' },
                  { id: 'duka', label: 'STEA Duka (Shop)', desc: 'Optimized marketplace', color: '#90CDF4' },
                  { id: 'edu', label: 'Learning Center', desc: 'Results browser & notes', color: '#68D391' },
                  { id: 'ai', label: 'AI Swahili Lab', desc: 'Artificial Intelligence tool', color: '#F6AD55' },
                  { id: 'gigs', label: 'Freelance & Gigs', desc: 'Jobs map & listings', color: '#B7791F' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSimulatedScreen(item.id)}
                    style={{
                      background: simulatedScreen === item.id ? 'rgba(245,166,35,0.06)' : '#121215',
                      border: `1px solid ${simulatedScreen === item.id ? '#F5A623' : '#1e1e24'}`,
                      borderRadius: 14,
                      padding: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      {simulatedScreen === item.id && <Sparkles size={12} color="#F5A623" />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{item.desc}</div>
                  </button>
                ))}
              </div>

              {/* Development Focus areas */}
              <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 20, padding: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="#F5A623" />
                  Key Mobile UX Guidelines
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,166,35,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#F5A623', fontSize: 13, fontWeight: 800 }}>01</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Touch Targets & Density</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>All clickable buttons must reside inside targets of at least 44px on mobile and 48px on tablets. Margin structures align perfectly for fat thumb taps in poor connectivity situations.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,166,35,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#F5A623', fontSize: 13, fontWeight: 800 }}>02</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Instant-On Feedbacks</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>No blank screens. Flutter or React Native frameworks must preload standard local page structures or skeleton bars block elements while Firebase pulls live database metrics.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,166,35,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#F5A623', fontSize: 13, fontWeight: 800 }}>03</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Gestured Back-Navigation</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Native swiping gesture to go back (standard swipe-from-left-edge for iOS) must hook cleanly into state router to optimize app navigation speed.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Simulated Smartphone Wrapper */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* Virtual Smartphone Housing */}
              <div style={{
                width: 360,
                height: 720,
                background: '#010101',
                border: '14px solid #1a1a1f',
                borderRadius: 48,
                boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 0 1px #2C2C35',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Dynamic Island / Notch */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 24,
                  background: '#000',
                  borderRadius: 20,
                  zIndex: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '0 12px'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0b1622' }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0d0d0d' }} />
                </div>

                {/* Device Status Bar */}
                <div style={{
                  background: '#07070a',
                  padding: '12px 16px 4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  zIndex: 99
                }}>
                  <div>09:41</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>5G LTE</span>
                    <div style={{ width: 14, height: 8, border: '1px solid #fff', borderRadius: 2, padding: 1, display: 'flex' }}>
                      <div style={{ flex: 1, background: '#fff', borderRadius: 1 }} />
                    </div>
                  </div>
                </div>

                {/* Simulated Screen Container */}
                <div style={{ flex: 1, background: '#08080a', overflowY: 'auto', position: 'relative' }}>
                  <AnimatePresence mode="wait">
                    {simulatedScreen === 'splash' && (
                      <motion.div
                        key="splash_scr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 20 }}
                      >
                        <div style={{ fontSize: 32, fontWeight: 950, color: '#F5A623', letterSpacing: -1, marginBottom: 16 }}>STEA</div>
                        <div style={{ width: 100, height: 3, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.2 }} style={{ height: '100%', background: '#F5A623' }} />
                        </div>
                        <span style={{ color: '#888', fontSize: 10, marginTop: 12 }}>Pakia huduma za STEA...</span>
                      </motion.div>
                    )}

                    {simulatedScreen === 'duka' && (
                      <motion.div
                        key="duka_scr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: 16 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div style={{ fontSize: 16, fontWeight: 950, color: '#fff' }}>STEA Duka</div>
                          <span style={{ fontSize: 9, background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>China and Local</span>
                        </div>

                        {/* Search */}
                        <div style={{ background: '#121215', border: '1px solid #222', padding: 8, borderRadius: 10, color: '#555', fontSize: 11, marginBottom: 14 }}>
                          🔍 Tafuta bidhaa...
                        </div>

                        {/* Products list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { name: 'iPhone 15 Pro Max', price: 'TZS 2,650,000', desc: 'Direct from China factories. Certified original.', label: 'Hot Sale' },
                            { name: 'Dual Mode Wireless Mouse', price: 'TZS 32,000', desc: 'Super slim & silent clicking mouse.', label: 'China Stock' }
                          ].map((item, id) => (
                            <div key={id} style={{ background: '#16161a', border: '1px solid #222', borderRadius: 12, padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{item.name}</div>
                                <span style={{ fontSize: 8, background: '#F5A623', color: '#000', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>{item.label}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, margin: '4px 0' }}>{item.price}</div>
                              <p style={{ fontSize: 9, color: '#666', margin: 0, lineHeight: 1.3 }}>{item.desc}</p>
                              <button style={{ width: '100%', background: 'none', border: '1px solid #333', color: '#fff', fontSize: 10, padding: '6px 0', marginTop: 10, borderRadius: 8, fontWeight: 700 }}>Order From China</button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {simulatedScreen === 'edu' && (
                      <motion.div
                        key="edu_scr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: 16 }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 950, color: '#fff', marginBottom: 12 }}>Education Hub</div>
                        
                        {/* Highlights */}
                        <div style={{ background: '#0fa35022', border: '1px solid #0fa35055', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: '#0fa350', fontWeight: 900 }}>🎓 NECTA 2024 results are live!</div>
                          <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>Check national exam performance instantly without server lag.</div>
                        </div>

                        {/* Menu structure */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                          {['Check Results', 'Past Papers', 'Classroom Notes', 'Online Quiz'].map((label, i) => (
                            <div key={i} style={{ background: '#121215', border: '1px solid #222', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                              <div style={{ fontSize: 16, marginBottom: 4 }}>{['📊', '📝', '📚', '⚡'][i]}</div>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Recent files */}
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 8 }}>RESOURCES POOL</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {['Physics Form IV Mock 2024', 'Chemistry Practical Answers 2024'].map((title, id) => (
                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16161a', padding: '8px 12px', borderRadius: 8, border: '1px solid #222' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{title}</span>
                              <span style={{ fontSize: 8, color: '#F5A623', fontWeight: 900 }}>Soma PDF</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {simulatedScreen === 'ai' && (
                      <motion.div
                        key="ai_scr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 950, color: '#fff', marginBottom: 4 }}>Swahili AI Companion</div>
                        <p style={{ fontSize: 10, color: '#888', margin: '0 0 16px 0' }}>STEA artificial intelligence trained to answer study doubts in Swahili.</p>

                        {/* chat messages */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                          <div style={{ alignSelf: 'flex-start', background: '#16161a', padding: 10, borderRadius: '12px 12px 12px 0px', maxWidth: '85%', border: '1px solid #222' }}>
                            <div style={{ fontSize: 9, color: '#888', fontWeight: 700, marginBottom: 2 }}>STEA AI</div>
                            <div style={{ fontSize: 10.5, lineHeight: 1.3 }}>Habari! Una swali gani kuhusu masomo ya Hisabati, Sayansi au Kiingereza leo?</div>
                          </div>
                          <div style={{ alignSelf: 'flex-end', background: '#F5A623', color: '#000', padding: 10, borderRadius: '12px 12px 0px 12px', maxWidth: '85%' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800 }}>Nisaidie kujua utofauti wa Atom na Molecule.</div>
                          </div>
                        </div>

                        {/* Input bar */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 16, borderTop: '1px solid #222', paddingTop: 10 }}>
                          <div style={{ flex: 1, background: '#121215', border: '1px solid #222', padding: '8px 12px', borderRadius: 8, color: '#444', fontSize: 10 }}>
                            Uliza kitu hapa...
                          </div>
                          <div style={{ width: 28, height: 28, background: '#F5A623', borderRadius: 8, display: 'grid', placeItems: 'center', color: '#000', fontWeight: 700 }}>
                            ➔
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {simulatedScreen === 'gigs' && (
                      <motion.div
                        key="gigs_scr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ padding: 16 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div style={{ fontSize: 16, fontWeight: 950, color: '#fff' }}>Gigs & Kazi</div>
                          <span style={{ fontSize: 9, color: '#F5A623', fontWeight: 800 }}>Dsm & Arusha</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[
                            { title: 'Social Media Management', pay: 'TZS 450,000 / m', company: 'Shops.CO', tag: 'Freelance' },
                            { title: 'Chemistry Tutor for Form VI', pay: 'TZS 15,000 / Hr', company: 'STEA Private', tag: 'Part-time' },
                            { title: 'React Native Developer App', pay: 'TZS 1.5M / Project', company: 'STEA Digital', tag: 'Contract' }
                          ].map((gig, idx) => (
                            <div key={idx} style={{ background: '#16161a', border: '1px solid #222', borderRadius: 10, padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{gig.title}</span>
                                <span style={{ fontSize: 7.5, background: 'rgba(245,166,35,0.1)', color: '#F5A623', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>{gig.tag}</span>
                              </div>
                              <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>{gig.company}</div>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#F5A623' }}>{gig.pay}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Home Indicator Bar */}
                <div style={{
                  padding: '8px 0 10px',
                  display: 'flex',
                  justifyContent: 'center',
                  background: '#07070a',
                  zIndex: 99
                }}>
                  <div style={{ width: 130, height: 4, borderRadius: 2, background: '#fff' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE PLAY STORE TAB */}
        {activeTab === 'playStore' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 40 }}>
            {/* Guide Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.08)', display: 'grid', placeItems: 'center', color: '#F5A623' }}>
                  <Play size={20} fill="#F5A623" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, letterSpacing: 1 }}>ANDROID HUB</div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Play Store Deployment Specification</h3>
                </div>
              </div>

              <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6, marginBottom: 28 }}>
                Publishing STEA to Google Play store requires meeting several strict guidelines instituted recently by Google. Follow this roadmap to secure an obstacle-free submission.
              </div>

              {/* Requirement Blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color="#F5A623" />
                    Target SDK Level 34+ Requirement
                  </div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                    As of November 2024, all updates & new submissions to Google Play must target Android 14 (API Level 34) or higher. Failure to meet this stops user downloads on recent devices.
                  </div>
                </div>

                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} color="#F5A623" />
                    20 Active Testers for 14 Days Rule
                  </div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                    For personal developer accounts created after November 2023, Google mandates running a Closed Testing Track with <strong style={{ color: '#fff' }}>20 real testers elected</strong> continuously active for at least 14 days before submitting a request to apply for the Production Track.
                  </div>
                </div>

                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color="#F5A623" />
                    Secure Digital Keystore (AAB Bundle)
                  </div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                    You should sign code bundles inside an Android App Bundle (<code style={{ color: '#F5A623' }}>.aab</code>) rather than standard legacy APK files. Play App Signing safely escrow-manages our release keys.
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox tracker card */}
            <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 24, padding: 28 }}>
              <h4 style={{ fontSize: 16, fontWeight: 950, marginBottom: 6, color: '#F5A623' }}>Play Store Checklist</h4>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>Interactive list to track our production-readiness roadmap.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'sdk34', label: 'Configure build.gradle to targetSdkVersion 34+', val: checklistPlay.sdk34 },
                  { key: 'testers20', label: 'Enroll 20 Closed Testers via STEA Beta Circle', val: checklistPlay.testers20 },
                  { key: 'keystore', label: 'Generate production release key signing configuration', val: checklistPlay.keystore },
                  { key: 'privacyUrl', label: 'Publish STEA Official Privacy Policy on website', val: checklistPlay.privacyUrl },
                  { key: 'mPesaLegal', label: 'Confirm local Tanzanian mobile money settlement compliance', val: checklistPlay.mPesaLegal },
                  { key: 'closedAlpha', label: 'Promote from Closed Alpha to Google Play Internal track', val: checklistPlay.closedAlpha }
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => setChecklistPlay({ ...checklistPlay, [item.key]: e.target.checked })}
                      style={{
                        marginTop: 3,
                        accentColor: '#F5A623',
                        width: 16,
                        height: 16,
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: 13, color: item.val ? '#fff' : '#888', textDecoration: item.val ? 'line-through' : 'none', transition: 'color 0.2s' }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ h: 1, background: '#222', margin: '24px 0' }} />
              <div style={{ display: 'flex', justify: 'space-between', align: 'center', fontSize: 12 }}>
                <span style={{ color: '#888' }}>Total Progress Completed:</span>
                <strong style={{ color: '#F5A623' }}>
                  {Math.round((Object.values(checklistPlay).filter(Boolean).length / Object.keys(checklistPlay).length) * 100)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* APPLE APP STORE TAB */}
        {activeTab === 'appStore' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 40 }}>
            {/* Guide Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.08)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                  <Apple size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, letterSpacing: 1 }}>APPLE iOS HUB</div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>App Store Deployment Guide</h3>
                </div>
              </div>

              <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6, marginBottom: 28 }}>
                Publishing on Apple’s App Store highlights STEA as a high-fidelity digital benchmark. Apple’s strict visual, functionality, and security rules should be satisfied prior to first submission in Mac App Store Connect.
              </div>

              {/* Specs items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Code size={16} color="#F5A623" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 6px 0' }}>Rule 2.1: App Completeness & Webview Rejection</h5>
                    <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5 }}>
                      Apple routinely rejects basic, simple wrapping webviews of websites if they lack offline fallback capacities or native iOS features. This is why we rely on cross-platform wrappers (like React Native / Flutter with native navigation APIs) rather than custom web containers.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color="#F5A623" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 6px 0' }}>Rule 4.8: Sign In with Apple Rule</h5>
                    <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5 }}>
                      If our mobile application offers any social log-ins (such as Google Authentication), Apple mandates integrating Apple ID auth ("Sign in with Apple") as a primary option, designed identically to other provider options.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={16} color="#F5A623" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 900, color: '#fff', margin: '0 0 6px 0' }}>Core Metadata Requirements</h5>
                    <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5 }}>
                      Submit high-resolution promotional screenshots for iPhone 15 Pro Max (6.7" Display) and iPhone 14 Plus (6.5" Display). Provide test credentials clearly for Reviewers on submission dashboard.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* iOS Checklist tracker */}
            <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 24, padding: 28 }}>
              <h4 style={{ fontSize: 16, fontWeight: 950, marginBottom: 6, color: '#F5A623' }}>App Store Checklist</h4>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>Satisfy these requirements to ensure Apple Review verification.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'humanIterface', label: 'Verify Human Interface Guidelines styling compliance', val: checklistApp.humanIterface },
                  { key: 'transporter', label: 'Bundle .ipa release using Transporter or Xcode tool', val: checklistApp.transporter },
                  { key: 'appleSignIn', label: 'Configure iOS credential hub for Sign in with Apple', val: checklistApp.appleSignIn },
                  { key: 'privacyHosting', label: 'Setup dedicated hosted terms page for consumer safety', val: checklistApp.privacyHosting },
                  { key: 'termsOfUse', label: 'Specify End-User License Agreement (Apple Standard EULA)', val: checklistApp.termsOfUse },
                  { key: 'ageRating', label: 'Settle App Rating Questionnaire with proper ages classification', val: checklistApp.ageRating }
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => setChecklistApp({ ...checklistApp, [item.key]: e.target.checked })}
                      style={{
                        marginTop: 3,
                        accentColor: '#F5A623',
                        width: 16,
                        height: 16,
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: 13, color: item.val ? '#fff' : '#888', textDecoration: item.val ? 'line-through' : 'none', transition: 'color 0.2s' }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ h: 1, background: '#222', margin: '24px 0' }} />
              <div style={{ display: 'flex', justify: 'space-between', align: 'center', fontSize: 12 }}>
                <span style={{ color: '#888' }}>Total Progress Completed:</span>
                <strong style={{ color: '#F5A623' }}>
                  {Math.round((Object.values(checklistApp).filter(Boolean).length / Object.keys(checklistApp).length) * 100)}%
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* TECHNICAL SPECS TAB */}
        {activeTab === 'tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
              
              {/* Dev stack select */}
              <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <Code size={18} color="#F5A623" />
                  <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Flutter vs React Native choice</h4>
                </div>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 16 }}>
                  Our premium baseline structure calls for a quick cross-platform choice to optimize Tanzania markets. Here is our recommended setup:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#16161a', border: '1px solid #222', padding: 14, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#F5A623', marginBottom: 4 }}>Flutter (STEA Strong Recommendation)</div>
                    <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                      Dart-based graphics rendering engine. Renders components pixel-for-pixel identically on both old Android devices & Apple units. Eliminates platform inconsistencies, handles high scroll performance on list pages seamlessly. Highly durable.
                    </div>
                  </div>
                  <div style={{ background: '#16161a', border: '1px solid #222', padding: 14, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#93C5FD', marginBottom: 4 }}>React Native (JS Based)</div>
                    <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                      JavaScript-focused development. Easiest path referencing existing STEA modules directly. However, runtime package inconsistencies across old Android SDK versions are higher in Tanzanian local hardware context.
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache and Payments stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Database size={18} color="#F5A623" />
                    <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Offline Cache Blueprint</h4>
                  </div>
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, margin: 0 }}>
                    Tanzania internet accessibility can sometimes fluctuate. The app must implement robust offline caching using <strong style={{ color: '#fff' }}>SQLite</strong> or local <strong style={{ color: '#fff' }}>Hive keys database</strong> storage. When offline, NECTA papers and results previously queried remain browseable instantly from cache.
                  </p>
                </div>

                <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Zap size={18} color="#F5A623" />
                    <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Tanzania Mobile Payments Stack</h4>
                  </div>
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, margin: 0 }}>
                    STEA Duka buyers require easy local channels. Mobile endpoints will integrate local digital gateways (M-Pesa, Tigo Pesa, Airtel Money, Halopesa) alongside card checkouts to drive checkout success above 95% across Dar es Salaam & distant regions.
                  </p>
                </div>
              </div>

            </div>

            {/* Architecture flow mapping */}
            <div style={{ background: '#121215', border: '1px solid #1e1e24', borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>✦ INFRA ARCHITECTURE FLOW</div>
              <h4 style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>STEA Sync Engine to Firestore</h4>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, fontWeight: 800 }}>
                <div style={{ background: '#1e1e24', padding: '10px 18px', border: '1px solid #334', borderRadius: 8 }}>STEA Mobile Client App</div>
                <span style={{ color: '#F5A623' }}>➞</span>
                <div style={{ background: '#1e1e24', padding: '10px 18px', border: '1px solid #334', borderRadius: 8 }}>Firebase Offline Persistent SDK</div>
                <span style={{ color: '#F5A623' }}>➞</span>
                <div style={{ background: '#1e1e24', padding: '10px 18px', border: '1px solid #334', borderRadius: 8 }}>Google Cloud Firestore Database</div>
              </div>
            </div>
          </div>
        )}
      </W>

      {/* 4. REGISTER CLOSED BETA SECTION */}
      <W>
        <div style={{ marginTop: 60 }}>
          <div style={{
            background: 'linear-gradient(135deg, #16161a 0%, #08080c 100%)',
            border: '1px solid #1e1e24',
            borderRadius: 24,
            padding: isMobile ? '32px 24px' : '48px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ maxWidth: 660 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Heart size={20} color="#F5A623" fill="#F5A623" />
                <span style={{ fontSize: 11, color: '#F5A623', fontWeight: 800, letterSpacing: 2 }}>JOIN THE EXCLUSIVE CIRCLE</span>
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 950, marginBottom: 12, color: '#fff' }}>
                Join STEA Mobile Closed Beta
              </h2>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 32 }}>
                We are building the alpha-testing base. Sign up today with your active account to receive an email invite to download on the Google Play Console Internal Track or Apple TestFlight when tests launch!
              </p>

              {formSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: 'rgba(74, 222, 128, 0.05)',
                    border: '1px solid rgba(74, 222, 128, 0.3)',
                    borderRadius: 16,
                    padding: '24px 20px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <h4 style={{ fontSize: 16, fontWeight: 900, color: '#4ade80', marginBottom: 4 }}>Tumepokea Ombi Lako kwa Mafanikio!</h4>
                  <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
                    We have successfully registered your interest. Once our initial Closed Testing Track compiles, you will receive an invitation at <strong>{formData.email}</strong>. Ahsante sana!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleTesterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Full Name / Jina Kamili</label>
                      <input
                        type="text"
                        placeholder="e.g. Isaya Masika"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%', background: '#0c0c0e', border: '1px solid #222',
                          borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Email Address / Barua Pepe</label>
                      <input
                        type="email"
                        placeholder="e.g. tester@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%', background: '#0c0c0e', border: '1px solid #222',
                          borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Phone Number (Optional)</label>
                      <input
                        type="tel"
                        placeholder="e.g. +255 712..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%', background: '#0c0c0e', border: '1px solid #222',
                          borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Testing Platform</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        style={{
                          width: '100%', background: '#0c0c0e', border: '1px solid #222',
                          borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Android">🤖 Android (Google Play Track)</option>
                        <option value="iOS">🍎 Apple iOS (TestFlight App)</option>
                        <option value="Both">🔥 Both Platforms</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Mobile Device Model</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro, Samsung A54, Tecno Camon 20"
                      value={formData.device}
                      onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                      style={{
                        width: '100%', background: '#0c0c0e', border: '1px solid #222',
                        borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 6 }}>Short Message (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Eleza kwanini ungependa kuijaribu STEA Mobile mapema..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%', background: '#0c0c0e', border: '1px solid #222',
                        borderRadius: 12, color: '#fff', fontSize: 14, padding: '14px 16px', outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {formError && (
                    <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠️ {formError}</div>
                  )}

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    style={{
                      alignSelf: isMobile ? 'stretch' : 'flex-start',
                      background: '#F5A623',
                      border: 'none',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: 14,
                      padding: '16px 40px',
                      borderRadius: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: formSubmitting ? 0.7 : 1,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {formSubmitting ? (
                      <>Inatuma...</>
                    ) : (
                      <>
                        <Send size={16} /> Submit Beta Application
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </W>

    </div>
  );
}
