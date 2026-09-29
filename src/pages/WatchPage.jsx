import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Youtube, UserPlus, UserCheck, Share2, Eye, Calendar } from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import { G, PushBtn } from '../components/ui/LayoutUtils.jsx';
import SEOHead from '../components/SEOHead.jsx';
import BackButton from '../components/BackButton.jsx';

// Mock Data
const VIDEO = {
  id: 'b093aqAZiPU',
  title: 'Python Full Course for Beginners - Learn Python in 12 Hours',
  description: 'Learn Python programming completely from scratch. This full course covers everything you need to become a Python developer in 2026. Join the movement and build incredible apps.\n\n0:00 Introduction\n1:00 Setup\n5:00 Variables',
  views: '124K',
  date: 'Aug 14, 2025',
  creator: {
    id: 'mtaasisi',
    name: 'Mtaasisi',
    avatar: '/stea-icon.jpg',
    followers: '12.4K',
    verified: true
  }
};

const RELATED = [
  { id: 'mEsleV16qdo', title: 'Top 10 AI Tools 2026', views: '1.2K', date: '1 day ago', thumb: 'https://img.youtube.com/vi/mEsleV16qdo/maxresdefault.jpg', creator: 'Mtaasisi' },
  { id: 'w7ejDZ8SWv8', title: 'Build a React App in 10 Minutes', views: '5.4K', date: '1 week ago', thumb: 'https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg', creator: 'Tech Tanzania' },
];

export default function WatchPage() {
  const { videoId } = useParams();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);

  // In reality, fetch video metadata from Firestore by videoId
  // For now, assume videoId is the youtube ID.
  const ytId = videoId || VIDEO.id;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      <SEOHead title={`${VIDEO.title} | STEA Creators`} description={VIDEO.description} />
      
      {/* HEADER BAR */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "#0a0b10", position: "sticky", top: 0, zIndex: 100 }}>
        <BackButton fallback="/creators" />
        <div style={{ marginLeft: 16, fontSize: 16, fontWeight: 800 }}>STEA Watch</div>
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, maxWidth: 1400, margin: "0 auto", padding: isMobile ? 0 : 24 }}>
        
        {/* MAIN VIDEO AREA */}
        <div style={{ flex: 1 }}>
          {/* YOUTUBE EMBED */}
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", borderBottom: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none", borderRadius: isMobile ? 0 : 16, overflow: "hidden" }}>
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>

          <div style={{ padding: isMobile ? 16 : "24px 0" }}>
            <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, lineHeight: 1.4, marginBottom: 12 }}>
              {VIDEO.title}
            </h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Eye size={16} /> {VIDEO.views} views</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={16} /> {VIDEO.date}</span>
            </div>

            {/* CREATOR BAR */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div 
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => navigate(`/creator/${VIDEO.creator.id}`)}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#222", overflow: "hidden" }}>
                  <img src={VIDEO.creator.avatar} alt={VIDEO.creator.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{VIDEO.creator.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{VIDEO.creator.followers} followers</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  style={{
                    padding: "10px 20px", borderRadius: 999, background: isFollowing ? "rgba(255,255,255,0.1)" : "#fff",
                    color: isFollowing ? "#fff" : "#000", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8
                  }}
                >
                  {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
                </button>
                <button style={{ padding: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer" }}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* ACTION TO YOUTUBE */}
            <div style={{ marginTop: 24, padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <Youtube color="#ff0000" size={32} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Support this creator</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Subscribe and like directly on YouTube to help them grow.</div>
                </div>
              </div>
              <a 
                href={`https://youtube.com/watch?v=${ytId}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: "block", textAlign: "center", background: "#ff0000", color: "#fff", padding: "12px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}
              >
                Watch on YouTube
              </a>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Description</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {VIDEO.description}
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR: RELATED VIDEOS */}
        <div style={{ width: isMobile ? "100%" : 380, padding: isMobile ? "0 16px 40px" : 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Related Videos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {RELATED.map(vid => (
              <div key={vid.id} onClick={() => navigate(`/watch/${vid.id}`)} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
                <div style={{ width: 160, aspectRatio: "16/9", background: "#222", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <img src={vid.thumb} alt={vid.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {vid.title}
                  </h4>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{vid.creator}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{vid.views} views • {vid.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}