/**
 * GlobalScannerBackground — single global WebGL ambient layer (ogl).
 *
 * Renders a subtle "scanner" energy field behind the entire STEA app.
 * One instance only. Must never block interaction (pointer-events: none).
 *
 * Lifecycle:
 *  - IntersectionObserver + document visibility → pause render loop when hidden
 *  - ResizeObserver sizing
 *  - prefers-reduced-motion → slowest possible drift
 *  - cleanup: cancelAnimationFrame, WEBGL_lose_context, canvas removal
 */
import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [
        parseInt(m[1], 16) / 255,
        parseInt(m[2], 16) / 255,
        parseInt(m[3], 16) / 255,
      ]
    : [1, 1, 1];
};

export default function GlobalScannerBackground({
  color1 = "#321A72",
  color2 = "#9A3D9F",
  color3 = "#E6D9FF",
  speed = 0.22,
  sweepSpeed = 0.12,
  sweepWidth = 2.0,
  sweepFalloff = 7,
  scale = 1.8,
  frequency = 1.6,
  ripple = 0.16,
  bandDensity = 8,
  lineSharpness = 4.5,
  glow = 0.1,
  colorSpread = 0.45,
  brightness = 0.48,
  contrast = 1.15,
  softness = 2.0,
  vignette = 0.7,
  grain = true,
  grainIntensity = 0.018,
  opacity = 0.38,
  mouseInteraction = true,
  mouseRadius = 0.45,
  mouseStrength = 0.2,
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false });

  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLight, setIsLight] = useState(false);

  // Visibility: pause when tab hidden.
  useEffect(() => {
    const onVis = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Reduced motion.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  // Light/dark theme — keep scanner extremely subtle over light UIs.
  useEffect(() => {
    const root = document.documentElement;
    const check = () =>
      setIsLight(
        root.classList.contains("light") || root.classList.contains("stea-home-light")
      );
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Mouse tracking (subtle).
  useEffect(() => {
    if (!mouseInteraction) return undefined;
    const onMove = (e) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [mouseInteraction]);

  // Light mode: drastically reduce intensity so the scanner stays a faint
  // neutral shimmer over white/light UIs instead of a dark purple cast.
  const eff = isLight
    ? {
        color1: "#6B6AA8",
        color2: "#9A8FC9",
        color3: "#D8D0F0",
        opacity: Math.min(opacity, 0.1),
        grainIntensity: Math.min(grainIntensity, 0.008),
        brightness: 0.32,
        vignette: 0.5,
      }
    : {
        color1,
        color2,
        color3,
        opacity,
        grainIntensity,
        brightness,
        vignette,
      };

  useEffect(() => {
    if (!isVisible) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    });
    rendererRef.current = renderer;

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(gl.canvas);

    const vertex = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec2  uResolution;
      uniform vec3  uColor1;
      uniform vec3  uColor2;
      uniform vec3  uColor3;
      uniform float uSpeed;
      uniform float uSweepSpeed;
      uniform float uSweepWidth;
      uniform float uSweepFalloff;
      uniform float uScale;
      uniform float uFrequency;
      uniform float uRipple;
      uniform float uBandDensity;
      uniform float uLineSharpness;
      uniform float uGlow;
      uniform float uColorSpread;
      uniform float uBrightness;
      uniform float uContrast;
      uniform float uSoftness;
      uniform float uVignette;
      uniform float uGrainIntensity;
      uniform float uOpacity;
      uniform vec2  uMouse;
      uniform float uMouseStrength;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.02;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec2 p = uv;
        float t = uTime * uSpeed;

        // Subtle mouse-driven warp (very weak).
        vec2 m = uMouse - 0.5;
        p += m * uMouseStrength * 0.06;

        // Flowing horizontal bands.
        vec2 q = p * vec2(uScale, uScale * 0.6);
        q.y += t * 0.25;
        float bands = fbm(q * uFrequency + vec2(t * 0.15, 0.0));
        float lines = sin((bands + p.y * uBandDensity) * 3.14159 * uLineSharpness);
        lines = smoothstep(0.4, 1.0, lines * 0.5 + 0.5);

        // Vertical sweep band.
        float sweepPos = fract(uTime * uSweepSpeed);
        float sweepDist = abs(p.x - sweepPos);
        float sweep = exp(-pow(sweepDist * uSweepFalloff, uSweepWidth));

        // Ripple from mouse.
        float ripple = 0.0;
        if (uMouseStrength > 0.0) {
          float d = distance(p, uMouse);
          ripple = uRipple * exp(-d * d * 6.0) * sin(d * 18.0 - uTime * 2.0);
        }

        // Color mixing across the field.
        float colorMix = fbm(p * 1.5 + t * 0.1) * uColorSpread + (p.x * 0.5 + p.y * 0.5) * (1.0 - uColorSpread);
        vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 1.0, colorMix));
        col = mix(col, uColor3, smoothstep(0.4, 1.0, colorMix + bands * 0.3));

        // Combine field intensity.
        float field = lines * (0.35 + 0.65 * bands) + sweep * 0.5 + ripple;
        field = clamp(field, 0.0, 1.2);

        // Glow around bright areas.
        col += col * field * uGlow;

        // Brightness + contrast.
        col = (col - 0.5) * uContrast + 0.5;
        col *= uBrightness * (0.6 + 0.8 * field);

        // Vignette.
        vec2 vg = uv - 0.5;
        float vig = 1.0 - dot(vg, vg) * uVignette;
        col *= clamp(vig, 0.0, 1.0);

        // Softness: blur-ish via noise jitter on alpha.
        float soft = smoothstep(0.0, uSoftness * 0.1, field);

        float alpha = field * soft * uOpacity;

        // Grain.
        if (uGrainIntensity > 0.0) {
          float g = hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5;
          col += g * uGrainIntensity;
        }

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uColor1: { value: hexToRgb(eff.color1) },
      uColor2: { value: hexToRgb(eff.color2) },
      uColor3: { value: hexToRgb(eff.color3) },
      uSpeed: { value: reduceMotion ? 0.015 : speed },
      uSweepSpeed: { value: reduceMotion ? 0.01 : sweepSpeed },
      uSweepWidth: { value: sweepWidth },
      uSweepFalloff: { value: sweepFalloff },
      uScale: { value: scale },
      uFrequency: { value: frequency },
      uRipple: { value: ripple },
      uBandDensity: { value: bandDensity },
      uLineSharpness: { value: lineSharpness },
      uGlow: { value: glow },
      uColorSpread: { value: colorSpread },
      uBrightness: { value: eff.brightness },
      uContrast: { value: contrast },
      uSoftness: { value: softness },
      uVignette: { value: eff.vignette },
      uGrainIntensity: { value: grain ? eff.grainIntensity : 0 },
      uOpacity: { value: eff.opacity },
      uMouse: { value: [0.5, 0.5] },
      uMouseStrength: { value: mouseInteraction ? mouseStrength : 0 },
    };

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(gl, { geometry, program });
    meshRef.current = mesh;

    const updateSize = () => {
      const w = Math.max(window.innerWidth, 1);
      const h = Math.max(window.innerHeight, 1);
      renderer.setSize(w, h);
      uniforms.uResolution.value = [w * renderer.dpr, h * renderer.dpr];
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    const render = (time) => {
      uniforms.uTime.value = time * 0.001;
      // Smooth mouse lerp.
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.05;
      m.y += (m.ty - m.y) * 0.05;
      uniforms.uMouse.value = [m.x, m.y];
      renderer.render({ scene: mesh });
      frameRef.current = requestAnimationFrame(render);
    };
    frameRef.current = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      try {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        /* no-op */
      }
      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas);
      }
      rendererRef.current = null;
      meshRef.current = null;
    };
  }, [
    isVisible,
    reduceMotion,
    isLight,
    color1,
    color2,
    color3,
    speed,
    sweepSpeed,
    sweepWidth,
    sweepFalloff,
    scale,
    frequency,
    ripple,
    bandDensity,
    lineSharpness,
    glow,
    colorSpread,
    brightness,
    contrast,
    softness,
    vignette,
    grain,
    grainIntensity,
    opacity,
    mouseInteraction,
    mouseStrength,
  ]);

  return (
    <div
      className="global-scanner-background"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        // Dark STEA base beneath the WebGL field.
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(50,26,114,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(154,61,159,0.14) 0%, transparent 50%), #08070d",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {/* Subtle readability vignette above the field */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(4,3,8,0.55) 100%)",
        }}
      />
    </div>
  );
}
