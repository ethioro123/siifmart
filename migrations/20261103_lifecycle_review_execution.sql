BEGIN;
CREATE FUNCTION public.decide_record_lifecycle(p_request_id uuid,p_approve boolean,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; r public.record_lifecycle_requests%ROWTYPE; target jsonb;
  allowed boolean:=false; new_status text; employee_name text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active' FOR SHARE;
 IF actor.id IS NULL OR p_approve IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200 THEN
   RAISE EXCEPTION 'Active independent reviewer and a reason of 10–1200 characters required'; END IF;
 SELECT * INTO r FROM public.record_lifecycle_requests WHERE id=p_request_id FOR UPDATE;
 IF r.id IS NULL OR r.status NOT IN ('Pending','Operations cleared','Finance cleared') THEN RAISE EXCEPTION 'Request is unavailable or already decided'; END IF;
 IF actor.id IN (r.requested_by,coalesce(r.operations_reviewer,r.requested_by),coalesce(r.finance_reviewer,r.requested_by))
   OR (r.kind='employee' AND actor.id=r.target_id) THEN RAISE EXCEPTION 'An independent reviewer is required'; END IF;
 target:=private.lifecycle_target(r.kind,r.target_id);
 IF p_approve AND (target->'state' IS DISTINCT FROM r.original_state OR (target->>'site_id')::uuid<>r.site_id) THEN
   RAISE EXCEPTION 'The record changed; reject the old request and submit a fresh review'; END IF;
 IF r.kind='employee' THEN
   allowed:=actor.role IN ('regional_hr_manager','country_hr_director','group_chro')
     AND private.lifecycle_rank(actor.role)>private.lifecycle_rank(r.original_state->>'role');
 ELSIF r.kind='site' THEN
   allowed:=CASE r.status WHEN 'Pending' THEN actor.role='country_operations_director'
     WHEN 'Operations cleared' THEN actor.role='country_finance_director'
     WHEN 'Finance cleared' THEN actor.role='country_managing_director' ELSE false END;
 ELSIF r.kind='purchase_order' THEN
   allowed:=actor.role IN ('regional_procurement_manager','country_commercial_director','group_cco')
     AND coalesce(r.original_state->>'created_by','') NOT IN (actor.name,actor.id::text)
     AND coalesce(r.original_state->>'requested_by','') NOT IN (actor.name,actor.id::text);
 ELSE
   allowed:=actor.role IN ('store_manager','warehouse_manager','regional_operations_manager','regional_logistics_manager',
     'regional_supply_chain_manager','country_operations_director','country_supply_chain_director','group_csco')
     AND coalesce(r.original_state->>'requested_by','') NOT IN (actor.name,actor.id::text);
 END IF;
 IF NOT coalesce(allowed,false) THEN RAISE EXCEPTION 'This decision requires the designated department reviewer' USING ERRCODE='42501'; END IF;
 IF NOT p_approve THEN new_status:='Rejected';
 ELSIF r.kind='site' AND r.status='Pending' THEN new_status:='Operations cleared';
 ELSIF r.kind='site' AND r.status='Operations cleared' THEN new_status:='Finance cleared';
 ELSE new_status:='Applied'; END IF;
 IF new_status='Applied' THEN
   IF r.kind='employee' THEN
     IF (r.evidence->>'effective_date')::date>current_date THEN RAISE EXCEPTION 'The effective date has not arrived'; END IF;
     IF NOT (coalesce((r.evidence->>'assets_returned')::boolean,false)
       AND coalesce((r.evidence->>'pos_access_revoked')::boolean,false)
       AND coalesce((r.evidence->>'wms_badge_deactivated')::boolean,false)
       AND coalesce((r.evidence->>'keys_surrendered')::boolean,false)
       AND coalesce((r.evidence->>'cash_drawer_reconciled')::boolean,false)) THEN
       RAISE EXCEPTION 'Complete the offboarding handover evidence before approval'; END IF;
     IF EXISTS(SELECT 1 FROM public.sites WHERE area_manager_id=r.target_id OR warehouse_manager_id=r.target_id) THEN
       RAISE EXCEPTION 'Reassign facility leadership before offboarding'; END IF;
     IF EXISTS(SELECT 1 FROM public.shifts WHERE cashier_id=r.target_id AND status='Open') THEN
       RAISE EXCEPTION 'Reconcile and close the employee cash drawer first'; END IF;
     SELECT name INTO employee_name FROM public.employees WHERE id=r.target_id;
     IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE assigned_to IN (r.target_id::text,employee_name)
       AND status NOT IN ('Completed','Cancelled')) THEN RAISE EXCEPTION 'Reassign or complete the employee warehouse jobs first'; END IF;
   ELSIF r.kind='site' THEN
     IF EXISTS(SELECT 1 FROM public.products WHERE site_id=r.target_id AND coalesce(stock,0)<>0)
       OR EXISTS(SELECT 1 FROM public.employees WHERE site_id=r.target_id AND status<>'Terminated')
       OR EXISTS(SELECT 1 FROM public.shifts WHERE site_id=r.target_id AND status='Open')
       OR EXISTS(SELECT 1 FROM public.wms_jobs WHERE (site_id=r.target_id OR source_site_id=r.target_id OR dest_site_id=r.target_id) AND status NOT IN ('Completed','Cancelled'))
       OR EXISTS(SELECT 1 FROM public.purchase_orders WHERE site_id=r.target_id AND status NOT IN ('Received','Cancelled','Rejected'))
       OR EXISTS(SELECT 1 FROM public.transfers WHERE (source_site_id=r.target_id OR dest_site_id=r.target_id) AND status NOT IN ('Completed','Rejected'))
       OR EXISTS(SELECT 1 FROM public.expenses WHERE site_id=r.target_id AND status IN ('Pending','Approved'))
       OR EXISTS(SELECT 1 FROM public.vendor_invoices WHERE site_id=r.target_id::text AND status NOT IN ('Paid','Voided'))
       OR EXISTS(SELECT 1 FROM public.ar_invoices WHERE site_id=r.target_id::text AND (coalesce(balance_due,0)<>0 OR status NOT IN ('Paid','Voided'))) THEN
       RAISE EXCEPTION 'Resolve facility stock, staff, tills, jobs, orders, transfers and unpaid expenses before closure'; END IF;
   ELSIF r.kind='purchase_order' THEN
     IF EXISTS(SELECT 1 FROM public.vendor_invoices WHERE po_id=r.target_id AND status<>'Voided')
       OR EXISTS(SELECT 1 FROM public.po_items WHERE po_id=r.target_id AND coalesce(received_qty,0)<>0)
       OR EXISTS(SELECT 1 FROM public.wms_jobs WHERE order_ref=r.target_id::text AND status<>'Cancelled') THEN
       RAISE EXCEPTION 'An order with receiving or warehouse evidence requires a reversal'; END IF;
   ELSE
     IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE order_ref IN (r.target_id::text,(SELECT order_ref FROM public.transfers WHERE id=r.target_id)) AND status<>'Cancelled') THEN
       RAISE EXCEPTION 'Resolve linked warehouse work through the transfer workflow first'; END IF;
   END IF;
 END IF;
 UPDATE public.record_lifecycle_requests SET status=new_status,
   operations_reviewer=CASE WHEN new_status='Operations cleared' THEN actor.id ELSE operations_reviewer END,
   finance_reviewer=CASE WHEN new_status='Finance cleared' THEN actor.id ELSE finance_reviewer END,
   reviewed_by=actor.id,reviewed_at=now(),decision_reason=btrim(p_reason),
   applied_at=CASE WHEN new_status='Applied' THEN transaction_timestamp() ELSE NULL END
 WHERE id=r.id;
 IF new_status='Applied' THEN
   PERFORM set_config('siifmart.lifecycle_request',r.id::text,true);
   CASE r.kind
   WHEN 'employee' THEN
     UPDATE public.employees SET status='Terminated' WHERE id=r.target_id;
     DELETE FROM auth.sessions WHERE user_id=r.target_id;
   WHEN 'site' THEN UPDATE public.sites SET status='Closed' WHERE id=r.target_id;
   WHEN 'purchase_order' THEN UPDATE public.purchase_orders SET status='Cancelled' WHERE id=r.target_id;
   WHEN 'transfer' THEN UPDATE public.transfers SET status='Rejected',transfer_status='Cancelled' WHERE id=r.target_id;
   END CASE;
   PERFORM set_config('siifmart.lifecycle_request','',true);
 END IF;
 INSERT INTO public.record_lifecycle_events(request_id,actor_id,actor_name,actor_role,action,reason,before_state,after_state)
 VALUES(r.id,actor.id,actor.name,actor.role,new_status,btrim(p_reason),r.original_state,
   CASE WHEN new_status='Applied' THEN private.lifecycle_target(r.kind,r.target_id)->'state' ELSE r.original_state END);
 RETURN jsonb_build_object('request_id',r.id,'status',new_status);
END;
$$;
REVOKE ALL ON FUNCTION public.decide_record_lifecycle(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_record_lifecycle(uuid,boolean,text) TO authenticated;

CREATE FUNCTION private.guard_reviewed_lifecycle_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_kind text; needs_review boolean:=false;
BEGIN
 v_kind:=CASE TG_TABLE_NAME WHEN 'employees' THEN 'employee' WHEN 'sites' THEN 'site'
   WHEN 'purchase_orders' THEN 'purchase_order' ELSE 'transfer' END;
 IF (v_kind='employee' AND OLD.status='Terminated' AND NEW.status IS DISTINCT FROM OLD.status)
   OR (v_kind='site' AND OLD.status='Closed' AND NEW.status IS DISTINCT FROM OLD.status) THEN
   RAISE EXCEPTION 'Reinstatement or reopening requires a separate reviewed workflow' USING ERRCODE='42501'; END IF;
 needs_review:=CASE v_kind WHEN 'employee' THEN NEW.status='Terminated' AND OLD.status IS DISTINCT FROM NEW.status
 WHEN 'site' THEN NEW.status='Closed' AND OLD.status IS DISTINCT FROM NEW.status
 WHEN 'purchase_order' THEN NEW.status='Cancelled' AND OLD.status IS DISTINCT FROM NEW.status
 ELSE (NEW.status='Rejected' AND OLD.status IS DISTINCT FROM NEW.status)
   OR (to_jsonb(NEW)->>'transfer_status'='Cancelled' AND to_jsonb(OLD)->>'transfer_status' IS DISTINCT FROM to_jsonb(NEW)->>'transfer_status') END;
 IF needs_review AND NOT EXISTS(SELECT 1 FROM public.record_lifecycle_requests r
   WHERE r.id::text=current_setting('siifmart.lifecycle_request',true) AND r.kind=v_kind AND r.target_id=NEW.id
     AND r.status='Applied' AND r.reviewed_by=auth.uid() AND r.applied_at=transaction_timestamp()) THEN
   RAISE EXCEPTION 'Use an independent lifecycle review for this transition' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_reviewed_lifecycle_transition() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['employees','sites','purchase_orders','transfers'] LOOP
 EXECUTE format('CREATE TRIGGER guard_reviewed_lifecycle_transition BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.guard_reviewed_lifecycle_transition()',target);
 END LOOP;
END; $$;
COMMIT;
