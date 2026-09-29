import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BadgeCheck, PlayCircle, Info, Link as LinkIcon, Instagram, Youtube, UserPlus, UserCheck } from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import { G, PushBtn } from '../components/ui/LayoutUtils.jsx';
import SEOHead from '../components/SEOHead.jsx';
import BackButton from '../components/BackButton.jsx';

// Mock Data
const CREATOR = {
  id: 'mtaasisi',
  name: 'Mtaasisi',
  category: 'Technology',
  verified: true,
  avatar: '/stea-icon.jpg',
  banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80',
  bio: 'Tanzanian tech creator sharing knowledge on AI, coding, and digital tools. Join me on my journey to empower Africa with technology.',
  stats: {
    followers: '12.4K',
    videos: 145,
    views: '2.1M',
    likes: '150K'
  },
  links: {
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
    website: 'https://mtaasisi.com'
  },
  videos: [
    { id: 'vid1', title: 'Python Full Course for Beginners', views: '2.4K', date: '2 days ago', thumb: 'https://img.youtube.com/vi/b093aqAZiPU/maxresdefault.jpg' },
    { id: 'vid4', title: 'Top 10 AI Tools 2026', views: '1.2K', date: '1 day ago', thumb: 'https://img.youtube.com/vi/mEsleV16qdo/maxresdefault.jpg' },
    { id: 'vid5', title: 'Build a React App in 10 Minutes', views: '5.4K', date: '1 week ago', thumb: 'https://img.youtube.com/vi/w7ejDZ8SWv8/maxresdefault.jpg' },
  ]
};

export default function CreatorProfilePage() {
  const { username } = useParams();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);

  // In reality, fetch creator by username here.
  const creator = CREATOR;

  return (
    <div style={{ minHeight: "100vh", background: "#07080f", color: "#fff", paddingBottom: 80 }}>
      <SEOHead title={`${creator.name} | STEA Creator`} description={creator.bio} />
      
      {/* BANNER */}
      <div style={{ width: "100%", height: isMobile ? 140 : 240, position: "relative", background: "#111" }}>
        <img src={creator.banner} alt="Banner" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
          <BackButton fallback="/creators" />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #07080f, transparent)" }} />
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px", position: "relative", marginTop: isMobile ? -50 : -80, zIndex: 2 }}>
        {/* PROFILE HEADER */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-end", gap: 20, marginBottom: 24, textAlign: isMobile ? "center" : "left" }}>
          <div style={{ width: isMobile ? 100 : 140, height: isMobile ? 100 : 140, borderRadius: "50%", border: "4px solid #07080f", background: "#222", overflow: "hidden", flexShrink: 0 }}>
            <img src={creator.avatar} alt={creator.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, paddingBottom: isMobile ? 0 : 10 }}>
            <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 6, marginBottom: 4 }}>
              {creator.name} {creator.verified && <BadgeCheck size={20} color="#0084ff" />}
            </h1>
            <div style={{ color: G, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{creator.category}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>@{username}</div>
          </div>
          <div style={{ width: isMobile ? "100%" : "auto", paddingBottom: isMobile ? 0 : 10 }}>
            <button 
              onClick={() => setIsFollowing(!isFollowing)}
              style={{
                width: isMobile ? "100%" : 160,
                padding: "12px 0",
                borderRadius: 14,
                background: isFollowing ? "rgba(255,255,255,0.1)" : G,
                color: isFollowing ? "#fff" : "#000",
                border: isFollowing ? "1px solid rgba(255,255,255,0.2)" : "none",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "0.2s"
              }}
            >
              {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
            </button>
          </div>
        </div>

        {/* BIO & STATS */}
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.6, marginBottom: 24, textAlign: isMobile ? "center" : "left" }}>
          {creator.bio}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: "20px 10px", marginBottom: 32, border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#fff" }}>{creator.stats.followers}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Followers</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#fff" }}>{creator.stats.videos}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Videos</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#fff" }}>{creator.stats.views}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Views</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: "#fff" }}>{creator.stats.likes}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Likes</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 24 }}>
          {['videos', 'about', 'links'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "16px 0",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `3px solid ${G}` : "3px solid transparent",
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                fontWeight: 700,
                fontSize: 14,
                textTransform: "capitalize",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "0.2s"
              }}
            >
              {tab === 'videos' && <PlayCircle size={16} />}
              {tab === 'about' && <Info size={16} />}
              {tab === 'links' && <LinkIcon size={16} />}
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ minHeight: 300 }}>
          {activeTab === 'videos' && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              {creator.videos.map(video => (
                <div key={video.id} onClick={() => navigate(`/watch/${video.id}`)} style={{ cursor: "pointer", background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: "100%", aspectRatio: "16/9", background: "#111", position: "relative" }}>
                    <img src={video.thumb} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>
                      {video.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      <span>{video.views} views</span>
                      <span>•</span>
                      <span>{video.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>About {creator.name}</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontSize: 14 }}>
                {creator.bio}<br/><br/>
                We are passionate about creating educational content for the youth of Tanzania. Stay tuned for weekly tech drops!
              </p>
            </div>
          )}

          {activeTab === 'links' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {creator.links.youtube && (
                <a href={creator.links.youtube} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600 }}>
                  <Youtube color="#ff0000" /> YouTube Channel
                </a>
              )}
              {creator.links.instagram && (
                <a href={creator.links.instagram} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600 }}>
                  <Instagram color="#E1306C" /> Instagram Profile
                </a>
              )}
              {creator.links.website && (
                <a href={creator.links.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600 }}>
                  <LinkIcon color={G} /> Official Website
                </a>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}