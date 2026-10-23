-- Source and destination stay inside the verified national facility boundary.
CREATE OR REPLACE FUNCTION private.authorized_pick(p_job_id uuid) RETURNS public.wms_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type='PICK' FOR UPDATE;
 IF auth.uid() IS NULL OR e.id IS NULL OR j.id IS NULL OR j.assigned_to IS DISTINCT FROM e.id::text
  OR e.role NOT IN ('picker','packer','receiver','receiving_operator','putaway_operator','replenishment_operator','inventory_controller','stock_counter','dispatch_operator','returns_operator','fleet_mechanic','inventory_specialist','forklift_operator','stock_clerk','inbound_qc_inspector','returns_clerk','driver','warehouse_manager','inventory_manager','group_ceo','country_operations_director','country_managing_director')
  OR coalesce(j.source_site_id,j.site_id) IS DISTINCT FROM j.site_id
  OR (j.dest_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sites d WHERE d.id=j.dest_site_id AND upper(d.country)=upper(j.country_code)))
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR (e.role<>'group_ceo' AND e.site_id IS DISTINCT FROM j.site_id)
  OR NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=j.site_id AND upper(s.country)=upper(j.country_code) AND s.type IN ('Warehouse','Distribution Center'))
  OR NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id=e.id)
 THEN RAISE EXCEPTION 'Picking requires the assigned employee at this facility' USING ERRCODE='42501'; END IF;
 RETURN j;
END; $$;

CREATE OR REPLACE FUNCTION private.guard_verified_picking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE idx integer:=0; line jsonb; receipt private.pick_line_receipts%ROWTYPE; completing boolean;
BEGIN
 IF auth.jwt()->>'role'='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.type='PICK' AND (NEW.status='Completed' OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.line_items,'[]'))i WHERE coalesce((i->>'pickedQty')::numeric,0)<>0)) THEN RAISE EXCEPTION 'New PICK jobs require unverified quantities'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.type<>'PICK' THEN
  IF NEW.type='PICK' THEN RAISE EXCEPTION 'Create a new picking manifest instead of changing job type'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.type IS DISTINCT FROM OLD.type OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.source_site_id IS DISTINCT FROM OLD.source_site_id OR NEW.dest_site_id IS DISTINCT FROM OLD.dest_site_id THEN RAISE EXCEPTION 'PICK identity is immutable'; END IF;
 IF OLD.status='Completed' AND (NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IS DISTINCT FROM OLD.status) THEN RAISE EXCEPTION 'Completed picking is immutable'; END IF;
 completing:=NEW.status='Completed' AND OLD.status<>'Completed';
 IF completing AND NOT EXISTS(SELECT 1 FROM private.pick_completions WHERE job_id=OLD.id) THEN RAISE EXCEPTION 'Complete picking through its verified transaction'; END IF;
 IF NEW.line_items IS NOT DISTINCT FROM OLD.line_items THEN RETURN NEW; END IF;
 IF jsonb_array_length(NEW.line_items)<>jsonb_array_length(OLD.line_items) THEN RAISE EXCEPTION 'Picking manifest is immutable'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
  IF line IS DISTINCT FROM OLD.line_items->idx THEN
   SELECT * INTO receipt FROM private.pick_line_receipts WHERE job_id=OLD.id AND item_index=idx;
   IF receipt.job_id IS NULL OR (line-ARRAY['status','pickedQty','location','shortageReason']) IS DISTINCT FROM ((OLD.line_items->idx)-ARRAY['status','pickedQty','location','shortageReason'])
    OR (line->>'pickedQty')::numeric IS DISTINCT FROM receipt.quantity OR line->>'location' IS DISTINCT FROM receipt.source_location
    OR line->>'shortageReason' IS DISTINCT FROM receipt.shortage_reason
    OR line->>'status' IS DISTINCT FROM (CASE WHEN receipt.quantity<(line->>'expectedQty')::numeric THEN 'Short' WHEN completing THEN 'Completed' ELSE 'Picked' END)
   THEN RAISE EXCEPTION 'Picking updates require verified source-bin and product scans'; END IF;
  END IF;
  idx:=idx+1;
 END LOOP;
 RETURN NEW;
END; $$;
