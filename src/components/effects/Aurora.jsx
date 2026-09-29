/**
 * Aurora — WebGL flowing gradient effect (ogl).
 *
 * Renders an animated aurora gradient into a canvas. Intended to be used as a
 * border layer: the parent masks this canvas to only the perimeter so the
 * interior stays clean.
 *
 * Features:
 *  - ogl Renderer (alpha, no antialias for perf)
 *  - 3 color stops with blend + amplitude + speed
 *  - IntersectionObserver pause when off-screen
 *  - prefers-reduced-motion: slowest possible drift (keeps a static-ish frame)
 *  - ResizeObserver sizing
 *  - Full cleanup: cancelAnimationFrame, WEBGL_lose_context, canvas removal
 */
import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const hexToRgb = (hex) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? [
        parseInt(match[1], 16) / 255,
        parseInt(match[2], 16) / 255,
        parseInt(match[3], 16) / 255,
      ]
    : [1, 1, 1];
};

export default function Aurora({
  colorStops = ["#7CFF67", "#B497CF", "#5227FF"],
  blend = 0.5,
  amplitude = 1.0,
  speed = 0.5,
  className = "",
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const frameRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // IntersectionObserver: pause render loop when hero leaves the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track prefers-reduced-motion.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isVisible) return undefined;

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
      uniform float uBlend;
      uniform float uAmplitude;
      uniform float uSpeed;

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

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float t = uTime * uSpeed;

        // Flowing horizontal bands at different scales/speeds.
        float n1 = noise(vec2(uv.x * 2.2 + t * 0.18, uv.y * 3.0 - t * 0.10));
        float n2 = noise(vec2(uv.x * 3.6 - t * 0.12, uv.y * 2.4 + t * 0.16));

        // Blend the three color stops across the noise fields.
        vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 1.0, n1));
        col = mix(col, uColor3, smoothstep(0.0, 1.0, n2) * uBlend);

        // Soft vertical distribution — energy drifts but stays even-ish so the
        // masked border reads as a perimeter glow rather than a top blob.
        float vertical = 0.55 + 0.45 * sin(uv.y * 3.14159 + n1 * 1.5);
        float horizontal = 0.55 + 0.45 * sin(uv.x * 3.14159 + n2 * 1.2);
        float field = vertical * horizontal;

        float alpha = clamp(field * (0.35 + 0.65 * (n1 * 0.5 + n2 * 0.5)), 0.0, 1.0);
        alpha *= uAmplitude;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const colors = colorStops.length >= 3 ? colorStops.slice(0, 3) : [colorStops[0] || "#fff", colorStops[1] || "#fff", colorStops[2] || "#fff"];

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uColor1: { value: hexToRgb(colors[0]) },
      uColor2: { value: hexToRgb(colors[1]) },
      uColor3: { value: hexToRgb(colors[2]) },
      uBlend: { value: blend },
      uAmplitude: { value: amplitude },
      uSpeed: { value: reduceMotion ? 0.02 : speed },
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
      const el = containerRef.current;
      if (!el) return;
      const width = Math.max(el.clientWidth, 1);
      const height = Math.max(el.clientHeight, 1);
      renderer.setSize(width, height);
      uniforms.uResolution.value = [width * renderer.dpr, height * renderer.dpr];
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    updateSize();

    const render = (time) => {
      uniforms.uTime.value = time * 0.001;
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
  }, [isVisible, reduceMotion, colorStops, blend, amplitude, speed]);

  return (
    <div
      ref={containerRef}
      className={`aurora-container ${className}`.trim()}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
