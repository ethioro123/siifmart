BEGIN;
SET LOCAL statement_timeout='10s';
SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE local_employee uuid:=gen_random_uuid(); foreign_employee uuid:=gen_random_uuid(); foreign_site uuid; BEGIN
 SELECT id INTO foreign_site FROM public.sites WHERE country='KE' AND lower(status) IN('active','open') LIMIT 1;
 INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date) VALUES(local_employee,'Audit local employee','audit-'||local_employee||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','Picker',current_date),(foreign_employee,'Audit foreign employee','audit-'||foreign_employee||'@example.invalid','picker','Active',foreign_site,'Picker',current_date);
 PERFORM set_config('test.discipline.local',local_employee::text,true);PERFORM set_config('test.discipline.foreign',foreign_employee::text,true);PERFORM set_config('test.discipline.notice',gen_random_uuid()::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; payload jsonb:='{"record_type":"Written Warning","severity":"High","title":"Audit evidence","description":"Recorded personnel evidence","action_taken":"Review required","confidential_notes":"Restricted HR evidence"}'; r public.disciplinary_records%ROWTYPE; BEGIN
 BEGIN INSERT INTO public.disciplinary_records(country_code,site_id,employee_id,employee_name,record_type,severity,title,description,action_taken,issued_by,issued_by_role) VALUES('ET','c1111111-1111-4000-8000-000000000110',current_setting('test.discipline.foreign')::uuid,'Audit','Written Warning','High','Audit','Audit evidence','Review','Forged','regional_hr_manager');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Direct cross-country notice accepted';
 blocked:=false;BEGIN PERFORM public.issue_disciplinary_notice(gen_random_uuid(),current_setting('test.discipline.foreign')::uuid,payload);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Cross-country trusted notice accepted';
 r:=public.issue_disciplinary_notice(current_setting('test.discipline.notice')::uuid,current_setting('test.discipline.local')::uuid,payload);ASSERT r.issued_by_id=auth.uid();ASSERT r.country_code='ET';
 ASSERT (public.issue_disciplinary_notice(r.id,r.employee_id,payload)).id=r.id,'Retry duplicated notice';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub',current_setting('test.discipline.local'),true);SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.discipline.local'),'role','authenticated')::text,true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.disciplinary_records%ROWTYPE; rows jsonb; BEGIN
 rows:=public.list_disciplinary_records('ET',NULL,NULL,1);ASSERT rows->0->>'confidential_notes' IS NULL,'Own list leaked HR notes';
 r:=public.disciplinary_decision(current_setting('test.discipline.notice')::uuid,'appeal','Employee appeal evidence');ASSERT r.appeal_status='Pending Appeal';ASSERT r.confidential_notes IS NULL,'Appeal result leaked HR notes';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM public.disciplinary_decision(current_setting('test.discipline.notice')::uuid,'Upheld','Issuer reviewing own notice');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Issuer adjudicated own appeal';
 blocked:=false;BEGIN UPDATE public.disciplinary_records SET appeal_status='Upheld' WHERE id=current_setting('test.discipline.notice')::uuid;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Direct appeal update accepted';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.disciplinary_records%ROWTYPE; BEGIN
 r:=public.disciplinary_decision(current_setting('test.discipline.notice')::uuid,'Upheld','Independent evidence reviewed');ASSERT r.appeal_status='Upheld' AND r.reviewed_by_id=auth.uid();
 ASSERT (public.disciplinary_decision(r.id,'Upheld','Independent evidence reviewed')).id=r.id;
END $$;
RESET ROLE;
DO $$ BEGIN ASSERT (SELECT count(*) FROM private.disciplinary_events WHERE record_id=current_setting('test.discipline.notice')::uuid)=3,'Retry duplicated disciplinary events';END $$;
ROLLBACK;
SELECT 'PASS: disciplinary target scope, private notes, independent appeal decisions and retry audit; rolled back' result;
