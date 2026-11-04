-- Use the inherited PO job number for legacy putaway jobs without a stored number.
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
 SELECT j.id,coalesce(nullif(j.job_number,''),p.po_number,j.order_ref,j.id::text) AS reference,j.status,
 coalesce((SELECT sum((l->>'expectedQty')::numeric) FROM jsonb_array_elements(j.line_items) l),0) AS quantity,
 (SELECT e.name FROM public.employees e WHERE e.id::text=coalesce(j.completed_by,j.assigned_to) LIMIT 1) AS employee_name
 FROM public.wms_jobs j WHERE j.site_id=p_site AND j.country_code=p_country AND j.type='PUTAWAY'
 AND (j.order_ref=po::text OR j.order_ref=p.po_number)
 ORDER BY j.created_at DESC,j.id LIMIT 25 OFFSET p_page*25)x),'[]')) INTO result
 FROM public.purchase_orders p WHERE p.id=po AND p.site_id=p_site AND p.country_code=p_country;
 RETURN result;
END; $$;
COMMIT;
