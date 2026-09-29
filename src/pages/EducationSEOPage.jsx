import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirebaseDb } from '../firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, FileText, Download, Star, Award, Calendar, BookOpen, 
  MapPin, CheckCircle, GraduationCap, ChevronRight, HelpCircle, Loader2 
} from 'lucide-react';
import { ResourceCard } from './ExamsHubPage.jsx';
import SEOHead from '../components/SEOHead.jsx';

const G = '#F5A623';
const G2 = '#FFD17C';
const B = '#050508';

export default function EducationSEOPage({ type }) {
  const params = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirebaseDb();

  // Parse route values with elegant fallback
  const subjectName = params.subjectName || params.subject || '';
  const level = params.level || '';
  const year = params.year || '';
  const topic = params.topic || '';
  const entityId = params.id || '';

  // Humanize inputs for SEO headers and UI display
  const humanSubject = subjectName ? subjectName.charAt(0).toUpperCase() + subjectName.slice(1) : '';
  const humanLevel = level ? (level === 'form-four' ? 'Form 4' : level === 'form-six' ? 'Form 6' : level) : '';
  
  useEffect(() => {
    const fetchResources = async () => {
      if (!db) return;
      setLoading(true);
      try {
        let qRef;
        if (type === 'past-paper') {
          // Normalize level name for study_resources query
          // study_resources level strings: 'Primary', 'O-Level (Form 1-4)', 'A-Level (Form 5-6)', 'University', 'General'
          let internalLevel = 'O-Level (Form 1-4)';
          if (level.includes('six') || level.includes('five') || level.includes('6') || level.includes('a-level')) {
            internalLevel = 'A-Level (Form 5-6)';
          } else if (level.includes('primary') || level.includes('std')) {
            internalLevel = 'Primary';
          } else if (level.includes('university') || level.includes('chuo')) {
            internalLevel = 'University';
          }

          qRef = query(
            collection(db, 'study_resources'), 
            where('type', '==', 'past_paper'),
            where('subject', '==', humanSubject || 'Physics')
          );
        } else if (type === 'note') {
          let internalLevel = 'O-Level (Form 1-4)';
          if (level.includes('six') || level.includes('five') || level.includes('6') || level.includes('a-level')) {
            internalLevel = 'A-Level (Form 5-6)';
          }
          qRef = query(
            collection(db, 'study_resources'), 
            where('type', '==', 'note'),
            where('subject', '==', humanSubject || 'Physics')
          );
        } else {
          setLoading(false);
          return;
        }

        const snap = await getDocs(qRef);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Client filter for exact status (exclude pending/rejected) and extra parameter refinements
        list = list.filter(item => {
          if (item.status && item.status !== 'published' && item.status !== 'active') return false;
          if (year && item.year !== year) return false;
          return true;
        });

        setItems(list);
      } catch (e) {
        console.error("SEO Resource Fetch Failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [db, type, level, subjectName, year]);

  // Dynamic Metadata and SEO descriptions
  let metaTitle = "STEA Education - Tanzania Dynamic Search Hub";
  let metaDesc = "Pakua notes bure na necta exam past papers ukitumia STEA Portal.";
  let heading = "STEA Education Portal";
  let subHeading = "Elas na vitabu kulingana na muundo mpya wa TET Tanzania.";

  if (type === 'past-paper') {
    heading = `NECTA ${humanSubject} Past Paper za ${humanLevel} ${year ? `Mwaka ${year}` : ''}`;
    subHeading = `Pata mitihani ya kitaifa ya ${humanSubject} ${humanLevel} ya miaka yote na majibu yake (Marking schemes). Pakua bure kama PDF.`;
    metaTitle = `${humanSubject} ${humanLevel} Past Papers ${year ? `(${year})` : ''} - STEA Education`;
    metaDesc = `Pakua NECTA Past Papers za ${humanSubject} ${humanLevel} ${year ? `za mwaka ${year}` : ''} bure. Mitihani yenye majibu kukuandaa vizuri na ufauru wa daraja la kwanza (Division 1).`;
  } else if (type === 'note') {
    heading = `Notes za ${humanSubject} ${humanLevel} ${topic ? `Topic: ${topic}` : ''}`;
    subHeading = `Soma na upakue muhtasari (notes) wa somo la ${humanSubject} ngazi ya ${humanLevel} kwa muundo mzuri unaoendana na muhtasari mpya wa Wizara.`;
    metaTitle = `Notes za ${humanSubject} ${humanLevel} ${topic ? `- Topic ya ${topic}` : ''} - STEA Education`;
    metaDesc = `Pata notes za kusomea za ${humanSubject} ${humanLevel} kwa kila topic. Notes zimeandaliwa na walimu mashuhuri Tanzania kurahisisha uelewa.`;
  } else if (type === 'subject') {
    heading = `Somo la ${humanSubject} - Kidato cha 1 Hadi 6`;
    subHeading = `Mwongozo wa mada, notes, quizes za kujipima na mbinu za kufauru mitihani ya NECTA kwa somo la ${humanSubject}.`;
    metaTitle = `Mwongozo na Notes za ${humanSubject} Tanzania - STEA Education`;
    metaDesc = `STEA Education inakuletea mwongozo wa muundo kamili wa somo la ${humanSubject} sekondari. Pata exams, notes, na practical guides bure kabisa.`;
  } else if (type === 'scholarship') {
    heading = `Ufadhili wa Masomo: ${entityId.toUpperCase()}`;
    subHeading = `Taarifa, taratibu za kuomba, viwango vya mkopo na scholarship alerts za ${entityId.toUpperCase()} Tanzania.`;
    metaTitle = `Mwongozo wa Scholarship ya ${entityId.toUpperCase()} ${new Date().getFullYear()} - STEA`;
    metaDesc = `Jinsi ya kuomba mkopo na scholarship ya ${entityId.toUpperCase()} kwa urahisi zaidi. Vigezo vya sasa, deadline na hati za maombi unazotakiwa kuandaa.`;
  } else if (type === 'university') {
    heading = `Chuo Kikuu: ${entityId.toUpperCase()}`;
    subHeading = `Kozi zinazotolewa, sifa za kujiunga (TCU thresholds), ada, na mwongozo wa kujiunga na chuo cha ${entityId.toUpperCase()}.`;
    metaTitle = `Sifa za Kujiunga na Vyuo: ${entityId.toUpperCase()} Guide - STEA`;
    metaDesc = `Chunguza kozi zote, pointi za kuingilia na fursa za scholarship katika chuo cha ${entityId.toUpperCase()} Tanzania. Jiandae kwa TCU Application vizuri na STEA.`;
  }

  return (
    <div style={{ minHeight: '100vh', background: B, color: '#fff', padding: 'clamp(80px,12vw,120px) 20px 80px', fontFamily: "'Inter', sans-serif" }}>
      <SEOHead title={metaTitle} description={metaDesc} />
      
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link to="/education" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          color: 'rgba(255,255,255,0.5)', 
          textDecoration: 'none', 
          marginBottom: 32, 
          fontWeight: 700, 
          fontSize: 14,
          transition: 'color 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          <ArrowLeft size={16} /> Rudi Nyuma kwenye Exams Hub
        </Link>

        {/* Dynamic Hero Area */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.05), rgba(0, 0, 0, 0.8))',
          border: '1px solid rgba(245, 166, 35, 0.1)',
          borderRadius: 24,
          padding: 'clamp(24px, 5vw, 48px)',
          marginBottom: 40,
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: G,
            filter: 'blur(100px)',
            opacity: 0.1,
            pointerEvents: 'none'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              background: 'rgba(245, 166, 35, 0.15)',
              color: G,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.1em',
              padding: '4px 10px',
              borderRadius: 8,
              textTransform: 'uppercase'
            }}>
              ✨ SEO ELIMU PORTAL
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>• Verified Curriculum</span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(24px, 4vw, 38px)', 
            fontWeight: 900, 
            margin: '0 0 16px', 
            lineHeight: 1.2,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            background: `linear-gradient(135deg, #fff, ${G2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {heading}
          </h1>

          <p style={{ 
            fontSize: 'clamp(14px, 1.8vw, 16px)', 
            color: 'rgba(255,255,255,0.65)', 
            maxWidth: 780, 
            lineHeight: 1.6, 
            margin: 0 
          }}>
            {subHeading}
          </p>
        </div>

        {/* Dynamic Contents based on SEO category */}
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: '60px 0' }}>
            <Loader2 className="spin" size={32} color={G} />
            <span style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 }}>Inatafuta nyaraka kwenye mfumo...</span>
          </div>
        ) : (type === 'past-paper' || type === 'note') ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Nyaraka Zilizopatikana ({items.length})</h3>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Free & Premium PDF Documents</span>
            </div>

            {items.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <FileText size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>Nyaraka bado haijaongezwa sekta hii</h4>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Kuwa wa kwanza kusaidia wanafunzi wengine! Kama una notes au mitihani ya {humanSubject} ya {humanLevel}, unaweza kuipakia hapa.
                </p>
                <button
                  onClick={() => navigate('/education')}
                  style={{
                    background: `linear-gradient(135deg, ${G}, ${G2})`,
                    color: '#000',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Pakia Notes / Swali sasa
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 24
              }}>
                {items.map(item => <ResourceCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        ) : type === 'subject' ? (
          /* Somo / Subject Guide */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr md:1fr', gap: 32 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: G, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>📚 Kidato cha 1 - 4 (O-Level)</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, margin: 0, listStyle: 'none' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>Notes kamili kidato cha kwanza hadi nne</span>
                  <Link to={`/education/notes/o-level/${subjectName.toLowerCase()}`} style={{ color: G2, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Soma Notes</Link>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>Mitihani ya taifa (CSEE) ya {humanSubject}</span>
                  <Link to={`/education/past-papers/form-four/${subjectName.toLowerCase()}/2023`} style={{ color: G2, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Angalia PastPapers</Link>
                </li>
              </ul>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>🎓 Kidato cha 5 - 6 (A-Level)</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, margin: 0, listStyle: 'none' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontSize: 14 }}>Syllabus ya Advanced {humanSubject} (PCB, PCM, CBG, etc.)</span>
                  <Link to={`/education/notes/a-level/${subjectName.toLowerCase()}`} style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Soma Notes</Link>
                </li>
              </ul>
            </div>
          </div>
        ) : type === 'scholarship' ? (
          /* Guide to Scholarship systems */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>Vigezo Kuu vya Kupata Scholarship ya {entityId.toUpperCase()}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ borderLeft: `3px solid ${G}`, paddingLeft: 12 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>1. GPA/Ufaulu Kiakademia</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Kwa TCU hasa Division 1 au Vyeti vilivyothibitishwa.</p>
                </div>
                <div style={{ borderLeft: `3px solid ${G}`, paddingLeft: 12 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>2. Mdhamini/Sponsors Portal</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Kujaza fomu ya maombi mtandaoni mapema.</p>
                </div>
                <div style={{ borderLeft: `3px solid ${G}`, paddingLeft: 12 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>3. Barua ya Maombi</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Recommendation letters kutoka shule au chuo cha awali.</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(245, 166, 35, 0.03)', border: '1px solid rgba(245, 166, 35, 0.1)', borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Mwongozo wa HESLB / TCU Portal Ukurasa Rasmi</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 640, margin: '0 auto 16px' }}>
                Kujiandikisha na kufuatilia nafasi, deadlines, na updates zote tembelea tovuti rasmi ya bodi.
              </p>
              <button
                onClick={() => window.open('https://olas.heslb.go.tz', '_blank')}
                style={{
                  background: `linear-gradient(135deg, ${G}, ${G2})`,
                  color: '#000',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Fungua OLAMS Portal  🎓
              </button>
            </div>
          </div>
        ) : (
          /* Chuo / University Profile Guide */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: G, marginBottom: 12 }}>🔬 Kozi Maarufu</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Medicine, Electrical Engineering, Computer Science, Economics, na Education ndizo kozi zinazohitajika sana na kuwa na ushindani mkubwa chuoni hapa.
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', marginBottom: 12 }}>🏛️ Sifa na Pointi za TCU</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Threshold Pointi za usahili huanzia pointi 5 (kwa kozi za sanaa) hadi pointi 8-12 (kwa kozi za uhandisi na udaktari). Hakikisha unazingatia combination subjects.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginBottom: 12 }}>💰 HESLB / Mikopo Fursa</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Kozi za kipaumbele (STEM) hapa hupata ufadhili wa mkopo kutoka bodi ya mikopo (HESLB) kwa kiwango cha 70% hadi 100% kutegemeana na vigezo vya mwanafunzi.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
