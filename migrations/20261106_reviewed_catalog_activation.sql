CREATE FUNCTION private.guard_reviewed_catalog_activation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF NEW.approval_status='approved' AND OLD.approval_status IS DISTINCT FROM NEW.approval_status
 AND NOT private.product_edit_decision_matches(OLD.id,OLD.site_id)
 AND coalesce(current_setting('app.price_change_decision_id',true),'')=''
 AND coalesce(current_setting('app.merchandising_decision_id',true),'')='' THEN
 RAISE EXCEPTION 'Catalog activation requires a reviewed commercial decision' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_reviewed_catalog_activation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_reviewed_catalog_activation BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION private.guard_reviewed_catalog_activation();
