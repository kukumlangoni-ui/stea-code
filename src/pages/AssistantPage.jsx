import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Sparkles, MessageSquare, Zap, BookOpen, Cpu } from "lucide-react";
import AssistantHeader from "../components/AssistantHeader";
import AnimatedAssistantOrb from "../components/AnimatedAssistantOrb";

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  const suggestions = [
    { icon: <Zap size={18} />, text: "Nisaidie kuandika barua ya kazi", color: "#f5b642" },
    { icon: <BookOpen size={18} />, text: "Eleza AI kwa mtoto wa miaka 5", color: "#60a5fa" },
    { icon: <Cpu size={18} />, text: "Nipe mawazo ya biashara ndogo", color: "#34d399" },
    { icon: <MessageSquare size={18} />, text: "Tafsiri sentensi kwenda Kiingereza", color: "#a78bfa" },
  ];

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setIsChatting(true);
    // Logic for sending message would go here
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white font-sans selection:bg-[#f5b642]/30">
      <AssistantHeader />

      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isChatting ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center w-full"
            >
              {/* Assistant Header Card */}
              <div className="w-full max-w-2xl mb-8 bg-[#0d0f1a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5b642]/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                  {/* Icon Container */}
                  <div className="flex-shrink-0 bg-[#05060a]/50 p-4 rounded-2xl border border-[#f5b642]/20 shadow-inner">
                    <AnimatedAssistantOrb />
                  </div>
                  
                  {/* Text Content */}
                  <div className="text-center sm:text-left flex-1 pt-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                      STEA Assistant <span className="text-[#f5b642]">Live</span>
                    </h2>
                    <p className="text-[#f5b642]/80 font-bold text-xs sm:text-sm uppercase tracking-widest mb-3">
                      Niko hapa kukusaidia 24/7
                    </p>
                    <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                      Uliza maswali, pata ushauri wa kibiashara, au jifunze mambo mapya kuhusu teknolojia na AI.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search/Input Section */}
              <div className="w-full max-w-2xl mt-12">
                <form 
                  onSubmit={handleSend}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-[#f5b642]/10 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center bg-[#0d0f1a] border border-white/10 rounded-2xl p-2 focus-within:border-[#f5b642]/50 transition-all duration-300 shadow-2xl">
                    <div className="pl-4 text-white/30">
                      <Search size={20} />
                    </div>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Uliza chochote kwa STEA Assistant..."
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-white/20 text-sm sm:text-base"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-gradient-to-br from-[#f5b642] to-[#ffd17c] text-[#111] p-3 rounded-xl shadow-lg shadow-[#f5b642]/20 transition-transform"
                    >
                      <Send size={20} />
                    </motion.button>
                  </div>
                </form>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                  {suggestions.map((item, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(245,182,66,0.3)" }}
                      onClick={() => setInput(item.text)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-left transition-all group"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {item.icon}
                      </div>
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                        {item.text}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#f5b642]/10 flex items-center justify-center mb-6">
                <Sparkles className="text-[#f5b642]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chat System Active</h3>
              <p className="text-white/50 mb-8">Hapa ndipo mazungumzo yataendelea...</p>
              <button 
                onClick={() => setIsChatting(false)}
                className="text-[#f5b642] text-sm font-bold hover:underline"
              >
                Rudi Mwanzo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Bottom Info */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 text-center pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
          Powered by STEA AI
        </p>
      </footer>
    </div>
  );
}
