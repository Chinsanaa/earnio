-- Exploit checks for 20261018120000_demo_integrity_hardening.sql.
-- Each block acts as a signed-in user calling Supabase directly and must be
-- blocked. Run with supabase/tests/run.sh (fails on the first violation).
\set ON_ERROR_STOP 1

-- Fixtures (as superuser) -----------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'sponsor@test.dev', '{"username":"sp","user_type":"sponsor"}'),
  ('00000000-0000-0000-0000-00000000000b', 'creator@test.dev', '{"username":"cr","user_type":"creator"}'),
  ('00000000-0000-0000-0000-00000000000c', 'other@test.dev',   '{"username":"cr2","user_type":"creator"}');

INSERT INTO public.sponsorships (id, sponsor_user_id, title, description, payment_amount_mnt, status)
VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Test', 'Desc', 100000, 'active');

CREATE OR REPLACE FUNCTION pg_temp.act_as(uid uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', uid::text, false),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
$$;

-- Expect a statement to raise. Usage: SELECT pg_temp.expect_error($q$...$q$, 'label');
CREATE OR REPLACE FUNCTION pg_temp.expect_error(stmt text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ok (blocked): % -> %', label, SQLERRM;
    RETURN;
  END;
  RAISE EXCEPTION 'NOT BLOCKED: %', label;
END;
$$;
GRANT EXECUTE ON FUNCTION pg_temp.expect_error(text, text) TO authenticated;

-- 1. Sponsor cannot apply to a campaign -------------------------------------
SELECT pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
SET ROLE authenticated;
SELECT pg_temp.expect_error($q$
  INSERT INTO public.sponsorship_applications (sponsorship_id, creator_user_id, response_text)
  VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'me')
$q$, 'sponsor applying');
RESET ROLE;

-- 2. Creator cannot insert a pre-approved application -----------------------
SELECT pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
SET ROLE authenticated;
SELECT pg_temp.expect_error($q$
  INSERT INTO public.sponsorship_applications (sponsorship_id, creator_user_id, response_text, status)
  VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'pitch', 'approved')
$q$, 'insert approved application');

-- Normal apply works
INSERT INTO public.sponsorship_applications (id, sponsorship_id, creator_user_id, response_text)
VALUES ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'pitch');

-- 3. Creator cannot self-approve ---------------------------------------------
SELECT pg_temp.expect_error($q$
  UPDATE public.sponsorship_applications SET status = 'approved'
  WHERE id = '20000000-0000-0000-0000-000000000001'
$q$, 'creator self-approve');

-- 4. Creator cannot submit a deliverable before approval --------------------
SELECT pg_temp.expect_error($q$
  UPDATE public.sponsorship_applications SET deliverable_url = 'https://www.tiktok.com/@cr/video/1'
  WHERE id = '20000000-0000-0000-0000-000000000001'
$q$, 'deliverable before approval');
RESET ROLE;

-- 5. Sponsor approves (allowed), then cannot edit the deliverable -----------
SELECT pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
SET ROLE authenticated;
UPDATE public.sponsorship_applications SET status = 'approved', approved_at = now()
WHERE id = '20000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sponsorship_applications
                 WHERE id = '20000000-0000-0000-0000-000000000001' AND status = 'approved') THEN
    RAISE EXCEPTION 'sponsor approval did not apply';
  END IF;
END $$;
SELECT pg_temp.expect_error($q$
  UPDATE public.sponsorship_applications SET deliverable_url = 'https://evil.example'
  WHERE id = '20000000-0000-0000-0000-000000000001'
$q$, 'sponsor edits deliverable');
SELECT pg_temp.expect_error($q$
  UPDATE public.sponsorship_applications SET status = 'pending'
  WHERE id = '20000000-0000-0000-0000-000000000001'
$q$, 'sponsor reverts approved to pending');
RESET ROLE;

-- 6. Creator can submit a deliverable once approved -------------------------
SELECT pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
SET ROLE authenticated;
UPDATE public.sponsorship_applications
SET deliverable_url = 'https://www.tiktok.com/@cr/video/1', deliverable_submitted_at = now()
WHERE id = '20000000-0000-0000-0000-000000000001';

-- 7. Bank account verified flag is server-only ------------------------------
INSERT INTO public.bank_accounts (id, user_id, bank_name, account_number, account_holder_name, verified)
VALUES ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'Khan Bank', 'enc', 'Cr', true);
UPDATE public.bank_accounts SET verified = true WHERE id = '30000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  IF (SELECT verified FROM public.bank_accounts WHERE id = '30000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'NOT BLOCKED: bank self-verify';
  END IF;
  RAISE NOTICE 'ok (blocked): bank self-verify';
END $$;

-- 8. Follower count is server-only -------------------------------------------
INSERT INTO public.platform_accounts (id, user_id, platform, platform_username, platform_user_id, follower_count)
VALUES ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'tiktok', '@cr', 'live_cr_tiktok', 9999999);
UPDATE public.platform_accounts SET follower_count = 9999999 WHERE id = '40000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  IF (SELECT follower_count FROM public.platform_accounts WHERE id = '40000000-0000-0000-0000-000000000001') <> 0 THEN
    RAISE EXCEPTION 'NOT BLOCKED: follower count edit';
  END IF;
  RAISE NOTICE 'ok (blocked): follower count edit';
END $$;

-- 9. Clients cannot insert wallet rows (not even pending payouts) -----------
SELECT pg_temp.expect_error($q$
  INSERT INTO public.wallet_transactions (user_id, type, amount_mnt, status)
  VALUES ('00000000-0000-0000-0000-00000000000b', 'payout', 999999999, 'pending')
$q$, 'client payout insert');
RESET ROLE;

-- 10. A campaign cannot credit the same creator twice ------------------------
SET ROLE service_role;
INSERT INTO public.wallet_transactions (user_id, type, amount_mnt, status, reference_type, reference_id)
VALUES ('00000000-0000-0000-0000-00000000000b', 'sponsorship_credit', 100000, 'completed', 'sponsorship', '10000000-0000-0000-0000-000000000001');
SELECT pg_temp.expect_error($q$
  INSERT INTO public.wallet_transactions (user_id, type, amount_mnt, status, reference_type, reference_id)
  VALUES ('00000000-0000-0000-0000-00000000000b', 'sponsorship_credit', 100000, 'completed', 'sponsorship', '10000000-0000-0000-0000-000000000001')
$q$, 'double sponsorship credit');

-- Service role can still do server-side work (e.g. verify a bank account)
UPDATE public.bank_accounts SET verified = true WHERE id = '30000000-0000-0000-0000-000000000001';
RESET ROLE;

\echo 'integrity.sql: all checks passed'
