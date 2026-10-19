-- Fixture status belongs in badges/app metadata, not the operational quota enum.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                 WHERE name = 'staging_schema_snapshot_01') THEN
    RAISE EXCEPTION 'Staging-only fixture metadata cleanup';
  END IF;
END;
$$;
UPDATE public.employees SET quota_status = NULL
WHERE email LIKE '%@role-coverage.staging.siifmart.invalid'
  AND badges @> '["STAGING_TEST"]'::jsonb AND quota_status = 'STAGING_TEST';
COMMIT;
