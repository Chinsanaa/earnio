# Earnio Design System

→ UI routes & landing: [../../docs/FRONTEND.md](../../docs/FRONTEND.md) · Frontend folder: [../README.md](../README.md)

**Style:** "Solid Pop" · Electric blue on warm paper · ink outlines · flat pop accents · Gen Z  
**Mode:** Light + dark (full parity)

## Brand identity

Earnio uses a single electric-blue identity: **Earnio Blue `#2E5BFF`** (azure) paired with a cool slate neutral ramp, money-green for credits, and a cyan "spark" accent used only as a highlight.

## Colors

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#2E5BFF` (Earnio Blue) | `#5C7DFF` |
| Accent / spark | `#12C2F3` (cyan) | `#3FD6FF` |
| Background | `#F5F3EE` (warm paper) | `#0B1220` |
| Surface / card | `#FFFFFF` | `#141C2C` |
| Foreground / ink | `#0B1220` | `#F4F7FC` |
| Muted text | `#5A6A85` | `#8492A8` |
| Border | `#D7DEEA` | `#27324A` |
| Success | `#10B981` | `#34D399` |
| Danger | `#F0455A` | `#F87171` |

**Fills vs. text.** The colors above are tuned as *fills* (buttons, chips, icons, graphics) — several fail WCAG AA as small text on their own (e.g. `#12C2F3` on white is 2.0:1). For text, use the paired accessible variant instead of the fill color directly:

| Text token | Light | Dark | Use instead of |
|------------|-------|------|-----------------|
| `--accent-text` | `#0E7490` | `#3FD6FF` (= accent) | `--accent` as text color |
| `--success-text` | `#047857` | `#34D399` (= success) | `--success` as text color |
| `--destructive-text` | `#D11F38` | `#F87171` (= destructive) | `--destructive` as text color |
| `--primary-foreground` | `#FFFFFF` | `#0B1220` | text/icons placed *on* a `--primary` fill |
| `--destructive-fill-foreground` | `#FFFFFF` | `#0B1220` | text/icons placed *on* a `--destructive-fill` button |

Note the dark values above mostly equal the fill color as-is (it's already light enough to read as text on a dark card); the light values are the real correction. All pairs are verified with `lib/design/contrast.ts` and enforced by `lib/design/designSystem.test.ts` — see CLAUDE.md's "Design system rules."

### Solid colors only (no gradients)

**Gradients are banned** everywhere: CSS `*-gradient()`, Tailwind `bg-gradient-*` / `from-*` / `via-*` / `to-*`, gradient text (`bg-clip-text`), and SVG `<linearGradient>` / `<radialGradient>` (including Recharts). Rule 4 in `lib/design/designSystem.test.ts` enforces this in CI. Blur/frosted glass is also retired: every surface is one flat color.

### Solid Pop accents

Flat fills, identical in both themes, always paired with **ink text** (`--pop-foreground: #0B1220`). Each has one job.

| Token | Value | Ink contrast | Use |
|-------|-------|--------------|-----|
| `--pop-lime` | `#C6F432` | 14.6:1 | Money, active nav, progress, primary highlight |
| `--pop-sun` | `#FFD23F` | 13.0:1 | Pending, highlight, 404 |
| `--pop-coral` | `#FF6B4A` | 6.7:1 | Danger / trend down |
| `--pop-lilac` | `#B9A6FF` | 8.9:1 | Sponsors, creative |
| `--pop-mint` | `#7EE8C4` | 12.7:1 | Success / approved |
| `--pop-sky` | `#8FB3FF` | 9.4:1 | Info |

### Outlines and hard shadows

Depth is "sticker" style: a 2px outline plus a **zero-blur offset shadow**.

| Token | Light | Dark |
|-------|-------|------|
| `--outline` | `#0B1220` | `#606F8A` |
| `--shadow-ink` | `#0B1220` | `#3C4A66` |
| `--shadow-hard-sm` / `--shadow-hard` / `--shadow-hard-lg` | `2px` / `4px` / `6px` offset | same offsets |
| `--border-width` | `2px` | `2px` |
| `--press-offset` | `2px` (buttons translate into their shadow on press) | same |

Tables and dense lists keep 1px `--border` dividers and no hard shadow.

## Typography

- **Display / headings:** **Space Grotesk** (400–700), tight tracking (`-0.02em` to `-0.035em`). CSS var: `--font-display`. Tailwind: `font-display`.
- **Body / UI:** **Plus Jakarta Sans** (400–800), friendly and legible. CSS var: `--font-sans`. Tailwind: `font-sans` (default body font).
- **Stats / numerals:** **JetBrains Mono** (400–600), tabular figures. CSS var: `--font-mono`. Tailwind: `font-mono`.

## Spacing & radii

Base unit: **4px**. Border radius base: **8px**.

Each token below maps 1:1 to the identically-named Tailwind `rounded-*` utility
(wired in `tailwind.config.ts`'s `borderRadius` extension) — e.g. `--radius-xl`
is exactly `rounded-xl`, not a different Tailwind size key.

| Token | Tailwind class | Value | Used for |
|-------|---------------|-------|----------|
| `--radius-xs` | `rounded-xs` | 6px | small chips |
| `--radius-sm` | `rounded-sm` | 8px | inputs |
| `--radius-md` | `rounded-md` | 12px | buttons, rows |
| `--radius-lg` | `rounded-lg` | 16px | cards |
| `--radius-xl` | `rounded-xl` | 20px | panels |
| `--radius-2xl` | `rounded-2xl` | 28px | hero cards |
| `--radius-full` | `rounded-full` | 999px | pills, avatars |

## Shadows

Cool navy-tinted (not grey). Brand glow reserved for primary CTAs only.

| Token | Use |
|-------|-----|
| `--shadow-sm` | Subtle cards and panels |
| `--shadow-md` | Elevated panels |
| `--shadow-glow` | Blue glow on primary actions |
| `--shadow-brand` | Hero CTA spotlight |

## Effects & motion

- **Default easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out)
- **Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — toggles, badges
- **Durations:** 140ms fast · 220ms base · 360ms slow
- **Hover:** color darkens one step + `translateY(-1px)` lift
- **Press:** `scale(0.97–0.98)` squeeze
- **Focus ring:** 3px `color-mix(in srgb, #2E5BFF 28%, transparent)`
- **Page enter:** `fade-up` animation (`.animate-fade-up`)

## Component classes (globals.css)

All existing class names are preserved. The `:root` tokens have been repointed to the Earnio Blue palette — `var(--primary)` is now `#2E5BFF`, `var(--background)` is `#F7FAFF`, etc. No component JSX changes are needed; token values change, class names stay the same.

Key classes:

| Class | Role |
|-------|------|
| `.mesh-bg` | Flat page background on `<body>` (legacy name) |
| `.btn-primary` | Earnio Blue pill button |
| `.btn-secondary` | Bordered white pill |
| `.landing-btn-dark` | Ink-dark pill (secondary on landing) |
| `.creator-panel` / `.creator-panel-lg` | Solid outlined card for app content |
| `.creator-hero-card` | Hero card with solid lime top-bar |
| `.stat-card` | Dashboard stat panel, hard shadow grows on hover |
| `.auth-card` | Solid outlined auth container |
| `.pop-outline` / `.pop-shadow` / `.pop-press` | Sticker outline, hard shadow, tactile press |
| `.bg-pop-*` | Solid pop fill with ink text |
| `.font-display` | Apply Space Grotesk |
| `.font-mono-stat` | Apply JetBrains Mono for numbers |

## Iconography

**Lucide** — clean open-source line set, ~1.75px stroke, rounded caps. Load from CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="wallet"></i>
<script>lucide.createIcons()</script>
```

Platform icons (TikTok / YouTube / Instagram) use official brand glyphs in brand colors. Emoji are not used as iconography.

## Logo mark

The Earnio mark is a **rising-trend arrow** — a geometric path going up-right with a cyan circle at the base. Defined in `components/brand/EarnioLogo.tsx` (`EarnioMark` component). Also available as static SVGs in `public/logo/`:

- `earnio-mark.svg` — tile version
- `earnio-mark-mono.svg` — `currentColor` monochrome

## Keeping this system correct

- **`app/globals.css` is canonical.** This file (`design-system/`) mirrors it for standalone handoff. When a token value changes in `globals.css`, update it here too.
- **A CI-blocking test enforces dark-mode correctness** — see `frontend/lib/design/designSystem.test.ts` and CLAUDE.md's "Design system rules." It checks token contrast, bans hardcoded colors outside `:root`/`.dark`, flags light-mode-only Tailwind utilities missing a `dark:` pair, and bans gradients. Run `cd frontend && npm test` before shipping a design change.

## Anti-patterns

- Rose / pink / coral as primary (removed in this rebrand)
- Purple-on-white generic SaaS look
- Gradients of any kind (CSS, Tailwind, SVG, charts)
- Frosted glass / backdrop blur
- Emoji as icons
- Mixing Lucide with other icon families

## Source

Designed in Claude Design and exported as a design system handoff. Full prototype files (specimen cards, component demos, iOS and web UI kits) are in `frontend/design-system/earnio-ds/`.

GitHub source: https://github.com/Chinsanaa/creator-toolkit
