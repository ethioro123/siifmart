-- Validator checks are read-only and do not alter business configuration.
DO $$
BEGIN
  ASSERT private.valid_zone_category_assignments(ARRAY['Fruit & Vegetables','Baby'], '{"01":["Fruit & Vegetables"],"20":["Baby"]}');
  ASSERT private.valid_zone_category_assignments('{}', '{}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY['Baby'], '{"01":["Other"]}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY['Baby'], '{"00":["Baby"]}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY['Baby'], '{"100":["Baby"]}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY['Baby'], '{"01":"Baby"}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY['Baby'], '{"01":[1]}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY[''], '{}');
  ASSERT NOT private.valid_zone_category_assignments(ARRAY[repeat('x',121)], '{}');
  ASSERT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid='public.warehouse_zones'::regclass AND conname='warehouse_zones_category_assignments_valid' AND convalidated);
END $$;
