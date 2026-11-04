-- Preserve the WMS job reference separately from the resolved PO business reference.
BEGIN;
CREATE OR REPLACE FUNCTION private.receiving_review_evidence(p_job uuid,p_site uuid,p_country text,p_page integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE po uuid; result jsonb; independent boolean;
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF p_page IS NULL OR p_page<0 OR p_page>5000 THEN RAISE EXCEPTION 'Valid receipt evidence page required'; END IF;
 po:=private.receiving_review_po(p_job,p_site,p_country);
 IF po IS NULL THEN RETURN NULL; END IF;
 independent:=NOT EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.id=p_job AND
 (j.assigned_to=auth.uid()::text OR j.completed_by=auth.uid()::text))
 AND NOT EXISTS(SELECT 1 FROM private.fulfillment_receipts r WHERE r.po_id=po AND r.employee_id=auth.uid())
 AND NOT EXISTS(SELECT 1 FROM private.floor_stage_handlers h WHERE h.country_code=p_country AND h.order_ref=po::text AND h.stage='RECEIVE' AND h.employee_id=auth.uid()::text);
 SELECT jsonb_build_object('po_number',p.po_number,'supplier_name',p.supplier_name,'partial',private.receiving_review_partial(p_job,p_site,p_country),
 'items',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
 SELECT i.id,i.product_name,i.sku,coalesce(i.received_qty,0) AS received,
 CASE WHEN independent AND coalesce(i.received_qty,0)>0 THEN private.po_expected_sellable_units(i) END AS ordered,
 CASE WHEN independent AND coalesce(i.received_qty,0)>0 THEN greatest(0,private.po_expected_sellable_units(i)-coalesce(i.received_qty,0)) END AS outstanding
 FROM public.po_items i WHERE i.po_id=po ORDER BY i.id LIMIT 25 OFFSET p_page*25)x),'[]'),
 'submissions',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
 SELECT r.id,r.item_id,r.created_at,coalesce(c.employee_name,e.name) AS employee_name,
 c.id IS NOT NULL AS has_snapshot,c.physical_qty AS original_quantity
 FROM private.fulfillment_receipts r LEFT JOIN private.blind_receipt_counts c ON c.id=r.id
 LEFT JOIN public.employees e ON e.id=r.employee_id
 WHERE r.po_id=po ORDER BY r.created_at DESC,r.id LIMIT 25 OFFSET p_page*25)x),'[]'),
 'putaway',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
 SELECT j.id,coalesce(nullif(j.job_number,''),j.order_ref,j.id::text) AS reference,j.status,
 coalesce((SELECT sum((l->>'expectedQty')::numeric) FROM jsonb_array_elements(j.line_items) l),0) AS quantity,
 (SELECT e.name FROM public.employees e WHERE e.id::text=coalesce(j.completed_by,j.assigned_to) LIMIT 1) AS employee_name
 FROM public.wms_jobs j WHERE j.site_id=p_site AND j.country_code=p_country AND j.type='PUTAWAY'
 AND (j.order_ref=po::text OR j.order_ref=p.po_number)
 ORDER BY j.created_at DESC,j.id LIMIT 25 OFFSET p_page*25)x),'[]')) INTO result
 FROM public.purchase_orders p WHERE p.id=po AND p.site_id=p_site AND p.country_code=p_country;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION private.operations_review_rows(p_site uuid,p_country text)
RETURNS TABLE(source text,id uuid,operation text,reference text,status text,handler text,occurred_at timestamptz,exception boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT 'receipt',r.id,'RECEIVE',coalesce(r.po_number,r.sku,r.product_name),
 CASE WHEN private.blind_receipt_needs_review(r.id) THEN 'Pending review' ELSE 'Recorded' END,
 r.employee_name,r.created_at,private.blind_receipt_needs_review(r.id)
 FROM private.blind_receipt_counts r WHERE r.site_id=p_site AND r.country_code=p_country
 UNION ALL
 SELECT 'job',j.id,CASE WHEN j.type IN('DRIVER','DELIVERY') THEN 'DISPATCH' ELSE j.type END,
 coalesce(nullif(j.job_number,''),j.order_ref,left(j.id::text,8)),CASE WHEN j.type='RECEIVE' AND private.receiving_review_partial(j.id,p_site,p_country) THEN 'Partially Received' ELSE j.status END,
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
COMMIT;
