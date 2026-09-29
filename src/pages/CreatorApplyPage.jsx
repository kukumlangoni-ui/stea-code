import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, Video, Star, Sparkles, Network, Youtube, Instagram, AlignLeft, Eye } from 'lucide-react';

import { useMobile } from '../hooks/useMobile.js';
import SEOHead from '../components/SEOHead.jsx';
import { AnimatedBackground } from '../components/AnimatedBackground.jsx';

const G = '#F5A623';
const CATEGORIES = ["Education", "Technology", "Business", "Entertainment", "Lifestyle"];

export default function CreatorApplyPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    youtubeUrl: '',
    category: 'Education',
    bio: '',
    instagramUrl: '',
    tiktokUrl: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 16
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80, position: "relative", background: '#050505' }}>
      <SEOHead title="Become a STEA Creator | Apply Now" description="Apply to become a creator on the STEA network." />
      <AnimatedBackground />
      
      <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "16px" : "32px 16px", maxWidth: 480, margin: "0 auto" }}>
        {/* Compact Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 20, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>

          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
          <span>&gt;</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/creators')}>Creators</span>
          <span>&gt;</span>
          <span style={{ color: G }}>Apply</span>
        </div>

        {/* 1. HERO SECTION */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>

          <div style={{ display: 'inline-flex', padding: 8, borderRadius: 12, background: 'rgba(245,166,35,0.08)', color: G, marginBottom: 12 }}>
            <Sparkles size={20} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: '0 0 8px' }}>
            Become a STEA Creator
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.4, margin: 0 }}>
            Join the network of Tanzanian YouTube creators growing their reach.
          </p>
        </div>

        {/* 2. BENEFITS CARDS */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 16, marginBottom: 8 }}>
          <div style={{ flexShrink: 0, width: 140, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
            <Eye size={16} color={G} style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 11, color: '#fff' }}>Get Discovered</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Featured views on STEA Feed.</div>
          </div>
          <div style={{ flexShrink: 0, width: 140, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
            <Star size={16} color={G} style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 11, color: '#fff' }}>Grow Your Brand</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Drive real YouTube subscribers.</div>
          </div>
          <div style={{ flexShrink: 0, width: 140, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
            <Network size={16} color={G} style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 11, color: '#fff' }}>Join STEA Network</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Partner with educational projects.</div>
          </div>
        </div>

        {submitted ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: '32px 20px', border: '1px solid rgba(245,166,35,0.2)' }}>
            <CheckCircle size={40} color={G} style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: '0 0 8px' }}>Application Received</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              STEA team will review your creator profile and notify you within 48 hours.
            </p>
            <button 
              onClick={() => navigate('/creators')}
              style={{ width: "100%", padding: "10px 0", border: 'none', borderRadius: 10, background: G, color: '#111', fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            >
              Return to Creators
            </button>
          </div>

        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* 3. CREATOR INFORMATION */}
            <div style={cardStyle}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Creator Name / Brand</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mtaasisi"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>YouTube Channel URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="youtube.com/@username"
                  value={formData.youtubeUrl}
                  onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 4. CATEGORY SELECTOR */}
            <div style={cardStyle}>
              <label style={labelStyle}>Select Primary Niche</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {CATEGORIES.map(cat => {
                  const isActive = formData.category === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormData({...formData, category: cat})}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: isActive ? `1px solid ${G}` : '1px solid rgba(255,255,255,0.08)',
                        background: isActive ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? G : 'rgba(255,255,255,0.6)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. CHANNEL BIO */}
            <div style={cardStyle}>
              <label style={labelStyle}>Channel Bio</label>
              <textarea 
                required
                placeholder="What is your channel about? (Max 120 chars)"
                maxLength={120}
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* 6. SOCIAL MEDIA */}
            <div style={cardStyle}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Instagram Profile (Optional)</label>
                <input 
                  type="text" 
                  placeholder="instagram.com/username"
                  value={formData.instagramUrl}
                  onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>TikTok Profile (Optional)</label>
                <input 
                  type="text" 
                  placeholder="tiktok.com/@username"
                  value={formData.tiktokUrl}
                  onChange={e => setFormData({...formData, tiktokUrl: e.target.value})}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 7. SUBMIT SECTION */}
            <div style={{ padding: '0 4px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 14 }}>
                🔒 <strong>Creator Guidelines:</strong> By submitting, you agree to index only video content relevant to your selected category. STEA team reviews applications within 48 hours.
              </div>
              <button 
                type="submit"
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  border: 'none', 
                  borderRadius: 12, 
                  background: `linear-gradient(135deg, ${G}, #FFD17C)`, 
                  color: '#111', 
                  fontSize: 14, 
                  fontWeight: 900, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 8,
                  boxShadow: `0 4px 20px rgba(245,166,35,0.2)`
                }}
              >
                <Send size={16} /> Submit Application
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
