import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { usePWA } from '../contexts/PWAContext.jsx';
import SEOHead from '../components/SEOHead.jsx';
import STEAHeader from "../components/shared/STEAHeader.jsx";

const CORE_LEARNING = [
  { icon: '📚', title: 'Notes', description: 'Study materials for your subjects.', link: '/education/notes', accent: '#2563EB' },
  { icon: '📄', title: 'Past Papers', description: 'Practice with previous exams.', link: '/education/past-papers', accent: '#D4AF37' },
  { icon: '📊', title: 'NECTA Results', description: 'Check national exam results.', link: '/education/results', accent: '#2563EB' },
  { icon: '🏫', title: 'Classroom', description: 'Join classes, attendance and assignments.', link: 'https://classroom.stea.africa', accent: '#D4AF37' },
];

const OPPORTUNITIES = [
  { icon: '🎓', title: 'Scholarships', description: 'Find study opportunities.', link: '/scholarships', accent: '#2563EB' },
  { icon: '📖', title: 'Resources', description: 'Guides, tips and academic tools.', link: '/resources', accent: '#D4AF37' },
];

export default function EducationHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { installApp } = usePWA();
  const handleLink = (link) => {
    if (link.startsWith('http')) {
      window.location.href = link;
    } else {
      navigate(link);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#111827', fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <SEOHead title="STEA Education" description="Notes, past papers, results, scholarships, and student tools in one place." />
      
      <STEAHeader title="Education" user={user} />

      <main className="education-main" style={{ width: 'min(1120px, 100%)', margin: '0 auto', padding: '40px 16px 56px' }}>
        <section className="education-hero education-hero--premium">
          <div className="education-hero__badge">📚 STEA Education</div>
          <div className="education-hero__content">
            <h1>Everything for your learning journey.</h1>
            <p>Notes, Past Papers, Classroom, Results, Scholarships and learning resources in one place.</p>
          </div>
          <div className="education-hero__actions">
            <button type="button" onClick={() => window.location.href = 'https://classroom.stea.africa'} className="education-hero__action education-hero__action--primary">Open Classroom</button>
            <button type="button" onClick={() => navigate('/education/notes')} className="education-hero__action education-hero__action--secondary">Browse Notes</button>
          </div>
          <div className="education-hero__stats">
            <div className="education-hero__stat"><strong>120+</strong><span>Notes Available</span></div>
            <div className="education-hero__stat"><strong>300+</strong><span>Past Papers</span></div>
            <div className="education-hero__stat"><strong>18K+</strong><span>Active Students</span></div>
            <div className="education-hero__stat"><strong>500+</strong><span>Resources</span></div>
          </div>
        </section>

        {/* ── CORE LEARNING SECTION ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.02em' }}>Core Learning</h2>
          <div className="education-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {CORE_LEARNING.map((tool) => (
              <article className="education-card" key={tool.title} onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-2px)'; event.currentTarget.style.boxShadow = '0 12px 28px rgba(17,24,39,.08)'; event.currentTarget.style.borderColor = '#D4AF37'; }} onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)'; event.currentTarget.style.boxShadow = '0 4px 12px rgba(17,24,39,.03)'; event.currentTarget.style.borderColor = '#E5E7EB'; }} style={{ minHeight: 200, padding: 20, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid #E5E7EB', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(17,24,39,.03)', transition: 'all .2s ease' }}>
                <div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 14, background: `${tool.accent}14`, fontSize: 23, marginBottom: 16 }}>{tool.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{tool.title}</h3>
                <p style={{ flex: 1, margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.55 }}>{tool.description}</p>
                <button type="button" onClick={() => handleLink(tool.link)} style={{ alignSelf: 'flex-start', marginTop: 18, padding: '9px 16px', border: 0, borderRadius: 10, background: '#111827', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open</button>
              </article>
            ))}
          </div>
        </section>

        {/* ── OPPORTUNITIES SECTION ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.02em' }}>Opportunities</h2>
          <div className="education-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {OPPORTUNITIES.map((tool) => (
              <article className="education-card" key={tool.title} onMouseEnter={(event) => { event.currentTarget.style.transform = 'translateY(-2px)'; event.currentTarget.style.boxShadow = '0 12px 28px rgba(17,24,39,.08)'; event.currentTarget.style.borderColor = '#D4AF37'; }} onMouseLeave={(event) => { event.currentTarget.style.transform = 'translateY(0)'; event.currentTarget.style.boxShadow = '0 4px 12px rgba(17,24,39,.03)'; event.currentTarget.style.borderColor = '#E5E7EB'; }} style={{ minHeight: 200, padding: 20, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid #E5E7EB', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(17,24,39,.03)', transition: 'all .2s ease' }}>
                <div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 14, background: `${tool.accent}14`, fontSize: 23, marginBottom: 16 }}>{tool.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{tool.title}</h3>
                <p style={{ flex: 1, margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.55 }}>{tool.description}</p>
                <button type="button" onClick={() => handleLink(tool.link)} style={{ alignSelf: 'flex-start', marginTop: 18, padding: '9px 16px', border: 0, borderRadius: 10, background: '#111827', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open</button>
              </article>
            ))}
          </div>
        </section>

        {/* ── APP INSTALL PROMPT ── */}
        <section style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', border: '1px solid rgba(212,175,55,.25)', borderRadius: 18, background: '#FFFDF6' }}>
          <div><strong style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>Install STEA Education App</strong><span style={{ color: '#6B7280', fontSize: 12 }}>Keep your study tools close for faster access.</span></div>
          <button type="button" onClick={() => installApp?.()} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #D4AF37', background: '#FFFFFF', color: '#8F6D00', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Install app</button>
        </section>
      </main>
      <style>{`@media(max-width:640px){.education-main{padding:18px 12px 38px!important}.education-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.education-card{min-height:0!important;padding:12px!important;border-radius:15px!important}.education-card>div{width:34px!important;height:34px!important;border-radius:10px!important;font-size:18px!important;margin-bottom:9px!important}.education-card h3{font-size:14px!important;margin-bottom:5px!important}.education-card p{font-size:11px!important;line-height:1.4!important}.education-card button{align-self:stretch!important;width:100%;margin-top:11px!important;padding:8px!important;font-size:11px!important}.education-card-grid+*{margin-top:0}}@media(max-width:360px){.education-card{padding:10px!important}.education-card h3{font-size:13px!important}.education-card p{font-size:10px!important}.education-card button{padding:7px!important}}`}</style>
    </div>
  );
}
