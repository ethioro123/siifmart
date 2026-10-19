-- Align the transfer summary with its verified status constraint; detailed custody stays in transfer_status.
CREATE OR REPLACE FUNCTION private.sync_shipment_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  origin uuid := COALESCE(NEW.source_site_id,NEW.site_id);
  phase text := NEW.transfer_status;
BEGIN
  IF NEW.type NOT IN ('DISPATCH','DRIVER','TRANSFER') OR
    (NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to) THEN RETURN NEW; END IF;
  IF NEW.type IN ('DISPATCH','DRIVER') THEN
    UPDATE public.wms_jobs p SET
      transfer_status = phase,
      status = CASE WHEN phase IN ('Delivered','Partially Delivered') THEN 'Pending' ELSE p.status END,
      assigned_to = NEW.assigned_to, delivery_method = NEW.delivery_method,
      external_carrier_name = NEW.external_carrier_name,
      shipped_at = COALESCE(NEW.shipped_at,p.shipped_at), delivered_at = COALESCE(NEW.delivered_at,p.delivered_at),
      has_discrepancy = COALESCE(p.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
    WHERE p.type = 'TRANSFER' AND p.country_code = NEW.country_code
      AND COALESCE(p.source_site_id,p.site_id) = origin AND p.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
      AND NULLIF(NEW.order_ref,'') IS NOT NULL AND (p.id::text = NEW.order_ref OR p.job_number = NEW.order_ref OR p.order_ref = NEW.order_ref)
      AND p.transfer_status IS DISTINCT FROM 'Received' AND p.status <> 'Cancelled';
    IF phase IN ('Shipped','In-Transit','Delivered','Partially Delivered') THEN
      UPDATE public.sales SET fulfillment_status = CASE WHEN phase IN ('Shipped','In-Transit') THEN 'Shipped' ELSE 'Delivered' END
      WHERE id::text = NEW.order_ref AND site_id = origin AND country_code = NEW.country_code;
    END IF;
    INSERT INTO public.system_logs(action,module,entity_type,entity_id,performed_by,site_id,country_code,details)
    VALUES ('SHIPMENT_HANDOFF','Fulfillment','wms_job',NEW.id::text,auth.uid()::text,origin::text,NEW.country_code,
      jsonb_build_object('phase',phase,'previousPhase',OLD.transfer_status,'driverId',NEW.assigned_to,'receivingAccepted',false)::text);
  END IF;
  UPDATE public.transfers t SET
    transfer_status = phase,
    status = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN 'Completed'
      WHEN phase = 'Cancelled' THEN 'Rejected'
      WHEN phase IN ('Shipped','In-Transit','Delivered','Partially Delivered') THEN 'In-Transit' ELSE t.status END,
    shipped_at = COALESCE(NEW.shipped_at,t.shipped_at), delivered_at = COALESCE(NEW.delivered_at,t.delivered_at),
    received_at = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_at ELSE t.received_at END,
    received_by = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_by ELSE t.received_by END,
    driver_id = (SELECT e.id FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver'),
    driver_type = lower(COALESCE(NEW.delivery_method,'Internal')),
    driver_name = CASE WHEN NEW.delivery_method = 'External' THEN NEW.external_carrier_name ELSE
      (SELECT e.name FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver') END,
    has_discrepancy = COALESCE(t.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
  WHERE t.country_code = NEW.country_code AND t.source_site_id = origin AND t.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
    AND (t.id::text = NEW.id::text OR (NULLIF(NEW.order_ref,'') IS NOT NULL AND (t.id::text = NEW.order_ref OR t.order_ref = NEW.order_ref)))
    AND t.transfer_status IS DISTINCT FROM 'Received' AND t.status <> 'Cancelled';
  RETURN NEW;
END;
$$;


REVOKE ALL ON FUNCTION private.sync_shipment_workflow() FROM PUBLIC,anon,authenticated;
