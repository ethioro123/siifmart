-- Maintenance closure for the reported completed intake, without inventing worker completion.
DO $$
DECLARE po public.purchase_orders%ROWTYPE; job public.wms_jobs%ROWTYPE;
BEGIN
 SELECT p.* INTO po FROM public.purchase_orders p JOIN public.sites s ON s.id=p.site_id
 WHERE p.po_number='AAAA0033' AND p.country_code='ET' AND s.country='ET' AND s.name='Adama Industrial Warehouse';
 IF po.id IS NULL THEN RETURN; END IF;
 IF po.status<>'Received' OR NOT EXISTS(SELECT 1 FROM public.po_items WHERE po_id=po.id)
 OR EXISTS(SELECT 1 FROM public.po_items i WHERE i.po_id=po.id AND
 (private.po_expected_sellable_units(i) IS NULL OR private.po_expected_sellable_units(i)<=0
 OR coalesce(i.received_qty,0)<private.po_expected_sellable_units(i)
 OR NOT EXISTS(SELECT 1 FROM private.fulfillment_receipts r WHERE r.po_id=po.id AND r.item_id=i.id))) THEN
 RAISE EXCEPTION 'Complete recorded receipt evidence required for maintenance closure'; END IF;
 FOR job IN SELECT * FROM public.wms_jobs WHERE site_id=po.site_id AND country_code=po.country_code
 AND type='RECEIVE' AND order_ref IN(po.id::text,po.po_number) AND status='In-Progress' FOR UPDATE LOOP
  IF NOT EXISTS(SELECT 1 FROM private.fulfillment_receipts r WHERE r.po_id=po.id AND r.employee_id::text=job.assigned_to) THEN
   RAISE EXCEPTION 'Assigned receiver must match recorded receipt handler'; END IF;
  -- Keep completed_by unchanged: this maintenance action is not a worker attestation.
  UPDATE public.wms_jobs SET status='Completed',completed_at=clock_timestamp() WHERE id=job.id;
  INSERT INTO public.system_logs(action,module,user_name,site_id,country_code,entity_type,entity_id,details)
  VALUES('RECEIVING_SESSION_SYNC_REPAIRED','Fulfillment','Database maintenance',po.site_id::text,po.country_code,'warehouse_job',job.id::text,
   jsonb_build_object('poId',po.id,'reason','Recorded intake complete; receiving job completion was not persisted',
   'previousStatus',job.status,'workerAttestationAdded',false,'putawayChanged',false)::text);
 END LOOP;
END $$;
