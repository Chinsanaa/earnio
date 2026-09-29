# Earnio Design System

> **Earn more, create more.** The brand and product design system for **Earnio** — a creator-economy platform that helps Mongolian creators find brand deals, track earnings across TikTok / YouTube / Instagram, and get paid to their local bank.

This repository is a self-contained design system: brand assets, design tokens (CSS custom properties + webfonts), reusable React UI primitives, and high-fidelity UI-kit recreations of the real product surfaces. Linking the single root `styles.css` gives any consumer the full Earnio look.

---

## Sources

This system was built from the product codebase, plus a brand brief for a refreshed logo.

- **GitHub — product codebase:** [`Chinsanaa/creator-toolkit`](https://github.com/Chinsanaa/creator-toolkit)
  - `frontend/app/globals.css` — original token + utility definitions (Tailwind v4)
  - `frontend/design-system/MASTER.md` — the product's own design spec
  - `frontend/lib/brand/earnio.ts` — brand constants (name, slogan, primary `#2E5BFF`)
  - `frontend/lib/landing/content.ts` — landing copy & voice
  - `frontend/components/**` & `frontend/app/**` — dashboard, wallet, sponsorships, platforms, auth, landing
- **Brand brief:** the "Fragmented Growth" logo identity — three ascending squares with a fixed opacity fade.

Readers with access should explore the repo above to build richer, more accurate Earnio designs. (Note: the repo README shows an older purple palette; the source of truth is the **blue** `#2E5BFF` confirmed in `lib/brand/earnio.ts` and the logo brief — this system uses blue.)

---

## Content fundamentals

How Earnio writes.

- **Voice:** warm, direct, creator-first. Speaks to the creator as **"you"** ("You earned ₮3,200,000 this month"). Earnio refers to itself as **"Earnio"** or "we", never corporate-stiff.
- **Tone:** optimistic and energetic but practical — momentum without hype. Benefit-led, concrete, money-focused.
- **Casing:** **Sentence case** everywhere — headings, buttons, nav ("Start earning", not "Start Earning"). The wordmark is "Earnio", never "EARNIO". Eyebrows/labels are the one exception: UPPERCASE with wide tracking.
- **Tagline:** *Earn more, create more.* — used as the hero and signature line.
- **Numbers & money:** always concrete. Mongolian tögrög `₮` with grouped digits (`₮3,200,000`) or compact (`₮3.2M`) in tight tiles. USD shown as an approximate aside ("≈ $3,560"). Growth as signed percent ("+18.4%").
- **Emoji:** rare and intentional — a single friendly 👋 in a dashboard greeting is on-brand; emoji are **never** used as UI icons or to carry meaning.
- **Specifics:** real local references — Khan Bank, Golomt, TDB; brands like Gobi Cashmere, Unitel, MCS Coca-Cola; platforms TikTok / YouTube / Instagram. Avoid vague filler.
- **Example copy:** "One place to find brand deals, track earnings, and get paid to your Mongolian bank." · "Three steps to your first payout." · "Verified brand deals — clear briefs, agreed rates, on-time payment."

---

## Visual foundations

- **Color:** a small palette: **Earnio Blue `#2E5BFF`**, an ink ramp (`#0B1220` → `#F4F7FC`), cool off-white neutrals, and calm tints (soft blue, slate; green/red reserved for success/danger). No neon, no yellow. Full **dark theme** under `.dark`.
- **No gradients, ever.** Solid colors only ("Solid Pop"). Enforced by rule 4 in `lib/design/designSystem.test.ts`.
- **Backgrounds:** flat cool off-white `#F6F7F9` (light) / ink `#0B1220` (dark). Accent color comes from Earnio Blue plus a few calm tints (`--tint-blue`, `--tint-slate`; `--tint-green`/`--tint-red` for status only). No neon, no yellow.
- **Type:** **Space Grotesk** for display/headings (bold, geometric, characterful; tight tracking around −0.02em to −0.035em), **Plus Jakarta Sans** for body & UI, **JetBrains Mono** for all numerals/currency (tabular figures). All three are genuine Google Fonts — the live app loads them via `next/font/google` in `app/layout.tsx`; `tokens/fonts.css` mirrors the same three families for standalone use.
- **Corner radii:** soft but not pill-everywhere — inputs 8px, buttons/rows 12px, cards 16px, panels 20px, hero cards 28px. Pills (`9999px`) are reserved for landing CTAs and chips/badges.
- **Cards:** solid white (light) / `#141C2C` (dark) with a **2px `--outline`** and a **hard offset shadow** (`--shadow-hard-sm`, zero blur). The hero card carries a solid soft-blue top-bar.
- **Shadows:** hard offset only: `2px`/`4px`/`6px` in `--shadow-ink`. No blur, no glow.
- **Hover / press:** buttons lift `-1px` and grow their hard shadow on hover, then **press into the shadow** (`translate(2px, 2px)`, shadow removed). Transitions are quick (140–220ms) on the `--ease-out` curve.
- **Motion:** restrained. A gentle `fade-up` entrance and an infinite `landing-float` on hero accents — **gated behind `prefers-reduced-motion: no-preference` with a visible base state** so content never hides. Easing `cubic-bezier(0.22,1,0.36,1)`; an optional spring for playful accents.
- **Transparency & blur:** retired. Only the modal scrim (`--overlay-scrim`) is translucent.
- **Spacing & layout:** 4px base unit. Landing max-width 1280px, app content 1152px. Generous 88–96px section rhythm on marketing; 28px gutters in-app.

---

## Iconography

- **System:** [**Lucide**](https://lucide.dev) — open line icons, ~1.75px stroke, rounded caps. Loaded from CDN (`https://unpkg.com/lucide@latest`) and rendered with `<i data-lucide="wallet"></i>` then `lucide.createIcons({ attrs: { 'stroke-width': 1.75 } })`. *(Substitution note: the source repo used inline SVGs; Lucide is the closest open match in stroke weight & style and is what this system standardizes on — flag if the team prefers a specific set.)*
- **Common glyphs:** `home`, `wallet`, `megaphone`, `link`, `trending-up`, `bar-chart-3`, `shield-check`, `banknote`, `sparkles`, `bell`, `search`, `arrow-up-right`, `arrow-down-left`, `circle-dollar-sign`.
- **Platform marks:** TikTok / YouTube / Instagram / Facebook are represented by their **brand color tiles** in the kits; use official brand glyphs in production (do not redraw).
- **Logo:** the three-square **Fragmented Growth** mark — see `assets/` and the `EarnioLogo` / `EarnioMark` components. The **100 / 85 / 70 opacity fade** across the ascending squares is the defining signature and must never be flattened. Sharp 90° corners, solid fills, no strokes/shadows.
- **Emoji:** not used as icons (see Content fundamentals).

---

## Index / manifest

**Root**
- `styles.css` — single entry point; `@import`s every token + font file. Consumers link this.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `base.css` (resets + `.btn-*` / `.card` / `.stat-card` / `.creator-panel` utility classes).
- `assets/` — `earnio-mark.svg`, `earnio-mark-mono.svg`, `earnio-logo-full.svg`, `earnio-logo-white.svg`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.
- `SKILL.md` — Agent-Skill manifest for use in Claude Code.

**Components** (`components/`, namespace `window.LogoDesignSystem_dc608d`)
- `brand/` — `EarnioLogo`, `EarnioMark`
- `core/` — `Button`, `Badge`, `StatCard`, `Panel`, `Input`, `Avatar`, `ProgressBar`

**UI kits**
- _None._ This system is scoped to the **logo & brand identity** — the marketing-site and creator-app kits were removed at the team's request. The brand primitives below cover logo usage; ask if you want product UI kits rebuilt.

Each component ships a `.d.ts` (props contract) and `.prompt.md` (usage). The compiler generates `_ds_bundle.js`, `_ds_manifest.json`, and `_adherence.oxlintrc.json` — do not edit those by hand.
