# Supabase — Database & Migrations

PostgreSQL schema, Row Level Security (RLS), auth triggers, and demo seed data for Earnio.

→ Schema details: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#-database-architecture-supabasemigrations) · Project map: [../context.md](../context.md)

---

## What lives here

```
supabase/
└── migrations/     # Timestamped SQL files — apply in order
```

There is no local Supabase config folder; connect your hosted Supabase project and apply migrations via CLI or SQL editor.

---

## Migration order (high level)

| Migration | Purpose |
|-----------|---------|
| `20250517115900_initial_schema.sql` | Core tables: users, platforms, earnings, sponsorships, applications, wallet |
| `20250518120000_auth_user_trigger.sql` | `handle_new_user` — profile row on signup |
| `20250519*` – `20250524*` | Demo seeds, wallet, notifications, RLS fixes |
| `20250523120000_username_availability_rpc.sql` | Username check RPC |
| `20250606120000_oauth_user_metadata.sql` | OAuth user metadata |
| `20260615120000_add_instagram_platform_support.sql` | Instagram enum + policies |
| `20260616120000_security_hardening_rls.sql` | RLS hardening |
| `20260618120000_password_reset_tokens.sql` | Password reset tokens |
| `20260618120100_email_verification.sql` | Email verification codes |
| `20260618120200_add_oauth_tokens_to_platform_accounts.sql` | OAuth token columns (unused since platform OAuth was removed) |
| `20261018120000_demo_integrity_hardening.sql` | Triggers that stop users changing application status, bank `verified`, or follower counts directly; clients can't insert wallet rows; one ledger row per creator per campaign |
| `20261018130000_deliverable_approval.sql` | `deliverable_approved_at`; sponsors approve a submitted post before paying |

---

## Apply migrations

**CLI (recommended):**

```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Dashboard:** Supabase → SQL Editor → run each file in chronological order.

---

## Key concepts

- **Auth:** Supabase Auth (`auth.users`); app profile in `public.users` via trigger.
- **RLS:** Every table has policies so users only access their own data.
- **Demo seeds:** Migrations with `seed` in the name populate sample earnings and campaigns for local QA.
- **User types:** `creator` | `sponsor` — enforced in app layer and RLS.

**Test the migrations locally:** `supabase/tests/run.sh` applies every migration to a fresh database on a local Postgres and runs exploit checks (`supabase/tests/integrity.sql`) for each hole the hardening migration closes.

Before production: audit all RLS policies. Checklist: [../docs/APP_OVERVIEW.md](../docs/APP_OVERVIEW.md).
