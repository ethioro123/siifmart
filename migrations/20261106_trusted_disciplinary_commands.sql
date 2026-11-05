ALTER TABLE public.disciplinary_records ADD COLUMN issued_by_id uuid, ADD COLUMN reviewed_by_id uuid,
 ADD COLUMN appeal_notes text, ADD COLUMN decision_reason text, ADD COLUMN decided_at timestamptz, ADD COLUMN request_fingerprint text;
CREATE TABLE private.disciplinary_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),record_id uuid NOT NULL REFERENCES public.disciplinary_records(id),actor_id uuid NOT NULL,action text NOT NULL,notes text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.disciplinary_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.disciplinary_events FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.disciplinary_records FROM authenticated,anon;
CREATE FUNCTION private.disciplinary_hr_scope(p_employee uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees actor,public.employees target JOIN public.sites s ON s.id=target.site_id
 WHERE actor.id=auth.uid() AND actor.status='Active' AND target.id=p_employee
 AND actor.role IN('group_ceo','group_chro','country_managing_director','country_hr_director','regional_hr_manager','hr_generalist')
 AND private.hr_site_scope(s.id::text,s.country) AND public.is_country_in_my_authorized_scope(s.country));
$$;
CREATE FUNCTION private.issue_disciplinary_notice(p_id uuid,p_employee uuid,p_input jsonb) RETURNS public.disciplinary_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target public.employees%ROWTYPE; site public.sites%ROWTYPE; r public.disciplinary_records%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO target FROM public.employees WHERE id=p_employee FOR SHARE;
 SELECT * INTO site FROM public.sites WHERE id=target.site_id;
 IF p_id IS NULL OR NOT private.disciplinary_hr_scope(target.id) OR actor.id=target.id
 OR private.employee_role_rank(actor.role)<=private.employee_role_rank(target.role) THEN RAISE EXCEPTION 'Scoped independent HR authority required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('disciplinary:'||p_id::text,0));
 SELECT * INTO r FROM public.disciplinary_records WHERE id=p_id;
 IF FOUND THEN
  IF r.issued_by_id IS DISTINCT FROM actor.id OR r.employee_id IS DISTINCT FROM target.id OR r.request_fingerprint IS DISTINCT FROM md5(p_input::text) THEN RAISE EXCEPTION 'Notice retry differs from saved request'; END IF;
  RETURN r;
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_input) k WHERE k NOT IN('record_type','severity','title','description','action_taken','expires_at','confidential_notes'))
 OR coalesce(p_input->>'record_type','') NOT IN('Verbal Warning','Written Warning','Final Warning','Suspension','Grievance','Formal Investigation')
 OR coalesce(p_input->>'severity','') NOT IN('Low','Medium','High','Critical')
 OR length(btrim(coalesce(p_input->>'title',''))) NOT BETWEEN 3 AND 200
 OR length(btrim(coalesce(p_input->>'description',''))) NOT BETWEEN 10 AND 5000
 OR length(btrim(coalesce(p_input->>'action_taken',''))) NOT BETWEEN 3 AND 2000
 OR length(coalesce(p_input->>'confidential_notes',''))>5000 THEN RAISE EXCEPTION 'Valid notice details required'; END IF;
 INSERT INTO public.disciplinary_records(id,country_code,site_id,employee_id,employee_name,record_type,severity,title,description,action_taken,appeal_status,issued_by,issued_by_role,issued_by_id,expires_at,confidential_notes,request_fingerprint)
 VALUES(p_id,site.country,site.id::text,target.id,target.name,p_input->>'record_type',p_input->>'severity',btrim(p_input->>'title'),btrim(p_input->>'description'),btrim(p_input->>'action_taken'),'None',actor.name,actor.role,actor.id,nullif(p_input->>'expires_at','')::date,nullif(p_input->>'confidential_notes',''),md5(p_input::text)) RETURNING * INTO r;
 INSERT INTO private.disciplinary_events(record_id,actor_id,action,notes) VALUES(r.id,actor.id,'ISSUED',r.description);
 RETURN r;
END $$;
CREATE FUNCTION private.disciplinary_decision(p_id uuid,p_action text,p_notes text) RETURNS public.disciplinary_records
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.disciplinary_records%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO r FROM public.disciplinary_records WHERE id=p_id FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR length(btrim(coalesce(p_notes,''))) NOT BETWEEN 10 AND 5000 THEN RAISE EXCEPTION 'Saved notice, signed-in employee and reason required' USING ERRCODE='42501'; END IF;
 IF p_action='appeal' THEN
  IF actor.id<>r.employee_id AND NOT private.disciplinary_hr_scope(r.employee_id) THEN RAISE EXCEPTION 'Appeal is outside employee scope' USING ERRCODE='42501'; END IF;
  IF actor.id=r.issued_by_id THEN RAISE EXCEPTION 'The notice issuer cannot file an appeal on behalf of the employee' USING ERRCODE='42501'; END IF;
  IF r.appeal_status='Pending Appeal' AND r.appeal_notes=btrim(p_notes) THEN RETURN r; END IF;
  IF r.appeal_status<>'None' THEN RAISE EXCEPTION 'This notice already has an appeal decision'; END IF;
  UPDATE public.disciplinary_records SET appeal_status='Pending Appeal',appeal_notes=btrim(p_notes) WHERE id=r.id RETURNING * INTO r;
 ELSE
  IF p_action NOT IN('Upheld','Overturned') OR NOT private.disciplinary_hr_scope(r.employee_id)
   OR r.issued_by_id IS NULL OR actor.id IN(r.issued_by_id,r.employee_id) THEN RAISE EXCEPTION 'Independent authorized HR reviewer required' USING ERRCODE='42501'; END IF;
  IF r.appeal_status=p_action AND r.reviewed_by_id=actor.id AND r.decision_reason=btrim(p_notes) THEN RETURN r; END IF;
  IF r.appeal_status<>'Pending Appeal' THEN RAISE EXCEPTION 'Pending appeal required'; END IF;
  UPDATE public.disciplinary_records SET appeal_status=p_action,reviewed_by_id=actor.id,decision_reason=btrim(p_notes),decided_at=now() WHERE id=r.id RETURNING * INTO r;
 END IF;
 INSERT INTO private.disciplinary_events(record_id,actor_id,action,notes) VALUES(r.id,actor.id,p_action,btrim(p_notes));
 RETURN r;
END $$;
CREATE FUNCTION private.list_disciplinary_records(p_country text,p_site text,p_employee uuid,p_page integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT private.has_active_operational_employee() OR p_page NOT BETWEEN 1 AND 100000 OR NOT public.is_country_in_my_authorized_scope(p_country) THEN RAISE EXCEPTION 'Authorized country and page required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(payload),'[]') INTO result FROM (
 SELECT CASE WHEN private.disciplinary_hr_scope(r.employee_id) THEN to_jsonb(r) ELSE to_jsonb(r)||jsonb_build_object('confidential_notes',NULL) END payload
 FROM public.disciplinary_records r JOIN public.employees e ON e.id=r.employee_id JOIN public.sites s ON s.id=e.site_id
 WHERE r.country_code=p_country AND r.country_code=s.country AND (p_site IS NULL OR r.site_id=p_site) AND (p_employee IS NULL OR r.employee_id=p_employee)
 AND (r.employee_id=auth.uid() OR private.disciplinary_hr_scope(r.employee_id))
 ORDER BY r.issued_at DESC,r.id LIMIT 25 OFFSET (p_page-1)*25) rows;
 RETURN result;
END $$;
CREATE FUNCTION public.issue_disciplinary_notice(p_id uuid,p_employee uuid,p_input jsonb) RETURNS public.disciplinary_records LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.issue_disciplinary_notice(p_id,p_employee,p_input); $$;
CREATE FUNCTION public.disciplinary_decision(p_id uuid,p_action text,p_notes text) RETURNS public.disciplinary_records LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.disciplinary_decision(p_id,p_action,p_notes); $$;
CREATE FUNCTION public.list_disciplinary_records(p_country text,p_site text DEFAULT NULL,p_employee uuid DEFAULT NULL,p_page integer DEFAULT 1) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.list_disciplinary_records(p_country,p_site,p_employee,p_page); $$;
REVOKE ALL ON FUNCTION private.disciplinary_hr_scope(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.issue_disciplinary_notice(uuid,uuid,jsonb),private.disciplinary_decision(uuid,text,text),private.list_disciplinary_records(text,text,uuid,integer),public.issue_disciplinary_notice(uuid,uuid,jsonb),public.disciplinary_decision(uuid,text,text),public.list_disciplinary_records(text,text,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.issue_disciplinary_notice(uuid,uuid,jsonb),private.disciplinary_decision(uuid,text,text),private.list_disciplinary_records(text,text,uuid,integer),public.issue_disciplinary_notice(uuid,uuid,jsonb),public.disciplinary_decision(uuid,text,text),public.list_disciplinary_records(text,text,uuid,integer) TO authenticated;
