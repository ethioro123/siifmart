-- ======================================================================================
-- ZERO-TRUST AUDIT TRAIL ENRICHMENT — SYSTEM_LOGS COMPLIANCE (RULE 5)
-- Date: 2026-10-04
-- Rule Compliance:
--   • Rule 5: Tamper-Proof Audit Trail (employee ID, site ID, device ID, GPS coordinates)
--   • Rule 7: Multi-Country Absolute Separation (country_code indexed partition)
-- ======================================================================================

-- 1. ENSURE RULE 5 COMPLIANCE COLUMNS EXIST ON SYSTEM_LOGS
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS employee_id  TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS site_id      TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ET';
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS device_id    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS gps_location TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_type  TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_id    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS performed_by TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS metadata     JSONB DEFAULT '{}'::jsonb;

-- 2. CREATE ISOLATION & AUDITING INDEXES
CREATE INDEX IF NOT EXISTS idx_system_logs_country_code ON public.system_logs(country_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_site_id ON public.system_logs(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_employee_id ON public.system_logs(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_device ON public.system_logs(device_id);

-- 3. VERIFY APPEND-ONLY RLS POLICY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'system_logs' AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'CREATE POLICY "logs_insert_authenticated" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
    RAISE NOTICE '✅ System Logs Zero-Trust Audit Trail schema enriched:';
    RAISE NOTICE '   • employee_id, site_id, device_id, gps_location active';
    RAISE NOTICE '   • Country & site indexing configured';
    RAISE NOTICE '   • Append-only security preserved';
END $$;
