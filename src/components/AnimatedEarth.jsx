/**
 * AnimatedEarth — Premium Africa Night Globe
 * Africa-centered · city lights · shooting stars · parallax
 * WebGL via Three.js r128 · GPU-accelerated · low-power fallback
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// City light positions (lat, lon) — Africa + global hubs
const CITY_LIGHTS = [
  // East Africa
  { lat: -6.8, lon: 39.3,  r: 0.8, c: 0xFFD17C }, // Dar es Salaam ★
  { lat: -1.3, lon: 36.8,  r: 0.7, c: 0xFFD17C }, // Nairobi
  { lat:  0.3, lon: 32.6,  r: 0.5, c: 0xF5A623 }, // Kampala
  { lat: -4.0, lon: 39.7,  r: 0.5, c: 0xF5A623 }, // Mombasa
  { lat: -11.7,lon: 43.3,  r: 0.4, c: 0xF5A623 }, // Moroni
  { lat:  9.0, lon: 38.7,  r: 0.5, c: 0xF5A623 }, // Addis Ababa
  // West Africa
  { lat:  6.5, lon:  3.4,  r: 0.8, c: 0xFFB347 }, // Lagos
  { lat:  5.6, lon: -0.2,  r: 0.6, c: 0xFFB347 }, // Accra
  { lat: 14.7, lon: -17.5, r: 0.5, c: 0xFFB347 }, // Dakar
  { lat:  4.4, lon:  9.7,  r: 0.5, c: 0xFFB347 }, // Douala
  // North Africa
  { lat: 30.1, lon: 31.2,  r: 0.7, c: 0xFFD17C }, // Cairo
  { lat: 33.9, lon: 10.2,  r: 0.5, c: 0xFFD17C }, // Tunis
  { lat: 36.8, lon:  3.1,  r: 0.5, c: 0xFFD17C }, // Algiers
  // South Africa
  { lat: -26.2,lon: 28.0,  r: 0.7, c: 0xF5A623 }, // Johannesburg
  { lat: -33.9,lon: 18.4,  r: 0.6, c: 0xF5A623 }, // Cape Town
  { lat: -25.9,lon: 32.6,  r: 0.4, c: 0xF5A623 }, // Maputo
  // Middle East
  { lat: 24.7, lon: 46.7,  r: 0.6, c: 0x93C5FD }, // Riyadh
  { lat: 25.2, lon: 55.3,  r: 0.6, c: 0x93C5FD }, // Dubai
  // Europe
  { lat: 51.5, lon: -0.1,  r: 0.7, c: 0x93C5FD }, // London
  { lat: 48.9, lon:  2.3,  r: 0.6, c: 0x93C5FD }, // Paris
  // Asia
  { lat: 39.9, lon: 116.4, r: 0.8, c: 0xE879F9 }, // Beijing
  { lat: 31.2, lon: 121.5, r: 0.7, c: 0xE879F9 }, // Shanghai
  { lat: 35.7, lon: 139.7, r: 0.7, c: 0xE879F9 }, // Tokyo
  // Americas
  { lat: 40.7, lon: -74.0, r: 0.7, c: 0x4ADE80 }, // New York
  { lat: 34.1, lon: -118.2,r: 0.6, c: 0x4ADE80 }, // Los Angeles
  { lat: -23.5,lon: -46.6, r: 0.6, c: 0x4ADE80 }, // São Paulo
];

function latLonToVec3(lat, lon, radius = 5.02) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function AnimatedEarth() {
  const mountRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency <= 2 || isMobile;

    const W = mountRef.current.clientWidth  || window.innerWidth;
    const H = mountRef.current.clientHeight || window.innerHeight;

    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ─────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    camera.position.z = isMobile ? 18 : 14;

    // ── Renderer ───────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isLowEnd,
      powerPreference: isLowEnd ? 'low-power' : 'high-performance',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    setLoaded(true);

    // ── Earth group — Africa at centre ─────────────────────
    const earthGroup = new THREE.Group();
    earthGroup.rotation.y = -1.2; // Rotate so Africa faces viewer
    earthGroup.rotation.z =  0.15;
    earthGroup.scale.setScalar(0.001); // Entrance anim start
    scene.add(earthGroup);

    // ── Globe base — deep ocean night ─────────────────────
    const sphereGeo = new THREE.SphereGeometry(5, isLowEnd ? 48 : 96, isLowEnd ? 48 : 96);
    const baseMat = new THREE.MeshPhongMaterial({
      color:    0x04080f,
      emissive: 0x081428,
      specular: 0x223366,
      shininess: 12,
    });
    const globe = new THREE.Mesh(sphereGeo, baseMat);
    earthGroup.add(globe);

    // ── Land mass wireframe (subtle) ───────────────────────
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1a3a5c, wireframe: true, transparent: true, opacity: 0.07,
    });
    const wireGlobe = new THREE.Mesh(sphereGeo, wireMat);
    wireGlobe.scale.setScalar(1.001);
    earthGroup.add(wireGlobe);

    // ── Atmosphere glow — layered for depth ───────────────
    const atmoGeo = new THREE.SphereGeometry(5, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x1a6bd1, transparent: true, opacity: 0.10, side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    atmo.scale.setScalar(1.16);
    earthGroup.add(atmo);

    // Mid glow ring — warm gold tint (sunrise side)
    const midAtmoMat = new THREE.MeshBasicMaterial({
      color: 0x2a4a9a, transparent: true, opacity: 0.06, side: THREE.BackSide,
    });
    const midAtmo = new THREE.Mesh(atmoGeo, midAtmoMat);
    midAtmo.scale.setScalar(1.26);
    earthGroup.add(midAtmo);

    // Outer glow ring
    const outerAtmoMat = new THREE.MeshBasicMaterial({
      color: 0x0a3a7a, transparent: true, opacity: 0.035, side: THREE.BackSide,
    });
    const outerAtmo = new THREE.Mesh(atmoGeo, outerAtmoMat);
    outerAtmo.scale.setScalar(1.42);
    earthGroup.add(outerAtmo);

    // ── City light dots ────────────────────────────────────
    const cityGroup = new THREE.Group();
    earthGroup.add(cityGroup);

    CITY_LIGHTS.forEach(({ lat, lon, r, c }) => {
      const pos = latLonToVec3(lat, lon, 5.03);

      // Outer glow sphere
      const glowGeo = new THREE.SphereGeometry(0.06 * r, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0.25,
      });
      const glowDot = new THREE.Mesh(glowGeo, glowMat);
      glowDot.position.copy(pos);
      cityGroup.add(glowDot);

      // Core bright dot
      const coreGeo = new THREE.SphereGeometry(0.025 * r, 6, 6);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.copy(pos);
      cityGroup.add(core);
    });

    // ── Connectivity arcs (Africa focus) ──────────────────
    const createArc = (lat1, lon1, lat2, lon2, color, opacity = 0.35) => {
      const a = latLonToVec3(lat1, lon1);
      const b = latLonToVec3(lat2, lon2);
      const mid = a.clone().lerp(b, 0.5).normalize().multiplyScalar(7.2);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(60);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    earthGroup.add(createArc(-6.8, 39.3,  51.5, -0.1,  0xF5A623, 0.3));  // DSM → London
    earthGroup.add(createArc(-6.8, 39.3,  39.9, 116.4, 0xF5A623, 0.25)); // DSM → Beijing
    earthGroup.add(createArc(-6.8, 39.3,  30.1,  31.2, 0xFFD17C, 0.3));  // DSM → Cairo
    earthGroup.add(createArc(-6.8, 39.3,   6.5,   3.4, 0xF5A623, 0.25)); // DSM → Lagos
    earthGroup.add(createArc(-1.3, 36.8,  25.2,  55.3, 0xFFB347, 0.2));  // Nairobi → Dubai

    // ── Stars field ────────────────────────────────────────
    const starCount = isLowEnd ? 600 : 2500;
    const starGeo   = new THREE.BufferGeometry();
    const starPos   = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 45 + Math.random() * 40;
      starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i*3+2] = r * Math.cos(phi);
      starSizes[i]   = 0.04 + Math.random() * 0.08;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.06, transparent: true, opacity: 0.6,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Shooting stars ─────────────────────────────────────
    const shootingStars = [];
    const createShootingStar = () => {
      if (isLowEnd) return;
      const points = [];
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi   = Math.random() * Math.PI * 0.6 + 0.2;
      const startR = 20;
      const sx = startR * Math.sin(startPhi) * Math.cos(startTheta);
      const sy = startR * Math.sin(startPhi) * Math.sin(startTheta);
      const sz = startR * Math.cos(startPhi);
      const dir = new THREE.Vector3(-sx, -sy * 0.4, -sz).normalize();
      for (let i = 0; i < 20; i++) {
        points.push(new THREE.Vector3(
          sx + dir.x * i * 0.5,
          sy + dir.y * i * 0.5,
          sz + dir.z * i * 0.5,
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.9,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      shootingStars.push({ line, mat, life: 1.0, decay: 0.025 + Math.random() * 0.02 });
    };

    // ── Lights ─────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0x223355, 0.35);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    sunLight.position.set(20, 8, 15);
    scene.add(sunLight);

    const goldLight = new THREE.PointLight(0xF5A623, 0.6, 60);
    goldLight.position.set(8, 6, 12);
    scene.add(goldLight);

    // ── Mouse parallax ─────────────────────────────────────
    let mouseX = 0, mouseY = 0, tX = 0, tY = 0;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    // ── Animation loop ─────────────────────────────────────
    let frameId;
    let entered = false;
    let shootTimer = 0;
    const TARGET_SCALE = isMobile ? 0.65 : 0.95;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Entrance scale-in
      if (!entered) {
        earthGroup.scale.x += (TARGET_SCALE - earthGroup.scale.x) * 0.018;
        earthGroup.scale.y = earthGroup.scale.z = earthGroup.scale.x;
        if (Math.abs(earthGroup.scale.x - TARGET_SCALE) < 0.001) entered = true;
      }

      // Slow rotation — Africa stays in view
      earthGroup.rotation.y += 0.0008;

      // Mouse parallax (gentle)
      tX += (mouseX - tX) * 0.04;
      tY += (mouseY - tY) * 0.04;
      earthGroup.rotation.x = tY * 0.06;
      earthGroup.position.x = tX * 0.4;

      // Scroll parallax
      const scroll = window.scrollY;
      earthGroup.position.y = -scroll * 0.004;

      // Twinkle stars
      starMat.opacity = 0.5 + Math.sin(Date.now() * 0.0005) * 0.1;
      stars.rotation.y -= 0.00005;

      // City light pulse
      const pulse = 0.7 + Math.sin(Date.now() * 0.0012) * 0.3;
      cityGroup.children.forEach((m, i) => {
        if (m.material && i % 2 === 0) {
          m.material.opacity = pulse * 0.25;
        }
      });

      // Shooting stars — rare (every ~8s)
      if (!isLowEnd) {
        shootTimer++;
        if (shootTimer > 480) {
          createShootingStar();
          shootTimer = 0;
        }
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i];
          s.life -= s.decay;
          s.mat.opacity = Math.max(0, s.life);
          if (s.life <= 0) {
            scene.remove(s.line);
            s.line.geometry.dispose();
            s.mat.dispose();
            shootingStars.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // ── Cleanup ────────────────────────────────────────────
    const el = mountRef.current;
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (el && renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
      // Dispose geometries & materials
      [sphereGeo, atmoGeo, starGeo].forEach(g => g.dispose());
      [baseMat, wireMat, atmoMat, outerAtmoMat, starMat].forEach(m => m.dispose());
      shootingStars.forEach(s => { s.line.geometry.dispose(); s.mat.dispose(); });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute', inset: 0,
        zIndex: 0, pointerEvents: 'none',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1.2s ease',
        willChange: 'opacity',
      }}
    />
  );
}
