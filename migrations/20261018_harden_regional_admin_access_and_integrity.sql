-- Harden regional administration scope, currency data, and site/region integrity.

CREATE OR REPLACE FUNCTION public.get_my_country_code_strict()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_country text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT upper(s.country)
    INTO v_country
    FROM public.employees e
    JOIN public.sites s ON s.id = e.site_id
   WHERE e.id = auth.uid()
   LIMIT 1;

  RETURN v_country;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_site_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT e.site_id
    FROM public.employees e
   WHERE e.id = auth.uid()
   LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_region_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT e.region_code
    FROM public.employees e
   WHERE e.id = auth.uid()
   LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND lower(coalesce(public.get_my_role(), '')) IN ('super_admin', 'ceo');
$function$;

CREATE OR REPLACE FUNCTION public.is_hq_executive()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND lower(coalesce(public.get_my_role(), '')) IN ('super_admin', 'ceo', 'operations_manager', 'finance_manager');
$function$;

REVOKE ALL ON FUNCTION public.get_my_country_code_strict() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_site_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country_code_strict() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_site_id() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_my_region_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_region_code() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_ceo() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_hq_executive() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_hq_executive() TO authenticated, service_role;

DROP POLICY IF EXISTS regions_select ON public.regions;
CREATE POLICY regions_select ON public.regions
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND country = public.get_my_country_code_strict())
  OR code = public.get_my_region_code()
);

DROP POLICY IF EXISTS regions_insert ON public.regions;
CREATE POLICY regions_insert ON public.regions
FOR INSERT TO authenticated
WITH CHECK (
  public.is_ceo()
  OR (public.is_hq_executive() AND country = public.get_my_country_code_strict())
);

DROP POLICY IF EXISTS regions_update ON public.regions;
CREATE POLICY regions_update ON public.regions
FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND country = public.get_my_country_code_strict())
)
WITH CHECK (
  public.is_ceo()
  OR (public.is_hq_executive() AND country = public.get_my_country_code_strict())
);

DROP POLICY IF EXISTS sites_read ON public.sites;
CREATE POLICY sites_read ON public.sites
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
  OR (region_code IS NOT NULL AND region_code = public.get_my_region_code())
  OR id = public.get_my_site_id()
);

DROP POLICY IF EXISTS sites_update ON public.sites;
CREATE POLICY sites_update ON public.sites
FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
  OR (region_code IS NOT NULL AND region_code = public.get_my_region_code())
)
WITH CHECK (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
  OR (region_code IS NOT NULL AND region_code = public.get_my_region_code())
);

DROP POLICY IF EXISTS sites_write ON public.sites;
CREATE POLICY sites_write ON public.sites
FOR INSERT TO authenticated
WITH CHECK (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
);

CREATE OR REPLACE FUNCTION public.enforce_region_currency_and_leadership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_currency text;
  v_manager_role text;
  v_manager_status text;
  v_manager_country text;
  v_hub_type text;
  v_hub_country text;
BEGIN
  v_currency := CASE upper(NEW.country)
    WHEN 'ET' THEN 'ETB'
    WHEN 'KE' THEN 'KES'
    WHEN 'UG' THEN 'UGX'
    WHEN 'RW' THEN 'RWF'
    WHEN 'TZ' THEN 'TZS'
    ELSE NULL
  END;

  IF v_currency IS NULL THEN
    RAISE EXCEPTION 'Unsupported region country code: %', NEW.country USING ERRCODE = '23514';
  END IF;
  IF NEW.default_currency IS NULL THEN
    NEW.default_currency := v_currency;
  ELSIF upper(NEW.default_currency) <> v_currency THEN
    RAISE EXCEPTION 'Currency % does not match country %', NEW.default_currency, NEW.country USING ERRCODE = '23514';
  END IF;

  IF NEW.regional_manager_id IS NOT NULL THEN
    SELECT lower(trim(e.role)), lower(coalesce(e.status, 'active')), upper(s.country)
      INTO v_manager_role, v_manager_status, v_manager_country
      FROM public.employees e
      JOIN public.sites s ON s.id = e.site_id
     WHERE e.id = NEW.regional_manager_id;
    IF v_manager_role IS DISTINCT FROM 'regional_manager'
       OR v_manager_status NOT IN ('active', 'enabled')
       OR v_manager_country IS DISTINCT FROM upper(NEW.country) THEN
      RAISE EXCEPTION 'Regional manager must be active and assigned to a site in the same country' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.admin_hub_site_id IS NOT NULL THEN
    SELECT lower(s.type), upper(s.country)
      INTO v_hub_type, v_hub_country
      FROM public.sites s
     WHERE s.id = NEW.admin_hub_site_id;
    IF v_hub_type NOT IN ('administration', 'administrative')
       OR v_hub_country IS DISTINCT FROM upper(NEW.country) THEN
      RAISE EXCEPTION 'Administrative hub must be an administration site in the same country' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_region_currency_and_leadership ON public.regions;
CREATE TRIGGER enforce_region_currency_and_leadership
BEFORE INSERT OR UPDATE OF country, default_currency, regional_manager_id, admin_hub_site_id
ON public.regions
FOR EACH ROW EXECUTE FUNCTION public.enforce_region_currency_and_leadership();

CREATE OR REPLACE FUNCTION public.enforce_site_region_country()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_region_country text;
BEGIN
  IF NEW.region_code IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT upper(r.country) INTO v_region_country
    FROM public.regions r
   WHERE r.code = NEW.region_code;
  IF v_region_country IS NULL OR upper(NEW.country) IS DISTINCT FROM v_region_country THEN
    RAISE EXCEPTION 'Site and assigned region must belong to the same country' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_site_region_country ON public.sites;
CREATE TRIGGER enforce_site_region_country
BEFORE INSERT OR UPDATE OF region_code, country
ON public.sites
FOR EACH ROW EXECUTE FUNCTION public.enforce_site_region_country();

UPDATE public.regions
   SET default_currency = CASE upper(country)
     WHEN 'ET' THEN 'ETB'
     WHEN 'KE' THEN 'KES'
     WHEN 'UG' THEN 'UGX'
     WHEN 'RW' THEN 'RWF'
     WHEN 'TZ' THEN 'TZS'
   END
 WHERE default_currency IS NULL;

ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS last_change_reason text;
UPDATE public.regions
   SET last_change_reason = 'Existing regional settings before reason-required audit enforcement'
 WHERE last_change_reason IS NULL OR btrim(last_change_reason) = '';
ALTER TABLE public.regions ALTER COLUMN last_change_reason SET NOT NULL;
ALTER TABLE public.regions ALTER COLUMN last_change_reason DROP DEFAULT;

ALTER TABLE public.regions ALTER COLUMN default_currency SET NOT NULL;
ALTER TABLE public.regions DROP CONSTRAINT IF EXISTS regions_default_currency_matches_country;
ALTER TABLE public.regions ADD CONSTRAINT regions_default_currency_matches_country CHECK (
  (country = 'ET' AND default_currency = 'ETB') OR
  (country = 'KE' AND default_currency = 'KES') OR
  (country = 'UG' AND default_currency = 'UGX') OR
  (country = 'RW' AND default_currency = 'RWF') OR
  (country = 'TZ' AND default_currency = 'TZS')
);
ALTER TABLE public.regions DROP CONSTRAINT IF EXISTS regions_status_allowed;
ALTER TABLE public.regions ADD CONSTRAINT regions_status_allowed CHECK (
  status IS NULL OR status IN ('active', 'suspended', 'planning')
);
ALTER TABLE public.regions DROP CONSTRAINT IF EXISTS regions_budgets_nonnegative;
ALTER TABLE public.regions ADD CONSTRAINT regions_budgets_nonnegative CHECK (
  (monthly_procurement_budget IS NULL OR monthly_procurement_budget >= 0) AND
  (autonomous_po_limit IS NULL OR autonomous_po_limit >= 0) AND
  (monthly_expense_budget IS NULL OR monthly_expense_budget >= 0) AND
  (autonomous_expense_limit IS NULL OR autonomous_expense_limit >= 0)
);

CREATE OR REPLACE FUNCTION public.audit_region_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_actor_name text;
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF NEW.last_change_reason IS NULL OR btrim(NEW.last_change_reason) = '' THEN
    RAISE EXCEPTION 'A reason is required for regional administration changes' USING ERRCODE = '23514';
  END IF;

  SELECT e.name INTO v_actor_name
    FROM public.employees e
   WHERE e.id = auth.uid()
   LIMIT 1;

  v_after := jsonb_build_object(
    'code', NEW.code,
    'country', NEW.country,
    'name', NEW.name,
    'city', NEW.city,
    'default_currency', NEW.default_currency,
    'admin_hub_site_id', NEW.admin_hub_site_id,
    'regional_manager_id', NEW.regional_manager_id,
    'monthly_procurement_budget', NEW.monthly_procurement_budget,
    'autonomous_po_limit', NEW.autonomous_po_limit,
    'monthly_expense_budget', NEW.monthly_expense_budget,
    'autonomous_expense_limit', NEW.autonomous_expense_limit,
    'status', NEW.status
  );

  IF TG_OP = 'UPDATE' THEN
    v_before := jsonb_build_object(
      'name', OLD.name,
      'city', OLD.city,
      'default_currency', OLD.default_currency,
      'admin_hub_site_id', OLD.admin_hub_site_id,
      'regional_manager_id', OLD.regional_manager_id,
      'monthly_procurement_budget', OLD.monthly_procurement_budget,
      'autonomous_po_limit', OLD.autonomous_po_limit,
      'monthly_expense_budget', OLD.monthly_expense_budget,
      'autonomous_expense_limit', OLD.autonomous_expense_limit,
      'status', OLD.status
    );
  END IF;

  INSERT INTO public.system_logs (
    action, details, module, created_at, entity_type, entity_id,
    performed_by, country_code, employee_id, user_name, metadata
  ) VALUES (
    CASE WHEN TG_OP = 'INSERT' THEN 'REGION_CREATED' ELSE 'REGION_SETTINGS_UPDATED' END,
    jsonb_build_object('reason', NEW.last_change_reason, 'before', v_before, 'after', v_after)::text,
    'Settings', now(), 'region', NEW.code,
    coalesce(auth.uid()::text, 'system'), upper(NEW.country), auth.uid()::text,
    v_actor_name,
    jsonb_build_object('reason', NEW.last_change_reason, 'before', v_before, 'after', v_after)
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS audit_region_settings_change ON public.regions;
CREATE TRIGGER audit_region_settings_change
AFTER INSERT OR UPDATE ON public.regions
FOR EACH ROW EXECUTE FUNCTION public.audit_region_settings_change();

CREATE OR REPLACE FUNCTION public.enforce_regional_po_approval_scope_and_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_region_code text;
  v_region_country text;
  v_region_status text;
  v_monthly_budget numeric;
  v_existing_spend numeric;
  v_site_country text;
  v_site_region text;
  v_actor_role text;
  v_actor_country text;
  v_actor_region text;
  v_actor_site uuid;
  v_month_start date;
  v_next_month date;
BEGIN
  IF NEW.status IS DISTINCT FROM 'Approved' OR OLD.status IS NOT DISTINCT FROM 'Approved' THEN
    RETURN NEW;
  END IF;

  v_region_code := NEW.region_code;
  IF NEW.site_id IS NOT NULL THEN
    SELECT upper(s.country), s.region_code
      INTO v_site_country, v_site_region
      FROM public.sites s
     WHERE s.id = NEW.site_id;
    IF v_region_code IS NULL THEN
      v_region_code := v_site_region;
    ELSIF v_site_region IS NOT NULL AND v_region_code <> v_site_region THEN
      RAISE EXCEPTION 'Purchase order region does not match its site' USING ERRCODE = '42501';
    END IF;
    IF v_site_country IS NOT NULL AND upper(NEW.country_code) <> v_site_country THEN
      RAISE EXCEPTION 'Purchase order country does not match its site' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), lower(coalesce(r.status, 'active')), coalesce(r.monthly_procurement_budget, 0)
      INTO v_region_country, v_region_status, v_monthly_budget
      FROM public.regions r
     WHERE r.code = v_region_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Purchase order references an unknown region' USING ERRCODE = '23503';
    END IF;
    IF upper(NEW.country_code) <> v_region_country THEN
      RAISE EXCEPTION 'Purchase order country does not match its region' USING ERRCODE = '42501';
    END IF;
    IF v_region_status <> 'active' THEN
      RAISE EXCEPTION 'Purchase orders cannot be approved while region % is %', v_region_code, v_region_status USING ERRCODE = '42501';
    END IF;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT lower(trim(e.role)), upper(s.country), e.region_code, e.site_id
      INTO v_actor_role, v_actor_country, v_actor_region, v_actor_site
      FROM public.employees e
      LEFT JOIN public.sites s ON s.id = e.site_id
     WHERE e.id = auth.uid()
       AND lower(coalesce(e.status, 'active')) IN ('active', 'enabled')
     LIMIT 1;
    IF v_actor_role IS NULL THEN
      RAISE EXCEPTION 'An active employee profile is required to approve purchase orders' USING ERRCODE = '42501';
    END IF;

    IF v_actor_role NOT IN ('super_admin', 'ceo', 'operations_manager', 'finance_manager', 'procurement_manager', 'regional_manager', 'regional_procurement_lead', 'regional_finance_officer') THEN
      RAISE EXCEPTION 'Role % cannot approve purchase orders', v_actor_role USING ERRCODE = '42501';
    END IF;

    IF v_actor_role NOT IN ('super_admin', 'ceo') THEN
      IF v_region_code IS NULL THEN
        IF v_actor_role NOT IN ('operations_manager', 'finance_manager', 'procurement_manager')
           OR v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
          RAISE EXCEPTION 'Approver is outside the purchase order country or region' USING ERRCODE = '42501';
        END IF;
      ELSIF v_actor_role IN ('operations_manager', 'finance_manager', 'procurement_manager') THEN
        IF v_actor_country IS DISTINCT FROM v_region_country THEN
          RAISE EXCEPTION 'Approver is outside the purchase order country' USING ERRCODE = '42501';
        END IF;
      ELSIF coalesce(v_actor_region, (SELECT s.region_code FROM public.sites s WHERE s.id = v_actor_site)) IS DISTINCT FROM v_region_code THEN
        RAISE EXCEPTION 'Approver is outside the purchase order region' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF v_region_code IS NOT NULL AND v_monthly_budget > 0 THEN
    v_month_start := date_trunc('month', NEW.order_date)::date;
    v_next_month := (v_month_start + interval '1 month')::date;
    PERFORM pg_advisory_xact_lock(hashtext(v_region_code), hashtext(v_month_start::text));

    SELECT coalesce(sum(po.total_amount), 0)
      INTO v_existing_spend
      FROM public.purchase_orders po
     WHERE po.id <> NEW.id
       AND po.region_code = v_region_code
       AND po.order_date >= v_month_start
       AND po.order_date < v_next_month
       AND po.status IN ('Approved', 'Ordered', 'Partially Received', 'Received');

    IF v_existing_spend + NEW.total_amount > v_monthly_budget THEN
      RAISE EXCEPTION 'Monthly procurement budget exceeded for region %: existing % plus this order % is greater than cap %',
        v_region_code, v_existing_spend, NEW.total_amount, v_monthly_budget USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_regional_po_approval_scope_and_budget ON public.purchase_orders;
CREATE TRIGGER enforce_regional_po_approval_scope_and_budget
BEFORE UPDATE OF status ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_regional_po_approval_scope_and_budget();
