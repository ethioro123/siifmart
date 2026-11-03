-- Immutable intake evidence and independent review, scoped to one facility and country.
BEGIN;
CREATE TABLE private.blind_receipt_counts (
 id uuid PRIMARY KEY REFERENCES private.fulfillment_receipts(id),
 po_id uuid NOT NULL, item_id uuid NOT NULL, site_id uuid NOT NULL, country_code text NOT NULL,
 po_number text, product_name text, sku text, employee_id uuid NOT NULL, employee_name text NOT NULL,
 expected_qty numeric NOT NULL, previous_qty numeric NOT NULL, physical_qty numeric NOT NULL,
 lines jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blind_receipt_counts_scope ON private.blind_receipt_counts(site_id,country_code,created_at DESC,id);
CREATE TABLE private.blind_receipt_corrections (
 id uuid PRIMARY KEY, receipt_id uuid NOT NULL REFERENCES private.blind_receipt_counts(id),
 job_id uuid NOT NULL, quantity numeric NOT NULL CHECK(quantity>0 AND quantity<1000000000),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1200),
 requested_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blind_receipt_corrections_receipt ON private.blind_receipt_corrections(receipt_id);
CREATE TABLE private.blind_receipt_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), receipt_id uuid NOT NULL REFERENCES private.blind_receipt_counts(id),
 correction_id uuid UNIQUE REFERENCES private.blind_receipt_corrections(id),
 approve boolean NOT NULL, reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 1200),
 reviewer_id uuid NOT NULL, reviewer_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX blind_receipt_single_review ON private.blind_receipt_decisions(receipt_id) WHERE correction_id IS NULL;
ALTER TABLE private.blind_receipt_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.blind_receipt_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.blind_receipt_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.blind_receipt_counts,private.blind_receipt_corrections,private.blind_receipt_decisions FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.blind_receipt_append_only() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Submitted receipt evidence is append-only'; END; $$;
CREATE TRIGGER blind_receipt_counts_immutable BEFORE UPDATE OR DELETE ON private.blind_receipt_counts FOR EACH ROW EXECUTE FUNCTION private.blind_receipt_append_only();
CREATE TRIGGER blind_receipt_corrections_immutable BEFORE UPDATE OR DELETE ON private.blind_receipt_corrections FOR EACH ROW EXECUTE FUNCTION private.blind_receipt_append_only();
CREATE TRIGGER blind_receipt_decisions_immutable BEFORE UPDATE OR DELETE ON private.blind_receipt_decisions FOR EACH ROW EXECUTE FUNCTION private.blind_receipt_append_only();
CREATE FUNCTION private.capture_blind_receipt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE po public.purchase_orders%ROWTYPE; item public.po_items%ROWTYPE; saved_lines jsonb; qty numeric; mode text;
BEGIN
 SELECT country_configs->p.country_code->>'receivingLogic' INTO mode FROM public.system_config c
 CROSS JOIN public.purchase_orders p WHERE p.id=NEW.po_id LIMIT 1;
 IF mode='verified' THEN RETURN NEW; END IF;
 SELECT * INTO STRICT po FROM public.purchase_orders WHERE id=NEW.po_id;
 SELECT * INTO STRICT item FROM public.po_items WHERE id=NEW.item_id AND po_id=po.id;
 SELECT jsonb_agg(jsonb_build_object('jobId',j.id,'quantity',(l->>'expectedQty')::numeric,
   'condition',coalesce(l->>'condition','Good'),'batch',l->>'batchNumber','expiry',l->>'expiryDate') ORDER BY j.id),
   sum((l->>'expectedQty')::numeric) INTO saved_lines,qty
 FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items) l WHERE j.id=ANY(NEW.job_ids);
 IF qty IS NULL OR qty<=0 THEN RAISE EXCEPTION 'Physical receipt evidence is required'; END IF;
 INSERT INTO private.blind_receipt_counts(id,po_id,item_id,site_id,country_code,po_number,product_name,sku,
 employee_id,employee_name,expected_qty,previous_qty,physical_qty,lines)
 SELECT NEW.id,po.id,item.id,po.site_id,po.country_code,po.po_number,item.product_name,item.sku,
 NEW.employee_id,e.name,private.po_expected_sellable_units(item),item.received_qty-qty,qty,saved_lines
 FROM public.employees e WHERE e.id=NEW.employee_id;
 RETURN NEW;
END; $$;
CREATE TRIGGER capture_blind_receipt AFTER INSERT ON private.fulfillment_receipts FOR EACH ROW EXECUTE FUNCTION private.capture_blind_receipt();
CREATE FUNCTION private.blind_receipt_manager(p_site uuid,p_country text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 JOIN public.sites target ON target.id=p_site WHERE e.id=auth.uid() AND lower(e.status)='active'
 AND e.role IN('warehouse_manager','store_manager','inventory_manager','regional_operations_manager',
 'regional_supply_chain_manager','country_operations_director','country_managing_director','group_ceo')
 AND upper(target.country)=upper(p_country) AND (e.role='group_ceo' OR upper(home.country)=upper(p_country))
 AND public.is_site_in_my_authorized_scope(p_site::text,p_country));
$$;
CREATE FUNCTION private.blind_receipt_scope(p_site uuid,p_country text) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 JOIN public.sites target ON target.id=p_site WHERE e.id=auth.uid() AND lower(e.status)='active'
 AND upper(target.country)=upper(p_country) AND (e.role='group_ceo' OR upper(home.country)=upper(p_country))
 AND (e.site_id=p_site OR private.blind_receipt_manager(p_site,p_country))
 AND public.is_site_in_my_authorized_scope(p_site::text,p_country)) THEN
 RAISE EXCEPTION 'Receipt review is outside your authorized facility' USING ERRCODE='42501'; END IF;
END; $$;
-- List headers only; count comparisons and lots are fetched for one submitted receipt.
CREATE FUNCTION private.blind_receipt_queue(p_site uuid,p_country text,p_before timestamptz,p_before_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM private.blind_receipt_scope(p_site,p_country);
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM (
 SELECT r.id,r.po_number,r.product_name,r.sku,r.employee_name,r.physical_qty,r.created_at,
 EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND correction_id IS NULL) AS reviewed
 FROM private.blind_receipt_counts r WHERE r.site_id=p_site AND r.country_code=p_country
 AND (r.employee_id=auth.uid() OR private.blind_receipt_manager(p_site,p_country))
 AND (p_before IS NULL OR (r.created_at,r.id)<(p_before,p_before_id))
 ORDER BY r.created_at DESC,r.id DESC LIMIT 25)q;
 RETURN result;
END; $$;
CREATE FUNCTION private.blind_receipt_detail(p_receipt uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; result jsonb; manager boolean;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 manager:=private.blind_receipt_manager(r.site_id,r.country_code) AND r.employee_id<>auth.uid();
 IF NOT manager AND r.employee_id<>auth.uid() THEN RAISE EXCEPTION 'Independent receipt reviewer required' USING ERRCODE='42501'; END IF;
 result:=to_jsonb(r)-'expected_qty'-'previous_qty';
 IF manager THEN result:=result||jsonb_build_object('expected_qty',r.expected_qty,'previous_qty',r.previous_qty); END IF;
 RETURN result||jsonb_build_object('can_review',manager,'can_correct',r.employee_id=auth.uid(),
 'corrections',(SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.created_at),'[]') FROM private.blind_receipt_corrections c WHERE receipt_id=r.id),
 'decisions',(SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.created_at),'[]') FROM private.blind_receipt_decisions d WHERE receipt_id=r.id));
END; $$;
CREATE FUNCTION private.request_blind_receipt_correction(p_request uuid,p_receipt uuid,p_job uuid,p_quantity numeric,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; j public.wms_jobs%ROWTYPE; existing private.blind_receipt_corrections%ROWTYPE;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 IF r.employee_id<>auth.uid() THEN RAISE EXCEPTION 'Only the original counter may request a correction' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.purchase_orders WHERE id=r.po_id FOR UPDATE;
 SELECT * INTO existing FROM private.blind_receipt_corrections WHERE id=p_request;
 IF existing.id IS NOT NULL THEN
 IF (existing.receipt_id,existing.job_id,existing.quantity,existing.reason,existing.requested_by)
 IS DISTINCT FROM (r.id,p_job,p_quantity,btrim(p_reason),auth.uid()) THEN RAISE EXCEPTION 'Correction retry differs from original'; END IF;
 RETURN jsonb_build_object('id',existing.id,'saved',true); END IF;
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job FOR UPDATE;
 IF p_request IS NULL OR p_quantity IS NULL OR p_quantity::text IN('NaN','Infinity','-Infinity') OR p_quantity<=0 OR p_quantity>=1000000000
 OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200
 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r.lines) l WHERE l->>'jobId'=p_job::text)
 OR j.status<>'Pending' OR j.assigned_to IS NOT NULL OR EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=p_job)
 THEN RAISE EXCEPTION 'Correction requires a reason and an unstarted putaway; use inventory adjustment after handling begins'; END IF;
 IF EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id)) THEN
 RAISE EXCEPTION 'This receipt already has a pending correction'; END IF;
 INSERT INTO private.blind_receipt_corrections VALUES(p_request,r.id,p_job,p_quantity,btrim(p_reason),auth.uid(),now());
 RETURN jsonb_build_object('id',p_request,'saved',true);
END; $$;
CREATE FUNCTION private.decide_blind_receipt(p_receipt uuid,p_correction uuid,p_approve boolean,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; c private.blind_receipt_corrections%ROWTYPE; d private.blind_receipt_decisions%ROWTYPE;
 j public.wms_jobs%ROWTYPE; item public.po_items%ROWTYPE; actor public.employees%ROWTYPE; delta numeric; tolerance numeric;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 IF NOT private.blind_receipt_manager(r.site_id,r.country_code) OR actor.id=r.employee_id THEN
 RAISE EXCEPTION 'Independent manager required' USING ERRCODE='42501'; END IF;
 IF p_approve IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 THEN RAISE EXCEPTION 'A decision reason is required'; END IF;
 PERFORM 1 FROM public.purchase_orders WHERE id=r.po_id FOR UPDATE;
 SELECT * INTO item FROM public.po_items WHERE id=r.item_id FOR UPDATE;
 SELECT * INTO d FROM private.blind_receipt_decisions WHERE receipt_id=r.id AND correction_id IS NOT DISTINCT FROM p_correction;
 IF d.id IS NOT NULL THEN
 IF (d.approve,d.reason,d.reviewer_id) IS DISTINCT FROM (p_approve,btrim(p_reason),actor.id) THEN RAISE EXCEPTION 'Review cannot be overwritten'; END IF;
 RETURN jsonb_build_object('id',d.id,'saved',true); END IF;
 IF p_correction IS NOT NULL THEN
 SELECT * INTO c FROM private.blind_receipt_corrections WHERE id=p_correction AND receipt_id=r.id;
 IF c.id IS NULL OR c.requested_by=actor.id THEN RAISE EXCEPTION 'Independent correction review required'; END IF;
 IF p_approve THEN
 SELECT * INTO j FROM public.wms_jobs WHERE id=c.job_id FOR UPDATE;
 IF j.status<>'Pending' OR j.assigned_to IS NOT NULL OR EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=j.id) THEN
 RAISE EXCEPTION 'Putaway has started; use the inventory adjustment approval workflow'; END IF;
 delta:=c.quantity-(j.line_items->0->>'expectedQty')::numeric;
 SELECT coalesce((country_configs->r.country_code->>'overReceiveTolerancePct')::numeric,0) INTO tolerance FROM public.system_config LIMIT 1;
 IF item.received_qty+delta<0 OR item.received_qty+delta>private.po_expected_sellable_units(item)*(1+least(100,greatest(0,coalesce(tolerance,0)))/100) THEN
 RAISE EXCEPTION 'Correction exceeds the permitted intake'; END IF;
 END IF;
 ELSE
 IF NOT p_approve THEN RAISE EXCEPTION 'Record review or decide a specific correction'; END IF;
 IF EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id)) THEN
 RAISE EXCEPTION 'Decide the pending correction before completing review'; END IF;
 END IF;
 INSERT INTO private.blind_receipt_decisions(receipt_id,correction_id,approve,reason,reviewer_id,reviewer_name)
 VALUES(r.id,p_correction,p_approve,btrim(p_reason),actor.id,actor.name) RETURNING * INTO d;
 IF p_correction IS NOT NULL AND p_approve THEN
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,expectedQty}',to_jsonb(c.quantity)),updated_at=now() WHERE id=c.job_id;
 UPDATE public.po_items SET received_qty=received_qty+delta WHERE id=item.id;
 END IF;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('BLIND_RECEIPT_REVIEWED','Fulfillment',actor.id,r.site_id,r.country_code,'purchase_order',r.po_id::text,
 jsonb_build_object('receiptId',r.id,'correctionId',p_correction,'approved',p_approve,'reason',btrim(p_reason))::text);
 RETURN jsonb_build_object('id',d.id,'saved',true);
END; $$;
-- Counts on receipt jobs cannot be silently overwritten; handling waits for independent review.
CREATE FUNCTION private.guard_blind_receipt_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; allowed boolean;
BEGIN
 SELECT x.* INTO r FROM private.blind_receipt_counts x WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(x.lines) l WHERE l->>'jobId'=OLD.id::text) LIMIT 1;
 IF r.id IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Submitted receipt evidence cannot be deleted'; END IF;
 IF (NEW.site_id,NEW.country_code,NEW.order_ref,NEW.type) IS DISTINCT FROM (OLD.site_id,OLD.country_code,OLD.order_ref,OLD.type) THEN RAISE EXCEPTION 'Receipt job identity is locked'; END IF;
 IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM 1 OR
 (NEW.line_items->0-'pickedQty'-'status'-'location'-'expectedQty') IS DISTINCT FROM (OLD.line_items->0-'pickedQty'-'status'-'location'-'expectedQty') THEN
 RAISE EXCEPTION 'Submitted receipt lot evidence is locked'; END IF;
 IF NEW.line_items->0->>'expectedQty' IS DISTINCT FROM OLD.line_items->0->>'expectedQty' THEN
 SELECT EXISTS(SELECT 1 FROM private.blind_receipt_corrections c JOIN private.blind_receipt_decisions d ON d.correction_id=c.id
 WHERE c.receipt_id=r.id AND c.job_id=OLD.id AND c.quantity=(NEW.line_items->0->>'expectedQty')::numeric
 AND d.approve AND d.reviewer_id=auth.uid() AND d.created_at=transaction_timestamp()) INTO allowed;
 IF NOT allowed THEN RAISE EXCEPTION 'An independently approved correction is required'; END IF;
 END IF;
 IF NEW.status NOT IN('Pending','Cancelled') AND
 (NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND d.correction_id IS NULL)
 OR EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id))) THEN
 RAISE EXCEPTION 'Independent receiving review is required before putaway'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_blind_receipt_job BEFORE UPDATE OR DELETE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_blind_receipt_job();
-- Public wrappers expose only these bounded operations, never the private evidence tables.
CREATE FUNCTION public.blind_receipt_queue(p_site uuid,p_country text,p_before timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.blind_receipt_queue(p_site,p_country,p_before,p_before_id); $$;
CREATE FUNCTION public.blind_receipt_detail(p_receipt uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.blind_receipt_detail(p_receipt); $$;
CREATE FUNCTION public.request_blind_receipt_correction(p_request uuid,p_receipt uuid,p_job uuid,p_quantity numeric,p_reason text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.request_blind_receipt_correction(p_request,p_receipt,p_job,p_quantity,p_reason); $$;
CREATE FUNCTION public.decide_blind_receipt(p_receipt uuid,p_correction uuid,p_approve boolean,p_reason text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.decide_blind_receipt(p_receipt,p_correction,p_approve,p_reason); $$;
REVOKE ALL ON FUNCTION private.blind_receipt_append_only(),private.capture_blind_receipt(),private.guard_blind_receipt_job(),private.blind_receipt_manager(uuid,text),private.blind_receipt_scope(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.blind_receipt_queue(uuid,text,timestamptz,uuid),private.blind_receipt_detail(uuid),private.request_blind_receipt_correction(uuid,uuid,uuid,numeric,text),private.decide_blind_receipt(uuid,uuid,boolean,text),public.blind_receipt_queue(uuid,text,timestamptz,uuid),public.blind_receipt_detail(uuid),public.request_blind_receipt_correction(uuid,uuid,uuid,numeric,text),public.decide_blind_receipt(uuid,uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.blind_receipt_queue(uuid,text,timestamptz,uuid),private.blind_receipt_detail(uuid),private.request_blind_receipt_correction(uuid,uuid,uuid,numeric,text),private.decide_blind_receipt(uuid,uuid,boolean,text),public.blind_receipt_queue(uuid,text,timestamptz,uuid),public.blind_receipt_detail(uuid),public.request_blind_receipt_correction(uuid,uuid,uuid,numeric,text),public.decide_blind_receipt(uuid,uuid,boolean,text) TO authenticated;
COMMIT;
