-- Migration: 20261104_grant_strip_transfer_quantities.sql
-- Description: Grant execute permission on private.strip_transfer_quantities to authenticated
--              so that blind_receiving_wms and blind_receiving_transfers views execute without error 42501.

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.strip_transfer_quantities(jsonb) TO authenticated;
