import React, { useEffect, useRef } from "react";

export default function SteaCodeLiquidHero({ theme = "dark" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!ctx) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const state = {
      width: 1,
      height: 1,
      dpr: 1,
      raf: 0,
      last: performance.now(),
      time: 0,
      targetX: 0.5,
      targetY: 0.5,
      pointerX: 0.5,
      pointerY: 0.5,
      pointerInside: false,
      reduceMotion: reduceMotionQuery.matches,
      ripples: [],
    };

    const isDark = theme !== "light";

    function resize() {
      const rect = parent.getBoundingClientRect();

      state.width = Math.max(1, rect.width);
      state.height = Math.max(1, rect.height);
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.6);

      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);

      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;

      ctx.setTransform(
        state.dpr,
        0,
        0,
        state.dpr,
        0,
        0
      );
    }

    function localPointer(event) {
      const rect = parent.getBoundingClientRect();

      const x = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width)
      );

      const y = Math.max(
        0,
        Math.min(1, (event.clientY - rect.top) / rect.height)
      );

      state.targetX = x;
      state.targetY = y;
    }

    function onPointerMove(event) {
      localPointer(event);
      state.pointerInside = true;
    }

    function onPointerLeave() {
      state.pointerInside = false;
      state.targetX = 0.5;
      state.targetY = 0.48;
    }

    function onPointerDown(event) {
      localPointer(event);

      state.ripples.push({
        x: state.targetX,
        y: state.targetY,
        life: 0,
      });

      if (state.ripples.length > 4) {
        state.ripples.shift();
      }
    }

    function rgba(alpha) {
      return isDark
        ? `rgba(255,255,255,${alpha})`
        : `rgba(38,43,52,${alpha})`;
    }

    function drawAmbientGlow() {
      const x = state.pointerX * state.width;
      const y = state.pointerY * state.height;

      const radius = Math.max(
        180,
        Math.min(state.width, state.height) * 0.45
      );

      const glow = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      if (isDark) {
        glow.addColorStop(0, "rgba(255,255,255,.085)");
        glow.addColorStop(0.18, "rgba(245,166,35,.035)");
        glow.addColorStop(0.52, "rgba(255,255,255,.018)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
      } else {
        glow.addColorStop(0, "rgba(15,23,42,.055)");
        glow.addColorStop(0.25, "rgba(245,166,35,.025)");
        glow.addColorStop(1, "rgba(15,23,42,0)");
      }

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, state.width, state.height);
    }

    function ribbonY(xNorm, index, phase) {
      const baseLevels = [0.25, 0.39, 0.58, 0.72];
      const amplitudes = [0.115, 0.085, 0.11, 0.07];
      const frequencies = [1.45, 1.8, 1.25, 2.05];

      let y =
        baseLevels[index] +
        Math.sin(
          xNorm * Math.PI * 2 * frequencies[index] +
            phase +
            index * 1.7
        ) *
          amplitudes[index];

      y +=
        Math.sin(
          xNorm * Math.PI * 3.2 -
            phase * 0.72 +
            index
        ) *
        0.025;

      const dx = xNorm - state.pointerX;
      const influence = Math.exp(-(dx * dx) / 0.045);

      const pointerDelta =
        state.pointerY - baseLevels[index];

      y += pointerDelta * influence * (0.13 + index * 0.012);

      return y;
    }

    function drawRibbon(index, phase) {
      const segments = 90;

      const glowWidths = isDark
        ? [34, 17, 5.2, 1.4]
        : [26, 12, 4.5, 1.25];

      const alphas = isDark
        ? [0.016, 0.035, 0.13, 0.7]
        : [0.012, 0.025, 0.09, 0.42];

      for (let pass = 0; pass < glowWidths.length; pass += 1) {
        ctx.beginPath();

        for (let i = 0; i <= segments; i += 1) {
          const xNorm = i / segments;

          const x =
            xNorm * state.width;

          const y =
            ribbonY(xNorm, index, phase) *
            state.height;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = glowWidths[pass];
        ctx.strokeStyle = rgba(alphas[pass]);

        if (pass < 2) {
          ctx.shadowColor = rgba(
            isDark ? 0.16 : 0.08
          );
          ctx.shadowBlur =
            pass === 0 ? 28 : 15;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    }

    function drawSecondaryThreads(phase) {
      const count = 8;

      for (let j = 0; j < count; j += 1) {
        ctx.beginPath();

        const level =
          0.42 +
          (j - count / 2) * 0.012;

        for (let i = 0; i <= 70; i += 1) {
          const xNorm = i / 70;

          const envelope =
            Math.sin(Math.PI * xNorm);

          const wave =
            Math.sin(
              xNorm * Math.PI * 3.4 +
                phase * 0.82 +
                j * 0.32
            ) *
            0.055 *
            envelope;

          const dx =
            xNorm - state.pointerX;

          const influence =
            Math.exp(-(dx * dx) / 0.06);

          const pointerPull =
            (state.pointerY - 0.5) *
            influence *
            0.08;

          const x =
            xNorm * state.width;

          const y =
            (level + wave + pointerPull) *
            state.height;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineWidth = 0.75;
        ctx.strokeStyle = rgba(
          isDark ? 0.12 : 0.075
        );
        ctx.stroke();
      }
    }

    function drawRipples(delta) {
      state.ripples = state.ripples.filter(
        (ripple) => ripple.life < 1
      );

      state.ripples.forEach((ripple) => {
        ripple.life += delta * 0.00105;

        const eased =
          1 - Math.pow(1 - ripple.life, 3);

        const radius =
          22 + eased * 180;

        const alpha =
          (1 - ripple.life) *
          (isDark ? 0.18 : 0.11);

        ctx.beginPath();

        ctx.arc(
          ripple.x * state.width,
          ripple.y * state.height,
          radius,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle = rgba(alpha);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });
    }

    function drawVignette() {
      const gradient =
        ctx.createRadialGradient(
          state.width / 2,
          state.height * 0.46,
          state.width * 0.08,
          state.width / 2,
          state.height * 0.5,
          Math.max(state.width, state.height) * 0.72
        );

      if (isDark) {
        gradient.addColorStop(
          0,
          "rgba(5,6,9,0)"
        );
        gradient.addColorStop(
          0.62,
          "rgba(5,6,9,.12)"
        );
        gradient.addColorStop(
          1,
          "rgba(5,6,9,.72)"
        );
      } else {
        gradient.addColorStop(
          0,
          "rgba(247,248,251,0)"
        );
        gradient.addColorStop(
          1,
          "rgba(247,248,251,.54)"
        );
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        state.width,
        state.height
      );
    }

    function render(now) {
      const delta =
        Math.min(32, now - state.last);

      state.last = now;

      const lerpFactor =
        state.reduceMotion ? 0.025 : 0.085;

      state.pointerX +=
        (state.targetX - state.pointerX) *
        lerpFactor;

      state.pointerY +=
        (state.targetY - state.pointerY) *
        lerpFactor;

      if (!state.reduceMotion) {
        state.time += delta * 0.00022;
      }

      ctx.clearRect(
        0,
        0,
        state.width,
        state.height
      );

      const baseGradient =
        ctx.createLinearGradient(
          0,
          0,
          state.width,
          state.height
        );

      if (isDark) {
        baseGradient.addColorStop(
          0,
          "#050609"
        );
        baseGradient.addColorStop(
          0.45,
          "#07090d"
        );
        baseGradient.addColorStop(
          1,
          "#040507"
        );
      } else {
        baseGradient.addColorStop(
          0,
          "#fafafa"
        );
        baseGradient.addColorStop(
          0.55,
          "#f7f8fb"
        );
        baseGradient.addColorStop(
          1,
          "#f2f4f7"
        );
      }

      ctx.fillStyle = baseGradient;

      ctx.fillRect(
        0,
        0,
        state.width,
        state.height
      );

      drawAmbientGlow();

      const phase =
        state.reduceMotion
          ? 0.55
          : state.time;

      drawRibbon(0, phase);
      drawRibbon(1, phase * 0.83 + 1.2);
      drawRibbon(2, phase * 1.08 + 2.1);
      drawRibbon(3, phase * 0.71 + 3.4);

      drawSecondaryThreads(phase);

      drawRipples(delta);

      drawVignette();

      state.raf =
        requestAnimationFrame(render);
    }

    function onReduceMotionChange(event) {
      state.reduceMotion = event.matches;
    }

    resize();

    const observer =
      new ResizeObserver(resize);

    observer.observe(parent);

    parent.addEventListener(
      "pointermove",
      onPointerMove,
      { passive: true }
    );

    parent.addEventListener(
      "pointerleave",
      onPointerLeave,
      { passive: true }
    );

    parent.addEventListener(
      "pointerdown",
      onPointerDown,
      { passive: true }
    );

    reduceMotionQuery.addEventListener?.(
      "change",
      onReduceMotionChange
    );

    state.raf =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(state.raf);
      observer.disconnect();

      parent.removeEventListener(
        "pointermove",
        onPointerMove
      );

      parent.removeEventListener(
        "pointerleave",
        onPointerLeave
      );

      parent.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      reduceMotionQuery.removeEventListener?.(
        "change",
        onReduceMotionChange
      );
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="sc-liquid-canvas"
      aria-hidden="true"
    />
  );
}
