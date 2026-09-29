import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, User, Users, Plus, Trash2, Edit2, Link as LinkIcon, BarChart3, ChevronLeft, Search } from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import { G, G2, PushBtn } from '../components/ui/LayoutUtils.jsx';

// Mock Videos
const MOCK_VIDEOS = [
  { id: 'b093aqAZiPU', title: 'Python Full Course for Beginners', views: '2.4K', date: '2 days ago', thumb: 'https://img.youtube.com/vi/b093aqAZiPU/maxresdefault.jpg' },
  { id: 'mEsleV16qdo', title: 'Top 10 AI Tools 2026', views: '1.2K', date: '1 day ago', thumb: 'https://img.youtube.com/vi/mEsleV16qdo/maxresdefault.jpg' }
];

export default function YouTubeCreatorDashboard({ user }) {
  const [section, setSection] = useState("videos");
  const isMobile = useMobile();
  const navigate = useNavigate();
  
  const [videoUrl, setVideoUrl] = useState("");
  const [videos, setVideos] = useState(MOCK_VIDEOS);

  const SECTIONS = [
    { id: "videos", icon: <Video size={18} />, label: "My Videos" },
    { id: "analytics", icon: <BarChart3 size={18} />, label: "Analytics" },
    { id: "profile", icon: <User size={18} />, label: "Profile" },
    { id: "followers", icon: <Users size={18} />, label: "Followers" },
  ];

  const handleAddVideo = () => {
    if (!videoUrl) return;
    // Basic YouTube ID extraction
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = match ? match[1] : null;
    
    if (videoId) {
      setVideos([{
        id: videoId,
        title: 'New Imported Video',
        views: '0',
        date: 'Just now',
        thumb: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }, ...videos]);
      setVideoUrl("");
      alert("Video imported successfully from YouTube!");
    } else {
      alert("Invalid YouTube URL.");
    }
  };

  const renderContent = () => {
    switch (section) {
      case "videos":
        return (
          <div style={{ padding: isMobile ? 20 : 40, maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>My Videos</h2>
            
            {/* ADD VIDEO */}
            <div style={{ display: "flex", gap: 12, marginBottom: 32, background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
              <input 
                type="text" 
                placeholder="Paste YouTube Video URL here..." 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none", fontSize: 14 }}
              />
              <PushBtn onClick={handleAddVideo} style={{ padding: "0 24px", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} /> Add
              </PushBtn>
            </div>

            {/* VIDEO LIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {videos.map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <img src={v.thumb} alt={v.title} style={{ width: 120, height: 68, objectFit: "cover", borderRadius: 8, background: "#111" }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{v.title}</h4>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{v.views} views • {v.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 8 }}><Edit2 size={16} /></button>
                    <button onClick={() => setVideos(videos.filter(vid => vid.id !== v.id))} style={{ background: "transparent", border: "none", color: "#ff4444", cursor: "pointer", padding: 8 }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "analytics":
        return (
          <div style={{ padding: isMobile ? 20 : 40, maxWidth: 900 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Profile Visits</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: G }}>1,245</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Total Video Views</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>14.2K</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>New Followers</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#00c48c" }}>+89</div>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div style={{ padding: isMobile ? 20 : 40, maxWidth: 600 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Profile Settings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Display Name</label>
                <input type="text" defaultValue="Mtaasisi" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Category</label>
                <select style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none", appearance: "none" }}>
                  <option>Technology</option>
                  <option>Education</option>
                  <option>Business</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Bio</label>
                <textarea rows={4} defaultValue="Tanzanian tech creator sharing knowledge." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none", resize: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>YouTube Channel URL</label>
                <input type="text" defaultValue="https://youtube.com/mtaasisi" style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px 16px", borderRadius: 12, outline: "none" }} />
              </div>
              <PushBtn onClick={() => alert("Profile Saved")} style={{ padding: "14px", marginTop: 10 }}>Save Profile</PushBtn>
            </div>
          </div>
        );

      default:
        return <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,.3)" }}>Coming soon...</div>;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0b0f", color: "#fff" }}>
      {/* Sidebar */}
      <div style={{ width: isMobile ? 80 : 260, borderRight: "1px solid rgba(255,255,255,.05)", background: "#0d0f17", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: isMobile ? "20px 0" : "30px 24px", borderBottom: "1px solid rgba(255,255,255,.05)", textAlign: isMobile ? "center" : "left" }}>
          {!isMobile ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <Video size={20} color={G} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>Creator Hub</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>STEA</div>
            </>
          ) : (
            <Video size={24} color={G} style={{ margin: "0 auto" }} />
          )}
        </div>

        <div style={{ padding: isMobile ? "16px 8px" : "20px 12px", flex: 1 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 12, padding: isMobile ? "12px 0" : "12px 16px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 8,
                background: section === s.id ? "rgba(245,166,35,.1)" : "transparent", color: section === s.id ? G : "rgba(255,255,255,.5)", fontWeight: section === s.id ? 700 : 500, transition: "all .2s" }}>
              {s.icon}
              {!isMobile && <span style={{ fontSize: 14 }}>{s.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: isMobile ? "16px 8px" : 20, borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <button onClick={() => navigate("/creators")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 10, padding: isMobile ? "12px 0" : "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <ChevronLeft size={16} /> {!isMobile && "Back to Hub"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {renderContent()}
      </div>
    </div>
  );
}