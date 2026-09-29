import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy,
  Search,
  Zap,
  TrendingUp,
  Activity,
  Globe,
  ArrowRight,
  Clock,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import { useCollection, useCollectionWhere } from '../hooks/useFirestore.js';
import { AnimatedBackground } from '../components/AnimatedBackground.jsx';
import { BlurText } from '../components/BlurText.jsx';

import ComingSoonCard from '../components/ComingSoonCard.jsx';

// --- Components ---
const BridgeCard = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
      className="relative overflow-hidden cursor-pointer"
      onClick={() => navigate('/websites?cat=Live Sports')}
      style={{
        marginTop: 32,
        padding: isMobile ? '20px 24px' : '28px 32px',
        background: 'rgba(14, 16, 26, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: -20, 
          right: -20, 
          width: 140, 
          height: 140, 
          background: 'radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} 
      />

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1 }}>
        <div 
          style={{ 
            width: isMobile ? 50 : 64, 
            height: isMobile ? 50 : 64, 
            borderRadius: 18, 
            background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(245,166,35,0.05))',
            border: '1px solid rgba(245,166,35,0.2)',
            display: 'grid', 
            placeItems: 'center',
            color: '#F5A623',
            flexShrink: 0
          }}
        >
          <Globe size={isMobile ? 24 : 28} />
        </div>

        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Looking for Live Sports Websites?
          </h4>
          <p style={{ margin: 0, fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, maxWidth: 450 }}>
            Open trusted external platforms for match streaming and sports browsing.
          </p>
        </div>
      </div>

      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '10px 20px', 
          borderRadius: 14, 
          background: 'rgba(245,166,35,0.1)', 
          color: '#F5A623', 
          fontSize: 13, 
          fontWeight: 800,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(245,166,35,0.2)',
          transition: 'all 0.2s',
        }}
      >
        Explore Live Sports
        <ArrowRight size={14} />
      </div>
    </motion.div>
  );
};

const SectionLabel = ({ children, color = "#F5A623" }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: `${color}15`, color: color, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
    {children}
  </div>
);

const W = ({ children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)', width: '100%' }}>
    {children}
  </div>
);

// --- Sub-sections ---

function MatchList({ matches = [], loading, emptyMsg }) {
  const [search, setSearch] = useState('');

  const filtered = matches.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.home_team?.toLowerCase().includes(q)) || (m.away_team?.toLowerCase().includes(q)) || (m.league_name?.toLowerCase().includes(q));
  });

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input 
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search teams or leagues..."
          style={{ width: '100%', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '0 16px 0 44px', color: '#fff', fontSize: 14 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.5 }}>Loading matches...</div>
      ) : filtered.length === 0 ? (
        <ComingSoonCard 
          title="Hakuna Mechi Kwa Sasa"
          subtitle={emptyMsg || "Tunaandaa ratiba mpya za mechi za leo na kesho. Kaa tayari!"}
          iconType="clock"
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(m => (
            <motion.div 
              layout
              className="glass-card"
              key={m.id}
              style={{
                borderRadius: 16,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.league_logo && <img src={m.league_logo} style={{ width: 14, height: 14, borderRadius: 2 }} />}
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#F5A623', textTransform: 'uppercase' }}>{m.league_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ fontSize: 15, fontWeight: 700, flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                     {m.home_team}
                     {m.home_logo && <img src={m.home_logo} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                   </div>
                   <div style={{ 
                     display: 'flex', gap: 4, alignItems: 'center', 
                     background: m.status === 'live' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', 
                     padding: '6px 12px', borderRadius: 8, minWidth: 70, justifyContent: 'center'
                    }}>
                     {m.status === 'live' ? (
                       <span style={{ color: '#ef4444', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                        {m.home_score} - {m.away_score}
                       </span>
                     ) : m.status === 'finished' ? (
                       <span style={{ fontWeight: 900, color: 'rgba(255,255,255,0.8)' }}>{m.home_score} - {m.away_score}</span>
                     ) : (
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#F5A623' }}>
                          {m.kickoff_time ? new Date(m.kickoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}
                        </span>
                     )}
                   </div>
                   <div style={{ fontSize: 15, fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                     {m.away_logo && <img src={m.away_logo} style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                     {m.away_team}
                   </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 60 }}>
                 {m.status === 'live' && m.minute && <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 800 }}>{m.minute}&apos;</span>}
                 {m.status === 'finished' && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>Full Time</span>}
                 <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>{m.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchInsights({ predictions = [], loading }) {
  const topPicks = predictions.filter(p => p.isTopPick);
  const others = predictions.filter(p => !p.isTopPick);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Analyzing matches with STEA AI...</div>;

  return (
    <div>
      {topPicks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <SectionLabel color="#4ade80"><Zap size={14} /> Top Pick Insights</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {topPicks.map(p => <PredictionCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <SectionLabel color="#60a5fa"><TrendingUp size={14} /> Weekly Predictions</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {others.map(p => <PredictionCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {predictions.length === 0 && (
        <ComingSoonCard 
          title="AI Insights Zinakuja"
          subtitle="STEA AI Hub inafanya uchambuzi wa mechi zijazo za wiki hii. Usiondoke!"
          iconType="spark"
        />
      )}
    </div>
  );
}

function PredictionCard({ p }) {
  const getConfCol = (c) => {
    switch (c) {
      case 'Lock': return '#4ade80';
      case 'High': return '#60a5fa';
      case 'Medium': return '#F5A623';
      default: return 'rgba(255,255,255,0.4)';
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card"
      style={{ borderRadius: 20, padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
         <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{p.league}</span>
         <span style={{ 
           fontSize: 10, fontWeight: 900, background: `${getConfCol(p.confidence_level)}15`, 
           color: getConfCol(p.confidence_level), padding: '2px 8px', borderRadius: 6,
           border: `1px solid ${getConfCol(p.confidence_level)}25`, letterSpacing: '0.05em'
         }}>
           {p.confidence_level || 'Medium'}
         </span>
      </div>
      <h4 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>{p.matchTitle}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 }}>
           <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 700 }}>WIN PROBABILITY</div>
           <div style={{ display: 'flex', gap: 2, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ width: `${p.home_win_probability}%`, background: '#F5A623' }} />
              <div style={{ width: `${p.draw_probability}%`, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ width: `${p.away_win_probability}%`, background: '#60a5fa' }} />
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800 }}>
             <span>{p.home_win_probability}%</span>
             <span>{p.draw_probability}%</span>
             <span>{p.away_win_probability}%</span>
           </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 }}>
           <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 700 }}>GOALS & BTTS</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Over 2.5:</span>
                <span style={{ color: '#4ade80' }}>{p.over25_probability}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>BTTS:</span>
                <span style={{ color: '#4ade80' }}>{p.btts_probability}%</span>
              </div>
           </div>
        </div>
      </div>
      <div style={{ padding: '12px 14px', background: 'linear-gradient(90deg, rgba(245,166,35,0.1), transparent)', borderLeft: '3px solid #F5A623', borderRadius: '0 8px 8px 0', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#F5A623', marginBottom: 4 }}>STEA RECOMMENDED PICK</div>
        <div style={{ fontSize: 14, fontWeight: 900 }}>{p.stea_pick}</div>
      </div>
      {p.reasoning && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          &quot;{p.reasoning}&quot;
        </p>
      )}
    </motion.div>
  );
}

export const SPORTS_MODE = "coming_soon";

export default function SportsPage() {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('live'); // live, upcoming, finished, insights
  
  // Conditionally fetch data only if live
  const shouldFetch = SPORTS_MODE === "live";
  const { docs: liveDocs, loading: liveLoading } = useCollectionWhere('sports_matches', 'status', '==', 'live', "updatedAt", shouldFetch ? 50 : 0);
  const { docs: upcomingDocs, loading: upcomingLoading } = useCollectionWhere('sports_matches', 'status', '==', 'upcoming', "updatedAt", shouldFetch ? 50 : 0);
  const { docs: finishedDocs, loading: finishedLoading } = useCollectionWhere('sports_matches', 'status', '==', 'finished', "updatedAt", shouldFetch ? 50 : 0);
  const { docs: predictions, loading: predictionsLoading } = useCollection('sports_predictions', "createdAt", shouldFetch ? 20 : 0);

  const tabs = [
    { id: 'live', label: 'Live Matches', icon: <Activity size={18} /> },
    { id: 'upcoming', label: 'Upcoming', icon: <Clock size={18} /> },
    { id: 'finished', label: 'Finished', icon: <CheckCircle size={18} /> },
    { id: 'insights', label: 'Match Insights', icon: <Trophy size={18} /> },
    { id: 'betting', label: 'Betting Hub', icon: <TrendingUp size={18} /> },
    { id: 'guides', label: 'Guides', icon: <BookOpen size={18} /> },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#05060a', color: '#fff', padding: 'clamp(80px, 12vw, 100px) 0 100px', overflow: 'hidden' }}>
      <AnimatedBackground />
      <W>
        <header style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
          <SectionLabel color="#F5A623"><Trophy size={14} /> Sports Hub</SectionLabel>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
            <BlurText text="Football Data" /> <span className="gold-glow" style={{ color: '#F5A623' }}>Insights</span>
          </div>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 600 }}>
            Live scores, upcoming fixtures, and AI-powered match analysis for the elite betting community.
          </p>
        </header>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: isMobile ? 8 : 12, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 32, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                background: activeTab === t.id ? 'rgba(245,166,35,0.1)' : 'transparent',
                color: activeTab === t.id ? '#F5A623' : 'rgba(255,255,255,0.4)',
                border: '1px solid', borderColor: activeTab === t.id ? 'rgba(245,166,35,0.3)' : 'transparent',
                cursor: 'pointer', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <section style={{ position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {SPORTS_MODE === "coming_soon" ? (
                <ComingSoonCard 
                  title={`${tabs.find(t => t.id === activeTab)?.label} Coming Soon`}
                  subtitle="We're preparing premium live sports data, match insights, and betting tools. Stay tuned!"
                  iconType={activeTab === 'live' ? 'spark' : activeTab === 'insights' ? 'rocket' : 'construction'}
                />
              ) : (
                <>
                  {activeTab === 'live' && <MatchList matches={liveDocs} loading={liveLoading} emptyMsg="No live matches currently." />}
                  {activeTab === 'upcoming' && <MatchList matches={upcomingDocs} loading={upcomingLoading} />}
                  {activeTab === 'finished' && <MatchList matches={finishedDocs} loading={finishedLoading} />}
                  {activeTab === 'insights' && <MatchInsights predictions={predictions} loading={predictionsLoading} />}
                  {activeTab === 'betting' && (
                    <ComingSoonCard 
                      title="Betting Hub"
                      subtitle="STEA Betting Hub itakuwa kituo chako kikuu cha strategy na odds bora zaidi."
                      iconType="rocket"
                    />
                  )}
                  {activeTab === 'guides' && (
                    <ComingSoonCard 
                      title="Sports Guides"
                      subtitle="Mwongozo kamili wa uchambuzi na ushindi wa mechi za michezo mbalimbali."
                      iconType="construction"
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
          
          {(SPORTS_MODE === "live" && activeTab === 'live') && <BridgeCard />}
          {SPORTS_MODE === "coming_soon" && <BridgeCard />}
        </section>
      </W>
    </div>
  );
}

export { PredictionCard };

