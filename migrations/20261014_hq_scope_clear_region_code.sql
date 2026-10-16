-- Migration: 20261014_hq_scope_clear_region_code.sql
-- Description: Disassociate regional codes from Corporate HQ personnel.
-- HQ leadership operates with nationwide authority, not territory-bound to a specific region.
-- Only Regional personnel (Regional Managers, Branch/Store/Warehouse staff) hold territory region_code.

UPDATE public.employees
SET region_code = NULL,
    updated_at = NOW()
WHERE scope_level = 'HQ';
