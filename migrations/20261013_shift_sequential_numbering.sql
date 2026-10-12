-- ============================================================================
-- Migration: 20261013_shift_sequential_numbering.sql
-- Description: Enforce clean sequential human-readable shift numbers (SHF-0001, SHF-0002...)
--              Eliminates raw hex UUIDs in active shifts and shift logs.
-- ============================================================================

-- 1. Backfill existing shifts that had null or legacy shift_number
UPDATE shifts
SET shift_number = 'SHF-0001'
WHERE id = '90925cf0-26c9-4b98-a770-d19e8cc437f2';

UPDATE shifts
SET shift_number = 'SHF-0002'
WHERE id = '7be9746e-e6bf-4e58-bd89-2df39617b9e5';

UPDATE shifts
SET shift_number = 'SHF-0003'
WHERE id = 'cac6c414-56a8-4ede-86a7-7422e8984fc0';

-- 2. Sequence for automatic sequential numbering
CREATE SEQUENCE IF NOT EXISTS shift_number_seq START WITH 4;

-- 3. Automatic trigger function to assign clean SHF-XXXX format if omitted
CREATE OR REPLACE FUNCTION set_default_shift_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shift_number IS NULL OR NEW.shift_number = '' THEN
        NEW.shift_number := 'SHF-' || LPAD(nextval('shift_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Bind trigger before insert
DROP TRIGGER IF EXISTS trg_set_default_shift_number ON shifts;
CREATE TRIGGER trg_set_default_shift_number
BEFORE INSERT ON shifts
FOR EACH ROW
EXECUTE FUNCTION set_default_shift_number();
