-- Derive the evidence shown to reviewers from the actual proposed fields, not client-written diff labels.
CREATE OR REPLACE FUNCTION private.guard_employee_change_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 SELECT jsonb_agg(jsonb_build_object('field',k,'label',initcap(replace(k,'_',' ')),'oldValue',original->k,'newValue',proposal->k,
 'governanceCategory',CASE private.employee_change_department(k) WHEN 'Finance Department' THEN 'compensation' WHEN 'Executive / Compliance' THEN 'identity' WHEN 'Operations Management' THEN 'role_privilege' ELSE 'contact_general' END,
 'approvingDepartment',private.employee_change_department(k)) ORDER BY k) INTO NEW.diffs FROM jsonb_object_keys(proposal) k;
 NEW.full_proposed_employee:=proposal;NEW.original_fields:=original;NEW.required_approvers:=authorities;NEW.requested_by_id:=actor.id;NEW.requested_by:=actor.name;NEW.requested_by_role:=actor.role;NEW.requested_at:=now();NEW.site_id:=e.site_id::text;NEW.employee_name:=e.name;
 RETURN NEW;
END $$;
