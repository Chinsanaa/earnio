# Earnio Design Refresh Plan: "Solid Pop"

> Status: **Implemented** (all phases). Written September 2026. Open questions resolved with defaults (see section 7).

## Progress

- [x] Phase 0: gradient guardrail (rule 4 in `designSystem.test.ts`)
- [x] Phase 1: Solid Pop tokens, gradients/mesh/glass removed, design-system mirrored
- [x] Phase 2: primitives (Button variants, Card, Badge tones, Input, Dialog, Sheet, Tooltip, Tabs, DropdownMenu, Toaster, NumberTicker)
- [x] Phase 3: shells + nav (Cmd/Ctrl+K command palette, lime active nav, bottom tab bar sized per role)
- [x] Phase 4: creator screens (animated totals, platform bento, onboarding checklist, payout review sheet/dialog, filter chips, empty states)
- [x] Phase 5: sponsor + landing (pop chart + badges, review-now card, A/R review shortcuts, lime marquee, bento features, sticker testimonials, scroll reveal)
- [x] Phase 6: polish (dark-mode fixes, token cleanup, `text-white` CI guard, reduced-motion + keyboard + MN checks, docs)

## TL;DR

- **Direction:** bold, flat, **solid-color blocks** ("color blocking") with thick ink outlines and hard offset shadows. Playful for Gen Z, still readable for money screens.
- **Hard rule:** **zero gradients** anywhere (CSS, Tailwind, SVG, charts). A new CI test enforces it.
- **Libraries:** copy-paste component sources (shadcn/ui registry style) so we own the code and can strip gradients. Motion for animation. No big runtime UI kit.
- **UX focus:** faster feedback (toasts, optimistic UI, skeletons), clearer money flows, mobile bottom nav, command palette, better empty states.
- **Six phases**, each shippable on its own and gated by `lint + test + build`.

---

## 1. Where we are today (audit)

| Area | Finding | Source |
|------|---------|--------|
| Tokens | Solid blue identity (`#2E5BFF`) + slate neutrals, full light/dark parity | `frontend/app/globals.css` `:root` / `.dark` |
| Gradients | **About a dozen gradient uses** in `globals.css` (mesh background, landing bg, creator hero, progress bars, `.text-gradient`, glows) | `grep gradient frontend/app/globals.css` |
| Glass | Translucent "glass" surfaces + `backdrop-blur` in shells and landing | `--glass-*` tokens, 5 usages in `.tsx` |
| Components | Only 9 primitives in `components/ui/` (button, card, badge, table, skeleton, spinner...). No dialog, toast, tooltip, tabs, dropdown primitives | `frontend/components/ui/` |
| Buttons | 3 variants, hover is just `opacity-90` (little feedback) | `components/ui/button.tsx` |
| Guardrails | Good: CI test enforces contrast + no raw colors. Missing: no rule against gradients | `lib/design/designSystem.test.ts` |

**Why it feels "plain":** one blue on white, low-contrast pastel mesh, thin 1px borders, soft shadows, and little motion. Everything has the same visual weight, so nothing pops.

---

## 2. Visual direction: "Solid Pop"

**Analogy:** think of a sticker sheet or a Gen Z zine. Flat paper, bright solid stickers, bold black outlines. Money numbers are the loudest thing on screen.

### 2.1 Principles

1. **Solid fills only.** Every surface is one flat color. Depth comes from **hard offset shadows** (e.g. `4px 4px 0 var(--ink)`) and borders, not blur or gradients.
2. **Color = meaning.** Each accent has one job (money, platform, status). No decorative color.
3. **Big type, big numbers.** MNT amounts in large tabular mono. Headings bolder and tighter.
4. **Tactile motion.** Buttons "press down" into their shadow. Cards lift on hover. Numbers count up. All respect `prefers-reduced-motion`.
5. **Calm where it matters.** Wallet/payout forms stay quieter (fewer accents) so trust is not traded for flash.

### 2.2 Proposed palette (all solid, contrast measured)

Measured with the WCAG formula (same math as `lib/design/contrast.ts`). AA needs 4.5:1 for text.

| Role | Token | Light | Text on it | Ratio |
|------|-------|-------|-----------|-------|
| Page background | `--background` | `#F5F3EE` (warm paper) | ink `#0B1220` | 16.9 |
| Primary (brand) | `--primary` | `#2E5BFF` (keep Earnio Blue) | white | 5.2 |
| Money / success pop | `--pop-lime` | `#C6F432` | ink | 14.6 |
| Highlight | `--pop-sun` | `#FFD23F` | ink | 13.0 |
| Energy / alerts | `--pop-coral` | `#FF6B4A` | ink | 6.7 |
| Creative / sponsor | `--pop-lilac` | `#B9A6FF` | ink | 8.9 |
| Calm / info | `--pop-mint` | `#7EE8C4` | ink | 12.7 |
| Muted text | `--muted` | `#5A6A85` on paper | n/a | 4.9 |

**Dark mode:** ink background `#0B1220`, cards `#1A2335` with **light** text (14.6:1). The pop colors stay the same fills but always carry **ink** text (never light text on them). Outlines switch to a light ink so hard shadows stay visible.

> Note: `#0B1220` on `#1A2335` is only 1.19:1, so dark cards must be separated by a **visible border token**, not by color difference alone. Add this pair to `CONTRAST_CHECKS` as a UI-boundary (3:1) check on the border.

### 2.3 Other tokens

| Token group | Change |
|-------------|--------|
| Borders | `--border-width: 2px`, `--outline-ink` (ink `#0B1220` in light, solid light slate in dark) |
| Shadows | Replace blurred shadows with `--shadow-hard-sm: 2px 2px 0`, `--shadow-hard: 4px 4px 0`, `--shadow-hard-lg: 6px 6px 0` using the outline color |
| Radii | Slightly tighter: cards 16px, buttons 12px, chips full |
| Type | Keep Space Grotesk (display) + Plus Jakarta Sans (body) + JetBrains Mono (numbers). Increase display weight to 700 and scale (see Phase 1) |
| Motion | Keep `--ease-out` / `--ease-spring`; add `--press-offset: 2px` for button press |

---

## 3. Library strategy

**Key trade-off:** most "stunning" libraries rely heavily on gradients, glows, and blur. So we **cherry-pick copy-paste components and restyle them**, rather than installing a full kit.

| Library | What we would use it for | Fit with "no gradients" | Cost | Verdict |
|---------|--------------------------|-------------------------|------|---------|
| **shadcn/ui** (+ Radix) | Base primitives: Dialog, Sheet, Tooltip, Tabs, Dropdown, Popover, Select | Neutral, fully restylable | Free | **Adopt** (foundation) |
| **Motion** (`motion/react`) | Press/hover, layout transitions, number count-up, page enter | No visual opinion | Free | **Adopt** |
| **Vengeance UI** | Selected animated pieces (animated tooltips, scroll cards, testimonial blocks) for landing | Some effects use gradients, must be stripped | Free, CLI copies source | **Cherry-pick** |
| **Skiper UI** | "Uncommon" interaction pieces for landing/hero | Mixed | ~24 free, premium tier paid ($129 one-time) | **Free pieces only**, unless you want to buy |
| **Magic UI** | Marquee (brand logos), Number Ticker, Bento Grid | Several components ship with gradients/shine | Free core | **Cherry-pick, restyle** |
| **React Bits** | Text animations for landing headline | Some backgrounds are gradient/shader based, skip those | Free | **Cherry-pick text only** |
| **Aceternity UI** | Very gradient/glow-heavy by design | Poor fit | Free + paid | **Skip** |
| **Sonner** | Toast notifications | Restylable | Free | **Adopt** |
| **Vaul** | Mobile bottom-sheet drawers (payout, filters) | Restylable | Free | **Adopt** |
| **cmdk** | Command palette (Ctrl/Cmd+K) | Restylable | Free | **Adopt** |

Rules for anything we copy in:
- Lives in `frontend/components/ui/` as our own source.
- Colors through tokens only (existing CI rule 2/3).
- Remove every gradient, blur glow, and shimmer before merge (new CI rule 4).

---

## 4. UX improvements (the part users feel)

**Key terms:** *optimistic UI* = update the screen instantly, then confirm with the server. *Empty state* = what a screen shows when there is no data yet.

### Creator app
- **Dashboard:** one hero stat (total MNT earned, count-up), then a bento grid of platform tiles, each in its own solid pop color. Clear "next action" card (e.g. "Connect Instagram to earn more").
- **Onboarding checklist:** 3-step progress (connect platform, apply to a campaign, request payout) with solid segmented progress bar (no gradient).
- **Sponsorships:** filter chips, card grid with brand color block header, one-tap apply with optimistic state + toast.
- **Wallet:** big balance, payout flow in a bottom sheet on mobile (Vaul), confirmation step that clearly shows 80/20 split.

### Sponsor app
- Campaign cards with status color chips, application review as a swipeable/keyboard-friendly list (approve = `A`, reject = `R`).

### Everywhere
- **Mobile bottom nav** (thumb reach) replacing sidebar on small screens.
- **Command palette** (Cmd/Ctrl+K): jump to pages, "request payout", "new campaign".
- **Toasts** for every mutation (success + clear error text).
- **Skeletons** that match final layout (no layout jump).
- **Empty states** with a flat illustration + one primary action.
- **Focus rings** that are visible (hard 2px outline in `--ring`), full keyboard support.
- **Reduced motion** respected for every animation.
- **EN/MN**: check that bigger type still fits Mongolian strings (they run longer).

---

## 5. Phased rollout

Each phase = one PR. Each PR must pass `cd frontend && npm run lint && npm test && npm run build`.

| Phase | Scope | Main files | Done when |
|-------|-------|-----------|-----------|
| **0. Guardrail** | Add CI rule 4: no `gradient(` in `globals.css` / `design-system/`, no `bg-gradient-*`, `bg-linear-*`, `from-*/via-*/to-*` in `.tsx`, no `<linearGradient>`/`<radialGradient>` in SVG/Recharts. Test fails on today's code, which is expected | `lib/design/designSystem.test.ts` | Test written, marked to go green in Phase 1 |
| **1. Tokens** | New palette, hard shadows, border width, type scale. Remove all gradients, mesh, glass. Mirror to `design-system/` + `MASTER.md` | `globals.css`, `tailwind.config.ts`, `design-system/*` | All 4 design rules green, light + dark |
| **2. Primitives** | Rebuild Button (press effect, new variants: `pop`, `outline`, `ghost`, `danger`), Card, Badge, Input. Add Dialog, Sheet, Tooltip, Tabs, Dropdown, Toast, Skeleton v2 | `components/ui/*` | Unit tests for variants; visual check in both themes |
| **3. Shells + nav** | Creator/Sponsor shells in solid style, mobile bottom nav, command palette | `components/layout/*` | Keyboard + mobile (375px) check |
| **4. Creator screens** | Dashboard bento, onboarding checklist, sponsorships, wallet flow | `app/dashboard`, `app/sponsorships`, `app/wallet`, `components/creator/*` | Smoke test + Playwright screenshots |
| **5. Sponsor + landing** | Sponsor screens, landing hero, marquee, testimonials, FAQ | `app/sponsor`, `components/landing/*` | Lighthouse a11y >= 95 on landing |
| **6. Polish** | Motion pass, empty states, reduced-motion audit, EN/MN overflow check, docs update | all | QA checklist in `docs/QA_MANUAL_CHECKLIST.md` passes |

---

## 6. Risks and trade-offs

- **Loud colors can hurt trust on money screens.** Mitigation: wallet/payout uses mostly neutrals + one accent.
- **Hard shadows + thick borders look heavy on dense tables.** Mitigation: tables use 1px dividers, no hard shadow.
- **New dependencies add bundle weight.** Motion is the biggest. Mitigation: import from `motion/react` per component, lazy-load the command palette.
- **Copy-paste libraries go stale** (no auto-updates). Accepted: we own and restyle the code anyway.
- **Scope:** this is a visual/UX refresh only. No new product features beyond `instructions.md`. Onboarding checklist and command palette only link to existing flows.

---

## 7. Open questions (resolved with defaults)

Decided: remove glass/blur; warm paper background; Skiper UI free pieces only; medium outline intensity (cards, buttons, inputs, chips; tables keep 1px dividers).


1. **Glass/blur:** blur is not a gradient, but it is not "solid" either. Plan assumes **remove it**. OK?
2. **Background:** warm paper `#F5F3EE` or keep cool `#F7FAFF`?
3. **Skiper UI premium:** free components only, or buy the paid tier?
4. **Brutalist intensity:** full thick outlines everywhere, or only on cards/buttons (softer)?

## Sources

- Vengeance UI overview: <https://next.jqueryscript.net/next-js/vengeance-ui/>
- Skiper UI docs and pricing: <https://skiper-ui.com/docs/quick-start>, <https://tailkits.com/components/skiper-ui/>
- Animated React library comparison 2026: <https://ui.spectrumhq.in/best-animated-react-component-libraries>

## Known follow-ups (not done)

- **Cyrillic fonts:** `app/layout.tsx` loads Space Grotesk / Plus Jakarta Sans / JetBrains Mono with the `latin` subset only, so Mongolian text falls back to a system font. This predates the refresh. Check which subsets each family ships before adding them (an unsupported subset fails the build).
- Unused legacy `components/layout/AppShell.tsx` could be deleted.
