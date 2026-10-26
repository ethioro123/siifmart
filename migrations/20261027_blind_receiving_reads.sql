-- Destination store sessions use redacted views before receipt. Source operations
-- retain their manifests; destination readers cannot query the underlying rows.
CREATE FUNCTION private.is_blind_store_destination(p_dest uuid,p_source uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND p_dest=public.get_my_site_id() AND p_source IS DISTINCT FROM p_dest
 AND EXISTS(SELECT 1 FROM public.sites WHERE id=p_dest AND type IN('Store','Dark Store'))
 AND public.get_my_role() NOT IN('group_ceo','country_operations_director','regional_operations_manager');
$$;
REVOKE ALL ON FUNCTION private.is_blind_store_destination(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_blind_store_destination(uuid,uuid) TO authenticated;
CREATE POLICY blind_store_wms_raw ON public.wms_jobs AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT private.is_blind_store_destination(dest_site_id,coalesce(source_site_id,site_id)) OR type NOT IN('TRANSFER','DISPATCH','DRIVER') OR transfer_status IN('Delivered','Partially Delivered','Received'));
CREATE POLICY blind_store_transfer_raw ON public.transfers AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT private.is_blind_store_destination(dest_site_id,source_site_id) OR status IN('Delivered','Partially Delivered','Received','Completed'));
CREATE VIEW public.blind_receiving_wms WITH (security_barrier=true) AS
SELECT (jsonb_populate_record(NULL::public.wms_jobs,to_jsonb(j)||jsonb_build_object('line_items',private.strip_transfer_quantities(j.line_items),'items_count',0,'notes',NULL,'discrepancy_details',NULL))).*
FROM public.wms_jobs j WHERE auth.uid() IS NOT NULL AND private.is_blind_store_destination(j.dest_site_id,coalesce(j.source_site_id,j.site_id))
 AND j.country_code=public.get_my_country_code() AND j.type IN('TRANSFER','DISPATCH','DRIVER') AND coalesce(j.transfer_status,'') NOT IN('Delivered','Partially Delivered','Received')
 AND public.is_site_in_my_authorized_scope(j.dest_site_id::text,j.country_code);
REVOKE ALL ON public.blind_receiving_wms FROM PUBLIC,anon;
GRANT SELECT ON public.blind_receiving_wms TO authenticated;
CREATE VIEW public.blind_receiving_transfers WITH (security_barrier=true) AS
SELECT (jsonb_populate_record(NULL::public.transfers,to_jsonb(t)||jsonb_build_object('items',private.strip_transfer_quantities(t.items),'notes',NULL,'discrepancy_details',NULL))).*
FROM public.transfers t WHERE auth.uid() IS NOT NULL AND private.is_blind_store_destination(t.dest_site_id,t.source_site_id)
 AND t.country_code=public.get_my_country_code() AND t.status NOT IN('Delivered','Partially Delivered','Received','Completed')
 AND public.is_site_in_my_authorized_scope(t.dest_site_id::text,t.country_code);
REVOKE ALL ON public.blind_receiving_transfers FROM PUBLIC,anon;
GRANT SELECT ON public.blind_receiving_transfers TO authenticated;
