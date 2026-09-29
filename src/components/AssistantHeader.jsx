import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Languages, User } from "lucide-react";

export default function AssistantHeader() {
  const handleBackToStea = () => {
    window.location.href = "https://stea.africa";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#05060a]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5b642] to-[#ffd17c] flex items-center justify-center shadow-[0_0_15px_rgba(245,182,66,0.3)]">
          <span className="text-[#111] font-black text-xs">STEA</span>
        </div>
        <span className="text-white/90 font-bold text-sm hidden sm:block">AI Assistant</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(245,182,66,0.15)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToStea}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#f5b642]/30 bg-[#f5b642]/5 text-[#f5b642] text-xs font-bold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Rudi STEA</span>
        </motion.button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        <button className="p-2 text-white/40 hover:text-[#f5b642] transition-colors">
          <Languages size={18} />
        </button>
        
        <button className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:border-[#f5b642]/30 transition-colors">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <User size={14} className="text-white/60" />
          </div>
          <span className="text-xs text-white/60 font-medium hidden xs:block">Akaunti</span>
        </button>
      </div>
    </header>
  );
}
