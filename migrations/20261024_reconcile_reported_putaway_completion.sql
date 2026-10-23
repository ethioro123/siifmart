-- Recover only the reported staging completion; never changes products or physical counts.
DO $$
DECLARE j public.wms_jobs%ROWTYPE; old_sub text; old_claims text;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id='a098fffd-bad6-442d-9e96-36309317ac35'
  AND country_code='ET' AND site_id='a1111111-1111-4000-8000-000000000001'
  AND type='PUTAWAY' AND status='Completed' AND completed_by=assigned_to FOR UPDATE;
 IF j.id IS NULL THEN RETURN; END IF;
 UPDATE public.job_assignments SET status='Completed',completed_at=j.completed_at
  WHERE job_id=j.id AND employee_id::text=j.completed_by AND status IN ('Assigned','Accepted','In-Progress');
 old_sub:=current_setting('request.jwt.claim.sub',true); old_claims:=current_setting('request.jwt.claims',true);
 PERFORM set_config('request.jwt.claim.sub',j.completed_by,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',j.completed_by,'role','authenticated')::text,true);
 PERFORM public.award_completed_warehouse_job(j.id);
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);
END $$;
