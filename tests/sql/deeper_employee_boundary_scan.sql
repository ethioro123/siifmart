-- Investigation observations; all synthetic records and configuration changes roll back.
BEGIN;
SET LOCAL statement_timeout='10s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE foreign_employee uuid:=gen_random_uuid(); foreign_site uuid; BEGIN
 INSERT INTO public.facility_headcount_quotas(site_id,role,approved_quota,max_monthly_salary,country_code)
 VALUES('c1111111-1111-4000-8000-000000000110','picker',0,1,'ET')
 ON CONFLICT(site_id,role) DO UPDATE SET approved_quota=0,max_monthly_salary=1;
 SELECT id INTO foreign_site FROM public.sites WHERE country='KE' AND lower(status) IN('active','open') LIMIT 1;
 INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date)
 VALUES(foreign_employee,'Audit foreign employee','audit-'||foreign_employee||'@example.invalid','picker','Active',foreign_site,'Picker',current_date);
 PERFORM set_config('test.employee.deeper.foreign',foreign_employee::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE employee uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date,salary)
 VALUES(employee,'Audit over-budget hire','audit-'||employee||'@example.invalid','picker','Pending Approval','c1111111-1111-4000-8000-000000000110','Picker',current_date,1000000);
 PERFORM set_config('test.employee.deeper.hire',employee::text,true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE results jsonb:='{}'; n integer; active_hire uuid:=gen_random_uuid(); notice uuid:=gen_random_uuid(); BEGIN
 BEGIN
  UPDATE public.employees SET status='Active' WHERE id=current_setting('test.employee.deeper.hire')::uuid;
  GET DIAGNOSTICS n=ROW_COUNT;results:=results||jsonb_build_object('hr_activates_over_quota_and_salary_band_without_finance',n=1);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('hr_activates_over_quota_and_salary_band_without_finance',SQLERRM);END;
 BEGIN
  INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date,salary)
  VALUES(active_hire,'Audit pipeline hire','audit-'||active_hire||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','Picker',current_date,1);
  results:=results||jsonb_build_object('non_ceo_active_insert','accepted');
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('non_ceo_active_insert',SQLERRM);END;
 BEGIN
  INSERT INTO public.disciplinary_records(id,country_code,site_id,employee_id,employee_name,record_type,severity,title,description,action_taken,appeal_status,issued_by,issued_by_role)
  VALUES(notice,'ET','c1111111-1111-4000-8000-000000000110',current_setting('test.employee.deeper.foreign')::uuid,'Audit foreign employee','Written Warning','High','Audit scope probe','Rollback-only investigation','Review','Pending Appeal',auth.uid()::text,'regional_hr_manager');
  results:=results||jsonb_build_object('et_hr_issues_notice_for_ke_employee',true);
  UPDATE public.disciplinary_records SET appeal_status='Upheld' WHERE id=notice;
  GET DIAGNOSTICS n=ROW_COUNT;results:=results||jsonb_build_object('notice_issuer_adjudicates_own_appeal',n=1);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('disciplinary_probe_error',SQLERRM);END;
 PERFORM set_config('test.employee.deeper.results',results::text,true);
END $$;
RESET ROLE;
SELECT current_setting('test.employee.deeper.results')::jsonb AS observations;
ROLLBACK;
