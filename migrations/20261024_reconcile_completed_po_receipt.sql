-- Reconcile only the reported staging PO, from its existing stock movement evidence.
DO $$
DECLARE j public.wms_jobs%ROWTYPE; old_sub text; old_claims text; result jsonb;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id='a611549b-6523-492c-b68b-066e45b09563'
  AND order_ref='73eb2d25-e909-45dd-8fd4-c157f973a6fa' AND site_id='a1111111-1111-4000-8000-000000000001'
  AND country_code='ET' AND type='PUTAWAY' AND status='Completed' AND completed_by=assigned_to;
 IF j.id IS NULL THEN RETURN; END IF;
 old_sub:=current_setting('request.jwt.claim.sub',true); old_claims:=current_setting('request.jwt.claims',true);
 PERFORM set_config('request.jwt.claim.sub',j.completed_by,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',j.completed_by,'role','authenticated')::text,true);
 result:=public.finalize_po_from_putaway(j.id);
 IF result->>'state'<>'synced' THEN RAISE EXCEPTION 'Reported PO requires review; no receipt repair was committed'; END IF;
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);
END $$;
