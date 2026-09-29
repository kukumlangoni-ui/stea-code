import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ArrowRight, MessageCircle } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import ServiceRequestForm from './services/ServiceRequestForm';

export default function TangazaNasi({ variant = 'section' }) {
  const isMobile = useMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (variant === 'card') {
    return (
      <>
        <motion.div
          whileHover={{ y: -5 }}
          style={{
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            borderRadius: 24,
            padding: '24px',
            color: '#fff',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(236,72,153,.2)'
          }}
          onClick={() => setIsFormOpen(true)}
        >
          <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.2 }}>
            <Megaphone size={80} />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Tangaza Nasi</h3>
            <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 16, lineHeight: 1.5 }}>
              Weka bidhaa au huduma yako mbele ya maelfu ya watumiaji wa STEA.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13 }}>
              Anza Sasa <ArrowRight size={14} />
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isFormOpen && (
            <ServiceRequestForm 
              isOpen={isFormOpen} 
              onClose={() => setIsFormOpen(false)} 
              serviceType="advertise"
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <section style={{ padding: isMobile ? "40px 0" : "80px 0" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: isMobile ? 28 : 40,
          padding: isMobile ? "40px 20px" : "60px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ 
          position: "absolute", top: 0, left: 0, right: 0, height: 4, 
          background: `linear-gradient(90deg, #ec4899, #a855f7, #3b82f6)` 
        }} />
        
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(236,72,153,0.1)", color: "#ec4899", marginBottom: 24 }}>
          <Megaphone size={32} />
        </div>
        
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: isMobile ? 28 : 44, fontWeight: 900, marginBottom: 16, letterSpacing: "-.02em" }}>
          Tangaza Biashara Yako <span style={{ color: "#ec4899" }}>Nasi</span>
        </h2>
        
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: isMobile ? 15 : 18, maxWidth: 600, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Fikia maelfu ya vijana, wanafunzi, na wataalamu nchini Tanzania kupitia jukwaa la STEA. Tunatoa suluhisho bora za matangazo kwa biashara yako.
        </p>
        
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => setIsFormOpen(true)}
            style={{
              background: "#25d366", color: "#fff", border: "none",
              padding: "16px 32px", borderRadius: 14, fontWeight: 900,
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 10, justifyContent: "center",
              boxShadow: "0 10px 20px rgba(37,211,102,0.2)"
            }}
          >
            <MessageCircle size={20} /> Ongea Nasi WhatsApp
          </button>
          
          <button
            onClick={() => window.location.href = '/advertise'}
            style={{
              background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
              padding: "16px 32px", borderRadius: 14, fontWeight: 900,
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 10, justifyContent: "center"
            }}
          >
            Maelezo Zaidi <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <ServiceRequestForm 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            serviceType="advertise"
          />
        )}
      </AnimatePresence>
    </section>
  );
}
