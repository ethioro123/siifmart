-- Make public.system_logs accept every payload shape the app sends (login log, settings audit, WMS/POS/finance audit).
-- Idempotent: safe to run more than once.

ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS user_name    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS ip_address   TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_type  TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_id    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS performed_by TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS site_id      TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS module       TEXT;

-- Audit callers that omit these must not fail with NOT NULL violations
ALTER TABLE public.system_logs ALTER COLUMN module DROP NOT NULL;
ALTER TABLE public.system_logs ALTER COLUMN module SET DEFAULT 'General';
ALTER TABLE public.system_logs ALTER COLUMN user_name DROP NOT NULL;

-- Make sure authenticated users can still insert (append-only audit trail)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_logs' AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'CREATE POLICY "logs_insert_authenticated" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
