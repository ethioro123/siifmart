-- Rename site type from HQ to Administration
-- 1. Drop existing check constraint
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_type_check;

-- 2. Add new constraint including 'Administration' and removing 'HQ' (optional, or keep for safety momentarily)
-- Valid types: Store, Warehouse, Distribution Center, Dark Store, Administration
ALTER TABLE sites ADD CONSTRAINT sites_type_check 
  CHECK (type IN ('Store', 'Warehouse', 'Distribution Center', 'Dark Store', 'Administration', 'Administrative'));

-- 3. Update existing data (alternatively can be done via the script, but SQL is faster)
UPDATE sites SET type = 'Administration' WHERE type = 'HQ' OR type = 'Administrative';
UPDATE sites SET name = 'Central Operations' WHERE name = 'SIIFMART HQ' OR name = 'HQ';
