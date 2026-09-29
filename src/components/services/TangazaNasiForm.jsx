import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { ServiceRequestFormContent } from './ServiceRequestForm';

const G = "#F5A623";

export const TangazaNasiFormContent = ({ onCancel, isModal = false }) => {
  return <ServiceRequestFormContent serviceType="advertise" onCancel={onCancel} isModal={isModal} />;
};

const TangazaNasiForm = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,9,0.9)', backdropFilter: 'blur(20px)' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ position: 'relative', width: '100%', maxWidth: 640, background: '#0e101a', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(245,166,35,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} style={{ color: G }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>Tangaza Nasi</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 800, margin: 0 }}>STEA Business Solutions</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          <TangazaNasiFormContent onCancel={onClose} isModal={true} />
        </div>
      </motion.div>
    </div>
  );
};

export default TangazaNasiForm;
