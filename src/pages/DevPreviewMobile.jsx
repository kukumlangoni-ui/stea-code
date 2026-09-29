import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Smartphone, 
  RotateCw, 
  Tablet as TabletIcon, 
  Settings, 
  CheckCircle, 
  Eye, 
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";

export default function DevPreviewMobile() {
  const [device, setDevice] = useState("iphone-14");
  const [orientation, setOrientation] = useState("portrait");
  const [activePath, setActivePath] = useState("/");
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef(null);

  const devices = {
    "iphone-se": { name: "iPhone SE", width: 375, height: 667, icon: Smartphone },
    "iphone-14": { name: "iPhone 14/15", width: 390, height: 844, icon: Smartphone },
    "android": { name: "Android Common", width: 412, height: 915, icon: Smartphone },
    "tablet": { name: "Tablet (iPad)", width: 768, height: 1024, icon: TabletIcon },
  };

  const previewPaths = [
    { name: "Homepage", path: "/" },
    { name: "Role Selection", path: "/classroom" },
    { name: "Teacher Dashboard", path: "/classroom/teacher-dashboard" },
    { name: "Student Dashboard", path: "/classroom/student-dashboard" },
    { name: "Class Cards / View", path: "/class/demo-class-1" },
    { name: "PWA Install Guide", path: "/mobile" },
    { name: "NECTA Results", path: "/results" },
    { name: "Study Notes", path: "/notes" }
  ];

  const checklistItems = [
    { id: 1, text: "Verify absolutely no horizontal scrollbars on mobile widths" },
    { id: 2, text: "Check classroom Role cards (stacked on mobile, equal height check)" },
    { id: 3, text: "Verify dashboard cards wrap cleanly using CSS grids" },
    { id: 4, text: "Confirm the PWA installation popups are beautiful and closable" },
    { id: 5, text: "Make sure background layouts are high-contrast and text is fully readable" },
    { id: 6, text: "Test touch click targets (each button > 44px on mobile simulations)" },
  ];

  const [checkedList, setCheckedList] = useState(() => {
    try {
      const saved = localStorage.getItem("stea-dev-checklist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheck = (id) => {
    const updated = { ...checkedList, [id]: !checkedList[id] };
    setCheckedList(updated);
    localStorage.setItem("stea-dev-checklist", JSON.stringify(updated));
  };

  const activeDevice = devices[device] || devices["iphone-14"];
  const widthVal = orientation === "portrait" ? activeDevice.width : activeDevice.height;
  const heightVal = orientation === "portrait" ? activeDevice.height : activeDevice.width;

  // Sync active path changes directly into the simulated environment
  const handlePathChange = (path) => {
    setActivePath(path);
    if (iframeRef.current) {
      iframeRef.current.src = `${window.location.origin}${path}`;
    }
  };

  const resetIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div style={{ background: "#06070d", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Dev Header */}
      <div style={{
        background: "#0b0d16",
        borderBottom: "1px solid rgba(245,166,35,0.15)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "linear-gradient(135deg, #D4AF37, #F5A623)",
            color: "#05060b",
            fontSize: 12,
            fontWeight: 900,
            padding: "4px 8px",
            borderRadius: 6,
            textTransform: "uppercase"
          }}>
            DEV MODE
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              STEA Responsive & Mobile Lab
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "2px 0 0 0" }}>
              Test visual viewports, viewport stability, and element wrapping in real-time.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={resetIframe} 
            title="Reload Environment"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <RotateCw size={14} /> Reload Preview
          </button>
          
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "linear-gradient(135deg, #F5A623, #D4AF37)",
              color: "#111",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(245,166,35,0.2)"
            }}
          >
            Open Main Site <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto 1fr",
        height: "calc(100vh - 68px)"
      }}>
        {/* Device & Path Selectors Toolbar */}
        <div style={{
          background: "#080a10",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16
        }}>
          {/* Select Device Size */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginRight: 8 }}>
              Simulator:
            </span>
            {Object.entries(devices).map(([key, info]) => {
              const DevIcon = info.icon;
              const isSelected = device === key;
              return (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  style={{
                    background: isSelected ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.03)",
                    border: isSelected ? "1px solid #F5A623" : "1px solid rgba(255,255,255,0.06)",
                    color: isSelected ? "#F5A623" : "rgba(255,255,255,0.7)",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s"
                  }}
                >
                  <DevIcon size={14} />
                  <span>{info.name}</span>
                  <span style={{ fontSize: 11, color: isSelected ? "rgba(245,166,35,0.7)" : "rgba(255,255,255,0.3)" }}>
                    ({info.width}px)
                  </span>
                </button>
              );
            })}

            {/* Toggle Landscape/Portrait */}
            <button
              onClick={() => setOrientation(prev => prev === "portrait" ? "landscape" : "portrait")}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginLeft: 12
              }}
            >
              <RotateCw size={14} style={{ transform: orientation === 'landscape' ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              <span style={{ textTransform: "capitalize" }}>{orientation}</span>
            </button>
          </div>

          {/* Quick Paths */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginRight: 8 }}>
              Active Path:
            </span>
            {previewPaths.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handlePathChange(item.path)}
                  style={{
                    background: isActive ? "linear-gradient(135deg, rgba(245,166,35,0.2), rgba(212,175,55,0.1))" : "rgba(255,255,255,0.02)",
                    border: isActive ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.04)",
                    color: isActive ? "#FFF" : "rgba(255,166,35,0.65)",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace Dual Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1fr) 350px",
          height: "100%",
          overflow: "hidden"
        }}>
          {/* Main Simulated Environment Area */}
          <div style={{
            background: "#05060a",
            padding: "40px 20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflowY: "auto",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            position: "relative"
          }}>
            {/* Device Container Frame */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                width: widthVal,
                height: heightVal,
                background: "#030407",
                borderRadius: "32px",
                border: "12px solid #141724",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.15)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative"
              }}
            >
              {/* Device Top Speaker / Notch */}
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: orientation === "portrait" ? "140px" : "30px",
                height: orientation === "portrait" ? "18px" : "140px",
                background: "#141724",
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
                zIndex: 400,
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <div style={{
                  width: orientation === "portrait" ? "40px" : "4px",
                  height: orientation === "portrait" ? "4px" : "40px",
                  borderRadius: "2px",
                  background: "#2d3345"
                }} />
              </div>

              {/* Live Iframe pointing to selected path with isolated routing representation */}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={`${window.location.origin}${activePath}`}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "#040509"
                }}
              />
            </motion.div>
          </div>

          {/* Sidebar Testing & Inspection Checklist Console */}
          <div style={{
            background: "#080a0f",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            overflowY: "auto"
          }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px 0", color: "#F5A623" }}>
                Responsive Diagnostics
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                Follow this validation procedure prior to promotion to prod environments. 
              </p>
            </div>

            {/* Checklist Panel */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12,
              padding: 16
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px 0", color: "rgba(255,255,255,0.7)" }}>
                STABILITY MILESTONES:
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {checklistItems.map((item) => {
                  const isChecked = !!checkedList[item.id];
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        cursor: "pointer",
                        padding: "6px 0",
                        userSelect: "none"
                      }}
                    >
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: isChecked ? "1px solid #F5A623" : "1px solid rgba(255,255,255,0.2)",
                        background: isChecked ? "rgba(245,166,35,0.15)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                        transition: "all 0.1s"
                      }}>
                        {isChecked && <div style={{ width: 8, height: 8, background: "#F5A623", borderRadius: 1 }} />}
                      </div>
                      <span style={{ 
                        fontSize: 12.5, 
                        color: isChecked ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.8)",
                        textDecoration: isChecked ? "line-through" : "none",
                        lineHeight: 1.4
                      }}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Specs Information */}
            <div style={{
              background: "rgba(245,166,35,0.03)",
              border: "1px solid rgba(245,166,35,0.15)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              gap: 12
            }}>
              <Info size={18} style={{ color: "#F5A623", flexShrink: 0, marginTop: 1 }} />
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 4px 0", color: "#fff" }}>
                  Dev Preview Mode
                </h4>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.45, margin: 0 }}>
                  This environment is loaded inside an iframe context, bypassing network or server caching restrictions automatically. Perfect for fast multi-device verification!
                </p>
              </div>
            </div>

            {/* Device Info Badges */}
            <div style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 16
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                Active Viewport Specs
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Width Limit</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{widthVal} px</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Height Limit</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{heightVal} px</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Aspect Ratio</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                    {(widthVal / heightVal).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>PWA Status</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>Active (Standby)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
