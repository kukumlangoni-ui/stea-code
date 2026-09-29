import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Send } from 'lucide-react';
import { useMobile } from '../hooks/useMobile.js';
import { G, PushBtn } from './ui/LayoutUtils.jsx';

export default function CreatorApplyModal({ isOpen, onClose }) {
  const isMobile = useMobile();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Technology',
    youtube: '',
    bio: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Application submitted! An admin will review your channel.');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              width: "100%",
              maxWidth: 500,
              background: "#111",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.1)",
              position: "relative",
              zIndex: 1,
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Youtube color="#ff0000" size={24} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Become a Creator</h2>
              </div>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 24 }}>
                Join the STEA Creator Network to get your YouTube videos discovered by thousands of Tanzanians.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 700 }}>Creator / Channel Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Mtaasisi"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 12, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 700 }}>Category</label>
                  <select 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 12, outline: "none", appearance: "none", boxSizing: "border-box" }}
                  >
                    <option>Technology</option>
                    <option>Education</option>
                    <option>Business</option>
                    <option>Entertainment</option>
                    <option>Gaming</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 700 }}>YouTube Channel URL</label>
                  <input 
                    required
                    type="url" 
                    value={formData.youtube} onChange={e => setFormData({...formData, youtube: e.target.value})}
                    placeholder="https://youtube.com/@yourchannel"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 12, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 700 }}>Short Bio</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="What kind of content do you create?"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 16px", borderRadius: 12, outline: "none", resize: "none", boxSizing: "border-box" }}
                  />
                </div>

                <PushBtn type="submit" style={{ width: "100%", padding: 16, marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 15 }}>
                  <Send size={18} /> Submit Application
                </PushBtn>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}