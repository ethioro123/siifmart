-- ======================================================================================
-- ZERO-TRUST FULFILLMENT HARDENING — WMS_JOBS RLS & TAMPER PROTECTION
-- Date: 2026-10-04
-- Rule Compliance:
--   • Rule 1: Zero Autonomous Branch Authority (strict site & country isolation)
--   • Rule 4: Blind Audits & Receiving (prevents rubber-stamping & expected qty tampering)
--   • Rule 7: Multi-Country Absolute Separation (country_code partitioning & zero cross-leak)
--   • Rule 11: Floor Worker Interchangeability & Delivery Lockdown Law
--   • Rule 12: Chain of Custody & Acceptance Responsibility Law
-- ======================================================================================

-- 1. ADD COUNTRY_CODE COLUMN TO WMS_JOBS
ALTER TABLE public.wms_jobs ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'ET';

-- 2. BACKFILL COUNTRY_CODE FOR ALL EXISTING WMS_JOBS
-- From primary facility site
UPDATE public.wms_jobs j
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE (j.site_id::text = s.id::text OR j.site_id::text = s.code::text);

-- From source facility site if still default/null
UPDATE public.wms_jobs j
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE (j.country_code IS NULL OR j.country_code = 'ET')
  AND (j.source_site_id::text = s.id::text OR j.source_site_id::text = s.code::text);

-- From destination facility site if still default/null
UPDATE public.wms_jobs j
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE (j.country_code IS NULL OR j.country_code = 'ET')
  AND (j.dest_site_id::text = s.id::text OR j.dest_site_id::text = s.code::text);

-- Fallback to Ethiopia baseline
UPDATE public.wms_jobs SET country_code = 'ET' WHERE country_code IS NULL;

-- Enforce NOT NULL constraint
ALTER TABLE public.wms_jobs ALTER COLUMN country_code SET NOT NULL;

-- 3. CREATE PERFORMANCE & ISOLATION INDEXES
CREATE INDEX IF NOT EXISTS idx_wms_jobs_country_code ON public.wms_jobs(country_code);
CREATE INDEX IF NOT EXISTS idx_wms_jobs_country_site ON public.wms_jobs(country_code, site_id);
CREATE INDEX IF NOT EXISTS idx_wms_jobs_country_status ON public.wms_jobs(country_code, status);
CREATE INDEX IF NOT EXISTS idx_wms_jobs_assigned_to ON public.wms_jobs(assigned_to);

-- 4. HELPER FUNCTIONS FOR WORKER IDENTITY & NATIONAL SOVEREIGNTY
CREATE OR REPLACE FUNCTION public.get_my_country_code()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(s.country, 'ET')
    FROM public.employees e
    LEFT JOIN public.sites s ON (s.id::text = e.site_id::text OR s.code::text = e.site_id::text)
    WHERE e.id::text = auth.uid()::text
       OR e.email = (SELECT email FROM auth.users WHERE id::text = auth.uid()::text)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_employee_code()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT code FROM public.employees 
    WHERE id::text = auth.uid()::text
       OR email = (SELECT email FROM auth.users WHERE id::text = auth.uid()::text)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT site_id::text FROM public.employees 
    WHERE id::text = auth.uid()::text
       OR email = (SELECT email FROM auth.users WHERE id::text = auth.uid()::text)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Update is_manager() to encompass all leadership and supervisory tiers
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin', 'admin', 'CEO',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager',
    'store_manager', 'warehouse_manager', 'dispatch_manager',
    'assistant_manager', 'shift_lead', 'store_supervisor',
    'fleet_maintenance_supervisor', 'corporate_merchandising_manager',
    'inventory_manager', 'logistics_manager'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. TRIGGER: AUTO-STAMP DEFAULT COUNTRY_CODE ON INSERT
CREATE OR REPLACE FUNCTION public.set_wms_jobs_default_country_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
        SELECT UPPER(COALESCE(s.country, 'ET')) INTO NEW.country_code
        FROM public.sites s
        WHERE (s.id::text = NEW.site_id::text OR s.code::text = NEW.site_id::text)
        LIMIT 1;
        
        IF NEW.country_code IS NULL OR NEW.country_code = '' THEN
            NEW.country_code := COALESCE(public.get_my_country_code(), 'ET');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_wms_jobs_default_country_code ON public.wms_jobs;
CREATE TRIGGER trg_wms_jobs_default_country_code
    BEFORE INSERT ON public.wms_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_wms_jobs_default_country_code();

-- 6. TRIGGER: WORKER TAMPER PROTECTION & QUANTITY INVARIANT ENFORCEMENT
-- Non-managers cannot alter site, country, order ref, reassign claimed jobs, or reduce expected quantities
CREATE OR REPLACE FUNCTION public.enforce_wms_job_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
    old_item JSONB;
    new_item JSONB;
    old_sku TEXT;
    new_sku TEXT;
    old_exp NUMERIC;
    new_exp NUMERIC;
    i INT;
    old_count INT;
    new_count INT;
BEGIN
    -- Super admins, CEOs, and authorized managers bypass worker-level tamper protection
    IF public.is_ceo() OR public.is_manager() THEN
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;

    -- 1. Facility Site Lockdown: Workers cannot move jobs across facilities
    IF NEW.site_id::text IS DISTINCT FROM OLD.site_id::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot reassign the facility site_id of a job.';
    END IF;

    -- 2. National Country Isolation: Workers cannot alter country tenancy
    IF NEW.country_code::text IS DISTINCT FROM OLD.country_code::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the country_code of a job.';
    END IF;

    -- 3. Order Reference Integrity: Workers cannot alter order/PO linkages
    IF NEW.order_ref::text IS DISTINCT FROM OLD.order_ref::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the order reference of a job.';
    END IF;

    -- 4. Assignment Integrity: Worker cannot hijack or reassign an already claimed job
    IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to::text <> '' THEN
        IF NEW.assigned_to::text IS DISTINCT FROM OLD.assigned_to::text THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only supervisors and dispatchers can reassign active jobs.';
        END IF;
    END IF;

    -- 5. Line Item Tamper Protection: Prevent altering expectedQty or dropping line items to conceal shrinkage
    IF OLD.line_items IS NOT NULL AND jsonb_typeof(OLD.line_items) = 'array' THEN
        old_count := jsonb_array_length(OLD.line_items);
        new_count := COALESCE(jsonb_array_length(NEW.line_items), 0);

        IF new_count < old_count THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot delete line items from a job manifest.';
        END IF;

        FOR i IN 0..(old_count - 1) LOOP
            old_item := OLD.line_items->i;
            new_item := NEW.line_items->i;

            old_sku := COALESCE(old_item->>'sku', old_item->>'productId', '');
            new_sku := COALESCE(new_item->>'sku', new_item->>'productId', '');

            IF old_sku <> '' AND new_sku <> '' AND old_sku = new_sku THEN
                old_exp := COALESCE((old_item->>'expectedQty')::numeric, (old_item->>'expected_qty')::numeric, (old_item->>'orderedQty')::numeric, 0);
                new_exp := COALESCE((new_item->>'expectedQty')::numeric, (new_item->>'expected_qty')::numeric, (new_item->>'orderedQty')::numeric, 0);

                IF old_exp > 0 AND new_exp <> old_exp THEN
                    RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot modify expected quantity (SKU: %, Expected: %, Attempted: %). Discrepancies must be recorded as Short/Discrepancy.',
                        old_sku, old_exp, new_exp;
                END IF;
            END IF;
        END LOOP;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_wms_jobs_tamper_protection ON public.wms_jobs;
CREATE TRIGGER trg_wms_jobs_tamper_protection
    BEFORE UPDATE ON public.wms_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_wms_job_update_restrictions();

-- 7. ZERO-TRUST RLS POLICIES FOR WMS_JOBS
ALTER TABLE public.wms_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wms_jobs_read" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_select" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_insert" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_update" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_delete" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_zero_trust_select" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_zero_trust_insert" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_zero_trust_update" ON public.wms_jobs;
DROP POLICY IF EXISTS "wms_jobs_zero_trust_delete" ON public.wms_jobs;

-- SELECT: CEO sees all; Managers see their national tenant; Floor workers see their assigned site or explicit assignments
CREATE POLICY "wms_jobs_zero_trust_select" ON public.wms_jobs
    FOR SELECT TO authenticated
    USING (
        public.is_ceo()
        OR (
            (public.is_manager() OR public.is_admin())
            AND (
                country_code = public.get_my_country_code()
                OR site_id::text IN (SELECT id::text FROM public.sites WHERE country = public.get_my_country_code())
                OR site_id::text IN (SELECT code::text FROM public.sites WHERE country = public.get_my_country_code())
            )
        )
        OR (
            country_code = public.get_my_country_code()
            AND (
                site_id::text = public.get_my_site_code_or_id()::text
                OR dest_site_id::text = public.get_my_site_code_or_id()::text
                OR assigned_to::text = auth.uid()::text
                OR (public.get_my_employee_id() IS NOT NULL AND assigned_to::text = public.get_my_employee_id()::text)
                OR (public.get_my_employee_code() IS NOT NULL AND assigned_to::text = public.get_my_employee_code()::text)
                OR EXISTS (
                    SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id::text = public.wms_jobs.id::text
                      AND (
                          ja.employee_id::text = auth.uid()::text
                          OR (public.get_my_employee_id() IS NOT NULL AND ja.employee_id::text = public.get_my_employee_id()::text)
                          OR (public.get_my_employee_code() IS NOT NULL AND ja.employee_id::text = public.get_my_employee_code()::text)
                      )
                )
            )
        )
    );

-- INSERT: Managers or operational floor staff within their country
CREATE POLICY "wms_jobs_zero_trust_insert" ON public.wms_jobs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_ceo()
        OR (public.is_manager() AND country_code = public.get_my_country_code())
        OR (
            public.get_my_role() IN (
                'receiver', 'picker', 'packer', 'inventory_specialist',
                'forklift_operator', 'stock_clerk', 'dispatcher', 'cashier', 'driver'
            )
            AND country_code = public.get_my_country_code()
        )
    );

-- UPDATE: Managers update any job in their country; Workers can only update their assigned job (or claim unassigned at their site)
CREATE POLICY "wms_jobs_zero_trust_update" ON public.wms_jobs
    FOR UPDATE TO authenticated
    USING (
        public.is_ceo()
        OR (public.is_manager() AND country_code = public.get_my_country_code())
        OR (
            country_code = public.get_my_country_code()
            AND (
                assigned_to::text = auth.uid()::text
                OR (public.get_my_employee_id() IS NOT NULL AND assigned_to::text = public.get_my_employee_id()::text)
                OR (public.get_my_employee_code() IS NOT NULL AND assigned_to::text = public.get_my_employee_code()::text)
                OR EXISTS (
                    SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id::text = public.wms_jobs.id::text
                      AND (
                          ja.employee_id::text = auth.uid()::text
                          OR (public.get_my_employee_id() IS NOT NULL AND ja.employee_id::text = public.get_my_employee_id()::text)
                          OR (public.get_my_employee_code() IS NOT NULL AND ja.employee_id::text = public.get_my_employee_code()::text)
                      )
                )
                OR (
                    (assigned_to IS NULL OR assigned_to::text = '')
                    AND (
                        site_id::text = public.get_my_site_code_or_id()::text
                        OR dest_site_id::text = public.get_my_site_code_or_id()::text
                    )
                )
            )
        )
    );

-- DELETE: Exclusively CEO / Super Admin (Zero Autonomous Branch Authority; floor uses status = 'Cancelled')
CREATE POLICY "wms_jobs_zero_trust_delete" ON public.wms_jobs
    FOR DELETE TO authenticated
    USING (public.is_ceo());

-- 8. TIGHTEN WMS_JOB_ITEMS (TIED TO WMS_JOBS ACCESS)
ALTER TABLE IF EXISTS public.wms_job_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wms_job_items_read" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_insert" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_update" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_delete" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_zero_trust_select" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_zero_trust_insert" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_zero_trust_update" ON public.wms_job_items;
DROP POLICY IF EXISTS "wms_job_items_zero_trust_delete" ON public.wms_job_items;

CREATE POLICY "wms_job_items_zero_trust_select" ON public.wms_job_items
    FOR SELECT TO authenticated
    USING (job_id::text IN (SELECT id::text FROM public.wms_jobs));

CREATE POLICY "wms_job_items_zero_trust_insert" ON public.wms_job_items
    FOR INSERT TO authenticated
    WITH CHECK (job_id::text IN (SELECT id::text FROM public.wms_jobs));

CREATE POLICY "wms_job_items_zero_trust_update" ON public.wms_job_items
    FOR UPDATE TO authenticated
    USING (job_id::text IN (SELECT id::text FROM public.wms_jobs));

CREATE POLICY "wms_job_items_zero_trust_delete" ON public.wms_job_items
    FOR DELETE TO authenticated
    USING (public.is_ceo());

DO $$
BEGIN
    RAISE NOTICE '✅ WMS Jobs Zero-Trust RLS Hardening successfully installed:';
    RAISE NOTICE '   • Country scoping and indexes enabled';
    RAISE NOTICE '   • Line items tamper protection trigger active';
    RAISE NOTICE '   • Assignment and site isolation enforced';
    RAISE NOTICE '   • Physical DELETE locked exclusively to CEO';
END $$;
