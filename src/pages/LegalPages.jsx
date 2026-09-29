import React from "react";
import { useMobile } from "../hooks/useMobile.js";

const G = "#F5A623";

// Simple Width Container
const W = ({ children, style }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,5vw,32px)", ...style }}>
    {children}
  </div>
);

// Section Heading
const SHead = ({ title, hi, copy }) => (
  <div>
    <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(24px,5vw,42px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 12px", lineHeight: 1.1 }}>
      {title} <span style={{ color: G }}>{hi}</span>
    </h2>
    {copy && <p style={{ color: "rgba(255,255,255,.5)", fontSize: 16, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>{copy}</p>}
  </div>
);

export function PrivacyPage() {
  return (
    <section style={{ padding: "120px 0 60px", minHeight: "80vh", background: "#06080f" }}>
      <W>
        <SHead title="Privacy" hi="Policy" copy="Sera yetu ya faragha." />
        <div
          style={{
            maxWidth: 800,
            margin: "40px 0",
            color: "rgba(255,255,255,.7)",
            lineHeight: 1.8,
            fontSize: 16
          }}
        >
          <p>
            Tunathamini faragha yako. STEA inakusanya taarifa muhimu tu ili
            kuboresha huduma zetu. Hatutashiriki taarifa zako na watu wengine
            bila idhini yako. Data yako iko salama nasi. Tunatumia cookies kuboresha uzoefu wako wa matumizi ya jukwaa hili.
          </p>
        </div>
      </W>
    </section>
  );
}

export function TermsPage() {
  return (
    <section style={{ padding: "120px 0 60px", minHeight: "80vh", background: "#06080f" }}>
      <W>
        <SHead
          title="Terms"
          hi="of Use"
          copy="Masharti ya matumizi ya jukwaa la STEA."
        />
        <div
          style={{
            maxWidth: 800,
            margin: "40px 0",
            color: "rgba(255,255,255,.7)",
            lineHeight: 1.8,
            fontSize: 16
          }}
        >
          <p>
            Kwa kutumia STEA, unakubaliana na masharti yetu. Tunajitahidi kutoa
            elimu bora, lakini tunatarajia watumiaji wetu watumie jukwaa hili
            kwa heshima na kwa malengo ya kimaendeleo. Hatuhusiki na matumizi
            mabaya ya ujuzi unaopata. Unawajibika kwa usalama wa akaunti yako na password yako.
          </p>
        </div>
      </W>
    </section>
  );
}
