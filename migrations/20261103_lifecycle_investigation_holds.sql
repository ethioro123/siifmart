BEGIN;
CREATE FUNCTION private.lifecycle_current_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT role::text FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active';
$$;
REVOKE ALL ON FUNCTION private.lifecycle_current_role() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.lifecycle_current_role() TO authenticated;
DROP POLICY lifecycle_requests_read ON public.record_lifecycle_requests;
CREATE POLICY lifecycle_requests_read ON public.record_lifecycle_requests FOR SELECT TO authenticated
 USING(private.lifecycle_visible(site_id,country_code) AND (requested_by=auth.uid() OR private.lifecycle_rank(private.lifecycle_current_role())>0));
CREATE TABLE public.record_lifecycle_holds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('employee','site','purchase_order','transfer','warehouse_job')),
 target_id uuid NOT NULL, site_id uuid NOT NULL REFERENCES public.sites(id), country_code text NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1200),
 placed_by uuid NOT NULL REFERENCES public.employees(id), placed_by_name text NOT NULL, placed_by_role text NOT NULL,
 placed_at timestamptz NOT NULL DEFAULT now(), released_by uuid REFERENCES public.employees(id),
 released_by_name text, released_by_role text, released_at timestamptz, release_reason text,
 CHECK((released_at IS NULL AND released_by IS NULL AND release_reason IS NULL)
   OR (released_at IS NOT NULL AND released_by IS NOT NULL AND released_by<>placed_by AND length(btrim(release_reason)) BETWEEN 10 AND 1200))
);
CREATE UNIQUE INDEX lifecycle_one_active_hold ON public.record_lifecycle_holds(kind,target_id) WHERE released_at IS NULL;
CREATE INDEX lifecycle_hold_history ON public.record_lifecycle_holds(kind,target_id,placed_at DESC);
ALTER TABLE public.record_lifecycle_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.record_lifecycle_holds FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.record_lifecycle_holds TO authenticated;
CREATE POLICY lifecycle_holds_read ON public.record_lifecycle_holds FOR SELECT TO authenticated
 USING(private.lifecycle_visible(site_id,country_code) AND
 (private.lifecycle_rank(private.lifecycle_current_role())>0 OR private.lifecycle_current_role() IN ('auditor','country_compliance_manager')));
CREATE TRIGGER preserve_lifecycle_hold BEFORE DELETE ON public.record_lifecycle_holds
 FOR EACH ROW EXECUTE FUNCTION private.lifecycle_immutable_event();
CREATE FUNCTION public.set_record_lifecycle_hold(p_kind text,p_target_id uuid,p_reason text,p_release boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target jsonb; hold public.record_lifecycle_holds%ROWTYPE; result uuid;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active' FOR SHARE;
 IF actor.id IS NULL OR actor.role NOT IN ('country_compliance_manager','regional_compliance_manager','group_clco','group_cae','auditor')
   OR p_release IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200 THEN
   RAISE EXCEPTION 'An authorized compliance reviewer and a reason of 10–1200 characters are required'; END IF;
 target:=private.lifecycle_target(p_kind,p_target_id);
 IF p_release THEN
   SELECT * INTO hold FROM public.record_lifecycle_holds WHERE kind=p_kind AND target_id=p_target_id AND released_at IS NULL FOR UPDATE;
   IF hold.id IS NULL OR hold.placed_by=actor.id THEN RAISE EXCEPTION 'A different compliance reviewer must release an active hold'; END IF;
   UPDATE public.record_lifecycle_holds SET released_by=actor.id,released_by_name=actor.name,released_by_role=actor.role,
     released_at=now(),release_reason=btrim(p_reason) WHERE id=hold.id RETURNING id INTO result;
 ELSE
   INSERT INTO public.record_lifecycle_holds(kind,target_id,site_id,country_code,reason,placed_by,placed_by_name,placed_by_role)
   VALUES(p_kind,p_target_id,(target->>'site_id')::uuid,target->>'country_code',btrim(p_reason),actor.id,actor.name,actor.role)
   RETURNING id INTO result;
 END IF;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.set_record_lifecycle_hold(text,uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_record_lifecycle_hold(text,uuid,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.decide_record_lifecycle(p_request_id uuid,p_approve boolean,p_reason text)
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
   IF EXISTS(SELECT 1 FROM public.record_lifecycle_holds WHERE kind=r.kind AND target_id=r.target_id AND released_at IS NULL) THEN
     RAISE EXCEPTION 'This record has an active investigation hold; independent compliance release is required'; END IF;
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
   ELSIF r.kind='warehouse_job' THEN
     IF EXISTS(SELECT 1 FROM public.wms_jobs child WHERE child.order_ref IN (r.target_id::text,(SELECT job_number FROM public.wms_jobs WHERE id=r.target_id)) AND child.id<>r.target_id AND child.status<>'Cancelled')
       OR EXISTS(SELECT 1 FROM public.transfers tr WHERE tr.order_ref IN (r.target_id::text,(SELECT job_number FROM public.wms_jobs WHERE id=r.target_id)))
       OR EXISTS(SELECT 1 FROM public.wms_jobs job, jsonb_array_elements(coalesce(job.line_items,'[]'::jsonb)) item
         WHERE job.id=r.target_id AND (coalesce((item->>'pickedQty')::numeric,0)<>0 OR coalesce((item->>'receivedQty')::numeric,0)<>0
           OR coalesce((item->>'picked_qty')::numeric,0)<>0 OR coalesce((item->>'received_qty')::numeric,0)<>0)) THEN
       RAISE EXCEPTION 'Warehouse drafts with child work, transfer records or physical evidence require reconciliation'; END IF;
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
   WHEN 'warehouse_job' THEN UPDATE public.wms_jobs SET status='Cancelled',transfer_status=CASE WHEN type='TRANSFER' THEN 'Cancelled' ELSE transfer_status END WHERE id=r.target_id;
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


COMMIT;
