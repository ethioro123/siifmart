-- ============================================================================
-- Migration: 20261028_standardize_pure_region_and_facility_codes.sql
-- Purpose: Standardize site and region codes:
--          1. HQ retains sovereign country prefix (ET-HQ, KE-HQ)
--          2. Regional Administrations use pure region codes (ADD, ADA, NRB, MBA)
--          3. Facilities use clean [REGION]-[TYPE]-[NUMBER] format (e.g. ADD-STR-01, ADD-DC-01)
--          4. Removes redundant country prefixes across all operational places & regions
-- ============================================================================

BEGIN;

-- 1. Ensure foreign keys on expenses and suppliers support ON UPDATE CASCADE
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_region_code_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES public.regions(code) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_region_code_fkey;
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES public.regions(code) ON UPDATE CASCADE;

-- 2. Drop format check constraint on regions.code
ALTER TABLE public.regions DROP CONSTRAINT IF EXISTS regions_code_format_check;

-- Temporarily bypass application-level validation triggers during bulk code harmonization
SET session_replication_role = 'replica';

-- 3. Update public.regions.code to pure region codes (e.g. ET-ADD -> ADD, KE-NRB -> NRB)
UPDATE public.regions 
   SET code = regexp_replace(code, '^[A-Z]{2}-', '') 
 WHERE code LIKE '%-%';

-- 4. Cascade region_code updates to all referencing and tracking tables
UPDATE public.employees 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.sites 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.suppliers 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.expenses 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.purchase_orders 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.purchase_requisitions 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.inventory_requests 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.merchandising_campaign_proposals 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.employee_tasks 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.staff_schedules 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.product_suggestions 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.headcount_quota_requests 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.regional_delegation_rules 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.agents 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.drivers 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.trips 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.users 
   SET region_code = regexp_replace(region_code, '^[A-Z]{2}-', '') 
 WHERE region_code LIKE '%-%';

UPDATE public.product_master 
   SET origin_region_code = regexp_replace(origin_region_code, '^[A-Z]{2}-', '') 
 WHERE origin_region_code LIKE '%-%';

-- 5. Update public.sites.code:
--    Keep HQ as [COUNTRY]-HQ (ET-HQ, KE-HQ)
--    Strip country prefix from all operational facilities and regional admin offices
UPDATE public.sites 
   SET code = regexp_replace(code, '^[A-Z]{2}-', '') 
 WHERE code !~ '^[A-Z]{2}-HQ$' 
   AND code LIKE '%-%';

-- Restore normal trigger execution mode
SET session_replication_role = 'origin';

-- 6. Re-add format check constraint on regions.code: exactly 3 to 4 uppercase letters
ALTER TABLE public.regions ADD CONSTRAINT regions_code_format_check 
  CHECK (code ~ '^[A-Z]{3,4}$');

-- 7. Update create_region_with_admin_hub function to validate pure 3-4 letter codes
CREATE OR REPLACE FUNCTION public.create_region_with_admin_hub(p_region jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_code text;
  v_country text;
  v_hub uuid;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication is required to create a region' USING ERRCODE = '42501';
  END IF;

  v_code := upper(btrim(p_region->>'code'));
  v_country := upper(btrim(p_region->>'country'));
  v_hub := nullif(p_region->>'admin_hub_site_id', '')::uuid;

  IF v_code IS NULL OR v_code = '' OR nullif(btrim(p_region->>'name'), '') IS NULL THEN
    RAISE EXCEPTION 'Region name and code are required' USING ERRCODE = '23514';
  END IF;

  -- Validate pure 3-4 letter uppercase region code (e.g. ADD, ADA, NRB, MBA)
  IF v_code !~ '^[A-Z]{3,4}$' THEN
    RAISE EXCEPTION 'Region code % is invalid. It must follow pure format [3-4 LETTERS] (e.g. ADD, NRB)', v_code USING ERRCODE = '23514';
  END IF;

  -- Enforce uniqueness
  IF EXISTS (SELECT 1 FROM public.regions WHERE upper(code) = v_code) THEN
    RAISE EXCEPTION 'Region code % already exists. Each region code must be unique', v_code USING ERRCODE = '23505';
  END IF;

  IF nullif(btrim(p_region->>'last_change_reason'), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required when creating a region' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(p_region) AS item(key, value)
     WHERE key IN ('monthly_procurement_budget','autonomous_po_limit','monthly_expense_budget','autonomous_expense_limit')
       AND coalesce(value, '') !~ '^[0-9]+([.][0-9]+)?$'
  ) OR coalesce(p_region->>'status', 'active') NOT IN ('active','suspended','planning') THEN
    RAISE EXCEPTION 'Invalid region budget or status value' USING ERRCODE = '22023';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT (
    public.is_ceo() OR
    (public.is_hq_executive() AND public.get_my_country_code_strict() = v_country)
  ) THEN
    RAISE EXCEPTION 'You are not authorized to create a region in this country' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.regions (
    code, name, country, city, default_currency, default_language,
    admin_hub_site_id, regional_manager_id, monthly_procurement_budget,
    autonomous_po_limit, monthly_expense_budget, autonomous_expense_limit,
    status, last_change_reason
  ) VALUES (
    v_code,
    btrim(p_region->>'name'),
    v_country,
    nullif(btrim(p_region->>'city'), ''),
    upper(p_region->>'default_currency'),
    coalesce(nullif(p_region->>'default_language', ''), 'en'),
    v_hub,
    nullif(p_region->>'regional_manager_id', '')::uuid,
    coalesce((p_region->>'monthly_procurement_budget')::numeric, 0),
    coalesce((p_region->>'autonomous_po_limit')::numeric, 0),
    coalesce((p_region->>'monthly_expense_budget')::numeric, 0),
    coalesce((p_region->>'autonomous_expense_limit')::numeric, 0),
    coalesce(nullif(p_region->>'status', ''), 'active'),
    btrim(p_region->>'last_change_reason')
  );

  IF v_hub IS NOT NULL THEN
    UPDATE public.sites SET region_code = v_code WHERE id = v_hub;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Administrative hub site was not found' USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN v_code;
END;
$function$;

COMMIT;
