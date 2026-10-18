# Backend — Express API

JSON REST API for Earnio. Does not serve HTML. All routes live under `/api/*`.

**Port:** 3001 (dev) · **Entry:** `src/index.ts` · **App factory:** `src/app.ts`

→ Project map: [../context.md](../context.md) · Architecture: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

---

## Folder layout

```
backend/
├── src/
│   ├── routes/           # HTTP handlers (thin — parse request, call service)
│   │   ├── auth.ts       # Signup, login, refresh, password reset, email verification
│   │   ├── dashboard.ts  # Creator earnings summary
│   │   ├── platforms.ts  # Connect & sync TikTok/YouTube/Instagram
│   │   ├── sponsorships.ts
│   │   ├── sponsor.ts    # Campaign CRUD, application review
│   │   ├── wallet.ts     # Balance, banks, payouts
│   │   ├── notifications.ts
│   │   ├── sync.ts       # POST /sync/cron (external scheduler)
│   │   ├── legal.ts      # Serves markdown from content/legal/
│   │   └── health.ts     # GET /health
│   ├── services/         # Business logic & Supabase queries
│   ├── database/supabase.ts
│   ├── proxy/authProxy.ts    # JWT verifyToken middleware
│   ├── middleware/security.ts # Rate limits, security headers
│   ├── jobs/syncScheduler.ts # In-process 6h sync (dev only)
│   ├── platforms/mockPlatformProvider.ts  # Demo earnings (replace for prod)
│   ├── emails/templates.ts
│   ├── content/legal/    # Privacy & terms markdown (API-served)
│   ├── config/env.ts     # Typed env config
│   └── tests/            # node:test + supertest
├── .env.example
└── package.json
```

---

## Commands

```bash
npm install
npm run dev      # nodemon + ts-node, port 3001
npm run build    # tsc → dist/
npm start        # production (runs dist/)
npm test         # API & security tests
```

Health check: `curl http://localhost:3001/api/health`

---

## Environment

Copy `.env.example` → `.env`. Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Strongly recommended: `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.

Full variable table: [../README.md](../README.md#environment-variables).

---

## Patterns

- **Routes** parse input and return JSON; **services** own Supabase calls and rules.
- Errors use `AppError` with consistent JSON shape.
- Protected routes use `verifyToken`; sponsor routes call `assertSponsor()`.
- Platform sync defaults to mock provider — see [../docs/APP_OVERVIEW.md](../docs/APP_OVERVIEW.md) for production gaps.
