BEGIN;
CREATE OR REPLACE FUNCTION private.lifecycle_target(kind text,target uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; s public.sites%ROWTYPE; p public.purchase_orders%ROWTYPE;
 t public.transfers%ROWTYPE; job public.wms_jobs%ROWTYPE; state jsonb; label text;
BEGIN
 CASE kind
 WHEN 'employee' THEN
   SELECT * INTO STRICT e FROM public.employees WHERE id=target FOR UPDATE;
   SELECT * INTO STRICT s FROM public.sites WHERE id=e.site_id FOR SHARE;
   label:=e.name; state:=jsonb_build_object('status',e.status,'role',e.role,'site_id',e.site_id,'region_code',e.region_code);
 WHEN 'site' THEN
   SELECT * INTO STRICT s FROM public.sites WHERE id=target FOR UPDATE;
   label:=s.name; state:=jsonb_build_object('status',s.status,'country',s.country,'type',s.type,'region_code',s.region_code);
 WHEN 'purchase_order' THEN
   SELECT * INTO STRICT p FROM public.purchase_orders WHERE id=target FOR UPDATE;
   SELECT * INTO STRICT s FROM public.sites WHERE id=p.site_id FOR SHARE;
   IF upper(p.country_code) IS DISTINCT FROM upper(s.country) THEN RAISE EXCEPTION 'Purchase order country mismatch'; END IF;
   label:=coalesce(p.po_number,p.id::text);
   state:=jsonb_build_object('status',p.status,'total',p.total_amount,'created_by',p.created_by,'requested_by',p.requested_by);
 WHEN 'warehouse_job' THEN
   SELECT * INTO STRICT job FROM public.wms_jobs WHERE id=target FOR UPDATE;
   SELECT * INTO STRICT s FROM public.sites WHERE id=job.site_id FOR SHARE;
   IF upper(job.country_code) IS DISTINCT FROM upper(s.country)
     OR (job.dest_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sites destination WHERE destination.id=job.dest_site_id AND upper(destination.country)=upper(job.country_code))) THEN
     RAISE EXCEPTION 'Warehouse job endpoints are outside scope'; END IF;
   label:=coalesce(job.job_number,job.order_ref,job.id::text);
   state:=jsonb_build_object('status',job.status,'type',job.type,'transfer_status',job.transfer_status,
     'assigned_to',job.assigned_to,'requested_by',job.requested_by,'items_digest',md5(coalesce(job.line_items,'[]'::jsonb)::text));
 WHEN 'transfer' THEN
   SELECT * INTO STRICT t FROM public.transfers WHERE id=target FOR UPDATE;
   SELECT * INTO STRICT s FROM public.sites WHERE id=t.source_site_id FOR SHARE;
   IF upper(t.country_code) IS DISTINCT FROM upper(s.country)
     OR NOT EXISTS(SELECT 1 FROM public.sites destination WHERE destination.id=t.dest_site_id AND upper(destination.country)=upper(t.country_code)) THEN RAISE EXCEPTION 'Transfer endpoints are outside scope'; END IF;
   label:=coalesce(t.order_ref,t.id::text);
   state:=jsonb_build_object('status',t.status,'transfer_status',t.transfer_status,'shipped_at',t.shipped_at,
     'dispatched_at',t.dispatched_at,'received_at',t.received_at,'approved_at',t.approved_at,'requested_by',t.requested_by);
 ELSE RAISE EXCEPTION 'Unsupported lifecycle action';
 END CASE;
 IF NOT private.lifecycle_visible(s.id,s.country) THEN RAISE EXCEPTION 'Record is outside your authorized scope' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('site_id',s.id,'country_code',upper(s.country),'region_code',s.region_code,'label',label,'state',state);
EXCEPTION WHEN no_data_found THEN RAISE EXCEPTION 'Record is unavailable in your authorized scope' USING ERRCODE='42501';
END;
$$;
REVOKE ALL ON FUNCTION private.lifecycle_target(text,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.list_lifecycle_targets(p_kind text,p_country text,p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,label text,state text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE;
BEGIN
 SELECT employee.* INTO actor FROM public.employees employee WHERE employee.id=auth.uid() AND employee.status='Active';
 IF actor.id IS NULL OR auth.uid() IS NULL OR p_country NOT IN ('ET','KE') OR length(coalesce(p_search,''))>100 OR p_offset<0 OR p_offset>10000 THEN
   RAISE EXCEPTION 'A valid authenticated country scope is required'; END IF;
 RETURN QUERY SELECT candidate.id,candidate.label::text,candidate.state::text FROM (
   SELECT e.id,e.name AS label,e.status::text AS state,e.site_id,s.country::text AS country
   FROM public.employees e JOIN public.sites s ON s.id=e.site_id
   WHERE p_kind='employee' AND e.status<>'Terminated' AND e.id<>actor.id AND private.lifecycle_rank(actor.role)>private.lifecycle_rank(e.role)
   UNION ALL
   SELECT s.id,s.name,s.status::text,s.id,s.country::text FROM public.sites s
   WHERE p_kind='site' AND actor.role IN ('group_ceo','country_managing_director','country_operations_director','regional_operations_manager') AND s.status<>'Closed' AND s.type IN ('Store','Warehouse','Distribution Center')
   UNION ALL
   SELECT p.id,coalesce(p.po_number,p.id::text),p.status,p.site_id,p.country_code::text
   FROM public.purchase_orders p WHERE p_kind='purchase_order' AND p.status IN ('Draft','Pending') AND (private.lifecycle_rank(actor.role)>0 OR (actor.role IN ('buyer','demand_planner','replenishment_planner') AND (coalesce(p.created_by,'') IN (actor.name,actor.id::text) OR coalesce(p.requested_by,'') IN (actor.name,actor.id::text))))
   UNION ALL
   SELECT j.id,coalesce(j.job_number,j.order_ref,j.id::text),j.status::text,j.site_id,j.country_code::text
   FROM public.wms_jobs j WHERE p_kind='warehouse_job' AND j.status='Pending' AND (private.lifecycle_rank(actor.role)>0 OR coalesce(j.requested_by,'') IN (actor.name,actor.id::text))
     AND coalesce(j.assigned_to,'') IN ('','Unassigned') AND coalesce(j.transfer_status,'Draft') IN ('Draft','Requested','Pending_Approval','Rejected')
   UNION ALL
   SELECT t.id,coalesce(t.order_ref,t.id::text),t.status::text,t.source_site_id,t.country_code
   FROM public.transfers t WHERE p_kind='transfer' AND (private.lifecycle_rank(actor.role)>0 OR coalesce(t.requested_by,'') IN (actor.name,actor.id::text)) AND t.status IN ('Requested','Rejected')
     AND t.dispatched_at IS NULL AND t.shipped_at IS NULL AND t.received_at IS NULL AND t.approved_at IS NULL
     AND EXISTS(SELECT 1 FROM public.sites destination WHERE destination.id=t.dest_site_id AND upper(destination.country)=upper(t.country_code))
 ) candidate WHERE upper(candidate.country)=p_country AND private.lifecycle_visible(candidate.site_id,candidate.country)
   AND candidate.label ILIKE '%'||coalesce(p_search,'')||'%'
 ORDER BY candidate.label,candidate.id LIMIT 25 OFFSET p_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) TO authenticated;
COMMIT;
