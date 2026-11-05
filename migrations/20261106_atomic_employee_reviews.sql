ALTER TABLE public.employee_change_requests ADD COLUMN requested_by_id uuid REFERENCES public.employees(id),ADD COLUMN original_fields jsonb;
CREATE TABLE private.employee_change_signatures(request_id uuid REFERENCES public.employee_change_requests(id),authority text NOT NULL,actor_id uuid NOT NULL REFERENCES public.employees(id),signed_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(request_id,authority),UNIQUE(request_id,actor_id));
ALTER TABLE private.employee_change_signatures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.employee_change_signatures FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.employee_change_department(p_field text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_field='salary' THEN 'Finance Department' WHEN p_field IN('name','age','date_of_birth','national_id_number') THEN 'Executive / Compliance'
 WHEN p_field IN('role','status','department','site_id','region_code','scope_level') THEN 'Operations Management' ELSE 'Human Resources' END;
$$;
CREATE FUNCTION private.guard_employee_change_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; actor public.employees%ROWTYPE; pair record; key text; proposal jsonb:='{}'; original jsonb:='{}'; authorities jsonb;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO e FROM public.employees WHERE id=NEW.employee_id FOR SHARE;
 IF actor.id IS NULL OR e.id IS NULL OR NOT private.hr_site_scope(e.site_id::text,NEW.country_code) OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=e.site_id AND country=NEW.country_code) THEN RAISE EXCEPTION 'Scoped employee change required' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN
  IF current_setting('siifmart.employee_review',true) IS DISTINCT FROM NEW.id::text THEN RAISE EXCEPTION 'Use the trusted employee review command' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.status<>'pending' OR NEW.approved_by IS NOT NULL OR NEW.rejected_by IS NOT NULL OR length(btrim(NEW.reason))<10 THEN RAISE EXCEPTION 'Pending proposal and reason required'; END IF;
 FOR pair IN SELECT * FROM jsonb_each(NEW.full_proposed_employee) LOOP
  key:=CASE pair.key WHEN 'siteId' THEN 'site_id' WHEN 'regionCode' THEN 'region_code' WHEN 'scopeLevel' THEN 'scope_level' WHEN 'dateOfBirth' THEN 'date_of_birth' WHEN 'nationalIdNumber' THEN 'national_id_number' WHEN 'emergencyContact' THEN 'emergency_contact' WHEN 'jobTitle' THEN 'job_title' ELSE pair.key END;
  IF key=ANY(ARRAY['name','role','salary','status','department','site_id','region_code','scope_level','age','date_of_birth','national_id_number','phone','address','emergency_contact','specialization','job_title']) AND pair.value IS DISTINCT FROM to_jsonb(e)->key THEN
   IF actor.id=e.id AND key IN('role','salary','status','site_id','region_code','scope_level','department') THEN RAISE EXCEPTION 'Self-promotion and self-compensation proposals prohibited'; END IF;
   proposal:=proposal||jsonb_build_object(key,pair.value);original:=original||jsonb_build_object(key,to_jsonb(e)->key);
  END IF;
 END LOOP;
 IF proposal='{}' THEN RAISE EXCEPTION 'No changed employee fields'; END IF;
 IF proposal ? 'site_id' AND NOT EXISTS(SELECT 1 FROM public.sites WHERE id::text=proposal->>'site_id' AND country=NEW.country_code) THEN RAISE EXCEPTION 'Employee transfer must stay within country'; END IF;
 SELECT jsonb_agg(DISTINCT private.employee_change_department(k)) INTO authorities FROM jsonb_object_keys(proposal) k;
 NEW.full_proposed_employee:=proposal;NEW.original_fields:=original;NEW.required_approvers:=authorities;NEW.requested_by_id:=actor.id;NEW.requested_by:=actor.name;NEW.requested_by_role:=actor.role;NEW.requested_at:=now();NEW.site_id:=e.site_id::text;NEW.employee_name:=e.name;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.employee_change_department(text),private.guard_employee_change_request() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_employee_change_request BEFORE INSERT OR UPDATE ON public.employee_change_requests FOR EACH ROW EXECUTE FUNCTION private.guard_employee_change_request();
REVOKE UPDATE,DELETE ON public.employee_change_requests FROM authenticated,anon;
CREATE FUNCTION private.review_employee_change(p_request uuid,p_approve boolean,p_notes text) RETURNS public.employee_change_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.employee_change_requests%ROWTYPE; actor public.employees%ROWTYPE; e public.employees%ROWTYPE; pair record; authority text; allowed text[]; signed integer; updated public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO r FROM public.employee_change_requests WHERE id=p_request FOR UPDATE;
 SELECT * INTO e FROM public.employees WHERE id=r.employee_id FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR r.status<>'pending' OR r.requested_by_id IS NULL OR r.original_fields IS NULL
 OR actor.id IN(r.employee_id,r.requested_by_id) OR NOT private.hr_site_scope(e.site_id::text,r.country_code)
 OR (actor.role<>'group_ceo' AND private.employee_role_rank(actor.role)<=private.employee_role_rank(e.role)) THEN
 RAISE EXCEPTION 'Independent authorized reviewer and pending current proposal required' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_notes,''))) NOT BETWEEN 3 AND 1200 THEN RAISE EXCEPTION 'Decision reason required'; END IF;
 allowed:=CASE actor.role WHEN 'group_ceo' THEN ARRAY['Executive / Compliance','Finance Department','Operations Management','Human Resources']
 WHEN 'country_managing_director' THEN ARRAY['Executive / Compliance','Finance Department','Operations Management','Human Resources']
 WHEN 'country_compliance_manager' THEN ARRAY['Executive / Compliance']
 WHEN 'group_cfo' THEN ARRAY['Finance Department'] WHEN 'country_finance_director' THEN ARRAY['Finance Department'] WHEN 'regional_finance_manager' THEN ARRAY['Finance Department']
 WHEN 'country_hr_director' THEN ARRAY['Human Resources'] WHEN 'regional_hr_manager' THEN ARRAY['Human Resources'] WHEN 'hr_generalist' THEN ARRAY['Human Resources']
 WHEN 'country_operations_director' THEN ARRAY['Operations Management'] WHEN 'regional_operations_manager' THEN ARRAY['Operations Management'] WHEN 'warehouse_manager' THEN ARRAY['Operations Management'] WHEN 'store_manager' THEN ARRAY['Operations Management'] ELSE ARRAY[]::text[] END;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(r.required_approvers) a WHERE a=ANY(allowed)) THEN RAISE EXCEPTION 'Required department authority missing' USING ERRCODE='42501'; END IF;
 FOR pair IN SELECT * FROM jsonb_each(r.original_fields) LOOP
  IF to_jsonb(e)->pair.key IS DISTINCT FROM pair.value THEN RAISE EXCEPTION 'Employee changed since this proposal; submit a fresh request'; END IF;
 END LOOP;
 PERFORM set_config('siifmart.employee_review',r.id::text,true);
 IF NOT p_approve THEN
  UPDATE public.employee_change_requests SET status='rejected',rejected_by=actor.name,rejected_at=now(),rejection_reason=btrim(p_notes) WHERE id=r.id RETURNING * INTO r;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM private.employee_change_signatures WHERE request_id=r.id AND actor_id=actor.id) THEN
   SELECT a INTO authority FROM jsonb_array_elements_text(r.required_approvers) a WHERE a=ANY(allowed) AND NOT EXISTS(SELECT 1 FROM private.employee_change_signatures s WHERE s.request_id=r.id AND s.authority=a) ORDER BY a LIMIT 1;
   IF authority IS NOT NULL THEN INSERT INTO private.employee_change_signatures(request_id,authority,actor_id) VALUES(r.id,authority,actor.id); END IF;
  END IF;
  SELECT count(*) INTO signed FROM private.employee_change_signatures WHERE request_id=r.id;
  IF signed=jsonb_array_length(r.required_approvers) THEN
   UPDATE public.employee_change_requests SET status='approved',approved_by=actor.name,approved_by_role=actor.role,approved_at=now() WHERE id=r.id RETURNING * INTO r;
   PERFORM set_config('siifmart.employee_change',r.id::text,true);
   updated:=jsonb_populate_record(e,r.full_proposed_employee);
   UPDATE public.employees SET name=updated.name,role=updated.role,salary=updated.salary,status=updated.status,department=updated.department,site_id=updated.site_id,
    region_code=updated.region_code,scope_level=updated.scope_level,age=updated.age,date_of_birth=updated.date_of_birth,national_id_number=updated.national_id_number,
    phone=updated.phone,address=updated.address,emergency_contact=updated.emergency_contact,specialization=updated.specialization,job_title=updated.job_title WHERE id=e.id;
  END IF;
 END IF;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_id,details) VALUES('EMPLOYEE_CHANGE_REVIEW','HR',actor.id::text,r.site_id,r.country_code,r.id::text,jsonb_build_object('status',r.status,'reason',p_notes)::text);
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION private.review_employee_change(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.review_employee_change(uuid,boolean,text) TO authenticated;
CREATE FUNCTION public.review_employee_change(p_request uuid,p_approve boolean,p_notes text) RETURNS public.employee_change_requests LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.review_employee_change(p_request,p_approve,p_notes); $$;
REVOKE ALL ON FUNCTION public.review_employee_change(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_employee_change(uuid,boolean,text) TO authenticated;
