BEGIN;
CREATE OR REPLACE FUNCTION public.discard_own_purchase_order_draft(p_po_id uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target jsonb; req uuid; creator text; v_country text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active' FOR SHARE;
 IF actor.id IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200 THEN
   RAISE EXCEPTION 'An active preparer and a discard reason are required'; END IF;
 target:=private.lifecycle_target('purchase_order',p_po_id);
 creator:=coalesce(nullif(target->'state'->>'created_by',''),target->'state'->>'requested_by','');
 v_country:=target->>'country_code';
 IF target->'state'->>'status'<>'Draft' OR NOT (creator=actor.id::text
   OR (creator=actor.name AND (SELECT count(*) FROM public.employees employee JOIN public.sites home ON home.id=employee.site_id
     WHERE employee.name=actor.name AND upper(home.country)=v_country)=1)) THEN
   RAISE EXCEPTION 'Only the preparer may discard an unsubmitted draft; use independent cancellation review otherwise'; END IF;
 IF EXISTS(SELECT 1 FROM public.record_lifecycle_requests WHERE kind='purchase_order' AND target_id=p_po_id AND status IN ('Pending','Operations cleared','Finance cleared')) THEN
   RAISE EXCEPTION 'Withdraw the open cancellation request before discarding this draft'; END IF;
 IF EXISTS(SELECT 1 FROM public.record_lifecycle_holds WHERE kind='purchase_order' AND target_id=p_po_id AND released_at IS NULL) THEN
   RAISE EXCEPTION 'An investigation hold prevents discarding this draft'; END IF;
 IF EXISTS(SELECT 1 FROM public.po_items WHERE po_id=p_po_id AND coalesce(received_qty,0)<>0)
   OR EXISTS(SELECT 1 FROM public.vendor_invoices WHERE po_id=p_po_id AND status<>'Voided')
   OR EXISTS(SELECT 1 FROM public.wms_jobs WHERE order_ref=p_po_id::text AND status<>'Cancelled') THEN
   RAISE EXCEPTION 'A draft with receiving, invoice or warehouse evidence requires reconciliation'; END IF;
 INSERT INTO public.record_lifecycle_requests(kind,target_id,target_label,site_id,country_code,region_code,reason,original_state,
   requested_by,requester_name,requester_role,status,reviewed_by,reviewed_at,decision_reason,applied_at)
 VALUES('purchase_order',p_po_id,target->>'label',(target->>'site_id')::uuid,v_country,target->>'region_code',btrim(p_reason),target->'state',
   actor.id,actor.name,actor.role,'Applied',actor.id,now(),'Unsubmitted draft discarded by its preparer',transaction_timestamp()) RETURNING id INTO req;
 PERFORM set_config('siifmart.lifecycle_request',req::text,true);
 UPDATE public.purchase_orders SET status='Cancelled' WHERE id=p_po_id;
 PERFORM set_config('siifmart.lifecycle_request','',true);
 INSERT INTO public.record_lifecycle_events(request_id,actor_id,actor_name,actor_role,action,reason,before_state,after_state)
 VALUES(req,actor.id,actor.name,actor.role,'Draft discarded',btrim(p_reason),target->'state',private.lifecycle_target('purchase_order',p_po_id)->'state');
 RETURN jsonb_build_object('request_id',req,'po_id',p_po_id,'status','Cancelled');
END;
$$;
REVOKE ALL ON FUNCTION public.discard_own_purchase_order_draft(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.discard_own_purchase_order_draft(uuid,text) TO authenticated;
COMMIT;
