-- Integrity hardening (docs/SHIP_PLAN.md, Phase 2).
--
-- RLS decides which rows a user may touch, but it cannot compare old and new
-- column values. These triggers close the gaps where a signed-in user calling
-- Supabase directly (anon key + their JWT) could change columns the backend
-- treats as trusted: application status, bank verification, follower counts.
--
-- Trusted callers (service_role, migrations, SQL editor) are exempt. The
-- functions are SECURITY INVOKER so current_user is the calling role.

CREATE OR REPLACE FUNCTION public.is_trusted_db_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user NOT IN ('authenticated', 'anon');
$$;

-- ---------------------------------------------------------------------------
-- Sponsorship applications
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_sponsorship_application_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_db_role() THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'creator'
  ) THEN
    RAISE EXCEPTION 'Only creators can apply to sponsorships';
  END IF;

  IF NEW.status <> 'pending'
     OR NEW.approved_at IS NOT NULL
     OR NEW.sponsor_notes IS NOT NULL
     OR NEW.deliverable_url IS NOT NULL
     OR NEW.deliverable_submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'New applications must start as pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_sponsorship_application_insert_trigger ON public.sponsorship_applications;
CREATE TRIGGER guard_sponsorship_application_insert_trigger
  BEFORE INSERT ON public.sponsorship_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_sponsorship_application_insert();

CREATE OR REPLACE FUNCTION public.guard_sponsorship_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  caller_is_sponsor boolean;
BEGIN
  IF public.is_trusted_db_role() THEN
    RETURN NEW;
  END IF;

  IF NEW.sponsorship_id IS DISTINCT FROM OLD.sponsorship_id
     OR NEW.creator_user_id IS DISTINCT FROM OLD.creator_user_id
     OR NEW.response_text IS DISTINCT FROM OLD.response_text
     OR NEW.applied_at IS DISTINCT FROM OLD.applied_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'These application fields cannot be changed';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sponsorships
    WHERE id = OLD.sponsorship_id AND sponsor_user_id = auth.uid()
  ) INTO caller_is_sponsor;

  IF caller_is_sponsor THEN
    -- Sponsors review applications; they never edit the creator's deliverable.
    IF NEW.deliverable_url IS DISTINCT FROM OLD.deliverable_url
       OR NEW.deliverable_submitted_at IS DISTINCT FROM OLD.deliverable_submitted_at THEN
      RAISE EXCEPTION 'Sponsors cannot change a deliverable';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
      RAISE EXCEPTION 'Only pending applications can be approved or rejected';
    END IF;
    RETURN NEW;
  END IF;

  -- Otherwise the caller is the creator (RLS already limits them to own rows).
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.sponsor_notes IS DISTINCT FROM OLD.sponsor_notes
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Creators cannot change the review status of an application';
  END IF;

  IF (NEW.deliverable_url IS DISTINCT FROM OLD.deliverable_url
      OR NEW.deliverable_submitted_at IS DISTINCT FROM OLD.deliverable_submitted_at)
     AND OLD.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved applications can submit a deliverable';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_sponsorship_application_update_trigger ON public.sponsorship_applications;
CREATE TRIGGER guard_sponsorship_application_update_trigger
  BEFORE UPDATE ON public.sponsorship_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_sponsorship_application_update();

-- ---------------------------------------------------------------------------
-- Bank accounts: verification is server-only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_bank_account_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_db_role() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.verified := false;
  ELSE
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_bank_account_verified_trigger ON public.bank_accounts;
CREATE TRIGGER guard_bank_account_verified_trigger
  BEFORE INSERT OR UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_bank_account_verified();

-- ---------------------------------------------------------------------------
-- Platform accounts: follower counts come from platform sync (server-only).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_platform_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_trusted_db_role() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.follower_count := 0;
  ELSE
    NEW.follower_count := OLD.follower_count;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_platform_follower_count_trigger ON public.platform_accounts;
CREATE TRIGGER guard_platform_follower_count_trigger
  BEFORE INSERT OR UPDATE ON public.platform_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_platform_follower_count();

-- ---------------------------------------------------------------------------
-- Wallet: payouts are inserted by the backend (service role) after its
-- balance check. Clients can no longer insert any wallet rows.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS wallet_transactions_insert_payout_only ON public.wallet_transactions;
REVOKE INSERT ON public.wallet_transactions FROM authenticated;

-- One sponsorship credit (and one fee) per creator per campaign, so a campaign
-- can never be paid twice even if payment_marked_paid_at is reset.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_one_row_per_sponsorship
  ON public.wallet_transactions (user_id, reference_id, type)
  WHERE reference_type = 'sponsorship' AND reference_id IS NOT NULL;
