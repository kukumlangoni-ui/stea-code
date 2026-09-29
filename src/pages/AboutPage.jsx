import React, { Suspense, lazy } from "react";
import { useMobile } from "../hooks/useMobile.js";
import { G, W, SHead } from "../components/ui/LayoutUtils.jsx";
import SteaHero from "../components/ui/SteaHero.jsx";
import AnimatedStat from "../components/AnimatedStat.jsx";
import { Users, Briefcase, Handshake, CheckCircle2 } from "lucide-react";

const OfficialHubSections = lazy(() => import("../components/OfficialHubSections.jsx"));

export default function AboutPage() {
  const isMobile = useMobile();

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* ═══ SECTION 1: HERO ═══ */}
      <section style={{ padding: isMobile ? "60px 0 40px" : "100px 0 60px" }}>
        <W>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SteaHero 
              badge="Official STEA Services"
              titleLine1="STEA"
              titleLine2="Official"
              subtitle="Services, support, partnerships and official STEA products."
            />
          </div>

          <div className="official-stats-grid">
            <div className="official-stat-card">
              <AnimatedStat endNum={65400} suffix="+" label="Users Served" icon={<Users size={24} />} delay={0} />
            </div>
            <div className="official-stat-card">
              <AnimatedStat endNum={1250} suffix="+" label="Projects Completed" icon={<Briefcase size={24} />} delay={100} />
            </div>
            <div className="official-stat-card">
              <AnimatedStat endNum={45} suffix="+" label="Partners" icon={<Handshake size={24} />} delay={200} />
            </div>
            <div className="official-stat-card">
              <AnimatedStat endNum={8900} suffix="+" label="Support Tickets Solved" icon={<CheckCircle2 size={24} />} delay={300} />
            </div>
          </div>
        </W>
      </section>

      {/* ═══ LAZY LOADED SECTIONS (2-6) ═══ */}
      <W>
        <Suspense fallback={
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Loading official hub...
          </div>
        }>
          <OfficialHubSections />
        </Suspense>
      </W>
    </div>
  );
}
