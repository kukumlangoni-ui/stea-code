import React, { useState } from 'react';
import { getFirebaseDb } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, X, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const G = '#F5A623';

export default function ReportModal({ isOpen, onClose, item, user }) {
  const [reportType, setReportType] = useState('Wrong notes');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item) return;
    setSubmitting(true);
    setError('');

    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firebase database not ready.");

      const payload = {
        itemId: item.id || 'unknown',
        itemTitle: item.title || 'Untitled Material',
        itemType: item.type || 'unknown_type',
        reportType,
        details: details.trim(),
        reportedBy: user?.email || 'Anonymous Guest',
        reportedByUid: user?.uid || 'guest',
        status: 'open',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reports'), payload);
      
      // Auto-trigger an admin notification (non-blocking)
      try {
        await addDoc(collection(db, 'admin_notifications'), {
          title: `⚠️ New Report: ${reportType}`,
          body: `"${item.title}" was flagged for "${reportType}". Reported by ${user?.email || 'guest'}.`,
          type: 'report',
          itemId: item.id || 'unknown',
          status: 'unread',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Failed to create admin notification:", err);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Report failed:", err);
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: 20
      }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)'
          }}
        />

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            background: '#11131e',
            border: '1px solid rgba(245, 166, 35, 0.15)',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 166, 35, 0.03)',
            zIndex: 10
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            data-hover-target="true"
          >
            <X size={16} />
          </button>

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(74, 222, 128, 0.1)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
                color: '#4ade80'
              }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Asante Sana!</h3>
              <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                Ripoti yako imepokelewa vizuri. Timu ya STEA inaifanyia kazi sasa hivi ili kuhakikisha usalama na ubora wa elimu yetu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ef4444'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Ripoti Maudhui / Broken File</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>Ripoti faili ili kuboresha STEA Education</p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontSize: 11, marginBottom: 2 }}>Maudhui yanayoripotiwa:</span>
                <strong style={{ color: '#fff' }}>{item.title}</strong>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 10,
                  padding: 12,
                  color: '#fca5a5',
                  fontSize: 13,
                  marginBottom: 16
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Chagua Aina ya Tatizo</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1a1d2e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: 14
                  }}
                >
                  <option value="Wrong notes" style={{ color: '#000' }}>Wrong / Outdated Notes (Notes Sio Sahihi)</option>
                  <option value="Broken files" style={{ color: '#000' }}>Broken Link / File doesn't open (Kiunganishi Kimevunjika)</option>
                  <option value="Bad content" style={{ color: '#000' }}>Inappropriate content (Maudhui Mabaya / Yasiyofaa)</option>
                  <option value="Fake paper" style={{ color: '#000' }}>Fake past paper / Exams (Mtihani wa Kughushi)</option>
                  <option value="Abuse" style={{ color: '#000' }}>Harassment / Abuse / Spam (Unyanyasaji au Spam)</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Maelezo ya Ziada (Optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Eleza kwa ufupi tatizo lililopo..."
                  required
                  style={{
                    width: '100%',
                    height: 100,
                    background: '#1a1d2e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: 14,
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px',
                    borderRadius: 12,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                    border: 'none',
                    padding: '12px',
                    borderRadius: 12,
                    color: '#11131e',
                    fontWeight: 800,
                    cursor: submitting ? 'default' : 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : <AlertTriangle size={16} />}
                  {submitting ? 'Inatuma...' : 'Tuma Ripoti'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
