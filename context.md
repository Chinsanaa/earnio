# Earnio — Project Context

> **Start here.** This file maps the repository, explains what each part does, and points to the one document you should read for each topic. Updated June 2026.

---

## What is Earnio?

**Earnio** (*Earn more, create more*) is a full-stack UGC monetization platform for **Mongolian Gen Z creators** and **brands**. Creators connect TikTok, YouTube, and Instagram (mock sync in MVP), track earnings, apply to sponsorship campaigns, and request MNT payouts. Brands post campaigns, review applications, and manage partnerships.

| Layer | Tech | Port |
|-------|------|------|
| Web app | Next.js 16, React 19, Tailwind 4 | 3000 |
| API | Express 5, TypeScript | 3001 |
| Database & auth | Supabase (PostgreSQL + JWT) | — |
| Mobile | Capacitor 7 (iOS wrapper) + native SwiftUI app in `ios/` | — |

**Revenue model:** 20% platform commission on sponsorships (creators keep 80%).

**MVP constraint:** Mock platform data and mock payouts — no real OAuth or bank rails in scope. See [instructions.md](./instructions.md).

---

## Repository map

```
creator-toolkit/                 # Monorepo root (npm scripts delegate to sub-packages)
├── context.md                   # ← You are here — master index
├── README.md                    # Quick start & links
├── instructions.md              # Locked scope, timeline, and build rules
├── AGENTS.md                    # Cursor Cloud agent quick reference
│
├── frontend/                    # Next.js website → see frontend/README.md
├── backend/                     # Express REST API → see backend/README.md
├── supabase/                    # SQL migrations → see supabase/README.md
├── ios/                         # Native iOS app → see ios/README.md
├── scripts/                     # Dev & smoke-test helpers → see scripts/README.md
├── docs/                        # Canonical technical docs → see docs/README.md
├── .agents/                     # AI agent skills (MuAPI, design, React) → see .agents/README.md
├── .github/workflows/           # CI: backend tests + frontend lint/build
└── docker-compose.yml           # Optional local full-stack containers
```

---

## Documentation index (no overlap)

Each topic has **one canonical file**. Other files link here instead of repeating content.

### Getting oriented

| Read this | For |
|-----------|-----|
| [context.md](./context.md) | Full repo map and doc index (this file) |
| [README.md](./README.md) | Install, run locally, env vars, quick commands |
| [instructions.md](./instructions.md) | Product scope, 12-week plan, locked decisions, what **not** to build |
| [docs/EARNIO_PROJECT_DOCS.md](./docs/EARNIO_PROJECT_DOCS.md) | Original 6 spec documents (PRD, TRD, routes, UI brief, schema, phases) |
| [docs/APP_OVERVIEW.md](./docs/APP_OVERVIEW.md) | Honest status: gaps, troubleshooting, backlog |

### Architecture & features

| Read this | For |
|-----------|-----|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flows, DB schema, security architecture |
| [docs/FEATURES.md](./docs/FEATURES.md) | Feature checklist (implemented / planned) |
| [docs/FRONTEND.md](./docs/FRONTEND.md) | Landing pages, auth UI, route map, marketing design tokens |
| [frontend/design-system/MASTER.md](./frontend/design-system/MASTER.md) | Product design tokens (colors, typography, spacing) |
| [ios/DESIGN_SYSTEM.md](./ios/DESIGN_SYSTEM.md) | iOS-native design (SwiftUI, SF fonts, system colors) |

### Operations

| Read this | For |
|-----------|-----|
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deploy (Vercel + Railway/Render + Supabase) |
| [docs/QA_MANUAL_CHECKLIST.md](./docs/QA_MANUAL_CHECKLIST.md) | Pre-release manual QA |
| [docs/phases_11_15_complete_plan.md](./docs/phases_11_15_complete_plan.md) | Launch polish plan (phases 11–15) |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Auth security implementation & test results |
| [SECURITY.md](./SECURITY.md) | Vulnerability reporting policy |

### Integrations (post-MVP)

| Read this | For |
|-----------|-----|
| [docs/TIKTOK_OAUTH_SETUP.md](./docs/TIKTOK_OAUTH_SETUP.md) | TikTok developer portal setup |
| [docs/TIKTOK_OAUTH_IMPLEMENTATION.md](./docs/TIKTOK_OAUTH_IMPLEMENTATION.md) | TikTok OAuth code paths in this repo |

### In-app docs (web UI at `/docs`)

The running app renders markdown from `docs/` (not duplicate copies). Slugs: `deployment`, `qa-checklist`, `launch-plan`.

### Agent & AI tooling

| Read this | For |
|-----------|-----|
| [AGENTS.md](./AGENTS.md) | Cursor Cloud: ports, commands, gotchas |
| [frontend/AGENTS.md](./frontend/AGENTS.md) | Next.js 16 breaking-change warning for agents |
| [.agents/README.md](./.agents/README.md) | Bundled agent skills (design, media, React best practices) |

### Legal (served by API, not dev docs)

| File | Served at |
|------|-----------|
| `backend/src/content/legal/privacy-policy.md` | `GET /api/legal/privacy-policy` |
| `backend/src/content/legal/terms-and-conditions.md` | `GET /api/legal/terms-and-conditions` |

---

## What lives in each folder

### `frontend/` — Next.js web application

Marketing pages (`/`, `/brands`), creator app (`/dashboard`, `/sponsorships`, `/platforms`, `/wallet`), sponsor app (`/sponsor/*`), auth flows, and in-app docs UI (`/docs`).

Key paths: `app/` (routes), `components/` (UI), `lib/api/` (REST client), `contexts/AuthContext.tsx`, `proxy.ts` (edge auth + role routing).

→ Details: [frontend/README.md](./frontend/README.md)

### `backend/` — Express REST API

JSON API under `/api/*`. Routes in `src/routes/`, business logic in `src/services/`, JWT middleware in `src/proxy/authProxy.ts`, mock earnings in `src/platforms/mockPlatformProvider.ts`, background sync in `src/jobs/syncScheduler.ts`.

→ Details: [backend/README.md](./backend/README.md)

### `supabase/` — Database

Timestamped SQL migrations: schema, RLS policies, auth triggers, demo seeds, password-reset and email-verification tables, OAuth token columns.

→ Details: [supabase/README.md](./supabase/README.md)

### iOS native app

→ [ios/TESTING.md](./ios/TESTING.md) — demo mode + pre–App Store checklist

SwiftUI app (iOS 17+) with creator and sponsor flows. Separate from the Capacitor web wrapper configured at repo root.

→ Details: [ios/README.md](./ios/README.md)

### `scripts/` — Root utilities

`dev.mjs` — starts frontend + backend together. `smoke-test.mjs` — HTTP smoke tests for routes and API.

→ Details: [scripts/README.md](./scripts/README.md)

### `docs/` — Canonical documentation

All long-form guides. The web app and README link here.

→ Index: [docs/README.md](./docs/README.md)

### `.agents/` — Agent skills

Third-party and project-specific skills for AI assistants (Earnio design system, MuAPI media tools, Vercel React rules). Not part of the runtime app.

→ Index: [.agents/README.md](./.agents/README.md)

---

## Request flow (30-second version)

```
Browser → Next.js (3000) → Express API (3001) → Supabase
                ↑                    ↑
         proxy.ts checks        verifyToken + services
         auth cookies            + RLS in Postgres
```

1. User logs in → backend sets httpOnly cookies (`ct-access-token`, refresh token, `ct-user-type`).
2. Frontend calls API with Bearer token; auto-refreshes on 401.
3. Edge middleware redirects unauthenticated or wrong-role users.
4. Platform sync uses mock provider unless real OAuth is configured.

---

## Quick start

```bash
npm install && cd frontend && npm install && cd ../backend && npm install
cp backend/.env.example backend/.env   # fill Supabase keys
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
npm run dev    # from repo root — both servers
```

- Web: http://localhost:3000  
- API health: http://localhost:3001/api/health  
- Creator signup: http://localhost:3000/signup/creator  

Full env tables and Docker: [README.md](./README.md).

---

## User roles & routes

| Role | Landing | App home | Key routes |
|------|---------|----------|------------|
| Creator | `/` | `/dashboard` | `/sponsorships`, `/platforms`, `/wallet` |
| Sponsor | `/brands` | `/sponsor/dashboard` | `/sponsor/campaigns` |

---

## API surface (summary)

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Signup, login, refresh, password reset, email verification |
| `/api/dashboard` | Creator earnings summary |
| `/api/platforms` | Connect & sync platforms |
| `/api/sponsorships` | Marketplace & applications |
| `/api/sponsor` | Campaign CRUD & application review |
| `/api/wallet` | Balance, banks, payouts |
| `/api/notifications` | In-app notifications |
| `/api/sync` | Cron platform sync |
| `/api/legal` | Terms & privacy markdown |
| `/api/health` | Readiness check |

Full endpoint tables: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## Common commands

| Command | Where | What |
|---------|-------|------|
| `npm run dev` | root | Frontend + backend together |
| `npm run dev:frontend` | root | Next.js only |
| `npm run dev:backend` | root | Express only |
| `npm test` | backend | API tests |
| `npm run lint` | root | ESLint (frontend) |
| `npm run smoke` | root | Route/API smoke test |
| `npm run ios:open` | root | Open Capacitor iOS project (macOS) |

---

## Where to go next

| I want to… | Open |
|------------|------|
| Run the app locally | [README.md](./README.md) |
| Understand system design | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| See what's done vs. stubbed | [docs/APP_OVERVIEW.md](./docs/APP_OVERVIEW.md) |
| Change landing or auth UI | [docs/FRONTEND.md](./docs/FRONTEND.md) |
| Plan the "Solid Pop" design refresh (no gradients) | [docs/DESIGN_REFRESH_PLAN.md](./docs/DESIGN_REFRESH_PLAN.md) |
| Deploy to production | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |
| Run QA before release | [docs/QA_MANUAL_CHECKLIST.md](./docs/QA_MANUAL_CHECKLIST.md) |
| Check scope before coding | [instructions.md](./instructions.md) |
| Work on iOS | [ios/README.md](./ios/README.md) |
| Apply a DB migration | [supabase/README.md](./supabase/README.md) |

---

## Update log

- **2026-09-27:** Added [docs/DESIGN_REFRESH_PLAN.md](./docs/DESIGN_REFRESH_PLAN.md), a proposed "Solid Pop" frontend redesign: solid colors only (no gradients, enforced by a planned CI test), hard offset shadows, curated copy-paste libraries (shadcn/ui, Motion, Vengeance UI, Skiper UI free tier, Magic UI, Sonner, Vaul, cmdk), and a 6-phase rollout. Plan only; nothing implemented yet. Open questions listed in section 7.
