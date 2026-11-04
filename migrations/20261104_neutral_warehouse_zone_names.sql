-- Rename only known seeded defaults; retain identity, stock, permissions and storage rules.
-- Each row stays attached to its original site/country. Custom names are untouched.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.warehouse_zones source
    JOIN (VALUES
    ('Zone A (Receiving Dock)', 'Zone A'),
    ('Zone B (Bulk Storage)', 'Zone B'),
    ('Zone C (Fast Pick)', 'Zone C'),
    ('Zone D (Dry Shelves)', 'Zone D'),
    ('Zone E (Chilled 4°C)', 'Zone E'),
    ('Zone F (Freezer -18°C)', 'Zone F'),
    ('Zone G (Secure Vault)', 'Zone G'),
    ('Zone H (Quarantine QA)', 'Zone H'),
    ('Zone I (Packing & Stage)', 'Zone I'),
    ('Zone J (Outbound Dock)', 'Zone J'),
    ('Zone A (Unloading Dock)', 'Zone A'),
    ('Zone B (Cross-Dock Stage)', 'Zone B'),
    ('Zone C (Bulk Storage)', 'Zone C'),
    ('Zone D (Cold Staging)', 'Zone D'),
    ('Zone E (Outbound Dock)', 'Zone E')
    ) AS mapping(old_name, new_name) ON source.name = mapping.old_name
    JOIN public.warehouse_zones target
      ON target.site_id = source.site_id AND target.name = mapping.new_name AND target.id <> source.id
  ) THEN
    RAISE EXCEPTION 'A target zone name already exists at the same facility; resolve the name conflict first';
  END IF;
END $$;

UPDATE public.warehouse_zones AS zone
SET name = mapping.new_name
FROM (VALUES
    ('Zone A (Receiving Dock)', 'Zone A'),
    ('Zone B (Bulk Storage)', 'Zone B'),
    ('Zone C (Fast Pick)', 'Zone C'),
    ('Zone D (Dry Shelves)', 'Zone D'),
    ('Zone E (Chilled 4°C)', 'Zone E'),
    ('Zone F (Freezer -18°C)', 'Zone F'),
    ('Zone G (Secure Vault)', 'Zone G'),
    ('Zone H (Quarantine QA)', 'Zone H'),
    ('Zone I (Packing & Stage)', 'Zone I'),
    ('Zone J (Outbound Dock)', 'Zone J'),
    ('Zone A (Unloading Dock)', 'Zone A'),
    ('Zone B (Cross-Dock Stage)', 'Zone B'),
    ('Zone C (Bulk Storage)', 'Zone C'),
    ('Zone D (Cold Staging)', 'Zone D'),
    ('Zone E (Outbound Dock)', 'Zone E')
) AS mapping(old_name, new_name)
WHERE zone.name = mapping.old_name;
