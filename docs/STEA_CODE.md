# STEA Code — Design Defaults (Blueprint v4)

## Card Design

- **Variant:** Premium card with media + body (not full-bleed preview-only)
- **Aspect ratio (media):** 16:10 desktop, 4:3 mobile (≤500px)
- **Border radius:** 18px
- **Border:** 1px rgba(255,255,255,0.06), hover → rgba(245,166,35,0.35)
- **Background:** linear-gradient(180deg, rgba(22,28,40,0.9), rgba(13,17,26,0.95))
- **Inner highlight:** inset 0 1px 0 rgba(255,255,255,0.04)
- **Shadow:** 0 10px 30px -15px rgba(0,0,0,0.5), hover → +gold glow at 25% opacity
- **Hover lift:** translateY(-8px), spring stiffness 320, damping 22
- **Tilt:** ±3.5° on X/Y, perspective 900px, pointer-tracked spotlight
- **Spotlight:** 250px radial gradient at cursor position, 12% gold, fades in on hover
- **Body padding:** 16px 18px 20px
- **Category label:** 10px / 700 / letter-spacing 0.12em / uppercase / gold (#f5a623)
- **Title:** 15px / 700 / -0.01em / #fff
- **Description:** 12.5px / 1.5 line-height / rgba(210,218,230,0.65) / 2-line clamp
- **Price:** 13px / 800 / tabular-nums / rgba(245,247,251,0.92)
- **Badge (FREE/PRO):** absolute top-left, 12px inset

## Grid Layout

- **Template:** repeat(auto-fit, minmax(220px, 1fr))
- **Gap:** 18px
- **On mobile:** same template, cards stack naturally

## Filter Pills

- **Height:** ~28px (7px padding + content)
- **Border radius:** 999px (pill)
- **Inactive:** transparent bg, 1px rgba(255,255,255,0.12) border, rgba(245,247,251,0.7) text
- **Active:** solid gold (#f5a623) bg, dark text (#0a0b12), 800 weight, gold glow shadow
- **Mobile:** horizontal scroll, no wrap, hidden scrollbar
- **Categories shown:** All, Buttons, Cards, Text Effects, Backgrounds, Loaders, Navigation

## Product Detail Modal

- **Width:** min(1180px, 100%)
- **Layout:** 2-column grid (1.08fr media / 0.92fr copy)
- **Border radius:** 24px
- **Border:** 1px rgba(255,255,255,0.11)
- **Background:** linear-gradient(145deg, rgba(9,13,21,0.99), rgba(5,8,14,0.995))
- **Shadow:** 0 40px 120px rgba(0,0,0,0.62) + 0 0 80px -20px rgba(245,166,35,0.15) + inset highlight
- **Top accent line:** 1px gradient gold fade (left side only)
- **Title:** clamp(34px, 3.3vw, 50px) / 900 / -0.052em / 0.96 line-height
- **Description:** 13px / 1.55 / rgba(210,218,230,0.65)
- **Preview fillMode:** "scale" (contain — never crop interactive demos)

## Craft Note

- **Position:** between description and framework tags in detail modal
- **Styling:** left gold border (3px), subtle gold gradient bg, 14px/16px padding, 10px radius
- **Label:** "CRAFT NOTE" — 10px / 700 / letter-spacing 0.12em / uppercase / gold
- **Body:** 13px / 1.55 / italic / rgba(230,235,245,0.85)
- **Admin field:** "Craft Note" textarea, 3 rows, optional

## Live Preview (Iframes)

- **Card fillMode:** "cover" — fills edge-to-edge, Math.max(scaleX, scaleY), centered, overflow hidden
- **Modal fillMode:** "scale" — contain mode, Math.min(scaleX, scaleY), never crops
- **Auto-play:** yes — iframes start as soon as they're near viewport (IntersectionObserver, 250px rootMargin)
- **Max simultaneous iframes:** 6 — global registry, prioritized by distance from viewport center
- **Beyond cap:** shows static first-frame (iframe with sandbox="", no JS)
- **Reduced motion:** shows static frame with "Static preview" badge + play icon
- **Scroll priority refresh:** rAF-throttled, recalculates on scroll/resize

## Nav Bar

- **Links (left-to-right):** Explore, Components, Tools, Library, Free, Premium
- **Brand:** STEA Code wordmark
- **Right side:** search, language toggle, profile menu, mobile hamburger

## Color System (Dark Gold Identity)

- **Primary gold:** #f5a623
- **Background (base):** #0a0e18
- **Background (card):** rgba(13,17,26,0.95)
- **Text primary:** #fff / #f8f9fb
- **Text secondary:** rgba(210,218,230,0.65)
- **Text muted:** rgba(148,163,184,0.9)
- **Border subtle:** rgba(255,255,255,0.06)
- **Border strong:** rgba(255,255,255,0.12)
- **Border gold:** rgba(245,166,35,0.35)
