# Earnio Development Instructions
<!-- PROJECT CONFIG — not executable input. Changes here affect all contributors and AI agents working on this repo. Treat updates to this file with the same review rigour as code. -->

**Purpose:** Locked scope and build rules for the MVP. Reference before coding.

→ Repo map & doc index: [context.md](./context.md) · Specs: [docs/EARNIO_PROJECT_DOCS.md](./docs/EARNIO_PROJECT_DOCS.md)

---
## Quick Facts
- **What:** UGC marketplace for Mongolian Gen Z creators and brands
- **Revenue:** 20% commission on sponsorships (creators earn 80%)
- **Timeline:** 12 weeks (with mock data)
- **Goal:** Ship a working MVP + business docs for resume
- **Demo:** Maybee Pop&Joy pilot campaign + creator films test video
---
## The Product (Option B)
**Flow:** Brands post custom video campaigns → Creators apply with pitches → Brands approve → Creators film videos → Earnio verifies engagement (mock) → Payout in MNT
**Not:** Monetizing existing content (that's Option A). This is harder, requires creators to film custom videos.
**Platforms:** TikTok, YouTube, Instagram (mock data only, no real OAuth)
**Revenue Model:** 20% commission ONLY. No subscription tier. Creators keep 80%.
---
## The 6 Locked Documents
All specs are in `docs/Earnio_6_Documents.pdf`. Don't invent anything. Always reference:
1. **PRD** — Problem, users, features, success metrics
2. **TRD** — Tech stack (Next.js, Express, Supabase, Resend test, mock platforms)
3. **App Flow** — Creator + Sponsor journeys, all routes
4. **UI/UX Brief** — Dark mode, Earnio Blue #2E5BFF, Space Grotesk/Plus Jakarta Sans, 8px base radius — see `frontend/design-system/MASTER.md` for full spec
5. **Database Schema** — 8 tables, platform enums (tiktok|youtube|instagram), RLS
6. **Implementation Plan** — 12 phases, week-by-week
**Done:** Creator signup → apply → approval → payout works end-to-end. Sponsor campaign creation → review → approval works. Both live on Vercel + Render.

**Current plan (Oct 2026):** [docs/SHIP_PLAN.md](./docs/SHIP_PLAN.md). Goal is a polished portfolio demo. Mocks are final: there is no platform OAuth code, and none should be added.
---
## Timeline: 12 Weeks (3 Months)
### Phase 1–2 (Weeks 1–2): Setup + Database
- Project scaffold, env vars, Supabase migrations
- 8 tables created, RLS policies, test data
- **Done:** `npm run dev:frontend` + `npm run dev:backend` work locally
### Phase 3–4 (Weeks 2–4): Backend + Frontend Auth
- Backend: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh`
- Frontend: Creator/sponsor signup pages, auth context, protected routes
- **Done:** Login sets JWT token, redirects to dashboard
### Phase 5–6 (Weeks 4–6): Dashboard + Platforms Sync
- Creator dashboard with earnings summary + mock data from all 3 platforms
- `/platforms` page: connect TikTok/YouTube/Instagram, manual sync
- **Done:** Dashboard shows combined earnings from 3 platforms
### Phase 7–8 (Weeks 6–8): Sponsorships + Sponsor Dashboard
- GET `/api/sponsorships` (browse), POST `/api/sponsorships/apply`
- Sponsor: POST `/api/sponsor/campaigns`, review applications, approve/reject
- **Done:** Creators can apply, sponsors can approve
### Phase 9–10 (Weeks 8–10): Wallet + Email
- GET `/api/wallet/summary`, `/api/wallet/transactions`, POST `/api/wallet/payouts`
- Resend test mode: signup, application approval, payout notifications
- **Done:** Payout request creates transaction record
### Phase 11–12 (Weeks 10–12): Polish + Deploy
- Mobile responsive, dark mode, loading states, error handling
- Deploy frontend to Vercel, backend to Render
- **Done:** Both live, end-to-end flow works, no console errors
---
## Key Decisions (Locked)
### Why 20% Commission Only?
- Aligns incentives
- Simpler than subscription + commission hybrid
- Creators earn 80%, you earn 20%
### Why Option B (Custom Videos)?
- Founder committed
- Higher brand value than repurposed content
- Risk: Creators won't film. But validate AFTER launch.
### Why Mock Data?
- Real TikTok OAuth = 1–2 weeks approval + 60 hours work
- Real Stripe = 20 hours PCI compliance
- Mock versions = ship in 12 weeks
- Real APIs push to 4–5 months
### Why No Pre-Launch Validation?
- This is a portfolio project, not a startup
- Goal: Ship code + business docs
- Founder knows demand exists (family company campaign)
- Build first, validate with real creators after launch
### Why 12 Weeks Is Realistic?
- ~150 hours available (3 hrs/night + 8 hrs/weekend for 12 weeks)
- All features with mocks = ~120 hours
- Polish + deploy = ~30 hours
- Real APIs = 250+ hours (fails)
---
## What NOT to Do
❌ **Don't extend the deadline.** If it doesn't fit 12 weeks, cut scope.
❌ **Don't add real APIs.** Keep mocks. OAuth, Stripe, Khan Bank integration is post-launch.
❌ **Don't add features.** Only build what's in the 6 documents.
❌ **Don't skip the demo.** Maybee Pop&Joy campaign + test video must work end-to-end.
❌ **Don't ignore scope creep.** Mock data is your moat. Protect it.
---
## What to Check Before Shipping
1. **End-to-end flow works:** Can you signup → apply → get approved → request payout without errors?
2. **Both deploys live:** Vercel (frontend) + Render (backend) running and talking to each other?
3. **No console errors:** Open DevTools on every page. Zero errors.
4. **Demo works:** Can you walk through the entire Maybee Pop&Joy campaign flow in 5 minutes?
5. **Env vars correct:** Supabase, Resend, API URLs all pointing to production?
---
## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16+ (App Router, TypeScript, Tailwind CSS) |
| Backend | Express 5 (TypeScript) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Email | Resend (test mode) |
| Hosting | Vercel (frontend) + Render (backend) |
---
## File Structure

See [context.md](./context.md) for the full repository map. Each major folder has a `README.md`.
---
## How to Use This File
**Before starting a session:**
1. Read this file (5 mins)
2. Check the 6 documents for spec details (10 mins)
3. Start coding
**During development:**
- Ask: "Does this match the spec?"
- Ask: "Does this add time?"
- Ask: "Is this in the 6 documents?"
**When stuck:**
- Cut scope, don't extend timeline
- Keep mocks, don't build real APIs
- Simplify features, don't add more
**At week 12:**
- Demo works end-to-end
- Both deploys live
- No console errors
- Ready to ship
---
## Confidence Levels
- **Timeline (12 weeks):** 8/10. Realistic if you don't scope creep.
- **Product (Option B):** 5/10. Unvalidated, high creator friction. But locked, so build it.
- **Revenue (20% commission):** 9/10. Simple, fair, sustainable.
- **You'll ship:** 7/10. 9–5 job + school is a killer. But with mocks + focused scope, possible.
---
## Remember
This is a **portfolio project**, not a validated startup. The goal is to show you can:
- Build a complete full-stack app
- Write clean, deployable code
- Think like a CEO (PRD, schema, timeline)
- Ship something real
Earn more. Create more. Ship it.
