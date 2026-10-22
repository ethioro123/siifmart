-- Manual one-time vendors are allowed for a single approved PO after independent
-- approval. They remain country-bound and cannot be reused for later POs.
CREATE OR REPLACE FUNCTION private.require_verified_supplier_for_po_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_supplier public.suppliers%ROWTYPE;
  v_is_one_time boolean;
BEGIN
  IF NEW.status <> 'Approved' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Lock the supplier row so two concurrent approvals cannot consume the same
  -- one-time supplier record at once.
  SELECT * INTO v_supplier
  FROM public.suppliers
  WHERE id = NEW.supplier_id
  FOR UPDATE;

  IF v_supplier.id IS NULL
     OR upper(coalesce(v_supplier.country_code, '')) IS DISTINCT FROM upper(coalesce(NEW.country_code, '')) THEN
    RAISE EXCEPTION 'Purchase order approval requires a supplier in the same country';
  END IF;

  v_is_one_time := lower(btrim(coalesce(v_supplier.type, ''))) = 'one-time';

  IF v_is_one_time THEN
    IF lower(btrim(coalesce(v_supplier.status, ''))) <> 'active'
       OR lower(btrim(coalesce(v_supplier.verification_status, ''))) NOT IN ('pending', 'verified') THEN
      RAISE EXCEPTION 'One-time external supplier must be active and pending or verified';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.purchase_orders prior_po
      WHERE prior_po.supplier_id = NEW.supplier_id
        AND prior_po.approved_at IS NOT NULL
        AND prior_po.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'One-time external supplier can only be used for one approved purchase order';
    END IF;
  ELSIF lower(btrim(coalesce(v_supplier.verification_status, ''))) <> 'verified' THEN
    RAISE EXCEPTION 'Purchase order approval requires a verified supplier in the same country';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.require_verified_supplier_for_po_approval()
  FROM PUBLIC, anon, authenticated;
