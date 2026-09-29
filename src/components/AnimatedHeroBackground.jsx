/**
 * AnimatedHeroBackground.jsx — STEA Africa
 * Fixed: proper z-index, full coverage, enhanced particles + globe
 * Position: absolute, inset 0, z-index 0 — content must be z-index >= 1
 */
import { useEffect, useRef } from 'react';
import { useMobile } from '../hooks/useMobile';

export default function AnimatedHeroBackground() {
  const canvasRef = useRef(null);
  const isMobile  = useMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let W = 0, H = 0;
    let particles = [];

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
      buildParticles();
    };

    const buildParticles = () => {
      const count = isMobile ? 60 : 140;
      particles = Array.from({ length: count }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     Math.random() * 1.6 + 0.3,
        vx:    (Math.random() - .5) * .22,
        vy:    (Math.random() - .5) * .22,
        a:     Math.random() * .55 + .12,
        speed: Math.random() * .02 + .005,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ── Nebula glow — top right (blue) ──
      const g1 = ctx.createRadialGradient(W * .78, H * .18, 0, W * .78, H * .18, W * .55);
      g1.addColorStop(0, 'rgba(59,130,246,.13)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      // ── Warm glow — bottom left (gold) ──
      const g2 = ctx.createRadialGradient(W * .12, H * .88, 0, W * .12, H * .88, W * .45);
      g2.addColorStop(0, 'rgba(245,166,35,.07)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      // ── Centre subtle glow ──
      const g3 = ctx.createRadialGradient(W * .3, H * .4, 0, W * .3, H * .4, W * .35);
      g3.addColorStop(0, 'rgba(99,102,241,.05)');
      g3.addColorStop(1, 'transparent');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, W, H);

      const now = Date.now();
      particles.forEach(p => {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        const alpha = Math.max(.08, Math.min(.8, p.a + Math.sin(now * p.speed) * .15));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || document.body);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #030408 0%, #04050c 100%)',
      zIndex: 0,           /* ← MUST be 0 so content (z:1+) sits above */
      pointerEvents: 'none',
    }}>
      {/* Star canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* ── Globe — CSS only, right-side decoration ── */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '-35%' : '-6%',
        bottom: isMobile ? '-10%' : '-18%',
        width: isMobile ? '105vw' : '780px',
        height: isMobile ? '105vw' : '780px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #1b3d72 0%, #0d2040 28%, #060e1c 65%, #020408 100%)',
        boxShadow: `
          inset -60px -60px 130px rgba(0,0,0,.97),
          inset 30px 30px 80px rgba(255,255,255,.055),
          inset 0 0 60px rgba(59,130,246,.4),
          0 0 110px rgba(59,130,246,.2),
          0 0 220px rgba(59,130,246,.08)
        `,
        pointerEvents: 'none',
        willChange: 'transform',
      }}>
        {/* Landmass hints */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 30% 23% at 38% 42%, rgba(34,197,94,.14) 0%, transparent 100%),
            radial-gradient(ellipse 19% 32% at 56% 60%, rgba(34,197,94,.09) 0%, transparent 100%),
            radial-gradient(ellipse 24% 15% at 26% 63%, rgba(34,197,94,.07) 0%, transparent 100%),
            radial-gradient(ellipse 13% 21% at 69% 36%, rgba(34,197,94,.08) 0%, transparent 100%)
          `,
        }} />
        {/* City lights */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden',
          background: `
            radial-gradient(ellipse 7% 5% at 40% 44%, rgba(255,220,100,.18) 0%, transparent 100%),
            radial-gradient(ellipse 4% 3% at 52% 38%, rgba(255,200,80,.14) 0%, transparent 100%),
            radial-gradient(ellipse 5% 4% at 63% 56%, rgba(255,180,60,.12) 0%, transparent 100%)
          `,
        }} />
      </div>

      {/* ── Orbit rings ── */}
      <div style={{
        position: 'absolute',
        right: isMobile ? '-48%' : '-12%',
        bottom: isMobile ? '-22%' : '-30%',
        width: isMobile ? '155vw' : '1020px',
        height: isMobile ? '155vw' : '1020px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,.04)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
      }} />
      <div style={{
        position: 'absolute',
        right: isMobile ? '-60%' : '-20%',
        bottom: isMobile ? '-33%' : '-44%',
        width: isMobile ? '205vw' : '1240px',
        height: isMobile ? '205vw' : '1240px',
        borderRadius: '50%',
        border: '1px solid rgba(59,130,246,.06)',
        pointerEvents: 'none',
        transform: 'rotateX(68deg) rotateY(18deg)',
      }} />

      {/* ── Readability gradients ── */}
      {/* Left — covers text area */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, #030408 22%, rgba(3,4,8,.82) 50%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom blend into page */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(to top, #04050a, transparent)',
        pointerEvents: 'none',
      }} />
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to bottom, rgba(4,5,10,.3), transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
