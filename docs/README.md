# Documentation

Canonical technical and operational docs for Earnio. **One topic per file** — no duplicates elsewhere in the repo.

→ Master index: [../context.md](../context.md)

---

## Guides

| File | Read when you need… |
|------|---------------------|
| [EARNIO_PROJECT_DOCS.md](./EARNIO_PROJECT_DOCS.md) | Original product specs (PRD, TRD, routes, UI brief, schema, 12-week plan) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, folder structure, data flows, DB schema, security model |
| [APP_OVERVIEW.md](./APP_OVERVIEW.md) | Current status, known gaps, troubleshooting, backlog |
| [FEATURES.md](./FEATURES.md) | Feature checklist (shipped vs. planned) |
| [FRONTEND.md](./FRONTEND.md) | Landing pages, auth UI, marketing routes, design tokens for web |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment (Vercel, Render, Supabase, Resend) |
| [QA_MANUAL_CHECKLIST.md](./QA_MANUAL_CHECKLIST.md) | Manual QA before each release |
| [SHIP_PLAN.md](./SHIP_PLAN.md) | 8-week finish-and-ship plan, audit findings, competitor research |

---

## In-app docs

The Next.js app at `/docs` renders two guides directly from this folder:

| URL slug | Source file |
|----------|-------------|
| `/docs/deployment` | `DEPLOYMENT.md` |
| `/docs/qa-checklist` | `QA_MANUAL_CHECKLIST.md` |

---

## Related (outside `docs/`)

| File | Purpose |
|------|---------|
| [../instructions.md](../instructions.md) | Locked MVP scope and build rules |
| [../SECURITY_AUDIT.md](../SECURITY_AUDIT.md) | Auth security audit |
| [../frontend/design-system/MASTER.md](../frontend/design-system/MASTER.md) | Web design tokens |
