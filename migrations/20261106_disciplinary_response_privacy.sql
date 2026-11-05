CREATE OR REPLACE FUNCTION private.disciplinary_decision(p_id uuid, p_action text, p_notes text)
 RETURNS disciplinary_records
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.disciplinary_records%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO r FROM public.disciplinary_records WHERE id=p_id FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR length(btrim(coalesce(p_notes,''))) NOT BETWEEN 10 AND 5000 THEN RAISE EXCEPTION 'Saved notice, signed-in employee and reason required' USING ERRCODE='42501'; END IF;
 IF p_action='appeal' THEN
  IF actor.id<>r.employee_id AND NOT private.disciplinary_hr_scope(r.employee_id) THEN RAISE EXCEPTION 'Appeal is outside employee scope' USING ERRCODE='42501'; END IF;
  IF actor.id=r.issued_by_id THEN RAISE EXCEPTION 'The notice issuer cannot file an appeal on behalf of the employee' USING ERRCODE='42501'; END IF;
  IF r.appeal_status='Pending Appeal' AND r.appeal_notes=btrim(p_notes) THEN IF NOT private.disciplinary_hr_scope(r.employee_id) THEN r.confidential_notes:=NULL; END IF; RETURN r; END IF;
  IF r.appeal_status<>'None' THEN RAISE EXCEPTION 'This notice already has an appeal decision'; END IF;
  UPDATE public.disciplinary_records SET appeal_status='Pending Appeal',appeal_notes=btrim(p_notes) WHERE id=r.id RETURNING * INTO r;
 ELSE
  IF p_action NOT IN('Upheld','Overturned') OR NOT private.disciplinary_hr_scope(r.employee_id)
   OR r.issued_by_id IS NULL OR actor.id IN(r.issued_by_id,r.employee_id) THEN RAISE EXCEPTION 'Independent authorized HR reviewer required' USING ERRCODE='42501'; END IF;
  IF r.appeal_status=p_action AND r.reviewed_by_id=actor.id AND r.decision_reason=btrim(p_notes) THEN IF NOT private.disciplinary_hr_scope(r.employee_id) THEN r.confidential_notes:=NULL; END IF; RETURN r; END IF;
  IF r.appeal_status<>'Pending Appeal' THEN RAISE EXCEPTION 'Pending appeal required'; END IF;
  UPDATE public.disciplinary_records SET appeal_status=p_action,reviewed_by_id=actor.id,decision_reason=btrim(p_notes),decided_at=now() WHERE id=r.id RETURNING * INTO r;
 END IF;
 INSERT INTO private.disciplinary_events(record_id,actor_id,action,notes) VALUES(r.id,actor.id,p_action,btrim(p_notes));
 IF NOT private.disciplinary_hr_scope(r.employee_id) THEN r.confidential_notes:=NULL; END IF; RETURN r;
END $function$;

