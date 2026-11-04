-- Same receiving-day lots can share a bin while retaining separate product/lot identities.
BEGIN;
ALTER TABLE public.products ADD COLUMN received_on date;
CREATE FUNCTION private.putaway_receiving_day(p_job uuid) RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE site uuid; receipt_country text; tz text; day date; days integer;
BEGIN
 IF to_regclass('private.fulfillment_receipts') IS NULL THEN RETURN NULL; END IF;
 SELECT j.site_id,j.country_code INTO site,receipt_country FROM public.wms_jobs j WHERE j.id=p_job AND j.type='PUTAWAY';
 SELECT coalesce(nullif(country_configs->receipt_country->>'timezone',''),nullif(timezone,''),'UTC') INTO tz FROM public.system_config LIMIT 1;
 SELECT min((r.created_at AT TIME ZONE coalesce(tz,'UTC'))::date),count(DISTINCT (r.created_at AT TIME ZONE coalesce(tz,'UTC'))::date)
 INTO day,days FROM private.fulfillment_receipts r JOIN public.purchase_orders p ON p.id=r.po_id
 WHERE p_job=ANY(r.job_ids) AND p.site_id=site AND p.country_code=receipt_country;
 RETURN CASE WHEN days=1 THEN day ELSE NULL END;
END $$;
REVOKE ALL ON FUNCTION private.putaway_receiving_day(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.putaway_receiving_day(p_job uuid) RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE job public.wms_jobs%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job AND type='PUTAWAY';
 IF actor.id IS NULL OR job.id IS NULL OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,job.country_code)
 OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM job.site_id OR public.get_my_country_code_strict() IS DISTINCT FROM job.country_code))
 OR (actor.role NOT IN('group_ceo','warehouse_manager','country_operations_director','country_managing_director')
 AND (job.assigned_to IS DISTINCT FROM actor.id::text OR NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
 RAISE EXCEPTION 'Authorized putaway employee required' USING ERRCODE='42501'; END IF;
 RETURN private.putaway_receiving_day(p_job);
END $$;
REVOKE ALL ON FUNCTION public.putaway_receiving_day(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.putaway_receiving_day(uuid) TO authenticated;
-- Backfill only receipt dates proved by stock-movement + putaway + receipt linkage.
DO $$ BEGIN
 IF to_regclass('private.fulfillment_receipts') IS NOT NULL THEN
 WITH evidence AS (
 SELECT m.product_id,private.putaway_receiving_day(j.id) AS day
 FROM public.stock_movements m JOIN public.wms_jobs j ON j.site_id=m.site_id AND j.type='PUTAWAY'
 AND (m.reason LIKE 'Putaway job '||j.id::text||' line %'
 OR m.reason LIKE 'Putaway job '||coalesce(nullif(j.job_number,''),upper(substr(replace(j.id::text,'-',''),1,6)))||' line %')
 WHERE m.type='IN'
 ), proven AS(SELECT product_id,min(day) AS day FROM evidence GROUP BY product_id HAVING count(*)=count(day) AND count(DISTINCT day)=1)
 UPDATE public.products p SET received_on=q.day FROM proven q WHERE p.id=q.product_id;
 END IF;
END $$;
CREATE UNIQUE INDEX products_physical_lot_bin_key ON public.products(sku,site_id,location,coalesce(batch_number,''),coalesce(expiry_date,DATE '0001-01-01'),coalesce(received_on,DATE '0001-01-01'))
WHERE location ~ '^[A-Z]-[0-9]{2}-[0-9]{2}$';
CREATE UNIQUE INDEX products_nonstorage_identity_key ON public.products(sku,site_id,location)
WHERE location IS NULL OR location !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$';
ALTER TABLE public.products DROP CONSTRAINT unique_product_sku_site_location;
CREATE FUNCTION private.guard_product_receiving_day() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job_id uuid:=nullif(current_setting('siifmart.putaway_job',true),'')::uuid; day date;
BEGIN
 IF auth.uid() IS NULL AND session_user IN('postgres','supabase_admin') THEN RETURN NEW; END IF;
 IF job_id IS NULL THEN
  IF TG_OP='INSERT' THEN NEW.received_on:=NULL;
  ELSIF NEW.received_on IS DISTINCT FROM OLD.received_on THEN RAISE EXCEPTION 'Receiving date is server-controlled' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 day:=public.putaway_receiving_day(job_id);
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.id=job_id AND j.site_id=NEW.site_id AND j.type='PUTAWAY'
 AND j.status IN('Pending','In-Progress') AND EXISTS(SELECT 1 FROM jsonb_array_elements(j.line_items) l WHERE l->>'sku'=NEW.sku))
 OR NEW.received_on IS DISTINCT FROM day THEN RAISE EXCEPTION 'Receiving date does not match recorded intake' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_product_receiving_day() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_product_receiving_day BEFORE INSERT OR UPDATE OF received_on ON public.products FOR EACH ROW EXECUTE FUNCTION private.guard_product_receiving_day();
COMMIT;
