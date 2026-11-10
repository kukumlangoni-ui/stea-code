import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Code2,
  LayoutGrid,
  LifeBuoy,
  MessageCircle,
  Users,
  Wrench,
} from "lucide-react";
import SEO from "../../components/SEO.jsx";
import SteaCodeFooter from "../../components/stea-code/SteaCodeFooter.jsx";
// Same stylesheet stack the storefront uses, so the topbar and footer here are
// pixel-identical to the homepage instead of an unstyled HTML list.
import "./light-mode-fixes.css";
import "./stea-code.css";
import "./stea-code-v2.css";
import "./sc-detail-actions-override.css";

const OWNER_WHATSAPP = "255757053354";

/**
 * Service directions. `num` drives the 01–06 numbering, and each entry
 * carries the copy that rewrites the form when it is selected.
 */
const DIRECTIONS = [
  {
    id: "Build a Website",
    num: "01",
    title: "Build a Website",
    desc: "From landing page to full platform. Design, build, launch.",
    Icon: Code2,
    subline: "Fast, premium websites that convert. 2–4 weeks typical.",
    heading: "Tell me about your website",
    placeholder: "What kind of website? Who's it for? Any references or sites you like?",
    intro: "I want to build a website.",
  },
  {
    id: "Build an App",
    num: "02",
    title: "Build an App",
    desc: "Web apps, dashboards, portals, tools. Real product, real users.",
    Icon: LayoutGrid,
    subline: "Web apps, dashboards, portals. Built to scale from day one.",
    heading: "Tell me about your app",
    placeholder: "What does it do? Who uses it? Any apps you admire?",
    intro: "I want to build an app.",
  },
  {
    id: "Customize Something",
    num: "03",
    title: "Customize Something",
    desc: "Tweak, brand, extend. Make it truly yours.",
    Icon: Wrench,
    subline: "Custom components, theming, or extending an existing product.",
    heading: "What needs customizing?",
    placeholder: "What component or product are you customizing? What should it look like when done?",
    intro: "I need something customized.",
  },
  {
    id: "Get Support",
    num: "04",
    title: "Get Support",
    desc: "Something broken? Slow? Confusing? Let's fix it fast.",
    Icon: LifeBuoy,
    subline: "Broken, slow, or confusing? Let's diagnose and fix it fast.",
    heading: "What's broken?",
    placeholder: "What's the problem? When did it start? Any error messages?",
    intro: "I need support with something that's broken.",
  },
  {
    id: "Partnership",
    num: "05",
    title: "Partnership",
    desc: "Long-term collaboration on products, brands, and builds.",
    Icon: Users,
    subline: "Long-term collaboration on products, brands, or ongoing builds.",
    heading: "Tell me about the partnership",
    placeholder: "What kind of partnership? What's your vision? What do you need from a partner?",
    intro: "I'm interested in a partnership.",
  },
  {
    id: "Something Else",
    num: "06",
    title: "Something Else",
    desc: "Not sure yet? That's fine. Start the conversation.",
    Icon: MessageCircle,
    subline: "Not sure what you need yet? That's fine. Start the conversation.",
    heading: "What's on your mind?",
    placeholder: "Share the idea, problem, or opportunity. It doesn't need to be fully defined.",
    intro: "I have something else in mind.",
  },
];

const GENERIC = {
  subline:
    "Websites, apps, custom components, partnership, support, or something else. Tell me what you need and the next step will be clear.",
  heading: "Tell me more",
  placeholder: "Share the idea, problem, or opportunity. It doesn't need to be fully defined.",
};

const COUNTRY_CODES = [
  { value: "255", label: "🇹🇿 +255" },
  { value: "254", label: "🇰🇪 +254" },
  { value: "256", label: "🇺🇬 +256" },
  { value: "250", label: "🇷🇼 +250" },
  { value: "86", label: "🇨🇳 +86" },
  { value: "1", label: "🇺🇸 +1" },
  { value: "44", label: "🇬🇧 +44" },
];

const NAV = [
  { label: "Components", href: "/" },
  { label: "Icons", href: "/?tab=icons" },
  { label: "Tools", href: "/tools" },
  { label: "Library", href: "/library" },
  { label: "Services", href: "/book-a-call", active: true },
];

const EMPTY_FORM = { name: "", email: "", cc: "255", whatsapp: "", message: "", company: "" };

export default function SteaCodeServicesPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sentUrl, setSentUrl] = useState(null);

  const copy = selected ? DIRECTIONS.find((d) => d.id === selected) : GENERIC;

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handlePick = (direction) => {
    setSelected(direction.id);
    setErrors({});
    // Let the reader land straight in the form they just chose.
    if (typeof window !== "undefined") {
      setTimeout(() => {
        document.getElementById("service-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("field-name")?.focus({ preventScroll: true });
      }, 80);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const digits = form.whatsapp.replace(/\D/g, "");
    const nextErrors = {
      name: form.name.trim().length < 2,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
      whatsapp: digits.length < 6,
      message: form.message.trim().length < 10,
    };

    if (!selected) {
      document.getElementById("directions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setErrors({ ...nextErrors, service: true });
      return;
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    const dir = DIRECTIONS.find((d) => d.id === selected);
    const message =
      `Hi Isaya, ${dir ? dir.intro : "I have a project."}\n\n` +
      `Name: ${form.name.trim()}\n` +
      `Email: ${form.email.trim()}\n` +
      `WhatsApp: +${form.cc}${digits}\n` +
      `Service: ${selected}\n` +
      `Company: ${form.company.trim() || "N/A"}\n\n` +
      `Details:\n${form.message.trim()}`;

    const url = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSentUrl(url);
  };

  const resetForm = () => {
    setSentUrl(null);
    setForm(EMPTY_FORM);
    setSelected(null);
    setErrors({});
  };

  return (
    <>
      <SEO
        title="Start a Project — Websites, Apps & Custom Components | SteaCode"
        description="Build a website, an app, customize a component, get support, or partner with SteaCode. Tell us what you need and we reply on WhatsApp within 24 hours."
        canonical="https://steacode.com/book-a-call"
        type="website"
      />

      <div
        className="sc-services-page"
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#ffffff",
          color: "#111827",
        }}
      >
        {/* Light-theme header to match the light page content. Background + border
            set inline so they can't be clobbered by the dark topbar hacks. */}
        <header
          className="sc-topbar"
          style={{
            width: "100%",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Link to="/" className="sc-topbar-logo" aria-label="steacode home">
            <img
              src="/stea-code-logo.png"
              alt="steacode"
              className="sc-topbar-logo-img"
              width={36}
              height={36}
            />
            <span>steacode</span>
          </Link>

          <nav className="sc-topbar-nav" aria-label="Marketplace navigation">
            {NAV.map((item) => (
              <Link key={item.label} to={item.href} className={item.active ? "is-active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sc-topbar-actions">
            <a
              href="https://t.me/steacode"
              target="_blank"
              rel="noopener noreferrer"
              className="sc-topbar-community"
              aria-label="Join the steacode community on Telegram"
            >
              <span className="sc-topbar-community-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </span>
              <span className="sc-topbar-community-label">Join the Community</span>
            </a>

            <Link to="/?signin=1" className="sc-topbar-cta">
              Sign in
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </header>

        <main
          style={{
            width: "100%",
            maxWidth: "1000px",
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Hero */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              width: "100%",
              marginBottom: "60px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "1px",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              07 / Let's Talk
            </span>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "#111827",
                marginTop: "20px",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              What can I help you <br /> with?
            </h1>
            <p
              style={{
                marginTop: "16px",
                fontSize: "16px",
                color: "#4b5563",
                maxWidth: "600px",
                lineHeight: 1.5,
              }}
            >
              {selected ? copy.subline : GENERIC.subline}
            </p>
          </section>

          {/* Directions */}
          <section id="directions" style={{ width: "100%", marginBottom: "60px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", letterSpacing: "1px" }}>
                01
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#111827" }}>Choose a direction</h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                width: "100%",
              }}
            >
              {DIRECTIONS.map(({ id, num, title, desc, Icon }) => {
                const isSelected = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handlePick(DIRECTIONS.find((d) => d.id === id))}
                    aria-pressed={isSelected}
                    className={[
                      "group relative flex h-full w-full flex-col items-start rounded-2xl border bg-white p-5! text-left shadow-sm",
                      "transition-shadow duration-200 hover:shadow-md focus:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2",
                      isSelected
                        ? "border-yellow-500 shadow-md ring-1 ring-yellow-500/30"
                        : "border-gray-200 hover:border-yellow-500",
                    ].join(" ")}
                  >
                    <span className="text-[11px] font-semibold tracking-[0.12em] text-gray-400">
                      {num}
                    </span>

                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-800 transition-colors group-hover:bg-yellow-50"
                      style={{ marginTop: "12px" }}
                    >
                      <Icon size={20} strokeWidth={2} aria-hidden="true" />
                    </span>

                    <span className="text-base font-semibold text-gray-900" style={{ marginTop: "16px" }}>
                      {title}
                    </span>
                    <span className="text-sm leading-relaxed text-gray-600" style={{ marginTop: "6px" }}>
                      {desc}
                    </span>

                    <span
                      className="mt-auto! inline-flex w-full items-center gap-1 text-[13px] font-medium text-gray-400 transition-colors group-hover:text-yellow-600"
                      style={{ paddingTop: "16px" }}
                    >
                      Select
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>

            {errors.service && (
              <p className="text-xs font-medium text-red-600" style={{ marginTop: "12px" }}>
                Pick a direction above so we know what to prepare for.
              </p>
            )}
          </section>

          {/* Form */}
          <section
            id="service-form"
            style={{
              width: "100%",
              maxWidth: "700px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              border: "1px solid #f3f4f6",
              padding: "40px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {selected ? copy.heading : GENERIC.heading}
            </h2>
            <p className="text-sm text-gray-600" style={{ marginTop: "8px" }}>
              {selected ? copy.subline : "I'll get back to you on WhatsApp within 24 hours."}
            </p>

            {sentUrl ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6! text-center" style={{ marginTop: "24px" }}>
                <Check className="mx-auto! text-emerald-600" size={32} aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900" style={{ marginTop: "12px" }}>Request sent ✓</h3>
                <p className="text-sm text-gray-600" style={{ marginTop: "8px" }}>
                  WhatsApp should have opened with your message. If it didn't,{" "}
                  <a
                    className="font-semibold text-emerald-700 underline"
                    href={sentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    click here
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5! text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  style={{ marginTop: "20px" }}
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" style={{ marginTop: "24px" }}>
                <div>
                  <label htmlFor="field-name" className="mb-2! block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    autoComplete="name"
                    className={`h-12 w-full rounded-xl border bg-white px-4! text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 ${
                      errors.name ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.name && <p className="mt-1.5! text-xs font-medium text-red-600">Please enter your name</p>}
                </div>

                <div>
                  <label htmlFor="field-email" className="mb-2! block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`h-12 w-full rounded-xl border bg-white px-4! text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 ${
                      errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.email && <p className="mt-1.5! text-xs font-medium text-red-600">Please enter a valid email</p>}
                </div>

                <div>
                  <label htmlFor="field-whatsapp" className="mb-2! block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex w-full items-stretch">
                    <select
                      value={form.cc}
                      onChange={set("cc")}
                      aria-label="Country code"
                      className="h-12 w-[124px] shrink-0 rounded-l-xl rounded-r-none border border-r-0 border-gray-300 bg-gray-50 pl-3! pr-2! text-sm text-gray-900 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="field-whatsapp"
                      type="tel"
                      value={form.whatsapp}
                      onChange={set("whatsapp")}
                      placeholder="712 345 678"
                      autoComplete="tel"
                      className={`relative z-10 h-12 min-w-0 flex-1 rounded-l-none rounded-r-xl border bg-white px-4! text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 ${
                        errors.whatsapp ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.whatsapp && <p className="mt-1.5! text-xs font-medium text-red-600">Please enter your WhatsApp number</p>}
                </div>

                <div>
                  <label htmlFor="field-message" className="mb-2! block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Tell me more <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="field-message"
                    value={form.message}
                    onChange={set("message")}
                    rows={5}
                    placeholder={selected ? copy.placeholder : GENERIC.placeholder}
                    className={`min-h-[140px] w-full resize-y rounded-xl border bg-white px-4! py-3! text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 ${
                      errors.message ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  {errors.message && <p className="mt-1.5! text-xs font-medium text-red-600">Please add at least 10 characters</p>}
                </div>

                <div>
                  <label htmlFor="field-company" className="mb-2! block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Company / Organization{" "}
                    <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="field-company"
                    type="text"
                    value={form.company}
                    onChange={set("company")}
                    placeholder="Your company or organization"
                    autoComplete="organization"
                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4! text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                  />
                </div>

                <div className="flex flex-col gap-3" style={{ marginTop: "8px" }}>
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6! text-sm font-semibold text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                  >
                    Send Request
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    This goes straight to WhatsApp. No bots, no email tag.
                  </p>
                </div>
              </form>
            )}
          </section>

          <div
            style={{
              marginTop: "40px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "16px",
              fontSize: "14px",
              color: "#6b7280",
              width: "100%",
            }}
          >
            <span>Prefer email?</span>
            <Link to="/contact" style={{ fontWeight: 600, color: "#111827", textDecoration: "underline" }}>
              Contact page
            </Link>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{ fontWeight: 600, color: "#111827", textDecoration: "underline" }}
            >
              Back to components
            </button>
          </div>
        </main>

        {/* Light-theme footer band: white background, subtle top border. The
            shared footer's text colors are flipped to dark via the scoped
            .sc-services-page rules in sc-detail-actions-override.css. */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "8px",
          }}
        >
          <SteaCodeFooter />
        </div>
      </div>
    </>
  );
}
