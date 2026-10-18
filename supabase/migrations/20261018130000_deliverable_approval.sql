-- Deliverable approval (docs/SHIP_PLAN.md, Phase 3).
--
-- Mirrors how Collabstr/Insense release payment: the creator submits a post
-- link, the brand approves it, and only then can the campaign be paid.

ALTER TABLE public.sponsorship_applications
  ADD COLUMN IF NOT EXISTS deliverable_approved_at timestamptz;

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
     OR NEW.deliverable_submitted_at IS NOT NULL
     OR NEW.deliverable_approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'New applications must start as pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_sponsorship_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  caller_is_sponsor boolean;
  deliverable_changed boolean;
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

  deliverable_changed :=
    NEW.deliverable_url IS DISTINCT FROM OLD.deliverable_url
    OR NEW.deliverable_submitted_at IS DISTINCT FROM OLD.deliverable_submitted_at;

  SELECT EXISTS (
    SELECT 1 FROM public.sponsorships
    WHERE id = OLD.sponsorship_id AND sponsor_user_id = auth.uid()
  ) INTO caller_is_sponsor;

  IF caller_is_sponsor THEN
    -- Sponsors review applications; they never edit the creator's deliverable.
    IF deliverable_changed THEN
      RAISE EXCEPTION 'Sponsors cannot change a deliverable';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
      RAISE EXCEPTION 'Only pending applications can be approved or rejected';
    END IF;
    IF NEW.deliverable_approved_at IS DISTINCT FROM OLD.deliverable_approved_at
       AND (OLD.deliverable_approved_at IS NOT NULL
            OR OLD.deliverable_url IS NULL
            OR OLD.status <> 'approved') THEN
      RAISE EXCEPTION 'Only a submitted deliverable can be approved, once';
    END IF;
    RETURN NEW;
  END IF;

  -- Otherwise the caller is the creator (RLS already limits them to own rows).
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.sponsor_notes IS DISTINCT FROM OLD.sponsor_notes
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.deliverable_approved_at IS DISTINCT FROM OLD.deliverable_approved_at THEN
    RAISE EXCEPTION 'Creators cannot change the review status of an application';
  END IF;

  IF deliverable_changed AND OLD.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved applications can submit a deliverable';
  END IF;

  IF deliverable_changed AND OLD.deliverable_approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'An approved deliverable cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;
