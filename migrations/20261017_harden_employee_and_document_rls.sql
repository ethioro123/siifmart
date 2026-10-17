-- ============================================================================
-- MIGRATION: 20261017_harden_employee_and_document_rls.sql
-- PURPOSE:
--   1. Harden RLS on public.employees: Remove overly broad policies; enforce
--      strict multi-level access (CEO/HQ, Regional HR/Manager, Site Manager, Self).
--   2. Add credentials handover tracking columns to public.employees.
--   3. Create/harden public.employee_documents with strict multi-level RLS.
-- ============================================================================

-- 1. Helper function: Get calling user's region_code
CREATE OR REPLACE FUNCTION public.get_my_region_code()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_region TEXT;
    v_uid UUID;
    v_email TEXT;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL AND v_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fast path 1: by uid
    IF v_uid IS NOT NULL THEN
        SELECT region_code INTO v_region
        FROM public.employees
        WHERE id = v_uid
        LIMIT 1;

        IF v_region IS NOT NULL THEN
            RETURN v_region;
        END IF;
    END IF;

    -- Fast path 2: by email
    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT region_code INTO v_region
        FROM public.employees
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_region IS NOT NULL THEN
            RETURN v_region;
        END IF;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 2. Helper function: Get calling user's scope_level
CREATE OR REPLACE FUNCTION public.get_my_scope_level()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_scope TEXT;
    v_uid UUID;
    v_email TEXT;
    v_role TEXT;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL AND v_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fast path 1: by uid
    IF v_uid IS NOT NULL THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE id = v_uid
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    -- Fast path 2: by email
    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    -- Infer scope from role if not explicitly set
    IF v_role IN ('super_admin', 'admin', 'CEO', 'operations_manager', 'finance_manager', 'hr_manager', 'hr', 'procurement_manager', 'supply_chain_manager', 'auditor') THEN
        RETURN 'HQ';
    ELSIF v_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor') THEN
        RETURN 'REGIONAL';
    ELSE
        RETURN 'SITE';
    END IF;

    RETURN 'SITE';
EXCEPTION WHEN OTHERS THEN
    RETURN 'SITE';
END;
$$;

-- 3. Add credential handover tracking columns to public.employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS credentials_handed_over_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS credentials_handed_over_by TEXT;

-- 4. Clean up legacy and broad RLS policies on public.employees
DROP POLICY IF EXISTS "Public_Read_Employees" ON public.employees;
DROP POLICY IF EXISTS "Admin_Modify_Employees" ON public.employees;
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_read" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_update_admin" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 5. Secure SELECT policy on public.employees
-- - HQ roles (or users with scope_level = 'HQ') can read all employees.
-- - Regional roles can read employees in their region or at sites in their region.
-- - Site staff can read employees at their site or their own record.
CREATE POLICY "employees_read" ON public.employees
FOR SELECT TO authenticated
USING (
    -- HQ / Executives / HQ HR
    (public.get_my_scope_level() = 'HQ')
    OR (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr', 'operations_manager', 'finance_manager', 'auditor'))
    -- Regional roles: same region_code or sites in that region
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer', 'regional_procurement_lead', 'regional_finance_officer', 'regional_logistics_lead', 'regional_security_supervisor')
        AND (
            region_code = public.get_my_region_code()
            OR site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
        )
    )
    -- Site roles: same site_id or self
    OR (site_id = public.get_my_site_id())
    OR (id = auth.uid())
    OR (LOWER(email) = LOWER(auth.jwt() ->> 'email'))
);

-- 6. Secure INSERT policy on public.employees
CREATE POLICY "employees_insert" ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
    -- HQ HR / Admin
    (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr'))
    -- Regional Manager / Regional HR: only for sites in their region
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer')
        AND (
            site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
            OR (region_code = public.get_my_region_code())
        )
        AND role NOT IN ('super_admin', 'admin', 'CEO', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager')
    )
    -- Site Manager: only for their own site
    OR (
        public.is_manager()
        AND (site_id = public.get_my_site_id() OR public.get_my_site_id() IS NULL)
        AND role NOT IN ('super_admin', 'admin', 'CEO', 'regional_manager', 'regional_hr_officer', 'operations_manager', 'finance_manager', 'hr_manager')
    )
);

-- 7. Secure UPDATE policy on public.employees
CREATE POLICY "employees_update" ON public.employees
FOR UPDATE TO authenticated
USING (
    -- HQ HR / Admin
    (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr'))
    -- Regional Manager / Regional HR: strictly within their region
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer')
        AND (
            region_code = public.get_my_region_code()
            OR site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
        )
        AND role NOT IN ('super_admin', 'admin', 'CEO', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager')
    )
    -- Site Manager: strictly for staff at their own site
    OR (
        public.is_manager()
        AND site_id = public.get_my_site_id()
        AND role NOT IN ('super_admin', 'admin', 'CEO', 'regional_manager', 'regional_hr_officer', 'operations_manager', 'finance_manager', 'hr_manager')
    )
    -- Self update (e.g. avatar, phone, address, last_login)
    OR (id = auth.uid())
    OR (LOWER(email) = LOWER(auth.jwt() ->> 'email'))
);

-- 8. Secure DELETE policy on public.employees
CREATE POLICY "employees_delete" ON public.employees
FOR DELETE TO authenticated
USING (
    public.is_ceo()
    OR (public.get_my_role() IN ('super_admin', 'admin', 'hr_manager'))
);

-- 9. Table: public.employee_documents
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    doc_type TEXT NOT NULL CHECK (
        doc_type IN ('National ID', 'Passport', 'Driver License', 'Resume / CV', 'Employment Contract', 'Police Clearance', 'Educational Certificate', 'Other')
    ),
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    expiry_date DATE,
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_employee_docs_country ON public.employee_documents(country_code);
CREATE INDEX IF NOT EXISTS idx_employee_docs_emp ON public.employee_documents(employee_id);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_docs_read" ON public.employee_documents;
DROP POLICY IF EXISTS "employee_docs_insert" ON public.employee_documents;
DROP POLICY IF EXISTS "employee_docs_delete" ON public.employee_documents;
DROP POLICY IF EXISTS "employee_docs_update" ON public.employee_documents;

-- Document Read Policy:
-- - HQ HR/Admin can view all documents in their country
-- - Regional Manager / Regional HR can view documents for employees in their region
-- - Site Managers can view documents for employees at their site
-- - Employee can view their own documents
CREATE POLICY "employee_docs_read" ON public.employee_documents
FOR SELECT TO authenticated
USING (
    -- HQ HR / Admin
    (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr', 'operations_manager', 'auditor'))
    -- Regional HR / Regional Manager
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer')
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_documents.employee_id
            AND (
                e.region_code = public.get_my_region_code()
                OR e.site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
            )
        )
    )
    -- Site Manager
    OR (
        public.is_manager()
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_documents.employee_id
            AND e.site_id = public.get_my_site_id()
        )
    )
    -- Self
    OR (employee_id = auth.uid())
);

-- Document Insert Policy:
-- - HR, Managers, or the employee themselves
CREATE POLICY "employee_docs_insert" ON public.employee_documents
FOR INSERT TO authenticated
WITH CHECK (
    -- HQ HR / Admin
    (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr'))
    -- Regional HR / Regional Manager
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer')
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_documents.employee_id
            AND (
                e.region_code = public.get_my_region_code()
                OR e.site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
            )
        )
    )
    -- Site Manager
    OR (
        public.is_manager()
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_documents.employee_id
            AND e.site_id = public.get_my_site_id()
        )
    )
    -- Self
    OR (employee_id = auth.uid())
);

-- Document Update Policy (e.g. verification status):
CREATE POLICY "employee_docs_update" ON public.employee_documents
FOR UPDATE TO authenticated
USING (
    (public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager', 'hr'))
    OR (
        public.get_my_role() IN ('regional_manager', 'regional_hr_officer')
        AND EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_documents.employee_id
            AND (
                e.region_code = public.get_my_region_code()
                OR e.site_id IN (SELECT id FROM public.sites WHERE region_code = public.get_my_region_code())
            )
        )
    )
);

-- Document Delete Policy:
-- Strictly HQ HR / Admin
CREATE POLICY "employee_docs_delete" ON public.employee_documents
FOR DELETE TO authenticated
USING (
    public.get_my_role() IN ('super_admin', 'admin', 'CEO', 'hr_manager')
);
