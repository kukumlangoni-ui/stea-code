import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMultiCollection } from '../hooks/useMultiCollection.js';
import { PostSkeleton } from '../components/Skeleton.jsx';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ArticleModal } from '../components/ArticleModal.jsx';

export default function TechTipsPage() {
  const { docs: tips, loading } = useMultiCollection(["tips", "updates", "tech_tips"], "createdAt", 100);
  const [selectedTip, setSelectedTip] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#06080f", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <button onClick={() => window.history.back()} style={{ marginBottom: 20, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 12, cursor: 'pointer' }}>
          ← Back
        </button>
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 40, fontWeight: 900, marginBottom: 40 }}>Daily Tech Tips</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {loading ? [1,2,3,4].map(i => <PostSkeleton key={i} />) : 
            (tips || []).map(tip => (
              <motion.div 
                key={tip.id} 
                whileHover={{ y: -5 }}                
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'}}
                onClick={() => setSelectedTip(tip)}
              >
                <img src={tip.imageUrl} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 12, marginBottom: 15 }} alt={tip.title} />
                <h3 style={{ fontSize: 18, marginBottom: 10 }}>{tip.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{tip.summary}</p>
              </motion.div>
            ))
          }
        </div>
      </div>
      {selectedTip && <ArticleModal article={selectedTip} onClose={() => setSelectedTip(null)} />}
    </div>
  );
}
