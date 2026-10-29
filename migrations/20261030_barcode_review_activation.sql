BEGIN;
CREATE OR REPLACE FUNCTION public.guard_barcode_review_activation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE target_site uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_site_in_my_authorized_scope(NEW.site_id::text, NEW.country_code) THEN
    RAISE EXCEPTION 'Barcode scope denied';
  END IF;
  SELECT p.site_id INTO target_site FROM public.products p JOIN public.sites s ON s.id = p.site_id
    WHERE p.id = NEW.product_id AND upper(s.country) = upper(NEW.country_code) FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product country mismatch'; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' OR NEW.created_by <> auth.uid() THEN RAISE EXCEPTION 'Pending request required'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.barcode IS DISTINCT FROM OLD.barcode
    OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code
    OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN RAISE EXCEPTION 'Request identity is immutable'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT public.is_manager() OR OLD.created_by = auth.uid() THEN RAISE EXCEPTION 'Independent manager required'; END IF;
    IF NEW.status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
    NEW.reviewed_by := auth.uid(); NEW.reviewed_at := now();
    IF NEW.status = 'approved' THEN
      PERFORM pg_advisory_xact_lock(hashtext(NEW.country_code || ':' || NEW.barcode));
      IF EXISTS (SELECT 1 FROM public.products p JOIN public.sites s ON s.id=p.site_id
        WHERE upper(s.country)=upper(NEW.country_code) AND p.id<>NEW.product_id
        AND p.site_id=target_site AND (p.barcode=NEW.barcode OR NEW.barcode=ANY(p.barcodes))) THEN
        RAISE EXCEPTION 'Barcode already belongs to another product';
      END IF;
      UPDATE public.products SET barcode=coalesce(nullif(barcode,''),NEW.barcode),
        barcodes=ARRAY(SELECT DISTINCT unnest(coalesce(barcodes,ARRAY[]::text[]) || ARRAY[NEW.barcode])) WHERE id=NEW.product_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product update denied'; END IF;
    ELSIF OLD.status='approved' THEN
      UPDATE public.products SET barcodes=array_remove(barcodes,NEW.barcode),
        barcode=CASE WHEN barcode=NEW.barcode THEN NULL ELSE barcode END WHERE id=NEW.product_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product update denied'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_barcode_review_activation() FROM PUBLIC;
CREATE TRIGGER barcode_review_activation BEFORE INSERT OR UPDATE ON public.barcode_approvals
FOR EACH ROW EXECUTE FUNCTION public.guard_barcode_review_activation();
COMMIT;
