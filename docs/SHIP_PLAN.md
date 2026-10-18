# Earnio Ship Plan

> **Goal:** a polished portfolio demo on a public URL that anyone can click through end to end without errors. Not a real-money marketplace (no registered company yet).
> **Budget:** 8 weeks, solo, about 10 to 15 hours per week.
> **Map:** [../context.md](../context.md) · Scope rules: [../instructions.md](../instructions.md)
> Written October 2026.

---

## Why we were stuck

- **Real platform APIs.** TikTok and Instagram OAuth need app review, and Instagram needs business verification (likely a registered company). Half-built OAuth code silently fell back to mock data anyway.
- **Scope creep.** An iOS app, a Capacitor wrapper, six design-refresh phases and ~25 unrelated AI media skills, while the core loop already worked.

**Fix:** stop chasing APIs (mocks are final for the demo), delete what doesn't serve the web demo, close the security holes, deploy, and freeze design.

---

## Audit findings (October 2026)

| # | Finding | Severity | Phase |
|---|---------|----------|-------|
| 1 | RLS lets a creator update `status` on their own application (self-approve), which then gets paid on "Mark paid" | High | 2 |
| 2 | Users can set `verified=true` on their own bank account | Medium | 2 |
| 3 | `wallet_transactions_insert_payout_only` lets a user insert a pending payout of any amount, bypassing the backend balance check | Medium | 2 |
| 4 | `markCampaignPaid` writes ledger rows and the paid timestamp separately with no unique index; a double click can pay twice | Medium | 2 |
| 5 | Apply doesn't check the user is a creator or meets follower minimums | Low | 2 |
| 6 | Deliverable URL isn't validated before use as a link | Low | 2 |
| 7 | Refresh cookie is `SameSite=Strict` on the API domain; Vercel + Render on different domains means refresh fails in production | High (deploy) | 4 |
| 8 | Old seed migrations credit every existing user with ~3M MNT of fake money | Info (demo) | 3 |

---

## What similar platforms do (research summary)

| Platform | Brand pays | Creator paid | Verification |
|----------|-----------|--------------|--------------|
| Collabstr | Upfront, held until approval ([source](https://collabstr.com/features/approve-and-pay/)) | On brand approval | Brand reviews content in dashboard |
| Insense | Prepaid balance, fee held on hire ([source](https://insense.pro/faq/clients/en)) | Wallet after approval, withdraw to bank ([source](https://insense.pro/faq/creators/en)) | Brand approval |
| JoinBrands | Brand fee by tier | 20% creator fee, weekly withdrawals on free plan ([source](https://help.joinbrands.com/en/articles/12946168-creators-joinbrands-creator-fees)) | Brand approval |
| Fiverr | Upfront | 14-day clearance after completion (third-party source) | Buyer accepts delivery |

**Pattern:** money in first, human review of a posted link, release after approval, weekly payouts. No small marketplace verifies deliverables by API. So **manual link review + simulated money** is a faithful demo of how these products really work.

**Mongolia:** no Mongolian-built influencer marketplace was found (searches in English and Mongolian). Collabstr already lists Ulaanbaatar creators ([source](https://collabstr.com/influencer-marketing/ulaanbaatar-mongolia)). QPay merchant onboarding goes through a bank contract; fees around 1% domestic at TDB ([source](https://www.tdbm.mn/en/retail/cards/qpay-merchant)). Whether an ХХК is required is unverified but strongly implied.

---

## Phases

### Phase 1 (week 1): cut scope and noise ✅ done
- Deleted `ios/`, Capacitor, `.agents/skills/muapi-*`, stale plan docs, TikTok OAuth docs, unused `frontend/content/docs/`.
- Removed platform-connect OAuth (TikTok/YouTube/Instagram services, routes, callback pages). Google/Apple **login** stays.
- Platforms page now connects by username with a visible "demo data" notice.

### Phase 2 (weeks 2-3): security and integrity ✅ done
- New migration: trigger blocking creators from changing application `status`; trigger keeping bank `verified` server-only; drop the client payout-insert policy; block client writes to follower counts; unique index + single `mark_campaign_paid` Postgres function.
- Backend: creator-only apply, follower minimum check, deliverable URL allowlist (https + TikTok/YouTube/Instagram hosts).
- Tests for each hole: `supabase/tests/run.sh` (also runs in CI), backend unit tests, and checked against a local Supabase stack, including direct REST exploit attempts.

### Phase 3 (weeks 3-4): honest, complete demo ✅ done
- "Demo data" badge on dashboard platform stats.
- Sponsor **Approve deliverable** step before **Mark paid** (Collabstr/Insense pattern).
- Wallet payout timeline with "simulated" copy.
- Emails: new application → sponsor, deliverable submitted → sponsor.
- `npm run seed:demo` is the one supported demo path.
- Also fixed: payment no longer waits for the completion deadline (it blocked campaigns without one); anonymous pages no longer log a 401 from `/api/auth/refresh`; refresh has its own rate limit; dashboard handle/percentage/plural display bugs.

### Phase 4 (weeks 4-5): deploy 🟡 config done, accounts and deploy are yours
- Fresh Supabase prod project, migrations, advisors clean.
- Backend on Render (`render.yaml`, Dockerfile, health check). Free tier sleeps after idle; warm it before demos.
- Frontend on Vercel with a `/api/*` rewrite to Render so auth cookies are first-party. Verified in a local production build, including silent session refresh.
- Returning users bounced to `/login` after the 1-hour access token expires are now restored from the refresh cookie.

### Phase 5 (weeks 5-6): QA and polish 🟡 partly done
- Done: CI job runs every migration plus the exploit checks; Playwright happy path updated and passing locally; zero console errors on the flows walked.
- Not done: Playwright in CI (needs a Supabase stack in CI, about 2 GB of images per run; run it locally before releases instead). Manual QA on a real phone, EN and MN, light and dark. Design freeze.

### Phase 6 (weeks 7-8): ship and buffer 🟡 README done
- Done: README screenshots and a "what's real and what's simulated" table.
- Yours: live URL in README, 5-minute Maybee Pop&Joy demo recording.

---

## Your next actions (in order)

1. Create a fresh Supabase project and run `npx supabase db push` (Step 1 of [DEPLOYMENT.md](./DEPLOYMENT.md)).
2. Render → New → Blueprint → this repo; paste the Supabase values.
3. Vercel → import with root `frontend`; set `API_PROXY_TARGET` and `NEXT_PUBLIC_API_URL=/`.
4. `BACKEND_URL=https://<vercel-domain> npm run seed:demo`.
5. Walk the QA checklist on your phone; note anything broken.
6. Record the 5-minute demo and add the live URL to the README.

---

## Not doing (scope guard)
Platform OAuth, QPay or bank rails, escrow, admin panel, iOS app, new design phases.

**Later, if this becomes a real product:** register an ХХК → QPay/SocialPay merchant → admin payout panel → keep manual link review (already built) → add YouTube Data API (API key only, no review needed).
