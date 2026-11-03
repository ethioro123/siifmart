BEGIN;
CREATE OR REPLACE FUNCTION private.lifecycle_visible(target_site uuid,target_country text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 JOIN public.sites facility ON facility.id=target_site
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,''))='active' AND upper(facility.country)=upper(target_country)
 AND (e.role='group_ceo' OR upper(home.country)=upper(target_country))
 AND (public.is_site_in_my_authorized_scope(target_site::text,target_country)
   OR (e.role IN ('buyer','demand_planner','replenishment_planner') AND facility.type IN ('Warehouse','Distribution Center')
     AND (coalesce(e.region_code,home.region_code)=facility.region_code
       OR (e.scope_level='HQ' AND e.region_code IS NULL AND home.region_code IS NULL)))));
$$;
REVOKE ALL ON FUNCTION private.lifecycle_visible(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.lifecycle_visible(uuid,text) TO authenticated;
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
CREATE OR REPLACE FUNCTION private.guard_procurement_order_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    actor public.employees%ROWTYPE;
    actor_role text;
BEGIN
    IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
    SELECT * INTO actor FROM public.employees
      WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
    actor_role := public.normalize_role(actor.role::text);

    IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
        RAISE EXCEPTION 'Purchase order origin cannot be changed';
    END IF;
    IF OLD.status='Draft' AND NEW.status='Cancelled'
       AND (to_jsonb(NEW)-'status'-'updated_at')=(to_jsonb(OLD)-'status'-'updated_at')
       AND EXISTS(SELECT 1 FROM public.record_lifecycle_requests r WHERE r.id::text=current_setting('siifmart.lifecycle_request',true)
         AND r.kind='purchase_order' AND r.target_id=NEW.id AND r.status='Applied'
         AND r.requested_by=actor.id AND r.reviewed_by=actor.id AND r.applied_at=transaction_timestamp()
         AND r.decision_reason='Unsubmitted draft discarded by its preparer') THEN RETURN NEW; END IF;
    IF actor_role IN ('buyer', 'demand_planner', 'replenishment_planner')
       AND (OLD.status NOT IN ('Draft', 'Pending') OR NEW.status NOT IN ('Draft', 'Pending')) THEN
        RAISE EXCEPTION 'Buying and planning staff may prepare draft purchase orders only';
    END IF;
    IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
        NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
        IS DISTINCT FROM
       (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
        OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved', 'Rejected')) THEN
        IF actor_role NOT IN ('group_ceo', 'country_commercial_director', 'regional_procurement_manager') THEN
            RAISE EXCEPTION 'Purchase order decision requires a procurement lead';
        END IF;
        IF actor_role <> 'group_ceo' AND
           (lower(trim(COALESCE(OLD.created_by, ''))) IN (lower(trim(actor.name)), actor.id::text)
            OR lower(trim(COALESCE(OLD.requested_by, ''))) IN (lower(trim(actor.name)), actor.id::text)) THEN
            RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_procurement_order_decision() FROM PUBLIC, anon, authenticated;

COMMIT;
