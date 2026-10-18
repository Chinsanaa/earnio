# Earnio Deployment Guide

> **Production setup:** Vercel (frontend) + Render (API) + Supabase (database and auth). Also rendered at `/docs/deployment`.
> Local quick start: [../README.md](../README.md) · Map: [../context.md](../context.md) · Plan: [SHIP_PLAN.md](./SHIP_PLAN.md)
> Last updated: October 2026

---

## How it fits together

```
Browser ──► Vercel (Next.js)  ──/api/* rewrite──►  Render (Express API)  ──►  Supabase
            earnio.vercel.app                       earnio-api.onrender.com
```

- **The browser only talks to the Vercel domain.** Next.js rewrites `/api/*` to the Render API (`API_PROXY_TARGET`), so the API's httpOnly refresh cookie is set on the Vercel domain.
- **Why the rewrite is required:** `*.vercel.app` and `*.onrender.com` are different sites, and `onrender.com` is a public suffix. Without the rewrite, the `SameSite=Strict` refresh cookie is never sent back, and users are logged out every hour when the access token expires.
- **Free-tier cost:** $0. The trade-off is that the Render free web service sleeps when idle, so the first request after a quiet period is slow. Open `/api/health` a minute before a demo to wake it.

---

## Step 1: Supabase

1. Create a **new** project at [supabase.com](https://supabase.com) for production. Don't reuse a dev project: the old seed migrations (`*_seed_*.sql`) give every user who exists when they run demo money, so run them on an empty database.
2. Apply migrations from the repo root:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. Check **Advisors** (Database → Advisors) for security warnings.
4. Copy from **Project Settings → API**: Project URL, `anon` key, `service_role` key.
5. **JWT verification:** leave `SUPABASE_JWT_SECRET` unset on the API. Newer projects sign tokens with asymmetric keys, and the API then verifies them through the project's JWKS. Only set the secret if your project still uses the legacy HS256 shared secret (if every request returns 401, unset it).
6. Under **Authentication → URL Configuration**, add `https://<your-vercel-domain>/auth/callback` as a redirect URL if you enable Google or Apple sign-in.

**Test migrations before pushing** (needs a local Postgres):
```bash
PGHOST=/var/run/postgresql PGUSER=postgres supabase/tests/run.sh
```

---

## Step 2: API on Render

The repo ships a Blueprint: [`render.yaml`](../render.yaml).

> **Already have an `earnio-api` service?** Don't apply the Blueprint (it would create a second service). Open the existing service → **Environment** and make sure it has the variables in the tables below, including `TRUST_PROXY_HOPS=2`, then set **Settings → Health Check Path** to `/api/health`. A Node service with root directory `backend`, build `npm install && npm run build` and start `npm start` works the same as the Docker one.

1. Render dashboard → **New → Blueprint** → select this repo.
2. Fill in the values it asks for:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://earnio.vercel.app` (no trailing slash) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key (required in production) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional. Without them, emails are skipped and in-app notifications still work |

Set automatically by the Blueprint: `NODE_ENV=production`, `ENCRYPTION_KEY` and `SYNC_CRON_SECRET` (generated), `TRUST_PROXY_HOPS=2` (Vercel + Render's load balancer, so rate limits key on the visitor's IP), `ENABLE_SYNC_CRON=false`.

3. Deploy, then check: `curl https://<your-api>.onrender.com/api/health` → `{"status":"ok",...}`.

> **Keep `ENCRYPTION_KEY` stable.** Bank account numbers are encrypted with it; changing it makes existing ones unreadable.

---

## Step 3: Frontend on Vercel

1. Vercel → **Add New → Project** → import this repo, **Root Directory: `frontend`**.
2. Environment variables (Production):

| Variable | Value |
|----------|-------|
| `API_PROXY_TARGET` | Render API origin, e.g. `https://earnio-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `/` (same origin, goes through the rewrite) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (only needed for Google/Apple sign-in) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` key (same) |

3. Deploy. `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.
4. Check `https://<your-vercel-domain>/api/health` returns the API's health JSON. That proves the rewrite works.

---

## Step 4: Seed the demo

Point the seed script at the deployed site and run it once:
```bash
BACKEND_URL=https://<your-vercel-domain> npm run seed:demo
```
It prints the demo sponsor and creator logins.

---

## Step 5: Verify

- [ ] `/api/health` is `ok` through the Vercel domain
- [ ] Sign up as a creator and as a sponsor, from a phone and a laptop
- [ ] Full loop: create campaign → apply → approve → submit post link → approve deliverable → mark paid → wallet credit → payout request
- [ ] Log in, then remove the `ct-access-token` cookie in DevTools and reload `/dashboard`: you should stay signed in (refresh cookie works)
- [ ] DevTools console shows zero errors on every page
- [ ] Manual QA: [QA_MANUAL_CHECKLIST.md](./QA_MANUAL_CHECKLIST.md)

**Optional platform sync cron.** Not needed for the demo (creators sync from the Platforms page). If you want it, call `POST https://<your-api>/api/sync/cron` with header `x-cron-secret: <SYNC_CRON_SECRET>` from any scheduler.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Every API call returns 401 | `SUPABASE_JWT_SECRET` set on a project that uses asymmetric signing keys | Unset it on Render and redeploy |
| Logged out after about an hour | Browser is calling the Render domain directly | Set `NEXT_PUBLIC_API_URL=/` and `API_PROXY_TARGET`, then redeploy Vercel |
| `/api/health` on Vercel is a 404 | `API_PROXY_TARGET` missing at build time | Add it and redeploy |
| First request takes a long time | Render free instance was asleep | Expected on the free plan; warm it before demos |
| CORS error | Browser bypasses the rewrite, or `FRONTEND_URL` doesn't match | Use the rewrite; set `FRONTEND_URL` exactly (no trailing slash) |
| Mark paid fails | Missing service role key, or a deliverable isn't approved yet | Set `SUPABASE_SERVICE_ROLE_KEY`; approve each submitted deliverable |
| Payout request fails with "temporarily unavailable" | Missing service role key | Set `SUPABASE_SERVICE_ROLE_KEY` |
| No emails | Resend not configured | Set `RESEND_API_KEY` and `EMAIL_FROM` (optional) |
| Too many auth attempts (429) for everyone | `TRUST_PROXY_HOPS` too low, so all users share one IP | Keep `TRUST_PROXY_HOPS=2` with the Vercel rewrite |
