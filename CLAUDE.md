# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

> **Standing rule from the maintainer:** After finishing any task, **test the code and debug if an error occurs** before considering the task done. Prefer the checks in [Verifying your work](#verifying-your-work).

---

## What this is

**Earnio** (*Earn more, create more*) is a full-stack UGC monetization platform for **Mongolian Gen Z creators** and **brands**. Creators connect TikTok/YouTube/Instagram (mock sync in the MVP), track earnings, apply to sponsorship campaigns, and request MNT payouts. Brands post campaigns, review applications, and approve creators.

- **Revenue model:** 20% platform commission on sponsorships (creators keep 80%).
- **MVP constraint:** Platform data and payouts are **mocked** — no real OAuth or bank rails are in scope for the MVP. Real TikTok OAuth code paths exist but are post-MVP/optional.

**This is a portfolio project, not a validated startup.** Do not add features, real APIs, or scope beyond what is in the spec. See [`instructions.md`](./instructions.md) for locked scope and the list of things **not** to build.

---

## Architecture at a glance

```
Browser → Next.js frontend (:3000) → Express API (:3001) → Supabase (Postgres + JWT)
                 ↑                            ↑
          proxy.ts (edge auth          verifyToken middleware
          + role routing)              + services + RLS in Postgres
```

| Layer | Tech | Port | Directory |
|-------|------|------|-----------|
| Web app | Next.js 16 (App Router), React 19, Tailwind 4 | 3000 | `frontend/` |
| API | Express 5, TypeScript | 3001 | `backend/` |
| Database & auth | Supabase (PostgreSQL + JWT) | — | `supabase/` |
| Mobile | Capacitor 7 web wrapper + native SwiftUI app | — | root config + `ios/` |

**Auth flow:** Login → backend issues JWTs and sets httpOnly cookies (`ct-access-token`, refresh token, `ct-user-type`). Frontend calls the API with a Bearer token and auto-refreshes on 401. Next.js edge middleware (`frontend/proxy.ts`) redirects unauthenticated or wrong-role users.

---

## Repository layout

This is an **npm monorepo** with three `package.json` files (root, `frontend/`, `backend/`). The root package is named `creator-toolkit`; root scripts delegate to the sub-packages.

```
earnio/
├── frontend/          Next.js web app (App Router)
├── backend/           Express REST API
├── supabase/          Timestamped SQL migrations
├── ios/               Native SwiftUI iOS app (separate from Capacitor wrapper)
├── scripts/           dev.mjs (runs both servers) + smoke-test.mjs
├── docs/              Canonical long-form documentation
├── .agents/           Bundled AI agent skills (design, media, React rules)
├── .github/workflows/ CI: backend build+test, frontend lint+build
├── context.md         Master repo map & documentation index — START HERE
├── instructions.md    Locked MVP scope and build rules
├── README.md          Quick start, env vars, commands
└── docker-compose.yml Optional full-stack local containers
```

**When you need deeper detail on a topic, read the canonical doc rather than guessing:**

| Topic | Doc |
|-------|-----|
| Repo map & full doc index | [`context.md`](./context.md) |
| Locked scope / what NOT to build | [`instructions.md`](./instructions.md) |
| System design, data flows, full endpoint tables, DB schema | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| Honest status: gaps, stubs, troubleshooting | [`docs/APP_OVERVIEW.md`](./docs/APP_OVERVIEW.md) |
| Feature checklist (done vs. planned) | [`docs/FEATURES.md`](./docs/FEATURES.md) |
| Frontend UI, routes, marketing tokens | [`docs/FRONTEND.md`](./docs/FRONTEND.md) |
| Product design tokens | [`frontend/design-system/MASTER.md`](./frontend/design-system/MASTER.md) |
| Deployment (Vercel + Railway + Supabase) | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) |
| Auth security implementation & audit | [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) |

---

## Getting started

**Prerequisites:** Node.js 20+, npm, a Supabase project with migrations applied.

```bash
# Install deps in all three packages
npm install
cd frontend && npm install && cd ../backend && npm install && cd ..

# Backend env
cp backend/.env.example backend/.env
# Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL

# Frontend env
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local

# Run both servers from repo root
npm run dev
```

- Web: http://localhost:3000
- API health: http://localhost:3001/api/health
- Docker alternative: `docker compose up --build`

---

## Commands

| Command | Where | What |
|---------|-------|------|
| `npm run dev` | root | Frontend + backend together (`scripts/dev.mjs`) |
| `npm run dev:frontend` | root | Next.js only |
| `npm run dev:backend` | root | Express only |
| `npm run build` | root | Production build (frontend) |
| `npm run build:backend` | root | Compile backend TypeScript |
| `npm run lint` | root | ESLint (**frontend only** — backend has no lint script) |
| `npm run smoke` | root | HTTP smoke tests against running servers |
| `npm test` | `backend/` | Builds then runs Node test runner on `dist/tests/*.test.js` |
| `npm test` | `frontend/` | Vitest run |
| `npm run cap:sync` / `ios:open` | root | Capacitor iOS sync / open in Xcode (macOS) |

---

## Backend conventions (`backend/`)

- **Language:** TypeScript, CommonJS. Dev via `nodemon` + `ts-node`; prod runs compiled `dist/`.
- **App wiring:** `src/index.ts` (bootstrap, env checks, starts sync scheduler) → `src/app.ts` (`createApp` builds the Express app, mounts routes, error handlers).
- **Layering — keep this separation:**
  - `src/routes/*.ts` — thin HTTP handlers, one file per API prefix.
  - `src/services/*.ts` — business logic and Supabase queries (e.g. `authService`, `walletService`, `sponsorshipService`).
  - `src/middleware/security.ts` — helmet headers, rate limiters (`globalRateLimiter`, `mutationRateLimiter`), JSON body parser.
  - `src/proxy/authProxy.ts` — `verifyToken` (requires `Authorization: Bearer <jwt>`, sets `req.userId`) and `optionalAuth`.
  - `src/platforms/mockPlatformProvider.ts` — the mock earnings source.
  - `src/jobs/syncScheduler.ts` — background platform sync (gated by `ENABLE_SYNC_CRON`).
  - `src/config/env.ts` — `loadEnvConfig()`; throws on missing `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
- **Errors:** Throw `AppError` (`src/utils/AppError.ts`) from services; the global handler in `app.ts` maps it to `{ error: { status, message, code } }`. Never leak raw errors — the fallback returns a generic 500.
- **Production guards:** `index.ts` throws if `NODE_ENV=production` and `SUPABASE_SERVICE_ROLE_KEY` or `ENCRYPTION_KEY` is missing (OAuth tokens and bank account numbers are encrypted at rest).
- **API prefixes:** `/api/auth`, `/api/dashboard`, `/api/platforms`, `/api/sponsorships`, `/api/sponsor`, `/api/wallet`, `/api/notifications`, `/api/sync`, `/api/legal`, `/api/health`. Mutation-heavy routers get `mutationRateLimiter`. Full endpoint tables: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Frontend conventions (`frontend/`)

- **⚠️ Next.js 16 has breaking changes vs. older versions.** Per `frontend/AGENTS.md`, consult `node_modules/next/dist/docs/` before writing Next.js code — do not rely on training-data conventions. Heed deprecation notices.
- **Structure:**
  - `app/` — App Router routes. Auth pages live under the `(auth)/` route group; creator app at `/dashboard`, `/sponsorships`, `/platforms`, `/wallet`; sponsor app under `/sponsor/*`; in-app docs at `/docs`.
  - `components/` — UI, grouped by feature (`auth`, `creator`, `sponsor`, `wallet`, `dashboard`, `ui`, …).
  - `lib/api/*.ts` — typed REST client (`client.ts` + per-domain modules).
  - `lib/auth/*` — token parsing, session cookies, path/role helpers.
  - `contexts/AuthContext.tsx`, `LanguageContext.tsx` — global state (i18n supports EN/MN).
  - `proxy.ts` — edge middleware for auth + creator/sponsor role routing (see its `matcher` for guarded paths).
- **Path alias:** `@/*` maps to the frontend root (e.g. `@/lib/api/client`).
- **Cookies:** `ACCESS_TOKEN_COOKIE` / `USER_TYPE_COOKIE` are defined in `lib/auth/session`; user types are `'creator' | 'sponsor'`.
- **Testing:** Vitest + Testing Library (`*.test.ts[x]` colocated with source). Config in `vitest.config.ts` / `vitest.setup.ts`.
- **Security headers** are set in `next.config.ts`; the app builds as `output: "standalone"` for Docker/Vercel.
- The `frontend/CLAUDE.md` file documents a **separate design-recreation workflow** (screenshot-and-match) — it is not general product guidance.

### Design system rules (enforced by `lib/design/designSystem.test.ts`)

`frontend/app/globals.css` is the **single source of truth** for design tokens (colors, radii, shadows, motion). `frontend/design-system/` is a mirrored, standalone copy for handoff — when you change a token's value in `globals.css`, mirror the same change there (and in `design-system/MASTER.md`'s docs if it's a documented value) so the two never diverge again.

A CI-blocking Vitest suite (`npm test` in `frontend/`) enforces four rules. Violating any of them fails the build:

1. **Every themed foreground/background token pair must meet its WCAG AA contrast threshold** (4.5:1 normal text, 3:1 large text/UI boundaries) in **both** `:root` (light) and `.dark`. Add a new checked pair to `CONTRAST_CHECKS` in `designSystem.test.ts` when you add a token that carries text or a border.
2. **No hardcoded hex/`rgb()`/`rgba()` color literal in `globals.css` outside the `:root { }` / `.dark { }` token blocks.** Every component rule must resolve color through a `var(--token)`. If a value is genuinely theme-invariant (e.g. `--hero-*`, `--overlay-scrim*`), give it its own token in both blocks rather than inlining it.
3. **No light-mode-only Tailwind color utility** (`bg-white`, `bg-red-50`, `text-gray-900`, etc.) in a `.tsx` file without a `dark:` variant in the same class string — or, preferably, route it through a semantic token (`bg-card`, `text-foreground`, `text-destructive-text`, `.badge-status-*`, `.alert-*`) instead of a raw Tailwind color.
4. **No gradients, anywhere ("Solid Pop").** No CSS `linear-/radial-/conic-gradient(` in `globals.css` or `design-system/`, no Tailwind `bg-gradient-*` / `from-*` / `via-*` / `to-*` / `bg-clip-text` / `text-gradient`, and no SVG `<linearGradient>` / `<radialGradient>` (Recharts included). Use solid tokens (`--pop-*`, `--primary`, `--primary-soft`) instead.

When fixing a dark-mode bug, verify the new/changed color pair numerically (`contrastRatio` in `lib/design/contrast.ts`) rather than eyeballing a screenshot — several past bugs (e.g. a button whose background equaled the dark-mode page background, contrast 1.0) were invisible to a quick look but obvious once measured.

## Database (`supabase/`)

- Timestamped SQL migrations in `supabase/migrations/` (format `YYYYMMDDHHMMSS_description.sql`): schema, RLS policies, auth triggers, demo seeds, password-reset/email-verification tables, OAuth token columns, encryption of bank account numbers.
- **Add new schema changes as new migration files — never edit an applied migration.** Follow the existing RLS + `with check` patterns for any new table.
- Platform enum values: `tiktok | youtube | instagram`.

---

## Conventions & guardrails

- **Match surrounding style.** Backend is CommonJS TypeScript; frontend is ESM/React 19. Follow existing naming (`camelCase` services, feature-grouped components).
- **Respect the locked MVP scope.** Do not introduce real OAuth, Stripe, or bank integrations, or add features not in the 6 spec documents. If a change won't fit scope, cut it — don't expand. See [`instructions.md`](./instructions.md).
- **Keep mocks as mocks.** Mock platform data and payouts are intentional. Don't wire them to real providers.
- **Secrets:** Never commit `.env` files or hardcode keys. Backend env is validated at startup.
- **Two user roles everywhere:** creator vs. sponsor. New protected routes must be added to both `frontend/proxy.ts` `matcher`/role helpers and any relevant backend auth checks.

---

## Verifying your work

Per the maintainer's standing rule, **test after every change and debug failures before finishing.** Depending on what you touched:

```bash
# Backend changes
cd backend && npm run build && npm test

# Frontend changes
cd frontend && npm run lint && npm test && npm run build

# End-to-end sanity (servers running)
npm run dev            # in one shell
npm run smoke          # in another
curl http://localhost:3001/api/health
```

CI (`.github/workflows/ci.yml`) runs backend build+test and frontend lint+build on pushes/PRs to `main`. Make sure your change would pass both jobs.

---

## Working agreement for AI assistants

1. Read [`context.md`](./context.md) and the relevant canonical doc before large changes.
2. Make the change in the correct layer (route vs. service vs. component vs. lib).
3. **Test and debug** — do not report a task complete until the relevant checks above pass.
4. Keep the diff focused and within MVP scope.
