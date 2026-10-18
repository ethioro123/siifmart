-- Make region creation and region/site updates single authorized transactions.

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
  v_code := lower(btrim(p_region->>'code'));
  v_country := upper(btrim(p_region->>'country'));
  v_hub := nullif(p_region->>'admin_hub_site_id', '')::uuid;

  IF v_code IS NULL OR v_code = '' OR nullif(btrim(p_region->>'name'), '') IS NULL THEN
    RAISE EXCEPTION 'Region name and code are required' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION public.update_region_and_site_assignments(
  p_code text,
  p_updates jsonb,
  p_to_assign uuid[] DEFAULT '{}',
  p_to_unassign uuid[] DEFAULT '{}'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_country text;
  v_hub uuid;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication is required to update a region' USING ERRCODE = '42501';
  END IF;
  IF p_updates IS NULL OR jsonb_typeof(p_updates) <> 'object' OR
     (p_updates - ARRAY['name','city','admin_hub_site_id','regional_manager_id',
       'monthly_procurement_budget','autonomous_po_limit','monthly_expense_budget',
       'autonomous_expense_limit','status','change_reason']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Invalid regional settings update fields' USING ERRCODE = '22023';
  END IF;
  IF nullif(btrim(p_updates->>'change_reason'), '') IS NULL THEN
    RAISE EXCEPTION 'A reason is required when changing regional settings' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(p_updates) AS item(key, value)
     WHERE key IN ('monthly_procurement_budget','autonomous_po_limit','monthly_expense_budget','autonomous_expense_limit')
       AND coalesce(value, '') !~ '^[0-9]+([.][0-9]+)?$'
  ) OR (p_updates ? 'status' AND p_updates->>'status' NOT IN ('active','suspended','planning')) THEN
    RAISE EXCEPTION 'Invalid region budget or status value' USING ERRCODE = '22023';
  END IF;
  IF coalesce(cardinality(p_to_assign), 0) > 0 AND coalesce(cardinality(p_to_unassign), 0) > 0
     AND p_to_assign && p_to_unassign THEN
    RAISE EXCEPTION 'A site cannot be assigned and unassigned in the same update' USING ERRCODE = '22023';
  END IF;

  SELECT upper(r.country) INTO v_country FROM public.regions r WHERE r.code = p_code FOR UPDATE;
  IF v_country IS NULL THEN
    RAISE EXCEPTION 'Region not found' USING ERRCODE = 'P0002';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT (
    public.is_ceo() OR
    (public.is_hq_executive() AND public.get_my_country_code_strict() = v_country)
  ) THEN
    RAISE EXCEPTION 'You are not authorized to update this region' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sites s
     WHERE s.id = ANY(coalesce(p_to_assign, '{}'::uuid[]))
       AND upper(s.country) IS DISTINCT FROM v_country
  ) THEN
    RAISE EXCEPTION 'Every assigned site must belong to the region country' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.sites s
     WHERE s.id = ANY(coalesce(p_to_unassign, '{}'::uuid[]))
       AND s.region_code IS DISTINCT FROM p_code
  ) THEN
    RAISE EXCEPTION 'Only sites currently assigned to this region may be unassigned' USING ERRCODE = '42501';
  END IF;

  UPDATE public.regions r SET
    name = CASE WHEN p_updates ? 'name' THEN btrim(p_updates->>'name') ELSE r.name END,
    city = CASE WHEN p_updates ? 'city' THEN nullif(btrim(p_updates->>'city'), '') ELSE r.city END,
    admin_hub_site_id = CASE WHEN p_updates ? 'admin_hub_site_id' THEN nullif(p_updates->>'admin_hub_site_id', '')::uuid ELSE r.admin_hub_site_id END,
    regional_manager_id = CASE WHEN p_updates ? 'regional_manager_id' THEN nullif(p_updates->>'regional_manager_id', '')::uuid ELSE r.regional_manager_id END,
    monthly_procurement_budget = CASE WHEN p_updates ? 'monthly_procurement_budget' THEN (p_updates->>'monthly_procurement_budget')::numeric ELSE r.monthly_procurement_budget END,
    autonomous_po_limit = CASE WHEN p_updates ? 'autonomous_po_limit' THEN (p_updates->>'autonomous_po_limit')::numeric ELSE r.autonomous_po_limit END,
    monthly_expense_budget = CASE WHEN p_updates ? 'monthly_expense_budget' THEN (p_updates->>'monthly_expense_budget')::numeric ELSE r.monthly_expense_budget END,
    autonomous_expense_limit = CASE WHEN p_updates ? 'autonomous_expense_limit' THEN (p_updates->>'autonomous_expense_limit')::numeric ELSE r.autonomous_expense_limit END,
    status = CASE WHEN p_updates ? 'status' THEN p_updates->>'status' ELSE r.status END,
    last_change_reason = btrim(p_updates->>'change_reason'),
    updated_at = now()
  WHERE r.code = p_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Region not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.sites SET region_code = p_code WHERE id = ANY(coalesce(p_to_assign, '{}'::uuid[]));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> coalesce(cardinality(p_to_assign), 0) THEN
    RAISE EXCEPTION 'One or more sites could not be assigned' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.sites SET region_code = NULL WHERE id = ANY(coalesce(p_to_unassign, '{}'::uuid[]));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> coalesce(cardinality(p_to_unassign), 0) THEN
    RAISE EXCEPTION 'One or more sites could not be unassigned' USING ERRCODE = 'P0002';
  END IF;

  SELECT r.admin_hub_site_id INTO v_hub FROM public.regions r WHERE r.code = p_code;
  IF v_hub IS NOT NULL THEN
    IF v_hub = ANY(coalesce(p_to_unassign, '{}'::uuid[])) THEN
      RAISE EXCEPTION 'The designated administration hub cannot be unassigned from its region' USING ERRCODE = '23514';
    END IF;
    UPDATE public.sites SET region_code = p_code WHERE id = v_hub AND region_code IS DISTINCT FROM p_code;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_region_with_admin_hub(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_region_and_site_assignments(text, jsonb, uuid[], uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_region_with_admin_hub(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_region_and_site_assignments(text, jsonb, uuid[], uuid[]) TO authenticated, service_role;
