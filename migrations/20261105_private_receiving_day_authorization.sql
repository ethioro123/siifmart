-- Keep privileged scope checks behind an invoker RPC wrapper.
CREATE FUNCTION private.authorized_putaway_receiving_day(p_job uuid) RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE job public.wms_jobs%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job AND type='PUTAWAY';
 IF actor.id IS NULL OR job.id IS NULL OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,job.country_code)
 OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM job.site_id OR public.get_my_country_code_strict() IS DISTINCT FROM job.country_code))
 OR (actor.role NOT IN('group_ceo','warehouse_manager','country_operations_director','country_managing_director')
 AND (job.assigned_to IS DISTINCT FROM actor.id::text OR NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
 RAISE EXCEPTION 'Authorized putaway employee required' USING ERRCODE='42501'; END IF;
 RETURN private.putaway_receiving_day(p_job);
END $$;
REVOKE ALL ON FUNCTION private.authorized_putaway_receiving_day(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.authorized_putaway_receiving_day(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.putaway_receiving_day(p_job uuid) RETURNS date
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $$ SELECT private.authorized_putaway_receiving_day(p_job); $$;
REVOKE ALL ON FUNCTION public.putaway_receiving_day(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.putaway_receiving_day(uuid) TO authenticated;
