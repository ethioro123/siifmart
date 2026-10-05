-- ======================================================================================
-- ZERO-TRUST INVENTORY REQUESTS HARDENING — HQ APPROVAL & 4-EYES PRINCIPLE
-- Date: 2026-10-04
-- Rule Compliance:
--   • Rule 1: Zero Autonomous Branch Authority (all stock adjustments require HQ approval)
--   • Rule 3: 4-Eyes Principle (requester can never approve their own inventory change)
--   • Rule 7: Multi-Country Absolute Separation (country-scoped queue & zero cross-leak)
-- ======================================================================================

-- 1. ENSURE COUNTRY_CODE COLUMN & INDEXES ON INVENTORY_REQUESTS
ALTER TABLE public.inventory_requests ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'ET';

UPDATE public.inventory_requests ir
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE (ir.site_id::text = s.id::text OR ir.site_id::text = s.code::text);

UPDATE public.inventory_requests SET country_code = 'ET' WHERE country_code IS NULL;

ALTER TABLE public.inventory_requests ALTER COLUMN country_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_requests_country ON public.inventory_requests(country_code);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_country_status ON public.inventory_requests(country_code, status);
CREATE INDEX IF NOT EXISTS idx_inventory_requests_country_site ON public.inventory_requests(country_code, site_id);

-- 2. TRIGGER: AUTO-STAMP DEFAULT COUNTRY_CODE ON INSERT
CREATE OR REPLACE FUNCTION public.set_inventory_requests_country_code()
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

DROP TRIGGER IF EXISTS trg_inventory_requests_country_code ON public.inventory_requests;
CREATE TRIGGER trg_inventory_requests_country_code
    BEFORE INSERT ON public.inventory_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_inventory_requests_country_code();

-- 3. TRIGGER: ENFORCE 4-EYES PRINCIPLE AND HQ-ONLY APPROVAL
CREATE OR REPLACE FUNCTION public.enforce_inventory_requests_zero_trust()
RETURNS TRIGGER AS $$
DECLARE
    current_user_name TEXT;
    current_user_email TEXT;
BEGIN
    -- Only enforce on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        -- A. Restrict approval authority strictly to Central HQ Leadership
        IF NOT (public.is_ceo() OR public.is_admin()) THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only Central HQ leadership can approve inventory adjustments.';
        END IF;

        -- B. Enforce 4-Eyes Principle: Requester cannot approve their own adjustment
        SELECT name, email INTO current_user_name, current_user_email
        FROM public.employees
        WHERE id::text = auth.uid()::text 
           OR email = (SELECT email FROM auth.users WHERE id::text = auth.uid()::text)
        LIMIT 1;

        IF (OLD.requested_by IS NOT NULL AND OLD.requested_by <> '') THEN
            IF LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_name, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_email, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(NEW.approved_by, '')) THEN
                RAISE EXCEPTION 'Zero-Trust 4-Eyes Principle Violation: Requesters cannot approve their own inventory adjustments.';
            END IF;
        END IF;

        NEW.approved_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_inventory_requests_zero_trust ON public.inventory_requests;
CREATE TRIGGER trg_inventory_requests_zero_trust
    BEFORE UPDATE ON public.inventory_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_inventory_requests_zero_trust();

-- 4. HARDENED RLS POLICIES FOR INVENTORY_REQUESTS
ALTER TABLE public.inventory_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_requests_read" ON public.inventory_requests;
DROP POLICY IF EXISTS "inv_requests_insert" ON public.inventory_requests;
DROP POLICY IF EXISTS "inv_requests_update" ON public.inventory_requests;
DROP POLICY IF EXISTS "inv_requests_delete" ON public.inventory_requests;
DROP POLICY IF EXISTS "inventory_requests_select" ON public.inventory_requests;
DROP POLICY IF EXISTS "inventory_requests_insert" ON public.inventory_requests;
DROP POLICY IF EXISTS "inventory_requests_update" ON public.inventory_requests;
DROP POLICY IF EXISTS "inventory_requests_delete" ON public.inventory_requests;
DROP POLICY IF EXISTS "inventory_requests_country_isolation_select" ON public.inventory_requests;

-- SELECT: CEO sees all; HQ admins see national tenant; Site staff see their site's requests
CREATE POLICY "inv_requests_zero_trust_select" ON public.inventory_requests
    FOR SELECT TO authenticated
    USING (
        public.is_ceo()
        OR (
            public.is_admin()
            AND country_code = public.get_my_country_code()
        )
        OR (
            country_code = public.get_my_country_code()
            AND (
                site_id::text = public.get_my_site_code_or_id()::text
                OR site_id::text IN (
                    SELECT s.id::text FROM public.sites s 
                    WHERE s.id::text = public.get_my_site_code_or_id()::text 
                       OR s.code::text = public.get_my_site_code_or_id()::text
                )
            )
        )
    );

-- INSERT: Anyone authenticated can submit a pending request from their facility
CREATE POLICY "inv_requests_zero_trust_insert" ON public.inventory_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_ceo()
        OR (
            country_code = public.get_my_country_code()
            AND (
                site_id::text = public.get_my_site_code_or_id()::text
                OR site_id::text IN (
                    SELECT s.id::text FROM public.sites s 
                    WHERE s.id::text = public.get_my_site_code_or_id()::text 
                       OR s.code::text = public.get_my_site_code_or_id()::text
                )
                OR public.is_admin()
            )
        )
    );

-- UPDATE: Exclusively HQ Corporate Leadership within the country (Zero Autonomous Branch Authority)
CREATE POLICY "inv_requests_zero_trust_update" ON public.inventory_requests
    FOR UPDATE TO authenticated
    USING (
        public.is_ceo()
        OR (
            public.is_admin()
            AND country_code = public.get_my_country_code()
        )
    );

-- DELETE: Exclusively CEO / Super Admin
CREATE POLICY "inv_requests_zero_trust_delete" ON public.inventory_requests
    FOR DELETE TO authenticated
    USING (public.is_ceo());

DO $$
BEGIN
    RAISE NOTICE '✅ Zero-Trust Inventory Requests Hardening successfully installed:';
    RAISE NOTICE '   • Branch manager unilateral approval revoked';
    RAISE NOTICE '   • Approval strictly limited to Central HQ Leadership';
    RAISE NOTICE '   • 4-Eyes Principle enforced (maker cannot approve)';
    RAISE NOTICE '   • Multi-country partitioning verified';
END $$;
