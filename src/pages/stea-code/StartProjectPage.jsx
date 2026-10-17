import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import "./start-project.css";

/* Owner's WhatsApp — digits only, country code included. */
const OWNER_WHATSAPP = "255757053354";

const DIRECTIONS = [
  {
    id: "build-website",
    title: "Build a Website",
    desc: "From landing page to full platform. Design, build, launch.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "build-app",
    title: "Build an App",
    desc: "Web apps, dashboards, portals, tools. Real product, real users.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "customize",
    title: "Customize Something",
    desc: "Tweak, brand, extend. Make it truly yours.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: "support",
    title: "Get Support",
    desc: "Something broken? Slow? Confusing? Let's fix it fast.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
      </svg>
    ),
  },
  {
    id: "partnership",
    title: "Partnership",
    desc: "Long-term collaboration on products, brands, and builds.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 18a1 1 0 0 1 1-1h4v5H3a1 1 0 0 1-1-1v-3z" />
        <path d="M15 22v-5h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4z" />
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M2 12a6 6 0 0 1 6-6h1" />
        <path d="M22 12a6 6 0 0 0-6-6h-1" />
        <path d="M8 6h4v4" />
      </svg>
    ),
  },
  {
    id: "else",
    title: "Something Else",
    desc: "Not sure yet? That's fine. Start the conversation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const COUNTRY_CODES = [
  ["255", "Tanzania +255"],
  ["86", "China +86"],
  ["254", "Kenya +254"],
  ["256", "Uganda +256"],
  ["250", "Rwanda +250"],
  ["1", "United States +1"],
  ["44", "United Kingdom +44"],
  ["27", "South Africa +27"],
  ["234", "Nigeria +234"],
  ["233", "Ghana +233"],
  ["91", "India +91"],
  ["971", "UAE +971"],
  ["966", "Saudi Arabia +966"],
  ["65", "Singapore +65"],
  ["60", "Malaysia +60"],
  ["62", "Indonesia +62"],
  ["63", "Philippines +63"],
  ["84", "Vietnam +84"],
  ["49", "Germany +49"],
  ["33", "France +33"],
  ["39", "Italy +39"],
  ["31", "Netherlands +31"],
  ["46", "Sweden +46"],
  ["61", "Australia +61"],
  ["64", "New Zealand +64"],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function StartProjectPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [direction, setDirection] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("255");
  const [phone, setPhone] = useState("");
  const [discuss, setDiscuss] = useState("");
  const [company, setCompany] = useState("");
  const [directionError, setDirectionError] = useState(false);
  const [sentUrl, setSentUrl] = useState("");
  const [focusIndex, setFocusIndex] = useState(-1);

  const formRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Start a Project · steacode";
    return () => {
      document.title = prev;
    };
  }, []);

  const scrollBehavior = reduceMotion ? "auto" : "smooth";

  const handleCardClick = (title) => {
    setDirection(title);
    setDirectionError(false);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const trimmedDiscuss = discuss.trim();

    if (!direction) {
      setDirectionError(true);
      if (cardsRef.current) {
        cardsRef.current.scrollIntoView({ behavior: scrollBehavior, block: "start" });
      }
      return;
    }

    if (trimmedName.length < 2) {
      document.getElementById("spp-name")?.focus();
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      document.getElementById("spp-email")?.focus();
      return;
    }
    if (phoneDigits.length < 6) {
      document.getElementById("spp-phone")?.focus();
      return;
    }
    if (trimmedDiscuss.length < 10) {
      document.getElementById("spp-discuss")?.focus();
      return;
    }

    const fullPhone = `${countryCode || "255"}${phoneDigits}`;
    const message = [
      "Hi Isaya, I'd like to discuss a project.",
      `Name: ${trimmedName}`,
      `Email: ${trimmedEmail}`,
      `WhatsApp: +${fullPhone}`,
      `Service: ${direction}`,
      `Company: ${company.trim() || "N/A"}`,
      "Details:",
      trimmedDiscuss,
    ].join("\n");

    const url = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSentUrl(url);

    setName("");
    setEmail("");
    setPhone("");
    setDiscuss("");
    setCompany("");
    setDirection("");
    setDirectionError(false);
  };

  return (
    <div className="spp-root">
      {/* ================= HERO ================= */}
      <section className="spp-hero">
        <span className="spp-kicker">07 / Let's Talk</span>
        <h1>What can I help you with?</h1>
        <p>
          Websites, apps, custom components, partnership, support, or something else. Tell me what
          you need and the next step will be clear.
        </p>
      </section>

      {/* ================= CHOOSE A DIRECTION ================= */}
      <section aria-labelledby="spp-directions-label">
        <div className="spp-section-label">
          <span className="spp-num">01</span>
          <h2 id="spp-directions-label">Choose a direction</h2>
        </div>

        <div
          className="spp-cards-grid"
          ref={cardsRef}
          role="radiogroup"
          aria-label="Choose a direction"
        >
          {DIRECTIONS.map((item, i) => {
            const selected = direction === item.title;
            return (
              <div
                key={item.id}
                className={`spp-choice-card${selected ? " is-selected" : ""}${
                  focusIndex === i ? " is-focused" : ""
                }`}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => handleCardClick(item.title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick(item.title);
                  }
                }}
                onFocus={() => setFocusIndex(i)}
                onBlur={() => setFocusIndex((v) => (v === i ? -1 : v))}
              >
                <div className="spp-card-body">
                  <span className="spp-card-index">{String(i + 1).padStart(2, "0")}</span>
                  <div className="spp-card-top">
                    <span className="spp-card-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="spp-card-arrow" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FORM ================= */}
      <section className="spp-form-section" aria-label="Start a project form" ref={formRef}>
        <div className="spp-form-layout">
          <div className="spp-form-side">
            <h3>Tell me the details</h3>
            <p>Just enough to give you a clear next step. The rest we can shape together.</p>
          </div>

          <form className="spp-form-card" onSubmit={handleSubmit} noValidate>
            {directionError && (
              <div className="spp-direction-error is-visible" role="alert">
                Please choose a direction above first.
              </div>
            )}

            <div className="spp-field">
              <label htmlFor="spp-name">
                Name <span className="spp-req">*</span>
              </label>
              <div className="spp-input-wrap">
                <input
                  type="text"
                  id="spp-name"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="spp-field">
              <label htmlFor="spp-email">
                Email <span className="spp-req">*</span>
              </label>
              <div className="spp-input-wrap">
                <input
                  type="email"
                  id="spp-email"
                  name="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="spp-field">
              <label htmlFor="spp-phone">
                WhatsApp number <span className="spp-req">*</span>
              </label>
              <div className="spp-phone-row">
                <div className="spp-input-wrap">
                  <select
                    id="spp-countryCode"
                    name="countryCode"
                    aria-label="Country code"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="spp-input-wrap">
                  <input
                    type="text"
                    id="spp-phone"
                    name="phone"
                    placeholder="712 345 678"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="spp-field">
              <label htmlFor="spp-discuss">
                What would you like to discuss? <span className="spp-req">*</span>
              </label>
              <div className="spp-input-wrap">
                <textarea
                  id="spp-discuss"
                  name="discuss"
                  placeholder="Share the idea, problem, or opportunity. It doesn't need to be fully defined yet."
                  value={discuss}
                  onChange={(e) => setDiscuss(e.target.value)}
                />
              </div>
            </div>

            <div className="spp-field">
              <label htmlFor="spp-company">
                Company / Organization <span className="spp-opt">(optional)</span>
              </label>
              <div className="spp-input-wrap">
                <input
                  type="text"
                  id="spp-company"
                  name="company"
                  placeholder="Company or organization (optional)"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="spp-submit-row">
              <button type="submit" className="spp-submit-btn">
                <span>Send Request</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              {sentUrl && (
                <div className="spp-success-msg is-visible" role="status">
                  Request sent. If WhatsApp didn't open,{" "}
                  <a href={sentUrl} target="_blank" rel="noopener noreferrer">
                    click here
                  </a>
                  .
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <div className="spp-foot">
        <p>This goes straight to my WhatsApp. No bots, no email tag.</p>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          ← Back to steacode
        </a>
      </div>
    </div>
  );
}
