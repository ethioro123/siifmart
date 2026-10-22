-- Persist primary and functional employee reporting links and enforce safe hierarchy edges.
BEGIN;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS reports_to_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS functional_manager_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_reports_to_employee_id
  ON public.employees (reports_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_functional_manager_employee_id
  ON public.employees (functional_manager_employee_id);

CREATE OR REPLACE FUNCTION public.validate_employee_reporting_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_employee_country text;
  v_manager_country text;
  v_employee_region text;
  v_manager_region text;
  v_manager_role text;
  v_manager_scope text;
  v_cycle boolean;
BEGIN
  IF NEW.reports_to_employee_id = NEW.id OR NEW.functional_manager_employee_id = NEW.id THEN
    RAISE EXCEPTION 'An employee cannot report to themselves';
  END IF;

  SELECT upper(s.country)
    INTO v_employee_country
    FROM public.sites s
   WHERE s.id::text = NEW.site_id::text;
  v_employee_region := NEW.region_code;

  IF NEW.reports_to_employee_id IS NOT NULL THEN
    WITH RECURSIVE reporting_chain(id, reports_to_employee_id, path) AS (
      SELECT e.id, e.reports_to_employee_id, ARRAY[e.id]
        FROM public.employees e
       WHERE e.id = NEW.reports_to_employee_id
      UNION ALL
      SELECT e.id, e.reports_to_employee_id, chain.path || e.id
        FROM public.employees e
        JOIN reporting_chain chain ON e.id = chain.reports_to_employee_id
       WHERE chain.reports_to_employee_id IS NOT NULL
         AND NOT e.id = ANY(chain.path)
    )
    SELECT EXISTS (SELECT 1 FROM reporting_chain WHERE id = NEW.id) INTO v_cycle;

    IF v_cycle THEN
      RAISE EXCEPTION 'Primary reporting relationships cannot contain a cycle';
    END IF;
  END IF;

  FOR v_manager_role, v_manager_country, v_manager_region, v_manager_scope IN
    SELECT m.role, upper(s.country), m.region_code, m.scope_level
      FROM public.employees m
      LEFT JOIN public.sites s ON s.id::text = m.site_id::text
     WHERE m.id IN (NEW.reports_to_employee_id, NEW.functional_manager_employee_id)
  LOOP
    IF v_employee_country IS NOT NULL AND v_manager_country IS NOT NULL
       AND v_employee_country <> v_manager_country THEN
      RAISE EXCEPTION 'Reporting relationships cannot cross country boundaries';
    END IF;
    IF v_employee_country IS NULL AND v_manager_country IS NOT NULL
       AND NEW.role NOT IN ('group_ceo','group_coo','group_cfo','group_cco','group_cmo','group_csco','group_chro','group_cto','group_cio','group_clco','group_cae','super_admin','ceo') THEN
      RAISE EXCEPTION 'Global employees cannot report into a country hierarchy';
    END IF;
    IF v_employee_country IS NOT NULL AND v_manager_country IS NULL
       AND v_manager_role NOT IN ('group_ceo','group_coo','group_cfo','group_cco','group_cmo','group_csco','group_chro','group_cto','group_cio','group_clco','group_cae','super_admin','ceo') THEN
      RAISE EXCEPTION 'Country employees may report globally only to group executives';
    END IF;
    IF coalesce(upper(NEW.scope_level), '') = 'REGIONAL'
       AND coalesce(upper(v_manager_scope), '') = 'REGIONAL'
       AND v_employee_region IS NOT NULL AND v_manager_region IS NOT NULL
       AND lower(v_employee_region) <> lower(v_manager_region) THEN
      RAISE EXCEPTION 'Regional reporting relationships cannot cross region boundaries';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_employee_reporting_relationships() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_validate_employee_reporting_relationships ON public.employees;
CREATE TRIGGER trg_validate_employee_reporting_relationships
  BEFORE INSERT OR UPDATE OF site_id, region_code, scope_level, reports_to_employee_id, functional_manager_employee_id
  ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.validate_employee_reporting_relationships();

COMMIT;
