ALTER TABLE public.wms_jobs
    ADD COLUMN IF NOT EXISTS pack_security_seal_serial text;

CREATE OR REPLACE FUNCTION public.guard_pack_completion_attestation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_requires_seal boolean := true;
    v_item jsonb;
    v_expected numeric;
    v_packed numeric;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'Completed' THEN
        IF NEW.pack_security_seal_serial IS DISTINCT FROM OLD.pack_security_seal_serial
           OR NEW.line_items IS DISTINCT FROM OLD.line_items THEN
            RAISE EXCEPTION 'Completed PACK verification is immutable';
        END IF;
        RETURN NEW;
    END IF;

    IF upper(coalesce(NEW.type, '')) <> 'PACK' OR upper(coalesce(NEW.status, '')) <> 'COMPLETED' THEN
        RETURN NEW;
    END IF;

    SELECT coalesce(
        nullif(c.country_configs->upper(NEW.country_code)->>'requirePackSecuritySeal', '')::boolean,
        c.require_pack_security_seal,
        true
    ) INTO v_requires_seal
      FROM public.system_config c
     WHERE c.id = '00000000-0000-0000-0000-000000000001';
    v_requires_seal := coalesce(v_requires_seal, true);

    IF v_requires_seal AND nullif(btrim(NEW.pack_security_seal_serial), '') IS NULL THEN
        RAISE EXCEPTION 'A security seal serial is required to complete this PACK job';
    END IF;
    IF jsonb_typeof(coalesce(NEW.line_items, '[]'::jsonb)) <> 'array'
       OR jsonb_array_length(coalesce(NEW.line_items, '[]'::jsonb)) = 0 THEN
        RAISE EXCEPTION 'PACK job must contain verified line items';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(coalesce(NEW.line_items, '[]'::jsonb)) LOOP
        v_expected := coalesce(nullif(v_item->>'expectedQty', '')::numeric,
                               nullif(v_item->>'expected_qty', '')::numeric, 0);
        v_packed := coalesce(nullif(v_item->>'packedQty', '')::numeric,
                             nullif(v_item->>'packed_qty', '')::numeric, 0);
        IF v_expected <= 0 OR abs(v_expected - v_packed) > 0.001 THEN
            RAISE EXCEPTION 'Every PACK line must have its full physical quantity recorded before completion';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_pack_completion_attestation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_pack_completion_attestation ON public.wms_jobs;
CREATE TRIGGER trg_guard_pack_completion_attestation
    BEFORE INSERT OR UPDATE ON public.wms_jobs
    FOR EACH ROW EXECUTE FUNCTION public.guard_pack_completion_attestation();
