# Earnio — Application Status & Operations

> **Audience:** QA, operators, future maintainers.  
> **Not duplicated here:** architecture, features list, env setup, or quick start — see [context.md](../context.md).

**Last updated:** October 2026 · **Status:** Portfolio demo; mock platform sync; sponsor approves each deliverable, then mark-paid credits wallets; payouts remain pending (no real bank rail). Plan: [SHIP_PLAN.md](./SHIP_PLAN.md).

---

## What is this app?

**Earnio** helps Mongolian creators track earnings, find brand sponsorships (MNT), and manage payouts. Brands post campaigns and review applications. Two roles: **creator** and **sponsor**, with separate landing pages and app shells.

| Persona | Main screens |
|---------|--------------|
| Creator | `/dashboard`, `/platforms`, `/sponsorships`, `/wallet` |
| Sponsor | `/sponsor/dashboard`, `/sponsor/campaigns` |

---

## Demo walkthrough (portfolio)

**Fast path:** with both servers running (`npm run dev`), run `npm run seed:demo` from the repo root. It drives the real API through the full flow below and prints login credentials for a demo sponsor and creator with a campaign, approved application, mark-paid wallet credit, and pending payout already in place.

**Manual path** (what the script above automates) — use **fresh accounts** so the full ledger path is visible:

1. Sign up as **sponsor** → create campaign (it goes live immediately)
2. Sign up as **creator** → connect a platform by username → apply with a pitch → (sponsor) approve → (creator) submit the post URL (https TikTok/YouTube/Instagram link)
3. (Sponsor) **Approve deliverable** → **Mark paid** → creator wallet receives `sponsorship_credit` (gross) + `platform_fee` (20%); available = 80%
4. (Creator) add a bank account → request payout (≥ 50,000 MNT) → pending payout appears in wallet

Optional seed demo rows (users present when the migration ran): `supabase/migrations/20250521120100_seed_wallet_demo.sql`. New signups are not covered by that seed — `npm run seed:demo` or the manual mark-paid path above are the supported ways to get a live demo state.

### Email (Resend)

Set `RESEND_API_KEY` and `EMAIL_FROM` in `backend/.env` for password-reset and verification emails. Without them, those APIs still return success but no message is delivered — fine for a silent demo; call it out if reviewers expect inbox mail.

Production checklist: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`, `ENCRYPTION_KEY`, optional Resend + `SYNC_CRON_SECRET` (protects detailed health and cron).

---

## Honest triage — what is not production-ready

### Simulated / stubbed logic

| Area | Current behavior | Risk |
|------|------------------|------|
| **Platform sync** | Mock hash-based earnings | Dashboard numbers are demo data |
| **Bank payouts** | Inserts `pending` transaction | No Mongolian payment rail integration |
| **Bank verification** | `verified: false` on insert | No KYC flow |
| **OAuth** | Username connect + partial OAuth infra | Real tokens not required for MVP |

### Security & access (mostly addressed)

| Item | Status |
|------|--------|
| Edge role routing (`ct-user-type` cookie) | Fixed — `proxy.ts` redirects wrong-role routes |
| Sponsor API enforcement | Backend `assertSponsor()` on sponsor routes |
| Detailed health | `GET /api/health/detailed` requires `x-cron-secret` = `SYNC_CRON_SECRET` |
| RLS | Must be verified per migration in production |

### Quality gaps

| Item | Detail |
|------|--------|
| Test coverage | Backend unit/integration + frontend Vitest; Playwright E2E local (see below) |
| Sync scheduler | In-process cron off in production; use `POST /api/sync/cron` |
| Lighthouse / mobile QA | Not automated — use [QA_MANUAL_CHECKLIST.md](./QA_MANUAL_CHECKLIST.md) |

Full feature checklist: [FEATURES.md](./FEATURES.md). Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend won't start | Missing Supabase env | Copy `backend/.env.example` → `.env` |
| Public health `degraded` | Wrong keys or migrations | Apply `supabase/migrations/` |
| Signup fails username check | No service role key | Set `SUPABASE_SERVICE_ROLE_KEY` |
| Mark paid fails / empty wallet | No service role, or deliverables not submitted/approved | Set service role; approve each submitted deliverable first |
| 401 on every request with a fresh Supabase project | Project signs tokens with asymmetric keys but `SUPABASE_JWT_SECRET` is set | Leave `SUPABASE_JWT_SECRET` empty so the API verifies via JWKS |
| 401 on API calls | Expired/missing token | Re-login; check CORS + cookies |
| CORS errors | Origin mismatch | Match `FRONTEND_URL` exactly |
| No emails | Resend not configured | Set `RESEND_API_KEY`, `EMAIL_FROM` |
| Sync idle | Cron disabled | `ENABLE_SYNC_CRON=true` or manual sync on Platforms |

```bash
curl http://localhost:3001/api/health
# Expect: { "status": "ok", "timestamp": "..." }

# Detailed (requires SYNC_CRON_SECRET):
curl -H "x-cron-secret: $SYNC_CRON_SECRET" http://localhost:3001/api/health/detailed
```

---

## Backlog (prioritized)

### P0 — Before real users / money

- [ ] Replace mock platform provider with real OAuth + earnings APIs
- [ ] Real payout provider + admin completion flow
- [ ] Bank account verification
- [ ] Audit Supabase RLS; add policy tests

### P1 — Reliability

- [x] Playwright E2E happy path (local; `cd frontend && npm run test:e2e`)
- [ ] External job queue for sync
- [ ] Sentry / analytics

### P2 — Product

- [ ] Campaign drafts, filters, creator public profiles
- [ ] Admin panel for payouts and disputes

See [FEATURES.md](./FEATURES.md) for the full implemented/planned list.

---

## Pre-release checks

| Check | Command / URL | Pass |
|-------|----------------|------|
| Backend tests | `cd backend && npm test` | All pass |
| Frontend lint | `cd frontend && npm run lint` | 0 errors |
| Frontend unit | `cd frontend && npm test` | All pass |
| Frontend build | `cd frontend && npm run build` | Success |
| Playwright E2E | Servers up → `cd frontend && npm run test:e2e` | Pass (happy-path skips if API down) |
| API health | `GET /api/health` | `status: ok` |
| Manual QA | [QA_MANUAL_CHECKLIST.md](./QA_MANUAL_CHECKLIST.md) | Critical paths |

---

*Deploy: [DEPLOYMENT.md](./DEPLOYMENT.md) · Specs: [EARNIO_PROJECT_DOCS.md](./EARNIO_PROJECT_DOCS.md)*
