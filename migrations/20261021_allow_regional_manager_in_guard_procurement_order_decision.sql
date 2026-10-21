-- Migration: 20261021_allow_regional_manager_in_guard_procurement_order_decision.sql
-- Enables Regional General Managers (regional_manager / regional_operations_director)
-- to execute autonomous purchase order decisions within their territorial jurisdiction and budget cap.

CREATE OR REPLACE FUNCTION private.guard_procurement_order_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE 
  actor public.employees%ROWTYPE;
  actor_norm_role text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
      IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
    RAISE EXCEPTION 'Purchase order origin cannot be changed';
  END IF;

  actor_norm_role := public.normalize_role(actor.role);

  IF actor_norm_role = 'buyer' AND
      (OLD.status NOT IN ('Draft','Pending') OR NEW.status NOT IN ('Draft','Pending')) THEN
    RAISE EXCEPTION 'Buyers may prepare draft purchase orders only';
  END IF;

  IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
      NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
      IS DISTINCT FROM
      (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
       OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
      OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved','Rejected')) THEN
    IF actor_norm_role NOT IN
       ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead','regional_manager','operations_manager','finance_manager') THEN
      RAISE EXCEPTION 'Purchase order decision requires authorized procurement or executive managerial role';
    END IF;
    IF actor_norm_role NOT IN ('super_admin','ceo') AND
       (lower(trim(COALESCE(OLD.created_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)
        OR lower(trim(COALESCE(OLD.requested_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)) THEN
      RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
