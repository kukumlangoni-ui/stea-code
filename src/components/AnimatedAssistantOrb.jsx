import React from "react";
import { motion } from "framer-motion";

export default function AnimatedAssistantOrb({ className = "" }) {
  const sparkles = [
    { top: "20%", left: "20%" },
    { top: "70%", left: "80%" },
    { top: "30%", left: "75%" },
  ];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Main Orb Container */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
        
        {/* Outer Subtle Glow */}
        <motion.div
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-[#f5b642] blur-[15px]"
        />

        {/* Breathing Ring */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
          className="absolute inset-0 rounded-full border border-dashed border-[#f5b642]/20"
        />

        {/* The Core Orb */}
        <motion.div
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0b0f1a] border border-[#f5b642]/30 shadow-[0_0_10px_rgba(245,182,66,0.15)] flex items-center justify-center overflow-hidden"
        >
          {/* Internal Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5b642]/10 to-transparent" />
          
          {/* Eyes Container */}
          <div className="flex gap-1.5 z-10">
            {/* Left Eye */}
            <div className="relative">
              <motion.div
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  times: [0, 0.45, 0.5, 0.55, 1],
                }}
                className="w-1 h-1.5 bg-[#f5b642] rounded-full shadow-[0_0_3px_#f5b642]"
              />
            </div>
            {/* Right Eye */}
            <div className="relative">
              <motion.div
                animate={{
                  scaleY: [1, 1, 0.1, 1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  times: [0, 0.45, 0.5, 0.55, 1],
                }}
                className="w-1 h-1.5 bg-[#f5b642] rounded-full shadow-[0_0_3px_#f5b642]"
              />
            </div>
          </div>

          {/* Scanning Line Effect */}
          <motion.div
            animate={{
              top: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-0 right-0 h-[1px] bg-[#f5b642]/20 shadow-[0_0_2px_#f5b642]"
          />
        </motion.div>

        {/* Floating Sparkles */}
        {sparkles.map((pos, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
            className="absolute w-0.5 h-0.5 bg-[#ffd17c] rounded-full blur-[0.5px]"
            style={{
              top: pos.top,
              left: pos.left,
            }}
          />
        ))}
      </div>
    </div>
  );
}
