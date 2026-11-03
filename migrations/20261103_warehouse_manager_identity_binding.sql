-- Bind warehouse and distribution center leadership to an active employee at
-- that facility. Legacy manager strings remain as historical data until a
-- verified account is assigned; they no longer confer or imply access.
BEGIN;

ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS warehouse_manager_id uuid
  REFERENCES public.employees(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sites_warehouse_manager_unique
  ON public.sites(warehouse_manager_id) WHERE warehouse_manager_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.guard_warehouse_manager_binding()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE assigned public.employees%ROWTYPE; actor public.employees%ROWTYPE;
  actor_home public.sites%ROWTYPE; changed boolean;
BEGIN
  changed := CASE WHEN TG_OP = 'INSERT' THEN NEW.warehouse_manager_id IS NOT NULL
    ELSE NEW.warehouse_manager_id IS DISTINCT FROM OLD.warehouse_manager_id END;
  IF NEW.warehouse_manager_id IS NOT NULL THEN
    SELECT * INTO assigned FROM public.employees WHERE id = NEW.warehouse_manager_id;
    IF NEW.type NOT IN ('Warehouse','Distribution Center') OR assigned.id IS NULL
       OR public.normalize_role(assigned.role) <> 'warehouse_manager'
       OR lower(coalesce(assigned.status,'active')) <> 'active'
       OR assigned.site_id IS DISTINCT FROM NEW.id
       OR assigned.region_code IS DISTINCT FROM NEW.region_code THEN
      RAISE EXCEPTION 'Warehouse Manager must be active at this warehouse or distribution center' USING ERRCODE='23514';
    END IF;
    NEW.manager := assigned.name;
  ELSIF changed THEN
    NEW.manager := NULL;
  ELSIF TG_OP = 'INSERT' AND NEW.type IN ('Warehouse','Distribution Center') THEN
    NEW.manager := NULL;
  ELSIF TG_OP = 'UPDATE' AND NEW.type IN ('Warehouse','Distribution Center') THEN
    NEW.manager := OLD.manager;
  END IF;

  IF changed AND auth.uid() IS NOT NULL THEN
    SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
    SELECT * INTO actor_home FROM public.sites WHERE id=actor.site_id;
    IF actor.id IS NULL OR lower(coalesce(actor.status,'active')) <> 'active'
       OR public.normalize_role(actor.role) NOT IN
         ('group_ceo','country_managing_director','country_operations_director','regional_operations_manager')
       OR (public.normalize_role(actor.role) <> 'group_ceo'
           AND upper(actor_home.country) IS DISTINCT FROM upper(NEW.country))
       OR (public.normalize_role(actor.role) = 'regional_operations_manager'
           AND coalesce(actor.region_code,actor_home.region_code) IS DISTINCT FROM NEW.region_code) THEN
      RAISE EXCEPTION 'Operations leadership required to assign a Warehouse Manager' USING ERRCODE='42501';
    END IF;
  ELSIF changed AND (auth.jwt()->>'role') IS DISTINCT FROM 'service_role'
        AND session_user NOT IN ('postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Authenticated operations leadership required' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_warehouse_manager_binding() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_warehouse_manager_binding ON public.sites;
CREATE TRIGGER guard_warehouse_manager_binding
BEFORE INSERT OR UPDATE OF warehouse_manager_id, manager, type, country, region_code ON public.sites
FOR EACH ROW EXECUTE FUNCTION private.guard_warehouse_manager_binding();

-- Existing staging facilities each have one active Warehouse Manager account.
WITH unique_manager AS (
  SELECT site_id,min(id::text)::uuid AS manager_id FROM public.employees
  WHERE public.normalize_role(role)='warehouse_manager' AND lower(coalesce(status,'active'))='active'
  GROUP BY site_id HAVING count(*)=1
)
UPDATE public.sites site SET warehouse_manager_id=unique_manager.manager_id
FROM unique_manager
WHERE site.id=unique_manager.site_id AND site.type IN ('Warehouse','Distribution Center')
  AND site.warehouse_manager_id IS NULL;

CREATE OR REPLACE FUNCTION private.guard_assigned_warehouse_manager_employee()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.sites site WHERE site.warehouse_manager_id=OLD.id)
     AND (NEW.site_id IS DISTINCT FROM OLD.site_id
       OR public.normalize_role(NEW.role) <> 'warehouse_manager'
       OR lower(coalesce(NEW.status,'active')) <> 'active'
       OR NEW.region_code IS DISTINCT FROM OLD.region_code) THEN
    RAISE EXCEPTION 'Unassign the Warehouse Manager from the facility before changing their role, site, region, or status' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_assigned_warehouse_manager_employee() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_assigned_warehouse_manager_employee ON public.employees;
CREATE TRIGGER guard_assigned_warehouse_manager_employee
BEFORE UPDATE OF site_id,role,status,region_code ON public.employees
FOR EACH ROW EXECUTE FUNCTION private.guard_assigned_warehouse_manager_employee();

COMMIT;
