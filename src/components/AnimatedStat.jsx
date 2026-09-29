import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

/**
 * ErrorBoundary specifically for the AnimatedStat component
 */
class StatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Stat error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to static display if something fails
      return (
        <div style={this.props.containerStyle}>
          <div style={{ color: '#F5A623' }}>{this.props.icon}</div>
          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 900, color: '#fff' }}>
            {this.props.endNum}{this.props.suffix}
          </div>
          <div style={{ fontSize: 9, color: '#FFC562', fontWeight: 800, textTransform: 'uppercase' }}>{this.props.label}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * AnimatedStat Component
 * Animates a number from 0 to endNum using requestAnimationFrame when in viewport.
 */
function StatContent({ endNum, suffix, label, icon, duration = 1800, delay = 0 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [visible, setVisible] = useState(false);
  const elementRef = useRef(null);
  const animationStartedRef = useRef(false);

  const formatValue = (val) => {
    if (val >= 1000) {
      const kValue = val / 1000;
      // Show decimals for values like 1.5K, but not for 65.0K
      return (kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1)) + 'K';
    }
    return val.toLocaleString();
  };

  const startAnimation = useCallback(() => {
    if (animationStartedRef.current) return;
    animationStartedRef.current = true;
    
    setVisible(true);
    console.log(`STEA stats animation started for: ${label}`);
    
    let startTimestamp = null;
    const animate = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = Math.floor(easeProgress * endNum);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endNum); // Ensure it ends exactly at endNum
      }
    };
    
    // Stagger delay before starting requestAnimationFrame
    setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);
  }, [endNum, label, duration, delay]);

  useEffect(() => {
    const currentRef = elementRef.current;
    
    // Fallback: Start animation after 500ms + card delay regardless of intersection
    const fallbackTimer = setTimeout(() => {
      if (!hasAnimated) {
        startAnimation();
        setHasAnimated(true);
      }
    }, 500 + (typeof delay === 'number' ? delay : 0));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          startAnimation();
          setHasAnimated(true);
          clearTimeout(fallbackTimer);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      clearTimeout(fallbackTimer);
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasAnimated, endNum, delay, startAnimation]);

  const containerStyle = { 
    textAlign: 'center', 
    padding: '24px 12px',
    background: 'linear-gradient(145deg, rgba(22, 22, 24, 0.8), rgba(10, 10, 12, 0.9))',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(245, 166, 35, 0.3)',
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 166, 35, 0.08)',
    transition: 'all 0.3s ease',
    width: '100%',
  };

  return (
    <motion.div 
      ref={elementRef}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 30 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 }}
      style={containerStyle}
    >
      <div style={{ color: '#F5A623', filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.4))' }}>{icon}</div>
      <div style={{ 
        fontSize: 'clamp(20px, 5vw, 28px)', 
        fontWeight: 900, 
        color: '#fff', 
        textShadow: '0 0 15px rgba(245,166,35,0.4)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: 1
      }}>
        {formatValue(count)}{suffix}
      </div>
      <div style={{ 
        fontSize: 10, 
        color: '#FFC562', 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        letterSpacing: '1.2px',
        opacity: 0.8
      }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function AnimatedStat(props) {
  return (
    <StatErrorBoundary {...props}>
      <StatContent {...props} />
    </StatErrorBoundary>
  );
}
