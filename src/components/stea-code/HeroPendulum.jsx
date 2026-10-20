import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PERIOD = 6200;

export default function HeroPendulum() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const rigRef = useRef(null);
  const bobRef = useRef(null);
  const elapsedRef = useRef(0);
  const runningRef = useRef(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) runningRef.current = false;

    const stage = stageRef.current;
    const rig = rigRef.current;
    const bob = bobRef.current;
    if (!stage || !rig || !bob) return;

    let width = 0;
    let height = 0;
    let length = 0;
    let amplitude = 0;

    const measure = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      length = height * 0.98;
      amplitude = Math.asin(Math.min(width * 0.18, height * 0.16) / length);
      stage.style.setProperty("--hp-cord-length", `${length}px`);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();

    let last = 0;
    let frame = 0;
    const animate = (now) => {
      if (last && runningRef.current && !document.hidden) {
        elapsedRef.current += Math.min(now - last, 64);
      }
      last = now;
      const phase = (elapsedRef.current / PERIOD) * Math.PI * 2;
      const angle = amplitude * Math.cos(phase);
      const degrees = (angle * 180) / Math.PI;
      if (rig) rig.style.transform = `rotate(${degrees}deg)`;
      if (bob) {
        bob.style.transform = `rotateY(${Math.sin(phase) * 13}deg) rotateX(${3 + Math.cos(phase) * 2}deg)`;
        bob.style.setProperty("--hp-shine", `${50 + Math.sin(phase) * 34}%`);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const handleBobClick = (e) => {
    e.stopPropagation();
    navigate("/services/website");
  };

  return (
    <div ref={stageRef} className="sc-hero-pendulum" aria-hidden="true">
      <div ref={rigRef} className="sc-hp-rig">
        <div className="sc-hp-cord" />
        <div className="sc-hp-bob-wrap">
          <div className="sc-hp-attachment" />
          <button
            ref={bobRef}
            type="button"
            className="sc-hp-bob"
            onClick={handleBobClick}
            aria-label="Need a website? Click to learn more"
            title="Need a website?"
          >
            <img src="/images/steacode-logo.png" alt="" draggable={false} />
            <div className="sc-hp-gloss" />
          </button>
        </div>
      </div>
    </div>
  );
}
