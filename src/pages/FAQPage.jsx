import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { G, W, SHead } from "../components/ui/LayoutUtils.jsx";

export default function FAQPage({ faqs: remoteFaqs }) {
  const [openIndex, setOpenIndex] = useState(null);
  const defaultFaqs = [
    {
      q: "STEA ni nini?",
      a: "Ni jukwaa la elimu ya teknolojia na fursa za kidijitali kwa Kiswahili.",
    },
    {
      q: "Nani anaweza kujiunga?",
      a: "Kila mtu! Vijana, wajasiriamali, na yeyote anayetaka kujifunza tech.",
    },
    {
      q: "Kozi zenu zinafundishwa kwa lugha gani?",
      a: "Tunafundisha kwa Kiswahili rahisi ili kila mtu aelewe.",
    },
    {
      q: "Je, ninaweza kupata kipato kupitia STEA?",
      a: "Ndiyo, tunakupa ujuzi na fursa za kuanza kujipatia kipato mtandaoni.",
    },
    {
      q: "Je, huduma zenu ni za bure?",
      a: "Tuna huduma za bure na kozi za kulipia ili kukuza ujuzi wako kwa kina.",
    },
    {
      q: "Ninawezaje kupata msaada?",
      a: "Wasiliana nasi kupitia WhatsApp au Email wakati wowote.",
    },
  ];

  const displayFaqs = remoteFaqs?.length > 0 ? remoteFaqs : defaultFaqs;

  return (
    <div style={{ background: "#0a0b10", minHeight: "100vh", padding: "100px 0" }}>
      <W>
        <SHead
          title="Maswali"
          hi="Yanayoulizwa"
          copy="Pata majibu ya maswali yanayoulizwa mara kwa mara kuhusu STEA."
        />
        <div style={{ maxWidth: 800, margin: "60px auto 0", display: "grid", gap: 16 }}>
          {displayFaqs.map((f, i) => (
            <div
              key={i}
              style={{
                borderRadius: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                transition: "0.3s"
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "24px 30px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "#fff"
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700 }}>{f.question || f.q}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  style={{ color: G }}
                >
                  <HelpCircle size={24} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ padding: "0 30px 30px", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: 16 }}>
                      {f.answer || f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </W>
    </div>
  );
}
