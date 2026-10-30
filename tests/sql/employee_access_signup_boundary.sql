-- Transactional integration checks: all fixtures and handover/audit changes are rolled back.
BEGIN;
DO $$
DECLARE
  staff_id uuid := gen_random_uuid(); actor_id uuid := gen_random_uuid(); rejected_id uuid := gen_random_uuid();
  fixture_site uuid; fixture_country text; staff_email text; actor_email text;
  metadata jsonb; confirmed jsonb; first_stamp text; checks integer := 0;
BEGIN
  SELECT id,country INTO fixture_site,fixture_country FROM public.sites WHERE country IN ('ET','KE') ORDER BY country,id LIMIT 1;
  IF fixture_site IS NULL THEN RAISE EXCEPTION 'An operating site is required for the access regression'; END IF;
  staff_email := 'access-regression-'||staff_id||'@example.invalid';
  actor_email := 'access-regression-'||actor_id||'@example.invalid';
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  INSERT INTO public.employees(id,name,role,email,site_id,status,join_date,job_title)
  VALUES (staff_id,'Access regression staff','cashier',staff_email,fixture_site,'Active',current_date,'Cashier'),
         (actor_id,'Access regression manager','store_manager',actor_email,fixture_site,'Active',current_date,'Store Manager');
  metadata := jsonb_build_object('staff_employee_id',staff_id,'site_id',fixture_site,'role','cashier','country_code',fixture_country);

  -- Public registration and user-editable metadata cannot create staff or customers.
  BEGIN
    INSERT INTO auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
    VALUES(rejected_id,'rejected-'||rejected_id||'@example.invalid','{}',metadata);
    RAISE EXCEPTION 'Unexpected customer registration success';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Self-service registration is disabled.%' THEN RAISE; END IF;
    checks := checks+1;
  END;
  -- Trusted metadata still must match the stored role, country and employment status.
  BEGIN
    INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES(staff_id,staff_email,metadata||'{"country_code":"XX"}');
    RAISE EXCEPTION 'Unexpected foreign-country registration success';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Self-service registration is disabled.%' THEN RAISE; END IF;
    checks := checks+1;
  END;
  UPDATE public.employees SET status='Pending Approval' WHERE id=staff_id;
  BEGIN
    INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES(staff_id,staff_email,metadata);
    RAISE EXCEPTION 'Unexpected pending-staff registration success';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Self-service registration is disabled.%' THEN RAISE; END IF;
    checks := checks+1;
  END;
  UPDATE public.employees SET status='Active' WHERE id=staff_id;
  INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES(staff_id,staff_email,metadata);
  IF EXISTS(SELECT 1 FROM public.users WHERE auth_id=staff_id) THEN RAISE EXCEPTION 'Staff unexpectedly created a commerce profile'; END IF;
  checks := checks+1;

  -- A client cannot directly record completion; the service command is atomic and idempotent.
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  BEGIN
    UPDATE public.employees SET credentials_handed_over_at=now(),credentials_handed_over_by='Unverified' WHERE id=staff_id;
    RAISE EXCEPTION 'Unexpected client handover success';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Verified employee access handover is required' THEN RAISE; END IF;
    checks := checks+1;
  END;
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  confirmed := public.record_employee_access_handover(actor_id,staff_id,fixture_country,'store_manager','cashier',fixture_site);
  first_stamp := confirmed->>'handedOverAt';
  IF first_stamp IS NULL THEN RAISE EXCEPTION 'Handover was not saved'; END IF;
  confirmed := public.record_employee_access_handover(actor_id,staff_id,fixture_country,'store_manager','cashier',fixture_site);
  IF confirmed->>'handedOverAt' IS DISTINCT FROM first_stamp OR
    (SELECT count(*) FROM public.system_logs WHERE action='EMPLOYEE_ACCESS_HANDED_OVER' AND details::jsonb->>'employeeId'=staff_id::text)<>1 THEN
    RAISE EXCEPTION 'Handover retry was not idempotent';
  END IF;
  checks := checks+1;
  IF has_function_privilege('anon','public.record_employee_access_handover(uuid,uuid,text,text,text,uuid)','EXECUTE') OR
     has_function_privilege('authenticated','public.record_employee_access_handover(uuid,uuid,text,text,text,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Client can invoke privileged handover';
  END IF;
  checks := checks+1;
  IF checks<>7 THEN RAISE EXCEPTION 'Access checks incomplete'; END IF;
END;
$$;
SELECT '7 employee access and signup boundary checks passed; fixtures rolled back' AS result;
ROLLBACK;
