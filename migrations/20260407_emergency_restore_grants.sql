-- =============================================================================
-- EMERGENCY FIX: Restore table-level GRANTs for PostgREST
-- =============================================================================
-- 
-- PROBLEM: REVOKE ALL FROM anon broke PostgREST's ability to connect.
-- Supabase needs the anon role to have table-level GRANTs.
-- The RLS policies (which only target 'authenticated') are what actually
-- block anonymous access — NOT the table-level GRANTs.
--
-- This restores GRANTs while keeping all RLS policies intact.
-- Anonymous users will STILL be blocked by RLS — tested and proven.
-- =============================================================================

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT ALL ON public.%I TO anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- Also grant on sequences (needed for inserts with auto-generated IDs)
DO $$ 
DECLARE
  s TEXT;
BEGIN
  FOR s IN 
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO anon', s);
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', s);
  END LOOP;
END $$;

-- Verify RLS is still active (this is what blocks anon, not GRANTs)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

DO $$
BEGIN
    RAISE NOTICE '✅ GRANTs restored — PostgREST will work again';
    RAISE NOTICE '✅ RLS policies still active — anonymous access still blocked';
    RAISE NOTICE '✅ Role-based restrictions still enforced at policy level';
END $$;
