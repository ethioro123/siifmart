-- Regression checks for live assignment guards; no business records are changed.
BEGIN;
DO $test$
DECLARE actor record;
DECLARE target record;
DECLARE expected boolean;
DECLARE checked integer := 0;
BEGIN
  FOR actor IN
    SELECT e.id, e.role, e.region_code, e.site_id, s.country, s.type
    FROM public.employees e JOIN public.sites s ON s.id = e.site_id
    WHERE e.status = 'Active' AND (
      (e.role = 'buyer' AND s.type = 'Administration' AND s.region_code IS NOT NULL)
      OR (e.role = 'warehouse_manager' AND s.type IN ('Warehouse', 'Distribution Center'))
    )
  LOOP
    PERFORM set_config('request.jwt.claim.sub', actor.id::text, true);
    FOR target IN
      SELECT id, country, region_code FROM public.sites
      WHERE status = 'Active' AND type IN ('Warehouse', 'Distribution Center')
    LOOP
      expected := CASE WHEN actor.type = 'Administration'
        THEN actor.country = target.country AND actor.region_code = target.region_code
        ELSE actor.site_id = target.id END;
      IF private.procurement_site_scope(target.id::text, target.country) IS DISTINCT FROM expected THEN
        RAISE EXCEPTION 'Procurement scope mismatch for actor % and destination %', actor.id, target.id;
      END IF;
      checked := checked + 1;
    END LOOP;
    IF actor.role = 'buyer' THEN
      IF NOT private.procurement_supplier_scope(actor.country, actor.region_code, false)
         OR private.procurement_supplier_scope(actor.country, NULL, false) THEN
        RAISE EXCEPTION 'Regional supplier boundary mismatch for actor %', actor.id;
      END IF;
    END IF;
  END LOOP;
  IF checked = 0 THEN RAISE EXCEPTION 'No staging actors available for scope regression checks'; END IF;
END;
$test$;
ROLLBACK;
SELECT 'Procurement assignment boundary assertions passed' AS result;
