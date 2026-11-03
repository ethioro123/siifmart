BEGIN;
CREATE OR REPLACE FUNCTION private.guard_closed_operational_facility() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE payload jsonb:=to_jsonb(NEW); target uuid; facility_status text; assigned public.employees%ROWTYPE;
BEGIN
 FOR target IN SELECT DISTINCT site.id FROM jsonb_each_text(payload) pair
   JOIN public.sites site ON site.id::text=pair.value OR site.code=pair.value
   WHERE pair.key IN ('site_id','source_site_id','dest_site_id') AND pair.value IS NOT NULL LOOP
   SELECT status INTO facility_status FROM public.sites WHERE id=target FOR KEY SHARE;
   IF facility_status='Closed' THEN RAISE EXCEPTION 'This facility is closed to new operational changes'; END IF;
 END LOOP;
 IF TG_TABLE_NAME='wms_jobs' AND nullif(payload->>'assigned_to','') IS NOT NULL THEN
   SELECT * INTO assigned FROM public.employees WHERE id::text=payload->>'assigned_to' OR name=payload->>'assigned_to' LIMIT 1 FOR SHARE;
   IF FOUND AND assigned.status<>'Active' THEN RAISE EXCEPTION 'Warehouse jobs require an active assigned employee'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_closed_operational_facility() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.guard_po_lifecycle_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE parent_status text;
BEGIN
 SELECT status INTO parent_status FROM public.purchase_orders WHERE id=NEW.po_id FOR KEY SHARE;
 IF parent_status IN ('Cancelled','Rejected') THEN
   RAISE EXCEPTION 'Cancelled or rejected orders cannot accept new receipt or invoice evidence'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_po_lifecycle_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_po_lifecycle_evidence BEFORE INSERT OR UPDATE ON public.po_items
 FOR EACH ROW EXECUTE FUNCTION private.guard_po_lifecycle_evidence();
CREATE TRIGGER guard_invoice_po_lifecycle BEFORE INSERT OR UPDATE ON public.vendor_invoices
 FOR EACH ROW EXECUTE FUNCTION private.guard_po_lifecycle_evidence();
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['vendor_invoices','ar_invoices'] LOOP
 EXECUTE format('CREATE TRIGGER guard_closed_operational_facility BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.guard_closed_operational_facility()',target);
 EXECUTE format('CREATE TRIGGER require_active_operational_actor BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.require_active_operational_actor()',target);
 END LOOP;
END; $$;
CREATE TRIGGER require_active_operational_actor BEFORE INSERT OR UPDATE OR DELETE ON public.po_items
 FOR EACH ROW EXECUTE FUNCTION private.require_active_operational_actor();
COMMIT;
