-- Direct API updates must obey the same arrival-before-acceptance rule as the WMS cascade.
CREATE OR REPLACE FUNCTION private.guard_recorded_arrival_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.jwt()->>'role' = 'service_role' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'transfers' THEN
    IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status = 'Received'
      AND COALESCE(OLD.transfer_status,'') NOT IN ('Delivered','Partially Delivered') THEN
      RAISE EXCEPTION 'Record transport arrival before receiving inspection';
    END IF;
    IF NEW.status = 'Completed' AND COALESCE(NEW.transfer_status,'') <> 'Received' THEN
      RAISE EXCEPTION 'Only destination acceptance completes a transfer';
    END IF;
  ELSIF OLD.type IN ('DISPATCH','DRIVER') AND OLD.transfer_status IN ('Delivered','Partially Delivered','Received','Completed')
    AND (NEW.delivered_at IS DISTINCT FROM OLD.delivered_at OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
      OR NEW.completed_by IS DISTINCT FROM OLD.completed_by) THEN
    RAISE EXCEPTION 'Recorded arrival identity and timestamps are immutable';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_recorded_arrival_receipt() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_recorded_transfer_receipt ON public.transfers;
CREATE TRIGGER guard_recorded_transfer_receipt BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION private.guard_recorded_arrival_receipt();
DROP TRIGGER IF EXISTS guard_recorded_arrival ON public.wms_jobs;
CREATE TRIGGER guard_recorded_arrival BEFORE UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_recorded_arrival_receipt();
