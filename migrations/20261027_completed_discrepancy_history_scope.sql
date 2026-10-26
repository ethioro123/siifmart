-- Apply the own-completion rule to private job-history RPCs too.
CREATE OR REPLACE FUNCTION private.floor_discrepancy_job(p_job_id uuid) RETURNS public.wms_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type IN ('PICK','PACK');
 IF auth.uid() IS NULL OR e.id IS NULL OR j.id IS NULL
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=j.site_id AND upper(country)=upper(j.country_code))
  OR (j.assigned_to IS DISTINCT FROM e.id::text AND e.role NOT IN
   ('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')) THEN
  RAISE EXCEPTION 'Discrepancy is outside your assigned job or supervisory scope' USING ERRCODE='42501'; END IF;
 IF j.status IN ('Completed','Cancelled','Deleted') AND j.completed_by IS DISTINCT FROM e.id::text
  AND NOT (public.is_manager() OR public.is_ceo()) THEN
  RAISE EXCEPTION 'Floor workers can view history only for jobs they personally completed' USING ERRCODE='42501'; END IF;
 RETURN j;
END; $$;
