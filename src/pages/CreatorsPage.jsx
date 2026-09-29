import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Star, PlayCircle, BadgeCheck, Grid } from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import SEOHead from '../components/SEOHead.jsx';
import BackButton from '../components/BackButton.jsx';
import { AnimatedBackground } from '../components/AnimatedBackground.jsx';
import SteaHero from '../components/ui/SteaHero.jsx';

const G = '#F5A623';

const CATEGORIES = ["All", "Education", "Technology", "Business", "Entertainment", "Lifestyle"];

const FEATURED_CREATORS = [
  { id: 'mtaasisi', name: 'Mtaasisi', category: 'Technology', followers: '12.4K', verified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mtaasisi&backgroundColor=ffdfbf' },
  { id: 'stea_africa', name: 'STEA Africa', category: 'Education', followers: '50K', verified: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stea&backgroundColor=b6e3f4' },
  { id: 'tech_tanzania', name: 'Tech Tanzania', category: 'Technology', followers: '8.2K', verified: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech&backgroundColor=c0aede' }
];

const ALL_VIDEOS = [
  // Trending Videos (isTrending: true) - Using hqdefault.jpg to guarantee loading
  { id: 'vid1', title: 'Python Full Course for Beginners', creator: 'Mtaasisi', views: '2.4K', date: '2 days ago', thumb: 'https://img.youtube.com/vi/b093aqAZiPU/hqdefault.jpg', category: 'Technology', isTrending: true },
  { id: 'vid2', title: 'How to make money online in Tanzania', creator: 'Business TZ', views: '15K', date: '1 week ago', thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', category: 'Business', isTrending: true },
  { id: 'vid3', title: 'Learn React Native Fast', creator: 'Tech Tanzania', views: '800', date: '5 hours ago', thumb: 'https://img.youtube.com/vi/0-S5a0eXPoc/hqdefault.jpg', category: 'Technology', isTrending: true },
  
  // Standard Uploads (isTrending: false) - Using hqdefault.jpg
  { id: 'vid4', title: 'Top 10 AI Tools 2026', creator: 'Mtaasisi', views: '1.2K', date: '1 day ago', thumb: 'https://img.youtube.com/vi/mEsleV16qdo/hqdefault.jpg', category: 'Technology', isTrending: false },
  { id: 'vid5', title: 'Start a side hustle in college', creator: 'Business TZ', views: '3.1K', date: '3 days ago', thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', category: 'Business', isTrending: false },
  { id: 'vid6', title: 'UX Design best practices', creator: 'Tech Tanzania', views: '950', date: '4 days ago', thumb: 'https://img.youtube.com/vi/0-S5a0eXPoc/hqdefault.jpg', category: 'Technology', isTrending: false },
  { id: 'vid7', title: 'STEA Classroom Tutorial', creator: 'STEA Africa', views: '5.2K', date: '5 days ago', thumb: 'https://img.youtube.com/vi/b093aqAZiPU/hqdefault.jpg', category: 'Education', isTrending: false }
];

export default function CreatorsPage() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [comingSoon, setComingSoon] = useState(false);
  const [activeCat, setActiveCat] = useState('All');

  // Disjoint sets: Trending vs All Other Videos
  const trendingVideos = ALL_VIDEOS.filter(v => v.isTrending);
  
  const displayVideos = ALL_VIDEOS.filter(v => {
    if (v.isTrending) return false;
    if (activeCat !== 'All' && v.category !== activeCat) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80, position: "relative", background: '#050505' }}>
      <SEOHead title="STEA Creators | Tanzania Creator Network" description="Discover amazing Tanzanian creators and grow your YouTube channel." />
      <AnimatedBackground />

      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "16px" : "32px" }}>
        
        {/* HEADER SECTION */}
        <header style={{ marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <BackButton fallback="/" />
          </div>
          <SteaHero 
            badge="Creator Network"
            titleLine1="STEA"
            titleLine2="Creators"
            subtitle="Discover Tanzanian YouTube creators & videos."
          />
          <button 
            onClick={() => navigate('/creators/apply')}
            style={{ background: `linear-gradient(135deg, ${G}, #FFD17C)`, border: 'none', color: '#111', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,166,35,.2)' }}
          >
            Become Creator
          </button>
        </header>

        {/* INLINE COMING SOON CARD */}
        {comingSoon && (
          <div style={{ 
            background: "rgba(255,255,255,0.02)", 
            border: "1px solid rgba(245,166,35,0.2)", 
            borderRadius: 16, 
            padding: 16, 
            marginBottom: 24, 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🚧</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 6 }}>Inatengenezwa</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, margin: '0 0 14px' }}>
              Kipengele hiki bado kinaendelea kuboreshwa. Tutarudi nacho hivi karibuni.
            </p>
            <button 
              onClick={() => setComingSoon(false)} 
              style={{ background: G, border: 'none', color: '#111', padding: '8px 24px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Sawa
            </button>
          </div>
        )}

        {/* 1. FEATURED CREATORS ROW (CAROUSEL) */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Star size={16} color={G} /> Featured Creators
          </h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 6 }}>
            {FEATURED_CREATORS.map(creator => (
              <div 
                key={creator.id} 
                style={{ minWidth: 165, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, textAlign: "center" }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#222", margin: "0 auto 10px", overflow: "hidden" }}>
                  <img src={creator.avatar} alt={creator.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, margin: '0 0 2px' }}>
                  {creator.name} {creator.verified && <BadgeCheck size={12} color="#0084ff" />}
                </h3>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{creator.category}</div>
                <div style={{ fontSize: 11, color: G, fontWeight: 700, margin: "6px 0 12px" }}>{creator.followers} followers</div>
                <button 
                  onClick={() => setComingSoon(true)} 
                  style={{ width: "100%", padding: "6px 0", background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 2. TRENDING VIDEOS ROW (CAROUSEL) */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <PlayCircle size={16} color={G} /> Trending Videos
          </h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 6 }}>
            {trendingVideos.map(video => (
              <div 
                key={video.id} 
                onClick={() => setComingSoon(true)} 
                style={{ cursor: "pointer", minWidth: 200, width: 200 }}
              >
                <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: 10, overflow: "hidden" }}>
                  <img src={video.thumb} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ marginTop: 6 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                    {video.title}
                  </h3>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    {video.creator} • {video.views} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. CATEGORIES ROW */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: activeCat === cat ? `1px solid ${G}` : "1px solid rgba(255,255,255,0.08)",
                  background: activeCat === cat ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeCat === cat ? G : "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "0.2s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 4. VIEW ALL VIDEOS GRID (EXCLUDES TRENDING) */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Grid size={16} color={G} /> View All Videos
          </h2>
          {displayVideos.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {displayVideos.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => setComingSoon(true)} 
                  style={{ cursor: "pointer", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 8 }}
                >
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: 8, overflow: "hidden" }}>
                    <img src={video.thumb} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#fff", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
                      {video.title}
                    </h3>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {video.creator} • {video.views} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Hakuna video kwenye kategoria hii kwa sasa.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
