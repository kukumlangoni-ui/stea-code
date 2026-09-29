import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Construction, Rocket, Clock } from 'lucide-react';

const icons = {
  spark: Sparkles,
  construction: Construction,
  rocket: Rocket,
  clock: Clock
};

export default function ComingSoonCard({ 
  title = "Inakuja Hivi Karibuni", 
  subtitle = "Tunatayarisha mambo mazuri kwa ajili yako. Kaa tayari kwa ajili ya mabadiliko makubwa!",
  iconType = "spark",
  className = ""
}) {
  const Icon = icons[iconType] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden p-8 md:p-12 rounded-[32px] border border-white/10 bg-[#0e1018]/60 backdrop-blur-xl flex flex-col items-center text-center group ${className}`}
      style={{
        boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.02)'
      }}
    >
      {/* Decorative Glows */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#F5A623]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#60a5fa]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#F5A623]/20 rounded-2xl blur-xl group-hover:bg-[#F5A623]/30 transition-all duration-500" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 shadow-2xl">
          <Icon size={40} className="text-[#F5A623] animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight font-['Bricolage_Grotesque']">
        {title}
      </h3>
      
      <p className="text-white/50 max-w-sm text-sm md:text-base leading-relaxed font-medium">
        {subtitle}
      </p>

      {/* Footer Tag */}
      <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-ping" />
        <span className="text-[10px] font-black text-white/40 uppercase letter-spacing-[0.05em]">
          STEA ALPHA ACCESS
        </span>
      </div>
    </motion.div>
  );
}
