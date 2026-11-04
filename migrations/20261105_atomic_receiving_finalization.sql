-- Finalize the receipt session from server counts; PUTAWAY remains independent.
CREATE FUNCTION private.finalize_receiving_session(p_po uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; po public.purchase_orders%ROWTYPE; item public.po_items%ROWTYPE;
 job public.wms_jobs%ROWTYPE; results jsonb:='[]'; full_receipt boolean:=true; has_count boolean:=false; expected numeric; next_status text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO po FROM public.purchase_orders WHERE id=p_po FOR UPDATE;
 IF actor.id IS NULL OR po.id IS NULL OR NOT public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code)
 OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM po.site_id OR public.get_my_country_code_strict() IS DISTINCT FROM po.country_code))
 OR actor.role NOT IN('group_ceo','warehouse_manager','store_manager','country_operations_director','country_managing_director','picker','packer','receiver','inventory_specialist','forklift_operator','stock_clerk','driver','receiving_operator','putaway_operator','inbound_qc_inspector','returns_operator','returns_clerk') THEN
 RAISE EXCEPTION 'Authorized receiving employee required' USING ERRCODE='42501'; END IF;
 IF po.status NOT IN('Approved','Ordered','Partially Received','Received') THEN RAISE EXCEPTION 'An open receipt session is required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.po_items WHERE po_id=po.id) THEN RAISE EXCEPTION 'Saved receipt lines required'; END IF;
 FOR item IN SELECT * FROM public.po_items WHERE po_id=po.id ORDER BY id FOR UPDATE LOOP
  expected:=private.po_expected_sellable_units(item);
  IF expected IS NULL OR expected<=0 THEN RAISE EXCEPTION 'Valid ordered units required'; END IF;
  IF coalesce(item.received_qty,0)>0 THEN
   has_count:=true;
   IF NOT EXISTS(SELECT 1 FROM private.fulfillment_receipts r WHERE r.po_id=po.id AND r.item_id=item.id) THEN RAISE EXCEPTION 'Saved physical receipt evidence required'; END IF;
  END IF;
  IF coalesce(item.received_qty,0)<expected THEN full_receipt:=false; END IF;
 END LOOP;
 IF NOT has_count THEN RAISE EXCEPTION 'Submit physical counts before finalizing'; END IF;
 next_status:=CASE WHEN full_receipt THEN 'Received' ELSE 'Partially Received' END;
 FOR job IN SELECT * FROM public.wms_jobs WHERE site_id=po.site_id AND country_code=po.country_code AND type='RECEIVE'
 AND order_ref IN(po.id::text,po.po_number) AND status<>'Cancelled' ORDER BY id FOR UPDATE LOOP
  IF job.status<>'Completed' THEN
   IF actor.role NOT IN('group_ceo','warehouse_manager','store_manager','country_operations_director','country_managing_director')
   AND job.assigned_to IS DISTINCT FROM actor.id::text THEN RAISE EXCEPTION 'Assigned receiving employee required' USING ERRCODE='42501'; END IF;
   UPDATE public.wms_jobs SET status='Completed',completed_by=actor.id::text,completed_at=clock_timestamp() WHERE id=job.id RETURNING * INTO job;
  END IF;
  results:=results||jsonb_build_array(jsonb_build_object('id',job.id,'status',job.status,'completed_by',job.completed_by,'completed_at',job.completed_at));
 END LOOP;
 IF jsonb_array_length(results)=0 THEN RAISE EXCEPTION 'A matching receiving job is required'; END IF;
 IF po.status IS DISTINCT FROM next_status THEN UPDATE public.purchase_orders SET status=next_status,updated_at=clock_timestamp() WHERE id=po.id; END IF;
 INSERT INTO public.system_logs(action,module,employee_id,user_name,site_id,country_code,entity_type,entity_id,details)
 VALUES('RECEIVING_SESSION_FINALIZED','Fulfillment',actor.id::text,actor.name,po.site_id::text,po.country_code,'purchase_order',po.id::text,
 jsonb_build_object('status',next_status,'jobs',results)::text);
 RETURN jsonb_build_object('id',po.id,'status',next_status,'jobs',results,'saved',true);
END $$;
REVOKE ALL ON FUNCTION private.finalize_receiving_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.finalize_receiving_session(uuid) TO authenticated;
CREATE FUNCTION public.finalize_receiving_session(p_po uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$ SELECT private.finalize_receiving_session(p_po); $$;
REVOKE ALL ON FUNCTION public.finalize_receiving_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_receiving_session(uuid) TO authenticated;
