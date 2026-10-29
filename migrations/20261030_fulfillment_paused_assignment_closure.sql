-- Paused assignments must leave active workload when their job closes.
CREATE OR REPLACE FUNCTION private.close_completed_job_assignments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
 UPDATE public.job_assignments SET status='Completed',completed_at=coalesce(NEW.completed_at,now()) WHERE job_id=NEW.id AND status IN('Assigned','Accepted','In-Progress','Paused');
 END IF;
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION private.maintain_fulfillment_jobs(p_site uuid,p_country text,p_action text,p_job uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE; changed integer:=0;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','regional_operations_manager','warehouse_manager','store_manager','inventory_manager')
 OR NOT public.is_site_in_my_authorized_scope(p_site::text,p_country) OR NOT public.is_country_in_my_authorized_scope(p_country) THEN RAISE EXCEPTION 'Authorized site supervisor required' USING ERRCODE='42501'; END IF;
 IF p_action='reconcile' THEN
  UPDATE public.job_assignments a SET status='Completed',completed_at=coalesce(j.completed_at,now()) FROM public.wms_jobs j
  WHERE a.job_id=j.id AND j.site_id=p_site AND j.country_code=p_country AND j.status='Completed' AND a.status IN('Assigned','Accepted','In-Progress','Paused');
  GET DIAGNOSTICS changed=ROW_COUNT;
 ELSIF p_action IN('reset','cancel') THEN
  SELECT * INTO job FROM public.wms_jobs WHERE id=p_job AND site_id=p_site AND country_code=p_country FOR UPDATE;
  IF job.id IS NULL OR job.status<>'Pending' OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(job.line_items,'[]')) l WHERE coalesce(l->>'status','Pending')<>'Pending' OR coalesce((l->>'pickedQty')::numeric,0)<>0 OR coalesce((l->>'packedQty')::numeric,0)<>0)
  OR EXISTS(SELECT 1 FROM public.stock_movements WHERE reason LIKE 'Putaway job '||job.id::text||' line %') THEN RAISE EXCEPTION 'Only unstarted pending jobs can be reset or cancelled; preserve physical work for supervisor review'; END IF;
  UPDATE public.job_assignments SET status='Cancelled',completed_at=now() WHERE job_id=job.id AND status IN('Assigned','Accepted','In-Progress','Paused');
  UPDATE public.wms_jobs SET status=CASE WHEN p_action='reset' THEN 'Pending' ELSE 'Cancelled' END,assigned_to=NULL WHERE id=job.id;
  changed:=1;
 ELSE RAISE EXCEPTION 'Unsupported maintenance action'; END IF;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('FULFILLMENT_MAINTENANCE','Fulfillment',actor.name,actor.id,p_site,p_country,'wms_job',p_job::text,jsonb_build_object('action',p_action,'changed',changed));
 RETURN jsonb_build_object('saved',true,'changed',changed);
END; $$;
