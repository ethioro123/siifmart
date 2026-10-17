-- ============================================================================
-- Migration: 20261017_lockdown_employee_security_and_privileges.sql
-- Description:
--   1. Revoke anon table privileges & authenticated TRUNCATE on employees and employee_documents.
--   2. Implement anti-self-elevation trigger preventing employees from changing role, salary, site, status, etc.
--   3. Provision missing auth account for active Ethiopian Regional Manager (Henok Tadesse).
--   4. Enforce regional boundary checks for Regional Managers and Regional HR.
-- ============================================================================

-- 1. Revoke table privileges from anonymous role and TRUNCATE from authenticated
REVOKE ALL PRIVILEGES ON TABLE public.employees FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.employee_documents FROM anon;
REVOKE TRUNCATE ON TABLE public.employees FROM authenticated;
REVOKE TRUNCATE ON TABLE public.employee_documents FROM authenticated;

-- Ensure credential tracking columns exist on public.employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS credentials_handed_over_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS credentials_handed_over_by TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_credentials_handover 
ON public.employees(credentials_handed_over_at) 
WHERE credentials_handed_over_at IS NULL;

-- 2. Anti-Self-Elevation and Role Boundary Enforcement Trigger Function
CREATE OR REPLACE FUNCTION public.enforce_employee_update_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_calling_uid UUID;
    v_calling_role TEXT;
    v_is_self BOOLEAN;
    v_is_admin BOOLEAN;
    v_is_hr_leadership BOOLEAN;
    v_my_region TEXT;
    v_my_site UUID;
BEGIN
    v_calling_uid := auth.uid();

    -- Allow migrations, background jobs, or DB superusers executing without auth.uid
    IF v_calling_uid IS NULL THEN
        RETURN NEW;
    END IF;

    v_calling_role := public.get_my_role();
    v_is_admin := (v_calling_role IN ('super_admin', 'admin', 'CEO'));
    v_is_hr_leadership := (v_calling_role IN ('hr_manager'));
    v_my_region := public.get_my_region_code();
    v_my_site := public.get_my_site_id();

    -- Check if user is updating their own employee record
    v_is_self := (v_calling_uid = OLD.id OR LOWER(auth.jwt() ->> 'email') = LOWER(OLD.email));

    -- GUARD 1: Prevent Self-Elevation / Self-Reassignment
    -- Non-admin staff can never alter their own role, salary, status, site, region, or administrative metadata
    IF v_is_self AND NOT v_is_admin THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from modifying their own access role.';
        END IF;

        IF NEW.salary IS DISTINCT FROM OLD.salary THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from modifying their own compensation.';
        END IF;

        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from altering their own employment status.';
        END IF;

        IF NEW.site_id IS DISTINCT FROM OLD.site_id THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot change their own workplace assignment.';
        END IF;

        IF NEW.region_code IS DISTINCT FROM OLD.region_code THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot alter their own regional territory.';
        END IF;

        IF NEW.scope_level IS DISTINCT FROM OLD.scope_level THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot alter their own governance scope.';
        END IF;

        IF NEW.department IS DISTINCT FROM OLD.department THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify their department assignment.';
        END IF;

        IF NEW.code IS DISTINCT FROM OLD.code THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify their employee identification code.';
        END IF;

        IF NEW.quota_status IS DISTINCT FROM OLD.quota_status OR NEW.quota_approved_by IS DISTINCT FROM OLD.quota_approved_by THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify headcount quota records.';
        END IF;
    END IF;

    -- GUARD 2: Managerial Boundary Enforcement
    -- Non-Executive / Non-HR-Director roles cannot assign HQ executive roles or reassign out of territory
    IF NOT v_is_admin AND NOT v_is_hr_leadership THEN
        -- Block promotion to HQ / Executive roles
        IF NEW.role IN ('super_admin', 'admin', 'CEO', 'operations_manager', 'finance_manager', 'hr_manager', 'auditor') 
           AND (OLD.role IS DISTINCT FROM NEW.role) THEN
            RAISE EXCEPTION 'Security Policy Violation: Only Executive Administration or HR Leadership can assign corporate HQ roles.';
        END IF;

        -- Regional Manager / Regional HR boundaries
        IF v_calling_role IN ('regional_manager', 'regional_hr_officer') THEN
            IF NEW.region_code IS DISTINCT FROM OLD.region_code AND NEW.region_code IS DISTINCT FROM v_my_region THEN
                RAISE EXCEPTION 'Security Policy Violation: Regional managers cannot reassign staff to a foreign region.';
            END IF;

            IF NEW.site_id IS DISTINCT FROM OLD.site_id AND NEW.site_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.sites 
                    WHERE id = NEW.site_id AND (region_code = v_my_region OR v_my_region IS NULL)
                ) THEN
                    RAISE EXCEPTION 'Security Policy Violation: Assigned workplace must reside within your regional boundary.';
                END IF;
            END IF;
        END IF;

        -- Site Manager boundary: cannot reassign staff to other facilities
        IF public.is_manager() AND v_calling_role NOT IN ('regional_manager', 'regional_hr_officer') THEN
            IF NEW.site_id IS DISTINCT FROM OLD.site_id AND NEW.site_id IS DISTINCT FROM v_my_site THEN
                RAISE EXCEPTION 'Security Policy Violation: Site managers cannot transfer staff to external facilities.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_employee_update_privileges ON public.employees;
CREATE TRIGGER trg_enforce_employee_update_privileges
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.enforce_employee_update_privileges();

-- 3. Provision missing auth account for active Ethiopian Regional Manager (Henok Tadesse)
DO $$
DECLARE
    v_henok_id UUID := '550e8400-e29b-41d4-a716-446655440047';
    v_henok_email TEXT := 'et-siif0047@siifmart.com';
    v_encrypted_pwd TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_henok_id OR LOWER(email) = LOWER(v_henok_email)) THEN
        -- Generate bcrypt hash for standard initial credential pattern: SiifMart@0047
        v_encrypted_pwd := crypt('SiifMart@0047', gen_salt('bf', 10));
        
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token
        ) VALUES (
            v_henok_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            v_henok_email,
            v_encrypted_pwd,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'sub', v_henok_id::text,
                'name', 'Henok Tadesse',
                'role', 'regional_manager',
                'siteId', 'bb0425bc-3119-449a-a685-b871e552bee0',
                'regionCode', 'ET-ADD',
                'email_verified', true
            ),
            NOW(),
            NOW(),
            ''
        );

        INSERT INTO auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_henok_id::text,
            v_henok_id,
            jsonb_build_object(
                'sub', v_henok_id::text,
                'email', v_henok_email,
                'name', 'Henok Tadesse',
                'role', 'regional_manager',
                'siteId', 'bb0425bc-3119-449a-a685-b871e552bee0',
                'regionCode', 'ET-ADD',
                'email_verified', true
            ),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END $$;
