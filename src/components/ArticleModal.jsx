import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { timeAgo, fmtViews } from '../hooks/useFirestore.js';

const Portal = ({ children }) => createPortal(children, document.body);

export function ArticleModal({ article, onClose }) {
  const [imgError, setImgError] = useState(false);
  const [content, setContent] = useState(article.content || "");
  const [loadingContent, setLoadingContent] = useState(!!article.contentFileUrl && !article.content);
  const hasImage = article.imageUrl && !imgError;

  useEffect(() => {
    if (article.contentFileUrl && !article.content) {
      Promise.resolve().then(() => setLoadingContent(true));
      fetch(article.contentFileUrl)
        .then(res => res.json())
        .then(data => {
            setContent(data);
            setLoadingContent(false);
        })
        .catch(err => {
            console.error("Error fetching content:", err);
            setLoadingContent(false);
        });
    }
  }, [article]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  });

  return (
    <Portal>
      <div
        style={{ position:"fixed", inset:0, zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px 16px" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-[#040509]/95 backdrop-blur-2xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full max-w-[800px] bg-[#0e101a] rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between p-7 bg-[#0e101a]/80 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-[10px] font-black uppercase tracking-wider">
                {article.badge}
              </span>
              {article.readTime && (
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {article.readTime} read
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <X size={22} />
            </button>
          </div>

          <div className="overflow-y-auto scrollbar-hide">
            {hasImage && (
              <div className="w-full aspect-video overflow-hidden bg-white/5 border-b border-white/5">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              </div>
            )}

            <div className="p-4 sm:p-16 space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white leading-[1.1]">
                  {article.title}
                </h2>
                <div className="flex items-center gap-4 text-white/30 text-xs font-bold">
                  <span>{timeAgo(article.createdAt)}</span>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{fmtViews(article.views)} views</span>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="prose prose-invert max-w-none px-2 sm:px-4">
                <div className="text-white/70 leading-relaxed text-lg sm:text-xl space-y-6 font-medium">
                  {loadingContent ? (
                    <p>Inapakia maudhui...</p>
                  ) : (
                    content?.split("\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
