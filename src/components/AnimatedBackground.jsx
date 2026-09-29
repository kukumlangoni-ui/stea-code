import React, { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      t += 0.003;
      const { width: w, height: h } = canvas;

      // Deep black base
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      // Animated gold orb — top center
      const grd1 = ctx.createRadialGradient(
        w * 0.5 + Math.sin(t * 0.7) * w * 0.15,
        h * 0.1 + Math.cos(t * 0.5) * h * 0.05,
        0,
        w * 0.5, h * 0.1, w * 0.5
      );
      grd1.addColorStop(0, 'rgba(245,166,35,0.18)');
      grd1.addColorStop(0.4, 'rgba(245,166,35,0.05)');
      grd1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd1;
      ctx.fillRect(0, 0, w, h);

      // Deep amber orb — bottom left
      const grd2 = ctx.createRadialGradient(
        w * 0.1 + Math.cos(t * 0.4) * w * 0.1,
        h * 0.8 + Math.sin(t * 0.6) * h * 0.1,
        0,
        w * 0.1, h * 0.8, w * 0.4
      );
      grd2.addColorStop(0, 'rgba(180,90,0,0.12)');
      grd2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(245,166,35,0.03)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', width: '100%', height: '100%'
      }}
    />
  );
}
