import React from "react";
import { useMobile } from "../hooks/useMobile.js";
import { G, W, SHead } from "../components/ui/LayoutUtils.jsx";

export default function ContactPage({ siteSettings }) {
  const isMobile = useMobile();
  const data = siteSettings?.contact_info || {
    title: "Wasiliana",
    hi: "Nasi",
    copy: "Je, una swali au unahitaji msaada? Tupo hapa kukusaidia.",
    email: "swahilitecheliteacademy@gmail.com",
    whatsapp: "8619715852043"
  };

  return (
    <section style={{ padding: isMobile ? "30px 0" : "60px 0" }}>
      <W>
        <SHead
          title={data.title || "Wasiliana"}
          hi={data.hi || "Nasi"}
          copy={data.copy || "Je, una swali au unahitaji msaada? Tupo hapa kukusaidia."}
        />
        <div style={{ display: "grid", gap: isMobile ? 20 : 32, marginTop: isMobile ? 24 : 40 }}>
          <div>
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <div
                style={{
                  color: G,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: isMobile ? 9 : 12,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Email
              </div>
              <div style={{ fontSize: isMobile ? 15 : 18, color: "#fff", wordBreak: "break-all" }}>
                {data.email}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: G,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: isMobile ? 9 : 12,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                WhatsApp
              </div>
              <a
                href={`https://wa.me/${data.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: isMobile ? 15 : 18,
                  color: "#25d366",
                  textDecoration: "none",
                }}
              >
                Wasiliana nasi hapa
              </a>
            </div>
          </div>
        </div>
      </W>
    </section>
  );
}
