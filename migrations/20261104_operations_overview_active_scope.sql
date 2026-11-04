-- Administrative managers see their existing authorized portfolio; branch roles stay facility-scoped.
BEGIN;
CREATE FUNCTION private.operations_review_scope_sites(p_anchor uuid,p_country text)
RETURNS TABLE(site_id uuid,site_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; anchor_type text; portfolio boolean;
BEGIN
 PERFORM private.require_operations_review_scope(p_anchor,p_country);
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 SELECT type INTO anchor_type FROM public.sites WHERE id=p_anchor;
 portfolio:=anchor_type='Administration' AND actor.role IN('group_ceo','country_managing_director','country_operations_director',
 'regional_operations_manager','regional_supply_chain_manager','inventory_manager');
 RETURN QUERY SELECT s.id,s.name FROM public.sites s WHERE s.country=p_country
 AND (s.id=p_anchor OR portfolio)
 AND public.is_site_in_my_authorized_scope(s.id::text,p_country);
END; $$;
REVOKE ALL ON FUNCTION private.operations_review_scope_sites(uuid,text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.operations_review_rows(p_site uuid,p_country text)
RETURNS TABLE(source text,id uuid,operation text,reference text,status text,handler text,occurred_at timestamptz,exception boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT 'receipt',r.id,'RECEIVE',coalesce(r.po_number,r.sku,r.product_name),
 CASE WHEN private.blind_receipt_needs_review(r.id) THEN 'Pending review' ELSE 'Recorded' END,
 r.employee_name,r.created_at,private.blind_receipt_needs_review(r.id)
 FROM private.blind_receipt_counts r WHERE r.site_id=p_site AND r.country_code=p_country
 UNION ALL
 SELECT 'job',j.id,CASE WHEN j.type IN('DRIVER','DELIVERY') THEN 'DISPATCH' ELSE j.type END,
 coalesce(j.job_number,j.order_ref,left(j.id::text,8)),j.status,
 coalesce((SELECT e.name FROM public.employees e WHERE e.id::text=coalesce(j.completed_by,j.assigned_to)),j.completed_by,j.assigned_to),
 coalesce(j.updated_at,j.created_at),
 (coalesce(j.has_discrepancy,false) AND NOT EXISTS(SELECT 1 FROM private.floor_discrepancies original_report WHERE original_report.job_id=j.id)) OR EXISTS(SELECT 1 FROM private.floor_discrepancies d
 LEFT JOIN private.floor_discrepancy_reviews v ON v.discrepancy_id=d.id WHERE d.job_id=j.id AND (d.resolved_at IS NULL OR v.discrepancy_id IS NULL))
 FROM public.wms_jobs j WHERE j.country_code=p_country AND (j.site_id=p_site OR j.source_site_id=p_site OR j.dest_site_id=p_site)
 AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','DRIVER','DELIVERY','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS')

 UNION ALL
 SELECT 'inventory',i.id,CASE WHEN i.adjustment_reason LIKE 'Waste:%' THEN 'WASTE' ELSE 'COUNT' END,
 coalesce(i.product_sku,i.product_name,left(i.id::text,8)),i.status,i.requested_by,i.requested_at,i.status='pending'
 FROM public.inventory_requests i WHERE i.site_id=p_site::text AND i.country_code=p_country AND i.change_type='stock_adjustment'
 UNION ALL
 SELECT 'return',r.id,'RETURNS',coalesce((SELECT s.receipt_number FROM public.sales s WHERE s.id=r.sale_id),left(r.id::text,8)),r.status,
 (SELECT e.name FROM public.employees e WHERE e.id=r.requested_by),r.requested_at,r.status='pending'
 FROM public.fulfillment_return_requests r WHERE r.site_id=p_site AND r.country_code=p_country
 UNION ALL
 SELECT 'count',s.id,'COUNT',s.count_type,s.status,(SELECT e.name FROM public.employees e WHERE e.id=s.created_by),s.created_at,
 EXISTS(SELECT 1 FROM public.wms_count_items i JOIN public.inventory_requests r ON r.id=i.inventory_request_id WHERE i.session_id=s.id AND r.status='pending')
 FROM public.wms_count_sessions s WHERE s.site_id=p_site AND s.country_code=p_country
 UNION ALL
 SELECT 'transfer',t.id,'TRANSFER',coalesce(t.order_ref,left(t.id::text,8)),t.status,t.requested_by,t.created_at,
 (coalesce(t.has_discrepancy,false) AND t.discrepancy_resolved_at IS NULL)
 FROM public.transfers t WHERE t.country_code=p_country AND (t.source_site_id=p_site OR t.dest_site_id=p_site)
 AND NOT EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.country_code=p_country AND j.type='TRANSFER' AND (j.order_ref=t.id::text OR j.order_ref=t.order_ref));
$$;
CREATE OR REPLACE FUNCTION private.operations_review_queue(p_site uuid,p_country text,p_operation text,p_mode text,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF p_mode IS NULL OR p_mode NOT IN('exceptions','active','history') OR p_offset IS NULL OR p_offset<0 OR p_offset>100000
 OR p_operation IS NULL OR p_operation NOT IN('ALL','RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS') THEN RAISE EXCEPTION 'Valid operation, view and page required'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (
 SELECT dedup.source,dedup.id,dedup.operation,dedup.reference,dedup.status,dedup.handler,dedup.occurred_at,dedup.exception,dedup.site_id,dedup.site_name
 FROM (
 SELECT DISTINCT ON(r.source,r.id) r.source,r.id,r.operation,r.reference,r.status,r.handler,r.occurred_at,r.exception,s.site_id,s.site_name
 FROM private.operations_review_scope_sites(p_site,p_country) s
 CROSS JOIN LATERAL private.operations_review_rows(s.site_id,p_country) r
 LEFT JOIN public.wms_jobs owner_job ON r.source='job' AND owner_job.id=r.id
 WHERE (p_operation='ALL' OR r.operation=p_operation)
 AND CASE p_mode WHEN 'exceptions' THEN r.exception WHEN 'history' THEN r.status IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded')
 ELSE r.status NOT IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded') END
 ORDER BY r.source,r.id,(owner_job.site_id=s.site_id) DESC NULLS LAST,s.site_id
 )dedup
 ORDER BY CASE WHEN p_mode='active' AND dedup.status IN('In-Progress','In Progress','In-Transit') THEN 0 ELSE 1 END,
 dedup.occurred_at DESC,dedup.source,dedup.id LIMIT 25 OFFSET p_offset)q),'[]');
END; $$;
CREATE OR REPLACE FUNCTION public.operations_review_queue(p_site uuid,p_country text,p_operation text DEFAULT 'ALL',p_mode text DEFAULT 'active',p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.operations_review_queue(p_site,p_country,p_operation,p_mode,p_offset); $$;
COMMIT;
