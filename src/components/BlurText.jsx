import React from 'react';
import { motion } from 'motion/react';

export function BlurText({ text, className, style, delay = 0.1 }) {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2em 0.3em', ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(12px)', opacity: 0, y: 24 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: delay + i * 0.08, ease: 'easeOut' }}
          className={className}
          style={{ display: 'inline-block' }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
