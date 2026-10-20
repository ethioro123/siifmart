ALTER TABLE public.inventory_requests
  ADD COLUMN requested_by_employee_id uuid REFERENCES public.employees(id);

CREATE FUNCTION private.merchandising_site_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN (
        'merchandising_specialist','regional_merchandising_lead',
        'head_of_merchandising','merchandising_head','merchandising_manager'
      )
      AND home.type = 'Administration'
      AND upper(home.country) = upper(target.country)
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
      AND (
        (home.code = upper(home.country) || '-HQ'
         AND home.region_code IS NULL AND actor.region_code IS NULL
         AND lower(actor.role) <> 'regional_merchandising_lead')
        OR (home.region_code IS NOT NULL
            AND actor.region_code = home.region_code
            AND target.region_code = home.region_code)
      )
  );
$function$;
REVOKE ALL ON FUNCTION private.merchandising_site_scope(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.merchandising_site_scope(text,text)
  TO authenticated, service_role;

CREATE POLICY products_merchandising_read ON public.products
FOR SELECT TO authenticated
USING (private.merchandising_site_scope(site_id::text, NULL));

CREATE POLICY inv_requests_merchandising_read ON public.inventory_requests
FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN (
    'merchandising_specialist','regional_merchandising_lead',
    'head_of_merchandising','merchandising_head','merchandising_manager'
  )
  AND private.merchandising_site_scope(site_id, country_code::text)
);

CREATE POLICY inv_requests_merchandising_prepare ON public.inventory_requests
FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = 'merchandising_specialist'
  AND private.merchandising_site_scope(site_id, country_code::text)
  AND change_type = 'edit' AND status = 'pending'
  AND approved_by IS NULL AND approved_at IS NULL
  AND rejected_by IS NULL AND rejected_at IS NULL
  AND adjustment_qty IS NULL AND adjustment_type IS NULL
  AND (
    adjustment_reason LIKE 'PRICE_CHANGE%'
    OR adjustment_reason LIKE 'MERCHANDISING:%'
  )
  AND product_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.products product
    WHERE product.id::text = inventory_requests.product_id
      AND product.site_id::text = inventory_requests.site_id
  )
);

CREATE FUNCTION private.guard_merchandising_preparation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE allowed_fields text[];
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
  WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  IF TG_OP = 'INSERT' AND lower(actor.role) = 'merchandising_specialist' THEN
    NEW.requested_by_employee_id := actor.id;
    NEW.requested_by := actor.name;
    IF NOT private.merchandising_site_scope(NEW.site_id, NEW.country_code::text)
       OR NEW.change_type <> 'edit' OR NEW.status <> 'pending'
       OR NEW.adjustment_qty IS NOT NULL OR NEW.adjustment_type IS NOT NULL
       OR NEW.proposed_changes IS NULL OR jsonb_typeof(NEW.proposed_changes) <> 'object' THEN
      RAISE EXCEPTION 'Invalid merchandising proposal';
    END IF;
    IF NEW.adjustment_reason LIKE 'PRICE_CHANGE%' THEN
      allowed_fields := ARRAY['price','costPrice','salePrice','isOnSale'];
    ELSIF NEW.adjustment_reason LIKE 'MERCHANDISING:%' THEN
      allowed_fields := ARRAY['name','category','brand','description','image','shelfPosition'];
    ELSE
      RAISE EXCEPTION 'Unknown merchandising proposal kind';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) AS field
      WHERE NOT field = ANY(allowed_fields)
    ) THEN
      RAISE EXCEPTION 'Merchandising proposal contains unauthorized fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_merchandising_preparation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_merchandising_preparation
BEFORE INSERT ON public.inventory_requests FOR EACH ROW
EXECUTE FUNCTION private.guard_merchandising_preparation();
