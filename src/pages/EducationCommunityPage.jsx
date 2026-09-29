import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, PenTool, Search, Heart, MessageSquare, Award } from 'lucide-react';
import SEOHead from '../components/SEOHead.jsx';
import { AnimatedBackground } from '../components/AnimatedBackground.jsx';

const G = '#F5A623';

export default function EducationCommunityPage() {
  const [activeTab, setActiveTab] = useState('Trending');
  
  const posts = [
    { id: 1, author: 'kukumlangoni', badge: 'New Student', time: '4d ago', type: 'question', content: 'nataka scholarship china', tag: 'Scholarships', likes: 0, answers: 2, hasBestAnswer: true },
    { id: 2, author: 'STEA Community', badge: 'New Student', time: '4d ago', type: 'sample', content: 'Which university is best for IT in Tanzania?', tags: ['university', 'it', 'campus'], category: 'ICT', likes: 7, answers: 5, hasBestAnswer: false },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#050508', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>
      <AnimatedBackground />
      <SEOHead title="STEA Student Community" description="Connect, ask, learn, and grow with students across Tanzania" />
      
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto', padding: '60px 20px 20px' }}>
        
        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 900, marginBottom: 12, lineHeight: 1.1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            STEA Student<br/><span style={{ color: G }}>Community</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
            Connect, ask, learn, and grow with students across Tanzania
          </p>
        </div>

        {/* BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginBottom: 40 }}>
          <button style={{
            background: `linear-gradient(135deg, ${G}, #FFD17C)`, color: '#000', border: 'none',
            padding: '16px', borderRadius: 16, fontWeight: 900, fontSize: 16, width: '100%', cursor: 'pointer'
          }}>
            Create Post
          </button>
          <button style={{
            background: 'transparent', color: G, border: `1px solid rgba(245, 166, 35, 0.3)`,
            padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14, cursor: 'pointer'
          }}>
            Explore all communities
          </button>
        </div>

        {/* CATEGORIES */}
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <div style={{ minWidth: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>General</div>
          </div>
          <div style={{ minWidth: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📐</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Mathematics</div>
          </div>
          <div style={{ minWidth: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Physics</div>
          </div>
          <div style={{ minWidth: 100, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Scholarships</div>
          </div>
        </div>

        {/* COMPOSER */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 20, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>S</div>
            <div>
              <div style={{ fontWeight: 800 }}>Join STEA Community</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>What do you want to ask or share?</div>
            </div>
          </div>
          
          <textarea 
            placeholder="Ask a question..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16, padding: 16, color: '#fff', fontSize: 15, minHeight: 100, marginBottom: 16, resize: 'none', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Attach or connect:</span>
            <button style={{ background: 'rgba(245, 166, 35, 0.1)', color: G, border: `1px solid ${G}40`, padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 800 }}>📄 Past paper</button>
            <button style={{ background: 'rgba(245, 166, 35, 0.1)', color: G, border: `1px solid ${G}40`, padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 800 }}>📚 Notes</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button style={{ background: 'rgba(245, 166, 35, 0.1)', color: G, border: `1px solid ${G}`, padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>❓ Question</button>
            <button style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>💬 Discussion</button>
            <button style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>📘 Resource</button>
          </div>

          <input type="text" placeholder="Tags: math, o-level (optional)" style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none'
          }} />
        </div>

        {/* FEED TABS & SEARCH */}
        <div style={{ position: 'sticky', top: 0, background: '#050508', zIndex: 20, paddingBottom: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Search size={18} color="rgba(255,255,255,0.4)" />
            <input type="text" placeholder="Search keyword or #tag" style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: 14 }} />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {['🔥 Trending', '🆕 New', '❓ Questions', '📚 Notes', '💬 Discussions'].map(tab => {
              const isActive = activeTab === tab.split(' ')[1];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.split(' ')[1])}
                  style={{
                    background: isActive ? 'rgba(245, 166, 35, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? G : '#fff',
                    border: `1px solid ${isActive ? G : 'rgba(255,255,255,0.1)'}`,
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24, padding: '0 8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginRight: 8 }}>Live discussions happening</span>
          {['#math', '#o-level', '#necta', '#university', '#scholarships', '#campus'].map(tag => (
            <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* POSTS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{post.author[0]}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800 }}>{post.author}</span>
                    <span style={{ fontSize: 10, border: '1px solid rgba(245, 166, 35, 0.3)', color: G, padding: '2px 6px', borderRadius: 4 }}>{post.badge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{post.time} · {post.type}</div>
                </div>
              </div>

              <div style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 12 }}>
                {post.content}
              </div>

              {post.tag && (
                <span style={{ display: 'inline-block', background: 'rgba(245, 166, 35, 0.1)', color: G, border: `1px solid ${G}40`, padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 800, marginBottom: 16 }}>
                  🎯 {post.tag}
                </span>
              )}

              {post.category && (
                <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 8, marginRight: 8 }}>
                  💻 {post.category}
                </span>
              )}

              {post.tags && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {post.tags.map(t => (
                    <span key={t} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>#{t}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  <Heart size={16} color={post.likes > 0 ? '#ef4444' : 'currentColor'} fill={post.likes > 0 ? '#ef4444' : 'none'} /> {post.likes}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 16, fontSize: 13, fontWeight: 700 }}>
                  <MessageSquare size={14} /> {post.answers} Answers
                </div>
                {post.hasBestAnswer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${G}`, color: G, padding: '6px 12px', borderRadius: 16, fontSize: 13, fontWeight: 800 }}>
                    🏆 Best Answer
                  </div>
                )}
                <button style={{ marginLeft: 'auto', background: `linear-gradient(135deg, ${G}, #FFD17C)`, color: '#000', border: 'none', padding: '8px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
