# Frontend UI Guide

Landing pages, auth flows, and marketing UI for **Earnio**. Folder layout: [../frontend/README.md](../frontend/README.md). Design tokens: [../frontend/design-system/MASTER.md](../frontend/design-system/MASTER.md).

**Brand:** Earnio — *Earn more, create more*. Constants in `frontend/lib/brand/earnio.ts`.

---

## Product purpose

**Earnio** serves two audiences:

| Audience | Landing | Auth | App shell |
|----------|---------|------|-----------|
| **Creators** | `/` | `/login/creator`, `/signup/creator` | Dashboard, platforms, deals, wallet |
| **Brands (sponsors)** | `/brands` | `/login/sponsor`, `/signup/sponsor` | Sponsor dashboard, campaigns |

Creators track TikTok/YouTube earnings, find sponsorships, and get paid in MNT. Brands post campaigns and review creator applications.

---

## Landing pages

Two audience-specific marketing pages. Creator page follows [SideShift creators](https://sideshift.app/creators) layout; brand page keeps the original hero + sections UI.

| Route | Audience | Component |
|-------|----------|-----------|
| `/` | Creator | `CreatorLandingPage` — scroll nav, features, testimonials, FAQ |
| `/brands` | Brand / sponsor | `BrandLandingPage` — original layout, app-route nav |

Config: `frontend/lib/landing/content.ts`

### Page regions

| Region | Component | Purpose |
|--------|-----------|---------|
| Header | `LandingNav` | Sticky nav, audience switcher, login, signup CTA |
| Hero | inline + `HeroIllustration` | Headline, value prop, primary CTA |
| How it works | `HowItWorks` | 4-step walkthrough + CTAs |
| Footer | inline | Docs, login, signup links |

### Visual identity (landing + auth)

**"Solid Pop"** (see [`DESIGN_REFRESH_PLAN.md`](./DESIGN_REFRESH_PLAN.md) and `frontend/design-system/MASTER.md`): flat cool off-white, ink outlines, hard offset shadows, and a small calm palette (Earnio Blue + blue/slate tints; green/red only for status; no neon, no yellow). **No gradients** anywhere (CI rule 4 in `lib/design/designSystem.test.ts`).

| Token | Value | Usage |
|-------|-------|-------|
| `--landing-fg` | `#0B1220` | Headlines, ink buttons, auth logo |
| `--landing-muted` | `#5A6A85` | Body copy, labels |
| `--landing-bg-top` / `--landing-bg-bottom` | `#F6F7F9` | Flat page background (cool off-white) |
| `--tint-blue` / `--tint-slate` | calm fills | Tiles, highlights, active states (text: `--tint-foreground`) |
| `--tint-green` / `--tint-red` | calm fills | Success / danger status only |
| `--primary` | `#2E5BFF` | Primary CTA buttons, links, active states |
| `--accent` | `#12C2F3` | Spark cyan — use sparingly as a highlight |

**Buttons:** `.landing-btn-pop` (solid Earnio Blue, hero CTA), `.landing-btn-dark` (ink pill), `.landing-btn-light` (white pill). In the app use `Button` from `components/ui/button` (`default`, `pop`, `outline`, `ghost`, `danger`); all press into their hard shadow.

**Landing sections:** sticker eyebrow + `.landing-display` headline, `Marquee` (soft-blue band), `HowItWorks` (color-coded steps), `CreatorFeatures` (bento), `CreatorTestimonials` (sticker cards), `CreatorFaq` (soft blue when open). Section entrances use `components/ui/reveal.tsx`.

---

## Landing navigation and CTAs

### Creator landing (`/`)

Nav links scroll to on-page sections (no app-route jumps).

| Element | Destination | Behavior |
|---------|-------------|----------|
| Logo | `/` | Creator home |
| **How it works** | `#how-it-works` | Scroll to steps |
| **Features** | `#features` | Scroll to dashboard features |
| **FAQ** | `#faq` | Scroll to FAQ |
| **For Brands** | `/brands` | Switch to brand landing |
| **Log in** | `/login/creator` | Creator sign-in form |
| **Get started** | `/signup/creator` | Creator signup form |
| Hero **Explore sponsorships** | `#features` | Scroll to features |

### Brand landing (`/brands`)

| Element | Destination | Behavior |
|---------|-------------|----------|
| Logo | `/brands` | Brand home |
| Campaigns / Dashboard / Resources | Sponsor routes / `/docs` | Product preview (auth may be required) |
| **For Creators** | `/` | Switch to creator landing |
| **Log in** | `/login/sponsor` | Sponsor sign-in form |
| **Get started** | `/signup/sponsor` | Sponsor signup form |

Brand nav uses app-route links (Campaigns, Dashboard, Resources) with chevrons — previous UI.

### Hero, footer, and section CTAs

No “free trial” copy. Creator CTAs use **Get started**; brand uses **Get started** for sponsor signup.

`/login` and `/signup` redirect to creator auth (`/login/creator`, `/signup/creator`).

---

## Authentication flows

Auth uses the flat landing background (`.landing-page.auth-layout`) and `.auth-card` styling.

```
Creator path                    Brand path
────────────                    ──────────
/  (landing)                    /brands (landing)
    │                               │
    ├─ /login/creator               ├─ /login/sponsor
    └─ /signup/creator              └─ /signup/sponsor
            │                               │
            ▼                               ▼
      /dashboard                    /sponsor/dashboard
```

### Auth forms (`AuthForm`)

| Page | Redirect after login/signup |
|------|----------------------------|
| `/login/creator` | `/dashboard` |
| `/signup/creator` | `/dashboard` |
| `/login/sponsor` | `/sponsor/dashboard` |
| `/signup/sponsor` | `/sponsor/dashboard` |

**Back links:** `AuthTypeBackLink` — creators return to `/`, brands to `/brands`.

### Auth UI classes

| Class | Role |
|-------|------|
| `.auth-card` | Solid card with ink outline and hard shadow |
| `.auth-input` | Sky-bordered inputs, dark focus ring |
| `.auth-link` | Near-black text links |
| `.landing-btn-dark.auth-submit` | Full-width submit button |

### Password Reset Flow

**Routes:** `/forgot-password` (unauthenticated) → `/reset-password?token=xxx&email=...` (unauthenticated)

| Step | Page | Component | Action |
|------|------|-----------|--------|
| 1 | `/login/creator` or `/login/sponsor` | `AuthForm` | User clicks "Forgot password?" link |
| 2 | `/forgot-password` | `ForgotPasswordForm` | Submits email; shows "Check your email" message |
| 3 | Email | Reset link | User clicks link in email with token + email params |
| 4 | `/reset-password` | `ResetPasswordForm` | Verifies token on mount; shows countdown (60 min) |
| 5 | `/reset-password` | `ResetPasswordForm` | Submits new password; auto-logs in on success |
| 6 | `/dashboard` | App redirects | Redirected to correct user type dashboard |

**Components:**
- `ForgotPasswordForm` — Email input + submit, success state with resend option
- `ResetPasswordForm` — Token verification, countdown timer, password fields with requirements display

**Rate limits:**
- Forgot password: 3 requests per 30 minutes per IP
- Reset password: 2 requests per 60 minutes per IP

### Email Verification (2FA)

**Route:** `/auth/verify-email` (shown after signup in modal or dedicated page)

| Step | Component | Action | UI |
|------|-----------|--------|-----|
| 1 | Signup redirect | User sees verification prompt | Modal or banner |
| 2 | `EmailVerificationForm` | Submit email; backend sends 6-digit code | Text input (6 chars) |
| 3 | `EmailVerificationForm` | User enters code | Visual feedback per digit |
| 4 | Backend validates | Max 3 failed attempts; lockout prevents further tries | "Resend code" button |
| 5 | On success | Marks account verified; redirects to dashboard | Success toast message |

**Features:**
- 6-digit numeric codes (000000–999999) with 15-minute expiry
- Resend codes without hitting attempt counter
- Auto-focus between digits; paste support
- Countdown timer showing code expiry

**Rate limits:**
- Send verification: 5 requests per 15 minutes
- Verify code: 5 attempts per 15 minutes
- Resend: unlimited (resets attempt counter)

### Protected Routes & Role-Based Access

**ProtectedRoute component** wraps authenticated pages to enforce login + role (creator vs. sponsor):

```typescript
<ProtectedRoute requiredUserType="creator">
  <DashboardPage />
</ProtectedRoute>
```

**Behavior:**
- Checks `useAuth()` hook for logged-in user
- If not logged in: redirects to `/login/creator` (customizable via `fallbackRoute`)
- If logged in but wrong user type: redirects to correct dashboard (`/dashboard` for creator, `/sponsor/dashboard` for sponsor)
- If logged in and correct type: renders children

**Usage:**
- Page layout wrappers: `app/(creator)/dashboard/layout.tsx` wraps page with `<ProtectedRoute requiredUserType="creator">`
- Individual components that require auth can also use it

**Middleware protection (double-check):**
- Edge middleware (`proxy.ts`) also checks auth on every request; redirects unauthenticated to `/login`
- ProtectedRoute is a second layer for clarity and TypeScript type safety

### Username Availability Check

**Used in:** Signup forms during account creation

| Feature | Behavior |
|---------|----------|
| **Debounce** | 300ms delay waits for user to finish typing |
| **Visual feedback** | ✓ (green checkmark) if available; ✗ (red X) if taken |
| **Loading state** | Spinner while API request is pending |
| **Status text** | "Username available" or "Username already taken" |
| **Form validation** | Cannot submit unless username is available |

**Component:** `UsernameInput` — wraps text input with built-in availability checking

**Rate limit:** No specific limit; considered low-risk (public endpoint)

---

## App shell (post-login)

Authenticated pages use `CreatorAppShell` (creator and sponsor): top nav with a soft-blue active pill, a Cmd/Ctrl+K command palette (`CommandPalette`), notifications, profile menu, and a bottom tab bar under 768px. Toasts (Sonner) and tooltips are mounted in `app/layout.tsx`.

---

## Color scheme summary

| Surface | Palette | Primary CTA |
|---------|---------|-------------|
| Landing `/`, `/brands` | Cool off-white `#F6F7F9`, ink `#0B1220`, calm blue tints | `.landing-btn-pop` (Earnio Blue) |
| Auth `/login/*`, `/signup/*` | Same as landing | `.btn-primary` |
| App dashboard+ | Cool off-white, solid Earnio Blue hero `#1F45E5`, calm tint tiles | `Button` `default` / `pop` (both Earnio Blue) |

---

## Route map

| Route | Access | UI |
|-------|--------|-----|
| `/` | Public | Creator landing |
| `/brands` | Public | Brand landing |
| `/login`, `/signup` | Public | Redirect → creator auth |
| `/login/creator`, `/signup/creator` | Public | Creator auth (email, password, username) |
| `/login/sponsor`, `/signup/sponsor` | Public | Sponsor auth (email, password) |
| `/forgot-password` | Public | Password recovery form (email input) |
| `/reset-password?token=xxx&email=yyy` | Public | New password form with token validation |
| `/verify-email` | Authenticated | Email verification (6-digit code) |
| `/docs` | Public | Docs shell |
| `/dashboard`, `/platforms`, … | Creator auth | Creator shell |
| `/sponsor/*` | Sponsor auth | Sponsor shell |

---

## File reference

| Area | Path |
|------|------|
| Landing content config | `frontend/lib/landing/content.ts` |
| Landing page shell | `frontend/components/landing/LandingPage.tsx` |
| Creator landing | `frontend/app/page.tsx` |
| Brand landing | `frontend/app/brands/page.tsx` |
| Global styles | `frontend/app/globals.css` |
| Auth layout | `frontend/app/(auth)/layout.tsx` |
| Auth components | `frontend/components/auth/*` |
| Password reset form | `frontend/components/auth/ForgotPasswordForm.tsx` |
| Reset password form | `frontend/components/auth/ResetPasswordForm.tsx` |
| Email verification form | `frontend/components/auth/EmailVerificationForm.tsx` |
| Username availability | `frontend/components/auth/UsernameInput.tsx` |
| Protected route wrapper | `frontend/components/auth/ProtectedRoute.tsx` |
| Email verification hook | `frontend/hooks/useEmailVerification.ts` |
| Translations (EN) | `frontend/lib/i18n/en.ts` |
| Translations (MN) | `frontend/lib/i18n/mn.ts` |

---

## QA checklist

**Landing & navigation:**
- [ ] `/` shows creator copy; **For Brands** goes to `/brands`
- [ ] `/brands` shows brand copy; **For Creators** goes to `/`
- [ ] Creator **Log in** / **Get started** → `/login/creator` and `/signup/creator`
- [ ] Creator nav scrolls to `#how-it-works`, `#features`, `#faq`
- [ ] Brand **Log in** / **Get Started** → `/login/sponsor` and `/signup/sponsor`
- [ ] Auth pages match the flat landing background and sticker card style
- [ ] Auth back links return to correct landing (`/` or `/brands`)
- [ ] `/login` and `/signup` redirect to creator flows

**Signup & username validation:**
- [ ] Username input debounces (300ms) before checking availability
- [ ] Available usernames show green checkmark; taken usernames show red X
- [ ] Cannot submit signup form unless username is available
- [ ] Username field shows loading spinner while API request pending
- [ ] Form displays error message for whitespace-only usernames

**Password reset:**
- [ ] "Forgot password?" link visible on login pages (`/login/creator`, `/login/sponsor`)
- [ ] `/forgot-password` shows email input; "Send reset link" button
- [ ] After submitting email, shows "Check your email" message
- [ ] Reset link in email includes token + email as URL params
- [ ] Visiting reset link with valid token shows password form + countdown timer
- [ ] Countdown shows "expires in X minutes" (60 min total)
- [ ] Invalid or expired token shows error message; "Request new link" option
- [ ] Password form enforces requirements (min length, special chars, etc.)
- [ ] After reset, user auto-logs in and redirects to `/dashboard` (creator) or `/sponsor/dashboard` (sponsor)
- [ ] Rate limiting: 3 forgot-password requests per 30 min per IP → 429 error

**Email verification (2FA):**
- [ ] After signup, user sees "Verify your email" prompt/modal
- [ ] Clicking "Send code" triggers email delivery
- [ ] Email contains 6-digit code with large, readable font
- [ ] Code input accepts 6 numeric digits only
- [ ] Auto-focus moves between digits (supports paste)
- [ ] After 3 failed attempts, shows "Too many attempts" message
- [ ] "Resend code" button resets attempt counter; generates new code
- [ ] On successful verification, shows success message + redirects to `/dashboard`
- [ ] Countdown timer shows code expiry (15 minutes)
- [ ] Rate limiting: 5 verify-email requests per 15 min per IP → 429 error

**Protected routes:**
- [ ] Unauthenticated users cannot access `/dashboard`, `/platforms`, etc.
- [ ] Accessing protected route without login redirects to `/login/creator`
- [ ] Creator accessing sponsor routes redirects to `/dashboard`
- [ ] Sponsor accessing creator routes redirects to `/sponsor/dashboard`
- [ ] After logout, protected routes are inaccessible
