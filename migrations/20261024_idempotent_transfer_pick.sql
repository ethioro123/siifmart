-- One non-cancelled PICK per transfer. Canonicalize legacy job-number references before checking.
CREATE INDEX IF NOT EXISTS idx_wms_transfer_pick_parent ON public.wms_jobs(country_code,site_id,order_ref) WHERE type='PICK' AND status<>'Cancelled';
CREATE OR REPLACE FUNCTION private.guard_single_transfer_pick() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE parent public.wms_jobs%ROWTYPE;
BEGIN
 IF NEW.type<>'PICK' OR NEW.status='Cancelled' OR NEW.order_ref IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO parent FROM public.wms_jobs t WHERE t.type='TRANSFER' AND t.country_code=NEW.country_code
  AND coalesce(t.source_site_id,t.site_id)=NEW.site_id AND (t.id::text=NEW.order_ref OR t.job_number=NEW.order_ref)
  ORDER BY (t.id::text=NEW.order_ref) DESC LIMIT 1;
 IF parent.id IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('transfer-pick:'||parent.id::text,0));
 IF NEW.dest_site_id IS DISTINCT FROM parent.dest_site_id OR coalesce(NEW.source_site_id,NEW.site_id) IS DISTINCT FROM coalesce(parent.source_site_id,parent.site_id) THEN
  RAISE EXCEPTION 'PICK facility must match its transfer' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.wms_jobs p WHERE p.type='PICK' AND p.status<>'Cancelled' AND p.id<>NEW.id
  AND p.site_id=NEW.site_id AND p.country_code=NEW.country_code AND p.order_ref IN(parent.id::text,parent.job_number)) THEN
  RAISE EXCEPTION 'Transfer already has a PICK job; refresh the queue' USING ERRCODE='23505'; END IF;
 NEW.order_ref:=parent.id::text;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_single_transfer_pick() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_single_transfer_pick ON public.wms_jobs;
CREATE TRIGGER guard_single_transfer_pick BEFORE INSERT OR UPDATE OF type,order_ref,status,site_id,country_code ON public.wms_jobs
 FOR EACH ROW EXECUTE FUNCTION private.guard_single_transfer_pick();

CREATE OR REPLACE FUNCTION private.approve_transfer_for_picking(p_transfer_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; transfer public.wms_jobs%ROWTYPE; pick public.wms_jobs%ROWTYPE; source_country text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO transfer FROM public.wms_jobs WHERE id=p_transfer_id AND type='TRANSFER' FOR UPDATE;
 IF actor.id IS NULL OR transfer.id IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','country_supply_chain_director','regional_supply_chain_manager','inventory_manager','regional_logistics_manager')
  OR NOT public.is_site_in_my_authorized_scope(coalesce(transfer.source_site_id,transfer.site_id)::text,transfer.country_code) THEN
  RAISE EXCEPTION 'Transfer approval requires scoped warehouse leadership' USING ERRCODE='42501'; END IF;
 SELECT upper(s.country) INTO source_country FROM public.sites s WHERE s.id=coalesce(transfer.source_site_id,transfer.site_id) AND s.type IN ('Warehouse','Distribution Center');
 IF source_country IS DISTINCT FROM upper(transfer.country_code) OR NOT EXISTS(SELECT 1 FROM public.sites d WHERE d.id=transfer.dest_site_id AND upper(d.country)=source_country) THEN
  RAISE EXCEPTION 'Transfer facilities must be in the same country' USING ERRCODE='42501'; END IF;
 IF transfer.status IN ('Cancelled','Completed') OR coalesce(transfer.transfer_status,'Requested') NOT IN ('Draft','Requested','Approved','Picking') THEN
  RAISE EXCEPTION 'Transfer is not awaiting picking approval'; END IF;
 IF actor.role<>'group_ceo' AND lower(coalesce(transfer.requested_by,'')) IN(lower(actor.name),lower(coalesce(actor.email,'')),actor.id::text) THEN
  RAISE EXCEPTION 'Transfer requester cannot approve their own transfer' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('transfer-pick:'||transfer.id::text,0));
 SELECT * INTO pick FROM public.wms_jobs p WHERE p.type='PICK' AND p.status<>'Cancelled'
  AND p.site_id=coalesce(transfer.source_site_id,transfer.site_id) AND p.country_code=transfer.country_code
  AND p.order_ref IN(transfer.id::text,transfer.job_number) ORDER BY p.created_at,p.id LIMIT 1;
 IF pick.id IS NULL THEN
  IF jsonb_array_length(coalesce(transfer.line_items,'[]'))=0 THEN RAISE EXCEPTION 'Transfer has no products'; END IF;
  INSERT INTO public.wms_jobs(site_id,source_site_id,dest_site_id,country_code,type,status,priority,items_count,line_items,order_ref,job_number,location)
  VALUES(coalesce(transfer.source_site_id,transfer.site_id),coalesce(transfer.source_site_id,transfer.site_id),transfer.dest_site_id,transfer.country_code,'PICK','Pending',transfer.priority,
   jsonb_array_length(transfer.line_items),(SELECT jsonb_agg(i||jsonb_build_object('status','Pending','pickedQty',0)) FROM jsonb_array_elements(transfer.line_items)i),transfer.id::text,transfer.job_number,'Unassigned') RETURNING * INTO pick;
 END IF;
 IF transfer.transfer_status IS DISTINCT FROM 'Picking' THEN
  UPDATE public.wms_jobs SET transfer_status='Picking',approved_by=actor.name WHERE id=transfer.id;
  INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
  VALUES('TRANSFER_APPROVED_FOR_PICKING','Fulfillment',actor.name,actor.id,pick.site_id,pick.country_code,'wms_job',transfer.id::text,jsonb_build_object('pickJobId',pick.id));
 END IF;
 RETURN to_jsonb(pick);
END; $$;
REVOKE ALL ON FUNCTION private.approve_transfer_for_picking(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.approve_transfer_for_picking(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.approve_transfer_for_picking(p_transfer_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.approve_transfer_for_picking(p_transfer_id); $$;
REVOKE ALL ON FUNCTION public.approve_transfer_for_picking(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_transfer_for_picking(uuid) TO authenticated;
