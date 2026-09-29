import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, ArrowRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function EmptyState({ 
  title,
  message,
  icon: Icon = Inbox,
  actionText,
  onAction,
  compact = false
}) {
  const { t } = useSettings();
  const displayTitle   = title   || t('empty_default_title');
  const displayMessage = message || t('empty_default_message');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16 px-6'} w-full border border-white/5 rounded-[32px] bg-white/[0.02] backdrop-blur-sm`}
    >
      <div className={`mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 ${compact ? 'scale-75' : ''}`}>
        <Icon size={compact ? 32 : 48} className="text-white/20" />
      </div>
      
      <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-white mb-2 tracking-tight`}>
        {displayTitle}
      </h3>
      
      <p className={`text-white/40 max-w-md ${compact ? 'text-xs' : 'text-sm'} leading-relaxed mb-6`}>
        {displayMessage}
      </p>
      
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{ background: 'linear-gradient(135deg, #F5A623, #FFD17C)', color: '#111' }}
        >
          {actionText}
          <ArrowRight size={16} />
        </button>
      )}
    </motion.div>
  );
}
