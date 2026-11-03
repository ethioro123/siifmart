-- Final evidence guards with the verified text inventory-request product key.
BEGIN;
CREATE OR REPLACE FUNCTION private.guard_product_delete_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE country text;
BEGIN
 SELECT s.country INTO country FROM public.sites s WHERE s.id=OLD.site_id;
 IF auth.uid() IS NOT NULL AND NOT private.lifecycle_visible(OLD.site_id,country) THEN
   RAISE EXCEPTION 'Product is outside your authorized facility or country' USING ERRCODE='42501'; END IF;
 IF coalesce(OLD.stock,0)<>0 THEN RAISE EXCEPTION 'A product with stock cannot be deleted' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.stock_movements WHERE product_id=OLD.id)
   OR EXISTS(SELECT 1 FROM public.sale_items WHERE product_id=OLD.id)
   OR EXISTS(SELECT 1 FROM public.po_items WHERE product_id=OLD.id)
   OR EXISTS(SELECT 1 FROM public.inventory_requests WHERE product_id=OLD.id::text)
   OR EXISTS(SELECT 1 FROM public.product_price_history WHERE product_id=OLD.id)
   OR EXISTS(SELECT 1 FROM public.barcode_approvals WHERE product_id=OLD.id)
   OR EXISTS(SELECT 1 FROM public.wms_jobs job,jsonb_array_elements(coalesce(job.line_items,'[]'::jsonb)) item
     WHERE (job.site_id=OLD.site_id OR job.source_site_id=OLD.site_id OR job.dest_site_id=OLD.site_id)
       AND (item->>'productId'=OLD.id::text OR item->>'product_id'=OLD.id::text OR item->>'id'=OLD.id::text)) THEN
   RAISE EXCEPTION 'Product history must be retained; deletion cannot remove operational evidence' USING ERRCODE='42501'; END IF;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_product_delete_evidence() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER guard_product_delete_evidence BEFORE DELETE ON public.products
 FOR EACH ROW EXECUTE FUNCTION private.guard_product_delete_evidence();
CREATE OR REPLACE FUNCTION private.preserve_product_attribution() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF OLD.product_id IS NOT NULL AND NEW.product_id IS DISTINCT FROM OLD.product_id THEN
   RAISE EXCEPTION 'Historical product attribution cannot be detached or replaced' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.preserve_product_attribution() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER preserve_product_attribution BEFORE UPDATE OF product_id ON public.stock_movements
 FOR EACH ROW EXECUTE FUNCTION private.preserve_product_attribution();
CREATE OR REPLACE TRIGGER preserve_product_attribution BEFORE UPDATE OF product_id ON public.sale_items
 FOR EACH ROW EXECUTE FUNCTION private.preserve_product_attribution();
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['employee_documents','stock_movements','sale_items','system_logs'] LOOP
   EXECUTE format('REVOKE DELETE ON public.%I FROM anon,authenticated',target);
   EXECUTE format('CREATE OR REPLACE TRIGGER preserve_record_evidence BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.reject_operational_record_delete()',target);
 END LOOP;
END; $$;
CREATE OR REPLACE TRIGGER immutable_general_audit_log BEFORE UPDATE ON public.system_logs
 FOR EACH ROW EXECUTE FUNCTION private.lifecycle_immutable_event();

CREATE OR REPLACE FUNCTION private.guard_po_item_delete_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN
   IF coalesce(OLD.received_qty,0)<>0 THEN RAISE EXCEPTION 'Receiving evidence cannot be deleted' USING ERRCODE='42501'; END IF;
   RETURN OLD;
 END IF;
 IF coalesce(OLD.received_qty,0)<>0 AND
   (coalesce(NEW.received_qty,0)<OLD.received_qty OR coalesce(NEW.received_qty,0)=0
     OR NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.po_id IS DISTINCT FROM OLD.po_id) THEN
   RAISE EXCEPTION 'Receiving evidence requires a reviewed reversal; it cannot be erased or reassigned' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_po_item_delete_evidence() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER guard_po_item_delete_evidence BEFORE DELETE OR UPDATE ON public.po_items
 FOR EACH ROW EXECUTE FUNCTION private.guard_po_item_delete_evidence();
CREATE OR REPLACE FUNCTION private.retain_floor_stage_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job public.wms_jobs%ROWTYPE; protected boolean;
BEGIN
 IF TG_TABLE_NAME='wms_jobs' THEN
   RAISE EXCEPTION 'Warehouse job history must be retained; use cancellation review' USING ERRCODE='42501';
 END IF;
 SELECT * INTO job FROM public.wms_jobs WHERE id=OLD.job_id;
 protected:=OLD.started_at IS NOT NULL OR OLD.completed_at IS NOT NULL OR nullif(job.order_ref,'') IS NOT NULL;
 IF TG_OP='DELETE' THEN
   IF protected THEN RAISE EXCEPTION 'Warehouse assignment history cannot be deleted' USING ERRCODE='42501'; END IF;
   RETURN OLD;
 END IF;
 IF protected AND (NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
   OR NEW.started_at IS DISTINCT FROM OLD.started_at) THEN
   RAISE EXCEPTION 'Warehouse assignment attribution and start evidence are immutable' USING ERRCODE='42501'; END IF;
 IF OLD.completed_at IS NOT NULL AND (to_jsonb(NEW)-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN
   RAISE EXCEPTION 'Completed warehouse assignment evidence is immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.retain_floor_stage_history() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER retain_floor_assignment_history BEFORE DELETE OR UPDATE ON public.job_assignments
 FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history();
CREATE OR REPLACE TRIGGER retain_floor_stage_history BEFORE DELETE ON public.wms_jobs
 FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history();

CREATE OR REPLACE FUNCTION private.preserve_employee_document_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target_country text;
BEGIN
 IF TG_OP='INSERT' THEN
   SELECT s.country INTO target_country FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.id=NEW.employee_id;
   IF target_country IS NULL OR upper(NEW.country_code) IS DISTINCT FROM upper(target_country) THEN
     RAISE EXCEPTION 'Employee document country must match the employee facility' USING ERRCODE='23514'; END IF;
   IF auth.uid() IS NOT NULL THEN NEW.uploaded_by:=auth.uid()::text; NEW.verified:=false; NEW.verified_by:=NULL; NEW.verified_at:=NULL; END IF;
 ELSIF (NEW.employee_id,NEW.country_code,NEW.file_url,NEW.name,NEW.doc_type,NEW.uploaded_by,NEW.created_at)
   IS DISTINCT FROM (OLD.employee_id,OLD.country_code,OLD.file_url,OLD.name,OLD.doc_type,OLD.uploaded_by,OLD.created_at) THEN
   RAISE EXCEPTION 'Personnel document identity is retained; add a new version instead of replacing evidence' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.preserve_employee_document_identity() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER preserve_employee_document_identity BEFORE INSERT OR UPDATE ON public.employee_documents
 FOR EACH ROW EXECUTE FUNCTION private.preserve_employee_document_identity();
REVOKE DELETE ON public.inventory_requests FROM anon,authenticated;
CREATE OR REPLACE FUNCTION private.preserve_nonprice_request_history() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF OLD.change_type='edit' AND private.is_price_change(OLD.proposed_changes) THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'Inventory approval history must be retained' USING ERRCODE='42501';
END;
$$;
REVOKE ALL ON FUNCTION private.preserve_nonprice_request_history() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER preserve_nonprice_request_history BEFORE DELETE ON public.inventory_requests
 FOR EACH ROW EXECUTE FUNCTION private.preserve_nonprice_request_history();
COMMIT;
