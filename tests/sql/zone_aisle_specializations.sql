-- Read-only checks: no business rows changed.
DO $$
BEGIN
  ASSERT private.valid_aisle_specializations('{"01":"Fresh Produce","02":"Bulk Goods"}'::jsonb);
  ASSERT NOT private.valid_aisle_specializations('{"00":"Invalid"}'::jsonb);
  ASSERT NOT private.valid_aisle_specializations('{"100":"Invalid"}'::jsonb);
  ASSERT NOT private.valid_aisle_specializations('{"01":12}'::jsonb);
  ASSERT NOT private.valid_aisle_specializations('[]'::jsonb);
  ASSERT NOT private.valid_aisle_specializations(jsonb_build_object('01', repeat('x', 121)));
  ASSERT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.warehouse_zones'::regclass
      AND conname = 'warehouse_zones_aisle_specializations_valid' AND convalidated
  );
END $$;
