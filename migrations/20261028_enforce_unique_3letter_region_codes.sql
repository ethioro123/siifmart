-- Migration: 20261028_enforce_unique_3letter_region_codes.sql
-- Description: Enforces strict country prefix and unique 3-letter region codes (e.g. ET-ADD, KE-NRB),
--              preventing duplicate region IDs across regional administrations.

-- 1. Ensure all existing region codes in public.regions are strictly uppercase
UPDATE public.regions
   SET code = UPPER(TRIM(code))
 WHERE code <> UPPER(TRIM(code));

-- 2. Add format constraint: code must be [COUNTRY]-[3-LETTERS]
ALTER TABLE public.regions DROP CONSTRAINT IF EXISTS regions_code_format_check;
ALTER TABLE public.regions ADD CONSTRAINT regions_code_format_check 
  CHECK (code ~ '^[A-Z]{2}-[A-Z]{3}$');

-- 3. Case-insensitive unique index to guarantee absolute uniqueness across all regions
CREATE UNIQUE INDEX IF NOT EXISTS idx_regions_upper_code ON public.regions (UPPER(code));

-- 4. Update atomic region provisioning function to enforce uppercase 3-letter format and uniqueness
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

  -- Validate strict [COUNTRY]-[3-LETTERS] format
  IF v_code !~ '^[A-Z]{2}-[A-Z]{3}$' THEN
    RAISE EXCEPTION 'Region code % is invalid. It must follow format [COUNTRY]-[3-LETTERS] (e.g. ET-ADD)', v_code USING ERRCODE = '23514';
  END IF;

  -- Validate country prefix matches region country
  IF left(v_code, 2) <> v_country THEN
    RAISE EXCEPTION 'Region code % must start with country prefix %-', v_code, v_country USING ERRCODE = '23514';
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

REVOKE ALL ON FUNCTION public.create_region_with_admin_hub(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_region_with_admin_hub(jsonb) TO authenticated, service_role;
