-- Preserve business evidence even when an executive or privileged API requests deletion.
BEGIN;
CREATE OR REPLACE FUNCTION private.reject_operational_record_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  RAISE EXCEPTION 'Permanent deletion of % records is prohibited; use the reviewed lifecycle workflow', TG_TABLE_NAME USING ERRCODE='42501';
END;
$$;
REVOKE ALL ON FUNCTION private.reject_operational_record_delete() FROM PUBLIC,anon,authenticated;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['employees','sites','purchase_orders','transfers'] LOOP
    EXECUTE format('REVOKE DELETE, TRUNCATE ON public.%I FROM anon, authenticated',target);
    EXECUTE format('CREATE TRIGGER protect_operational_record_history BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.reject_operational_record_delete()',target);
  END LOOP;
END;
$$;
COMMIT;
