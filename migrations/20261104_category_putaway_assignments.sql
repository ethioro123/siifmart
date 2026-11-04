-- Structured routing metadata. Existing specialization descriptions remain display-only.
CREATE OR REPLACE FUNCTION private.valid_zone_category_assignments(categories text[], aisles jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE entry record; category jsonb;
BEGIN
  IF categories IS NULL OR aisles IS NULL OR jsonb_typeof(aisles) <> 'object'
    OR cardinality(categories) > 200 THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM unnest(categories) AS c
    WHERE c IS NULL OR btrim(c) = '' OR char_length(c) > 120) THEN RETURN false; END IF;
  FOR entry IN SELECT key, value FROM jsonb_each(aisles) LOOP
    IF entry.key !~ '^(0[1-9]|[1-9][0-9])$' OR jsonb_typeof(entry.value) <> 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(entry.value) > 200 THEN RETURN false; END IF;
    FOR category IN SELECT value FROM jsonb_array_elements(entry.value) LOOP
      IF jsonb_typeof(category) <> 'string' OR NOT ((category #>> '{}') = ANY(categories)) THEN RETURN false; END IF;
    END LOOP;
  END LOOP;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION private.valid_zone_category_assignments(text[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.valid_zone_category_assignments(text[], jsonb) TO authenticated, service_role;
ALTER TABLE public.warehouse_zones
  ADD COLUMN accepted_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN aisle_categories jsonb NOT NULL DEFAULT '{}',
  ADD CONSTRAINT warehouse_zones_category_assignments_valid
    CHECK (private.valid_zone_category_assignments(accepted_categories, aisle_categories));
COMMENT ON COLUMN public.warehouse_zones.accepted_categories IS 'Controlled catalog categories accepted for advisory putaway. Empty retains legacy storage/mapping behavior.';
COMMENT ON COLUMN public.warehouse_zones.aisle_categories IS 'Category assignments for aisles 01-99 within this zone; categories must belong to accepted_categories.';
