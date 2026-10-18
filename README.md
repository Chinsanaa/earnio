# Earnio

**Earn more, create more.**

UGC monetization platform for Mongolian Gen Z creators and brands. Creators connect their TikTok/YouTube/Instagram, track earnings, apply to brand sponsorship campaigns, and request MNT payouts. Brands post campaigns, review applications, and approve creators. Earnio takes a 20% commission on sponsorships; creators keep 80%.

This is a solo-built, full-stack portfolio project — not a live startup. Platform earnings and bank payouts are intentionally **mocked** (real OAuth and bank rails were scoped out to ship the full product loop in 12 weeks; see [instructions.md](./instructions.md)). Everything else — auth, RLS-backed Postgres, the sponsorship marketplace, wallet ledger, notifications, i18n — is real, working code with backend + frontend + e2e test coverage.

`Next.js 16` · `React 19` · `Express 5` · `TypeScript` · `Supabase (Postgres + JWT)` · `Tailwind 4`

→ **Full project map:** [context.md](./context.md) · **Demo walkthrough:** [docs/APP_OVERVIEW.md](./docs/APP_OVERVIEW.md#demo-walkthrough-portfolio)

---

## Screenshots

<!-- TODO: add 3-5 screenshots/GIF here (creator dashboard, sponsorship marketplace, wallet, dark mode) once captured against a running local instance with seeded demo data — see `npm run seed:demo` below. -->

---

## Quick start

**Prerequisites:** Node.js 20+, npm, Supabase project with migrations applied.

```bash
npm install
cd frontend && npm install && cd ../backend && npm install

cp backend/.env.example backend/.env
# Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL

echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local

npm run dev          # from repo root — frontend :3000 + backend :3001
```

- **Web:** http://localhost:3000  
- **API health:** http://localhost:3001/api/health  
- **Creator signup:** http://localhost:3000/signup/creator  

**Docker:** `docker compose up --build`

**Want realistic demo data instead of clicking through the whole flow by hand?** With both servers running:

```bash
npm run seed:demo
```

This drives the real API to create a demo sponsor + campaign, a demo creator, an application, an approval, an approved deliverable, a mark-paid wallet credit, and a payout request — see [Commands](#commands).

---

## Repository layout

| Folder | What |
|--------|------|
| [frontend/](./frontend/) | Next.js website |
| [backend/](./backend/) | Express REST API |
| [supabase/](./supabase/) | SQL migrations |
| [docs/](./docs/) | Technical documentation |
| [scripts/](./scripts/) | Dev & smoke-test helpers |

Each folder has its own `README.md`. See [context.md](./context.md) for the complete map.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database & auth |
| `FRONTEND_URL` | CORS origin (default `http://localhost:3000`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email (optional in dev) |
| `ENABLE_SYNC_CRON`, `SYNC_CRON_SECRET` | Platform sync scheduler |

See `backend/.env.example` for the full list.

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:3001`) |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run dev:frontend` | Next.js only |
| `npm run dev:backend` | Express only |
| `npm run build` | Production build (frontend) |
| `npm run lint` | ESLint (frontend) |
| `npm test` | Backend tests (run from `backend/`) |
| `npm run smoke` | HTTP smoke tests |
| `npm run seed:demo` | Seeds a full demo sponsor+creator flow via the live API (servers must be running) |
| `cd frontend && npm run test:e2e` | Playwright E2E (servers must be running) |

**Playwright:** start `npm run dev`, then `cd frontend && npm run test:e2e:install` (once) and `npm run test:e2e`. Happy-path skips if the API health check fails. See [docs/APP_OVERVIEW.md](./docs/APP_OVERVIEW.md) for the demo walkthrough and Resend notes.

---

## Documentation

| Topic | Document |
|-------|----------|
| **Start here** | [context.md](./context.md) |
| Architecture | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Features & status | [docs/FEATURES.md](./docs/FEATURES.md), [docs/APP_OVERVIEW.md](./docs/APP_OVERVIEW.md) |
| Frontend UI | [docs/FRONTEND.md](./docs/FRONTEND.md) |
| Deploy | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |
| QA | [docs/QA_MANUAL_CHECKLIST.md](./docs/QA_MANUAL_CHECKLIST.md) |
| MVP scope | [instructions.md](./instructions.md) |
| Security | [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) |
| Agents (Cursor) | [AGENTS.md](./AGENTS.md) |

In-app guides: http://localhost:3000/docs

---

## License

Private project. All rights reserved.
