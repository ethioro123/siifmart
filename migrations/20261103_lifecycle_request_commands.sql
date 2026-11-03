BEGIN;
CREATE FUNCTION private.lifecycle_target(kind text,target uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE; s public.sites%ROWTYPE; p public.purchase_orders%ROWTYPE;
 t public.transfers%ROWTYPE; state jsonb; label text;
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
 WHEN 'transfer' THEN
   SELECT * INTO STRICT t FROM public.transfers WHERE id=target FOR UPDATE;
   SELECT * INTO STRICT s FROM public.sites WHERE id=t.source_site_id FOR SHARE;
   IF upper(t.country_code) IS DISTINCT FROM upper(s.country)
     OR NOT private.lifecycle_visible(t.dest_site_id,t.country_code) THEN RAISE EXCEPTION 'Transfer endpoints are outside scope'; END IF;
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

CREATE FUNCTION public.request_record_lifecycle(p_kind text,p_target_id uuid,p_reason text,p_evidence jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target jsonb; result uuid; target_rank integer;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active' FOR SHARE;
 IF actor.id IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200
   OR coalesce(jsonb_typeof(p_evidence),'null')<>'object' OR octet_length(p_evidence::text)>6000 THEN
   RAISE EXCEPTION 'Active employee and a reason of 10–1200 characters required';
 END IF;
 IF p_kind<>'employee' AND p_evidence<>'{}'::jsonb THEN RAISE EXCEPTION 'This lifecycle action does not accept additional evidence fields'; END IF;
 target:=private.lifecycle_target(p_kind,p_target_id);
 IF p_kind='employee' THEN
   target_rank:=private.lifecycle_rank(target->'state'->>'role');
   IF actor.id=p_target_id OR private.lifecycle_rank(actor.role)<=target_rank THEN
     RAISE EXCEPTION 'Offboarding requests require a more senior independent manager'; END IF;
   IF target->'state'->>'status'='Terminated' THEN RAISE EXCEPTION 'Employee is already terminated'; END IF;
   IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_evidence) key WHERE key NOT IN ('reason_code','effective_date','assets_returned','pos_access_revoked','wms_badge_deactivated','keys_surrendered','cash_drawer_reconciled','reconciliation_notes')) THEN
     RAISE EXCEPTION 'Unexpected offboarding evidence field'; END IF;
   PERFORM (p_evidence->>'effective_date')::date;
   IF coalesce(p_evidence->>'reason_code','') NOT IN ('gross_misconduct','job_abandonment','voluntary_resignation','performance_incompetence','contract_expiration','redundancy_downsizing','medical_incapacity')
     OR nullif(p_evidence->>'effective_date','') IS NULL THEN RAISE EXCEPTION 'Offboarding reason and effective date required'; END IF;
 ELSIF p_kind='site' THEN
   IF actor.role NOT IN ('group_ceo','country_managing_director','country_operations_director','regional_operations_manager')
     OR target->'state'->>'type' IN ('Administration','Administrative','HQ','Headquarters','Central Operations')
     OR target->'state'->>'status'='Closed' THEN RAISE EXCEPTION 'Only operations leadership may request closure of an operating facility'; END IF;
 ELSIF p_kind='purchase_order' THEN
   IF target->'state'->>'status' NOT IN ('Draft','Pending') THEN RAISE EXCEPTION 'Orders with approval or execution require a reversal workflow'; END IF;
   IF private.lifecycle_rank(actor.role)=0 AND NOT(actor.role IN ('buyer','demand_planner','replenishment_planner')
      AND (coalesce(target->'state'->>'created_by','') IN (actor.name,actor.id::text) OR coalesce(target->'state'->>'requested_by','') IN (actor.name,actor.id::text))) THEN
     RAISE EXCEPTION 'Only the preparer or an authorized manager may request cancellation'; END IF;
 ELSIF p_kind='transfer' THEN
   IF target->'state'->>'status' NOT IN ('Requested','Rejected') OR target->'state'->>'shipped_at' IS NOT NULL
     OR target->'state'->>'dispatched_at' IS NOT NULL OR target->'state'->>'received_at' IS NOT NULL
     OR target->'state'->>'approved_at' IS NOT NULL THEN RAISE EXCEPTION 'Dispatched or approved transfers require a return or reconciliation'; END IF;
   IF private.lifecycle_rank(actor.role)=0 AND coalesce(target->'state'->>'requested_by','') NOT IN (actor.name,actor.id::text) THEN
     RAISE EXCEPTION 'Only the requester or an authorized manager may request cancellation'; END IF;
 END IF;
 INSERT INTO public.record_lifecycle_requests(kind,target_id,target_label,site_id,country_code,region_code,reason,evidence,original_state,
   requested_by,requester_name,requester_role)
 VALUES(p_kind,p_target_id,target->>'label',(target->>'site_id')::uuid,target->>'country_code',target->>'region_code',btrim(p_reason),p_evidence,target->'state',actor.id,actor.name,actor.role)
 RETURNING id INTO result;
 INSERT INTO public.record_lifecycle_events(request_id,actor_id,actor_name,actor_role,action,reason,before_state,after_state)
 VALUES(result,actor.id,actor.name,actor.role,'Requested',btrim(p_reason),target->'state',target->'state');
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.request_record_lifecycle(text,uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_record_lifecycle(text,uuid,text,jsonb) TO authenticated;
COMMIT;
