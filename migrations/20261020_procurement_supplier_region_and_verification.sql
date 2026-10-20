ALTER TABLE public.suppliers
  ADD COLUMN region_code text REFERENCES public.regions(code);
CREATE INDEX suppliers_country_region_idx ON public.suppliers (country_code, region_code);
ALTER TABLE public.suppliers ALTER COLUMN verification_status SET DEFAULT 'pending';

CREATE FUNCTION private.procurement_supplier_scope(
  p_country text, p_region text, p_write boolean DEFAULT false
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND upper(home.country) = upper(p_country)
      AND (
        lower(actor.role) IN ('super_admin','ceo')
        OR (
          lower(actor.role) IN (
            'admin','procurement_manager','regional_procurement_lead',
            'buyer','vendor_relations_manager','supply_chain_manager',
            'operations_manager','regional_manager','finance_manager',
            'auditor','store_manager','inventory_specialist',
            'demand_planner','customs_import_specialist'
          )
          AND (NOT p_write OR lower(actor.role) IN
            ('admin','procurement_manager','regional_procurement_lead',
             'buyer','vendor_relations_manager'))
          AND (
            (home.type = 'Administration'
             AND home.code = upper(home.country) || '-HQ'
             AND home.region_code IS NULL AND actor.region_code IS NULL)
            OR (home.type = 'Administration'
                AND home.region_code IS NOT NULL
                AND actor.region_code = home.region_code
                AND (NOT p_write AND (p_region IS NULL OR p_region = home.region_code)
                     OR p_write AND p_region = home.region_code))
            OR (NOT p_write AND home.type <> 'Administration'
                AND (p_region IS NULL OR p_region = home.region_code))
          )
        )
      )
  );
$function$;
REVOKE ALL ON FUNCTION private.procurement_supplier_scope(text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.procurement_supplier_scope(text,text,boolean)
  TO authenticated, service_role;

DROP POLICY IF EXISTS suppliers_select_scoped ON public.suppliers;
CREATE POLICY suppliers_select_scoped ON public.suppliers FOR SELECT TO authenticated
USING (private.procurement_supplier_scope(country_code::text, region_code, false));
DROP POLICY IF EXISTS suppliers_insert_scoped ON public.suppliers;
CREATE POLICY suppliers_insert_scoped ON public.suppliers FOR INSERT TO authenticated
WITH CHECK (private.procurement_supplier_scope(country_code::text, region_code, true));
DROP POLICY IF EXISTS suppliers_update_scoped ON public.suppliers;
CREATE POLICY suppliers_update_scoped ON public.suppliers FOR UPDATE TO authenticated
USING (private.procurement_supplier_scope(country_code::text, region_code, true))
WITH CHECK (private.procurement_supplier_scope(country_code::text, region_code, true));
DROP POLICY IF EXISTS suppliers_delete_scoped ON public.suppliers;
CREATE POLICY suppliers_delete_scoped ON public.suppliers FOR DELETE TO authenticated
USING (lower(public.get_my_role()) IN ('super_admin','ceo','admin')
  AND private.procurement_supplier_scope(country_code::text, region_code, true));

CREATE FUNCTION private.guard_procurement_supplier_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE home public.sites%ROWTYPE;
DECLARE region_country text;
DECLARE lead_role boolean;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;
  IF home.id IS NULL OR upper(NEW.country_code) <> upper(home.country) THEN
    RAISE EXCEPTION 'Supplier country is outside the employee scope';
  END IF;
  lead_role := lower(actor.role) IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead');
  IF home.type = 'Administration' AND home.region_code IS NOT NULL THEN
    IF actor.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Employee regional assignment is inconsistent';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.region_code IS NULL THEN
      NEW.region_code := home.region_code;
    END IF;
    IF NEW.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Regional supplier edits require the assigned region';
    END IF;
  END IF;
  IF NEW.region_code IS NOT NULL THEN
    SELECT upper(country) INTO region_country FROM public.regions
      WHERE code = NEW.region_code;
    IF region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'Supplier region must belong to its country';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.verification_status IS DISTINCT FROM 'pending'
       OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New suppliers require independent verification';
    END IF;
  ELSE
    IF (NEW.country_code, NEW.region_code) IS DISTINCT FROM
       (OLD.country_code, OLD.region_code) THEN
      RAISE EXCEPTION 'Supplier assignment cannot be changed';
    END IF;
    IF NOT lead_role AND OLD.verification_status = 'verified' THEN
      RAISE EXCEPTION 'Verified supplier edits require a procurement lead';
    END IF;
    IF (NEW.verification_status, NEW.verified_by, NEW.verified_at) IS DISTINCT FROM
       (OLD.verification_status, OLD.verified_by, OLD.verified_at) THEN
      IF NOT lead_role OR NEW.verification_status <> 'verified'
         OR NEW.verified_by IS DISTINCT FROM actor.id::text
         OR NEW.verified_at IS NULL THEN
        RAISE EXCEPTION 'Supplier verification requires a procurement lead';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_procurement_supplier_write() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_procurement_supplier_write
BEFORE INSERT OR UPDATE ON public.suppliers FOR EACH ROW
EXECUTE FUNCTION private.guard_procurement_supplier_write();
