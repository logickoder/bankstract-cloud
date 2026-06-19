# DESIGN.md — bankstract-cloud

Single source of truth for visual design system: tokens, components, layout structure, references, anti-patterns.

Authoritative for any UI work in this repo. PRD.md + CLAUDE.md + AGENTS.md REFERENCE this file, do not duplicate.

Inspired by [google-labs-code/design.md](https://github.com/google-labs-code/design.md) — structured spec, not prose marketing.

---

## Frontmatter

```yaml
name: bankstract-cloud
status: draft
version: 0.1.0
last_updated: 2026-06-18
parent_inspiration:
  - portfolio.logickoder.dev (Phase 2 brand)
visual_refs:
  primary: inngest.com
  business_model: trigger.dev
  single_section: resend.com
```

---

## Tokens

### Colors

```yaml
colors:
  bg:
    primary: "#0a0a0a"      # canonical dark. Use this for hero + 90% of surface
    secondary: "#111418"    # subtle elevation (cards, code blocks)
    tertiary: "#1a1d23"     # deepest elevation (nested cards, hover states on secondary)
    inverse: "#fafaf9"      # warm-white. Use sparingly — only when section explicitly inverts

  fg:
    primary: "#fafaf9"      # body text on dark bg
    secondary: "#a1a1aa"    # muted text, captions, microcopy
    tertiary: "#71717a"     # disabled state, watermark
    inverse: "#0a0a0a"      # text on inverse bg

  accent:
    primary: "#D2691E"      # burnt orange — single load-bearing accent. Inherits portfolio Phase 2.
    primary-hover: "#b85718"
    primary-muted: "#D2691E40"  # 25% alpha — backgrounds, badges
    primary-glow: "#D2691E20"   # 12% alpha — hero radial gradient, glow effects

  status:
    success: "#34d399"
    warning: "#fbbf24"
    error: "#ef4444"
    info: "#60a5fa"

  border:
    default: "#27272a"
    muted: "#1a1d23"
    accent: "#D2691E"
```

### Typography

```yaml
typography:
  family:
    display: "Fraunces, ui-serif, Georgia, serif"
    body: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    mono: "JetBrains Mono, ui-monospace, 'SF Mono', Menlo, monospace"

  scale:
    hero-h1: { size: "72px", line-height: "1.05", weight: 700, family: display, tracking: "-0.04em" }
    hero-h1-stacked: { size: "64px", line-height: "1.0", weight: 800, family: display, tracking: "-0.05em" }   # Inngest pattern
    h2: { size: "48px", line-height: "1.1", weight: 700, family: display, tracking: "-0.03em" }
    h3: { size: "32px", line-height: "1.2", weight: 600, family: display, tracking: "-0.02em" }
    h4: { size: "24px", line-height: "1.3", weight: 600, family: body }
    body-lg: { size: "20px", line-height: "1.5", weight: 400, family: body }
    body: { size: "16px", line-height: "1.6", weight: 400, family: body }
    body-sm: { size: "14px", line-height: "1.5", weight: 400, family: body }
    caption: { size: "12px", line-height: "1.4", weight: 400, family: body }
    code-lg: { size: "16px", line-height: "1.6", weight: 400, family: mono }
    code: { size: "14px", line-height: "1.6", weight: 400, family: mono }
    code-sm: { size: "12px", line-height: "1.5", weight: 400, family: mono }
```

Money rule: **all naira amounts ALWAYS in `mono` family**. No exceptions. Visual rule, not a style preference.

### Spacing

```yaml
spacing:
  0: "0"
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
  24: "96px"
  32: "128px"        # section gap (vertical rhythm)
  40: "160px"        # hero bottom padding
```

### Radius

```yaml
radius:
  none: "0"
  sm: "4px"
  md: "8px"
  lg: "12px"          # default for cards
  xl: "16px"
  pill: "9999px"      # badges only
```

### Shadows

```yaml
shadows:
  glow-accent: "0 0 80px -20px {accent.primary-glow}"   # hero radial accent
  card: "0 1px 2px 0 rgba(0,0,0,0.5)"
  card-hover: "0 4px 12px -2px rgba(0,0,0,0.6)"
```

NO drop shadows on buttons. NO multi-layer shadows. Single soft shadow OR none.

### Motion

```yaml
motion:
  duration:
    fast: "150ms"        # hover, focus
    base: "250ms"        # transitions
    slow: "400ms"        # entrance animations
    cinematic: "4000ms"  # the hero PDF→CSV transformation loop

  easing:
    default: "cubic-bezier(0.4, 0, 0.2, 1)"      # tailwind default
    decelerate: "cubic-bezier(0, 0, 0.2, 1)"
    accelerate: "cubic-bezier(0.4, 0, 1, 1)"
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)"
```

NO scroll-triggered fade-up cascades on every section. ONE signature animation (hero PDF→CSV). Other sections are STATIC or static-with-hover.

### Grain texture (Inngest pattern)

```yaml
grain:
  filter-id: "bs-grain"
  baseFrequency: "0.85"
  numOctaves: 4
  stitchTiles: "stitch"
  opacity: "0.06"        # subtle — viewer should NOT consciously notice
  applied-to: ["hero-section-bg", "feature-section-bg"]
  applied-via: "svg <filter> + css filter: url(#bs-grain)"
```

---

## Components

Component name maps to property groups. Variants append (`-hover`, `-focus`, `-disabled`, `-loading`).

### button

```yaml
button:
  base:
    family: body
    weight: 500
    radius: md
    padding: "12px 20px"
    transition: "base default"
    border-width: "1px"

  primary:
    backgroundColor: "{accent.primary}"
    textColor: "{fg.inverse}"
    borderColor: "{accent.primary}"
  primary-hover:
    backgroundColor: "{accent.primary-hover}"
    borderColor: "{accent.primary-hover}"

  secondary:
    backgroundColor: "transparent"
    textColor: "{fg.primary}"
    borderColor: "{border.default}"
  secondary-hover:
    backgroundColor: "{bg.secondary}"
    borderColor: "{fg.secondary}"

  ghost:
    backgroundColor: "transparent"
    textColor: "{fg.secondary}"
    borderColor: "transparent"
  ghost-hover:
    textColor: "{fg.primary}"
    backgroundColor: "{bg.secondary}"

  link:
    backgroundColor: "transparent"
    textColor: "{accent.primary}"
    borderColor: "transparent"
    underline: "underline-offset-4"
  link-hover:
    textColor: "{accent.primary-hover}"
```

NO gradient buttons. NO glow on hover. NO scale-105 transforms.

### card

```yaml
card:
  base:
    backgroundColor: "{bg.secondary}"
    borderColor: "{border.default}"
    border-width: "1px"
    radius: lg
    padding: 6
  hover:
    borderColor: "{fg.tertiary}"
    shadow: "card-hover"
```

### code-block

```yaml
code-block:
  base:
    backgroundColor: "{bg.tertiary}"
    borderColor: "{border.muted}"
    border-width: "1px"
    radius: md
    padding: 5
    typography: code
    overflow: "auto"
  inline:
    backgroundColor: "{bg.secondary}"
    radius: sm
    padding: "2px 6px"
    typography: code-sm
```

Syntax highlighting via Shiki (server-side, zero JS). Theme: `vesper` or `vitesse-dark` (test against burnt-orange accent — pick the one where keywords don't fight `#D2691E`).

### input

```yaml
input:
  base:
    backgroundColor: "{bg.secondary}"
    textColor: "{fg.primary}"
    borderColor: "{border.default}"
    border-width: "1px"
    radius: md
    padding: "10px 14px"
    family: body
  focus:
    borderColor: "{accent.primary}"
    outline: "2px solid {accent.primary-glow}"
  error:
    borderColor: "{status.error}"
  placeholder:
    textColor: "{fg.tertiary}"
```

### badge

```yaml
badge:
  base:
    radius: pill
    padding: "4px 10px"
    typography: caption
    weight: 500

  default:
    backgroundColor: "{bg.tertiary}"
    textColor: "{fg.secondary}"
    borderColor: "{border.default}"
  accent:
    backgroundColor: "{accent.primary-muted}"
    textColor: "{accent.primary}"
  success:
    backgroundColor: "#34d39920"
    textColor: "{status.success}"
  warning:
    backgroundColor: "#fbbf2420"
    textColor: "{status.warning}"
  error:
    backgroundColor: "#ef444420"
    textColor: "{status.error}"
```

### tabs

```yaml
tabs:
  list:
    backgroundColor: "{bg.tertiary}"
    radius: md
    padding: 1
  trigger:
    padding: "8px 16px"
    radius: sm
    textColor: "{fg.secondary}"
    typography: body-sm
    weight: 500
  trigger-active:
    backgroundColor: "{bg.secondary}"
    textColor: "{fg.primary}"
```

Used for: hero code-language switcher (curl / Python / TS / Go), dashboard nav, settings sections.

### bank-coverage-cell

Custom. Used in "Reads Naija banks first" section.

```yaml
bank-coverage-cell:
  base:
    backgroundColor: "{bg.secondary}"
    borderColor: "{border.default}"
    border-width: "1px"
    radius: md
    padding: 4
    family: body

  shipped:
    indicator: "✅"
    textColor: "{fg.primary}"
  in-progress:
    indicator: "🚧"
    textColor: "{fg.secondary}"
  wanted:
    indicator: "📭"
    textColor: "{fg.tertiary}"
```

The ONLY component that uses emoji indicators. Justified because: coverage-matrix legibility > brand-purity. Per CLAUDE.md voice rule, no other emoji ships.

---

## Page structure

### Landing (apps/marketing)

Section slot order, top to bottom. Each slot maps to one component file.

```yaml
landing-sections:
  - id: hero
    component: HeroSection
    ref: inngest.com
    elements:
      bg: "grain texture + radial accent glow at top-right"
      h1: "Stacked: 'Statement parsing API' (display, sans-weight) / 'for Nigerian banks' (display, lighter)"
      subhead: "Drop in one API call. Get clean transactions, account metadata, NDPR-compliant redaction."
      code-snippet: "right-aligned, JetBrains Mono, syntax-highlighted curl POST /v1/parse, 3 lines"
      cta-primary: "Try the demo"
      cta-secondary: "Read the docs"
      ribbon-bottom: "Open source · Self-host · Use our cloud"

  - id: customer-logos
    component: LogoStrip
    visibility: "OMIT v1 (no customers). Comment out section file."

  - id: tabbed-code-examples
    component: CodeTabsSection
    ref: resend.com
    elements:
      heading: "Integrate today"
      tabs: ["curl", "Python", "TypeScript", "Go"]
      max-width: "container"

  - id: hero-transformation
    component: TransformationDemo
    ref: inngest.com (mid-page widget pattern)
    signature: true
    elements:
      left-pane: "scan-line render of redacted PDF (FBN/PalmPay/Zenith rotating)"
      stream: "burnt-orange particle stream (canvas or SVG)"
      right-pane: "clean CSV table rows populating top-down"
      below: "JetBrains Mono curl snippet auto-types"
    motion: "{motion.cinematic} loop, pause on hover"
    note: "YOUR signature element. No template ships this. Custom canvas/SVG, 1 day to ship."

  - id: feature-grid
    component: FeatureGrid
    elements:
      heading: "What you get"
      cards: 3
      card-titles: ["Parse", "Redact", "Reconcile"]
      card-format: "icon + 1-line headline + 2-line body"

  - id: reliable-by-default
    component: CodeFeatureSection
    ref: trigger.dev
    elements:
      layout: "2-column: code block (left) + plain-english explanation (right)"
      features:
        - title: "Reconciliation invariant"
          code: "automatic balance check on every parse"
        - title: "Format-version drift detection"
          code: "explicit error on layout change, never silent dropout"
        - title: "Stream input"
          code: "no temp files, BytesIO support"

  - id: bank-coverage
    component: BankCoverage
    original: true
    elements:
      heading: "Reads Naija banks first"
      grid: "bank-coverage-cell per bank (PalmPay/FBN/Zenith/GTB/Kuda/Opay/Stanbic/Wise)"
      sla-microcopy: "Format drift fixed in 48h or you don't pay"

  - id: compliance
    component: ComplianceSection
    ref: inngest.com (CISO-style call-out)
    elements:
      heading: "Built for compliance"
      bullets:
        - "NDPR-aware redaction in one API call"
        - "Ephemeral processing — no PDF storage, ever"
        - "Audit log = metadata only"
        - "Source on GitHub. Verify the claims."

  - id: oss-pride
    component: OssPrideSection
    ref: trigger.dev
    elements:
      heading: "We're open source. AGPL-3.0."
      stats: ["star count", "contributors", "license badge"]
      cta: "Self-host with docker-compose"

  - id: final-cta
    component: FinalCtaSection
    ref: trigger.dev
    elements:
      cta-primary: "Get started free"
      cta-secondary: "Self-host"
      sub-link: "Talk to sales"

  - id: footer
    component: Footer
    elements:
      cols: ["Product", "Docs", "Community", "Legal"]
      bottom-microcopy: "Open source statement parsing API for Nigerian banks"
```

### Dashboard (apps/app)

```yaml
dashboard-sections:
  - id: nav
    component: SidebarNav
    items: ["Overview", "API Keys", "Usage", "Billing", "Settings"]

  - id: overview
    component: OverviewDashboard
    cards: ["This month: parses", "This month: $ used", "Avg parse time", "Success rate"]

  - id: api-keys
    component: ApiKeysTable
    ref: resend.com (their API keys page is the gold standard)
    elements:
      table-cols: ["Name", "Prefix", "Created", "Last used", "Actions"]
      create-modal: "name input + env toggle (test/live) + scopes (future)"
      reveal-once: "show full key once on creation; copy-to-clipboard; warning that it won't be shown again"

  - id: usage
    component: UsageDashboard
    ref: stripe billing dashboard
    elements:
      chart: "stacked area chart, daily parses last 30 days, Tremor component"
      breakdown: "per-API-key drill-in"

  - id: billing
    component: BillingDashboard
    elements:
      current-period: "running total + projected invoice"
      invoices: "past invoices table"
      payment-method: "Stripe customer portal embed"
```

### Demo (apps/demo)

Single-route app.

```yaml
demo-page:
  layout: "centered hero w/ drag-drop zone, no nav clutter"
  ref: tinypng.com + cobalt.tools
  elements:
    h1: "Drop your bank statement"
    subhead: "PDF → CSV/JSON. Personal use. No signup. No storage."
    dropzone:
      states: ["idle", "drag-over", "parsing", "result", "error"]
      max-size: "50MB"
    result-view:
      preview: "first 10 rows as table"
      actions: ["Download CSV", "Download JSON", "Parse another"]
    bottom-ribbon: "For production use, see the API docs."
    turnstile: "invisible mode if available, visible challenge fallback"
```

### Docs (apps/docs)

Mintlify or Fumadocs default layout. NO custom design overhead in v1. Match accent color + font to brand only.

---

## Asset patterns

```yaml
assets:
  logo:
    primary: "/brand/logo-wordmark.svg"
    icon: "/brand/logo-mark.svg"           # square for favicon, social
    icon-mono: "/brand/logo-mark-mono.svg" # for footer / inverse contexts

  favicon:
    color: "{accent.primary}"
    bg: "{bg.primary}"
    shape: "monogram 'b' or stylized bracket-pair"

  og:
    dimensions: "1200x630"
    format: "PNG static (v1) OR runtime-rendered via Next.js OG image route (v1.5)"
    template: "dark bg + accent border + wordmark + tagline"
    domain: "bankstract.logickoder.dev (subdomain on owned logickoder.dev; ₦0 hosting). Pivot to standalone TLD post-first-B2B-contract revenue."
```

---

## Anti-AIy rule (the convergence trap)

Most 2026 dev SaaS reads identical because the same template stack ships everywhere. If bankstract-cloud looks like "ChatGPT could have generated this," the brand dies on arrival. Concrete rules to break the convergence:

### Forbidden defaults (the "AI SaaS template" tells)

```yaml
ai-slop-detection:
  color-defaults:
    - "shadcn zinc-950 / zinc-800 / zinc-400 baseline — INSTANT detection. Override every token, do not use shadcn's `--background` / `--foreground` defaults as-is."
    - "Purple-to-blue gradient text in hero H1 (Vercel template tell)"
    - "Cyan-pink gradient on CTA (Stripe-derivative tell)"
    - "Slate-* anywhere in production tokens"
  typography-defaults:
    - "Geist Sans + Inter combo (Vercel-default look, every Next.js app uses it). Fraunces locked precisely to avoid this."
    - "GT America / Söhne without license (you don't have the budget, and they're now the new generic)"
    - "Hero H1 that's auto-sized 'as big as possible' via Tailwind text-[clamp(...)] — every AI-generated landing does this"
  icon-defaults:
    - "Lucide React as the ONLY icon source. Used by ~90% of 2025+ Next.js SaaS. Smell-test: if your site looks like Cal.com's nav, you've drifted."
    - "Carbon / Heroicons — same issue, generic"
  layout-defaults:
    - "Magic UI bento-grid feature section — already saturated. Build custom asymmetric grid instead."
    - "Aceternity floating-sparkle hero w/ animated particles in <canvas> — overused by mid-2025"
    - "Floating-dashboard-screenshot-mockup below the hero copy — the most copied template move of 2024-25"
    - "Three-feature-cards-with-icon row — generic SaaS template fingerprint"
    - "Customer logo wall with 8+ generic SaaS startup logos — meaningless trust signal, ships nothing real"
  motion-defaults:
    - "Framer-motion fade-up cascade on every section scroll"
    - "Pulsing CTA button"
    - "Marquee scrolling logo strip on infinite loop"
  copy-defaults:
    - "Intelligent / agentic / supercharged / AI-powered / 10x / blazingly fast"
    - "'What's new' toast bottom-right that fades in after page load"
    - "Cmd+K search bar that does nothing or only searches the docs"
  ornamental-defaults:
    - "AI status badge in nav (with a green dot)"
    - "Soft drop shadows on every card (the universal `shadow-md` smell)"
    - "Rounded corners on everything (the universal `rounded-2xl` smell)"
```

### Required distinctness moves

```yaml
anti-ai-required:
  typography:
    - "Hero H1 = stacked, mixed weights/families (display + body weight contrast). NOT a single-line auto-clamped giant."
    - "Naira amounts ALWAYS JetBrains Mono. Visual law."
    - "At least one section uses editorial typographic rhythm (think Substack feature article, not SaaS landing). Indent first paragraph, drop cap on H1, mixed sizes."
    - "Tracking on display headers: `-0.04em` minimum. Default `tracking-normal` reads template-y."

  color:
    - "Burnt orange `#D2691E` is the SINGLE accent. No secondary accent. Do not introduce blue / purple / cyan even for `info` states."
    - "Status colors (`success / warning / error`) used ONLY in dashboard states. Never in marketing copy."
    - "Background uses true `#0a0a0a` or `#111418` — NOT shadcn `zinc-950` (`#09090b`). Slightly different shade matters for detection."

  layout:
    - "At least ONE asymmetric section per page. Right-heavy or left-heavy, NOT centered-symmetric."
    - "At least ONE section uses density (NOT generous whitespace). Pack info; trust the reader."
    - "Mixed corner-radius: cards `rounded-lg` (12px), buttons `rounded-md` (8px), pills `rounded-full`. Do not default everything to `rounded-2xl`."
    - "Hard edges OK. At least one section has zero rounding (full-bleed image strip or text band)."

  icons-and-illustration:
    - "Replace Lucide for the 5 brand-critical icons (parse / redact / reconcile / api key / usage). Hand-draw or commission. Lucide acceptable for utility icons (nav, settings)."
    - "Use real screenshots of parsed PDF → CSV transformation. NOT generic dashboard mockups."
    - "Bank logos appear ONLY in coverage matrix grid. Never in hero, never floating, never decorative."

  copy:
    - "Hero subhead leads with a concrete verb + concrete noun. 'Parse Nigerian bank statements via REST API' beats 'Statement intelligence for modern fintechs.'"
    - "At least ONE landing section uses an actual code block + actual JSON response, NOT a mocked stylized snippet."
    - "Stats / numbers are real or omitted. No 'Trusted by 100+ companies' placeholder. If you don't have the number, the section doesn't ship."
    - "Voice = direct + technical + Naija-aware. 'For when banks send PDFs and you needed CSV yesterday' beats 'Streamlined statement processing.'"

  motion:
    - "ONE signature animation total (hero PDF → CSV transformation). Everything else static-with-hover."
    - "No scroll-triggered fade-up cascade. Sections appear instantly on load."
    - "Hover transitions ≤ 150ms. No bouncy easing on buttons."

  voice-and-personality:
    - "Reference Nigerian banks by their colloquial names where appropriate ('first bank' lowercase, 'GTB' not 'Guaranty Trust Bank Plc')."
    - "Footer microcopy includes a concrete human note, not generic legal boilerplate. Example: 'Built in Lagos because every Nigerian dev has parsed a bank PDF by hand once.'"
    - "404 page has personality. Not 'Page not found.' — something specific."
    - "About page (if it exists) names the owner. Real person, real GitHub link. No 'Our team' anonymity."
```

### Smell-test rubric (run before any visual review)

```yaml
smell-test:
  red-flags:
    - "Could a model trained on dev-tool landings have generated this? If yes, distinctness fails."
    - "Does the hero look like Resend / Trigger / Convex / Knock side-by-side? If three or more visual elements match, drift detected."
    - "Is every section the same height / same internal layout? Add asymmetry."
    - "Does the page work without the burnt-orange accent? If yes, accent is decorative — make it functional (CTAs, code highlights, badge backgrounds)."
    - "Would removing the brand name leave a generic dev-tool landing? If yes, the brand isn't doing work."

  green-flags:
    - "A peer can identify this site from a single section screenshot."
    - "Section heights vary by ≥ 30% across the page."
    - "Hero contains at least one element that doesn't appear in Resend / Trigger / Convex / Knock."
    - "Copy contains at least one phrase you would not find in a Vercel template."
```

---

## Anti-patterns (DO NOT SHIP)

```yaml
anti-patterns:
  visual:
    - "Gradient buttons (purple→pink, blue→cyan, etc) — 2024 SaaS template tell"
    - "Glassmorphism / frosted-glass cards — overused, dates the design instantly"
    - "Centered-hero-symmetric-features layout — generic"
    - "Carousel sliders (testimonials, features) — 2014 dribbble cliché, kills accessibility"
    - "Lottie animations larger than icon size — kills FCP, almost always overkill"
    - "Auto-playing video heroes — bandwidth + autoplay-block fragility"
    - "3D rendered objects floating in hero (a la Resend spheres) — brand-equity-led, non-portable pre-launch"
    - "Pixel art / 8-bit decorative elements (a la Convex) — design budget too high for v1"
    - "Light-theme primary (a la Knock) — wrong category for OSS dev tool brand"

  copy:
    - "Marketing words: seamless, powerful, robust, blazingly fast, AI-powered, enterprise-grade"
    - "Pronouns: 'we', 'our' in upsell tone. Allowed only when referring to the team."
    - "Emojis in body copy, headers, button labels (only exception: bank-coverage-cell indicators)"
    - "We never see your data (LIE — we briefly do, ephemerally; use truthful framing)"
    - "Limited time offer, only X spots left — manipulative, never ships"

  interaction:
    - "Scroll-triggered fade-up cascade on every section — overused, hurts perceived perf"
    - "Pulse / breathing animation on CTAs — dark-pattern attention grabbing"
    - "Multi-step modal onboarding for the demo — single-route landing, no friction"
    - "Mandatory signup before demo parse — kills funnel; demo MUST be anonymous"

  performance:
    - "Client-side Markdown parsing (use Shiki SSR or markdown-it server)"
    - "Importing entire icon library (use tree-shaken individual imports)"
    - "Loading fonts via CSS @import (use next/font subset)"
```

---

## Visual references

```yaml
refs:
  primary:
    inngest.com:
      steal:
        - "Grainy starfield dark hero"
        - "Stacked H1 typography pairing"
        - "Right-aligned hero code snippet"
        - "Dual CTA (Start Building + Book a demo)"
        - "Mid-page before/after animated demo widget slot"
        - "CISO-style compliance call-out section"
        - "Framework badges row (Next.js / Node.js / Python)"
        - "Sparse confident sections with generous whitespace"
    trigger.dev:
      steal:
        - "Massive OSS-pride section (license + star count stats block)"
        - "Final dual-CTA outro (Get started free + Self-host)"
        - "'Reliable by default' code-examples 2-column section"
        - "Small (<10) customer logo wall"
        - "How-it-works 3-step section"
      do-not-steal:
        - "Lime green accent (use burnt orange)"

  single-section:
    resend.com:
      steal:
        - "'Integrate this afternoon' tabbed code-language section"
      do-not-steal:
        - "3D sphere / cube objects (brand-equity-led, non-portable)"
        - "Minimal brand-only hero (Resend is recognized; pre-launch we are not)"

dropped:
  convex.dev:
    reason: "Cream/beige hero + pixel art + isometric scenes = design budget too high for v1"
  knock.app:
    reason: "Light-theme primary + enterprise vibe + no OSS pride = wrong category"
  modal.com:
    reason: "Pivoted to AI infrastructure framing; no longer fits the OSS-engine-plus-Cloud shape"
```

---

## Tooling

```yaml
tools:
  framework: "Next.js 15 (App Router)"
  styling: "Tailwind v4"
  components: "shadcn/ui (base) + Magic UI (animated)"
  icons: "Lucide React (tree-shaken individual imports)"
  fonts: "next/font subset of Fraunces + JetBrains Mono + Inter"
  syntax-highlighting: "Shiki (server-side, vesper or vitesse-dark theme)"
  motion: "Framer Motion 11+ (only for hero PDF→CSV transformation; static elsewhere)"
  charts: "Tremor (dashboard usage)"
```

Lock these in `package.json` workspace root. Don't introduce styling alternatives (no styled-components, no Emotion, no CSS modules).

---

## Status

```yaml
status:
  draft: true
  applies-to: ["apps/marketing", "apps/app", "apps/demo", "packages/ui"]
  defers-to: ["apps/docs (Mintlify default theme, accent + font only)"]
  reviewer: "Jeffery Orazulike"
  open-issues:
    - "Lock Shiki theme — vesper vs vitesse-dark. Decide once accent appears against keyword colors."
    - "Monogram favicon — sketch 3 variants before picking"
    - "OG image — static PNG v1 vs Vercel OG runtime v1.5"
    - "Inter alternative — consider Geist Sans (Vercel) or default to Inter"
```

---

## Disclaimer

This is an opinionated spec for a single project. Not a general-purpose design system. Not exported as tokens-only artifact. Lives next to the code that consumes it.

If a design decision lands without updating this file, the file is wrong, not the decision. Edit + commit.
