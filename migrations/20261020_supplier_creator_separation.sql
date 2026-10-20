ALTER TABLE public.suppliers ADD COLUMN created_by uuid REFERENCES public.employees(id);

CREATE OR REPLACE FUNCTION private.guard_procurement_supplier_write()
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
    NEW.created_by := actor.id;
    IF NEW.verification_status IS DISTINCT FROM 'pending'
       OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New suppliers require independent verification';
    END IF;
  ELSE
    IF (NEW.country_code, NEW.region_code, NEW.created_by) IS DISTINCT FROM
       (OLD.country_code, OLD.region_code, OLD.created_by) THEN
      RAISE EXCEPTION 'Supplier assignment and creator cannot be changed';
    END IF;
    IF NOT lead_role AND OLD.verification_status = 'verified' THEN
      RAISE EXCEPTION 'Verified supplier edits require a procurement lead';
    END IF;
    IF (NEW.verification_status, NEW.verified_by, NEW.verified_at) IS DISTINCT FROM
       (OLD.verification_status, OLD.verified_by, OLD.verified_at) THEN
      IF NOT lead_role OR actor.id = OLD.created_by
         OR NEW.verification_status <> 'verified'
         OR NEW.verified_by IS DISTINCT FROM actor.id::text
         OR NEW.verified_at IS NULL THEN
        RAISE EXCEPTION 'Supplier verification requires a separate procurement lead';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
