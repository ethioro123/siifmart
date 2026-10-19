-- Keep the WMS row permissions in one policy per action to avoid repeated RLS checks.
ALTER POLICY wms_jobs_zero_trust_select ON public.wms_jobs USING (
  is_ceo()
  OR (
    upper(country_code) = upper(get_my_country_code())
    AND (is_site_in_my_authorized_scope(site_id::text,country_code)
      OR is_site_in_my_authorized_scope(dest_site_id::text,country_code))
    AND (is_manager() OR is_admin()
      OR assigned_to::text = ANY (ARRAY[auth.uid()::text,get_my_employee_id()::text,get_my_employee_code()])
      OR private.is_current_user_assigned_to_wms_job(id))
  )
  OR (
    lower(get_my_role()) IN ('dispatcher','regional_logistics_lead')
    AND upper(country_code) = upper(get_my_country_code())
    AND is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
    AND type IN ('DISPATCH','DRIVER','TRANSFER')
  )
  OR (
    type = 'TRANSFER' AND lower(get_my_role()) = 'receiver'
    AND dest_site_id = get_my_site_id()
    AND upper(country_code) = upper(get_my_country_code())
    AND transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered','Received')
  )
);

ALTER POLICY wms_jobs_zero_trust_update ON public.wms_jobs
USING (
  is_ceo()
  OR (
    upper(country_code) = upper(get_my_country_code())
    AND (is_site_in_my_authorized_scope(site_id::text,country_code)
      OR is_site_in_my_authorized_scope(dest_site_id::text,country_code))
    AND (is_manager() OR is_admin()
      OR assigned_to::text = ANY (ARRAY[auth.uid()::text,get_my_employee_id()::text,get_my_employee_code()])
      OR private.is_current_user_assigned_to_wms_job(id))
  )
  OR (
    lower(get_my_role()) IN ('dispatcher','regional_logistics_lead')
    AND upper(country_code) = upper(get_my_country_code())
    AND is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
    AND type IN ('DISPATCH','DRIVER')
  )
  OR (
    type = 'TRANSFER' AND lower(get_my_role()) = 'receiver'
    AND dest_site_id = get_my_site_id()
    AND upper(country_code) = upper(get_my_country_code())
    AND transfer_status IN ('Delivered','Partially Delivered')
  )
)
WITH CHECK (
  is_ceo()
  OR (
    upper(country_code) = upper(get_my_country_code())
    AND (is_site_in_my_authorized_scope(site_id::text,country_code)
      OR is_site_in_my_authorized_scope(dest_site_id::text,country_code))
    AND (is_manager() OR is_admin()
      OR assigned_to::text = ANY (ARRAY[auth.uid()::text,get_my_employee_id()::text,get_my_employee_code()])
      OR private.is_current_user_assigned_to_wms_job(id))
  )
  OR (
    lower(get_my_role()) IN ('dispatcher','regional_logistics_lead')
    AND upper(country_code) = upper(get_my_country_code())
    AND is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
    AND type IN ('DISPATCH','DRIVER')
  )
  OR (
    type = 'TRANSFER' AND lower(get_my_role()) = 'receiver'
    AND dest_site_id = get_my_site_id()
    AND upper(country_code) = upper(get_my_country_code())
    AND transfer_status = 'Received' AND status = 'Completed'
  )
);

DROP POLICY IF EXISTS dispatcher_transport_read ON public.wms_jobs;
DROP POLICY IF EXISTS dispatcher_transport_update ON public.wms_jobs;
DROP POLICY IF EXISTS destination_transfer_receipt_read ON public.wms_jobs;
DROP POLICY IF EXISTS destination_transfer_receipt_update ON public.wms_jobs;
