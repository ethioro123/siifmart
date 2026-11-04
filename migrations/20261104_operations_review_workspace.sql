BEGIN;
CREATE TABLE private.operations_review_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source text NOT NULL, target_id uuid NOT NULL,
 site_id uuid NOT NULL, country_code text NOT NULL, fingerprint text NOT NULL,
 reviewer_id uuid NOT NULL, reviewer_name text NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1200),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source,target_id,fingerprint,reviewer_id)
);
CREATE INDEX operations_review_notes_target ON private.operations_review_notes(site_id,country_code,source,target_id,created_at DESC);
ALTER TABLE private.operations_review_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.operations_review_notes FROM PUBLIC,anon,authenticated;
CREATE TRIGGER operations_review_notes_immutable BEFORE UPDATE OR DELETE ON private.operations_review_notes FOR EACH ROW EXECUTE FUNCTION private.blind_receipt_append_only();
CREATE FUNCTION private.require_operations_review_scope(p_site uuid,p_country text) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites h ON h.id=e.site_id JOIN public.sites s ON s.id=p_site
 WHERE e.id=auth.uid() AND lower(e.status)='active' AND upper(s.country)=upper(p_country)
 AND (e.role='group_ceo' OR upper(h.country)=upper(p_country))
 AND e.role IN('group_ceo','country_managing_director','country_operations_director','warehouse_manager','store_manager',
 'inventory_manager','regional_operations_manager','regional_supply_chain_manager','picking_supervisor','packing_supervisor',
 'dispatch_supervisor','inventory_control_supervisor','returns_waste_supervisor','warehouse_operations_manager')
 AND public.is_site_in_my_authorized_scope(p_site::text,p_country)) THEN
 RAISE EXCEPTION 'Operations review requires an authorized manager in this facility' USING ERRCODE='42501'; END IF;
END; $$;
CREATE FUNCTION private.operations_review_rows(p_site uuid,p_country text)
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
 coalesce(j.has_discrepancy,false) OR EXISTS(SELECT 1 FROM private.floor_discrepancies d
 LEFT JOIN private.floor_discrepancy_reviews v ON v.discrepancy_id=d.id WHERE d.job_id=j.id AND (d.resolved_at IS NULL OR v.discrepancy_id IS NULL))
 FROM public.wms_jobs j WHERE j.country_code=p_country AND (j.site_id=p_site OR j.source_site_id=p_site OR j.dest_site_id=p_site)
 AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','DRIVER','DELIVERY','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS')
 AND (j.type<>'RECEIVE' OR NOT EXISTS(SELECT 1 FROM private.blind_receipt_counts r WHERE r.po_id::text=j.order_ref AND r.site_id=p_site AND r.country_code=p_country))
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
CREATE FUNCTION private.operations_review_queue(p_site uuid,p_country text,p_operation text,p_mode text,p_offset integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF p_mode IS NULL OR p_mode NOT IN('exceptions','active','history') OR p_offset IS NULL OR p_offset<0 OR p_offset>100000
 OR p_operation IS NULL OR p_operation NOT IN('ALL','RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS') THEN RAISE EXCEPTION 'Valid operation, view and page required'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(q)) FROM (
 SELECT r.source,r.id,r.operation,r.reference,r.status,r.handler,r.occurred_at,r.exception
 FROM private.operations_review_rows(p_site,p_country) r WHERE (p_operation='ALL' OR r.operation=p_operation)
 AND CASE p_mode WHEN 'exceptions' THEN r.exception WHEN 'history' THEN r.status IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded')
 ELSE r.status NOT IN('Completed','Cancelled','Deleted','Received','approved','rejected','completed','Recorded') END
 ORDER BY r.occurred_at DESC,r.source,r.id LIMIT 25 OFFSET p_offset)q),'[]');
END; $$;
CREATE FUNCTION private.operations_review_detail(p_site uuid,p_country text,p_source text,p_id uuid,p_page integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE summary record; j public.wms_jobs%ROWTYPE; inv public.inventory_requests%ROWTYPE; ret public.fulfillment_return_requests%ROWTYPE;
 sess public.wms_count_sessions%ROWTYPE; tr public.transfers%ROWTYPE; fields jsonb:='{}'; lines jsonb:='[]'; reports jsonb:='[]'; fingerprint text; actor public.employees%ROWTYPE;
 can_note boolean:=true; can_credit boolean:=false; independent boolean:=false; state jsonb; result jsonb;
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF p_page IS NULL OR p_page<0 OR p_page>5000 THEN RAISE EXCEPTION 'Valid evidence page required'; END IF;
 SELECT * INTO summary FROM private.operations_review_rows(p_site,p_country) WHERE source=p_source AND id=p_id;
 IF summary.id IS NULL THEN RAISE EXCEPTION 'Operational record unavailable in this scope' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 IF p_source='receipt' THEN
 RETURN jsonb_build_object('summary',to_jsonb(summary),'receipt',private.blind_receipt_detail(p_id),'fields','{}'::jsonb,'lines','[]'::jsonb,'reports','[]'::jsonb,'notes','[]'::jsonb,'can_note',false,'can_credit',false,'fingerprint','receipt');
 ELSIF p_source='job' THEN
 SELECT * INTO STRICT j FROM public.wms_jobs WHERE id=p_id;
 state:=to_jsonb(j); can_note:=coalesce(j.assigned_to,'')<>actor.id::text AND coalesce(j.completed_by,'')<>actor.id::text
 AND NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id=actor.id);
 fields:=jsonb_build_object('order',j.order_ref,'location',j.location,'notes',j.notes,'transferStatus',j.transfer_status);
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',coalesce(l->>'name',l->>'productName'),'sku',l->>'sku',
 'expected',CASE WHEN j.type='RECEIVE' THEN NULL ELSE l->>'expectedQty' END,'counted',coalesce(l->>'packedQty',l->>'receivedQty',l->>'pickedQty'),
 'condition',l->>'condition','batch',l->>'batchNumber','expiry',l->>'expiryDate','location',l->>'location')),'[]') INTO lines
 FROM (SELECT value l FROM jsonb_array_elements(coalesce(j.line_items,'[]')) WITH ORDINALITY a(value,n) ORDER BY n LIMIT 25 OFFSET p_page*25)x;
 IF j.type IN('TRANSFER','DISPATCH','DRIVER','DELIVERY') THEN lines:='[]'; END IF;
 independent:=actor.role IN('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')
 AND NOT EXISTS(SELECT 1 FROM public.wms_jobs s WHERE s.site_id=j.site_id AND s.country_code=j.country_code
 AND (s.id=j.id OR (nullif(j.order_ref,'') IS NOT NULL AND s.order_ref=j.order_ref))
 AND (s.assigned_to=actor.id::text OR s.completed_by=actor.id::text OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=s.id AND a.employee_id=actor.id)));
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO reports FROM (
 SELECT d.id,d.item_index,d.expected_qty,d.first_count,d.recount,d.reason,d.reporter_name,d.reported_at,d.resolution,d.resolved_qty,d.resolution_notes,d.resolver_name,d.resolved_at,
 v.finding,v.notes AS review_notes,v.reviewed_at,
 independent AND d.reporter_id<>actor.id AND d.resolved_at IS NULL AND j.status IN('Pending','In-Progress') AS can_resolve,
 independent AND d.reporter_id<>actor.id AND d.resolved_at IS NOT NULL AND v.discrepancy_id IS NULL AS can_review
 FROM private.floor_discrepancies d LEFT JOIN private.floor_discrepancy_reviews v ON v.discrepancy_id=d.id
 WHERE d.job_id=j.id ORDER BY d.reported_at,d.id LIMIT 25 OFFSET p_page*25)q;
 ELSIF p_source='inventory' THEN
 SELECT * INTO STRICT inv FROM public.inventory_requests WHERE id=p_id;
 state:=to_jsonb(inv);can_note:=inv.requested_by_employee_id IS DISTINCT FROM actor.id AND coalesce(inv.requested_by,'') NOT IN(actor.id::text,actor.name);
 fields:=jsonb_build_object('product',inv.product_name,'sku',inv.product_sku,'quantity',inv.adjustment_qty,'direction',inv.adjustment_type,'reason',inv.adjustment_reason,'decision',inv.rejection_reason);
 ELSIF p_source='return' THEN
 SELECT * INTO STRICT ret FROM public.fulfillment_return_requests WHERE id=p_id;
 state:=to_jsonb(ret);can_note:=ret.requested_by<>actor.id;
 can_credit:=can_note AND ret.status='pending' AND actor.role IN('group_ceo','country_managing_director','country_finance_director','regional_finance_manager','store_manager');
 fields:=jsonb_build_object('order',ret.sale_id,'reason',ret.decision_reason);
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',l->>'name','counted',l->>'quantity','condition',l->>'condition','reason',l->>'reason','action',l->>'action')),'[]') INTO lines
 FROM (SELECT value l FROM jsonb_array_elements(ret.lines) WITH ORDINALITY a(value,n) ORDER BY n LIMIT 25 OFFSET p_page*25)x;
 ELSIF p_source='count' THEN
 SELECT * INTO STRICT sess FROM public.wms_count_sessions WHERE id=p_id;
 state:=to_jsonb(sess);can_note:=sess.created_by<>actor.id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',i.product_name,'sku',i.product_sku,'location',i.location,
 'expected',CASE WHEN sess.status='Completed' AND i.first_counter_id IS DISTINCT FROM actor.id AND i.recount_counter_id IS DISTINCT FROM actor.id THEN i.expected_qty END,
 'counted',coalesce(i.recount_qty,i.first_count_qty),'request',i.inventory_request_id)),'[]') INTO lines
 FROM (SELECT product_name,product_sku,location,expected_qty,first_count_qty,recount_qty,first_counter_id,recount_counter_id,inventory_request_id FROM public.wms_count_items WHERE session_id=sess.id ORDER BY id LIMIT 25 OFFSET p_page*25)i;
 ELSIF p_source='transfer' THEN
 SELECT * INTO STRICT tr FROM public.transfers WHERE id=p_id;
 state:=to_jsonb(tr);can_note:=coalesce(tr.requested_by,'') NOT IN(actor.id::text,actor.name) AND coalesce(tr.received_by,'') NOT IN(actor.id::text,actor.name);
 fields:=jsonb_build_object('order',tr.order_ref,'notes',tr.notes,'reason',tr.discrepancy_details,'decision',tr.discrepancy_resolution_type,'transferStatus',tr.transfer_status);
 -- Transfer quantities remain in the existing handover workflow to preserve blind receiving and driver co-sign.
 ELSE RAISE EXCEPTION 'Unsupported operational source'; END IF;
 fingerprint:=md5(state::text||reports::text);
 SELECT jsonb_build_object('summary',to_jsonb(summary),'fields',fields,'lines',lines,'reports',reports,'fingerprint',fingerprint,'can_note',can_note,'can_credit',can_credit,
 'notes',coalesce((SELECT jsonb_agg(to_jsonb(n)) FROM (SELECT reviewer_name,reason,created_at FROM private.operations_review_notes
 WHERE source=p_source AND target_id=p_id AND site_id=p_site AND country_code=p_country ORDER BY created_at DESC LIMIT 25)n),'[]')) INTO result;
 RETURN result;
END; $$;
CREATE FUNCTION private.record_operations_review(p_site uuid,p_country text,p_source text,p_id uuid,p_fingerprint text,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence jsonb; actor public.employees%ROWTYPE; saved uuid;
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 OR p_source='receipt' THEN RAISE EXCEPTION 'A review reason and supported operation are required'; END IF;
 -- Serialize against the source state used for this observation.
 CASE p_source WHEN 'job' THEN PERFORM 1 FROM public.wms_jobs WHERE id=p_id FOR UPDATE;
 WHEN 'inventory' THEN PERFORM 1 FROM public.inventory_requests WHERE id=p_id FOR UPDATE;
 WHEN 'return' THEN PERFORM 1 FROM public.fulfillment_return_requests WHERE id=p_id FOR UPDATE;
 WHEN 'count' THEN PERFORM 1 FROM public.wms_count_sessions WHERE id=p_id FOR UPDATE;
 WHEN 'transfer' THEN PERFORM 1 FROM public.transfers WHERE id=p_id FOR UPDATE;
 ELSE RAISE EXCEPTION 'Unsupported operational source'; END CASE;
 evidence:=private.operations_review_detail(p_site,p_country,p_source,p_id,0);
 IF NOT coalesce((evidence->>'can_note')::boolean,false) THEN RAISE EXCEPTION 'Independent manager required' USING ERRCODE='42501'; END IF;
 IF evidence->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'Operational evidence changed; refresh before reviewing' USING ERRCODE='40001'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 SELECT id INTO saved FROM private.operations_review_notes WHERE source=p_source AND target_id=p_id AND fingerprint=p_fingerprint AND reviewer_id=actor.id;
 IF saved IS NOT NULL THEN RETURN jsonb_build_object('id',saved,'saved',true); END IF;
 INSERT INTO private.operations_review_notes(source,target_id,site_id,country_code,fingerprint,reviewer_id,reviewer_name,reason)
 VALUES(p_source,p_id,p_site,p_country,p_fingerprint,actor.id,actor.name,btrim(p_reason)) RETURNING id INTO saved;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('OPERATIONS_REVIEW_RECORDED','Fulfillment',actor.id,p_site,p_country,p_source,p_id::text,
 jsonb_build_object('reviewId',saved,'reason',btrim(p_reason),'clearsHold',false)::text);
 RETURN jsonb_build_object('id',saved,'saved',true);
END; $$;
CREATE FUNCTION public.operations_review_queue(p_site uuid,p_country text,p_operation text DEFAULT 'ALL',p_mode text DEFAULT 'exceptions',p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.operations_review_queue(p_site,p_country,p_operation,p_mode,p_offset); $$;
CREATE FUNCTION public.operations_review_detail(p_site uuid,p_country text,p_source text,p_id uuid,p_page integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.operations_review_detail(p_site,p_country,p_source,p_id,p_page); $$;
CREATE FUNCTION public.record_operations_review(p_site uuid,p_country text,p_source text,p_id uuid,p_fingerprint text,p_reason text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.record_operations_review(p_site,p_country,p_source,p_id,p_fingerprint,p_reason); $$;
REVOKE ALL ON FUNCTION private.require_operations_review_scope(uuid,text),private.operations_review_rows(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.operations_review_queue(uuid,text,text,text,integer),private.operations_review_detail(uuid,text,text,uuid,integer),private.record_operations_review(uuid,text,text,uuid,text,text),public.operations_review_queue(uuid,text,text,text,integer),public.operations_review_detail(uuid,text,text,uuid,integer),public.record_operations_review(uuid,text,text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.operations_review_queue(uuid,text,text,text,integer),private.operations_review_detail(uuid,text,text,uuid,integer),private.record_operations_review(uuid,text,text,uuid,text,text),public.operations_review_queue(uuid,text,text,text,integer),public.operations_review_detail(uuid,text,text,uuid,integer),public.record_operations_review(uuid,text,text,uuid,text,text) TO authenticated;
COMMIT;
