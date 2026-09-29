import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function BlurText({ text, className, style }) {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.2em 0.3em', ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(12px)', opacity: 0, y: 24 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
          className={className}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

export function HeroCarousel() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const slides = [
    { title: "Your Exam Results Are One Tap Away", subtitle: "CSEE, ACSEE, FTNA and PSLE — matokeo yako mara moja bila stress.", cta: "🎓 Check Results", path: "/exams/results" },
    { title: "Tanzania's Gateway to Digital Freedom", subtitle: "Learn, earn, shop and grow — everything you need in one premium ecosystem.", cta: "🌍 Explore STEA", path: "/dashboard" },
    { title: "Shop Local. Order Global. Pay Smart.", subtitle: "Tanzania marketplace + Agiza China — bidhaa zote, malipo ya M-Pesa.", cta: "🛍️ Shop Now", path: "/duka" },
    { title: "AI Tools Built for African Creators", subtitle: "ChatGPT, Gemini, digital tools na tech tips — kwa Kiswahili na Kiingereza.", cta: "⚡ Explore TechHub", path: "/techhub" },
    { title: "Your Next Opportunity Starts Right Here", subtitle: "Jobs, freelance gigs na digital skills — fanya pesa ukiwa Tanzania.", cta: "💼 Find Work", path: "/gigs" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', textAlign: 'center', padding: '10px' }}
        >
          <div style={{ fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
            <BlurText text={slides[index].title} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: 'rgba(255,255,255,0.7)', marginBottom: 12, maxWidth: 400, margin: '0 auto 12px' }}
          >
            {slides[index].subtitle}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            onClick={() => navigate(slides[index].path)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#F5A623',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {slides[index].cta}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );

}
