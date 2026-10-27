-- Serialize pending product edits so markdown requests cannot race another proposal.
-- Existing RLS and approval triggers still authorize and validate every request.
CREATE FUNCTION private.guard_markdown_proposal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE is_markdown boolean:=coalesce(NEW.adjustment_reason,'') LIKE 'PRICE_CHANGE: Clearance proposal:%';
BEGIN
 IF NEW.change_type IS DISTINCT FROM 'edit' OR NEW.status IS DISTINCT FROM 'pending' THEN RETURN NEW; END IF;
 IF nullif(NEW.product_id,'') IS NULL OR nullif(NEW.site_id,'') IS NULL THEN
  IF is_markdown THEN RAISE EXCEPTION 'A clearance proposal requires its product and facility' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('markdown-proposal:'||NEW.country_code||':'||NEW.site_id||':'||NEW.product_id,0));
 IF EXISTS(SELECT 1 FROM public.inventory_requests r
  WHERE r.country_code=NEW.country_code AND r.site_id=NEW.site_id AND r.product_id=NEW.product_id
   AND r.change_type='edit' AND r.status='pending' AND r.id IS DISTINCT FROM NEW.id
   AND (is_markdown OR coalesce(r.adjustment_reason,'') LIKE 'PRICE_CHANGE: Clearance proposal:%')) THEN
  RAISE EXCEPTION 'This product already has a pending edit. Review it before submitting another clearance price.' USING ERRCODE='23505';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_markdown_proposal() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_markdown_proposal BEFORE INSERT OR UPDATE ON public.inventory_requests
FOR EACH ROW EXECUTE FUNCTION private.guard_markdown_proposal();
CREATE INDEX IF NOT EXISTS idx_inventory_pending_product_edit ON public.inventory_requests(country_code,site_id,product_id)
 WHERE change_type='edit' AND status='pending';
