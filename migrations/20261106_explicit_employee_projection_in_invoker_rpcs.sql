-- Replace naked SELECT * FROM public.employees in SECURITY INVOKER functions
-- so column-level privacy revocation on public.employees(salary) does not block
-- warehouse job assignment or expense review under authenticated sessions.

CREATE OR REPLACE FUNCTION public.assign_warehouse_job_atomic(
  p_job uuid,
  p_employee uuid,
  p_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  j public.wms_jobs%ROWTYPE;
  e record;
  a public.job_assignments%ROWTYPE;
BEGIN
  SELECT * INTO j FROM public.wms_jobs WHERE id = p_job FOR UPDATE;
  SELECT id, name, role, site_id, status
    INTO e
    FROM public.employees
   WHERE id = p_employee AND lower(status) = 'active';

  IF auth.uid() IS NULL
     OR j.id IS NULL
     OR e.id IS NULL
     OR NOT public.is_manager()
     OR j.status NOT IN ('Pending', 'In-Progress')
     OR NOT public.is_site_in_my_authorized_scope(j.site_id::text, j.country_code)
     OR e.site_id IS DISTINCT FROM j.site_id
     OR (nullif(j.assigned_to, '') IS NOT NULL AND j.assigned_to <> e.id::text) THEN
    RAISE EXCEPTION 'Scoped manager and available facility worker required' USING ERRCODE = '42501';
  END IF;

  IF (j.type IN ('DRIVER', 'DELIVERY', 'DISPATCH') AND e.role <> 'driver')
     OR (j.type NOT IN ('DRIVER', 'DELIVERY', 'DISPATCH') AND e.role NOT IN (
       'picker', 'packer', 'receiver', 'receiving_operator', 'putaway_operator',
       'replenishment_operator', 'inventory_controller', 'stock_counter',
       'dispatch_operator', 'returns_operator', 'fleet_mechanic',
       'inventory_specialist', 'forklift_operator', 'stock_clerk',
       'inbound_qc_inspector', 'returns_clerk', 'driver'
     )) THEN
    RAISE EXCEPTION 'Worker is not eligible for this job';
  END IF;

  SELECT *
    INTO a
    FROM public.job_assignments
   WHERE job_id = j.id AND employee_id = e.id AND status <> 'Cancelled'
   ORDER BY created_at DESC
   LIMIT 1;

  UPDATE public.wms_jobs
     SET assigned_to = e.id::text,
         status = 'In-Progress',
         assigned_by = (SELECT name FROM public.employees WHERE id = auth.uid())
   WHERE id = j.id
   RETURNING * INTO j;

  IF a.id IS NULL THEN
    INSERT INTO public.job_assignments(job_id, employee_id, employee_name, status, estimated_duration)
    VALUES (j.id, e.id, e.name, 'Assigned', greatest(1, least(coalesce(p_minutes, 15), 10080)))
    RETURNING * INTO a;
  END IF;

  RETURN jsonb_build_object('job', to_jsonb(j), 'assignment', to_jsonb(a));
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_expense_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  actor record;
  actor_role text;
  regional_limit numeric;
  country_limit numeric;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.status NOT IN ('Approved', 'Rejected') THEN
    RETURN NEW;
  END IF;

  SELECT id, name, role, site_id, status
    INTO actor
    FROM public.employees
   WHERE id = auth.uid() AND lower(status) = 'active';

  IF NOT FOUND OR actor.id IS NULL THEN
    RAISE EXCEPTION 'Active reviewer required';
  END IF;

  actor_role := public.normalize_role(actor.role);
  IF actor_role NOT IN (
       'group_ceo', 'group_cfo', 'country_managing_director',
       'country_finance_director', 'country_operations_director',
       'regional_finance_manager', 'regional_operations_manager'
     )
     OR NOT public.is_site_in_my_authorized_scope(OLD.site_id::text, OLD.country_code) THEN
    RAISE EXCEPTION 'Expense review denied';
  END IF;

  IF OLD.status <> 'Pending' THEN
    RAISE EXCEPTION 'Expense is no longer pending';
  END IF;

  IF OLD.created_by_id = actor.id OR lower(trim(OLD.created_by_name)) = lower(trim(actor.name)) THEN
    RAISE EXCEPTION 'Independent reviewer required';
  END IF;

  IF NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.site_id IS DISTINCT FROM OLD.site_id
     OR NEW.country_code IS DISTINCT FROM OLD.country_code
     OR NEW.created_by_id IS DISTINCT FROM OLD.created_by_id THEN
    RAISE EXCEPTION 'Expense evidence cannot change during review';
  END IF;

  SELECT COALESCE(r.autonomous_expense_limit, c.expense_regional_limit), c.expense_country_limit
    INTO regional_limit, country_limit
    FROM public.country_governance_limits c
    LEFT JOIN public.regions r
      ON r.code = OLD.region_code AND upper(r.country) = upper(OLD.country_code)
   WHERE upper(c.country_code) = upper(OLD.country_code);

  IF regional_limit IS NULL OR country_limit IS NULL THEN
    RAISE EXCEPTION 'Expense limits are unavailable';
  END IF;

  IF coalesce(OLD.escalated_to_ceo, false) OR OLD.amount > country_limit THEN
    IF actor_role NOT IN ('group_ceo', 'group_cfo') THEN
      RAISE EXCEPTION 'Group Finance or CEO required';
    END IF;
  ELSIF actor_role IN ('regional_finance_manager', 'regional_operations_manager') THEN
    IF OLD.amount > regional_limit THEN
      RAISE EXCEPTION 'Country sign-off required';
    END IF;
  END IF;

  IF coalesce(current_setting('siifmart.expense_review_reason', true), '') = '' THEN
    RAISE EXCEPTION 'Use the expense decision function with a reason';
  END IF;

  IF NEW.status = 'Approved' THEN
    NEW.approved_by_id := actor.id;
    NEW.approved_by := actor.name;
    NEW.approved_at := now();
  END IF;

  NEW.updated_at := now();

  INSERT INTO public.system_logs(user_name, action, module, details, site_id, country_code)
  VALUES (
    actor.name,
    'EXPENSE_' || upper(NEW.status),
    'Financials',
    jsonb_build_object(
      'expense_id', OLD.id,
      'amount', OLD.amount,
      'reason', current_setting('siifmart.expense_review_reason', true)
    )::text,
    OLD.site_id,
    OLD.country_code
  );

  RETURN NEW;
END;
$function$;
