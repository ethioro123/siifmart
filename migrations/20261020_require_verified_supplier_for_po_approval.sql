CREATE FUNCTION private.require_verified_supplier_for_po_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM NEW.status
     AND NOT EXISTS (
       SELECT 1 FROM public.suppliers supplier
       WHERE supplier.id = NEW.supplier_id
         AND upper(supplier.country_code) = upper(NEW.country_code)
         AND supplier.verification_status = 'verified'
     ) THEN
    RAISE EXCEPTION 'Purchase order approval requires a verified supplier in the same country';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.require_verified_supplier_for_po_approval()
  FROM PUBLIC, anon, authenticated;
CREATE TRIGGER require_verified_supplier_for_po_approval
BEFORE UPDATE ON public.purchase_orders FOR EACH ROW
EXECUTE FUNCTION private.require_verified_supplier_for_po_approval();
