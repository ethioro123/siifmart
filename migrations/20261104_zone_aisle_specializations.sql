-- Optional descriptive metadata, deliberately independent of location codes and routing.
CREATE OR REPLACE FUNCTION private.valid_aisle_specializations(value jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE entry record;
BEGIN
  IF jsonb_typeof(value) <> 'object' THEN RETURN false; END IF;
  FOR entry IN SELECT key, val FROM jsonb_each(value) AS pairs(key, val) LOOP
    IF entry.key !~ '^(0[1-9]|[1-9][0-9])$'
      OR jsonb_typeof(entry.val) <> 'string'
      OR char_length(entry.val #>> '{}') > 120 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION private.valid_aisle_specializations(jsonb) TO authenticated, service_role;
ALTER TABLE public.warehouse_zones
  ADD COLUMN specialization varchar(120),
  ADD COLUMN aisle_specializations jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT warehouse_zones_aisle_specializations_valid
    CHECK (private.valid_aisle_specializations(aisle_specializations));
COMMENT ON COLUMN public.warehouse_zones.specialization IS 'Optional management description; never part of location codes or routing.';
COMMENT ON COLUMN public.warehouse_zones.aisle_specializations IS 'Optional descriptions keyed by aisle 01-99 within this zone; never part of location codes or routing.';
