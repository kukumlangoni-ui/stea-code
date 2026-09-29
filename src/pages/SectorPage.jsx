import React, { useState } from "react";
import { useMobile } from "../hooks/useMobile.js";
import { useCollection } from "../hooks/useFirestore.js";
import { useSettings } from "../contexts/SettingsContext.jsx";
import { W, SHead, Skeleton } from "../components/ui/LayoutUtils.jsx";
import { ArticleCard, VideoCard } from "../components/ContentCards.jsx";
import { ArticleModal } from "../components/ArticleModal.jsx";
import { Globe } from "lucide-react";

export default function SectorPage({ title, hi, collection }) {
  const { t } = useSettings();
  const isMobile = useMobile();
  const { docs: rawDocs, loading, error } = useCollection(collection, "createdAt", 24);
  const [art, setArt] = useState(null);
  const [vid, setVid] = useState(null);

  const starterAI = [
    { id: 's1', title: 'ChatGPT Swahili Optimizer', desc: 'Boresha majibu ya ChatGPT kwa Kiswahili fasaha.', imageUrl: 'https://picsum.photos/seed/ai1/800/600', badge: 'Popular', type: 'article', content: 'Hii ni zana ya kuboresha majibu ya ChatGPT kwa Kiswahili fasaha. Inasaidia kupata majibu yenye mantiki na lugha sahihi.' },
    { id: 's2', title: 'Gemini Pro for Swahili', desc: 'Tumia nguvu ya Google Gemini kwa lugha ya Kiswahili.', imageUrl: 'https://picsum.photos/seed/ai2/800/600', badge: 'New', type: 'article', content: 'Gemini Pro inasaidia Kiswahili kwa kiwango cha juu sana. Unaweza kuitumia kutafsiri, kuandika barua, au kufanya uchambuzi wa data.' },
    { id: 's3', title: 'AI Image Generator', desc: 'Tengeneza picha za kustaajabisha kwa kutumia AI.', imageUrl: 'https://picsum.photos/seed/ai3/800/600', badge: 'Creative', type: 'article', content: 'Zana hii inakuwezesha kutengeneza picha za kustaajabisha kwa kutumia maelezo ya maandishi tu (Text-to-Image).' }
  ];

  const docs = (collection === 'ai' && (!rawDocs || rawDocs.length === 0)) ? starterAI : rawDocs;

  return (
    <div style={{ paddingTop: 100, paddingBottom: 60, minHeight: '100vh', background: '#05060a', color: '#fff' }}>
      <W>
        {art && <ArticleModal article={art} onClose={() => setArt(null)} collection={collection} />}
        
        <div style={{ marginBottom: 32 }}>
          <SHead title={title} hi={hi} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} />)}
          </div>
        ) : error || !docs || docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Globe size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {t("empty_no_results")}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              {error ? "Kuna tatizo la mtandao au ruhusa. Tafadhali jaribu tena." : "Tafadhali rudi tena baadaye."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px 24px', background: '#F5A623', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Jaribu tena
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
            {docs.map(item => {
               return item.type === 'video' ? 
               <VideoCard key={item.id} item={item} collection={collection} /> :
               <ArticleCard key={item.id} item={item} onRead={setArt} collection={collection} />
            })}
          </div>
        )}
      </W>
    </div>
  );
}
