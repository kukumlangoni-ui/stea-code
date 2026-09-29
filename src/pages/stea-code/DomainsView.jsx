import React, { useState } from "react";
import { BookOpen, Globe2, Search, CheckCircle2, AlertTriangle, Info, Shield, Wrench } from "lucide-react";
import { SectionHero, EmptyState, SearchBar } from "../../components/stea-code/SharedComponents.jsx";
import { FALLBACK_DOMAINS_SECTIONS } from "../../data/stea-code/fallbackData.js";
import { getGateway } from "../../data/stea-code/gateways.js";

/**
 * DomainsView — /code?view=domains
 * Educational + reference page about domain concepts and tools.
 *
 * Uses structured content. No Firestore collection is required —
 * we use curated reference data directly.
 */
export default function DomainsView({ domainResources = [], loading = false }) {
  const gw = getGateway("domains");
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("basics");

  const sections = domainResources?.length
    ? domainResources
    : FALLBACK_DOMAINS_SECTIONS;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections
        .map((s) => ({
          ...s,
          items: (s.items || []).filter(
            (i) =>
              `${i.term || ""} ${i.meaning || ""}`.toLowerCase().includes(q)
          ),
        }))
        .filter((s) => s.items.length > 0)
    : sections;

  const sectionIcon = (id) => {
    switch (id) {
      case "basics": return <Info size={14} />;
      case "records": return <Globe2 size={14} />;
      case "registrars": return <BookOpen size={14} />;
      case "mistakes": return <AlertTriangle size={14} />;
      case "tools": return <Wrench size={14} />;
      default: return <CheckCircle2 size={14} />;
    }
  };

  const searchBar = (
    <SearchBar id="sc-domains-search" value={query} onChange={setQuery} placeholder="Search DNS records, concepts, tools…" />
  );

  const hasContent = filtered && filtered.some((s) => (s.items || []).length > 0);

  return (
    <div className="sc-view sc-domains-view">
      <SectionHero
        eyebrow={gw?.eyebrow || "DOMAINS"}
        headline={gw?.hero || ["Own your address", "on the web."]}
        subtitle={gw?.subtitle || "DNS, registrars, records, and propagation."}
        searchBar={searchBar}
      />

      <div className="sc-view-wrap">
        <div className="sc-view-section">
          <div className="sc-domain-jump" role="tablist" aria-label="Domain topics">
            {(sections || []).map((s) => (
              <button
                key={s.id}
                role="tab"
                type="button"
                className={"sc-domain-jump-btn" + (activeSection === s.id ? " active" : "")}
                onClick={() => setActiveSection(s.id)}
                aria-selected={activeSection === s.id}
              >
                {sectionIcon(s.id)} {s.title}
              </button>
            ))}
          </div>
        </div>

        {!hasContent ? (
          <EmptyState icon={Search} title="No matching domain content" description="Try another search term." />
        ) : (
          (filtered || []).map((section) => (
            <section
              key={section.id}
              className={"sc-view-section sc-domain-section" + (activeSection === section.id ? " active" : "")}
              id={"sc-domain-" + section.id}
            >
              <h2 className="sc-domain-section-title">{section.title}</h2>

              <div className="sc-domain-grid">
                {(section.items || []).map((item, idx) => (
                  <div key={item.term + "-" + idx} className="sc-domain-card">
                    <div className="sc-domain-term" id={"sc-domain-term-" + section.id + "-" + idx}>
                      <Shield size={13} aria-hidden="true" /> {item.term}
                    </div>
                    <p className="sc-domain-meaning" aria-labelledby={"sc-domain-term-" + section.id + "-" + idx}>
                      {item.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
